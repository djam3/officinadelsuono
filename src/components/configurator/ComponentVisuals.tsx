/**
 * Component Visuals — Illustrazioni SVG generate dai dati
 *
 * I componenti (driver e amplificatori) non hanno foto reali disponibili
 * (asset protetti dai produttori). Per garantire una resa sempre funzionante,
 * coerente col tema scuro e senza dipendenze esterne, generiamo illustrazioni
 * vettoriali in base ai dati reali di ciascun componente (tipo, dimensione,
 * magnete, canali, DSP).
 */

import React, { useState } from 'react';
import type { SpeakerDriver, Amplifier } from '../../types/speaker';

const ACCENT = '#F27D26';

// Una path immagine è "reale" se punta a un file caricato (non a un placeholder)
const hasRealPhoto = (src?: string): boolean =>
  !!src && src.trim().length > 0 && !src.includes('placehold') && !src.includes('USE_IMAGES_ARRAY');

// ─────────────────────────────────────────────────────────────────────────────
//  DRIVER / CONO SPEAKER
// ─────────────────────────────────────────────────────────────────────────────

export function DriverIllustration({
  driver,
  className = '',
  showLabel = true,
}: {
  driver: SpeakerDriver;
  className?: string;
  showLabel?: boolean;
}) {
  const uid = React.useId().replace(/:/g, '');
  const coneId = `cone-${uid}`;
  const basketId = `basket-${uid}`;
  const capId = `cap-${uid}`;
  const surroundId = `surround-${uid}`;

  const isNeo = (driver.magnetType || '').toLowerCase().includes('neo');
  // Numero di bulloni/fori di fissaggio proporzionale alla dimensione
  const boltCount = Math.min(8, Math.max(4, Math.round(driver.size / 2.4)));
  const bolts = Array.from({ length: boltCount }, (_, i) => {
    const angle = (i / boltCount) * Math.PI * 2 - Math.PI / 2;
    return {
      x: 110 + Math.cos(angle) * 97,
      y: 110 + Math.sin(angle) * 97,
    };
  });

  // Raggi dei tre elementi principali (in unità viewBox 220)
  const spokes = Array.from({ length: 6 }, (_, i) => {
    const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
    return {
      x: 110 + Math.cos(angle) * 68,
      y: 110 + Math.sin(angle) * 68,
    };
  });

  return (
    <svg
      viewBox="0 0 220 220"
      className={className}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={`${driver.brand} ${driver.model} — driver ${driver.size}"`}
    >
      <defs>
        <radialGradient id={basketId} cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#52555b" />
          <stop offset="55%" stopColor="#2b2d31" />
          <stop offset="100%" stopColor="#141517" />
        </radialGradient>
        <radialGradient id={surroundId} cx="42%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#2c2c2f" />
          <stop offset="100%" stopColor="#0d0d0e" />
        </radialGradient>
        <radialGradient id={coneId} cx="42%" cy="36%" r="75%">
          <stop offset="0%" stopColor="#3c3d41" />
          <stop offset="60%" stopColor="#1c1d20" />
          <stop offset="100%" stopColor="#0a0a0b" />
        </radialGradient>
        <radialGradient id={capId} cx="40%" cy="32%" r="80%">
          <stop offset="0%" stopColor={isNeo ? '#ffb877' : '#6a6d73'} />
          <stop offset="55%" stopColor={isNeo ? ACCENT : '#3a3c40'} />
          <stop offset="100%" stopColor={isNeo ? '#8a3d10' : '#161719'} />
        </radialGradient>
      </defs>

      {/* Basket / telaio esterno */}
      <circle cx="110" cy="110" r="105" fill={`url(#${basketId})`} />
      <circle cx="110" cy="110" r="105" fill="none" stroke="#000" strokeOpacity="0.5" strokeWidth="2" />
      <circle cx="110" cy="110" r="98" fill="none" stroke={ACCENT} strokeOpacity="0.18" strokeWidth="1.5" />

      {/* Fori di fissaggio */}
      {bolts.map((b, i) => (
        <g key={i}>
          <circle cx={b.x} cy={b.y} r="6" fill="#0a0a0b" />
          <circle cx={b.x} cy={b.y} r="6" fill="none" stroke="#5a5d63" strokeWidth="1.2" />
        </g>
      ))}

      {/* Surround (sospensione) */}
      <circle cx="110" cy="110" r="88" fill={`url(#${surroundId})`} />
      <circle cx="110" cy="110" r="88" fill="none" stroke="#000" strokeOpacity="0.6" strokeWidth="1.5" />

      {/* Cono */}
      <circle cx="110" cy="110" r="74" fill={`url(#${coneId})`} />

      {/* Razze del cestello (spokes) */}
      {spokes.map((s, i) => (
        <line
          key={i}
          x1="110"
          y1="110"
          x2={s.x}
          y2={s.y}
          stroke="#000"
          strokeOpacity="0.28"
          strokeWidth="3"
        />
      ))}

      {/* Dust cap centrale */}
      <circle cx="110" cy="110" r="30" fill={`url(#${capId})`} />
      <circle cx="110" cy="110" r="30" fill="none" stroke="#000" strokeOpacity="0.4" strokeWidth="1.5" />

      {showLabel && (
        <text
          x="110"
          y="110"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="22"
          fontWeight="800"
          fill={isNeo ? '#1a1a1a' : '#ffffff'}
          style={{ fontFamily: 'inherit' }}
        >
          {driver.size}&quot;
        </text>
      )}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  AMPLIFICATORE / MODULO CLASSE D
// ─────────────────────────────────────────────────────────────────────────────

export function AmpIllustration({
  amp,
  className = '',
}: {
  amp: Amplifier;
  className?: string;
}) {
  const uid = React.useId().replace(/:/g, '');
  const boardId = `board-${uid}`;
  const sinkId = `sink-${uid}`;

  // Numero di canali → numero di blocchi di uscita
  const outputs = Math.min(4, Math.max(1, amp.channels));
  const caps = Math.min(4, Math.max(2, Math.round((amp.powerPerChannel['4'] || 100) / 250) + 1));

  return (
    <svg
      viewBox="0 0 320 180"
      className={className}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={`${amp.brand} ${amp.model} — modulo amplificatore`}
    >
      <defs>
        <linearGradient id={boardId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#16241c" />
          <stop offset="100%" stopColor="#0c1611" />
        </linearGradient>
        <linearGradient id={sinkId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#6a6e74" />
          <stop offset="50%" stopColor="#3c3f44" />
          <stop offset="100%" stopColor="#23262a" />
        </linearGradient>
      </defs>

      {/* PCB */}
      <rect x="14" y="18" width="292" height="144" rx="10" fill={`url(#${boardId})`} />
      <rect x="14" y="18" width="292" height="144" rx="10" fill="none" stroke="#000" strokeOpacity="0.5" strokeWidth="2" />
      <rect x="14" y="18" width="292" height="144" rx="10" fill="none" stroke={ACCENT} strokeOpacity="0.15" strokeWidth="1" />

      {/* Tracce rame */}
      <path d="M40 150 H200 V120 H250" fill="none" stroke="#2e6b4d" strokeOpacity="0.5" strokeWidth="2" />
      <path d="M60 40 H180" fill="none" stroke="#2e6b4d" strokeOpacity="0.4" strokeWidth="2" />

      {/* Heatsink (dissipatore) con alette */}
      <rect x="26" y="34" width="58" height="112" rx="4" fill={`url(#${sinkId})`} />
      {Array.from({ length: 7 }, (_, i) => (
        <line
          key={i}
          x1={34 + i * 7}
          y1="38"
          x2={34 + i * 7}
          y2="142"
          stroke="#1c1e21"
          strokeWidth="2"
        />
      ))}

      {/* Chip principale (modulo di potenza) */}
      <rect x="104" y="62" width="52" height="52" rx="4" fill="#0a0a0b" stroke="#3a3c40" strokeWidth="1.5" />
      {Array.from({ length: 6 }, (_, i) => (
        <line key={`l${i}`} x1="100" y1={68 + i * 8} x2="104" y2={68 + i * 8} stroke="#5a5d63" strokeWidth="1.5" />
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <line key={`r${i}`} x1="156" y1={68 + i * 8} x2="160" y2={68 + i * 8} stroke="#5a5d63" strokeWidth="1.5" />
      ))}

      {/* DSP chip se presente */}
      {amp.hasDSP && (
        <g>
          <rect x="104" y="126" width="52" height="24" rx="3" fill="#0a0a0b" stroke={ACCENT} strokeOpacity="0.5" strokeWidth="1.2" />
          <text x="130" y="138" textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="700" fill={ACCENT} style={{ fontFamily: 'inherit' }}>
            DSP
          </text>
        </g>
      )}

      {/* Condensatori */}
      {Array.from({ length: caps }, (_, i) => (
        <g key={i}>
          <rect x={184 + i * 22} y="44" width="16" height="40" rx="8" fill="#1a1c1f" stroke="#000" strokeOpacity="0.4" strokeWidth="1" />
          <ellipse cx={192 + i * 22} cy="44" rx="8" ry="3.5" fill="#2c2f33" />
          <line x1={188 + i * 22} y1="44" x2={196 + i * 22} y2="44" stroke={ACCENT} strokeOpacity="0.5" strokeWidth="1.2" />
        </g>
      ))}

      {/* Morsettiera uscite (canali) */}
      {Array.from({ length: outputs }, (_, i) => (
        <g key={i}>
          <rect x={188 + i * 28} y="116" width="24" height="34" rx="3" fill="#16241c" stroke="#2e6b4d" strokeWidth="1.2" />
          <circle cx={200 + i * 28} cy="127" r="4" fill="#0a0a0b" stroke="#5a5d63" strokeWidth="1" />
          <circle cx={200 + i * 28} cy="140" r="4" fill="#0a0a0b" stroke="#5a5d63" strokeWidth="1" />
        </g>
      ))}

      {/* LED di stato */}
      <circle cx="290" cy="32" r="4" fill={ACCENT}>
        <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  WRAPPER IBRIDI — foto reale se disponibile, altrimenti illustrazione SVG
//  Quando saranno caricate le foto originali (licenziate) in
//  public/configurator/drivers/ e public/configurator/amps/ con i nomi file
//  definiti in speakerDatabase.ts, verranno mostrate automaticamente.
//  Finché un file manca o non carica, si ripiega sull'illustrazione vettoriale.
// ─────────────────────────────────────────────────────────────────────────────

export function DriverVisual({
  driver,
  className = '',
  showLabel = true,
}: {
  driver: SpeakerDriver;
  className?: string;
  showLabel?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (!hasRealPhoto(driver.image) || failed) {
    return <DriverIllustration driver={driver} className={className} showLabel={showLabel} />;
  }

  return (
    <img
      src={driver.image}
      alt={`${driver.brand} ${driver.model}`}
      loading="lazy"
      className={`${className} object-contain`}
      onError={() => setFailed(true)}
    />
  );
}

export function AmpVisual({
  amp,
  className = '',
}: {
  amp: Amplifier;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!hasRealPhoto(amp.image) || failed) {
    return <AmpIllustration amp={amp} className={className} />;
  }

  return (
    <img
      src={amp.image}
      alt={`${amp.brand} ${amp.model}`}
      loading="lazy"
      className={`${className} object-contain`}
      onError={() => setFailed(true)}
    />
  );
}
