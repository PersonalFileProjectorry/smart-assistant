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

    // 미세먼지 / 공기질
    if (/미세먼지|초미세|공기질|공기 상태|대기질|pm2\.?5|pm10/i.test(cmd)) {
        const city = extractCity(cmd);
        fetchAirQuality(city);
        return;
    }

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

    // 점심/저녁 메뉴 추천
    if (/점메추|저메추|아메추|점심|저녁|아침 메뉴|뭐 먹지|뭐먹지|배고파|메뉴 추천/i.test(cmd)) {
        let mealType = '오늘';
        if (/점메|점심/.test(cmd)) mealType = '점심';
        else if (/저메|저녁/.test(cmd)) mealType = '저녁';
        else if (/아메|아침/.test(cmd)) mealType = '아침';
        recommendMeal(mealType);
        return;
    }

    // 로또
    if (/로또|lotto|번호 뽑/i.test(cmd)) {
        generateLotto();
        return;
    }

    // 동전 던지기
    if (/동전|coin|앞뒤/i.test(cmd)) {
        flipCoin();
        return;
    }

    // 주사위
    if (/주사위|dice/i.test(cmd)) {
        rollDice();
        return;
    }

    // 오늘의 운세
    if (/운세|오늘의 운세|fortune/i.test(cmd)) {
        showFortune();
        return;
    }

    // 명언
    if (/명언|quote|격언/i.test(cmd)) {
        showQuote();
        return;
    }

    // D-Day 계산
    if (/d-?day|디데이|며칠 남|남은 날|까지 며칠/i.test(cmd)) {
        calculateDday(cmd);
        return;
    }

    // 계산기 (숫자 + 연산자가 포함된 경우)
    if (/^[\d\s+\-*/().,%]+$/.test(cmd) || /계산|더하|빼|곱|나누/.test(cmd)) {
        calculate(cmd);
        return;
    }

    // 번역
    if (/번역|translate/i.test(cmd)) {
        const query = cmd.replace(/번역|translate/gi, '').trim();
        showTranslate(query);
        return;
    }

    // 레시피
    if (/레시피|recipe|만드는 법|만들기/i.test(cmd)) {
        const query = cmd.replace(/레시피|recipe|만드는 법|만들기/gi, '').trim();
        showRecipe(query);
        return;
    }

    // 음악 추천 (유튜브 플레이리스트)
    if (/플레이리스트|playlist|음악 추천|노래 추천|플리/i.test(cmd)) {
        const query = cmd.replace(/플레이리스트|playlist|음악 추천|노래 추천|플리/gi, '').trim();
        showMusicPlaylist(query);
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

// ═══════════════════════════════════════════════
//   확장 기능들 (미세먼지 / 점메추 / 로또 / 운세 등)
// ═══════════════════════════════════════════════

// ───────────── 미세먼지 API (OpenWeatherMap Air Pollution) ─────────────
async function fetchAirQuality(city = 'Seoul') {
    setStatus(`미세먼지 정보 조회 중... (${city})`, 'loading');
    try {
        // 1) 도시 → 좌표 변환
        const geoUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEYS.weather}&units=metric&lang=kr`;
        const geoRes = await fetch(geoUrl);
        if (!geoRes.ok) throw new Error(`HTTP ${geoRes.status}`);
        const geoData = await geoRes.json();
        const { lat, lon } = geoData.coord;

        // 2) 좌표 → 대기오염 데이터
        const airUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEYS.weather}`;
        const airRes = await fetch(airUrl);
        if (!airRes.ok) throw new Error(`HTTP ${airRes.status}`);
        const airData = await airRes.json();

        renderAirQuality(geoData.name, airData.list[0]);
        setStatus(`미세먼지 정보 수신 완료 - ${geoData.name}`);
    } catch (err) {
        renderError('미세먼지 API 호출 실패', err.message);
        setStatus('미세먼지 조회 실패', 'error');
    }
}

