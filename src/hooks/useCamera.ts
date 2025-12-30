import { useCallback, useEffect, useRef, useState } from 'react'

export type UseCameraReturn = {
  videoRef: React.RefObject<HTMLVideoElement | null>
  isCameraOn: boolean
  isStarting: boolean
  startCamera: () => Promise<void>
  stopCamera: () => void
  cameraError: string | null
}

export const useCamera = (): UseCameraReturn => {
  const [isCameraOn, setIsCameraOn] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
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
    setIsStarting(false)
    setCameraError(null)
  }, [])

  const startCamera = useCallback(async () => {
    // 既に開始中または開始済みの場合は何もしない
    if (isStarting || isCameraOn) {
      return
    }

    setCameraError(null)
    setIsStarting(true)

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
      setIsStarting(false)
    } catch (error) {
      const errorMessage =
        error instanceof Error && error.name === 'NotAllowedError'
          ? 'カメラの使用が許可されませんでした。ブラウザの設定を確認してください。'
          : error instanceof Error && error.name === 'NotFoundError'
          ? 'カメラが見つかりませんでした。'
          : 'カメラを開始できませんでした。ブラウザの権限を確認してください。'
      setCameraError(errorMessage)
      setIsCameraOn(false)
      setIsStarting(false)
    }
  }, [isStarting, isCameraOn])

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  return {
    videoRef,
    isCameraOn,
    isStarting,
    startCamera,
    stopCamera,
    cameraError,
  }
}
