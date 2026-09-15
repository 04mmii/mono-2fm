import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const SYSTEM_PROMPT = `당신은 MONO.FM 레트로 리스닝 룸의 음악 큐레이터입니다.
MONO.FM은 턴테이블 위에서 돌아가는 아날로그 질감의 음악만 트는 공간입니다.

사용자가 고른 무드(mood)를 읽고, 그 무드에 어울리는 레트로/빈티지 감성의 곡을 찾기 위한
iTunes Search API용 영어 검색어를 하나 만들어주세요.

검색어가 가리켜야 할 음악:
- 시티팝 (일본 80년대 시티팝, 라이트 멜로우)
- 올드스쿨 소울 / 펑크(Funk) / 모타운 / 디스코
- 70~90년대 팝, 록, 발라드
- 재즈 스탠다드, 보사노바, 크루너 보컬
- 빈티지 신스 사운드 (신스팝, 신스웨이브, 아날로그 신디사이저 중심)

배제해야 할 음악:
- 최신 유행곡, 현재 차트 히트곡, 2010년대 이후 발표곡
- 현대적인 프로덕션(트랩 비트, EDM 드롭, 오토튠 중심, 과도한 사이드체인 압축)

검색어 작성 규칙:
- 영어로, 2~4단어 정도의 짧은 장르/시대 키워드 (예: "city pop 1980s", "70s soul funk")
- 특정 아티스트명 하나만 넣지 말고 장르와 시대가 드러나게 할 것
- 너무 좁아서 결과가 안 나올 법한 표현은 피할 것

반드시 아래 JSON 형식으로만 응답하세요. 코드블록이나 설명 문장 등 다른 텍스트는 절대 포함하지 마세요.

{
  "query": "iTunes 검색어(영어)",
  "reason": "추천 이유(한국어, 한 문장으로 짧게)",
  "playlistMood": "플레이리스트 분위기 한 줄(한국어)"
}`

// 무드별 레트로 폴백 (API 키가 없거나 호출이 실패했을 때 사용)
const FALLBACKS = {
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

const DEFAULT_FALLBACK = {
  query: 'city pop 1980s',
  reason: '어떤 온도에도 무난하게 어울리는 레트로 시티팝으로 시작해요.',
  playlistMood: '턴테이블 위에서 도는 레트로 감성',
}

function getFallback(mood) {
  const key = String(mood || '').trim().toLowerCase()
  return FALLBACKS[key] || DEFAULT_FALLBACK
}

async function getAIRecommendation(mood) {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 300,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `사용자가 고른 무드: "${mood}"\n이 무드에 어울리는 레트로 음악 검색어를 만들어주세요.`,
      },
    ],
  })

  const textBlock = message.content.find((block) => block.type === 'text')
  if (!textBlock) {
    throw new Error('No text response from Claude')
  }

  const parsed = JSON.parse(textBlock.text)
  if (!parsed?.query) {
    throw new Error('Claude response has no query')
  }

  const fallback = getFallback(mood)
  return {
    query: String(parsed.query),
    reason: parsed.reason ? String(parsed.reason) : fallback.reason,
    playlistMood: parsed.playlistMood
      ? String(parsed.playlistMood)
      : fallback.playlistMood,
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  let body = req.body
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      body = null
    }
  }

  const mood = body?.mood
  if (!mood) {
    return res.status(400).json({ error: 'mood is required' })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('No ANTHROPIC_API_KEY, using retro fallback')
    return res.status(200).json({ ...getFallback(mood), source: 'fallback' })
  }

  try {
    const recommendation = await getAIRecommendation(mood)
    return res.status(200).json({ ...recommendation, source: 'claude' })
  } catch (error) {
    console.error('Claude recommendation failed, using fallback:', error)
    return res.status(200).json({ ...getFallback(mood), source: 'fallback' })
  }
}
