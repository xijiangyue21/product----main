import { useCallback, useEffect, useState } from "react";
import { Plus, Search, Star, Trash2, X } from "lucide-react";
import { marketApi, watchlistApi } from "@/lib/api";
import { filterStockOptions, getStockPriceSummary } from "@/constants/stocks";
import { EmptyState, LoadingState } from "@/components/custom/async-state";
import { useAsyncAction } from "@/hooks/useAsyncAction";
export default function WatchlistView() {
  const [groups, setGroups] = useState([]);
  const [items, setItems] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const groupAction = useAsyncAction();
  const itemAction = useAsyncAction();
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [groupsResponse, itemsResponse, stocksResponse] = await Promise.all(
        [
          watchlistApi.getGroups(),
          watchlistApi.getItems(),
          marketApi.getStocks(),
        ],
      );
      if (groupsResponse.success) {
        setGroups(groupsResponse.data);
        setSelectedGroup(
          (current) => current ?? groupsResponse.data[0]?.id ?? null,
        );
      }
      if (itemsResponse.success) {
        setItems(itemsResponse.data);
      }
      if (stocksResponse.success) {
        setStocks(stocksResponse.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void loadData();
  }, [loadData]);
  const handleCreateGroup = async () => {
    const trimmedName = newGroupName.trim();
    if (!trimmedName) {
      await groupAction.run(async () => {
        throw new Error("请输入分组名称");
      });
      return;
    }
    await groupAction.run(
      async () => {
        const response = await watchlistApi.createGroup(trimmedName);
        if (!response.success) {
          throw new Error(response.message || "创建分组失败");
        }
        setGroups((current) => [...current, response.data]);
        setSelectedGroup(response.data.id);
        setNewGroupName("");
        setShowAddGroup(false);
      },
      {
        successMessage: "分组创建成功",
        errorMessage: "创建分组失败",
      },
    );
  };
  const handleDeleteGroup = async (id) => {
    await groupAction.run(
      async () => {
        const response = await watchlistApi.deleteGroup(id);
        if (!response.success) {
          throw new Error(response.message || "删除分组失败");
        }
        setGroups((current) => {
          const nextGroups = current.filter((group) => group.id !== id);
          setSelectedGroup((selected) =>
            selected === id ? (nextGroups[0]?.id ?? null) : selected,
          );
          return nextGroups;
        });
        setItems((current) => current.filter((item) => item.groupId !== id));
      },
      {
        successMessage: "分组已删除",
        errorMessage: "删除分组失败",
      },
    );
  };
  const handleAddItem = async (symbol, name) => {
    if (!selectedGroup) {
      await itemAction.run(async () => {
        throw new Error("请先选择分组");
      });
      return;
    }
    await itemAction.run(
      async () => {
        const response = await watchlistApi.addItem(
          selectedGroup,
          symbol,
          name,
        );
        if (!response.success) {
          throw new Error(response.message || "添加股票失败");
        }
        setItems((current) => [...current, response.data]);
        setShowAddItem(false);
        setSearchQuery("");
      },
      {
        successMessage: `${name} 已加入自选`,
        errorMessage: "添加股票失败",
      },
    );
  };
  const handleRemoveItem = async (id, name) => {
    await itemAction.run(
      async () => {
        const response = await watchlistApi.removeItem(id);
        if (!response.success) {
          throw new Error(response.message || "移除股票失败");
        }
        setItems((current) => current.filter((item) => item.id !== id));
      },
      {
        successMessage: `${name} 已从自选移除`,
        errorMessage: "移除股票失败",
      },
    );
  };
  const groupItems = items.filter((item) => item.groupId === selectedGroup);
  const filteredStocks = filterStockOptions(searchQuery);
  const selectedGroupName =
    groups.find((group) => group.id === selectedGroup)?.name ?? "自选股";
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--app-text)]">
          <Star className="h-5 w-5 text-[#16A34A]" />
          自选管理
        </h2>
        <button
          onClick={() => setShowAddGroup(true)}
          className="flex items-center gap-1.5 rounded-lg border border-[#16A34A]/20 bg-[#16A34A]/10 px-3 py-1.5 text-xs font-mono text-[#16A34A] transition-colors hover:bg-[#16A34A]/15"
        >
          <Plus className="h-3.5 w-3.5" />
          新建分组
        </button>
      </div>

      {showAddGroup ? (
        <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={newGroupName}
              onChange={(event) => setNewGroupName(event.target.value)}
              placeholder="输入分组名称，例如：长期持有"
              className="flex-1 rounded-lg border border-[var(--app-border)] bg-[var(--app-bg)] px-3 py-2 text-sm font-mono text-[var(--app-text)] outline-none transition-colors placeholder:text-[var(--app-muted)] focus:border-[#16A34A]"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void handleCreateGroup();
                }
              }}
              autoFocus
            />
            <button
              onClick={() => void handleCreateGroup()}
              disabled={groupAction.isRunning}
              className="rounded-lg bg-[#16A34A] px-4 py-2 text-xs font-mono font-semibold text-white transition-colors hover:bg-[#15803D] disabled:opacity-50"
            >
              {groupAction.isRunning ? "提交中..." : "创建"}
            </button>
            <button
              onClick={() => setShowAddGroup(false)}
              className="p-2 text-[var(--app-muted)] transition-colors hover:text-[var(--app-text)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-sm">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--app-muted)]">
            我的分组
          </h3>

          {loading ? (
            <LoadingState className="py-4 text-xs font-mono text-[var(--app-muted)]" />
          ) : groups.length === 0 ? (
            <EmptyState
              className="py-8 text-center"
              icon={Star}
              title="还没有分组"
              description="点击右上角“新建分组”开始整理你的自选列表。"
            />
          ) : (
            <div className="space-y-1">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className={`group flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 transition-colors ${
                    selectedGroup === group.id
                      ? "border-[#16A34A]/30 bg-[#16A34A]/10"
                      : "border-transparent hover:bg-[var(--app-soft-hover)]"
                  }`}
                  onClick={() => setSelectedGroup(group.id)}
                >
                  <span
                    className={`text-sm font-mono ${selectedGroup === group.id ? "text-[#16A34A]" : "text-[var(--app-text)]"}`}
                  >
                    {group.name}
                  </span>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleDeleteGroup(group.id);
                    }}
                    className="p-1 text-[var(--app-muted)] opacity-0 transition-all group-hover:opacity-100 hover:text-red-500"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 shadow-sm lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--app-text)]">
              {selectedGroup ? selectedGroupName : "请选择分组"}
              <span className="ml-2 font-normal text-[var(--app-muted)]">
                ({groupItems.length} 只)
              </span>
            </h3>
            {selectedGroup ? (
              <button
                onClick={() => setShowAddItem(true)}
                className="flex items-center gap-1.5 rounded-lg border border-dashed border-[var(--app-border)] px-3 py-1.5 text-xs font-mono text-[var(--app-muted)] transition-colors hover:border-[#16A34A] hover:text-[#16A34A]"
              >
                <Plus className="h-3.5 w-3.5" />
                添加股票
              </button>
            ) : null}
          </div>

          {showAddItem ? (
            <div className="mb-4 rounded-xl border border-[var(--app-border)] bg-[var(--app-bg)] p-4">
              <div className="mb-3 flex items-center gap-2">
                <Search className="h-4 w-4 text-[var(--app-muted)]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="搜索股票代码或名称"
                  className="flex-1 bg-transparent text-sm font-mono text-[var(--app-text)] outline-none placeholder:text-[var(--app-muted)]"
                  autoFocus
                />
                <button
                  onClick={() => setShowAddItem(false)}
                  className="text-[var(--app-muted)] transition-colors hover:text-[var(--app-text)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="max-h-48 space-y-1 overflow-y-auto">
                {filteredStocks.map((stock) => (
                  <div
                    key={stock.code}
                    onClick={() => void handleAddItem(stock.symbol, stock.name)}
                    className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-[var(--app-soft-hover)]"
                  >
                    <div>
                      <span className="text-sm font-mono font-semibold text-[var(--app-text)]">
                        {stock.name}
                      </span>
                      <span className="ml-2 text-xs font-mono text-[var(--app-muted)]">
                        {stock.symbol}
                      </span>
                    </div>
                    <Plus className="h-4 w-4 text-[#16A34A]" />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {groupItems.length === 0 ? (
            <EmptyState
              className="py-12 text-center"
              icon={Star}
              title={selectedGroup ? "当前分组还没有股票" : "请选择或创建分组"}
              description={
                selectedGroup
                  ? "点击上方“添加股票”把关注标的加入分组。"
                  : "先在左侧创建一个分组，再添加股票。"
              }
            />
          ) : (
            <div className="space-y-1">
              {groupItems.map((item) => {
                const priceData = getStockPriceSummary(stocks, item.symbol);
                const isPositive = priceData
                  ? parseFloat(priceData.changePercent) >= 0
                  : true;
                return (
                  <div
                    key={item.id}
                    className="group flex items-center justify-between rounded-lg border-b border-[var(--app-border)] px-3 py-3 transition-colors last:border-0 hover:bg-[var(--app-soft-hover)]"
                  >
                    <div>
                      <div className="text-sm font-mono font-semibold text-[var(--app-text)]">
                        {item.name}
                      </div>
                      <div className="text-xs font-mono text-[var(--app-muted)]">
                        {item.symbol}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {priceData ? (
                        <div className="text-right">
                          <div className="text-sm font-mono font-semibold text-[var(--app-text)]">
                            {priceData.price}
                          </div>
                          <div
                            className={`text-xs font-mono ${isPositive ? "text-[#16A34A]" : "text-red-500"}`}
                          >
                            {isPositive ? "+" : ""}
                            {priceData.changePercent}%
                          </div>
                        </div>
                      ) : null}
                      <button
                        onClick={() =>
                          void handleRemoveItem(item.id, item.name)
                        }
                        className="p-1.5 text-[var(--app-muted)] opacity-0 transition-all group-hover:opacity-100 hover:text-red-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
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
