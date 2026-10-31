/* TiaConta — service worker (PWA).
 * - Arquivos estáticos (_next/static, marca, fontes): cache primeiro.
 * - Páginas: rede primeiro; sem rede, a última versão salva (ou /offline.html).
 * - Nunca guarda POST, server actions nem chamadas ao Supabase.
 * Os registros feitos sem rede ficam na fila do app (IndexedDB), não aqui.
 */
const VERSAO = "v1";
const ESTATICO = `tiaconta-estatico-${VERSAO}`;
const PAGINAS = `tiaconta-paginas-${VERSAO}`;

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(ESTATICO).then((c) => c.addAll(["/offline.html", "/brand/tia-reduzida.svg", "/manifest.webmanifest"])));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n.startsWith("tiaconta-") && !n.endsWith(VERSAO)).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (e) => {
  if (e.data === "limpar") e.waitUntil(caches.delete(PAGINAS));
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/auth/") || url.pathname === "/sair") return;

  const estatico =
    url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/brand/") || url.pathname === "/manifest.webmanifest";
  if (estatico) {
    e.respondWith(
      caches.match(req).then(
        (salvo) =>
          salvo ||
          fetch(req).then((resp) => {
            if (resp.ok) {
              const copia = resp.clone(); // clonar antes de devolver: depois o corpo já foi lido
              e.waitUntil(caches.open(ESTATICO).then((c) => c.put(req, copia)));
            }
            return resp;
          }),
      ),
    );
    return;
  }

  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((resp) => {
          if (resp.ok && resp.type === "basic") {
            const copia = resp.clone();
            e.waitUntil(caches.open(PAGINAS).then((c) => c.put(req, copia)));
          }
          return resp;
        })
        .catch(() =>
          caches.match(req, { ignoreVary: true }).then((salvo) => salvo || caches.match("/offline.html")),
        ),
    );
  }
});
