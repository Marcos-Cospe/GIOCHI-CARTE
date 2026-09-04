// Service worker di Sala Giochi.
// Scopo: far funzionare "gioca da solo" e "Solitario" anche senza
// connessione, una volta che l'app e' stata aperta almeno una volta. Le sale
// online restano legate a Firebase (hanno bisogno di rete per loro stessa
// natura, un service worker non puo' cambiare questo), ma non ha senso che
// un solitario contro i bot smetta di funzionare solo perche' e' caduta la
// connessione.
//
// Strategia: "stale-while-revalidate" per index.html (mostra subito la
// versione in cache, se disponibile, e in parallelo prova ad aggiornarla per
// la prossima visita) e "cache-first" per tutto il resto (immagini delle
// carte, icone, manifest) che cambia raramente.

const CACHE_NAME = 'sala-giochi-v13';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './intro.mp4',
  './loser.jpg',
  './card-sound.mp3',
  './menu-music.mp3'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Mai intercettare le chiamate a Firebase o ad altri domini esterni: quelle
  // devono sempre passare per la vera rete, la cache non ha senso per dati
  // che cambiano ad ogni istante (sale, mosse, chat).
  if (url.origin !== self.location.origin) return;

  const isHtml = req.mode === 'navigate' || url.pathname.endsWith('/index.html') || url.pathname === '/';

  if (isHtml) {
    // stale-while-revalidate: risposta immediata dalla cache se c'e',
    // aggiornamento in background per la prossima volta.
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match('./index.html');
        const network = fetch(req).then((res) => {
          if (res && res.ok) cache.put('./index.html', res.clone());
          return res;
        }).catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  // Tutto il resto (immagini delle carte, icone, manifest): cache-first,
  // con fallback alla rete se non ancora in cache (e la mette in cache per
  // la prossima volta).
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(req);
      if (cached) return cached;
      try {
        const res = await fetch(req);
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      } catch (e) {
        return cached; // undefined se non mai stato in cache: la richiesta fallisce, come atteso offline
      }
    })
  );
});
