import React, { useMemo, Suspense, useState, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, RoundedBox, ContactShadows, Environment, Lightformer, MeshReflectorMaterial, Float } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, SMAA } from '@react-three/postprocessing';
import { Layers, Box as BoxIcon } from 'lucide-react';
import * as THREE from 'three';
import { CabinetDesign } from '../../types/speaker';

interface CabinetViewer3DProps {
  cabinet: CabinetDesign;
  showDimensions?: boolean;
  exploded?: boolean;
  /** Mostra il pulsante toggle "vista esplosa" nell'overlay */
  allowExplode?: boolean;
  /** Ref popolato col renderer WebGL per catturare screenshot (PDF/PNG) */
  glRef?: React.MutableRefObject<THREE.WebGLRenderer | null>;
}

// Ponte per esporre il renderer al parent (cattura immagine per il PDF)
const CaptureBridge = ({ glRef }: { glRef?: React.MutableRefObject<THREE.WebGLRenderer | null> }) => {
  const { gl } = useThree();
  React.useEffect(() => {
    if (glRef) glRef.current = gl;
  }, [gl, glRef]);
  return null;
};

const ACCENT = '#F27D26';

// ─── Texture procedurale: finitura nera testurizzata (bump) ──────────────────
const createTexturedBump = () => {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, size, size);
    // grana fine tipo vernice a buccia d'arancia
    for (let i = 0; i < 14000; i++) {
      const v = 110 + Math.random() * 90;
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      const r = Math.random() * 1.6 + 0.4;
      ctx.beginPath();
      ctx.arc(Math.random() * size, Math.random() * size, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  return texture;
};

// ─── Texture procedurale: venatura legno (color map per finitura naturale) ───
const createWoodTexture = () => {
  const w = 512, h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // base legno chiaro (betulla/multistrato)
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#c79a68');
    grad.addColorStop(0.5, '#b8895a');
    grad.addColorStop(1, '#a87a4d');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    // venature verticali ondulate
    for (let i = 0; i < 90; i++) {
      const x = Math.random() * w;
      const amp = 4 + Math.random() * 12;
      const tone = 90 + Math.random() * 70;
      ctx.strokeStyle = `rgba(${tone - 30},${tone - 55},${tone - 80},${0.06 + Math.random() * 0.12})`;
      ctx.lineWidth = 0.5 + Math.random() * 2.2;
      ctx.beginPath();
      for (let y = 0; y <= h; y += 8) {
        const xx = x + Math.sin((y / h) * Math.PI * (1 + Math.random())) * amp;
        y === 0 ? ctx.moveTo(xx, y) : ctx.lineTo(xx, y);
      }
      ctx.stroke();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.5, 1.5);
  return texture;
};

// ─── Mappa finitura → parametri materiale del corpo cassa ────────────────────
interface FinishStyle {
  color: string;
  baffleColor: string;
  roughness: number;
  metalness: number;
  useWood: boolean;
}
const FINISH_STYLES: Record<string, FinishStyle> = {
  natural: { color: '#b8895a', baffleColor: '#8a6038', roughness: 0.72, metalness: 0.05, useWood: true },
  black:   { color: '#191a1d', baffleColor: '#0f1012', roughness: 0.82, metalness: 0.14, useWood: false },
  white:   { color: '#e9e9ec', baffleColor: '#cfd0d4', roughness: 0.55, metalness: 0.10, useWood: false },
};
const resolveFinish = (finish?: string): FinishStyle => {
  const f = (finish || '').toLowerCase();
  if (f.includes('natural') || f.includes('legno')) return FINISH_STYLES.natural;
  if (f.includes('white') || f.includes('bianc')) return FINISH_STYLES.white;
  return FINISH_STYLES.black;
};

// ─── Driver 3D realistico (cestello, sospensione, cono, dust cap, bulloni) ───
const Driver3D = ({
  mountRadius,
  boltCount,
  z,
}: {
  mountRadius: number; // raggio foro di montaggio (m)
  boltCount: number;
  z: number;           // z della superficie del baffle (m)
}) => {
  const r = mountRadius;
  const bolts = useMemo(
    () =>
      Array.from({ length: boltCount }, (_, i) => {
        const a = (i / boltCount) * Math.PI * 2;
        return [Math.cos(a) * r * 1.0, Math.sin(a) * r * 1.0] as [number, number];
      }),
    [boltCount, r]
  );

  return (
    <group position={[0, 0, z]}>
      {/* Flangia / cestello esterno (anello metallico) */}
      <mesh position={[0, 0, -0.002]}>
        <torusGeometry args={[r * 1.03, r * 0.07, 16, 48]} />
        <meshStandardMaterial color="#3a3c40" roughness={0.35} metalness={0.85} />
      </mesh>

      {/* Anello di base del cestello */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.01]}>
        <cylinderGeometry args={[r * 1.0, r * 0.98, 0.016, 48, 1, true]} />
        <meshStandardMaterial color="#1c1d20" roughness={0.5} metalness={0.6} side={THREE.DoubleSide} />
      </mesh>

      {/* Bulloni di fissaggio */}
      {bolts.map(([bx, by], i) => (
        <mesh key={i} position={[bx, by, 0.001]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[r * 0.05, r * 0.05, 0.01, 6]} />
          <meshStandardMaterial color="#0e0e10" roughness={0.4} metalness={0.9} />
        </mesh>
      ))}

      {/* Sospensione in gomma (surround) */}
      <mesh position={[0, 0, -0.008]}>
        <torusGeometry args={[r * 0.82, r * 0.12, 16, 48]} />
        <meshStandardMaterial color="#0b0b0c" roughness={0.85} metalness={0.05} />
      </mesh>

      {/* Cono (tronco di cono che rientra nella cassa) */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.008 - r * 0.34]}>
        <cylinderGeometry args={[r * 0.18, r * 0.74, r * 0.68, 48, 1, true]} />
        <meshStandardMaterial color="#222327" roughness={0.55} metalness={0.25} side={THREE.DoubleSide} />
      </mesh>

      {/* Dust cap (cupola centrale) */}
      <mesh position={[0, 0, -0.012]}>
        <sphereGeometry args={[r * 0.26, 32, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#2a2c30" roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Anello accento attorno al dust cap */}
      <mesh position={[0, 0, -0.013]}>
        <torusGeometry args={[r * 0.27, r * 0.012, 12, 40]} />
        <meshStandardMaterial color={ACCENT} roughness={0.4} metalness={0.5} emissive={ACCENT} emissiveIntensity={0.15} />
      </mesh>
    </group>
  );
};

// ─── Condotto bass-reflex svasato ─────────────────────────────────────────────
const Port3D = ({ radius, length, z }: { radius: number; length: number; z: number }) => {
  return (
    <group position={[0, 0, z]}>
      {/* Svasatura anteriore */}
      <mesh position={[0, 0, 0]}>
        <torusGeometry args={[radius, radius * 0.14, 16, 40]} />
        <meshStandardMaterial color="#0c0c0d" roughness={0.6} metalness={0.2} />
      </mesh>
      {/* Tubo interno */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -length / 2]}>
        <cylinderGeometry args={[radius, radius, length, 40, 1, true]} />
        <meshStandardMaterial color="#08080a" roughness={0.7} metalness={0.1} side={THREE.DoubleSide} />
      </mesh>
      {/* Fondo scuro */}
      <mesh position={[0, 0, -length]}>
        <circleGeometry args={[radius, 40]} />
        <meshStandardMaterial color="#050506" roughness={0.9} />
      </mesh>
    </group>
  );
};

