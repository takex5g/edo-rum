import type { Landmark, PoseEvaluation } from '../types'
import { KNEE_ANGLE_MAX, MIN_VISIBILITY, POSE_CONNECTIONS } from '../constants'
import { rotationLabel } from './pose'

export type DrawPoseOverlayParams = {
  canvas: HTMLCanvasElement
  landmarks: Landmark[] | null
  displayWidth: number
  displayHeight: number
  sourceWidth: number
  sourceHeight: number
  evaluation: PoseEvaluation | null
}

const drawLabel = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  isOk: boolean,
  offsetY: number = -20
): void => {
  const color = isOk ? '#22c55e' : '#ef4444'
  ctx.font = 'bold 12px sans-serif'
  ctx.textAlign = 'center'
  ctx.lineWidth = 3
  ctx.strokeStyle = 'white'
  ctx.strokeText(text, x, y + offsetY)
  ctx.fillStyle = color
  ctx.fillText(text, x, y + offsetY)
}

export const drawPoseOverlay = ({
  canvas,
  landmarks,
  displayWidth,
  displayHeight,
  sourceWidth,
  sourceHeight,
  evaluation,
}: DrawPoseOverlayParams): void => {
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
      (startPoint.visibility !== undefined && startPoint.visibility < MIN_VISIBILITY) ||
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

  // ラベル描画
  if (!evaluation) {
    return
  }

  const { checks, angles, arms, feet } = evaluation

  // 膝の角度
  const leftKnee = landmarks[25]
  const rightKnee = landmarks[26]
  if (leftKnee && angles.leftKnee !== null) {
    const pos = toCanvas(leftKnee)
    const isOk = angles.leftKnee < KNEE_ANGLE_MAX
    drawLabel(context, `${Math.round(angles.leftKnee)}°`, pos.x, pos.y, isOk)
  }
  if (rightKnee && angles.rightKnee !== null) {
    const pos = toCanvas(rightKnee)
    const isOk = angles.rightKnee < KNEE_ANGLE_MAX
    drawLabel(context, `${Math.round(angles.rightKnee)}°`, pos.x, pos.y, isOk)
  }

  // 腕の回転
  const leftWrist = landmarks[15]
  const rightWrist = landmarks[16]
  if (leftWrist && arms.left !== 'unknown') {
    const pos = toCanvas(leftWrist)
    drawLabel(context, rotationLabel(arms.left), pos.x, pos.y, checks.armsOpposed)
  }
  if (rightWrist && arms.right !== 'unknown') {
    const pos = toCanvas(rightWrist)
    drawLabel(context, rotationLabel(arms.right), pos.x, pos.y, checks.armsOpposed)
  }

  // 足の回転
  const leftFoot = landmarks[31]
  const rightFoot = landmarks[32]
  if (leftFoot && feet.left !== 'unknown') {
    const pos = toCanvas(leftFoot)
    drawLabel(context, rotationLabel(feet.left), pos.x, pos.y, checks.feetOpposed, -15)
  }
  if (rightFoot && feet.right !== 'unknown') {
    const pos = toCanvas(rightFoot)
    drawLabel(context, rotationLabel(feet.right), pos.x, pos.y, checks.feetOpposed, -15)
  }
}
