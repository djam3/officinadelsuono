import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

export function ScrollytellingHardware() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Animation transforms for the hardware "explosion"
  // Starts more visible and stays visible longer
  const scale = useTransform(smoothProgress, [0, 0.4], [1, 1.2]);
  const opacity = useTransform(smoothProgress, [0, 0.05, 0.9, 1], [0.5, 1, 1, 0]);
  const rotateX = useTransform(smoothProgress, [0, 1], [10, -10]);
  
  // Component "layers" flying out - Slow and engineering style
  const layer1Y = useTransform(smoothProgress, [0.1, 0.5], [0, -120]);
  const layer1Opacity = useTransform(smoothProgress, [0.1, 0.2, 0.5], [0, 1, 0]);
  
  const layer2Y = useTransform(smoothProgress, [0.4, 0.8], [0, 120]);
  const layer2Opacity = useTransform(smoothProgress, [0.4, 0.5, 0.8], [0, 1, 0]);

  const layer3X = useTransform(smoothProgress, [0.6, 0.9], [0, 150]);
  const layer3Opacity = useTransform(smoothProgress, [0.6, 0.7, 0.9], [0, 1, 0]);

  // Text block reveals - more deliberate
  const text1Opacity = useTransform(smoothProgress, [0.1, 0.2, 0.35], [0, 1, 0]);
  const text2Opacity = useTransform(smoothProgress, [0.4, 0.5, 0.65], [0, 1, 0]);
  const text3Opacity = useTransform(smoothProgress, [0.7, 0.8, 0.95], [0, 1, 1]);

  return (
    <div ref={containerRef} className="relative h-[500vh] bg-black">
      {/* Sticky Hardware Visual */}
      <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
        <motion.div 
          style={{ scale, opacity, rotateX, perspective: 1000 }}
          className="relative w-full max-w-4xl aspect-square flex items-center justify-center"
        >
          {/* Main Hardware Image */}
          <motion.img 
            src="/mixer.png"
            className="w-full h-full object-contain drop-shadow-[0_0_80px_rgba(255,95,0,0.25)]"
            alt="Pro DJ Mixer"
          />

          {/* Floating Component Layers (Simulating explosion) */}
          <motion.div 
            style={{ y: layer1Y, opacity: layer1Opacity }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="w-1/2 h-1/4 bg-brand-orange/10 border border-brand-orange/30 backdrop-blur-xl rounded-2xl flex flex-col items-center justify-center p-4">
              <span className="text-[8px] font-black font-mono text-brand-orange uppercase tracking-[0.3em] mb-1">Module: Primary Processing</span>
              <div className="w-full h-1 bg-brand-orange/20 overflow-hidden rounded-full">
                <motion.div className="h-full bg-brand-orange w-1/2" animate={{ x: [-50, 200] }} transition={{ repeat: Infinity, duration: 2 }} />
              </div>
            </div>
          </motion.div>

          <motion.div 
            style={{ y: layer2Y, opacity: layer2Opacity }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="w-40 h-40 bg-zinc-900/40 border border-white/20 backdrop-blur-2xl rounded-full flex items-center justify-center shadow-2xl">
               <div className="w-24 h-24 border-2 border-brand-orange/30 rounded-full border-t-brand-orange animate-spin" style={{ animationDuration: '3s' }} />
               <div className="absolute text-[8px] font-bold text-white uppercase tracking-widest">Logic Unit</div>
            </div>
          </motion.div>

          <motion.div 
            style={{ x: layer3X, opacity: layer3Opacity }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="px-8 py-4 bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest font-mono">Analog/Digital Link: OK</span>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Floating Text Blocks */}
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-center px-4">
          
          <motion.div style={{ opacity: text1Opacity }} className="max-w-4xl">
            <h3 className="text-4xl md:text-7xl font-black mb-6 uppercase tracking-tighter italic">Ingegneria, non logistica.</h3>
            <p className="text-xl md:text-3xl text-zinc-500 font-medium">Calcoliamo impedenze e latenze prima di ogni configurazione.</p>
          </motion.div>

          <motion.div style={{ opacity: text2Opacity }} className="max-w-4xl">
            <h3 className="text-4xl md:text-7xl font-black mb-6 uppercase tracking-tighter italic">Zero colli di bottiglia.</h3>
            <p className="text-xl md:text-3xl text-zinc-500 font-medium">Segnale puro dai cavi ai convertitori per una fedeltà assoluta.</p>
          </motion.div>

          <motion.div style={{ opacity: text3Opacity }} className="max-w-4xl">
            <h3 className="text-4xl md:text-7xl font-black mb-6 uppercase tracking-tighter italic">Standard MAT Academy.</h3>
            <p className="text-xl md:text-3xl text-zinc-500 font-medium">Ogni setup rispetta i più rigidi protocolli industriali del Pro-Audio.</p>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
