import type { ArmDetail, FootDetail, PoseAngles, PoseChecks, PoseStatus } from '../types'
import { DetailPanel } from './DetailPanel'

type PreviewPanelProps = {
  isCameraOn: boolean
  isStarting: boolean
  videoRef: React.RefObject<HTMLVideoElement | null>
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  checks: PoseChecks
  angles: PoseAngles
  armsDetail: ArmDetail
  feetDetail: FootDetail
  poseStatus: PoseStatus
  holdProgress: number
}

export const PreviewPanel = ({
  isCameraOn,
  isStarting,
  videoRef,
  canvasRef,
  checks,
  angles,
  armsDetail,
  feetDetail,
  poseStatus,
  holdProgress,
}: PreviewPanelProps) => {
  return (
    <div className="absolute inset-0 bg-[#f5f5f5]">
      <video
        ref={videoRef as React.RefObject<HTMLVideoElement>}
        muted
        playsInline
        autoPlay
        className="absolute inset-0 w-full h-full object-cover"
      />
      <canvas
        ref={canvasRef as React.RefObject<HTMLCanvasElement>}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Overlay status indicator */}
      {!isCameraOn && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[var(--color-ink-muted)] text-sm tracking-wider uppercase">
            {isStarting ? 'カメラを開始しています...' : 'カメラを準備中...'}
          </span>
        </div>
      )}

      {/* Detail overlay */}
      <DetailPanel
        checks={checks}
        angles={angles}
        armsDetail={armsDetail}
        feetDetail={feetDetail}
        poseStatus={poseStatus}
        holdProgress={holdProgress}
      />
    </div>
  )
}
