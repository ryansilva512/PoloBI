import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
    Activity,
    ArrowLeft,
    Coffee,
    Dumbbell,
    Play,
    Volume2,
    VolumeX,
    X,
} from 'lucide-react';

import { useBreakAlert } from '@/hooks/useBreakAlert';

const BREAK_DURATION_SECONDS = 120;

function formatCountdown(totalSeconds: number) {
    const safeSeconds = Math.max(0, totalSeconds);
    const minutes = Math.floor(safeSeconds / 60);
    const seconds = safeSeconds % 60;

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

const overlayStyles = `
  .break-alert-dock,
  .break-alert-overlay,
  .break-alert-overlay * {
    box-sizing: border-box;
  }

  .break-alert-dock {
    position: fixed;
    right: clamp(12px, 2vw, 24px);
    bottom: max(12px, env(safe-area-inset-bottom));
    z-index: 9998;
    display: flex;
    align-items: center;
    gap: 7px;
    min-height: 52px;
    padding: 6px;
    color: #e2e8f0;
    border: 1px solid rgba(148, 163, 184, 0.15);
    border-radius: 17px;
    background:
      linear-gradient(145deg, rgba(15, 23, 42, 0.96), rgba(5, 11, 23, 0.97));
    box-shadow:
      0 22px 54px -26px rgba(2, 6, 23, 0.95),
      0 8px 22px -14px rgba(2, 6, 23, 0.78),
      inset 0 1px 0 rgba(255, 255, 255, 0.05);
    -webkit-backdrop-filter: blur(18px) saturate(130%);
    backdrop-filter: blur(18px) saturate(130%);
  }

  .break-alert-dock-status {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    padding: 0 8px 0 2px;
  }

  .break-alert-dock-icon {
    position: relative;
    display: grid;
    flex: 0 0 auto;
    width: 36px;
    height: 36px;
    place-items: center;
    color: #34d399;
    border: 1px solid rgba(52, 211, 153, 0.18);
    border-radius: 11px;
    background: rgba(16, 185, 129, 0.1);
  }

  .break-alert-dock[data-enabled='false'] .break-alert-dock-icon {
    color: #94a3b8;
    border-color: rgba(148, 163, 184, 0.14);
    background: rgba(148, 163, 184, 0.08);
  }

  .break-alert-dock-indicator {
    position: absolute;
    right: -2px;
    bottom: -2px;
    width: 8px;
    height: 8px;
    border: 2px solid #0a1221;
    border-radius: 999px;
    background: #34d399;
  }

  .break-alert-dock[data-enabled='false'] .break-alert-dock-indicator {
    background: #64748b;
  }

  .break-alert-dock-copy {
    display: grid;
    min-width: 112px;
    line-height: 1.2;
  }

  .break-alert-dock-copy strong {
    overflow: hidden;
    color: #f8fafc;
    font-size: 0.73rem;
    font-weight: 700;
    letter-spacing: -0.01em;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .break-alert-dock-copy span {
    margin-top: 3px;
    color: #7f8da3;
    font-size: 0.625rem;
    font-weight: 550;
    white-space: nowrap;
  }

  .break-alert-dock-divider {
    align-self: stretch;
    width: 1px;
    margin: 4px 1px;
    background: rgba(148, 163, 184, 0.11);
  }

  .break-alert-dock-button {
    display: inline-flex;
    flex: 0 0 auto;
    height: 38px;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 0 11px;
    color: #b8c4d6;
    font: inherit;
    font-size: 0.675rem;
    font-weight: 700;
    border: 1px solid rgba(148, 163, 184, 0.12);
    border-radius: 11px;
    background: rgba(255, 255, 255, 0.025);
    cursor: pointer;
    transition: border-color 180ms ease, background 180ms ease, color 180ms ease, transform 180ms ease;
  }

  .break-alert-dock-button--toggle {
    width: 38px;
    padding: 0;
    color: #34d399;
    border-color: rgba(52, 211, 153, 0.18);
    background: rgba(16, 185, 129, 0.1);
  }

  .break-alert-dock[data-enabled='false'] .break-alert-dock-button--toggle {
    color: #94a3b8;
    border-color: rgba(148, 163, 184, 0.12);
    background: rgba(148, 163, 184, 0.06);
  }

  .break-alert-dock[data-variant='header'] {
    position: static;
    right: auto;
    bottom: auto;
    z-index: auto;
    gap: 4px;
    width: max-content;
    min-height: 36px;
    padding: 3px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.025);
    box-shadow: none;
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }

  .break-alert-dock[data-variant='header'] .break-alert-dock-status {
    gap: 7px;
    padding: 0 5px 0 1px;
  }

  .break-alert-dock[data-variant='header'] .break-alert-dock-icon {
    width: 28px;
    height: 28px;
    border-radius: 8px;
  }

  .break-alert-dock[data-variant='header'] .break-alert-dock-copy {
    min-width: 90px;
  }

  .break-alert-dock[data-variant='header'] .break-alert-dock-copy strong {
    font-size: 0.65rem;
  }

  .break-alert-dock[data-variant='header'] .break-alert-dock-copy span {
    margin-top: 1px;
    font-size: 0.55rem;
  }

  .break-alert-dock[data-variant='header'] .break-alert-dock-divider {
    margin: 3px 0;
  }

  .break-alert-dock[data-variant='header'] .break-alert-dock-button {
    height: 28px;
    gap: 5px;
    padding: 0 8px;
    border-radius: 8px;
    font-size: 0.6rem;
  }

  .break-alert-dock[data-variant='header'] .break-alert-dock-button--toggle {
    width: 28px;
    padding: 0;
  }

  .break-alert-overlay {
    --break-accent: #34d399;
    --break-accent-rgb: 52, 211, 153;
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    overflow-y: auto;
    overscroll-behavior: contain;
    align-items: center;
    justify-content: center;
    padding:
      max(16px, env(safe-area-inset-top))
      max(16px, env(safe-area-inset-right))
      max(16px, env(safe-area-inset-bottom))
      max(16px, env(safe-area-inset-left));
    color: #e2e8f0;
    background:
      radial-gradient(circle at 18% 12%, rgba(var(--break-accent-rgb), 0.12), transparent 31rem),
      radial-gradient(circle at 84% 88%, rgba(14, 165, 233, 0.09), transparent 28rem),
      rgba(2, 6, 15, 0.9);
    -webkit-backdrop-filter: blur(14px) saturate(115%);
    backdrop-filter: blur(14px) saturate(115%);
    animation: break-alert-fade-in 220ms ease-out both;
  }

  .break-alert-overlay[data-phase='return'] {
    --break-accent: #38bdf8;
    --break-accent-rgb: 56, 189, 248;
  }

  .break-alert-overlay::before {
    position: fixed;
    inset: 0;
    content: '';
    pointer-events: none;
    opacity: 0.32;
    background-image:
      linear-gradient(rgba(148, 163, 184, 0.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(148, 163, 184, 0.035) 1px, transparent 1px);
    background-size: 44px 44px;
    -webkit-mask-image: radial-gradient(circle at center, black, transparent 74%);
    mask-image: radial-gradient(circle at center, black, transparent 74%);
  }

  .break-alert-card {
    position: relative;
    width: min(100%, 640px);
    max-height: calc(100dvh - 32px);
    margin: auto;
    overflow-x: hidden;
    overflow-y: auto;
    border: 1px solid rgba(148, 163, 184, 0.16);
    border-radius: 26px;
    background:
      linear-gradient(145deg, rgba(15, 25, 44, 0.97), rgba(6, 13, 26, 0.985));
    box-shadow:
      0 40px 100px -38px rgba(0, 0, 0, 0.95),
      0 24px 70px -46px rgba(var(--break-accent-rgb), 0.52),
      inset 0 1px 0 rgba(255, 255, 255, 0.055);
    -webkit-backdrop-filter: blur(24px) saturate(130%);
    backdrop-filter: blur(24px) saturate(130%);
    animation: break-alert-card-in 360ms cubic-bezier(0.16, 1, 0.3, 1) both;
    scrollbar-color: rgba(148, 163, 184, 0.28) transparent;
  }

  .break-alert-card::before {
    position: absolute;
    top: 0;
    right: 12%;
    left: 12%;
    height: 1px;
    content: '';
    background: linear-gradient(90deg, transparent, rgba(var(--break-accent-rgb), 0.9), transparent);
    box-shadow: 0 0 24px rgba(var(--break-accent-rgb), 0.45);
  }

  .break-alert-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 20px 22px 0;
  }

  .break-alert-brand {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 10px;
  }

  .break-alert-brand-mark {
    display: grid;
    flex: 0 0 auto;
    width: 34px;
    height: 34px;
    place-items: center;
    color: var(--break-accent);
    border: 1px solid rgba(var(--break-accent-rgb), 0.18);
    border-radius: 10px;
    background: rgba(var(--break-accent-rgb), 0.09);
  }

  .break-alert-brand-copy {
    display: grid;
    min-width: 0;
    line-height: 1.15;
  }

  .break-alert-brand-copy strong {
    overflow: hidden;
    color: #e8eef8;
    font-size: 0.675rem;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .break-alert-brand-copy span {
    margin-top: 4px;
    color: #708096;
    font-size: 0.625rem;
    font-weight: 600;
  }

  .break-alert-close {
    display: grid;
    flex: 0 0 auto;
    width: 36px;
    height: 36px;
    place-items: center;
    padding: 0;
    color: #94a3b8;
    border: 1px solid rgba(148, 163, 184, 0.13);
    border-radius: 11px;
    background: rgba(255, 255, 255, 0.025);
    cursor: pointer;
    transition: color 180ms ease, border-color 180ms ease, background 180ms ease, transform 180ms ease;
  }

  .break-alert-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 18px clamp(24px, 7vw, 52px) 38px;
    text-align: center;
  }

  .break-alert-visual {
    position: relative;
    display: grid;
    width: 88px;
    height: 88px;
    margin: 4px 0 18px;
    place-items: center;
    color: var(--break-accent);
    border: 1px solid rgba(var(--break-accent-rgb), 0.22);
    border-radius: 26px;
    background:
      radial-gradient(circle at 35% 25%, rgba(255, 255, 255, 0.08), transparent 45%),
      rgba(var(--break-accent-rgb), 0.1);
    box-shadow:
      0 20px 44px -26px rgba(var(--break-accent-rgb), 0.7),
      inset 0 1px 0 rgba(255, 255, 255, 0.06);
  }

  .break-alert-visual::before {
    position: absolute;
    inset: -8px;
    content: '';
    border: 1px solid rgba(var(--break-accent-rgb), 0.1);
    border-radius: 31px;
    animation: break-alert-breathe 2.8s ease-in-out infinite;
  }

  .break-alert-visual-mini {
    position: absolute;
    right: -8px;
    bottom: -7px;
    display: grid;
    width: 31px;
    height: 31px;
    place-items: center;
    color: #dbeafe;
    border: 3px solid #0d1728;
    border-radius: 10px;
    background: #17243a;
  }

  .break-alert-phase {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    margin-bottom: 12px;
    padding: 6px 10px;
    color: var(--break-accent);
    font-size: 0.625rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    border: 1px solid rgba(var(--break-accent-rgb), 0.15);
    border-radius: 999px;
    background: rgba(var(--break-accent-rgb), 0.065);
  }

  .break-alert-phase-dot {
    width: 6px;
    height: 6px;
    border-radius: 999px;
    background: currentColor;
    box-shadow: 0 0 12px currentColor;
  }

  .break-alert-title {
    max-width: 520px;
    margin: 0;
    color: #f8fafc;
    font-size: clamp(1.85rem, 5vw, 2.55rem);
    font-weight: 780;
    letter-spacing: -0.045em;
    line-height: 1.08;
    text-wrap: balance;
  }

  .break-alert-description {
    max-width: 480px;
    margin: 13px 0 0;
    color: #94a3b8;
    font-size: clamp(0.9rem, 2.5vw, 1rem);
    font-weight: 450;
    line-height: 1.65;
    text-wrap: balance;
  }

  .break-alert-timer {
    width: 100%;
    margin-top: 24px;
    padding: 20px 22px 18px;
    border: 1px solid rgba(148, 163, 184, 0.12);
    border-radius: 18px;
    background:
      linear-gradient(135deg, rgba(var(--break-accent-rgb), 0.06), rgba(255, 255, 255, 0.018));
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.025);
  }

  .break-alert-timer-label {
    display: block;
    color: #718096;
    font-size: 0.625rem;
    font-weight: 750;
    letter-spacing: 0.11em;
    text-transform: uppercase;
  }

  .break-alert-time {
    display: block;
    margin-top: 7px;
    color: #f8fafc;
    font-family: 'JetBrains Mono', 'SFMono-Regular', Consolas, monospace;
    font-size: clamp(2.8rem, 11vw, 4.15rem);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.075em;
    line-height: 1;
    text-shadow: 0 0 32px rgba(var(--break-accent-rgb), 0.2);
  }

  .break-alert-progress-copy {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-top: 17px;
    color: #718096;
    font-size: 0.625rem;
    font-weight: 650;
  }

  .break-alert-progress-copy strong {
    color: #a9b6c8;
    font-weight: 700;
  }

  .break-alert-progress {
    width: 100%;
    height: 5px;
    margin-top: 8px;
    overflow: hidden;
    border-radius: 999px;
    background: rgba(148, 163, 184, 0.12);
  }

  .break-alert-progress-bar {
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, rgba(var(--break-accent-rgb), 0.65), var(--break-accent));
    box-shadow: 0 0 15px rgba(var(--break-accent-rgb), 0.32);
    transition: width 1s linear;
  }

  .break-alert-track {
    display: flex;
    width: 100%;
    min-width: 0;
    align-items: center;
    gap: 11px;
    margin-top: 12px;
    padding: 11px 13px;
    text-align: left;
    border: 1px solid rgba(148, 163, 184, 0.09);
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.018);
  }

  .break-alert-track-icon {
    display: grid;
    flex: 0 0 auto;
    width: 32px;
    height: 32px;
    place-items: center;
    color: var(--break-accent);
    border-radius: 10px;
    background: rgba(var(--break-accent-rgb), 0.085);
  }

  .break-alert-track-copy {
    display: grid;
    min-width: 0;
    flex: 1;
    line-height: 1.2;
  }

  .break-alert-track-copy span {
    color: #64748b;
    font-size: 0.59rem;
    font-weight: 750;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .break-alert-track-copy strong {
    overflow: hidden;
    margin-top: 4px;
    color: #c4cedd;
    font-size: 0.72rem;
    font-weight: 650;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .break-alert-equalizer {
    display: flex;
    flex: 0 0 auto;
    height: 16px;
    align-items: flex-end;
    gap: 2px;
  }

  .break-alert-equalizer span {
    width: 2px;
    height: 55%;
    border-radius: 999px;
    background: var(--break-accent);
    animation: break-alert-equalizer 900ms ease-in-out infinite alternate;
  }

  .break-alert-equalizer span:nth-child(2) {
    height: 100%;
    animation-delay: -300ms;
  }

  .break-alert-equalizer span:nth-child(3) {
    height: 72%;
    animation-delay: -600ms;
  }

  .break-alert-return-note {
    display: flex;
    width: 100%;
    align-items: center;
    gap: 12px;
    margin-top: 24px;
    padding: 14px 16px;
    text-align: left;
    border: 1px solid rgba(var(--break-accent-rgb), 0.13);
    border-radius: 16px;
    background: rgba(var(--break-accent-rgb), 0.055);
  }

  .break-alert-return-note-icon {
    display: grid;
    flex: 0 0 auto;
    width: 38px;
    height: 38px;
    place-items: center;
    color: var(--break-accent);
    border-radius: 12px;
    background: rgba(var(--break-accent-rgb), 0.1);
  }

  .break-alert-return-note p {
    margin: 0;
    color: #9aa8bb;
    font-size: 0.75rem;
    line-height: 1.45;
  }

  .break-alert-return-note strong {
    display: block;
    margin-bottom: 2px;
    color: #dbe6f5;
    font-size: 0.78rem;
  }

  .break-alert-action {
    display: inline-flex;
    min-width: 190px;
    height: 44px;
    align-items: center;
    justify-content: center;
    gap: 9px;
    margin-top: 20px;
    padding: 0 19px;
    color: #03131a;
    font: inherit;
    font-size: 0.76rem;
    font-weight: 800;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 13px;
    background: var(--break-accent);
    box-shadow:
      0 14px 30px -18px rgba(var(--break-accent-rgb), 0.9),
      inset 0 1px 0 rgba(255, 255, 255, 0.32);
    cursor: pointer;
    transition: filter 180ms ease, box-shadow 180ms ease, transform 180ms ease;
  }

  .break-alert-hint {
    margin: 11px 0 0;
    color: #58677c;
    font-size: 0.625rem;
    font-weight: 550;
  }

  .break-alert-dock-button:focus-visible,
  .break-alert-close:focus-visible,
  .break-alert-action:focus-visible {
    outline: 2px solid var(--break-accent, #38bdf8);
    outline-offset: 3px;
  }

  @media (hover: hover) {
    .break-alert-dock-button:hover,
    .break-alert-close:hover {
      color: #f8fafc;
      border-color: rgba(148, 163, 184, 0.24);
      background: rgba(255, 255, 255, 0.065);
      transform: translateY(-1px);
    }

    .break-alert-dock-button--toggle:hover {
      color: #6ee7b7;
      border-color: rgba(52, 211, 153, 0.3);
      background: rgba(16, 185, 129, 0.15);
    }

    .break-alert-action:hover {
      filter: brightness(1.08);
      box-shadow:
        0 17px 34px -18px rgba(var(--break-accent-rgb), 1),
        inset 0 1px 0 rgba(255, 255, 255, 0.38);
      transform: translateY(-1px);
    }
  }

  .break-alert-dock-button:active,
  .break-alert-close:active,
  .break-alert-action:active {
    transform: translateY(0) scale(0.97);
  }

  @keyframes break-alert-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes break-alert-card-in {
    from { opacity: 0; transform: translateY(14px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  @keyframes break-alert-breathe {
    0%, 100% { opacity: 0.55; transform: scale(0.96); }
    50% { opacity: 1; transform: scale(1.035); }
  }

  @keyframes break-alert-equalizer {
    from { transform: scaleY(0.42); opacity: 0.45; }
    to { transform: scaleY(1); opacity: 1; }
  }

  @media (max-width: 520px) {
    .break-alert-dock-copy,
    .break-alert-dock-divider,
    .break-alert-dock-button span:not(.sr-only) {
      display: none;
    }

    .break-alert-dock-status {
      padding-right: 0;
    }

    .break-alert-dock-button {
      width: 38px;
      padding: 0;
    }

    .break-alert-overlay {
      padding: 10px;
    }

    .break-alert-card {
      max-height: calc(100dvh - 20px);
      border-radius: 21px;
    }

    .break-alert-card-header {
      padding: 16px 16px 0;
    }

    .break-alert-brand-copy strong {
      font-size: 0.625rem;
      letter-spacing: 0.09em;
    }

    .break-alert-content {
      padding: 14px 20px 28px;
    }

    .break-alert-visual {
      width: 76px;
      height: 76px;
      margin-bottom: 16px;
      border-radius: 23px;
    }

    .break-alert-title {
      font-size: clamp(1.72rem, 9vw, 2.1rem);
    }

    .break-alert-description {
      line-height: 1.55;
    }

    .break-alert-timer {
      margin-top: 20px;
      padding: 17px 16px 16px;
    }

    .break-alert-time {
      font-size: clamp(2.65rem, 17vw, 3.4rem);
    }

    .break-alert-action {
      width: 100%;
    }
  }

  @media (max-height: 680px) {
    .break-alert-overlay {
      align-items: flex-start;
      padding-top: 10px;
      padding-bottom: 10px;
    }

    .break-alert-card {
      max-height: calc(100dvh - 20px);
    }

    .break-alert-card-header {
      padding-top: 14px;
    }

    .break-alert-content {
      padding-top: 10px;
      padding-bottom: 24px;
    }

    .break-alert-visual {
      width: 64px;
      height: 64px;
      margin-bottom: 10px;
      border-radius: 20px;
    }

    .break-alert-visual-mini {
      width: 27px;
      height: 27px;
    }

    .break-alert-phase {
      margin-bottom: 8px;
    }

    .break-alert-description {
      margin-top: 8px;
    }

    .break-alert-timer,
    .break-alert-return-note {
      margin-top: 14px;
    }

    .break-alert-time {
      font-size: 2.7rem;
    }

    .break-alert-action {
      margin-top: 14px;
    }
  }

  @media (max-width: 1535px) {
    .break-alert-dock[data-variant='header'] .break-alert-dock-copy span {
      display: none;
    }

    .break-alert-dock[data-variant='header'] .break-alert-dock-copy {
      min-width: 82px;
    }
  }

  @media (max-width: 1180px) {
    .break-alert-dock[data-variant='header'] .break-alert-dock-copy,
    .break-alert-dock[data-variant='header'] .break-alert-dock-divider,
    .break-alert-dock[data-variant='header'] .break-alert-dock-button span:not(.sr-only) {
      display: none;
    }

    .break-alert-dock[data-variant='header'] .break-alert-dock-status {
      padding-right: 0;
    }

    .break-alert-dock[data-variant='header'] .break-alert-dock-button {
      width: 28px;
      padding: 0;
    }
  }

  @media (max-width: 700px) {
    .break-alert-dock[data-variant='header'] .break-alert-dock-status {
      display: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .break-alert-overlay,
    .break-alert-card,
    .break-alert-overlay *,
    .break-alert-dock,
    .break-alert-dock * {
      animation: none !important;
      scroll-behavior: auto !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

interface BreakAlertOverlayProps {
    dockVariant?: 'floating' | 'header';
    dockTarget?: Element | null;
}

export function BreakAlertOverlay({
    dockVariant = 'floating',
    dockTarget = null,
}: BreakAlertOverlayProps = {}) {
    const {
        phase,
        enabled,
        secondsLeft,
        currentSong,
        isInterruptedByAnnouncement,
        progressWidth,
        toggle,
        dismiss,
        triggerBreak,
    } = useBreakAlert();
    const dialogRef = useRef<HTMLElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);
    const dialogOpen =
        (phase === 'break' || phase === 'return')
        && !isInterruptedByAnnouncement;

    useEffect(() => {
        if (!dialogOpen) return;

        previousFocusRef.current = document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;

        const previousBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const focusFrame = window.requestAnimationFrame(() => {
            closeButtonRef.current?.focus();
        });

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                dismiss();
                return;
            }

            if (event.key !== 'Tab' || !dialogRef.current) return;

            const focusableElements = Array.from(
                dialogRef.current.querySelectorAll<HTMLElement>(
                    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
                ),
            );

            if (focusableElements.length === 0) {
                event.preventDefault();
                dialogRef.current.focus();
                return;
            }

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (event.shiftKey && document.activeElement === firstElement) {
                event.preventDefault();
                lastElement.focus();
            } else if (!event.shiftKey && document.activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            window.cancelAnimationFrame(focusFrame);
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = previousBodyOverflow;

            if (previousFocusRef.current?.isConnected) {
                previousFocusRef.current.focus();
            }
        };
    }, [dialogOpen, dismiss]);

    const floatingDock = (
        <aside
            className="break-alert-dock"
            data-enabled={enabled}
            data-variant={dockVariant}
            aria-label="Controles do alerta de pausa"
        >
            <div className="break-alert-dock-status" aria-live="polite">
                <span className="break-alert-dock-icon" aria-hidden="true">
                    <Coffee size={17} strokeWidth={2} />
                    <span className="break-alert-dock-indicator" />
                </span>
                <span className="break-alert-dock-copy">
                    <strong>Pausa inteligente</strong>
                    <span>{enabled ? 'Alertas ativos' : 'Alertas desativados'}</span>
                </span>
            </div>

            <span className="break-alert-dock-divider" aria-hidden="true" />

            {enabled && phase === 'idle' && (
                <button
                    type="button"
                    className="break-alert-dock-button"
                    onClick={triggerBreak}
                    title="Testar alerta de pausa"
                    aria-label="Testar alerta de pausa"
                >
                    <Play size={14} fill="currentColor" aria-hidden="true" />
                    <span>Testar</span>
                </button>
            )}

            <button
                type="button"
                className="break-alert-dock-button break-alert-dock-button--toggle"
                onClick={toggle}
                title={enabled ? 'Desativar alerta de pausa' : 'Ativar alerta de pausa'}
                aria-label={enabled ? 'Desativar alerta de pausa' : 'Ativar alerta de pausa'}
                aria-pressed={enabled}
            >
                {enabled
                    ? <Volume2 size={16} aria-hidden="true" />
                    : <VolumeX size={16} aria-hidden="true" />}
                <span className="sr-only">{enabled ? 'Desativar alertas' : 'Ativar alertas'}</span>
            </button>
        </aside>
    );

    const renderedDock = dockVariant === 'header'
        ? dockTarget
            ? createPortal(floatingDock, dockTarget)
            : null
        : floatingDock;

    if (!dialogOpen) {
        return (
            <>
                {renderedDock}
                <style>{overlayStyles}</style>
            </>
        );
    }

    const isBreak = phase === 'break';
    const elapsedSeconds = Math.min(
        BREAK_DURATION_SECONDS,
        Math.max(0, BREAK_DURATION_SECONDS - secondsLeft),
    );

    return (
        <>
            <div className="break-alert-overlay" data-phase={phase}>
                <section
                    ref={dialogRef}
                    className="break-alert-card"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="break-alert-title"
                    aria-describedby="break-alert-description"
                    tabIndex={-1}
                >
                    <header className="break-alert-card-header">
                        <div className="break-alert-brand">
                            <span className="break-alert-brand-mark" aria-hidden="true">
                                <Activity size={16} strokeWidth={2.2} />
                            </span>
                            <span className="break-alert-brand-copy">
                                <strong>POLO INTELLIGENCE</strong>
                                <span>Bem-estar em operação</span>
                            </span>
                        </div>

                        <button
                            ref={closeButtonRef}
                            type="button"
                            className="break-alert-close"
                            onClick={dismiss}
                            aria-label="Fechar alerta e voltar ao painel"
                            title="Fechar e voltar ao painel"
                        >
                            <X size={17} aria-hidden="true" />
                        </button>
                    </header>

                    <div className="break-alert-content">
                        <div className="break-alert-visual" aria-hidden="true">
                            {isBreak
                                ? <Coffee size={38} strokeWidth={1.65} />
                                : <ArrowLeft size={39} strokeWidth={1.65} />}
                            <span className="break-alert-visual-mini">
                                {isBreak
                                    ? <Dumbbell size={14} strokeWidth={2} />
                                    : <Activity size={14} strokeWidth={2} />}
                            </span>
                        </div>

                        <div className="break-alert-phase" aria-live="polite">
                            <span className="break-alert-phase-dot" aria-hidden="true" />
                            {isBreak ? 'Pausa em andamento' : 'Pausa concluída'}
                        </div>

                        <h1 id="break-alert-title" className="break-alert-title">
                            {isBreak ? 'Respire. Alongue. Recarregue.' : 'Pronto para retomar o foco?'}
                        </h1>

                        <p id="break-alert-description" className="break-alert-description">
                            {isBreak
                                ? 'Levante por alguns instantes, movimente o corpo e deixe a mente desacelerar. Seu próximo bloco de foco começa aqui.'
                                : 'Seu intervalo chegou ao fim. Volte ao painel com mais energia, presença e clareza para seguir o fluxo.'}
                        </p>

                        {isBreak ? (
                            <>
                                <div className="break-alert-timer">
                                    <span className="break-alert-timer-label">Tempo restante</span>
                                    <span
                                        className="break-alert-time"
                                        role="timer"
                                        aria-live="off"
                                        aria-label={`${secondsLeft} segundos restantes`}
                                    >
                                        {formatCountdown(secondsLeft)}
                                    </span>

                                    <div className="break-alert-progress-copy" aria-hidden="true">
                                        <span>Progresso da pausa</span>
                                        <strong>2 minutos</strong>
                                    </div>
                                    <div
                                        className="break-alert-progress"
                                        role="progressbar"
                                        aria-label="Progresso da pausa"
                                        aria-valuemin={0}
                                        aria-valuemax={BREAK_DURATION_SECONDS}
                                        aria-valuenow={elapsedSeconds}
                                        aria-valuetext={`${secondsLeft} segundos restantes`}
                                    >
                                        <div
                                            className="break-alert-progress-bar"
                                            style={{ width: progressWidth }}
                                        />
                                    </div>
                                </div>

                                <div className="break-alert-track" aria-live="polite">
                                    <span className="break-alert-track-icon" aria-hidden="true">
                                        <Volume2 size={15} />
                                    </span>
                                    <span className="break-alert-track-copy">
                                        <span>Trilha da pausa</span>
                                        <strong>{currentSong || 'Preparando a trilha sonora...'}</strong>
                                    </span>
                                    <span className="break-alert-equalizer" aria-hidden="true">
                                        <span />
                                        <span />
                                        <span />
                                    </span>
                                </div>
                            </>
                        ) : (
                            <div className="break-alert-return-note">
                                <span className="break-alert-return-note-icon" aria-hidden="true">
                                    <Activity size={17} />
                                </span>
                                <p>
                                    <strong>Seu painel está pronto</strong>
                                    Continue exatamente de onde parou, sem perder o contexto da operação.
                                </p>
                            </div>
                        )}

                        <button type="button" className="break-alert-action" onClick={dismiss}>
                            <ArrowLeft size={16} aria-hidden="true" />
                            {isBreak ? 'Voltar antes do tempo' : 'Voltar ao painel'}
                        </button>
                        <p className="break-alert-hint">Pressione Esc para fechar</p>
                    </div>
                </section>
            </div>

            <style>{overlayStyles}</style>
        </>
    );
}
