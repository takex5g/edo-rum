import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision'

type InputMode = 'camera' | 'sample-edo' | 'sample-norun'

type PoseStatus = 'idle' | 'holding' | 'detected'

type ModelStatus = 'loading' | 'ready' | 'error'

type PoseChecks = {
  armsOpposed: boolean
  feetOpposed: boolean
  kneesBent: boolean
}

type PoseAngles = {
  leftKnee: number | null
  rightKnee: number | null
}

type ArmRotation = 'internal' | 'external' | 'neutral' | 'unknown'

type ArmDetail = {
  left: ArmRotation
  right: ArmRotation
  leftZ: number | null
  rightZ: number | null
}

type FootRotation = 'internal' | 'external' | 'neutral' | 'unknown'

type FootDetail = {
  left: FootRotation
  right: FootRotation
  leftZ: number | null
  rightZ: number | null
}

type Landmark = {
  x: number
  y: number
  z: number
  visibility?: number
}

type PoseResult = {
  landmarks: Landmark[][]
}

type PoseEvaluation = {
  match: boolean
  checks: PoseChecks
  angles: PoseAngles
  arms: ArmDetail
  feet: FootDetail
}

const WASM_URL =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm'
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'

const INITIAL_RUNNING_MODE: 'VIDEO' | 'IMAGE' = 'IMAGE'
const HOLD_MS = 1000
const MIN_VISIBILITY = 0.5
const KNEE_ANGLE_MAX = 165
// Z座標の差分閾値（左右の手首/足のZ座標差がこれ以上なら内旋/外旋と判定）
const Z_DIFF_THRESHOLD = 0.02

const DEFAULT_CHECKS: PoseChecks = {
  armsOpposed: false,
  feetOpposed: false,
  kneesBent: false,
}

const DEFAULT_ANGLES: PoseAngles = {
  leftKnee: null,
  rightKnee: null,
}

const DEFAULT_ARMS: ArmDetail = {
  left: 'unknown',
  right: 'unknown',
  leftZ: null,
  rightZ: null,
}

const DEFAULT_FEET: FootDetail = {
  left: 'unknown',
  right: 'unknown',
  leftZ: null,
  rightZ: null,
}

const sampleSources: Record<Exclude<InputMode, 'camera'>, string> = {
  'sample-edo': '/江戸走り.png',
  'sample-norun': '/走ってない.png',
}

const POSE_CONNECTIONS: Array<[number, number]> = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 7],
  [0, 4],
  [4, 5],
  [5, 6],
  [6, 8],
  [9, 10],
  [11, 12],
  [11, 13],
  [13, 15],
  [15, 17],
  [15, 19],
  [15, 21],
  [17, 19],
  [12, 14],
  [14, 16],
  [16, 18],
  [16, 20],
  [16, 22],
  [18, 20],
  [11, 23],
  [12, 24],
  [23, 24],
  [23, 25],
  [24, 26],
  [25, 27],
  [26, 28],
  [27, 29],
  [28, 30],
  [29, 31],
  [30, 32],
]

const angle = (a: Landmark, b: Landmark, c: Landmark) => {
  const ab = { x: a.x - b.x, y: a.y - b.y }
  const cb = { x: c.x - b.x, y: c.y - b.y }
  const dot = ab.x * cb.x + ab.y * cb.y
  const abMag = Math.hypot(ab.x, ab.y)
  const cbMag = Math.hypot(cb.x, cb.y)

  if (!abMag || !cbMag) {
    return 180
  }

  const cos = Math.min(Math.max(dot / (abMag * cbMag), -1), 1)
  return (Math.acos(cos) * 180) / Math.PI
}

const rotationLabel = (rotation: ArmRotation) => {
  if (rotation === 'internal') {
    return '内旋'
  }
  if (rotation === 'external') {
    return '外旋'
  }
  if (rotation === 'neutral') {
    return '中立'
  }
  return '不明'
}

