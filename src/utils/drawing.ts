import type { Landmark, PoseEvaluation } from '../types'
import { KNEE_ANGLE_MAX, MIN_VISIBILITY, POSE_CONNECTIONS } from '../constants'

export type DrawPoseOverlayParams = {
  canvas: HTMLCanvasElement
  landmarks: Landmark[] | null
  displayWidth: number
  displayHeight: number
  sourceWidth: number
  sourceHeight: number
  evaluation: PoseEvaluation | null
}

// カラーパレット
const COLORS = {
  ok: '#22c55e',
  okGlow: 'rgba(34, 197, 94, 0.4)',
  ng: '#ef4444',
  ngGlow: 'rgba(239, 68, 68, 0.4)',
  bone: '#1a1a1a',
  boneGlow: 'rgba(26, 26, 26, 0.3)',
  joint: '#1a1a1a',
  jointRing: 'rgba(26, 26, 26, 0.2)',
  text: '#1a1a1a',
  textBg: 'rgba(255, 255, 255, 0.9)',
}

// 角度を円弧で描画
const drawAngleArc = (
  ctx: CanvasRenderingContext2D,
  center: { x: number; y: number },
  hip: { x: number; y: number },
  ankle: { x: number; y: number },
  angle: number,
  isOk: boolean
): void => {
  const radius = 28
  const color = isOk ? COLORS.ok : COLORS.ng
  const glowColor = isOk ? COLORS.okGlow : COLORS.ngGlow

  // 角度を計算（膝を中心として）
  const startAngle = Math.atan2(hip.y - center.y, hip.x - center.x)
  const endAngle = Math.atan2(ankle.y - center.y, ankle.x - center.x)

  // グロー効果
  ctx.save()
  ctx.shadowColor = glowColor
  ctx.shadowBlur = 8

  // 円弧の背景（薄い扇形）
  ctx.beginPath()
  ctx.moveTo(center.x, center.y)
  ctx.arc(center.x, center.y, radius, startAngle, endAngle, false)
  ctx.closePath()
  ctx.fillStyle = glowColor
  ctx.fill()

  // 円弧の線
  ctx.beginPath()
  ctx.arc(center.x, center.y, radius, startAngle, endAngle, false)
  ctx.strokeStyle = color
  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'
  ctx.stroke()

  ctx.restore()

  // 角度テキスト（円弧の外側）
  const midAngle = (startAngle + endAngle) / 2
  const textRadius = radius + 18
  const textX = center.x + Math.cos(midAngle) * textRadius
  const textY = center.y + Math.sin(midAngle) * textRadius

  // テキスト背景
  const text = `${Math.round(angle)}°`
  ctx.font = 'bold 11px system-ui, sans-serif'
  const metrics = ctx.measureText(text)
  const padding = 4
  const bgWidth = metrics.width + padding * 2
  const bgHeight = 16

  ctx.fillStyle = COLORS.textBg
  ctx.beginPath()
  ctx.roundRect(textX - bgWidth / 2, textY - bgHeight / 2, bgWidth, bgHeight, 3)
  ctx.fill()

  // テキスト
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, textX, textY)
}

// 回転ラベルを取得
const getRotationLabel = (rotation: 'internal' | 'external' | 'neutral' | 'unknown'): string => {
  switch (rotation) {
    case 'internal': return '内旋'
    case 'external': return '外旋'
    case 'neutral': return '中立'
    default: return ''
  }
}

// 回転ラベル（テキスト表示）
const drawRotationLabel = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rotation: 'internal' | 'external' | 'neutral' | 'unknown',
  isOk: boolean,
  offsetY: number = -25
): void => {
  if (rotation === 'unknown') return

  const text = getRotationLabel(rotation)
  const centerY = y + offsetY
  const color = isOk ? COLORS.ok : COLORS.ng
  const glowColor = isOk ? COLORS.okGlow : COLORS.ngGlow

  ctx.font = 'bold 11px system-ui, sans-serif'
  const metrics = ctx.measureText(text)
  const padding = 6
  const bgWidth = metrics.width + padding * 2
  const bgHeight = 18

  // グロー効果
  ctx.save()
  ctx.shadowColor = glowColor
  ctx.shadowBlur = 6

  // 背景（角丸）
  ctx.fillStyle = COLORS.textBg
  ctx.beginPath()
  ctx.roundRect(x - bgWidth / 2, centerY - bgHeight / 2, bgWidth, bgHeight, 4)
  ctx.fill()

  // 枠線
  ctx.strokeStyle = color
  ctx.lineWidth = 1.5
  ctx.stroke()

  ctx.restore()

  // テキスト
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x, centerY)
}

