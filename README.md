# mono.fm

Vite + React 기반의 에디토리얼 무드 음악 웹앱입니다.  
`Entry -> Room -> Browse(Search)` 흐름과 전역 오디오 플레이어(단일 `<audio>`)를 사용합니다.

## Stack
- React 18
- Vite 5
- React Router DOM 6 (`HashRouter`)

## 주요 기능
- 엔트리 페이지
  - 마우스를 따라오는 그라데이션/컬러 반응
  - 무드 선택 후 Room 진입
- 룸 페이지(`/room`)
  - 배경 비디오: `/public/bg-turntable-home.mp4`
  - 현재 재생 트랙 정보 표시
  - 글로벌 플레이/일시정지 제어
- 브라우즈 페이지(`/search`)
  - 검색어 없이 진입 시: 빈 검색창 + 추천 플레이리스트
  - 검색어 입력 시: 실제 검색 결과 렌더
  - 결과에서 재생 클릭 시 Room으로 이동하며 재생 유지
- 글로벌 미니 플레이어
  - 하단 고정
  - 재생/일시정지, 이전/다음, seek, 진행 시간 표시

## 오디오/상태 구조
- `src/player/PlayerProvider.jsx`
  - 전역 상태: `currentTrack`, `isPlaying`, `currentTime`, `duration`, `queue`, `currentIndex`
  - 액션: `play`, `pause`, `toggle`, `seek`, `setTrack`, `setQueue`, `playNext`, `playPrev`
  - 실제 오디오 엘리먼트는 Provider 내부에 1개만 존재
- `getAudioSrc(track)`로 트랙 객체의 여러 후보 필드에서 재생 URL을 안전하게 매핑

## API
- `src/lib/musicApi.js`
  - iTunes Search API 기반 트랙 검색
  - UI에서 쓰기 좋은 형태로 track 매핑(`title`, `artist`, `artwork`, `previewUrl` 등)

## 라우트
- `/` -> `EntryPage`
- `/entry` -> `EntryPage`
- `/room` -> `HomePage`
- `/search` -> `SearchPage`
- `/loading` -> Loading
- `*` -> `/entry` 리다이렉트

## 실행 방법
```bash
npm install
npm run dev
```

## 빌드
```bash
npm run build
npm run preview
```

## 폴더 구조
```txt
src/
  components/
    AppHeader.jsx
    MiniPlayer.jsx
  pages/
    EntryPage.jsx
    HomePage.jsx
    SearchPage.jsx
  player/
    PlayerProvider.jsx
  lib/
    musicApi.js
  App.jsx
  main.jsx
```
