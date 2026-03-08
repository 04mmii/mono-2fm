# mono.fm

React + Vite 기반의 감성 음악 웹앱입니다.  
현재 앱 플로우는 `Entry -> Room -> Browse(Search)`이며, 전역 오디오 플레이어를 사용합니다.

## Tech Stack
- React 18
- Vite 5
- React Router DOM 6
- 단일 전역 스타일 파일: `src/styles.css` (Tailwind 미사용)

## Routing
앱은 `HashRouter`를 사용합니다.  
즉 실제 URL은 `/#/entry`, `/#/room`, `/#/search` 형태입니다.

- `/` -> `EntryPage`
- `/entry` -> `EntryPage`
- `/room` -> `HomePage`
- `/search` -> `SearchPage`
- `/loading` -> `LoadingPage`
- `*` -> `/entry` 리다이렉트

## API (현재 구현 기준)
현재 프로젝트의 실제 데이터 소스는 **iTunes Search API**입니다.
즉, 이 레포에서 재생되는 샘플 오디오는 iTunes `previewUrl` 기반입니다.

- 파일: `src/lib/musicApi.js`
- 엔드포인트: `https://itunes.apple.com/search`
- 요청 파라미터:
  - `term`: 검색어
  - `media=music`
  - `entity=song`
  - `limit=<number>`

코드 내 매핑 필드:
- `id`: `trackId` 우선, 없으면 fallback 조합
- `title`: `trackName`
- `artist`: `artistName`
- `genre`: `primaryGenreName`
- `album`: `collectionName`
- `duration`: `trackTimeMillis` -> `mm:ss`
- `artwork`: `artworkUrl100`(600 사이즈로 치환) 또는 `artworkUrl60`
- `previewUrl`: `previewUrl`

참고:
- 별도 백엔드 API 서버는 없습니다.
- 30초 재생은 iTunes `previewUrl`(샘플 오디오) 특성입니다.

## Global Player
전역 플레이어는 `src/player/PlayerProvider.jsx`에 있습니다.

- 상태:
  - `currentTrack`
  - `isPlaying`
  - `currentTime`
  - `duration`
  - `queue`
  - `currentIndex`
  - `nextTrack`
- 액션:
  - `play(track?)`
  - `pause()`
  - `toggle()`
  - `seek(time)`
  - `setTrack(track)`
  - `setQueue(tracks)`
  - `playNext()`
  - `playPrev()`
- 오디오 엘리먼트:
  - Provider 내부에서 `<audio>` 1개만 관리
  - `getAudioSrc(track)`로 `previewUrl` 포함 복수 후보 필드에서 재생 URL 선택

## Page Summary
- Entry (`src/pages/EntryPage.jsx`)
  - mood 선택 진입 화면
  - 선택 시 `navigate('/room', { state: { mood } })`
- Room/Home (`src/pages/HomePage.jsx`)
  - 배경 비디오: `/public/bg-turntable-home.mp4`
  - 현재 재생 트랙 정보 + 플레이 제어
- Search (`src/pages/SearchPage.jsx`)
  - 쿼리 없을 때: 추천 플레이리스트
  - 쿼리 있을 때: 검색 결과
  - 재생 클릭 시 queue 세팅 후 `/room` 이동

## Run
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
npm run preview
```

## Project Structure
```txt
src/
  App.jsx
  main.jsx
  styles.css
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
```
