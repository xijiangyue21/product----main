import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth';
import aliyunApiService from '../services/aliyunApiService';

const router = Router();

// 备用模拟数据，当 API 调用失败时使用
const getIndices = () => [
  { code: 'SH000001', name: '上证指数', price: (3287.45 + (Math.random() - 0.5) * 20).toFixed(2), change: (1.23 + (Math.random() - 0.5) * 0.5).toFixed(2), changePercent: (1.23 + (Math.random() - 0.5) * 0.5).toFixed(2) },
  { code: 'SZ399001', name: '深证成指', price: (10542.18 + (Math.random() - 0.5) * 50).toFixed(2), change: (0.87 + (Math.random() - 0.5) * 0.3).toFixed(2), changePercent: (0.87 + (Math.random() - 0.5) * 0.3).toFixed(2) },
  { code: 'SZ399006', name: '创业板指', price: (2156.33 + (Math.random() - 0.5) * 15).toFixed(2), change: (-0.34 + (Math.random() - 0.5) * 0.3).toFixed(2), changePercent: (-0.34 + (Math.random() - 0.5) * 0.3).toFixed(2) },
  { code: 'SH000300', name: '沪深300', price: (3891.72 + (Math.random() - 0.5) * 25).toFixed(2), change: (1.05 + (Math.random() - 0.5) * 0.4).toFixed(2), changePercent: (1.05 + (Math.random() - 0.5) * 0.4).toFixed(2) },
  { code: 'HK.HSI', name: '恒生指数', price: (19234.56 + (Math.random() - 0.5) * 100).toFixed(2), change: (2.14 + (Math.random() - 0.5) * 0.5).toFixed(2), changePercent: (2.14 + (Math.random() - 0.5) * 0.5).toFixed(2) },
  { code: 'NASDAQ', name: '纳斯达克', price: (17845.23 + (Math.random() - 0.5) * 80).toFixed(2), change: (-0.56 + (Math.random() - 0.5) * 0.4).toFixed(2), changePercent: (-0.56 + (Math.random() - 0.5) * 0.4).toFixed(2) },
];

const stocksData: Record<string, { symbol: string; name: string; price: number; open: number; high: number; low: number; volume: string; pe: string; pb: string; roe: string; revenueGrowth: string }> = {
  '600519': { symbol: '600519.SH', name: '贵州茅台', price: 1742.50, open: 1718.00, high: 1756.80, low: 1710.20, volume: '3.24亿', pe: '28.4', pb: '9.8', roe: '32.6', revenueGrowth: '+18.5' },
  '300750': { symbol: '300750.SZ', name: '宁德时代', price: 195.60, open: 193.00, high: 198.40, low: 191.20, volume: '8.56亿', pe: '32.1', pb: '5.2', roe: '18.3', revenueGrowth: '+12.4' },
  '600036': { symbol: '600036.SH', name: '招商银行', price: 39.85, open: 39.20, high: 40.10, low: 38.90, volume: '12.3亿', pe: '6.8', pb: '1.1', roe: '16.2', revenueGrowth: '+8.7' },
  '002594': { symbol: '002594.SZ', name: '比亚迪', price: 285.40, open: 280.00, high: 288.60, low: 278.30, volume: '15.7亿', pe: '22.5', pb: '4.3', roe: '19.8', revenueGrowth: '+28.3' },
  '688981': { symbol: '688981.SH', name: '中芯国际', price: 62.18, open: 63.00, high: 64.20, low: 61.50, volume: '5.2亿', pe: '45.2', pb: '3.8', roe: '8.4', revenueGrowth: '+15.6' },
  '601012': { symbol: '601012.SH', name: '隆基绿能', price: 24.56, open: 24.20, high: 25.10, low: 24.00, volume: '9.8亿', pe: '18.3', pb: '2.1', roe: '11.5', revenueGrowth: '-5.2' },
  '300059': { symbol: '300059.SZ', name: '东方财富', price: 18.92, open: 18.30, high: 19.20, low: 18.10, volume: '22.4亿', pe: '28.7', pb: '3.5', roe: '12.3', revenueGrowth: '+22.1' },
};

