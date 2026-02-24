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
      <div className="max-w-[1440px] mx-auto px-8 h-[68px] flex items-center justify-between">
        {/* Left: Brand */}
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-primary-dark)] to-[#8B5E3C] flex items-center justify-center shadow-[var(--shadow-md)] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-white/10" />
              <svg className="w-5 h-5 text-white relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
              </svg>
            </div>
            <div>
              <h1 className="text-[15px] font-bold text-[var(--color-text)] leading-tight tracking-tight">
                WoodMatch
              </h1>
              <p className="text-[11px] text-[var(--color-text-tertiary)] leading-tight mt-0.5 tracking-wide">
                建筑板材智能匹配系统
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-bg-warm)] border border-[var(--color-border)]">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]" style={{ animation: 'pulse-soft 2s ease-in-out infinite' }} />
            <span className="text-[11px] font-medium text-[var(--color-text-secondary)] tabular-nums">{imageCount} 张素材</span>
          </div>
        </div>

        {/* Center: Nav tabs */}
        <nav className="absolute left-1/2 -translate-x-1/2 flex items-center bg-[var(--color-bg-warm)] rounded-[14px] p-[3px] border border-[var(--color-border)]">
          {[
            { key: 'library' as ViewMode, label: '资源库', icon: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z' },
            { key: 'search' as ViewMode, label: '以图搜图', icon: 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z' },
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => onViewModeChange(key)}
              className={`relative px-5 py-2 rounded-[11px] text-[13px] font-medium transition-all duration-300 ${
                viewMode === key
                  ? 'bg-white text-[var(--color-text)] shadow-[var(--shadow-sm)]'
                  : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-[15px] h-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                </svg>
                {label}
              </span>
            </button>
          ))}
        </nav>

        {/* Right: Upload */}
        <button
          onClick={onUpload}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-b from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white text-[13px] font-semibold rounded-[12px] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:from-[var(--color-primary-light)] hover:to-[var(--color-primary)] active:scale-[0.97] transition-all duration-200"
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
