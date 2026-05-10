import React from "react";
import { motion } from "framer-motion";
import { CheckCircleIcon } from "@heroicons/react/24/outline";

export default function UsersSection({ items }) {
  return (
    <section id="users" className="py-24 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-14">
        <h2 className="text-sm font-bold text-electric-400 uppercase tracking-widest mb-2">Who it's for</h2>
        <h3 className="text-3xl md:text-5xl font-display font-bold text-white">Made for everyday creators and learners</h3>
        <p className="text-text-dim mt-4 max-w-3xl mx-auto">Whether you're studying, writing content, sending emails, planning a career move, or running a small business — there's a mode that fits what you do.</p>
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
            <div className="mb-4 p-3 rounded-2xl bg-white/5 w-fit border border-white/10">{item.icon}</div>
            <h4 className="text-2xl font-bold text-white mb-3">{item.title}</h4>
            <p className="text-text-dim text-sm mb-4">{item.desc}</p>
            <ul className="space-y-2">
              {item.points.map((p) => (
                <li key={p} className="flex items-start gap-2 text-text-mid text-sm">
                  <CheckCircleIcon className="w-5 h-5 text-electric-500 shrink-0" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
