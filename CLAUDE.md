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
- **Tieni aggiornato questo file**: dopo ogni modifica importante aggiorna,
  nello stesso commit, la §2 (stato del progetto, versione di `sw.js`) e la §7
  (togli i punti risolti, aggiungi quelli nuovi); se cambia una regola o
  un'architettura, anche §3/§4. Le sessioni nuove non ricordano le precedenti:
  sanno solo quello che c'è qui e nel codice.

---

## 2. Stato del progetto (ottobre 2026, `sw.js` = `sala-giochi-v59`)

**Giochi** (gruppi come in `GAME_CATEGORIES`):
- *Carte*: Bisca, Scopa (anche Scopone), Briscola, Vecia, Cava Camisa, UNO,
  Scala 40, Poker (Texas Hold'em), **Joputa** (nuovo).
- *Tavolo*: Forza 4, Battaglia Navale, Dama, Scacchi, Risiko, **Air hockey**
  (nuovo, l'unico in tempo reale).
- *Casinò*: Roulette, Black Jack.

**Funzioni trasversali recenti**:
- **Schermo intero su PC** in tutte le partite: pulsante ⛶ in alto a destra
  (`#fs-btn`, `toggleFullscreen`), visibile solo con il mouse
  (`(any-pointer:fine)` oppure `body.has-mouse` al primo movimento del
  mouse); si esce con Esc o con lo stesso pulsante. Sui telefoni non compare.
- **Mazziere manuale** in tutti i giochi di carte tranne il Black Jack: il
  mazziere tocca i posti per dare le carte, con la regola del giro; pulsante
  "Dai il resto"; partita ferma finché non ha finito. Il tuo posto, invisibile
  durante il gioco, durante la distribuzione appare come disco "Tu" con
  l'anello, così il mazziere può darsi le carte (nella Bisca mancava del tutto:
  la mano restava bloccata).
- **Carte in volo** (pesca, giocata, passaggio) per tutti i giocatori, con il
  dorso del mazzo giusto per ogni gioco; si parte solo a immagine caricata.
- **La tua mano sul tavolo**, grande, al posto della tua icona; avversari su
  sinistra/alto/destra con il ventaglio di dorsi e il numero di carte.
- **Carta appena pescata** evidenziata in azzurro per 3 secondi.
- UNO con le immagini originali; scarico di carte uguali con Annulla/Continua
  accanto al pulsante UNO.
- Bisca: previsione, vite e "Prossima presa" subito sotto le tue carte.
- Dama: l'ultima mossa si anima salto per salto (`activateDamaMoveAnimation`,
  una volta per mossa); partenza/percorso/arrivo restano segnati, i pezzi
  mangiati restano in trasparenza con la ✕; elenco "Mosse" sotto la
  scacchiera (`match.moveLog`, ultime 40). Il bot aspetta la fine
  dell'animazione (`damaMoveAnimMs`) prima di rispondere. In orizzontale la
  scacchiera ha una larghezza esplicita (prima era larga 47 px) e l'elenco
  mosse sta nella colonna a sinistra.
- Dama italiana pura: la dama muove e mangia di **una sola casella**, avanti e
  indietro (non più "volante"); corona disegnata in SVG, visibile anche sulla
  dama bianca.
- **Poker riorganizzato per il telefono**: in verticale l'ovale è in piedi
  (`pokerIsPortrait`, `pokerTableConfig(n, portrait)`), carte comuni 3+2 larghe
  ~45 px con le caselle vuote segnate; niente fila di pillole (le fiches sono
  sui posti), bui e mano nella barra in alto, ultima azione nella fascia del
  turno; pulsanti su due righe (Passa / Controlla-Paga / Rilancia a N, poi
  scorciatoie + cifra). In orizzontale ovale sdraiato e la tua mano nella
  colonna dei pulsanti. Girando il telefono il tavolo si ridisegna (ascoltatore
  `resize` prima di `render`). L'altezza del disegno si calcola da posti ed
  etichette; le puntate stanno tra il posto e il centro.
- Scala 40: chi non è aperto può prendere dagli scarti solo se cala 40 punti
  nel turno, altrimenti rimette la carta e pesca dal mazzo.
