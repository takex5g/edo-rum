import { useEffect, useRef, useState } from 'react';
import type { Landmark, PoseEvaluation, PoseResult } from './types';
import { drawPoseOverlay, evaluatePose } from './utils';
import {
  useBgmAudio,
  useCamera,
  usePoseLandmarker,
  usePoseState,
} from './hooks';
import { AudioWarningModal, ControlPanel, PreviewPanel } from './components';

function App() {
  const [showAudioWarning, setShowAudioWarning] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const lastEvaluationRef = useRef<PoseEvaluation | null>(null);
  const lastLandmarksRef = useRef<Landmark[] | null>(null);
  const rafRef = useRef<number | null>(null);

  const {
    poseLandmarker,
    modelStatus,
    runningMode,
    setRunningMode,
    error: modelError,
  } = usePoseLandmarker();
  const {
    videoRef,
    isCameraOn,
    isStarting,
    facingMode,
    startCamera,
    stopCamera,
    switchCamera,
    cameraError,
  } = useCamera();
  const {
    poseStatus,
    holdProgress,
    checks,
    angles,
    armsDetail,
    feetDetail,
    updatePoseState,
  } = usePoseState();
  const { audioError, enableAudio } = useBgmAudio(poseStatus);

  const error = modelError || cameraError || audioError;

  useEffect(() => {
    if (modelStatus !== 'ready') {
      return;
    }
    if (runningMode !== 'VIDEO') {
      setRunningMode('VIDEO');
    }
    // モデルが準備できたら自動的にカメラを開始
    // isStarting または isCameraOn の場合は重複起動を防ぐ
    if (!isCameraOn && !isStarting) {
      startCamera();
    }
  }, [
    modelStatus,
    runningMode,
    setRunningMode,
    isCameraOn,
    isStarting,
    startCamera,
  ]);

  useEffect(() => {
    if (modelStatus !== 'ready') {
      return;
    }

    let stopped = false;

    const tick = () => {
      if (stopped) {
        return;
      }

      if (!poseLandmarker) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const now = performance.now();
      let result: PoseResult | null = null;
      let evaluation: PoseEvaluation | null = null;

      if (runningMode !== 'VIDEO') {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const video = videoRef.current;
      if (isCameraOn && video && video.readyState >= 2) {
        if (video.currentTime !== lastVideoTimeRef.current) {
          lastVideoTimeRef.current = video.currentTime;
          result = poseLandmarker.detectForVideo(video, now) as PoseResult;
        }
      }

      let shouldUpdate = false;
      if (result?.landmarks?.[0]) {
        lastLandmarksRef.current = result.landmarks[0];
        evaluation = evaluatePose(result.landmarks[0]);
        if (evaluation.arms.left !== 'unknown') {
          lastEvaluationRef.current = evaluation;
          shouldUpdate = true;
        }
      }

      if (evaluation && evaluation.arms.left !== 'unknown' && shouldUpdate) {
        updatePoseState(
          evaluation.match,
          evaluation.checks,
          evaluation.angles,
          evaluation.arms,
          evaluation.feet,
          now
        );
      }

      const canvas = canvasRef.current;
      if (canvas && videoRef.current) {
        const video = videoRef.current;
        const rect = video.getBoundingClientRect();
        drawPoseOverlay({
          canvas,
          landmarks: lastLandmarksRef.current,
          displayWidth: rect.width,
          displayHeight: rect.height,
          sourceWidth: video.videoWidth,
          sourceHeight: video.videoHeight,
          evaluation: lastEvaluationRef.current,
        });
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      stopped = true;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [
    isCameraOn,
    modelStatus,
    poseLandmarker,
    runningMode,
    updatePoseState,
    videoRef,
  ]);

  return (
    <div className='h-screen w-screen bg-[var(--color-bg)] relative overflow-hidden'>
      <PreviewPanel
        isCameraOn={isCameraOn}
        isStarting={isStarting}
        videoRef={videoRef}
        canvasRef={canvasRef}
        checks={checks}
        angles={angles}
        armsDetail={armsDetail}
        feetDetail={feetDetail}
        poseStatus={poseStatus}
        holdProgress={holdProgress}
      />

      <ControlPanel
        modelStatus={modelStatus}
        isCameraOn={isCameraOn}
        facingMode={facingMode}
        onStopCamera={stopCamera}
        onSwitchCamera={switchCamera}
        error={error}
      />

      <AudioWarningModal
        isOpen={showAudioWarning}
        onClose={async () => {
          await enableAudio();
          setShowAudioWarning(false);
        }}
      />
    </div>
  );
}

export default App;
