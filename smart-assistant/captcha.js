/* ============================================
   Smart Assistant - CAPTCHA Bot Detector
   MQTT 연결 + 10초 타이머 + 정답 검증
   ============================================ */

// ───────────── 설정 (RP2040과 동일하게 맞춰야 함) ─────────────
const MQTT_CONFIG = {
    broker: 'wss://broker.hivemq.com:8884/mqtt',
    topic: 'smartassist-captcha-kr7f9a3b/number',  // ★ RP2040 코드와 동일해야 함
    clientId: 'web-captcha-' + Math.random().toString(16).substr(2, 8)
};

const TIMER_DURATION = 10;  // 10초

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

// ───────────── 상태 표시 ─────────────
function setConnectionStatus(type, message) {
    statusInfo.classList.remove('connected', 'error');
    if (type === 'connected') statusInfo.classList.add('connected');
    if (type === 'error')     statusInfo.classList.add('error');
    statusText.textContent = message;
}

// ───────────── 피드백 메시지 ─────────────
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
    currentNumber = null;
    numberValue.textContent = '⏱ 시간 만료';
    numberValue.classList.add('waiting');
    captchaInput.disabled = true;
    captchaSubmit.disabled = true;
    captchaInput.value = '';
    showFeedback('error', '시간이 만료되었습니다. 새 번호를 기다려주세요...');
}

// ───────────── 새 번호 수신 ─────────────
function onNewNumber(num) {
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

// ───────────── 정답 검증 ─────────────
function verify() {
    if (!currentNumber || remainingTime <= 0) {
        showFeedback('error', '유효한 번호가 없습니다. 새 번호를 기다려주세요.');
        return;
    }

    const input = captchaInput.value.trim();
    if (!input) {
        showFeedback('error', '번호를 입력해주세요.');
        return;
    }

    if (parseInt(input, 10) === currentNumber) {
        // 정답!
        clearInterval(timerInterval);
        captchaInput.classList.remove('error');
        captchaInput.classList.add('success');
        showFeedback('success', '✓ 인증 성공! 잠시 후 앱으로 이동합니다...');
        setConnectionStatus('connected', '인증 완료');

        // 세션 인증 저장 (index.html에서 확인)
        sessionStorage.setItem('captcha_verified', 'true');
        sessionStorage.setItem('captcha_verified_at', Date.now().toString());

        // 1초 후 메인 앱으로 이동
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1200);
    } else {
        // 오답
        captchaInput.classList.add('error');
        showFeedback('error', '✗ 번호가 일치하지 않습니다. 다시 시도하세요.');
        setTimeout(() => captchaInput.classList.remove('error'), 500);
        captchaInput.select();
    }
}

// ───────────── 입력 이벤트 ─────────────
captchaInput.addEventListener('input', (e) => {
    // 숫자만 허용
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
        setConnectionStatus('connected', `MQTT 연결됨 - 번호 대기 중`);

        client.subscribe(MQTT_CONFIG.topic, (err) => {
            if (err) {
                console.error('구독 실패:', err);
                setConnectionStatus('error', '토픽 구독 실패');
            } else {
                console.log(`✓ 구독 중: ${MQTT_CONFIG.topic}`);
            }
        });
    });

    client.on('message', (topic, payload) => {
        try {
            const data = JSON.parse(payload.toString());
            console.log('%c← 번호 수신:', 'color: #64b4ff;', data);

            if (data.number && typeof data.number === 'number') {
                onNewNumber(data.number);
                setConnectionStatus('connected', `번호 수신 (RP2040 #${data.timestamp || '?'})`);
            }
        } catch (err) {
            // JSON이 아니면 plain number로 시도
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
console.log(`Topic: ${MQTT_CONFIG.topic}`);

// 이미 인증된 상태면 바로 메인으로
const verified = sessionStorage.getItem('captcha_verified');
const verifiedAt = parseInt(sessionStorage.getItem('captcha_verified_at') || '0', 10);
const SESSION_TTL = 30 * 60 * 1000;  // 30분

if (verified === 'true' && Date.now() - verifiedAt < SESSION_TTL) {
    console.log('✓ 이미 인증됨, 메인으로 이동');
    window.location.href = 'index.html';
} else {
    connectMQTT();
}
