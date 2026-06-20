import { CabinetDesign } from '../types/speaker';

/**
 * Generates a standard DXF (AutoCAD R12 compatible) file content for CNC cutting.
 * Each panel is assigned a separate layer, and all holes are drawn using precise lines and arcs.
 */
export function generateCabinetDXF(cabinet: CabinetDesign): string {
  let dxf = '';

  const add = (code: number | string, value: string | number) => {
    dxf += `${code}\n${value}\n`;
  };

  add(0, 'SECTION');
  add(2, 'HEADER');
  add(9, '$ACADVER');
  add(1, 'AC1009'); // AutoCAD R12 compatibility
  add(0, 'ENDSEC');

  add(0, 'SECTION');
  add(2, 'TABLES');
  
  add(0, 'TABLE');
  add(2, 'LAYER');
  add(70, cabinet.panels.length);
  
  cabinet.panels.forEach((panel, i) => {
    add(0, 'LAYER');
    add(2, `Panel_${panel.name.replace(/[^a-zA-Z0-9]/g, '_')}_${i}`);
    add(70, 0);
    add(62, (i % 7) + 1); // Cycle through standard DXF colors
    add(6, 'CONTINUOUS');
  });
  
  add(0, 'ENDTAB');
  add(0, 'ENDSEC');

  add(0, 'SECTION');
  add(2, 'ENTITIES');

  let offsetX = 0;
  const MARGIN = 100;

  cabinet.panels.forEach((panel, i) => {
    const layerName = `Panel_${panel.name.replace(/[^a-zA-Z0-9]/g, '_')}_${i}`;
    const startX = offsetX;
    const startY = 0;

    // Disegna il perimetro del pannello (bottom, right, top, left)
    addLine(layerName, startX, startY, startX + panel.width, startY);
    addLine(layerName, startX + panel.width, startY, startX + panel.width, startY + panel.height);
    addLine(layerName, startX + panel.width, startY + panel.height, startX, startY + panel.height);
    addLine(layerName, startX, startY + panel.height, startX, startY);

    addText(layerName, `${panel.name} (${panel.width}x${panel.height}mm) - Qty: ${panel.quantity}`, startX, startY + panel.height + 15, 10);

    if (panel.holes) {
      panel.holes.forEach(hole => {
        const hx = startX + hole.x;
        const hy = startY + hole.y;

        if (hole.shape === 'circle' && hole.diameter) {
          addCircle(layerName, hx, hy, hole.diameter / 2);
        } else if (hole.shape === 'rectangle' && hole.width && hole.height) {
          const hw = hole.width;
          const hh = hole.height;
          const x1 = hx - hw / 2;
          const y1 = hy - hh / 2;
          const x2 = hx + hw / 2;
          const y2 = hy + hh / 2;

          addLine(layerName, x1, y1, x2, y1);
          addLine(layerName, x2, y1, x2, y2);
          addLine(layerName, x2, y2, x1, y2);
          addLine(layerName, x1, y2, x1, y1);
        } else if (hole.shape === 'rounded-rect' && hole.width && hole.height && hole.cornerRadius) {
          const hw = hole.width;
          const hh = hole.height;
          const r = hole.cornerRadius;
          const x1 = hx - hw / 2;
          const y1 = hy - hh / 2;
          const x2 = hx + hw / 2;
          const y2 = hy + hh / 2;

          // Lines
          addLine(layerName, x1 + r, y1, x2 - r, y1);
          addLine(layerName, x2, y1 + r, x2, y2 - r);
          addLine(layerName, x2 - r, y2, x1 + r, y2);
          addLine(layerName, x1, y2 - r, x1, y1 + r);

          // Arcs
          addArc(layerName, x2 - r, y1 + r, r, 270, 360);
          addArc(layerName, x2 - r, y2 - r, r, 0, 90);
          addArc(layerName, x1 + r, y2 - r, r, 90, 180);
          addArc(layerName, x1 + r, y1 + r, r, 180, 270);
        }

        addText(layerName, hole.label, hx, hy, 5);
      });
    }

    if (panel.notes) {
      addText(layerName, `Note: ${panel.notes}`, startX, startY - 20, 8);
    }

    offsetX += panel.width + MARGIN;
  });

  add(0, 'ENDSEC');
  add(0, 'EOF');

  function addLine(layer: string, x1: number, y1: number, x2: number, y2: number) {
    add(0, 'LINE');
    add(8, layer);
    add(10, x1.toFixed(3));
    add(20, y1.toFixed(3));
    add(30, 0);
    add(11, x2.toFixed(3));
    add(21, y2.toFixed(3));
    add(31, 0);
  }

  function addCircle(layer: string, cx: number, cy: number, radius: number) {
    add(0, 'CIRCLE');
    add(8, layer);
    add(10, cx.toFixed(3));
    add(20, cy.toFixed(3));
    add(30, 0);
    add(40, radius.toFixed(3));
  }

  function addArc(layer: string, cx: number, cy: number, radius: number, startAngle: number, endAngle: number) {
    add(0, 'ARC');
    add(8, layer);
    add(10, cx.toFixed(3));
    add(20, cy.toFixed(3));
    add(30, 0);
    add(40, radius.toFixed(3));
    add(50, startAngle.toFixed(3));
    add(51, endAngle.toFixed(3));
  }

  function addText(layer: string, text: string, x: number, y: number, height: number) {
    add(0, 'TEXT');
    add(8, layer);
    add(10, x.toFixed(3));
    add(20, y.toFixed(3));
    add(30, 0);
    add(40, height.toFixed(3));
    add(1, text);
  }

  return dxf;
}
