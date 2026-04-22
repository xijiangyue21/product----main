import { useEffect, useState } from "react";
import { Newspaper } from "lucide-react";
import { LoadingState } from "@/components/custom/async-state";
const ANALYSIS_TABS = [
  { key: "market", label: "市场分析" },
  { key: "sector", label: "板块分析" },
  { key: "stock", label: "个股分析" },
  { key: "trend", label: "趋势预测" },
];
const HOT_SECTORS = [
  { name: "半导体", change: "+5.23%", trend: "up" },
  { name: "新能源", change: "+3.17%", trend: "up" },
  { name: "人工智能", change: "+4.56%", trend: "up" },
  { name: "医药", change: "-1.23%", trend: "down" },
  { name: "金融", change: "+0.89%", trend: "up" },
];
const RECOMMENDATIONS = [
  {
    title: "市场分析",
    content:
      "当前市场处于震荡偏强阶段，成交量温和放大，优先关注业绩兑现能力更强、趋势更稳的龙头标的。",
  },
  {
    title: "板块轮动",
    content:
      "半导体与人工智能保持活跃，新能源开始出现企稳信号，可以分批观察强势板块中的核心公司。",
  },
  {
    title: "风险提示",
    content:
      "短线波动仍然偏大，避免追高，重点留意外部市场情绪和政策变化带来的回撤风险。",
  },
  {
    title: "配置建议",
    content:
      "更适合采用均衡配置思路，用成长板块搭配防御资产，控制仓位节奏比追逐热点更重要。",
  },
];
function getSentimentText(score) {
  if (score < 40) return "市场情绪：偏悲观";
  if (score < 50) return "市场情绪：谨慎";
  if (score < 60) return "市场情绪：中性";
  if (score < 70) return "市场情绪：偏乐观";
  return "市场情绪：积极";
}
function getSentimentColor(score) {
  if (score < 40) return "bg-red-500";
  if (score < 50) return "bg-orange-500";
  if (score < 60) return "bg-amber-500";
  if (score < 70) return "bg-green-500";
  return "bg-[#16A34A]";
}
export default function NewsView() {
  const [activeTab, setActiveTab] = useState("market");
  const [sentimentScore, setSentimentScore] = useState(55);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const phase = new Date().getSeconds();
      const score = 48 + (phase % 24);
      setSentimentScore(score);
      setLoading(false);
    }, 800);
    return () => window.clearTimeout(timer);
  }, [activeTab]);
  const sentimentLabel = getSentimentText(sentimentScore);
  const sentimentColor = getSentimentColor(sentimentScore);
  return (
    <div className="space-y-4">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--app-text)]">
        <Newspaper className="h-5 w-5 text-[#16A34A]" />
        AI 市场分析
      </h2>

      <div className="scrollbar-hide flex items-center gap-2 overflow-x-auto pb-1">
        {ANALYSIS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setLoading(true);
              setActiveTab(tab.key);
            }}
            className={`whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-mono transition-colors ${
              activeTab === tab.key
                ? "border-[#16A34A]/30 bg-[#16A34A]/10 text-[#16A34A]"
                : "border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-muted)] hover:text-[var(--app-text)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--app-text)]">
                市场情绪指标
              </h3>
              <span
                className={`rounded px-2 py-1 text-xs font-mono ${loading ? "bg-[var(--app-soft)] text-[var(--app-muted)]" : `${sentimentColor} text-white`}`}
              >
                {loading ? "分析中..." : sentimentLabel}
              </span>
            </div>

            {loading ? (
              <LoadingState className="py-8 text-center text-xs font-mono text-[var(--app-muted)]" />
            ) : (
              <>
                <div className="mb-1 h-2 w-full rounded-full bg-[var(--app-soft)]">
                  <div
                    className={`h-2 rounded-full ${sentimentColor}`}
                    style={{ width: `${sentimentScore}%` }}
                  />
                </div>
                <div className="flex justify-between font-mono text-xs text-[var(--app-muted)]">
                  <span>极度悲观</span>
                  <span>中性</span>
                  <span>极度乐观</span>
                </div>
              </>
            )}
          </div>

          <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-sm">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--app-text)]">
              热门板块分析
            </h3>

            <div className="space-y-2">
              {HOT_SECTORS.map((sector, index) => (
                <div key={sector.name} className="flex items-center gap-2">
                  <span className="w-4 font-mono text-xs text-[var(--app-muted)]">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-mono text-xs text-[var(--app-text)]">
                        {sector.name}
                      </span>
                      <span
                        className={`font-mono text-xs font-semibold ${sector.trend === "up" ? "text-[#16A34A]" : "text-red-500"}`}
                      >
                        {sector.change}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-[var(--app-soft)]">
                      <div
                        className={`h-1.5 rounded-full ${sector.trend === "up" ? "bg-[#16A34A]" : "bg-red-500"}`}
                        style={{
                          width: `${Math.min(Math.abs(parseFloat(sector.change)) * 10, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-sm">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--app-text)]">
              AI 投资建议
            </h3>

            <div className="space-y-3">
              {RECOMMENDATIONS.map((recommendation) => (
                <div
                  key={recommendation.title}
                  className="rounded-lg border border-[var(--app-border)] bg-[var(--app-bg)] p-3"
                >
                  <h4 className="mb-2 text-xs font-semibold text-[var(--app-text)]">
                    {recommendation.title}
                  </h4>
                  <p className="font-mono text-xs leading-snug text-[var(--app-muted)]">
                    {recommendation.content}
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
