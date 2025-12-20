import type { InputMode, ModelStatus, PoseStatus } from '../types'

type ControlPanelProps = {
  inputMode: InputMode
  onModeChange: (mode: InputMode) => void
  poseStatus: PoseStatus
  modelStatus: ModelStatus
  holdProgress: number
  isCameraOn: boolean
  onStartCamera: () => void
  onStopCamera: () => void
  error: string | null
}

export const ControlPanel = ({
  inputMode,
  onModeChange,
  poseStatus,
  modelStatus,
  holdProgress,
  isCameraOn,
  onStartCamera,
  onStopCamera,
  error,
}: ControlPanelProps) => {
  const statusText =
    poseStatus === 'detected' ? '検出中' : poseStatus === 'holding' ? '判定中' : '---'

  const modelText =
    modelStatus === 'ready' ? 'Ready' : modelStatus === 'error' ? 'Error' : 'Loading...'

  return (
    <div className="border-b border-[var(--color-border)] bg-[var(--color-bg-alt)]">
      <div className="grid grid-cols-12">
        {/* Input Mode */}
        <div className="col-span-3 border-r border-[var(--color-border)] p-3">
          <div className="text-[10px] text-[var(--color-ink-muted)] uppercase tracking-wider mb-2">
            Input
          </div>
          <select
            value={inputMode}
            onChange={(event) => onModeChange(event.target.value as InputMode)}
            className="w-full px-2 py-1.5 text-sm border border-[var(--color-border)] bg-transparent"
          >
            <option value="camera">Camera</option>
            <option value="sample-edo">Test: 江戸走り</option>
            <option value="sample-norun">Test: 走ってない</option>
          </select>
        </div>

        {/* Camera Controls */}
        <div className="col-span-3 border-r border-[var(--color-border)] p-3">
          <div className="text-[10px] text-[var(--color-ink-muted)] uppercase tracking-wider mb-2">
            Control
          </div>
          {inputMode === 'camera' ? (
            <div className="flex gap-2">
              <button
                className="px-3 py-1.5 text-sm border border-[var(--color-border-strong)] bg-[var(--color-ink)] text-white disabled:bg-transparent disabled:text-[var(--color-ink)]"
                onClick={onStartCamera}
                disabled={modelStatus !== 'ready' || isCameraOn}
              >
                Start
              </button>
              <button
                className="px-3 py-1.5 text-sm border border-[var(--color-border)]"
                onClick={onStopCamera}
                disabled={!isCameraOn}
              >
                Stop
              </button>
            </div>
          ) : (
            <div className="text-sm text-[var(--color-ink-muted)]">---</div>
          )}
        </div>

        {/* Status */}
        <div className="col-span-3 border-r border-[var(--color-border)] p-3">
          <div className="text-[10px] text-[var(--color-ink-muted)] uppercase tracking-wider mb-2">
            Status
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${poseStatus === 'detected' ? 'text-[var(--color-ink)]' : 'text-[var(--color-ink-muted)]'}`}>
              {statusText}
            </span>
            <div className="flex-1 h-[2px] bg-[var(--color-border)]">
              <div
                className="h-full bg-[var(--color-ink)] transition-[width] duration-200"
                style={{ width: `${Math.round(holdProgress * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Model */}
        <div className="col-span-3 p-3">
          <div className="text-[10px] text-[var(--color-ink-muted)] uppercase tracking-wider mb-2">
            Model
          </div>
          <div className="text-sm">{modelText}</div>
        </div>
      </div>

      {error && (
        <div className="px-3 py-2 border-t border-[var(--color-border)] text-sm text-[var(--color-ink-muted)]">
          {error}
        </div>
      )}
    </div>
  )
}