function renderAirQuality(cityName, data) {
    const aqi = data.main.aqi; // 1~5
    const pm25 = Math.round(data.components.pm2_5);
    const pm10 = Math.round(data.components.pm10);

    // 한국 환경부 기준
    const pm25Grade = getPmGrade(pm25, [15, 35, 75]);
    const pm10Grade = getPmGrade(pm10, [30, 80, 150]);

    const html = `
        <div class="result-card">
            <div class="card-header">
                <div class="card-title">
                    <span class="card-title-icon">🌫️</span>
                    <span>미세먼지 · ${cityName}</span>
                </div>
                <span class="card-timestamp">${getTimestamp()}</span>
            </div>
            <div class="weather-stats">
                <div class="stat-box">
                    <div class="stat-label">초미세먼지 PM2.5</div>
                    <div class="stat-value">${pm25}<span class="stat-unit">㎍/㎥</span></div>
                    <div style="margin-top:6px;font-size:12px;color:${pm25Grade.color};font-weight:600;">${pm25Grade.label}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">미세먼지 PM10</div>
                    <div class="stat-value">${pm10}<span class="stat-unit">㎍/㎥</span></div>
                    <div style="margin-top:6px;font-size:12px;color:${pm10Grade.color};font-weight:600;">${pm10Grade.label}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">종합 대기질 지수</div>
                    <div class="stat-value">${aqi}<span class="stat-unit">/5</span></div>
                    <div style="margin-top:6px;font-size:12px;color:${getAqiColor(aqi)};font-weight:600;">${getAqiLabel(aqi)}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">오존 O₃</div>
                    <div class="stat-value">${Math.round(data.components.o3)}<span class="stat-unit">㎍/㎥</span></div>
                </div>
            </div>
            <div style="margin-top:16px;padding:14px;background:rgba(100,180,255,0.04);border-radius:8px;font-size:13px;color:var(--text-secondary);">
                ${getAirAdvice(pm25Grade.level)}
            </div>
        </div>
    `;
    addCard(html);
}

function getPmGrade(value, thresholds) {
    if (value <= thresholds[0]) return { label: '좋음 ✨', color: '#4ade80', level: 0 };
    if (value <= thresholds[1]) return { label: '보통 😊', color: '#64b4ff', level: 1 };
    if (value <= thresholds[2]) return { label: '나쁨 😷', color: '#fbbf24', level: 2 };
    return { label: '매우 나쁨 ⚠️', color: '#f87171', level: 3 };
}

function getAqiLabel(aqi) {
    return ['좋음 ✨', '보통 😊', '보통 🙂', '나쁨 😷', '매우 나쁨 ⚠️'][aqi - 1] || '-';
}
function getAqiColor(aqi) {
    return ['#4ade80', '#64b4ff', '#fbbf24', '#f97316', '#f87171'][aqi - 1] || '#8b95a8';
}
function getAirAdvice(level) {
    const tips = [
        '💡 야외 활동하기 좋은 날이에요! 창문 활짝 열어두셔도 됩니다.',
        '💡 대체로 괜찮습니다. 민감하신 분들만 살짝 조심하세요.',
        '😷 외출 시 마스크 착용을 권장합니다. 장시간 야외 활동은 피하세요.',
        '⚠️ 외출 자제! 꼭 나가야 한다면 KF94 이상 마스크 필수입니다.'
    ];
    return tips[level] || tips[1];
}

