'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import P2PFileTransfer from '@/components/P2PFileTransfer'

export default function JoinPage() {
  const params = useParams()
  const router = useRouter()
  const [signal, setSignal] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const fetchSession = async () => {
      if (!params.id) return

      try {
        const response = await fetch(`/api/share?id=${params.id}`)
        const result = await response.json()

        if (result.success) {
          setSignal(result.signal)
        } else {
          setError(result.message || '세션을 찾을 수 없습니다.')
        }
      } catch (error) {
        console.error('세션 로드 오류:', error)
        setError('세션을 불러오는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    fetchSession()
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-4">⏳</div>
          <div className="text-gray-600 dark:text-gray-400">
            세션을 로드하는 중...
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-4xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            세션을 찾을 수 없습니다
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error}
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
            📥 파일 받기
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            자동으로 연결을 시도합니다...
          </p>
        </header>

        <div className="flex justify-center">
          <P2PFileTransfer initialSignal={signal} initialMode="receive" />
        </div>
      </div>
    </div>
  )
}