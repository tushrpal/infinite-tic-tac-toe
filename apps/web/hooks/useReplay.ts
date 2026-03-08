'use client';

/**
 * useReplay Hook
 * Manages replay playback state
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Move, GameState, GameMode, Player } from '@/ws/types';
import { generateReplayFrames, type ReplayFrame } from '@/lib/adapters/gameAdapter';

interface ReplayData {
  matchId: string;
  mode: GameMode;
  boardSize: number;
  moveHistory: Move[];
  players: {
    X: { username: string; rating?: number };
    O: { username: string; rating?: number };
  };
  winner: Player | null;
  isDraw: boolean;
  duration: number;
  playedAt: number;
}

interface UseReplayOptions {
  replayData: ReplayData;
  autoPlay?: boolean;
  playbackSpeed?: number; // Moves per second
}

interface UseReplayReturn {
  currentFrame: ReplayFrame;
  frameIndex: number;
  totalFrames: number;
  isPlaying: boolean;
  playbackSpeed: number;
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  goToFrame: (index: number) => void;
  nextFrame: () => void;
  prevFrame: () => void;
  goToStart: () => void;
  goToEnd: () => void;
  setPlaybackSpeed: (speed: number) => void;
  progress: number; // 0-100
}

const DEFAULT_PLAYBACK_SPEED = 1; // 1 move per second

export function useReplay(options: UseReplayOptions): UseReplayReturn {
  const { replayData, autoPlay = false, playbackSpeed: initialSpeed = DEFAULT_PLAYBACK_SPEED } = options;

  // Generate frames
  const frames = useRef<ReplayFrame[]>(
    generateReplayFrames(replayData.boardSize, replayData.mode, replayData.moveHistory)
  );

  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [playbackSpeed, setPlaybackSpeedState] = useState(initialSpeed);
  
  const playbackTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Playback logic
  useEffect(() => {
    if (isPlaying) {
      const intervalMs = 1000 / playbackSpeed;
      
      playbackTimerRef.current = setInterval(() => {
        setFrameIndex((prev) => {
          if (prev >= frames.current.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, intervalMs);
    } else {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
        playbackTimerRef.current = null;
      }
    }

    return () => {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
      }
    };
  }, [isPlaying, playbackSpeed]);

  // Update frames when replay data changes
  useEffect(() => {
    frames.current = generateReplayFrames(
      replayData.boardSize,
      replayData.mode,
      replayData.moveHistory
    );
    setFrameIndex(0);
    setIsPlaying(autoPlay);
  }, [replayData, autoPlay]);

  // Actions
  const play = useCallback(() => {
    if (frameIndex >= frames.current.length - 1) {
      setFrameIndex(0);
    }
    setIsPlaying(true);
  }, [frameIndex]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const goToFrame = useCallback((index: number) => {
    const clampedIndex = Math.max(0, Math.min(index, frames.current.length - 1));
    setFrameIndex(clampedIndex);
  }, []);

  const nextFrame = useCallback(() => {
    goToFrame(frameIndex + 1);
  }, [frameIndex, goToFrame]);

  const prevFrame = useCallback(() => {
    goToFrame(frameIndex - 1);
  }, [frameIndex, goToFrame]);

  const goToStart = useCallback(() => {
    setFrameIndex(0);
    setIsPlaying(false);
  }, []);

  const goToEnd = useCallback(() => {
    setFrameIndex(frames.current.length - 1);
    setIsPlaying(false);
  }, []);

  const setPlaybackSpeed = useCallback((speed: number) => {
    setPlaybackSpeedState(Math.max(0.25, Math.min(4, speed)));
  }, []);

  // Computed values
  const currentFrame = frames.current[frameIndex] ?? frames.current[0];
  const totalFrames = frames.current.length;
  const progress = totalFrames > 1 ? (frameIndex / (totalFrames - 1)) * 100 : 0;

  return {
    currentFrame,
    frameIndex,
    totalFrames,
    isPlaying,
    playbackSpeed,
    play,
    pause,
    togglePlayPause,
    goToFrame,
    nextFrame,
    prevFrame,
    goToStart,
    goToEnd,
    setPlaybackSpeed,
    progress,
  };
}

export default useReplay;
