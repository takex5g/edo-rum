import type { ArmDetail, FootDetail, PoseAngles, PoseChecks } from '../types'
import { rotationLabel } from '../utils'

type DetailPanelProps = {
  checks: PoseChecks
  angles: PoseAngles
  armsDetail: ArmDetail
  feetDetail: FootDetail
}

export const DetailPanel = ({ checks, angles, armsDetail, feetDetail }: DetailPanelProps) => {
  return (
    <div className="border-t border-[var(--color-border)] bg-[var(--color-bg-alt)]">
      <div className="grid grid-cols-12">
        {/* Arms */}
        <div className="col-span-3 border-r border-[var(--color-border)] p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-[var(--color-ink-muted)] uppercase tracking-wider">
              Arms
            </span>
            <span className={`text-xs font-medium ${checks.armsOpposed ? 'text-[var(--color-ink)]' : 'text-[var(--color-ink-muted)]'}`}>
              {checks.armsOpposed ? 'OK' : '---'}
            </span>
          </div>
          <div className="text-sm">
            L: {rotationLabel(armsDetail.left)} / R: {rotationLabel(armsDetail.right)}
          </div>
        </div>

        {/* Feet */}
        <div className="col-span-3 border-r border-[var(--color-border)] p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-[var(--color-ink-muted)] uppercase tracking-wider">
              Feet
            </span>
            <span className={`text-xs font-medium ${checks.feetOpposed ? 'text-[var(--color-ink)]' : 'text-[var(--color-ink-muted)]'}`}>
              {checks.feetOpposed ? 'OK' : '---'}
            </span>
          </div>
          <div className="text-sm">
            L: {rotationLabel(feetDetail.left)} / R: {rotationLabel(feetDetail.right)}
          </div>
        </div>

        {/* Knees */}
        <div className="col-span-3 border-r border-[var(--color-border)] p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-[var(--color-ink-muted)] uppercase tracking-wider">
              Knees
            </span>
            <span className={`text-xs font-medium ${checks.kneesBent ? 'text-[var(--color-ink)]' : 'text-[var(--color-ink-muted)]'}`}>
              {checks.kneesBent ? 'OK' : '---'}
            </span>
          </div>
          <div className="text-sm text-[var(--color-ink-muted)]">
            Bent check
          </div>
        </div>

        {/* Angles */}
        <div className="col-span-3 p-3">
          <div className="text-[10px] text-[var(--color-ink-muted)] uppercase tracking-wider mb-1">
            Angles
          </div>
          <div className="text-sm">
            L: {angles.leftKnee ? `${Math.round(angles.leftKnee)}°` : '--'} / R: {angles.rightKnee ? `${Math.round(angles.rightKnee)}°` : '--'}
          </div>
        </div>
      </div>
    </div>
  )
}
