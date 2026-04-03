import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, PointMaterial, MeshWobbleMaterial } from '@react-three/drei';
import * as THREE from 'three';

function NexusGrid() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (meshRef.current) {
      // @ts-ignore
      meshRef.current.material.uniforms.uTime.value = time;
    }
  });

  const shaderArgs = useMemo(() => ({
    uniforms: {
      uTime: { value: 1.0 },
      uColor: { value: new THREE.Color("#FF5F00") },
      uOpacity: { value: 0.15 }
    },
    vertexShader: `
      varying vec2 vUv;
      varying float vElevation;
      uniform float uTime;

      void main() {
        vUv = uv;
        vec4 modelPosition = modelMatrix * vec4(position, 1.0);

        float elevation = sin(modelPosition.x * 2.0 + uTime * 0.8) *
                         sin(modelPosition.z * 1.5 + uTime * 0.5) * 0.4;

        modelPosition.y += elevation;
        vElevation = elevation;

        gl_Position = projectionMatrix * viewMatrix * modelPosition;
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      varying float vElevation;
      uniform vec3 uColor;
      uniform float uOpacity;

      void main() {
        float strength = 1.0 - step(0.01, mod(vUv.x * 30.0, 1.0));
        strength += 1.0 - step(0.01, mod(vUv.y * 30.0, 1.0));

        vec3 color = mix(vec3(0.0), uColor, strength * uOpacity);
        color += uColor * (vElevation + 0.4) * 0.2;

        gl_FragColor = vec4(color, strength * 0.2 + 0.1);
      }
    `
  }), []);

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2.5, 0, 0]} position={[0, -1, 0]}>
      <planeGeometry args={[20, 20, 80, 80]} />
      <shaderMaterial args={[shaderArgs]} transparent side={THREE.DoubleSide} />
    </mesh>
  );
}

function CinematicNodes({ count = 8 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Float
          key={i}
          speed={1.5}
          rotationIntensity={2}
          floatIntensity={2}
          position={[
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 5,
            (Math.random() - 0.5) * 5
          ]}
        >
          <mesh>
            <octahedronGeometry args={[Math.random() * 0.3 + 0.1, 0]} />
            <MeshWobbleMaterial
              color={i % 2 === 0 ? "#FF5F00" : "#ffffff"}
              factor={0.4}
              speed={2}
              transparent
              opacity={0.3}
              wireframe
            />
          </mesh>
        </Float>
      ))}
    </>
  );
}

function DriftingParticles({ count = 800 }) {
  const points = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 20;
      p[i * 3 + 1] = (Math.random() - 0.5) * 10;
      p[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return p;
  }, [count]);

  const pointsRef = useRef<THREE.Points>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (pointsRef.current) {
      pointsRef.current.rotation.y = time * 0.03;
      pointsRef.current.position.y = Math.sin(time * 0.2) * 0.5;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={points}
          itemSize={3}
        />
      </bufferGeometry>
      <PointMaterial
        transparent
        color="#FF5F00"
        size={0.02}
        sizeAttenuation
        depthWrite={false}
        opacity={0.2}
      />
    </points>
  );
}

export default function HeroCanvas() {
  return (
    <div className="absolute inset-0 z-0 bg-black overflow-hidden select-none">
      <Canvas camera={{ position: [0, 2, 8], fov: 45 }}>
        <fog attach="fog" args={['#000000', 5, 20]} />
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} color="#FF5F00" />

        <NexusGrid />
        <CinematicNodes />
        <DriftingParticles />

        <mesh position={[0, 0, -10]}>
          <planeGeometry args={[50, 50]} />
          <meshBasicMaterial color="#000000" />
        </mesh>
      </Canvas>

      {/* Vignette & Bottom Blur */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)] opacity-60 pointer-events-none" />
      <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none" />
    </div>
  );
}
