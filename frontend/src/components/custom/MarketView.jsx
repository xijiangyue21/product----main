import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { marketApi } from "@/lib/api";
import { MARKET_AI_INSIGHTS, MARKET_PERIODS } from "@/constants/market";
import {
  REFRESH_RATE_CHANGE_EVENT,
  getRefreshRateLabel,
  getStoredRefreshRate,
} from "@/lib/preferences";

const INDEX_NAME_BY_CODE = {
  SH000001: "上证指数",
  SZ399001: "深证成指",
  SZ399006: "创业板指",
  SH000300: "沪深300",
  "HK.HSI": "恒生指数",
  NASDAQ: "纳斯达克",
};

const INDEX_NAME_BY_LABEL = {
  "Shanghai Composite": "上证指数",
  "Shenzhen Component": "深证成指",
  ChiNext: "创业板指",
  "CSI 300": "沪深300",
  "Hang Seng": "恒生指数",
  NASDAQ: "纳斯达克",
};

const STOCK_NAME_BY_CODE = {
  "600519": "贵州茅台",
  "300750": "宁德时代",
  "600036": "招商银行",
  "002594": "比亚迪",
  "688981": "中芯国际",
  "601012": "隆基绿能",
  "300059": "东方财富",
};

const STOCK_NAME_BY_LABEL = {
  "Kweichow Moutai": "贵州茅台",
  CATL: "宁德时代",
  "China Merchants Bank": "招商银行",
  BYD: "比亚迪",
  SMIC: "中芯国际",
  LONGi: "隆基绿能",
  "East Money": "东方财富",
};

function getIndexDisplayName(indexItem) {
  return (
    INDEX_NAME_BY_CODE[indexItem.code] ??
    INDEX_NAME_BY_LABEL[indexItem.name] ??
    indexItem.name
  );
}

function getStockDisplayName(stock) {
  if (!stock) {
    return "";
  }

  return (
    STOCK_NAME_BY_CODE[stock.code] ??
    STOCK_NAME_BY_LABEL[stock.name] ??
    stock.name
  );
}

