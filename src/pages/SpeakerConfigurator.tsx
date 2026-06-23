import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, ChevronRight, ChevronLeft,
  CheckCircle, Music, Zap, Layers, Cpu, Box, Palette,
  Check, AlertTriangle, Send, Loader2, Mail, User, Phone, MessageSquare
} from 'lucide-react';

import { DRIVERS, AMPLIFIERS, USE_CASE_LABELS } from '../data/speakerDatabase';
import { calculateFullCabinet, recommendCabinetType, scoreAmplifierMatch } from '../utils/cabinetCalculator';
import type {
  UserConfiguration, SpeakerDriver, Amplifier,
  CabinetDesign, UseCase
} from '../types/speaker';
import { CabinetViewer3D } from '../components/configurator/CabinetViewer3D';
import { DriverVisual, AmpVisual } from '../components/configurator/ComponentVisuals';
import { Plot, PLOT_COLORS } from '../components/configurator/calculators/ui';
import * as Audio from '../utils/audio';
import { subscribeDrivers } from '../services/driverLibrary';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { StepCustomizeCabinet } from './ConfiguratorSteps/StepCustomizeCabinet';
import { StepSummaryNew } from './ConfiguratorSteps/StepSummaryNew';

const STEPS = [
  { id: 1, title: 'Il Tuo Sound', icon: Music },
  { id: 2, title: 'Scegli il Driver', icon: Settings },
  { id: 3, title: 'La Tua Cassa', icon: Box },
  { id: 4, title: 'Personalizza', icon: Palette },
  { id: 5, title: 'Amplificazione', icon: Zap },
  { id: 6, title: 'Il Tuo Progetto', icon: CheckCircle }
];