// ─── Piastra connettori / amplificatore sul retro ────────────────────────────
const RearPanel3D = ({
  hasAmp,
  z,
  y,
}: {
  hasAmp: boolean;
  z: number; // z della faccia posteriore (m)
  y: number;
}) => {
  return (
    <group position={[0, y, z]}>
      {/* Piastra incassata */}
      <mesh position={[0, 0, -0.002]}>
        <boxGeometry args={[0.18, hasAmp ? 0.16 : 0.11, 0.008]} />
        <meshStandardMaterial color="#0d0d0f" roughness={0.6} metalness={0.4} />
      </mesh>

      {hasAmp ? (
        <>
          {/* Dissipatore con alette */}
          {Array.from({ length: 6 }, (_, i) => (
            <mesh key={i} position={[-0.06 + i * 0.024, 0.045, -0.006]}>
              <boxGeometry args={[0.012, 0.055, 0.012]} />
              <meshStandardMaterial color="#46494e" roughness={0.4} metalness={0.8} />
            </mesh>
          ))}
          {/* Presa IEC */}
          <mesh position={[0.045, -0.04, -0.006]}>
            <boxGeometry args={[0.05, 0.03, 0.008]} />
            <meshStandardMaterial color="#050506" roughness={0.7} />
          </mesh>
          {/* Connettore XLR / Speakon */}
          <mesh position={[-0.05, -0.04, -0.008]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.018, 0.018, 0.01, 24]} />
            <meshStandardMaterial color="#1a1b1e" roughness={0.4} metalness={0.7} />
          </mesh>
        </>
      ) : (
        <>
          {/* Connettore Speakon */}
          <mesh position={[0, 0.012, -0.006]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.024, 0.024, 0.012, 28]} />
            <meshStandardMaterial color="#1a1b1e" roughness={0.4} metalness={0.7} />
          </mesh>
          <mesh position={[0, 0.012, -0.012]}>
            <circleGeometry args={[0.016, 24]} />
            <meshStandardMaterial color="#08080a" roughness={0.8} />
          </mesh>
          {/* Etichetta accento */}
          <mesh position={[0, -0.035, -0.0065]}>
            <boxGeometry args={[0.09, 0.012, 0.002]} />
            <meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={0.2} roughness={0.5} />
          </mesh>
        </>
      )}
    </group>
  );
};

