/* ============================================
   Smart Assistant - JavaScript Logic
   ============================================ */

// ───────────── API 키 ─────────────
const API_KEYS = {
    weather: 'bd0cd2472f29c4282ac2c83262169f82',
    exchange: 'ed2b60e4ac0d4c126cfb2436',
    news: 'b03ea5df240143d6b4cf7d9b4233d133'
};

// ───────────── DOM 요소 ─────────────
const commandInput = document.getElementById('commandInput');
const commandSubmit = document.getElementById('commandSubmit');
const results = document.getElementById('results');
const statusBar = document.getElementById('statusBar');
const statusText = document.getElementById('statusText');
const clockTime = document.getElementById('clockTime');
const clockDate = document.getElementById('clockDate');
const hintChips = document.querySelectorAll('.hint-chip');

// ───────────── 실시간 시계 (헤더) ─────────────
function updateClock() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const yyyy = now.getFullYear();
    const mon = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const weekday = ['일', '월', '화', '수', '목', '금', '토'][now.getDay()];

    clockTime.textContent = `${hh}:${mm}:${ss}`;
    clockDate.textContent = `${yyyy}.${mon}.${day} (${weekday})`;
}
updateClock();
setInterval(updateClock, 1000);

// ───────────── 상태 관리 ─────────────
function setStatus(text, type = 'idle') {
    statusText.textContent = text;
    statusBar.classList.remove('loading', 'error');
    if (type === 'loading') statusBar.classList.add('loading');
    if (type === 'error') statusBar.classList.add('error');
}

// ───────────── 결과 영역 관리 ─────────────
function clearResults() {
    results.innerHTML = '';
}

function addCard(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    const card = div.firstElementChild;
    results.prepend(card);
}

function getTimestamp() {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
}

// ───────────── 키워드 분기 로직 ─────────────
function handleCommand(text) {
    const cmd = text.trim();
    if (!cmd) return;

    const lower = cmd.toLowerCase();

    // 날씨
    if (/날씨|기온|weather|온도/.test(cmd)) {
        const city = extractCity(cmd);
        fetchWeather(city);
        return;
    }

    // 환율
    if (/환율|달러|엔화|유로|exchange|usd|krw/i.test(cmd)) {
        fetchExchange();
        return;
    }

    // 뉴스
    if (/뉴스|헤드라인|news/i.test(cmd)) {
        fetchNews();
        return;
    }

    // 시간/날짜
    if (/시간|몇시|날짜|오늘|time|date/i.test(cmd)) {
        showTime();
        return;
    }

    // 유튜브
    if (/유튜브|youtube/i.test(cmd)) {
        const query = cmd.replace(/유튜브|youtube/gi, '').trim();
        showSearchLink('youtube', query || '인기 동영상');
        return;
    }

    // 구글
    if (/구글|검색|google/i.test(cmd)) {
        const query = cmd.replace(/구글|검색|google/gi, '').trim();
        showSearchLink('google', query || cmd);
        return;
    }

    // 기본: 구글 검색으로 fallback
    showSearchLink('google', cmd);
}

// 도시명 추출 (간단 버전)
function extractCity(text) {
    const cities = {
        '서울': 'Seoul', '부산': 'Busan', '인천': 'Incheon',
        '대구': 'Daegu', '대전': 'Daejeon', '광주': 'Gwangju',
        '울산': 'Ulsan', '제주': 'Jeju', '수원': 'Suwon',
        '군산': 'Gunsan', '전주': 'Jeonju',
        '도쿄': 'Tokyo', '뉴욕': 'New York', '런던': 'London',
        '파리': 'Paris', '베이징': 'Beijing'
    };
    for (const [kor, eng] of Object.entries(cities)) {
        if (text.includes(kor)) return eng;
    }
    return 'Seoul'; // 기본값
}

