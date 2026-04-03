import { motion } from 'framer-motion';

export function Privacy() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-widest mb-12 text-center">
            Privacy Policy
          </h1>
          
          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl prose prose-invert max-w-none">
            <h2 className="text-2xl font-bold text-brand-orange mb-4">Informativa sul Trattamento dei Dati Personali (GDPR)</h2>
            <p className="text-zinc-300 mb-8">
              Ai sensi del Regolamento (UE) 2016/679 (GDPR), questa pagina descrive le modalità di gestione del sito web in riferimento al trattamento dei dati personali degli utenti.
            </p>

            <h2 className="text-2xl font-bold text-brand-orange mb-4">Titolare del Trattamento</h2>
            <p className="text-zinc-300 mb-8">
              Officinadelsuono di Amerigo De Cristofaro<br />
              P.IVA: 03243690645<br />
              Sede: Strada provinciale 30, Forino (AV) 83020<br />
              Email: officinadelsuono99@gmail.com
            </p>

            <h2 className="text-2xl font-bold text-brand-orange mb-4">Finalità del Trattamento</h2>
            <p className="text-zinc-300 mb-8">
              I dati personali forniti dagli utenti sono utilizzati per le seguenti finalità:<br />
              - <strong>Vendita e Spedizione</strong>: Per processare gli ordini, gestire i pagamenti e organizzare la spedizione tramite corrieri espressi per prodotti di alto valore (Pioneer, Denon, ecc.).<br />
              - <strong>Consulenza tramite Chatbot AI</strong>: Per fornire assistenza tecnica e suggerimenti personalizzati. I dati inseriti nella chat vengono processati dal nostro sistema di Intelligenza Artificiale (Gemini) per migliorare l'esperienza di acquisto.<br />
              - <strong>Assistenza Clienti</strong>: Per rispondere alle richieste inviate via email o WhatsApp.
            </p>

            <h2 className="text-2xl font-bold text-brand-orange mb-4">Modalità del Trattamento</h2>
            <p className="text-zinc-300 mb-8">
              Il trattamento dei dati avviene mediante strumenti informatici e telematici, con logiche strettamente correlate alle finalità indicate e, in ogni caso, in modo da garantire la sicurezza e la riservatezza dei dati stessi.
            </p>

            <h2 className="text-2xl font-bold text-brand-orange mb-4">Condivisione dei Dati</h2>
            <p className="text-zinc-300 mb-8">
              I dati personali potranno essere comunicati a soggetti terzi esclusivamente per l'esecuzione del contratto di vendita (es. corrieri per la spedizione, piattaforme di pagamento come Stripe) o per l'erogazione dei servizi richiesti (es. Google per l'elaborazione AI del Chatbot).
            </p>

            <h2 className="text-2xl font-bold text-brand-orange mb-4">Diritti degli Interessati</h2>
            <p className="text-zinc-300">
              Gli utenti hanno il diritto in qualunque momento di ottenere la conferma dell'esistenza o meno dei medesimi dati e di conoscerne il contenuto e l'origine, verificarne l'esattezza o chiederne l'integrazione o l'aggiornamento, oppure la rettificazione. Hanno inoltre il diritto di chiedere la cancellazione, la trasformazione in forma anonima o il blocco dei dati trattati in violazione di legge.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
