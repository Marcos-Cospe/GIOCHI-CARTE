# Sala Giochi — consegne per chi ci lavora (CLAUDE.md)

App web di giochi di carte, da tavolo e da casinò, per giocare con amici
(online, sincronizzati) o da soli contro i bot. Tutta l'app è in **un solo
file**: `index.html`. Pubblicata su GitHub Pages:
`https://marcos-cospe.github.io/GIOCHI-CARTE/`.

---

## 1. Consegne (come lavorare su questo progetto)

- **Lingua**: si risponde e si scrive (commenti, messaggi di commit, testi
  dell'interfaccia) in **italiano**.
- **Stile richiesto dal proprietario**: consulente senior. Prima analizza
  obiettivo e rischi; se manca un'informazione cruciale fai **2-3 domande
  mirate, in italiano**, prima di procedere; niente convenevoli; se l'idea è
  debole o c'è un errore di ragionamento, dillo e proponi un'alternativa.
- **Push automatico su `main` autorizzato**: a ogni modifica completata e
  verificata si fa commit, push sul branch della sessione e merge
  fast-forward/merge su `main`, poi push di `main` (è `main` che GitHub Pages
  pubblica). Se la sessione assegna un branch di lavoro, si sviluppa lì e si
  porta comunque su `main`.
- **A ogni modifica di `index.html` aumenta `CACHE_NAME` in `sw.js`**
  (`sala-giochi-vNN` → `vNN+1`). Senza, i telefoni continuano a vedere la
  versione vecchia.
- Dopo il push controlla che il deploy di Pages sia finito prima di dire
  "è online": `gh api "repos/Marcos-Cospe/GIOCHI-CARTE/actions/runs?per_page=1"`
  (deve risultare `completed success` sul commit giusto).
- Ricorda sempre all'utente: per vedere la versione nuova sul telefono va
  **chiusa del tutto e riaperta l'app** (il service worker mostra prima la
  copia salvata e aggiorna in sottofondo).
- **Verifica prima di dichiarare**: ogni modifica visiva o di gioco va provata
  con Playwright (vedi §6) e guardata su screenshot a dimensione telefono.
- Le immagini delle carte sono **quelle del proprietario** (`cards/`,
  `cards-poker/`, `cards-uno/`): non sostituirle con disegni propri.

---

## 2. Stato del progetto (ottobre 2026, `sw.js` = `sala-giochi-v45`)

