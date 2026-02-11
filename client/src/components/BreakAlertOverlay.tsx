import { useBreakAlert } from '@/hooks/useBreakAlert';
import { Activity, Coffee, Dumbbell, ArrowLeft, X, Volume2, VolumeX, Play } from 'lucide-react';

export function BreakAlertOverlay() {
    const { phase, enabled, secondsLeft, progressWidth, toggle, dismiss, triggerBreak } = useBreakAlert();

    // Botões flutuantes (sempre visíveis quando idle)
    const floatingButtons = (
        <div
            style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                zIndex: 9998,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
            }}
        >
            {/* Botão Testar */}
            {enabled && phase === 'idle' && (
                <button
                    onClick={triggerBreak}
                    title="Testar alerta de pausa"
                    style={{
                        height: '44px',
                        padding: '0 16px',
                        borderRadius: '22px',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                        transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                    <Play size={16} />
                    Testar
                </button>
            )}

            {/* Botão toggle */}
            <button
                onClick={toggle}
                title={enabled ? 'Desativar alerta de pausa' : 'Ativar alerta de pausa'}
                style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: enabled
                        ? 'linear-gradient(135deg, #10b981, #059669)'
                        : 'linear-gradient(135deg, #6b7280, #4b5563)',
                    color: 'white',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                    transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
                {enabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
        </div>
    );

    if (phase === 'idle') {
        return floatingButtons;
    }

    const isBreak = phase === 'break';

    return (
        <>
            {floatingButtons}
            {/* Overlay de fundo */}
            <div
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isBreak
                        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.95))'
                        : 'linear-gradient(135deg, rgba(59, 130, 246, 0.95), rgba(37, 99, 235, 0.95))',
                    backdropFilter: 'blur(10px)',
                    animation: 'breakFadeIn 0.5s ease-out',
                }}
            >
                {/* Botão fechar */}
                <button
                    onClick={dismiss}
                    style={{
                        position: 'absolute',
                        top: '20px',
                        right: '20px',
                        background: 'rgba(255,255,255,0.2)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'white',
                        transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.3)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
                    title="Fechar e voltar ao trabalho"
                >
                    <X size={20} />
                </button>

                {/* Conteúdo central */}
                <div
                    style={{
                        textAlign: 'center',
                        color: 'white',
                        maxWidth: '600px',
                        padding: '40px',
                    }}
                >
                    {/* Ícone animado */}
                    <div
                        style={{
                            marginBottom: '30px',
                            animation: 'breakBounce 2s ease-in-out infinite',
                        }}
                    >
                        {isBreak ? (
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
                                <Dumbbell size={64} style={{ animation: 'breakSpin 3s linear infinite' }} />
                                <Coffee size={64} style={{ animation: 'breakFloat 2s ease-in-out infinite alternate' }} />
                                <Activity size={64} style={{ animation: 'breakPulse 1.5s ease-in-out infinite' }} />
                            </div>
                        ) : (
                            <ArrowLeft size={80} style={{ animation: 'breakSlideRight 1s ease-in-out infinite alternate' }} />
                        )}
                    </div>

                    {/* Mensagem principal */}
                    <h1
                        style={{
                            fontSize: '2.5rem',
                            fontWeight: 800,
                            marginBottom: '15px',
                            textShadow: '0 2px 10px rgba(0,0,0,0.2)',
                            lineHeight: 1.2,
                        }}
                    >
                        {isBreak
                            ? '🏋️ Bora Tropa!'
                            : '🔥 Hora de Voltar!'}
                    </h1>

                    <p
                        style={{
                            fontSize: '1.5rem',
                            fontWeight: 500,
                            opacity: 0.95,
                            marginBottom: '30px',
                            lineHeight: 1.4,
                        }}
                    >
                        {isBreak
                            ? 'Vamo levantar, se esticar, alongar! 💪'
                            : 'Bora voltar família, só tem monstro aqui! 🦾'}
                    </p>

                    {/* Countdown (só na fase break) */}
                    {isBreak && (
                        <div style={{ marginBottom: '30px' }}>
                            <div
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '120px',
                                    height: '120px',
                                    borderRadius: '50%',
                                    border: '4px solid rgba(255,255,255,0.4)',
                                    background: 'rgba(255,255,255,0.1)',
                                    fontSize: '2.5rem',
                                    fontWeight: 700,
                                    fontVariantNumeric: 'tabular-nums',
                                }}
                            >
                                {secondsLeft}s
                            </div>
                            <p
                                style={{
                                    marginTop: '10px',
                                    fontSize: '0.9rem',
                                    opacity: 0.7,
                                }}
                            >
                                Volta em {secondsLeft} segundos
                            </p>
                        </div>
                    )}

                    {/* Barra de progresso */}
                    {isBreak && (
                        <div
                            style={{
                                width: '100%',
                                maxWidth: '400px',
                                height: '8px',
                                borderRadius: '4px',
                                background: 'rgba(255,255,255,0.2)',
                                margin: '0 auto',
                                overflow: 'hidden',
                            }}
                        >
                            <div
                                style={{
                                    width: progressWidth,
                                    height: '100%',
                                    borderRadius: '4px',
                                    background: 'rgba(255,255,255,0.7)',
                                    transition: 'width 1s linear',
                                }}
                            />
                        </div>
                    )}

                    {/* Nota musical */}
                    <p
                        style={{
                            marginTop: '25px',
                            fontSize: '0.85rem',
                            opacity: 0.6,
                        }}
                    >
                        {isBreak ? '🎵 Aproveita o som e se alonga!' : '🎸 Rock voltou ao normal!'}
                    </p>
                </div>
            </div>

            {/* CSS Animations */}
            <style>{`
        @keyframes breakFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes breakBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes breakSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes breakFloat {
          from { transform: translateY(5px); }
          to { transform: translateY(-5px); }
        }
        @keyframes breakPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
        }
        @keyframes breakSlideRight {
          from { transform: translateX(-10px); }
          to { transform: translateX(10px); }
        }
      `}</style>
        </>
    );
}