// ───────────── 점심/저녁 메뉴 추천 ─────────────
const MEAL_DATA = {
    한식: ['김치찌개 🍲', '된장찌개 🥘', '부대찌개 🍲', '비빔밥 🍱', '제육볶음 🥓', '불고기 🥩', '삼겹살 🥓', '갈비탕 🍖', '순두부찌개 🍲', '김밥 🍙', '떡볶이 🌶️', '라면 🍜', '냉면 🍜', '국밥 🍚', '돈까스 🍱', '보쌈 🥬'],
    중식: ['짜장면 🍜', '짬뽕 🌶️', '탕수육 🍤', '마라탕 🌶️', '마파두부 🥘', '군만두 🥟', '양꼬치 🍢', '크림새우 🍤', '유린기 🐔'],
    일식: ['초밥 🍣', '라멘 🍜', '우동 🍜', '돈부리 🍱', '규동 🥩', '오므라이스 🍳', '카레 🍛', '타코야끼 🐙', '돈까스 🍱'],
    양식: ['파스타 🍝', '피자 🍕', '스테이크 🥩', '햄버거 🍔', '리조또 🍚', '샐러드 🥗', '샌드위치 🥪', '수프 🍲', '브런치 🍳'],
    분식: ['떡볶이 🌶️', '순대 🌭', '튀김 🍤', '김밥 🍙', '쫄면 🍜', '라볶이 🍜', '어묵 🍡', '호떡 🥞'],
    기타: ['치킨 🍗', '족발 🦶', '보쌈 🥬', '회 🐟', '곱창 🌭', '닭발 🔥', '닭갈비 🐔', '부리또 🌯', '케밥 🥙']
};

function recommendMeal(mealType = '오늘') {
    const categories = Object.keys(MEAL_DATA);
    const category = categories[Math.floor(Math.random() * categories.length)];
    const menus = MEAL_DATA[category];
    const menu = menus[Math.floor(Math.random() * menus.length)];

    const reasons = [
        '오늘따라 이게 당기지 않으세요?',
        '고민될 땐 이게 정답입니다!',
        '날씨에 딱 어울리는 메뉴예요.',
        '뭐 먹을지 모를 땐 이거죠.',
        '이거 하나면 기분 좋아질 거예요.',
        '지금 이 순간 당신을 위한 메뉴!',
        '망설이지 말고 이걸로!'
    ];
    const reason = reasons[Math.floor(Math.random() * reasons.length)];

    const html = `
        <div class="result-card">
            <div class="card-header">
                <div class="card-title">
                    <span class="card-title-icon">🍚</span>
                    <span>${mealType} 메뉴 추천</span>
                </div>
                <span class="card-timestamp">${getTimestamp()}</span>
            </div>
            <div style="text-align:center;padding:20px 0;">
                <div style="font-family:var(--font-mono);font-size:12px;color:var(--text-muted);letter-spacing:0.1em;margin-bottom:8px;">${category}</div>
                <div style="font-family:var(--font-display);font-size:42px;font-weight:600;background:linear-gradient(135deg,var(--text-primary),var(--accent));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:12px;">${menu}</div>
                <div style="color:var(--text-secondary);font-size:14px;">${reason}</div>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:16px;">
                <button class="hint-chip" onclick="recommendMeal('${mealType}')">🎲 다시 뽑기</button>
                <a href="https://www.google.com/search?q=${encodeURIComponent(menu.replace(/[^\w가-힣]/g, '').trim() + ' 근처 맛집')}" target="_blank" class="hint-chip">📍 근처 맛집 찾기</a>
            </div>
        </div>
    `;
    addCard(html);
    setStatus(`${mealType} 메뉴 추천: ${menu}`);
}

