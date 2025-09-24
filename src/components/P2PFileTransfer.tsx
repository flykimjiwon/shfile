'use client'

import { useState, useEffect, useRef } from 'react'
import { useWebRTC } from '@/hooks/useWebRTC'
import QRCodeGenerator from './QRCodeGenerator'

interface P2PFileTransferProps {
  initialSignal?: string
  initialMode?: 'select' | 'send' | 'receive'
}

export default function P2PFileTransfer({ initialSignal, initialMode }: P2PFileTransferProps) {
  const {
    isConnected,
    signal,
    createOffer,
    acceptOffer,
    sendFile,
    onReceiveFile,
    onSignal,
    onProgress,
    disconnect
  } = useWebRTC()

  const [mode, setMode] = useState<'select' | 'send' | 'receive'>(initialMode || 'select')
  const [remoteSignal, setRemoteSignal] = useState(initialSignal || '')
  const [file, setFile] = useState<File | null>(null)
  const [receivedFile, setReceivedFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [shareUrl, setShareUrl] = useState('')
  const [showQR, setShowQR] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (initialSignal && initialMode === 'receive') {
      acceptOffer(initialSignal)
      setStatus('연결을 시도 중입니다...')
    }
  }, [initialSignal, initialMode, acceptOffer])

  useEffect(() => {
    onReceiveFile((receivedFile) => {
      setReceivedFile(receivedFile)
      setStatus('파일 수신 완료!')
    })

    onSignal(async (newSignal) => {
      setStatus('연결 시그널이 생성되었습니다.')

      // 단축 링크 생성
      if (newSignal) {
        try {
          const response = await fetch('/api/share', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ signal: newSignal })
          })

          const result = await response.json()
          if (result.success) {
            setShareUrl(result.shareUrl)
            setStatus('연결 링크가 생성되었습니다!')
          }
        } catch (error) {
          console.error('링크 생성 오류:', error)
        }
      }
    })

    onProgress((progress) => {
      setProgress(progress)
    })
  }, [onReceiveFile, onSignal, onProgress])

  const handleCreateOffer = () => {
    setMode('send')
    createOffer()
    setStatus('연결을 생성 중입니다...')
  }

  const handleJoinSession = () => {
    setMode('receive')
    setStatus('연결 시그널을 입력하세요.')
  }

  const handleAcceptOffer = () => {
    if (remoteSignal.trim()) {
      acceptOffer(remoteSignal)
      setStatus('연결을 시도 중입니다...')
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSendFile = () => {
    if (file && isConnected) {
      sendFile(file)
      setStatus('파일 전송 중...')
      setProgress(0)
    }
  }

  const handleDownloadFile = () => {
    if (receivedFile) {
      const url = URL.createObjectURL(receivedFile)
      const a = document.createElement('a')
      a.href = url
      a.download = receivedFile.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(signal)
      setStatus('시그널이 클립보드에 복사되었습니다!')
    } catch (error) {
      console.error('클립보드 복사 실패:', error)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (mode === 'select') {
    return (
      <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-white">
          P2P 파일 전송
        </h2>

        <div className="space-y-4">
          <button
            onClick={handleCreateOffer}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
          >
            🚀 파일 보내기 (방 만들기)
          </button>

          <button
            onClick={handleJoinSession}
            className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-colors"
          >
            📥 파일 받기 (방 참가)
          </button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <div className="font-medium mb-2">💡 사용법:</div>
            <ul className="space-y-1 text-xs">
              <li>• 파일을 보내려면 &quot;파일 보내기&quot; 선택</li>
              <li>• 파일을 받으려면 &quot;파일 받기&quot; 선택</li>
              <li>• 연결 코드를 상대방과 공유하세요</li>
              <li>• 별도 서버 없이 직접 연결됩니다</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          {mode === 'send' ? '📤 파일 보내기' : '📥 파일 받기'}
        </h2>
        <button
          onClick={() => {
            setMode('select')
            disconnect()
            setStatus('')
            setFile(null)
            setReceivedFile(null)
            setProgress(0)
          }}
          className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded text-gray-700 dark:text-gray-300"
        >
          돌아가기
        </button>
      </div>

      <div className={`p-3 rounded-md mb-4 ${
        isConnected
          ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
          : signal
          ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
      }`}>
        <div className="font-medium">
          상태: {isConnected ? '🟢 연결됨' : signal ? '🟡 연결 대기중' : '🔴 연결 안됨'}
        </div>
        {status && <div className="text-sm mt-1">{status}</div>}
      </div>

      {signal && !isConnected && mode === 'send' && (
        <div className="mb-4 space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
              🔗 연결 방법 선택
            </h3>
          </div>

          <div className="flex justify-center gap-2 mb-4">
            <button
              onClick={() => setShowQR(false)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                !showQR
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              📋 링크/코드
            </button>
            <button
              onClick={() => setShowQR(true)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                showQR
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              📱 QR코드
            </button>
          </div>

          {!showQR ? (
            <div className="space-y-4">
              {shareUrl && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    🔗 단축 링크 (가장 쉬운 방법)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={shareUrl}
                      readOnly
                      className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-200"
                    />
                    <button
                      onClick={() => navigator.clipboard.writeText(shareUrl)}
                      className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm"
                    >
                      복사
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  🔑 연결 시그널 (직접 입력)
                </label>
                <div className="flex gap-2">
                  <textarea
                    value={signal}
                    readOnly
                    className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-xs font-mono text-gray-800 dark:text-gray-200"
                    rows={3}
                  />
                  <button
                    onClick={copyToClipboard}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm"
                  >
                    복사
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  상대방이 휴대폰으로 QR코드를 스캔하면 자동으로 연결됩니다
                </p>
                {shareUrl && <QRCodeGenerator value={shareUrl} />}
              </div>
            </div>
          )}
        </div>
      )}

      {!isConnected && mode === 'receive' && !initialSignal && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            연결 시그널 입력
          </label>
          <div className="space-y-2">
            <textarea
              value={remoteSignal}
              onChange={(e) => setRemoteSignal(e.target.value)}
              placeholder="상대방의 연결 시그널을 입력하세요..."
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-200"
              rows={3}
            />
            <button
              onClick={handleAcceptOffer}
              disabled={!remoteSignal.trim()}
              className={`w-full py-2 px-4 rounded-md font-medium ${
                remoteSignal.trim()
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed text-gray-500'
              }`}
            >
              연결하기
            </button>
          </div>
        </div>
      )}

      {mode === 'send' && isConnected && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              전송할 파일 선택
            </label>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-200"
            />
          </div>

          {file && (
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                선택된 파일: {file.name}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                크기: {formatFileSize(file.size)}
              </div>
            </div>
          )}

          <button
            onClick={handleSendFile}
            disabled={!file}
            className={`w-full py-2 px-4 rounded-md font-medium ${
              file
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed text-gray-500'
            }`}
          >
            파일 전송
          </button>

          {progress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>전송 진행률</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {mode === 'receive' && receivedFile && (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-md">
            <div className="font-medium text-green-800 dark:text-green-400 mb-2">
              파일 수신 완료! 🎉
            </div>
            <div className="text-sm text-green-700 dark:text-green-300">
              파일명: {receivedFile.name}
            </div>
            <div className="text-sm text-green-700 dark:text-green-300">
              크기: {formatFileSize(receivedFile.size)}
            </div>
          </div>

          <button
            onClick={handleDownloadFile}
            className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium"
          >
            파일 다운로드
          </button>
        </div>
      )}
    </div>
  )
}