import { motion } from 'framer-motion';

/**
 * Ambient glow autonomo — nessun input dal mouse.
 * Due sfere arancione sfumate che fluttuano lentamente sulla pagina.
 */
export function MouseGlow() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
      {/* Glow 1 — drift lento in alto a destra */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 600,
          height: 600,
          background: 'radial-gradient(circle, rgba(255,95,0,0.06) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
        animate={{
          x: ['-10%', '60%', '30%', '-10%'],
          y: ['-20%', '10%', '50%', '-20%'],
        }}
        transition={{
          duration: 25,
          ease: 'easeInOut',
          repeat: Infinity,
        }}
      />
      {/* Glow 2 — drift lento in basso a sinistra */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 500,
          height: 500,
          background: 'radial-gradient(circle, rgba(255,95,0,0.04) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
        animate={{
          x: ['80%', '20%', '50%', '80%'],
          y: ['60%', '30%', '-10%', '60%'],
        }}
        transition={{
          duration: 30,
          ease: 'easeInOut',
          repeat: Infinity,
        }}
      />
    </div>
  );
}
