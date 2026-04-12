import { useState, useEffect } from 'react';
import { portfolioApi } from '@/lib/api';
import type { PortfolioHolding } from '@/types';
import { Plus, Trash2, Edit2, X, TrendingUp, TrendingDown, PieChart } from 'lucide-react';
import { toast } from 'sonner';

const STOCK_OPTIONS = [
  { code: '600519', symbol: '600519.SH', name: '贵州茅台', price: '1742.50' },
  { code: '300750', symbol: '300750.SZ', name: '宁德时代', price: '195.60' },
  { code: '600036', symbol: '600036.SH', name: '招商银行', price: '39.85' },
  { code: '002594', symbol: '002594.SZ', name: '比亚迪', price: '285.40' },
  { code: '688981', symbol: '688981.SH', name: '中芯国际', price: '62.18' },
  { code: '601012', symbol: '601012.SH', name: '隆基绿能', price: '24.56' },
  { code: '300059', symbol: '300059.SZ', name: '东方财富', price: '18.92' },
];

const COLORS = ['#00FF88', '#0EA5E9', '#F59E0B', '#FF4560', '#8B5CF6', '#EC4899', '#14B8A6'];

interface HoldingForm {
  symbol: string;
  name: string;
  shares: string;
  costPrice: string;
  currentPrice: string;
}

const emptyForm: HoldingForm = { symbol: '', name: '', shares: '', costPrice: '', currentPrice: '' };

