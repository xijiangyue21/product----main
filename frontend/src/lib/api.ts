import { API_BASE_URL } from '@/config/constants';
import type {
  ApiResponse, MarketIndex, StockQuote, StockListItem, Sector, NewsItem,
  Fundamentals, KLinePoint, WatchlistGroup, WatchlistItem, PortfolioHolding,
  Alert, AlertHistoryItem, User,
} from '@/types';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const apiFetch = async <T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> => {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: { ...getAuthHeaders(), ...(options?.headers || {}) },
  });
  return response.json() as Promise<ApiResponse<T>>;
};

// ============================================
// Market
// ============================================
export const marketApi = {
  getIndices: () => apiFetch<MarketIndex[]>('/api/market/indices'),
  getQuote: (code: string) => apiFetch<StockQuote>(`/api/market/quote/${code}`),
  getStocks: () => apiFetch<StockListItem[]>('/api/market/stocks'),
  getSectors: () => apiFetch<Sector[]>('/api/market/sectors'),
  getNews: (category?: string) => apiFetch<NewsItem[]>(`/api/market/news${category ? `?category=${category}` : ''}`),
  getFundamentals: (code: string) => apiFetch<Fundamentals>(`/api/market/fundamentals/${code}`),
  getKLine: (code: string) => apiFetch<KLinePoint[]>(`/api/market/kline/${code}`),
  getStockRank: () => apiFetch<any[]>('/api/market/stock-rank'),
};

// ============================================
// Watchlist
// ============================================
export const watchlistApi = {
  getGroups: () => apiFetch<WatchlistGroup[]>('/api/watchlist/groups'),
  createGroup: (name: string) => apiFetch<WatchlistGroup>('/api/watchlist/groups', {
    method: 'POST',
    body: JSON.stringify({ name }),
  }),
  deleteGroup: (id: string) => apiFetch<null>(`/api/watchlist/groups/${id}`, { method: 'DELETE' }),
  getItems: () => apiFetch<WatchlistItem[]>('/api/watchlist/items'),
  getItemsByGroup: (groupId: string) => apiFetch<WatchlistItem[]>(`/api/watchlist/groups/${groupId}/items`),
  addItem: (groupId: string, symbol: string, name: string) =>
    apiFetch<WatchlistItem>('/api/watchlist/items', {
      method: 'POST',
      body: JSON.stringify({ groupId, symbol, name }),
    }),
  removeItem: (id: string) => apiFetch<null>(`/api/watchlist/items/${id}`, { method: 'DELETE' }),
};

// ============================================
// Portfolio
// ============================================
export const portfolioApi = {
  getHoldings: () => apiFetch<PortfolioHolding[]>('/api/portfolio'),
  createHolding: (data: { symbol: string; name: string; shares: string; costPrice: string; currentPrice?: string }) =>
    apiFetch<PortfolioHolding>('/api/portfolio', { method: 'POST', body: JSON.stringify(data) }),
  updateHolding: (id: string, data: Partial<{ shares: string; costPrice: string; currentPrice: string }>) =>
    apiFetch<PortfolioHolding>(`/api/portfolio/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteHolding: (id: string) => apiFetch<null>(`/api/portfolio/${id}`, { method: 'DELETE' }),
};

// ============================================
// Alerts
// ============================================
export const alertsApi = {
  getAlerts: () => apiFetch<Alert[]>('/api/alerts'),
  createAlert: (data: {
    symbol: string; stockName: string; conditionType: string;
    conditionValue: string; notifyApp?: boolean; notifySms?: boolean; notifyWechat?: boolean;
  }) => apiFetch<Alert>('/api/alerts', { method: 'POST', body: JSON.stringify(data) }),
  updateAlert: (id: string, data: Partial<Alert>) =>
    apiFetch<Alert>(`/api/alerts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAlert: (id: string) => apiFetch<null>(`/api/alerts/${id}`, { method: 'DELETE' }),
  getHistory: () => apiFetch<AlertHistoryItem[]>('/api/alerts/history'),
};

// ============================================
// Feedback
// ============================================
export const feedbackApi = {
  submit: (content: string) => apiFetch<{ id: string }>('/api/feedback', {
    method: 'POST',
    body: JSON.stringify({ content }),
  }),
};

// ============================================
// Auth
// ============================================
export const authApi = {
  me: () => apiFetch<User>('/api/auth/me'),
};