// ─── Modello completo della cassa ─────────────────────────────────────────────
const CabinetModel = ({ cabinet, exploded = false }: { cabinet: CabinetDesign; exploded?: boolean }) => {
  const bumpTex = useMemo(() => createTexturedBump(), []);
  const woodTex = useMemo(() => createWoodTexture(), []);
  const finish = resolveFinish(cabinet.finish);

  const w = cabinet.externalDimensions.width / 1000;
  const h = cabinet.externalDimensions.height / 1000;
  const d = cabinet.externalDimensions.depth / 1000;
  const wt = cabinet.woodThickness / 1000;

  // Posizioni driver e porte dai dati dei pannelli
  const front = cabinet.panels.find((p) => p.id === 'front');
  const driverHole = front?.holes?.find((hh) => hh.type === 'driver');
  const portHoles = front?.holes?.filter((hh) => hh.type === 'port') ?? [];

  const heightMm = cabinet.externalDimensions.height;
  const widthMm = cabinet.externalDimensions.width;
  const wtMm = cabinet.woodThickness;
  const internalWmm = widthMm - 2 * wtMm;

  const hasFrontPorts = (front?.holes?.filter((hh) => hh.type === 'port').length ?? 0) > 0;
  const driverRraw = ((driverHole?.diameter ?? cabinet.driverCutout.diameter) / 2) / 1000;
  // Clamp: il driver non deve mai eccedere il baffle. Se ci sono porte frontali
  // lascia spazio sotto, quindi lo limita un filo di più.
  const baffleMaxR = (Math.min(w, h) / 2) * (hasFrontPorts ? 0.82 : 0.9);
  const driverR = Math.min(driverRraw, baffleMaxR);
  // Con porte frontali, alza il driver per liberare la fila inferiore.
  let driverY = hasFrontPorts ? (h * 0.5 - driverR - 0.02) : (driverHole ? (-heightMm / 2 + wtMm + driverHole.y) / 1000 : h * 0.06);
  // Mantieni il driver interamente dentro l'altezza della cassa
  const driverYLimit = h / 2 - driverR - 0.006;
  driverY = Math.max(-driverYLimit, Math.min(driverYLimit, driverY));

  const portLen = cabinet.port?.length ? Math.min(cabinet.port.length / 1000, d * 0.7) : 0.1;

  // Disposizione porte: fila ordinata lungo il bordo inferiore del baffle.
  // Raggio "visivo" limitato così N porte stanno in fila senza accavallarsi
  // né invadere il driver (le specifiche reali sono nei dati/PDF).
  const nPorts = portHoles.length;
  const ports = (() => {
    if (nPorts === 0) return [] as { px: number; py: number; pr: number }[];
    const realPr = portHoles[0].diameter ? (portHoles[0].diameter / 2) / 1000 : 0.04;
    const gap = 0.012;
    // raggio massimo che fa stare nPorts in fila nell'85% della larghezza
    const fitPr = ((w * 0.85) / nPorts) / 2 - gap;
    const pr = Math.max(0.018, Math.min(realPr, fitPr, h * 0.13));
    const rowY = (-h / 2) + pr + 0.018; // appena sopra il bordo inferiore
    const totalW = nPorts * (2 * pr) + (nPorts - 1) * gap;
    const startX = -totalW / 2 + pr;
    return portHoles.map((_, i) => ({
      px: startX + i * (2 * pr + gap),
      py: rowY,
      pr,
    }));
  })();
  const rearHasAmp = !!cabinet.ampCutout;

  const bevel = Math.min(w, h, d) * 0.025;
  const footR = Math.min(w, d) * 0.05;
  const footH = 0.012;

  const footPositions: [number, number, number][] = [
    [w / 2 - footR * 1.6, -h / 2 - footH / 2, d / 2 - footR * 1.6],
    [-w / 2 + footR * 1.6, -h / 2 - footH / 2, d / 2 - footR * 1.6],
    [w / 2 - footR * 1.6, -h / 2 - footH / 2, -d / 2 + footR * 1.6],
    [-w / 2 + footR * 1.6, -h / 2 - footH / 2, -d / 2 + footR * 1.6],
  ];

  // Vista esplosa: componenti frontali avanti, piastra posteriore indietro
  const exF = exploded ? d * 0.55 : 0; // offset avanti (driver/porte/badge)
  const exR = exploded ? d * 0.55 : 0; // offset indietro (piastra retro)

  return (
    <group>
      {/* Corpo cassa — materiale fisico con clearcoat (effetto laccato premium) */}
      <RoundedBox args={[w, h, d]} radius={bevel} smoothness={4} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={finish.color}
          roughness={finish.roughness}
          metalness={finish.metalness}
          map={finish.useWood ? woodTex : undefined}
          bumpMap={finish.useWood ? woodTex : bumpTex}
          bumpScale={finish.useWood ? 0.004 : 0.0018}
          clearcoat={finish.useWood ? 0.2 : 0.7}
          clearcoatRoughness={finish.useWood ? 0.5 : 0.28}
          envMapIntensity={1.1}
        />
      </RoundedBox>

      {/* Baffle frontale leggermente ribassato per profondità visiva */}
      <mesh position={[0, 0, d / 2 + 0.0008]}>
        <planeGeometry args={[w - bevel * 2, h - bevel * 2]} />
        <meshStandardMaterial color={finish.baffleColor} roughness={0.7} metalness={finish.metalness + 0.04} />
      </mesh>

      {/* Driver */}
      <group position={[0, driverY, exF]}>
        <Driver3D mountRadius={driverR} boltCount={cabinet.driverCutout.boltCount} z={d / 2 + 0.004} />
      </group>

      {/* Porte bass-reflex (una o più) */}
      {ports.map((p, i) => (
        <group key={i} position={[p.px, p.py, exF * 0.6]}>
          <Port3D radius={p.pr} length={portLen} z={d / 2 + 0.002} />
        </group>
      ))}

      {/* Badge brand sul baffle */}
      <mesh position={[0, -h / 2 + bevel + 0.018, d / 2 + 0.003 + exF]}>
        <boxGeometry args={[Math.min(w * 0.22, 0.13), 0.006, 0.002]} />
        <meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={0.18} roughness={0.5} metalness={0.3} />
      </mesh>

      {/* Piastra posteriore */}
      <RearPanel3D hasAmp={rearHasAmp} z={-d / 2 - 0.001 - exR} y={-h * 0.12} />

      {/* Piedini */}
      {footPositions.map((p, i) => (
        <mesh key={i} position={p}>
          <cylinderGeometry args={[footR, footR * 1.05, footH, 24]} />
          <meshStandardMaterial color="#050506" roughness={0.9} metalness={0.1} />
        </mesh>
      ))}
    </group>
  );
};

