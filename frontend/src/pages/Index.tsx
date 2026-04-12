import { useState } from 'react';
import { TrendingUp, Star, PieChart, Bell, Newspaper, User, Menu, X, Search } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import OmniflowBadge from '@/components/custom/OmniflowBadge';
import MarketView from '@/components/custom/MarketView';
import WatchlistView from '@/components/custom/WatchlistView';
import PortfolioView from '@/components/custom/PortfolioView';
import AlertsView from '@/components/custom/AlertsView';
import NewsView from '@/components/custom/NewsView';
import ProfileView from '@/components/custom/ProfileView';
import type { ViewType } from '@/types';

const NAV_ITEMS: { key: ViewType; label: string; icon: React.ElementType }[] = [
  { key: 'market', label: '行情', icon: TrendingUp },
  { key: 'watchlist', label: '自选股', icon: Star },
  { key: 'portfolio', label: '持仓', icon: PieChart },
  { key: 'alerts', label: '预警', icon: Bell },
  { key: 'news', label: '资讯', icon: Newspaper },
  { key: 'profile', label: '我的', icon: User },
];

export default function Index() {
  const [currentView, setCurrentView] = useState<ViewType>('market');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleNavClick = (view: ViewType) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
  };

  const renderView = () => {
    switch (currentView) {
      case 'market': return <MarketView />;
      case 'watchlist': return <WatchlistView />;
      case 'portfolio': return <PortfolioView />;
      case 'alerts': return <AlertsView />;
      case 'news': return <NewsView />;
      case 'profile': return <ProfileView />;
      default: return <MarketView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#080C10] text-[#E8F0F8]">
      {/* Top Navigation */}
      <nav className="border-b border-[#1A2A3A] bg-[#0F1620]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-[#00FF88] flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-[#080C10]" />
                </div>
                <span className="font-bold text-lg tracking-tight text-[#E8F0F8] font-mono">StockPulse</span>
              </div>

              {/* Desktop Nav */}
              <div className="hidden md:flex items-center gap-1 ml-6">
                {NAV_ITEMS.map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      onClick={() => handleNavClick(item.key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md font-mono transition-all duration-200 ${
                        currentView === item.key
                          ? 'text-[#00FF88] bg-[#00FF88]/10'
                          : 'text-[#5A7A9A] hover:text-[#E8F0F8]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="hidden sm:flex items-center gap-2 bg-[#080C10] border border-[#1A2A3A] rounded-lg px-3 py-1.5">
                <Search className="w-4 h-4 text-[#5A7A9A]" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="搜索股票代码/名称"
                  className="bg-transparent text-sm text-[#E8F0F8] placeholder-[#5A7A9A] outline-none w-36 font-mono"
                />
              </div>

              {/* Notification Bell */}
              <button
                onClick={() => handleNavClick('alerts')}
                className="relative w-8 h-8 rounded-full bg-[#1A2A3A] flex items-center justify-center hover:bg-[#00FF88]/20 transition-colors"
              >
                <Bell className="w-4 h-4 text-[#5A7A9A]" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#FF4560] rounded-full" />
              </button>

              {/* Profile Avatar */}
              <button
                onClick={() => handleNavClick('profile')}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00FF88] to-[#0EA5E9] flex items-center justify-center text-xs font-bold text-[#080C10]"
              >
                <User className="w-4 h-4" />
              </button>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden w-8 h-8 rounded-lg bg-[#1A2A3A] flex items-center justify-center text-[#5A7A9A] hover:text-[#E8F0F8] transition-colors"
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#1A2A3A] bg-[#0F1620]">
            <div className="px-4 py-3 space-y-1">
              {/* Mobile Search */}
              <div className="flex items-center gap-2 bg-[#080C10] border border-[#1A2A3A] rounded-lg px-3 py-2 mb-3">
                <Search className="w-4 h-4 text-[#5A7A9A]" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="搜索股票代码/名称"
                  className="bg-transparent text-sm text-[#E8F0F8] placeholder-[#5A7A9A] outline-none flex-1 font-mono"
                />
              </div>
              {NAV_ITEMS.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    onClick={() => handleNavClick(item.key)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-mono transition-all duration-200 ${
                      currentView === item.key
                        ? 'text-[#00FF88] bg-[#00FF88]/10'
                        : 'text-[#5A7A9A] hover:text-[#E8F0F8] hover:bg-[#080C10]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6">
        {renderView()}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1A2A3A] bg-[#0F1620] mt-8">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-[#00FF88] flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-[#080C10]" />
              </div>
              <span className="text-sm font-semibold text-[#E8F0F8] font-mono">StockPulse</span>
              <span className="text-xs text-[#5A7A9A] font-mono">v1.0 MVP</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-[#5A7A9A] font-mono">行情延迟 ≤ 2s</span>
              <span className="text-xs text-[#5A7A9A] font-mono">系统可用性 99.9%</span>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00FF88] animate-pulse" />
                <span className="text-xs font-mono text-[#00FF88]">系统正常</span>
              </div>
            </div>
            <p className="text-xs text-[#5A7A9A] font-mono">© 2026 StockPulse · 行情数据仅供参考，不构成投资建议</p>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0F1620] border-t border-[#1A2A3A] z-40">
        <div className="flex items-center justify-around px-2 py-2">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => handleNavClick(item.key)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all duration-200 ${
                  currentView === item.key
                    ? 'text-[#00FF88]'
                    : 'text-[#5A7A9A]'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-mono">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <OmniflowBadge />
      <Toaster />
    </div>
  );
}
