/**
 * Misurare il driver che hai, invece di credere alla scheda.
 *
 * La sezione sulla tolleranza dice quando la media di produzione non basta.
 * Questa dice come si fa a non usarla: quattro numeri letti su una curva di
 * impedenza diventano i Q, e una seconda misura — con una massa attaccata al
 * cono, o con una cassa di prova di volume noto — dà il Vas.
 *
 * Sta chiusa finché non serve. È la cosa più avanzata del calcolatore e la usa
 * una minoranza; aperta sempre, occuperebbe metà della scheda Driver a chi sta
 * solo copiando i valori da un PDF.
 */

import * as React from 'react';
import { ChevronDown, Ruler, ArrowDownToLine } from 'lucide-react';
import { NumField, Section, ActionButton, Warnings } from './ui';
import { blDaMisure, qDaImpedenza, vasDaMassaAggiunta, vasDaVolumeNoto } from '../../utils/audio/misura';
import { useProgettoSalvato } from '../../hooks/useProgettoSalvato';
import type { TSInput } from '../../utils/audio';

interface Props {
  /** area del cono già nota: serve alla strada della massa aggiunta */
  sdCm2: number | '';
  /**
   * `pulisci` elenca i campi che la misura NON ha determinato e che, restando
   * al valore di prima, contraddirebbero quelli nuovi. Vanno tolti, non messi
   * a zero: senza, il motore li deriva da quello che c'è ed esce un set
   * coerente; azzerati, resterebbero lì a dire il falso.
   */
  onApplica: (patch: Partial<TSInput>, pulisci: (keyof TSInput)[]) => void;
}

interface DatiMisura {
  reOhm: number | '';
  fsHz: number | '';
  zMaxOhm: number | '';
  f1Hz: number | '';
  f2Hz: number | '';
  fsConMassaHz: number | '';
  massaG: number | '';
  vbProvaL: number | '';
  fcProvaHz: number | '';
  qtcProva: number | '';
  metodo: string;
}

const VUOTI: DatiMisura = {
  reOhm: '', fsHz: '', zMaxOhm: '', f1Hz: '', f2Hz: '',
  fsConMassaHz: '', massaG: '',
  vbProvaL: '', fcProvaHz: '', qtcProva: '',
  metodo: 'massa',
};

const num = (v: number | '') => (typeof v === 'number' && isFinite(v) ? v : 0);

