import { API_BASE_URL } from "@/config/constants";
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};
const apiFetch = async (url, options) => {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: { ...getAuthHeaders(), ...(options?.headers || {}) },
  });
  return response.json();
};
// ============================================
// Market
// ============================================
export const marketApi = {
  getIndices: () => apiFetch("/api/market/indices"),
  getQuote: (code) => apiFetch(`/api/market/quote/${code}`),
  getStocks: () => apiFetch("/api/market/stocks"),
  searchStocks: (query) =>
    apiFetch(`/api/market/search?q=${encodeURIComponent(query)}`),
  getSectors: () => apiFetch("/api/market/sectors"),
  getNews: (category) =>
    apiFetch(`/api/market/news${category ? `?category=${category}` : ""}`),
  getFundamentals: (code) => apiFetch(`/api/market/fundamentals/${code}`),
  getKLine: (code) => apiFetch(`/api/market/kline/${code}`),
  getStockRank: () => apiFetch("/api/market/stock-rank"),
};
// ============================================
// Watchlist
// ============================================
export const watchlistApi = {
  getGroups: () => apiFetch("/api/watchlist/groups"),
  createGroup: (name) =>
    apiFetch("/api/watchlist/groups", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  deleteGroup: (id) =>
    apiFetch(`/api/watchlist/groups/${id}`, { method: "DELETE" }),
  getItems: () => apiFetch("/api/watchlist/items"),
  getItemsByGroup: (groupId) =>
    apiFetch(`/api/watchlist/groups/${groupId}/items`),
  addItem: (groupId, symbol, name) =>
    apiFetch("/api/watchlist/items", {
      method: "POST",
      body: JSON.stringify({ groupId, symbol, name }),
    }),
  removeItem: (id) =>
    apiFetch(`/api/watchlist/items/${id}`, { method: "DELETE" }),
};
// ============================================
// Portfolio
// ============================================
export const portfolioApi = {
  getHoldings: () => apiFetch("/api/portfolio"),
  createHolding: (data) =>
    apiFetch("/api/portfolio", { method: "POST", body: JSON.stringify(data) }),
  updateHolding: (id, data) =>
    apiFetch(`/api/portfolio/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteHolding: (id) => apiFetch(`/api/portfolio/${id}`, { method: "DELETE" }),
};
// ============================================
// Alerts
// ============================================
export const alertsApi = {
  getAlerts: () => apiFetch("/api/alerts"),
  createAlert: (data) =>
    apiFetch("/api/alerts", { method: "POST", body: JSON.stringify(data) }),
  updateAlert: (id, data) =>
    apiFetch(`/api/alerts/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteAlert: (id) => apiFetch(`/api/alerts/${id}`, { method: "DELETE" }),
  getHistory: () => apiFetch("/api/alerts/history"),
};
// ============================================
// Feedback
// ============================================
export const feedbackApi = {
  submit: (content) =>
    apiFetch("/api/feedback", {
      method: "POST",
      body: JSON.stringify({ content }),
    }),
};
// ============================================
// Auth
// ============================================
export const authApi = {
  me: () => apiFetch("/api/auth/me"),
  updatePreferences: (data) =>
    apiFetch("/api/auth/preferences", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};
