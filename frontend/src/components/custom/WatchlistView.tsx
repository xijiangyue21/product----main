import { useState, useEffect } from 'react';
import { watchlistApi, marketApi } from '@/lib/api';
import type { WatchlistGroup, WatchlistItem, StockListItem } from '@/types';
import { Plus, Trash2, Star, Search, X } from 'lucide-react';
import { toast } from 'sonner';

const STOCK_OPTIONS = [
  { code: '600519', symbol: '600519.SH', name: '贵州茅台' },
  { code: '300750', symbol: '300750.SZ', name: '宁德时代' },
  { code: '600036', symbol: '600036.SH', name: '招商银行' },
  { code: '002594', symbol: '002594.SZ', name: '比亚迪' },
  { code: '688981', symbol: '688981.SH', name: '中芯国际' },
  { code: '601012', symbol: '601012.SH', name: '隆基绿能' },
  { code: '300059', symbol: '300059.SZ', name: '东方财富' },
];

export default function WatchlistView() {
  const [groups, setGroups] = useState<WatchlistGroup[]>([]);
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [stocks, setStocks] = useState<StockListItem[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [groupsRes, itemsRes, stocksRes] = await Promise.all([
        watchlistApi.getGroups(),
        watchlistApi.getItems(),
        marketApi.getStocks(),
      ]);
      if (groupsRes.success) {
        setGroups(groupsRes.data);
        if (groupsRes.data.length > 0 && !selectedGroup) {
          setSelectedGroup(groupsRes.data[0].id);
        }
      }
      if (itemsRes.success) setItems(itemsRes.data);
      if (stocksRes.success) setStocks(stocksRes.data);
    } catch (e) {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      const res = await watchlistApi.createGroup(newGroupName.trim());
      if (res.success) {
        setGroups(prev => [...prev, res.data]);
        setSelectedGroup(res.data.id);
        setNewGroupName('');
        setShowAddGroup(false);
        toast.success('分组创建成功');
      }
    } catch (e) {
      toast.error('创建失败');
    }
  };

  const handleDeleteGroup = async (id: string) => {
    try {
      const res = await watchlistApi.deleteGroup(id);
      if (res.success) {
        setGroups(prev => prev.filter(g => g.id !== id));
        setItems(prev => prev.filter(i => i.groupId !== id));
        if (selectedGroup === id) setSelectedGroup(groups.find(g => g.id !== id)?.id || null);
        toast.success('分组已删除');
      }
    } catch (e) {
      toast.error('删除失败');
    }
  };

  const handleAddItem = async (stock: typeof STOCK_OPTIONS[0]) => {
    if (!selectedGroup) { toast.error('请先选择分组'); return; }
    try {
      const res = await watchlistApi.addItem(selectedGroup, stock.symbol, stock.name);
      if (res.success) {
        setItems(prev => [...prev, res.data]);
        setShowAddItem(false);
        toast.success(`${stock.name} 已加入自选股`);
      }
    } catch (e) {
      toast.error('添加失败');
    }
  };

  const handleRemoveItem = async (id: string, name: string) => {
    try {
      const res = await watchlistApi.removeItem(id);
      if (res.success) {
        setItems(prev => prev.filter(i => i.id !== id));
        toast.success(`${name} 已从自选股移除`);
      }
    } catch (e) {
      toast.error('移除失败');
    }
  };

  const groupItems = items.filter(i => i.groupId === selectedGroup);
  const filteredStocks = STOCK_OPTIONS.filter(s =>
    s.name.includes(searchQuery) || s.symbol.includes(searchQuery)
  );

  const getStockPrice = (symbol: string) => {
    const s = stocks.find(st => st.symbol === symbol);
    return s ? { price: s.price, changePercent: s.changePercent } : null;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#E8F0F8] flex items-center gap-2">
          <Star className="w-5 h-5 text-[#00FF88]" />
          自选股管理
        </h2>
        <button
          onClick={() => setShowAddGroup(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00FF88]/10 border border-[#00FF88]/30 text-[#00FF88] text-xs font-mono rounded-lg hover:bg-[#00FF88]/20 transition-all duration-200"
        >
          <Plus className="w-3.5 h-3.5" />
          新建分组
        </button>
      </div>

      {/* Add Group Form */}
      {showAddGroup && (
        <div className="bg-[#0F1620] border border-[#00FF88]/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
              placeholder="输入分组名称（如：长线持仓）"
              className="flex-1 bg-[#080C10] border border-[#1A2A3A] text-[#E8F0F8] text-sm font-mono rounded-lg px-3 py-2 outline-none focus:border-[#00FF88] placeholder-[#5A7A9A] transition-colors"
              onKeyDown={e => e.key === 'Enter' && handleCreateGroup()}
              autoFocus
            />
            <button onClick={handleCreateGroup} className="px-4 py-2 bg-[#00FF88] text-[#080C10] text-xs font-mono font-semibold rounded-lg hover:bg-[#00FF88]/90 transition-colors">创建</button>
            <button onClick={() => setShowAddGroup(false)} className="p-2 text-[#5A7A9A] hover:text-[#E8F0F8] transition-colors"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Groups Sidebar */}
        <div className="bg-[#0F1620] border border-[#1A2A3A] rounded-xl p-4">
          <h3 className="text-xs font-semibold text-[#5A7A9A] uppercase tracking-wider mb-3">我的分组</h3>
          {loading ? (
            <div className="text-xs font-mono text-[#5A7A9A]">加载中...</div>
          ) : groups.length === 0 ? (
            <div className="text-xs font-mono text-[#5A7A9A] text-center py-4">暂无分组，点击新建</div>
          ) : (
            <div className="space-y-1">
              {groups.map(g => (
                <div
                  key={g.id}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all duration-150 group ${
                    selectedGroup === g.id
                      ? 'bg-[#00FF88]/10 border border-[#00FF88]/30'
                      : 'hover:bg-[#080C10] border border-transparent'
                  }`}
                  onClick={() => setSelectedGroup(g.id)}
                >
                  <span className={`text-sm font-mono ${
                    selectedGroup === g.id ? 'text-[#00FF88]' : 'text-[#E8F0F8]'
                  }`}>{g.name}</span>
                  <button
                    onClick={e => { e.stopPropagation(); handleDeleteGroup(g.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-[#5A7A9A] hover:text-[#FF4560] transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Items List */}
        <div className="lg:col-span-3 bg-[#0F1620] border border-[#1A2A3A] rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-[#E8F0F8] uppercase tracking-wider">
              {selectedGroup ? groups.find(g => g.id === selectedGroup)?.name || '自选股' : '请选择分组'}
              <span className="ml-2 text-[#5A7A9A] font-normal">({groupItems.length}只)</span>
            </h3>
            {selectedGroup && (
              <button
                onClick={() => setShowAddItem(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-[#1A2A3A] text-[#5A7A9A] text-xs font-mono rounded-lg hover:border-[#00FF88] hover:text-[#00FF88] transition-all duration-200"
              >
                <Plus className="w-3.5 h-3.5" />
                添加股票
              </button>
            )}
          </div>

          {/* Add Item Modal */}
          {showAddItem && (
            <div className="mb-4 bg-[#080C10] border border-[#1A2A3A] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Search className="w-4 h-4 text-[#5A7A9A]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="搜索股票代码/名称"
                  className="flex-1 bg-transparent text-sm font-mono text-[#E8F0F8] outline-none placeholder-[#5A7A9A]"
                  autoFocus
                />
                <button onClick={() => setShowAddItem(false)} className="text-[#5A7A9A] hover:text-[#E8F0F8]"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {filteredStocks.map(s => (
                  <div
                    key={s.code}
                    onClick={() => handleAddItem(s)}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#0F1620] cursor-pointer transition-colors"
                  >
                    <div>
                      <span className="text-sm font-mono font-semibold text-[#E8F0F8]">{s.name}</span>
                      <span className="text-xs font-mono text-[#5A7A9A] ml-2">{s.symbol}</span>
                    </div>
                    <Plus className="w-4 h-4 text-[#00FF88]" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {groupItems.length === 0 ? (
            <div className="text-center py-12 text-[#5A7A9A] font-mono text-sm">
              {selectedGroup ? '暂无自选股，点击添加' : '请先选择或创建分组'}
            </div>
          ) : (
            <div className="space-y-1">
              {groupItems.map(item => {
                const priceData = getStockPrice(item.symbol);
                const isPos = priceData ? parseFloat(priceData.changePercent) >= 0 : true;
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-3 px-3 border-b border-[#1A2A3A] last:border-0 hover:bg-[#080C10] rounded-lg transition-colors group"
                  >
                    <div>
                      <div className="text-sm font-mono font-semibold text-[#E8F0F8]">{item.name}</div>
                      <div className="text-xs font-mono text-[#5A7A9A]">{item.symbol}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      {priceData && (
                        <div className="text-right">
                          <div className="text-sm font-mono font-semibold text-[#E8F0F8]">{priceData.price}</div>
                          <div className={`text-xs font-mono ${isPos ? 'text-[#00FF88]' : 'text-[#FF4560]'}`}>
                            {isPos ? '+' : ''}{priceData.changePercent}%
                          </div>
                        </div>
                      )}
                      <button
                        onClick={() => handleRemoveItem(item.id, item.name)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-[#5A7A9A] hover:text-[#FF4560] transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
