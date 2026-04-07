import { motion } from 'framer-motion';

export function CookiePolicy() {
  const lastUpdated = '7 aprile 2026';

  const openPreferences = () => {
    localStorage.removeItem('cookie-consent');
    window.dispatchEvent(new Event('cookie-consent-reset'));
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-widest mb-4 text-center">
            Cookie Policy
          </h1>
          <p className="text-center text-zinc-500 text-sm mb-12">Ultimo aggiornamento: {lastUpdated}</p>

          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl space-y-10">

            <section>
              <p className="text-zinc-300 leading-relaxed">
                La presente Cookie Policy è redatta ai sensi dell'art. 13 del Regolamento UE 2016/679 (GDPR), del Provvedimento del Garante per la Protezione dei Dati Personali del 10 giugno 2021 ("Linee guida cookie") e della Direttiva ePrivacy 2002/58/CE. Descrive cosa sono i cookie, quali tipologie utilizziamo sul sito <strong className="text-white">officinadelsuono.it</strong> e come puoi gestirli.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-brand-orange mb-3">1. Cosa sono i cookie</h2>
              <p className="text-zinc-300 leading-relaxed">
                I cookie sono piccoli file di testo che i siti web visitati salvano sul dispositivo dell'utente (computer, smartphone, tablet) per memorizzare informazioni che possono essere riutilizzate durante la stessa visita ("cookie di sessione") o successivamente ("cookie persistenti"). Insieme ai cookie utilizziamo anche tecnologie simili come pixel tag, web beacon e local storage del browser.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-brand-orange mb-3">2. Tipologie di cookie utilizzate</h2>

              <div className="space-y-6 mt-4">
                <div className="bg-zinc-950/50 border border-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-2">🛡️ Cookie tecnici (sempre attivi)</h3>
                  <p className="text-zinc-300 text-sm leading-relaxed mb-3">
                    Necessari al funzionamento del sito. Non richiedono il consenso dell'utente ai sensi dell'art. 122 del Codice Privacy.
                  </p>
                  <ul className="text-sm text-zinc-400 space-y-1 ml-2">
                    <li>• Sessione di autenticazione Firebase (login utente)</li>
                    <li>• Carrello e preferenze di acquisto</li>
                    <li>• Stato del consenso ai cookie</li>
                    <li>• Sicurezza e prevenzione frodi</li>
                  </ul>
                  <p className="text-xs text-zinc-500 mt-3"><strong>Durata:</strong> sessione o fino a 12 mesi · <strong>Base giuridica:</strong> legittimo interesse</p>
                </div>

                <div className="bg-zinc-950/50 border border-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-2">📊 Cookie analitici (consenso opzionale)</h3>
                  <p className="text-zinc-300 text-sm leading-relaxed mb-3">
                    Utilizzati per raccogliere informazioni in forma aggregata sul numero di visitatori e su come utilizzano il sito. Ci aiutano a migliorare l'esperienza utente.
                  </p>
                  <ul className="text-sm text-zinc-400 space-y-1 ml-2">
                    <li>• Google Analytics 4 / Firebase Analytics</li>
                    <li>• Statistiche di navigazione anonimizzate</li>
                  </ul>
                  <p className="text-xs text-zinc-500 mt-3"><strong>Durata:</strong> fino a 24 mesi · <strong>Base giuridica:</strong> consenso (art. 6.1.a GDPR)</p>
                </div>

                <div className="bg-zinc-950/50 border border-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-2">🎯 Cookie di profilazione e marketing (consenso opzionale)</h3>
                  <p className="text-zinc-300 text-sm leading-relaxed mb-3">
                    Utilizzati per mostrare contenuti pubblicitari personalizzati sui nostri canali e su siti di terze parti. <strong className="text-white">Attualmente non utilizziamo questi cookie</strong>, ma li elenchiamo per trasparenza nel caso vengano introdotti in futuro.
                  </p>
                  <p className="text-xs text-zinc-500 mt-3"><strong>Base giuridica:</strong> consenso (art. 6.1.a GDPR)</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-brand-orange mb-3">3. Cookie di terze parti</h2>
              <p className="text-zinc-300 leading-relaxed mb-4">
                Sul sito sono presenti i seguenti servizi forniti da terze parti, ciascuno con la propria informativa privacy:
              </p>
              <ul className="list-disc list-inside space-y-2 text-zinc-300 ml-2">
                <li><strong className="text-white">Google Firebase</strong> (Google Ireland Ltd) — autenticazione, database, hosting. <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-orange hover:underline">Privacy Policy Google</a></li>
                <li><strong className="text-white">Stripe</strong> (Stripe Payments Europe Ltd) — pagamenti online. <a href="https://stripe.com/it/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-orange hover:underline">Privacy Policy Stripe</a></li>
                <li><strong className="text-white">Resend</strong> — email transazionali. <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-brand-orange hover:underline">Privacy Policy Resend</a></li>
                <li><strong className="text-white">YouTube/Vimeo</strong> (eventuali video embed) — solo se incorporati in articoli del blog.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-brand-orange mb-3">4. Come gestire i cookie</h2>
              <p className="text-zinc-300 leading-relaxed mb-4">
                Puoi modificare le tue preferenze in qualsiasi momento utilizzando il pulsante qui sotto, oppure direttamente dalle impostazioni del tuo browser.
              </p>
              <button
                onClick={openPreferences}
                className="px-6 py-3 bg-gradient-to-r from-brand-orange to-orange-600 text-white rounded-xl font-bold hover:from-orange-500 hover:to-orange-500 transition-all shadow-lg shadow-brand-orange/20"
              >
                Gestisci preferenze cookie
              </button>
              <p className="text-sm text-zinc-400 leading-relaxed mt-6">
                In alternativa, puoi disabilitare i cookie tramite le impostazioni del tuo browser:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-zinc-400 ml-2 mt-2">
                <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-brand-orange hover:underline">Google Chrome</a></li>
                <li><a href="https://support.mozilla.org/it/kb/Gestione%20dei%20cookie" target="_blank" rel="noopener noreferrer" className="text-brand-orange hover:underline">Mozilla Firefox</a></li>
                <li><a href="https://support.apple.com/it-it/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-brand-orange hover:underline">Apple Safari</a></li>
                <li><a href="https://support.microsoft.com/it-it/microsoft-edge" target="_blank" rel="noopener noreferrer" className="text-brand-orange hover:underline">Microsoft Edge</a></li>
              </ul>
              <p className="text-xs text-zinc-500 mt-3">
                Nota: la disabilitazione dei cookie tecnici potrebbe compromettere il corretto funzionamento del sito (es. impossibilità di autenticarsi o effettuare ordini).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-brand-orange mb-3">5. Titolare del trattamento e contatti</h2>
              <p className="text-zinc-300 leading-relaxed">
                <strong className="text-white">Officinadelsuono di Amerigo De Cristofaro</strong><br />
                Strada Provinciale 30, 83020 Forino (AV), Italia<br />
                P.IVA: 03243690645 — PEC: amerigodecristofaro@pec.it<br />
                Per richieste relative ai cookie: <a href="mailto:officinadelsuono99@gmail.com" className="text-brand-orange hover:underline">officinadelsuono99@gmail.com</a>
              </p>
            </section>

          </div>
        </motion.div>
      </div>
    </div>
  );
}
