import type { ViewMode } from '../types';

interface HeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  imageCount: number;
  onUpload: () => void;
}

export default function Header({ viewMode, onViewModeChange, imageCount, onUpload }: HeaderProps) {
  return (
    <header className="glass sticky top-0 z-30 border-b border-[var(--color-border)]">
      <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Left: Brand */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-[var(--color-text)] leading-tight">材质搜索引擎</h1>
              <p className="text-[11px] text-[var(--color-text-tertiary)] leading-tight">建筑板材花纹 · 材质 · 色彩</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 ml-2 px-2.5 py-1 rounded-full bg-[var(--color-primary-bg)] border border-[var(--color-primary)]/10">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] animate-pulse" />
            <span className="text-xs font-medium text-[var(--color-primary)]">{imageCount} 张素材</span>
          </div>
        </div>

        {/* Center: Nav tabs */}
        <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 bg-[var(--color-surface-hover)] rounded-xl p-1 shadow-inner">
          <button
            onClick={() => onViewModeChange('library')}
            className={`relative px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              viewMode === 'library'
                ? 'bg-white text-[var(--color-text)] shadow-[var(--shadow-md)]'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-white/50'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
              资源库
            </span>
          </button>
          <button
            onClick={() => onViewModeChange('search')}
            className={`relative px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              viewMode === 'search'
                ? 'bg-white text-[var(--color-text)] shadow-[var(--shadow-md)]'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-white/50'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              以图搜图
            </span>
          </button>
        </nav>

        {/* Right: Actions */}
        <button
          onClick={onUpload}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-[var(--color-primary)]/25 active:scale-[0.97] transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          上传素材
        </button>
      </div>
    </header>
  );
}
