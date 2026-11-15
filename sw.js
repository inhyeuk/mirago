// Mirago 서비스 워커: 설치형 앱(PWA)용. 화면 파일만 보관하고, 영상(YouTube)은 절대 보관하지 않음.
// 화면·작품 목록은 항상 네트워크 먼저(새 회차 즉시 반영), 오프라인일 때만 마지막으로 받은 것을 보여 줌.
const CACHE = 'fs-shell-v3';
const SHELL = ['./', 'index.html', 'catalog.json', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;  // 유튜브·폰트 등 외부는 손대지 않음
  e.respondWith(
    fetch(e.request).then(res => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true })
      .then(hit => hit || (e.request.mode === 'navigate' ? caches.match('index.html') : Response.error())))
  );
});
