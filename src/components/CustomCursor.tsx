import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export function CustomCursor() {
  const [isDesktop, setIsDesktop] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  
  // Track mouse position
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  
  // Smooth spring animation for the cursor following
  const springConfig = { damping: 25, stiffness: 700, mass: 0.5 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  // Faster spring for the tiny dot
  const dotSpringConfig = { damping: 40, stiffness: 1000, mass: 0.1 };
  const dotXSpring = useSpring(cursorX, dotSpringConfig);
  const dotYSpring = useSpring(cursorY, dotSpringConfig);

  useEffect(() => {
    // Check if device has a fine pointer (mouse)
    const mediaQuery = window.matchMedia('(pointer: fine)');
    setIsDesktop(mediaQuery.matches);

    const handleMediaQueryChange = (e: MediaQueryListEvent) => {
      setIsDesktop(e.matches);
    };

    mediaQuery.addEventListener('change', handleMediaQueryChange);

    if (!mediaQuery.matches) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Center the cursor
      cursorX.set(e.clientX - 16);
      cursorY.set(e.clientY - 16);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Check if we should hide the cursor completely
      if (target.closest('.hide-custom-cursor')) {
        setIsHidden(true);
        setIsHovering(false);
        return;
      } else {
        setIsHidden(false);
      }

      // Check if hovering over clickable elements
      if (target.closest('a, button, input, select, textarea, [role="button"]')) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      mediaQuery.removeEventListener('change', handleMediaQueryChange);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, [cursorX, cursorY]);

  if (!isDesktop) return null;

  // Mirino da disegno: due tratti che si incrociano senza toccarsi al centro,
  // come il cursore di un tavolo da disegno. Sul passaggio su un elemento
  // attivo il mirino si apre e vira al colore del pennarello.
  const tratto = 'fixed pointer-events-none z-[9998] bg-blueprint/70';

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 w-1 h-1 rounded-full bg-marker pointer-events-none z-[9999]"
        style={{ x: dotXSpring, y: dotYSpring, translateX: -2, translateY: -2 }}
        animate={{ opacity: isHidden ? 0 : 1 }}
        transition={{ duration: 0.15 }}
      />

      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9998]"
        style={{ x: cursorXSpring, y: cursorYSpring }}
        animate={{
          opacity: isHidden ? 0 : 1,
          scale: isHovering ? 1.45 : 1,
        }}
        transition={{ duration: 0.18 }}
      >
        <span className={`${tratto} -translate-x-1/2 -translate-y-1/2`} style={{ width: 1, height: 9, top: -9, left: 0 }} />
        <span className={`${tratto} -translate-x-1/2 -translate-y-1/2`} style={{ width: 1, height: 9, top: 9, left: 0 }} />
        <span className={`${tratto} -translate-x-1/2 -translate-y-1/2`} style={{ width: 9, height: 1, top: 0, left: -9 }} />
        <span className={`${tratto} -translate-x-1/2 -translate-y-1/2`} style={{ width: 9, height: 1, top: 0, left: 9 }} />
      </motion.div>
    </>
  );
}
