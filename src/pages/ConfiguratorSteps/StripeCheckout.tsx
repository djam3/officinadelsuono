import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { AlertTriangle, Loader2, CheckCircle } from 'lucide-react';
import type { SpeakerDriver, Amplifier, CabinetDesign } from '../../types/speaker';
import { calculateConfiguratorPrice, formatPrice } from '../../utils/configuratorPricing';
import { useCartStore } from '../../store/cartStore';

interface StripeCheckoutProps {
  driver: SpeakerDriver;
  amplifier: Amplifier;
  cabinet: CabinetDesign;
  userEmail: string;
  onSuccess: () => void;
}

export function StripeCheckout({
  driver,
  amplifier,
  cabinet,
  userEmail,
  onSuccess,
}: StripeCheckoutProps) {
  const { t } = useTranslation();
  const stripe = useStripe();
  const elements = useElements();
  const clearCart = useCartStore((state) => state.clearCart);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: userEmail,
  });

  const pricing = calculateConfiguratorPrice(driver, amplifier, cabinet);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('Card element not found');

      // Crea il payment intent dal backend
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(pricing.total * 100), // Stripe usa centesimi
          email: formData.email,
          description: `Configurazione: ${driver.brand} ${driver.model} + ${amplifier.brand} ${amplifier.model}`,
          metadata: {
            driverId: driver.id,
            ampId: amplifier.id,
            cabinetName: cabinet.name,
            customerName: formData.name,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { clientSecret } = await response.json();

      // Conferma il pagamento
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: { name: formData.name, email: formData.email },
        },
      });

      if (result.error) {
        throw new Error(result.error.message || 'Payment failed');
      }

      if (result.paymentIntent?.status === 'succeeded') {
        setSucceeded(true);
        clearCart();
        setTimeout(onSuccess, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  if (succeeded) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center py-8"
      >
        <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-emerald-400" />
        </div>
        <h3 className="text-2xl font-bold mb-2">{t('payment.completed')}</h3>
        <p className="text-zinc-400 mb-6">{t('payment.completedDescription')}</p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Riepilogo prezzo */}
      <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-6">
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/5">
          <span className="text-zinc-400">Subtotale</span>
          <span className="font-bold">{formatPrice(pricing.subtotal)}</span>
        </div>
        <div className="flex justify-between items-center mb-4">
          <span className="text-zinc-400">IVA (22%)</span>
          <span className="font-bold">{formatPrice(pricing.vat)}</span>
        </div>
        <div className="flex justify-between items-center text-lg pt-4 border-t border-white/5">
          <span className="font-bold">{t('configurator.total')}</span>
          <span className="text-2xl font-bold text-brand-orange">{formatPrice(pricing.total)}</span>
        </div>
      </div>

      {/* Dati personali */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-2">{t('configurator.name')}</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
            className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-brand-orange transition-colors"
            placeholder="Nome e cognome"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">{t('configurator.email')}</label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))}
            className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-brand-orange transition-colors"
            placeholder="email@example.com"
          />
        </div>
      </div>

      {/* Carta di credito */}
      <div>
        <label className="block text-sm font-semibold mb-2">Carta di credito</label>
        <div className="bg-zinc-950 border border-white/10 rounded-lg p-4">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '14px',
                  color: '#e4e4e7',
                  '::placeholder': {
                    color: '#71717a',
                  },
                },
                invalid: {
                  color: '#ef4444',
                },
              },
            }}
          />
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full py-4 bg-brand-orange hover:bg-brand-orange/90 text-white rounded-lg font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
        {loading ? 'Elaborazione...' : `Paga ${formatPrice(pricing.total)}`}
      </button>

      <p className="text-xs text-zinc-600 text-center">
        I tuoi dati di pagamento sono elaborati da Stripe in modo sicuro. Non memorizziamo i dettagli della tua carta.
      </p>
    </form>
  );
}
