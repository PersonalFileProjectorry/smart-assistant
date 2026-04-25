/* ============================================
   Smart Assistant - CAPTCHA Bot Detector
   MQTT 연결 + 10초 타이머 + 정답 검증
   + 폴백 비밀번호 (RP2040 꺼졌을 때)
   + 디바이스 감지 + 로그인 로그 발행
   ============================================ */

// ───────────── 설정 (RP2040과 동일하게 맞춰야 함) ─────────────
const MQTT_CONFIG = {
    broker: 'wss://broker.hivemq.com:8884/mqtt',
    topicNumber: 'smartassist-captcha-kr7f9a3b/number',
    topicLogin:  'smartassist-captcha-kr7f9a3b/login',
    clientId: 'web-captcha-' + Math.random().toString(16).substr(2, 8)
};

const TIMER_DURATION = 10;
const FALLBACK_TIMEOUT = 8000;
const FALLBACK_PASSWORD = '1111';

// ───────────── DOM 요소 ─────────────
const numberValue  = document.getElementById('numberValue');
const timerText    = document.getElementById('timerText');
const timerFill    = document.getElementById('timerFill');
const captchaInput = document.getElementById('captchaInput');
const captchaSubmit = document.getElementById('captchaSubmit');
const feedback     = document.getElementById('feedback');
const statusInfo   = document.getElementById('statusInfo');
const statusText   = document.getElementById('statusText');

// ───────────── 상태 ─────────────
let currentNumber = null;
let timerInterval = null;
let remainingTime = 0;
let client = null;
let fallbackActive = false;
let fallbackTimer = null;

// ───────────── 디바이스 감지 ─────────────
function detectDevice() {
    const ua = navigator.userAgent;
    if (/Android/i.test(ua)) return 'Android';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
    if (/Windows/i.test(ua)) return 'PC-Windows';
    if (/Mac OS X|Macintosh/i.test(ua)) return 'PC-Mac';
    if (/Linux/i.test(ua)) return 'PC-Linux';
    return 'Unknown';
}

// ───────────── 사용자 ID (브라우저별 고유) ─────────────
function getUserId() {
    let userId = localStorage.getItem('captcha_user_id');
    if (!userId) {
        const num = Math.floor(Math.random() * 9000) + 1000;
        userId = 'user' + num;
        localStorage.setItem('captcha_user_id', userId);
    }
    return userId;
}

const DEVICE = detectDevice();
const USER_ID = getUserId();

// ───────────── 상태 표시 ─────────────
function setConnectionStatus(type, message) {
    statusInfo.classList.remove('connected', 'error');
    if (type === 'connected') statusInfo.classList.add('connected');
    if (type === 'error')     statusInfo.classList.add('error');
    statusText.textContent = message;
}

function showFeedback(type, message) {
    feedback.className = `feedback show ${type}`;
    feedback.textContent = message;
    setTimeout(() => feedback.classList.remove('show'), 3000);
}

// ───────────── 타이머 ─────────────
function startTimer() {
    clearInterval(timerInterval);
    remainingTime = TIMER_DURATION;
    updateTimerUI();

    timerInterval = setInterval(() => {
        remainingTime--;
        updateTimerUI();

        if (remainingTime <= 0) {
            clearInterval(timerInterval);
            onTimerExpired();
        }
    }, 1000);
}

function updTimerFillColor() {
    if (remainingTime <= 3) {
        timerFill.classList.add('warning');
    } else {
        timerFill.classList.remove('warning');
    }
}

function updateTimerUI() {
    timerText.textContent = `${remainingTime}초`;
    const percent = (remainingTime / TIMER_DURATION) * 100;
    timerFill.style.width = `${percent}%`;
    updTimerFillColor();
}

function onTimerExpired() {
    if (fallbackActive) return;
    currentNumber = null;
    numberValue.textContent = '⏱ 시간 만료';
    numberValue.classList.add('waiting');
    captchaInput.disabled = true;
    captchaSubmit.disabled = true;
    captchaInput.value = '';
    showFeedback('error', '시간이 만료되었습니다. 새 번호를 기다려주세요...');
}

