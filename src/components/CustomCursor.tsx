/**
 * Mirino da tavolo da disegno, al posto del puntatore di sistema.
 *
 * La versione precedente spariva in diverse situazioni, e la causa era
 * strutturale: il CSS nascondeva il cursore di sistema per TUTTI i dispositivi
 * con puntatore fine, mentre il componente decideva per conto suo se
 * disegnarne uno. Quando i due non erano d'accordo — al primo fotogramma, su un
 * dispositivo ibrido, o se il componente non era ancora montato — non restava
 * nessun cursore, né quello vero né quello finto.
 *
 * Ora il componente possiede la decisione: la classe che nasconde il puntatore
 * di sistema la mette e la toglie lui su <html>, quindi se per qualsiasi motivo
 * il mirino non c'è, il puntatore vero torna da solo. È il cursore di sistema
 * la rete di sicurezza, non un effetto grafico.
 */

import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, type MotionValue } from 'framer-motion';

/** elementi che tengono il puntatore di sistema: lì serve vedere il caret */
const CAMPI_TESTO = 'input, textarea, [contenteditable="true"]';
const ATTIVI = 'a, button, [role="button"], summary, label[for]';

export function CustomCursor() {
  const [attivo, setAttivo] = useState(false);
  const [suElementoAttivo, setSuElementoAttivo] = useState(false);
  const [premuto, setPremuto] = useState(false);
  // Il mirino si spegne per DUE motivi indipendenti, e vanno tenuti separati.
  // Con un interruttore solo i due gestori si combattevano: ogni movimento del
  // puntatore rimetteva visibile il mirino e annullava la regola sui campi di
  // testo, perche muoversi dentro un campo genera comunque dei pointermove.
  const [fuoriFinestra, setFuoriFinestra] = useState(true);
  const [suCampoTesto, setSuCampoTesto] = useState(false);
  const [menoMovimento, setMenoMovimento] = useState(false);
  const visibile = !fuoriFinestra && !suCampoTesto;

  // letto dentro i gestori senza rilegare gli ascoltatori a ogni cambio
  const fuoriRef = useRef(fuoriFinestra);
  fuoriRef.current = fuoriFinestra;

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const xMolla = useSpring(x, { damping: 28, stiffness: 900, mass: 0.35 });
  const yMolla = useSpring(y, { damping: 28, stiffness: 900, mass: 0.35 });

  useEffect(() => {
    const puntatoreFine = window.matchMedia('(pointer: fine)');
    const riduciMovimento = window.matchMedia('(prefers-reduced-motion: reduce)');

    const aggiorna = () => {
      setAttivo(puntatoreFine.matches);
      setMenoMovimento(riduciMovimento.matches);
    };
    aggiorna();
    puntatoreFine.addEventListener('change', aggiorna);
    riduciMovimento.addEventListener('change', aggiorna);
    return () => {
      puntatoreFine.removeEventListener('change', aggiorna);
      riduciMovimento.removeEventListener('change', aggiorna);
    };
  }, []);

  useEffect(() => {
    if (!attivo) return;

    // Il puntatore di sistema si nasconde SOLO finché questo componente è vivo:
    // allo smontaggio la classe se ne va e il cursore vero torna.
    const html = document.documentElement;
    html.classList.add('cursore-mirino');

    const muovi = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      // muoversi dentro la pagina prova che il puntatore c'è: è la via d'uscita
      // se uno stato "fuori dalla finestra" fosse rimasto appeso. Non tocca il
      // caso del campo di testo, che ha il suo interruttore.
      if (fuoriRef.current) setFuoriFinestra(false);
    };

    const sopra = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t || typeof t.closest !== 'function') return;
      // sui campi di testo lascia lavorare il cursore di sistema, altrimenti
      // non si vede dove andrà a finire il cursore di scrittura
      const suTesto = !!t.closest(CAMPI_TESTO);
      setSuCampoTesto(suTesto);
      setSuElementoAttivo(!suTesto && !!t.closest(ATTIVI));
    };

    const esce = (e: MouseEvent) => {
      // relatedTarget nullo = il puntatore ha lasciato davvero la finestra
      if (!e.relatedTarget) setFuoriFinestra(true);
    };
    const entra = () => setFuoriFinestra(false);
    const giu = () => setPremuto(true);
    const su = () => setPremuto(false);
    const perdeFuoco = () => { setFuoriFinestra(true); setPremuto(false); };

    window.addEventListener('pointermove', muovi, { passive: true });
    window.addEventListener('pointerover', sopra, { passive: true });
    document.addEventListener('mouseleave', esce);
    document.addEventListener('mouseenter', entra);
    window.addEventListener('pointerdown', giu, { passive: true });
    window.addEventListener('pointerup', su, { passive: true });
    window.addEventListener('pointercancel', su, { passive: true });
    window.addEventListener('blur', perdeFuoco);

    return () => {
      html.classList.remove('cursore-mirino');
      window.removeEventListener('pointermove', muovi);
      window.removeEventListener('pointerover', sopra);
      document.removeEventListener('mouseleave', esce);
      document.removeEventListener('mouseenter', entra);
      window.removeEventListener('pointerdown', giu);
      window.removeEventListener('pointerup', su);
      window.removeEventListener('pointercancel', su);
      window.removeEventListener('blur', perdeFuoco);
    };
  }, [attivo, x, y]);

  if (!attivo) return null;

  const seguiX: MotionValue<number> = menoMovimento ? x : xMolla;
  const seguiY: MotionValue<number> = menoMovimento ? y : yMolla;
  const colore = suElementoAttivo ? '#7FD8F5' : '#7FB2D9';

  return (
    <motion.div
      aria-hidden
      className="fixed top-0 left-0 pointer-events-none z-[9999]"
      style={{ x: seguiX, y: seguiY }}
      animate={{ opacity: visibile ? 1 : 0 }}
      transition={{ duration: 0.12 }}
    >
      {/* il gruppo è centrato sul punto esatto: nessuna compensazione a mano,
          era proprio uno scarto di 16 px rimasto da una versione precedente a
          far sembrare il cursore spostato rispetto a dove si clicca */}
      <svg
        width="44"
        height="44"
        viewBox="-22 -22 44 44"
        style={{ position: 'absolute', left: -22, top: -22, overflow: 'visible' }}
      >
        <g
          stroke={colore}
          strokeWidth="1"
          shapeRendering="crispEdges"
          style={{
            transition: 'stroke .15s ease',
            transform: `scale(${premuto ? 0.78 : suElementoAttivo ? 1.4 : 1})`,
            transformOrigin: 'center',
          }}
        >
          <line x1="0" y1="-13" x2="0" y2="-4" />
          <line x1="0" y1="4" x2="0" y2="13" />
          <line x1="-13" y1="0" x2="-4" y2="0" />
          <line x1="4" y1="0" x2="13" y2="0" />
          {suElementoAttivo && (
            <rect x="-6.5" y="-6.5" width="13" height="13" fill="none" opacity="0.55" />
          )}
        </g>
        <circle cx="0" cy="0" r="1.1" fill="#7FD8F5" />
      </svg>
    </motion.div>
  );
}
