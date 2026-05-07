import { CORE_STOCK_OPTIONS } from "@/constants/stocks";

export const STOCK_SEARCH_DEBOUNCE_MS = 250;

export function normalizeSearchResult(item) {
  return {
    code: item.code,
    symbol: item.symbol,
    name: item.name,
    price: item.price,
    source: item.source ?? (item.price ? "live" : "fallback"),
  };
}

export function mergeSearchResults(primaryResults, fallbackResults) {
  const mergedResults = [];
  const seenCodes = new Set();

  for (const item of [...primaryResults, ...fallbackResults]) {
    if (!item?.code || seenCodes.has(item.code)) {
      continue;
    }

    seenCodes.add(item.code);
    mergedResults.push(normalizeSearchResult(item));
  }

  return mergedResults;
}

export function isStockCodeQuery(query) {
  return /^[a-z0-9.]+$/i.test(query.trim());
}

export function normalizeStockCodeQuery(query) {
  const normalizedQuery = query.trim().toUpperCase();
  const prefixedMatch = normalizedQuery.match(/^(SH|SZ|BJ)(\d{6})$/);
  if (prefixedMatch) {
    return prefixedMatch[2];
  }

  const suffixedMatch = normalizedQuery.match(/^(\d{6})\.(SH|SZ|BJ)$/);
  if (suffixedMatch) {
    return suffixedMatch[1];
  }

  return normalizedQuery.match(/^\d{6}$/) ? normalizedQuery : "";
}

function marketSuffixFromCode(code) {
  if (/^(000|001|002|003|300|301)/.test(code)) {
    return "SZ";
  }
  if (/^(4|8|43|92)/.test(code)) {
    return "BJ";
  }
  return "SH";
}

export function createFallbackSearchResults(query) {
  const normalizedQuery = query.trim().toLowerCase();

  const localResults = CORE_STOCK_OPTIONS.filter((item) => {
    return [item.code, item.symbol].some((value) =>
      value.toLowerCase().includes(normalizedQuery),
    );
  }).map((item) => ({
    ...item,
    source: "fallback",
  }));

  if (localResults.length > 0) {
    return localResults;
  }

  const normalizedCode = normalizeStockCodeQuery(query);
  if (!normalizedCode) {
    return [];
  }

  return [
    {
      code: normalizedCode,
      symbol: `${normalizedCode}.${marketSuffixFromCode(normalizedCode)}`,
      name: normalizedCode,
      price: null,
      source: "fallback",
    },
  ];
}
