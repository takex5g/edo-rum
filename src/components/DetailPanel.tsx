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
  const allChecked = checks.armsOpposed && checks.feetOpposed && checks.kneesBent
  const isDetected = poseStatus === 'detected'

  return (
    <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
      <div className="flex items-end justify-between gap-4">
        {/* Left: Check indicators */}
        <div className="flex gap-2">
          <CheckBadge label="Arms" checked={checks.armsOpposed} detail={`L:${rotationLabel(armsDetail.left)} R:${rotationLabel(armsDetail.right)}`} />
          <CheckBadge label="Feet" checked={checks.feetOpposed} detail={`L:${rotationLabel(feetDetail.left)} R:${rotationLabel(feetDetail.right)}`} />
          <CheckBadge label="Knees" checked={checks.kneesBent} detail={`L:${angles.leftKnee ? Math.round(angles.leftKnee) : '--'}° R:${angles.rightKnee ? Math.round(angles.rightKnee) : '--'}°`} />
        </div>

        {/* Right: Main status */}
        <div
          className={`
            px-4 py-2 backdrop-blur-md rounded-lg transition-all duration-300
            ${isDetected
              ? 'bg-white/95 text-black'
              : allChecked
                ? 'bg-white/80 text-black'
                : 'bg-black/60 text-white/80'
            }
          `}
        >
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium tracking-wide">
              {isDetected ? '江戸走り検出' : poseStatus === 'holding' ? '判定中...' : '---'}
            </span>
            {poseStatus === 'holding' && (
              <div className="w-12 h-1 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-black transition-[width] duration-100"
                  style={{ width: `${Math.round(holdProgress * 100)}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const CheckBadge = ({
  label,
  checked,
  detail,
}: {
  label: string
  checked: boolean
  detail: string
}) => (
  <div
    className={`
      px-3 py-2 backdrop-blur-md rounded-lg transition-all duration-200
      ${checked ? 'bg-white/90 text-black' : 'bg-black/50 text-white/70'}
    `}
  >
    <div className="flex items-center gap-2 mb-0.5">
      <span className="text-[10px] uppercase tracking-wider opacity-60">{label}</span>
      <span className={`text-xs font-medium ${checked ? 'opacity-100' : 'opacity-40'}`}>
        {checked ? '✓' : '—'}
      </span>
    </div>
    <div className="text-xs">{detail}</div>
  </div>
)
