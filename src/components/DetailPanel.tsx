import type { ArmDetail, FootDetail, PoseAngles, PoseChecks, PoseStatus } from '../types'
import { rotationLabel } from '../utils'

type DetailPanelProps = {
  checks: PoseChecks
  angles: PoseAngles
  armsDetail: ArmDetail
  feetDetail: FootDetail
  poseStatus: PoseStatus
  holdProgress: number
}

export const DetailPanel = ({
  checks,
  angles,
  armsDetail,
  feetDetail,
  poseStatus,
  holdProgress,
}: DetailPanelProps) => {
  const isDetected = poseStatus === 'detected'

  return (
    <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none">
      <div className="flex items-stretch border-t border-[var(--color-border)]">
        {/* Status */}
        <div className={`bg-white/95 backdrop-blur-sm px-4 py-3 border-r border-[var(--color-border)] pointer-events-auto transition-colors ${isDetected ? 'bg-[var(--color-ink)] text-white' : ''}`}>
          <div className={`text-[10px] uppercase tracking-wider mb-1 ${isDetected ? 'text-white/60' : 'text-[var(--color-ink-muted)]'}`}>
            Status
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">
              {isDetected ? '江戸走り検出' : poseStatus === 'holding' ? '判定中...' : '---'}
            </span>
            {poseStatus === 'holding' && (
              <div className="w-12 h-[2px] bg-[var(--color-border)]">
                <div
                  className="h-full bg-[var(--color-ink)] transition-[width] duration-100"
                  style={{ width: `${Math.round(holdProgress * 100)}%` }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Arms */}
        <div className="flex-1 bg-white/95 backdrop-blur-sm px-4 py-3 border-r border-[var(--color-border)] pointer-events-auto">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-[var(--color-ink-muted)] uppercase tracking-wider">
              Arms
            </span>
            <span className={`text-xs font-medium ${checks.armsOpposed ? 'text-[var(--color-ink)]' : 'text-[var(--color-ink-muted)]'}`}>
              {checks.armsOpposed ? 'OK' : '---'}
            </span>
          </div>
          <div className="text-sm text-[var(--color-ink)]">
            L: {rotationLabel(armsDetail.left)} / R: {rotationLabel(armsDetail.right)}
          </div>
        </div>

        {/* Feet */}
        <div className="flex-1 bg-white/95 backdrop-blur-sm px-4 py-3 border-r border-[var(--color-border)] pointer-events-auto">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-[var(--color-ink-muted)] uppercase tracking-wider">
              Feet
            </span>
            <span className={`text-xs font-medium ${checks.feetOpposed ? 'text-[var(--color-ink)]' : 'text-[var(--color-ink-muted)]'}`}>
              {checks.feetOpposed ? 'OK' : '---'}
            </span>
          </div>
          <div className="text-sm text-[var(--color-ink)]">
            L: {rotationLabel(feetDetail.left)} / R: {rotationLabel(feetDetail.right)}
          </div>
        </div>

        {/* Knees */}
        <div className="flex-1 bg-white/95 backdrop-blur-sm px-4 py-3 pointer-events-auto">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-[var(--color-ink-muted)] uppercase tracking-wider">
              Knees
            </span>
            <span className={`text-xs font-medium ${checks.kneesBent ? 'text-[var(--color-ink)]' : 'text-[var(--color-ink-muted)]'}`}>
              {checks.kneesBent ? 'OK' : '---'}
            </span>
          </div>
          <div className="text-sm text-[var(--color-ink)]">
            L: {angles.leftKnee ? `${Math.round(angles.leftKnee)}°` : '--'} / R: {angles.rightKnee ? `${Math.round(angles.rightKnee)}°` : '--'}
          </div>
        </div>
      </div>
    </div>
  )
}
