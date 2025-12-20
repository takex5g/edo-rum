import { useCallback, useEffect, useRef, useState } from 'react'

export type UseCameraReturn = {
  videoRef: React.RefObject<HTMLVideoElement | null>
  isCameraOn: boolean
  startCamera: () => Promise<void>
  stopCamera: () => void
  cameraError: string | null
}

export const useCamera = (): UseCameraReturn => {
  const [isCameraOn, setIsCameraOn] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsCameraOn(false)
  }, [])

  const startCamera = useCallback(async () => {
    setCameraError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setIsCameraOn(true)
    } catch {
      setCameraError('カメラを開始できませんでした。ブラウザの権限を確認してください。')
      setIsCameraOn(false)
    }
  }, [])

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  return {
    videoRef,
    isCameraOn,
    startCamera,
    stopCamera,
    cameraError,
  }
}
