import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useCartStore } from '../../store/cartStore';
import {
  Settings, Send, Loader2, Mail, User, Phone, MessageSquare, CheckCircle, AlertTriangle, ShoppingCart as CartIcon, FileDown,
  Truck, ShieldCheck, Clock, MessageCircle, Link2, Check
} from 'lucide-react';
import type { SpeakerDriver, Amplifier, CabinetDesign } from '../../types/speaker';
import { DriverVisual, AmpVisual } from '../../components/configurator/ComponentVisuals';
import { CabinetViewer3D } from '../../components/configurator/CabinetViewer3D';
import { calculateConfiguratorPrice, formatPrice } from '../../utils/configuratorPricing';
import { generateConfiguratorPDF } from '../../utils/generateConfiguratorPDF';
import { limiterThreshold } from '../../utils/audio';
import { db } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { StripeCheckout } from './StripeCheckout';
import { StripeProvider } from '../../components/StripeProvider';
import type { XoverPoint } from '../../utils/crossoverDesign';

interface StepSummaryNewProps {
  driver: SpeakerDriver;
  amplifier: Amplifier;
  cabinet: CabinetDesign;
  userConfig: any;
  baffleDrivers?: SpeakerDriver[];
  crossover?: XoverPoint[];
  shareUrl?: string;
  onNavigate?: (page: string) => void;
}

