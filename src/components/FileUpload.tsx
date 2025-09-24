'use client'

import { useState, useRef } from 'react'

interface UploadResult {
  success: boolean
  message: string
  filename?: string
  size?: number
  type?: string
}

interface FileUploadProps {
  onUploadComplete?: (result: UploadResult) => void
}

export default function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile)
    setUploadResult(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const uploadFile = async () => {
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()
      setUploadResult(result)
      onUploadComplete?.(result)

      if (result.success) {
        setFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    } catch (error) {
      console.error('업로드 오류:', error)
      setUploadResult({
        success: false,
        message: '업로드 중 오류가 발생했습니다.'
      })
    } finally {
      setUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-white">
        일반 파일 업로드
      </h2>

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragOver
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
        />

        {file ? (
          <div className="space-y-2">
            <div className="text-lg font-medium text-gray-700 dark:text-gray-300">
              {file.name}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {formatFileSize(file.size)}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-4xl">📁</div>
            <div className="text-gray-600 dark:text-gray-400">
              파일을 드래그하여 놓거나 클릭하여 선택하세요
            </div>
          </div>
        )}
      </div>

      {file && (
        <button
          onClick={uploadFile}
          disabled={uploading}
          className={`w-full mt-4 py-2 px-4 rounded-md font-medium transition-colors ${
            uploading
              ? 'bg-gray-400 cursor-not-allowed text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {uploading ? '업로드 중...' : '업로드'}
        </button>
      )}

      {uploadResult && (
        <div className={`mt-4 p-3 rounded-md ${
          uploadResult.success
            ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
            : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400'
        }`}>
          <div className="font-medium">
            {uploadResult.success ? '✅ 성공' : '❌ 실패'}
          </div>
          <div className="text-sm mt-1">
            {uploadResult.message}
          </div>
          {uploadResult.success && (
            <div className="text-sm mt-2 space-y-1">
              <div>파일명: {uploadResult.filename}</div>
              <div>크기: {formatFileSize(uploadResult.size || 0)}</div>
              <div>타입: {uploadResult.type}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}