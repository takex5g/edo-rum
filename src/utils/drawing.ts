import type { Landmark } from '../types'
import { MIN_VISIBILITY, POSE_CONNECTIONS } from '../constants'

export type DrawPoseOverlayParams = {
  canvas: HTMLCanvasElement
  landmarks: Landmark[] | null
  displayWidth: number
  displayHeight: number
  sourceWidth: number
  sourceHeight: number
}

export const drawPoseOverlay = ({
  canvas,
  landmarks,
  displayWidth,
  displayHeight,
  sourceWidth,
  sourceHeight,
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
}
