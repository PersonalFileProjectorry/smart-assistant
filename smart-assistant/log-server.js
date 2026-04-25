/**
 * Smart Assistant - Login Log Server
 * 
 * MQTT 토픽을 구독해서 로그인 이벤트를 받으면:
 *   1. VS Code 터미널에 예쁘게 출력
 *   2. SQLite DB(login_logs.db)에 자동 저장
 * 
 * 실행 방법:
 *   npm install
 *   node log-server.js
 */

const mqtt = require('mqtt');
const Database = require('better-sqlite3');
const path = require('path');

// ═══════════════════════════════════════════════
//   설정 (captcha.js와 동일해야 함)
// ═══════════════════════════════════════════════
const MQTT_BROKER = 'mqtt://broker.hivemq.com:1883';
const TOPIC_LOGIN = 'smartassist-captcha-kr7f9a3b/login';
const TOPIC_NUMBER = 'smartassist-captcha-kr7f9a3b/number';
const DB_PATH = path.join(__dirname, 'login_logs.db');

// ═══════════════════════════════════════════════
//   ANSI 색상 코드
// ═══════════════════════════════════════════════
const C = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    bgBlue: '\x1b[44m',
    bgGreen: '\x1b[42m',
    bgYellow: '\x1b[43m',
};

// ═══════════════════════════════════════════════
//   SQLite DB 초기화
// ═══════════════════════════════════════════════
console.log(`${C.cyan}┌─────────────────────────────────────────────${C.reset}`);
console.log(`${C.cyan}│${C.reset}  ${C.bright}🚀 Smart Assistant Log Server${C.reset}`);
console.log(`${C.cyan}└─────────────────────────────────────────────${C.reset}`);
console.log();

const db = new Database(DB_PATH);
db.exec(`
    CREATE TABLE IF NOT EXISTS login_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        device TEXT NOT NULL,
        method TEXT NOT NULL,
        timestamp_iso TEXT NOT NULL,
        timestamp_kr TEXT NOT NULL,
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_user ON login_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_device ON login_logs(device);
    CREATE INDEX IF NOT EXISTS idx_created ON login_logs(created_at);
`);

const insertStmt = db.prepare(`
    INSERT INTO login_logs (user_id, device, method, timestamp_iso, timestamp_kr, user_agent)
    VALUES (?, ?, ?, ?, ?, ?)
`);

const countStmt = db.prepare(`SELECT COUNT(*) as count FROM login_logs`);
const recentStmt = db.prepare(`SELECT * FROM login_logs ORDER BY id DESC LIMIT 5`);

console.log(`${C.green}✓${C.reset} SQLite DB 준비 완료: ${C.dim}${DB_PATH}${C.reset}`);
console.log(`${C.dim}  (현재 저장된 로그: ${countStmt.get().count}건)${C.reset}`);
console.log();

// ═══════════════════════════════════════════════
//   디바이스 아이콘 + 색상
// ═══════════════════════════════════════════════
function getDeviceStyle(device) {
    const styles = {
        'Android':     { icon: '📱', color: C.green },
        'iOS':         { icon: '📱', color: C.cyan },
        'PC-Windows':  { icon: '💻', color: C.blue },
        'PC-Mac':      { icon: '💻', color: C.magenta },
        'PC-Linux':    { icon: '💻', color: C.yellow },
        'Unknown':     { icon: '❓', color: C.dim }
    };
    return styles[device] || styles['Unknown'];
}

function getMethodStyle(method) {
    return method === 'IoT'
        ? { icon: '🔐', color: C.green, label: 'IoT 인증' }
        : { icon: '🔑', color: C.yellow, label: '폴백 비번' };
}

// ═══════════════════════════════════════════════
//   MQTT 연결 & 구독
// ═══════════════════════════════════════════════
console.log(`${C.dim}MQTT 브로커 연결 중...${C.reset}`);

const client = mqtt.connect(MQTT_BROKER, {
    clientId: 'log-server-' + Math.random().toString(16).substr(2, 8),
    clean: true,
    reconnectPeriod: 3000
});

