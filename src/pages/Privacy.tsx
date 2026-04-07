import { motion } from 'framer-motion';

export function Privacy() {
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
            Privacy Policy
          </h1>
          <p className="text-center text-zinc-500 text-sm mb-12">Ultimo aggiornamento: {lastUpdated}</p>

          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl space-y-10">

            <section>
              <p className="text-zinc-300 leading-relaxed">
                La presente Informativa è resa ai sensi degli artt. 13 e 14 del Regolamento (UE) 2016/679 ("GDPR") e del D.Lgs. 196/2003 e ss.mm.ii. ("Codice Privacy") e descrive le modalità con cui Officinadelsuono di Amerigo De Cristofaro raccoglie e tratta i dati personali degli utenti che visitano il sito <strong className="text-white">officinadelsuono.it</strong> e/o utilizzano i servizi offerti.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-brand-orange mb-3">1. Titolare del Trattamento</h2>
              <p className="text-zinc-300 leading-relaxed">
                <strong className="text-white">Officinadelsuono di Amerigo De Cristofaro</strong><br />
                Ditta Individuale<br />
                Sede legale: Strada Provinciale 30, 83020 Forino (AV), Italia<br />
                P.IVA: 03243690645 — REA: AV - 314125<br />
                PEC: amerigodecristofaro@pec.it<br />
                Email: info@officina-del-suono.it
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-brand-orange mb-3">2. Tipologie di dati raccolti</h2>
              <p className="text-zinc-300 leading-relaxed mb-3">Trattiamo le seguenti categorie di dati personali:</p>
              <ul className="list-disc list-inside space-y-2 text-zinc-300 ml-2">
                <li><strong className="text-white">Dati di registrazione:</strong> nome, cognome, indirizzo email, password (cifrata), eventuale immagine profilo.</li>
                <li><strong className="text-white">Dati di acquisto:</strong> indirizzo di fatturazione e spedizione, numero di telefono, codice fiscale o P.IVA, dettagli dell'ordine, metodo di pagamento (i dati della carta non sono mai trattati direttamente da noi ma dal provider di pagamento).</li>
                <li><strong className="text-white">Dati di navigazione:</strong> indirizzo IP, tipo di browser, sistema operativo, pagine visitate, data e ora della visita, referrer (raccolti automaticamente dai server e dai servizi di analytics).</li>
                <li><strong className="text-white">Comunicazioni:</strong> contenuto delle richieste inviate via email, modulo di contatto, WhatsApp o chatbot.</li>
                <li><strong className="text-white">Cookie e tecnologie simili:</strong> vedi la <a href="#" onClick={(e) => { e.preventDefault(); window.history.pushState(null, '', '?page=cookie-policy'); window.dispatchEvent(new PopStateEvent('popstate')); }} className="text-brand-orange hover:underline">Cookie Policy</a>.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-brand-orange mb-3">3. Finalità e base giuridica del trattamento</h2>
              <div className="space-y-4 text-zinc-300 leading-relaxed">
                <div>
                  <p><strong className="text-white">a) Esecuzione del contratto di vendita</strong> (art. 6, par. 1, lett. b GDPR)</p>
                  <p>Per processare gli ordini, gestire i pagamenti, organizzare la spedizione, emettere fatture e fornire assistenza post-vendita.</p>
                </div>
                <div>
                  <p><strong className="text-white">b) Adempimento di obblighi di legge</strong> (art. 6, par. 1, lett. c GDPR)</p>
                  <p>Per obblighi fiscali, contabili e di conservazione dei documenti previsti dalla normativa italiana ed europea.</p>
                </div>
                <div>
                  <p><strong className="text-white">c) Consenso dell'interessato</strong> (art. 6, par. 1, lett. a GDPR)</p>
                  <p>Per l'invio di newsletter, comunicazioni commerciali, profilazione e cookie non tecnici. Il consenso è sempre revocabile in qualsiasi momento.</p>
                </div>
                <div>
                  <p><strong className="text-white">d) Legittimo interesse</strong> (art. 6, par. 1, lett. f GDPR)</p>
                  <p>Per garantire la sicurezza del sito, prevenire frodi, migliorare il servizio offerto e rispondere alle richieste degli utenti.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-brand-orange mb-3">4. Modalità del trattamento</h2>
              <p className="text-zinc-300 leading-relaxed">
                Il trattamento dei dati avviene mediante strumenti elettronici, automatizzati e manuali, con misure di sicurezza tecniche e organizzative idonee a garantire la riservatezza, l'integrità e la disponibilità dei dati (cifratura HTTPS, autenticazione Firebase, backup, controllo degli accessi). I dati non sono soggetti a processi decisionali automatizzati o profilazione che producano effetti giuridici significativi sull'interessato.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-brand-orange mb-3">5. Periodo di conservazione</h2>
              <ul className="list-disc list-inside space-y-2 text-zinc-300 ml-2">
                <li><strong className="text-white">Dati account:</strong> finché l'account rimane attivo. In caso di cancellazione, i dati vengono eliminati entro 30 giorni, salvo obblighi di legge.</li>
                <li><strong className="text-white">Dati di acquisto e fatturazione:</strong> 10 anni, ai sensi della normativa fiscale italiana (art. 2220 c.c.).</li>
                <li><strong className="text-white">Dati di navigazione e log:</strong> max 12 mesi.</li>
                <li><strong className="text-white">Newsletter:</strong> fino alla revoca del consenso.</li>
                <li><strong className="text-white">Comunicazioni con l'assistenza:</strong> 24 mesi dalla chiusura della richiesta.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-brand-orange mb-3">6. Destinatari dei dati</h2>
              <p className="text-zinc-300 leading-relaxed mb-3">I dati possono essere comunicati a:</p>
              <ul className="list-disc list-inside space-y-2 text-zinc-300 ml-2">
                <li><strong className="text-white">Google Ireland Ltd</strong> (Firebase Authentication, Firestore, Hosting, Cloud Functions, Storage) — fornitore di infrastruttura cloud, server in UE.</li>
                <li><strong className="text-white">Resend, Inc.</strong> — invio di email transazionali (verifica email, benvenuto, conferme ordine).</li>
                <li><strong className="text-white">Stripe Payments Europe Ltd</strong> e/o altri provider di pagamento — gestione delle transazioni in modalità PCI-DSS compliant.</li>
                <li><strong className="text-white">Corrieri espressi</strong> (BRT, GLS, SDA, ecc.) — esclusivamente per la consegna degli ordini.</li>
                <li><strong className="text-white">Consulenti contabili e fiscali</strong> — adempimenti di legge.</li>
                <li><strong className="text-white">Autorità competenti</strong> — solo a seguito di richiesta legittima.</li>
              </ul>
              <p className="text-zinc-400 text-sm mt-3">Tutti i fornitori sono stati nominati Responsabili del Trattamento ai sensi dell'art. 28 GDPR.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-brand-orange mb-3">7. Trasferimento dei dati extra-UE</h2>
              <p className="text-zinc-300 leading-relaxed">
                Alcuni fornitori (es. Resend, Stripe) potrebbero trattare i dati in paesi extra-UE. In tali casi, il trasferimento avviene esclusivamente sulla base di adeguate garanzie previste dagli artt. 44 e ss. GDPR, in particolare le <strong className="text-white">Clausole Contrattuali Standard</strong> approvate dalla Commissione Europea o decisioni di adeguatezza.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-brand-orange mb-3">8. Diritti dell'interessato</h2>
              <p className="text-zinc-300 leading-relaxed mb-3">Ai sensi degli artt. 15-22 GDPR, hai il diritto di:</p>
              <ul className="list-disc list-inside space-y-2 text-zinc-300 ml-2">
                <li><strong className="text-white">Accesso</strong> ai tuoi dati personali (art. 15);</li>
                <li><strong className="text-white">Rettifica</strong> di dati inesatti o incompleti (art. 16);</li>
                <li><strong className="text-white">Cancellazione</strong> ("diritto all'oblio", art. 17);</li>
                <li><strong className="text-white">Limitazione</strong> del trattamento (art. 18);</li>
                <li><strong className="text-white">Portabilità</strong> dei dati in formato strutturato (art. 20);</li>
                <li><strong className="text-white">Opposizione</strong> al trattamento (art. 21);</li>
                <li><strong className="text-white">Revoca del consenso</strong> in qualsiasi momento, senza pregiudicare la liceità del trattamento precedente;</li>
                <li><strong className="text-white">Reclamo all'Autorità Garante</strong> (Garante per la Protezione dei Dati Personali, <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer" className="text-brand-orange hover:underline">www.garanteprivacy.it</a>).</li>
              </ul>
              <p className="text-zinc-300 leading-relaxed mt-4">
                Per esercitare i tuoi diritti puoi scrivere a <a href="mailto:info@officina-del-suono.it" className="text-brand-orange hover:underline">info@officina-del-suono.it</a>. Risponderemo entro 30 giorni dalla ricezione della richiesta.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-brand-orange mb-3">9. Sicurezza dei dati</h2>
              <p className="text-zinc-300 leading-relaxed">
                Adottiamo misure di sicurezza tecniche e organizzative adeguate al rischio (cifratura HTTPS/TLS, hashing delle password, autenticazione a più fattori, backup periodici, accessi controllati, log di sistema). Pur impegnandoci a proteggere i dati, nessuna trasmissione su Internet è sicura al 100%: in caso di violazione, ti informeremo entro 72 ore ai sensi dell'art. 33 GDPR.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-brand-orange mb-3">10. Minori</h2>
              <p className="text-zinc-300 leading-relaxed">
                I servizi del sito non sono destinati a minori di 16 anni. Non raccogliamo intenzionalmente dati personali di minori senza il consenso verificabile dei genitori. Se vieni a conoscenza che un minore ci ha fornito dati personali, contattaci immediatamente per la rimozione.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-brand-orange mb-3">11. Modifiche all'informativa</h2>
              <p className="text-zinc-300 leading-relaxed">
                Ci riserviamo il diritto di aggiornare la presente Informativa in qualsiasi momento. Le modifiche saranno pubblicate su questa pagina con la data di ultimo aggiornamento. In caso di modifiche sostanziali, gli utenti registrati riceveranno notifica via email.
              </p>
            </section>

          </div>
        </motion.div>
      </div>
    </div>
  );
}
