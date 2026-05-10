

import { create } from "zustand";
import API from "../api/axios";
import log from "../utils/logger";
import { useChatStore } from "./chatStore";

/* ----------------------------------------------------------------
 🔐 AUTH STORE
 Manages login/logout state for both Users and Admins.
 Handles tokens, role-based authentication, and resets chat data.
------------------------------------------------------------------ */

const initialState = {
  token: localStorage.getItem("token") || null,
  user: null,
  role: localStorage.getItem("role") || "user",
  subscription: "Free",
  dailyQueryCount: 0,
  dailyChatCount: 0,
};

export const useAuthStore = create((set) => ({
  ...initialState,

  login: ({ token, user = null, role = "user" }) => {
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    set({
      token,
      user,
      role,
      subscription: user?.subscription || "Free",
      dailyQueryCount: user?.dailyQueryCount || 0,
      dailyChatCount: user?.dailyChatCount || 0,
    });
  },

  logout: () => {
    const role = localStorage.getItem("role") || "user";

    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");

    console.log(`👋 ${role === "admin" ? "Admin" : "User"} logged out.`);

    set({ ...initialState, token: null, user: null, role: "user" });

    // Reset chat store
  useChatStore.getState().resetChatStore();

  },

  setSubscription: (subscription) => set({ subscription }),
  
  setDailyQueryCount: (count) => set((state) => ({
    dailyQueryCount: count,
    user: state.user ? { ...state.user, dailyQueryCount: count } : state.user
  })),

  incrementQueryCount: () =>
    set((state) => {
      const newCount = (state.user?.dailyQueryCount || 0) + 1;
      return {
        dailyQueryCount: newCount,
        user: state.user ? { ...state.user, dailyQueryCount: newCount } : state.user,
      };
    }),

  incrementChatCount: () =>
    set((state) => {
      const newCount = (state.user?.dailyChatCount || 0) + 1;
      return {
        dailyChatCount: newCount,
        user: state.user ? { ...state.user, dailyChatCount: newCount } : state.user,
      };
    }),

  fetchUser: async () => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role") || "user";

    if (!token || role !== "user") return;

    try {
      const res = await API.get("/auth/getme", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const user = res.data.user;
      set({
        user,
        subscription: user?.subscription || "Free",
        dailyQueryCount: user?.dailyQueryCount || 0,
        dailyChatCount: user?.dailyChatCount || 0,
      });
    } catch (err) {
      log('ERROR', 'Failed to fetch user info', { error: err.message || err });
      set({ ...initialState });
    }
  },
}));