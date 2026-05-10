import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import API from "../../api/axios";
import { useAdminDashboardStore } from "../../store/adminDashboardStore";
import log from "../../utils/logger";
import {
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";

export default function ProRequests() {
  const { dashboardData, fetchDashboard } = useAdminDashboardStore();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reviewingId, setReviewingId] = useState(null);
  const [message, setMessage] = useState(null);

  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await API.get("/admin/pro-upgrade-requests");
      setRequests(res.data || []);
    } catch (err) {
      log("ERROR", "Failed to fetch pro requests", err?.response?.data || err);
      showMessage("Failed to load pro requests", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleReview = async (requestId, action) => {
    try {
      setReviewingId(requestId);
      await API.patch(`/admin/pro-upgrade-requests/${requestId}/review`, {
        action,
        reviewNote:
          action === "approve"
            ? "Payment verified by admin."
            : "Payment proof invalid or incomplete.",
      });

      showMessage(action === "approve" ? "Request approved" : "Request rejected");
      await Promise.all([fetchRequests(), fetchDashboard()]);
    } catch (err) {
      log("ERROR", "Failed to review pro request", err?.response?.data || err);
      showMessage("Failed to review request", "error");
    } finally {
      setReviewingId(null);
    }
  };

  const pendingCount = dashboardData?.userStats?.pendingProUpgradeRequests || 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="panel-elevated p-5 md:p-6 rounded-3xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-text-dim">Approvals</div>
            <h2 className="mt-2 text-2xl md:text-3xl font-display font-bold text-white">Pro Requests</h2>
            <p className="text-sm text-text-dim mt-2 max-w-2xl">Review QR/UPI payment requests and approve upgrades after verification.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-200 text-sm font-semibold">
              {pendingCount} Pending
            </div>
            <button
              onClick={fetchRequests}
              className="p-2.5 rounded-2xl bg-white/5 text-gray-300 hover:bg-white/10 border border-white/5 transition"
            >
              <ArrowPathIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="panel-elevated p-10 text-center text-text-dim rounded-3xl animate-pulse">Loading Pro requests...</div>
      ) : requests.length === 0 ? (
        <div className="panel-elevated p-10 text-center text-text-dim rounded-3xl">
          No Pro upgrade requests yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {requests.map((request) => {
            const isPending = request.status === "pending";

            return (
              <motion.div
                key={request._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="panel-elevated rounded-3xl p-5 md:p-6 space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-lg font-semibold text-white">
                        {request.user?.name || "Unknown user"}
                      </h3>
                      <span
                        className={`px-2 py-1 text-[10px] uppercase rounded-full border ${
                          request.status === "approved"
                            ? "bg-blue-500/10 text-blue-300 border-blue-500/20"
                            : request.status === "rejected"
                            ? "bg-red-500/10 text-red-300 border-red-500/20"
                            : "bg-amber-500/10 text-amber-200 border-amber-500/20"
                        }`}
                      >
                        {request.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">
                      {request.user?.email || "No email available"}
                    </p>
                    <div className="text-xs text-gray-500 flex flex-wrap gap-4">
                      <span>
                        Amount: {request.currency || "INR"} {request.amount}
                      </span>
                      <span>Plan: {request.planName || "Pro"}</span>
                      <span>Method: {request.paymentMethod || "QR"}</span>
                      <span>
                        Requested: {request.requestedAt ? new Date(request.requestedAt).toLocaleString() : "N/A"}
                      </span>
                    </div>
                  </div>

                  {request.paymentScreenshotUrl && (
                    <a
                      href={request.paymentScreenshotUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 text-gray-300 hover:bg-white/10 border border-white/5 transition"
                    >
                      <LinkIcon className="w-4 h-4" />
                      Screenshot
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <InfoBlock label="Transaction Ref" value={request.transactionRef} />
                  <InfoBlock label="Payer Name" value={request.payerName || "-"} />
                  <InfoBlock label="Payer Note" value={request.payerNote || "-"} fullWidth />
                  <InfoBlock label="Review Note" value={request.reviewNote || "-"} fullWidth />
                </div>

                {isPending && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      onClick={() => handleReview(request._id, "approve")}
                      disabled={reviewingId === request._id}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-60"
                    >
                      <CheckIcon className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReview(request._id, "reject")}
                      disabled={reviewingId === request._id}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white disabled:opacity-60"
                    >
                      <XMarkIcon className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {message && (
        <div className={`fixed bottom-6 right-6 px-6 py-3 rounded-xl text-white ${message.type === "success" ? "bg-green-600" : "bg-red-600"}`}>
          {message.text}
        </div>
      )}
    </div>
  );
}

function InfoBlock({ label, value, fullWidth = false }) {
  return (
    <div className={fullWidth ? "md:col-span-2" : ""}>
      <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">{label}</div>
      <div className="text-sm text-gray-200 break-words">{value}</div>
    </div>
  );
}