client.on('connect', () => {
    console.log(`${C.green}✓${C.reset} MQTT 연결됨: ${C.dim}${MQTT_BROKER}${C.reset}`);

    client.subscribe([TOPIC_LOGIN, TOPIC_NUMBER], (err) => {
        if (err) {
            console.error(`${C.red}✗ 구독 실패:${C.reset}`, err);
            return;
        }
        console.log(`${C.green}✓${C.reset} 구독 중: ${C.dim}${TOPIC_LOGIN}${C.reset}`);
        console.log(`${C.green}✓${C.reset} 구독 중: ${C.dim}${TOPIC_NUMBER}${C.reset}`);
        console.log();
        console.log(`${C.cyan}═══════════════════════════════════════════════${C.reset}`);
        console.log(`${C.bright}  📡 실시간 이벤트 모니터링 시작${C.reset}`);
        console.log(`${C.cyan}═══════════════════════════════════════════════${C.reset}`);
        console.log();
    });
});

client.on('message', (topic, payload) => {
    const msg = payload.toString();

    try {
        const data = JSON.parse(msg);

        // ───── 로그인 이벤트 ─────
        if (topic === TOPIC_LOGIN) {
            handleLoginEvent(data);
        }
        // ───── RP2040 난수 발행 (참고용) ─────
        else if (topic === TOPIC_NUMBER) {
            const time = new Date().toLocaleTimeString('ko-KR');
            console.log(`${C.dim}[${time}]${C.reset} ${C.cyan}📡 RP2040 발행:${C.reset} number=${C.bright}${data.number}${C.reset}`);
        }
    } catch (err) {
        console.error(`${C.red}✗ 메시지 파싱 실패:${C.reset}`, msg);
    }
});

client.on('error', (err) => {
    console.error(`${C.red}✗ MQTT 오류:${C.reset}`, err.message);
});

client.on('offline', () => {
    console.log(`${C.yellow}⚠ MQTT 연결 끊김, 재연결 시도 중...${C.reset}`);
});

// ═══════════════════════════════════════════════
//   로그인 이벤트 처리
// ═══════════════════════════════════════════════
function handleLoginEvent(data) {
    // SQLite 저장
    try {
        insertStmt.run(
            data.user || 'unknown',
            data.device || 'Unknown',
            data.method || 'IoT',
            data.timestamp || new Date().toISOString(),
            data.timestamp_kr || '',
            data.userAgent || ''
        );
    } catch (err) {
        console.error(`${C.red}✗ DB 저장 실패:${C.reset}`, err.message);
    }

    // 콘솔 출력 (예쁘게)
    const dev = getDeviceStyle(data.device);
    const meth = getMethodStyle(data.method);
    const totalCount = countStmt.get().count;

    console.log();
    console.log(`${C.bgGreen}${C.white}${C.bright} 🎉 LOGIN SUCCESS ${C.reset}`);
    console.log(`${C.dim}┌──────────────────────────────────────────────${C.reset}`);
    console.log(`${C.dim}│${C.reset} 📅 시간     : ${C.bright}${data.timestamp_kr || data.timestamp}${C.reset}`);
    console.log(`${C.dim}│${C.reset} 👤 사용자    : ${C.bright}${data.user}${C.reset}`);
    console.log(`${C.dim}│${C.reset} ${dev.icon} 디바이스   : ${dev.color}${C.bright}${data.device}${C.reset}`);
    console.log(`${C.dim}│${C.reset} ${meth.icon} 인증방식    : ${meth.color}${C.bright}${meth.label}${C.reset}`);
    console.log(`${C.dim}│${C.reset} 📊 총 로그인  : ${C.bright}${totalCount}회${C.reset}`);
    console.log(`${C.dim}└──────────────────────────────────────────────${C.reset}`);
    console.log();
}

// ═══════════════════════════════════════════════
//   종료 처리
// ═══════════════════════════════════════════════
process.on('SIGINT', () => {
    console.log();
    console.log(`${C.yellow}⏸  종료 신호 수신. 정리 중...${C.reset}`);

    const totalCount = countStmt.get().count;
    console.log();
    console.log(`${C.cyan}📊 최종 통계${C.reset}`);
    console.log(`${C.dim}─────────────────────────${C.reset}`);
    console.log(`총 로그인 기록: ${C.bright}${totalCount}건${C.reset}`);

    if (totalCount > 0) {
        console.log();
        console.log(`${C.cyan}최근 5건:${C.reset}`);
        const recent = recentStmt.all();
        recent.forEach((row, i) => {
            const dev = getDeviceStyle(row.device);
            console.log(`  ${C.dim}${i + 1}.${C.reset} ${row.timestamp_kr} | ${dev.icon} ${row.device} | ${row.user} | ${row.method}`);
        });
    }

    console.log();
    db.close();
    client.end();
    console.log(`${C.green}✓ 정상 종료됨${C.reset}`);
    process.exit(0);
});
