import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { SparklesIcon } from "@heroicons/react/24/outline";

export default function HeroSection({ onExplore, badgeIcon }) {
  return (
    <section
      id="home"
      className="min-h-[90vh] flex flex-col items-center justify-center text-center px-4 relative overflow-hidden"
    >
      {/* Glow blob */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-electric-500/15 rounded-full blur-[130px] -z-10 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65 }}
        className="max-w-4xl mx-auto space-y-7"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full brand-badge text-xs font-semibold uppercase tracking-wider"
        >
          {badgeIcon}
          Multi-Model AI Workspace
        </motion.div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-display font-extrabold tracking-tight text-white leading-[1.08]">
          Ask once.
          <br />
          <span className="text-transparent bg-clip-text bg-brand-main">
            Get answers from every AI.
          </span>
          <br />
          Pick the best one.
        </h1>

        {/* Sub */}
        <p className="max-w-2xl mx-auto text-base md:text-lg text-text-dim leading-relaxed">
          NexusOne sends your question to multiple AI model personalities at the same time and shows you all the answers side by side.
          Use Study mode to learn, Content mode to write, or Career mode to plan your next move — fast.
        </p>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="flex flex-wrap items-center justify-center gap-6 text-sm text-text-dim"
        >
          {[
            { label: "AI Models", value: "3+" },
            { label: "Modes", value: "3 Modes" },
            { label: "Plans", value: "Free → Super" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-2">
              <SparklesIcon className="w-4 h-4 text-electric-400 shrink-0" />
              <span className="text-white font-semibold">{s.value}</span>
              <span>{s.label}</span>
            </div>
          ))}
        </motion.div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link
            to="/signup"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl btn-ember font-bold text-base transition-all hover:-translate-y-0.5"
          >
            Start for Free
          </Link>
          <button
            onClick={onExplore}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl panel-elevated text-white font-semibold hover:border-electric-500/50 transition-all text-base"
          >
            See How It Works
          </button>
        </div>
      </motion.div>
    </section>
  );
}
