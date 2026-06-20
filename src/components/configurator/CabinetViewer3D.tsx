import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stage, Edges, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { CabinetDesign, PortDesign } from '../../types/speaker';

interface CabinetViewer3DProps {
  cabinet: CabinetDesign;
  showDimensions?: boolean;
  exploded?: boolean;
}

// Genera una texture legno base
const createWoodTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext('2d');
  if (context) {
    context.fillStyle = '#2a1b12'; // Base color (dark wood)
    context.fillRect(0, 0, 512, 512);
    // Add some noise/grain
    for (let i = 0; i < 5000; i++) {
      context.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.1})`;
      context.fillRect(Math.random() * 512, Math.random() * 512, Math.random() * 20, 2);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
};

const woodTexture = createWoodTexture();

const Panel = ({
  width,
  height,
  thickness,
  position,
  rotation = [0, 0, 0],
  holes = [],
  name,
  explodedOffset = [0, 0, 0],
  isExploded = false
}: {
  width: number;
  height: number;
  thickness: number;
  position: [number, number, number];
  rotation?: [number, number, number];
  holes?: any[];
  name: string;
  explodedOffset?: [number, number, number];
  isExploded?: boolean;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Convert mm to meters for Three.js
  const w = width / 1000;
  const h = height / 1000;
  const d = thickness / 1000;

  // Calculate final position with explosion
  const finalPos: [number, number, number] = isExploded
    ? [
        position[0] + explodedOffset[0],
        position[1] + explodedOffset[1],
        position[2] + explodedOffset[2],
      ]
    : position;

  // Usa CSG o ShapeGeometry per forare, ma per semplicità usiamo texture o geometry base per ora
  // In una versione pro, si usa THREE.Shape per creare fori
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-w / 2, -h / 2);
    s.lineTo(w / 2, -h / 2);
    s.lineTo(w / 2, h / 2);
    s.lineTo(-w / 2, h / 2);
    s.lineTo(-w / 2, -h / 2);

    if (holes && holes.length > 0) {
      holes.forEach(hole => {
        if (hole.shape === 'circle' && hole.diameter) {
          const holePath = new THREE.Path();
          // Convert from bottom-left origin to center origin
          const hX = (hole.x / 1000) - (w / 2);
          const hY = (hole.y / 1000) - (h / 2);
          const radius = (hole.diameter / 2) / 1000;
          holePath.absarc(hX, hY, radius, 0, Math.PI * 2, false);
          s.holes.push(holePath);
        } else if (hole.shape === 'rectangle' && hole.width && hole.height) {
          const holePath = new THREE.Path();
          const hw = (hole.width / 1000) / 2;
          const hh = (hole.height / 1000) / 2;
          const hX = (hole.x / 1000) - (w / 2);
          const hY = (hole.y / 1000) - (h / 2);
          
          holePath.moveTo(hX - hw, hY - hh);
          holePath.lineTo(hX + hw, hY - hh);
          holePath.lineTo(hX + hw, hY + hh);
          holePath.lineTo(hX - hw, hY + hh);
          holePath.lineTo(hX - hw, hY - hh);
          s.holes.push(holePath);
        } else if (hole.shape === 'rounded-rect' && hole.width && hole.height) {
          // semplificazione: usa rettangolo
          const holePath = new THREE.Path();
          const hw = (hole.width / 1000) / 2;
          const hh = (hole.height / 1000) / 2;
          const hX = (hole.x / 1000) - (w / 2);
          const hY = (hole.y / 1000) - (h / 2);
          
          holePath.moveTo(hX - hw, hY - hh);
          holePath.lineTo(hX + hw, hY - hh);
          holePath.lineTo(hX + hw, hY + hh);
          holePath.lineTo(hX - hw, hY + hh);
          holePath.lineTo(hX - hw, hY - hh);
          s.holes.push(holePath);
        }
      });
    }
    return s;
  }, [w, h, holes]);

  const extrudeSettings = {
    depth: d,
    bevelEnabled: false,
  };

  return (
    <group position={finalPos} rotation={rotation}>
      {/* Shift extrusion to center it over Z */}
      <group position={[0, 0, -d / 2]}>
        <mesh ref={meshRef} castShadow receiveShadow>
          <extrudeGeometry args={[shape, extrudeSettings]} />
          <meshStandardMaterial 
            map={woodTexture} 
            color="#a36e40" // wood tint
            roughness={0.8}
            metalness={0.1}
          />
          <Edges scale={1} threshold={15} color="black" />
        </mesh>
      </group>
      
      {isExploded && (
        <Html position={[0, 0, d/2 + 0.05]} center className="pointer-events-none">
          <div className="bg-black/80 text-brand-orange text-xs px-2 py-1 rounded backdrop-blur-md border border-white/10 whitespace-nowrap">
            {name}
          </div>
        </Html>
      )}
    </group>
  );
};

const DimensionLine = ({ start, end, label, offset = 0.1 }: { start: [number, number, number], end: [number, number, number], label: string, offset?: number }) => {
  const points = [
    new THREE.Vector3(...start),
    new THREE.Vector3(...end)
  ];
  const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
  
  const midPoint = [
    (start[0] + end[0]) / 2,
    (start[1] + end[1]) / 2,
    (start[2] + end[2]) / 2,
  ];

  return (
    <group>
      <lineSegments geometry={lineGeometry}>
        <lineBasicMaterial color="#F27D26" linewidth={2} />
      </lineSegments>
      <Html position={midPoint as [number, number, number]} center className="pointer-events-none">
        <div className="bg-zinc-900/90 text-brand-orange text-[10px] font-bold px-1.5 py-0.5 rounded border border-brand-orange/30">
          {label}
        </div>
      </Html>
    </group>
  );
};

const CabinetModel = ({ cabinet, showDimensions, exploded }: CabinetViewer3DProps) => {
  // Dimensioni esterne in metri
  const w = cabinet.externalDimensions.width / 1000;
  const h = cabinet.externalDimensions.height / 1000;
  const d = cabinet.externalDimensions.depth / 1000;
  const t = cabinet.woodThickness / 1000;

  const explosionFactor = 0.3; // m

  const getPanel = (id: string) => cabinet.panels.find(p => p.id === id);
  const front = getPanel('front');
  const rear = getPanel('rear');
  const left = getPanel('side-left');
  const right = getPanel('side-right');
  const top = getPanel('top');
  const bottom = getPanel('bottom');

  return (
    <group>
      {/* Front */}
      {front && (
        <Panel 
          width={front.width} height={front.height} thickness={front.thickness}
          holes={front.holes} name={front.name}
          position={[0, 0, d/2 - t/2]}
          explodedOffset={[0, 0, explosionFactor]}
          isExploded={exploded}
        />
      )}
      
      {/* Rear */}
      {rear && (
        <Panel 
          width={rear.width} height={rear.height} thickness={rear.thickness}
          holes={rear.holes} name={rear.name}
          position={[0, 0, -d/2 + t/2]}
          explodedOffset={[0, 0, -explosionFactor]}
          isExploded={exploded}
        />
      )}

      {/* Left Side */}
      {left && (
        <Panel 
          width={left.width} height={left.height} thickness={left.thickness}
          holes={left.holes} name={left.name}
          position={[-w/2 + t/2, 0, 0]}
          rotation={[0, -Math.PI / 2, 0]}
          explodedOffset={[-explosionFactor, 0, 0]}
          isExploded={exploded}
        />
      )}

      {/* Right Side */}
      {right && (
        <Panel 
          width={right.width} height={right.height} thickness={right.thickness}
          holes={right.holes} name={right.name}
          position={[w/2 - t/2, 0, 0]}
          rotation={[0, Math.PI / 2, 0]}
          explodedOffset={[explosionFactor, 0, 0]}
          isExploded={exploded}
        />
      )}

      {/* Top */}
      {top && (
        <Panel 
          width={top.width} height={top.height} thickness={top.thickness}
          holes={top.holes} name={top.name}
          position={[0, h/2 - t/2, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          explodedOffset={[0, explosionFactor, 0]}
          isExploded={exploded}
        />
      )}

      {/* Bottom */}
      {bottom && (
        <Panel 
          width={bottom.width} height={bottom.height} thickness={bottom.thickness}
          holes={bottom.holes} name={bottom.name}
          position={[0, -h/2 + t/2, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          explodedOffset={[0, -explosionFactor, 0]}
          isExploded={exploded}
        />
      )}

      {/* Port Tube */}
      {cabinet.port && cabinet.port.shape === 'circular' && cabinet.port.diameter && !exploded && (
        <mesh position={[0, -h/2 + t + (cabinet.port.diameter/1000/2) + 0.05, d/2 - t - (cabinet.port.length/1000/2)]} rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[cabinet.port.diameter/2/1000, cabinet.port.diameter/2/1000, cabinet.port.length/1000, 32, 1, true]} />
          <meshStandardMaterial color="#111" side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Dimensions (Wireframe bounds) */}
      {showDimensions && !exploded && (
        <group>
          {/* Width */}
          <DimensionLine 
            start={[-w/2, h/2 + 0.1, d/2]} 
            end={[w/2, h/2 + 0.1, d/2]} 
            label={`${cabinet.externalDimensions.width} mm`} 
          />
          {/* Height */}
          <DimensionLine 
            start={[w/2 + 0.1, -h/2, d/2]} 
            end={[w/2 + 0.1, h/2, d/2]} 
            label={`${cabinet.externalDimensions.height} mm`} 
          />
          {/* Depth */}
          <DimensionLine 
            start={[w/2 + 0.1, -h/2 + 0.1, d/2]} 
            end={[w/2 + 0.1, -h/2 + 0.1, -d/2]} 
            label={`${cabinet.externalDimensions.depth} mm`} 
          />
        </group>
      )}
    </group>
  );
};

export const CabinetViewer3D = ({ 
  cabinet, 
  showDimensions = true, 
  exploded = false 
}: CabinetViewer3DProps) => {
  return (
    <div className="w-full h-full min-h-[400px] bg-zinc-950/50 rounded-2xl border border-white/5 overflow-hidden relative">
      <Canvas shadows camera={{ position: [1.5, 1, 2], fov: 45 }}>
        <color attach="background" args={['#050505']} />
        
        <ambientLight intensity={0.7} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        <Stage environment="city" intensity={0.5} adjustCamera={1.2}>
          <CabinetModel cabinet={cabinet} showDimensions={showDimensions} exploded={exploded} />
        </Stage>
        
        <OrbitControls makeDefault autoRotate={!exploded} autoRotateSpeed={1} minPolarAngle={0} maxPolarAngle={Math.PI / 1.5} />
      </Canvas>
      
      {/* Overlay UI */}
      <div className="absolute top-4 left-4 flex gap-2">
        <div className="bg-zinc-900/80 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg text-xs text-white/70 font-medium">
          {cabinet.name}
        </div>
      </div>
      <div className="absolute bottom-4 right-4 flex gap-2">
         <div className="bg-zinc-900/80 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg text-xs text-white/50 font-medium flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-brand-orange animate-pulse" />
            3D Rendering
         </div>
      </div>
    </div>
  );
};

export default CabinetViewer3D;
