'use client';

import { useEffect, useRef, useState } from 'react';

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface CategoryGroup {
  groupName: string;
  categories: Category[];
}

interface CategorySheetProps {
  open: boolean;
  onClose: () => void;
  onSelect: (category: Category) => void;
}

export function CategorySheet({ open, onClose, onSelect }: CategorySheetProps) {
  const [groups, setGroups] = useState<CategoryGroup[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch('/api/categories')
      .then(r => r.json())
      .then(d => setGroups(d.groups ?? []))
      .finally(() => setLoading(false));
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const filtered = search.trim()
    ? groups.map(g => ({ ...g, categories: g.categories.filter(c => c.name.includes(search) || c.id.includes(search)) })).filter(g => g.categories.length > 0)
    : groups;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl max-h-[65dvh] flex flex-col">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>
        <div className="px-4 pb-2">
          <h2 className="text-base font-semibold text-gray-900 mb-3">选择品类</h2>
          <input
            ref={inputRef}
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索品类..."
            className="w-full px-3 py-2 rounded-xl bg-gray-100 text-sm outline-none"
          />
        </div>
        <div className="overflow-y-auto flex-1 px-4 pb-6">
          {loading && <p className="text-center text-gray-400 text-sm py-8">加载中...</p>}
          {!loading && filtered.map(group => (
            <div key={group.groupName} className="mb-4">
              <p className="text-xs text-gray-400 mb-2">{group.groupName}</p>
              <div className="grid grid-cols-3 gap-2">
                {group.categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => { onSelect(cat); onClose(); setSearch(''); }}
                    className="flex flex-col items-center py-3 px-2 rounded-xl bg-gray-50 active:bg-red-50 active:scale-95 transition-all"
                  >
                    <span className="text-2xl mb-1">{cat.icon}</span>
                    <span className="text-xs text-gray-700 text-center leading-tight">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
          {!loading && filtered.length === 0 && <p className="text-center text-gray-400 text-sm py-8">没找到相关品类</p>}
        </div>
      </div>
    </div>
  );
}
