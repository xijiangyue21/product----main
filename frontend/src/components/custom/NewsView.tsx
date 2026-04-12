import { useState, useEffect } from 'react';
import { marketApi } from '@/lib/api';

const AI_ANALYSIS_TABS = [
  { key: 'market', label: '市场分析' },
  { key: 'sector', label: '板块分析' },
  { key: 'stock', label: '个股分析' },
  { key: 'trend', label: '趋势预测' },
];

const HOT_SECTORS = [
  { name: '半导体', change: '+5.23%', trend: 'up' },
  { name: '新能源', change: '+3.17%', trend: 'up' },
  { name: '人工智能', change: '+4.56%', trend: 'up' },
  { name: '医药', change: '-1.23%', trend: 'down' },
  { name: '金融', change: '+0.89%', trend: 'up' },
];

const RECOMMENDATIONS = [
  {
    title: '市场分析',
    content: '当前市场处于震荡上行阶段，成交量温和放大，技术指标显示市场情绪向好。建议关注业绩超预期的优质个股。'
  },
  {
    title: '板块轮动',
    content: '半导体和人工智能板块表现强势，建议关注相关产业链龙头企业。新能源板块有企稳迹象，可逢低布局。'
  },
  {
    title: '风险提示',
    content: '近期市场波动较大，建议控制仓位，避免追高。关注外部市场环境变化和政策面消息。'
  },
  {
    title: '投资策略',
    content: '建议采取均衡配置策略，适当增加科技板块比重，同时关注防御性板块的机会。'
  },
];

export default function NewsView() {
  const [activeTab, setActiveTab] = useState('market');
  const [marketSentiment, setMarketSentiment] = useState('neutral');
  const [sentimentScore, setSentimentScore] = useState(55);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 模拟AI分析数据加载
    const loadAnalysis = async () => {
      setLoading(true);
      // 模拟网络请求延迟
      setTimeout(() => {
        // 随机生成市场情绪
        const sentiments = ['bearish', 'neutral', 'bullish'];
        const randomSentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
        setMarketSentiment(randomSentiment);
        
        // 根据情绪生成分数
        let score;
        if (randomSentiment === 'bearish') {
          score = Math.floor(Math.random() * 40) + 10;
        } else if (randomSentiment === 'neutral') {
          score = Math.floor(Math.random() * 20) + 45;
        } else {
          score = Math.floor(Math.random() * 40) + 60;
        }
        setSentimentScore(score);
        setLoading(false);
      }, 1000);
    };

    loadAnalysis();
  }, []);

  const getSentimentText = () => {
    if (sentimentScore < 40) return '市场情绪：极度悲观';
    if (sentimentScore < 50) return '市场情绪：悲观';
    if (sentimentScore < 60) return '市场情绪：中性';
    if (sentimentScore < 70) return '市场情绪：乐观';
    return '市场情绪：极度乐观';
  };

  const getSentimentColor = () => {
    if (sentimentScore < 40) return 'bg-[#FF4560]';
    if (sentimentScore < 50) return 'bg-[#FF9800]';
    if (sentimentScore < 60) return 'bg-[#F59E0B]';
    if (sentimentScore < 70) return 'bg-[#4CAF50]';
    return 'bg-[#00FF88]';
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[#E8F0F8] flex items-center gap-2">
        AI市场分析
      </h2>

      {/* AI Analysis Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
        {AI_ANALYSIS_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 text-xs font-mono rounded-lg whitespace-nowrap transition-all duration-200 ${
              activeTab === tab.key
                ? 'bg-[#00FF88]/10 text-[#00FF88] border border-[#00FF88]/30'
                : 'bg-[#0F1620] text-[#5A7A9A] border border-[#1A2A3A] hover:text-[#E8F0F8]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Market Sentiment & Hot Sectors */}
        <div className="lg:col-span-2 space-y-4">
          {/* Market Sentiment */}
          <div className="bg-[#0F1620] border border-[#1A2A3A] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-[#E8F0F8] uppercase tracking-wider">
                市场情绪指标
              </h3>
              <span className={`text-xs font-mono px-2 py-1 rounded ${getSentimentColor()}`}>
                {getSentimentText()}
              </span>
            </div>
            
            <div className="w-full bg-[#1A2A3A] rounded-full h-2 mb-1">
              <div
                className={`h-2 rounded-full ${getSentimentColor()}`}
                style={{ width: `${sentimentScore}%` }}
              />
            </div>
            <div className="flex justify-between text-xs font-mono text-[#5A7A9A]">
              <span>极度悲观</span>
              <span>中性</span>
              <span>极度乐观</span>
            </div>
          </div>

          {/* Hot Sectors */}
          <div className="bg-[#0F1620] border border-[#1A2A3A] rounded-xl p-4">
            <h3 className="text-xs font-semibold text-[#E8F0F8] uppercase tracking-wider mb-3">
              热门板块分析
            </h3>
            
            <div className="space-y-2">
              {HOT_SECTORS.map((sector, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[#5A7A9A] w-4">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono text-[#E8F0F8]">{sector.name}</span>
                      <span className={`text-xs font-mono font-semibold ${
                        sector.trend === 'up' ? 'text-[#00FF88]' : 'text-[#FF4560]'
                      }`}>
                        {sector.change}
                      </span>
                    </div>
                    <div className="w-full bg-[#1A2A3A] rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${
                          sector.trend === 'up' ? 'bg-[#00FF88]' : 'bg-[#FF4560]'
                        }`}
                        style={{ 
                          width: `${Math.abs(parseFloat(sector.change)) * 10}%`,
                          maxWidth: '100%'
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="space-y-4">
          <div className="bg-[#0F1620] border border-[#1A2A3A] rounded-xl p-4">
            <h3 className="text-xs font-semibold text-[#E8F0F8] uppercase tracking-wider mb-3">
              AI投资建议
            </h3>
            
            <div className="space-y-3">
              {RECOMMENDATIONS.map((rec, i) => (
                <div key={i} className="bg-[#080C10] rounded-lg p-3 border border-[#1A2A3A]">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-xs font-semibold text-[#E8F0F8]">{rec.title}</h4>
                  </div>
                  <p className="text-xs font-mono text-[#5A7A9A] leading-snug">
                    {rec.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
