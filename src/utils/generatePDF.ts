import { jsPDF } from 'jspdf';
import { SpeakerProject } from '../types/speaker';

/**
 * Generates a PDF containing the technical drawings of the cabinet panels.
 * Uses browser's native Canvas API to draw panels with dimensions, then exports to PDF via jsPDF.
 */
export async function generateProjectPDF(project: SpeakerProject): Promise<Blob> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PAGE_WIDTH = 210;
  
  // Officina del Suono brand colors
  const primaryColor = [25, 25, 25]; // Dark aesthetic

  // -- Page 1: Title and Summary --
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, PAGE_WIDTH, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('Officina del Suono', PAGE_WIDTH / 2, 20, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Progetto Tecnico Cassa Acustica', PAGE_WIDTH / 2, 30, { align: 'center' });
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Sommario Progetto', 20, 60);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nome: ${project.cabinet?.name || 'Progetto Custom'}`, 20, 75);
  doc.text(`Data: ${new Date().toLocaleDateString()}`, 20, 85);
  doc.text(`Tipo di Cassa: ${project.cabinet?.type || 'N/A'}`, 20, 95);
  doc.text(`Volume Interno: ${project.cabinet?.internalVolume || 0} Litri`, 20, 105);
  doc.text(`Materiale: ${project.cabinet?.woodType || 'N/A'} (${project.cabinet?.woodThickness || 0}mm)`, 20, 115);
  
  doc.text(`Driver: ${project.driver?.brand || 'N/A'} ${project.driver?.model || ''}`, 20, 135);
  doc.text(`Amplificatore: ${project.amplifier?.brand || 'N/A'} ${project.amplifier?.model || ''}`, 20, 145);
  
  // -- Page 2: BOM (Bill of Materials) --
  doc.addPage();
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Distinta Base (BOM)', 20, 20);
  
  doc.setFontSize(14);
  let y = 35;
  doc.text('Pannelli in Legno:', 20, y);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  y += 10;
  
  if (project.cabinet?.panels) {
    project.cabinet.panels.forEach(panel => {
      doc.text(`• ${panel.quantity}x ${panel.name}: ${panel.width}x${panel.height}mm`, 25, y);
      y += 8;
    });
  }
  
  y += 15;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Componenti e Accessori:', 20, y);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  y += 10;
  doc.text(`• Driver: 1x ${project.driver?.brand || 'N/A'} ${project.driver?.model || ''}`, 25, y); y += 8;
  if (project.amplifier) {
    doc.text(`• Amplificatore: 1x ${project.amplifier.brand} ${project.amplifier.model}`, 25, y); y += 8;
  }
  if (project.cabinet?.port) {
    doc.text(`• Porta Reflex: ${project.cabinet.port.shape} (Accordato a ${project.cabinet.port.tuningFrequency}Hz)`, 25, y); y += 8;
  }
  if (project.cabinet?.dampingMaterial) {
    doc.text(`• Materiale Fonoassorbente: ${project.cabinet.dampingMaterial}`, 25, y); y += 8;
  }
  if (project.cabinet?.finish) {
    doc.text(`• Finitura: ${project.cabinet.finish}`, 25, y); y += 8;
  }
  
  // -- Pages for Panels (Technical Drawings) --
  if (project.cabinet?.panels) {
    for (const panel of project.cabinet.panels) {
      doc.addPage();
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(`Disegno Tecnico: ${panel.name}`, 20, 20);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Dimensioni: ${panel.width} x ${panel.height} mm`, 20, 30);
      doc.text(`Spessore: ${panel.thickness} mm`, 20, 36);
      doc.text(`Quantità: ${panel.quantity}`, 20, 42);
      if (panel.notes) {
        doc.text(`Note: ${panel.notes}`, 20, 48);
      }
      
      // Generate Canvas
      const canvas = document.createElement('canvas');
      const drawingWidthMM = 160;
      const drawingHeightMM = 160;
      const maxPanelDim = Math.max(panel.width, panel.height);
      
      const cw = drawingWidthMM * 6; // High DPI for crisp printing
      const ch = drawingHeightMM * 6;
      canvas.width = cw;
      canvas.height = ch;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, cw, ch);
        
        const pxPerMM = (cw * 0.75) / maxPanelDim;
        const drawW = panel.width * pxPerMM;
        const drawH = panel.height * pxPerMM;
        
        const offsetX = (cw - drawW) / 2;
        const offsetY = (ch - drawH) / 2;
        
        // Draw Panel Area
        ctx.fillStyle = '#f9f9f9';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.fillRect(offsetX, offsetY, drawW, drawH);
        ctx.strokeRect(offsetX, offsetY, drawW, drawH);
        
        // Dimensions Line & Text
        ctx.fillStyle = '#000000';
        ctx.strokeStyle = '#666666';
        ctx.lineWidth = 2;
        ctx.font = '32px "Courier New", Courier, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Width dimension
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY - 30);
        ctx.lineTo(offsetX + drawW, offsetY - 30);
        ctx.moveTo(offsetX, offsetY - 40);
        ctx.lineTo(offsetX, offsetY - 20);
        ctx.moveTo(offsetX + drawW, offsetY - 40);
        ctx.lineTo(offsetX + drawW, offsetY - 20);
        ctx.stroke();
        ctx.fillText(`${panel.width} mm`, offsetX + drawW / 2, offsetY - 50);
        
        // Height dimension
        ctx.beginPath();
        ctx.moveTo(offsetX - 30, offsetY);
        ctx.lineTo(offsetX - 30, offsetY + drawH);
        ctx.moveTo(offsetX - 40, offsetY);
        ctx.lineTo(offsetX - 20, offsetY);
        ctx.moveTo(offsetX - 40, offsetY + drawH);
        ctx.lineTo(offsetX - 20, offsetY + drawH);
        ctx.stroke();
        
        ctx.save();
        ctx.translate(offsetX - 50, offsetY + drawH / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(`${panel.height} mm`, 0, 0);
        ctx.restore();
        
        // Draw Holes
        if (panel.holes) {
          panel.holes.forEach(hole => {
            const hx = offsetX + hole.x * pxPerMM;
            const hy = offsetY + drawH - (hole.y * pxPerMM);
            
            ctx.beginPath();
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#000000';
            
            if (hole.shape === 'circle' && hole.diameter) {
               const r = (hole.diameter / 2) * pxPerMM;
               ctx.arc(hx, hy, r, 0, Math.PI * 2);
            } else if (hole.shape === 'rectangle' && hole.width && hole.height) {
               const hw = hole.width * pxPerMM;
               const hh = hole.height * pxPerMM;
               ctx.rect(hx - hw/2, hy - hh/2, hw, hh);
            } else if (hole.shape === 'rounded-rect' && hole.width && hole.height && hole.cornerRadius) {
               const hw = hole.width * pxPerMM;
               const hh = hole.height * pxPerMM;
               const r = hole.cornerRadius * pxPerMM;
               // @ts-ignore
               if (typeof ctx.roundRect === 'function') {
                 // @ts-ignore
                 ctx.roundRect(hx - hw/2, hy - hh/2, hw, hh, r);
               } else {
                 ctx.rect(hx - hw/2, hy - hh/2, hw, hh);
               }
            }
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.stroke();
            
            // Crosshair
            ctx.beginPath();
            ctx.moveTo(hx - 20, hy);
            ctx.lineTo(hx + 20, hy);
            ctx.moveTo(hx, hy - 20);
            ctx.lineTo(hx, hy + 20);
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#cc0000';
            ctx.stroke();
            
            // Hole Label
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 24px Arial';
            ctx.fillText(hole.label, hx, hy + 30);
            
            ctx.font = '22px Arial';
            if (hole.shape === 'circle' && hole.diameter) {
               ctx.fillText(`Ø${hole.diameter}`, hx, hy + 60);
            } else if ((hole.shape === 'rectangle' || hole.shape === 'rounded-rect') && hole.width && hole.height) {
               ctx.fillText(`${hole.width}x${hole.height}`, hx, hy + 60);
            }
            
            // Coordinates from bottom-left
            ctx.font = '20px Arial';
            ctx.fillStyle = '#666666';
            ctx.fillText(`X:${hole.x} Y:${hole.y}`, hx, hy + 90);
          });
        }
      }
      
      const imgData = canvas.toDataURL('image/png');
      doc.addImage(imgData, 'PNG', 25, 60, 160, 160);
    }
  }
  
  return doc.output('blob');
}