// ───────────── 1. 날씨 API ─────────────
async function fetchWeather(city = 'Seoul') {
    setStatus(`날씨 정보 조회 중... (${city})`, 'loading');

    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEYS.weather}&units=metric&lang=kr`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        renderWeather(data);
        setStatus(`날씨 정보 수신 완료 - ${data.name}`);
    } catch (err) {
        renderError('날씨 API 호출 실패', err.message);
        setStatus('날씨 정보 조회 실패', 'error');
    }
}

function renderWeather(data) {
    const temp = Math.round(data.main.temp);
    const feels = Math.round(data.main.feels_like);
    const humidity = data.main.humidity;
    const wind = data.wind.speed;
    const desc = data.weather[0].description;
    const icon = getWeatherEmoji(data.weather[0].main);

    // 달리기 지수 (기온 15-22도, 습도<70, 바람<5 일 때 높음)
    const runScore = calcRunScore(temp, humidity, wind);
    // 세차 지수 (비/눈 없고 바람 약할 때 높음)
    const washScore = calcWashScore(data.weather[0].main, wind);

    const html = `
        <div class="result-card">
            <div class="card-header">
                <div class="card-title">
                    <span class="card-title-icon">🌤</span>
                    <span>날씨</span>
                </div>
                <span class="card-timestamp">${getTimestamp()}</span>
            </div>
            
            <div class="weather-main">
                <div>
                    <div class="weather-location">${data.name}, ${data.sys.country}</div>
                    <div class="weather-description">${desc}</div>
                    <div class="weather-temp">${temp}°</div>
                </div>
                <div class="weather-icon-big">${icon}</div>
            </div>

            <div class="weather-stats">
                <div class="stat-box">
                    <div class="stat-label">체감온도</div>
                    <div class="stat-value">${feels}<span class="stat-unit">°C</span></div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">습도</div>
                    <div class="stat-value">${humidity}<span class="stat-unit">%</span></div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">바람</div>
                    <div class="stat-value">${wind}<span class="stat-unit">m/s</span></div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">최저 / 최고</div>
                    <div class="stat-value">${Math.round(data.main.temp_min)}° / ${Math.round(data.main.temp_max)}°</div>
                </div>
            </div>

            <div class="weather-gauges">
                ${gaugeHTML('🏃 달리기 지수', runScore)}
                ${gaugeHTML('🚗 세차 지수', washScore)}
            </div>
        </div>
    `;
    addCard(html);
}

function getWeatherEmoji(main) {
    const map = {
        Clear: '☀️', Clouds: '☁️', Rain: '🌧️',
        Drizzle: '🌦️', Thunderstorm: '⛈️', Snow: '❄️',
        Mist: '🌫️', Fog: '🌫️', Haze: '🌫️'
    };
    return map[main] || '🌤️';
}

function calcRunScore(temp, humidity, wind) {
    let score = 100;
    if (temp < 5 || temp > 30) score -= 40;
    else if (temp < 10 || temp > 25) score -= 20;
    if (humidity > 80) score -= 20;
    else if (humidity > 70) score -= 10;
    if (wind > 8) score -= 20;
    else if (wind > 5) score -= 10;
    return Math.max(0, Math.min(100, score));
}

function calcWashScore(condition, wind) {
    if (['Rain', 'Drizzle', 'Thunderstorm', 'Snow'].includes(condition)) return 10;
    let score = 90;
    if (wind > 8) score -= 30;
    else if (wind > 5) score -= 15;
    return score;
}

function gaugeHTML(label, score) {
    let colorClass = 'gauge-bad';
    let comment = '비추천';
    if (score >= 70) { colorClass = 'gauge-good'; comment = '매우 좋음'; }
    else if (score >= 40) { colorClass = 'gauge-mid'; comment = '보통'; }

    return `
        <div class="gauge">
            <div class="gauge-header">
                <span class="gauge-label">${label}</span>
                <span class="gauge-score">${score}점</span>
            </div>
            <div class="gauge-bar">
                <div class="gauge-fill ${colorClass}" style="width: ${score}%;"></div>
            </div>
            <div class="gauge-comment">${comment}</div>
        </div>
    `;
}

// ───────────── 2. 환율 API ─────────────
async function fetchExchange() {
    setStatus('환율 정보 조회 중...', 'loading');

    try {
        const url = `https://v6.exchangerate-api.com/v6/${API_KEYS.exchange}/latest/USD`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        renderExchange(data);
        setStatus(`환율 정보 수신 완료 (기준: USD)`);
    } catch (err) {
        renderError('환율 API 호출 실패', err.message);
        setStatus('환율 정보 조회 실패', 'error');
    }
}

