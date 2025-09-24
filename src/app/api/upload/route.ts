import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File

    if (!file) {
      return NextResponse.json({ success: false, message: '파일이 없습니다.' })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadsDir = join(process.cwd(), 'uploads')

    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch {
      // 디렉토리가 이미 존재하는 경우 무시
    }

    const timestamp = Date.now()
    const filename = `${timestamp}-${file.name}`
    const path = join(uploadsDir, filename)

    await writeFile(path, buffer)

    return NextResponse.json({
      success: true,
      message: '파일이 성공적으로 업로드되었습니다.',
      filename: filename,
      size: file.size,
      type: file.type
    })
  } catch (error) {
    console.error('File upload error:', error)
    return NextResponse.json({ success: false, message: '파일 업로드에 실패했습니다.' })
  }
}