import type { ArmDetail, ArmRotation, FootDetail, FootRotation, Landmark, PoseEvaluation } from '../types'
import {
  CROSS_THRESHOLD,
  DEFAULT_ANGLES,
  DEFAULT_ARMS,
  DEFAULT_CHECKS,
  DEFAULT_FEET,
  KNEE_ANGLE_MAX,
  MIN_VISIBILITY,
} from '../constants'

export const angle = (a: Landmark, b: Landmark, c: Landmark): number => {
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

// 2Dベクトルの外積（z成分のみ）
// a→b ベクトルと b→c ベクトルの外積
export const crossProduct2D = (a: Landmark, b: Landmark, c: Landmark): number => {
  const ab = { x: b.x - a.x, y: b.y - a.y }
  const bc = { x: c.x - b.x, y: c.y - b.y }
  return ab.x * bc.y - ab.y * bc.x
}

export const rotationLabel = (rotation: ArmRotation | FootRotation): string => {
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

export const evaluatePose = (landmarks: Landmark[]): PoseEvaluation => {
  const pick = (index: number): Landmark | null => {
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

  // 腕の前後判定（体の向きを考慮）
  // 体が右向き: 左肩のXが右肩のXより大きい
  const facingRight = leftShoulder.x > rightShoulder.x

  // 手首が肩より前にあるか後ろにあるかで判定
  // 右向き: X座標が大きい方が前
  // 左向き: X座標が小さい方が前
  const leftArmDiff = leftWrist.x - leftShoulder.x
  const rightArmDiff = rightWrist.x - rightShoulder.x

  const leftArmForward = facingRight ? leftArmDiff > CROSS_THRESHOLD : leftArmDiff < -CROSS_THRESHOLD
  const rightArmForward = facingRight ? rightArmDiff > CROSS_THRESHOLD : rightArmDiff < -CROSS_THRESHOLD

  const leftArmRotation: ArmRotation = leftArmForward ? 'external' : rightArmForward ? 'internal' : 'neutral'
  const rightArmRotation: ArmRotation = rightArmForward ? 'external' : leftArmForward ? 'internal' : 'neutral'

  // 腕が対向: 一方が前、もう一方が後ろ
  const armsOpposed = leftArmForward !== rightArmForward

  const leftKneeAngle = angle(leftHip, leftKnee, leftAnkle)
  const rightKneeAngle = angle(rightHip, rightKnee, rightAnkle)
  const kneesBent = leftKneeAngle < KNEE_ANGLE_MAX && rightKneeAngle < KNEE_ANGLE_MAX

  // 足の前後判定（体の向きを考慮）
  let leftFootDiff: number | null = null
  let rightFootDiff: number | null = null
  let leftFootRotation: FootRotation = 'unknown'
  let rightFootRotation: FootRotation = 'unknown'
  let feetOpposed = false

  if (leftFootIndex && rightFootIndex) {
    // 足指が腰より前にあるか後ろにあるかで判定
    leftFootDiff = leftFootIndex.x - leftHip.x
    rightFootDiff = rightFootIndex.x - rightHip.x

    const leftFootForward = facingRight ? leftFootDiff > CROSS_THRESHOLD : leftFootDiff < -CROSS_THRESHOLD
    const rightFootForward = facingRight ? rightFootDiff > CROSS_THRESHOLD : rightFootDiff < -CROSS_THRESHOLD

    leftFootRotation = leftFootForward ? 'external' : rightFootForward ? 'internal' : 'neutral'
    rightFootRotation = rightFootForward ? 'external' : leftFootForward ? 'internal' : 'neutral'

    // 足が対向: 一方が前、もう一方が後ろ
    feetOpposed = leftFootForward !== rightFootForward
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
      leftCross: leftArmDiff,
      rightCross: rightArmDiff,
    } as ArmDetail,
    feet: {
      left: leftFootRotation,
      right: rightFootRotation,
      leftCross: leftFootDiff,
      rightCross: rightFootDiff,
    } as FootDetail,
  }
}