// ───────────── 새 번호 수신 (RP2040에서) ─────────────
function onNewNumber(num) {
    if (fallbackActive) {
        fallbackActive = false;
        document.getElementById('fallbackPanel')?.remove();
    }
    if (fallbackTimer) {
        clearTimeout(fallbackTimer);
        fallbackTimer = null;
    }

    currentNumber = num;
    numberValue.textContent = String(num).split('').join(' ');
    numberValue.classList.remove('waiting');
    captchaInput.disabled = false;
    captchaSubmit.disabled = false;
    captchaInput.value = '';
    captchaInput.classList.remove('error', 'success');
    captchaInput.focus();
    startTimer();
}

// ───────────── 폴백 비밀번호 활성화 ─────────────
function activateFallback() {
    if (currentNumber || fallbackActive) return;

    fallbackActive = true;
    console.log('%c⚠ 폴백 모드 활성화 (RP2040 응답 없음)', 'color: #fbbf24;');

    numberValue.textContent = '- - - -';
    numberValue.classList.add('waiting');

    const numDisplay = document.querySelector('.number-display');

    const fallbackPanel = document.createElement('div');
    fallbackPanel.id = 'fallbackPanel';
    fallbackPanel.style.cssText = `
        background: rgba(251, 191, 36, 0.08);
        border: 1px solid rgba(251, 191, 36, 0.3);
        border-radius: var(--radius);
        padding: 20px 16px;
        margin-bottom: 24px;
        text-align: center;
        animation: fadeInUp 0.4s ease;
    `;
    fallbackPanel.innerHTML = `
        <div style="font-family: var(--font-mono); font-size: 11px; color: #fbbf24; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 8px;">
            ⚠ IoT 장치 미응답 - 임시 비밀번호
        </div>
        <div style="font-family: var(--font-display); font-size: 48px; font-weight: 700; letter-spacing: 0.3em; color: #fbbf24; line-height: 1; margin: 8px 0;">
            ${FALLBACK_PASSWORD.split('').join(' ')}
        </div>
        <div style="font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); margin-top: 8px;">
            RP2040이 작동하지 않을 때만 사용
        </div>
    `;
    numDisplay.insertAdjacentElement('afterend', fallbackPanel);

    captchaInput.disabled = false;
    captchaSubmit.disabled = false;
    captchaInput.focus();

    clearInterval(timerInterval);
    timerText.textContent = '∞';
    timerFill.style.width = '100%';
    timerFill.classList.remove('warning');

    setConnectionStatus('error', 'RP2040 응답 없음 - 폴백 모드');
    showFeedback('error', 'IoT 장치가 응답하지 않아 임시 비밀번호로 입장 가능합니다.');
}

// ───────────── 정답 검증 ─────────────
function verify() {
    const input = captchaInput.value.trim();
    if (!input) {
        showFeedback('error', '번호를 입력해주세요.');
        return;
    }

    let isCorrect = false;
    let method = null;

    if (currentNumber && remainingTime > 0) {
        if (parseInt(input, 10) === currentNumber) {
            isCorrect = true;
            method = 'IoT';
        }
    }
    else if (fallbackActive) {
        if (input === FALLBACK_PASSWORD) {
            isCorrect = true;
            method = 'Fallback';
        }
    }
    else {
        showFeedback('error', '유효한 번호가 없습니다. 새 번호를 기다려주세요.');
        return;
    }

    if (isCorrect) {
        clearInterval(timerInterval);
        captchaInput.classList.remove('error');
        captchaInput.classList.add('success');
        showFeedback('success', `✓ 인증 성공! (${method}) 잠시 후 앱으로 이동합니다...`);
        setConnectionStatus('connected', '인증 완료');

        publishLoginLog(method);

        sessionStorage.setItem('captcha_verified', 'true');
        sessionStorage.setItem('captcha_verified_at', Date.now().toString());

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1200);
    } else {
        captchaInput.classList.add('error');
        showFeedback('error', '✗ 번호가 일치하지 않습니다. 다시 시도하세요.');
        setTimeout(() => captchaInput.classList.remove('error'), 500);
        captchaInput.select();
    }
}

