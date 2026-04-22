export const CORE_STOCK_OPTIONS = [
  {
    code: "600519",
    symbol: "600519.SH",
    name: "贵州茅台",
    price: "1742.50",
    aliases: ["茅台", "白酒", "Kweichow Moutai"],
  },
  {
    code: "300750",
    symbol: "300750.SZ",
    name: "宁德时代",
    price: "195.60",
    aliases: ["宁王", "电池", "CATL"],
  },
  {
    code: "600036",
    symbol: "600036.SH",
    name: "招商银行",
    price: "39.85",
    aliases: ["招行", "银行", "China Merchants Bank"],
  },
  {
    code: "002594",
    symbol: "002594.SZ",
    name: "比亚迪",
    price: "285.40",
    aliases: ["BYD", "新能源车"],
  },
  {
    code: "688981",
    symbol: "688981.SH",
    name: "中芯国际",
    price: "62.18",
    aliases: ["芯片", "半导体", "SMIC"],
  },
  {
    code: "601012",
    symbol: "601012.SH",
    name: "隆基绿能",
    price: "24.56",
    aliases: ["光伏", "LONGi"],
  },
  {
    code: "300059",
    symbol: "300059.SZ",
    name: "东方财富",
    price: "18.92",
    aliases: ["东财", "券商", "East Money"],
  },
];

export function findStockOption(symbol) {
  return CORE_STOCK_OPTIONS.find((stock) => stock.symbol === symbol);
}

export function filterStockOptions(query) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return CORE_STOCK_OPTIONS;
  }

  return CORE_STOCK_OPTIONS.filter((stock) => {
    const haystacks = [
      stock.code,
      stock.symbol,
      stock.name,
      ...(stock.aliases ?? []),
    ].map((value) => value.toLowerCase());

    return haystacks.some((value) => value.includes(normalizedQuery));
  });
}

export function getStockPriceSummary(stocks, symbol) {
  const stock = stocks.find((item) => item.symbol === symbol);

  return stock
    ? { price: stock.price, changePercent: stock.changePercent }
    : null;
}
