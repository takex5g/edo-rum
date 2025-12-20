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
    poseStatus === 'detected' ? '検出中' : poseStatus === 'holding' ? '判定中' : '未検出'

  const modelText =
    modelStatus === 'ready'
      ? 'モデル準備完了'
      : modelStatus === 'error'
        ? 'モデルエラー'
        : 'モデル読み込み中'

  const statusPillClass =
    poseStatus === 'detected'
      ? 'bg-accent/20 border-accent/40 text-[#6b2d1f]'
      : poseStatus === 'holding'
        ? 'bg-accent-cool/15 border-accent-cool/30 text-[#1f4c4d]'
        : 'bg-ink/5 border-ink/15'

  return (
    <section className="col-span-12 lg:col-span-4 bg-[rgba(255,248,238,0.92)] border border-ink/15 rounded-[20px] p-5 shadow-panel backdrop-blur-[10px] relative overflow-hidden animate-rise grid gap-4 [animation-delay:0.1s]">
      <div className="text-xs uppercase tracking-[0.12em] text-ink/55 font-bold mb-3">
        入力と制御
      </div>
      <label className="grid gap-1.5 text-[0.9rem]">
        <span className="font-semibold text-ink/75">入力モード</span>
        <select
          value={inputMode}
          onChange={(event) => onModeChange(event.target.value as InputMode)}
          className="px-3 py-2.5 rounded-xl border border-ink/15 bg-[#fffaf4] text-[0.95rem] text-ink"
        >
          <option value="camera">カメラ</option>
          <option value="sample-edo">テスト: 江戸走り.png</option>
          <option value="sample-norun">テスト: 走ってない.png</option>
        </select>
      </label>

      {inputMode === 'camera' ? (
        <div className="flex flex-wrap gap-2.5 max-sm:flex-col">
          <button
            className="rounded-full px-4 py-2.5 border border-transparent font-semibold cursor-pointer transition-transform duration-200 bg-accent text-white shadow-[0_12px_20px_rgba(216,97,60,0.3)] hover:enabled:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            onClick={onStartCamera}
            disabled={modelStatus !== 'ready' || isCameraOn}
          >
            カメラ開始
          </button>
          <button
            className="rounded-full px-4 py-2.5 border border-ink/20 font-semibold cursor-pointer transition-transform duration-200 bg-ink/5 text-ink hover:enabled:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onStopCamera}
            disabled={!isCameraOn}
          >
            停止
          </button>
        </div>
      ) : (
        <div className="px-3 py-2.5 rounded-xl bg-accent-cool/10 border border-dashed border-accent-cool/25 text-[0.85rem] text-ink/70">
          画像入力モードではカメラは使用しません。
        </div>
      )}

      <div
        className={`flex items-center justify-between px-3 py-2 rounded-xl border font-semibold ${statusPillClass}`}
      >
        <span>{statusText}</span>
        <span className="text-xs font-medium text-ink/55">{modelText}</span>
      </div>

      <div className="w-full h-1.5 rounded-full bg-ink/10 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-accent to-accent-strong transition-[width] duration-200"
          style={{ width: `${Math.round(holdProgress * 100)}%` }}
        />
      </div>

      {error && (
        <div className="px-3 py-2.5 rounded-xl bg-accent/10 border border-accent/35 text-[#7c2b1e] text-[0.85rem]">
          {error}
        </div>
      )}
    </section>
  )
}
