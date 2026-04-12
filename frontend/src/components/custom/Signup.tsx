import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL } from '@/config/constants';
import { Eye, EyeOff, TrendingUp } from 'lucide-react';

export default function Signup() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated === true) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name || !email || !password || !confirmPassword) { setError('请填写所有字段'); return; }
    if (password !== confirmPassword) { setError('两次输入的密码不一致'); return; }
    if (password.length < 6) { setError('密码至少6个字符'); return; }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, confirmPassword }),
      });
      const data = await response.json();
      if (data.success && data.data?.token) {
        login(data.data.token);
        navigate('/', { replace: true });
      } else {
        setError(data.message || '注册失败，请重试');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080C10] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#00FF88] flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-[#080C10]" />
            </div>
            <span className="text-2xl font-bold text-[#E8F0F8] font-mono">StockPulse</span>
          </div>
          <p className="text-sm text-[#5A7A9A] font-mono">实时股票信息系统</p>
        </div>

        {/* Card */}
        <div className="bg-[#0F1620] border border-[#1A2A3A] rounded-2xl p-8">
          <h2 className="text-xl font-bold text-[#E8F0F8] mb-6">创建账户</h2>

          {error && (
            <div className="mb-4 px-4 py-3 bg-[#FF4560]/10 border border-[#FF4560]/30 rounded-lg">
              <p className="text-sm font-mono text-[#FF4560]">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-mono text-[#5A7A9A] mb-1.5 block">姓名</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="输入您的姓名"
                className="w-full bg-[#080C10] border border-[#1A2A3A] text-[#E8F0F8] text-sm font-mono rounded-xl px-4 py-3 outline-none focus:border-[#00FF88] placeholder-[#5A7A9A] transition-colors"
                autoComplete="name"
              />
            </div>
            <div>
              <label className="text-xs font-mono text-[#5A7A9A] mb-1.5 block">邮筱地址</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="输入您的邮筱"
                className="w-full bg-[#080C10] border border-[#1A2A3A] text-[#E8F0F8] text-sm font-mono rounded-xl px-4 py-3 outline-none focus:border-[#00FF88] placeholder-[#5A7A9A] transition-colors"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="text-xs font-mono text-[#5A7A9A] mb-1.5 block">密码</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="至少6个字符"
                  className="w-full bg-[#080C10] border border-[#1A2A3A] text-[#E8F0F8] text-sm font-mono rounded-xl px-4 py-3 pr-12 outline-none focus:border-[#00FF88] placeholder-[#5A7A9A] transition-colors"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A7A9A] hover:text-[#E8F0F8] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-mono text-[#5A7A9A] mb-1.5 block">确认密码</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="再次输入密码"
                className="w-full bg-[#080C10] border border-[#1A2A3A] text-[#E8F0F8] text-sm font-mono rounded-xl px-4 py-3 outline-none focus:border-[#00FF88] placeholder-[#5A7A9A] transition-colors"
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#00FF88] text-[#080C10] text-sm font-mono font-bold rounded-xl hover:bg-[#00FF88]/90 disabled:opacity-50 transition-colors mt-2"
            >
              {loading ? '注册中...' : '创建账户'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-sm text-[#5A7A9A] font-mono">已有账户？ </span>
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-[#00FF88] font-mono hover:underline"
            >
              立即登录
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-[#5A7A9A] font-mono mt-6">
          © 2026 StockPulse · 行情数据仅供参考，不构成投资建议
        </p>
      </div>
    </div>
  );
}