// ───────────── 로또 번호 생성 ─────────────
function generateLotto() {
    const numbers = new Set();
    while (numbers.size < 6) {
        numbers.add(Math.floor(Math.random() * 45) + 1);
    }
    const sorted = [...numbers].sort((a, b) => a - b);
    const bonus = Math.floor(Math.random() * 45) + 1;

    const ballHtml = (n, isBonus = false) => {
        let color = '#fbbf24'; // 1-10 노랑
        if (n > 10 && n <= 20) color = '#64b4ff'; // 파랑
        else if (n > 20 && n <= 30) color = '#f87171'; // 빨강
        else if (n > 30 && n <= 40) color = '#8b95a8'; // 회색
        else if (n > 40) color = '#4ade80'; // 초록
        return `<div style="width:52px;height:52px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-weight:700;font-size:20px;color:#0a0e1a;box-shadow:0 4px 12px rgba(0,0,0,0.3);${isBonus ? 'border:3px dashed #0a0e1a;' : ''}">${n}</div>`;
    };

    const html = `
        <div class="result-card">
            <div class="card-header">
                <div class="card-title">
                    <span class="card-title-icon">🎰</span>
                    <span>로또 번호 추천</span>
                </div>
                <span class="card-timestamp">${getTimestamp()}</span>
            </div>
            <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;padding:16px 0;">
                ${sorted.map(n => ballHtml(n)).join('')}
                <div style="display:flex;align-items:center;color:var(--text-muted);font-size:24px;margin:0 4px;">+</div>
                ${ballHtml(bonus, true)}
            </div>
            <div style="text-align:center;color:var(--text-muted);font-size:12px;font-family:var(--font-mono);margin-top:8px;">
                보너스 번호는 점선 표시 · 순수 랜덤이며 당첨을 보장하지 않음
            </div>
            <div style="display:flex;justify-content:center;margin-top:16px;">
                <button class="hint-chip" onclick="generateLotto()">🎲 다시 뽑기</button>
            </div>
        </div>
    `;
    addCard(html);
    setStatus('로또 번호 생성 완료');
}

// ───────────── 동전 던지기 ─────────────
function flipCoin() {
    const result = Math.random() < 0.5 ? '앞' : '뒤';
    const emoji = result === '앞' ? '🪙' : '💰';

    const html = `
        <div class="result-card">
            <div class="card-header">
                <div class="card-title">
                    <span class="card-title-icon">🪙</span>
                    <span>동전 던지기</span>
                </div>
                <span class="card-timestamp">${getTimestamp()}</span>
            </div>
            <div style="text-align:center;padding:30px 0;">
                <div style="font-size:100px;animation:cardIn 0.5s ease;">${emoji}</div>
                <div style="font-family:var(--font-display);font-size:48px;font-weight:700;background:linear-gradient(135deg,var(--accent),var(--accent-2));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-top:16px;">${result}면!</div>
            </div>
            <div style="display:flex;justify-content:center;margin-top:8px;">
                <button class="hint-chip" onclick="flipCoin()">🔄 다시 던지기</button>
            </div>
        </div>
    `;
    addCard(html);
    setStatus(`동전 결과: ${result}면`);
}

// ───────────── 주사위 ─────────────
function rollDice() {
    const n = Math.floor(Math.random() * 6) + 1;
    const faces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

    const html = `
        <div class="result-card">
            <div class="card-header">
                <div class="card-title">
                    <span class="card-title-icon">🎲</span>
                    <span>주사위 굴리기</span>
                </div>
                <span class="card-timestamp">${getTimestamp()}</span>
            </div>
            <div style="text-align:center;padding:24px 0;">
                <div style="font-size:140px;line-height:1;color:var(--accent);text-shadow:0 0 40px var(--accent-glow);animation:cardIn 0.5s ease;">${faces[n-1]}</div>
                <div style="font-family:var(--font-display);font-size:36px;font-weight:700;color:var(--text-primary);margin-top:8px;">${n}</div>
            </div>
            <div style="display:flex;justify-content:center;">
                <button class="hint-chip" onclick="rollDice()">🎲 다시 굴리기</button>
            </div>
        </div>
    `;
    addCard(html);
    setStatus(`주사위 결과: ${n}`);
}

