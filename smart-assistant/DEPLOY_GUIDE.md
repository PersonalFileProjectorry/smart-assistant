# 📱 스마트폰에서 앱처럼 사용하기 - 배포 가이드

---

## 🎯 최종 목표

1. Vercel에 무료 배포 → 고유 URL 생성 (예: `https://smart-assistant-xxx.vercel.app`)
2. 스마트폰에서 URL 접속 → "홈 화면에 추가" → 앱처럼 사용

---

## STEP 1. Vercel 배포 (10분)

### 방법 A: 드래그 앤 드롭 (가장 쉬움, 회원가입만 필요) ⭐

1. **Vercel 가입**: https://vercel.com 접속 → **Sign Up**
   - GitHub 계정으로 가입 추천 (2초 완료)

2. **폴더 압축 준비**
   - `lot_swstest` 폴더 안의 **파일들만** (폴더 자체 말고) 선택
   - 다음 파일들이 포함되어야 함:
     ```
     index.html
     style.css
     app.js
     manifest.json
     service-worker.js
     icon-192.png
     icon-512.png
     ```
   - 이 파일들을 zip으로 압축 (또는 폴더째 그냥 사용)

3. **배포**
   - Vercel 대시보드에서 **Add New → Project**
   - 또는 https://vercel.com/new 접속
   - **"Deploy"** 아래 **"Upload"** 옵션 선택 (드래그 앤 드롭 영역)
   - `lot_swstest` 폴더를 통째로 드래그

4. **완료!**
   - 1~2분 기다리면 URL 생성됨 (예: `smart-assistant-abc123.vercel.app`)
   - 이 URL을 친구들에게 공유하면 끝

### 방법 B: GitHub 연동 (업데이트 편함, 추천)

1. GitHub에 저장소 생성 → `lot_swstest` 폴더 업로드
2. Vercel → **Add New → Project** → **Import Git Repository**
3. 방금 만든 저장소 선택 → **Deploy**
4. 이후에는 GitHub에 푸시하면 자동 재배포 ✨

---

## STEP 2. 스마트폰에서 설치

### 안드로이드 (Chrome)

1. 배포된 URL을 Chrome으로 접속
2. 주소창 옆 **⋮ (메뉴)** → **"앱 설치"** 또는 **"홈 화면에 추가"**
3. 설치 확인 → 홈에 아이콘 생김
4. 아이콘 터치 → 전체화면 앱처럼 실행! 🎉

### 아이폰 (Safari)

⚠️ **반드시 Safari로 접속** (Chrome에서는 제한됨)

1. Safari로 배포 URL 접속
2. 하단 **📤 공유 버튼** 터치
3. 아래로 스크롤 → **"홈 화면에 추가"**
4. **추가** 버튼 터치
5. 홈에 아이콘 생김 → 터치 → 앱처럼 실행! 🎉

---

## STEP 3. 친구들에게 공유하기

### 공유 방법
- URL 복사해서 카카오톡/문자로 전송
- QR 코드 생성해서 교실에서 스캔 (https://www.qr-code-generator.com)

### 사용자 안내 문구 예시
```
[스마트 어시스턴트 앱]
📱 설치 방법:
1. 아래 링크 접속
2. 브라우저 메뉴 → "홈 화면에 추가"
3. 아이콘 터치해서 실행!

🔗 https://smart-assistant-xxx.vercel.app

※ 아이폰은 반드시 Safari로 열어주세요
```

---

## 🔧 트러블슈팅

### "배포했는데 사이트가 안 열려요"
- 1~2분 기다렸다가 다시 접속 (첫 배포는 시간 걸림)
- Vercel 대시보드에서 **Deployments** 탭에서 상태 확인

### "뉴스가 안 떠요"
- 배포 환경에서는 자동으로 **Google News RSS**를 사용하도록 이미 수정됨
- 그래도 안 되면 F12 → Console 탭 에러 확인

### "홈 화면에 추가 옵션이 안 보여요"
- HTTPS로 접속했는지 확인 (Vercel은 자동 HTTPS)
- manifest.json과 icon 파일들이 잘 업로드됐는지 Vercel 대시보드에서 확인
- 브라우저 한 번 껐다가 다시 열기

### "아이콘이 검은 사각형으로 나와요"
- 폴더 업로드 시 icon-192.png, icon-512.png 포함됐는지 확인
- Vercel 배포 URL에 `/icon-192.png` 붙여서 직접 접속 테스트

---

## 🛡️ 과제 제출 후 보안 처리

배포된 사이트의 F12를 누르면 누구나 API 키를 볼 수 있습니다.
**과제 제출/시연이 끝나면 반드시 3개 키 모두 재발급**하세요:

| 서비스 | 재발급 URL |
|---|---|
| OpenWeatherMap | https://home.openweathermap.org/api_keys |
| ExchangeRate-API | https://app.exchangerate-api.com/dashboard |
| NewsAPI | https://newsapi.org/account |

재발급하면 기존 키는 자동 무효화됩니다.

---

## 💡 Bonus: 커스텀 도메인 (선택)

Vercel에서 제공하는 URL 대신 깔끔한 도메인을 쓰고 싶다면:
- `.com` 도메인: 연 1~2만원 (가비아/후이즈)
- Vercel 대시보드 → **Settings → Domains**에서 연결

과제용으로는 기본 URL로도 충분합니다!
