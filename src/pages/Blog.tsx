import { useState, useEffect, useMemo } from 'react';
import { useSEO } from '../hooks/useSEO';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar, Clock, User, ChevronRight, Loader2, Edit2, Plus, Search } from 'lucide-react';
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface BlogProps {
  onNavigate: (page: string, id?: string) => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

// Articoli blog SEO-ottimizzati per attrarre traffico organico nel settore DJ/Pro-Audio
export const MOCK_POSTS = [
  {
    id: 'migliori-controller-dj-principianti-2025',
    title: 'I 7 Migliori Controller DJ per Principianti nel 2025: Guida all\'Acquisto',
    excerpt: 'Vuoi iniziare a mixare ma non sai quale controller scegliere? Analizziamo i migliori modelli sotto i 500 euro per rapporto qualità-prezzo, funzionalità e facilità d\'uso.',
    category: 'Guide Acquisto',
    author: 'Amerigo De Cristofaro',
    date: '28 Mar 2025',
    readTime: '10 min',
    image: 'https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?auto=format&fit=crop&q=80',
    featured: true,
    content: `
      <h2>Come scegliere il tuo primo controller DJ</h2>
      <p>Iniziare a fare il DJ nel 2025 è più accessibile che mai, ma la quantità di controller sul mercato può confondere. La domanda più frequente che riceviamo in consulenza è: <strong>"Quale controller compro se parto da zero?"</strong>. In questa guida, ti aiutiamo a scegliere in base al tuo budget, al genere musicale e ai tuoi obiettivi.</p>

      <h3>Cosa cercare in un controller per principianti</h3>
      <p>Prima di guardare i modelli, ecco i criteri fondamentali:</p>
      <ul>
        <li><strong>Scheda audio integrata:</strong> Essenziale. Ti permette di collegare le cuffie per il pre-ascolto senza comprare hardware aggiuntivo.</li>
        <li><strong>Jog wheel di qualità:</strong> Le jog wheel devono avere una buona sensibilità al tocco. Jog troppo piccole o di plastica sottile renderanno frustrante lo scratch e il beatmatching manuale.</li>
        <li><strong>Software incluso:</strong> La maggior parte dei controller include una licenza per Rekordbox, Serato DJ Lite o Traktor. Verifica quale software è compatibile prima dell'acquisto.</li>
        <li><strong>Numero di canali:</strong> 2 canali sono sufficienti per iniziare. 4 canali servono se vuoi usare campioni, loop o più deck simultaneamente.</li>
      </ul>

      <h3>1. Pioneer DDJ-FLX4 — Il Nuovo Standard Entry-Level</h3>
      <p>Pioneer ha centrato il bersaglio con il DDJ-FLX4. Compatibile sia con Rekordbox che con Serato DJ Lite, è il controller più versatile della fascia. Le jog wheel sono sorprendentemente buone per il prezzo, e la funzione "Smart Fader" permette transizioni fluide anche ai principianti assoluti. Prezzo indicativo: 250-280 euro.</p>

      <h3>2. Numark Mixtrack Platinum FX — Miglior Rapporto Qualità-Prezzo</h3>
      <p>Se cerchi schermi integrati sulle jog wheel (come i CDJ professionali) senza spendere una fortuna, il Mixtrack Platinum FX è imbattibile. 4 deck, effetti dedicati e compatibilità Serato. Prezzo indicativo: 280-320 euro.</p>

      <h3>3. Pioneer DDJ-REV1 — Per Chi Ama lo Scratch</h3>
      <p>Layout "battle style" con il mixer al centro e jog wheel posizionate esternamente, perfetto per chi vuole concentrarsi sullo scratch e il turntablism. Lever FX innovativi per aggiungere effetti in modo intuitivo. Prezzo indicativo: 230-260 euro.</p>

      <h3>4. Hercules DJControl Inpulse 500 — Il Maestro di Beatmatching</h3>
      <p>Hercules ha integrato LED guida direttamente sulle jog wheel che ti insegnano quando mixare. È il miglior "insegnante" hardware sul mercato. Scheda audio a 24-bit, filtri dedicati e costruzione solida. Prezzo indicativo: 300-350 euro.</p>

      <h3>5. Roland DJ-202 — Per i Produttori</h3>
      <p>Se oltre a mixare vuoi anche creare beat dal vivo, il DJ-202 integra un sequencer TR-S (la leggendaria drum machine Roland) con 16 pad per performance ibride. Unico nel suo genere a questo prezzo. Prezzo indicativo: 300-350 euro.</p>

      <h3>6. Pioneer DDJ-400 (Usato) — L'Intramontabile</h3>
      <p>Fuori produzione ma ancora reperibile usato a prezzi eccellenti (150-200 euro). È stato IL controller per principianti per 5 anni. Se trovi un esemplare in buone condizioni, resta una scelta eccezionale.</p>

      <h3>7. Native Instruments Traktor Kontrol S2 Mk3 — L'Alternativa Traktor</h3>
      <p>Se preferisci Traktor come software, l'S2 Mk3 è la scelta naturale. Interfaccia audio a 24-bit, Remix Deck integrato e un'integrazione hardware-software che solo Native Instruments sa offrire. Prezzo indicativo: 280-320 euro.</p>

      <h3>Il nostro consiglio finale</h3>
      <p>Per la maggior parte dei principianti, il <strong>Pioneer DDJ-FLX4</strong> è la scelta più sicura: è compatibile con tutto, ha un layout intuitivo e ti prepara al workflow Pioneer che troverai nei club. Se il budget è stretto, cerca un DDJ-400 usato. Se vuoi distinguerti, il Numark Mixtrack Platinum FX offre più funzioni per euro speso.</p>
      <p>Hai bisogno di una consulenza personalizzata? <strong>Contattaci su WhatsApp</strong> — ti aiutiamo a scegliere il controller perfetto per il tuo stile.</p>
    `
  },
  {
    id: 'come-costruire-impianto-audio-evento',
    title: 'Come Costruire un Impianto Audio per Eventi: La Guida Completa ai Watt, Casse e Sub',
    excerpt: 'Quanti watt servono per 100 persone? Meglio casse attive o passive? Guida ingegneristica per dimensionare correttamente l\'impianto PA del tuo evento.',
    category: 'Guide Tecniche',
    author: 'Amerigo De Cristofaro',
    date: '22 Mar 2025',
    readTime: '12 min',
    image: 'https://images.unsplash.com/photo-1493676304819-0d7a8d026dcf?auto=format&fit=crop&q=80',
    featured: true,
    content: `
      <h2>Dimensionare un impianto PA: la scienza dietro il suono</h2>
      <p>Uno degli errori più costosi nel mondo degli eventi è sottodimensionare (o sovradimensionare) l'impianto audio. <strong>Troppo poco</strong> e il suono risulterà distorto e debole; <strong>troppo</strong> e avrai speso migliaia di euro in potenza inutilizzata. In questa guida ti spieghiamo come calcolare esattamente cosa ti serve.</p>

      <h3>La regola dei watt per persona</h3>
      <p>Come punto di partenza ingegneristico, si calcola la potenza necessaria in base al tipo di evento:</p>
      <ul>
        <li><strong>Musica di sottofondo / conferenze:</strong> 3-5 watt per persona</li>
        <li><strong>DJ set / feste private:</strong> 5-8 watt per persona</li>
        <li><strong>Concerti / festival all'aperto:</strong> 8-15 watt per persona</li>
      </ul>
      <p>Quindi, per una festa da 100 persone con DJ set, servono indicativamente <strong>500-800 watt RMS</strong> di potenza complessiva. Attenzione: sempre watt RMS, mai watt di picco (che sono un numero di marketing gonfiato).</p>

      <h3>Casse attive vs passive: quale scegliere?</h3>
      <p>Le <strong>casse attive</strong> hanno amplificatore integrato: le colleghi alla corrente e al mixer, e suonano. Sono perfette per DJ mobili, feste private e piccoli eventi perché sono plug-and-play, leggere e protette internamente da distorsioni.</p>
      <p>Le <strong>casse passive</strong> richiedono un amplificatore esterno. Offrono maggiore flessibilità e sono preferite per installazioni fisse (club, sale concerto) dove puoi calibrare amplificatore e crossover separatamente.</p>
      <p><strong>Il nostro consiglio:</strong> Per il 90% dei DJ e organizzatori di eventi, le casse attive sono la scelta giusta. Meno cavi, meno componenti da trasportare, meno cose che possono andare storte.</p>

      <h3>Il subwoofer: quando è necessario?</h3>
      <p>Se suoni musica elettronica, hip-hop, reggaeton o qualsiasi genere con bassi profondi, il subwoofer non è un optional — è una necessità. Le casse top (i diffusori principali) tipicamente scendono fino a 55-65 Hz, ma le frequenze sotto i 50 Hz (quelle che "senti nel petto") richiedono un sub dedicato.</p>
      <p>Regola pratica: <strong>1 subwoofer da 15" o 18" ogni 2 casse top</strong> per un evento fino a 150 persone. Per eventi più grandi, raddoppia.</p>

      <h3>Il posizionamento fa la differenza</h3>
      <p>Puoi avere il miglior impianto del mondo, ma se lo posizioni male perderai fino al 50% della potenza sonora percepita:</p>
      <ul>
        <li>Le casse top devono essere su stativo ad <strong>almeno 1.8 metri</strong> di altezza (sopra le teste del pubblico)</li>
        <li>I subwoofer vanno posizionati <strong>a terra</strong>, idealmente contro un muro (il "boundary effect" guadagna +3-6 dB gratis)</li>
        <li>Evita di puntare le casse verso superfici riflettenti (vetrate, muri lisci) per ridurre riverbero indesiderato</li>
      </ul>

      <h3>Kit consigliati per fascia di pubblico</h3>
      <ul>
        <li><strong>30-50 persone:</strong> 2x casse attive da 12" (es. Alto TS412) — budget circa 500-700 euro</li>
        <li><strong>50-100 persone:</strong> 2x casse attive da 15" + 1 sub da 15" — budget circa 1.200-1.800 euro</li>
        <li><strong>100-200 persone:</strong> 2x casse attive da 15" + 2 sub da 18" — budget circa 2.500-3.500 euro</li>
        <li><strong>200+ persone:</strong> Sistema line array o impianto personalizzato — contattaci per un preventivo ingegnerizzato</li>
      </ul>

      <h3>Hai bisogno di aiuto per dimensionare il tuo impianto?</h3>
      <p>Il nostro servizio di consulenza tecnica ti aiuta a scegliere l'impianto perfetto per il tuo spazio, il tuo genere e il tuo budget. Niente sprechi, niente compromessi — solo ingegneria acustica applicata.</p>
    `
  },
  {
    id: 'pioneer-cdj-3000-vs-denon-sc6000-confronto',
    title: 'Pioneer CDJ-3000 vs Denon SC6000: Quale Media Player Scegliere nel 2025?',
    excerpt: 'Il confronto definitivo tra i due media player top di gamma. Analizziamo prestazioni, schermo, jog wheel, compatibilità e prezzo per aiutarti a decidere.',
    category: 'Confronti',
    author: 'Amerigo De Cristofaro',
    date: '18 Mar 2025',
    readTime: '9 min',
    image: 'https://images.unsplash.com/photo-1563330232-57114bb0823c?auto=format&fit=crop&q=80',
    featured: false,
    content: `
      <h2>La battaglia dei titani: Pioneer vs Denon</h2>
      <p>Per decenni, Pioneer DJ ha dominato le cabine dei club con i CDJ. Ma Denon DJ, con la serie SC6000, ha lanciato una sfida seria che sta facendo riflettere anche i DJ più fedeli all'ecosistema Pioneer. Quale scegliere nel 2025? Analizziamo ogni aspetto.</p>

      <h3>Schermo e interfaccia</h3>
      <p>Il <strong>Denon SC6000</strong> vince nettamente: schermo touch HD da 10.1 pollici, fluido e reattivo. Il <strong>Pioneer CDJ-3000</strong> ha uno schermo da 9 pollici, buono ma con risoluzione inferiore. Se la navigazione visiva è importante per te, il Denon è superiore.</p>

      <h3>Jog wheel</h3>
      <p>Qui Pioneer si riprende il vantaggio. La jog wheel del CDJ-3000 è semplicemente la migliore mai prodotta: display LCD integrato, risposta al tocco impeccabile, peso perfetto per scratch e nudge. La jog del Denon è buona, ma non raggiunge lo stesso livello di feedback tattile.</p>

      <h3>Funzionalità esclusive</h3>
      <p>Il Denon offre <strong>Wi-Fi integrato e streaming da Tidal, Beatport Link e SoundCloud Go+</strong> direttamente dal player. Pioneer richiede una connessione via cavo e non supporta lo streaming nativo.</p>
      <p>Pioneer vince con <strong>Pro DJ Link</strong>, lo standard dei club professionali per la sincronizzazione tra 4 player e l'analisi delle tracce condivisa.</p>

      <h3>Compatibilità club</h3>
      <p>Questo è il punto critico: il <strong>95% dei club nel mondo ha Pioneer CDJ</strong>. Se suoni regolarmente nei locali, la familiarità con l'ecosistema Pioneer è un vantaggio enorme. Il Denon è più avanzato tecnologicamente, ma potresti non trovarlo mai in una cabina professionale.</p>

      <h3>Prezzo</h3>
      <p>Il Denon SC6000 costa circa il 15-20% in meno del CDJ-3000 a parità di funzionalità. Se il budget conta e suoni principalmente a casa o a feste private, il Denon offre più valore per euro.</p>

      <h3>Verdetto</h3>
      <p><strong>Scegli Pioneer CDJ-3000 se:</strong> suoni nei club, vuoi la jog wheel migliore del mercato, hai bisogno di Pro DJ Link.</p>
      <p><strong>Scegli Denon SC6000 se:</strong> vuoi lo schermo migliore, usi servizi di streaming, cerchi il miglior rapporto qualità-prezzo, suoni principalmente a casa o eventi privati.</p>
    `
  },
  {
    id: 'come-scegliere-cuffie-dj-professionali',
    title: 'Come Scegliere le Cuffie da DJ: 5 Modelli Professionali a Confronto',
    excerpt: 'Le cuffie sono lo strumento più personale di un DJ. Isolamento, comfort, risposta in frequenza: ecco cosa cercare e quali modelli consigliamo.',
    category: 'Guide Acquisto',
    author: 'Amerigo De Cristofaro',
    date: '14 Mar 2025',
    readTime: '7 min',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80',
    featured: false,
    content: `
      <h2>Perché le cuffie da DJ sono diverse dalle altre</h2>
      <p>Le cuffie da DJ non sono cuffie "da ascolto". Devono resistere a ore di uso intenso in ambienti rumorosi, essere indossabili con una sola orecchia e riprodurre i bassi con precisione per il beatmatching. Ecco cosa valutare prima dell'acquisto.</p>

      <h3>I criteri fondamentali</h3>
      <ul>
        <li><strong>Isolamento acustico:</strong> In un club con l'impianto a 110 dB, devi sentire cosa esce dalle cuffie. I modelli over-ear chiusi sono l'unica opzione seria.</li>
        <li><strong>Comfort per set lunghi:</strong> Se suoni 3-4 ore, i cuscinetti devono essere morbidi e i padiglioni non devono stringere.</li>
        <li><strong>Robustezza:</strong> Snodo girevole, cavo removibile e materiali resistenti sono essenziali. Le cuffie da DJ cadono, si piegano, vengono maltrattate.</li>
        <li><strong>Risposta in frequenza:</strong> Cerca una risposta piatta con buona estensione sui bassi (almeno fino a 5 Hz dichiarati). Evita cuffie "bass boosted" che falsano la percezione del mix.</li>
      </ul>

      <h3>Top 5 Cuffie DJ Professionali</h3>
      <p><strong>1. Pioneer HDJ-X10</strong> — Le top di gamma Pioneer. Driver da 50mm in mylar, isolamento eccezionale, pieghevoli. Sono le cuffie di riferimento nei club. Prezzo: circa 300 euro.</p>
      <p><strong>2. Sennheiser HD 25</strong> — Le leggendarie. Usate dalla maggior parte dei DJ professionisti dal 1988. Leggere (140g), indistruttibili, ogni pezzo è sostituibile. Suono onesto e preciso. Prezzo: circa 150 euro.</p>
      <p><strong>3. Audio-Technica ATH-M50x</strong> — Il miglior rapporto qualità-prezzo in assoluto. Driver da 45mm con risposta incredibilmente piatta. Ottime per DJ, produzione e ascolto quotidiano. Prezzo: circa 140 euro.</p>
      <p><strong>4. V-Moda Crossfade M-100 Master</strong> — Costruite come un carro armato, con suono potente e basso profondo. Perfette per DJ che suonano hip-hop, trap e bass music. Prezzo: circa 280 euro.</p>
      <p><strong>5. AIAIAI TMA-2 DJ</strong> — Il sistema modulare: puoi sostituire padiglioni, archetto, driver e cavo singolarmente. Design minimalista danese, suono pulito. Prezzo: circa 200 euro (configurazione DJ).</p>

      <h3>La nostra raccomandazione</h3>
      <p>Se sei un principiante, le <strong>Sennheiser HD 25</strong> o le <strong>Audio-Technica ATH-M50x</strong> sono investimenti sicuri che dureranno anni. Se suoni regolarmente nei club e vuoi il top, le <strong>Pioneer HDJ-X10</strong> non hanno rivali per isolamento e qualità costruttiva.</p>
    `
  },
  {
    id: 'setup-dj-casa-home-studio-completo',
    title: 'Setup DJ a Casa: Come Creare il Tuo Home Studio Completo con Meno di 2.000 Euro',
    excerpt: 'Dal controller alle casse monitor, passando per cavi e trattamento acustico: guida step-by-step per allestire uno studio DJ domestico professionale.',
    category: 'DJ Setup',
    author: 'Amerigo De Cristofaro',
    date: '10 Mar 2025',
    readTime: '11 min',
    image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80',
    featured: false,
    content: `
      <h2>Il tuo primo home studio DJ: tutto quello che serve</h2>
      <p>Non servono migliaia di euro per avere un setup DJ funzionale a casa. Con una pianificazione intelligente e le scelte giuste, puoi costruire uno studio completo per praticare, registrare mix e persino fare live streaming. Ecco la nostra guida step-by-step.</p>

      <h3>Step 1: Il Controller (budget: 250-500 euro)</h3>
      <p>Il cuore del setup. Per un home studio consigliamo un controller a 2 o 4 canali con scheda audio integrata. Il <strong>Pioneer DDJ-FLX4</strong> (circa 270 euro) è la scelta più equilibrata. Se vuoi 4 canali e un'esperienza più "da club", il <strong>Pioneer DDJ-FLX6-GT</strong> (circa 500 euro) è eccellente.</p>

      <h3>Step 2: Monitor da Studio (budget: 200-400 euro)</h3>
      <p>NON usare casse bluetooth o speaker hi-fi per praticare. I monitor da studio ti danno un suono onesto che ti insegna a mixare correttamente. Per una stanza piccola:</p>
      <ul>
        <li><strong>PreSonus Eris E3.5</strong> — Coppia da 50W, perfette per desktop. Circa 100 euro la coppia.</li>
        <li><strong>KRK Rokit 5 G4</strong> — Lo standard per home studio. Circa 330 euro la coppia.</li>
        <li><strong>Yamaha HS5</strong> — Risposta piattissima, ideali per chi vuole anche produrre. Circa 350 euro la coppia.</li>
      </ul>

      <h3>Step 3: Cuffie (budget: 100-200 euro)</h3>
      <p>Essenziali per il pre-ascolto e per praticare di notte senza disturbare i vicini. <strong>Sennheiser HD 25</strong> (circa 150 euro) o <strong>Audio-Technica ATH-M50x</strong> (circa 140 euro).</p>

      <h3>Step 4: Cavi e supporti (budget: 50-100 euro)</h3>
      <ul>
        <li>2x cavi RCA-RCA o XLR bilanciati per collegare controller → monitor</li>
        <li>1x supporto/stand per il controller (ergonomia!)</li>
        <li>1x ciabatta con protezione da sovratensione</li>
        <li>Eventuale stand per cuffie</li>
      </ul>

      <h3>Step 5: Trattamento acustico base (budget: 50-150 euro)</h3>
      <p>Non serve rivestire tutta la stanza. Anche solo <strong>4 pannelli fonoassorbenti</strong> posizionati ai punti di prima riflessione (le pareti laterali e dietro i monitor) miglioreranno drasticamente la qualità del suono. Pannelli in fibra di poliestere da 5cm si trovano a 10-15 euro l'uno.</p>

      <h3>Budget totale: da 650 a 1.350 euro</h3>
      <p>Con meno di 1.500 euro hai un setup completo, professionale e pronto per crescere nel tempo. Il bello del DJ è che puoi iniziare con poco e aggiornare i singoli componenti man mano che migliori.</p>
    `
  },
  {
    id: 'guida-cavi-audio-professionali-xlr-rca-jack',
    title: 'XLR, RCA o Jack? La Guida Completa ai Cavi Audio Professionali',
    excerpt: 'Bilanciato o sbilanciato? Analogico o digitale? Tutto quello che devi sapere sui cavi audio per non perdere qualità nel tuo segnale.',
    category: 'Guide Tecniche',
    author: 'Amerigo De Cristofaro',
    date: '05 Mar 2025',
    readTime: '8 min',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&q=80',
    featured: false,
    content: `
      <h2>I cavi: l'anello debole che nessuno considera</h2>
      <p>Puoi avere il mixer da 3.000 euro e le casse da 5.000 euro, ma se il segnale passa attraverso un cavo da 2 euro comprato al mercatino, stai buttando soldi. I cavi sono l'elemento più sottovalutato di qualsiasi setup audio. Ecco come sceglierli correttamente.</p>

      <h3>Bilanciato vs Sbilanciato: la differenza cruciale</h3>
      <p>Un cavo <strong>bilanciato</strong> (XLR, TRS Jack 6.35mm) trasporta il segnale su 3 conduttori: positivo, negativo e massa. Il ricevitore confronta i due segnali e elimina qualsiasi interferenza raccolta lungo il percorso. Risultato: <strong>zero rumore</strong>, anche su tratte di 50-100 metri.</p>
      <p>Un cavo <strong>sbilanciato</strong> (RCA, TS Jack) usa solo 2 conduttori. Funziona bene per tratte corte (sotto i 3 metri), ma su distanze maggiori raccoglie interferenze elettromagnetiche (ronzii, fruscii).</p>
      <p><strong>Regola d'oro:</strong> usa sempre cavi bilanciati (XLR o TRS) per collegare mixer → amplificatore o mixer → casse attive. Usa RCA solo per connessioni corte (CDJ → mixer, giradischi → mixer).</p>

      <h3>I tipi di connettore</h3>
      <ul>
        <li><strong>XLR:</strong> Lo standard professionale. 3 pin, connessione robusta con blocco di sicurezza. Bilanciato. Usalo per tutte le connessioni lunghe e critiche.</li>
        <li><strong>Jack TRS 6.35mm:</strong> Bilanciato (se TRS, cioè con 2 anelli). Comune sulle uscite dei mixer e ingressi dei monitor da studio.</li>
        <li><strong>Jack TS 6.35mm:</strong> Sbilanciato (1 solo anello). Per chitarre, strumenti e connessioni brevi.</li>
        <li><strong>RCA:</strong> Sbilanciato. Lo standard consumer/DJ per connessioni tra CDJ e mixer. Limitato a tratte di 2-3 metri.</li>
        <li><strong>Speakon:</strong> Per collegare amplificatori a casse passive. Robusto, ad alta corrente, con blocco a baionetta.</li>
      </ul>

      <h3>Quanto spendere per un cavo?</h3>
      <p>Non cadere nella trappola dei "cavi audiofili" da centinaia di euro. Ma non comprare nemmeno quelli da 3 euro al discount. Un buon cavo XLR professionale costa <strong>10-20 euro per 3-5 metri</strong>. Marchi affidabili: Cordial, Proel, Neutrik (connettori), Sommer Cable.</p>

      <h3>Errori comuni da evitare</h3>
      <ul>
        <li>Usare adattatori economici RCA→Jack: introducono rumore e contatti intermittenti</li>
        <li>Arrotolare i cavi troppo stretti: danneggia la schermatura interna</li>
        <li>Passare cavi audio vicino a cavi di alimentazione: causa ronzio a 50Hz</li>
        <li>Non testare i cavi prima di un evento: il 90% dei problemi audio live sono cavi difettosi</li>
      </ul>
    `
  },
  {
    id: 'come-mixare-beatmatching-guida-principianti',
    title: 'Come Imparare a Mixare: Guida al Beatmatching per Principianti DJ',
    excerpt: 'Il beatmatching è la base di tutto. Ti insegniamo la tecnica passo-passo per sincronizzare due tracce a orecchio, senza usare il sync.',
    category: 'Tutorial DJ',
    author: 'Amerigo De Cristofaro',
    date: '01 Mar 2025',
    readTime: '9 min',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80',
    featured: false,
    content: `
      <h2>Perché imparare il beatmatching manuale nel 2025?</h2>
      <p>"Ma il pulsante Sync non fa la stessa cosa?" Sì, tecnicamente sincronizza i BPM. Ma il beatmatching manuale ti insegna a <strong>sentire</strong> la musica in un modo che il Sync non potrà mai darti. Ti permette di capire la struttura ritmica, di correggere in tempo reale e di mixare con musicalità — non solo con precisione meccanica.</p>

      <h3>Step 1: Capire i BPM</h3>
      <p>BPM = Battiti Per Minuto. È la velocità della traccia. Due tracce con lo stesso BPM andranno alla stessa velocità. Il beatmatching consiste nel regolare il pitch (velocità) di una traccia per allinearla all'altra.</p>
      <p>Generi e BPM tipici: House 120-128, Techno 130-140, Drum & Bass 170-180, Hip-Hop 85-100, Reggaeton 90-100.</p>

      <h3>Step 2: Ascolta il "1" di ogni battuta</h3>
      <p>Nella musica dance, il kick (cassa) cade sui quarti: BUM-BUM-BUM-BUM. Il "1" è il primo beat di ogni gruppo da 4. La tua missione è fare partire la traccia B esattamente sul "1" della traccia A.</p>

      <h3>Step 3: Il Cue Point</h3>
      <p>Posiziona il cue point della traccia B esattamente sul primo kick. Premi play/cue in sincrono con il "1" della traccia A. Se i due kick suonano insieme, sei a tempo. Se no, riprova.</p>

      <h3>Step 4: Regola il Pitch</h3>
      <p>Se la traccia B va più veloce (i kick iniziano ad anticipare), rallenta leggermente abbassando il pitch fader. Se va più piano (i kick ritardano), alzalo. Movimenti minimi: 0.1-0.3% alla volta.</p>

      <h3>Step 5: Il Nudge (la spintarella)</h3>
      <p>Anche con i BPM perfettamente allineati, le tracce possono driftare. Usa la jog wheel per dare una leggera spinta in avanti (se la traccia B è in ritardo) o frenare (se è in anticipo). Tocchi delicatissimi, non giri bruschi.</p>

      <h3>Step 6: Pratica con queste regole</h3>
      <ol>
        <li>Inizia con due tracce dello stesso genere e BPM simili (differenza massima di 2-3 BPM)</li>
        <li>Pratica 15-20 minuti al giorno per 2 settimane — il beatmatching diventa automatico</li>
        <li>Non guardare le forme d'onda! Chiudi gli occhi e ascolta</li>
        <li>Quando riesci a tenere allineate due tracce per 30+ secondi senza correzioni, passa a tracce con BPM più diversi</li>
      </ol>

      <h3>Il prossimo passo</h3>
      <p>Una volta padroneggiato il beatmatching, il passo successivo è imparare le <strong>transizioni</strong>: quando aprire il crossfader, come usare l'EQ per "togliere spazio" alla traccia uscente, e come leggere la struttura musicale (intro, breakdown, drop) per creare mix fluidi e musicali.</p>
    `
  },
  {
    id: 'proteggere-udito-dj-musicisti-tappi',
    title: 'Come Proteggere l\'Udito da DJ: I Migliori Tappi Professionali e Perché Sono Essenziali',
    excerpt: 'Il danno uditivo è permanente e irreversibile. Ecco perché ogni DJ dovrebbe investire in protezione auricolare professionale.',
    category: 'Salute & Pro Tips',
    author: 'Amerigo De Cristofaro',
    date: '25 Feb 2025',
    readTime: '6 min',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80',
    featured: false,
    content: `
      <h2>Il rischio che nessun DJ prende sul serio (finché non è troppo tardi)</h2>
      <p>Un club tipico raggiunge i <strong>100-115 dB</strong>. A 100 dB, il danno uditivo inizia dopo soli <strong>15 minuti</strong> di esposizione. Un DJ che suona 4 ore a settimana in un club sta accumulando danni permanenti che si manifesteranno come acufene (fischio costante) e perdita di frequenze alte — esattamente le frequenze che servono per mixare bene.</p>

      <h3>I numeri che fanno paura</h3>
      <ul>
        <li><strong>85 dB:</strong> Limite sicuro per esposizioni prolungate (8 ore)</li>
        <li><strong>100 dB:</strong> Danno dopo 15 minuti</li>
        <li><strong>110 dB:</strong> Danno dopo 2 minuti</li>
        <li><strong>120 dB:</strong> Soglia del dolore — danno immediato</li>
      </ul>
      <p>Il danno è <strong>cumulativo e irreversibile</strong>. Le cellule ciliate dell'orecchio interno non si rigenerano.</p>

      <h3>Tappi generici vs tappi professionali</h3>
      <p>I tappi in schiuma da farmacia attenuano le frequenze in modo disuguale: tagliano gli alti e lasciano passare i bassi, rendendo la musica ovattata e impossibile da mixare. I <strong>tappi professionali con filtro lineare</strong> attenuano tutte le frequenze in modo uniforme: la musica suona identica, solo più bassa.</p>

      <h3>I migliori tappi per DJ</h3>
      <ul>
        <li><strong>Alpine MusicSafe Pro</strong> — 3 filtri intercambiabili (Gold -16dB, Silver -19dB, White -22dB). Circa 30 euro. Il miglior rapporto qualità-prezzo.</li>
        <li><strong>Etymotic ER20XS</strong> — Attenuazione lineare di -20dB, design discreto, comfort eccellente per set lunghi. Circa 20 euro.</li>
        <li><strong>ACS Custom Pro</strong> — Tappi su misura, fatti dal calco del tuo orecchio. Comfort perfetto, attenuazione precisa. Da 150 euro. L'investimento definitivo.</li>
        <li><strong>Earos One</strong> — Design innovativo con filtro acustico avanzato, quasi invisibili. -17dB. Circa 40 euro.</li>
      </ul>

      <h3>Consigli pratici per la cabina</h3>
      <ul>
        <li>Indossa SEMPRE i tappi quando sei in pista come pubblico</li>
        <li>In cabina, abbassa il volume del monitor booth al minimo necessario</li>
        <li>Fai pre-ascolto nelle cuffie solo dall'orecchio destro, lascia il sinistro libero per sentire la sala</li>
        <li>Dopo un set in club, dai alle orecchie almeno 12-16 ore di riposo in silenzio</li>
      </ul>
    `
  },
  {
    id: 'rekordbox-vs-serato-vs-traktor-confronto-software-dj',
    title: 'Rekordbox vs Serato vs Traktor: Quale Software DJ Scegliere?',
    excerpt: 'I tre software dominanti a confronto: compatibilità, funzionalità, prezzo e quale si adatta meglio al tuo stile di mixing.',
    category: 'Confronti',
    author: 'Amerigo De Cristofaro',
    date: '18 Feb 2025',
    readTime: '10 min',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80',
    featured: false,
    content: `
      <h2>Il software conta quanto l'hardware</h2>
      <p>Il software DJ è il cervello del tuo setup. Gestisce la libreria musicale, analizza i BPM, sincronizza le tracce e controlla gli effetti. Scegliere quello giusto all'inizio ti risparmierà mesi di frustrazione e migrazioni forzate.</p>

      <h3>Rekordbox (Pioneer DJ)</h3>
      <p><strong>Pro:</strong> È lo standard dei club. Se prepari le tue tracce su Rekordbox, le USB che porti nei club funzioneranno perfettamente con i CDJ Pioneer. La modalità Performance è potente e ben integrata con i controller Pioneer.</p>
      <p><strong>Contro:</strong> Fuori dall'ecosistema Pioneer, il supporto hardware è limitato. L'interfaccia può sembrare complessa per i principianti. Il piano in abbonamento (circa 10-15 euro/mese per tutte le funzioni) può sembrare costoso.</p>
      <p><strong>Ideale per:</strong> DJ che suonano nei club, utenti di controller/CDJ Pioneer, chi vuole la massima compatibilità con l'hardware da club.</p>

      <h3>Serato DJ</h3>
      <p><strong>Pro:</strong> Interfaccia pulita e intuitiva, la più semplice da imparare. Supporta un'enorme varietà di controller di tutti i marchi. Serato DJ Lite è gratuito con molti controller. Eccellente per scratch e hip-hop grazie alla partnership storica con Rane.</p>
      <p><strong>Contro:</strong> Le funzionalità avanzate richiedono Serato DJ Pro (circa 10 euro/mese o 150 euro una tantum). Non prepara le chiavette USB per i CDJ Pioneer (servirebbero Rekordbox comunque).</p>
      <p><strong>Ideale per:</strong> Principianti, DJ hip-hop/open format, turntablisti, chi usa controller di marchi diversi.</p>

      <h3>Traktor Pro (Native Instruments)</h3>
      <p><strong>Pro:</strong> Gli effetti audio sono i migliori dei tre — creativi, profondi e unici. Remix Deck per performance ibride con loop e campioni. Stem Separation integrata per isolare kick, bassi, voci e melodie in tempo reale. Acquisto una tantum (circa 100 euro).</p>
      <p><strong>Contro:</strong> Base utenti più piccola, meno controller compatibili nativamente. Non prepara USB per CDJ. L'aggiornamento software è più lento rispetto ai concorrenti.</p>
      <p><strong>Ideale per:</strong> DJ techno/minimal, performer live che usano effetti e remix creativi, chi preferisce pagare una volta sola.</p>

      <h3>La nostra raccomandazione</h3>
      <p>Se parti da zero e non sai ancora il tuo genere: <strong>Serato DJ Lite</strong> (gratis con la maggior parte dei controller). Se sai già che vorrai suonare nei club: <strong>Rekordbox</strong>. Se sei un creativo che vuole effetti unici: <strong>Traktor</strong>.</p>
      <p>In ogni caso, tutti e tre sono software eccellenti. La cosa più importante è <strong>sceglierne uno e padroneggiarlo</strong>, piuttosto che saltare da uno all'altro.</p>
    `
  },
  {
    id: 'come-organizzare-primo-evento-dj-checklist',
    title: 'Come Organizzare il Tuo Primo Evento DJ: Checklist Completa dall\'Audio al Marketing',
    excerpt: 'Dalla scelta della location al dimensionamento dell\'impianto, dalla promozione social alla gestione della serata: tutto in una checklist pratica.',
    category: 'Business DJ',
    author: 'Amerigo De Cristofaro',
    date: '10 Feb 2025',
    readTime: '13 min',
    image: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&q=80',
    featured: false,
    content: `
      <h2>Da DJ a organizzatore: il salto di qualità</h2>
      <p>Organizzare il proprio evento è il passo che trasforma un DJ da "quello che suona alle feste degli amici" a professionista. Ma un evento mal organizzato può distruggere la tua reputazione più velocemente di quanto l'hai costruita. Ecco la checklist completa.</p>

      <h3>4-6 settimane prima: Pianificazione</h3>
      <ul>
        <li><strong>Location:</strong> Locale, spazio all'aperto, sala privata? Verifica capienza massima, orari di chiusura e limiti di rumore (dB). Chiedi sempre la licenza SIAE/SCF.</li>
        <li><strong>Budget:</strong> Calcola: affitto location + impianto audio + promozione + assicurazione + imprevisti (aggiungi sempre il 15% di buffer).</li>
        <li><strong>Lineup:</strong> Se inviti altri DJ, definisci orari, generi e compensi per iscritto. Niente accordi verbali.</li>
        <li><strong>Impianto audio:</strong> Dimensiona in base alla guida che trovi nel nostro blog. Prenota il noleggio o l'acquisto con anticipo.</li>
      </ul>

      <h3>2-3 settimane prima: Promozione</h3>
      <ul>
        <li>Crea l'evento su Instagram, Facebook ed Eventbrite</li>
        <li>Prepara grafiche professionali (Canva è sufficiente per iniziare)</li>
        <li>Video teaser di 15-30 secondi con la tua musica per le Stories</li>
        <li>Invita personalmente i primi 50 amici — il passaparola è il marketing più potente per i primi eventi</li>
        <li>Se il budget lo permette, sponsorizza il post Instagram nella tua città (anche solo 20-30 euro fanno la differenza)</li>
      </ul>

      <h3>1 settimana prima: Logistica</h3>
      <ul>
        <li>Sopralluogo nella location con l'impianto (o almeno con le misure)</li>
        <li>Verifica prese elettriche: quante, dove, amperaggio (un impianto medio consuma 2000-3000W)</li>
        <li>Prepara playlist di backup su chiavetta USB (in caso di problemi tecnici con il laptop)</li>
        <li>Conferma con il locale: orario setup, orario apertura, orario chiusura, contatto di emergenza</li>
      </ul>

      <h3>Il giorno dell'evento</h3>
      <ul>
        <li>Arriva almeno <strong>3 ore prima</strong> per il setup e il soundcheck</li>
        <li>Testa TUTTO: ogni canale del mixer, ogni cassa, le cuffie, il microfono</li>
        <li>Fai un soundcheck a volume evento per verificare la copertura della sala</li>
        <li>Prepara un punto di ricarica telefono per te (il telefono morto = nessuna Story = nessuna prova social)</li>
        <li>Documenta tutto: video e foto durante la serata per i social post-evento</li>
      </ul>

      <h3>Dopo l'evento</h3>
      <ul>
        <li>Posta foto/video entro 24 ore (l'hype si spegne velocemente)</li>
        <li>Ringrazia pubblicamente chi è venuto</li>
        <li>Raccogli feedback: cosa ha funzionato, cosa migliorare</li>
        <li>Se è andato bene, annuncia già la data del prossimo evento</li>
      </ul>
    `
  },
  {
    id: 'flight-case-protezione-attrezzatura-dj-guida',
    title: 'Flight Case e Protezione Attrezzatura DJ: Come Trasportare il Tuo Setup Senza Danni',
    excerpt: 'Il tuo controller da 500 euro merita una protezione adeguata. Guida ai flight case, borse imbottite e soluzioni di trasporto per ogni budget.',
    category: 'Accessori',
    author: 'Amerigo De Cristofaro',
    date: '02 Feb 2025',
    readTime: '6 min',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&q=80',
    featured: false,
    content: `
      <h2>Investi nella protezione, non nella riparazione</h2>
      <p>Un controller Pioneer DDJ-FLX6 costa 500 euro. Un flight case per proteggerlo ne costa 60-80. La riparazione di una jog wheel danneggiata in un bagagliaio? 150-250 euro, più settimane senza poter suonare. La matematica è semplice.</p>

      <h3>Tipologie di protezione</h3>
      <ul>
        <li><strong>Flight Case rigido:</strong> Il massimo della protezione. Struttura in legno multistrato rivestito di alluminio, angolari in metallo, imbottitura interna in espanso sagomato. Resistono a cadute, pressione e umidità. Ideali per: CDJ, mixer professionali, controller che viaggiano spesso.</li>
        <li><strong>Borsa imbottita (soft case):</strong> Più leggera e meno ingombrante del flight case. Imbottitura in schiuma da 10-20mm, tracolla e maniglie. Protezione sufficiente per il trasporto in auto. Ideale per: controller entry-level, spostamenti casa-locale.</li>
        <li><strong>Decksaver (coperchio):</strong> Coperchio in policarbonato sagomato che protegge knob, fader e jog wheel da polvere, liquidi versati e urti accidentali. NON è una soluzione di trasporto, ma è essenziale per proteggere l'attrezzatura a casa o in cabina. Costa 30-50 euro.</li>
      </ul>

      <h3>Flight case: cosa cercare</h3>
      <ul>
        <li><strong>Dimensioni interne precise:</strong> il controller deve entrare perfettamente, senza gioco eccessivo (rimbalzerebbe) né troppo stretto (si potrebbe danneggiare in inserimento)</li>
        <li><strong>Chiusure a farfalla:</strong> le chiusure economiche si rompono — investi in chiusure metalliche robuste</li>
        <li><strong>Piedi in gomma sulla base:</strong> permettono di appoggiare il case e suonare direttamente al suo interno (molti DJ professionisti fanno così)</li>
        <li><strong>Peso:</strong> un flight case per un controller a 4 canali pesa circa 5-8 kg vuoto. Valuta se puoi gestirlo</li>
      </ul>

      <h3>Marchi affidabili</h3>
      <p><strong>Budget:</strong> Proel, Power Dynamics — flight case funzionali da 40-80 euro.</p>
      <p><strong>Medio:</strong> Magma, UDG — borse e case di qualità superiore, 80-150 euro.</p>
      <p><strong>Pro:</strong> Odyssey, SKB — usati dai professionisti in tour, 150-400 euro.</p>

      <h3>Il nostro consiglio</h3>
      <p>Minimo indispensabile: <strong>Decksaver</strong> per la protezione quotidiana + <strong>borsa imbottita</strong> per il trasporto. Se suoni ogni settimana fuori casa, il <strong>flight case rigido</strong> è un investimento che si ripaga alla prima botta evitata.</p>
    `
  }
];

export function Blog({ onNavigate, showToast }: BlogProps) {
  useSEO({
    title: 'Blog — Guide, Tips & News per DJ e Audio Pro',
    description: 'Articoli, guide tecniche e news su attrezzatura DJ, audio professionale e produzione musicale. Scritti da un esperto certificato MAT Academy.',
    url: '/blog',
  });

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Tutti');
  const [searchQuery, setSearchQuery] = useState('');
  const [email, setEmail] = useState('');
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setIsAdmin(user?.email === 'amerigodecristofaro8@gmail.com');
    });

    const q = query(collection(db, 'blog_posts'), orderBy('date', 'desc'));
    const unsubscribePosts = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      if (postsData.length === 0) {
        setPosts(MOCK_POSTS);
      } else {
        setPosts(postsData);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching blog posts:", error);
      setPosts(MOCK_POSTS);
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribePosts();
    };
  }, []);
  
  const categories = ['Tutti', ...Array.from(new Set(posts.map(post => post.category)))];
  
  const filteredPosts = useMemo(() => {
    let result = activeCategory === 'Tutti' 
      ? posts 
      : posts.filter(post => post.category === activeCategory);
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(post => 
        post.title.toLowerCase().includes(query) ||
        post.excerpt.toLowerCase().includes(query) ||
        (post.content && post.content.toLowerCase().includes(query))
      );
    }
    return result;
  }, [posts, activeCategory, searchQuery]);

  const featuredPost = posts.find(post => post.featured);
  const regularPosts = filteredPosts.filter(post => !post.featured || activeCategory !== 'Tutti' || searchQuery.trim());

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !privacyConsent) return;

    try {
      setIsSubmitting(true);
      await addDoc(collection(db, 'newsletter_subscriptions'), {
        email,
        privacyConsent,
        marketingConsent,
        source: 'blog_main',
        timestamp: new Date().toISOString()
      });

      // Send welcome email
      try {
        await fetch('/api/emails/welcome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
      } catch (emailError) {
        console.error("Error sending welcome email:", emailError);
        // We don't fail the subscription if the email fails
      }
      
      showToast?.('Iscrizione completata con successo!', 'success');
      setEmail('');
      setPrivacyConsent(false);
      setMarketingConsent(false);
    } catch (error) {
      console.error("Errore iscrizione newsletter:", error);
      showToast?.('Errore durante l\'iscrizione. Riprova.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Officina del <span className="text-brand-orange">Suono</span> Blog
            </h1>
            <p className="text-xl text-zinc-400 max-w-2xl">
              Guide, recensioni e approfondimenti per DJ e produttori musicali. 
              Resta aggiornato sulle ultime novità del mondo pro-audio.
            </p>
          </div>
          {isAdmin && (
            <button 
              onClick={() => onNavigate('admin')}
              className="flex items-center gap-2 bg-brand-orange hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-brand-orange/20"
            >
              <Plus className="w-5 h-5" /> Nuovo Articolo
            </button>
          )}
        </div>

        {/* Search and Categories */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
          {/* Categories */}
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === category
                    ? 'bg-brand-orange text-white'
                    : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-white border border-white/5'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-zinc-500" />
            </div>
            <input
              type="text"
              placeholder="Cerca articoli..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-xl leading-5 bg-zinc-900/50 text-zinc-300 placeholder-zinc-500 focus:outline-none focus:bg-black focus:ring-1 focus:ring-brand-orange focus:border-brand-orange sm:text-sm transition-colors"
            />
          </div>
        </div>

        {/* Featured Post */}
        {activeCategory === 'Tutti' && !searchQuery.trim() && featuredPost && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16 group cursor-pointer"
            onClick={() => onNavigate('blog-post', featuredPost.id)}
          >
            <div className="relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-10" />
              <img 
                src={featuredPost.image} 
                alt={featuredPost.title}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 z-20">
                <div className="flex items-center gap-4 mb-4">
                  <span className="px-3 py-1 bg-brand-orange text-white text-xs font-bold uppercase tracking-wider rounded-full">
                    In Evidenza
                  </span>
                  <span className="text-brand-orange text-sm font-medium">{featuredPost.category}</span>
                  {isAdmin && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate('admin');
                      }}
                      className="ml-auto p-2 bg-white/10 hover:bg-brand-orange text-white rounded-full transition-colors"
                      title="Modifica Articolo"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 group-hover:text-brand-orange transition-colors">
                  {featuredPost.title}
                </h2>
                <p className="text-zinc-300 text-lg mb-6 max-w-3xl line-clamp-2">
                  {featuredPost.excerpt}
                </p>
                <div className="flex items-center gap-6 text-sm text-zinc-400">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{featuredPost.author}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{featuredPost.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{featuredPost.readTime}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Grid Posts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" style={{ contentVisibility: 'auto' }}>
          {regularPosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-zinc-900/50 border border-white/5 rounded-2xl overflow-hidden group cursor-pointer hover:border-brand-orange/30 transition-colors flex flex-col"
              onClick={() => onNavigate('blog-post', post.id)}
            >
              <div className="relative h-48 overflow-hidden">
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10" />
                <img 
                  src={post.image} 
                  alt={post.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                  <span className="px-3 py-1 bg-black/60 backdrop-blur-md text-white text-xs font-medium rounded-full border border-white/10">
                    {post.category}
                  </span>
                  {isAdmin && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate('admin');
                      }}
                      className="p-2 bg-black/60 backdrop-blur-md text-white rounded-full border border-white/10 hover:bg-brand-orange transition-colors"
                      title="Modifica Articolo"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="p-6 flex-grow flex flex-col">
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-brand-orange transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-zinc-400 text-sm mb-6 line-clamp-3 flex-grow">
                  {post.excerpt}
                </p>
                
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                  <div className="flex items-center gap-4 text-xs text-zinc-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{post.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{post.readTime}</span>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center group-hover:bg-brand-orange transition-colors">
                    <ArrowRight className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Newsletter CTA */}
        <div className="mt-20 bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-3xl p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-orange/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10 max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">Ricevi le Novità</h2>
              <p className="text-zinc-400">
                Iscriviti alla nostra newsletter per ricevere articoli, guide e offerte esclusive direttamente nella tua casella di posta. Niente spam, promesso.
              </p>
            </div>
            
            <form className="flex flex-col gap-4 max-w-xl mx-auto" onSubmit={handleSubscribe}>
              <div className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="La tua email" 
                  className="flex-grow bg-zinc-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-orange transition-colors disabled:opacity-50"
                  required
                  disabled={isSubmitting}
                />
                <button 
                  type="submit"
                  disabled={isSubmitting || !privacyConsent || !email}
                  className="bg-brand-orange hover:bg-brand-orange/90 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Iscrizione...</>
                  ) : (
                    <>Iscriviti <ChevronRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
              
              <div className="flex flex-col gap-3 mt-4 bg-black/20 p-4 rounded-xl border border-white/5">
                <div className="flex items-start gap-3">
                  <input 
                    type="checkbox" 
                    id="privacy-main" 
                    checked={privacyConsent}
                    onChange={(e) => setPrivacyConsent(e.target.checked)}
                    required 
                    disabled={isSubmitting}
                    className="mt-1 w-4 h-4 accent-brand-orange rounded border-white/10 bg-zinc-900 shrink-0" 
                  />
                  <label htmlFor="privacy-main" className="text-xs text-zinc-400 leading-relaxed">
                    Acconsento al trattamento dei dati personali per la ricezione della newsletter informativa sugli articoli del blog (<a href="#" onClick={(e) => {e.preventDefault(); onNavigate('privacy')}} className="text-brand-orange hover:underline">Privacy Policy</a>).*
                  </label>
                </div>
                
                <div className="flex items-start gap-3">
                  <input 
                    type="checkbox" 
                    id="marketing-main" 
                    checked={marketingConsent}
                    onChange={(e) => setMarketingConsent(e.target.checked)}
                    disabled={isSubmitting}
                    className="mt-1 w-4 h-4 accent-brand-orange rounded border-white/10 bg-zinc-900 shrink-0" 
                  />
                  <label htmlFor="marketing-main" className="text-xs text-zinc-400 leading-relaxed">
                    Acconsento all'invio di comunicazioni commerciali, offerte e promozioni esclusive da parte di Officinadelsuono.
                  </label>
                </div>
              </div>
              
              <p className="text-xs text-zinc-500 text-center mt-2">
                Puoi annullare l'iscrizione in qualsiasi momento cliccando sul link nei nostri messaggi.
              </p>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}