// ───────────── 오늘의 운세 ─────────────
const FORTUNES = [
    { level: '대박', score: 95, emoji: '🌟', color: '#fbbf24', msg: '오늘 당신에게 놀라운 행운이 찾아올 거예요! 복권을 사보는 것도 나쁘지 않겠네요.' },
    { level: '최고', score: 90, emoji: '✨', color: '#fbbf24', msg: '모든 일이 술술 풀리는 하루! 망설이던 일이 있다면 오늘 도전하세요.' },
    { level: '좋음', score: 80, emoji: '😊', color: '#4ade80', msg: '기분 좋은 소식이 들려올 것 같아요. 주변 사람들에게 친절하게 대해주세요.' },
    { level: '무난', score: 65, emoji: '🙂', color: '#64b4ff', msg: '큰 굴곡 없이 평온한 하루. 작은 행복들에 감사하며 보내세요.' },
    { level: '보통', score: 50, emoji: '😐', color: '#8b95a8', msg: '평범한 하루가 되겠어요. 중요한 결정은 내일로 미루는 게 좋겠습니다.' },
    { level: '주의', score: 35, emoji: '🤔', color: '#f97316', msg: '작은 실수에 주의하세요. 중요한 약속이나 서류 확인은 한 번 더!' },
    { level: '휴식', score: 25, emoji: '😴', color: '#a78bfa', msg: '오늘은 새로운 도전보다는 휴식에 집중하세요. 몸과 마음을 재충전할 때입니다.' }
];

function showFortune() {
    const f = FORTUNES[Math.floor(Math.random() * FORTUNES.length)];
    const luckyColor = ['빨강 ❤️', '파랑 💙', '노랑 💛', '초록 💚', '보라 💜', '하얀색 🤍', '검정 🖤'][Math.floor(Math.random() * 7)];
    const luckyNumber = Math.floor(Math.random() * 45) + 1;

    const html = `
        <div class="result-card">
            <div class="card-header">
                <div class="card-title">
                    <span class="card-title-icon">🔮</span>
                    <span>오늘의 운세</span>
                </div>
                <span class="card-timestamp">${getTimestamp()}</span>
            </div>
            <div style="text-align:center;padding:16px 0;">
                <div style="font-size:72px;">${f.emoji}</div>
                <div style="font-family:var(--font-display);font-size:32px;font-weight:700;color:${f.color};margin:8px 0;">${f.level}</div>
                <div style="font-family:var(--font-mono);font-size:14px;color:var(--text-muted);">운세 지수 ${f.score}/100</div>
            </div>
            <div style="padding:16px;background:rgba(100,180,255,0.04);border-radius:8px;color:var(--text-secondary);line-height:1.7;">
                ${f.msg}
            </div>
            <div class="weather-stats" style="margin-top:16px;">
                <div class="stat-box">
                    <div class="stat-label">행운의 색</div>
                    <div class="stat-value" style="font-size:16px;">${luckyColor}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">행운의 숫자</div>
                    <div class="stat-value">${luckyNumber}</div>
                </div>
            </div>
        </div>
    `;
    addCard(html);
    setStatus(`오늘의 운세: ${f.level}`);
}

// ───────────── 명언 ─────────────
const QUOTES = [
    { text: '시작이 반이다.', author: '아리스토텔레스' },
    { text: '오늘 할 일을 내일로 미루지 마라.', author: '벤자민 프랭클린' },
    { text: '천 리 길도 한 걸음부터.', author: '노자' },
    { text: '실패는 성공의 어머니다.', author: '토마스 에디슨' },
    { text: '노력하는 자는 즐기는 자를 이길 수 없다.', author: '공자' },
    { text: '꿈을 꿀 수 있다면, 이룰 수도 있다.', author: '월트 디즈니' },
    { text: '길을 아는 것과 그 길을 걷는 것은 다르다.', author: '모피어스' },
    { text: '어제의 당신보다 나아져라.', author: '조던 피터슨' },
    { text: '성공은 최종적인 것이 아니며 실패도 치명적인 것이 아니다.', author: '윈스턴 처칠' },
    { text: '할 수 있다고 믿는 사람은 이미 반은 이룬 것이다.', author: '테오도어 루즈벨트' },
    { text: '위대한 일은 작은 일들의 연속으로 이루어진다.', author: '빈센트 반 고흐' },
    { text: '행복은 습관이다. 그것을 몸에 지녀라.', author: '허버트' },
    { text: '가장 큰 위험은 위험을 감수하지 않는 것이다.', author: '마크 주커버그' },
    { text: '당신이 할 수 있다고 믿든, 할 수 없다고 믿든, 당신의 믿음은 옳다.', author: '헨리 포드' }
];

