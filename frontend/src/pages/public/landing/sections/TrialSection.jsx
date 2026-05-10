import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ClockIcon,
  SparklesIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

const SLIDE_INTERVAL = 3000;

const variants = {
  enter: (dir) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
};

const TRIAL_HIGHLIGHTS = [
  { label: "Duration", value: "48 hrs" },
  { label: "Chats / day", value: "10" },
  { label: "Msgs / chat", value: "50" },
  { label: "AI Models", value: "Every" },
  { label: "Modes", value: "All 3" },
];

export default function TrialSection({ steps }) {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [paused, setPaused] = useState(false);
  const sectionRef = useRef(null);
  const inViewRef = useRef(false);

  const go = useCallback((next) => {
    setDir(next > index ? 1 : -1);
    setIndex(next);
  }, [index]);

  const prev = () => { setPaused(true); go((index - 1 + steps.length) % steps.length); };
  const next = () => { setPaused(true); go((index + 1) % steps.length); };
  const goTo = (i) => { setPaused(true); go(i); };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { inViewRef.current = entry.isIntersecting; },
      { threshold: 0.4 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (paused) {
      const resume = setTimeout(() => setPaused(false), 6000);
      return () => clearTimeout(resume);
    }
    const timer = setInterval(() => {
      if (!inViewRef.current) return;
      setDir(1);
      setIndex((i) => (i + 1) % steps.length);
    }, SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, [paused, steps.length]);

  const step = steps[index];

  return (
    <section id="trial" ref={sectionRef} className="py-24 px-4 md:px-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full brand-badge text-xs font-semibold uppercase tracking-wider mb-4">
          <ClockIcon className="w-4 h-4" />
          2-Day Free Trial
        </div>
        <h3 className="text-3xl md:text-5xl font-display font-bold text-white">
          Try everything free for 2 days
        </h3>
        <p className="text-text-dim mt-4 max-w-2xl mx-auto">
          When you sign up, you get full access to the whole platform for 48 hours — no payment, no commitment.
          After 2 days you move to the Free plan automatically. Nothing gets deleted.
        </p>
      </div>

      {/* Carousel */}
      <div className="relative mb-8">
        <div className="overflow-hidden rounded-3xl panel-elevated min-h-[260px] md:min-h-[220px]">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={index}
              custom={dir}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="p-8 md:p-10 flex flex-col md:flex-row gap-8 items-start"
            >
              {/* Step badge */}
              <div className="shrink-0 flex flex-col items-center gap-2">
                <div className="h-12 w-12 rounded-2xl bg-electric-500/20 border border-electric-500/40 flex items-center justify-center text-electric-400 font-bold text-lg font-display">
                  {step.step}
                </div>
                <span className="text-[10px] uppercase tracking-[0.18em] text-text-dim">Step</span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h4 className="text-2xl md:text-3xl font-display font-bold text-white mb-3 leading-snug">
                  {step.title}
                </h4>
                <p className="text-text-dim leading-relaxed mb-4">{step.text}</p>
                {step.detail && (
                  <div className="inline-flex items-start gap-2 bg-electric-500/8 border border-electric-500/20 rounded-xl px-4 py-2.5 text-sm text-electric-300">
                    <CheckCircleIcon className="w-4 h-4 shrink-0 mt-0.5 text-electric-400" />
                    {step.detail}
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Left arrow */}
        <button
          onClick={prev}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-6 p-2.5 rounded-full bg-n800/90 border border-line/60 text-text-mid hover:text-white hover:border-electric-500/50 transition shadow-lg"
          aria-label="Previous step"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>

        {/* Right arrow */}
        <button
          onClick={next}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-6 p-2.5 rounded-full bg-n800/90 border border-line/60 text-text-mid hover:text-white hover:border-electric-500/50 transition shadow-lg"
          aria-label="Next step"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Dots */}
      <div className="flex items-center justify-center gap-2 mb-2">
        {steps.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`transition-all duration-300 rounded-full ${
              i === index
                ? "w-7 h-2 bg-electric-500"
                : "w-2 h-2 bg-white/20 hover:bg-white/40"
            }`}
            aria-label={`Go to step ${i + 1}`}
          />
        ))}
      </div>
      <p className="text-center text-xs text-text-dim mb-10">
        {index + 1} of {steps.length}
      </p>

      {/* Trial highlights bar */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        className="panel-elevated rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-8"
      >
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-6 w-full md:w-auto">
          {TRIAL_HIGHLIGHTS.map((item) => (
            <div key={item.label} className="text-center">
              <div className="text-lg md:text-xl font-extrabold text-white">{item.value}</div>
              <div className="text-[11px] text-text-dim mt-0.5 whitespace-nowrap">{item.label}</div>
            </div>
          ))}
        </div>

        <Link
          to="/signup"
          className="shrink-0 w-full md:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-2xl btn-ember font-bold text-sm hover:-translate-y-0.5 transition-all"
        >
          <SparklesIcon className="w-4 h-4" />
          Try it free — just sign up
        </Link>
      </motion.div>
    </section>
  );
}