// ─── Verifica supporto WebGL ──────────────────────────────────────────────────
const isWebGLAvailable = (): boolean => {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
};

// ─── Fallback 2D se WebGL non disponibile ─────────────────────────────────────
const CabinetFallback2D = ({ cabinet }: { cabinet: CabinetDesign }) => {
  const { width, height, depth } = cabinet.externalDimensions;
  return (
    <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center gap-4 p-8">
      <svg viewBox="0 0 200 200" className="w-48 h-48 drop-shadow-2xl">
        <polygon points="40,60 140,60 140,170 40,170" fill="#191a1d" stroke="#3a3c40" strokeWidth="2" />
        <polygon points="40,60 70,35 170,35 140,60" fill="#222327" stroke="#3a3c40" strokeWidth="2" />
        <polygon points="140,60 170,35 170,145 140,170" fill="#0f1012" stroke="#3a3c40" strokeWidth="2" />
        <circle cx="90" cy="115" r="32" fill="#0a0a0b" stroke={ACCENT} strokeOpacity="0.5" strokeWidth="2" />
        {cabinet.port && <circle cx="90" cy="158" r="6" fill="#000" />}
      </svg>
      <div className="text-center">
        <div className="text-sm font-bold text-white">{cabinet.name}</div>
        <div className="text-xs text-zinc-400 font-mono mt-1">{width} × {height} × {depth} mm</div>
      </div>
    </div>
  );
};

