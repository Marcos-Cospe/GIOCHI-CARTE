# Bisca — guida all'installazione

Servono due cose: un **database Firebase** (gratuito, dove viaggiano le partite) e
**GitHub Pages** (dove sta la pagina). In tutto una quindicina di minuti, una volta sola.

I file di questa cartella:

| File | A cosa serve |
|---|---|
| `index.html` | Il gioco. È l'unico file da modificare. |
| `manifest.json` | Permette di installarlo come app sul telefono |
| `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` | L'icona |
| `LEGGIMI.md` | Questa guida |

---

## Parte 1 — Il database (circa 8 minuti)

### 1. Crea il progetto

Vai su **console.firebase.google.com** e accedi con un account Google.

Premi **Aggiungi progetto**, dai un nome (per esempio `bisca`), premi Continua.
Alla schermata su Google Analytics **disattivalo**: non serve e allunga solo la procedura.
Premi Crea progetto e aspetta una ventina di secondi.

### 2. Crea il database — fallo PRIMA di copiare la configurazione

Questo è il passaggio in cui è più facile sbagliare ordine: se copi la configurazione
prima di creare il database, ti manca il pezzo più importante (`databaseURL`).

Nel menu di sinistra apri **Crea** (o *Build*) e scegli **Realtime Database**.

> Attenzione a non confonderlo con **Firestore Database**, che è un'altra cosa e non
> funziona con questo file. Deve esserci scritto *Realtime Database*.

Premi **Crea database**:
- come posizione scegli **europe-west1** (Belgio), la più vicina;
- quando chiede le regole di sicurezza scegli **Inizia in modalità di test**.

### 3. Rendi le regole permanenti

La modalità di test **scade dopo 30 giorni** e dopo il gioco smette di funzionare.
Sistemiamolo subito.

Nella pagina del Realtime Database apri la scheda **Regole** (*Rules*), cancella tutto
quello che c'è e incolla esattamente questo:

```json
{
  "rules": {
    "bisca": {
      ".read": true,
      ".write": true
    }
  }
}
```

Premi **Pubblica**.

Cosa vuol dire: chiunque conosca l'indirizzo del tuo database può leggere e scrivere
dentro la sezione `bisca`. Per un gioco di carte tra amici va benissimo — non ci sono
dati personali, solo nomi di battesimo e carte. Non usare **questo stesso** progetto
Firebase per cose serie.

### 4. Copia la configurazione

In alto a sinistra premi l'**ingranaggio** → **Impostazioni progetto**.

Scorri fino a **Le tue app** e premi l'icona **`</>`** (web). Dai un nome qualsiasi
(`bisca-web`), **non** spuntare Firebase Hosting, premi Registra app.

Ti compare un riquadro di codice con dentro `const firebaseConfig = { ... }`.
Ti serve tutto quello che sta tra le graffe. Deve contenere una riga `databaseURL`:
se non c'è, vuol dire che hai saltato il punto 2.

### 5. Incolla la configurazione nel gioco

Apri `index.html` con un editor di testo e cerca in cima, dopo poche righe:

```js
const FIREBASE_CONFIG = {
  apiKey: "INCOLLA_QUI",
  ...
};
```

Sostituisci quel blocco con quello copiato da Firebase, **mantenendo il nome
`FIREBASE_CONFIG`**. Deve risultare così (con i tuoi valori):

```js
const FIREBASE_CONFIG = {
  apiKey: "AIzaSy...",
  authDomain: "bisca-xxxxx.firebaseapp.com",
  databaseURL: "https://bisca-xxxxx-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "bisca-xxxxx",
  storageBucket: "bisca-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

Salva.

> Se apri la pagina e vedi *"Manca la configurazione"*, questo passaggio non è
> andato a buon fine. Se vedi *"Non riesco a collegarmi"*, ricontrolla il punto 3
> (le regole) e che `databaseURL` sia presente.

---

## Parte 2 — Pubblicare la pagina (circa 5 minuti)

Come hai già fatto per il quiz:

1. Su GitHub crea un repository nuovo, per esempio `bisca`, **pubblico**.
2. Carica tutti i file di questa cartella (`index.html`, `manifest.json`, le tre
   icone). Trascinandoli nella pagina del repository funziona.
3. Nel repository apri **Settings** → **Pages**.
4. Alla voce *Source* scegli **Deploy from a branch**, ramo **main**, cartella **/ (root)**.
   Salva.
5. Aspetta un paio di minuti: in cima alla pagina comparirà l'indirizzo, del tipo
   `https://marcos-cospe.github.io/bisca/`

Quello è il link definitivo. **Non cambia più**: quando in futuro aggiorni `index.html`,
tutti hanno la versione nuova senza che tu debba rimandare niente.

---

## Parte 3 — Installarlo sul telefono (facoltativo, 1 minuto)

Così si apre a schermo intero, senza le barre del browser — la cosa che dentro
l'artifact era impossibile.

**iPhone:** apri il link con **Safari** (non Chrome, su iPhone solo Safari lo permette),
premi il tasto Condividi in basso, scorri e scegli **Aggiungi a Home**.

**Android:** apri il link con Chrome, menu **⋮** → **Installa app** (oppure *Aggiungi a
schermata Home*).

Da quel momento c'è l'icona come una qualsiasi app.

---

## Come si gioca in gruppo

1. Mandi il link agli amici (WhatsApp va benissimo, non serve nessun account).
2. Uno crea una sala, gli altri la vedono comparire e ci entrano scrivendo il proprio nome.
3. Chi ha creato la sala avvia quando ci sono tutti.
4. Da lì in poi ognuno vede solo le proprie carte, e gli aggiornamenti arrivano
   nell'istante in cui qualcuno gioca.

---

## Se qualcosa non va

**"Manca la configurazione"** → il blocco `FIREBASE_CONFIG` è ancora quello originale.
Rifai il punto 5.

**"Non riesco a collegarmi"** → nove volte su dieci sono le regole (punto 3) oppure
manca `databaseURL` perché il database non era stato creato prima di copiare la
configurazione (punto 2).

**La pagina non si apre su GitHub** → aspetta due o tre minuti dopo aver attivato Pages,
e controlla che il file si chiami esattamente `index.html` (tutto minuscolo) e che il
repository sia pubblico.

**Gli amici non vedono la sala** → controlla che stiano usando lo stesso link e che il
file sia stato pubblicato dopo aver incollato la configurazione. Sul telefono, prova a
ricaricare la pagina tirando giù.

**Voglio ricominciare da zero** → nella console Firebase, Realtime Database, cancella il
nodo `bisca`: sale e partite spariscono, lo storico locale di ciascuno resta sul suo
telefono.
