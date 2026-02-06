interface HeaderProps {
  imageCount: number;
  onOpenLibrary: () => void;
}

export default function Header({ imageCount, onOpenLibrary }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <span className="font-semibold text-[var(--color-text)]">VisionMatch</span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--color-text-tertiary)]">
            {imageCount} 个素材
          </span>
          <button
            onClick={onOpenLibrary}
            className="px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors"
          >
            管理素材
          </button>
        </div>
      </div>
    </header>
  );
}
