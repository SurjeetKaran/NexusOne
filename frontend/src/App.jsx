import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import { useChatStore } from "./store/chatStore";

/* =====================================================
 * PAGES
 * ===================================================== */
import LandingPage from "./pages/public/LandingPage";
import LoginPage from "./pages/public/LoginPage";
import SignupPage from "./pages/public/SignupPage";
import DashboardPage from "./pages/user/DashboardPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import PaymentPage from "./pages/user/PaymentPage";
import ForgotPassword from "./pages/public/ForgotPassword";
import ResetPassword from "./pages/public/ResetPassword";
import SocialPopupHandler from "./components/shared/SocialPopupHandler";

function App() {
  const { user, fetchUser } = useAuthStore();
  const loadModels = useChatStore((s) => s.loadModels);

  useEffect(() => {
    const boot = async () => {
      if (!user) {
        await fetchUser();
        return;
      }
      await loadModels();
    };
    boot();
  }, [user, fetchUser, loadModels]);

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/social-auth-popup" element={<SocialPopupHandler />} />

      {/* User */}
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/payment" element={<PaymentPage />} />

      {/* Admin */}
      <Route path="/admin" element={<AdminDashboard />} />
    </Routes>
  );
}

export default App;
