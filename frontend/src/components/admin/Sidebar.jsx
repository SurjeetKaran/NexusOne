import React, { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import {
  HomeIcon,
  UsersIcon,
  TagIcon,
  KeyIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import BrandMark from "../shared/BrandMark";

export default function Sidebar({ sidebarOpen, toggleSidebar, activeTab, setActiveTab }) {
  const logout = useAuthStore((state) => state.logout);
  const role = useAuthStore((state) => state.role);
  const isOwner = role === "admin";
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    localStorage.clear();
    navigate("/login");
  };

  const handleTabSelect = (name) => {
    setActiveTab(name);
    setMobileOpen(false); // close drawer on mobile after selection
  };

  const menuItems = [
    { name: "Home", icon: <HomeIcon className="w-5 h-5" /> },
    { name: "User Management", icon: <UsersIcon className="w-5 h-5" /> },
    { name: "Plan Management", icon: <TagIcon className="w-5 h-5" /> },
    { name: "Pro Requests", icon: <KeyIcon className="w-5 h-5" /> },
    ...(isOwner
      ? [
          { name: "API Keys", icon: <KeyIcon className="w-5 h-5" /> },
          { name: "System Config", icon: <Cog6ToothIcon className="w-5 h-5" /> },
        ]
      : []),
  ];

  /* ── Shared sidebar content ── */
  const SidebarContent = ({ mobile = false }) => (
    <div className={`flex flex-col h-full`}>
      {/* HEADER */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-line/80 bg-n900/35 shrink-0">
        {(sidebarOpen || mobile) && (
          <div className="flex items-center gap-2 text-white font-bold min-w-0">
            <BrandMark className="w-8 h-8" />
            <div className="min-w-0">
              <span className="block text-lg font-display bg-brand-main bg-clip-text text-transparent leading-none">
                NexusOne
              </span>
              <span className="block text-[10px] uppercase tracking-[0.22em] text-text-dim mt-1">
                Admin Console
              </span>
            </div>
          </div>
        )}
        {mobile ? (
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white shrink-0"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white shrink-0"
          >
            {sidebarOpen ? (
              <ChevronLeftIcon className="w-5 h-5" />
            ) : (
              <ChevronRightIcon className="w-5 h-5" />
            )}
          </button>
        )}
      </div>

      {/* NAV ITEMS */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {(sidebarOpen || mobile) && (
          <div className="px-2 pb-3 text-[10px] uppercase tracking-[0.22em] text-text-dim">
            Workspace
          </div>
        )}

        {menuItems.map((item) => {
          const isActive = activeTab === item.name;
          return (
            <button
              key={item.name}
              onClick={() => handleTabSelect(item.name)}
              className={`group relative flex items-center gap-3 w-full p-3 rounded-xl text-sm transition-all ${
                isActive
                  ? "bg-electric-500/10 text-electric-400 border border-electric-500/30 shadow-electric"
                  : "hover:bg-n700/40 text-text-dim hover:text-text-mid border border-transparent"
              } ${!sidebarOpen && !mobile ? "justify-center" : ""}`}
              title={!sidebarOpen && !mobile ? item.name : ""}
            >
              <div className={`${isActive ? "scale-105" : ""} transition-transform shrink-0`}>
                {item.icon}
              </div>
              {(sidebarOpen || mobile) && <span className="truncate">{item.name}</span>}
              {isActive && (sidebarOpen || mobile) && (
                <div className="absolute left-0 w-1 h-8 bg-electric-500 rounded-r-full shadow-[0_0_12px_rgba(99,102,241,0.45)]" />
              )}
            </button>
          );
        })}
      </div>

      {/* LOGOUT */}
      <div className="p-3 border-t border-line/80 bg-n900/25 shrink-0">
        <button
          onClick={handleLogout}
          className={`group flex items-center gap-3 w-full p-2.5 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all ${
            !sidebarOpen && !mobile ? "justify-center" : ""
          }`}
        >
          <ArrowLeftOnRectangleIcon className="w-5 h-5 group-hover:-translate-x-1 shrink-0" />
          {(sidebarOpen || mobile) && <span>Log out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ── DESKTOP SIDEBAR (md+) ── */}
      <div
        className={`hidden md:flex flex-col h-screen app-shell border-r border-line/80 text-text-mid transition-all duration-300 shrink-0 ${
          sidebarOpen ? "w-64" : "w-20"
        }`}
      >
        <SidebarContent />
      </div>

      {/* ── MOBILE: hamburger button ── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 p-2 rounded-xl bg-n800/90 border border-line/80 text-gray-300 hover:text-white hover:border-electric-500/50 backdrop-blur-sm"
        aria-label="Open sidebar"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* ── MOBILE DRAWER ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              className="md:hidden fixed inset-0 z-40 bg-black/55 backdrop-blur-[3px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
            />
            {/* Drawer */}
            <motion.div
              key="drawer"
              className="md:hidden fixed inset-y-0 left-0 z-50 w-72 app-shell border-r border-line/80 text-text-mid flex flex-col"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
            >
              <SidebarContent mobile />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