- **Air hockey** (ottobre 2026): contro il bot o online in 2, primo a 7 gol.
  Canvas a 60 fps, tocco a dito nella propria metà campo; vedi §3 Air hockey.
  **A tutto schermo** (`.ah-full`, classe `body.ah-on`, ✕ in alto a sinistra
  per abbandonare) e disegnato come il tavolino della foto del proprietario:
  piano bianco forato, linee rosse, sponde di legno chiaro, testate nere,
  manopole rosse (la tua ha un filo d'oro) e disco nero (scelta del
  proprietario), contapunti 0-7
  a cursore sulla testata sopra ogni porta (`ahDrawCounters`).
- **Bot del Poker rifatti**: decidono sull'equità simulata (vedi §3 Poker).
  Prima puntavano/rilanciavano nell'1% delle decisioni e chi puntava sempre il
  piatto vinceva l'85% delle mani; ora 14-16% e chi punta sempre non guadagna
  più di chi gioca sensato (simulazioni da 900 mani).

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

### Dama
Motore: `damaCaptureSequences`, `damaAllLegalCaptures` (priorità: più pezzi
→ presa con la dama → più valore → prima dama incontrata), `damaAllLegalMoves` (se c'è una presa è
obbligatoria), `damaSimpleMoves` (dama: una casella), `damaMakeMove(…, sig)` con `damaMoveSig` per giocare
esattamente la presa scelta. `lastMove` ha `path` e `capturedSq`.

### Poker (bot)
`pokerBotEquity` simula ~450 finali con un valutatore veloce
(`pokerFastScore`, verificato su 20.000 mani contro `texasEvaluateBest`);
`pokerBotDecide`: prima del flop forza relativa (`rel`) con soglie in grandi
bui, dopo il flop equità contro la quota del piatto; per puntare/rilanciare
`rs` (0 = mano media, 1 = imbattibile). Ogni bot ha un carattere fisso
(`pokerBotStyle`). `match.pstats` + `pokerAggression` contano quanto punta
ognuno; contro chi punta quasi sempre i bot pagano fino in fondo con ~47% al
flop / 43% al turn e rilanciano di più (`streetAggressor`).

