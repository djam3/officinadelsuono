import React, { useRef, useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// Lazy-load Three.js only on desktop
const ThreeCanvas = React.lazy(() => import('./HeroCanvas'));

function MobileFallback() {
  return (
    <div className="absolute inset-0 bg-black overflow-hidden">
      {/* Gradient pulsante */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(255,95,0,0.12) 0%, transparent 70%)',
            'radial-gradient(ellipse 60% 80% at 40% 60%, rgba(255,95,0,0.08) 0%, transparent 70%)',
            'radial-gradient(ellipse 70% 50% at 60% 35%, rgba(255,95,0,0.10) 0%, transparent 70%)',
            'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(255,95,0,0.12) 0%, transparent 70%)',
          ],
        }}
        transition={{ duration: 10, ease: 'easeInOut', repeat: Infinity }}
      />

      {/* Particelle CSS statiche con animazione float */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-brand-orange/20"
          style={{
            width: 2 + Math.random() * 3,
            height: 2 + Math.random() * 3,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -20 - Math.random() * 30, 0],
            opacity: [0.1, 0.4, 0.1],
          }}
          transition={{
            duration: 5 + Math.random() * 5,
            ease: 'easeInOut',
            repeat: Infinity,
            delay: Math.random() * 5,
          }}
        />
      ))}

      {/* Linee orizzontali tipo grid */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 60px, rgba(255,95,0,0.3) 60px, rgba(255,95,0,0.3) 61px)',
        }}
      />

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)] opacity-60 pointer-events-none" />
      <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none" />
    </div>
  );
}

export function HeroBackground() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (isMobile) {
    return <MobileFallback />;
  }

  return (
    <React.Suspense fallback={<MobileFallback />}>
      <ThreeCanvas />
    </React.Suspense>
  );
}