const sectors = [
  { name: '人工智能', changePercent: '+4.82', width: 96 },
  { name: '半导体', changePercent: '+3.67', width: 73 },
  { name: '新能源车', changePercent: '+2.91', width: 58 },
  { name: '白酒', changePercent: '+1.65', width: 33 },
  { name: '医药生物', changePercent: '-0.43', width: 9 },
  { name: '银行', changePercent: '+0.92', width: 18 },
  { name: '房地产', changePercent: '-1.23', width: 5 },
];

const generateOrderBook = (basePrice: number) => ({
  asks: [
    { level: '卖五', price: (basePrice + 15.5).toFixed(2), volume: Math.floor(Math.random() * 3000 + 1000) },
    { level: '卖四', price: (basePrice + 14.0).toFixed(2), volume: Math.floor(Math.random() * 2500 + 800) },
    { level: '卖三', price: (basePrice + 12.5).toFixed(2), volume: Math.floor(Math.random() * 4000 + 1500) },
    { level: '卖二', price: (basePrice + 11.3).toFixed(2), volume: Math.floor(Math.random() * 1500 + 500) },
    { level: '卖一', price: (basePrice + 10.1).toFixed(2), volume: Math.floor(Math.random() * 2000 + 800) },
  ],
  bids: [
    { level: '买一', price: (basePrice - 0.5).toFixed(2), volume: Math.floor(Math.random() * 2500 + 1000) },
    { level: '买二', price: (basePrice - 2.0).toFixed(2), volume: Math.floor(Math.random() * 4000 + 2000) },
    { level: '买三', price: (basePrice - 2.5).toFixed(2), volume: Math.floor(Math.random() * 1500 + 600) },
    { level: '买四', price: (basePrice - 3.7).toFixed(2), volume: Math.floor(Math.random() * 5000 + 3000) },
    { level: '买五', price: (basePrice - 5.0).toFixed(2), volume: Math.floor(Math.random() * 3000 + 1500) },
  ],
});

