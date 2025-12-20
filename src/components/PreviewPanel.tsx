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
      <div className="flex-1 bg-[#0a0a0a] relative">
        {inputMode === 'camera' ? (
          <video
            ref={videoRef as React.RefObject<HTMLVideoElement>}
            muted
            playsInline
            autoPlay
            className="absolute inset-0 w-full h-full object-contain"
          />
        ) : (
          <img
            ref={imageRef}
            src={selectedImage ?? ''}
            alt="Test image"
            className="absolute inset-0 w-full h-full object-contain"
          />
        )}
        <canvas
          ref={canvasRef as React.RefObject<HTMLCanvasElement>}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />

        {/* Overlay status indicator */}
        {inputMode === 'camera' && !isCameraOn && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white/40 text-sm tracking-wider uppercase">
              Press Start to begin
            </span>
          </div>
        )}
      </div>
    )
  }
)

PreviewPanel.displayName = 'PreviewPanel'
