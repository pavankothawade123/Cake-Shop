'use client'

import { useState, useCallback } from 'react'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { Button } from './button'
import Image from 'next/image'

interface FileUploadProps {
  value?: string
  onChange: (url: string | undefined) => void
  accept?: string
  maxSizeMB?: number
  className?: string
  disabled?: boolean
}

export function FileUpload({
  value,
  onChange,
  accept = 'image/*',
  maxSizeMB = 5,
  className = '',
  disabled = false,
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const handleFile = useCallback(
    async (file: File) => {
      setError(null)

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file')
        return
      }

      // Validate file size
      const maxSize = maxSizeMB * 1024 * 1024
      if (file.size > maxSize) {
        setError(`File size must be less than ${maxSizeMB}MB`)
        return
      }

      setIsUploading(true)

      try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Upload failed')
        }

        const data = await response.json()
        onChange(data.url)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed')
      } finally {
        setIsUploading(false)
      }
    },
    [maxSizeMB, onChange]
  )

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (disabled) return

      const file = e.dataTransfer.files?.[0]
      if (file) {
        handleFile(file)
      }
    },
    [disabled, handleFile]
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        handleFile(file)
      }
    },
    [handleFile]
  )

  const handleRemove = useCallback(() => {
    onChange(undefined)
    setError(null)
  }, [onChange])

  if (value) {
    return (
      <div className={`relative ${className}`}>
        <div className="relative aspect-video rounded-lg overflow-hidden border border-gray-200">
          <Image
            src={value}
            alt="Uploaded image"
            fill
            className="object-cover"
          />
          {!disabled && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <label
        className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
          dragActive
            ? 'border-pink-500 bg-pink-50'
            : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          {isUploading ? (
            <>
              <Loader2 className="w-8 h-8 mb-2 text-gray-400 animate-spin" />
              <p className="text-sm text-gray-500">Uploading...</p>
            </>
          ) : (
            <>
              {dragActive ? (
                <Upload className="w-8 h-8 mb-2 text-pink-500" />
              ) : (
                <ImageIcon className="w-8 h-8 mb-2 text-gray-400" />
              )}
              <p className="mb-1 text-sm text-gray-500">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-400">
                PNG, JPG or WEBP (max {maxSizeMB}MB)
              </p>
            </>
          )}
        </div>
        <input
          type="file"
          className="hidden"
          accept={accept}
          onChange={handleChange}
          disabled={disabled || isUploading}
        />
      </label>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  )
}