const newsData = [
  { id: '1', category: '重大', categoryType: 'major', title: '贵州茅台发布2025年度业绩预告，净利润同比增长18.5%，超市场预期', time: '14:28', symbol: '600519', image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=120&h=80&fit=crop' },
  { id: '2', category: '行业', categoryType: 'industry', title: '半导体板块持续走强，中芯国际、华虹半导体等龙头股集体拉升', time: '13:55', symbol: '688981', image: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=120&h=80&fit=crop' },
  { id: '3', category: '公告', categoryType: 'announcement', title: '宁德时代宣布与多家车企签署战略合作协议，新型固态电池量产提速', time: '11:30', symbol: '300750', image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=120&h=80&fit=crop' },
  { id: '4', category: '宏观', categoryType: 'macro', title: '央行宣布降准0.5个百分点，释放长期资金约1万亿元，市场流动性改善', time: '10:15', symbol: null, image: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=120&h=80&fit=crop' },
  { id: '5', category: '行业', categoryType: 'industry', title: '新能源汽车1月销量同比增长45%，比亚迪、理想等品牌表现亮眼', time: '09:42', symbol: '002594', image: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=120&h=80&fit=crop' },
  { id: '6', category: '重大', categoryType: 'major', title: '东方财富发布季报，经纪业务收入同比增长32%，用户规模突破2000万', time: '09:10', symbol: '300059', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=120&h=80&fit=crop' },
];

// Get market indices
router.get('/indices', authenticateJWT, async (_req: Request, res: Response) => {
  try {
    const data = await aliyunApiService.getIndices();
    // 转换阿里云 API 响应格式为前端期望的格式
    // 阿里云 API 返回的数据结构为 { data: { data: { list: [...], msg: "成功", success: true, code: 200, taskNo: "..." } } }
    const formattedData = data.data?.data?.list || getIndices();
    res.json({ success: true, data: formattedData });
  } catch (error) {
    console.error('获取指数数据失败:', error);
    // 失败时使用模拟数据
    res.json({ success: true, data: getIndices() });
  }
});

// Get stock quote
router.get('/quote/:code', authenticateJWT, async (req: Request, res: Response) => {
  const code = req.params.code as string;
  try {
    const data = await aliyunApiService.getStockQuote(code);
    // 转换阿里云 API 响应格式为前端期望的格式
    const formattedData = {
      ...data.data,
      orderBook: data.data.orderBook || generateOrderBook(parseFloat(data.data.price)),
    };
    res.json({ success: true, data: formattedData });
  } catch (error) {
    console.error('获取股票行情失败:', error);
    // 失败时使用模拟数据
    const stock = stocksData[code];
    if (!stock) return res.status(404).json({ success: false, message: 'Stock not found' });
    const priceVariation = (Math.random() - 0.5) * 10;
    const currentPrice = stock.price + priceVariation;
    const changeAmount = currentPrice - stock.open;
    const changePercent = ((changeAmount / stock.open) * 100);
    res.json({
      success: true,
      data: {
        ...stock,
        price: currentPrice.toFixed(2),
        change: changeAmount.toFixed(2),
        changePercent: changePercent.toFixed(2),
        orderBook: generateOrderBook(currentPrice),
      },
    });
  }
});

// Get all stocks list
router.get('/stocks', authenticateJWT, async (_req: Request, res: Response) => {
  try {
    const data = await aliyunApiService.getStocks();
    // 转换阿里云 API 响应格式为前端期望的格式
    const formattedData = data.data?.data?.list || Object.entries(stocksData).map(([code, s]) => ({
      code,
      symbol: s.symbol,
      name: s.name,
      price: (s.price + (Math.random() - 0.5) * 5).toFixed(2),
      changePercent: ((Math.random() - 0.4) * 5).toFixed(2),
    }));
    res.json({ success: true, data: formattedData });
  } catch (error) {
    console.error('获取股票列表失败:', error);
    // 失败时使用模拟数据
    const list = Object.entries(stocksData).map(([code, s]) => ({
      code,
      symbol: s.symbol,
      name: s.name,
      price: (s.price + (Math.random() - 0.5) * 5).toFixed(2),
      changePercent: ((Math.random() - 0.4) * 5).toFixed(2),
    }));
    res.json({ success: true, data: list });
  }
});

// Get sectors
router.get('/sectors', authenticateJWT, async (_req: Request, res: Response) => {
  try {
    const data = await aliyunApiService.getSectors();
    // 转换阿里云 API 响应格式为前端期望的格式
    let formattedData = data.data?.data?.list || sectors;
    
    // 计算涨跌幅度百分比并设置width属性
    if (Array.isArray(formattedData) && formattedData.length > 0) {
      // 找出最大的涨跌幅度绝对值
      const maxChange = Math.max(
        ...formattedData.map(item => Math.abs(parseFloat(item.changeRate)))
      );
      
      // 计算每个板块的宽度百分比
      formattedData = formattedData.map(item => {
        const changeRate = parseFloat(item.changeRate);
        const width = maxChange > 0 ? (Math.abs(changeRate) / maxChange) * 100 : 0;
        return {
          ...item,
          changePercent: changeRate.toFixed(2),
          width: Math.min(Math.round(width), 100) // 限制宽度最大为100%
        };
      });
    }
    
    res.json({ success: true, data: formattedData });
  } catch (error) {
    console.error('获取行业板块失败:', error);
    // 失败时使用模拟数据
    res.json({ success: true, data: sectors });
  }
});

// Get news
router.get('/news', authenticateJWT, async (req: Request, res: Response) => {
  const category = req.query.category as string | undefined;
  try {
    const data = await aliyunApiService.getNews(category);
    // 转换阿里云 API 响应格式为前端期望的格式
    const formattedData = data.data?.data?.list || newsData;
    res.json({ success: true, data: formattedData });
  } catch (error) {
    console.error('获取新闻失败:', error);
    // 失败时使用模拟数据
    let filtered = newsData;
    if (category && category !== 'all') {
      filtered = newsData.filter(n => n.categoryType === category);
    }
    res.json({ success: true, data: filtered });
  }
});

// Get stock fundamentals
router.get('/fundamentals/:code', authenticateJWT, async (req: Request, res: Response) => {
  const code = req.params.code as string;
  try {
    const data = await aliyunApiService.getFundamentals(code);
    // 转换阿里云 API 响应格式为前端期望的格式
    const formattedData = data.data || {
      symbol: stocksData[code]?.symbol,
      name: stocksData[code]?.name,
      pe: stocksData[code]?.pe,
      pb: stocksData[code]?.pb,
      roe: stocksData[code]?.roe,
      revenueGrowth: stocksData[code]?.revenueGrowth,
      events: [
        { date: '2026-03-10', title: '年度分红方案公告', type: '分红' },
        { date: '2026-02-28', title: '2025年度业绩预告', type: '财报' },
        { date: '2026-01-15', title: '机构调研纪要披露', type: '公告' },
      ],
    };
    res.json({ success: true, data: formattedData });
  } catch (error) {
    console.error('获取基本面数据失败:', error);
    // 失败时使用模拟数据
    const stock = stocksData[code];
    if (!stock) return res.status(404).json({ success: false, message: 'Stock not found' });
    res.json({
      success: true,
      data: {
        symbol: stock.symbol,
        name: stock.name,
        pe: stock.pe,
        pb: stock.pb,
        roe: stock.roe,
        revenueGrowth: stock.revenueGrowth,
        events: [
          { date: '2026-03-10', title: '年度分红方案公告', type: '分红' },
          { date: '2026-02-28', title: '2025年度业绩预告', type: '财报' },
          { date: '2026-01-15', title: '机构调研纪要披露', type: '公告' },
        ],
      },
    });
  }
});

// Get K-line chart data
router.get('/kline/:code', authenticateJWT, async (req: Request, res: Response) => {
  const code = req.params.code as string;
  try {
    const data = await aliyunApiService.getKline(code);
    // 转换阿里云 API 响应格式为前端期望的格式
    const formattedData = data.data || [];
    if (formattedData.length === 0) {
      // 如果 API 返回空数据，使用模拟数据
      const stock = stocksData[code];
      const basePrice = stock ? stock.price : 100;
      const points = [];
      let price = basePrice * 0.85;
      for (let i = 60; i >= 0; i--) {
        price = price * (1 + (Math.random() - 0.48) * 0.02);
        const date = new Date();
        date.setDate(date.getDate() - i);
        points.push({
          date: date.toISOString().split('T')[0],
          open: (price * (1 - Math.random() * 0.01)).toFixed(2),
          close: price.toFixed(2),
          high: (price * (1 + Math.random() * 0.015)).toFixed(2),
          low: (price * (1 - Math.random() * 0.015)).toFixed(2),
          volume: Math.floor(Math.random() * 50000000 + 10000000),
        });
      }
      res.json({ success: true, data: points });
    } else {
      res.json({ success: true, data: formattedData });
    }
  } catch (error) {
    console.error('获取 K 线数据失败:', error);
    // 失败时使用模拟数据
    const stock = stocksData[code];
    const basePrice = stock ? stock.price : 100;
    const points = [];
    let price = basePrice * 0.85;
    for (let i = 60; i >= 0; i--) {
      price = price * (1 + (Math.random() - 0.48) * 0.02);
      const date = new Date();
      date.setDate(date.getDate() - i);
      points.push({
        date: date.toISOString().split('T')[0],
        open: (price * (1 - Math.random() * 0.01)).toFixed(2),
        close: price.toFixed(2),
        high: (price * (1 + Math.random() * 0.015)).toFixed(2),
        low: (price * (1 - Math.random() * 0.015)).toFixed(2),
        volume: Math.floor(Math.random() * 50000000 + 10000000),
      });
    }
    res.json({ success: true, data: points });
  }
});

// Get stock rank
router.get('/stock-rank', authenticateJWT, async (_req: Request, res: Response) => {
  try {
    const data = await aliyunApiService.getStockRank();
    // 转换阿里云 API 响应格式为前端期望的格式
    const formattedData = data.data?.data?.list || [];
    res.json({ success: true, data: formattedData });
  } catch (error) {
    console.error('获取股票排行失败:', error);
    // 失败时使用模拟数据
    const mockRank = [
      { code: '600519', symbol: '600519.SH', name: '贵州茅台', price: '1742.50', change: '+5.20', changePercent: '+0.30' },
      { code: '300750', symbol: '300750.SZ', name: '宁德时代', price: '195.60', change: '+2.30', changePercent: '+1.19' },
      { code: '600036', symbol: '600036.SH', name: '招商银行', price: '39.85', change: '+0.50', changePercent: '+1.27' },
      { code: '002594', symbol: '002594.SZ', name: '比亚迪', price: '285.40', change: '+3.20', changePercent: '+1.13' },
      { code: '688981', symbol: '688981.SH', name: '中芯国际', price: '62.18', change: '+1.50', changePercent: '+2.47' },
    ];
    res.json({ success: true, data: mockRank });
  }
});

export default router;
