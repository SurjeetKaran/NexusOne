import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";

export default function FAQSection({ items, expandedFAQ, setExpandedFAQ }) {
  return (
    <section id="faq" className="py-24 px-4 md:px-8 max-w-3xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-sm font-bold text-electric-400 uppercase tracking-widest mb-2">Questions</h2>
        <h3 className="text-3xl md:text-4xl font-display font-bold text-white">Common questions, plain answers</h3>
        <p className="text-text-dim mt-4">No jargon. Just straight answers to what people actually ask.</p>
      </div>

      <div className="space-y-4">
        {items.map((faq, i) => {
          const isOpen = expandedFAQ === i;
          return (
            <motion.div
              key={faq.q}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
              className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                isOpen ? "bg-n700/65 border-electric-500/40" : "panel-elevated hover:border-line"
              }`}
            >
              <button onClick={() => setExpandedFAQ(isOpen ? null : i)} className="w-full flex items-center justify-between p-5 text-left">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-xs text-electric-400 font-bold">{String(i + 1).padStart(2, "0")}</span>
                  <span className={`font-medium ${isOpen ? "text-electric-400" : "text-text-mid"}`}>{faq.q}</span>
                </div>
                {isOpen ? (
                  <ChevronUpIcon className="w-5 h-5 text-electric-400" />
                ) : (
                  <ChevronDownIcon className="w-5 h-5 text-text-dim" />
                )}
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-5 pb-5 text-text-dim text-sm leading-relaxed"
                  >
                    {faq.a}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
