import React from "react";
import { motion } from "framer-motion";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

export default function HowSection({ items }) {
  return (
    <section id="how" className="py-24 px-4 md:px-8 max-w-6xl mx-auto">
      <div className="text-center mb-14">
        <h2 className="text-sm font-bold text-electric-400 uppercase tracking-widest mb-2">How it works</h2>
        <h3 className="text-3xl md:text-5xl font-display font-bold text-white">Simple from start to finish</h3>
        <p className="text-text-dim mt-4 max-w-2xl mx-auto">No complicated setup. No learning curve. Just ask and get answers.</p>
      </div>

      {/* Cards with arrows between them */}
      <div className="flex flex-col md:flex-row items-stretch gap-0">
        {items.map((item, i) => (
          <React.Fragment key={item.title}>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              className="flex-1 panel-elevated rounded-3xl p-6 md:p-7 flex flex-col gap-4 hover:border-electric-500/50 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.18em] text-text-dim">Step {i + 1}</span>
                <div className="h-8 w-8 rounded-full bg-electric-500/20 border border-electric-500/40 flex items-center justify-center text-electric-400 font-bold text-sm">
                  {i + 1}
                </div>
              </div>
              <div>
                <h4 className="text-xl font-bold text-white leading-snug mb-2">{item.title}</h4>
                <p className="text-text-dim text-sm leading-relaxed">{item.text}</p>
              </div>
            </motion.div>

            {/* Arrow between cards — horizontal on desktop, vertical on mobile */}
            {i < items.length - 1 && (
              <div className="flex items-center justify-center py-3 md:py-0 md:px-2 shrink-0">
                <ArrowRightIcon className="w-5 h-5 text-electric-500/50 rotate-90 md:rotate-0" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </section>
  );
}
