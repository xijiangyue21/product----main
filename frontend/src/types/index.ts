// ============================================
// API Response
// ============================================
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// ============================================
// User
// ============================================
export interface User {
  id: string;
  name: string;
  email: string;
  theme: string;
  refreshRate: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Market
// ============================================
export interface MarketIndex {
  code: string;
  name: string;
  price: string;
  change: string;
  changePercent: string;
}

export interface StockQuote {
  symbol: string;
  name: string;
  price: string;
  change: string;
  changePercent: string;
  open: string;
  high: string;
  low: string;
  volume: string;
  pe: string;
  pb: string;
  roe: string;
  revenueGrowth: string;
  orderBook: OrderBook;
}

export interface StockListItem {
  code: string;
  symbol: string;
  name: string;
  price: string;
  changePercent: string;
}

export interface OrderBookEntry {
  level: string;
  price: string;
  volume: number;
}

export interface OrderBook {
  asks: OrderBookEntry[];
  bids: OrderBookEntry[];
}

export interface Sector {
  name: string;
  changePercent: string;
  width: number;
}

export interface NewsItem {
  id: string;
  category: string;
  categoryType: string;
  title: string;
  time: string;
  symbol: string | null;
  image: string;
}

export interface Fundamentals {
  symbol: string;
  name: string;
  pe: string;
  pb: string;
  roe: string;
  revenueGrowth: string;
  events: FundamentalEvent[];
}

export interface FundamentalEvent {
  date: string;
  title: string;
  type: string;
}

export interface KLinePoint {
  date: string;
  open: string;
  close: string;
  high: string;
  low: string;
  volume: number;
}

// ============================================
// Watchlist
// ============================================
export interface WatchlistGroup {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface WatchlistItem {
  id: string;
  groupId: string;
  userId: string;
  symbol: string;
  name: string;
  createdAt: string;
}

// ============================================
// Portfolio
// ============================================
export interface PortfolioHolding {
  id: string;
  userId: string;
  symbol: string;
  name: string;
  shares: string;
  costPrice: string;
  currentPrice: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Alerts
// ============================================
export type AlertConditionType = 'price_above' | 'price_below' | 'change_above' | 'change_below';
export type AlertStatus = 'active' | 'paused' | 'triggered';

export interface Alert {
  id: string;
  userId: string;
  symbol: string;
  stockName: string;
  conditionType: AlertConditionType;
  conditionValue: string;
  notifyApp: boolean;
  notifySms: boolean;
  notifyWechat: boolean;
  status: AlertStatus;
  triggerCount: number;
  lastTriggeredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AlertHistoryItem {
  id: string;
  alertId: string;
  userId: string;
  symbol: string;
  stockName: string;
  triggerPrice: string;
  conditionType: string;
  conditionValue: string;
  triggeredAt: string;
}

// ============================================
// Navigation
// ============================================
export type ViewType = 'market' | 'watchlist' | 'portfolio' | 'alerts' | 'news' | 'profile';
