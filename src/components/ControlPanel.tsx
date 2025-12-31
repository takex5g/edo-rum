import type { ModelStatus } from '../types';

type ControlPanelProps = {
  modelStatus: ModelStatus;
  isCameraOn: boolean;
  onStopCamera: () => void;
  error: string | null;
};

export const ControlPanel = ({
  modelStatus,
  isCameraOn,
  onStopCamera,
  error,
}: ControlPanelProps) => {
  return (
    <div className='absolute top-4 left-4 right-4 z-10 pointer-events-none'>
      <div className='flex items-start justify-between gap-4'>
        {/* Left: Title */}
        <div className='flex items-center gap-3 pointer-events-auto'>
          <h1
            className='text-white text-lg font-normal tracking-wide drop-shadow-md'
            style={{ fontFamily: 'var(--font-display)' }}
          >
            江戸走り
          </h1>
        </div>

        {/* Right: Camera controls + Model status */}
        <div className='flex items-center gap-2 pointer-events-auto'>
          <div className='flex flex-col items-center gap-0.5'>
            <a
              href='https://x.com/takex5g'
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center justify-center w-6 h-6 rounded-full overflow-hidden backdrop-blur-md bg-black/30 hover:bg-black/50 transition-all'
            >
              <img
                src='/yumoya.png'
                alt='takex5g'
                className='w-full h-full object-cover'
              />
            </a>
            <span className='text-[8px] text-white/80 drop-shadow-md leading-tight'>
              作者
            </span>
          </div>
          <button
            className={`px-3 py-1 text-xs rounded backdrop-blur-md transition-all ${
              isCameraOn
                ? 'bg-black/60 text-white'
                : 'bg-black/30 text-white/50'
            }`}
            onClick={onStopCamera}
            disabled={!isCameraOn}
          >
            Stop
          </button>
          <span
            className={`px-2 py-1 text-[10px] uppercase tracking-wider rounded backdrop-blur-md ${
              modelStatus === 'ready'
                ? 'bg-white/20 text-white/80'
                : modelStatus === 'error'
                ? 'bg-red-500/50 text-white'
                : 'bg-black/50 text-white/60'
            }`}
          >
            {modelStatus === 'ready'
              ? 'Ready'
              : modelStatus === 'error'
              ? 'Error'
              : 'Loading...'}
          </span>
        </div>
      </div>

      {error && (
        <div className='mt-2 px-3 py-2 text-xs bg-red-500/80 text-white rounded backdrop-blur-md pointer-events-auto'>
          {error}
        </div>
      )}
    </div>
  );
};