function showQuote() {
    const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    const html = `
        <div class="result-card">
            <div class="card-header">
                <div class="card-title">
                    <span class="card-title-icon">💭</span>
                    <span>오늘의 명언</span>
                </div>
                <span class="card-timestamp">${getTimestamp()}</span>
            </div>
            <div style="padding:24px 16px;text-align:center;">
                <div style="font-size:60px;color:var(--accent);opacity:0.4;line-height:1;">"</div>
                <div style="font-family:var(--font-display);font-size:22px;font-weight:500;line-height:1.6;color:var(--text-primary);margin:8px 0 20px;">
                    ${q.text}
                </div>
                <div style="font-family:var(--font-mono);font-size:13px;color:var(--accent);">— ${q.author}</div>
            </div>
            <div style="display:flex;justify-content:center;">
                <button class="hint-chip" onclick="showQuote()">🔄 다른 명언</button>
            </div>
        </div>
    `;
    addCard(html);
    setStatus('명언 표시 완료');
}

// ───────────── D-Day 계산 ─────────────
function calculateDday(cmd) {
    // 날짜 파싱 시도 (YYYY-MM-DD 또는 YYYY.MM.DD 또는 MM월 DD일)
    let targetDate = null;
    const isoMatch = cmd.match(/(\d{4})[-.\/](\d{1,2})[-.\/](\d{1,2})/);
    const korMatch = cmd.match(/(\d{1,2})월\s*(\d{1,2})일/);
    const numDaysMatch = cmd.match(/(\d+)\s*일/);

    if (isoMatch) {
        targetDate = new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]));
    } else if (korMatch) {
        const year = new Date().getFullYear();
        targetDate = new Date(year, parseInt(korMatch[1]) - 1, parseInt(korMatch[2]));
        // 이미 지난 날짜면 내년으로
        if (targetDate < new Date()) targetDate.setFullYear(year + 1);
    } else if (numDaysMatch && /100일|200일|기념일/.test(cmd)) {
        const days = parseInt(numDaysMatch[1]);
        targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + days);
    }

    if (!targetDate || isNaN(targetDate.getTime())) {
        renderError('D-Day 계산 실패', '날짜 형식을 인식하지 못했습니다. 예: "디데이 2026-12-25", "12월 25일까지 며칠"');
        setStatus('D-Day 파싱 실패', 'error');
        return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);
    const diffDays = Math.round((targetDate - today) / (1000 * 60 * 60 * 24));

    const dateStr = targetDate.toLocaleDateString('ko-KR', {
        year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
    });

    let label, color;
    if (diffDays === 0) { label = 'D-DAY'; color = '#fbbf24'; }
    else if (diffDays > 0) { label = `D-${diffDays}`; color = '#64b4ff'; }
    else { label = `D+${Math.abs(diffDays)}`; color = '#a78bfa'; }

    const html = `
        <div class="result-card">
            <div class="card-header">
                <div class="card-title">
                    <span class="card-title-icon">📅</span>
                    <span>D-Day 계산</span>
                </div>
                <span class="card-timestamp">${getTimestamp()}</span>
            </div>
            <div style="text-align:center;padding:20px 0;">
                <div style="font-family:var(--font-display);font-size:64px;font-weight:700;color:${color};letter-spacing:0.02em;">${label}</div>
                <div style="color:var(--text-secondary);margin-top:8px;font-size:16px;">${dateStr}</div>
                <div style="font-family:var(--font-mono);font-size:12px;color:var(--text-muted);margin-top:12px;">
                    ${diffDays > 0 ? `${diffDays}일 남음` : diffDays === 0 ? '오늘입니다!' : `${Math.abs(diffDays)}일 지남`}
                </div>
            </div>
        </div>
    `;
    addCard(html);
    setStatus(`D-Day: ${label}`);
}

