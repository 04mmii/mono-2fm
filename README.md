# MONO.fm

기분을 말하면 거기에 어울리는 옛날 음악을 찾아 틀어주는 웹 플레이어입니다.

https://mono-2fm.vercel.app

음악 서비스는 보통 무엇을 들을지 먼저 묻습니다. 그런데 정작 사용자가 아는 건 지금 어떤 기분인지 정도인 경우가 많습니다. MONO.fm은 그 쪽에서 출발합니다. 진입 화면에서 기분을 고르거나 직접 적으면, 그 문장을 해석해서 레트로 음악만 골라 바로 재생합니다.

## 동작 방식

기분 한 줄이 재생 목록이 되기까지 세 단계를 거칩니다.

1. 진입 화면에서 다섯 개 무드 중 하나를 고르거나, 하단 물음표를 눌러 직접 적습니다.
2. 그 문장이 `/api/recommend`로 넘어갑니다. Claude가 시티팝, 올드스쿨 소울, 70~90년대 팝, 재즈 스탠다드, 빈티지 신스 범위 안에서 iTunes에 넣을 영어 검색어를 만들고 추천 이유와 플레이리스트 분위기를 함께 돌려줍니다. 2010년대 이후 곡과 현대적인 프로덕션은 프롬프트에서 배제했습니다.
3. 그 검색어로 iTunes Search API를 호출해 미리듣기 12곡을 큐에 넣고 첫 곡부터 재생합니다.

룸 화면 헤더의 입력창도 같은 경로를 씁니다. 기분을 다시 적으면 곡이 새로 깔리고 바로 재생됩니다.

실제로 "비 오는 새벽"은 `jazz ballad rain 1960s`, "신나는 파티"는 `disco funk 1970s party`로 서로 다른 검색어가 나옵니다.

### AI를 못 쓸 때

`ANTHROPIC_API_KEY`가 없거나 호출이 실패하면 `src/lib/moodFallback.js`의 키워드 규칙이 대신 답합니다. 비, 새벽, 오후, 파티, 이별 같은 단어를 보고 검색어를 고르기 때문에 AI 없이도 기분에 따라 결과가 달라집니다. 응답 형식이 같아서 화면 쪽 코드는 어느 경로로 왔는지 구분하지 않습니다.

## 실행

```bash
npm install
npm run dev
```

`npm run dev`는 Vite 개발 서버만 띄우므로 `/api/recommend`가 존재하지 않습니다. 이 상태에서는 항상 폴백으로 동작합니다. AI 경로까지 확인하려면 Vercel CLI가 필요합니다.

```bash
npm i -g vercel
vercel dev
```

## 환경변수

`ANTHROPIC_API_KEY` 하나입니다. `api/recommend.js`에서만 읽습니다.

키는 [console.anthropic.com](https://console.anthropic.com)에서 발급받습니다. 로컬은 프로젝트 루트에 `.env.local`을 만들어 넣고, 배포는 Vercel 프로젝트 설정의 Environment Variables에 등록한 뒤 **다시 배포해야** 반영됩니다. 환경변수는 기존 배포에 소급되지 않습니다.

`VITE_` 접두사를 붙이면 안 됩니다. Vite가 그 값을 클라이언트 번들에 그대로 넣기 때문에 브라우저에서 키가 노출됩니다.

## 구조

```
api/recommend.js               Claude 호출과 폴백을 담당하는 Vercel 서버리스 함수
src/lib/moodFallback.js        무드 -> 검색어 규칙. 위 함수와 화면이 같이 씁니다
src/lib/musicApi.js            iTunes Search API 호출
src/pages/EntryPage.jsx        무드 선택 다이얼
src/pages/HomePage.jsx         룸 화면. 추천 요청과 재생 시작을 맡습니다
src/player/PlayerProvider.jsx  오디오와 큐 상태
```

라우팅은 `HashRouter`를 씁니다. 주소가 `/#/room` 형태인 건 그래서입니다. 정적 호스팅에서 새로고침 시 404가 나는 걸 피하려고 선택했습니다.

## 화면

진입 화면은 다섯 개 무드를 라디오 눈금처럼 가로로 펼쳐 놓았습니다. 무드 위에 커서를 올리면 종이 질감 배경의 색온도가 그 무드 쪽으로 천천히 돌고, 눈금 아래 바늘이 옮겨갑니다. 목록에 없는 기분은 하단의 물음표를 눌러 적습니다.

룸 화면은 지금 흐르는 곡 하나에 집중합니다. 두 화면 모두 스크롤 없이 한 화면에 들어오도록, 글자 크기와 여백을 화면 너비뿐 아니라 높이에도 맞춰 잡았습니다.

## 알아둘 점

- iTunes가 제공하는 건 30초 미리듣기입니다. 전곡 재생은 되지 않습니다.
- `/search`(`SearchPage.jsx`)는 범용 검색 화면입니다. 기분 기반 추천이라는 방향과 맞지 않아 지금은 어디서도 링크하지 않고 주소로만 열립니다.

## 기술

React 18, Vite 5, React Router 6, Vercel 서버리스 함수, Anthropic SDK.
