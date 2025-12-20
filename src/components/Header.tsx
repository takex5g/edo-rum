export const Header = () => {
  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-bg-alt)]">
      <div className="px-4 py-3 flex items-center justify-between">
        <h1
          className="m-0 text-base font-normal tracking-wide"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          江戸走り
        </h1>
        <span className="text-xs text-[var(--color-ink-muted)] tracking-wider uppercase">
          Pose Detection
        </span>
      </div>
    </header>
  )
}
