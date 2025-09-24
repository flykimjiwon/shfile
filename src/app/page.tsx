'use client'

import { useState } from 'react'
import FileUpload from '@/components/FileUpload'
import P2PFileTransfer from '@/components/P2PFileTransfer'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'upload' | 'p2p'>('upload')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            📁 파일 전송 사이트
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            일반 업로드와 P2P 실시간 전송, 두 가지 방식으로 파일을 공유하세요
          </p>
        </header>

        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-1 shadow-md">
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'upload'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                📤 일반 업로드
              </button>
              <button
                onClick={() => setActiveTab('p2p')}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'p2p'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                🔄 P2P 전송
              </button>
            </div>
          </div>

          <div className="flex justify-center">
            {activeTab === 'upload' ? (
              <FileUpload />
            ) : (
              <P2PFileTransfer />
            )}
          </div>

          <div className="mt-12 text-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                🔍 두 가지 전송 방식 비교
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                  <div className="font-medium text-blue-800 dark:text-blue-300 mb-2">
                    📤 일반 업로드
                  </div>
                  <ul className="text-blue-700 dark:text-blue-400 space-y-1">
                    <li>• 서버에 파일 저장</li>
                    <li>• 안정적인 업로드</li>
                    <li>• 파일 크기 제한 있음</li>
                    <li>• 업로드 후 링크 공유</li>
                  </ul>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-md">
                  <div className="font-medium text-green-800 dark:text-green-300 mb-2">
                    🔄 P2P 전송
                  </div>
                  <ul className="text-green-700 dark:text-green-400 space-y-1">
                    <li>• 직접 전송 (서버 미경유)</li>
                    <li>• 실시간 전송</li>
                    <li>• 큰 파일도 가능</li>
                    <li>• 연결 코드 공유 필요</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}