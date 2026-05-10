import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { XMarkIcon } from "@heroicons/react/24/outline";
import BrandMark from "../../../components/shared/BrandMark";

export default function MobileMenu({ open, navItems, onClose, onNavClick }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[998] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="fixed top-0 right-0 bottom-0 z-[999] w-72 bg-n900/95 backdrop-blur-2xl border-l border-line/60 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-line/60">
              <div className="flex items-center gap-2">
                <BrandMark className="w-7 h-7" />
                <span className="font-display font-bold text-white">NexusOne</span>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
              {navItems.map((item, i) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => onNavClick(item.id)}
                  className="w-full text-left px-4 py-3 rounded-xl text-text-mid hover:text-white hover:bg-white/5 transition-all text-sm font-medium"
                >
                  {item.label}
                </motion.button>
              ))}
            </nav>

            {/* CTA buttons */}
            <div className="px-4 py-5 border-t border-line/60 space-y-3">
              <Link
                to="/login"
                onClick={onClose}
                className="block w-full py-3 rounded-xl border border-line text-center text-sm font-semibold text-white hover:bg-white/5 transition"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                onClick={onClose}
                className="block w-full py-3 rounded-xl btn-ember text-center text-sm font-semibold"
              >
                Get Started Free
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