function renderExchange(data) {
    const rates = data.conversion_rates;
    const currencies = [
        { code: 'KRW', name: '대한민국 원', flag: '🇰🇷' },
        { code: 'JPY', name: '일본 엔', flag: '🇯🇵' },
        { code: 'EUR', name: '유로', flag: '🇪🇺' },
        { code: 'GBP', name: '영국 파운드', flag: '🇬🇧' },
        { code: 'CNY', name: '중국 위안', flag: '🇨🇳' },
        { code: 'AUD', name: '호주 달러', flag: '🇦🇺' }
    ];

    const itemsHtml = currencies.map(c => {
        const rate = rates[c.code];
        const formatted = c.code === 'KRW' || c.code === 'JPY'
            ? Math.round(rate).toLocaleString()
            : rate.toFixed(3);
        return `
            <div class="currency-item">
                <div class="currency-header">
                    <span class="currency-flag">${c.flag}</span>
                    <span class="currency-code">${c.code}</span>
                </div>
                <div class="currency-rate">${formatted}</div>
                <div class="currency-name">${c.name}</div>
            </div>
        `;
    }).join('');

    const html = `
        <div class="result-card">
            <div class="card-header">
                <div class="card-title">
                    <span class="card-title-icon">💱</span>
                    <span>실시간 환율 (기준: 1 USD)</span>
                </div>
                <span class="card-timestamp">${getTimestamp()}</span>
            </div>
            <div class="exchange-grid">${itemsHtml}</div>
        </div>
    `;
    addCard(html);
}