const evaluatePose = (landmarks: Landmark[]) => {
  const pick = (index: number) => {
    const point = landmarks[index]
    if (!point) {
      return null
    }
    if (point.visibility !== undefined && point.visibility < MIN_VISIBILITY) {
      return null
    }
    return point
  }

  const leftShoulder = pick(11)
  const rightShoulder = pick(12)
  const leftElbow = pick(13)
  const rightElbow = pick(14)
  const leftWrist = pick(15)
  const rightWrist = pick(16)
  const leftHip = pick(23)
  const rightHip = pick(24)
  const leftKnee = pick(25)
  const rightKnee = pick(26)
  const leftAnkle = pick(27)
  const rightAnkle = pick(28)
  const leftFootIndex = pick(31)
  const rightFootIndex = pick(32)

  if (
    !leftShoulder ||
    !rightShoulder ||
    !leftElbow ||
    !rightElbow ||
    !leftWrist ||
    !rightWrist ||
    !leftHip ||
    !rightHip ||
    !leftKnee ||
    !rightKnee ||
    !leftAnkle ||
    !rightAnkle
  ) {
    return {
      match: false,
      checks: DEFAULT_CHECKS,
      angles: DEFAULT_ANGLES,
      arms: DEFAULT_ARMS,
      feet: DEFAULT_FEET,
    }
  }

  // Z座標ベースの腕の内旋/外旋判定
  // MediaPipe Z座標: 小さい = カメラに近い（前方）、大きい = カメラから遠い（後方）
  // 左腕（外旋）: 左手首が前方（Z座標が小さい）
  // 右腕（内旋）: 右手首が後方（Z座標が大きい）
  const armZDiff = rightWrist.z - leftWrist.z // 正なら左が前、右が後ろ
  const leftExternal = armZDiff > Z_DIFF_THRESHOLD
  const rightInternal = armZDiff > Z_DIFF_THRESHOLD
  const armsOpposed = leftExternal && rightInternal

  console.log('--- evaluatePose ---')
  console.log('leftWrist.z:', leftWrist.z, 'rightWrist.z:', rightWrist.z)
  console.log('armZDiff:', armZDiff, 'threshold:', Z_DIFF_THRESHOLD)
  console.log('leftExternal:', leftExternal, 'rightInternal:', rightInternal)

  const leftArmRotation: ArmRotation = leftWrist.z < rightWrist.z - Z_DIFF_THRESHOLD
    ? 'external'
    : leftWrist.z > rightWrist.z + Z_DIFF_THRESHOLD
      ? 'internal'
      : 'neutral'
  const rightArmRotation: ArmRotation = rightWrist.z > leftWrist.z + Z_DIFF_THRESHOLD
    ? 'internal'
    : rightWrist.z < leftWrist.z - Z_DIFF_THRESHOLD
      ? 'external'
      : 'neutral'

  // 膝の曲げ判定
  const leftKneeAngle = angle(leftHip, leftKnee, leftAnkle)
  const rightKneeAngle = angle(rightHip, rightKnee, rightAnkle)
  const kneesBent =
    leftKneeAngle < KNEE_ANGLE_MAX && rightKneeAngle < KNEE_ANGLE_MAX

  // Z座標ベースの足の内旋/外旋判定
  // 左足（外旋）: 左足先のZ座標が大きい（後方/外側）
  // 右足（内旋）: 右足先のZ座標が小さい（前方/内側）
  let leftFootZ: number | null = null
  let rightFootZ: number | null = null
  let leftFootRotation: FootRotation = 'unknown'
  let rightFootRotation: FootRotation = 'unknown'
  let feetOpposed = false

  if (leftFootIndex && rightFootIndex) {
    leftFootZ = leftFootIndex.z
    rightFootZ = rightFootIndex.z

    const footZDiff = leftFootZ - rightFootZ // 正なら左が後ろ、右が前
    const leftExternal_foot = footZDiff > Z_DIFF_THRESHOLD
    const rightInternal_foot = footZDiff > Z_DIFF_THRESHOLD

    console.log('leftFootZ:', leftFootZ, 'rightFootZ:', rightFootZ)
    console.log('footZDiff:', footZDiff)
    console.log('leftExternal_foot:', leftExternal_foot, 'rightInternal_foot:', rightInternal_foot)

    leftFootRotation = leftFootZ > rightFootZ + Z_DIFF_THRESHOLD
      ? 'external'
      : leftFootZ < rightFootZ - Z_DIFF_THRESHOLD
        ? 'internal'
        : 'neutral'
    rightFootRotation = rightFootZ < leftFootZ - Z_DIFF_THRESHOLD
      ? 'internal'
      : rightFootZ > leftFootZ + Z_DIFF_THRESHOLD
        ? 'external'
        : 'neutral'

    feetOpposed = leftExternal_foot && rightInternal_foot
  }

  return {
    match: armsOpposed && feetOpposed && kneesBent,
    checks: {
      armsOpposed,
      feetOpposed,
      kneesBent,
    },
    angles: {
      leftKnee: leftKneeAngle,
      rightKnee: rightKneeAngle,
    },
    arms: {
      left: leftArmRotation,
      right: rightArmRotation,
      leftZ: leftWrist.z,
      rightZ: rightWrist.z,
    },
    feet: {
      left: leftFootRotation,
      right: rightFootRotation,
      leftZ: leftFootZ,
      rightZ: rightFootZ,
    },
  }
}

