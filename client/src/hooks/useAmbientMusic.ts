import { useCallback, useEffect, useRef, useState } from "react";

import { announcementQueue } from "@/services/announcementQueue";

const AMBIENT_PREFERENCE_KEY = "polo-bi-management-ambient-enabled";
const MANAGEMENT_BREAK_AUDIO_EVENT = "polo-bi:break-audio-change";
const AMBIENT_TRACK = "/music/ambient-winter-wind.mp3";
const AMBIENT_VOLUME = 0.06;
const DUCKED_VOLUME = 0.012;

const getInitialPreference = () => {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(AMBIENT_PREFERENCE_KEY) !== "false";
};

interface UseAmbientMusicOptions {
  soundEnabled: boolean;
  audioUnlocked: boolean;
}

export function useAmbientMusic({
  soundEnabled,
  audioUnlocked,
}: UseAmbientMusicOptions) {
  const [enabled, setEnabledState] = useState(getInitialPreference);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDucked, setIsDucked] = useState(false);
  const [breakAudioActive, setBreakAudioActive] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeFrameRef = useRef<number | null>(null);

  const setEnabled = useCallback((nextEnabled: boolean) => {
    setEnabledState(nextEnabled);
    window.localStorage.setItem(AMBIENT_PREFERENCE_KEY, String(nextEnabled));
  }, []);

  const fadeTo = useCallback((target: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (fadeFrameRef.current !== null) cancelAnimationFrame(fadeFrameRef.current);

    const step = () => {
      const difference = target - audio.volume;
      if (Math.abs(difference) < 0.002) {
        audio.volume = target;
        fadeFrameRef.current = null;
        return;
      }

      audio.volume = Math.max(0, Math.min(1, audio.volume + difference * 0.12));
      fadeFrameRef.current = requestAnimationFrame(step);
    };

    fadeFrameRef.current = requestAnimationFrame(step);
  }, []);

  useEffect(() => announcementQueue.subscribe((snapshot) => {
    setIsDucked(snapshot.isBusy);
  }), []);

  useEffect(() => {
    let resumeTimer: ReturnType<typeof setTimeout> | null = null;
    const handleBreakAudio = (event: Event) => {
      const active = (event as CustomEvent<{ active?: boolean }>).detail?.active === true;
      if (resumeTimer) clearTimeout(resumeTimer);

      if (active) {
        setBreakAudioActive(true);
        return;
      }

      // A trilha retorna somente depois do fade-out da música da pausa.
      resumeTimer = setTimeout(() => setBreakAudioActive(false), 1_200);
    };

    window.addEventListener(MANAGEMENT_BREAK_AUDIO_EVENT, handleBreakAudio);
    return () => {
      if (resumeTimer) clearTimeout(resumeTimer);
      window.removeEventListener(MANAGEMENT_BREAK_AUDIO_EVENT, handleBreakAudio);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) fadeTo(isDucked ? DUCKED_VOLUME : AMBIENT_VOLUME);
  }, [fadeTo, isDucked]);

  useEffect(() => {
    const canPlay =
      enabled &&
      soundEnabled &&
      audioUnlocked &&
      !breakAudioActive &&
      document.visibilityState === "visible";

    let audio = audioRef.current;
    if (!canPlay) {
      audio?.pause();
      setIsPlaying(false);
      return;
    }

    if (!audio) {
      audio = new Audio(AMBIENT_TRACK);
      audio.loop = true;
      audio.preload = "auto";
      audio.volume = isDucked ? DUCKED_VOLUME : AMBIENT_VOLUME;
      audio.addEventListener("play", () => setIsPlaying(true));
      audio.addEventListener("pause", () => setIsPlaying(false));
      audioRef.current = audio;
    }

    void audio.play().catch(() => setIsPlaying(false));
  }, [audioUnlocked, breakAudioActive, enabled, isDucked, soundEnabled]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const audio = audioRef.current;
      if (!audio) return;

      if (document.visibilityState !== "visible") {
        audio.pause();
        return;
      }

      if (enabled && soundEnabled && audioUnlocked && !breakAudioActive) {
        void audio.play().catch(() => setIsPlaying(false));
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [audioUnlocked, breakAudioActive, enabled, soundEnabled]);

  useEffect(() => () => {
    if (fadeFrameRef.current !== null) cancelAnimationFrame(fadeFrameRef.current);
    const audio = audioRef.current;
    audioRef.current = null;
    if (!audio) return;
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
  }, []);

  return {
    enabled,
    isPlaying,
    isDucked,
    setEnabled,
  };
}
