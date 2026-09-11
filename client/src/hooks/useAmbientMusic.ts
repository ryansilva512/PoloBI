import { useCallback, useEffect, useRef, useState } from "react";

const AMBIENT_PREFERENCE_KEY = "polo-bi-management-ambient-enabled";
const MANAGEMENT_BREAK_AUDIO_EVENT = "polo-bi:break-audio-change";
export const AMBIENT_VOLUME = 0.16;

export const AMBIENT_TRACKS = [
  "/music/ambient/01-drawbar.mp3",
  "/music/ambient/02-session.mp3",
  "/music/ambient/03-tinfoil.mp3",
  "/music/ambient/04-wake.mp3",
  "/music/ambient/05-jornada-del-muerto.mp3",
] as const;

export const getNextAmbientTrackIndex = (currentIndex: number): number =>
  (currentIndex + 1) % AMBIENT_TRACKS.length;

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
  const [breakAudioActive, setBreakAudioActive] = useState(false);
  const [pageVisible, setPageVisible] = useState(
    () => typeof document === "undefined" || document.visibilityState === "visible",
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentTrackIndexRef = useRef(0);
  const consecutiveFailuresRef = useRef(0);
  const canPlayRef = useRef(false);

  const playIfAllowed = useCallback((audio: HTMLAudioElement) => {
    if (!canPlayRef.current) return;
    void audio.play().catch(() => setIsPlaying(false));
  }, []);

  const loadTrack = useCallback((audio: HTMLAudioElement, trackIndex: number) => {
    currentTrackIndexRef.current = trackIndex;
    audio.src = AMBIENT_TRACKS[trackIndex];
    audio.load();
    playIfAllowed(audio);
  }, [playIfAllowed]);

  const setEnabled = useCallback((nextEnabled: boolean) => {
    setEnabledState(nextEnabled);
    window.localStorage.setItem(AMBIENT_PREFERENCE_KEY, String(nextEnabled));
  }, []);

  useEffect(() => {
    const audio = new Audio(AMBIENT_TRACKS[0]);
    audio.loop = false;
    audio.preload = "auto";
    audio.volume = AMBIENT_VOLUME;

    const handlePlay = () => {
      consecutiveFailuresRef.current = 0;
      setIsPlaying(true);
    };
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      consecutiveFailuresRef.current = 0;
      loadTrack(audio, getNextAmbientTrackIndex(currentTrackIndexRef.current));
    };
    const handleError = () => {
      consecutiveFailuresRef.current += 1;

      // Impede um ciclo infinito caso todos os arquivos estejam indisponíveis.
      if (consecutiveFailuresRef.current >= AMBIENT_TRACKS.length) {
        audio.pause();
        setIsPlaying(false);
        return;
      }

      loadTrack(audio, getNextAmbientTrackIndex(currentTrackIndexRef.current));
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);
    audioRef.current = audio;

    return () => {
      audioRef.current = null;
      audio.pause();
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.removeAttribute("src");
      audio.load();
    };
  }, [loadTrack]);

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
    const canPlay =
      enabled &&
      soundEnabled &&
      audioUnlocked &&
      !breakAudioActive &&
      pageVisible;

    const wasAllowed = canPlayRef.current;
    canPlayRef.current = canPlay;
    const audio = audioRef.current;
    if (!canPlay) {
      audio?.pause();
      setIsPlaying(false);
      return;
    }

    if (!wasAllowed) consecutiveFailuresRef.current = 0;
    if (audio) playIfAllowed(audio);
  }, [audioUnlocked, breakAudioActive, enabled, pageVisible, playIfAllowed, soundEnabled]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setPageVisible(document.visibilityState === "visible");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  return {
    enabled,
    isPlaying,
    setEnabled,
  };
}
