/**
 * 로그 보기 - SQLite DB 내용을 표 형태로 출력
 * 실행: node view-logs.js
 *      node view-logs.js 50    (최근 50건)
 *      node view-logs.js stats (통계)
 */

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'login_logs.db');

const C = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
};

const db = new Database(DB_PATH, { readonly: true });
const arg = process.argv[2] || '20';

function showLogs(limit) {
    const rows = db.prepare(`
        SELECT id, user_id, device, method, timestamp_kr 
        FROM login_logs 
        ORDER BY id DESC 
        LIMIT ?
    `).all(limit);

    console.log();
    console.log(`${C.cyan}┌──── 최근 ${limit}건의 로그인 기록 ─────${C.reset}`);
    console.log();
    console.log(`  ${C.bright}${'#'.padEnd(4)} ${'시간'.padEnd(20)} ${'사용자'.padEnd(10)} ${'디바이스'.padEnd(13)} ${'방식'.padEnd(10)}${C.reset}`);
    console.log(`  ${C.dim}${'─'.repeat(70)}${C.reset}`);

    rows.forEach(row => {
        const id = String(row.id).padEnd(4);
        const time = (row.timestamp_kr || '').padEnd(20);
        const user = (row.user_id || '').padEnd(10);
        const device = (row.device || '').padEnd(13);
        const method = (row.method || '').padEnd(10);
        const methodColor = row.method === 'IoT' ? C.green : C.yellow;
        console.log(`  ${C.dim}${id}${C.reset} ${time} ${C.cyan}${user}${C.reset} ${device} ${methodColor}${method}${C.reset}`);
    });
    console.log();
}

function showStats() {
    const total = db.prepare(`SELECT COUNT(*) as c FROM login_logs`).get().c;
    const byDevice = db.prepare(`
        SELECT device, COUNT(*) as c FROM login_logs GROUP BY device ORDER BY c DESC
    `).all();
    const byMethod = db.prepare(`
        SELECT method, COUNT(*) as c FROM login_logs GROUP BY method
    `).all();
    const byUser = db.prepare(`
        SELECT user_id, COUNT(*) as c FROM login_logs GROUP BY user_id ORDER BY c DESC LIMIT 10
    `).all();

    console.log();
    console.log(`${C.cyan}═══════════ 📊 통계 ═══════════${C.reset}`);
    console.log();
    console.log(`${C.bright}전체 로그인:${C.reset} ${total}회`);
    console.log();
    console.log(`${C.bright}디바이스별:${C.reset}`);
    byDevice.forEach(r => {
        const pct = ((r.c / total) * 100).toFixed(1);
        console.log(`  ${r.device.padEnd(15)} ${r.c}회 ${C.dim}(${pct}%)${C.reset}`);
    });
    console.log();
    console.log(`${C.bright}인증 방식별:${C.reset}`);
    byMethod.forEach(r => {
        const color = r.method === 'IoT' ? C.green : C.yellow;
        const pct = ((r.c / total) * 100).toFixed(1);
        console.log(`  ${color}${r.method.padEnd(10)}${C.reset} ${r.c}회 ${C.dim}(${pct}%)${C.reset}`);
    });
    console.log();
    console.log(`${C.bright}사용자 TOP 10:${C.reset}`);
    byUser.forEach((r, i) => {
        console.log(`  ${i + 1}. ${C.cyan}${r.user_id.padEnd(10)}${C.reset} ${r.c}회`);
    });
    console.log();
}

if (arg === 'stats') {
    showStats();
} else {
    const limit = parseInt(arg, 10) || 20;
    showLogs(limit);
}

db.close();
