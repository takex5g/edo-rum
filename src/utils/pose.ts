import type { ArmDetail, ArmRotation, FootDetail, FootRotation, Landmark, PoseEvaluation } from '../types'
import {
  DEFAULT_ANGLES,
  DEFAULT_ARMS,
  DEFAULT_CHECKS,
  DEFAULT_FEET,
  KNEE_ANGLE_MAX,
  MIN_VISIBILITY,
  Z_DIFF_THRESHOLD,
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

  const armZDiff = rightWrist.z - leftWrist.z
  const leftExternal = armZDiff > Z_DIFF_THRESHOLD
  const rightInternal = armZDiff > Z_DIFF_THRESHOLD
  const armsOpposed = leftExternal && rightInternal

  console.log('--- evaluatePose ---')
  console.log('leftWrist.z:', leftWrist.z, 'rightWrist.z:', rightWrist.z)
  console.log('armZDiff:', armZDiff, 'threshold:', Z_DIFF_THRESHOLD)
  console.log('leftExternal:', leftExternal, 'rightInternal:', rightInternal)

  const leftArmRotation: ArmRotation =
    leftWrist.z < rightWrist.z - Z_DIFF_THRESHOLD
      ? 'external'
      : leftWrist.z > rightWrist.z + Z_DIFF_THRESHOLD
        ? 'internal'
        : 'neutral'
  const rightArmRotation: ArmRotation =
    rightWrist.z > leftWrist.z + Z_DIFF_THRESHOLD
      ? 'internal'
      : rightWrist.z < leftWrist.z - Z_DIFF_THRESHOLD
        ? 'external'
        : 'neutral'

  const leftKneeAngle = angle(leftHip, leftKnee, leftAnkle)
  const rightKneeAngle = angle(rightHip, rightKnee, rightAnkle)
  const kneesBent = leftKneeAngle < KNEE_ANGLE_MAX && rightKneeAngle < KNEE_ANGLE_MAX

  let leftFootZ: number | null = null
  let rightFootZ: number | null = null
  let leftFootRotation: FootRotation = 'unknown'
  let rightFootRotation: FootRotation = 'unknown'
  let feetOpposed = false

  if (leftFootIndex && rightFootIndex) {
    leftFootZ = leftFootIndex.z
    rightFootZ = rightFootIndex.z

    const footZDiff = leftFootZ - rightFootZ
    const leftExternal_foot = footZDiff > Z_DIFF_THRESHOLD
    const rightInternal_foot = footZDiff > Z_DIFF_THRESHOLD

    console.log('leftFootZ:', leftFootZ, 'rightFootZ:', rightFootZ)
    console.log('footZDiff:', footZDiff)
    console.log('leftExternal_foot:', leftExternal_foot, 'rightInternal_foot:', rightInternal_foot)

    leftFootRotation =
      leftFootZ > rightFootZ + Z_DIFF_THRESHOLD
        ? 'external'
        : leftFootZ < rightFootZ - Z_DIFF_THRESHOLD
          ? 'internal'
          : 'neutral'
    rightFootRotation =
      rightFootZ < leftFootZ - Z_DIFF_THRESHOLD
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
    } as ArmDetail,
    feet: {
      left: leftFootRotation,
      right: rightFootRotation,
      leftZ: leftFootZ,
      rightZ: rightFootZ,
    } as FootDetail,
  }
}
