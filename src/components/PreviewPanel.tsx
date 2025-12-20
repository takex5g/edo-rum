import { forwardRef } from 'react'
import type { InputMode } from '../types'

type PreviewPanelProps = {
  inputMode: InputMode
  selectedImage: string | null
  isCameraOn: boolean
  videoRef: React.RefObject<HTMLVideoElement | null>
  canvasRef: React.RefObject<HTMLCanvasElement | null>
}

export const PreviewPanel = forwardRef<HTMLImageElement, PreviewPanelProps>(
  ({ inputMode, selectedImage, isCameraOn, videoRef, canvasRef }, imageRef) => {
    return (
      <section className="col-span-12 lg:col-span-5 bg-[rgba(255,248,238,0.92)] border border-ink/15 rounded-[20px] p-5 shadow-panel backdrop-blur-[10px] relative overflow-hidden animate-rise grid gap-3 [animation-delay:0.2s]">
        <div className="text-xs uppercase tracking-[0.12em] text-ink/55 font-bold mb-3">
          プレビュー
        </div>
        <div className="w-full rounded-2xl bg-[#1f1c19] overflow-hidden grid place-items-center relative">
          {inputMode === 'camera' ? (
            <video
              ref={videoRef as React.RefObject<HTMLVideoElement>}
              muted
              playsInline
              autoPlay
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              ref={imageRef}
              src={selectedImage ?? ''}
              alt="テスト画像"
              className="w-full h-full object-cover"
            />
          )}
          <canvas
            ref={canvasRef as React.RefObject<HTMLCanvasElement>}
            className="absolute inset-0 w-full h-full pointer-events-none"
          />
        </div>
        <div className="text-[0.85rem] text-ink/65">
          {inputMode === 'camera'
            ? isCameraOn
              ? 'カメラ映像を解析中'
              : 'カメラを開始してください'
            : `テスト画像: ${inputMode === 'sample-edo' ? '江戸走り' : '走ってない'}`}
        </div>
      </section>
    )
  }
)

PreviewPanel.displayName = 'PreviewPanel'