export function StepSummaryNew({
  driver,
  amplifier,
  cabinet,
  userConfig,
  baffleDrivers,
  crossover = [],
  shareUrl,
  onNavigate,
}: StepSummaryNewProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const copyShare = async () => {
    if (!shareUrl) return;
    try { await navigator.clipboard.writeText(shareUrl); }
    catch { /* fallback: selezione manuale */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'quote' | 'cart'>('quote');
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const addToCart = useCartStore((state) => state.addItem);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
  const canSubmit = form.name.trim().length > 1 && emailValid && !submitting;

  // Driver delle vie alte (medio + tweeter/compressione) oltre al woofer
  const extraDrivers = (baffleDrivers || []).filter((d) => d.id !== driver.id);

  // Calcola il prezzo (woofer + extra driver + crossover + ampli + cassa)
  const pricing = calculateConfiguratorPrice(
    driver, amplifier, cabinet, undefined, undefined, extraDrivers, crossover.length,
  );

  // Taratura limiter per PROTEGGERE il driver: soglia RMS = √(Pe · Z) sulla
  // potenza continua del driver, non dell'ampli. È il valore da impostare nel
  // DSP/limiter affinché il driver non superi mai la sua potenza nominale.
  const limiterVrms = limiterThreshold(driver.powerRMS, driver.impedance);
  const limiterDbu = 20 * Math.log10(limiterVrms / 0.775);

  // Messaggio WhatsApp pre-compilato con la configurazione (Amerigo: +39 347 739 7016)
  const altri = (baffleDrivers || []).filter(d => d.id !== driver.id).map(d => `${d.brand} ${d.model}`);
  const waMsg =
    `Ciao Amerigo! Vorrei un preventivo per questa cassa configurata sul sito:%0A` +
    `• Woofer: ${driver.brand} ${driver.model} (${driver.size}")%0A` +
    (altri.length ? `• Vie alte: ${altri.join(', ')}%0A` : '') +
    `• Amplificatore: ${amplifier.brand} ${amplifier.model}%0A` +
    `• Cassa: ${cabinet.externalDimensions.width}×${cabinet.externalDimensions.height}×${cabinet.externalDimensions.depth}mm, ${cabinet.woodType} ${cabinet.woodThickness}mm, finitura ${cabinet.finish}%0A` +
    `• Totale stimato: ${formatPrice(pricing.total)}`;
  const whatsappUrl = `https://wa.me/393477397016?text=${waMsg}`;

  // Renderer 3D per catturare il render nel PDF
  const glRef = useRef<any>(null);

  const handleDownloadPDF = () => {
    let renderImage: string | null = null;
    try {
      renderImage = glRef.current?.domElement?.toDataURL('image/png') ?? null;
    } catch {
      renderImage = null; // cattura opzionale
    }
    const doc = generateConfiguratorPDF({
      driver, amplifier, cabinet, pricing, limiterVrms, limiterDbu, renderImage,
      extraDrivers, crossover,
    });
    const safeName = (cabinet.name || 'configurazione').replace(/[^a-z0-9]+/gi, '-').slice(0, 40);
    doc.save(`OfficinaDelSuono-${safeName}.pdf`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      setError(t('configurator.required'));
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
        cabinetDimensions: cabinet.externalDimensions,
        cabinetMaterial: `${cabinet.woodType} ${cabinet.woodThickness}mm`,
        cabinetTuningHz: cabinet.port?.tuningFrequency ?? null,
        limiterVrms: Math.round(limiterVrms * 10) / 10,
        limiterDbu: Math.round(limiterDbu * 10) / 10,
        pricing: pricing,
        createdAt: new Date().toISOString(),
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting configurator request', err);
      setError(t('configurator.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddToCart = () => {
    addToCart({
      id: `cfg-${Date.now()}`,
      name: `${driver.brand} ${driver.model} + ${amplifier.brand} ${amplifier.model} (${cabinet.externalDimensions.width}×${cabinet.externalDimensions.height}×${cabinet.externalDimensions.depth}mm)`,
      price: pricing.total,
      image: driver.image || '',
    });
  };

  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-4xl font-bold mb-4">{t('configurator.yourConfiguration')}</h2>
        <p className="text-zinc-400 text-lg">{t('configurator.checkAndOrder')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sinistra: Configurazione */}
        <div className="lg:col-span-2 space-y-6">
          {/* Render 3D del prodotto finale + export PDF */}
          <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-2 relative overflow-hidden">
            <div className="h-[420px] rounded-xl overflow-hidden">
              <CabinetViewer3D cabinet={cabinet} baffleDrivers={baffleDrivers} glRef={glRef} allowExplode />
            </div>
            <button
              onClick={handleDownloadPDF}
              className="absolute bottom-5 left-5 z-10 flex items-center gap-2 bg-white text-zinc-900 hover:bg-zinc-200 px-4 py-2.5 rounded-lg font-bold text-sm transition-colors shadow-lg"
            >
              <FileDown className="w-4 h-4" />
              Scarica scheda PDF
            </button>
          </div>

          {/* Componenti */}
          <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
              <Settings className="w-5 h-5 text-brand-orange" />
              {t('configurator.yourConfiguration')}
            </h3>

            {/* Driver */}
            <div className="flex gap-6 items-center bg-zinc-950/50 p-4 rounded-xl border border-white/5 mb-4">
              <div className="w-20 h-20 bg-zinc-900 rounded-lg flex items-center justify-center p-1.5 shrink-0">
                <DriverVisual driver={driver} showLabel={false} className="w-full h-full" />
              </div>
              <div>
                <div className="text-xs text-brand-orange font-bold uppercase">{driver.brand}</div>
                <div className="text-lg font-bold">{driver.model}</div>
                <div className="text-sm text-zinc-400">
                  {driver.size}" {driver.type} • {driver.powerRMS}W RMS
                </div>
                <div className="text-sm font-bold text-brand-orange mt-2">{formatPrice(pricing.driverPrice)}</div>
              </div>
            </div>

            {/* Driver vie alte (medio / tweeter / compressione) */}
            {extraDrivers.map((hd) => (
              <div key={hd.id} className="flex gap-6 items-center bg-zinc-950/50 p-4 rounded-xl border border-white/5 mb-4">
                <div className="w-20 h-20 bg-zinc-900 rounded-lg flex items-center justify-center p-1.5 shrink-0">
                  <DriverVisual driver={hd} showLabel={false} className="w-full h-full" />
                </div>
                <div>
                  <div className="text-xs text-brand-orange font-bold uppercase">{hd.brand}</div>
                  <div className="text-lg font-bold">{hd.model}</div>
                  <div className="text-sm text-zinc-400">
                    {hd.type === 'compression-driver' ? 'Driver a compressione' : hd.type === 'tweeter' ? 'Tweeter' : 'Medio'} • {hd.powerRMS}W • {hd.impedance}Ω
                  </div>
                </div>
              </div>
            ))}

            {/* Crossover */}
            {crossover.length > 0 && (
              <div className="bg-zinc-950/50 p-4 rounded-xl border border-brand-orange/20 mb-4">
                <div className="text-xs text-brand-orange font-bold uppercase mb-2">Crossover {crossover.length === 1 ? '2 vie' : '3 vie'} (passivo)</div>
                <div className="flex flex-wrap gap-2">
                  {crossover.map((x, i) => (
                    <span key={i} className="text-sm font-mono bg-zinc-900 border border-white/10 rounded-lg px-3 py-1.5">
                      {x.fc} Hz <span className="text-zinc-500">· {x.order}° {x.family === 'butterworth' ? 'BW' : x.family}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Amplificatore */}
            <div className="flex gap-6 items-center bg-zinc-950/50 p-4 rounded-xl border border-white/5 mb-4">
              <div className="w-20 h-20 bg-zinc-900 rounded-lg flex items-center justify-center p-1.5 shrink-0">
                <AmpVisual amp={amplifier} className="w-full h-full" />
              </div>
              <div>
                <div className="text-xs text-brand-orange font-bold uppercase">{amplifier.brand}</div>
                <div className="text-lg font-bold">{amplifier.model}</div>
                <div className="text-sm text-zinc-400">
                  Classe {amplifier.classType} • {amplifier.hasDSP && 'DSP Integrato'}
                </div>
                <div className="text-sm font-bold text-brand-orange mt-2">{formatPrice(pricing.ampPrice)}</div>
              </div>
            </div>

            {/* Cassa */}
            <div className="flex gap-6 items-center bg-zinc-950/50 p-4 rounded-xl border border-white/5 mb-6">
              <div className="w-20 h-20 bg-zinc-900 rounded-lg flex items-center justify-center border-2 border-brand-orange">
                <div className="text-xs font-bold text-brand-orange text-center">
                  {cabinet.externalDimensions.width}×{cabinet.externalDimensions.height}×{cabinet.externalDimensions.depth}
                </div>
              </div>
              <div>
                <div className="text-xs text-brand-orange font-bold uppercase">Design Cassa</div>
                <div className="text-lg font-bold">{cabinet.name}</div>
                <div className="text-sm text-zinc-400">
                  {cabinet.woodType} {cabinet.woodThickness}mm • {cabinet.internalVolume}L
                </div>
                <div className="text-sm font-bold text-brand-orange mt-2">{formatPrice(pricing.cabinetPrice)}</div>
              </div>
            </div>

            {/* Breakdown dettagliato */}
            <div className="bg-zinc-950/50 border border-white/5 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">Woofer</span>
                <span className="font-mono">{formatPrice(pricing.driverPrice)}</span>
              </div>
              {pricing.hfMidPrice > 0 && (
                <div className="flex justify-between">
                  <span className="text-zinc-400">Medio + alti</span>
                  <span className="font-mono">{formatPrice(pricing.hfMidPrice)}</span>
                </div>
              )}
              {pricing.crossoverPrice > 0 && (
                <div className="flex justify-between">
                  <span className="text-zinc-400">Crossover</span>
                  <span className="font-mono">{formatPrice(pricing.crossoverPrice)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-zinc-400">Amplificazione</span>
                <span className="font-mono">{formatPrice(pricing.ampPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Legno e materiali</span>
                <span className="font-mono">{formatPrice(pricing.breakdown.materials)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Lavorazione ({cabinet.internalVolume}L)</span>
                <span className="font-mono">{formatPrice(pricing.breakdown.labor)}</span>
              </div>
              {pricing.accessoriesPrice > 0 && (
                <div className="flex justify-between">
                  <span className="text-zinc-400">Accessori</span>
                  <span className="font-mono">{formatPrice(pricing.accessoriesPrice)}</span>
                </div>
              )}
              <div className="border-t border-white/5 pt-2 flex justify-between font-bold">
                <span>Subtotale</span>
                <span className="text-brand-orange">{formatPrice(pricing.subtotal)}</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>IVA 22%</span>
                <span>{formatPrice(pricing.vat)}</span>
              </div>
              <div className="border-t border-white/5 pt-2 flex justify-between text-lg font-bold">
                <span>Totale</span>
                <span className="text-brand-orange">{formatPrice(pricing.total)}</span>
              </div>
            </div>
          </div>

          {/* Modulo amplificatore + DSP integrato (predisposizione cassa) */}
          <div className="bg-zinc-900/50 border border-brand-orange/30 rounded-2xl p-6">
            <h3 className="text-base font-bold flex items-center gap-2 mb-3">
              <Settings className="w-5 h-5 text-brand-orange" />
              Modulo Amplificatore + DSP (sul retro)
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              La cassa è <strong className="text-zinc-200">attiva</strong>: sul pannello posteriore è ricavata la sede
              per il modulo <strong className="text-zinc-200">{amplifier.brand} {amplifier.model}</strong>, che integra
              il <strong className="text-zinc-200">DSP</strong>. Dentro al DSP stanno i <strong className="text-zinc-200">filtri crossover</strong> e
              il <strong className="text-zinc-200">limiter</strong> — non servono componenti passivi.
            </p>
            <div className="space-y-2 text-sm">
              {cabinet.ampCutout && (
                <div className="flex justify-between">
                  <span className="text-zinc-400">Sede ampli (fresatura retro)</span>
                  <span className="font-mono">{cabinet.ampCutout.width}×{cabinet.ampCutout.height}mm</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-zinc-400">Ventilazione + presa IEC</span>
                <span className="font-mono">prevista</span>
              </div>
              {crossover.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-zinc-400">Filtri DSP (crossover)</span>
                  <span className="font-mono">{crossover.map(x => `${x.fc}Hz`).join(' / ')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Taratura limiter — parametro del DSP, protegge il driver */}
          <div className="bg-zinc-900/50 border border-amber-500/30 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold">Limiter (nel DSP) — protezione driver</h3>
            </div>
            <p className="text-xs text-zinc-400 mb-4">
              Imposta il limiter RMS del DSP/amplificatore a questa soglia per non superare mai
              la potenza continua del driver ({driver.powerRMS}W @ {driver.impedance}Ω). Senza
              limiter tarato correttamente il driver può danneggiarsi.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-950/50 border border-white/5 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-amber-400 font-mono">{limiterVrms.toFixed(1)}<span className="text-sm text-zinc-500 ml-1">Vrms</span></div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wide mt-1">Soglia RMS</div>
              </div>
              <div className="bg-zinc-950/50 border border-white/5 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-amber-400 font-mono">{limiterDbu.toFixed(1)}<span className="text-sm text-zinc-500 ml-1">dBu</span></div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wide mt-1">Soglia (dBu)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Destra: Form e Carrello */}
        <div className="space-y-6">
          {/* Fiducia: consegna, garanzia, cosa include */}
          <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Clock className="w-4 h-4 text-brand-orange shrink-0" />
              <span className="text-zinc-300">Consegna stimata <strong className="text-white">3–4 settimane</strong> (costruita a mano)</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <ShieldCheck className="w-4 h-4 text-brand-orange shrink-0" />
              <span className="text-zinc-300">Garanzia <strong className="text-white">2 anni</strong> · collaudo incluso</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Truck className="w-4 h-4 text-brand-orange shrink-0" />
              <span className="text-zinc-300">Spedizione assicurata in tutta Italia</span>
            </div>
            <div className="text-[11px] text-zinc-500 border-t border-white/5 pt-3">
              Incluso: cassa finita, altoparlanti montati, modulo ampli+DSP con limiter tarato, collaudo.
            </div>
          </div>

          {/* Parla con Amerigo (WhatsApp) */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold bg-[#25D366] hover:bg-[#1fb855] text-black transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            Parlane con Amerigo
          </a>

          {/* Copia link configurazione condivisibile */}
          {shareUrl && (
            <button
              onClick={copyShare}
              className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-bold border transition-colors ${
                copied
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                  : 'bg-zinc-900 border-white/10 text-zinc-300 hover:border-white/30'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
              {copied ? 'Link copiato!' : 'Copia link configurazione'}
            </button>
          )}

          {/* Tabs */}
          <div className="flex gap-2 bg-zinc-900 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('quote')}
              className={`flex-1 px-4 py-2 rounded font-bold transition-all ${
                activeTab === 'quote'
                  ? 'bg-brand-orange text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {t('configurator.requestQuote')}
            </button>
            <button
              onClick={() => setActiveTab('cart')}
              className={`flex-1 px-4 py-2 rounded font-bold transition-all ${
                activeTab === 'cart'
                  ? 'bg-brand-orange text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {t('configurator.buyNow')}
            </button>
          </div>

          {/* Quote Form */}
          {activeTab === 'quote' && (
            <>
              {submitted ? (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-zinc-900 border border-emerald-500/30 rounded-2xl p-8 text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-5">
                    <CheckCircle className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{t('configurator.submitted')}</h3>
                  <p className="text-zinc-400 text-sm">{t('configurator.submittedDesc')}</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="bg-zinc-900 border border-brand-orange/30 rounded-2xl p-8 space-y-4">
                  <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                    <Send className="w-5 h-5 text-brand-orange" />
                    {t('configurator.requestQuote')}
                  </h3>

                  <div className="relative">
                    <User className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder={t('configurator.name')}
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full bg-zinc-950 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-brand-orange transition-colors"
                    />
                  </div>

                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder={t('configurator.email')}
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      className="w-full bg-zinc-950 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-brand-orange transition-colors"
                    />
                  </div>

                  <div className="relative">
                    <Phone className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      placeholder={t('configurator.phone')}
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      className="w-full bg-zinc-950 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-brand-orange transition-colors"
                    />
                  </div>

                  <div className="relative">
                    <MessageSquare className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                    <textarea
                      rows={3}
                      placeholder={t('configurator.message')}
                      value={form.message}
                      onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                      className="w-full bg-zinc-950 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm resize-none focus:outline-none focus:border-brand-orange transition-colors"
                    />
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 text-sm text-red-400">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="w-full py-3 bg-brand-orange hover:bg-brand-orange/90 text-white rounded-lg font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    {submitting ? t('configurator.submitting') : t('configurator.submit')}
                  </button>

                  <p className="text-[11px] text-zinc-600 text-center">{t('common.loading')}</p>
                </form>
              )}
            </>
          )}

          {/* Buy Now */}
          {activeTab === 'cart' && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-zinc-900 border border-brand-orange/30 rounded-2xl p-8"
            >
              {!isCheckingOut ? (
                <>
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <CartIcon className="w-5 h-5 text-brand-orange" />
                    {t('configurator.buyNow')}
                  </h3>

                  <div className="mb-6 p-4 bg-brand-orange/10 rounded-lg border border-brand-orange/20">
                    <div className="text-2xl font-bold text-brand-orange">{formatPrice(pricing.total)}</div>
                    <p className="text-xs text-zinc-400 mt-1">{t('configurator.total')} (IVA inclusa)</p>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={() => setIsCheckingOut(true)}
                      className="w-full py-4 bg-brand-orange hover:bg-brand-orange/90 text-white rounded-lg font-bold transition-all"
                    >
                      Paga con carta
                    </button>
                    <button
                      onClick={handleAddToCart}
                      className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-bold transition-all border border-white/10"
                    >
                      {t('configurator.addToCart')}
                    </button>
                  </div>

                  <p className="text-xs text-zinc-500 text-center mt-4">
                    Paga ora con Stripe o aggiungi al carrello per acquistare dopo.
                  </p>
                </>
              ) : (
                <StripeProvider>
                  <div>
                    <button
                      onClick={() => setIsCheckingOut(false)}
                      className="text-sm text-zinc-400 hover:text-white mb-6"
                    >
                      ← Indietro
                    </button>
                    <h3 className="text-lg font-bold mb-6">Checkout Sicuro</h3>
                    <StripeCheckout
                      driver={driver}
                      amplifier={amplifier}
                      cabinet={cabinet}
                      userEmail={form.email}
                      onSuccess={() => {
                        setIsCheckingOut(false);
                        setActiveTab('quote');
                      }}
                    />
                  </div>
                </StripeProvider>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
