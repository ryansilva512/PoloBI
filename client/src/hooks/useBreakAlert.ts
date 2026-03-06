import { useEffect, useRef, useCallback, useState } from 'react';

// Horários de alerta (HH:MM)
const BREAK_TIMES = [
    '08:30', '09:30', '10:30', '11:30', '12:30',
    '13:30', '14:30', '15:30', '16:30', '17:30',
];

const BREAK_DURATION_MS = 120_000; // 2 minutos de pausa

// Lista de músicas disponíveis (mp3 primeiro, mpeg como fallback)
// IMPORTANTE: nomes de arquivo devem ser URL-safe (sem espaços, apóstrofos, etc.)
const MUSIC_SONGS = [
    { name: "Guns N' Roses - Sweet Child O' Mine", paths: ['/music/guns-n-roses-sweet-child-o-mine.mp3', '/music/guns-n-roses-sweet-child-o-mine.mpeg'] },
    { name: "Guns N' Roses - Welcome to the Jungle", paths: ['/music/guns-n-roses-welcome-to-the-jungle.mp3', '/music/guns-n-roses-welcome-to-the-jungle.mpeg'] },
    { name: 'Linkin Park - Somewhere I Belong', paths: ['/music/linkin-park-somewhere-i-belong.mp3', '/music/linkin-park-somewhere-i-belong.mpeg'] },
    { name: 'Linkin Park - Faint', paths: ['/music/linkin-park-faint.mp3', '/music/linkin-park-faint.mpeg'] },
    { name: 'Linkin Park - The Emptiness Machine', paths: ['/music/linkin-park-the-emptiness-machine.mp3', '/music/linkin-park-the-emptiness-machine.mpeg'] },
    { name: 'System of a Down - B.Y.O.B', paths: ['/music/system-of-a-down-byob.mp3', '/music/system-of-a-down-byob.mpeg'] },
    { name: 'System of a Down - Sugar', paths: ['/music/system-of-a-down-sugar.mp3', '/music/system-of-a-down-sugar.mpeg'] },
    { name: 'Iron Maiden - The Trooper', paths: ['/music/iron-maiden-the-trooper.mp3', '/music/iron-maiden-the-trooper.mpeg'] },
    { name: 'Limp Bizkit - Break Stuff', paths: ['/music/limp-bizkit-break-stuff.mp3', '/music/limp-bizkit-break-stuff.mpeg'] },
    { name: 'Skillet - Hero', paths: ['/music/skillet-hero.mp3', '/music/skillet-hero.mpeg'] },
];

type BreakPhase = 'idle' | 'break' | 'return';

