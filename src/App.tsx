import { useCallback, useEffect, useRef, useState } from 'react'
import type { InputMode, Landmark, PoseEvaluation, PoseResult } from './types'
import { SAMPLE_SOURCES } from './constants'
import { drawPoseOverlay, evaluatePose } from './utils'
import { useBgmAudio, useCamera, usePoseLandmarker, usePoseState } from './hooks'
import { ControlPanel, DetailPanel, Header, PreviewPanel } from './components'

function App() {
  const [inputMode, setInputMode] = useState<InputMode>('sample-edo')

  const imageRef = useRef<HTMLImageElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const lastVideoTimeRef = useRef<number>(-1)
  const lastImageRunRef = useRef<number>(0)
  const lastImageKeyRef = useRef<string | null>(null)
  const lastEvaluationRef = useRef<PoseEvaluation | null>(null)
  const lastLandmarksRef = useRef<Landmark[] | null>(null)
  const rafRef = useRef<number | null>(null)

  const { poseLandmarker, modelStatus, runningMode, setRunningMode, error: modelError } = usePoseLandmarker()
  const { videoRef, isCameraOn, startCamera, stopCamera, cameraError } = useCamera()
  const {
    poseStatus,
    holdProgress,
    checks,
    angles,
    armsDetail,
    feetDetail,
    updatePoseState,
    resetPoseState,
  } = usePoseState()
  const { audioError } = useBgmAudio(poseStatus)

  const selectedImage = inputMode === 'camera' ? null : SAMPLE_SOURCES[inputMode]

  const error = modelError || cameraError || audioError

  const handleModeChange = useCallback(
    (value: InputMode) => {
      setInputMode(value)
      resetPoseState()
      lastEvaluationRef.current = null
      lastImageKeyRef.current = null
      lastImageRunRef.current = 0
      lastLandmarksRef.current = null
    },
    [resetPoseState]
  )

  useEffect(() => {
    if (inputMode !== 'camera' && isCameraOn) {
      stopCamera()
    }
  }, [inputMode, isCameraOn, stopCamera])

  useEffect(() => {
    if (modelStatus !== 'ready') {
      return
    }
    const desiredMode = inputMode === 'camera' ? 'VIDEO' : 'IMAGE'
    if (runningMode !== desiredMode) {
      setRunningMode(desiredMode)
    }
  }, [inputMode, modelStatus, runningMode, setRunningMode])

  useEffect(() => {
    if (modelStatus !== 'ready') {
      return
    }

    let stopped = false

    const tick = () => {
      if (stopped) {
        return
      }

      if (!poseLandmarker) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }

      const now = performance.now()
      let result: PoseResult | null = null
      let evaluation: PoseEvaluation | null = null

      if (inputMode === 'camera') {
        if (runningMode !== 'VIDEO') {
          rafRef.current = requestAnimationFrame(tick)
          return
        }
        const video = videoRef.current
        if (isCameraOn && video && video.readyState >= 2) {
          if (video.currentTime !== lastVideoTimeRef.current) {
            lastVideoTimeRef.current = video.currentTime
            result = poseLandmarker.detectForVideo(video, now) as PoseResult
          }
        }
      } else {
        if (runningMode !== 'IMAGE') {
          rafRef.current = requestAnimationFrame(tick)
          return
        }
        const image = imageRef.current
        const isImageReady =
          !!image && image.complete && image.naturalWidth > 0 && image.naturalHeight > 0
        const imageKey = selectedImage ?? ''
        const shouldDetect =
          isImageReady && (imageKey !== lastImageKeyRef.current || !lastEvaluationRef.current)
        if (shouldDetect && now - lastImageRunRef.current > 200) {
          lastImageRunRef.current = now
          lastImageKeyRef.current = imageKey
          result = poseLandmarker.detect(image) as PoseResult
        }
        evaluation = lastEvaluationRef.current
      }

      let shouldUpdate = false
      if (result?.landmarks?.[0]) {
        lastLandmarksRef.current = result.landmarks[0]
        evaluation = evaluatePose(result.landmarks[0])
        if (evaluation.arms.left !== 'unknown') {
          lastEvaluationRef.current = evaluation
          shouldUpdate = true
        }
      }

      if (
        evaluation &&
        evaluation.arms.left !== 'unknown' &&
        (shouldUpdate || inputMode !== 'camera')
      ) {
        updatePoseState(
          evaluation.match,
          evaluation.checks,
          evaluation.angles,
          evaluation.arms,
          evaluation.feet,
          now
        )
      }

      const canvas = canvasRef.current
      if (canvas) {
        if (inputMode === 'camera' && videoRef.current) {
          const video = videoRef.current
          const rect = video.getBoundingClientRect()
          drawPoseOverlay({
            canvas,
            landmarks: lastLandmarksRef.current,
            displayWidth: rect.width,
            displayHeight: rect.height,
            sourceWidth: video.videoWidth,
            sourceHeight: video.videoHeight,
          })
        } else if (inputMode !== 'camera' && imageRef.current) {
          const image = imageRef.current
          const rect = image.getBoundingClientRect()
          drawPoseOverlay({
            canvas,
            landmarks: lastLandmarksRef.current,
            displayWidth: rect.width,
            displayHeight: rect.height,
            sourceWidth: image.naturalWidth,
            sourceHeight: image.naturalHeight,
          })
        }
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      stopped = true
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [inputMode, isCameraOn, modelStatus, poseLandmarker, runningMode, selectedImage, updatePoseState, videoRef])

  return (
    <div className="max-w-[1200px] mx-auto px-6 pt-8 pb-12 flex flex-col gap-6">
      <Header />

      <main className="grid grid-cols-12 gap-5">
        <ControlPanel
          inputMode={inputMode}
          onModeChange={handleModeChange}
          poseStatus={poseStatus}
          modelStatus={modelStatus}
          holdProgress={holdProgress}
          isCameraOn={isCameraOn}
          onStartCamera={startCamera}
          onStopCamera={stopCamera}
          error={error}
        />

        <PreviewPanel
          ref={imageRef}
          inputMode={inputMode}
          selectedImage={selectedImage}
          isCameraOn={isCameraOn}
          videoRef={videoRef}
          canvasRef={canvasRef}
        />

        <DetailPanel
          checks={checks}
          angles={angles}
          armsDetail={armsDetail}
          feetDetail={feetDetail}
        />
      </main>
    </div>
  )
}

export default App
