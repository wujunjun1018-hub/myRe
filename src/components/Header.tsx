interface HeaderProps {
  imageCount: number;
  onOpenLibrary: () => void;
}

export default function Header({ imageCount, onOpenLibrary }: HeaderProps) {
  return (
    <header className="glass sticky top-0 z-30 border-b border-[var(--color-border)]">
      <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center shadow-[var(--shadow-md)]">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M1.5 12s3.75-7.5 10.5-7.5S22.5 12 22.5 12s-3.75 7.5-10.5 7.5S1.5 12 1.5 12z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" />
            </svg>
          </div>
          <div className="leading-tight">
            <h1 className="text-base font-bold text-[var(--color-text)]">VisionMatch</h1>
            <p className="text-[11px] text-[var(--color-text-tertiary)]">Search by image similarity</p>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 ml-3 px-2.5 py-1 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)]">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] animate-pulse" />
            <span className="text-xs font-medium text-[var(--color-text-secondary)]">{imageCount} 素材</span>
          </div>
        </div>

        <button
          onClick={onOpenLibrary}
          className="w-10 h-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] shadow-[var(--shadow-sm)] transition-all active:scale-[0.98]"
          title="素材库设置"
          aria-label="素材库设置"
        >
          <svg className="w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h3m-6.75 6h10.5m-9 6h7.5" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 7.5V6a2.25 2.25 0 012.25-2.25h10.5A2.25 2.25 0 0119.5 6v1.5M4.5 7.5A2.25 2.25 0 002.25 9.75v8.25A2.25 2.25 0 004.5 20.25h15A2.25 2.25 0 0021.75 18V9.75A2.25 2.25 0 0019.5 7.5" />
          </svg>
        </button>
      </div>
    </header>
  );
}
