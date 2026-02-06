import { CATEGORIES, type Category } from '../types';

interface CategorySidebarProps {
  selectedCategory: Category;
  onCategoryChange: (category: Category) => void;
  imageCounts: Record<string, number>;
}

export default function CategorySidebar({ selectedCategory, onCategoryChange, imageCounts }: CategorySidebarProps) {
  return (
    <aside className="w-56 shrink-0 bg-white/70 border-r border-[var(--color-border)] flex flex-col">
      <div className="p-5 pb-3">
        <h2 className="text-[11px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest">
          材质分类
        </h2>
      </div>
      <nav className="flex-1 px-3 pb-4 space-y-0.5 overflow-y-auto">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat;
          const count = imageCounts[cat] ?? 0;
          return (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group ${
                isActive
                  ? 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white shadow-[var(--shadow-md)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]'
              }`}
            >
              <span className="flex items-center gap-2.5">
                {cat === '全部' ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                  </svg>
                ) : (
                  <span className={`w-2 h-2 rounded-full transition-colors ${isActive ? 'bg-white/60' : 'bg-[var(--color-border)] group-hover:bg-[var(--color-primary-light)]'}`} />
                )}
                <span className="font-medium">{cat}</span>
              </span>
              <span
                className={`text-[11px] tabular-nums px-1.5 py-0.5 rounded-md min-w-[24px] text-center transition-colors ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)] group-hover:bg-[var(--color-border)]'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[var(--color-border)]">
        <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-tertiary)]">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
          </svg>
          <span>数据存储在本地浏览器</span>
        </div>
      </div>
    </aside>
  );
}
