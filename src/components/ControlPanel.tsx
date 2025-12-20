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
    <div className="absolute top-4 left-4 right-4 z-10 pointer-events-none">
      <div className="flex items-start justify-between gap-4">
        {/* Left: Title + Input */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <h1
            className="text-white text-lg font-normal tracking-wide drop-shadow-md"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            江戸走り
          </h1>
          <select
            value={inputMode}
            onChange={(event) => onModeChange(event.target.value as InputMode)}
            className="px-2 py-1 text-xs bg-black/50 backdrop-blur-md text-white border border-white/20 rounded"
          >
            <option value="camera">Camera</option>
            <option value="sample-edo">Test: 江戸走り</option>
            <option value="sample-norun">Test: 走ってない</option>
          </select>
        </div>

        {/* Right: Camera controls + Model status */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {inputMode === 'camera' && (
            <>
              <button
                className={`px-3 py-1 text-xs rounded backdrop-blur-md transition-all ${
                  isCameraOn
                    ? 'bg-white/20 text-white/50'
                    : 'bg-white/90 text-black'
                }`}
                onClick={onStartCamera}
                disabled={modelStatus !== 'ready' || isCameraOn}
              >
                Start
              </button>
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
            </>
          )}
          <span className={`px-2 py-1 text-[10px] uppercase tracking-wider rounded backdrop-blur-md ${
            modelStatus === 'ready'
              ? 'bg-white/20 text-white/80'
              : modelStatus === 'error'
                ? 'bg-red-500/50 text-white'
                : 'bg-black/50 text-white/60'
          }`}>
            {modelStatus === 'ready' ? 'Ready' : modelStatus === 'error' ? 'Error' : 'Loading...'}
          </span>
        </div>
      </div>

      {error && (
        <div className="mt-2 px-3 py-2 text-xs bg-red-500/80 text-white rounded backdrop-blur-md pointer-events-auto">
          {error}
        </div>
      )}
    </div>
  )
}
