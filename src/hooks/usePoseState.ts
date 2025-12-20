import { useCallback, useRef, useState } from 'react'
import type { ArmDetail, FootDetail, PoseAngles, PoseChecks, PoseStatus } from '../types'
import { DEFAULT_ANGLES, DEFAULT_ARMS, DEFAULT_CHECKS, DEFAULT_FEET, HOLD_MS } from '../constants'

export type UsePoseStateReturn = {
  poseStatus: PoseStatus
  holdProgress: number
  checks: PoseChecks
  angles: PoseAngles
  armsDetail: ArmDetail
  feetDetail: FootDetail
  updatePoseState: (
    match: boolean,
    nextChecks: PoseChecks,
    nextAngles: PoseAngles,
    nextArms: ArmDetail,
    nextFeet: FootDetail,
    now: number
  ) => void
  resetPoseState: () => void
}

export const usePoseState = (): UsePoseStateReturn => {
  const [poseStatus, setPoseStatus] = useState<PoseStatus>('idle')
  const [holdProgress, setHoldProgress] = useState(0)
  const [checks, setChecks] = useState<PoseChecks>(DEFAULT_CHECKS)
  const [angles, setAngles] = useState<PoseAngles>(DEFAULT_ANGLES)
  const [armsDetail, setArmsDetail] = useState<ArmDetail>(DEFAULT_ARMS)
  const [feetDetail, setFeetDetail] = useState<FootDetail>(DEFAULT_FEET)

  const holdStartRef = useRef<number | null>(null)

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

  return {
    poseStatus,
    holdProgress,
    checks,
    angles,
    armsDetail,
    feetDetail,
    updatePoseState,
    resetPoseState,
  }
}
