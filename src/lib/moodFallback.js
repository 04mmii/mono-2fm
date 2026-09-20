// AI 추천이 닿지 않을 때(ANTHROPIC_API_KEY 미설정, 네트워크 실패 등) 쓰는 규칙 기반 폴백.
// 클라이언트(HomePage)와 서버리스 함수(api/recommend.js)가 같은 표를 본다.
// /api/recommend가 정상 동작하면 이 값은 쓰이지 않는다.

// 엔트리 페이지에서 고르는 5개 무드
const PRESETS = {
  'quiet afternoon': {
    query: 'city pop 1980s',
    reason: '나른한 오후엔 창가로 스미는 80년대 시티팝의 햇살이 어울려요.',
    playlistMood: '햇살이 길게 눕는 오후의 시티팝',
  },
  'slow rain': {
    query: 'vintage jazz standards',
    reason: '빗소리 위로는 오래된 재즈 스탠다드의 브러시 드럼이 가장 잘 얹혀요.',
    playlistMood: '빗방울을 세는 빈티지 재즈',
  },
  'warm tape': {
    query: '70s soul',
    reason: '카세트테이프의 따뜻한 히스에는 70년대 소울의 두툼한 온기가 제격이에요.',
    playlistMood: '테이프에 눌러 담은 70년대 소울',
  },
  'late night room': {
    query: '80s synth pop',
    reason: '불 꺼진 방의 새벽엔 80년대 아날로그 신스의 차가운 잔향이 남아요.',
    playlistMood: '새벽 방 안을 채우는 80년대 신스팝',
  },
  'faded memory': {
    query: 'oldies love songs',
    reason: '바래버린 기억에는 오래된 러브송의 흐릿한 코러스가 겹쳐집니다.',
    playlistMood: '색이 바랜 올디스 러브송',
  },
}

// 자유롭게 입력한 무드를 키워드로 갈라준다. 위에서부터 먼저 걸리는 규칙을 쓴다.
const RULES = [
  {
    keywords: ['비', '장마', '빗', 'rain'],
    query: 'vintage jazz standards',
    reason: '빗소리에는 오래된 재즈의 브러시 드럼이 가장 잘 얹혀요.',
    playlistMood: '빗방울을 세는 빈티지 재즈',
  },
  {
    keywords: ['새벽', '밤', '야간', 'night', 'midnight', 'late'],
    query: '80s synth pop',
    reason: '깊은 시간에는 80년대 아날로그 신스의 차가운 잔향이 어울려요.',
    playlistMood: '새벽을 채우는 80년대 신스팝',
  },
  {
    keywords: ['오후', '햇살', '나른', '점심', 'afternoon', 'sunny', 'lazy'],
    query: 'city pop 1980s',
    reason: '느린 오후엔 창가로 스미는 시티팝의 햇살이 어울려요.',
    playlistMood: '햇살이 길게 눕는 오후의 시티팝',
  },
  {
    keywords: ['따뜻', '포근', '온기', '겨울', 'warm', 'cozy'],
    query: '70s soul',
    reason: '온기가 필요한 날엔 70년대 소울의 두툼한 목소리가 제격이에요.',
    playlistMood: '테이프에 눌러 담은 70년대 소울',
  },
  {
    keywords: ['신나', '들뜬', '파티', '춤', '운동', 'party', 'dance', 'happy', 'energetic'],
    query: '70s disco funk',
    reason: '들뜬 기분에는 70년대 디스코 펑크의 그루브가 따라붙어요.',
    playlistMood: '플로어를 도는 70년대 디스코',
  },
  {
    keywords: ['슬프', '우울', '이별', '눈물', '쓸쓸', 'sad', 'blue', 'lonely', 'melancholy'],
    query: '60s soul ballads',
    reason: '가라앉는 날에는 60년대 소울 발라드가 옆에 앉아줍니다.',
    playlistMood: '천천히 가라앉는 올드 소울 발라드',
  },
  {
    keywords: ['사랑', '설레', '로맨', '연애', 'love', 'romantic', 'crush'],
    query: 'oldies love songs',
    reason: '마음이 기울 때는 오래된 러브송의 코러스가 어울려요.',
    playlistMood: '먼지 앉은 올디스 러브송',
  },
  {
    keywords: ['추억', '그리', '옛', '어릴', 'memory', 'nostalgi', 'old days'],
    query: 'oldies but goodies 1970s',
    reason: '돌아보는 날에는 70년대 올디스가 그 시절 공기를 데려옵니다.',
    playlistMood: '색이 바랜 70년대 올디스',
  },
  {
    keywords: ['드라이브', '여행', '바다', 'drive', 'road', 'summer'],
    query: 'japanese city pop summer',
    reason: '길 위에서는 시티팝의 여름 리듬이 창밖과 잘 맞아요.',
    playlistMood: '창문 내린 여름의 시티팝',
  },
  {
    keywords: ['커피', '카페', '아침', '조용', '차분', 'cafe', 'coffee', 'calm', 'quiet', 'morning'],
    query: 'bossa nova 1960s',
    reason: '조용한 시간에는 60년대 보사노바의 나른한 기타가 어울려요.',
    playlistMood: '느슨하게 흐르는 60년대 보사노바',
  },
  {
    keywords: ['집중', '공부', '작업', 'focus', 'study', 'work'],
    query: 'jazz instrumental 1960s',
    reason: '집중할 때는 가사 없는 60년대 재즈가 방해하지 않아요.',
    playlistMood: '말 없이 도는 60년대 재즈',
  },
]

const DEFAULT = {
  query: 'city pop 1980s',
  reason: '어떤 온도에도 무난하게 어울리는 레트로 시티팝으로 시작해요.',
  playlistMood: '턴테이블 위에서 도는 레트로 감성',
}

export function fallbackForMood(mood) {
  const text = String(mood || '').trim().toLowerCase()
  if (!text) return DEFAULT

  const preset = PRESETS[text]
  if (preset) return preset

  for (const rule of RULES) {
    if (rule.keywords.some((word) => text.includes(word))) {
      return { query: rule.query, reason: rule.reason, playlistMood: rule.playlistMood }
    }
  }

  return DEFAULT
}
