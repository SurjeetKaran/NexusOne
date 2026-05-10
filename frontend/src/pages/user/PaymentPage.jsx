import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import { useAuthStore } from "../../store/authStore";
import { motion } from "framer-motion";

// Icons
import {
  CheckCircleIcon,
  SparklesIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";

import LoadingSpinner from "../../components/shared/LoadingSpinner";
import log from "../../utils/logger";
import dialog from "../../utils/dialogService";

export default function PaymentPage() {
  const navigate = useNavigate();
  const { user, fetchUser } = useAuthStore();
  const [plans, setPlans] = useState([]);
  const [upgradeData, setUpgradeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [formData, setFormData] = useState({
    transactionRef: "",
    payerName: "",
    payerNote: "",
    paymentScreenshotUrl: ""
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [plansRes, statusRes] = await Promise.all([
          API.get("/admin/plan"),
          API.get("/auth/pro-upgrade/status")
        ]);

        setPlans(plansRes.data);
        setUpgradeData(statusRes.data);
      } catch (err) {
        log("ERROR", "Failed to load payment page data", err?.response?.data || err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const refreshStatus = async () => {
    const statusRes = await API.get("/auth/pro-upgrade/status");
    setUpgradeData(statusRes.data);
  };

  const handleSubmitRequest = async () => {
    if (!formData.transactionRef.trim()) {
      await dialog.alert("Please enter your payment transaction reference.");
      return;
    }

    setProcessing(true);
    try {
      await API.post("/auth/pro-upgrade/request", {
        transactionRef: formData.transactionRef.trim(),
        payerName: formData.payerName.trim(),
        payerNote: formData.payerNote.trim(),
        paymentScreenshotUrl: formData.paymentScreenshotUrl.trim(),
      });

      await dialog.alert("Upgrade request submitted. Admin will review your payment.");
      await refreshStatus();
      await fetchUser();
      setFormData({
        transactionRef: "",
        payerName: "",
        payerNote: "",
        paymentScreenshotUrl: ""
      });

    } catch (err) {
      const msg = err?.response?.data?.msg || "Failed to submit upgrade request.";
      log("ERROR", "Upgrade request failed", err?.response?.data || err);
      await dialog.alert(msg);
    } finally {
      setProcessing(false);
    }
  };

  const latestRequest = upgradeData?.latestRequest;
  const proPlan = upgradeData?.proPlan || plans.find((p) => p.name === "Pro") || { name: "Pro", price: 299, features: [] };
  const instructions = upgradeData?.paymentInstructions || {};
  const isPending = latestRequest?.status === "pending";
  const isApproved = ["Pro", "Super"].includes(user?.subscription) || latestRequest?.status === "approved";

  if (loading) return <LoadingSpinner message="Loading Plans..." />;

  return (
    <div className="min-h-screen bg-[#0B1120] text-white font-sans selection:bg-blue-500/30 flex flex-col relative overflow-hidden">
      
      {/* Background Glows */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px]" />
      </div>

      {/* Navbar / Back Button */}
      <div className="p-6 z-10">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          <span>Back</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center px-4 pb-20 z-10">
        <div className="text-center mb-12 max-w-2xl">
          <span className="text-blue-400 font-bold text-xs tracking-widest uppercase mb-2 block">
            Upgrade Your Plan (Manual Review)
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Pay via QR, Then Request Approval
          </h1>
          <p className="text-gray-400 text-lg">
            Complete payment using the QR/UPI details below, submit your transaction reference, and admin will activate your plan after verification.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
          {plans.map((plan, idx) => {
            const isPaid = plan.price > 0;
            const isCurrent = user?.subscription === plan.name;
            const isHighlighted = plan.name === "Pro";

            return (
              <motion.div
                key={plan._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className={`relative p-7 rounded-3xl border flex flex-col justify-between transition-all duration-300 ${
                  isHighlighted
                    ? "bg-gradient-to-b from-[#1e293b] to-[#0f172a] border-blue-500/50 shadow-2xl shadow-blue-900/20 scale-105 z-10"
                    : "bg-[#111827]/60 border-white/5 hover:border-white/10 backdrop-blur-sm"
                }`}
              >
                {isHighlighted && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-blue-600 text-white text-xs font-bold uppercase tracking-widest rounded-full shadow-lg flex items-center gap-2">
                    <SparklesIcon className="w-3 h-3" /> Most Popular
                  </div>
                )}
                {plan.name === "Super" && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-purple-600 text-white text-xs font-bold uppercase tracking-widest rounded-full shadow-lg flex items-center gap-2">
                    <SparklesIcon className="w-3 h-3" /> Best Value
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {plan.name === "Free" ? "For getting started" :
                         plan.name === "Pro"  ? "For daily power users" :
                         plan.name === "Super" ? "Maximum everything" :
                         "Full access for 2 days"}
                      </p>
                    </div>
                    <div className={`p-2 rounded-lg ${isPaid ? "bg-blue-500/20 text-blue-400" : "bg-white/5 text-gray-500"}`}>
                      {isPaid ? <SparklesIcon className="w-6 h-6" /> : <ShieldCheckIcon className="w-6 h-6" />}
                    </div>
                  </div>

                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-bold text-white">₹{plan.price}</span>
                    <span className="text-gray-500">/ month</span>
                  </div>

                  <div className="space-y-3 mb-6">
                    {(Array.isArray(plan.features) ? plan.features : []).map((feature, i) => (
                      <div key={i} className="flex items-start gap-3 text-sm">
                        <CheckCircleIcon className={`w-5 h-5 shrink-0 ${isPaid ? "text-blue-400" : "text-gray-500"}`} />
                        <span className="text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  disabled
                  className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 ${
                    isCurrent
                      ? "bg-white/10 text-gray-400 cursor-default"
                      : isPaid
                      ? "bg-blue-600/30 text-blue-100 cursor-default"
                      : "bg-white/5 text-gray-400"
                  }`}
                >
                  {isCurrent ? "Current Plan" : isPaid ? "Pay below to upgrade" : "Free Forever"}
                </button>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-10 w-full max-w-4xl rounded-3xl border border-blue-500/20 bg-[#0f172a]/80 p-6 md:p-8"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">1. Pay For Pro Plan</h2>
              <div className="space-y-3 text-sm text-gray-300">
                <p>Plan: <span className="text-white font-semibold">{proPlan.name}</span></p>
                <p>Amount: <span className="text-white font-semibold">INR {proPlan.price}</span></p>
                {instructions.upiId && <p>UPI ID: <span className="text-blue-300 font-semibold">{instructions.upiId}</span></p>}
                {instructions.payeeName && <p>Payee: <span className="text-white font-semibold">{instructions.payeeName}</span></p>}
              </div>

              {instructions.qrCodeImageUrl ? (
                <div className="mt-6 rounded-2xl border border-white/10 bg-white p-3 w-fit">
                  <img
                    src={instructions.qrCodeImageUrl}
                    alt="NexusOne Pro payment QR"
                    className="w-56 h-56 object-contain"
                  />
                </div>
              ) : (
                <div className="mt-6 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-100 text-sm flex gap-2">
                  <ExclamationTriangleIcon className="w-5 h-5 shrink-0" />
                  QR is not configured yet. Ask admin to set PRO_UPGRADE_QR_IMAGE_URL in system config.
                </div>
              )}

              {instructions.paymentNote && (
                <p className="mt-4 text-xs text-gray-400">{instructions.paymentNote}</p>
              )}
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-4">2. Submit Upgrade Request</h2>

              {isApproved && (
                <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-100 text-sm">
                  Your account is already on {user?.subscription || "a paid"} plan.
                </div>
              )}

              {isPending && (
                <div className="mb-4 rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 text-blue-100 text-sm flex items-center gap-2">
                  <ClockIcon className="w-5 h-5" />
                  Request pending since {new Date(latestRequest.requestedAt).toLocaleString()}.
                </div>
              )}

              {!isApproved && (
                <div className="space-y-3">
                  <input
                    value={formData.transactionRef}
                    onChange={(e) => setFormData((s) => ({ ...s, transactionRef: e.target.value }))}
                    placeholder="Transaction Ref / UTR Number *"
                    className="w-full rounded-xl border border-white/10 bg-[#1e293b] px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-blue-500/60"
                    disabled={isPending || processing}
                  />
                  <input
                    value={formData.payerName}
                    onChange={(e) => setFormData((s) => ({ ...s, payerName: e.target.value }))}
                    placeholder="Payer Name (optional)"
                    className="w-full rounded-xl border border-white/10 bg-[#1e293b] px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-blue-500/60"
                    disabled={isPending || processing}
                  />
                  <input
                    value={formData.paymentScreenshotUrl}
                    onChange={(e) => setFormData((s) => ({ ...s, paymentScreenshotUrl: e.target.value }))}
                    placeholder="Payment Screenshot URL (optional)"
                    className="w-full rounded-xl border border-white/10 bg-[#1e293b] px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-blue-500/60"
                    disabled={isPending || processing}
                  />
                  <textarea
                    value={formData.payerNote}
                    onChange={(e) => setFormData((s) => ({ ...s, payerNote: e.target.value }))}
                    placeholder="Note for admin (optional)"
                    rows={3}
                    className="w-full rounded-xl border border-white/10 bg-[#1e293b] px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-blue-500/60"
                    disabled={isPending || processing}
                  />

                  <button
                    onClick={handleSubmitRequest}
                    disabled={isPending || processing}
                    className="w-full py-3.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 disabled:bg-white/10 disabled:text-gray-400 disabled:cursor-not-allowed transition"
                  >
                    {processing ? "Submitting..." : isPending ? "Request Already Pending" : "Submit For Admin Approval"}
                  </button>
                </div>
              )}

              {latestRequest?.reviewNote && (
                <div className="mt-4 text-xs text-gray-400">
                  Last admin note: {latestRequest.reviewNote}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}