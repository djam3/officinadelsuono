/**
 * «E se il mio driver non è quello della scheda?»
 *
 * È la domanda che arriva dopo, quando la cassa è già tagliata. Qui si vede
 * prima: tre curve sovrapposte — nominale e i due esemplari agli estremi della
 * tolleranza — dentro la STESSA cassa, che è già stata costruita su misura
 * nominale e non si ridimensiona da sola.
 *
 * I due numeri da impostare non sono inventati dal calcolatore e non hanno un
 * valore «giusto»: vanno letti sulla scheda del driver quando c'è. Il
 * predefinito è dichiarato per quello che è — un'ipotesi di partenza.
 */

import * as React from 'react';
import { NumField, Section, Plot, PLOT_COLORS, InfoLink, type Series } from './ui';
import { bandaTolleranza } from '../../utils/audio/tolleranza';
import type { CurvePoint, DesignResult, TSParams } from '../../utils/audio';

interface Props {
  ts: TSParams | null;
  design: DesignResult | null;
  tipo: 'sealed' | 'vented' | 'altro';
  cedevolezzaPct: number | '';
  motorePct: number | '';
  onChange: (campo: 'tolCedevolezzaPct' | 'tolMotorePct', v: number | '') => void;
}

const TINTE: Record<string, string> = {
  Nominale: PLOT_COLORS[0],
  Morbido: PLOT_COLORS[1],
  Rigido: PLOT_COLORS[2],
};

const GIUDIZIO_TESTO = {
  robusto: { etichetta: 'Robusto', tinta: '#7FD8F5' },
  sensibile: { etichetta: 'Sensibile', tinta: '#F0B94A' },
  critico: { etichetta: 'Critico', tinta: '#E8705A' },
} as const;

/** la curva si calcola fino a 2 kHz per avere il riferimento giusto, ma sopra
 *  i 300 Hz sono tre righe sovrapposte che non dicono niente: si tagliano */
function perIlGrafico(p: CurvePoint[]): CurvePoint[] {
  return p.filter(x => x.f >= 15 && x.f <= 300);
}