### Air hockey (tempo reale)
**Mouse bloccato (PC)**: il clic sul tavolo chiede Pointer Lock sul canvas
e lo schermo intero; bloccata, la manopola si muove con `movementX/Y` a partire
da dove si trova e il punto virtuale è tenuto nella propria metà
(`ahClampPad`). Col mouse **non bloccato la manopola non segue la freccia**
(prima la seguiva anche senza clic: si giocava senza blocco e la freccia usciva
lo stesso). `ahNeedsLock(A)` = si usa il mouse (`A.mouse`, dall'ultimo
`pointerType`), non bloccato e il browser non ha rifiutato (`A.lockFailed`:
in quel caso si torna alla freccia libera). Da solo, finché serve il clic la
partita è ferma (`ahHeld`: all'inizio e dopo Esc, "Pausa"); online no.
Non passa da `render()` a ogni istante: `activateAirHockey` (chiamato dopo
l'`innerHTML`) aggancia al `<canvas id="ah-canvas">` un motore `AH` che vive
fuori da `#app` e sopravvive ai ridisegni (`ahFrame` con
`requestAnimationFrame`, fisica `ahStep` a ~240 passi/s, bot `ahBotTarget`).
La partita (`match`) cambia **solo ai gol** (`score`, `goals`, `lastGoal`
con ora del server): il ridisegno avviene solo allora.
Online: canale separato `ahlive:<matchId>` (`puck`, `pad_p0`, `pad_p1`) che
non passa da `setActiveMatch`. **Il disco lo comanda chi ce l'ha nella sua
metà** (`A.owner`); al centro si passa il controllo (`ahSendTick(…, true)`,
fotogramma con `o` = nuovo padrone). Chi riceve porta avanti il fotogramma
con l'orologio comune (`.info/serverTimeOffset`). Il gol lo scrive chi lo
subisce (`ahRegisterGoal`). Con un bot in sala lo muove il primo umano.
Coordinate: larghezza 1, lunghezza `AH_H`=1.6; p0 difende in basso, p1 in
alto; la vista di p1 è girata. Bordo disegnato: sponde `AH_RX`, testate
`AH_RY` (più spesse: c'è il contapunti).
**Sensibilità del tocco**: la manopola segue il dito in modo uniforme lungo i
passi di fisica del fotogramma (`A.ptrPrev` → `A.pointer`), quindi la sua
velocità è quella vera del dito (prima raggiungeva il dito in un passo: scatti
3-4 volte più veloci del gesto). Il rimbalzo disco/manopola dipende dalla
forza (`e` da 0,08 a 0,9 tra 0,4 e 2 di velocità d'urto): toccato piano il
disco si trascina, colpito forte parte. Misure: dito a 0,25 → disco 0,27 (prima
1,86); dito a 4 → 4,2. Ogni contatto (anche leggero) aggiorna `localHitT`.
**Disco incastrato**: se resta entro 0,05 dallo stesso punto nella fascia
`AH_EDGE` lungo le sponde per 1,2 s (anche se vibra) riceve una spinta verso
il centro; il bot si scosta da 0,6 s. Nell'angolo (stessa fascia) il bot
aspetta dal lato interno senza spingere (spingere verso l'angolo lo teneva
schiacciato per sempre: era la causa dei blocchi nelle prove online).
**Il canvas è sempre lo stesso elemento**: a ogni `render()` (gol)
`activateAirHockey` rimette al suo posto quello vecchio. Motivo: Safari manda i
movimenti del dito all'elemento su cui il tocco è iniziato anche dopo che è
stato tolto dalla pagina; misurava 0×0, la manopola diventava NaN e il
disegno (`createRadialGradient`) si bloccava per sempre dopo il primo gol.
In più: `toTable` misura sempre `AH.canvas`, `ahMovePad` scarta bersagli non
finiti, `ahUpdate` rimette a casa ciò che non è finito, `ahFrame` non muore
per un errore (try/catch). Per riprodurre in Chromium: inviare `PointerEvent`
al canvas staccato.

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
- **Dama** (regola italiana, scelta del proprietario): la pedina muove e
  cattura solo in avanti e non cattura la dama; la dama muove e cattura di
  una sola casella, avanti e indietro, e può mangiare le dame. Priorità di
  presa: più pezzi → con la dama → più dame → prima la dama incontrata.
- **Poker**: il tuo posto resta (fiches, puntata, bottone D); le carte stanno
  sotto il tavolo (in orizzontale nella colonna di destra). Le puntate vanno
  verso il centro, come al tavolo vero. Orientamento consigliato: **verticale**
  (carte comuni ~45 px contro ~26 in orizzontale); su iPhone non si può
  bloccare la rotazione da una PWA, quindi funzionano entrambi.
- **Air hockey**: autorità sul disco per metà campo invece di un telefono
  "padrone" unico, perché così i colpi sono calcolati senza ritardo sul
  telefono di chi colpisce. Bot volutamente più lento di te (manopola 2,3
  contro 6) e con ~0,25 s di reazione; porta larga 0,42. Manopole con raggio
  0,085 (erano 0,072: ingrandite su richiesta del proprietario).
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

- **Air hockey online**: provato solo con un Firebase simulato (2 browser,
  120-150 ms di ritardo, orologi sfasati di 5 s: punteggi identici, disco
  allineato). Da provare con due telefoni veri. Difficoltà del bot da tarare
  sul campo (contro un "umano" simulato perfetto perde 6-0 in un minuto).

- **Dama**: manca la patta. Con poche dame per parte (es. 4 contro 4) una
  partita può non finire mai (visto tra due bot: 90+ mosse senza prese);
  proposta: patta dopo N mosse senza prese o con posizione ripetuta.

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
- **Scacchi in orizzontale**: scacchiera larga solo ~130 px (stesso difetto
  corretto per la Dama con `.dama-board`); da sistemare allo stesso modo.
- **Air hockey in orizzontale**: il tavolo resta in piedi e piccolo (alto
  quanto lo schermo). Proposta: girarlo di 90° quando il telefono è
  orizzontale (porte a sinistra/destra, contapunti sui lati).
- **Schermo orizzontale**: il tavolo resta piccolo (altezza max 50% dello
  schermo), comune a tutti i giochi.
- **Scala 40 su schermi da 360 px**: sbordo orizzontale di ~7 px già presente
  prima dei lavori recenti.
- `README.md` contiene solo il titolo; un commento vicino a `CARD_IMG` cita
  `index-offline.html`, che nel repository non esiste.
- Per provare l'online senza Firebase: finto `db` in pagina che inoltra le
  scritture all'altra pagina con ritardo (fatto per l'air hockey).
- Air hockey bot contro bot: mettere `isBot=true` anche in `localOverrideMatch`
  (e salvarlo), non solo in `AH.match`: al primo gol la partita si ricarica e
  la manopola tornerebbe "umana" e ferma.
- Gli script di prova sono stati scritti di volta in volta e non sono nel
  repository: valutare una cartella `tests/` con i principali (mazziere, voli,
  partite di soli bot, mano sul tavolo).