export function useBreakAlert() {
    const [phase, setPhase] = useState<BreakPhase>('idle');
    const [enabled, setEnabled] = useState<boolean>(() => {
        const stored = localStorage.getItem('break-alert-enabled');
        return stored !== null ? stored === 'true' : true;
    });
    const [secondsLeft, setSecondsLeft] = useState(0);
    const [currentSong, setCurrentSong] = useState('');

    const audioElementsRef = useRef<HTMLAudioElement[]>([]);
    const activeAudioRef = useRef<HTMLAudioElement | null>(null);
    const breakTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const lastTriggeredRef = useRef<string>('');
    const musicStartedRef = useRef(false);

    // Persistir preferência
    useEffect(() => {
        localStorage.setItem('break-alert-enabled', String(enabled));
    }, [enabled]);

    // Pré-carregar todas as músicas ao montar
    useEffect(() => {
        const initAllAudio = async () => {
            const loaded: HTMLAudioElement[] = [];

            for (const song of MUSIC_SONGS) {
                for (const path of song.paths) {
                    try {
                        const audio = new Audio(path);
                        audio.loop = true;
                        audio.volume = 0.5;
                        audio.preload = 'auto';
                        audio.dataset.songName = song.name;

                        await new Promise<void>((resolve, reject) => {
                            audio.addEventListener('canplaythrough', () => {
                                console.log(`🎵 Música carregada: "${song.name}" (${path})`);
                                resolve();
                            }, { once: true });
                            audio.addEventListener('error', () => {
                                reject(new Error(`Formato não suportado: ${path}`));
                            }, { once: true });
                            setTimeout(() => resolve(), 5000);
                            audio.load();
                        });

                        loaded.push(audio);
                        break; // Formato funcionou, não precisa tentar fallback
                    } catch {
                        console.warn(`⚠️ Falha ao carregar "${song.name}" (${path}), tentando próximo formato...`);
                    }
                }
            }

            audioElementsRef.current = loaded;
            console.log(`🎵 Total de músicas carregadas: ${loaded.length}/${MUSIC_SONGS.length}`);
        };

        initAllAudio();

        return () => {
            audioElementsRef.current.forEach(a => {
                a.pause();
                a.src = '';
            });
            audioElementsRef.current = [];
        };
    }, []);

    // Falar texto (com callback opcional ao terminar)
    const speak = useCallback((text: string, onEnd?: () => void) => {
        if (!('speechSynthesis' in window)) {
            console.warn('⚠️ SpeechSynthesis não suportado');
            onEnd?.();
            return;
        }

        let callbackFired = false;
        const fireCallback = () => {
            if (!callbackFired) {
                callbackFired = true;
                onEnd?.();
            }
        };

        const doSpeak = () => {
            try {
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = 'pt-BR';
                utterance.rate = 1.0;
                utterance.pitch = 1.1;
                utterance.volume = 1.0;

                const voices = window.speechSynthesis.getVoices();
                let targetVoice = voices.find(v => v.name.includes('Daniel') && v.lang.includes('pt'));
                if (!targetVoice) targetVoice = voices.find(v => v.name.includes('Paulo') && v.lang.includes('pt'));
                if (!targetVoice) targetVoice = voices.find(v => v.name.includes('Google') && v.lang.includes('pt'));
                if (!targetVoice) targetVoice = voices.find(v => v.lang.includes('pt'));

                if (targetVoice) {
                    console.log('🔊 Usando voz:', targetVoice.name);
                    utterance.voice = targetVoice;
                }

                utterance.onend = () => {
                    console.log('🔊 Fala terminou (onend)');
                    fireCallback();
                };
                utterance.onerror = (e) => {
                    console.error('🔊 Erro na fala:', e);
                    fireCallback();
                };

                window.speechSynthesis.speak(utterance);
                console.log('🔊 Fala iniciada:', text);

                // SAFETY: Se o onend não disparar em 5 segundos, forçar callback
                setTimeout(() => {
                    if (!callbackFired) {
                        console.warn('⚠️ Safety timeout: onend não disparou, forçando callback');
                        fireCallback();
                    }
                }, 5000);
            } catch (e) {
                console.error('Erro na fala do break alert:', e);
                fireCallback();
            }
        };

        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            doSpeak();
        } else {
            const handler = () => {
                window.speechSynthesis.removeEventListener('voiceschanged', handler);
                doSpeak();
            };
            window.speechSynthesis.addEventListener('voiceschanged', handler);
            setTimeout(() => {
                window.speechSynthesis.removeEventListener('voiceschanged', handler);
                if (window.speechSynthesis.getVoices().length > 0) {
                    doSpeak();
                } else {
                    console.warn('⚠️ Vozes não carregaram, forçando callback');
                    fireCallback();
                }
            }, 1000);
        }
    }, []);

    // Iniciar música (escolhe aleatoriamente)
    const startMusic = useCallback(() => {
        console.log('🎵 startMusic chamado');
        try {
            const songs = audioElementsRef.current;
            if (songs.length === 0) {
                console.error('🎵 Nenhuma música carregada!');
                return;
            }

            // Escolher aleatoriamente
            const randomIndex = Math.floor(Math.random() * songs.length);
            const audio = songs[randomIndex];
            const songName = audio.dataset.songName || 'Desconhecida';

            console.log(`🎵 Sorteada: "${songName}" (${randomIndex + 1}/${songs.length})`);
            setCurrentSong(songName);

            // Parar qualquer música anterior
            if (activeAudioRef.current && activeAudioRef.current !== audio) {
                activeAudioRef.current.pause();
                activeAudioRef.current.currentTime = 0;
            }

            activeAudioRef.current = audio;
            audio.currentTime = 0;
            audio.volume = 0.5;

            const playPromise = audio.play();
            if (playPromise) {
                playPromise.then(() => {
                    console.log(`🎵 Tocando: "${songName}"!`);
                }).catch(e => {
                    console.error('🎵 Erro ao tocar música:', e);
                });
            }
        } catch (e) {
            console.error('🎵 Exceção ao tocar música:', e);
        }
    }, []);

    // Parar música
    const stopMusic = useCallback(() => {
        if (activeAudioRef.current) {
            const audio = activeAudioRef.current;
            // Fade out suave
            const fadeOut = setInterval(() => {
                if (audio.volume > 0.05) {
                    audio.volume = Math.max(0, audio.volume - 0.05);
                } else {
                    clearInterval(fadeOut);
                    audio.pause();
                    audio.currentTime = 0;
                    audio.volume = 0.5;
                    activeAudioRef.current = null;
                }
            }, 100);
        }
    }, []);

    // Iniciar countdown de 1 minuto + música
    const startCountdownAndMusic = useCallback(() => {
        if (musicStartedRef.current) return; // Evitar chamar duplamente
        musicStartedRef.current = true;
        console.log('🎵 Break Alert: Fala terminou, tocando música e iniciando countdown!');
        setSecondsLeft(120);

        // Tocar música
        startMusic();

        // Countdown
        countdownRef.current = setInterval(() => {
            setSecondsLeft(prev => {
                if (prev <= 1) {
                    if (countdownRef.current) clearInterval(countdownRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Após 1 minuto: mensagem de volta
        breakTimerRef.current = setTimeout(() => {
            console.log('💪 Break Alert: Hora de voltar!');
            setPhase('return');
            stopMusic();

            speak('Bora voltar pro Flow familia!');

            // Esconder o overlay após 8 segundos
            setTimeout(() => {
                setPhase('idle');
            }, 8000);
        }, BREAK_DURATION_MS);
    }, [startMusic, stopMusic, speak]);

    // Disparar o break
    const triggerBreak = useCallback(() => {
        console.log('🚶 Break Alert: Hora de se levantar!');
        setPhase('break');
        setSecondsLeft(120);
        musicStartedRef.current = false;

        // Mensagem especial às 17:30
        const now = new Date();
        const isLastBreak = now.getHours() === 17 && now.getMinutes() === 30;
        const breakMessage = isLastBreak
            ? 'Bora, X1 familia!'
            : 'Bora Tropa, vamo levantar, se esticar, alongar!';

        // 1) Falar a mensagem primeiro
        // 2) Quando terminar de falar → começa música + countdown
        speak(breakMessage, () => {
            startCountdownAndMusic();
        });
    }, [speak, startCountdownAndMusic]);

    // Dismiss manual (fechar antes do tempo)
    const dismiss = useCallback(() => {
        if (breakTimerRef.current) clearTimeout(breakTimerRef.current);
        if (countdownRef.current) clearInterval(countdownRef.current);
        stopMusic();
        window.speechSynthesis?.cancel();
        setPhase('idle');
        setSecondsLeft(0);
    }, [stopMusic]);

    // Toggle ativar/desativar
    const toggle = useCallback(() => {
        setEnabled(prev => !prev);
    }, []);

    // Checker principal — verifica a cada 15 segundos se é hora de alertar
    useEffect(() => {
        if (!enabled) return;

        const check = () => {
            const now = new Date();
            const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

            if (BREAK_TIMES.includes(currentTime) && lastTriggeredRef.current !== currentTime && phase === 'idle') {
                lastTriggeredRef.current = currentTime;
                triggerBreak();
            }
        };

        // Checar imediatamente
        check();

        // Checar a cada 15 segundos
        const intervalId = setInterval(check, 15_000);

        return () => clearInterval(intervalId);
    }, [enabled, phase, triggerBreak]);

    // Cleanup timers
    useEffect(() => {
        return () => {
            if (breakTimerRef.current) clearTimeout(breakTimerRef.current);
            if (countdownRef.current) clearInterval(countdownRef.current);
        };
    }, []);

    return {
        phase,
        enabled,
        secondsLeft,
        currentSong,
        progressWidth: `${((120 - secondsLeft) / 120) * 100}%`,
        toggle,
        dismiss,
        triggerBreak,
    };
}