// ───────────── 계산기 ─────────────
function calculate(cmd) {
    // 자연어 처리
    let expr = cmd
        .replace(/계산|해줘|알려줘|이야|인가/g, '')
        .replace(/더하기|플러스|\+/g, '+')
        .replace(/빼기|마이너스|-/g, '-')
        .replace(/곱하기|곱/g, '*')
        .replace(/나누기|나누/g, '/')
        .replace(/만/g, '0000')
        .replace(/천/g, '000')
        .replace(/백/g, '00')
        .replace(/퍼센트|%/g, '/100')
        .replace(/\s/g, '');

    try {
        // 안전한 수식만 허용
        if (!/^[\d+\-*/().]+$/.test(expr)) {
            throw new Error('수식에 허용되지 않은 문자가 포함됨');
        }
        const result = Function(`"use strict"; return (${expr})`)();
        if (!isFinite(result)) throw new Error('계산 불가');

        const formatted = Number.isInteger(result) ? result.toLocaleString() : result.toFixed(4).replace(/\.?0+$/, '');

        const html = `
            <div class="result-card">
                <div class="card-header">
                    <div class="card-title">
                        <span class="card-title-icon">🧮</span>
                        <span>계산</span>
                    </div>
                    <span class="card-timestamp">${getTimestamp()}</span>
                </div>
                <div style="text-align:center;padding:20px 0;">
                    <div style="font-family:var(--font-mono);font-size:18px;color:var(--text-muted);margin-bottom:8px;">${expr}</div>
                    <div style="font-family:var(--font-mono);font-size:12px;color:var(--text-muted);margin-bottom:12px;">=</div>
                    <div style="font-family:var(--font-display);font-size:48px;font-weight:600;background:linear-gradient(135deg,var(--text-primary),var(--accent));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">${formatted}</div>
                </div>
            </div>
        `;
        addCard(html);
        setStatus(`계산 결과: ${formatted}`);
    } catch (err) {
        renderError('계산 실패', '수식을 인식하지 못했습니다. 예: "100+200", "5*7", "5만원의 20%"');
        setStatus('계산 실패', 'error');
    }
}

// ───────────── 번역 링크 ─────────────
function showTranslate(query) {
    if (!query) query = '안녕하세요';
    const papago = `https://papago.naver.com/?sk=ko&tk=en&st=${encodeURIComponent(query)}`;
    const google = `https://translate.google.com/?sl=ko&tl=en&text=${encodeURIComponent(query)}`;

    const html = `
        <div class="result-card">
            <div class="card-header">
                <div class="card-title">
                    <span class="card-title-icon">🌐</span>
                    <span>번역</span>
                </div>
                <span class="card-timestamp">${getTimestamp()}</span>
            </div>
            <div style="margin-bottom:16px;">
                <div style="font-family:var(--font-mono);font-size:12px;color:var(--text-muted);margin-bottom:6px;">번역할 텍스트</div>
                <div style="font-size:18px;color:var(--text-primary);">${query}</div>
            </div>
            <div style="display:flex;gap:10px;flex-wrap:wrap;">
                <a href="${papago}" target="_blank" class="search-button" style="flex:1;justify-content:center;">Papago에서 번역 →</a>
                <a href="${google}" target="_blank" class="search-button" style="flex:1;justify-content:center;background:linear-gradient(135deg,#8b95a8,#64b4ff);">Google 번역 →</a>
            </div>
        </div>
    `;
    addCard(html);
    setStatus(`번역 링크 생성: "${query}"`);
}

