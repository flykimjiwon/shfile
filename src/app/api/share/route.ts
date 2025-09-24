import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 10

const sessions = new Map<string, string>()

export async function POST(request: NextRequest) {
  try {
    const { signal } = await request.json()

    if (!signal) {
      return NextResponse.json({ success: false, message: '시그널이 필요합니다.' })
    }

    const sessionId = generateShortId()
    sessions.set(sessionId, signal)

    setTimeout(() => {
      sessions.delete(sessionId)
    }, 30 * 60 * 1000)

    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_BASE_URL
      ? process.env.NEXT_PUBLIC_BASE_URL
      : 'http://localhost:3000'

    return NextResponse.json({
      success: true,
      sessionId,
      shareUrl: `${baseUrl}/join/${sessionId}`
    })
  } catch (error) {
    console.error('세션 생성 오류:', error)
    return NextResponse.json({ success: false, message: '세션 생성에 실패했습니다.' })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('id')

  if (!sessionId) {
    return NextResponse.json({ success: false, message: '세션 ID가 필요합니다.' })
  }

  const signal = sessions.get(sessionId)

  if (!signal) {
    return NextResponse.json({ success: false, message: '세션을 찾을 수 없습니다.' })
  }

  sessions.delete(sessionId)

  return NextResponse.json({
    success: true,
    signal
  })
}

function generateShortId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}