// ─── Reveal + showcase: entra in scala e poi oscilla dolcemente attorno al
//     fronte (mostra sempre il driver, mai il retro spoglio) ──────────────────
const RevealGroup = ({ children, sway = true }: { children: React.ReactNode; sway?: boolean }) => {
  const ref = useRef<THREE.Group>(null);
  const t = useRef(0);
  useFrame((_, delta) => {
    if (!ref.current) return;
    t.current += delta;
    const intro = Math.min(1, t.current / 0.9);
    const e = 1 - Math.pow(1 - intro, 3); // ease-out cubic
    ref.current.scale.setScalar(0.82 + 0.18 * e);
    // oscillazione lieve (~7°) attorno al fronte: vita senza nascondere il driver
    const swayAngle = sway ? Math.sin(t.current * 0.5) * 0.12 : 0;
    ref.current.rotation.y = (1 - e) * -0.35 + swayAngle * e;
  });
  return <group ref={ref}>{children}</group>;
};

// ─── Spotlight da palco con cono morbido ──────────────────────────────────────
const StageLight = ({ y }: { y: number }) => {
  const target = useMemo(() => new THREE.Object3D(), []);
  return (
    <>
      <primitive object={target} position={[0, y, 0]} />
      <spotLight
        position={[0, 4.2, 1.2]}
        target={target}
        angle={0.6}
        penumbra={1}
        intensity={4.2}
        distance={16}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
        color="#fff4ea"
      />
    </>
  );
};

