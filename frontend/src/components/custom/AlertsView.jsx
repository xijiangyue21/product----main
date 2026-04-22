import { useEffect, useState } from "react";
import {
  Bell,
  Edit2,
  History,
  Plus,
  ToggleLeft,
  ToggleRight,
  Trash2,
  X,
} from "lucide-react";
import { alertsApi } from "@/lib/api";
import { CORE_STOCK_OPTIONS, findStockOption } from "@/constants/stocks";
import { EmptyState, LoadingState } from "@/components/custom/async-state";
import { useAsyncAction } from "@/hooks/useAsyncAction";
const CONDITION_LABELS = {
  price_above: "价格高于",
  price_below: "价格低于",
  change_above: "涨幅高于",
  change_below: "跌幅高于",
};
const STATUS_CONFIG = {
  active: { label: "启用中", color: "text-[#16A34A]", dot: "bg-[#16A34A]" },
  paused: { label: "已暂停", color: "text-amber-500", dot: "bg-amber-500" },
  triggered: { label: "已触发", color: "text-sky-500", dot: "bg-sky-500" },
};
const EMPTY_FORM = {
  symbol: "",
  stockName: "",
  conditionType: "price_above",
  conditionValue: "",
  notifyApp: true,
  notifySms: false,
  notifyWechat: false,
};
export default function AlertsView() {
  const [alerts, setAlerts] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [activeTab, setActiveTab] = useState("rules");
  const submitAction = useAsyncAction();
  const updateAction = useAsyncAction();
  const deleteAction = useAsyncAction();
  useEffect(() => {
    void loadData();
  }, []);
  const resetForm = () => {
    setShowForm(false);
    setEditId(null);
    setForm(EMPTY_FORM);
  };
  const loadData = async () => {
    setLoading(true);
    try {
      const [alertsResponse, historyResponse] = await Promise.all([
        alertsApi.getAlerts(),
        alertsApi.getHistory(),
      ]);
      if (alertsResponse.success) {
        setAlerts(alertsResponse.data);
      }
      if (historyResponse.success) {
        setHistory(historyResponse.data);
      }
    } finally {
      setLoading(false);
    }
  };
  const handleStockSelect = (symbol) => {
    const stock = findStockOption(symbol);
    if (!stock) {
      setForm((current) => ({ ...current, symbol: "", stockName: "" }));
      return;
    }
    setForm((current) => ({
      ...current,
      symbol: stock.symbol,
      stockName: stock.name,
    }));
  };
  const handleSubmit = async () => {
    if (!form.symbol || !form.conditionValue) {
      await submitAction.run(async () => {
        throw new Error("请填写完整的股票和触发条件");
      });
      return;
    }
    await submitAction.run(
      async () => {
        if (editId) {
          const response = await alertsApi.updateAlert(editId, {
            conditionType: form.conditionType,
            conditionValue: form.conditionValue,
            notifyApp: form.notifyApp,
            notifySms: form.notifySms,
            notifyWechat: form.notifyWechat,
          });
          if (!response.success) {
            throw new Error(response.message || "更新预警失败");
          }
          setAlerts((current) =>
            current.map((alert) =>
              alert.id === editId ? response.data : alert,
            ),
          );
          return response.data;
        }
        const response = await alertsApi.createAlert(form);
        if (!response.success) {
          throw new Error(response.message || "创建预警失败");
        }
        setAlerts((current) => [response.data, ...current]);
        return response.data;
      },
      {
        successMessage: editId ? "预警已更新" : "预警已创建",
        errorMessage: editId ? "更新预警失败" : "创建预警失败",
        onSuccess: resetForm,
      },
    );
  };
  const handleToggleStatus = async (alert) => {
    const nextStatus = alert.status === "active" ? "paused" : "active";
    await updateAction.run(
      async () => {
        const response = await alertsApi.updateAlert(alert.id, {
          status: nextStatus,
        });
        if (!response.success) {
          throw new Error(response.message || "更新预警状态失败");
        }
        setAlerts((current) =>
          current.map((item) => (item.id === alert.id ? response.data : item)),
        );
      },
      {
        successMessage: `预警已${nextStatus === "active" ? "启用" : "暂停"}`,
        errorMessage: "更新预警状态失败",
      },
    );
  };
  const handleDelete = async (id) => {
    await deleteAction.run(
      async () => {
        const response = await alertsApi.deleteAlert(id);
        if (!response.success) {
          throw new Error(response.message || "删除预警失败");
        }
        setAlerts((current) => current.filter((alert) => alert.id !== id));
      },
      {
        successMessage: "预警已删除",
        errorMessage: "删除预警失败",
      },
    );
  };
  const handleEdit = (alert) => {
    setForm({
      symbol: alert.symbol,
      stockName: alert.stockName,
      conditionType: alert.conditionType,
      conditionValue: alert.conditionValue,
      notifyApp: alert.notifyApp,
      notifySms: alert.notifySms,
      notifyWechat: alert.notifyWechat,
    });
    setEditId(alert.id);
    setShowForm(true);
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--app-text)]">
          <Bell className="h-5 w-5 text-[#16A34A]" />
          预警系统
        </h2>
        <button
          onClick={() => {
            setShowForm(true);
            setEditId(null);
            setForm(EMPTY_FORM);
          }}
          className="flex items-center gap-1.5 rounded-lg bg-[#16A34A] px-3 py-1.5 text-xs font-mono font-semibold text-white transition-colors hover:bg-[#15803D]"
        >
          <Plus className="h-3.5 w-3.5" />
          新增预警
        </button>
      </div>

      {showForm ? (
        <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--app-text)]">
              {editId ? "编辑预警" : "新增预警规则"}
            </h3>
            <button
              onClick={resetForm}
              className="text-[var(--app-muted)] transition-colors hover:text-[var(--app-text)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-mono text-[var(--app-muted)]">
                股票
              </label>
              <select
                value={form.symbol}
                onChange={(event) => handleStockSelect(event.target.value)}
                className="w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-bg)] px-3 py-2 text-sm font-mono text-[var(--app-text)] outline-none transition-colors focus:border-[#16A34A]"
              >
                <option value="">选择股票</option>
                {CORE_STOCK_OPTIONS.map((stock) => (
                  <option key={stock.symbol} value={stock.symbol}>
                    {stock.name} ({stock.symbol})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-mono text-[var(--app-muted)]">
                触发条件
              </label>
              <select
                value={form.conditionType}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    conditionType: event.target.value,
                  }))
                }
                className="w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-bg)] px-3 py-2 text-sm font-mono text-[var(--app-text)] outline-none transition-colors focus:border-[#16A34A]"
              >
                <option value="price_above">价格高于</option>
                <option value="price_below">价格低于</option>
                <option value="change_above">涨幅高于</option>
                <option value="change_below">跌幅高于</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-mono text-[var(--app-muted)]">
                {form.conditionType.includes("change")
                  ? "涨跌幅（%）"
                  : "价格（元）"}
              </label>
              <input
                type="number"
                value={form.conditionValue}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    conditionValue: event.target.value,
                  }))
                }
                placeholder={
                  form.conditionType.includes("change")
                    ? "例如 5"
                    : "例如 28.80"
                }
                className="w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-bg)] px-3 py-2 text-sm font-mono text-[var(--app-text)] outline-none transition-colors placeholder:text-[var(--app-muted)] focus:border-[#16A34A]"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-mono text-[var(--app-muted)]">
                通知方式
              </label>
              <div className="flex items-center gap-3">
                {[
                  { key: "notifyApp", label: "App" },
                  { key: "notifySms", label: "短信" },
                  { key: "notifyWechat", label: "微信" },
                ].map(({ key, label }) => (
                  <label
                    key={key}
                    className="flex cursor-pointer items-center gap-1.5"
                  >
                    <input
                      type="checkbox"
                      checked={form[key]}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          [key]: event.target.checked,
                        }))
                      }
                      className="h-3.5 w-3.5 accent-[#16A34A]"
                    />
                    <span className="text-xs font-mono text-[var(--app-text)]">
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={submitAction.isRunning}
              className="rounded-lg bg-[#16A34A] px-6 py-2 text-xs font-mono font-semibold text-white transition-colors hover:bg-[#15803D] disabled:opacity-50"
            >
              {submitAction.isRunning
                ? "保存中..."
                : editId
                  ? "更新预警"
                  : "创建预警"}
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

      <div className="flex w-fit items-center gap-1 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-1 shadow-sm">
        {[
          { key: "rules", label: "预警规则", icon: Bell },
          { key: "history", label: "触发记录", icon: History },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-mono transition-colors ${
              activeTab === key
                ? "border border-[#16A34A]/30 bg-[#16A34A]/10 text-[#16A34A]"
                : "text-[var(--app-muted)] hover:text-[var(--app-text)]"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === "rules" ? (
        <div className="overflow-hidden rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-sm">
          {loading ? (
            <LoadingState />
          ) : alerts.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="还没有预警规则"
              description="点击上方“新增预警”设置你的第一条规则。"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--app-border)]">
                    {[
                      "股票",
                      "触发条件",
                      "通知方式",
                      "触发次数",
                      "状态",
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
                  {alerts.map((alert) => {
                    const statusConfig = STATUS_CONFIG[alert.status];
                    const isChange = alert.conditionType.includes("change");
                    const isAbove = alert.conditionType.includes("above");
                    return (
                      <tr
                        key={alert.id}
                        className="group transition-colors hover:bg-[var(--app-soft-hover)]"
                      >
                        <td className="px-4 py-3">
                          <div className="text-sm font-mono font-semibold text-[var(--app-text)]">
                            {alert.stockName}
                          </div>
                          <div className="text-xs font-mono text-[var(--app-muted)]">
                            {alert.symbol}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded px-2 py-1 text-xs font-mono ${
                              isAbove
                                ? "bg-[#16A34A]/10 text-[#16A34A]"
                                : "bg-red-50 text-red-600"
                            }`}
                          >
                            {CONDITION_LABELS[alert.conditionType]}{" "}
                            {isChange ? "" : "¥"}
                            {alert.conditionValue}
                            {isChange ? "%" : ""}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {alert.notifyApp ? (
                              <span className="rounded bg-sky-50 px-1.5 py-0.5 text-xs font-mono text-sky-600">
                                App
                              </span>
                            ) : null}
                            {alert.notifySms ? (
                              <span className="rounded bg-amber-50 px-1.5 py-0.5 text-xs font-mono text-amber-600">
                                短信
                              </span>
                            ) : null}
                            {alert.notifyWechat ? (
                              <span className="rounded bg-[#16A34A]/10 px-1.5 py-0.5 text-xs font-mono text-[#16A34A]">
                                微信
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-[var(--app-text)]">
                          {alert.triggerCount} 次
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <div
                              className={`h-1.5 w-1.5 rounded-full ${statusConfig.dot}`}
                            />
                            <span
                              className={`text-xs font-mono ${statusConfig.color}`}
                            >
                              {statusConfig.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleStatus(alert)}
                              className="text-[var(--app-muted)] transition-colors hover:text-[#16A34A]"
                              title={
                                alert.status === "active" ? "暂停" : "启用"
                              }
                            >
                              {alert.status === "active" ? (
                                <ToggleRight className="h-4 w-4 text-[#16A34A]" />
                              ) : (
                                <ToggleLeft className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleEdit(alert)}
                              className="text-[var(--app-muted)] transition-colors hover:text-sky-500"
                              title="编辑"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(alert.id)}
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
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-sm">
          {history.length === 0 ? (
            <EmptyState icon={History} title="暂无预警触发记录" />
          ) : (
            <div className="divide-y divide-[var(--app-border)]">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-[var(--app-soft-hover)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    <div>
                      <span className="text-sm font-mono font-semibold text-[var(--app-text)]">
                        {item.stockName}
                      </span>
                      <span className="ml-2 text-xs font-mono text-[var(--app-muted)]">
                        {item.symbol}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-mono text-[var(--app-text)]">
                      触发价 ¥{item.triggerPrice}
                    </span>
                    <span className="text-xs font-mono text-[var(--app-muted)]">
                      {new Date(item.triggeredAt).toLocaleString("zh-CN")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
