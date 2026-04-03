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

  return (
    <>
      {/* Main tiny dot that follows mouse exactly */}
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 bg-brand-orange rounded-full pointer-events-none z-[9999]"
        style={{
          x: dotXSpring,
          y: dotYSpring,
          translateX: 11, // Center the 8px dot inside the 32px container
          translateY: 11,
        }}
        animate={{
          scale: isHidden ? 0 : (isHovering ? 0 : 1),
          opacity: isHidden ? 0 : (isHovering ? 0 : 1),
        }}
        transition={{ duration: 0.15 }}
      />

      {/* Trailing larger circle */}
      <motion.div
        className="fixed top-0 left-0 w-8 h-8 border-2 border-brand-orange rounded-full pointer-events-none z-[9998] flex items-center justify-center"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
        }}
        animate={{
          scale: isHidden ? 0 : (isHovering ? 1.5 : 1),
          opacity: isHidden ? 0 : 1,
          backgroundColor: isHovering ? 'rgba(242, 125, 38, 0.1)' : 'rgba(242, 125, 38, 0)',
        }}
        transition={{ duration: 0.2 }}
      />
    </>
  );
}
