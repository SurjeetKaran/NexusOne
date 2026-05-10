

// src/components/Admin/Users.jsx
import React, { useState } from "react";
import API from "../../api/axios";
import { useAdminDashboardStore } from "../../store/adminDashboardStore";
import { motion, AnimatePresence } from "framer-motion";
import UsageDetails from "./UsageDetails";
import log from "../../utils/logger";

import {
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChartBarSquareIcon,
} from "@heroicons/react/24/outline";

export default function Users({ openUserUsage }) {
  const { dashboardData, fetchDashboard } = useAdminDashboardStore();
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [editModeUserId, setEditModeUserId] = useState(null);
  const [selectedSubscription, setSelectedSubscription] = useState("");
  const [message, setMessage] = useState(null);
  const [usageUserId, setUsageUserId] = useState(null);
  const [usageUserName, setUsageUserName] = useState(null);

  if (!dashboardData) return <div className="p-8 text-gray-500 text-center animate-pulse">Loading Users...</div>;

  const usersList = Array.isArray(dashboardData.usersList) ? dashboardData.usersList : [];

  const handleEditClick = (e, user) => {
    e.stopPropagation();
    setEditModeUserId(user._id);
    setSelectedSubscription(user.subscription || "Free");
  };

  const handleSaveClick = async (e, user) => {
    e.stopPropagation();
    try {
      await API.patch(`/admin/user/${user._id}`, { subscription: selectedSubscription });
      setEditModeUserId(null);
      fetchDashboard();
      showMessage("User updated", "success");
    } catch (err) {
      log('ERROR', 'Failed to update user subscription', err?.response?.data || err);
      showMessage("Update failed", "error");
    }
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="bg-[#1e293b]/50 p-4 rounded-2xl border border-white/5">
          <h2 className="text-xl font-bold text-white">User Management</h2>
          <p className="text-sm text-gray-400">Manage users & subscriptions.</p>
        </div>

        {usersList.length === 0 ? (
          <div className="p-10 text-center text-gray-500 bg-[#1e293b]/30 rounded-xl border border-white/5">
            No users found.
          </div>
        ) : usersList.map((user) => {
          const isExpanded = expandedUserId === user._id;
          const isEditing = editModeUserId === user._id;
          const avatar = user.name?.charAt(0).toUpperCase() || "U";

          return (
            <motion.div key={user._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`bg-[#1e293b]/40 border border-white/5 rounded-xl hover:border-white/10 ${isExpanded ? 'border-blue-500/20' : ''}`}>
              {/* Row header */}
              <div onClick={() => setExpandedUserId(isExpanded ? null : user._id)} className="p-3 md:p-4 flex items-center justify-between gap-2 cursor-pointer">
                {/* Left: avatar + name */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">{avatar}</div>
                  <div className="min-w-0">
                    <h3 className="text-white font-medium text-sm truncate">{user.name}</h3>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>

                {/* Right: badge + actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`hidden sm:inline-flex px-2.5 py-1 text-[10px] rounded-full uppercase border ${
                    user.subscription === 'Pro' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                    user.subscription === 'Super' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                    user.subscription === 'Trial' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>{user.subscription}</span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (typeof openUserUsage === "function") {
                        openUserUsage(user._id, user.name);
                      } else {
                        setUsageUserId(user._id);
                        setUsageUserName(user.name || "User");
                      }
                    }}
                    className="p-1.5 bg-white/5 rounded-lg hover:bg-white/10 text-gray-300"
                    title="View usage"
                  >
                    <ChartBarSquareIcon className="w-4 h-4" />
                  </button>

                  {isExpanded ? <ChevronUpIcon className="w-4 h-4 text-gray-500" /> : <ChevronDownIcon className="w-4 h-4 text-gray-500" />}
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden border-t border-white/5 bg-[#0f172a]/30">
                    <div className="p-4 md:p-6 space-y-4">
                      {/* Edit / Save buttons */}
                      <div className="flex justify-end gap-2">
                        {isEditing ? (
                          <>
                            <button onClick={(e) => { e.stopPropagation(); setEditModeUserId(null); }} className="p-2 bg-gray-700 rounded-lg text-gray-300"><XMarkIcon className="w-4 h-4" /></button>
                            <button onClick={(e) => handleSaveClick(e, user)} className="p-2 bg-blue-600 rounded-lg text-white"><CheckIcon className="w-4 h-4" /></button>
                          </>
                        ) : (
                          <button onClick={(e) => handleEditClick(e, user)} className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-white"><PencilSquareIcon className="w-4 h-4" /></button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Show subscription badge on mobile inside expanded */}
                        <div className="sm:hidden">
                          <label className="text-xs text-gray-500 uppercase block mb-1">Plan</label>
                          <span className={`inline-flex px-2.5 py-1 text-[10px] rounded-full uppercase border ${
                            user.subscription === 'Pro' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                            user.subscription === 'Super' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                            user.subscription === 'Trial' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}>{user.subscription}</span>
                        </div>

                        <DetailItem label="Full Name" value={user.name || "—"} />
                        <DetailItem label="Joined" value={user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"} />
                        <DetailItem label="Queries Today" value={user.dailyQueryCount ?? 0} />

                        <div>
                          <label className="text-xs text-gray-400 block mb-2">Subscription</label>
                          {isEditing ? (
                            <div className="flex flex-wrap gap-2">
                              {['Trial','Free','Pro','Super'].map(p => (
                                <button key={p} onClick={(e) => { e.stopPropagation(); setSelectedSubscription(p); }} className={`px-3 py-1.5 rounded-lg border text-sm ${selectedSubscription === p ? 'bg-blue-600 text-white border-blue-600' : 'bg-transparent text-gray-400 border-gray-600'}`}>{p}</button>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-300 text-sm">{user.subscription}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {message && (<div className={`fixed bottom-6 right-6 px-6 py-3 rounded-xl text-white text-sm ${message.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>{message.text}</div>)}

      {!openUserUsage && usageUserId && (
        <UsageDetails userId={usageUserId} userName={usageUserName} onBack={() => { setUsageUserId(null); setUsageUserName(null); }} />
      )}
    </>
  );
}

const DetailItem = ({ label, value }) => (
  <div>
    <label className="text-xs text-gray-500 uppercase block mb-1">{label}</label>
    <p className="text-gray-300 text-sm font-medium">{value ?? "—"}</p>
  </div>
);
