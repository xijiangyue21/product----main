import { useState, useEffect } from 'react';
import { feedbackApi, authApi } from '@/lib/api';
import type { User } from '@/types';
import { User as UserIcon, Settings, Download, MessageSquare, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function ProfileView() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState('dark');
  const [refreshRate, setRefreshRate] = useState('3');
  const [feedback, setFeedback] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    setLoading(true);
    try {
      const res = await authApi.me();
      if (res.success) {
        setUser(res.data);
        setTheme(res.data.theme || 'dark');
        setRefreshRate(String(res.data.refreshRate || 3));
      }
    } catch (e) {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!feedback.trim()) { toast.error('请输入反馈内容'); return; }
    setSubmittingFeedback(true);
    try {
      const res = await feedbackApi.submit(feedback.trim());
      if (res.success) {
        setFeedback('');
        toast.success('反馈已提交，感谢您的建议！');
      }
    } catch (e) {
      toast.error('提交失败');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleExportPortfolio = () => {
    toast.info('持仓数据导出功能即将上线');
  };

  const handleExportTrades = () => {
    toast.info('交易记录导出功能即将上线');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitial = (name: string) => name ? name.charAt(0).toUpperCase() : 'U';

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[#E8F0F8] flex items-center gap-2">
        <UserIcon className="w-5 h-5 text-[#00FF88]" />
        个人中心
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* User Info */}
        <div className="space-y-4">
          <div className="bg-[#0F1620] border border-[#1A2A3A] rounded-xl p-5">
            {loading ? (
              <div className="text-xs font-mono text-[#5A7A9A]">加载中...</div>
            ) : user ? (
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#00FF88] to-[#0EA5E9] flex items-center justify-center text-xl font-bold text-[#080C10] flex-shrink-0">
                  {getInitial(user.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[#E8F0F8] text-base">{user.name}</div>
                  <div className="text-sm text-[#5A7A9A] font-mono truncate">{user.email}</div>
                  <div className="text-xs text-[#00FF88] font-mono mt-1">
                    进阶投资者 · 注册于 {new Date(user.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit' })}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: '自选股', value: '12', icon: '★' },
              { label: '活跃预警', value: '8', icon: '◎' },
            ].map((stat, i) => (
              <div key={i} className="bg-[#0F1620] border border-[#1A2A3A] rounded-xl p-4 text-center">
                <div className="text-2xl font-bold font-mono text-[#E8F0F8]">{stat.value}</div>
                <div className="text-xs font-mono text-[#5A7A9A] mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Interface Settings */}
          <div className="bg-[#0F1620] border border-[#1A2A3A] rounded-xl p-5">
            <h4 className="text-xs font-semibold text-[#5A7A9A] uppercase tracking-wider mb-4 flex items-center gap-2">
              <Settings className="w-3.5 h-3.5" />
              界面设置
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm text-[#E8F0F8]">界面主题</label>
                <select
                  value={theme}
                  onChange={e => setTheme(e.target.value)}
                  className="bg-[#080C10] border border-[#1A2A3A] text-[#E8F0F8] text-xs font-mono rounded-lg px-3 py-1.5 outline-none focus:border-[#00FF88] transition-colors"
                >
                  <option value="dark">深色模式</option>
                  <option value="light">浅色模式</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-[#E8F0F8]">行情刷新频率</label>
                <select
                  value={refreshRate}
                  onChange={e => setRefreshRate(e.target.value)}
                  className="bg-[#080C10] border border-[#1A2A3A] text-[#E8F0F8] text-xs font-mono rounded-lg px-3 py-1.5 outline-none focus:border-[#00FF88] transition-colors"
                >
                  <option value="1">实时 (1秒)</option>
                  <option value="3">3秒</option>
                  <option value="5">5秒</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Data Export */}
          <div className="bg-[#0F1620] border border-[#1A2A3A] rounded-xl p-5">
            <h4 className="text-xs font-semibold text-[#5A7A9A] uppercase tracking-wider mb-4 flex items-center gap-2">
              <Download className="w-3.5 h-3.5" />
              数据导出
            </h4>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportPortfolio}
                className="flex-1 py-2.5 text-xs font-mono font-semibold border border-[#00FF88] text-[#00FF88] rounded-lg hover:bg-[#00FF88]/10 transition-colors"
              >
                导出持仓 Excel
              </button>
              <button
                onClick={handleExportTrades}
                className="flex-1 py-2.5 text-xs font-mono font-semibold border border-[#0EA5E9] text-[#0EA5E9] rounded-lg hover:bg-[#0EA5E9]/10 transition-colors"
              >
                导出交易记录
              </button>
            </div>
          </div>

          {/* Feedback */}
          <div className="bg-[#0F1620] border border-[#1A2A3A] rounded-xl p-5">
            <h4 className="text-xs font-semibold text-[#5A7A9A] uppercase tracking-wider mb-4 flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5" />
              意见反馈
            </h4>
            <div className="space-y-3">
              <textarea
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                rows={4}
                placeholder="请描述您的功能建议或遇到的问题..."
                className="w-full bg-[#080C10] border border-[#1A2A3A] text-[#E8F0F8] text-sm rounded-lg px-3 py-2.5 outline-none placeholder-[#5A7A9A] resize-none focus:border-[#00FF88] transition-colors"
              />
              <button
                onClick={handleFeedbackSubmit}
                disabled={submittingFeedback}
                className="w-full py-2.5 text-xs font-mono font-semibold bg-[#00FF88] text-[#080C10] rounded-lg hover:bg-[#00FF88]/90 disabled:opacity-50 transition-colors"
              >
                {submittingFeedback ? '提交中...' : '提交反馈'}
              </button>
            </div>
          </div>

          {/* Logout */}
          <div className="bg-[#0F1620] border border-[#1A2A3A] rounded-xl p-5">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-mono font-semibold border border-[#FF4560]/30 text-[#FF4560] rounded-lg hover:bg-[#FF4560]/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              退出登录
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