// ───────────── 로그인 로그 발행 ─────────────
function publishLoginLog(method) {
    if (!client || !client.connected) {
        console.warn('MQTT 미연결 상태, 로그 발행 못함');
        return;
    }

    const now = new Date();
    const log = {
        user: USER_ID,
        device: DEVICE,
        method: method,
        timestamp: now.toISOString(),
        timestamp_kr: now.toLocaleString('ko-KR', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false
        }),
        userAgent: navigator.userAgent.substring(0, 100)
    };

    client.publish(MQTT_CONFIG.topicLogin, JSON.stringify(log));
    console.log('%c→ 로그 발행:', 'color: #4ade80;', log);
}

// ───────────── 입력 이벤트 ─────────────
captchaInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
});

captchaInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') verify();
});

captchaSubmit.addEventListener('click', verify);

// ───────────── MQTT 연결 ─────────────
function connectMQTT() {
    setConnectionStatus('', 'MQTT 브로커 연결 중...');

    client = mqtt.connect(MQTT_CONFIG.broker, {
        clientId: MQTT_CONFIG.clientId,
        clean: true,
        reconnectPeriod: 3000,
        connectTimeout: 10000
    });

    client.on('connect', () => {
        console.log('%c✓ MQTT 연결됨', 'color: #4ade80;');
        console.log(`  User: ${USER_ID} / Device: ${DEVICE}`);
        setConnectionStatus('connected', `MQTT 연결됨 - 번호 대기 중`);

        client.subscribe(MQTT_CONFIG.topicNumber, (err) => {
            if (err) {
                console.error('구독 실패:', err);
                setConnectionStatus('error', '토픽 구독 실패');
            } else {
                console.log(`✓ 구독 중: ${MQTT_CONFIG.topicNumber}`);
            }
        });

        // 8초 타이머: 번호 안 오면 폴백 활성화
        fallbackTimer = setTimeout(() => {
            if (!currentNumber) {
                activateFallback();
            }
        }, FALLBACK_TIMEOUT);
    });

    client.on('message', (topic, payload) => {
        try {
            const data = JSON.parse(payload.toString());
            console.log('%c← 번호 수신:', 'color: #64b4ff;', data);

            if (data.number && typeof data.number === 'number') {
                onNewNumber(data.number);
                setConnectionStatus('connected', `번호 수신 (RP2040 활성)`);
            }
        } catch (err) {
            const num = parseInt(payload.toString(), 10);
            if (!isNaN(num)) onNewNumber(num);
            else console.error('메시지 파싱 실패:', err);
        }
    });

    client.on('error', (err) => {
        console.error('MQTT 오류:', err);
        setConnectionStatus('error', 'MQTT 연결 오류');
    });

    client.on('offline', () => {
        setConnectionStatus('error', 'MQTT 연결 끊김 - 재연결 시도 중');
    });

    client.on('reconnect', () => {
        setConnectionStatus('', 'MQTT 재연결 시도 중...');
    });
}

// ───────────── 시작 ─────────────
console.log('%c🔐 CAPTCHA Verifier Loaded', 'color: #64b4ff; font-weight: bold; font-size: 14px;');
console.log(`Topic (Number): ${MQTT_CONFIG.topicNumber}`);
console.log(`Topic (Login):  ${MQTT_CONFIG.topicLogin}`);
console.log(`User ID: ${USER_ID} | Device: ${DEVICE}`);

const verified = sessionStorage.getItem('captcha_verified');
const verifiedAt = parseInt(sessionStorage.getItem('captcha_verified_at') || '0', 10);
const SESSION_TTL = 30 * 60 * 1000;

if (verified === 'true' && Date.now() - verifiedAt < SESSION_TTL) {
    console.log('✓ 이미 인증됨, 메인으로 이동');
    window.location.href = 'index.html';
} else {
    connectMQTT();
}
