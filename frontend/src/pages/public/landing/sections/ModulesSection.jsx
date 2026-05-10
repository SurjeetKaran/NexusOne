import React from "react";
import { motion } from "framer-motion";
import { CheckCircleIcon } from "@heroicons/react/24/outline";

const ACCENT = ["text-electric-500", "text-electric-500", "text-amber-400"];
const ICON_BG = ["bg-white/5 border-white/10", "bg-white/5 border-white/10", "bg-amber-500/10 border-amber-500/20"];

export default function ModulesSection({ modules }) {
  return (
    <section id="modules" className="py-24 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-14">
        <h2 className="text-sm font-bold text-electric-400 uppercase tracking-widest mb-2">Three Modes</h2>
        <h3 className="text-3xl md:text-5xl font-display font-bold text-white">
          Study. Create. Plan your career.
        </h3>
        <p className="text-text-dim mt-4 max-w-3xl mx-auto">
          Each mode shapes how the AI thinks and responds. All three are available on every plan — pick the one that matches what you're trying to do.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {modules.map((module, i) => (
          <motion.div
            key={module.title}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.45, delay: i * 0.07 }}
            className="panel-elevated rounded-3xl p-7 flex flex-col hover:border-electric-500/50 transition-all"
          >
            <div className="mb-5 flex items-center justify-between">
              <div className={`p-3 rounded-2xl w-fit border ${ICON_BG[i]}`}>
                {module.icon}
              </div>
              <span className="text-xs uppercase tracking-[0.16em] text-text-dim">Mode</span>
            </div>

            <h4 className="text-2xl font-bold text-white mb-2">{module.title}</h4>
            <p className="text-text-dim mb-5 text-sm leading-relaxed">{module.desc}</p>

            <ul className="space-y-2 mt-auto">
              {module.bullets.map((b) => (
                <li key={b} className="flex items-start gap-2 text-text-mid text-sm">
                  <CheckCircleIcon className={`w-5 h-5 shrink-0 mt-0.5 ${ACCENT[i]}`} />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>

      <p className="text-center text-xs text-text-dim mt-8">
        All three modes are available on every plan — Free, Trial, Pro, and Super.
      </p>
    </section>
  );
}
