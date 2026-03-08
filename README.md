# mono.fm

감성적인 listening room 경험을 목표로 만든 React + Vite 웹앱입니다.  
에디토리얼 무드의 진입 화면에서 mood를 선택하고, 룸 화면에서 음악을 재생하며, 브라우즈 화면에서 탐색을 이어가는 구조입니다.

## Experience Flow
- `Entry`  
  조용한 분위기의 진입 화면에서 mood 선택
- `Room`  
  현재 재생 트랙 중심의 메인 listening 화면
- `Browse/Search`  
  추천/검색 결과를 탐색하고 바로 재생

## Design Direction
- Warm / calm / vintage tone
- Minimal editorial layout
- Strong typography hierarchy
- Subtle depth, grain, and soft motion

## Tech
- React 18
- Vite 5
- React Router DOM 6 (`HashRouter`)
- Global audio state via `PlayerProvider`

## Data & Playback
- 음악 데이터는 `src/lib/musicApi.js`를 통해 검색됩니다.
- 현재 구현은 샘플 오디오(미리듣기) 기반 재생입니다.

## Routes
- `/` -> Entry
- `/entry` -> Entry
- `/room` -> Home (Listening Room)
- `/search` -> Browse/Search

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