// ───────────── 3. 뉴스 API ─────────────
// NewsAPI는 무료 플랜에서 로컬호스트만 허용되므로
// 배포 환경(https)에서는 자동으로 RSS 기반 대체 방식 사용
async function fetchNews() {
    setStatus('뉴스 정보 조회 중...', 'loading');

    const isLocal = location.hostname === 'localhost' 
                 || location.hostname === '127.0.0.1'
                 || location.protocol === 'file:';

    try {
        if (isLocal) {
            // 로컬: NewsAPI 직접 호출
            const url = `https://newsapi.org/v2/top-headlines?country=kr&apiKey=${API_KEYS.news}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            if (!data.articles || data.articles.length === 0) {
                throw new Error('뉴스 결과가 없습니다');
            }
            renderNews(data.articles.slice(0, 8));
            setStatus(`뉴스 ${data.articles.length}건 수신 완료 (NewsAPI)`);
        } else {
            // 배포: RSS → JSON 변환 서비스 사용
            const rssUrl = 'https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko';
            const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
            const res = await fetch(proxyUrl);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            if (!data.items || data.items.length === 0) {
                throw new Error('뉴스 결과가 없습니다');
            }
            // RSS 형식을 NewsAPI 형식으로 변환
            const articles = data.items.slice(0, 8).map(item => ({
                title: item.title,
                url: item.link,
                source: { name: extractSource(item.title) || 'Google News' },
                publishedAt: item.pubDate
            }));
            renderNews(articles);
            setStatus(`뉴스 ${articles.length}건 수신 완료 (Google News)`);
        }
    } catch (err) {
        renderError('뉴스 API 호출 실패', err.message);
        setStatus('뉴스 정보 조회 실패', 'error');
    }
}

// Google News RSS 제목에서 출처 추출 ("제목 - 출처" 형식)
function extractSource(title) {
    const match = title.match(/ - ([^-]+)$/);
    return match ? match[1].trim() : null;
}

function renderNews(articles) {
    const itemsHtml = articles.map(a => {
        const time = a.publishedAt 
            ? new Date(a.publishedAt).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
            : '';
        return `
            <a href="${a.url}" target="_blank" class="news-item">
                <div class="news-source">${a.source.name || 'Unknown'}</div>
                <div class="news-title">${a.title}</div>
                <div class="news-time">${time}</div>
            </a>
        `;
    }).join('');

    const html = `
        <div class="result-card">
            <div class="card-header">
                <div class="card-title">
                    <span class="card-title-icon">📰</span>
                    <span>뉴스 헤드라인 (한국)</span>
                </div>
                <span class="card-timestamp">${getTimestamp()}</span>
            </div>
            <div class="news-list">${itemsHtml}</div>
        </div>
    `;
    addCard(html);
}

// ───────────── 4. 검색 링크 (유튜브/구글) ─────────────
function showSearchLink(type, query) {
    const isYoutube = type === 'youtube';
    const url = isYoutube
        ? `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
        : `https://www.google.com/search?q=${encodeURIComponent(query)}`;

    const icon = isYoutube ? '📺' : '🔍';
    const name = isYoutube ? 'YouTube' : 'Google';

    const html = `
        <div class="result-card">
            <div class="card-header">
                <div class="card-title">
                    <span class="card-title-icon">${icon}</span>
                    <span>${name} 검색</span>
                </div>
                <span class="card-timestamp">${getTimestamp()}</span>
            </div>
            <div class="search-card-content">
                <div class="search-info">
                    <p>검색어: <strong>${query}</strong></p>
                    <p style="font-size: 13px; color: var(--text-muted);">${name}에서 결과를 확인할 수 있습니다.</p>
                </div>
                <a href="${url}" target="_blank" class="search-button">
                    ${name}에서 열기 →
                </a>
            </div>
        </div>
    `;
    addCard(html);
    setStatus(`${name} 검색 링크 생성 완료: "${query}"`);
}

// ───────────── 5. 시간/날짜 표시 ─────────────
function showTime() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const dateStr = now.toLocaleDateString('ko-KR', {
        year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
    });

    const html = `
        <div class="result-card">
            <div class="card-header">
                <div class="card-title">
                    <span class="card-title-icon">🕐</span>
                    <span>현재 시간</span>
                </div>
                <span class="card-timestamp">${getTimestamp()}</span>
            </div>
            <div class="time-display">
                <div class="time-big">${hh}:${mm}:${ss}</div>
                <div class="time-date">${dateStr}</div>
            </div>
        </div>
    `;
    addCard(html);
    setStatus('현재 시간 표시');
}

// ───────────── 에러 카드 ─────────────
function renderError(title, message) {
    const html = `
        <div class="result-card error-card">
            <div class="card-header">
                <div class="card-title">
                    <span class="card-title-icon">⚠️</span>
                    <span>${title}</span>
                </div>
                <span class="card-timestamp">${getTimestamp()}</span>
            </div>
            <p style="color: var(--text-secondary); font-family: var(--font-mono); font-size: 13px;">${message}</p>
        </div>
    `;
    addCard(html);
}

// ───────────── 이벤트 바인딩 ─────────────
function submitCommand() {
    const text = commandInput.value;
    if (!text.trim()) return;
    handleCommand(text);
    commandInput.value = '';
    commandInput.focus();
}

commandSubmit.addEventListener('click', submitCommand);

commandInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submitCommand();
});

hintChips.forEach(chip => {
    chip.addEventListener('click', () => {
        commandInput.value = chip.dataset.command;
        submitCommand();
    });
});

// ───────────── 초기 상태 ─────────────
setStatus('대기 중 - 명령어를 입력하세요');
console.log('%c🚀 Smart Assistant Loaded', 'color: #64b4ff; font-weight: bold; font-size: 14px;');
console.log('%cAPIs: OpenWeatherMap / ExchangeRate-API / NewsAPI', 'color: #8b95a8;');

// ───────────── Service Worker 등록 (PWA) ─────────────
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then((reg) => console.log('%c✓ Service Worker 등록됨', 'color: #4ade80;', reg.scope))
            .catch((err) => console.log('%c✗ Service Worker 등록 실패', 'color: #f87171;', err));
    });
}