const drawPoseOverlay = ({
  canvas,
  landmarks,
  displayWidth,
  displayHeight,
  sourceWidth,
  sourceHeight,
}: {
  canvas: HTMLCanvasElement
  landmarks: Landmark[] | null
  displayWidth: number
  displayHeight: number
  sourceWidth: number
  sourceHeight: number
}) => {
  if (!displayWidth || !displayHeight) {
    return
  }

  const context = canvas.getContext('2d')
  if (!context) {
    return
  }

  const dpr = window.devicePixelRatio || 1
  const canvasWidth = Math.round(displayWidth * dpr)
  const canvasHeight = Math.round(displayHeight * dpr)

  if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
    canvas.width = canvasWidth
    canvas.height = canvasHeight
    canvas.style.width = `${displayWidth}px`
    canvas.style.height = `${displayHeight}px`
  }

  context.setTransform(dpr, 0, 0, dpr, 0, 0)
  context.clearRect(0, 0, displayWidth, displayHeight)

  if (!landmarks || !sourceWidth || !sourceHeight) {
    return
  }

  const scale = Math.max(displayWidth / sourceWidth, displayHeight / sourceHeight)
  const offsetX = (displayWidth - sourceWidth * scale) / 2
  const offsetY = (displayHeight - sourceHeight * scale) / 2

  const toCanvas = (point: Landmark) => ({
    x: point.x * sourceWidth * scale + offsetX,
    y: point.y * sourceHeight * scale + offsetY,
  })

  context.lineWidth = 2.2
  context.strokeStyle = 'rgba(216, 97, 60, 0.9)'
  context.lineCap = 'round'
  context.lineJoin = 'round'

  for (const [start, end] of POSE_CONNECTIONS) {
    const startPoint = landmarks[start]
    const endPoint = landmarks[end]
    if (!startPoint || !endPoint) {
      continue
    }
    if (
      (startPoint.visibility !== undefined &&
        startPoint.visibility < MIN_VISIBILITY) ||
      (endPoint.visibility !== undefined && endPoint.visibility < MIN_VISIBILITY)
    ) {
      continue
    }
    const from = toCanvas(startPoint)
    const to = toCanvas(endPoint)
    context.beginPath()
    context.moveTo(from.x, from.y)
    context.lineTo(to.x, to.y)
    context.stroke()
  }

  context.fillStyle = 'rgba(44, 107, 109, 0.9)'
  for (const point of landmarks) {
    if (point.visibility !== undefined && point.visibility < MIN_VISIBILITY) {
      continue
    }
    const { x, y } = toCanvas(point)
    context.beginPath()
    context.arc(x, y, 3.2, 0, Math.PI * 2)
    context.fill()
  }
}

