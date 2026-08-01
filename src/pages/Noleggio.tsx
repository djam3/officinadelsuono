/**
 * Noleggio — attività principale di Officina del Suono.
 * Pacchetti, listino singoli articoli, condizioni e regole di noleggio.
 */
import { motion } from 'framer-motion';
import {
  Speaker, Disc3, Mic, Projector, Table2, Bluetooth, Laptop, MessageCircle,
  Check, X, MapPin, Clock, ShieldCheck, FileText, CreditCard, Sparkles, ArrowRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';
import { BUSINESS, waLink } from '../config/site';
import {
  RENTAL_ITEMS, RENTAL_PACKAGES, RENTAL_OCCASIONS,
  PRICE_INCLUDES, PRICE_EXCLUDES, PRICE_DISCLAIMER, EXTRA_SERVICES_NOTE,
  RENTAL_REQUIREMENTS, PAYMENT_RULES, DEPOSIT_RETURN_RULES,
  type RentalItem, type RentalPackage,
} from '../data/rentalCatalog';

const CATEGORY_ICONS: Record<RentalItem['category'], LucideIcon> = {
  audio: Speaker,
  dj: Disc3,
  microfoni: Mic,
  video: Projector,
  accessori: Table2,
  informatica: Laptop,
};

const ITEM_ICONS: Record<string, LucideIcon> = {
  'modulo-bluetooth': Bluetooth,
  'tavolo-dj': Table2,
};

const euro = (n: number) => `${n} €`;

export function Noleggio({ onNavigate }: { onNavigate?: (page: string) => void }) {
  useSEO({
    title: 'Noleggio audio, video e DJ ad Avellino — Officina del Suono',
    description: BUSINESS.description,
    url: '/noleggio',
  });

  return (
    <div className="bg-zinc-950 text-zinc-50">
      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(242,125,38,0.14),transparent_60%)]" />
        <div className="relative max-w-5xl mx-auto px-5 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-brand-orange/10 text-brand-orange border border-brand-orange/25 mb-6"
          >
            <MapPin className="w-4 h-4 shrink-0" />
            <span className="text-xs font-black tracking-[0.18em] uppercase">{BUSINESS.area}</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-[1.05] mb-5"
          >
            Noleggio audio,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-orange-500">video e DJ</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg md:text-xl text-zinc-300 max-w-2xl mx-auto mb-4 leading-relaxed"
          >
            Attrezzatura professionale per feste, karaoke, cerimonie ed eventi.
            Tu pensi alla festa, al suono pensiamo noi.
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
            className="text-brand-orange font-bold italic mb-9"
          >
            «{BUSINESS.tagline}»
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a
              href={waLink('Ciao! Vorrei informazioni sul noleggio attrezzatura per il mio evento.')}
              target="_blank" rel="noopener noreferrer"
              className="w-full sm:w-auto px-9 py-4 bg-brand-orange hover:bg-orange-600 text-white rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 shadow-[0_16px_40px_rgba(242,125,38,0.28)] hover:scale-[1.03] active:scale-95"
            >
              <MessageCircle className="w-6 h-6 shrink-0" />
              Richiedi disponibilità
            </a>
            <a
              href="#pacchetti"
              className="w-full sm:w-auto px-9 py-4 bg-zinc-900/70 hover:bg-zinc-800 text-white rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 border border-white/10 backdrop-blur-md"
            >
              Vedi i pacchetti <ArrowRight className="w-5 h-5 shrink-0" />
            </a>
          </motion.div>

          {/* occasioni */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-10">
            {RENTAL_OCCASIONS.map(o => (
              <span key={o} className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 bg-zinc-900/60 border border-white/5 rounded-full px-3 py-1.5">
                {o}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── PACCHETTI ───────────────────────────────────────────────────── */}
      <section id="pacchetti" className="py-16 md:py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-12">
            <p className="text-brand-orange font-black text-xs uppercase tracking-[0.22em] mb-2 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" /> Pacchetti pronti
            </p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-3">Scegli il pacchetto per il tuo evento</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Prezzi per <strong className="text-zinc-200">24 ore</strong>. Ogni pacchetto è modificabile:
              scrivici e lo adattiamo a quello che ti serve davvero.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {RENTAL_PACKAGES.map((p, i) => <PackageCard key={p.id} pkg={p} index={i} />)}
          </div>
        </div>
      </section>

      {/* ── LISTINO SINGOLI ─────────────────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-black border-t border-white/5">
        <div className="max-w-5xl mx-auto px-5">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-3">Noleggio singoli articoli</h2>
            <p className="text-zinc-400">Ti serve solo un pezzo? Nessun problema. Prezzi per 24 ore.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {RENTAL_ITEMS.map((item, i) => <ItemCard key={item.id} item={item} index={i} />)}
          </div>
        </div>
      </section>

      {/* ── COSA È INCLUSO ──────────────────────────────────────────────── */}
      <section className="py-16 md:py-24 border-t border-white/5">
        <div className="max-w-5xl mx-auto px-5">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-3">Cosa comprende il prezzo</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">Trasparenza totale: ecco cosa è incluso e cosa si paga a parte.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="bg-emerald-500/5 border border-emerald-500/25 rounded-2xl p-6">
              <h3 className="font-black text-emerald-400 uppercase text-sm tracking-wider mb-4 flex items-center gap-2">
                <Check className="w-5 h-5" /> Incluso nel prezzo
              </h3>
              <ul className="space-y-2.5">
                {PRICE_INCLUDES.map(x => (
                  <li key={x} className="flex items-start gap-2.5 text-sm text-zinc-300">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> {x}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6">
              <h3 className="font-black text-zinc-400 uppercase text-sm tracking-wider mb-4 flex items-center gap-2">
                <X className="w-5 h-5" /> Non incluso
              </h3>
              <div className="flex flex-wrap gap-2">
                {PRICE_EXCLUDES.map(x => (
                  <span key={x} className="text-xs font-bold text-zinc-400 bg-zinc-950 border border-white/5 rounded-lg px-2.5 py-1.5">{x}</span>
                ))}
              </div>
              <p className="text-xs text-zinc-500 mt-4 leading-relaxed">{EXTRA_SERVICES_NOTE}</p>
            </div>
          </div>

          <div className="mt-5 bg-brand-orange/5 border border-brand-orange/25 rounded-2xl p-5 flex items-start gap-3">
            <Clock className="w-5 h-5 text-brand-orange shrink-0 mt-0.5" />
            <p className="text-sm text-zinc-300 leading-relaxed">{PRICE_DISCLAIMER}</p>
          </div>
        </div>
      </section>

      {/* ── REGOLE ──────────────────────────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-black border-t border-white/5">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-3">Come funziona il noleggio</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Poche regole chiare per tutelare te e la nostra attrezzatura.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            <RuleCard icon={FileText} title="Per prenotare serve" items={RENTAL_REQUIREMENTS} />
            <RuleCard icon={CreditCard} title="Pagamenti" items={PAYMENT_RULES} accent />
            <RuleCard icon={ShieldCheck} title="La cauzione torna dopo" items={DEPOSIT_RETURN_RULES} />
          </div>
        </div>
      </section>

      {/* ── CTA FINALE ──────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(242,125,38,0.16),transparent_60%)]" />
        <div className="relative max-w-3xl mx-auto px-5 text-center">
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase mb-4">
            Blocchiamo la tua data?
          </h2>
          <p className="text-zinc-300 text-lg mb-8 leading-relaxed">
            Scrivici su WhatsApp con data, luogo e tipo di evento: ti diciamo subito
            se l'attrezzatura è libera e ti mandiamo il preventivo.
          </p>
          <a
            href={waLink('Ciao! Vorrei prenotare il noleggio. Data evento: ___ , luogo: ___ , tipo di evento: ___')}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-brand-orange hover:bg-orange-600 text-white rounded-2xl font-black text-xl transition-all shadow-[0_20px_50px_rgba(242,125,38,0.3)] hover:scale-[1.03] active:scale-95"
          >
            <MessageCircle className="w-6 h-6 shrink-0" />
            Scrivici su WhatsApp
          </a>
          <p className="text-sm text-zinc-500 mt-5">
            {BUSINESS.whatsappDisplay} · {BUSINESS.area}
          </p>
          {onNavigate && (
            <button onClick={() => onNavigate('about')} className="block mx-auto mt-6 text-xs text-zinc-500 hover:text-brand-orange transition-colors uppercase tracking-wider font-bold">
              Scopri chi siamo
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

// ─── Componenti ──────────────────────────────────────────────────────────────

function PackageCard({ pkg, index }: { pkg: RentalPackage; index: number }) {
  const price = pkg.priceTo ? `${pkg.priceFrom}–${pkg.priceTo} €` : `${pkg.priceFrom} €`;
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      transition={{ duration: 0.45, delay: index * 0.07 }}
      className={`relative rounded-2xl p-6 flex flex-col border transition-colors ${
        pkg.featured
          ? 'bg-brand-orange/[0.07] border-brand-orange/40'
          : 'bg-zinc-900/50 border-white/10 hover:border-white/20'
      }`}
    >
      {pkg.featured && (
        <span className="absolute -top-2.5 left-6 bg-brand-orange text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
          Più richiesto
        </span>
      )}

      <h3 className="text-xl font-black tracking-tight mb-1">{pkg.name}</h3>
      <div className="flex items-baseline gap-1.5 mb-4">
        <span className="text-xs text-zinc-500 font-bold uppercase">da</span>
        <span className="text-3xl font-black text-brand-orange tracking-tight">{price}</span>
        <span className="text-xs text-zinc-500 font-bold">/ 24h</span>
      </div>

      <ul className="space-y-2 mb-4">
        {pkg.includes.map(x => (
          <li key={x} className="flex items-start gap-2 text-sm text-zinc-300">
            <Check className="w-4 h-4 text-brand-orange shrink-0 mt-0.5" /> {x}
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {pkg.goodFor.map(g => (
          <span key={g} className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 bg-zinc-950 border border-white/5 rounded-full px-2 py-1">{g}</span>
        ))}
      </div>

      {pkg.note && <p className="text-[11px] text-amber-400/90 mb-3 font-medium">{pkg.note}</p>}

      <div className="mt-auto pt-4 border-t border-white/5">
        <p className="text-[11px] text-zinc-500 mb-3">Cauzione indicativa: <strong className="text-zinc-300">{euro(pkg.deposit)}</strong></p>
        <a
          href={waLink(`Ciao! Sono interessato al ${pkg.name} (da ${pkg.priceFrom} €). Data evento: ___`)}
          target="_blank" rel="noopener noreferrer"
          className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
            pkg.featured
              ? 'bg-brand-orange hover:bg-orange-600 text-white'
              : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-white/10'
          }`}
        >
          <MessageCircle className="w-4 h-4 shrink-0" /> Richiedi questo pacchetto
        </a>
      </div>
    </motion.div>
  );
}

function ItemCard({ item, index }: { item: RentalItem; index: number }) {
  const Icon = ITEM_ICONS[item.id] || CATEGORY_ICONS[item.category];
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.04 }}
      className="bg-zinc-900/50 border border-white/10 rounded-2xl p-5 flex gap-4 hover:border-white/20 transition-colors"
    >
      <div className="w-12 h-12 rounded-xl bg-brand-orange/10 text-brand-orange flex items-center justify-center shrink-0">
        <Icon className="w-6 h-6" strokeWidth={1.6} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3 mb-1">
          <h3 className="font-bold text-sm leading-tight">{item.name}</h3>
          <span className="text-lg font-black text-brand-orange shrink-0 leading-none">{euro(item.price)}</span>
        </div>
        {item.includes && (
          <p className="text-xs text-zinc-400 leading-snug mb-1.5">{item.includes.join(' · ')}</p>
        )}
        {item.note && <p className="text-[11px] text-amber-400/80 leading-snug mb-1.5">{item.note}</p>}
        <p className="text-[11px] text-zinc-600">
          {item.deposit ? `Cauzione indicativa ${euro(item.deposit)}` : 'Nessuna cauzione'} · 24h
        </p>
      </div>
    </motion.div>
  );
}

function RuleCard({ icon: Icon, title, items, accent }: { icon: LucideIcon; title: string; items: string[]; accent?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      transition={{ duration: 0.45 }}
      className={`rounded-2xl p-6 border ${accent ? 'bg-brand-orange/[0.06] border-brand-orange/30' : 'bg-zinc-900/50 border-white/10'}`}
    >
      <h3 className="font-black uppercase text-sm tracking-wider mb-4 flex items-center gap-2 text-brand-orange">
        <Icon className="w-5 h-5 shrink-0" /> {title}
      </h3>
      <ul className="space-y-2.5">
        {items.map(x => (
          <li key={x} className="flex items-start gap-2.5 text-sm text-zinc-300 leading-snug">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-orange shrink-0 mt-1.5" /> {x}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

export default Noleggio;
