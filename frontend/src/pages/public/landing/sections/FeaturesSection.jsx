import React from "react";
import { motion } from "framer-motion";

export default function FeaturesSection({ features }) {
  return (
    <section id="features" className="py-24 px-4 md:px-8 max-w-6xl mx-auto">
      <div className="text-center mb-14">
        <h2 className="text-sm font-bold text-electric-400 uppercase tracking-widest mb-2">What's included</h2>
        <h3 className="text-3xl md:text-5xl font-display font-bold text-white">Everything you need, already built in</h3>
        <p className="text-text-dim mt-4 max-w-2xl mx-auto">
          No plugins, no add-ons, no extra setup. Everything listed here works out of the box from day one.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.42, delay: i * 0.04 }}
            className="panel-elevated rounded-2xl p-5 flex flex-col gap-4 hover:border-electric-500/40 transition-all"
          >
            <div className="h-10 w-10 rounded-xl bg-electric-500/15 border border-electric-500/30 text-electric-400 flex items-center justify-center shrink-0">
              {feature.icon}
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1.5">{feature.title}</h4>
              <p className="text-xs text-text-dim leading-relaxed">{feature.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
