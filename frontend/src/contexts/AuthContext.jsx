import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/config/constants";
import { AuthContext } from "./auth-context";
import { applyTheme, getStoredTheme } from "@/lib/theme";
import {
  clearStoredRefreshRate,
  setStoredRefreshRate,
} from "@/lib/preferences";
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = localStorage.getItem("token");
    return token ? null : false;
  });
  useEffect(() => {
    applyTheme(getStoredTheme());
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        return;
      }
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        setIsAuthenticated(data.success);
        if (!data.success) {
          localStorage.removeItem("token");
          clearStoredRefreshRate();
          return;
        }
        if (data.data?.theme === "light" || data.data?.theme === "dark") {
          applyTheme(data.data.theme);
        }
        if (data.data?.refreshRate !== undefined) {
          setStoredRefreshRate(data.data.refreshRate);
        }
      } catch {
        setIsAuthenticated(false);
        localStorage.removeItem("token");
        clearStoredRefreshRate();
      }
    };
    void checkAuth();
  }, []);
  const login = (token) => {
    localStorage.setItem("token", token);
    setIsAuthenticated(true);
  };
  const logout = () => {
    localStorage.removeItem("token");
    clearStoredRefreshRate();
    setIsAuthenticated(false);
  };
  return (
    <AuthContext.Provider
      value={{ isAuthenticated, setIsAuthenticated, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
