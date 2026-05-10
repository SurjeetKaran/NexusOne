import React, { useState, useRef, useEffect } from "react";
import { useChatStore } from "../../store/chatStore";
import { useAuthStore } from "../../store/authStore";
import { useDropzone } from "react-dropzone";
import * as pdfjsLib from "pdfjs-dist";
import log from "../../utils/logger";
import dialog from "../../utils/dialogService";

import {
  PaperAirplaneIcon,
  PaperClipIcon,
  XMarkIcon,
  SparklesIcon,
  ChevronUpIcon,
  DocumentTextIcon,
  StopCircleIcon,
} from "@heroicons/react/24/solid";

/* =====================================================
 * PDF WORKER SETUP
 * ===================================================== */
pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

/* =====================================================
 * STATIC MODULE DEFINITIONS
 * (Backend expects these exact IDs)
 * ===================================================== */
const MODULES = [
  { id: "study",   label: "Study",   color: "text-green-400"  },
  { id: "content", label: "Content", color: "text-purple-400" },
  { id: "career",  label: "Career",  color: "text-blue-400"   },
];

const PLAN_MESSAGE_LIMITS = {
  Trial: 50,
  Free: 10,
  Pro: 50,
  Super: 100,
};

export default function ChatInput() {
  /* =====================================================
   * LOCAL UI STATE
   * ===================================================== */
  const [input, setInput] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [parsedFileText, setParsedFileText] = useState("");
  const [showModuleMenu, setShowModuleMenu] = useState(false);
  const moduleMenuRef = useRef(null);

  const textareaRef = useRef(null);

  // Close module menu on outside click
  useEffect(() => {
    if (!showModuleMenu) return;
    const handler = (e) => {
      if (moduleMenuRef.current && !moduleMenuRef.current.contains(e.target)) {
        setShowModuleMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showModuleMenu]);

  /* =====================================================
   * STORES
   * ===================================================== */
  const {
    sendMessage,
    loading,
    assistantTyping,
    stopTypingAndPersistPartial,
    terminateCurrentGeneration,
    currentModule,
    setModule,
    conversationId,
    messages,
    canSendMessage,
  } = useChatStore();

  const { subscription } = useAuthStore();

  const isBlocked = !canSendMessage();
  const conversationMessageLimit = PLAN_MESSAGE_LIMITS[subscription] || 10;
  const currentChatUserMessageCount = messages.filter((m) => m.role === "user").length;
  const isCurrentChatLimitReached = !!conversationId && currentChatUserMessageCount >= conversationMessageLimit;
  // Mode is locked once a conversation starts (backend enforces this)
  const isModeLocked = !!conversationId;

  /* =====================================================
   * AUTO-RESIZE TEXTAREA
   * ===================================================== */
  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height =
      `${textareaRef.current.scrollHeight}px`;
  }, [input]);

  /* =====================================================
   * FILE PARSING (TXT / CSV / JSON / PDF)
   * ===================================================== */
  const parseFileContent = async (file) => {
    try {
      const ext = file.name.split(".").pop().toLowerCase();
      log("INFO", "Parsing uploaded file", { name: file.name, ext });

      // Simple text-based files
      if (["txt", "csv", "json"].includes(ext)) {
        return await file.text();
      }

      // PDF files (first 5 pages only)
      if (ext === "pdf") {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        let text = "";
        const maxPages = Math.min(pdf.numPages, 5);

        for (let i = 1; i <= maxPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map(item => item.str).join(" ") + "\n";
        }

        return text;
      }

      return "";
    } catch (err) {
      log("ERROR", "File parsing failed", err);
      await dialog.alert("Failed to read uploaded file.");
      return "";
    }
  };

  /* =====================================================
   * FILE DROP HANDLER
   * ===================================================== */
  const onDrop = async (files) => {
    const file = files[0];
    if (!file) return;

    log("INFO", "File dropped", file.name);

    setUploadedFile(file);
    const text = await parseFileContent(file);
    setParsedFileText(text);
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    multiple: false,
    disabled: loading || assistantTyping || isBlocked,
    accept: {
      "text/*": [".txt", ".csv", ".json"],
      "application/pdf": [".pdf"],
    },
  });

  const clearFile = (e) => {
    e.stopPropagation();
    log("INFO", "Clearing uploaded file");
    setUploadedFile(null);
    setParsedFileText("");
  };

  /* =====================================================
   * SEND MESSAGE
   * ===================================================== */
  const handleSend = async () => {
    if (loading || assistantTyping || isBlocked || isCurrentChatLimitReached) return;

    if (!input.trim() && !parsedFileText) return;

    let finalMessage = input.trim();

    // Encode file content safely (no backend changes)
    if (parsedFileText) {
      finalMessage +=
        `\n\n<<<FILE:${uploadedFile.name}>>>\n` +
        parsedFileText +
        `\n<<<END_FILE>>>`;
    }

    log("INFO", "Sending message", {
      hasFile: !!uploadedFile,
      module: currentModule,
      conversationId,
    });

    await sendMessage(finalMessage);

    // Reset input state
    setInput("");
    setUploadedFile(null);
    setParsedFileText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  /* =====================================================
   * DERIVED UI VALUES
   * ===================================================== */
  const activeModule =
    MODULES.find(m => m.id === currentModule) || MODULES[0];

  const handleActionClick = () => {
    if (loading) {
      terminateCurrentGeneration();
      return;
    }
    if (assistantTyping) {
      stopTypingAndPersistPartial();
      return;
    }
    handleSend();
  };

  /* =====================================================
   * RENDER
   * ===================================================== */
  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 md:px-6 pb-6">

      {/* ⚠️ LIMIT WARNING */}
      {(isBlocked || isCurrentChatLimitReached) && (
        <div className="mb-4 flex items-center justify-center gap-2 p-3 text-xs text-amber-200 bg-amber-900/30 border border-amber-500/30 rounded-xl">
          <SparklesIcon className="w-4 h-4" />
          <span>
            {isCurrentChatLimitReached
              ? `This conversation reached its ${conversationMessageLimit} message limit. Upgrade to continue in this chat or start a new one.`
              : subscription === "Free"
              ? "Free plan limit reached. Upgrade to continue."
              : "Action temporarily blocked."}
          </span>
        </div>
      )}

      <div className={`flex flex-col sm:flex-row sm:items-center gap-3 ${isBlocked ? "opacity-50 pointer-events-none" : ""}`}>
        {/* MODE SELECTOR (LEFT SIDE, SAME ROW AS INPUT) */}
        <div ref={moduleMenuRef} className="relative w-full sm:w-auto sm:min-w-[150px] sm:shrink-0" style={{ zIndex: showModuleMenu ? 60 : 'auto' }}>
          <button
            onClick={() => !isModeLocked && setShowModuleMenu(v => !v)}
            title={isModeLocked ? "Mode is locked for this conversation" : "Switch mode"}
            className={`w-full h-11 px-4 rounded-2xl flex items-center justify-between gap-2 transition border ${
              isModeLocked
                ? "bg-white/5 border-white/10 opacity-60 cursor-not-allowed"
                : "bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-blue-500/20 border-cyan-300/40 hover:from-emerald-500/30 hover:via-cyan-500/30 hover:to-blue-500/30 shadow-[0_0_0_1px_rgba(56,189,248,0.2),0_10px_30px_rgba(6,182,212,0.15)] cursor-pointer"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className={`w-2 h-2 rounded-full ${
                currentModule === "study" ? "bg-emerald-400" :
                currentModule === "content" ? "bg-cyan-400" : "bg-blue-400"
              }`} />
              <span className={`text-xs font-bold uppercase tracking-wider truncate ${isModeLocked ? "text-gray-500" : activeModule.color}`}>
                {activeModule.label} Mode
              </span>
            </div>
            {!isModeLocked && (
              <ChevronUpIcon className={`w-3 h-3 text-cyan-200 transition ${showModuleMenu ? "rotate-180" : ""}`} />
            )}
          </button>

          {showModuleMenu && !isModeLocked && (
            <div className="absolute bottom-full mb-2 left-0 w-full bg-[#0f172a] rounded-xl border border-cyan-300/25 z-50 min-w-[150px] shadow-[0_14px_28px_rgba(0,0,0,0.35)] overflow-hidden">
              {MODULES.map(m => (
                <button
                  key={m.id}
                  onClick={() => { setModule(m.id); setShowModuleMenu(false); }}
                  className={`flex items-center gap-2 w-full px-4 py-3 text-left text-sm hover:bg-cyan-500/10 transition ${
                    currentModule === m.id ? "text-white" : "text-gray-400"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${
                    m.id === "study" ? "bg-green-400" :
                    m.id === "content" ? "bg-purple-400" : "bg-blue-400"
                  }`} />
                  {m.label}
                  {currentModule === m.id && <span className="ml-auto text-[10px] text-electric-400">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div
          className="relative flex-1 flex flex-col min-h-[52px] bg-[#1e293b]/80 border border-white/10 rounded-3xl shadow-xl"
        >

        {/* FILE PREVIEW */}
        {uploadedFile && (
          <div className="mx-4 mt-3 flex items-center gap-3 p-2 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <DocumentTextIcon className="w-4 h-4 text-blue-400" />
            <div className="flex-1 truncate text-xs text-blue-100">
              {uploadedFile.name}
            </div>
            <button onClick={clearFile}>
              <XMarkIcon className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2 p-3">
          {/* TEXTAREA */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            disabled={loading || assistantTyping || isBlocked}
            placeholder={isBlocked ? "Limit reached..." : "Ask anything..."}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="flex-1 bg-transparent resize-none text-sm outline-none text-white py-1"
          />

          {/* ACTION BUTTONS */}
          <div className="flex items-center gap-2">
            <div {...getRootProps()}>
              <input {...getInputProps()} />
              <PaperClipIcon className="w-5 h-5 text-gray-400 cursor-pointer" />
            </div>

            <button
              onClick={handleActionClick}
              disabled={isBlocked || isCurrentChatLimitReached}
              className="p-2 bg-blue-600 rounded-xl"
            >
              {loading || assistantTyping ? (
                <StopCircleIcon className="w-4 h-4 text-white" />
              ) : (
                <PaperAirplaneIcon className="w-4 h-4 text-white" />
              )}
            </button>
          </div>
        </div>
        </div>
      </div>

      <p className="text-center text-[10px] text-gray-500 mt-2">
        NexusOne uses multiple AI models. Answers may vary.
      </p>
    </div>
  );
}
