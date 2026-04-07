import { motion } from 'framer-motion';

export function Logo({ className = "w-10 h-10" }: { className?: string }) {
  // Equalizer bar heights for animation (waveform pulse)
  const barAnimations = [
    { from: 28, to: 14, delay: 0 },
    { from: 18, to: 32, delay: 0.15 },
    { from: 36, to: 8, delay: 0.3 },
    { from: 14, to: 28, delay: 0.45 },
    { from: 24, to: 18, delay: 0.6 },
  ];

  return (
    <motion.div
      className={`relative flex items-center justify-center ${className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-[0_0_12px_rgba(242,125,38,0.35)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#A1A1AA" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FB923C" />
            <stop offset="100%" stopColor="#F27D26" />
          </linearGradient>
          <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F27D26" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#F27D26" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Soft inner glow */}
        <circle cx="50" cy="50" r="40" fill="url(#centerGlow)" />

        {/* Outer precision ring with subtle gap (broadcast/vinyl feel) */}
        <circle
          cx="50"
          cy="50"
          r="44"
          stroke="url(#ringGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="260 16"
          transform="rotate(-90 50 50)"
        />

        {/* Inner technical guide ring */}
        <circle
          cx="50"
          cy="50"
          r="36"
          stroke="#FFFFFF"
          strokeWidth="0.5"
          strokeOpacity="0.15"
          strokeDasharray="2 3"
        />

        {/* Equalizer bars — the heart of the mark */}
        <g>
          {barAnimations.map((bar, i) => {
            const x = 32 + i * 9;
            return (
              <motion.rect
                key={i}
                x={x}
                width="5"
                rx="2.5"
                fill="url(#barGradient)"
                initial={{ y: 50 - bar.from / 2, height: bar.from }}
                animate={{
                  y: [50 - bar.from / 2, 50 - bar.to / 2, 50 - bar.from / 2],
                  height: [bar.from, bar.to, bar.from],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: bar.delay,
                }}
              />
            );
          })}
        </g>

        {/* Tick marks at 12/3/6/9 o'clock — precision feel */}
        <g stroke="#F27D26" strokeWidth="2" strokeLinecap="round">
          <line x1="50" y1="6" x2="50" y2="11" />
          <line x1="94" y1="50" x2="89" y2="50" />
          <line x1="50" y1="94" x2="50" y2="89" />
          <line x1="6" y1="50" x2="11" y2="50" />
        </g>
      </svg>
    </motion.div>
  );
}
