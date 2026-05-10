import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Bars3Icon } from "@heroicons/react/24/outline";
import BrandMark from "../../../components/shared/BrandMark";

export default function LandingNavbar({ navItems, activeSection, onNavClick, onOpenMenu }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 md:px-10
        ${scrolled
          ? "py-3 backdrop-blur-xl bg-n900/80 border-b border-line/60 shadow-[0_4px_32px_rgba(0,0,0,0.35)]"
          : "py-5 backdrop-blur-sm bg-transparent border-b border-transparent"
        }`}
    >
      <div className="mx-auto max-w-7xl flex items-center justify-between gap-4">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 group shrink-0">
          <BrandMark className="w-11 h-11 transition-all duration-300" />
          <span className="text-xl font-display font-bold tracking-tight text-white group-hover:text-electric-400 transition-colors">
            NexusOne
          </span>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden md:flex gap-6 items-center justify-center text-sm font-medium">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onNavClick(item.id)}
                className={`relative py-1 transition-colors duration-200 ${
                  activeSection === item.id ? "text-white" : "text-text-dim hover:text-text-mid"
                }`}
              >
                {item.label}
                {activeSection === item.id && (
                  <motion.div
                    layoutId="landing-nav-underline"
                    className="absolute left-0 right-0 -bottom-0.5 h-0.5 bg-electric-500 rounded-full"
                  />
                )}
              </button>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/login"
            className="hidden md:inline-block text-sm font-medium text-text-mid hover:text-white transition-colors"
          >
            Log In
          </Link>
          <Link
            to="/signup"
            className="hidden md:inline-flex items-center px-5 py-2 rounded-xl btn-ember text-sm font-semibold transition-all hover:-translate-y-0.5"
          >
            Get Started
          </Link>
          <button
            className="md:hidden p-2 rounded-lg hover:bg-white/10 text-white transition"
            onClick={onOpenMenu}
            aria-label="Open menu"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
        </div>
      </div>
    </motion.nav>
  );
}
