import { useEffect, useRef, useState } from 'react'
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision'
import type { ModelStatus } from '../types'
import { INITIAL_RUNNING_MODE, MODEL_URL, WASM_URL } from '../constants'

export type UsePoseLandmarkerReturn = {
  poseLandmarker: PoseLandmarker | null
  modelStatus: ModelStatus
  runningMode: 'VIDEO' | 'IMAGE' | null
  setRunningMode: (mode: 'VIDEO' | 'IMAGE') => Promise<void>
  error: string | null
}

export const usePoseLandmarker = (): UsePoseLandmarkerReturn => {
  const [modelStatus, setModelStatus] = useState<ModelStatus>('loading')
  const [error, setError] = useState<string | null>(null)
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null)
  const runningModeRef = useRef<'VIDEO' | 'IMAGE' | null>(null)

  useEffect(() => {
    let cancelled = false

    const loadPose = async () => {
      setModelStatus('loading')
      const vision = await FilesetResolver.forVisionTasks(WASM_URL)
      const landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MODEL_URL,
          delegate: 'GPU',
        },
        runningMode: INITIAL_RUNNING_MODE,
        numPoses: 1,
      })

      if (cancelled) {
        landmarker.close()
        return
      }

      poseLandmarkerRef.current = landmarker
      runningModeRef.current = INITIAL_RUNNING_MODE
      setModelStatus('ready')
    }

    loadPose().catch((err) => {
      if (!cancelled) {
        console.error(err)
        setError('モデルの読み込みに失敗しました。通信環境を確認してください。')
        setModelStatus('error')
      }
    })

    return () => {
      cancelled = true
      poseLandmarkerRef.current?.close()
    }
  }, [])

  const setRunningMode = async (mode: 'VIDEO' | 'IMAGE') => {
    const landmarker = poseLandmarkerRef.current
    if (!landmarker || runningModeRef.current === mode) {
      return
    }
    await landmarker.setOptions({ runningMode: mode })
    runningModeRef.current = mode
  }

  return {
    poseLandmarker: poseLandmarkerRef.current,
    modelStatus,
    runningMode: runningModeRef.current,
    setRunningMode,
    error,
  }
}
