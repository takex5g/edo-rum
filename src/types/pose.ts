export type InputMode = 'camera'

export type PoseStatus = 'idle' | 'holding' | 'detected'

export type ModelStatus = 'loading' | 'ready' | 'error'

export type PoseChecks = {
  armsOpposed: boolean
  feetOpposed: boolean
  kneesBent: boolean
}

export type PoseAngles = {
  leftKnee: number | null
  rightKnee: number | null
}

export type ArmRotation = 'internal' | 'external' | 'neutral' | 'unknown'

export type ArmDetail = {
  left: ArmRotation
  right: ArmRotation
  leftCross: number | null
  rightCross: number | null
}

export type FootRotation = 'internal' | 'external' | 'neutral' | 'unknown'

export type FootDetail = {
  left: FootRotation
  right: FootRotation
  leftCross: number | null
  rightCross: number | null
}

export type Landmark = {
  x: number
  y: number
  z: number
  visibility?: number
}

export type PoseResult = {
  landmarks: Landmark[][]
}

export type PoseEvaluation = {
  match: boolean
  checks: PoseChecks
  angles: PoseAngles
  arms: ArmDetail
  feet: FootDetail
}
