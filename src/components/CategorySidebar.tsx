import { CATEGORIES, type Category } from '../types';

interface CategorySidebarProps {
  selectedCategory: Category;
  onCategoryChange: (category: Category) => void;
}

export default function CategorySidebar({ selectedCategory, onCategoryChange }: CategorySidebarProps) {
  return (
    <aside className="w-48 shrink-0 bg-white border-r border-[var(--color-border)] p-4">
      <h2 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
        材质分类
      </h2>
      <ul className="space-y-1">
        {CATEGORIES.map((cat) => (
          <li key={cat}>
            <button
              onClick={() => onCategoryChange(cat)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedCategory === cat
                  ? 'bg-[var(--color-primary)] text-white font-medium'
                  : 'text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]'
              }`}
            >
              {cat}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
