import type { InputMode, ModelStatus } from '../types'

type ControlPanelProps = {
  inputMode: InputMode
  onModeChange: (mode: InputMode) => void
  modelStatus: ModelStatus
  isCameraOn: boolean
  onStartCamera: () => void
  onStopCamera: () => void
  error: string | null
}

export const ControlPanel = ({
  inputMode,
  onModeChange,
  modelStatus,
  isCameraOn,
  onStartCamera,
  onStopCamera,
  error,
}: ControlPanelProps) => {
  return (
    <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
      <div className="flex items-stretch justify-between border-b border-[var(--color-border)]">
        {/* Left: Title */}
        <div className="bg-white/95 backdrop-blur-sm px-4 py-3 border-r border-[var(--color-border)] pointer-events-auto">
          <h1
            className="text-base font-normal tracking-wide text-[var(--color-ink)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            江戸走り
          </h1>
        </div>

        {/* Center: Input mode */}
        <div className="flex-1 bg-white/95 backdrop-blur-sm px-4 py-3 border-r border-[var(--color-border)] pointer-events-auto">
          <div className="text-[10px] text-[var(--color-ink-muted)] uppercase tracking-wider mb-1">
            Input
          </div>
          <select
            value={inputMode}
            onChange={(event) => onModeChange(event.target.value as InputMode)}
            className="w-full text-sm bg-transparent border-none p-0 text-[var(--color-ink)] focus:outline-none"
          >
            <option value="camera">Camera</option>
            <option value="sample-edo">Test: 江戸走り</option>
            <option value="sample-norun">Test: 走ってない</option>
          </select>
        </div>

        {/* Camera controls */}
        {inputMode === 'camera' && (
          <div className="bg-white/95 backdrop-blur-sm px-4 py-3 border-r border-[var(--color-border)] pointer-events-auto flex items-center gap-2">
            <button
              className={`px-3 py-1 text-xs border transition-colors ${
                isCameraOn
                  ? 'border-[var(--color-border)] text-[var(--color-ink-muted)]'
                  : 'border-[var(--color-ink)] bg-[var(--color-ink)] text-white'
              }`}
              onClick={onStartCamera}
              disabled={modelStatus !== 'ready' || isCameraOn}
            >
              Start
            </button>
            <button
              className={`px-3 py-1 text-xs border transition-colors ${
                isCameraOn
                  ? 'border-[var(--color-ink)] text-[var(--color-ink)]'
                  : 'border-[var(--color-border)] text-[var(--color-ink-muted)]'
              }`}
              onClick={onStopCamera}
              disabled={!isCameraOn}
            >
              Stop
            </button>
          </div>
        )}

        {/* Model status */}
        <div className="bg-white/95 backdrop-blur-sm px-4 py-3 pointer-events-auto">
          <div className="text-[10px] text-[var(--color-ink-muted)] uppercase tracking-wider mb-1">
            Model
          </div>
          <div className={`text-sm ${modelStatus === 'ready' ? 'text-[var(--color-ink)]' : 'text-[var(--color-ink-muted)]'}`}>
            {modelStatus === 'ready' ? 'Ready' : modelStatus === 'error' ? 'Error' : 'Loading...'}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-white/95 backdrop-blur-sm px-4 py-2 border-b border-[var(--color-border)] text-sm text-[var(--color-ink-muted)] pointer-events-auto">
          {error}
        </div>
      )}
    </div>
  )
}
