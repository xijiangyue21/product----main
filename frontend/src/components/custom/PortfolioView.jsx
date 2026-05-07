import { useEffect, useRef, useState } from "react";
import { Edit2, PieChart, Plus, Search, Trash2, X } from "lucide-react";
import { marketApi, portfolioApi } from "@/lib/api";
import { EmptyState, LoadingState } from "@/components/custom/async-state";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import {
  STOCK_SEARCH_DEBOUNCE_MS,
  createFallbackSearchResults,
  isStockCodeQuery,
  mergeSearchResults,
} from "@/lib/stockSearch";
const COLORS = [
  "#16A34A",
  "#0EA5E9",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
];
const EMPTY_FORM = {
  symbol: "",
  name: "",
  shares: "",
  costPrice: "",
  currentPrice: "",
};
const formatCurrency = (value, digits = 2) =>
  `¥${value.toLocaleString("zh-CN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
export default function PortfolioView() {
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [stockSearchQuery, setStockSearchQuery] = useState("");
  const [stockSearchResults, setStockSearchResults] = useState([]);
  const [stockSearchLoading, setStockSearchLoading] = useState(false);
  const [stockSearchNotice, setStockSearchNotice] = useState("");
  const latestQuoteRequestIdRef = useRef(0);
  const latestStockSearchIdRef = useRef(0);
  const submitAction = useAsyncAction();
  const deleteAction = useAsyncAction();
  useEffect(() => {
    void loadHoldings();
  }, []);
  useEffect(() => {
    const trimmedQuery = stockSearchQuery.trim();
    const selectedCode = form.symbol.split(".")[0] ?? "";
    const selectedSymbol = form.symbol.toUpperCase();
    const normalizedQuery = trimmedQuery.toUpperCase();

    if (
      !showForm ||
      !trimmedQuery ||
      (form.symbol &&
        (normalizedQuery === selectedCode || normalizedQuery === selectedSymbol))
    ) {
      setStockSearchResults([]);
      setStockSearchLoading(false);
      setStockSearchNotice("");
      return undefined;
    }

    if (!isStockCodeQuery(trimmedQuery)) {
      setStockSearchResults([]);
      setStockSearchLoading(false);
      setStockSearchNotice("");
      return undefined;
    }

    const timer = window.setTimeout(async () => {
      const searchId = latestStockSearchIdRef.current + 1;
      latestStockSearchIdRef.current = searchId;
      setStockSearchNotice("");

      const fallbackResults = createFallbackSearchResults(trimmedQuery);
      setStockSearchResults(fallbackResults);
      setStockSearchLoading(fallbackResults.length === 0);

      try {
        const response = await marketApi.searchStocks(trimmedQuery);

        if (searchId !== latestStockSearchIdRef.current) {
          return;
        }

        if (response.success) {
          const apiResults = Array.isArray(response.data) ? response.data : [];
          const mergedResults = mergeSearchResults(apiResults, fallbackResults);

          setStockSearchResults(mergedResults);
          setStockSearchNotice(
            apiResults.length === 0 && fallbackResults.length > 0
              ? "已显示本地匹配结果"
              : "",
          );
        } else {
          setStockSearchResults(fallbackResults);
          setStockSearchNotice(
            fallbackResults.length > 0
              ? "实时搜索暂不可用，已显示本地匹配结果"
              : response.message || "搜索暂不可用，请稍后重试",
          );
        }
      } catch {
        if (searchId !== latestStockSearchIdRef.current) {
          return;
        }

        setStockSearchResults(fallbackResults);
        setStockSearchNotice(
          fallbackResults.length > 0
            ? "实时搜索暂不可用，已显示本地匹配结果"
            : "搜索暂不可用，请稍后重试",
        );
      } finally {
        if (searchId === latestStockSearchIdRef.current) {
          setStockSearchLoading(false);
        }
      }
    }, STOCK_SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [form.symbol, showForm, stockSearchQuery]);
  const resetForm = () => {
    setShowForm(false);
    setEditId(null);
    setForm(EMPTY_FORM);
    setStockSearchQuery("");
    setStockSearchResults([]);
    setStockSearchNotice("");
  };
  const loadHoldings = async () => {
    setLoading(true);
    try {
      const response = await portfolioApi.getHoldings();
      if (response.success) {
        setHoldings(response.data);
      }
    } finally {
      setLoading(false);
    }
  };
  const handleStockSelect = async (stock) => {
    if (!stock) {
      setForm((current) => ({
        ...current,
        symbol: "",
        name: "",
        currentPrice: "",
      }));
      return;
    }
    setStockSearchQuery(stock.code);
    setStockSearchResults([]);
    setStockSearchNotice("");
    setForm((current) => ({
      ...current,
      symbol: stock.symbol,
      name: stock.name,
      currentPrice: "",
    }));

    const requestId = latestQuoteRequestIdRef.current + 1;
    latestQuoteRequestIdRef.current = requestId;

    try {
      const response = await marketApi.getQuote(stock.code);
      if (
        requestId !== latestQuoteRequestIdRef.current ||
        !response.success ||
        !response.data?.price
      ) {
        return;
      }

      setForm((current) =>
        current.symbol === stock.symbol
          ? { ...current, currentPrice: response.data.price }
          : current,
      );
    } catch {
      // Keep the form editable even if the latest quote is unavailable.
    }
  };
  const handleSubmit = async () => {
    if (!form.symbol || !form.shares || !form.costPrice) {
      await submitAction.run(async () => {
        throw new Error("请填写完整的股票、数量和成本价");
      });
      return;
    }
    await submitAction.run(
      async () => {
        if (editId) {
          const response = await portfolioApi.updateHolding(editId, {
            shares: form.shares,
            costPrice: form.costPrice,
            currentPrice: form.currentPrice,
          });
          if (!response.success) {
            throw new Error(response.message || "更新持仓失败");
          }
          setHoldings((current) =>
            current.map((holding) =>
              holding.id === editId ? response.data : holding,
            ),
          );
          return response.data;
        }
        const response = await portfolioApi.createHolding(form);
        if (!response.success) {
          throw new Error(response.message || "新增持仓失败");
        }
        setHoldings((current) => [...current, response.data]);
        return response.data;
      },
      {
        successMessage: editId ? "持仓已更新" : "持仓已添加",
        errorMessage: editId ? "更新持仓失败" : "新增持仓失败",
        onSuccess: resetForm,
      },
    );
  };
  const handleEdit = (holding) => {
    setForm({
      symbol: holding.symbol,
      name: holding.name,
      shares: holding.shares,
      costPrice: holding.costPrice,
      currentPrice: holding.currentPrice,
    });
    setStockSearchQuery(holding.symbol.split(".")[0] ?? holding.symbol);
    setStockSearchResults([]);
    setStockSearchNotice("");
    setEditId(holding.id);
    setShowForm(true);
  };
  const handleDelete = async (id, name) => {
    await deleteAction.run(
      async () => {
        const response = await portfolioApi.deleteHolding(id);
        if (!response.success) {
          throw new Error(response.message || "删除持仓失败");
        }
        setHoldings((current) =>
          current.filter((holding) => holding.id !== id),
        );
      },
      {
        successMessage: `${name} 已从持仓移除`,
        errorMessage: "删除持仓失败",
      },
    );
  };
  const totalCost = holdings.reduce(
    (sum, holding) =>
      sum + parseFloat(holding.shares) * parseFloat(holding.costPrice),
    0,
  );
  const totalValue = holdings.reduce(
    (sum, holding) =>
      sum + parseFloat(holding.shares) * parseFloat(holding.currentPrice),
    0,
  );
  const totalPnl = totalValue - totalCost;
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--app-text)]">
          <PieChart className="h-5 w-5 text-[#16A34A]" />
          持仓管理
        </h2>
        <button
          onClick={() => {
            setShowForm(true);
            setEditId(null);
            setForm(EMPTY_FORM);
            setStockSearchQuery("");
            setStockSearchResults([]);
            setStockSearchNotice("");
          }}
          className="flex items-center gap-1.5 rounded-lg bg-[#16A34A] px-3 py-1.5 text-xs font-mono font-semibold text-white transition-colors hover:bg-[#15803D]"
        >
          <Plus className="h-3.5 w-3.5" />
          添加持仓
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          {
            label: "总市值",
            value: formatCurrency(totalValue),
            color: "text-[var(--app-text)]",
          },
          {
            label: "总成本",
            value: formatCurrency(totalCost),
            color: "text-[var(--app-muted)]",
          },
          {
            label: "浮动盈亏",
            value: `${totalPnl >= 0 ? "+" : ""}${formatCurrency(totalPnl)}`,
            color: totalPnl >= 0 ? "text-[#16A34A]" : "text-red-500",
          },
          {
            label: "收益率",
            value: `${totalPnlPct >= 0 ? "+" : ""}${totalPnlPct.toFixed(2)}%`,
            color: totalPnlPct >= 0 ? "text-[#16A34A]" : "text-red-500",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-sm"
          >
            <div className="mb-1 text-xs font-mono text-[var(--app-muted)]">
              {card.label}
            </div>
            <div className={`text-lg font-mono font-bold ${card.color}`}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {showForm ? (
        <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--app-text)]">
              {editId ? "编辑持仓" : "添加持仓"}
            </h3>
            <button
              onClick={resetForm}
              className="text-[var(--app-muted)] transition-colors hover:text-[var(--app-text)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-mono text-[var(--app-muted)]">
                股票
              </label>
              <div className="rounded-lg border border-[var(--app-border)] bg-[var(--app-bg)]">
                <div className="flex items-center gap-2 px-3 py-2">
                  <Search className="h-4 w-4 text-[var(--app-muted)]" />
                  <input
                    type="text"
                    value={stockSearchQuery}
                    onChange={(event) => {
                      setStockSearchQuery(event.target.value);
                      setForm((current) => ({
                        ...current,
                        symbol: "",
                        name: "",
                        currentPrice: "",
                      }));
                    }}
                    placeholder="搜索股票代码"
                    className="w-full bg-transparent text-sm font-mono text-[var(--app-text)] outline-none placeholder:text-[var(--app-muted)]"
                  />
                </div>

                {form.symbol ? (
                  <div className="border-t border-[var(--app-border)] px-3 py-2 text-xs font-mono text-[var(--app-muted)]">
                    已选择：{form.name} · {form.symbol}
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto border-t border-[var(--app-border)]">
                    {stockSearchLoading ? (
                      <div className="px-3 py-3 text-xs font-mono text-[var(--app-muted)]">
                        搜索中...
                      </div>
                    ) : (
                      <>
                        {stockSearchNotice ? (
                          <div className="px-3 py-2 text-xs font-mono text-amber-600 dark:text-amber-400">
                            {stockSearchNotice}
                          </div>
                        ) : null}

                        {stockSearchQuery.trim() ? (
                          stockSearchResults.length > 0 ? (
                            stockSearchResults.map((stock) => (
                              <button
                                key={stock.code}
                                onClick={() => void handleStockSelect(stock)}
                                className="flex w-full items-center justify-between px-3 py-2 text-left transition-colors hover:bg-[var(--app-soft-hover)]"
                              >
                                <div>
                                  <span className="text-sm font-mono font-semibold text-[var(--app-text)]">
                                    {stock.name}
                                  </span>
                                  <span className="ml-2 text-xs font-mono text-[var(--app-muted)]">
                                    {stock.symbol}
                                  </span>
                                </div>
                                <Plus className="h-4 w-4 text-[#16A34A]" />
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-3 text-xs font-mono text-[var(--app-muted)]">
                              没有找到匹配的股票代码
                            </div>
                          )
                        ) : (
                          <div className="px-3 py-3 text-xs font-mono text-[var(--app-muted)]">
                            输入股票代码后搜索
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-mono text-[var(--app-muted)]">
                持股数量
              </label>
              <input
                type="number"
                value={form.shares}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    shares: event.target.value,
                  }))
                }
                placeholder="输入持股数量"
                className="w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-bg)] px-3 py-2 text-sm font-mono text-[var(--app-text)] outline-none transition-colors placeholder:text-[var(--app-muted)] focus:border-[#16A34A]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-mono text-[var(--app-muted)]">
                成本价（元）
              </label>
              <input
                type="number"
                value={form.costPrice}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    costPrice: event.target.value,
                  }))
                }
                placeholder="输入平均成本价"
                className="w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-bg)] px-3 py-2 text-sm font-mono text-[var(--app-text)] outline-none transition-colors placeholder:text-[var(--app-muted)] focus:border-[#16A34A]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-mono text-[var(--app-muted)]">
                现价（元）
              </label>
              <input
                type="number"
                value={form.currentPrice}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    currentPrice: event.target.value,
                  }))
                }
                placeholder="输入当前市场价格"
                className="w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-bg)] px-3 py-2 text-sm font-mono text-[var(--app-text)] outline-none transition-colors placeholder:text-[var(--app-muted)] focus:border-[#16A34A]"
              />
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={submitAction.isRunning}
              className="rounded-lg bg-[#16A34A] px-6 py-2 text-xs font-mono font-semibold text-white transition-colors hover:bg-[#15803D] disabled:opacity-50"
            >
              {submitAction.isRunning
                ? "保存中..."
                : editId
                  ? "更新持仓"
                  : "添加持仓"}
            </button>
            <button
              onClick={resetForm}
              className="rounded-lg border border-[var(--app-border)] px-6 py-2 text-xs font-mono text-[var(--app-muted)] transition-colors hover:text-[var(--app-text)]"
            >
              取消
            </button>
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-sm">
        <div className="border-b border-[var(--app-border)] px-5 py-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--app-text)]">
            持仓明细
          </h3>
        </div>

        {loading ? (
          <LoadingState />
        ) : holdings.length === 0 ? (
          <EmptyState
            icon={PieChart}
            title="还没有持仓"
            description="点击上方“添加持仓”开始记录你的投资组合。"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--app-border)]">
                  {[
                    "股票",
                    "持股数量",
                    "成本价",
                    "现价",
                    "市值",
                    "浮动盈亏",
                    "收益率",
                    "占比",
                    "操作",
                  ].map((header) => (
                    <th
                      key={header}
                      className="px-4 pb-3 pt-3 text-left text-xs font-mono uppercase tracking-wider text-[var(--app-muted)]"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--app-border)]">
                {holdings.map((holding, index) => {
                  const shares = parseFloat(holding.shares);
                  const cost = parseFloat(holding.costPrice);
                  const current = parseFloat(holding.currentPrice);
                  const value = shares * current;
                  const pnl = shares * (current - cost);
                  const pnlPct = cost > 0 ? ((current - cost) / cost) * 100 : 0;
                  const weight =
                    totalValue > 0 ? (value / totalValue) * 100 : 0;
                  const isPositive = pnl >= 0;
                  return (
                    <tr
                      key={holding.id}
                      className="group transition-colors hover:bg-[var(--app-soft-hover)]"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{
                              backgroundColor: COLORS[index % COLORS.length],
                            }}
                          />
                          <div>
                            <div className="text-sm font-mono font-semibold text-[var(--app-text)]">
                              {holding.name}
                            </div>
                            <div className="text-xs font-mono text-[var(--app-muted)]">
                              {holding.symbol}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-[var(--app-text)]">
                        {shares.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-[var(--app-text)]">
                        {cost.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-[var(--app-text)]">
                        {current.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-[var(--app-text)]">
                        {formatCurrency(value, 0)}
                      </td>
                      <td
                        className={`px-4 py-3 text-sm font-mono ${isPositive ? "text-[#16A34A]" : "text-red-500"}`}
                      >
                        {isPositive ? "+" : ""}
                        {formatCurrency(pnl, 0)}
                      </td>
                      <td
                        className={`px-4 py-3 text-sm font-mono ${isPositive ? "text-[#16A34A]" : "text-red-500"}`}
                      >
                        {isPositive ? "+" : ""}
                        {pnlPct.toFixed(2)}%
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1 w-16 rounded-full bg-[var(--app-soft)]">
                            <div
                              className="h-1 rounded-full bg-[#16A34A]"
                              style={{ width: `${Math.min(weight, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono text-[var(--app-muted)]">
                            {weight.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            onClick={() => handleEdit(holding)}
                            className="text-[var(--app-muted)] transition-colors hover:text-[#0EA5E9]"
                            title="编辑"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              handleDelete(holding.id, holding.name)
                            }
                            className="text-[var(--app-muted)] transition-colors hover:text-red-500"
                            title="删除"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {holdings.length > 0 ? (
        <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-sm">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--app-text)]">
            持仓占比
          </h3>
          <div className="space-y-3">
            {holdings.map((holding, index) => {
              const value =
                parseFloat(holding.shares) * parseFloat(holding.currentPrice);
              const weight = totalValue > 0 ? (value / totalValue) * 100 : 0;
              const pnlPct =
                parseFloat(holding.costPrice) > 0
                  ? ((parseFloat(holding.currentPrice) -
                      parseFloat(holding.costPrice)) /
                      parseFloat(holding.costPrice)) *
                    100
                  : 0;
              return (
                <div key={holding.id}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-mono text-[var(--app-text)]">
                      {holding.name}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-[var(--app-muted)]">
                        {formatCurrency(value, 0)}
                      </span>
                      <span
                        className={`text-xs font-mono ${pnlPct >= 0 ? "text-[#16A34A]" : "text-red-500"}`}
                      >
                        {pnlPct >= 0 ? "+" : ""}
                        {pnlPct.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-[var(--app-soft)]">
                    <div
                      className="h-1.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${weight}%`,
                        backgroundColor: COLORS[index % COLORS.length],
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
