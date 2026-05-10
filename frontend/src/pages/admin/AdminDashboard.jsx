// src/pages/AdminDashboard.jsx
import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../../components/admin/Sidebar";
import LoadingSpinner from "../../components/shared/LoadingSpinner";

// Admin Sections
import Home from "../../components/admin/Home";
import Users from "../../components/admin/Users";
import Plans from "../../components/admin/Plans";
import ApiKeys from "../../components/admin/ApiKeys";
import SystemSettings from "../../components/admin/SystemSettings";
import ProRequests from "../../components/admin/ProRequests";
import UsageDetails from "../../components/admin/UsageDetails";

// Store
import { useAdminDashboardStore } from "../../store/adminDashboardStore";

const MOBILE_BREAKPOINT = 768;

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(
    () => true
  );

  const [activeTab, setActiveTab] = useState("Home");
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUserName, setSelectedUserName] = useState("");
  const [previousTab, setPreviousTab] = useState("Home");

  const { dashboardData, loading, fetchDashboard } = useAdminDashboardStore();

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const toggleSidebar = useCallback(() => setSidebarOpen((s) => !s), []);

  const openUserUsage = ({ userId, userName, fromTab }) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setPreviousTab(fromTab);
    setActiveTab(`Usage – ${userName}`);
  };

  const handleBackFromUsage = () => {
    setActiveTab(previousTab);
    setSelectedUserId(null);
    setSelectedUserName("");
  };

  if (loading || !dashboardData)
    return <LoadingSpinner message="Loading Admin Dashboard..." />;

  const renderContent = () => {
    if (activeTab.startsWith("Usage –") && selectedUserId) {
      return (
        <UsageDetails
          userId={selectedUserId}
          userName={selectedUserName}
          onBack={handleBackFromUsage}
        />
      );
    }

    switch (activeTab) {
      case "Home":
        return <Home />;
      case "User Management":
        return (
          <Users
            openUserUsage={(id, name) =>
              openUserUsage({ userId: id, userName: name, fromTab: "User Management" })
            }
          />
        );
      case "Plan Management":
        return <Plans />;
      case "Pro Requests":
        return <ProRequests />;
      case "API Keys":
        return <ApiKeys />;
      case "System Config":
        return <SystemSettings />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="flex h-screen app-shell text-white overflow-hidden font-body">
      <Sidebar
        sidebarOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto thin-scrollbar px-4 py-5 md:px-8 md:py-7 pt-16 md:pt-7">
          {!activeTab.startsWith("Usage –") && (
            <div className="panel-elevated mb-6 rounded-2xl md:rounded-3xl px-5 py-4 md:px-7 md:py-6">
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-text-dim">
                    Admin Console
                  </div>
                  <h1 className="mt-1 text-2xl md:text-4xl font-display font-bold bg-brand-main bg-clip-text text-transparent inline-block">
                    {activeTab}
                  </h1>
                </div>
                <p className="max-w-xl text-sm text-text-dim leading-relaxed md:text-right hidden md:block">
                  Manage users, approvals, and system settings from one workspace.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-5 md:space-y-6">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}
