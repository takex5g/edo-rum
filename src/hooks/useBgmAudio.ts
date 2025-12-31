import { useEffect, useRef, useState } from 'react';
import type { PoseStatus } from '../types';

export type UseBgmAudioReturn = {
  audioError: string | null;
  enableAudio: () => Promise<void>;
};

export const useBgmAudio = (poseStatus: PoseStatus): UseBgmAudioReturn => {
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeOutRef = useRef<number | null>(null);
  const audioEnabledRef = useRef<boolean>(false);

  useEffect(() => {
    audioRef.current = new Audio(`${import.meta.env.BASE_URL}bgm/edo.wav`);
    audioRef.current.loop = true;
    audioRef.current.volume = 0.7;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    const stopFade = () => {
      if (fadeOutRef.current !== null) {
        cancelAnimationFrame(fadeOutRef.current);
        fadeOutRef.current = null;
      }
    };

    if (poseStatus === 'detected') {
      stopFade();
      if (audio.paused && audioEnabledRef.current) {
        audio.volume = 0.7;
        audio.play().catch(() => {
          // 音声が有効化されている場合のみエラーを表示
          if (audioEnabledRef.current) {
            setAudioError(
              'BGM を再生できませんでした。操作後に再度お試しください。'
            );
          }
        });
      }
      return;
    }

    if (!audio.paused) {
      const start = performance.now();
      const startVolume = audio.volume;

      const fade = () => {
        const elapsed = performance.now() - start;
        const progress = Math.min(elapsed / 350, 1);
        audio.volume = Math.max(startVolume * (1 - progress), 0);

        if (progress < 1) {
          fadeOutRef.current = requestAnimationFrame(fade);
        } else {
          audio.pause();
          audio.currentTime = 0;
          audio.volume = 0.7;
          fadeOutRef.current = null;
        }
      };

      fade();
    }
  }, [poseStatus]);

  const enableAudio = async () => {
    try {
      // 無音のWAVファイルを再生して、ユーザーの操作として記録
      // iOSでは、ユーザーの操作のコンテキスト内で実際に音声を再生する必要がある
      const silentAudio = new Audio(
        `${import.meta.env.BASE_URL}bgm/silent.wav`
      );
      silentAudio.volume = 1.0; // 最大音量で再生（無音なので問題なし）

      await silentAudio.play();

      // 再生が完了するまで待つ（100msの無音ファイル）
      await new Promise((resolve) => {
        silentAudio.onended = resolve;
        // 念のためタイムアウトも設定
        setTimeout(resolve, 200);
      });

      // メモリリークを防ぐために参照をクリア
      silentAudio.src = '';

      // 音声が有効化されたことを記録
      audioEnabledRef.current = true;

      // 既にポーズが検出されている場合は、すぐにBGMを再生
      if (poseStatus === 'detected' && audioRef.current?.paused) {
        audioRef.current.volume = 0.7;
        audioRef.current
          .play()
          .catch(() =>
            setAudioError(
              'BGM を再生できませんでした。操作後に再度お試しください。'
            )
          );
      }
    } catch (error) {
      // エラーは無視（既に有効化されている可能性がある）
      console.warn('Audio enable failed:', error);
      // エラーでも有効化フラグを立てる（既に有効化されている可能性があるため）
      audioEnabledRef.current = true;
    }
  };

  return { audioError, enableAudio };
};
