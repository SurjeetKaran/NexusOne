const ALLOWED_SUBSCRIPTIONS = ["Trial", "Free", "Pro", "Super"];
const ALLOWED_MODES = ["study", "content", "career"];

const PLAN_LIMITS = {
  Trial: {
    dailyNewChatLimit: 10,
    conversationMessageLimit: 50,
    historyDays: 1,
  },
  Free: {
    dailyNewChatLimit: 10,
    conversationMessageLimit: 10,
    historyDays: 1,
  },
  Pro: {
    dailyNewChatLimit: 20,
    conversationMessageLimit: 50,
    historyDays: 10,
  },
  Super: {
    dailyNewChatLimit: 50,
    conversationMessageLimit: 100,
    historyDays: 30,
  },
};

const ROLE_LIMITS = {
  admin: {
    dailyNewChatLimit: Infinity,
    conversationMessageLimit: Infinity,
    historyDays: Infinity,
  },
};

function normalizeSubscription(subscription) {
  if (ALLOWED_SUBSCRIPTIONS.includes(subscription)) {
    return subscription;
  }
  return "Free";
}

function getAccessPolicy(account = {}) {
  const role = account.role || "user";
  const subscription = normalizeSubscription(account.subscription);

  if (role === "admin") {
    return {
      role,
      subscription,
      ...ROLE_LIMITS.admin,
      isLimited: false,
    };
  }

  return {
    role,
    subscription,
    ...PLAN_LIMITS[subscription],
    isLimited: true,
  };
}

function getHistoryStartDate(account = {}, now = new Date()) {
  const { historyDays } = getAccessPolicy(account);

  if (!Number.isFinite(historyDays)) {
    return null;
  }

  if (historyDays <= 1) {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  return new Date(now.getTime() - historyDays * 24 * 60 * 60 * 1000);
}

function getModelSelectionLimit(subscription) {
  const normalized = normalizeSubscription(subscription);

  if (normalized === "Free") return 1;
  if (normalized === "Pro") return 3;
  return Infinity;
}

function getMessageCost(subscription, activeModelsLength) {
  const normalized = normalizeSubscription(subscription);
  const modelCount = Math.max(1, Number(activeModelsLength) || 0);

  if (normalized === "Free") {
    return 1;
  }

  return modelCount;
}

function isModeAllowed(mode) {
  return ALLOWED_MODES.includes(String(mode || "").trim().toLowerCase());
}

module.exports = {
  ALLOWED_SUBSCRIPTIONS,
  ALLOWED_MODES,
  PLAN_LIMITS,
  ROLE_LIMITS,
  getAccessPolicy,
  getHistoryStartDate,
  getModelSelectionLimit,
  getMessageCost,
  isModeAllowed,
  normalizeSubscription,
};