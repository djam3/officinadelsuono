import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
}

/**
 * FloatCard — float autonomo casuale senza input mouse.
 * Ogni card ha un delay e durata leggermente diversa per sembrare naturale.
 * Su mobile è leggero perché usa solo CSS transforms.
 */
export function TiltCard({ children, className = "", intensity = 15 }: TiltCardProps) {
  // Valori casuali stabili per ogni istanza (non cambiano al re-render)
  const anim = useMemo(() => ({
    yOffset: 3 + Math.random() * 5,         // 3–8px di float
    duration: 4 + Math.random() * 3,         // 4–7s per ciclo
    delay: Math.random() * 2,                // 0–2s di delay iniziale
    rotateAmount: 0.3 + Math.random() * 0.4, // 0.3–0.7deg di micro-tilt
  }), []);

  return (
    <motion.div
      className={`relative ${className}`}
      animate={{
        y: [-anim.yOffset, anim.yOffset, -anim.yOffset],
        rotateX: [-anim.rotateAmount, anim.rotateAmount, -anim.rotateAmount],
        rotateY: [anim.rotateAmount, -anim.rotateAmount, anim.rotateAmount],
      }}
      transition={{
        duration: anim.duration,
        ease: 'easeInOut',
        repeat: Infinity,
        delay: anim.delay,
      }}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {children}
    </motion.div>
  );
}
