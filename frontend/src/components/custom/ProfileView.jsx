import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Download,
  LogOut,
  MessageSquare,
  Save,
  Settings,
  User as UserIcon,
} from "lucide-react";
import { alertsApi, authApi, feedbackApi, watchlistApi } from "@/lib/api";
import { useAuth } from "@/contexts/useAuth";
import { LoadingState } from "@/components/custom/async-state";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { applyTheme } from "@/lib/theme";
import {
  getStoredRefreshRate,
  setStoredRefreshRate,
} from "@/lib/preferences";

const THEME_OPTIONS = [
  { value: "dark", label: "深色模式" },
  { value: "light", label: "浅色模式" },
];

const REFRESH_OPTIONS = [
  { value: "0", label: "手动刷新" },
  { value: "1", label: "1 秒" },
  { value: "3", label: "3 秒" },
  { value: "5", label: "5 秒" },
];

export default function ProfileView() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState("light");
  const [refreshRate, setRefreshRate] = useState(() =>
    String(getStoredRefreshRate()),
  );
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [watchlistCount, setWatchlistCount] = useState(0);
  const [activeAlertCount, setActiveAlertCount] = useState(0);
  const feedbackAction = useAsyncAction();
  const settingsAction = useAsyncAction();
  const exportAction = useAsyncAction();
  const themeTouchedRef = useRef(false);

  useEffect(() => {
    void loadProfileData();
  }, []);

  const loadProfileData = async () => {
    setLoading(true);

    try {
      const [meResponse, watchlistResponse, alertsResponse] = await Promise.all(
        [authApi.me(), watchlistApi.getItems(), alertsApi.getAlerts()],
      );

      if (meResponse.success) {
        setUser(meResponse.data);

        const nextTheme = meResponse.data.theme || "light";
        setTheme(nextTheme);

        if (!themeTouchedRef.current) {
          applyTheme(nextTheme);
        }

        const nextRefreshRate = String(meResponse.data.refreshRate ?? 3);
        setRefreshRate(nextRefreshRate);
        setStoredRefreshRate(nextRefreshRate);
      }

      if (watchlistResponse.success) {
        setWatchlistCount(watchlistResponse.data.length);
      }

      if (alertsResponse.success) {
        setActiveAlertCount(
          alertsResponse.data.filter((alert) => alert.status === "active")
            .length,
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackSubmit = async () => {
    const trimmedFeedback = feedback.trim();

    if (!trimmedFeedback) {
      await feedbackAction.run(
        async () => {
          throw new Error("请输入反馈内容");
        },
        { errorMessage: "请输入反馈内容" },
      );
      return;
    }

    await feedbackAction.run(
      async () => {
        const response = await feedbackApi.submit(trimmedFeedback);

        if (!response.success) {
          throw new Error(response.message || "提交反馈失败");
        }

        setFeedback("");
      },
      {
        successMessage: "反馈已提交，感谢你的建议",
        errorMessage: "提交反馈失败",
      },
    );
  };

  const handleSaveSettings = async () => {
    await settingsAction.run(
      async () => {
        const response = await authApi.updatePreferences({
          theme,
          refreshRate: Number(refreshRate),
        });

        if (!response.success) {
          throw new Error(response.message || "保存设置失败");
        }

        const nextTheme = response.data.theme || theme;
        const nextRefreshRate = String(response.data.refreshRate ?? refreshRate);

        setUser(response.data);
        setTheme(nextTheme);
        setRefreshRate(nextRefreshRate);
        applyTheme(nextTheme);
        setStoredRefreshRate(nextRefreshRate);
      },
      {
        successMessage: "设置已保存",
        errorMessage: "保存设置失败",
      },
    );
  };

  const handleThemeChange = async (nextTheme) => {
    themeTouchedRef.current = true;
    setTheme(nextTheme);
    applyTheme(nextTheme);

    await settingsAction.run(
      async () => {
        const response = await authApi.updatePreferences({
          theme: nextTheme,
          refreshRate: Number(refreshRate),
        });

        if (!response.success) {
          throw new Error(response.message || "保存主题失败");
        }

        const savedTheme = response.data.theme || nextTheme;
        const nextRefreshRate = String(response.data.refreshRate ?? refreshRate);

        setUser(response.data);
        setTheme(savedTheme);
        setRefreshRate(nextRefreshRate);
        applyTheme(savedTheme);
        setStoredRefreshRate(nextRefreshRate);
      },
      {
        successMessage: "主题已切换",
        errorMessage: "保存主题失败",
      },
    );
  };

  const handleExportPortfolio = async () => {
    await exportAction.run(async () => undefined, {
      successMessage: "持仓导出功能即将上线",
    });
  };

  const handleExportTrades = async () => {
    await exportAction.run(async () => undefined, {
      successMessage: "交易记录导出功能即将上线",
    });
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : "U");

  const registrationDate = user
    ? new Date(user.createdAt).toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "2-digit",
      })
    : "";

  return (
    <div className="space-y-4">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--app-text)]">
        <UserIcon className="h-5 w-5 text-[#15803D]" />
        个人中心
      </h2>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5">
            {loading ? (
              <LoadingState className="text-xs font-mono text-[var(--app-muted)]" />
            ) : user ? (
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#16A34A] to-[#0EA5E9] text-xl font-bold text-white">
                  {getInitial(user.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-base font-semibold text-[var(--app-text)]">
                    {user.name}
                  </div>
                  <div className="truncate font-mono text-sm text-[var(--app-muted)]">
                    {user.email}
                  </div>
                  <div className="mt-1 font-mono text-xs text-[#15803D]">
                    进阶投资者 · 注册于 {registrationDate}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "自选股", value: String(watchlistCount) },
              { label: "活跃预警", value: String(activeAlertCount) },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 text-center"
              >
                <div className="text-2xl font-mono font-bold text-[var(--app-text)]">
                  {stat.value}
                </div>
                <div className="mt-1 font-mono text-xs text-[var(--app-muted)]">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5">
            <h4 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--app-muted)]">
              <Settings className="h-3.5 w-3.5" />
              界面设置
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm text-[var(--app-text)]">
                  界面主题
                </label>
                <select
                  value={theme}
                  onChange={(event) => {
                    void handleThemeChange(event.target.value);
                  }}
                  className="rounded-lg border border-[var(--app-border)] bg-[var(--app-bg)] px-3 py-1.5 font-mono text-xs text-[var(--app-text)] outline-none transition-colors focus:border-[#16A34A]"
                >
                  {THEME_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between gap-3">
                <label className="text-sm text-[var(--app-text)]">
                  行情刷新频率
                </label>
                <select
                  value={refreshRate}
                  onChange={(event) => setRefreshRate(event.target.value)}
                  className="rounded-lg border border-[var(--app-border)] bg-[var(--app-bg)] px-3 py-1.5 font-mono text-xs text-[var(--app-text)] outline-none transition-colors focus:border-[#16A34A]"
                >
                  {REFRESH_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <p className="text-xs text-[var(--app-muted)]">
                选择手动刷新后，需要在行情页点击“立即刷新”按钮更新数据。
              </p>

              <button
                onClick={handleSaveSettings}
                disabled={settingsAction.isRunning}
                className="flex items-center justify-center gap-2 rounded-lg border border-[#16A34A]/20 bg-[#16A34A]/10 px-3 py-2 text-xs font-mono font-semibold text-[#15803D] transition-colors hover:bg-[#16A34A]/15 disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" />
                {settingsAction.isRunning ? "保存中..." : "保存设置"}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5">
            <h4 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--app-muted)]">
              <Download className="h-3.5 w-3.5" />
              数据导出
            </h4>
            <div className="flex items-center gap-3">
              <button
                onClick={() => void handleExportPortfolio()}
                className="flex-1 rounded-lg border border-[#16A34A] py-2.5 text-xs font-mono font-semibold text-[#15803D] transition-colors hover:bg-[#16A34A]/10"
              >
                导出持仓表
              </button>
              <button
                onClick={() => void handleExportTrades()}
                className="flex-1 rounded-lg border border-[#0EA5E9] py-2.5 text-xs font-mono font-semibold text-[#0EA5E9] transition-colors hover:bg-[#0EA5E9]/10"
              >
                导出交易记录
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5">
            <h4 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--app-muted)]">
              <MessageSquare className="h-3.5 w-3.5" />
              意见反馈
            </h4>
            <div className="space-y-3">
              <textarea
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                rows={4}
                placeholder="请描述你的功能建议，或遇到的问题与操作路径。"
                className="w-full resize-none rounded-lg border border-[var(--app-border)] bg-[var(--app-bg)] px-3 py-2.5 text-sm text-[var(--app-text)] outline-none transition-colors placeholder:text-[var(--app-muted)] focus:border-[#16A34A]"
              />
              <button
                onClick={handleFeedbackSubmit}
                disabled={feedbackAction.isRunning}
                className="w-full rounded-lg bg-[#16A34A] py-2.5 text-xs font-mono font-semibold text-white transition-colors hover:bg-[#15803D] disabled:opacity-50"
              >
                {feedbackAction.isRunning ? "提交中..." : "提交反馈"}
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5">
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#E11D48]/20 py-2.5 text-xs font-mono font-semibold text-[#E11D48] transition-colors hover:bg-[#E11D48]/10"
            >
              <LogOut className="h-4 w-4" />
              退出登录
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
