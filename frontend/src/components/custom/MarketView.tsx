import { useState, useEffect, useCallback } from 'react';
import { marketApi } from '@/lib/api';
import type { MarketIndex, StockQuote, Sector, KLinePoint } from '@/types';
import { TrendingUp, TrendingDown, RefreshCw, BarChart2 } from 'lucide-react';

const PERIODS = ['分时', '日K', '周K', '月K'];

const MiniChart = ({ points, positive }: { points: KLinePoint[]; positive: boolean }) => {
  if (!points.length) return null;
  const prices = points.map(p => parseFloat(p.close));
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const w = 300;
  const h = 80;
  const pts = prices.map((p, i) => {
    const x = (i / (prices.length - 1)) * w;
    const y = h - ((p - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');
  const fillPts = `0,${h} ${pts} ${w},${h}`;
  const color = positive ? '#00FF88' : '#FF4560';
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${positive}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" />
      <polygon points={fillPts} fill={`url(#grad-${positive})`} />
    </svg>
  );
};

export default function MarketView() {
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [stockRank, setStockRank] = useState<any[]>([]);
  const [selectedStock, setSelectedStock] = useState('600519');
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [kline, setKline] = useState<KLinePoint[]>([]);
  const [period, setPeriod] = useState('日K');
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());

  const fetchData = useCallback(async () => {
    try {
      const [idxRes, quoteRes, klineRes, rankRes] = await Promise.all([
        marketApi.getIndices(),
        marketApi.getQuote(selectedStock),
        marketApi.getKLine(selectedStock),
        marketApi.getStockRank(),
      ]);
      if (idxRes.success) setIndices(idxRes.data);
      if (quoteRes.success) setQuote(quoteRes.data);
      if (klineRes.success) setKline(klineRes.data);
      if (rankRes.success) setStockRank(rankRes.data);
    } catch (e) {
      // silent
    } finally {
      setLoading(false);
    }
  }, [selectedStock]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const isPositive = (val: string) => parseFloat(val) >= 0;

  return (
    <div className="space-y-4">
      {/* Market Ticker */}
      <div className="bg-[#0F1620] border border-[#1A2A3A] rounded-xl overflow-hidden">
        <div className="flex items-center gap-6 px-4 py-2.5 overflow-x-auto scrollbar-hide">
          {loading ? (
            <span className="text-xs font-mono text-[#5A7A9A]">加载行情数据...</span>
          ) : (
            indices.map((idx) => (
              <div key={idx.code} className="flex items-center gap-2 whitespace-nowrap">
                <span className="text-xs font-mono text-[#5A7A9A]">{idx.name}</span>
                <span className="text-sm font-mono font-semibold text-[#E8F0F8]">{idx.price}</span>
                <span className={`text-xs font-mono font-semibold ${isPositive(idx.changePercent) ? 'text-[#00FF88]' : 'text-[#FF4560]'}`}>
                  {isPositive(idx.changePercent) ? '+' : ''}{idx.changePercent}%
                </span>
              </div>
            ))
          )}
          <div className="flex items-center gap-1.5 whitespace-nowrap ml-auto">
            <span className="text-[#F59E0B] text-xs animate-pulse">● LIVE</span>
            <span className="text-xs font-mono text-[#5A7A9A]">{time.toLocaleTimeString('zh-CN')}</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart Panel */}
        <div className="lg:col-span-2 bg-[#0F1620] border border-[#1A2A3A] rounded-xl overflow-hidden">
          {/* Stock Selector */}
          <div className="flex items-center gap-2 px-4 pt-3 pb-2 border-b border-[#1A2A3A] overflow-x-auto scrollbar-hide">
            {loading ? (
              <span className="text-xs font-mono text-[#5A7A9A]">加载排行榜数据...</span>
            ) : (
              stockRank.map((s, index) => (
                <button
                  key={s.code}
                  onClick={() => setSelectedStock(s.code)}
                  className={`px-3 py-1 text-xs font-mono rounded-lg whitespace-nowrap transition-all duration-200 ${
                    selectedStock === s.code
                      ? 'bg-[#00FF88]/15 text-[#00FF88] border border-[#00FF88]/40'
                      : 'text-[#5A7A9A] border border-[#1A2A3A] hover:text-[#E8F0F8] hover:border-[#00FF88]/30'
                  }`}
                >
                  {index + 1}. {s.name}
                </button>
              ))
            )}
          </div>

          {quote && (
            <>
              <div className="flex items-start justify-between px-5 py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xl text-[#E8F0F8]">{quote.name}</span>
                    <span className="font-mono text-sm text-[#5A7A9A]">{quote.symbol}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="font-mono text-3xl font-bold text-[#E8F0F8]">{quote.price}</span>
                    <span className={`font-mono text-lg font-semibold ${isPositive(quote.change) ? 'text-[#00FF88]' : 'text-[#FF4560]'}`}>
                      {isPositive(quote.change) ? '+' : ''}{quote.change}
                    </span>
                    <span className={`font-mono text-sm px-2 py-0.5 rounded ${
                      isPositive(quote.changePercent)
                        ? 'bg-[#00FF88]/15 text-[#00FF88]'
                        : 'bg-[#FF4560]/15 text-[#FF4560]'
                    }`}>
                      {isPositive(quote.changePercent) ? '+' : ''}{quote.changePercent}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {PERIODS.map(p => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={`px-2.5 py-1 text-xs font-mono rounded-lg transition-all duration-200 ${
                        period === p
                          ? 'border border-[#00FF88] text-[#00FF88] bg-[#00FF88]/10'
                          : 'border border-[#1A2A3A] text-[#5A7A9A] hover:border-[#00FF88] hover:text-[#00FF88]'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chart */}
              <div className="h-48 px-5 pb-2">
                <MiniChart points={kline} positive={isPositive(quote.changePercent)} />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 border-t border-[#1A2A3A]">
                {[
                  { label: '今开', value: quote.open, color: 'text-[#E8F0F8]' },
                  { label: '最高', value: quote.high, color: 'text-[#00FF88]' },
                  { label: '最低', value: quote.low, color: 'text-[#FF4560]' },
                  { label: '成交量', value: quote.volume, color: 'text-[#E8F0F8]' },
                ].map((stat, i) => (
                  <div key={i} className={`px-4 py-3 ${i < 3 ? 'border-r border-[#1A2A3A]' : ''}`}>
                    <div className="text-xs font-mono text-[#5A7A9A] mb-1">{stat.label}</div>
                    <div className={`text-sm font-mono font-semibold ${stat.color}`}>{stat.value}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* AI Analysis */}
          <div className="bg-[#0F1620] border border-[#1A2A3A] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-[#E8F0F8] uppercase tracking-wider flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-[#00FF88]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                AI 分析
              </h3>
              <span className="text-xs font-mono text-[#00FF88] animate-pulse">● 实时</span>
            </div>
            <div className="space-y-3">
              <div className="bg-[#1A2A3A] rounded-lg p-3">
                <div className="text-xs font-mono text-[#00FF88] mb-2">市场情绪</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-[#0F1620] rounded-full h-2">
                    <div className="bg-gradient-to-r from-[#FF4560] via-[#FFB800] to-[#00FF88] h-2 rounded-full" style={{ width: '65%' }} />
                  </div>
                  <span className="text-xs font-mono text-[#E8F0F8]">中性偏多</span>
                </div>
              </div>
              <div className="bg-[#1A2A3A] rounded-lg p-3">
                <div className="text-xs font-mono text-[#00FF88] mb-2">热门板块</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-[#E8F0F8]">半导体</span>
                    <span className="text-xs font-mono text-[#00FF88]">+2.45%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-[#E8F0F8]">新能源</span>
                    <span className="text-xs font-mono text-[#00FF88]">+1.87%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-[#E8F0F8]">人工智能</span>
                    <span className="text-xs font-mono text-[#00FF88]">+1.56%</span>
                  </div>
                </div>
              </div>
              <div className="bg-[#1A2A3A] rounded-lg p-3">
                <div className="text-xs font-mono text-[#00FF88] mb-2">AI 推荐</div>
                <p className="text-xs font-mono text-[#5A7A9A] leading-relaxed">
                  根据技术分析，当前市场处于震荡上行趋势，建议关注半导体和新能源板块的龙头个股，同时注意控制仓位，保持合理的风险敞口。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Refresh button */}
      <div className="flex justify-end">
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono text-[#5A7A9A] border border-[#1A2A3A] rounded-lg hover:text-[#00FF88] hover:border-[#00FF88]/40 transition-all duration-200"
        >
          <RefreshCw className="w-3 h-3" />
          刷新行情
        </button>
      </div>
    </div>
  );
}
