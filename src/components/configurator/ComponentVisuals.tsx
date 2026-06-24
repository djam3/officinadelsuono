/**
 * Component Visuals — Rappresentazioni dei componenti
 *
 * Se è disponibile una FOTO reale (campo `image` del componente → file in
 * public/configurator/...), viene mostrata. Altrimenti si genera una
 * illustrazione vettoriale FOTO-REALISTICA e specifica per tipo (cono per
 * woofer/sub/medio, tromba per driver a compressione, cupola per tweeter,
 * piastra per amplificatori). Resa "da studio": sfondo, riflessi, ombra.
 */

import React, { useState } from 'react';
import type { SpeakerDriver, Amplifier } from '../../types/speaker';

const ACCENT = '#F27D26';

// Una path immagine è "reale" se punta a un file caricato (non a un placeholder)
const hasRealPhoto = (src?: string): boolean =>
  !!src && src.trim().length > 0 && !src.includes('placehold') && !src.includes('USE_IMAGES_ARRAY');

// ─── Sfondo "studio" + ombra morbida condivisi (resa fotografica) ────────────
function StudioBackdrop({ id, cx = 110, cy = 118, rx = 96, ry = 22 }: { id: string; cx?: number; cy?: number; rx?: number; ry?: number }) {
  return (
    <>
      <defs>
        <radialGradient id={`bg-${id}`} cx="50%" cy="38%" r="75%">
          <stop offset="0%" stopColor="#26282d" />
          <stop offset="60%" stopColor="#161719" />
          <stop offset="100%" stopColor="#0a0a0b" />
        </radialGradient>
        <radialGradient id={`sh-${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="220" height="220" fill={`url(#bg-${id})`} />
      <ellipse cx={cx} cy={cy + 78} rx={rx} ry={ry} fill={`url(#sh-${id})`} />
    </>
  );
}

// ─── Driver a CONO (woofer / subwoofer / medio / coassiale) ──────────────────
function ConeDriverArt({ driver, uid, showLabel }: { driver: SpeakerDriver; uid: string; showLabel: boolean }) {
  const isNeo = (driver.magnetType || '').toLowerCase().includes('neo');
  const isCoax = driver.type === 'coaxial';
  const boltCount = Math.min(8, Math.max(4, Math.round(driver.size / 2.4)));
  const bolts = Array.from({ length: boltCount }, (_, i) => {
    const a = (i / boltCount) * Math.PI * 2 - Math.PI / 2;
    return { x: 110 + Math.cos(a) * 99, y: 110 + Math.sin(a) * 99 };
  });
  const grooves = [70, 62, 54, 46]; // solchi concentrici del cono

  return (
    <>
      <StudioBackdrop id={uid} />
      <defs>
        <radialGradient id={`basket-${uid}`} cx="40%" cy="32%" r="80%">
          <stop offset="0%" stopColor="#6b6e74" />
          <stop offset="45%" stopColor="#3a3c41" />
          <stop offset="100%" stopColor="#101113" />
        </radialGradient>
        <radialGradient id={`gasket-${uid}`} cx="42%" cy="34%" r="75%">
          <stop offset="0%" stopColor="#2a2b2e" />
          <stop offset="100%" stopColor="#0c0c0d" />
        </radialGradient>
        <radialGradient id={`surround-${uid}`} cx="42%" cy="32%" r="72%">
          <stop offset="0%" stopColor="#3a3b3f" />
          <stop offset="55%" stopColor="#202124" />
          <stop offset="100%" stopColor="#0a0a0b" />
        </radialGradient>
        <radialGradient id={`cone-${uid}`} cx="43%" cy="36%" r="78%">
          <stop offset="0%" stopColor="#42444a" />
          <stop offset="58%" stopColor="#1e1f23" />
          <stop offset="100%" stopColor="#08090a" />
        </radialGradient>
        <radialGradient id={`cap-${uid}`} cx="40%" cy="30%" r="82%">
          <stop offset="0%" stopColor={isNeo ? '#ffce9c' : '#7c7f86'} />
          <stop offset="50%" stopColor={isNeo ? ACCENT : '#42444a'} />
          <stop offset="100%" stopColor={isNeo ? '#7a350e' : '#121315'} />
        </radialGradient>
        {/* riflesso speculare da luce studio (alto-sinistra) */}
        <radialGradient id={`spec-${uid}`} cx="35%" cy="28%" r="45%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
          <stop offset="40%" stopColor="#ffffff" stopOpacity="0.10" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Cestello fuso */}
      <circle cx="110" cy="110" r="104" fill={`url(#basket-${uid})`} />
      <circle cx="110" cy="110" r="104" fill="none" stroke="#000" strokeOpacity="0.55" strokeWidth="2" />
      <circle cx="110" cy="110" r="96" fill={`url(#gasket-${uid})`} />

      {/* Bulloni di fissaggio (testa metallica con luce) */}
      {bolts.map((b, i) => (
        <g key={i}>
          <circle cx={b.x} cy={b.y} r="5.5" fill="#0a0a0b" />
          <circle cx={b.x - 1} cy={b.y - 1} r="2.4" fill="#9aa0a8" opacity="0.7" />
        </g>
      ))}

      {/* Sospensione (roll surround) lucida */}
      <circle cx="110" cy="110" r="86" fill={`url(#surround-${uid})`} />
      <circle cx="110" cy="110" r="86" fill="none" stroke="#000" strokeOpacity="0.5" strokeWidth="1.5" />

      {/* Cono */}
      <circle cx="110" cy="110" r="72" fill={`url(#cone-${uid})`} />
      {grooves.map((r) => (
        <circle key={r} cx="110" cy="110" r={r} fill="none" stroke="#000" strokeOpacity="0.18" strokeWidth="1" />
      ))}

      {/* Dust cap / centro */}
      {isCoax ? (
        <>
          <circle cx="110" cy="110" r="34" fill="#0c0c0d" />
          <circle cx="110" cy="110" r="30" fill={`url(#cap-${uid})`} />
          <circle cx="110" cy="110" r="10" fill="#0a0a0b" />
        </>
      ) : (
        <>
          <circle cx="110" cy="110" r="30" fill={`url(#cap-${uid})`} />
          <circle cx="110" cy="110" r="30" fill="none" stroke="#000" strokeOpacity="0.4" strokeWidth="1.5" />
        </>
      )}

      {/* Riflesso speculare (sopra tutto) */}
      <circle cx="110" cy="110" r="86" fill={`url(#spec-${uid})`} />

      {showLabel && (
        <text x="110" y="186" textAnchor="middle" fontSize="15" fontWeight="800" fill="#e8e8ea" style={{ fontFamily: 'inherit' }}>
          {driver.size}&quot; {driver.type === 'subwoofer' ? 'SUB' : ''}
        </text>
      )}
    </>
  );
}

// ─── Driver a COMPRESSIONE + TROMBA (HF) ─────────────────────────────────────
function HornArt({ driver, uid }: { driver: SpeakerDriver; uid: string }) {
  return (
    <>
      <StudioBackdrop id={uid} ry={18} />
      <defs>
        <linearGradient id={`horn-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4c4f55" />
          <stop offset="50%" stopColor="#2a2c30" />
          <stop offset="100%" stopColor="#0e0f11" />
        </linearGradient>
        <radialGradient id={`throat-${uid}`} cx="50%" cy="42%" r="60%">
          <stop offset="0%" stopColor="#3a3c42" />
          <stop offset="70%" stopColor="#141518" />
          <stop offset="100%" stopColor="#000" />
        </radialGradient>
        <linearGradient id={`mag-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5a5d63" />
          <stop offset="100%" stopColor="#202225" />
        </linearGradient>
        <radialGradient id={`hspec-${uid}`} cx="34%" cy="24%" r="55%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Tromba: bocca rettangolare svasata */}
      <polygon points="26,52 194,52 168,168 52,168" fill={`url(#horn-${uid})`} stroke="#000" strokeOpacity="0.5" strokeWidth="2" />
      {/* pareti interne (profondità) */}
      <polygon points="62,72 158,72 142,150 78,150" fill="#141518" />
      <polygon points="62,72 158,72 142,150 78,150" fill="none" stroke="#000" strokeOpacity="0.5" strokeWidth="1.5" />
      {/* gola centrale */}
      <ellipse cx="110" cy="112" rx="26" ry="26" fill={`url(#throat-${uid})`} />
      <ellipse cx="110" cy="112" rx="10" ry="10" fill="#000" />
      {/* motore a compressione dietro (accennato) */}
      <ellipse cx="110" cy="112" rx="40" ry="14" fill={`url(#mag-${uid})`} opacity="0.0" />
      {/* riflesso */}
      <polygon points="26,52 194,52 168,168 52,168" fill={`url(#hspec-${uid})`} />
      <text x="110" y="190" textAnchor="middle" fontSize="13" fontWeight="800" fill="#e8e8ea" style={{ fontFamily: 'inherit' }}>
        DRIVER A COMPRESSIONE
      </text>
    </>
  );
}

// ─── TWEETER a cupola ────────────────────────────────────────────────────────
function DomeTweeterArt({ driver, uid }: { driver: SpeakerDriver; uid: string }) {
  const bolts = Array.from({ length: 4 }, (_, i) => {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    return { x: 110 + Math.cos(a) * 86, y: 110 + Math.sin(a) * 86 };
  });
  return (
    <>
      <StudioBackdrop id={uid} />
      <defs>
        <radialGradient id={`plate-${uid}`} cx="40%" cy="32%" r="80%">
          <stop offset="0%" stopColor="#54575d" />
          <stop offset="55%" stopColor="#2c2e32" />
          <stop offset="100%" stopColor="#101113" />
        </radialGradient>
        <radialGradient id={`dome-${uid}`} cx="38%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#f3d8b8" />
          <stop offset="45%" stopColor={ACCENT} />
          <stop offset="100%" stopColor="#6e2f0c" />
        </radialGradient>
        <radialGradient id={`tspec-${uid}`} cx="36%" cy="28%" r="50%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* flangia quadrata arrotondata */}
      <rect x="22" y="22" width="176" height="176" rx="26" fill={`url(#plate-${uid})`} stroke="#000" strokeOpacity="0.5" strokeWidth="2" />
      {bolts.map((b, i) => (
        <g key={i}><circle cx={b.x} cy={b.y} r="6" fill="#0a0a0b" /><circle cx={b.x - 1} cy={b.y - 1} r="2.4" fill="#9aa0a8" opacity="0.7" /></g>
      ))}
      {/* corona / waveguide */}
      <circle cx="110" cy="110" r="64" fill="#0d0d0e" />
      <circle cx="110" cy="110" r="64" fill="none" stroke="#000" strokeOpacity="0.5" strokeWidth="1.5" />
      {/* cupola */}
      <circle cx="110" cy="110" r="44" fill={`url(#dome-${uid})`} />
      <circle cx="110" cy="110" r="44" fill={`url(#tspec-${uid})`} />
      <circle cx="110" cy="110" r="44" fill="none" stroke="#000" strokeOpacity="0.3" strokeWidth="1" />
    </>
  );
}

// ─── Dispatcher illustrazione driver per tipo ────────────────────────────────
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
  const t = driver.type;
  return (
    <svg viewBox="0 0 220 220" className={className} preserveAspectRatio="xMidYMid meet" role="img"
      aria-label={`${driver.brand} ${driver.model}`}>
      {t === 'compression-driver'
        ? <HornArt driver={driver} uid={uid} />
        : t === 'tweeter'
        ? <DomeTweeterArt driver={driver} uid={uid} />
        : <ConeDriverArt driver={driver} uid={uid} showLabel={showLabel} />}
    </svg>
  );
}

// ─── AMPLIFICATORE — modulo a piastra (vista prodotto) ───────────────────────
export function AmpIllustration({
  amp,
  className = '',
}: {
  amp: Amplifier;
  className?: string;
}) {
  const uid = React.useId().replace(/:/g, '');
  const fins = 9;

  return (
    <svg viewBox="0 0 320 180" className={className} preserveAspectRatio="xMidYMid meet" role="img"
      aria-label={`${amp.brand} ${amp.model} — modulo amplificatore`}>
      <defs>
        <radialGradient id={`abg-${uid}`} cx="50%" cy="35%" r="80%">
          <stop offset="0%" stopColor="#222428" />
          <stop offset="100%" stopColor="#0a0a0b" />
        </radialGradient>
        <linearGradient id={`plate-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a3d42" />
          <stop offset="50%" stopColor="#26282c" />
          <stop offset="100%" stopColor="#15161a" />
        </linearGradient>
        <linearGradient id={`sink-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#74787e" />
          <stop offset="50%" stopColor="#3c3f44" />
          <stop offset="100%" stopColor="#202327" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="320" height="180" fill={`url(#abg-${uid})`} />
      <ellipse cx="160" cy="158" rx="120" ry="14" fill="#000" opacity="0.4" />

      {/* Piastra metallica del modulo */}
      <rect x="34" y="20" width="252" height="140" rx="9" fill={`url(#plate-${uid})`} stroke="#000" strokeOpacity="0.5" strokeWidth="2" />
      <rect x="34" y="20" width="252" height="140" rx="9" fill="none" stroke="#fff" strokeOpacity="0.06" strokeWidth="1" />

      {/* Dissipatore con alette (parte alta) */}
      <rect x="48" y="32" width="150" height="56" rx="4" fill={`url(#sink-${uid})`} />
      {Array.from({ length: fins }, (_, i) => (
        <line key={i} x1={56 + i * 16} y1="36" x2={56 + i * 16} y2="84" stroke="#15161a" strokeWidth="3" />
      ))}

      {/* Display/etichetta DSP */}
      {amp.hasDSP && (
        <g>
          <rect x="212" y="32" width="60" height="34" rx="4" fill="#06120c" stroke={ACCENT} strokeOpacity="0.5" strokeWidth="1.2" />
          <text x="242" y="50" textAnchor="middle" dominantBaseline="central" fontSize="13" fontWeight="800" fill={ACCENT} style={{ fontFamily: 'inherit' }}>DSP</text>
        </g>
      )}

      {/* Presa IEC */}
      <rect x="50" y="104" width="48" height="34" rx="3" fill="#08080a" stroke="#4a4d52" strokeWidth="1.5" />
      <rect x="60" y="116" width="28" height="12" rx="2" fill="#1a1c1f" />

      {/* Connettori uscita (Speakon) */}
      {Array.from({ length: Math.min(2, Math.max(1, amp.channels)) }, (_, i) => (
        <g key={i}>
          <circle cx={140 + i * 46} cy="120" r="17" fill="#0a0a0b" stroke="#4a4d52" strokeWidth="2" />
          <circle cx={140 + i * 46} cy="120" r="7" fill="#1a1c1f" />
        </g>
      ))}

      {/* LED stato */}
      <circle cx="266" cy="120" r="5" fill={ACCENT}>
        <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  WRAPPER IBRIDI — foto reale se disponibile, altrimenti illustrazione
//  Quando saranno caricate le foto (in public/configurator/... coi nomi di
//  speakerDatabase.ts, oppure via Admin › Componenti) verranno mostrate.
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
