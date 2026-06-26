# Configuratore Cliente — Visione "ideale"

> Documento di design del configuratore casse lato **cliente finale**.
> Obiettivo: trasformare un cliente (DJ, band, installatore, appassionato) da
> "non so cosa mi serve" a "ho ordinato la cassa giusta per me", con fiducia.
> Officina del Suono costruisce casse **artigianali su misura**: il configuratore
> deve far percepire competenza + sartorialità, non spaventare con la tecnica.

## Principi guida

1. **Prima il risultato, poi i componenti.** Il cliente pensa "mi serve un sub
   che spinga per 200 persone", non "voglio un B&C 18SW115 in allineamento QB3".
   Si parte dall'uso, i componenti sono una conseguenza.
2. **Semplice di default, tecnico a richiesta.** Ogni schermata mostra il minimo
   indispensabile; i dettagli (Thiele-Small, Fb, F3, crossover) stanno dietro a
   un "Mostra dettagli tecnici". Niente muri di numeri.
3. **Sempre una scelta consigliata.** In ogni step c'è un'opzione "Consigliato da
   Amerigo" pre-selezionabile in un click. Il cliente indeciso non si blocca mai.
4. **Fiducia e trasparenza.** Foto reali, misure reali, prezzo IVA inclusa, tempi
   di consegna, garanzia, "fatto a mano e collaudato". Un essere umano (Amerigo)
   sempre raggiungibile (WhatsApp).
5. **Mobile-first.** La maggior parte dei clienti configura dal telefono.
6. **Non si perde niente.** La configurazione si salva (link/ID) e si può
   riprendere o mandare ad Amerigo.

## Modalità di ingresso

All'apertura, due porte:

- **Guidami (consigliata)** — rispondi a 3 domande semplici, pensiamo noi al resto.
- **Modalità esperto** — vai diretto a scegliere topologia e componenti.

Entrambe convergono sullo stesso riepilogo finale.

## Flusso ideale (lato cliente)

### 1. A cosa ti serve?  *(uso + contesto)*
- **Uso**: DJ mobile · Club/discoteca · Band live · Studio/monitor · Installazione
  fissa · Casa/Hi-Fi
- **Quanto grande**: piccolo (bar/casa) · medio (sala/200 pers.) · grande
  (capannone/piazza) · outdoor
- Da qui ricaviamo **SPL target**, ambiente e una **topologia consigliata**.
  Il cliente non vede formule: vede "Per questo useremo… ✓".

### 2. Che tipo di cassa?  *(topologia)*
- **Subwoofer** (solo bassi) · **2 vie** (woofer + alti, tuttofare) ·
  **3 vie** (woofer + medio + alti, massima qualità)
- Ognuna con 1 riga in italiano semplice + silhouette riconoscibile (stile RCF/FBT)
- Badge "Consigliato per il tuo uso" sulla scelta suggerita dallo step 1.

### 3. Scegli gli altoparlanti
- In cima: **"Setup consigliato da Amerigo"** → un click e sei a posto.
- Altrimenti scegli woofer / medio / tweeter dal catalogo con:
  - **Foto reale** del componente (o render rappresentativo finché manca la foto)
  - 2-3 dati in linguaggio umano: "Potenza", "Quanto spinge" (SPL), marca
  - **Compatibilità a semaforo** (verde/giallo) invece di percentuali criptiche
- Niente Thiele-Small in vista: stanno sotto "dettagli tecnici".

