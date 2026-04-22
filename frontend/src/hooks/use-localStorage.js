import { useEffect, useState } from "react";
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`读取 localStorage 键 "${key}" 失败:`, error);
      return initialValue;
    }
  });
  const setValue = (value) => {
    try {
      const valueToStore =
        typeof value === "function" ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`写入 localStorage 键 "${key}" 失败:`, error);
    }
  };
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key !== key || event.newValue === null) {
        return;
      }
      try {
        setStoredValue(JSON.parse(event.newValue));
      } catch (error) {
        console.error(`解析 localStorage 键 "${key}" 失败:`, error);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [key]);
  return [storedValue, setValue];
}