function MiniChart({ points, positive }) {
  if (points.length < 2) {
    return null;
  }

  const prices = points.map((point) => Number.parseFloat(point.close));
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const width = 300;
  const height = 80;
  const polyline = prices
    .map((price, index) => {
      const x = (index / (prices.length - 1)) * width;
      const y = height - ((price - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");
  const fillPoints = `0,${height} ${polyline} ${width},${height}`;
  const color = positive ? "#16A34A" : "#EF4444";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-full w-full"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient
          id={`market-grad-${positive}`}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
      />
      <polygon points={fillPoints} fill={`url(#market-grad-${positive})`} />
    </svg>
  );
}

export default function MarketView({ selectedStock, onSelectStock }) {
  const [indices, setIndices] = useState([]);
  const [stockRank, setStockRank] = useState([]);
  const [quote, setQuote] = useState(null);
  const [kline, setKline] = useState([]);
  const [period, setPeriod] = useState(() => MARKET_PERIODS[1] ?? "日线");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshRate, setRefreshRate] = useState(() => getStoredRefreshRate());
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [time, setTime] = useState(new Date());
  const activeRequestCountRef = useRef(0);
  const latestRequestIdRef = useRef(0);

  const fetchData = useCallback(
    async ({ showLoading = false } = {}) => {
      const requestId = latestRequestIdRef.current + 1;
      latestRequestIdRef.current = requestId;
      activeRequestCountRef.current += 1;
      setRefreshing(true);

      if (showLoading) {
        setLoading(true);
      }

      try {
        const [indicesResponse, quoteResponse, klineResponse, rankResponse] =
          await Promise.all([
            marketApi.getIndices(),
            marketApi.getQuote(selectedStock),
            marketApi.getKLine(selectedStock),
            marketApi.getStockRank(),
          ]);

        if (requestId !== latestRequestIdRef.current) {
          return;
        }

        if (indicesResponse.success) {
          setIndices(indicesResponse.data);
        }

        if (quoteResponse.success) {
          setQuote(quoteResponse.data);
        }

        if (klineResponse.success) {
          setKline(klineResponse.data);
        }

        if (rankResponse.success) {
          setStockRank(rankResponse.data);
        }

        setLastUpdatedAt(new Date());
      } finally {
        activeRequestCountRef.current -= 1;

        if (
          showLoading &&
          requestId === latestRequestIdRef.current
        ) {
          setLoading(false);
        }

        if (activeRequestCountRef.current <= 0) {
          setRefreshing(false);
        }
      }
    },
    [selectedStock],
  );

  useEffect(() => {
    void fetchData({ showLoading: true });
  }, [fetchData]);

  useEffect(() => {
    const syncRefreshRate = () => {
      setRefreshRate(getStoredRefreshRate());
    };

    const handleRefreshRateChange = (event) => {
      setRefreshRate(event.detail);
    };

    window.addEventListener("focus", syncRefreshRate);
    window.addEventListener("storage", syncRefreshRate);
    window.addEventListener(
      REFRESH_RATE_CHANGE_EVENT,
      handleRefreshRateChange,
    );

    return () => {
      window.removeEventListener("focus", syncRefreshRate);
      window.removeEventListener("storage", syncRefreshRate);
      window.removeEventListener(
        REFRESH_RATE_CHANGE_EVENT,
        handleRefreshRateChange,
      );
    };
  }, []);

  useEffect(() => {
    if (loading || refreshRate <= 0) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      void fetchData();
    }, refreshRate * 1000);

    return () => window.clearInterval(timer);
  }, [fetchData, loading, refreshRate]);

  useEffect(() => {
    const timer = window.setInterval(() => setTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const isPositive = (value) => Number.parseFloat(value) >= 0;
  const refreshModeLabel =
    refreshRate === 0
      ? "手动刷新"
      : `自动刷新 ${getRefreshRateLabel(refreshRate)}`;
  const lastUpdatedLabel = lastUpdatedAt
    ? lastUpdatedAt.toLocaleTimeString("zh-CN")
    : "等待首次刷新";

  const stats = quote
    ? [
        { label: "今开", value: quote.open, color: "text-[var(--app-text)]" },
        { label: "最高", value: quote.high, color: "text-[#16A34A]" },
        { label: "最低", value: quote.low, color: "text-red-500" },
        {
          label: "成交量",
          value: quote.volume,
          color: "text-[var(--app-text)]",
        },
      ]
    : [];

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-sm">
        <div className="flex items-center gap-6 overflow-x-auto px-4 py-2.5 scrollbar-hide">
          {loading ? (
            <span className="text-xs font-mono text-[var(--app-muted)]">
              加载行情数据...
            </span>
          ) : (
            indices.map((indexItem) => (
              <div
                key={indexItem.code}
                className="flex items-center gap-2 whitespace-nowrap"
              >
                <span className="text-xs font-mono text-[var(--app-muted)]">
                  {getIndexDisplayName(indexItem)}
                </span>
                <span className="text-sm font-mono font-semibold text-[var(--app-text)]">
                  {indexItem.price}
                </span>
                <span
                  className={`text-xs font-mono font-semibold ${
                    isPositive(indexItem.changePercent)
                      ? "text-[#16A34A]"
                      : "text-red-500"
                  }`}
                >
                  {isPositive(indexItem.changePercent) ? "+" : ""}
                  {indexItem.changePercent}%
                </span>
              </div>
            ))
          )}

          <div className="ml-auto flex items-center gap-1.5 whitespace-nowrap">
            <span className="animate-pulse text-xs text-amber-500">实时</span>
            <span className="text-xs font-mono text-[var(--app-muted)]">
              {time.toLocaleTimeString("zh-CN")}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="overflow-hidden rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-sm lg:col-span-2">
          <div className="flex items-center gap-2 overflow-x-auto border-b border-[var(--app-border)] px-4 pb-2 pt-3 scrollbar-hide">
            {loading ? (
              <span className="text-xs font-mono text-[var(--app-muted)]">
                加载排行数据...
              </span>
            ) : (
              stockRank.map((stock, index) => (
                <button
                  key={stock.code}
                  onClick={() => onSelectStock(stock.code)}
                  className={`whitespace-nowrap rounded-lg px-3 py-1 text-xs font-mono transition-colors ${
                    selectedStock === stock.code
                      ? "border border-[#16A34A]/40 bg-[#16A34A]/10 text-[#16A34A]"
                      : "border border-[var(--app-border)] text-[var(--app-muted)] hover:border-[#16A34A]/30 hover:text-[var(--app-text)]"
                  }`}
                >
                  {index + 1}. {getStockDisplayName(stock)}
                </button>
              ))
            )}
          </div>

          {quote ? (
            <>
              <div className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xl font-bold text-[var(--app-text)]">
                      {getStockDisplayName(quote)}
                    </span>
                    <span className="text-sm font-mono text-[var(--app-muted)]">
                      {quote.symbol}
                    </span>
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-3">
                    <span className="font-mono text-3xl font-bold text-[var(--app-text)]">
                      {quote.price}
                    </span>
                    <span
                      className={`font-mono text-lg font-semibold ${
                        isPositive(quote.change)
                          ? "text-[#16A34A]"
                          : "text-red-500"
                      }`}
                    >
                      {isPositive(quote.change) ? "+" : ""}
                      {quote.change}
                    </span>
                    <span
                      className={`rounded px-2 py-0.5 text-sm font-mono ${
                        isPositive(quote.changePercent)
                          ? "bg-[#16A34A]/10 text-[#16A34A]"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {isPositive(quote.changePercent) ? "+" : ""}
                      {quote.changePercent}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {MARKET_PERIODS.map((currentPeriod) => (
                    <button
                      key={currentPeriod}
                      onClick={() => setPeriod(currentPeriod)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-mono transition-colors ${
                        period === currentPeriod
                          ? "border border-[#16A34A] bg-[#16A34A]/10 text-[#16A34A]"
                          : "border border-[var(--app-border)] text-[var(--app-muted)] hover:border-[#16A34A] hover:text-[#16A34A]"
                      }`}
                    >
                      {currentPeriod}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-48 px-5 pb-2">
                <MiniChart
                  points={kline}
                  positive={isPositive(quote.changePercent)}
                />
              </div>

              <div className="grid grid-cols-2 border-t border-[var(--app-border)] sm:grid-cols-4">
                {stats.map((stat, index) => (
                  <div
                    key={stat.label}
                    className={`px-4 py-3 ${
                      index < stats.length - 1
                        ? "border-b border-[var(--app-border)] sm:border-b-0 sm:border-r"
                        : ""
                    }`}
                  >
                    <div className="mb-1 text-xs font-mono text-[var(--app-muted)]">
                      {stat.label}
                    </div>
                    <div
                      className={`text-sm font-mono font-semibold ${stat.color}`}
                    >
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--app-text)]">
                智能分析
              </h3>
              <span className="animate-pulse text-xs font-mono text-[#16A34A]">
                实时
              </span>
            </div>

            <div className="space-y-3">
              {MARKET_AI_INSIGHTS.map((insight) => (
                <div
                  key={insight.label}
                  className="rounded-lg border border-[var(--app-border)] bg-[var(--app-bg)] p-3"
                >
                  <div className="mb-2 text-xs font-mono text-[#16A34A]">
                    {insight.label}
                  </div>

                  {insight.accent ? (
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 rounded-full bg-[var(--app-soft)]">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-[#16A34A]"
                          style={{ width: insight.accent }}
                        />
                      </div>
                      <span className="text-xs font-mono text-[var(--app-text)]">
                        {insight.value}
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs font-mono leading-relaxed text-[var(--app-text)]">
                      {insight.value}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="text-xs font-mono text-[var(--app-text)]">
            {refreshModeLabel}
          </div>
          <div className="text-xs font-mono text-[var(--app-muted)]">
            上次更新时间 {lastUpdatedLabel}
          </div>
        </div>

        <button
          onClick={() => void fetchData()}
          disabled={refreshing}
          className="flex items-center justify-center gap-2 rounded-lg border border-[var(--app-border)] px-3 py-1.5 text-xs font-mono text-[var(--app-muted)] transition-colors hover:border-[#16A34A]/40 hover:text-[#16A34A] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`}
          />
          {refreshing ? "刷新中..." : "立即刷新"}
        </button>
      </div>
    </div>
  );
}
