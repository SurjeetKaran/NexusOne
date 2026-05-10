

import React, { useEffect, useRef, useState } from "react";
import { useChatStore } from "../../store/chatStore";
import { useAuthStore } from "../../store/authStore";
import { motion, AnimatePresence } from "framer-motion";
import {
  SparklesIcon,
  BoltIcon,
  CubeTransparentIcon,
} from "@heroicons/react/24/solid";
import log from "../../utils/logger";
import MarkdownRenderer from "../shared/MarkdownRenderer";

/* =====================================================
 * DEFAULT PROMPTS (UNCHANGED UX)
 * ===================================================== */
const DEFAULT_PROMPTS = [
  {
    label: "study",
    title: "Learn faster",
    text: "Explain quantum physics like I'm 10 years old.",
    icon: "🎓",
  },
  {
    label: "content",
    title: "Write a post",
    text: "Write a viral LinkedIn post about AI trends.",
    icon: "✍️",
  },
  {
    label: "career",
    title: "Plan my career",
    text: "I'm a fresh graduate in computer science. What career paths should I explore and how do I get started?",
    icon: "💼",
  },
  {
    label: "study",
    title: "Quick summary",
    text: "Summarize the history of the Roman Empire.",
    icon: "🏛️",
  },
];

/* =====================================================
 * MODEL ICON (BASED ON MODEL NAME, NOT ID)
 * ===================================================== */
const iconForModelName = (name = "") => {
  const n = name.toLowerCase();
  if (n.includes("nexus") || n.includes("nexusai")) return <SparklesIcon className="w-5 h-5 text-electric-400" />;
  if (n.includes("gpt") || n.includes("chatgpt"))   return <BoltIcon className="w-5 h-5 text-green-400" />;
  if (n.includes("gemini"))                          return <SparklesIcon className="w-5 h-5 text-blue-400" />;
  if (n.includes("claude"))                          return <CubeTransparentIcon className="w-5 h-5 text-orange-400" />;
  if (n.includes("deepseek"))                        return <BoltIcon className="w-5 h-5 text-purple-400" />;
  return <SparklesIcon className="w-5 h-5 text-gray-400" />;
};

/* =====================================================
 * ANIMATED MARKDOWN (WITH TYPING EFFECT)
 * ===================================================== */
const AnimatedMarkdown = ({ text = "", animate }) => {
  // Capture the animate flag at mount time only — never re-animate on re-render
  const shouldAnimate = useRef(animate);
  const [displayed, setDisplayed] = useState(shouldAnimate.current ? "" : text);

  useEffect(() => {
    if (!shouldAnimate.current) {
      setDisplayed(text);
      return;
    }

    let i = 0;
    const id = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(id);
    }, 20);

    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]); // text dep only — animate flag is frozen via ref

  return <MarkdownRenderer content={displayed} />;
};

/* =====================================================
 * MOBILE TABBED CARD — one card, model tabs at top
 * ===================================================== */
