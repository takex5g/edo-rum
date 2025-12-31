import { useCallback, useEffect, useRef, useState } from 'react'

export type UseCameraReturn = {
  videoRef: React.RefObject<HTMLVideoElement | null>
  isCameraOn: boolean
  isStarting: boolean
  facingMode: 'user' | 'environment'
  startCamera: () => Promise<void>
  stopCamera: () => void
  switchCamera: () => Promise<void>
  cameraError: string | null
}

export const useCamera = (): UseCameraReturn => {
  const [isCameraOn, setIsCameraOn] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
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
        video: { facingMode },
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
  }, [isStarting, isCameraOn, facingMode])

  const switchCamera = useCallback(async () => {
    const wasCameraOn = isCameraOn
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user'
    
    // カメラが起動している場合は停止
    if (wasCameraOn) {
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
      setIsCameraOn(false)
      setIsStarting(false)
      // カメラを停止してから少し待つ
      await new Promise((resolve) => setTimeout(resolve, 200))
    }
    
    setFacingMode(newFacingMode)
    
    // カメラが起動していた場合は新しいカメラで再開
    if (wasCameraOn) {
      setCameraError(null)
      setIsStarting(true)
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: newFacingMode },
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
    }
  }, [isCameraOn, facingMode])

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  return {
    videoRef,
    isCameraOn,
    isStarting,
    facingMode,
    startCamera,
    stopCamera,
    switchCamera,
    cameraError,
  }
}
