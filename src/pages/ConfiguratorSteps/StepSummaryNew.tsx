import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useCartStore } from '../../store/cartStore';
import {
  Settings, Send, Loader2, Mail, User, Phone, MessageSquare, CheckCircle, AlertTriangle, ShoppingCart as CartIcon
} from 'lucide-react';
import type { SpeakerDriver, Amplifier, CabinetDesign } from '../../types/speaker';
import { DriverVisual, AmpVisual } from '../../components/configurator/ComponentVisuals';
import { calculateConfiguratorPrice, formatPrice } from '../../utils/configuratorPricing';
import { db } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { StripeCheckout } from './StripeCheckout';
import { StripeProvider } from '../../components/StripeProvider';

interface StepSummaryNewProps {
  driver: SpeakerDriver;
  amplifier: Amplifier;
  cabinet: CabinetDesign;
  userConfig: any;
  onNavigate?: (page: string) => void;
}

export function StepSummaryNew({
  driver,
  amplifier,
  cabinet,
  userConfig,
  onNavigate,
}: StepSummaryNewProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'quote' | 'cart'>('quote');
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const addToCart = useCartStore((state) => state.addItem);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
  const canSubmit = form.name.trim().length > 1 && emailValid && !submitting;

  // Calcola il prezzo
  const pricing = calculateConfiguratorPrice(driver, amplifier, cabinet);

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
                <span className="text-zinc-400">Legno e materiali</span>
                <span className="font-mono">{formatPrice(pricing.breakdown.materials)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Lavorazione ({cabinet.internalVolume}L)</span>
                <span className="font-mono">{formatPrice(pricing.breakdown.labor)}</span>
              </div>
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
        </div>

        {/* Destra: Form e Carrello */}
        <div className="space-y-6">
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
