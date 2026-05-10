import { create } from "zustand";
import API from "../api/axios";
import log from "../utils/logger";
import dialog from "../utils/dialogService";
import { useAuthStore } from "./authStore";

/* ---------------------------------------------------------------
 * DEFAULT MODELS (fallback when DB has none configured)
 * Matches backend promptBuilder.js model personality shaping:
 * nexusone, chatgpt, gemini, claude, deepseek
 * --------------------------------------------------------------- */
const DEFAULT_MODELS = [
  { id: "nexusone",  name: "NexusAI"  },
  { id: "chatgpt",   name: "ChatGPT"  },
  { id: "gemini",    name: "Gemini"   },
  { id: "claude",    name: "Claude"   },
  { id: "deepseek",  name: "DeepSeek" },
];

/* ---------------------------------------------------------------
 * PLAN LIMITS (mirrors backend utils/userAccessPolicy.js)
 * These are used for optimistic UI checks only.
 * The backend enforces the real limits — these just prevent
 * unnecessary API calls and show correct UI feedback.
 * --------------------------------------------------------------- */
const PLAN_LIMITS = {
  Trial: { dailyNewChatLimit: 10, conversationMessageLimit: 50 },
  Free:  { dailyNewChatLimit: 10, conversationMessageLimit: 10 },
  Pro:   { dailyNewChatLimit: 20, conversationMessageLimit: 50 },
  Super: { dailyNewChatLimit: 50, conversationMessageLimit: 100 },
};

const MODEL_SELECTION_LIMITS = {
  Free:  1,
  Pro:   3,
  Trial: Infinity,
  Super: Infinity,
};

const normalizeModelId = (id) => String(id || "").toLowerCase();
const CLIENT_TYPING_MS_PER_CHAR = 20;