export const CabinetViewer3D = ({
  cabinet,
  exploded = false,
  allowExplode = false,
  glRef,
}: CabinetViewer3DProps) => {
  const [explodedState, setExplodedState] = useState(exploded);
  const isExploded = allowExplode ? explodedState : exploded;

  const maxDim = Math.max(
    cabinet.externalDimensions.width,
    cabinet.externalDimensions.height,
    cabinet.externalDimensions.depth
  ) / 1000;
  const dist = Math.max(maxDim * 2.0, 0.9);
  // Camera quasi frontale, leggermente di 3/4: il driver resta protagonista
  const camPos: [number, number, number] = [dist * 0.42, dist * 0.3, dist * 1.15];
  const groundY = -(cabinet.externalDimensions.height / 1000) / 2 - 0.014;

  if (!isWebGLAvailable()) {
    return (
      <div className="w-full h-full min-h-[400px] bg-zinc-950 rounded-2xl border border-white/5 overflow-hidden relative">
        <CabinetFallback2D cabinet={cabinet} />
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[400px] rounded-2xl border border-white/5 overflow-hidden relative">
      {/* Backdrop a gradiente radiale dietro la scena (profondità da showroom) */}
      <div
        className="absolute inset-0 -z-0"
        style={{
          background:
            'radial-gradient(120% 90% at 50% 18%, #20222b 0%, #131418 42%, #07070a 100%)',
        }}
      />
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: camPos, fov: 40 }}
        gl={{ preserveDrawingBuffer: true, antialias: true, toneMappingExposure: 1.45 }}
        style={{ background: 'transparent' }}
      >
        <CaptureBridge glRef={glRef} />
        <fog attach="fog" args={['#0b0b0f', dist * 3.2, dist * 6.5]} />

        {/* Studio a 3 punti, luminoso e drammatico */}
        <ambientLight intensity={0.5} />
        <hemisphereLight intensity={0.5} color="#ffffff" groundColor="#1a1a22" />
        <StageLight y={groundY} />
        {/* Key light calda */}
        <spotLight position={[4, 6, 5]} angle={0.5} penumbra={0.85} intensity={5.5} distance={22} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0001} color="#fff4e8" />
        {/* Fill fredda */}
        <directionalLight position={[-5, 2.5, 3]} intensity={1.3} color="#bcd0ff" />
        {/* Rim light arancione dietro per stacco drammatico */}
        <spotLight position={[-3, 2.2, -4]} angle={0.8} penumbra={1} intensity={4.5} color={ACCENT} distance={16} />
        <pointLight position={[4, 1, -3]} intensity={1.1} color="#ffb877" />

        <Suspense fallback={null}>
          <RevealGroup sway={!isExploded}>
            <Float speed={1.1} rotationIntensity={0} floatIntensity={isExploded ? 0 : 0.35} floatingRange={[-0.008, 0.018]}>
              <group position={[0, groundY * -0.15, 0]}>
                <CabinetModel cabinet={cabinet} exploded={isExploded} />
              </group>
            </Float>
          </RevealGroup>

          {/* Pavimento riflettente da showroom */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, groundY, 0]} receiveShadow>
            <planeGeometry args={[50, 50]} />
            <MeshReflectorMaterial
              resolution={1024}
              mixBlur={1}
              mixStrength={6}
              blur={[420, 120]}
              roughness={0.92}
              depthScale={1.1}
              minDepthThreshold={0.4}
              maxDepthThreshold={1.4}
              color="#0a0a0d"
              metalness={0.55}
              mirror={0.35}
            />
          </mesh>

          {/* Ombra di contatto morbida sopra il pavimento */}
          <ContactShadows
            position={[0, groundY + 0.001, 0]}
            opacity={0.65}
            scale={Math.max(w_scale(cabinet), 1.4)}
            blur={2.8}
            far={maxDim * 1.4}
            resolution={1024}
            color="#000000"
          />

          {/* Riflessi da studio (procedurali, senza rete) */}
          <Environment resolution={512}>
            <Lightformer intensity={2.6} position={[0, 3, 2]} scale={[5, 5, 1]} />
            <Lightformer intensity={1.3} position={[-4, 1, 2]} scale={[3, 4, 1]} color="#aac4ff" />
            <Lightformer intensity={1.6} position={[4, 2, 1]} scale={[2.5, 3, 1]} color="#ffd9b0" />
            <Lightformer intensity={1.0} position={[0, -2, -3]} scale={[6, 3, 1]} color={ACCENT} />
          </Environment>
        </Suspense>

        {/* Post-processing: bloom sugli accenti + vignettatura + antialias */}
        <EffectComposer multisampling={0} enableNormalPass={false}>
          <Bloom mipmapBlur intensity={0.7} luminanceThreshold={0.7} luminanceSmoothing={0.3} radius={0.8} />
          <Vignette eskil={false} offset={0.4} darkness={0.5} />
          <SMAA />
        </EffectComposer>

        <OrbitControls
          makeDefault
          autoRotate={false}
          enablePan={false}
          enableZoom
          enableDamping
          dampingFactor={0.08}
          minDistance={dist * 0.55}
          maxDistance={dist * 2.4}
          minPolarAngle={Math.PI * 0.1}
          maxPolarAngle={Math.PI * 0.6}
        />
      </Canvas>

      {/* Cornice luminosa interna (vetro premium) */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
      <div className="pointer-events-none absolute -inset-px rounded-2xl" style={{ boxShadow: 'inset 0 1px 40px rgba(242,125,38,0.06)' }} />

      {/* Badge nome progetto */}
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 px-3.5 py-2 rounded-xl shadow-lg">
          <div className="text-[9px] uppercase tracking-[0.2em] text-brand-orange font-black">Officina del Suono</div>
          <div className="text-xs text-white/90 font-bold leading-tight mt-0.5 max-w-[180px] truncate">{cabinet.name}</div>
        </div>
      </div>

      {/* Toggle vista esplosa */}
      {allowExplode && (
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={() => setExplodedState(v => !v)}
            className={`backdrop-blur-xl border px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg ${
              isExploded
                ? 'bg-brand-orange text-white border-brand-orange shadow-[0_0_20px_rgba(242,125,38,0.45)]'
                : 'bg-black/40 text-white/80 border-white/10 hover:border-white/30 hover:text-white'
            }`}
          >
            {isExploded ? <BoxIcon className="w-3.5 h-3.5" /> : <Layers className="w-3.5 h-3.5" />}
            {isExploded ? 'Vista assemblata' : 'Vista esplosa'}
          </button>
        </div>
      )}

      <div className="pointer-events-none absolute bottom-4 right-4 flex gap-2">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 px-3 py-1.5 rounded-xl text-[11px] text-white/60 font-medium flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-brand-orange animate-pulse" />
          Trascina per ruotare · scorri per zoom
        </div>
      </div>
    </div>
  );
};

// scala dell'ombra in base alla larghezza/profondità
function w_scale(cabinet: CabinetDesign): number {
  return Math.max(
    cabinet.externalDimensions.width / 1000,
    cabinet.externalDimensions.depth / 1000
  ) * 2.2;
}

export default CabinetViewer3D;
