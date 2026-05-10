


import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";
import ChatInput from "./ChatInput";
import { useAuthStore } from "../../store/authStore";
import { useChatStore } from "../../store/chatStore";
import LoadingSpinner from "../shared/LoadingSpinner";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { Bars3Icon } from "@heroicons/react/24/outline";
import log from "../../utils/logger";

/**
 * =====================================================
 * DASHBOARD
 * =====================================================
 * Responsibilities:
 * - App shell
 * - Bootstrapping authenticated user
 * - Loading available AI models
 * - Model selector (single vs multi-model)
 * - Share conversation (ChatGPT-style)
 * - Layout composition
 *
 * IMPORTANT DESIGN NOTES:
 * - Share feature creates a SNAPSHOT (backend)
 * - Dashboard ONLY triggers share creation
 * - No shared chat rendering happens here
 */

export default function Dashboard() {
  /* =====================================================
   * STORES
   * ===================================================== */

  const fetchUser = useAuthStore((s) => s.fetchUser);
  const { subscription } = useAuthStore();

  const {
    models,
    activeModels,
    selectModel,
    toggleModel,
    resetModels,
    loadModels,
    conversationId,
    currentModule,
    getModelSelectionLimit,
  } = useChatStore();

  /* =====================================================
   * LOCAL UI STATE
   * ===================================================== */

  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false); // model dropdown
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  /* =====================================================
   * APP INITIALIZATION
   * ===================================================== */

  useEffect(() => {
    const init = async () => {
      try {
        log("INFO", "Dashboard init started");

        // 1️⃣ Fetch authenticated user
        await fetchUser();
        log("INFO", "User loaded");

        // 2️⃣ Load available AI models (SystemSettings-backed)
        await loadModels();
        log("INFO", "Models loaded");

      } catch (err) {
        log("ERROR", "Dashboard initialization failed", err);
      } finally {
        setLoading(false);
        log("INFO", "Dashboard ready");
      }
    };

    init();
  }, [fetchUser, loadModels]);

  /* =====================================================
   * DERIVED UI STATE
   * ===================================================== */

  const selectedModel =
    activeModels.length === 1
      ? models.find((m) => m.id === activeModels[0])
      : null;

  const modelLimit = getModelSelectionLimit();

  const isFreeModelLockedForChat = subscription === "Free" && !!conversationId;
  const toggleMobileSidebar = () => setMobileSidebarOpen((s) => !s);
  const closeMobileSidebar = () => setMobileSidebarOpen(false);

  useEffect(() => {
    if (isFreeModelLockedForChat && open) {
      setOpen(false);
    }
  }, [isFreeModelLockedForChat, open]);

  /* =====================================================
   * LOADING STATE
   * ===================================================== */

  if (loading) {
    return <LoadingSpinner message="Initializing NexusOne..." />;
  }

  /* =====================================================
   * RENDER
   * ===================================================== */

  return (
    <div className="flex h-screen app-shell text-white overflow-hidden">
      {/* ================= SIDEBAR ================= */}
      <Sidebar
        mobileSidebarOpen={mobileSidebarOpen}
        toggleMobileSidebar={toggleMobileSidebar}
        closeMobileSidebar={closeMobileSidebar}
      />

      {/* ================= MAIN CONTENT ================= */}
      <div className="flex-1 flex flex-col h-full transition-all duration-300 min-w-0">
        
        {/* ================= HEADER ================= */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-line/80 shrink-0 bg-n900/35">
          
          {/* BRAND + MODE */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={toggleMobileSidebar}
              className="md:hidden p-2 rounded-lg border border-line/70 hover:border-electric-500/60 hover:bg-white/5"
              aria-label="Open sidebar"
            >
              <Bars3Icon className="w-5 h-5" />
            </button>
            <span
              className="
                font-display font-extrabold text-xl tracking-wide
                bg-gradient-to-r from-electric-400 via-electric-500 to-lime-400
                text-transparent bg-clip-text
                animate-brand-glow
              "
            >
              NexusOne
            </span>
            {currentModule && (
              <span className={`hidden sm:inline-flex px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                currentModule === "study"   ? "bg-green-500/10 text-green-400 border-green-500/20" :
                currentModule === "content" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                currentModule === "career"  ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                "bg-white/5 text-gray-400 border-white/10"
              }`}>
                {currentModule}
              </span>
            )}
          </div>

          {/* MODEL SELECTOR + SHARE */}
          <div className="flex items-center gap-2">

            {/* MODEL SELECTOR */}
            <div className="relative">
              <button
                onClick={() => {
                  if (isFreeModelLockedForChat) return;
                  setOpen((o) => !o);
                }}
                title={isFreeModelLockedForChat ? "Free plan locks the model for this conversation" : "Select model"}
                className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-sm transition ${
                  isFreeModelLockedForChat
                    ? "bg-n800/45 border-line/50 text-gray-400 cursor-not-allowed"
                    : "bg-n800/70 border-line hover:border-electric-500/60"
                }`}
                disabled={isFreeModelLockedForChat}
              >
                <span>
                  {/* Pro: show selected count; Super/Trial: show count; Free: show name */}
                  {subscription === "Free"
                    ? (selectedModel ? selectedModel.name : "All Models")
                    : activeModels.length === models.length
                    ? "All Models"
                    : activeModels.length === 1
                    ? (models.find(m => m.id === activeModels[0])?.name ?? "1 Model")
                    : `${activeModels.length} Models`}
                </span>
                {!isFreeModelLockedForChat && (
                  <ChevronDownIcon
                    className={`w-4 h-4 transition-transform ${
                      open ? "rotate-180" : ""
                    }`}
                  />
                )}
              </button>

              {open && (
                <div className="absolute right-0 mt-2 w-64 bg-n800 border border-line rounded-xl shadow-xl z-50 overflow-hidden">

                  {/* ── PRO PLAN: checkbox multi-select (max 3) ── */}
                  {/* ── SUPER/TRIAL PLAN: checkbox multi-select (no cap) ── */}
                  {(Number.isFinite(modelLimit) && modelLimit > 1) || (!Number.isFinite(modelLimit) && subscription === "Super") || (!Number.isFinite(modelLimit) && subscription === "Trial") ? (
                    <>
                      {/* Header */}
                      <div className="px-4 py-2.5 flex items-center justify-between border-b border-white/10">
                        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                          Select Models
                        </span>
                        <span className={`text-[11px] font-bold tabular-nums ${
                          Number.isFinite(modelLimit) && activeModels.length >= modelLimit
                            ? "text-amber-400"
                            : "text-electric-400"
                        }`}>
                          {Number.isFinite(modelLimit)
                            ? `${activeModels.length} / ${modelLimit}`
                            : `${activeModels.length} active`}
                        </span>
                      </div>

                      {/* Checkbox rows */}
                      {models.map((model) => {
                        const isChecked = activeModels.includes(model.id);
                        const isDisabled = !isChecked && Number.isFinite(modelLimit) && activeModels.length >= modelLimit;
                        return (
                          <label
                            key={model.id}
                            className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition select-none ${
                              isDisabled
                                ? "opacity-35 cursor-not-allowed"
                                : "hover:bg-white/5"
                            }`}
                          >
                            {/* Custom checkbox */}
                            <span
                              onClick={(e) => {
                                e.preventDefault();
                                if (!isDisabled) toggleModel(model.id);
                              }}
                              className={`w-4 h-4 rounded flex items-center justify-center border transition shrink-0 ${
                                isChecked
                                  ? "bg-electric-500 border-electric-500"
                                  : "bg-transparent border-white/30"
                              } ${isDisabled ? "pointer-events-none" : "cursor-pointer"}`}
                            >
                              {isChecked && (
                                <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                                  <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </span>
                            <span
                              onClick={() => { if (!isDisabled) toggleModel(model.id); }}
                              className={`text-sm flex-1 ${isChecked ? "text-white font-medium" : "text-gray-400"}`}
                            >
                              {model.name}
                            </span>
                            {isChecked && (
                              <span className="text-[10px] text-electric-400/70 font-medium">active</span>
                            )}
                          </label>
                        );
                      })}

                      {/* Limit hint — Pro only */}
                      {Number.isFinite(modelLimit) && activeModels.length >= modelLimit && (
                        <div className="px-4 py-2 border-t border-white/10 text-[10px] text-amber-400/80 text-center">
                          Max {modelLimit} models reached — uncheck one to swap
                        </div>
                      )}
                    </>
                  ) : (
                    /* ── FREE: original single-select ── */
                    <>
                      {/* SINGLE MODELS */}
                      {models.map((model) => (
                        <button
                          key={model.id}
                          onClick={() => { selectModel(model.id); setOpen(false); }}
                          className={`w-full px-4 py-3 text-left text-sm hover:bg-white/5 flex items-center justify-between ${
                            activeModels.includes(model.id) ? "text-electric-400" : ""
                          }`}
                        >
                          {model.name}
                          {activeModels.includes(model.id) && activeModels.length === 1 && (
                            <span className="text-[10px] text-electric-400/60">active</span>
                          )}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>

          </div>
        </header>

        {/* ================= CHAT WINDOW ================= */}
        <div className="flex-1 overflow-hidden overflow-x-hidden">
          <ChatWindow />
        </div>

        {/* ================= CHAT INPUT ================= */}
        <div className="border-t border-line/80 shrink-0 bg-n900/20 overflow-visible">
          <ChatInput />
        </div>
      </div>

    </div>
  );
}
