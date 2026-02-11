import { useEffect, useRef, useCallback, useState } from 'react';

// Horários de alerta (HH:MM)
const BREAK_TIMES = [
    '08:30', '09:30', '10:30', '11:30', '12:30',
    '13:30', '14:30', '15:30', '16:30', '17:30',
];

const BREAK_DURATION_MS = 120_000; // 2 minutos de pausa

// Tentar mp3 primeiro (melhor suporte), fallback para mpeg
const MUSIC_PATHS = ['/music/rock.mp3', '/music/rock.mpeg'];

type BreakPhase = 'idle' | 'break' | 'return';

export function useBreakAlert() {
    const [phase, setPhase] = useState<BreakPhase>('idle');
    const [enabled, setEnabled] = useState<boolean>(() => {
        const stored = localStorage.getItem('break-alert-enabled');
        return stored !== null ? stored === 'true' : true;
    });
    const [secondsLeft, setSecondsLeft] = useState(0);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const breakTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const lastTriggeredRef = useRef<string>('');
    const musicStartedRef = useRef(false);

    // Persistir preferência
    useEffect(() => {
        localStorage.setItem('break-alert-enabled', String(enabled));
    }, [enabled]);

    // Pré-carregar áudio ao montar
    useEffect(() => {
        const initAudio = async () => {
            for (const path of MUSIC_PATHS) {
                try {
                    const audio = new Audio(path);
                    audio.loop = true;
                    audio.volume = 0.5;
                    audio.preload = 'auto';

                    // Testar se o formato é suportado
                    await new Promise<void>((resolve, reject) => {
                        audio.addEventListener('canplaythrough', () => {
                            console.log(`🎵 Áudio carregado com sucesso: ${path}`);
                            resolve();
                        }, { once: true });
                        audio.addEventListener('error', () => {
                            console.warn(`⚠️ Erro ao carregar áudio: ${path}`, audio.error);
                            reject(new Error(`Formato não suportado: ${path}`));
                        }, { once: true });
                        // Timeout de 5 segundos para carregar
                        setTimeout(() => {
                            console.log(`🎵 Timeout carregando ${path}, tentando usar mesmo assim`);
                            resolve();
                        }, 5000);
                        audio.load();
                    });

                    audioRef.current = audio;
                    console.log(`🎵 Usando arquivo de música: ${path}`);
                    return; // Sucesso, parar de tentar
                } catch (e) {
                    console.warn(`⚠️ Falha ao carregar ${path}, tentando próximo...`);
                }
            }
            console.error('❌ Nenhum arquivo de música pôde ser carregado!');
        };

        initAudio();

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
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

    // Iniciar música
    const startMusic = useCallback(() => {
        console.log('🎵 startMusic chamado');
        try {
            if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.volume = 0.5;
                const playPromise = audioRef.current.play();
                if (playPromise) {
                    playPromise.then(() => {
                        console.log('🎵 Música tocando!');
                    }).catch(e => {
                        console.error('🎵 Erro ao tocar música:', e);
                    });
                }
            } else {
                console.error('🎵 audioRef.current é null - áudio não foi carregado');
            }
        } catch (e) {
            console.error('🎵 Exceção ao tocar música:', e);
        }
    }, []);

    // Parar música
    const stopMusic = useCallback(() => {
        if (audioRef.current) {
            const audio = audioRef.current;
            // Fade out suave
            const fadeOut = setInterval(() => {
                if (audio.volume > 0.05) {
                    audio.volume = Math.max(0, audio.volume - 0.05);
                } else {
                    clearInterval(fadeOut);
                    audio.pause();
                    audio.currentTime = 0;
                    audio.volume = 0.5;
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

            speak('Bora voltar família, só tem monstro aqui!');

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

        // 1) Falar a mensagem primeiro
        // 2) Quando terminar de falar → começa música + countdown
        speak('Bora Tropa, vamo levantar, se esticar, alongar!', () => {
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
        progressWidth: `${((120 - secondsLeft) / 120) * 100}%`,
        toggle,
        dismiss,
        triggerBreak, // para teste manual
    };
}