// 前後判定を矢印で描画（基準点から対象点への水平方向）
const drawDirectionArrow = (
  ctx: CanvasRenderingContext2D,
  base: { x: number; y: number },
  target: { x: number; y: number },
  rotation: 'internal' | 'external' | 'neutral' | 'unknown',
  isOk: boolean
): void => {
  if (rotation === 'unknown' || rotation === 'neutral') return

  const color = isOk ? COLORS.ok : COLORS.ng
  const glowColor = isOk ? COLORS.okGlow : COLORS.ngGlow

  // 矢印の長さと位置
  const arrowLength = 30
  const arrowHeadSize = 8
  const direction = target.x > base.x ? 1 : -1

  // 矢印の始点（基準点の少し横）
  const startX = base.x + direction * 15
  const startY = base.y
  const endX = startX + direction * arrowLength
  const endY = startY

  ctx.save()
  ctx.shadowColor = glowColor
  ctx.shadowBlur = 6
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'

  // 矢印の軸
  ctx.beginPath()
  ctx.moveTo(startX, startY)
  ctx.lineTo(endX, endY)
  ctx.stroke()

  // 矢印の先端
  ctx.beginPath()
  ctx.moveTo(endX, endY)
  ctx.lineTo(endX - direction * arrowHeadSize, endY - arrowHeadSize / 2)
  ctx.lineTo(endX - direction * arrowHeadSize, endY + arrowHeadSize / 2)
  ctx.closePath()
  ctx.fill()

  ctx.restore()
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

  const ctx = canvas.getContext('2d')
  if (!ctx) {
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

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, displayWidth, displayHeight)

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

  // ボーン描画（グロー効果付き）
  ctx.save()
  ctx.shadowColor = COLORS.boneGlow
  ctx.shadowBlur = 4
  ctx.lineWidth = 2.5
  ctx.strokeStyle = COLORS.bone
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  for (const [start, end] of POSE_CONNECTIONS) {
    const startPoint = landmarks[start]
    const endPoint = landmarks[end]
    if (!startPoint || !endPoint) continue
    if (
      (startPoint.visibility !== undefined && startPoint.visibility < MIN_VISIBILITY) ||
      (endPoint.visibility !== undefined && endPoint.visibility < MIN_VISIBILITY)
    ) continue

    const from = toCanvas(startPoint)
    const to = toCanvas(endPoint)

    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(to.x, to.y)
    ctx.stroke()
  }
  ctx.restore()

  // 関節点描画（リング状＋グロー）
  for (const point of landmarks) {
    if (point.visibility !== undefined && point.visibility < MIN_VISIBILITY) continue

    const { x, y } = toCanvas(point)

    // 外側リング
    ctx.beginPath()
    ctx.arc(x, y, 5, 0, Math.PI * 2)
    ctx.fillStyle = COLORS.jointRing
    ctx.fill()

    // 内側ドット
    ctx.beginPath()
    ctx.arc(x, y, 2.5, 0, Math.PI * 2)
    ctx.fillStyle = COLORS.joint
    ctx.fill()
  }

  // 評価情報の描画
  if (!evaluation) return

  const { checks, angles, arms, feet } = evaluation

  // 膝の角度（円弧で表示）
  const leftHip = landmarks[23]
  const leftKnee = landmarks[25]
  const leftAnkle = landmarks[27]
  const rightHip = landmarks[24]
  const rightKnee = landmarks[26]
  const rightAnkle = landmarks[28]

  if (leftHip && leftKnee && leftAnkle && angles.leftKnee !== null) {
    const hipPos = toCanvas(leftHip)
    const kneePos = toCanvas(leftKnee)
    const anklePos = toCanvas(leftAnkle)
    const isOk = angles.leftKnee < KNEE_ANGLE_MAX
    drawAngleArc(ctx, kneePos, hipPos, anklePos, angles.leftKnee, isOk)
  }

  if (rightHip && rightKnee && rightAnkle && angles.rightKnee !== null) {
    const hipPos = toCanvas(rightHip)
    const kneePos = toCanvas(rightKnee)
    const anklePos = toCanvas(rightAnkle)
    const isOk = angles.rightKnee < KNEE_ANGLE_MAX
    drawAngleArc(ctx, kneePos, hipPos, anklePos, angles.rightKnee, isOk)
  }

  // 腕の前後判定（肩から手首への矢印）
  const leftShoulder = landmarks[11]
  const rightShoulder = landmarks[12]
  const leftWrist = landmarks[15]
  const rightWrist = landmarks[16]

  if (leftShoulder && leftWrist && arms.left !== 'unknown') {
    const shoulderPos = toCanvas(leftShoulder)
    const wristPos = toCanvas(leftWrist)
    drawDirectionArrow(ctx, shoulderPos, wristPos, arms.left, checks.armsOpposed)
    drawRotationLabel(ctx, wristPos.x, wristPos.y, arms.left, checks.armsOpposed)
  }

  if (rightShoulder && rightWrist && arms.right !== 'unknown') {
    const shoulderPos = toCanvas(rightShoulder)
    const wristPos = toCanvas(rightWrist)
    drawDirectionArrow(ctx, shoulderPos, wristPos, arms.right, checks.armsOpposed)
    drawRotationLabel(ctx, wristPos.x, wristPos.y, arms.right, checks.armsOpposed)
  }

  // 足の前後判定（腰から足指への矢印）
  const leftFoot = landmarks[31]
  const rightFoot = landmarks[32]

  if (leftHip && leftFoot && feet.left !== 'unknown') {
    const hipPos = toCanvas(leftHip)
    const footPos = toCanvas(leftFoot)
    drawDirectionArrow(ctx, hipPos, footPos, feet.left, checks.feetOpposed)
    drawRotationLabel(ctx, footPos.x, footPos.y, feet.left, checks.feetOpposed, -20)
  }

  if (rightHip && rightFoot && feet.right !== 'unknown') {
    const hipPos = toCanvas(rightHip)
    const footPos = toCanvas(rightFoot)
    drawDirectionArrow(ctx, hipPos, footPos, feet.right, checks.feetOpposed)
    drawRotationLabel(ctx, footPos.x, footPos.y, feet.right, checks.feetOpposed, -20)
  }
}
