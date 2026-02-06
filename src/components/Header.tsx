import type { ViewMode } from '../types';

interface HeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  imageCount: number;
}

export default function Header({ viewMode, onViewModeChange, imageCount }: HeaderProps) {
  return (
    <header className="bg-white border-b border-[var(--color-border)] px-6 py-3 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--color-primary)] text-white font-bold text-sm">
          M
        </div>
        <h1 className="text-lg font-semibold text-[var(--color-text)]">
          材质搜索引擎
        </h1>
        <span className="text-xs text-[var(--color-text-secondary)] bg-[var(--color-surface-hover)] px-2 py-0.5 rounded-full">
          {imageCount} 张素材
        </span>
      </div>

      <nav className="flex items-center gap-1 bg-[var(--color-surface-hover)] rounded-lg p-1">
        <button
          onClick={() => onViewModeChange('library')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            viewMode === 'library'
              ? 'bg-white text-[var(--color-text)] shadow-sm'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
          }`}
        >
          资源库
        </button>
        <button
          onClick={() => onViewModeChange('search')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            viewMode === 'search'
              ? 'bg-white text-[var(--color-text)] shadow-sm'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
          }`}
        >
          以图搜图
        </button>
      </nav>
    </header>
  );
}
