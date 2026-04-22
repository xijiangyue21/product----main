const REFRESH_RATE_STORAGE_KEY = "app-refresh-rate";
const DEFAULT_REFRESH_RATE = 3;
export const REFRESH_RATE_CHANGE_EVENT = "app-refresh-rate-change";

function normalizeRefreshRate(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return DEFAULT_REFRESH_RATE;
  }

  const normalizedValue = Math.trunc(numericValue);

  if (normalizedValue < 0) {
    return 0;
  }

  if (normalizedValue > 60) {
    return 60;
  }

  return normalizedValue;
}

export function getStoredRefreshRate() {
  if (typeof window === "undefined") {
    return DEFAULT_REFRESH_RATE;
  }

  const storedValue = window.localStorage.getItem(REFRESH_RATE_STORAGE_KEY);

  if (storedValue === null) {
    return DEFAULT_REFRESH_RATE;
  }

  return normalizeRefreshRate(storedValue);
}

export function setStoredRefreshRate(value) {
  const normalizedValue = normalizeRefreshRate(value);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      REFRESH_RATE_STORAGE_KEY,
      String(normalizedValue),
    );
    window.dispatchEvent(
      new CustomEvent(REFRESH_RATE_CHANGE_EVENT, {
        detail: normalizedValue,
      }),
    );
  }

  return normalizedValue;
}

export function clearStoredRefreshRate() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(REFRESH_RATE_STORAGE_KEY);
    window.dispatchEvent(
      new CustomEvent(REFRESH_RATE_CHANGE_EVENT, {
        detail: DEFAULT_REFRESH_RATE,
      }),
    );
  }
}

export function getRefreshRateLabel(value) {
  const normalizedValue = normalizeRefreshRate(value);

  if (normalizedValue === 0) {
    return "\u624b\u52a8\u5237\u65b0";
  }

  return `${normalizedValue}\u79d2`;
}
