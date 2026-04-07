import { motion } from 'framer-motion';

export function Terms() {
  const lastUpdated = '7 aprile 2026';

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-widest mb-4 text-center">
            Termini e Condizioni di Vendita
          </h1>
          <p className="text-center text-zinc-500 text-sm mb-12">Ultimo aggiornamento: {lastUpdated}</p>

          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl space-y-10">

            <section>
              <p className="text-zinc-300 leading-relaxed">
                Le presenti Condizioni Generali di Vendita disciplinano l'acquisto di prodotti e servizi tramite il sito <strong className="text-white">officinadelsuono.it</strong>. Effettuando un ordine, l'utente dichiara di averle lette, comprese e accettate integralmente. La vendita è regolata dal D.Lgs. 206/2005 ("Codice del Consumo") e dal D.Lgs. 70/2003 (commercio elettronico).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-brand-orange mb-3">1. Identità del venditore</h2>
              <p className="text-zinc-300 leading-relaxed">
                <strong className="text-white">Officinadelsuono di Amerigo De Cristofaro</strong> — Ditta Individuale<br />
                Sede legale: Strada Provinciale 30, 83020 Forino (AV), Italia<br />
                P.IVA: 03243690645 — REA: AV - 314125<br />
                Codice ATECO: 47.69.12<br />
                PEC: amerigodecristofaro@pec.it<br />
                Email: officinadelsuono99@gmail.com
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-brand-orange mb-3">2. Prodotti e prezzi</h2>
              <p className="text-zinc-300 leading-relaxed">
                Tutti i prezzi pubblicati sul sito sono espressi in Euro (€) e si intendono <strong className="text-white">IVA inclusa</strong>. I costi di spedizione, ove applicabili, sono calcolati al momento del checkout e visualizzati prima della conferma dell'ordine. Il venditore si riserva il diritto di modificare i prezzi in qualsiasi momento, fermo restando che il prezzo applicato sarà quello indicato sul sito al momento dell'invio dell'ordine.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-brand-orange mb-3">3. Conclusione del contratto</h2>
              <p className="text-zinc-300 leading-relaxed">
                Il contratto si conclude nel momento in cui il venditore invia al cliente la <strong className="text-white">conferma d'ordine via email</strong>. Prima di concludere l'ordine, il cliente può sempre verificare e modificare i propri dati. L'invio dell'ordine costituisce proposta contrattuale; la disponibilità dei prodotti è verificata al momento dell'evasione. In caso di indisponibilità, il cliente verrà avvisato e potrà scegliere tra rimborso integrale o sostituzione.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-brand-orange mb-3">4. Modalità di pagamento</h2>
              <p className="text-zinc-300 leading-relaxed mb-3">Sono accettate le seguenti modalità:</p>
              <ul className="list-disc list-inside space-y-2 text-zinc-300 ml-2">
                <li><strong className="text-white">Carta di credito/debito</strong> tramite gateway sicuro Stripe (Visa, Mastercard, American Express);</li>
                <li><strong className="text-white">Bonifico bancario anticipato</strong> (l'ordine viene evaso a ricezione del pagamento);</li>
                <li><strong className="text-white">PayPal</strong> e altri wallet digitali, ove disponibili.</li>
              </ul>
              <p className="text-zinc-400 text-sm mt-3">I dati delle carte non transitano mai dai nostri server: vengono trattati direttamente dai provider di pagamento certificati PCI-DSS.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-brand-orange mb-3">5. Spedizioni e consegna</h2>
              <p className="text-zinc-300 leading-relaxed">
                Le spedizioni sono effettuate tramite corrieri espressi specializzati, con consegna stimata in <strong className="text-white">2-5 giorni lavorativi</strong> per il territorio italiano. Tutti i pacchi sono coperti da <strong className="text-white">assicurazione integrale</strong> contro danni e smarrimenti. In caso di pacco visibilmente danneggiato all'arrivo, il cliente è tenuto a firmare con la dicitura <em className="text-white">"Accetto con riserva di controllo"</em> e a contattarci entro 24 ore.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-brand-orange mb-3">6. Diritto di recesso (artt. 52-59 Codice del Consumo)</h2>
              <p className="text-zinc-300 leading-relaxed mb-3">
                Il cliente consumatore (persona fisica che agisce per scopi estranei alla propria attività professionale) ha il diritto di recedere dal contratto, senza alcuna penalità e senza specificarne il motivo, <strong className="text-white">entro 14 giorni</strong> dal ricevimento del prodotto.
              </p>
              <p className="text-zinc-300 leading-relaxed mb-3">
                <strong className="text-white">Come esercitare il recesso:</strong>
              </p>
              <ol className="list-decimal list-inside space-y-2 text-zinc-300 ml-2 mb-3">
                <li>Inviare comunicazione esplicita via email a <a href="mailto:officinadelsuono99@gmail.com" className="text-brand-orange hover:underline">officinadelsuono99@gmail.com</a> o via PEC, indicando numero d'ordine, prodotto e dati personali;</li>
                <li>Restituire il prodotto integro, nella confezione originale, completo di tutti gli accessori e documentazione, entro 14 giorni dalla comunicazione di recesso;</li>
                <li>Le spese di restituzione sono a carico del cliente, salvo diverso accordo;</li>
                <li>Il rimborso avverrà entro 14 giorni dalla ricezione della merce o dalla prova di avvenuta spedizione, con lo stesso metodo di pagamento utilizzato per l'acquisto.</li>
              </ol>
              <p className="text-zinc-400 text-sm">
                <strong className="text-white">Esclusioni:</strong> il recesso non si applica ai prodotti sigillati per motivi igienici aperti dopo la consegna, software/contenuti digitali sigillati una volta aperti, prodotti realizzati su misura o personalizzati (art. 59 Codice del Consumo).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-brand-orange mb-3">7. Garanzia legale di conformità</h2>
              <p className="text-zinc-300 leading-relaxed">
                Tutti i prodotti sono coperti dalla garanzia legale di conformità prevista dagli artt. 128-135 del Codice del Consumo:
              </p>
              <ul className="list-disc list-inside space-y-2 text-zinc-300 ml-2 mt-3">
                <li><strong className="text-white">24 mesi</strong> per acquisti effettuati da consumatori (persone fisiche);</li>
                <li><strong className="text-white">12 mesi</strong> per acquisti effettuati con Partita IVA (B2B);</li>
                <li>Per i difetti coperti, il cliente ha diritto alla riparazione, sostituzione, riduzione del prezzo o risoluzione del contratto;</li>
                <li>I difetti devono essere comunicati entro 2 mesi dalla scoperta;</li>
                <li>La garanzia non copre danni accidentali, uso improprio, manomissioni o normale usura.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-brand-orange mb-3">8. Responsabilità</h2>
              <p className="text-zinc-300 leading-relaxed">
                Il venditore declina ogni responsabilità per danni diretti o indiretti derivanti da uso improprio dei prodotti, dalla mancata osservanza delle istruzioni del produttore, da cause di forza maggiore o eventi non riconducibili alla propria sfera di controllo.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-brand-orange mb-3">9. Legge applicabile e foro competente</h2>
              <p className="text-zinc-300 leading-relaxed">
                Le presenti Condizioni sono regolate dalla <strong className="text-white">legge italiana</strong>. Per i consumatori, il foro competente per qualsiasi controversia è quello del luogo di residenza o domicilio del consumatore (art. 66-bis Codice del Consumo). Per i clienti B2B, il foro esclusivo è quello di Avellino.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-brand-orange mb-3">10. Risoluzione delle controversie online (ODR)</h2>
              <p className="text-zinc-300 leading-relaxed">
                Ai sensi dell'art. 14 del Regolamento (UE) n. 524/2013, informiamo che è possibile risolvere extragiudizialmente le controversie relative agli acquisti online tramite la piattaforma ODR della Commissione Europea: <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-brand-orange hover:underline">https://ec.europa.eu/consumers/odr</a>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-brand-orange mb-3">11. Modifiche</h2>
              <p className="text-zinc-300 leading-relaxed">
                Il venditore si riserva il diritto di modificare le presenti Condizioni in qualsiasi momento. Le modifiche saranno efficaci dal momento della pubblicazione sul sito e si applicheranno solo agli ordini successivi.
              </p>
            </section>

          </div>
        </motion.div>
      </div>
    </div>
  );
}