function App() {
  const [inputMode, setInputMode] = useState<InputMode>('sample-edo')
  const [poseStatus, setPoseStatus] = useState<PoseStatus>('idle')
  const [holdProgress, setHoldProgress] = useState(0)
  const [modelStatus, setModelStatus] = useState<ModelStatus>('loading')
  const [error, setError] = useState<string | null>(null)
  const [checks, setChecks] = useState<PoseChecks>(DEFAULT_CHECKS)
  const [angles, setAngles] = useState<PoseAngles>(DEFAULT_ANGLES)
  const [armsDetail, setArmsDetail] = useState<ArmDetail>(DEFAULT_ARMS)
  const [feetDetail, setFeetDetail] = useState<FootDetail>(DEFAULT_FEET)
  const [isCameraOn, setIsCameraOn] = useState(false)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null)
  const runningModeRef = useRef<'VIDEO' | 'IMAGE' | null>(null)
  const holdStartRef = useRef<number | null>(null)
  const lastVideoTimeRef = useRef<number>(-1)
  const lastImageRunRef = useRef<number>(0)
  const lastImageKeyRef = useRef<string | null>(null)
  const lastEvaluationRef = useRef<PoseEvaluation | null>(null)
  const lastLandmarksRef = useRef<Landmark[] | null>(null)
  const rafRef = useRef<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fadeOutRef = useRef<number | null>(null)

  const selectedImage =
    inputMode === 'camera' ? null : sampleSources[inputMode]

  const setPoseStatusIfChanged = useCallback((next: PoseStatus) => {
    setPoseStatus((prev) => (prev === next ? prev : next))
  }, [])

  const resetPoseState = useCallback(() => {
    holdStartRef.current = null
    setPoseStatusIfChanged('idle')
    setHoldProgress(0)
    setChecks(DEFAULT_CHECKS)
    setAngles(DEFAULT_ANGLES)
    setArmsDetail(DEFAULT_ARMS)
    setFeetDetail(DEFAULT_FEET)
    lastLandmarksRef.current = null
  }, [setPoseStatusIfChanged])

  const updatePoseState = useCallback(
    (
      match: boolean,
      nextChecks: PoseChecks,
      nextAngles: PoseAngles,
      nextArms: ArmDetail,
      nextFeet: FootDetail,
      now: number
    ) => {
      console.log('=== updatePoseState ===')
      console.log('match:', match)
      console.log('checks:', nextChecks)
      console.log('arms:', nextArms)
      console.log('feet:', nextFeet)

      if (match) {
        if (holdStartRef.current === null) {
          holdStartRef.current = now
        }
        const elapsed = now - holdStartRef.current
        const progress = Math.min(elapsed / HOLD_MS, 1)
        setHoldProgress(progress)
        if (elapsed >= HOLD_MS) {
          setPoseStatusIfChanged('detected')
        } else {
          setPoseStatusIfChanged('holding')
        }
      } else {
        holdStartRef.current = null
        setHoldProgress(0)
        setPoseStatusIfChanged('idle')
      }

      setChecks(nextChecks)
      setAngles(nextAngles)
      setArmsDetail(nextArms)
      setFeetDetail(nextFeet)
    },
    [setPoseStatusIfChanged]
  )

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsCameraOn(false)
    lastLandmarksRef.current = null
  }, [])

  const startCamera = useCallback(async () => {
    setError(null)
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
    } catch (err) {
      setError('カメラを開始できませんでした。ブラウザの権限を確認してください。')
      setIsCameraOn(false)
    }
  }, [])

  useEffect(() => {
    audioRef.current = new Audio('/bgm/江戸走り.wav')
    audioRef.current.loop = true
    audioRef.current.volume = 0.7

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

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

  useEffect(() => {
    if (inputMode !== 'camera' && isCameraOn) {
      stopCamera()
    }
  }, [inputMode, isCameraOn, stopCamera])

  useEffect(() => {
    const landmarker = poseLandmarkerRef.current
    if (!landmarker || modelStatus !== 'ready') {
      return
    }

    const desiredMode = inputMode === 'camera' ? 'VIDEO' : 'IMAGE'
    if (runningModeRef.current === desiredMode) {
      return
    }

    Promise.resolve(landmarker.setOptions({ runningMode: desiredMode })).then(
      () => {
        runningModeRef.current = desiredMode
      }
    )
  }, [inputMode, modelStatus])

  useEffect(() => {
    if (modelStatus !== 'ready') {
      return
    }

    let stopped = false

    const tick = () => {
      if (stopped) {
        return
      }

      const landmarker = poseLandmarkerRef.current
      if (!landmarker) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }

      const now = performance.now()
      let result: PoseResult | null = null
      let evaluation: PoseEvaluation | null = null

      if (inputMode === 'camera') {
        if (runningModeRef.current !== 'VIDEO') {
          rafRef.current = requestAnimationFrame(tick)
          return
        }
        const video = videoRef.current
        if (isCameraOn && video && video.readyState >= 2) {
          if (video.currentTime !== lastVideoTimeRef.current) {
            lastVideoTimeRef.current = video.currentTime
            result = landmarker.detectForVideo(video, now) as PoseResult
          }
        }
      } else {
        if (runningModeRef.current !== 'IMAGE') {
          rafRef.current = requestAnimationFrame(tick)
          return
        }
        const image = imageRef.current
        const isImageReady =
          !!image && image.complete && image.naturalWidth > 0 && image.naturalHeight > 0
        const imageKey = selectedImage ?? ''
        const shouldDetect =
          isImageReady &&
          (imageKey !== lastImageKeyRef.current || !lastEvaluationRef.current)
        if (shouldDetect && now - lastImageRunRef.current > 200) {
          lastImageRunRef.current = now
          lastImageKeyRef.current = imageKey
          result = landmarker.detect(image) as PoseResult
        }
        evaluation = lastEvaluationRef.current
      }

      let shouldUpdate = false
      if (result?.landmarks?.[0]) {
        // ボーン描画用は常に更新
        lastLandmarksRef.current = result.landmarks[0]
        evaluation = evaluatePose(result.landmarks[0])
        // 判定結果は有効な場合のみ更新
        if (evaluation.arms.left !== 'unknown') {
          lastEvaluationRef.current = evaluation
          shouldUpdate = true
        }
      }
      // resultがない場合も前回のlandmarksを保持（ボーンのチカチカ防止）

      // カメラモードは有効な結果がある時だけ更新（unknownはスキップ）
      if (evaluation && evaluation.arms.left !== 'unknown' && (shouldUpdate || inputMode !== 'camera')) {
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
  }, [inputMode, isCameraOn, modelStatus, updatePoseState])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    const stopFade = () => {
      if (fadeOutRef.current !== null) {
        cancelAnimationFrame(fadeOutRef.current)
        fadeOutRef.current = null
      }
    }

    if (poseStatus === 'detected') {
      stopFade()
      if (audio.paused) {
        audio.volume = 0.7
        audio
          .play()
          .catch(() =>
            setError('BGM を再生できませんでした。操作後に再度お試しください。')
          )
      }
      return
    }

    if (!audio.paused) {
      const start = performance.now()
      const startVolume = audio.volume

      const fade = () => {
        const elapsed = performance.now() - start
        const progress = Math.min(elapsed / 350, 1)
        audio.volume = Math.max(startVolume * (1 - progress), 0)

        if (progress < 1) {
          fadeOutRef.current = requestAnimationFrame(fade)
        } else {
          audio.pause()
          audio.currentTime = 0
          audio.volume = 0.7
          fadeOutRef.current = null
        }
      }

      fade()
    }
  }, [poseStatus])

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  const statusText = useMemo(() => {
    if (poseStatus === 'detected') {
      return '検出中'
    }
    if (poseStatus === 'holding') {
      return '判定中'
    }
    return '未検出'
  }, [poseStatus])

  const modelText = useMemo(() => {
    if (modelStatus === 'ready') {
      return 'モデル準備完了'
    }
    if (modelStatus === 'error') {
      return 'モデルエラー'
    }
    return 'モデル読み込み中'
  }, [modelStatus])

  const handleModeChange = (value: InputMode) => {
    setInputMode(value)
    resetPoseState()
    lastEvaluationRef.current = null
    lastImageKeyRef.current = null
    lastImageRunRef.current = 0
    lastLandmarksRef.current = null
  }

  const armText = `左:${rotationLabel(armsDetail.left)} / 右:${rotationLabel(
    armsDetail.right
  )}`

  const footText = `左:${rotationLabel(feetDetail.left)} / 右:${rotationLabel(
    feetDetail.right
  )}`

  const statusPillClass = poseStatus === 'detected'
    ? 'bg-accent/20 border-accent/40 text-[#6b2d1f]'
    : poseStatus === 'holding'
      ? 'bg-accent-cool/15 border-accent-cool/30 text-[#1f4c4d]'
      : 'bg-ink/5 border-ink/15'

  return (
    <div className="max-w-[1200px] mx-auto px-6 pt-8 pb-12 flex flex-col gap-6">
      <header className="grid gap-3 animate-fade-up">
        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[0.72rem] tracking-[0.18em] uppercase bg-accent-cool/15 text-[#1f4c4d] w-fit">
          江戸走り Pose
        </span>
        <h1 className="m-0 text-[clamp(2.1rem,3.6vw,3.6rem)]" style={{ fontFamily: 'var(--font-display)' }}>
          江戸走りポーズ検出
        </h1>
        <p className="m-0 max-w-[56ch] text-ink/70">
          MediaPipe Pose を使って江戸走りのフォームを解析。テスト画像かカメラ映像で、
          ポーズが 1 秒以上続いたら BGM を再生します。
        </p>
      </header>

      <main className="grid grid-cols-12 gap-5">
        <section className="col-span-12 lg:col-span-4 bg-[rgba(255,248,238,0.92)] border border-ink/15 rounded-[20px] p-5 shadow-panel backdrop-blur-[10px] relative overflow-hidden animate-rise grid gap-4 [animation-delay:0.1s]">
          <div className="text-xs uppercase tracking-[0.12em] text-ink/55 font-bold mb-3">
            入力と制御
          </div>
          <label className="grid gap-1.5 text-[0.9rem]">
            <span className="font-semibold text-ink/75">入力モード</span>
            <select
              value={inputMode}
              onChange={(event) =>
                handleModeChange(event.target.value as InputMode)
              }
              className="px-3 py-2.5 rounded-xl border border-ink/15 bg-[#fffaf4] text-[0.95rem] text-ink"
            >
              <option value="camera">カメラ</option>
              <option value="sample-edo">テスト: 江戸走り.png</option>
              <option value="sample-norun">テスト: 走ってない.png</option>
            </select>
          </label>

          {inputMode === 'camera' ? (
            <div className="flex flex-wrap gap-2.5 max-sm:flex-col">
              <button
                className="rounded-full px-4 py-2.5 border border-transparent font-semibold cursor-pointer transition-transform duration-200 bg-accent text-white shadow-[0_12px_20px_rgba(216,97,60,0.3)] hover:enabled:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                onClick={startCamera}
                disabled={modelStatus !== 'ready' || isCameraOn}
              >
                カメラ開始
              </button>
              <button
                className="rounded-full px-4 py-2.5 border border-ink/20 font-semibold cursor-pointer transition-transform duration-200 bg-ink/5 text-ink hover:enabled:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={stopCamera}
                disabled={!isCameraOn}
              >
                停止
              </button>
            </div>
          ) : (
            <div className="px-3 py-2.5 rounded-xl bg-accent-cool/10 border border-dashed border-accent-cool/25 text-[0.85rem] text-ink/70">
              画像入力モードではカメラは使用しません。
            </div>
          )}

          <div className={`flex items-center justify-between px-3 py-2 rounded-xl border font-semibold ${statusPillClass}`}>
            <span>{statusText}</span>
            <span className="text-xs font-medium text-ink/55">{modelText}</span>
          </div>

          <div className="w-full h-1.5 rounded-full bg-ink/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent to-accent-strong transition-[width] duration-200"
              style={{ width: `${Math.round(holdProgress * 100)}%` }}
            />
          </div>

          {error && (
            <div className="px-3 py-2.5 rounded-xl bg-accent/10 border border-accent/35 text-[#7c2b1e] text-[0.85rem]">
              {error}
            </div>
          )}
        </section>

        <section className="col-span-12 lg:col-span-5 bg-[rgba(255,248,238,0.92)] border border-ink/15 rounded-[20px] p-5 shadow-panel backdrop-blur-[10px] relative overflow-hidden animate-rise grid gap-3 [animation-delay:0.2s]">
          <div className="text-xs uppercase tracking-[0.12em] text-ink/55 font-bold mb-3">
            プレビュー
          </div>
          <div className="w-full rounded-2xl bg-[#1f1c19] overflow-hidden grid place-items-center relative">
            {inputMode === 'camera' ? (
              <video ref={videoRef} muted playsInline autoPlay className="w-full h-full object-cover" />
            ) : (
              <img ref={imageRef} src={selectedImage ?? ''} alt="テスト画像" className="w-full h-full object-cover" />
            )}
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
          </div>
          <div className="text-[0.85rem] text-ink/65">
            {inputMode === 'camera'
              ? isCameraOn
                ? 'カメラ映像を解析中'
                : 'カメラを開始してください'
              : `テスト画像: ${inputMode === 'sample-edo' ? '江戸走り' : '走ってない'}`}
          </div>
        </section>

        <section className="col-span-12 lg:col-span-3 bg-[rgba(255,248,238,0.92)] border border-ink/15 rounded-[20px] p-5 shadow-panel backdrop-blur-[10px] relative overflow-hidden animate-rise grid gap-4 [animation-delay:0.3s]">
          <div className="text-xs uppercase tracking-[0.12em] text-ink/55 font-bold mb-3">
            判定詳細
          </div>
          <div className="grid gap-2.5">
            <div className={`flex items-center justify-between px-3 py-2.5 rounded-xl border font-semibold ${checks.armsOpposed ? 'border-solid border-accent-cool/35 bg-accent-cool/10 text-[#1c4a4b]' : 'border-dashed border-ink/15 bg-ink/[0.03]'}`}>
              <div className="grid gap-1">
                <span>腕の回旋</span>
                <span className="text-xs font-medium text-ink/55">{armText}</span>
              </div>
              <span>{checks.armsOpposed ? 'OK' : '未'}</span>
            </div>
            <div className={`flex items-center justify-between px-3 py-2.5 rounded-xl border font-semibold ${checks.feetOpposed ? 'border-solid border-accent-cool/35 bg-accent-cool/10 text-[#1c4a4b]' : 'border-dashed border-ink/15 bg-ink/[0.03]'}`}>
              <div className="grid gap-1">
                <span>足の回旋</span>
                <span className="text-xs font-medium text-ink/55">{footText}</span>
              </div>
              <span>{checks.feetOpposed ? 'OK' : '未'}</span>
            </div>
            <div className={`flex items-center justify-between px-3 py-2.5 rounded-xl border font-semibold ${checks.kneesBent ? 'border-solid border-accent-cool/35 bg-accent-cool/10 text-[#1c4a4b]' : 'border-dashed border-ink/15 bg-ink/[0.03]'}`}>
              <span>膝の曲げ</span>
              <span>{checks.kneesBent ? 'OK' : '未'}</span>
            </div>
          </div>

          <div className="grid gap-1.5 text-[0.9rem] text-ink/70">
            <div>
              左膝: {angles.leftKnee ? `${Math.round(angles.leftKnee)}°` : '--'}
            </div>
            <div>
              右膝: {angles.rightKnee ? `${Math.round(angles.rightKnee)}°` : '--'}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
