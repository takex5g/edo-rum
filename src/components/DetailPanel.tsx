import type { ArmDetail, FootDetail, PoseAngles, PoseChecks } from '../types'
import { rotationLabel } from '../utils'

type DetailPanelProps = {
  checks: PoseChecks
  angles: PoseAngles
  armsDetail: ArmDetail
  feetDetail: FootDetail
}

export const DetailPanel = ({ checks, angles, armsDetail, feetDetail }: DetailPanelProps) => {
  const armText = `左:${rotationLabel(armsDetail.left)} / 右:${rotationLabel(armsDetail.right)}`
  const footText = `左:${rotationLabel(feetDetail.left)} / 右:${rotationLabel(feetDetail.right)}`

  const checkItemClass = (isOk: boolean) =>
    isOk
      ? 'border-solid border-accent-cool/35 bg-accent-cool/10 text-[#1c4a4b]'
      : 'border-dashed border-ink/15 bg-ink/[0.03]'

  return (
    <section className="col-span-12 lg:col-span-3 bg-[rgba(255,248,238,0.92)] border border-ink/15 rounded-[20px] p-5 shadow-panel backdrop-blur-[10px] relative overflow-hidden animate-rise grid gap-4 [animation-delay:0.3s]">
      <div className="text-xs uppercase tracking-[0.12em] text-ink/55 font-bold mb-3">判定詳細</div>
      <div className="grid gap-2.5">
        <div
          className={`flex items-center justify-between px-3 py-2.5 rounded-xl border font-semibold ${checkItemClass(checks.armsOpposed)}`}
        >
          <div className="grid gap-1">
            <span>腕の回旋</span>
            <span className="text-xs font-medium text-ink/55">{armText}</span>
          </div>
          <span>{checks.armsOpposed ? 'OK' : '未'}</span>
        </div>
        <div
          className={`flex items-center justify-between px-3 py-2.5 rounded-xl border font-semibold ${checkItemClass(checks.feetOpposed)}`}
        >
          <div className="grid gap-1">
            <span>足の回旋</span>
            <span className="text-xs font-medium text-ink/55">{footText}</span>
          </div>
          <span>{checks.feetOpposed ? 'OK' : '未'}</span>
        </div>
        <div
          className={`flex items-center justify-between px-3 py-2.5 rounded-xl border font-semibold ${checkItemClass(checks.kneesBent)}`}
        >
          <span>膝の曲げ</span>
          <span>{checks.kneesBent ? 'OK' : '未'}</span>
        </div>
      </div>

      <div className="grid gap-1.5 text-[0.9rem] text-ink/70">
        <div>左膝: {angles.leftKnee ? `${Math.round(angles.leftKnee)}°` : '--'}</div>
        <div>右膝: {angles.rightKnee ? `${Math.round(angles.rightKnee)}°` : '--'}</div>
      </div>
    </section>
  )
}
