import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import API from "../../../../api/axios";
import { PLAN_META, PLAN_ORDER } from "../data";

export default function PricingSection() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/admin/plan")
      .then((res) => {
        const dbPlans = Array.isArray(res.data) ? res.data : [];
        // Merge DB price with static meta, in defined order
        const merged = PLAN_ORDER.map((name) => {
          const db = dbPlans.find((p) => p.name === name);
          const meta = PLAN_META[name] || {};
          const price = meta.priceOverride
            ? meta.priceOverride
            : db
            ? `₹${db.price}`
            : "—";
          return { name, price, ...meta };
        });
        setPlans(merged);
      })
      .catch(() => {
        // Fallback: use static prices from meta
        const fallback = PLAN_ORDER.map((name) => {
          const meta = PLAN_META[name] || {};
          return { name, price: meta.priceOverride || "—", ...meta };
        });
        setPlans(fallback);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="pricing" className="py-24 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-sm font-bold text-electric-400 uppercase tracking-widest mb-2">Pricing</h2>
        <h3 className="text-3xl md:text-5xl font-display font-bold text-white mb-4">
          Simple pricing, no surprises
        </h3>
        <p className="text-text-dim max-w-2xl mx-auto">
          Start completely free. Try everything for 2 days. Then pick a plan that fits how much you use it.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {PLAN_ORDER.map((name) => (
            <div key={name} className="panel-elevated rounded-3xl p-6 h-64 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: idx * 0.07 }}
              className={`relative p-6 rounded-3xl border flex flex-col ${
                plan.emphasize
                  ? "bg-gradient-to-b from-n700/80 to-n800/90 border-electric-500/50 shadow-electric"
                  : "panel-elevated"
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-cta-hot text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-ember whitespace-nowrap">
                  {plan.badge}
                </div>
              )}

              <div className="mb-5 mt-2">
                <h4 className="text-base font-semibold text-text-mid mb-1">{plan.name}</h4>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white">{plan.price}</span>
                  {plan.period && (
                    <span className="text-text-dim text-sm">{plan.period}</span>
                  )}
                </div>
                <p className="text-xs text-text-dim mt-2">{plan.desc}</p>
              </div>

              <ul className="space-y-3 mb-6 flex-1">
                {(plan.perks || []).map((perk) => (
                  <li key={perk} className="flex items-start gap-2 text-text-mid text-sm">
                    <CheckCircleIcon
                      className={`w-4 h-4 shrink-0 mt-0.5 ${
                        plan.emphasize ? "text-electric-400" : "text-text-dim"
                      }`}
                    />
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>

              <Link
                to="/signup"
                className={`w-full py-2.5 rounded-xl text-center text-sm font-bold transition-all ${
                  plan.emphasize
                    ? "btn-electric"
                    : "panel-elevated hover:border-electric-500/40 text-white"
                }`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      <p className="text-center text-xs text-text-dim mt-8">
        Pro and Super upgrades are approved manually. Pay, submit your reference, and an admin confirms it — usually within a few hours.
      </p>
    </section>
  );
}