export default function SpeakerConfigurator() {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [userConfig, setUserConfig] = useState<Partial<UserConfiguration>>({ quantity: 1 });
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [selectedAmpId, setSelectedAmpId] = useState<string | null>(null);
  const [customCabinet, setCustomCabinet] = useState<Partial<CabinetDesign> | null>(null);
  const [drivers, setDrivers] = useState<SpeakerDriver[]>(DRIVERS);
  useEffect(() => subscribeDrivers(list => setDrivers(list.length ? list : DRIVERS)), []);

  const selectedDriver = useMemo(() => drivers.find(d => d.id === selectedDriverId) || null, [drivers, selectedDriverId]);
  const selectedAmplifier = useMemo(() => AMPLIFIERS.find(a => a.id === selectedAmpId) || null, [selectedAmpId]);

  const cabinetDesign = useMemo(() => {
    if (!selectedDriver || !userConfig.useCase) return null;

    // Se esiste un cabinet personalizzato, usalo
    if (customCabinet) {
      return { ...cabinetDesign, ...customCabinet } as CabinetDesign;
    }

    const recommendedType = recommendCabinetType(selectedDriver, userConfig.useCase as UseCase, 'indoor-medium');
    const hasAmp = !!selectedAmpId;
    const ampDimensions = selectedAmplifier ? selectedAmplifier.dimensions : undefined;

    try {
      const calc = calculateFullCabinet(
        selectedDriver,
        recommendedType,
        userConfig.useCase as UseCase,
        'indoor-medium',
        hasAmp,
        ampDimensions
      );
      return calc.cabinetDesign;
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [selectedDriver, userConfig.useCase, selectedAmpId, selectedAmplifier, customCabinet]);

  const handleNext = () => setStep(s => Math.min(STEPS.length, s + 1));
  const handlePrev = () => setStep(s => Math.max(1, s - 1));

  const isNextDisabled = () => {
    if (step === 1 && !userConfig.useCase) return true;
    if (step === 2 && !selectedDriverId) return true;
    if (step === 3 && !cabinetDesign) return true;
    if (step === 4) return false; // Personalizzazione sempre abilitata
    if (step === 5 && !selectedAmpId) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col font-sans">
      {/* Top Navigation / Progress */}
      <div className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold tracking-tight">
              <span className="text-[#F27D26]">Speaker</span>{t('configurator.title')}
            </h1>
            <div className="text-sm font-medium text-zinc-400">
              Step {step} {t('common.loading').split(' ')[0]} {STEPS.length}
            </div>
          </div>
          
          <div className="relative flex justify-between">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] bg-zinc-800 -z-10" />
            <motion.div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-[#F27D26] -z-10"
              initial={{ width: '0%' }}
              animate={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = s.id === step;
              const isCompleted = s.id < step;
              return (
                <div key={s.id} className="flex flex-col items-center gap-2">
                  <motion.div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300
                      ${isActive ? 'border-[#F27D26] bg-[#F27D26]/20 text-[#F27D26]' : 
                        isCompleted ? 'border-[#F27D26] bg-[#F27D26] text-white' : 'border-zinc-800 bg-zinc-900 text-zinc-500'}`}
                  >
                    {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </motion.div>
                  <span className={`text-xs font-medium hidden md:block ${isActive ? 'text-zinc-100' : 'text-zinc-500'}`}>
                    {s.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            {step === 1 && (
              <StepUseCase 
                userConfig={userConfig} 
                setUserConfig={setUserConfig} 
              />
            )}
            {step === 2 && (
              <StepDriverSelect 
                drivers={drivers}
                selectedId={selectedDriverId} 
                onSelect={setSelectedDriverId} 
              />
            )}
            {step === 3 && selectedDriver && cabinetDesign && (
              <StepCabinetPreview
                driver={selectedDriver}
                cabinetDesign={cabinetDesign}
              />
            )}
            {step === 4 && selectedDriver && cabinetDesign && (
              <StepCustomizeCabinet
                cabinet={cabinetDesign}
                onUpdate={(updates) => setCustomCabinet(updates)}
              />
            )}
            {step === 5 && selectedDriver && (
              <StepAmpSelect
                driver={selectedDriver}
                useCase={userConfig.useCase as UseCase}
                amplifiers={AMPLIFIERS}
                selectedId={selectedAmpId}
                onSelect={setSelectedAmpId}
              />
            )}
            {step === 6 && selectedDriver && selectedAmplifier && cabinetDesign && (
              <StepSummaryNew
                driver={selectedDriver}
                amplifier={selectedAmplifier}
                cabinet={cabinetDesign}
                userConfig={userConfig}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Bar */}
      <div className="bg-zinc-950/80 backdrop-blur-xl border-t border-white/10 sticky bottom-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <button
            onClick={handlePrev}
            disabled={step === 1}
            className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all text-zinc-300 hover:text-white disabled:opacity-50 disabled:hover:text-zinc-300 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
            {t('configurator.back')}
          </button>

          {step < STEPS.length ? (
            <button
              onClick={handleNext}
              disabled={isNextDisabled()}
              className="flex items-center gap-2 px-8 py-3 rounded-lg font-bold transition-all bg-[#F27D26] hover:bg-[#E06C1C] text-white shadow-lg shadow-[#F27D26]/20 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed disabled:hover:bg-[#F27D26]"
            >
              {t('configurator.next')}
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <span className="text-xs text-zinc-500 max-w-[16rem] text-right">
              {t('configurator.checkAndOrder')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTI DEGLI STEP
// ─────────────────────────────────────────────────────────────────────────────

function StepUseCase({ 
  userConfig, 
  setUserConfig 
}: { 
  userConfig: Partial<UserConfiguration>, 
  setUserConfig: (c: Partial<UserConfiguration>) => void 
}) {
  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-4xl font-bold mb-4">Qual è il tuo sound?</h2>
        <p className="text-zinc-400 text-lg">Seleziona l'utilizzo principale per la tua cassa. L'AI ottimizzerà il progetto in base a questa scelta.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(USE_CASE_LABELS).map(([key, data]) => {
          const isSelected = userConfig.useCase === key;
          return (
            <motion.div
              key={key}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setUserConfig({ ...userConfig, useCase: key as UseCase })}
              className={`p-6 rounded-2xl border cursor-pointer transition-all duration-200
                ${isSelected 
                  ? 'bg-[#F27D26]/10 border-[#F27D26] shadow-lg shadow-[#F27D26]/10' 
                  : 'bg-zinc-900/50 border-white/5 hover:border-white/20'}`}
            >
              <div className="text-4xl mb-4">{data.icon}</div>
              <h3 className="text-xl font-bold mb-2">{data.label}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{data.description}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function StepDriverSelect({ 
  drivers, 
  selectedId, 
  onSelect 
}: { 
  drivers: SpeakerDriver[], 
  selectedId: string | null, 
  onSelect: (id: string) => void 
}) {
  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-4xl font-bold mb-4">Scegli il Cuore del Sistema</h2>
        <p className="text-zinc-400 text-lg">Seleziona il driver perfetto per le tue esigenze. Solo i migliori brand mondiali.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {drivers.map(driver => {
          const isSelected = selectedId === driver.id;
          return (
            <motion.div
              key={driver.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(driver.id)}
              className={`relative overflow-hidden rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col h-full
                ${isSelected 
                  ? 'bg-[#F27D26]/10 border-[#F27D26] shadow-lg shadow-[#F27D26]/10' 
                  : 'bg-zinc-900/50 border-white/10 hover:bg-zinc-900 hover:border-white/20'}`}
            >
              {isSelected && (
                <div className="absolute top-4 right-4 bg-[#F27D26] text-white p-1 rounded-full z-10">
                  <Check className="w-4 h-4" />
                </div>
              )}
              
              <div className="aspect-square bg-gradient-to-br from-zinc-800/40 to-zinc-950 p-6 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent z-0" />
                <DriverVisual driver={driver} className="w-full h-full relative z-10 drop-shadow-2xl" />
                <span className="absolute bottom-3 left-3 z-10 text-[10px] font-bold uppercase tracking-wider text-zinc-400 bg-zinc-950/70 px-2 py-1 rounded-md backdrop-blur-sm">
                  {driver.type.replace('-', ' ')}
                </span>
              </div>
              
              <div className="p-6 flex-1 flex flex-col">
                <div className="text-sm font-bold text-[#F27D26] uppercase tracking-wider mb-1">
                  {driver.brand}
                </div>
                <h3 className="text-2xl font-bold mb-2">{driver.model}</h3>
                <p className="text-zinc-400 text-sm mb-4 line-clamp-2 flex-1">
                  {driver.description}
                </p>
                
                <div className="grid grid-cols-2 gap-4 text-sm mt-auto pt-4 border-t border-white/5">
                  <div>
                    <span className="block text-zinc-500 mb-1">Dimensioni</span>
                    <span className="font-semibold text-zinc-200">{driver.size}" {driver.type}</span>
                  </div>
                  <div>
                    <span className="block text-zinc-500 mb-1">Potenza</span>
                    <span className="font-semibold text-zinc-200">{driver.powerRMS}W RMS</span>
                  </div>
                  <div>
                    <span className="block text-zinc-500 mb-1">Impedenza</span>
                    <span className="font-semibold text-zinc-200">{driver.impedance} Ω</span>
                  </div>
                  <div>
                    <span className="block text-zinc-500 mb-1">Sensibilità</span>
                    <span className="font-semibold text-zinc-200">{driver.sensitivity} dB</span>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-white/5 flex justify-end items-center">
                  <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                    {driver.madeIn}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function StepCabinetPreview({
  driver, 
  cabinetDesign 
}: {
  driver: SpeakerDriver,
  cabinetDesign: CabinetDesign
}) {
  const splCurve = useMemo(() => {
    try {
      const ts = Audio.tsFromDriver(driver);
      if (cabinetDesign.type === 'sealed') {
        const s = Audio.sealedFromVb(ts, cabinetDesign.internalVolume);
        return Audio.computeResponse({ ts, type: 'sealed', fc: s.fc, qtc: s.qtc });
      }
      const fb = cabinetDesign.port?.tuningFrequency || ts.fs * 0.5;
      const alpha = ts.vas / cabinetDesign.internalVolume;
      return Audio.computeResponse({ ts, type: 'vented', fb, alpha, ql: 7 });
    } catch { return null; }
  }, [driver, cabinetDesign]);

  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-4xl font-bold mb-4">La Tua Cassa</h2>
        <p className="text-zinc-400 text-lg">Progetto acustico generato automaticamente in base ai parametri Thiele-Small del {driver.model}.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Viewer 3D Reale */}
        <div className="rounded-2xl overflow-hidden min-h-[500px] relative shadow-2xl">
          <CabinetViewer3D cabinet={cabinetDesign} showDimensions={true} exploded={false} />
          
          <div className="absolute bottom-6 left-6 right-6 p-4 bg-zinc-950/60 backdrop-blur-md rounded-xl border border-white/10 z-10 flex justify-between items-center pointer-events-none">
            <div>
              <div className="text-xs text-zinc-400 mb-1">Dimensioni Esterne (mm)</div>
              <div className="font-mono font-bold text-lg text-white">
                {cabinetDesign.externalDimensions.width} L × {cabinetDesign.externalDimensions.height} A × {cabinetDesign.externalDimensions.depth} P
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-zinc-400 mb-1">Volume Lordo</div>
              <div className="font-mono font-bold text-lg text-[#F27D26]">
                {cabinetDesign.grossVolume} L
              </div>
            </div>
          </div>
        </div>

        {/* Specifiche Tecniche */}
        <div className="space-y-6">
          <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-8">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Layers className="w-6 h-6 text-[#F27D26]" />
              Progetto Acustico
            </h3>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-zinc-400">Tipo Cassa</span>
                  <span className="font-bold uppercase tracking-wider">{cabinetDesign.type.replace('-', ' ')}</span>
                </div>
                <div className="h-[1px] w-full bg-white/5" />
              </div>
              
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-zinc-400">Volume Netto Interno</span>
                  <span className="font-bold">{cabinetDesign.internalVolume} Litri</span>
                </div>
                <div className="h-[1px] w-full bg-white/5" />
              </div>
              
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-zinc-400">Materiale</span>
                  <span className="font-bold">{cabinetDesign.woodType} {cabinetDesign.woodThickness}mm</span>
                </div>
                <div className="h-[1px] w-full bg-white/5" />
              </div>

              {cabinetDesign.port && (
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-zinc-400">Accordo Bass-Reflex</span>
                    <span className="font-bold">{cabinetDesign.port.tuningFrequency} Hz</span>
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    {(cabinetDesign.port.count ?? 1) > 1
                      ? `${cabinetDesign.port.count}× porte Ø ${cabinetDesign.port.diameter}mm, lunghe ${cabinetDesign.port.length}mm`
                      : `Porta Ø ${cabinetDesign.port.diameter}mm, lunga ${cabinetDesign.port.length}mm`}
                    {cabinetDesign.port.airVelocity != null && ` · aria ${cabinetDesign.port.airVelocity} m/s`}
                  </div>
                  <div className="h-[1px] w-full bg-white/5 mt-2" />
                </div>
              )}
              
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-zinc-400">Peso Stimato (Vuota)</span>
                  <span className="font-bold">{cabinetDesign.estimatedWeight} kg</span>
                </div>
                <div className="h-[1px] w-full bg-white/5" />
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-[#F27D26]/10 rounded-xl border border-[#F27D26]/20">
              <h4 className="font-bold text-[#F27D26] mb-2 text-sm flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Dettagli Costruttivi
              </h4>
              <ul className="text-sm text-zinc-300 space-y-2">
                <li className="flex gap-2"><span className="text-[#F27D26]">•</span> {cabinetDesign.dampingMaterial}</li>
                <li className="flex gap-2"><span className="text-[#F27D26]">•</span> {cabinetDesign.panels.length} pannelli fresati a CNC</li>
                <li className="flex gap-2"><span className="text-[#F27D26]">•</span> {cabinetDesign.bracing.length} rinforzi interni strutturali</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Grafico risposta in frequenza (il cliente vede i grafici, non i numeri) */}
      {splCurve && (
        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#F27D26]" /> Risposta in Frequenza Stimata
          </h3>
          <Plot series={[{ name: 'SPL', color: PLOT_COLORS[0], points: splCurve.spl }]} yLabel="SPL" yUnit="dB" height={220} />
          <p className="text-[10px] text-zinc-600 mt-2">Curva indicativa generata dai parametri del driver (modello alle basse frequenze).</p>
        </div>
      )}
    </div>
  );
}

function StepAmpSelect({
  driver, 
  useCase, 
  amplifiers, 
  selectedId, 
  onSelect 
}: { 
  driver: SpeakerDriver, 
  useCase: UseCase, 
  amplifiers: Amplifier[], 
  selectedId: string | null, 
  onSelect: (id: string) => void 
}) {
  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-4xl font-bold mb-4">Scegli l'Amplificazione</h2>
        <p className="text-zinc-400 text-lg">Moduli attivi in Classe D da integrare nella cassa. L'AI ha calcolato il punteggio di compatibilità con il {driver.model}.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {amplifiers.map(amp => {
          const isSelected = selectedId === amp.id;
          const match = scoreAmplifierMatch(driver, amp, useCase);
          
          return (
            <motion.div
              key={amp.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(amp.id)}
              className={`relative overflow-hidden rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col h-full
                ${isSelected 
                  ? 'bg-[#F27D26]/10 border-[#F27D26] shadow-lg shadow-[#F27D26]/10' 
                  : 'bg-zinc-900/50 border-white/10 hover:bg-zinc-900 hover:border-white/20'}`}
            >
              {isSelected && (
                <div className="absolute top-4 right-4 bg-[#F27D26] text-white p-1 rounded-full z-10 shadow-lg">
                  <Check className="w-4 h-4" />
                </div>
              )}
              
              {/* Score Badge */}
              <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold z-10 flex items-center gap-1 shadow-lg backdrop-blur-md
                ${match.score >= 80 ? 'bg-emerald-500/90 text-white' : 
                  match.score >= 50 ? 'bg-amber-500/90 text-white' : 'bg-red-500/90 text-white'}`}>
                <Cpu className="w-3 h-3" />
                {match.score}% Compatibile
              </div>

              <div className="aspect-video bg-gradient-to-br from-zinc-800/60 to-zinc-950 p-6 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent z-0" />
                <AmpVisual amp={amp} className="w-full h-full relative z-10 drop-shadow-2xl" />
              </div>
              
              <div className="p-6 flex-1 flex flex-col">
                <div className="text-sm font-bold text-[#F27D26] uppercase tracking-wider mb-1">
                  {amp.brand}
                </div>
                <h3 className="text-2xl font-bold mb-2">{amp.model}</h3>
                
                <div className="text-xl font-mono text-zinc-300 mb-4 bg-zinc-950/50 p-3 rounded-lg border border-white/5 inline-block w-max">
                  {amp.powerPerChannel[String(driver.impedance)] || 0}W @ {driver.impedance}Ω
                </div>
                
                {match.warnings.length > 0 && !isSelected && (
                  <div className="mb-4 text-xs text-amber-400/80 flex items-start gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{match.warnings[0]}</span>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4 text-sm mt-auto pt-4 border-t border-white/5">
                  <div>
                    <span className="block text-zinc-500 mb-1">Classe</span>
                    <span className="font-semibold text-zinc-200">{amp.classType}</span>
                  </div>
                  <div>
                    <span className="block text-zinc-500 mb-1">DSP</span>
                    <span className="font-semibold text-zinc-200">{amp.hasDSP ? 'Integrato' : 'No'}</span>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-white/5 flex justify-end items-center">
                  <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                    {amp.madeIn}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function StepSummary({
  driver,
  amplifier,
  cabinet,
  userConfig
}: {
  driver: SpeakerDriver,
  amplifier: Amplifier,
  cabinet: CabinetDesign,
  userConfig: Partial<UserConfiguration>
}) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
  const canSubmit = form.name.trim().length > 1 && emailValid && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      setError('Inserisci nome ed email validi.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const code = `CFG-${Date.now().toString(36).toUpperCase()}`;
      await addDoc(collection(db, 'configurator_requests'), {
        code,
        status: 'nuovo',
        contact: {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          message: form.message.trim(),
        },
        driverId: driver.id,
        driverLabel: `${driver.brand} ${driver.model}`,
        ampId: amplifier.id,
        ampLabel: `${amplifier.brand} ${amplifier.model}`,
        useCase: userConfig.useCase || '',
        quantity: userConfig.quantity || 1,
        cabinetName: cabinet.name,
        createdAt: new Date().toISOString(),
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Errore invio richiesta configuratore', err);
      setError('Si è verificato un errore durante l\'invio. Riprova tra poco.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-4xl font-bold mb-4">La Tua Configurazione</h2>
        <p className="text-zinc-400 text-lg">Controlla i componenti scelti e richiedi il tuo preventivo personalizzato: lo prepariamo a mano e te lo inviamo noi.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Sinistra: Componenti */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#F27D26]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
              <Settings className="w-5 h-5 text-[#F27D26]" />
              Configurazione Sistema
            </h3>

            <div className="flex gap-6 items-center bg-zinc-950/50 p-4 rounded-xl border border-white/5 mb-4">
              <div className="w-20 h-20 bg-zinc-900 rounded-lg flex items-center justify-center p-1.5 shrink-0">
                <DriverVisual driver={driver} showLabel={false} className="w-full h-full" />
              </div>
              <div>
                <div className="text-xs text-[#F27D26] font-bold uppercase">{driver.brand}</div>
                <div className="text-lg font-bold">{driver.model}</div>
                <div className="text-sm text-zinc-400">{driver.size}" {driver.type} • {driver.powerRMS}W RMS</div>
              </div>
            </div>

            <div className="flex gap-6 items-center bg-zinc-950/50 p-4 rounded-xl border border-white/5 mb-4">
              <div className="w-20 h-20 bg-zinc-900 rounded-lg flex items-center justify-center p-1.5 shrink-0">
                <AmpVisual amp={amplifier} className="w-full h-full" />
              </div>
              <div>
                <div className="text-xs text-[#F27D26] font-bold uppercase">{amplifier.brand}</div>
                <div className="text-lg font-bold">{amplifier.model}</div>
                <div className="text-sm text-zinc-400">Classe {amplifier.classType} • {amplifier.hasDSP && 'DSP Integrato'}</div>
              </div>
            </div>

            <div className="flex gap-6 items-center bg-zinc-950/50 p-4 rounded-xl border border-white/5">
              <div className="w-20 h-20 bg-zinc-900 rounded-lg flex items-center justify-center">
                <Box className="w-10 h-10 text-zinc-600" />
              </div>
              <div>
                <div className="text-xs text-[#F27D26] font-bold uppercase">Design Cassa</div>
                <div className="text-lg font-bold">{cabinet.name}</div>
                <div className="text-sm text-zinc-400">{cabinet.woodType} {cabinet.woodThickness}mm • {cabinet.internalVolume} Litri</div>
              </div>
            </div>
          </div>
        </div>

        {/* Destra: Richiesta preventivo */}
        <div className="space-y-6">
          {submitted ? (
            <div className="bg-zinc-900 border border-emerald-500/30 rounded-2xl p-8 text-center shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Richiesta inviata!</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Abbiamo ricevuto la tua configurazione. Prepariamo il preventivo su misura e ti contattiamo a breve all'indirizzo che hai indicato.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-zinc-900 border border-[#F27D26]/30 rounded-2xl p-8 relative shadow-2xl shadow-[#F27D26]/5">
              <h3 className="text-xl font-bold mb-2 flex items-center gap-3">
                <Send className="w-5 h-5 text-[#F27D26]" />
                Richiedi il Preventivo
              </h3>
              <p className="text-zinc-500 text-sm mb-6">Niente prezzi automatici: ogni cassa è artigianale. Lasciaci i tuoi dati e ti inviamo il preventivo personalizzato.</p>

              <div className="space-y-3">
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Nome e cognome *"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#F27D26] transition-colors"
                  />
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="Email *"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#F27D26] transition-colors"
                  />
                </div>
                <div className="relative">
                  <Phone className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    placeholder="Telefono / WhatsApp (opzionale)"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#F27D26] transition-colors"
                  />
                </div>
                <div className="relative">
                  <MessageSquare className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                  <textarea
                    rows={3}
                    placeholder="Messaggio o note (opzionale)"
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm resize-none focus:outline-none focus:border-[#F27D26] transition-colors"
                  />
                </div>
              </div>

              {error && (
                <div className="mt-4 flex items-start gap-2 text-sm text-red-400">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full mt-6 btn-premium py-4 bg-[#F27D26] hover:bg-[#E06C1C] text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#F27D26]"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                {submitting ? 'Invio in corso...' : 'Invia richiesta'}
              </button>

              <p className="text-[11px] text-zinc-600 mt-3 text-center">
                Useremo i tuoi dati solo per inviarti il preventivo.
              </p>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
