type AudioWarningModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const AudioWarningModal = ({
  isOpen,
  onClose,
}: AudioWarningModalProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm'>
      <div className='bg-white border-2 border-[var(--color-border-strong)] max-w-md w-full mx-4'>
        <div className='px-6 py-5 border-b-2 border-[var(--color-border-strong)]'>
          <h2
            className='text-lg font-medium text-[var(--color-ink)]'
            style={{ fontFamily: 'var(--font-display)' }}
          >
            音声について
          </h2>
        </div>
        <div className='px-6 py-5'>
          <p className='text-sm text-[var(--color-ink)] leading-relaxed mb-4'>
            このサイトは音が鳴ります。
          </p>
          <p className='text-xs text-[var(--color-ink-muted)] leading-relaxed mb-4'>
            ポーズが検出されるとBGMが自動再生されます。
          </p>
          <p className='text-xs text-[var(--color-ink-muted)] leading-relaxed'>
            BGM:{' '}
            <a
              href='https://www.youtube.com/watch?v=ulAo8-ngBkA'
              target='_blank'
              rel='noopener noreferrer'
              className='underline hover:text-[var(--color-ink)] transition-colors'
            >
              SAMURAI MUSIC - akatsuki japan by SHW
            </a>
          </p>
        </div>
        <div className='px-6 py-4 border-t border-[var(--color-border)] flex justify-end'>
          <button
            onClick={onClose}
            className='px-4 py-2 text-sm text-[var(--color-ink)] border border-[var(--color-border-strong)] hover:bg-[var(--color-bg)] transition-colors'
          >
            了解しました
          </button>
        </div>
      </div>
    </div>
  );
};