export function MisuraSection({ sdCm2, onApplica }: Props) {
  const [aperta, setAperta] = React.useState(false);
  const [d, setD] = useProgettoSalvato<DatiMisura>('misura', VUOTI);
  const set = <K extends keyof DatiMisura>(k: K) => (v: DatiMisura[K]) => setD({ ...d, [k]: v });

  const haImpedenza = num(d.reOhm) > 0 && num(d.fsHz) > 0 && num(d.zMaxOhm) > 0 && num(d.f1Hz) > 0 && num(d.f2Hz) > 0;
  const q = haImpedenza
    ? qDaImpedenza({
      reOhm: num(d.reOhm), fsHz: num(d.fsHz), zMaxOhm: num(d.zMaxOhm),
      f1Hz: num(d.f1Hz), f2Hz: num(d.f2Hz),
    })
    : null;

  const haMassa = num(d.fsHz) > 0 && num(d.fsConMassaHz) > 0 && num(d.massaG) > 0 && num(sdCm2) > 0;
  const massa = haMassa
    ? vasDaMassaAggiunta({
      fsHz: num(d.fsHz), fsConMassaHz: num(d.fsConMassaHz),
      massaG: num(d.massaG), sdCm2: num(sdCm2),
    })
    : null;

  const haVolume = num(d.fsHz) > 0 && num(d.vbProvaL) > 0 && num(d.fcProvaHz) > 0;
  const volume = haVolume
    ? vasDaVolumeNoto({
      fsHz: num(d.fsHz), vbL: num(d.vbProvaL), fcHz: num(d.fcProvaHz),
      qtsLibero: q?.qts, qtcMisurato: num(d.qtcProva) > 0 ? num(d.qtcProva) : undefined,
    })
    : null;

  const vasScelto = d.metodo === 'volume' ? volume?.vasL : massa?.vasL;

  const applica = () => {
    const patch: Partial<TSInput> = {};
    const pulisci: (keyof TSInput)[] = [];

    if (num(d.fsHz) > 0) patch.fs = num(d.fsHz);
    if (num(d.reOhm) > 0) patch.re = num(d.reOhm);
    if (q && q.qms > 0) {
      patch.qms = +q.qms.toFixed(3);
      patch.qes = +q.qes.toFixed(4);
      patch.qts = +q.qts.toFixed(4);
    }

    if (massa && d.metodo === 'massa' && massa.mmsG > 0) {
      patch.mms = +massa.mmsG.toFixed(2);
      patch.cms = +massa.cmsMmN.toFixed(4);
      // con Fs, Mms, Re e Qes il fattore di forza non e' piu' libero
      const bl = blDaMisure(num(d.fsHz), massa.mmsG, num(d.reOhm), patch.qes ?? 0);
      if (bl) patch.bl = +bl.toFixed(2);
      else pulisci.push('bl');
    } else if (vasScelto && vasScelto > 0) {
      // la strada del volume noto non dice niente su massa e motore: quelli di
      // prima apparterrebbero a un altro altoparlante
      pulisci.push('mms', 'cms', 'bl');
    }

    if (vasScelto && vasScelto > 0) patch.vas = +vasScelto.toFixed(2);
    onApplica(patch, pulisci);
  };

  const avvisi = [...(q?.avvisi ?? []), ...(massa?.avvisi ?? []), ...(volume?.avvisi ?? [])];

  return (
    <Section
      title="Misura il tuo esemplare"
      subtitle="I parametri di scheda sono una media di produzione. Questi sono i tuoi."
      right={
        <button
          type="button"
          onClick={() => setAperta(a => !a)}
          aria-expanded={aperta}
          className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-graphite hover:text-marker transition-colors"
        >
          {aperta ? 'Chiudi' : 'Apri'}
          <ChevronDown className={`w-4 h-4 transition-transform ${aperta ? 'rotate-180' : ''}`} />
        </button>
      }
    >
      {!aperta && (
        <p className="text-[13px] text-graphite leading-relaxed max-w-3xl">
          Servono una resistenza di valore noto in serie al driver, un generatore di toni e qualcosa che
          legga il livello. Il driver va sospeso in aria libera, lontano da superfici, e pilotato piano.
        </p>
      )}

      {aperta && (
        <div className="space-y-6">
          {/* ── 1. i Q dalla curva di impedenza ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Ruler className="w-4 h-4 text-marker" strokeWidth={1.6} />
              <h4 className="text-[13px] uppercase tracking-wider text-paper">1 · I Q dalla curva di impedenza</h4>
            </div>
            <p className="text-[13px] text-graphite leading-relaxed mb-4 max-w-3xl">
              In aria libera l&rsquo;impedenza ha un picco alla risonanza. Servono quattro numeri: la resistenza
              in continua misurata col tester, la frequenza e il valore del picco, e le due frequenze — una
              sotto e una sopra — in cui la curva passa per un livello che il calcolatore ti dice appena hai
              inserito i primi tre.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <NumField label="Re in continua" unit="Ω" value={d.reOhm} onChange={set('reOhm')} infoId="re" />
              <NumField label="Fs del picco" unit="Hz" value={d.fsHz} onChange={set('fsHz')} infoId="fs" />
              <NumField label="Z al picco" unit="Ω" value={d.zMaxOhm} onChange={set('zMaxOhm')} />
            </div>
            {q && (
              <p className="text-[12px] text-marker mt-3 font-mono">
                Leggi f1 e f2 dove la curva passa per {q.livelloOhm.toFixed(2)} Ω
                <span className="text-graphite-dim"> (= √r₀ · Re, con r₀ = {q.r0.toFixed(2)})</span>
              </p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
              <NumField label="f1 sotto il picco" unit="Hz" value={d.f1Hz} onChange={set('f1Hz')} />
              <NumField label="f2 sopra il picco" unit="Hz" value={d.f2Hz} onChange={set('f2Hz')} />
            </div>

            {q && q.qms > 0 && (
              <div className="riempi grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                <Risultato etichetta="Qms" valore={q.qms.toFixed(3)} />
                <Risultato etichetta="Qes" valore={q.qes.toFixed(4)} />
                <Risultato etichetta="Qts" valore={q.qts.toFixed(4)} acceso />
                <Risultato
                  etichetta="√(f1·f2)"
                  valore={`${q.fsDaiPunti.toFixed(1)} Hz`}
                  nota={`scarto ${q.scartoFsPct.toFixed(1)}%`}
                />
              </div>
            )}
            <p className="text-[11px] text-graphite-dim mt-3 leading-relaxed max-w-3xl">
              L&rsquo;ultimo riquadro è il controllo, ed è la parte più utile: nel modello la media geometrica
              di f1 e f2 vale esattamente la risonanza. Se non torna, uno dei tre numeri è stato letto male.
              L&rsquo;induttanza della bobina, che qui non compare, alza i Q dello 0,5% con 0,8 mH e
              dell&rsquo;1,7% con 3 mH: meno dell&rsquo;errore della misura stessa.
            </p>
          </div>

          {/* ── 2. il Vas ── */}
          <div className="border-t border-paper/10 pt-5">
            <div className="flex items-center gap-2 mb-3">
              <Ruler className="w-4 h-4 text-marker" strokeWidth={1.6} />
              <h4 className="text-[13px] uppercase tracking-wider text-paper">2 · Il Vas, per una delle due strade</h4>
            </div>

            <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Come misurare il Vas">
              {[
                { id: 'massa', label: 'Massa aggiunta al cono' },
                { id: 'volume', label: 'Cassa di prova di volume noto' },
              ].map(o => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setD({ ...d, metodo: o.id })}
                  aria-pressed={d.metodo === o.id}
                  className={`text-[12px] px-3 py-2 border transition-colors ${
                    d.metodo === o.id
                      ? 'border-marker/60 text-marker bg-marker/5'
                      : 'border-paper/10 text-graphite hover:text-paper'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>

            {d.metodo === 'massa' ? (
              <>
                <p className="text-[13px] text-graphite leading-relaxed mb-4 max-w-3xl">
                  Attacca al cono una massa nota — pasta adesiva o monete fissate col nastro, distribuite in
                  modo simmetrico e vicino al centro, mai sulla sospensione — e rimisura la risonanza. Punta a
                  farla scendere del 20–30%: sotto il 15% l&rsquo;errore di lettura pesa troppo.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <NumField label="Fs con la massa" unit="Hz" value={d.fsConMassaHz} onChange={set('fsConMassaHz')} />
                  <NumField label="Massa aggiunta" unit="g" value={d.massaG} onChange={set('massaG')} />
                </div>
                {!num(sdCm2) && (
                  <p className="text-[12px] text-segnale mt-3">
                    Serve anche l&rsquo;area del cono Sd, qui sopra nei parametri: senza, la cedevolezza non
                    diventa un volume.
                  </p>
                )}
                {massa && massa.mmsG > 0 && (
                  <div className="riempi grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                    <Risultato etichetta="Mms" valore={`${massa.mmsG.toFixed(1)} g`} />
                    <Risultato etichetta="Cms" valore={`${massa.cmsMmN.toFixed(3)} mm/N`} />
                    <Risultato etichetta="Vas" valore={`${massa.vasL.toFixed(1)} L`} acceso />
                    <Risultato etichetta="Calo della Fs" valore={`${massa.calaPct.toFixed(0)}%`} />
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="text-[13px] text-graphite leading-relaxed mb-4 max-w-3xl">
                  Monta il driver su una cassa chiusa ben sigillata e di volume noto — netto, tolto
                  l&rsquo;ingombro del cestello, e senza materiale assorbente dentro — e rimisura. La
                  risonanza sale di √(1+Vas/Vb). Se rileggi anche il Qtc sulla stessa curva, il calcolatore
                  ricava il rapporto due volte per strade che non si parlano e ti dice se coincidono.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <NumField label="Volume netto di prova" unit="L" value={d.vbProvaL} onChange={set('vbProvaL')} infoId="vb" />
                  <NumField label="Fc in cassa" unit="Hz" value={d.fcProvaHz} onChange={set('fcProvaHz')} />
                  <NumField label="Qtc in cassa" value={d.qtcProva} onChange={set('qtcProva')} infoId="qtc" hint="Facoltativo, ma è il controllo." />
                </div>
                {volume && volume.vasL > 0 && (
                  <div className="riempi grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                    <Risultato etichetta="Vas/Vb dalla Fc" valore={volume.alphaDaF.toFixed(2)} />
                    {volume.alphaDaQ !== undefined && (
                      <Risultato
                        etichetta="Vas/Vb dal Q"
                        valore={volume.alphaDaQ.toFixed(2)}
                        nota={volume.scartoPct !== undefined ? `scarto ${volume.scartoPct.toFixed(1)}%` : undefined}
                      />
                    )}
                    <Risultato etichetta="Vas" valore={`${volume.vasL.toFixed(1)} L`} acceso />
                  </div>
                )}
              </>
            )}
          </div>

          <Warnings items={avvisi} />

          <div className="border-t border-paper/10 pt-5 flex flex-wrap items-center gap-3">
            <ActionButton onClick={applica} disabled={!q && !massa && !volume}>
              <span className="inline-flex items-center gap-1.5">
                <ArrowDownToLine className="w-4 h-4" /> Usa questi valori nel progetto
              </span>
            </ActionButton>
            <span className="text-[11px] text-graphite-dim">
              Sovrascrive solo i campi che questa misura ha davvero prodotto.
            </span>
          </div>
        </div>
      )}
    </Section>
  );
}

function Risultato({ etichetta, valore, nota, acceso }: {
  etichetta: string; valore: string; nota?: string; acceso?: boolean;
}) {
  return (
    <div className="border border-paper/10 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-graphite-dim">{etichetta}</div>
      <div className={`font-mono text-[15px] ${acceso ? 'text-marker' : 'text-paper'}`}>{valore}</div>
      {nota && <div className="text-[10px] text-graphite-dim mt-0.5">{nota}</div>}
    </div>
  );
}
