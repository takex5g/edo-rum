import { useEffect, useRef, useState } from 'react'
import type { PoseStatus } from '../types'

export type UseBgmAudioReturn = {
  audioError: string | null
}

export const useBgmAudio = (poseStatus: PoseStatus): UseBgmAudioReturn => {
  const [audioError, setAudioError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fadeOutRef = useRef<number | null>(null)

  useEffect(() => {
    audioRef.current = new Audio(`${import.meta.env.BASE_URL}bgm/edo.wav`)
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
          .catch(() => setAudioError('BGM を再生できませんでした。操作後に再度お試しください。'))
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

  return { audioError }
}