// ───────────── 레시피 링크 ─────────────
function showRecipe(query) {
    if (!query) query = '간단한 요리';
    const mankaeUrl = `https://www.10000recipe.com/recipe/list.html?q=${encodeURIComponent(query)}`;
    const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query + ' 레시피')}`;

    const html = `
        <div class="result-card">
            <div class="card-header">
                <div class="card-title">
                    <span class="card-title-icon">🍳</span>
                    <span>레시피 검색</span>
                </div>
                <span class="card-timestamp">${getTimestamp()}</span>
            </div>
            <div style="margin-bottom:16px;">
                <div style="font-family:var(--font-mono);font-size:12px;color:var(--text-muted);margin-bottom:6px;">요리</div>
                <div style="font-size:18px;color:var(--text-primary);">${query}</div>
            </div>
            <div style="display:flex;gap:10px;flex-wrap:wrap;">
                <a href="${mankaeUrl}" target="_blank" class="search-button" style="flex:1;justify-content:center;">📖 만개의레시피</a>
                <a href="${youtubeUrl}" target="_blank" class="search-button" style="flex:1;justify-content:center;background:linear-gradient(135deg,#ef4444,#f87171);">📺 YouTube 영상</a>
            </div>
        </div>
    `;
    addCard(html);
    setStatus(`레시피 검색: "${query}"`);
}

// ───────────── 음악 플레이리스트 ─────────────
const MOOD_PLAYLISTS = {
    '공부': '공부할 때 듣는 잔잔한 플레이리스트',
    '집중': '집중력 높이는 lofi 음악',
    '운동': '운동할 때 듣는 EDM 플레이리스트',
    '잠잘때': '잘 때 듣기 좋은 수면 음악',
    '드라이브': '드라이브할 때 듣는 감성 플레이리스트',
    '비올때': '비 올 때 듣기 좋은 재즈',
    '카페': '카페에서 듣는 보사노바',
    '신나는': '텐션 높은 신나는 노래 모음',
    '우울': '우울할 때 듣는 위로의 노래',
    '잔잔한': '잔잔한 어쿠스틱 플레이리스트'
};

function showMusicPlaylist(query) {
    let searchQuery = query;
    if (!query) {
        // 랜덤 무드
        const moods = Object.keys(MOOD_PLAYLISTS);
        const randomMood = moods[Math.floor(Math.random() * moods.length)];
        searchQuery = MOOD_PLAYLISTS[randomMood];
    } else {
        // 키워드에서 매칭
        const matched = Object.keys(MOOD_PLAYLISTS).find(k => query.includes(k));
        searchQuery = matched ? MOOD_PLAYLISTS[matched] : `${query} 플레이리스트`;
    }

    const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;

    const html = `
        <div class="result-card">
            <div class="card-header">
                <div class="card-title">
                    <span class="card-title-icon">🎵</span>
                    <span>플레이리스트 추천</span>
                </div>
                <span class="card-timestamp">${getTimestamp()}</span>
            </div>
            <div style="padding:16px 0;">
                <div style="font-family:var(--font-mono);font-size:12px;color:var(--text-muted);margin-bottom:6px;">추천 키워드</div>
                <div style="font-size:20px;color:var(--text-primary);margin-bottom:20px;">🎧 ${searchQuery}</div>
                <a href="${youtubeUrl}" target="_blank" class="search-button" style="width:100%;justify-content:center;background:linear-gradient(135deg,#ef4444,#f87171);">YouTube에서 재생 →</a>
            </div>
        </div>
    `;
    addCard(html);
    setStatus(`음악 추천: ${searchQuery}`);
}

// ═══════════════════════════════════════════════
//   초기 상태 & Service Worker
// ═══════════════════════════════════════════════

// ───────────── 로그아웃 (CAPTCHA로 복귀) ─────────────
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        if (confirm('정말 로그아웃 하시겠습니까?\n(다시 CAPTCHA 인증이 필요합니다)')) {
            sessionStorage.removeItem('captcha_verified');
            sessionStorage.removeItem('captcha_verified_at');
            window.location.href = 'captcha.html';
        }
    });
}

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
