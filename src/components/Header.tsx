export const Header = () => {
  return (
    <header className="grid gap-3 animate-fade-up">
      <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[0.72rem] tracking-[0.18em] uppercase bg-accent-cool/15 text-[#1f4c4d] w-fit">
        江戸走り Pose
      </span>
      <h1
        className="m-0 text-[clamp(2.1rem,3.6vw,3.6rem)]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        江戸走りポーズ検出
      </h1>
      <p className="m-0 max-w-[56ch] text-ink/70">
        MediaPipe Pose を使って江戸走りのフォームを解析。テスト画像かカメラ映像で、
        ポーズが 1 秒以上続いたら BGM を再生します。
      </p>
    </header>
  )
}
