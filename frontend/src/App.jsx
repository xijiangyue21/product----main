import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./contexts/useAuth";
import Index from "./pages/Index";
import Login from "./components/custom/Login";
import Signup from "./components/custom/Signup";
const AppRoutes = () => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--app-bg)]">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-10 w-10 animate-pulse items-center justify-center rounded-xl bg-[#16A34A]">
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          </div>
          <span className="text-sm font-mono text-[var(--app-muted)]">
            StockPulse 加载中...
          </span>
        </div>
      </div>
    );
  }
  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/signup"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Signup />}
      />
      <Route
        path="/"
        element={isAuthenticated ? <Index /> : <Navigate to="/login" replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
const App = () => (
  <HashRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </HashRouter>
);
export default App;
