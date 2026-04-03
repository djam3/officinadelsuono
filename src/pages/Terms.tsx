import { motion } from 'framer-motion';

export function Terms() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-widest mb-12 text-center">
            Termini e Condizioni di Vendita
          </h1>
          
          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl prose prose-invert max-w-none">
            <h2 className="text-2xl font-bold text-brand-orange mb-4">1. Dati Aziendali</h2>
            <p className="text-zinc-300 mb-8">
              Officinadelsuono di Amerigo De Cristofaro<br />
              P.IVA: 03243690645<br />
              Sede: Strada provinciale 30, Forino (AV) 83020<br />
              Codice ATECO: 47.69.12
            </p>

            <h2 className="text-2xl font-bold text-brand-orange mb-4">2. Prezzi</h2>
            <p className="text-zinc-300 mb-8">
              Tutti i prezzi indicati sul sito sono da intendersi IVA inclusa, se non diversamente specificato. I costi di spedizione vengono calcolati al momento del checkout.
            </p>

            <h2 className="text-2xl font-bold text-brand-orange mb-4">3. Spedizioni Assicurate</h2>
            <p className="text-zinc-300 mb-8">
              Gestiamo le spedizioni tramite corrieri espressi specializzati per prodotti di alto valore (Pioneer, Denon, ecc.). Tutte le spedizioni di attrezzatura fragile sono coperte da assicurazione integrale contro danni o smarrimenti durante il trasporto. In caso di ricezione di un pacco danneggiato, il cliente è tenuto ad accettare con "riserva di controllo".
            </p>

            <h2 className="text-2xl font-bold text-brand-orange mb-4">4. Diritto di Recesso</h2>
            <p className="text-zinc-300 mb-8">
              Ai sensi del Codice del Consumo (D.Lgs. 206/2005), il cliente consumatore ha diritto di recedere dal contratto di acquisto, senza alcuna penalità e senza specificarne il motivo, entro 14 giorni dal ricevimento della merce. Il prodotto deve essere restituito integro, nella sua confezione originale e completo di tutti gli accessori. Le spese di spedizione per il reso sono a carico del cliente.
            </p>

            <h2 className="text-2xl font-bold text-brand-orange mb-4">5. Garanzia Legale</h2>
            <p className="text-zinc-300 mb-8">
              Tutti i prodotti venduti sono coperti dalla garanzia legale per difetti di conformità:<br />
              - <strong>24 mesi</strong> per gli acquisti effettuati da clienti privati (consumatori).<br />
              - <strong>12 mesi</strong> per gli acquisti effettuati con Partita IVA (professionisti).<br />
              La garanzia non copre danni accidentali o derivanti da uso improprio dell'attrezzatura.
            </p>

            <h2 className="text-2xl font-bold text-brand-orange mb-4">6. Risoluzione delle Controversie (ODR)</h2>
            <p className="text-zinc-300">
              Ai sensi dell'art. 14 del Regolamento (UE) n. 524/2013, informiamo gli utenti che è possibile risolvere le controversie relative agli acquisti online tramite la piattaforma ODR gestita dalla Commissione Europea, accessibile al seguente link: <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-brand-orange hover:underline">https://ec.europa.eu/consumers/odr</a>.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