### 4. La tua cassa  *(anteprima 3D reale)*
- **Box in legno grezzo alle misure reali** che ruota (il prodotto vero, non un'icona).
- Riassunto in italiano semplice: "Bassi profondi fino a ~XX Hz", "Spinge forte",
  dimensioni e peso.
- Espandibile: progetto acustico completo (tipo cassa, Fb, F3, porta, curva SPL).

### 5. Personalizza l'estetica
Opzioni che contano per il cliente (impattano prezzo/estetica, non l'acustica):
- **Dimensioni**: preset Compatta / Standard / Maggiorata (o slider in esperto)
- **Finitura**: legno grezzo · vernice nera testurizzata · bianca · colore RAL custom
- **Griglia** metallica frontale (sì/no)
- **Maniglie**, **ruote**, **incasso per asta** (pole mount), **angolo monitor**
- **Connettori**: Speakon / combo / morsetti

### 6. Amplificazione & elettronica
In linguaggio chiaro, niente sigle:
- **Attiva** (consigliata): ampli + DSP **già integrati**, plug & play. Scegli la
  **potenza** a livelli ("Sufficiente / Consigliata / Massima"), non il modello.
- **Passiva**: colleghi il tuo ampli; includiamo il crossover.
- **Protezione inclusa**: il **limiter** è già calcolato e impostato nel DSP per
  proteggere i tuoi altoparlanti — il cliente legge "Protezione driver: inclusa",
  il valore tecnico (Vrms/dBu) sta nei dettagli.

### 7. Riepilogo, prezzo e consegna
- **Foto/3D del prodotto finale** configurato.
- **Prezzo chiaro** IVA inclusa, **tempi di consegna** stimati, **garanzia**,
  "cosa è incluso".
- **3 azioni**:
  1. **Acquista ora** (pagamento Stripe)
  2. **Richiedi preventivo** (per richieste fuori standard)
  3. **Parlane con Amerigo** (WhatsApp, con la config già allegata)
- **Scarica scheda PDF** (render + specifiche + predisposizioni + limiter).
- **Segnali di fiducia**: artigianale, collaudato, progettato da sound engineer
  certificato, reso/garanzia.

## Cosa c'è GIÀ (giugno 2026)
- Flusso a step sub / 2 vie / 3 vie con crossover calcolato. ✓
- Motore acustico corretto e **condiviso con l'Admin** (no doppi calcoli). ✓
- Anteprima **3D in legno grezzo a misure reali**, finiture nero/bianco solo se
  scelte, vista esplosa. ✓
- Predisposizione **modulo ampli + DSP** sempre riservata; **limiter** calcolato
  e spiegato (vive nel DSP). ✓
- **Prezzo automatico** (componenti + materiali + lavorazione + IVA), **carrello**,
  **checkout Stripe**, **PDF** con render. ✓
- **Multilingua** (9 lingue). ✓
- Immagini componenti **specifiche per tipo** (cono/tromba/cupola/piastra),
  sostituibili da foto reali in automatico. ✓

## Cosa MANCA per arrivare all'"ideale"
1. **Modalità "Guidami"** (3 domande → preset) come ingresso principale.
2. **Linguaggio cliente**: oggi mostriamo troppi termini tecnici in primo piano;
   serve il livello "umano" con i dettagli ripiegabili.
3. **Step estetica più ricco**: griglia, ruote, maniglie, pole mount, colore RAL.
4. **Potenza ampli a livelli** invece del modello (semplificazione step 6).
5. **Tempi di consegna + garanzia + "cosa include"** nel riepilogo.
6. **Salva/riprendi configurazione** (link condivisibile) e **invio a WhatsApp**.
7. **Foto reali** dei componenti (le scatta Officina del Suono → drop-in automatico).
8. **Preset "alla RCF/FBT"**: 2-3 modelli-vetrina pronti come punto di partenza.

## Priorità consigliate (impatto/sforzo)
1. Modalità "Guidami" + preset consigliati  *(alto impatto, medio sforzo)*
2. Linguaggio cliente + dettagli ripiegabili  *(alto, medio)*
3. Riepilogo con consegna/garanzia + WhatsApp  *(alto, basso)*
4. Step estetica esteso  *(medio, medio)*
5. Salva/riprendi configurazione  *(medio, medio)*
6. Foto reali componenti  *(alto, dipende da Officina del Suono)*

---
*Questo documento è la base condivisa: aggiornalo quando cambiamo direzione.*
