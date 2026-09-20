import Anthropic from '@anthropic-ai/sdk'
import { fallbackForMood } from '../src/lib/moodFallback.js'

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

// Claude가 JSON만 달라는 지시를 어기고 ```json 펜스로 감싸거나 앞뒤에 문장을
// 붙이는 경우가 있다. 프롬프트만 믿지 말고 파싱 쪽에서 흡수한다.
function parseLooseJson(text) {
  let body = String(text ?? '').trim()

  const fenced = body.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  if (fenced) body = fenced[1].trim()

  try {
    return JSON.parse(body)
  } catch {
    // 앞뒤에 설명이 붙은 경우: 첫 '{' 부터 마지막 '}' 까지만 떼어본다.
    const start = body.indexOf('{')
    const end = body.lastIndexOf('}')
    if (start !== -1 && end > start) {
      return JSON.parse(body.slice(start, end + 1))
    }
    throw new Error('Claude 응답에서 JSON 객체를 찾지 못했습니다')
  }
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

  const parsed = parseLooseJson(textBlock.text)
  if (!parsed?.query) {
    throw new Error('Claude response has no query')
  }

  const fallback = fallbackForMood(mood)
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

  // ?debug=1 일 때만 왜 실패했는지 자세히 알려준다. 평소에는 이유 코드만.
  const debug = 'debug' in (req.query || {})

  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('No ANTHROPIC_API_KEY, using retro fallback')
    return res.status(200).json({
      ...fallbackForMood(mood),
      source: 'fallback',
      fallbackReason: 'no_api_key',
    })
  }

  try {
    const recommendation = await getAIRecommendation(mood)
    return res.status(200).json({ ...recommendation, source: 'claude' })
  } catch (error) {
    console.error('Claude recommendation failed, using fallback:', error)
    return res.status(200).json({
      ...fallbackForMood(mood),
      source: 'fallback',
      fallbackReason: 'ai_error',
      ...(debug
        ? {
            // 키 값은 에러 메시지에 실리지 않는다.
            errorName: error?.name ?? null,
            errorStatus: error?.status ?? null,
            errorMessage: String(error?.message ?? '').slice(0, 200),
          }
        : {}),
    })
  }
}
