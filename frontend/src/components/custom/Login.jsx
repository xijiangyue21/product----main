import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/useAuth";
import { API_BASE_URL } from "@/config/constants";
function getErrorMessage(data, fallback) {
  if (typeof data === "object" && data !== null) {
    if ("message" in data && typeof data.message === "string") {
      return data.message;
    }
    if (
      "error" in data &&
      typeof data.error === "object" &&
      data.error !== null &&
      "message" in data.error &&
      typeof data.error.message === "string"
    ) {
      return data.error.message;
    }
  }
  return fallback;
}
export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (isAuthenticated === true) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!email || !password) {
      setError("请输入邮箱和密码");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (data.success && data.data?.token) {
        login(data.data.token);
        navigate("/", { replace: true });
        return;
      }
      setError(getErrorMessage(data, "邮箱或密码错误"));
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--app-bg)] px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#16A34A]">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <span className="font-mono text-2xl font-bold text-[var(--app-text)]">
              StockPulse
            </span>
          </div>
          <p className="font-mono text-sm text-[var(--app-muted)]">
            实时股票信息系统
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-8 shadow-sm">
          <h2 className="mb-6 text-xl font-bold text-[var(--app-text)]">
            登录账户
          </h2>

          {error ? (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <p className="font-mono text-sm text-red-600">{error}</p>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block font-mono text-xs text-[var(--app-muted)]">
                邮箱地址
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="输入你的邮箱"
                className="w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-bg)] px-4 py-3 font-mono text-sm text-[var(--app-text)] outline-none transition-colors placeholder:text-[var(--app-muted)] focus:border-[#16A34A]"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="mb-1.5 block font-mono text-xs text-[var(--app-muted)]">
                密码
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="输入你的密码"
                  className="w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-bg)] px-4 py-3 pr-12 font-mono text-sm text-[var(--app-text)] outline-none transition-colors placeholder:text-[var(--app-muted)] focus:border-[#16A34A]"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--app-muted)] transition-colors hover:text-[var(--app-text)]"
                  aria-label={showPassword ? "隐藏密码" : "显示密码"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-[#16A34A] py-3 font-mono text-sm font-bold text-white transition-colors hover:bg-[#15803D] disabled:opacity-50"
            >
              {loading ? "登录中..." : "登录"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="font-mono text-sm text-[var(--app-muted)]">
              还没有账户？{" "}
            </span>
            <button
              onClick={() => navigate("/signup")}
              className="font-mono text-sm text-[#16A34A] hover:underline"
            >
              立即注册
            </button>
          </div>
        </div>

        <p className="mt-6 text-center font-mono text-xs text-[var(--app-muted)]">
          © 2026 StockPulse · 行情数据仅供参考，不构成投资建议
        </p>
      </div>
    </div>
  );
}