export function TolleranzaSection({ ts, design, tipo, cedevolezzaPct, motorePct, onChange }: Props) {
  const vbL = design?.acoustic.vbL ?? 0;
  const ced = typeof cedevolezzaPct === 'number' ? cedevolezzaPct : 0;
  const mot = typeof motorePct === 'number' ? motorePct : 0;

  const banda = React.useMemo(() => {
    if (!ts || !design || vbL <= 0) return null;
    if (tipo !== 'sealed' && tipo !== 'vented') return null;
    if (ced <= 0 && mot <= 0) return null;
    return bandaTolleranza({
      ts, tipo, vbL,
      fbHz: design.acoustic.fbHz,
      ql: design.boxLossQ,
      cedevolezzaPct: ced,
      motorePct: mot,
    });
  }, [ts, design, tipo, vbL, ced, mot]);

  if (tipo !== 'sealed' && tipo !== 'vented') return null;

  const serie: Series[] = banda
    ? banda.varianti.map(v => ({
      name: v.nome,
      color: TINTE[v.nome] ?? PLOT_COLORS[0],
      points: perIlGrafico(v.spl),
    }))
    : [];

  return (
    <Section
      title="Se il driver non è quello della scheda"
      subtitle="Stessa cassa, esemplari diversi: quanto cambia la risposta dentro la tolleranza di produzione."
      right={<InfoLink id="tolleranza" />}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <NumField
          label="Tolleranza sospensione" infoId="cms"
          unit="±%"
          value={cedevolezzaPct}
          onChange={v => onChange('tolCedevolezzaPct', v)}
          hint="Dispersione della cedevolezza Cms. Muove Vas, Fs e i Q insieme."
        />
        <NumField
          label="Tolleranza motore" infoId="bl"
          unit="±%"
          value={motorePct}
          onChange={v => onChange('tolMotorePct', v)}
          hint="Dispersione del Bl. Lascia fermi Fs e Vas, muove il solo Qes."
        />
      </div>

      <p className="text-[11px] text-graphite mt-3 leading-relaxed">
        Questi due numeri stanno sulla scheda del driver quando il costruttore li dichiara: se ci sono, usa
        quelli. I valori proposti qui sono solo un punto di partenza, non una misura, e il calcolatore non
        ha modo di sapere quanto vale davvero per il tuo modello. Le due tolleranze sono separate perché
        sono due cause fisiche indipendenti — la sospensione e il magnete — e fanno cose diverse: la prima
        muove Vas, Fs e i Q tutti insieme, la seconda tocca il solo Qes, e col quadrato.
      </p>

      {!banda && (
        <p className="text-sm text-graphite italic mt-4">
          {vbL <= 0
            ? 'Completa il progetto per vedere il confronto.'
            : 'Imposta almeno una delle due tolleranze sopra lo zero.'}
        </p>
      )}

      {banda && (
        <>
          <div className="mt-5">
            <Plot
              height={250}
              yLabel="Livello"
              yUnit="dB"
              series={serie}
            />
          </div>

          <div className="overflow-x-auto mt-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-graphite-dim">
                  <th className="text-left font-normal py-2 pr-4">Esemplare</th>
                  <th className="text-right font-normal py-2 px-3">Fs</th>
                  <th className="text-right font-normal py-2 px-3">Qts</th>
                  {banda.varianti[0].qtcEff !== undefined && (
                    <th className="text-right font-normal py-2 px-3">Qtc</th>
                  )}
                  <th className="text-right font-normal py-2 px-3">F3</th>
                  <th className="text-right font-normal py-2 pl-3">Gobba</th>
                </tr>
              </thead>
              <tbody>
                {banda.varianti.map(v => (
                  <tr key={v.nome} className="border-t border-paper/10">
                    <td className="py-2 pr-4">
                      <span className="inline-flex items-center gap-2">
                        <span
                          aria-hidden
                          className="inline-block w-3 h-[2px]"
                          style={{ background: TINTE[v.nome] }}
                        />
                        <span className="text-paper">{v.nome}</span>
                      </span>
                      <span className="block text-[11px] text-graphite-dim">{v.nota}</span>
                    </td>
                    <td className="text-right py-2 px-3 font-mono">{v.fsHz.toFixed(1)} Hz</td>
                    <td className="text-right py-2 px-3 font-mono">{v.qts.toFixed(3)}</td>
                    {v.qtcEff !== undefined && (
                      <td className="text-right py-2 px-3 font-mono">{v.qtcEff.toFixed(3)}</td>
                    )}
                    <td className="text-right py-2 px-3 font-mono">{v.f3Hz.toFixed(1)} Hz</td>
                    <td className="text-right py-2 pl-3 font-mono">
                      {v.piccoDb < 0.05 ? '—' : `+${v.piccoDb.toFixed(2)} dB`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span
              className="text-[11px] uppercase tracking-wider border px-2 py-1"
              style={{
                color: GIUDIZIO_TESTO[banda.giudizio].tinta,
                borderColor: `${GIUDIZIO_TESTO[banda.giudizio].tinta}66`,
              }}
            >
              {GIUDIZIO_TESTO[banda.giudizio].etichetta}
            </span>
            <span className="text-[13px] text-graphite font-mono">
              F3 entro {banda.spanF3Hz.toFixed(1)} Hz ({banda.spanF3Pct.toFixed(0)}%)
              {banda.spanPiccoDb >= 0.05 && ` · gobba entro ${banda.spanPiccoDb.toFixed(2)} dB`}
            </span>
          </div>
          <p className="text-graphite leading-relaxed text-[15px] mt-3 max-w-3xl">{banda.commento}</p>
        </>
      )}
    </Section>
  );
}