**Giochi** (gruppi come in `GAME_CATEGORIES`):
- *Carte*: Bisca, Scopa (anche Scopone), Briscola, Vecia, Cava Camisa, UNO,
  Scala 40, Poker (Texas Hold'em), **Joputa** (nuovo).
- *Tavolo*: Forza 4, Battaglia Navale, Dama, Scacchi, Risiko.
- *Casinò*: Roulette, Black Jack.

**Funzioni trasversali recenti**:
- **Mazziere manuale** in tutti i giochi di carte tranne il Black Jack: il
  mazziere tocca i posti per dare le carte, con la regola del giro; pulsante
  "Dai il resto"; partita ferma finché non ha finito.
- **Carte in volo** (pesca, giocata, passaggio) per tutti i giocatori, con il
  dorso del mazzo giusto per ogni gioco; si parte solo a immagine caricata.
- **La tua mano sul tavolo**, grande, al posto della tua icona; avversari su
  sinistra/alto/destra con il ventaglio di dorsi e il numero di carte.
- **Carta appena pescata** evidenziata in azzurro per 3 secondi.
- UNO con le immagini originali; scarico di carte uguali con Annulla/Continua
  accanto al pulsante UNO.
- Bisca: previsione, vite e "Prossima presa" subito sotto le tue carte.
- Scala 40: chi non è aperto può prendere dagli scarti solo se cala 40 punti
  nel turno, altrimenti rimette la carta e pesca dal mazzo.

---

## 3. Architettura

### File
| File | Ruolo |
|---|---|
| `index.html` | Tutta l'app (~15.000 righe): HTML, CSS, JS. GSAP è incluso inline. |
| `sw.js` | Service worker: cache dell'app e delle immagini (offline + avvio rapido). |
| `manifest.json`, icone | Installazione come app (PWA). |
| `cards/` | Mazzo trevigiano (JPG, ~122×248, dorso `back.jpg`). |
| `cards-poker/` | Mazzo francese con jolly (PNG 118×165, dorso `back.png`). Usato da Scala 40, Poker, Joputa, Black Jack. |
| `cards-uno/` | Carte UNO (PNG ~46×69). Il dorso UNO è un SVG in codice (`UNO_BACK_IMG`). |
| `LEGGIMI.md` | Guida all'installazione (Firebase + GitHub Pages). |

### Sincronizzazione
- **Firebase Realtime Database** (SDK compat 10.12, configurazione in
  `FIREBASE_CONFIG`), tutto sotto il percorso `bisca/` (`fbPath`).
- `window.storage` è un piccolo wrapper get/set/delete sopra Firebase (o
  locale in partita da solo).
- Stato partita: `getActiveMatch()` / `setActiveMatch(m)`. Ogni scrittura
  incrementa `m.rev`; `localOverrideMatch` è la copia locale. Solo la Bisca usa
  il formato compatto `packMatch`/`unpackMatch`; gli altri giochi sono esclusi
  da quelle due liste e viaggiano in chiaro.
- **I bot girano su tutti i dispositivi** (`scheduleBotMove` → funzione per
  gioco), con `botMoveKey`/`botMoveTimer` per non ripetere la mossa e ricontrollo
  dello stato prima di muovere.
- Chi sei: `claim` = `{type:'seat', playerId}` oppure `{type:'all'}`
  (schermo condiviso: si mostra chi deve muovere).

### Disegno (render)
- `render()` ricostruisce tutto `#app` (`innerHTML`) a ogni cambio. Salta il
  ridisegno se `stateKeyOf(match, claim)` non cambia (la chiave include sempre
  `match.rev`). `renderGen` scarta i ridisegni superati.
- Dopo l'`innerHTML` partono, in quest'ordine, gli agganci:
  `activateRouletteSpinAnimation` / `activateBattleshipShotAnimation` /
  `activateBiscaDealAnimation` → `preloadDeckImages` → **`activateTableHand`**
  → **`activateCardMotion`** → `applyDrawnHighlight` → **`activateManualDeal`**
  → `scheduleBotMove`.
- **Tavoli dei giochi di carte**: SVG quadrato (`tableConfig(n)`,
  `.table-svg` con altezza massima `min(420px, 50vh)`). I posti si calcolano
  con **`tableSeatLayout(half, ids, myId)`**: tu sei il primo di `ids`
  (`rotateIdsForMe`), non vieni disegnato (`mySeatMarkerSVG`, un punto
  invisibile che serve a mazziere, voli e carta giocata) e gli avversari vanno
  su sinistra/alto/destra. Il ventaglio degli avversari è `seatFanSVG` (mazzi in
  `FAN_DECKS`).
- **Mano sul tavolo**: ogni gioco disegna la mano come sempre ma dentro
  `<div class="my-hand-src">` (titolo con classe `my-hand-title`);
  `activateTableHand` la sposta in `.table-hand` sotto l'SVG, la ingrandisce
  e la sovrappone (`layoutTableHand`). Tutto ciò che ha classe **`.under-hand`**
  viene spostato subito sotto la mano (es. previsioni della Bisca).

### Motori trasversali (cercali per nome nel file)
- **Carte in volo** — `cardMotionModel(match)` dichiara per gioco i
  "proprietari" da osservare (mani, `U:`/`D:` per Joputa, `__pile`), il dorso e
  la faccia. `activateCardMotion` confronta prima/dopo e chiama `cardMotionFly`.
  I punti di partenza e arrivo vengono dai marcatori DOM: `data-seat`,
  `data-deck`, `data-pile`, `data-card`. Opzioni: `epoch` (mano nuova = solo
  fotografia), `silentLeave`, `lastActor` (pesca+gioca nello stesso ridisegno
  → volo in due tempi), `dealFrom` (durante la distribuzione partono dal
  mazziere). `flyCardImage` aspetta che l'immagine sia caricata (max 700 ms).
- **Mazziere manuale** — `mdealIntercept(m)` dentro `setActiveMatch`: quando un
  gioco crea una mano nuova (`mdealSpec`: epoch/fresh/ordine/mazziere), mette da
  parte le mani (`m.mdeal.finals`), le svuota e le fa riempire a tocchi
  (`mdealGive`, regola del giro in `mdealCanGive`), con bot o "Dai il resto"
  (`scheduleManualDealMove`). La **Bisca** ha il suo sistema più vecchio
  (`phase:'dealing'`, `dealBiscaCard`). Joputa distribuisce 9 carte nell'ordine
  coperte → scoperte → mano.
- **Evidenziazione carta pescata** — `drawnHighlightUntil` + `applyDrawnHighlight`
  (classe `.just-drawn`); serve `data-card` sulle carte della mano.

### Joputa
Motore autonomo (`buildJoputaMatch`, `joputaCanPlay`, `joputaApplyPlay`,
`scheduleJoputaBotMove`, `renderJoputaMatch`). Fasi `swap` → `playing` →
`ended`. Stato: `hands`, `faceUp`/`faceDown` (3 posizioni, `null` = giocata),
`drawPile`, `pile`, `burned`, `finished`.

---

## 4. Decisioni prese (e perché)

- **Un solo file `index.html`**: niente build, si pubblica così com'è su Pages.
- **Mazziere manuale centralizzato in `setActiveMatch`** invece che in ogni
  punto dove un gioco inizia una mano (partita nuova, mano successiva, sala,
  solo): un solo punto, nessun ramo dimenticato.
- **Black Jack senza mazziere manuale**: le carte le dà il banco, non un
  giocatore seduto.
- **Cava Camisa**: il tuo mazzetto resta coperto anche per te (regola del gioco).
- **Bisca, mano da 1 carta**: la tua carta è coperta e quelle degli altri si
  vedono (regola "sulla fronte"), anche nei ventagli.
- **Scala 40, presa dagli scarti da non aperto**: bastano 40 punti calati nel
  turno, non serve usare la carta presa (scelta del proprietario); se non apre,
  "Rimetti la carta e pesca dal mazzo".
- **Joputa** (regole decise con il proprietario): uguale o più alta, più carte
  uguali insieme, 4 uguali di fila bruciano; 2 azzera, 10 brucia e rigiochi,
  7 trasparente (giocabile su tutto), 4 fa saltare il turno (uno per ogni 4),
  Jolly su tutto e poi serve **solo** un Asso o un Jolly (anche 2/10/7 non
  bastano); si pesca fino a 3 finché c'è il mazzo; chi non può gioca raccoglie
  la pila e salta il turno. Scelte mie, da confermare se cambiano idea: inizia
  il primo a sinistra del mazziere; la pila si raccoglie solo se non hai mosse.
- **Poker**: il tuo posto resta (fiches, puntata, bottone D); le carte stanno
  sotto il tavolo.
- **Ventaglio avversari**: massimo 9 dorsi, il numero esatto nel pallino.
- **Niente `filter` animato** sulle carte da evidenziare (ritagli in Safari):
  si usano `box-shadow` e `transform`.

---

## 5. Convenzioni del codice

- Commenti in italiano che spiegano il **perché** (spesso un bug reale
  riprodotto), non il cosa. Mantieni lo stesso tono e la stessa densità.
- Le etichette dei giochi sono catene di ternari (`s.game==='x' ? 'X' : …`):
  per aggiungerne uno si inserisce un ramo, non si riscrive la catena.
- Colori: oro `#D4AF6A`, panno `#1D3730`/`#274539`, testo crema `#F1ECE1`,
  azzurro `#4FC3F7` **solo** per "carta appena pescata" (l'oro indica carte
  giocabili/selezionate).
- Un elemento SVG che deve ricevere tocchi ha `fill="transparent"` (con
  `fill="none"` il tocco non arriva).
- In SVG non mettere `filter` e `transform-style:preserve-3d` sullo stesso
  elemento (Chromium appiattisce il 3D).

**Aggiungere un gioco nuovo (lista di controllo, fatta per Joputa):**
`GAME_CATEGORIES` · etichette in lobby/sala/storico · `roomFormatMax` ·
messaggio in `addRoomBot` · `startRoomMatch` · testo regole in creazione sala
e in "Gioca da solo" · `maxBot`/`changeBotCount` · `startSoloMatch` ·
dispatch in `render()` · `stateKeyOf` · esclusione in `packMatch` e
`unpackMatch` · `scheduleBotMove` · storico (`maybeSave…History`) ·
`cardMotionModel` · `mdealSpec` (e, se la mano non è solo `hands`,
`mdealIntercept`/`mdealGive`) · tavolo con `tableSeatLayout` + `mySeatMarkerSVG`
+ `seatFanSVG` · mano in `.my-hand-src` · `preloadDeckImages`/`FAN_DECKS`.

---

## 6. Come provare le modifiche

- Server locale: `python3 -m http.server 8791` dalla cartella del repo.
- Playwright (Python) con il Chromium già installato:
  `executable_path='/opt/pw-browsers/chromium'` (non lanciare
  `playwright install`).
- Nella pagina: togli il video d'intro
  (`document.getElementById('intro-overlay').remove()`), poi
  `selectedGame='uno'; soloBotCount=3; await startSoloMatch();`. Lo stato è in
  `localOverrideMatch`; per fermare i bot `clearTimeout(botMoveTimer);
  botMoveKey=null` e `isBot=false`; per saltare la distribuzione
  `m.mdeal.auto=true` (o forza `m.mdeal.dealerId`).
- Controlli utili usati finora: partite intere giocate solo dai bot (nessun
  blocco, conteggio carte costante), registrazione di `flyCardImage` per i voli,
  `document.documentElement.scrollWidth - innerWidth` per lo sbordo orizzontale,
  screenshot a 390×844 (telefono).
- Sintassi: estrai gli `<script>` interni in un file `.js` e lancia
  `node --check`.
- Attenzione: `pkill -f "testo"` uccide anche la shell che lo lancia se il
  testo compare nel comando stesso; usa un pattern tipo `"slowserve[r].py"`.

---

## 7. Cose da fare / punti aperti

- **Joputa**: le tue 3 carte coperte e 3 scoperte sono ancora nella sezione
  sotto il tavolo; proposto di portarle sul tavolo come la mano.
- **Ventaglio avversari oltre 9 carte**: proposto di farlo crescere fino a 20.
- **UNO**: la carta che chiude la mano non vola (il tavolo lascia subito il
  posto al riepilogo); proposto un ritardo di mezzo secondo.
- **UNO**: a volte risultano evidenziate due carte; probabilmente una arrivata
  pochi secondi prima (+2 di un bot), da verificare.
- **Black Jack**: mazziere manuale non fatto (vedi decisioni); chiedere se lo
  vogliono comunque.
- **Cava Camisa**: dopo una presa serve un umano che tocchi "Continua"; una
  partita di soli bot si ferma lì (comportamento storico).
- **Schermo orizzontale**: il tavolo resta piccolo (altezza max 50% dello
  schermo), comune a tutti i giochi.
- **Scala 40 su schermi da 360 px**: sbordo orizzontale di ~7 px già presente
  prima dei lavori recenti.
- `README.md` contiene solo il titolo; un commento vicino a `CARD_IMG` cita
  `index-offline.html`, che nel repository non esiste.
- Gli script di prova sono stati scritti di volta in volta e non sono nel
  repository: valutare una cartella `tests/` con i principali (mazziere, voli,
  partite di soli bot, mano sul tavolo).