export default function PortfolioView() {
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<HoldingForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadHoldings(); }, []);

  const loadHoldings = async () => {
    setLoading(true);
    try {
      const res = await portfolioApi.getHoldings();
      if (res.success) setHoldings(res.data);
    } catch (e) {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleStockSelect = (symbol: string) => {
    const s = STOCK_OPTIONS.find(o => o.symbol === symbol);
    if (s) setForm(prev => ({ ...prev, symbol: s.symbol, name: s.name, currentPrice: s.price }));
  };

  const handleSubmit = async () => {
    if (!form.symbol || !form.shares || !form.costPrice) {
      toast.error('请填写完整信息');
      return;
    }
    setSubmitting(true);
    try {
      if (editId) {
        const res = await portfolioApi.updateHolding(editId, {
          shares: form.shares,
          costPrice: form.costPrice,
          currentPrice: form.currentPrice,
        });
        if (res.success) {
          setHoldings(prev => prev.map(h => h.id === editId ? res.data : h));
          toast.success('持仓已更新');
        }
      } else {
        const res = await portfolioApi.createHolding(form);
        if (res.success) {
          setHoldings(prev => [...prev, res.data]);
          toast.success('持仓已添加');
        }
      }
      setShowForm(false);
      setEditId(null);
      setForm(emptyForm);
    } catch (e) {
      toast.error('操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (h: PortfolioHolding) => {
    setForm({ symbol: h.symbol, name: h.name, shares: h.shares, costPrice: h.costPrice, currentPrice: h.currentPrice });
    setEditId(h.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      const res = await portfolioApi.deleteHolding(id);
      if (res.success) {
        setHoldings(prev => prev.filter(h => h.id !== id));
        toast.success(`${name} 已从持仓移除`);
      }
    } catch (e) {
      toast.error('删除失败');
    }
  };

  // Calculations
  const totalCost = holdings.reduce((sum, h) => sum + parseFloat(h.shares) * parseFloat(h.costPrice), 0);
  const totalValue = holdings.reduce((sum, h) => sum + parseFloat(h.shares) * parseFloat(h.currentPrice), 0);
  const totalPnl = totalValue - totalCost;
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#E8F0F8] flex items-center gap-2">
          <PieChart className="w-5 h-5 text-[#00FF88]" />
          持仓管理
        </h2>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00FF88] text-[#080C10] text-xs font-mono font-semibold rounded-lg hover:bg-[#00FF88]/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          添加持仓
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: '总资产', value: `¥${totalValue.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: 'text-[#E8F0F8]' },
          { label: '总成本', value: `¥${totalCost.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: 'text-[#5A7A9A]' },
          { label: '浮动盈亏', value: `${totalPnl >= 0 ? '+' : ''}¥${totalPnl.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: totalPnl >= 0 ? 'text-[#00FF88]' : 'text-[#FF4560]' },
          { label: '收益率', value: `${totalPnlPct >= 0 ? '+' : ''}${totalPnlPct.toFixed(2)}%`, color: totalPnlPct >= 0 ? 'text-[#00FF88]' : 'text-[#FF4560]' },
        ].map((card, i) => (
          <div key={i} className="bg-[#0F1620] border border-[#1A2A3A] rounded-xl p-4">
            <div className="text-xs font-mono text-[#5A7A9A] mb-1">{card.label}</div>
            <div className={`text-lg font-bold font-mono ${card.color}`}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-[#0F1620] border border-[#00FF88]/30 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#E8F0F8]">{editId ? '编辑持仓' : '添加持仓'}</h3>
            <button onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm); }} className="text-[#5A7A9A] hover:text-[#E8F0F8]"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono text-[#5A7A9A] mb-1 block">股票</label>
              <select
                value={form.symbol}
                onChange={e => handleStockSelect(e.target.value)}
                className="w-full bg-[#080C10] border border-[#1A2A3A] text-[#E8F0F8] text-sm font-mono rounded-lg px-3 py-2 outline-none focus:border-[#00FF88] transition-colors"
              >
                <option value="none">选择股票</option>
                {STOCK_OPTIONS.map(s => (
                  <option key={s.code} value={s.symbol}>{s.name} ({s.symbol})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-mono text-[#5A7A9A] mb-1 block">持股数量</label>
              <input
                type="number"
                value={form.shares}
                onChange={e => setForm(prev => ({ ...prev, shares: e.target.value }))}
                placeholder="输入持股数量"
                className="w-full bg-[#080C10] border border-[#1A2A3A] text-[#E8F0F8] text-sm font-mono rounded-lg px-3 py-2 outline-none focus:border-[#00FF88] placeholder-[#5A7A9A] transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-mono text-[#5A7A9A] mb-1 block">成本价 (元)</label>
              <input
                type="number"
                value={form.costPrice}
                onChange={e => setForm(prev => ({ ...prev, costPrice: e.target.value }))}
                placeholder="输入均成本价"
                className="w-full bg-[#080C10] border border-[#1A2A3A] text-[#E8F0F8] text-sm font-mono rounded-lg px-3 py-2 outline-none focus:border-[#00FF88] placeholder-[#5A7A9A] transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-mono text-[#5A7A9A] mb-1 block">当前价 (元)</label>
              <input
                type="number"
                value={form.currentPrice}
                onChange={e => setForm(prev => ({ ...prev, currentPrice: e.target.value }))}
                placeholder="当前市场价格"
                className="w-full bg-[#080C10] border border-[#1A2A3A] text-[#E8F0F8] text-sm font-mono rounded-lg px-3 py-2 outline-none focus:border-[#00FF88] placeholder-[#5A7A9A] transition-colors"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2 bg-[#00FF88] text-[#080C10] text-xs font-mono font-semibold rounded-lg hover:bg-[#00FF88]/90 disabled:opacity-50 transition-colors"
            >
              {submitting ? '保存中...' : editId ? '更新持仓' : '添加持仓'}
            </button>
            <button
              onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm); }}
              className="px-6 py-2 border border-[#1A2A3A] text-[#5A7A9A] text-xs font-mono rounded-lg hover:text-[#E8F0F8] transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* Holdings Table */}
      <div className="bg-[#0F1620] border border-[#1A2A3A] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1A2A3A]">
          <h3 className="text-xs font-semibold text-[#E8F0F8] uppercase tracking-wider">持仓明细</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center text-xs font-mono text-[#5A7A9A]">加载中...</div>
        ) : holdings.length === 0 ? (
          <div className="p-12 text-center">
            <PieChart className="w-12 h-12 text-[#1A2A3A] mx-auto mb-3" />
            <p className="text-sm font-mono text-[#5A7A9A]">暂无持仓，点击“添加持仓”开始管理</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1A2A3A]">
                  {['股票', '持股数', '成本价', '当前价', '市值', '浮动盈亏', '收益率', '占比', '操作'].map(h => (
                    <th key={h} className="text-left text-xs font-mono text-[#5A7A9A] uppercase tracking-wider pb-3 px-4 pt-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A2A3A]">
                {holdings.map((h, idx) => {
                  const shares = parseFloat(h.shares);
                  const cost = parseFloat(h.costPrice);
                  const current = parseFloat(h.currentPrice);
                  const value = shares * current;
                  const pnl = shares * (current - cost);
                  const pnlPct = cost > 0 ? ((current - cost) / cost) * 100 : 0;
                  const weight = totalValue > 0 ? (value / totalValue) * 100 : 0;
                  const isPos = pnl >= 0;
                  return (
                    <tr key={h.id} className="hover:bg-[#080C10] transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                          <div>
                            <div className="text-sm font-mono font-semibold text-[#E8F0F8]">{h.name}</div>
                            <div className="text-xs font-mono text-[#5A7A9A]">{h.symbol}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-[#E8F0F8]">{shares.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm font-mono text-[#E8F0F8]">{cost.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm font-mono text-[#E8F0F8]">{current.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm font-mono text-[#E8F0F8]">¥{value.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                      <td className={`px-4 py-3 text-sm font-mono ${isPos ? 'text-[#00FF88]' : 'text-[#FF4560]'}`}>
                        {isPos ? '+' : ''}¥{pnl.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </td>
                      <td className={`px-4 py-3 text-sm font-mono ${isPos ? 'text-[#00FF88]' : 'text-[#FF4560]'}`}>
                        {isPos ? '+' : ''}{pnlPct.toFixed(2)}%
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-[#1A2A3A] rounded-full h-1">
                            <div className="h-1 rounded-full bg-[#00FF88]" style={{ width: `${Math.min(weight, 100)}%` }} />
                          </div>
                          <span className="text-xs font-mono text-[#5A7A9A]">{weight.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(h)} className="text-xs font-mono text-[#5A7A9A] hover:text-[#0EA5E9] transition-colors">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(h.id, h.name)} className="text-xs font-mono text-[#5A7A9A] hover:text-[#FF4560] transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Portfolio Composition */}
      {holdings.length > 0 && (
        <div className="bg-[#0F1620] border border-[#1A2A3A] rounded-xl p-5">
          <h3 className="text-xs font-semibold text-[#E8F0F8] uppercase tracking-wider mb-4">持仓占比</h3>
          <div className="space-y-3">
            {holdings.map((h, idx) => {
              const value = parseFloat(h.shares) * parseFloat(h.currentPrice);
              const weight = totalValue > 0 ? (value / totalValue) * 100 : 0;
              const pnlPct = parseFloat(h.costPrice) > 0
                ? ((parseFloat(h.currentPrice) - parseFloat(h.costPrice)) / parseFloat(h.costPrice)) * 100
                : 0;
              return (
                <div key={h.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-[#E8F0F8]">{h.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-[#5A7A9A]">¥{value.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}</span>
                      <span className={`text-xs font-mono ${pnlPct >= 0 ? 'text-[#00FF88]' : 'text-[#FF4560]'}`}>
                        {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-[#1A2A3A] rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${weight}%`, backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
