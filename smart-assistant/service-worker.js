/* ============================================
   Service Worker - Smart Assistant
   ============================================ */

const CACHE_NAME = 'smart-assistant-v5';
const CACHE_FILES = [
    './',
    './landing.html',
    './index.html',
    './captcha.html',
    './style.css',
    './app.js',
    './captcha.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
];

// 설치 단계: 정적 파일 캐싱
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(CACHE_FILES))
            .then(() => self.skipWaiting())
    );
});

// 활성화 단계: 오래된 캐시 삭제
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
            );
        }).then(() => self.clients.claim())
    );
});

// 요청 처리: 캐시 우선, 없으면 네트워크
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // API 호출은 캐시하지 않고 항상 네트워크로
    if (url.hostname.includes('openweathermap.org') ||
        url.hostname.includes('exchangerate-api.com') ||
        url.hostname.includes('newsapi.org') ||
        url.hostname.includes('gnews.io')) {
        return; // 기본 네트워크 동작
    }

    // 정적 파일은 캐시 우선
    event.respondWith(
        caches.match(event.request).then((cached) => {
            return cached || fetch(event.request).then((res) => {
                // 새 파일도 캐시에 추가
                if (res.ok && event.request.method === 'GET') {
                    const clone = res.clone();
                    caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
                }
                return res;
            }).catch(() => {
                // 오프라인 fallback
                if (event.request.destination === 'document') {
                    return caches.match('./index.html');
                }
            });
        })
    );
});
