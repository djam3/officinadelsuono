import { jsPDF } from 'jspdf';
import type { SpeakerDriver, Amplifier, CabinetDesign } from '../types/speaker';
import type { ConfiguratorPrice } from './configuratorPricing';
import { formatPrice } from './configuratorPricing';
import type { XoverPoint } from './crossoverDesign';

interface ConfiguratorPDFData {
  driver: SpeakerDriver;
  amplifier: Amplifier;
  cabinet: CabinetDesign;
  pricing: ConfiguratorPrice;
  limiterVrms: number;
  limiterDbu: number;
  renderImage?: string | null; // dataURL PNG del render 3D
  extraDrivers?: SpeakerDriver[];
  crossover?: XoverPoint[];
}

const ORANGE: [number, number, number] = [242, 125, 38];
const DARK: [number, number, number] = [24, 24, 27];

/**
 * Genera la scheda PDF della configurazione (render 3D + specifiche + prezzo)
 * pensata come allegato al preventivo per il cliente.
 */
export function generateConfiguratorPDF(data: ConfiguratorPDFData): jsPDF {
  const { driver, amplifier, cabinet, pricing, limiterVrms, limiterDbu, renderImage, extraDrivers = [], crossover = [] } = data;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210;

  // ── Header ──────────────────────────────────────────────────────────────
  doc.setFillColor(...DARK);
  doc.rect(0, 0, W, 38, 'F');
  doc.setFillColor(...ORANGE);
  doc.rect(0, 38, W, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Officina del Suono', 16, 20);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...ORANGE);
  doc.text('SCHEDA CONFIGURAZIONE PERSONALIZZATA', 16, 29);
  doc.setTextColor(200, 200, 200);
  doc.setFontSize(9);
  doc.text(new Date().toLocaleDateString('it-IT'), W - 16, 29, { align: 'right' });

  let y = 50;

  // ── Render 3D ───────────────────────────────────────────────────────────
  if (renderImage) {
    try {
      const imgW = 120;
      const imgH = 78;
      doc.addImage(renderImage, 'PNG', (W - imgW) / 2, y, imgW, imgH);
      y += imgH + 8;
    } catch {
      /* render opzionale: se fallisce, prosegue senza immagine */
    }
  }

  // ── Titolo progetto ──────────────────────────────────────────────────────
  doc.setTextColor(...DARK);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(cabinet.name || 'Configurazione Custom', 16, y);
  y += 10;

  // helper riga
  const row = (label: string, value: string) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(110, 110, 110);
    doc.setFontSize(10);
    doc.text(label, 16, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.text(value, W - 16, y, { align: 'right' });
    y += 7;
  };
  const section = (title: string) => {
    y += 3;
    doc.setFillColor(245, 245, 245);
    doc.rect(12, y - 5, W - 24, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...ORANGE);
    doc.text(title.toUpperCase(), 16, y);
    y += 8;
  };

  section('Componenti');
  row('Woofer (grave)', `${driver.brand} ${driver.model}`);
  row('Specifiche woofer', `${driver.size}" • ${driver.powerRMS}W RMS • ${driver.impedance}Ω`);
  extraDrivers.forEach((hd) => {
    const role = hd.type === 'compression-driver' ? 'Driver a compressione' : hd.type === 'tweeter' ? 'Tweeter' : 'Medio';
    row(role, `${hd.brand} ${hd.model} • ${hd.powerRMS}W • ${hd.impedance}Ω`);
  });
  row('Amplificatore', `${amplifier.brand} ${amplifier.model}`);
  row('Classe / DSP', `Classe ${amplifier.classType}${amplifier.hasDSP ? ' • DSP integrato' : ''}`);

  if (crossover.length > 0) {
    section(`Crossover passivo (${crossover.length === 1 ? '2 vie' : '3 vie'})`);
    crossover.forEach((x) => {
      row(`Incrocio ${x.from} → ${x.to}`, `${x.fc} Hz • ${x.order}° ord. ${x.family} • ${x.z}Ω`);
    });
  }

  section('Cassa acustica');
  row('Tipo', cabinet.type === 'sealed' ? 'Cassa chiusa' : 'Bass-reflex');
  row('Dimensioni esterne (L×A×P)', `${cabinet.externalDimensions.width} × ${cabinet.externalDimensions.height} × ${cabinet.externalDimensions.depth} mm`);
  row('Volume interno netto', `${cabinet.internalVolume} L`);
  row('Materiale', `${cabinet.woodType} ${cabinet.woodThickness}mm`);
  row('Finitura', String(cabinet.finish || '—'));
  if (cabinet.port) {
    const n = cabinet.port.count ?? 1;
    row('Accordo bass-reflex', `${cabinet.port.tuningFrequency} Hz`);
    row('Porte', `${n}× Ø${cabinet.port.diameter}mm, lunghe ${cabinet.port.length}mm${cabinet.port.airVelocity != null ? ` • aria ${cabinet.port.airVelocity} m/s` : ''}`);
  }
  row('Peso stimato (vuota)', `${cabinet.estimatedWeight} kg`);

  section('Predisposizioni cassa attiva (retro)');
  if (cabinet.ampCutout) {
    row('Sede modulo amplificatore', `fresatura ${cabinet.ampCutout.width}×${cabinet.ampCutout.height}mm + fori M4`);
  }
  row('Ventilazione modulo', 'apertura 60×30mm sopra la sede');
  row('Alimentazione', 'presa IEC + interruttore + fusibile');
  row('Filtri crossover + limiter', `nel DSP del modulo ${amplifier.brand} ${amplifier.model}`);

  section('Limiter (nel DSP) — protezione driver');
  row('Soglia RMS', `${limiterVrms.toFixed(1)} Vrms  (${limiterDbu.toFixed(1)} dBu)`);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.text('Programma questa soglia nel limiter del DSP del modulo amplificatore per proteggere il driver.', 16, y);
  y += 8;

  section('Preventivo');
  row('Woofer', formatPrice(pricing.driverPrice));
  if (pricing.hfMidPrice > 0) row('Medio + alti', formatPrice(pricing.hfMidPrice));
  if (pricing.crossoverPrice > 0) row('Crossover', formatPrice(pricing.crossoverPrice));
  row('Amplificatore', formatPrice(pricing.ampPrice));
  row('Cassa (materiali + lavorazione)', formatPrice(pricing.cabinetPrice));
  row('Subtotale', formatPrice(pricing.subtotal));
  row('IVA 22%', formatPrice(pricing.vat));

  // Totale evidenziato
  y += 2;
  doc.setFillColor(...ORANGE);
  doc.rect(12, y - 5, W - 24, 11, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('TOTALE (IVA inclusa)', 16, y + 2);
  doc.text(formatPrice(pricing.total), W - 16, y + 2, { align: 'right' });
  y += 16;

  // ── Footer ──────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Ogni cassa è artigianale: il preventivo finale viene confermato dal nostro team.', W / 2, 285, { align: 'center' });
  doc.text('officinadelsuono.it', W / 2, 290, { align: 'center' });

  return doc;
}
