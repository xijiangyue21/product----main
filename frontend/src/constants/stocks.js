export const CORE_STOCK_OPTIONS = [
  {
    code: "600519",
    symbol: "600519.SH",
    name: "贵州茅台",
    aliases: ["茅台", "白酒", "Kweichow Moutai"],
  },
  {
    code: "300750",
    symbol: "300750.SZ",
    name: "宁德时代",
    aliases: ["宁王", "电池", "CATL"],
  },
  {
    code: "000686",
    symbol: "000686.SZ",
    name: "东北证券",
    aliases: ["券商", "证券", "Northeast Securities"],
  },
  {
    code: "600036",
    symbol: "600036.SH",
    name: "招商银行",
    aliases: ["招行", "银行", "China Merchants Bank"],
  },
  {
    code: "002594",
    symbol: "002594.SZ",
    name: "比亚迪",
    aliases: ["BYD", "新能源车"],
  },
  {
    code: "688981",
    symbol: "688981.SH",
    name: "中芯国际",
    aliases: ["芯片", "半导体", "SMIC"],
  },
  {
    code: "601012",
    symbol: "601012.SH",
    name: "隆基绿能",
    aliases: ["光伏", "LONGi"],
  },
  {
    code: "300059",
    symbol: "300059.SZ",
    name: "东方财富",
    aliases: ["东财", "券商", "East Money"],
  },
  {
    code: "688699",
    symbol: "688699.SH",
    name: "明微电子",
    aliases: ["明微", "显示驱动", "集成电路", "Mingwei"],
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