const MobileTabbedCard = ({ visibleOutputs, getModelName, iconForModelName, extractText, isMulti, selectModel, animate, assistantTyping }) => {
  const [activeTab, setActiveTab] = useState(visibleOutputs[0]?.[0] ?? "");

  useEffect(() => {
    if (!visibleOutputs.find(([id]) => id === activeTab)) {
      setActiveTab(visibleOutputs[0]?.[0] ?? "");
    }
  }, [visibleOutputs, activeTab]);

  const activeOutput = visibleOutputs.find(([id]) => id === activeTab);
  const activeValue = activeOutput?.[1];
  const scrollTabs = visibleOutputs.length >= 5;
  const activeIndex = visibleOutputs.findIndex(([id]) => id === activeTab);
  const tabWidthPct = 100 / visibleOutputs.length;

  return (
    <div className="bg-n700/60 border border-line rounded-2xl overflow-hidden">
      {/* TAB BAR */}
      <div className={`relative flex bg-n800/90 ${scrollTabs ? "overflow-x-auto thin-scrollbar-x" : ""}`}>

        {/* Sliding indicator — only for non-scroll layout */}
        {!scrollTabs && activeIndex >= 0 && (
          <motion.div
            className="absolute bottom-0 h-[2px] bg-electric-400 rounded-full"
            style={{ width: `${tabWidthPct}%` }}
            animate={{ x: `${activeIndex * 100}%` }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          />
        )}

        {visibleOutputs.map(([id]) => {
          const name = getModelName(id);
          const isActive = id === activeTab;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center justify-center gap-1.5 px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors duration-200
                ${scrollTabs ? "shrink-0 border-b-2 border-transparent" : "flex-1"}
                ${isActive
                  ? scrollTabs ? "border-b-2 border-electric-400 text-white" : "text-white"
                  : "text-gray-500 hover:text-gray-300"}
              `}
            >
              {iconForModelName(name)}
              <span>{name}</span>
            </button>
          );
        })}

        {/* Bottom border line under entire tab bar */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-line/80" />
      </div>

      {/* ACTIVE MODEL OUTPUT */}
      <div className="p-4 text-sm text-text-mid">
        {activeValue !== undefined ? (
          <AnimatedMarkdown
            text={extractText(activeValue)}
            animate={animate && assistantTyping}
          />
        ) : (
          <span className="text-gray-500">No response</span>
        )}
      </div>
    </div>
  );
};

/* =====================================================
 * MAIN COMPONENT
 * ===================================================== */
export default function ChatWindow() {
  const {
    messages,
    loading,
    assistantTyping,
    setAssistantTyping,
    activeModels,
    models,
    conversationId,
    selectModel,
    setModule,
    sendMessage,
  } = useChatStore();
  const { subscription, user } = useAuthStore();

  const scrollRef = useRef(null);
  /* ---------------- AUTO SCROLL ---------------- */
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!assistantTyping) return;

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== "assistant" || !lastMessage.animate) {
      setAssistantTyping(false);
      return;
    }

    const outputs = lastMessage.individualOutputs || {};
    const outputLengths = Object.values(outputs).map((v) => extractText(v).length);
    const maxLen = outputLengths.length ? Math.max(...outputLengths) : (lastMessage.content || "").length;

    // Match AnimatedMarkdown speed (20ms per char) with sane bounds.
    const estimatedMs = Math.min(Math.max(maxLen * 20 + 200, 600), 20000);
    const timer = setTimeout(() => setAssistantTyping(false), estimatedMs);

    return () => clearTimeout(timer);
  }, [assistantTyping, messages, setAssistantTyping]);

  /* ---------------- UI FLAGS ---------------- */
  const lastMessage = messages[messages.length - 1];
  const showLoader = loading;
  const showPrompts = messages.length === 0 && !conversationId;
  const planLimitMap = { Trial: 10, Free: 10, Pro: 20, Super: 50 };
  const dailyChatLimit = planLimitMap[subscription] || 10;
  const dailyChatsUsed = user?.dailyChatCount || 0;
  const isDailyChatLimitReached = dailyChatsUsed >= dailyChatLimit;

  /* ---------------- HELPERS ---------------- */

  const getModelName = (id) =>
    models.find((m) => m.id === id)?.name || id;

  const extractText = (value) =>
    typeof value === "string" ? value : value?.text || "";

  /**
   * 🔑 DISPLAY RULE
   * - If multiple models active → show all
   * - If single model active → show only that model
   */
  const shouldShowModel = (modelId) => {
    if (activeModels.length === 1) {
      return activeModels[0] === modelId;
    }
    return true;
  };

  const getVisibleOutputs = (outputs = {}) => {
    const allEntries = Object.entries(outputs);
    if (!allEntries.length) return [];

    const filtered = allEntries.filter(([id]) => shouldShowModel(id));

    // If filter hides everything (model mismatch), fall back to all outputs
    // so historical assistant responses never disappear from UI.
    return filtered.length ? filtered : allEntries;
  };

  /* =====================================================
   * RENDER
   * ===================================================== */
  return (
    <div className="h-full overflow-y-auto overflow-x-hidden px-3 sm:px-4 md:px-6 py-6 w-full">
      <div className="max-w-6xl mx-auto w-full overflow-x-hidden">

        {/* ================= DEFAULT PROMPTS ================= */}
        {showPrompts && (
          <div className="mt-8 mb-12">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-display font-extrabold bg-brand-main bg-clip-text text-transparent">
                What would you like to explore today?
              </h1>
              <p className="text-text-dim mt-3">
                Compare answers across multiple AI models — all in one place.
              </p>
            </div>

            {isDailyChatLimitReached && (
              <div className="mb-4 p-3 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-100 text-sm">
                You have reached your daily chat limit ({dailyChatsUsed} / {dailyChatLimit}). Upgrade to start a new chat.
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {DEFAULT_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (isDailyChatLimitReached) return;
                    log("INFO", "Default prompt selected", p);
                    setModule(p.label);
                    sendMessage(p.text);
                  }}
                  disabled={isDailyChatLimitReached}
                  className={`p-5 panel-elevated rounded-2xl transition text-left ${
                    isDailyChatLimitReached
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:border-electric-500/50"
                  }`}
                >
                  <span className="text-2xl">{p.icon}</span>
                  <div className="mt-2">
                    <div className="text-xs uppercase text-text-dim font-bold">
                      {p.title}
                    </div>
                    <div className="text-sm text-text-mid">
                      {p.text}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ================= MESSAGE STREAM ================= */}
        <AnimatePresence>
          {messages.map((msg, idx) => {

            /* ---------- USER MESSAGE ---------- */
            if (msg.role === "user") {
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-end mb-8"
                >
                  <div className="bg-blue-600 text-white px-5 py-3 rounded-2xl max-w-[80%] whitespace-pre-wrap">
                    {msg.content}
                  </div>
                </motion.div>
              );
            }

            /* ---------- ASSISTANT MESSAGE ---------- */
            if (msg.role === "assistant") {
              const outputs = msg.individualOutputs || {};
              const visibleOutputs = getVisibleOutputs(outputs);

              // Fallback for assistant messages that only contain plain content.
              if (!visibleOutputs.length) {
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start mb-8"
                  >
                    <div className="bg-n700/60 border border-line rounded-2xl px-5 py-3 max-w-[85%] text-sm text-text-mid whitespace-pre-wrap">
                      {msg.content || "No response"}
                    </div>
                  </motion.div>
                );
              }

              const isMulti = visibleOutputs.length > 1;
              const useCarousel = visibleOutputs.length >= 4;

              // Card renderer shared between both layouts
              const renderCard = (id, value) => {
                const modelName = getModelName(id);
                return (
                  <motion.div
                    key={id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => {
                      if (isMulti) {
                        log("INFO", "Model locked for continuation", id);
                        selectModel(id);
                      }
                    }}
                    className={`bg-n700/60 border border-line rounded-2xl overflow-hidden hover:border-electric-500/60 ${isMulti ? "cursor-pointer" : ""}`}
                  >
                    <div className="flex items-center gap-2 px-4 py-3 bg-n800/90 border-b border-line/80">
                      {iconForModelName(modelName)}
                      <span className="text-xs font-bold uppercase text-text-mid">{modelName}</span>
                    </div>
                    <div className="p-4 text-sm text-text-mid">
                      <AnimatedMarkdown text={extractText(value)} animate={msg.animate && assistantTyping} />
                    </div>
                  </motion.div>
                );
              };

              return (
                <div key={idx} className="mb-10">
                  {!isMulti ? (
                    /* ── SINGLE MODEL: full width on all screens ── */
                    renderCard(...visibleOutputs[0])
                  ) : (
                    <>
                      {/* ── MOBILE: tabbed single card ── */}
                      <div className="sm:hidden">
                        <MobileTabbedCard
                          visibleOutputs={visibleOutputs}
                          getModelName={getModelName}
                          iconForModelName={iconForModelName}
                          extractText={extractText}
                          isMulti={isMulti}
                          selectModel={selectModel}
                          animate={msg.animate}
                          assistantTyping={assistantTyping}
                        />
                      </div>

                      {/* ── DESKTOP: grid for 2-3, carousel for 4+ ── */}
                      <div className="hidden sm:block">
                        {useCarousel ? (
                          <div className="relative">
                            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth thin-scrollbar-x">
                              {visibleOutputs.map(([id, value]) => (
                                <div key={id} className="snap-start shrink-0 w-[380px]">
                                  {renderCard(id, value)}
                                </div>
                              ))}
                            </div>
                            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-[#0f172a]/80 to-transparent rounded-r-2xl" />
                          </div>
                        ) : (
                          <div className={`grid gap-4 ${visibleOutputs.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                            {visibleOutputs.map(([id, value]) => renderCard(id, value))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            }

            return null;
          })}
        </AnimatePresence>

        {/* ================= LOADER ================= */}
        {showLoader && (
          <div className="text-gray-400 text-sm mt-4">
            AI is thinking…
          </div>
        )}

        <div ref={scrollRef} />
      </div>
    </div>
  );
}

