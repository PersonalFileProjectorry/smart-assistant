# Smart Assistant

IoT 센서 수업 과제 - MQTT 대신 HTML/JS 기반으로 구현한 스마트 어시스턴트 시뮬레이션.

## 📁 파일 구조

```
lot_swstest/
├── index.html    # 마크업 (구조)
├── style.css     # 스타일 (다크 대시보드 테마)
├── app.js        # 로직 (API 호출 + 키워드 분기)
└── README.md     # 이 파일
```

## 🚀 실행 방법

### 방법 1: 파일 직접 열기 (가장 간단)
`index.html`을 브라우저에서 더블클릭

### 방법 2: VS Code Live Server (추천)
1. VS Code 확장 `Live Server` 설치
2. `index.html` 우클릭 → "Open with Live Server"
3. 브라우저에 `http://127.0.0.1:5500` 로 열림

> ⚠️ **NewsAPI는 Live Server 같은 로컬 서버 환경을 권장합니다.** (file:// 프로토콜에서는 CORS 문제가 생길 수 있음)

## 🎯 기능

| 기능 | 명령어 예시 | API |
|---|---|---|
| 🌤 날씨 | "서울 날씨", "부산 기온" | OpenWeatherMap |
| 💱 환율 | "환율", "달러" | ExchangeRate-API |
| 📰 뉴스 | "뉴스", "헤드라인" | NewsAPI |
| 🕐 시간 | "몇 시야?", "오늘 날짜" | JS 내장 |
| 📺 유튜브 | "유튜브 lofi" | URL 생성 |
| 🔍 구글 | "구글 파이썬" | URL 생성 |

## 🔑 API 키

`app.js` 최상단 `API_KEYS` 객체에 정의되어 있습니다.
과제 제출 후 보안상 키를 재발급하는 것을 권장합니다.

## 🛠 기술 스택

- **HTML5 / CSS3 / Vanilla JavaScript** (프레임워크 없음)
- **Fetch API** 로 외부 REST API 비동기 호출
- **CSS Variables + Flexbox/Grid** 기반 반응형 레이아웃
- **Google Fonts**: Space Grotesk, JetBrains Mono, Noto Sans KR

## 🎨 디자인 컨셉

- 다크 테마 대시보드
- 그리드 배경 + 상단 글로우 효과
- 카드 기반 결과 표시
- 실시간 시계 / 상태 인디케이터
- 날씨 게이지 (달리기 지수 / 세차 지수)
