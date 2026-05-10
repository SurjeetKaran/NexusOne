import React from "react";
import { motion } from "framer-motion";

export default function MultimodalSection({ items }) {
  return (
    <section id="multimodal" className="py-24 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-14">
        <h2 className="text-sm font-bold text-electric-400 uppercase tracking-widest mb-2">Documents</h2>
        <h3 className="text-3xl md:text-5xl font-display font-bold text-white">Bring your own documents</h3>
        <p className="text-text-dim mt-4 max-w-2xl mx-auto">
          Upload a PDF or paste your notes and ask the AI questions about what's inside. Get answers based on your actual material — not generic responses.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {items.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.45, delay: i * 0.06 }}
            className="panel-elevated rounded-3xl p-7 hover:border-electric-500/50 transition-all"
          >
            <div className="mb-4 p-3 rounded-2xl bg-electric-500/10 w-fit border border-electric-500/20">
              {item.icon}
            </div>
            <h4 className="text-xl font-bold text-white mb-2">{item.title}</h4>
            <p className="text-text-dim text-sm leading-relaxed">{item.text}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
