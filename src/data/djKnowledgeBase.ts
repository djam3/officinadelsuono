export const DJ_KNOWLEDGE_BASE = {
  brands: {
    pioneer: {
      name: "Pioneer DJ / AlphaTheta",
      philosophy: "Standard mondiale nei club. Layout CDJ/DJM.",
      products: {
        "cdj-3000": "Il player di punta. Schermo touch da 9 pollici, MPU avanzata, Pro DJ Link.",
        "djm-a9": "Mixer professionale a 4 canali, qualità audio a 32 bit, connettività Wi-Fi.",
        "ddj-flx4": "Controller entry-level perfetto per Rekordbox e Serato.",
        "opus-quad": "Sistema standalone all-in-one dal design elegante e 4 deck."
      },
      tech: "Pro DJ Link, Rekordbox, Magvel Fader Pro."
    },
    denon: {
      name: "Denon DJ",
      philosophy: "Innovazione tecnologica, standalone potente.",
      products: {
        "sc6000": "Player con schermo da 10 pollici, dual-layer (due tracce da un solo player).",
        "prime-4": "Il sistema standalone a 4 canali più potente sul mercato.",
        "prime-go": "Console portatile con batteria integrata, ideale per set in movimento."
      },
      tech: "Engine DJ OS, Wi-Fi streaming, Dual Layer."
    },
    allenHeath: {
      name: "Allen & Heath",
      philosophy: "Qualità audio analogica superiore, filtri leggendari.",
      products: {
        "xone:92": "Il mixer analogico standard per la techno, 4 bande di EQ, filtri VCF.",
        "xone:96": "Evoluzione del 92 con doppia scheda audio USB e distorsione Crunch."
      },
      tech: "VCF Filters, 4-band EQ, Total Analog Circuitry."
    }
  },
  categories: {
    mixer: "Il cuore del setup. Gestisce i volumi, l'equalizzazione e gli effetti.",
    player: "Dispositivi per riprodurre musica (CDJ, giradischi, media player).",
    controller: "Dispositivi che controllano un software sul computer (Rekordbox, Serato, Traktor).",
    standalone: "Sistemi che funzionano senza computer, caricando musica da USB o SD."
  },
  troubleshooting: {
    "no-audio": "Controlla i guadagni (Trim), i fader e che il selettore di ingresso sia corretto.",
    "distorsione": "Assicurati che i livelli non siano nel rosso. Abbassa il Trim o il Master.",
    "connessione": "Verifica i cavi XLR/RCA. Se usi Pro DJ Link, controlla il cavo LAN.",
    "software": "Aggiorna i driver e il firmware del dispositivo dal sito ufficiale."
  },
  faq: {
    "spedizione": "Spediamo in tutta Italia con corriere espresso in 24/48 ore.",
    "garanzia": "Tutti i prodotti hanno 2 anni di garanzia ufficiale italiana.",
    "consulenza": "Amerigo è disponibile per consulenze personalizzate su WhatsApp al 347 739 7016."
  }
};

export type KnowledgeBase = typeof DJ_KNOWLEDGE_BASE;
