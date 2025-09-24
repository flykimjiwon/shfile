'use client'

import { useRef, useState, useCallback } from 'react'
import SimplePeer from 'simple-peer'

interface UseWebRTCReturn {
  peer: SimplePeer.Instance | null
  isInitiator: boolean
  isConnected: boolean
  signal: string
  createOffer: () => void
  acceptOffer: (signal: string) => void
  sendFile: (file: File) => void
  onReceiveFile: (callback: (file: File) => void) => void
  onSignal: (callback: (signal: string) => void) => void
  onProgress: (callback: (progress: number) => void) => void
  disconnect: () => void
}

export const useWebRTC = (): UseWebRTCReturn => {
  const peerRef = useRef<SimplePeer.Instance | null>(null)
  const [isInitiator, setIsInitiator] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [signal, setSignal] = useState('')

  const onReceiveFileCallback = useRef<((file: File) => void) | null>(null)
  const onSignalCallback = useRef<((signal: string) => void) | null>(null)
  const onProgressCallback = useRef<((progress: number) => void) | null>(null)

  const createPeer = useCallback((initiator: boolean, signal?: string) => {
    const peer = new SimplePeer({
      initiator,
      trickle: false,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' }
        ]
      }
    })

    peer.on('signal', (data: SimplePeer.SignalData) => {
      const signalString = JSON.stringify(data)
      setSignal(signalString)
      onSignalCallback.current?.(signalString)
    })

    peer.on('connect', () => {
      setIsConnected(true)
      console.log('WebRTC 연결 성공')
    })

    // 파일 수신용 변수들
    let fileChunks: Uint8Array[] = []
    let fileInfo: { name: string; size: number; mimeType: string; totalChunks: number } | null = null
    let receivedChunks = 0

    peer.on('data', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString())

        if (message.type === 'file-info') {
          // 파일 정보 수신
          fileInfo = message
          fileChunks = []
          receivedChunks = 0
          console.log('파일 정보 수신:', message.name, message.size)
        } else if (message.type === 'file-chunk') {
          // 파일 청크 수신
          const chunkData = new Uint8Array(message.data)
          fileChunks[message.chunkIndex] = chunkData
          receivedChunks++

          // 진행률 업데이트
          if (fileInfo) {
            const progress = (receivedChunks / fileInfo.totalChunks) * 100
            onProgressCallback.current?.(progress)
          }

          if (message.isLast && fileInfo) {
            // 모든 청크 수신 완료 - 파일 재조립
            const totalSize = fileChunks.reduce((sum, chunk) => sum + chunk.length, 0)
            const combinedArray = new Uint8Array(totalSize)
            let offset = 0

            for (const chunk of fileChunks) {
              combinedArray.set(chunk, offset)
              offset += chunk.length
            }

            const blob = new Blob([combinedArray], { type: fileInfo.mimeType })
            const file = new File([blob], fileInfo.name, { type: fileInfo.mimeType })
            onReceiveFileCallback.current?.(file)
            console.log('파일 수신 완료')
          }
        }
      } catch (error) {
        console.error('데이터 처리 오류:', error)
      }
    })

    peer.on('error', (error) => {
      console.error('WebRTC 오류:', error)
    })

    peer.on('close', () => {
      setIsConnected(false)
      console.log('WebRTC 연결 종료')
    })

    if (signal && !initiator) {
      peer.signal(JSON.parse(signal))
    }

    peerRef.current = peer
  }, [])

  const createOffer = useCallback(() => {
    setIsInitiator(true)
    createPeer(true)
  }, [createPeer])

  const acceptOffer = useCallback((signal: string) => {
    setIsInitiator(false)
    createPeer(false, signal)
  }, [createPeer])

  const sendFile = useCallback(async (file: File) => {
    if (!peerRef.current || !isConnected) {
      console.error('WebRTC 연결이 없습니다')
      return
    }

    const reader = new FileReader()
    reader.onload = async () => {
      const arrayBuffer = reader.result as ArrayBuffer
      const chunkSize = 8192 // 8KB 청크 (더 작은 크기)
      const totalChunks = Math.ceil(arrayBuffer.byteLength / chunkSize)

      // 파일 정보 전송
      peerRef.current?.send(JSON.stringify({
        type: 'file-info',
        name: file.name,
        size: file.size,
        mimeType: file.type,
        totalChunks
      }))

      // 파일 청크를 순차적으로 전송 (비동기)
      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize
        const end = Math.min(start + chunkSize, arrayBuffer.byteLength)
        const chunk = arrayBuffer.slice(start, end)

        try {
          peerRef.current?.send(JSON.stringify({
            type: 'file-chunk',
            name: file.name,
            mimeType: file.type,
            data: Array.from(new Uint8Array(chunk)),
            chunkIndex: i,
            totalChunks,
            isLast: i === totalChunks - 1
          }))

          const progress = ((i + 1) / totalChunks) * 100
          onProgressCallback.current?.(progress)

          // 작은 지연으로 과부하 방지
          if (i % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 10))
          }
        } catch (error) {
          console.error(`청크 ${i} 전송 오류:`, error)
          break
        }
      }
    }
    reader.readAsArrayBuffer(file)
  }, [isConnected])

  const onReceiveFile = useCallback((callback: (file: File) => void) => {
    onReceiveFileCallback.current = callback
  }, [])

  const onSignal = useCallback((callback: (signal: string) => void) => {
    onSignalCallback.current = callback
  }, [])

  const onProgress = useCallback((callback: (progress: number) => void) => {
    onProgressCallback.current = callback
  }, [])

  const disconnect = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.destroy()
      peerRef.current = null
    }
    setIsConnected(false)
    setSignal('')
  }, [])

  return {
    peer: peerRef.current,
    isInitiator,
    isConnected,
    signal,
    createOffer,
    acceptOffer,
    sendFile,
    onReceiveFile,
    onSignal,
    onProgress,
    disconnect
  }
}