export const useChatStore = create((set, get) => ({
  /* ── STATE ─────────────────────────────────────────────────── */
  messages: [],
  history: [],
  conversationId: null,
  deletedConversationIds: new Set(),

  currentModule: "study",

  models: [],        // [{ id, name }] — loaded from /admin/system/models
  activeModels: [],  // currently selected model IDs

  loading: false,
  assistantTyping: false,
  activeGenerationId: null,
  isTerminating: false,
  historyLoading: false,
  sidebarOpen: true,

  setAssistantTyping: (value) => set({ assistantTyping: Boolean(value) }),

  /* ── PLAN HELPERS ──────────────────────────────────────────── */

  getPlanLimits: () => {
    const { subscription } = useAuthStore.getState();
    return PLAN_LIMITS[subscription] || PLAN_LIMITS.Free;
  },

  getModelSelectionLimit: () => {
    const { subscription } = useAuthStore.getState();
    return MODEL_SELECTION_LIMITS[subscription] ?? 1;
  },

  /* ── PERMISSIONS ───────────────────────────────────────────── */

  canSendMessage: () => {
    const { messages, conversationId } = get();
    const { subscription, user } = useAuthStore.getState();
    const limits = PLAN_LIMITS[subscription] || PLAN_LIMITS.Free;

    // Daily new chat limit
    if (!conversationId) {
      const dailyChats = user?.dailyChatCount || 0;
      if (dailyChats >= limits.dailyNewChatLimit) {
        log("INFO", "Daily new chat limit reached", { subscription, dailyChats, limit: limits.dailyNewChatLimit });
        return false;
      }
    }

    // Per-conversation message limit (optimistic check)
    const userMessages = messages.filter(m => m.role === "user").length;
    if (conversationId && userMessages >= limits.conversationMessageLimit) {
      log("INFO", "Conversation message limit reached", { subscription, userMessages, limit: limits.conversationMessageLimit });
      return false;
    }

    return true;
  },

  /* ── MODELS ────────────────────────────────────────────────── */

  loadModels: async () => {
    try {
      const res = await API.get("/admin/system/models");
      const raw = Array.isArray(res.data) ? res.data : [];

      // Fall back to hardcoded defaults if DB has no models configured
      const source = raw.length > 0 ? raw : DEFAULT_MODELS;

      const normalized = source.map(m => ({
        ...m,
        id: normalizeModelId(m.id),
      }));

      log("INFO", "Models loaded", normalized);

      // Respect plan model selection limit on initial load.
      // If a conversation is already active, preserve the locked model selection.
      const { subscription } = useAuthStore.getState();
      const limit = MODEL_SELECTION_LIMITS[subscription] ?? 1;
      const defaultActiveModels = Number.isFinite(limit)
        ? normalized.slice(0, limit).map(m => m.id)
        : normalized.map(m => m.id);
      const { conversationId, activeModels: currentActiveModels } = get();
      const normalizedIds = new Set(normalized.map((m) => m.id));
      const preservedLockedModels = (currentActiveModels || []).filter((id) => normalizedIds.has(id));

      set({
        models: normalized,
        activeModels:
          conversationId && preservedLockedModels.length > 0
            ? preservedLockedModels
            : defaultActiveModels,
      });
    } catch (err) {
      log("ERROR", "Failed to load models — using defaults", err);
      // Always fall back so the app is usable
      const normalized = DEFAULT_MODELS.map(m => ({ ...m, id: normalizeModelId(m.id) }));
      const { subscription } = useAuthStore.getState();
      const limit = MODEL_SELECTION_LIMITS[subscription] ?? 1;
      const defaultActiveModels = Number.isFinite(limit)
        ? normalized.slice(0, limit).map(m => m.id)
        : normalized.map(m => m.id);
      const { conversationId, activeModels: currentActiveModels } = get();
      const normalizedIds = new Set(normalized.map((m) => m.id));
      const preservedLockedModels = (currentActiveModels || []).filter((id) => normalizedIds.has(id));

      set({
        models: normalized,
        activeModels:
          conversationId && preservedLockedModels.length > 0
            ? preservedLockedModels
            : defaultActiveModels,
      });
    }
  },

  selectModel: (id) => {
    const { conversationId } = get();
    const { subscription } = useAuthStore.getState();

    if (subscription === "Free" && conversationId) {
      log("WARN", "Model selection is locked for this Free-plan conversation");
      return;
    }

    log("INFO", "Switching to single model", id);
    set({ activeModels: [normalizeModelId(id)] });
  },

  toggleModel: (id) => {
    const { conversationId, activeModels, models } = get();
    const { subscription } = useAuthStore.getState();
    const normalizedId = normalizeModelId(id);
    const limit = MODEL_SELECTION_LIMITS[subscription] ?? 1;

    if (subscription === "Free" && conversationId) {
      log("WARN", "Model selection is locked for this Free-plan conversation");
      return;
    }

    const isActive = activeModels.includes(normalizedId);

    if (isActive) {
      // Don't allow deselecting the last model
      if (activeModels.length <= 1) {
        log("WARN", "Cannot deselect the last active model");
        return;
      }
      log("INFO", "Deselecting model", normalizedId);
      set({ activeModels: activeModels.filter(m => m !== normalizedId) });
    } else {
      // Check limit before adding
      if (Number.isFinite(limit) && activeModels.length >= limit) {
        log("WARN", "Model selection limit reached", { limit, subscription });
        return;
      }
      log("INFO", "Selecting model", normalizedId);
      set({ activeModels: [...activeModels, normalizedId] });
    }
  },

  resetModels: () => {
    const { conversationId } = get();
    const { subscription } = useAuthStore.getState();

    if (subscription === "Free" && conversationId) {
      log("WARN", "Model reset is locked for this Free-plan conversation");
      return;
    }

    // Reset to all models but respect plan limit
    const { models } = get();
    const limit = MODEL_SELECTION_LIMITS[subscription] ?? 1;
    const activeModels = Number.isFinite(limit)
      ? models.slice(0, limit).map(m => m.id)
      : models.map(m => m.id);
    log("INFO", "Resetting models", { subscription, limit, count: activeModels.length });
    set({ activeModels });
  },

  /* ── MODULE ────────────────────────────────────────────────── */

  setModule: (module) => {
    // Mode is locked once a conversation starts — only allow change on new chat
    const { conversationId } = get();
    if (conversationId) {
      log("WARN", "Cannot change mode mid-conversation — mode is locked");
      return;
    }
    log("INFO", "Module changed", module);
    set({ currentModule: module });
  },

  /* ── MESSAGE FLOW ──────────────────────────────────────────── */

  sendMessage: async (input) => {
    const { currentModule, conversationId, activeModels, canSendMessage } = get();
    const selectedModelsAtSend = [...(activeModels || [])];

    if (!canSendMessage()) {
      const { subscription } = useAuthStore.getState();
      const limits = PLAN_LIMITS[subscription] || PLAN_LIMITS.Free;
      await dialog.alert(
        `You've reached your ${subscription} plan limit.\n` +
        `Daily chats: ${limits.dailyNewChatLimit} | Messages per chat: ${limits.conversationMessageLimit}`
      );
      return;
    }

    if (!activeModels.length) {
      await dialog.alert("No AI models available. Please contact support.");
      return;
    }

    set((state) => ({
      messages: [...state.messages, { role: "user", content: input, timestamp: new Date() }],
      loading: true,
      assistantTyping: false,
      isTerminating: false,
    }));

    const generationId = (typeof crypto !== "undefined" && crypto.randomUUID)
      ? crypto.randomUUID()
      : `gen_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    set({ activeGenerationId: generationId });

    try {
      const res = await API.post("/smartmix/process", {
        input,
        type: currentModule,
        conversationId,
        activeModels: selectedModelsAtSend,
        generationId,
      });

      const outputsRaw = res.data?.outputs || {};
      const newConversationId = res.data?.conversationId || conversationId;

      // Optimistic history insert on new chat
      set((state) => {
        if (!newConversationId) return {};
        const exists = state.history.some(h => (h._id || h.id) === newConversationId);
        if (exists) return {};
        return {
          history: [
            { _id: newConversationId, title: input.slice(0, 40) || "New Conversation", moduleType: currentModule },
            ...state.history,
          ],
        };
      });

      // Normalize outputs
      const outputs = Object.fromEntries(
        Object.entries(outputsRaw).map(([k, v]) => [
          normalizeModelId(k),
          typeof v === "string" ? { text: v } : v,
        ])
      );

      const first = Object.values(outputs)[0];
      const content = first?.text || "No response";

      set((state) => ({
        // Freeze animate on all previous messages so they never re-type
        messages: [
          ...state.messages.map(m =>
            m.role === "assistant" && m.animate ? { ...m, animate: false } : m
          ),
          {
            role: "assistant",
            content,
            individualOutputs: outputs,
            timestamp: new Date(),
            animate: true,
            wasTerminated: Boolean(res.data?.terminated),
          },
        ],
        conversationId: newConversationId,
        // Keep model selection locked to the models used at send-time.
        activeModels: selectedModelsAtSend,
        loading: false,
        assistantTyping: true,
        activeGenerationId: null,
        isTerminating: false,
      }));

      // Increment daily counters in auth store for all plans
      const auth = useAuthStore.getState();
      if (!conversationId) {
        // New chat — increment dailyChatCount
        auth.incrementChatCount?.();
      }
      auth.incrementQueryCount?.();

    } catch (err) {
      log("ERROR", "Send message failed", err);
      // Show backend error message if available
      const msg = err?.response?.data?.msg || err?.response?.data?.message;
      const hasDefinitiveServerFailure = Boolean(err?.response);
      set((state) => {
        const nextMessages = [...state.messages];
        const last = nextMessages[nextMessages.length - 1];

        // Roll back optimistic user message only when server explicitly failed the request.
        if (hasDefinitiveServerFailure && last?.role === "user" && last?.content === input) {
          nextMessages.pop();
        }

        const fallbackModelId = normalizeModelId(activeModels?.[0] || "nexusone");
        const fallbackText = `⚠️ ${msg || "Request failed before output could be confirmed. Please try again."}`;

        return {
          messages: [
            ...nextMessages,
            {
              role: "assistant",
              content: fallbackText,
              // Keep a visible output card so users don't see an empty/"reset" chat area.
              individualOutputs: {
                [fallbackModelId]: { text: fallbackText },
              },
              timestamp: new Date(),
              animate: false,
            },
          ],
          loading: false,
          assistantTyping: false,
          activeGenerationId: null,
          isTerminating: false,
        };
      });
    }
  },

  terminateCurrentGeneration: async () => {
    const { activeGenerationId, loading } = get();
    if (!loading || !activeGenerationId) return;

    set({ isTerminating: true });

    try {
      await API.post("/smartmix/terminate", {
        generationId: activeGenerationId,
      });
    } catch (err) {
      log("ERROR", "Terminate request failed", err);
    } finally {
      set({ isTerminating: false });
    }
  },

  stopTypingAndPersistPartial: async () => {
    const { assistantTyping, messages, conversationId } = get();
    if (!assistantTyping) return;

    let targetIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i]?.role === "assistant") {
        targetIndex = i;
        break;
      }
    }

    if (targetIndex < 0) {
      set({ assistantTyping: false });
      return;
    }

    const assistantMsg = messages[targetIndex] || {};
    const outputs = assistantMsg.individualOutputs || {};
    const elapsedMs = Math.max(0, Date.now() - new Date(assistantMsg.timestamp || Date.now()).getTime());
    const visibleChars = Math.floor(elapsedMs / CLIENT_TYPING_MS_PER_CHAR);

    const truncateText = (text) => {
      const str = String(text || "");
      if (!str.length) return "";
      const n = Math.min(str.length, Math.max(1, visibleChars));
      return str.slice(0, n);
    };

    const truncatedOutputs = Object.fromEntries(
      Object.entries(outputs).map(([modelId, value]) => {
        if (typeof value === "string") {
          return [modelId, truncateText(value)];
        }
        const next = {
          ...(value || {}),
          text: truncateText(value?.text),
        };
        return [modelId, next];
      })
    );

    const firstOutput = Object.values(truncatedOutputs)[0];
    const truncatedContent = typeof firstOutput === "string"
      ? firstOutput
      : (firstOutput?.text || truncateText(assistantMsg.content));

    set((state) => {
      const nextMessages = [...state.messages];
      if (nextMessages[targetIndex]) {
        nextMessages[targetIndex] = {
          ...nextMessages[targetIndex],
          content: truncatedContent,
          individualOutputs: truncatedOutputs,
          animate: false,
          wasTerminated: true,
        };
      }

      return {
        messages: nextMessages,
        assistantTyping: false,
      };
    });

    if (!conversationId) return;

    try {
      await API.post("/smartmix/persist-partial", {
        conversationId,
        content: truncatedContent,
        individualOutputs: truncatedOutputs,
      });
    } catch (err) {
      log("ERROR", "Persist partial output failed", err);
    }
  },

  /* ── HISTORY ───────────────────────────────────────────────── */

  fetchHistory: async () => {
    set({ historyLoading: true });
    try {
      const res = await API.get("/auth/getHistory");
      const serverHistory = res.data?.history || [];
      const deleted = get().deletedConversationIds;
      set({
        history: serverHistory.filter(h => !deleted.has(h._id || h.id)),
      });
    } catch (err) {
      log("ERROR", "Fetch history failed", err);
    } finally {
      set({ historyLoading: false });
    }
  },

  loadChat: async (id) => {
    set({ loading: true, conversationId: id, sidebarOpen: false });
    try {
      const res = await API.get(`/smartmix/history/${id}`);
      const convo = res.data?.conversation;

      // Lock active models to the conversation's allowedModels
      const allowedModels = convo?.allowedModels?.length
        ? convo.allowedModels.map(normalizeModelId)
        : get().models.map(m => m.id);

      set({
        messages: (convo?.messages || []).map(m => ({ ...m, animate: false })),
        currentModule: convo?.moduleType || "study",
        activeModels: allowedModels,
        assistantTyping: false,
      });
    } catch (err) {
      log("ERROR", "Load chat failed", err);
    } finally {
      set({ loading: false });
    }
  },

  deleteConversation: async (id) => {
    try {
      set((state) => {
        const deleted = new Set(state.deletedConversationIds);
        deleted.add(id);
        return {
          deletedConversationIds: deleted,
          history: state.history.filter(h => (h._id || h.id) !== id),
        };
      });
      await API.delete(`/smartmix/history/${id}`);
      if (get().conversationId === id) get().startNewChat();
    } catch (err) {
      log("ERROR", "Delete conversation failed", err);
    }
  },

  clearAllHistory: async () => {
    try {
      log("WARN", "Clearing all history");
      await API.delete("/auth/history/clear");
      set({
        history: [],
        messages: [],
        conversationId: null,
        deletedConversationIds: new Set(),
        currentModule: "study",
        activeModels: get().models.map(m => m.id),
        assistantTyping: false,
      });
    } catch (err) {
      log("ERROR", "Clear all history failed", err);
    }
  },

  resetChatStore: () => {
    set({
      messages: [],
      history: [],
      conversationId: null,
      deletedConversationIds: new Set(),
      currentModule: "study",
      activeModels: [],
      loading: false,
      assistantTyping: false,
      activeGenerationId: null,
      isTerminating: false,
      historyLoading: false,
      sidebarOpen: true,
    });
  },

  startNewChat: () => {
    log("INFO", "Starting new chat");
    // Reset models to plan-appropriate selection
    const { models } = get();
    const { subscription } = useAuthStore.getState();
    const limit = MODEL_SELECTION_LIMITS[subscription] ?? 1;
    const activeModels = Number.isFinite(limit)
      ? models.slice(0, limit).map(m => m.id)
      : models.map(m => m.id);
    set({
      messages: [],
      conversationId: null,
      currentModule: "study",
      activeModels,
      assistantTyping: false,
    });
  },

  /* ── UI ────────────────────────────────────────────────────── */

  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
}));
