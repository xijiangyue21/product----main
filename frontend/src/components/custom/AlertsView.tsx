import { useState, useEffect } from 'react';
import { alertsApi } from '@/lib/api';
import type { Alert, AlertHistoryItem, AlertConditionType, AlertStatus } from '@/types';
import { Plus, Trash2, Edit2, X, Bell, History, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';

const STOCK_OPTIONS = [
  { symbol: '600519', name: '贵州茅台' },
  { symbol: '300750', name: '宁德时代' },
  { symbol: '600036', name: '招商银行' },
  { symbol: '002594', name: '比亚迪' },
  { symbol: '688981', name: '中芯国际' },
  { symbol: '601012', name: '隆基绿能' },
  { symbol: '300059', name: '东方财富' },
];

const CONDITION_LABELS: Record<AlertConditionType, string> = {
  price_above: '价格 ≥',
  price_below: '价格 ≤',
  change_above: '涨幅 ≥',
  change_below: '跌幅 ≥',
};

const STATUS_CONFIG: Record<AlertStatus, { label: string; color: string; dot: string }> = {
  active: { label: '启用', color: 'text-[#00FF88]', dot: 'bg-[#00FF88]' },
  paused: { label: '暂停', color: 'text-[#F59E0B]', dot: 'bg-[#F59E0B]' },
  triggered: { label: '已触发', color: 'text-[#0EA5E9]', dot: 'bg-[#0EA5E9]' },
};

interface AlertForm {
  symbol: string;
  stockName: string;
  conditionType: AlertConditionType;
  conditionValue: string;
  notifyApp: boolean;
  notifySms: boolean;
  notifyWechat: boolean;
}

const emptyForm: AlertForm = {
  symbol: '',
  stockName: '',
  conditionType: 'price_above',
  conditionValue: '',
  notifyApp: true,
  notifySms: false,
  notifyWechat: false,
};

export default function AlertsView() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [history, setHistory] = useState<AlertHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<AlertForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'rules' | 'history'>('rules');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [alertsRes, historyRes] = await Promise.all([
        alertsApi.getAlerts(),
        alertsApi.getHistory(),
      ]);
      if (alertsRes.success) setAlerts(alertsRes.data);
      if (historyRes.success) setHistory(historyRes.data);
    } catch (e) {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleStockSelect = (symbol: string) => {
    const s = STOCK_OPTIONS.find(o => o.symbol === symbol);
    if (s) setForm(prev => ({ ...prev, symbol: s.symbol, stockName: s.name }));
  };

  const handleSubmit = async () => {
    if (!form.symbol || !form.conditionValue) {
      toast.error('请填写完整信息');
      return;
    }
    setSubmitting(true);
    try {
      if (editId) {
        const res = await alertsApi.updateAlert(editId, {
          conditionType: form.conditionType,
          conditionValue: form.conditionValue,
          notifyApp: form.notifyApp,
          notifySms: form.notifySms,
          notifyWechat: form.notifyWechat,
        });
        if (res.success) {
          setAlerts(prev => prev.map(a => a.id === editId ? res.data : a));
          toast.success('预警已更新');
        }
      } else {
        const res = await alertsApi.createAlert(form);
        if (res.success) {
          setAlerts(prev => [res.data, ...prev]);
          toast.success('预警已创建');
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

  const handleToggleStatus = async (alert: Alert) => {
    const newStatus: AlertStatus = alert.status === 'active' ? 'paused' : 'active';
    try {
      const res = await alertsApi.updateAlert(alert.id, { status: newStatus });
      if (res.success) {
        setAlerts(prev => prev.map(a => a.id === alert.id ? res.data : a));
        toast.success(`预警已${newStatus === 'active' ? '启用' : '暂停'}`);
      }
    } catch (e) {
      toast.error('操作失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await alertsApi.deleteAlert(id);
      if (res.success) {
        setAlerts(prev => prev.filter(a => a.id !== id));
        toast.success('预警已删除');
      }
    } catch (e) {
      toast.error('删除失败');
    }
  };

  const handleEdit = (alert: Alert) => {
    setForm({
      symbol: alert.symbol,
      stockName: alert.stockName,
      conditionType: alert.conditionType,
      conditionValue: alert.conditionValue,
      notifyApp: alert.notifyApp,
      notifySms: alert.notifySms,
      notifyWechat: alert.notifyWechat,
    });
    setEditId(alert.id);
    setShowForm(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#E8F0F8] flex items-center gap-2">
          <Bell className="w-5 h-5 text-[#00FF88]" />
          预警系统
        </h2>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00FF88] text-[#080C10] text-xs font-mono font-semibold rounded-lg hover:bg-[#00FF88]/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          新增预警
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-[#0F1620] border border-[#00FF88]/30 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#E8F0F8]">{editId ? '编辑预警' : '新增预警规则'}</h3>
            <button onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm); }} className="text-[#5A7A9A] hover:text-[#E8F0F8]"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-xs font-mono text-[#5A7A9A] mb-1 block">股票</label>
              <select
                value={form.symbol}
                onChange={e => handleStockSelect(e.target.value)}
                className="w-full bg-[#080C10] border border-[#1A2A3A] text-[#E8F0F8] text-sm font-mono rounded-lg px-3 py-2 outline-none focus:border-[#00FF88] transition-colors"
              >
                <option value="none">选择股票</option>
                {STOCK_OPTIONS.map(s => (
                  <option key={s.symbol} value={s.symbol}>{s.name} ({s.symbol})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-mono text-[#5A7A9A] mb-1 block">触发条件</label>
              <select
                value={form.conditionType}
                onChange={e => setForm(prev => ({ ...prev, conditionType: e.target.value as AlertConditionType }))}
                className="w-full bg-[#080C10] border border-[#1A2A3A] text-[#E8F0F8] text-sm font-mono rounded-lg px-3 py-2 outline-none focus:border-[#00FF88] transition-colors"
              >
                <option value="price_above">价格上涨至</option>
                <option value="price_below">价格下跌至</option>
                <option value="change_above">涨幅超过</option>
                <option value="change_below">跌幅超过</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-mono text-[#5A7A9A] mb-1 block">
                {form.conditionType.includes('change') ? '百分比 (%)' : '价格 (元)'}
              </label>
              <input
                type="number"
                value={form.conditionValue}
                onChange={e => setForm(prev => ({ ...prev, conditionValue: e.target.value }))}
                placeholder={form.conditionType.includes('change') ? '如：5' : '如：1800'}
                className="w-full bg-[#080C10] border border-[#1A2A3A] text-[#E8F0F8] text-sm font-mono rounded-lg px-3 py-2 outline-none focus:border-[#00FF88] placeholder-[#5A7A9A] transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-mono text-[#5A7A9A] mb-2 block">通知方式</label>
              <div className="flex items-center gap-3">
                {[
                  { key: 'notifyApp', label: 'App' },
                  { key: 'notifySms', label: '短信' },
                  { key: 'notifyWechat', label: '微信' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form[key as keyof AlertForm] as boolean}
                      onChange={e => setForm(prev => ({ ...prev, [key]: e.target.checked }))}
                      className="w-3.5 h-3.5 accent-[#00FF88]"
                    />
                    <span className="text-xs font-mono text-[#E8F0F8]">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2 bg-[#00FF88] text-[#080C10] text-xs font-mono font-semibold rounded-lg hover:bg-[#00FF88]/90 disabled:opacity-50 transition-colors"
            >
              {submitting ? '保存中...' : editId ? '更新预警' : '创建预警'}
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

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-[#0F1620] border border-[#1A2A3A] rounded-xl p-1 w-fit">
        {[
          { key: 'rules', label: '预警规则', icon: Bell },
          { key: 'history', label: '触发记录', icon: History },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as 'rules' | 'history')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-mono rounded-lg transition-all duration-200 ${
              activeTab === key
                ? 'bg-[#00FF88]/10 text-[#00FF88] border border-[#00FF88]/30'
                : 'text-[#5A7A9A] hover:text-[#E8F0F8]'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'rules' ? (
        <div className="bg-[#0F1620] border border-[#1A2A3A] rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-xs font-mono text-[#5A7A9A]">加载中...</div>
          ) : alerts.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="w-12 h-12 text-[#1A2A3A] mx-auto mb-3" />
              <p className="text-sm font-mono text-[#5A7A9A]">暂无预警规则，点击“新增预警”开始设置</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1A2A3A]">
                    {['股票', '触发条件', '通知方式', '触发次数', '状态', '操作'].map(h => (
                      <th key={h} className="text-left text-xs font-mono text-[#5A7A9A] uppercase tracking-wider pb-3 px-4 pt-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A2A3A]">
                  {alerts.map(alert => {
                    const statusCfg = STATUS_CONFIG[alert.status];
                    const isChange = alert.conditionType.includes('change');
                    const condLabel = CONDITION_LABELS[alert.conditionType];
                    const isAbove = alert.conditionType.includes('above');
                    return (
                      <tr key={alert.id} className="hover:bg-[#080C10] transition-colors group">
                        <td className="px-4 py-3">
                          <div className="text-sm font-mono font-semibold text-[#E8F0F8]">{alert.stockName}</div>
                          <div className="text-xs font-mono text-[#5A7A9A]">{alert.symbol}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-mono px-2 py-1 rounded ${
                            isAbove ? 'bg-[#00FF88]/15 text-[#00FF88]' : 'bg-[#FF4560]/15 text-[#FF4560]'
                          }`}>
                            {condLabel} {isChange ? '' : '¥'}{alert.conditionValue}{isChange ? '%' : ''}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {alert.notifyApp && <span className="text-xs font-mono bg-[#0EA5E9]/15 text-[#0EA5E9] px-1.5 py-0.5 rounded">App</span>}
                            {alert.notifySms && <span className="text-xs font-mono bg-[#F59E0B]/15 text-[#F59E0B] px-1.5 py-0.5 rounded">短信</span>}
                            {alert.notifyWechat && <span className="text-xs font-mono bg-[#00FF88]/15 text-[#00FF88] px-1.5 py-0.5 rounded">微信</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-[#E8F0F8]">{alert.triggerCount}次</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                            <span className={`text-xs font-mono ${statusCfg.color}`}>{statusCfg.label}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleStatus(alert)}
                              className="text-[#5A7A9A] hover:text-[#00FF88] transition-colors"
                              title={alert.status === 'active' ? '暂停' : '启用'}
                            >
                              {alert.status === 'active'
                                ? <ToggleRight className="w-4 h-4 text-[#00FF88]" />
                                : <ToggleLeft className="w-4 h-4" />}
                            </button>
                            <button onClick={() => handleEdit(alert)} className="text-[#5A7A9A] hover:text-[#0EA5E9] transition-colors">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDelete(alert.id)} className="text-[#5A7A9A] hover:text-[#FF4560] transition-colors">
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
      ) : (
        <div className="bg-[#0F1620] border border-[#1A2A3A] rounded-xl overflow-hidden">
          {history.length === 0 ? (
            <div className="p-12 text-center">
              <History className="w-12 h-12 text-[#1A2A3A] mx-auto mb-3" />
              <p className="text-sm font-mono text-[#5A7A9A]">暂无预警触发记录</p>
            </div>
          ) : (
            <div className="divide-y divide-[#1A2A3A]">
              {history.map(h => (
                <div key={h.id} className="flex items-center justify-between px-5 py-3 hover:bg-[#080C10] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                    <div>
                      <span className="text-sm font-mono font-semibold text-[#E8F0F8]">{h.stockName}</span>
                      <span className="text-xs font-mono text-[#5A7A9A] ml-2">{h.symbol}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-mono text-[#E8F0F8]">触发价: {h.triggerPrice}</span>
                    <span className="text-xs font-mono text-[#5A7A9A]">{new Date(h.triggeredAt).toLocaleString('zh-CN')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
