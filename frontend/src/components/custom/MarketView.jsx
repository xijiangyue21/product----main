import { useCallback, useEffect, useRef, useState } from "react";
import { BarChart3, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { STOCK_ASSISTANT_URL } from "@/config/constants";
import { marketApi } from "@/lib/api";
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

const DEFAULT_STOCK_CODE = "600519";

function getIndexDisplayName(indexItem) {
  return (
    INDEX_NAME_BY_CODE[indexItem.code] ??
    INDEX_NAME_BY_LABEL[indexItem.name] ??
    indexItem.name
  );
}

function safeText(value, fallback = "--") {
  const text = value == null ? "" : String(value).trim();

  if (
    !text ||
    text.toLowerCase() === "undefined" ||
    text.toLowerCase() === "null"
  ) {
    return fallback;
  }

  return text;
}

function normalizeStockCode(stock) {
  const text = safeText(stock?.code ?? stock?.symbol, "").toUpperCase();
  const sixDigitCode = text.match(/\d{6}/);

  return sixDigitCode ? sixDigitCode[0] : text;
}

function getStockSymbol(stock) {
  return safeText(stock?.symbol, normalizeStockCode(stock));
}

function getStockDisplayName(stock) {
  if (!stock) {
    return "";
  }

  const code = normalizeStockCode(stock);
  const name = safeText(stock.name, "");

  return (
    STOCK_NAME_BY_CODE[code] ||
    STOCK_NAME_BY_LABEL[name] ||
    name ||
    getStockSymbol(stock) ||
    code
  );
}

export default function MarketView({ selectedStock, onSelectStock }) {
  const [indices, setIndices] = useState([]);
  const [stockRank, setStockRank] = useState([]);
  const [quote, setQuote] = useState(null);
  const [indicesLoading, setIndicesLoading] = useState(true);
  const [rankLoading, setRankLoading] = useState(true);
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshRate, setRefreshRate] = useState(() => getStoredRefreshRate());
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [rankSource, setRankSource] = useState("");
  const [historyAnalysis, setHistoryAnalysis] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [time, setTime] = useState(new Date());
  const activeRequestCountRef = useRef(0);
  const latestRequestIdRef = useRef(0);
  const selectedStockCode =
    normalizeStockCode({ code: selectedStock }) || DEFAULT_STOCK_CODE;

  const fetchData = useCallback(
    async ({ showLoading = false } = {}) => {
      const requestId = latestRequestIdRef.current + 1;
      latestRequestIdRef.current = requestId;
      activeRequestCountRef.current += 1;
      setRefreshing(true);

      if (showLoading) {
        setIndicesLoading(true);
        setRankLoading(true);
        setQuoteLoading(true);
      }

      const applyIfCurrent = (apply) => {
        if (requestId !== latestRequestIdRef.current) {
          return false;
        }
        apply();
        setLastUpdatedAt(new Date());
        return true;
      };

      const loadIndices = async () => {
        setIndicesLoading(true);
        try {
          const indicesResponse = await marketApi.getIndices();
          applyIfCurrent(() => {
            if (indicesResponse.success) {
              setIndices(indicesResponse.data);
            }
          });
        } finally {
          if (requestId === latestRequestIdRef.current) {
            setIndicesLoading(false);
          }
        }
      };

      const loadQuote = async () => {
        setQuoteLoading(true);
        try {
          const quoteResponse = await marketApi.getQuote(selectedStockCode);
          applyIfCurrent(() => {
            if (quoteResponse.success) {
              setQuote(quoteResponse.data);
            }
          });
        } finally {
          if (requestId === latestRequestIdRef.current) {
            setQuoteLoading(false);
          }
        }
      };

      const loadRank = async () => {
        setRankLoading(true);
        try {
          const rankResponse = await marketApi.getStockRank();
          applyIfCurrent(() => {
            if (rankResponse.success) {
              setStockRank(rankResponse.data);
              setRankSource(rankResponse.source ?? "");
            }
          });
        } finally {
          if (requestId === latestRequestIdRef.current) {
            setRankLoading(false);
          }
        }
      };

      try {
        await Promise.allSettled([loadIndices(), loadQuote(), loadRank()]);
      } finally {
        activeRequestCountRef.current -= 1;

        if (activeRequestCountRef.current <= 0) {
          setRefreshing(false);
        }
      }
    },
    [selectedStockCode],
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
    if (refreshRate <= 0) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      void fetchData();
    }, refreshRate * 1000);

    return () => window.clearInterval(timer);
  }, [fetchData, refreshRate]);

  useEffect(() => {
    const timer = window.setInterval(() => setTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setHistoryAnalysis(null);
    setActionError("");
  }, [selectedStock]);

  const isPositive = (value) => Number.parseFloat(value) >= 0;
  const refreshModeLabel =
    refreshRate === 0
      ? "手动刷新"
      : `自动刷新 ${getRefreshRateLabel(refreshRate)}`;
  const lastUpdatedLabel = lastUpdatedAt
    ? lastUpdatedAt.toLocaleTimeString("zh-CN")
    : "等待首次刷新";

  const quoteSource = quote?.source ?? "";
  const hasLiveData =
    quoteSource === "live" ||
    quoteSource === "sina" ||
    quoteSource === "alpha_vantage" ||
    rankSource === "live" ||
    rankSource === "sina";
  const dataStatusLabel = refreshing
    ? "更新中"
    : hasLiveData
      ? "实时"
      : "本地";
  const quoteStatusLabel =
    quoteSource === "live" ||
    quoteSource === "sina" ||
    quoteSource === "alpha_vantage"
      ? "实时行情"
      : "本地行情";
  const quoteTradeTimeLabel =
    quote?.tradeDate && quote?.tradeTime
      ? `${quote.tradeDate} ${quote.tradeTime}`
      : "";
  const quoteDisplayName = quote
    ? getStockDisplayName(quote) || selectedStockCode
    : "";
  const quoteSymbol = quote ? getStockSymbol(quote) || selectedStockCode : "";

  const handleHistoryAnalysis = async () => {
    setHistoryLoading(true);
    setActionError("");

    try {
      const response = await marketApi.getHistoryAnalysis(selectedStockCode);
      if (response.success) {
        setHistoryAnalysis(response.data);
      } else {
        setActionError(response.message || "历史行情分析失败");
      }
    } catch {
      setActionError("历史行情分析失败，请稍后重试");
    } finally {
      setHistoryLoading(false);
    }
  };

  const openStockAssistant = () => {
    const assistantUrl = new URL(STOCK_ASSISTANT_URL, window.location.origin);
    const assistantStockCode = normalizeStockCode(quote) || selectedStockCode;
    const name = quoteDisplayName;
    const symbol = quoteSymbol || assistantStockCode;

    assistantUrl.searchParams.set("stock", assistantStockCode);
    if (name) {
      assistantUrl.searchParams.set("name", name);
    }
    if (symbol) {
      assistantUrl.searchParams.set("symbol", symbol);
    }

    window.location.assign(assistantUrl.toString());
  };

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
          {indicesLoading && indices.length === 0 ? (
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
            <span
              className={`text-xs ${
                refreshing
                  ? "animate-pulse text-amber-500"
                  : hasLiveData
                    ? "text-amber-500"
                    : "text-[var(--app-muted)]"
              }`}
            >
              {dataStatusLabel}
            </span>
            <span className="text-xs font-mono text-[var(--app-muted)]">
              {time.toLocaleTimeString("zh-CN")}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="overflow-hidden rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-sm">
          <div className="flex items-center gap-2 overflow-x-auto border-b border-[var(--app-border)] px-4 pb-2 pt-3 scrollbar-hide">
            {rankLoading && stockRank.length === 0 ? (
              <span className="text-xs font-mono text-[var(--app-muted)]">
                加载排行数据...
              </span>
            ) : (
              stockRank.map((stock, index) => {
                const stockCode = normalizeStockCode(stock);
                const displayName =
                  getStockDisplayName(stock) || getStockSymbol(stock) || stockCode;
                const isSelected =
                  Boolean(stockCode) && stockCode === selectedStockCode;

                return (
                  <button
                    key={stockCode || getStockSymbol(stock) || index}
                    type="button"
                    onClick={() => {
                      if (stockCode) {
                        onSelectStock(stockCode);
                      }
                    }}
                    disabled={!stockCode}
                    className={`whitespace-nowrap rounded-lg px-3 py-1 text-xs font-mono transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                      isSelected
                        ? "border border-[#16A34A]/40 bg-[#16A34A]/10 text-[#16A34A]"
                        : "border border-[var(--app-border)] text-[var(--app-muted)] hover:border-[#16A34A]/30 hover:text-[var(--app-text)]"
                    }`}
                  >
                    {index + 1}. {displayName}
                  </button>
                );
              })
            )}
          </div>

          {quote ? (
            <>
              <div className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xl font-bold text-[var(--app-text)]">
                      {quoteDisplayName}
                    </span>
                    <span className="text-sm font-mono text-[var(--app-muted)]">
                      {quoteSymbol}
                    </span>
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-3">
                    <span className="font-mono text-3xl font-bold text-[var(--app-text)]">
                      {safeText(quote.price)}
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

                <div
                  className={`rounded-lg border border-[var(--app-border)] px-2.5 py-1 text-xs font-mono ${
                    quoteSource === "live" ||
                    quoteSource === "sina" ||
                    quoteSource === "alpha_vantage"
                      ? "text-[#16A34A]"
                      : "text-[var(--app-muted)]"
                  }`}
                >
                  {quoteStatusLabel}
                  {quoteTradeTimeLabel ? ` ${quoteTradeTimeLabel}` : ""}
                </div>
              </div>

              <div className="grid min-h-40 grid-cols-1 gap-3 px-5 pb-5 sm:grid-cols-2">
                <button
                  onClick={() => void handleHistoryAnalysis()}
                  disabled={historyLoading}
                  className="flex min-h-20 items-center justify-center gap-2 rounded-lg border border-[#16A34A]/30 bg-[#16A34A]/10 px-4 py-3 font-mono text-sm font-semibold text-[#15803D] transition-colors hover:border-[#16A34A] hover:bg-[#16A34A]/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {historyLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <BarChart3 className="h-4 w-4" />
                  )}
                  {historyLoading ? "分析中..." : "历史行情分析"}
                </button>

                <button
                  onClick={openStockAssistant}
                  className="flex min-h-20 items-center justify-center gap-2 rounded-lg border border-[var(--app-border)] bg-[var(--app-bg)] px-4 py-3 font-mono text-sm font-semibold text-[var(--app-text)] transition-colors hover:border-[#16A34A]/40 hover:text-[#15803D]"
                >
                  <Sparkles className="h-4 w-4" />
                  AI投资建议
                </button>

                {actionError ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-mono text-red-600 sm:col-span-2">
                    {actionError}
                  </div>
                ) : null}

                {historyAnalysis ? (
                  <div className="rounded-lg border border-[var(--app-border)] bg-[var(--app-bg)] p-3 sm:col-span-2">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="text-xs font-mono font-semibold text-[var(--app-text)]">
                        近一年历史行情分析
                      </span>
                      <span className="text-xs font-mono text-[var(--app-muted)]">
                        {historyAnalysis.startDate} - {historyAnalysis.endDate}
                      </span>
                    </div>
                    <p className="text-xs font-mono leading-relaxed text-[var(--app-text)]">
                      {historyAnalysis.summary}
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
                      {[
                        ["涨跌幅", `${historyAnalysis.returnPercent}%`],
                        ["最大回撤", `${historyAnalysis.maxDrawdownPercent}%`],
                        ["趋势", historyAnalysis.trend],
                        ["风险", historyAnalysis.riskLevel],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className="rounded border border-[var(--app-border)] px-2 py-1.5"
                        >
                          <div className="text-xs font-mono text-[var(--app-muted)]">
                            {label}
                          </div>
                          <div className="mt-1 text-xs font-mono font-semibold text-[var(--app-text)]">
                            {value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

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
          ) : quoteLoading ? (
            <div className="px-5 py-8 text-xs font-mono text-[var(--app-muted)]">
              加载个股行情...
            </div>
          ) : null}
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
