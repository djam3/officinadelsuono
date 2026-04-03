import { motion } from 'framer-motion';

export function Logo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <motion.div 
      className={`relative flex items-center justify-center ${className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <svg 
        viewBox="0 0 100 100" 
        className="w-full h-full drop-shadow-lg"
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="brandOrange" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F27D26" />
            <stop offset="100%" stopColor="#FB923C" />
          </linearGradient>
          <linearGradient id="brandWhite" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#A1A1AA" />
          </linearGradient>
        </defs>

        {/* The "O" - Outer Precision Ring (Officina) */}
        <circle 
          cx="50" cy="50" r="42" 
          stroke="url(#brandWhite)" 
          strokeWidth="8" 
          strokeLinecap="round"
          strokeDasharray="180 40"
          className="origin-center"
        />
        
        {/* The "S" - Dynamic Waveform (Suono) */}
        <g className="origin-center">
          <motion.path 
            d="M32 50 C 32 25, 50 25, 50 50 C 50 75, 68 75, 68 50" 
            stroke="url(#brandOrange)" 
            strokeWidth="8" 
            strokeLinecap="round"
            strokeLinejoin="round"
            animate={{ 
              d: [
                "M32 50 C 32 25, 50 25, 50 50 C 50 75, 68 75, 68 50",
                "M32 50 C 32 35, 50 35, 50 50 C 50 65, 68 65, 68 50",
                "M32 50 C 32 25, 50 25, 50 50 C 50 75, 68 75, 68 50"
              ]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Audio Meter Accents */}
          <motion.rect x="46" y="22" width="8" height="8" rx="4" fill="url(#brandOrange)" 
            animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} />
          <motion.rect x="46" y="70" width="8" height="8" rx="4" fill="url(#brandOrange)" 
            animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
        </g>

        {/* Inner Technical Detail */}
        <circle cx="50" cy="50" r="28" stroke="white" strokeWidth="1" strokeOpacity="0.1" strokeDasharray="4 4" />
      </svg>
    </motion.div>
  );
}


