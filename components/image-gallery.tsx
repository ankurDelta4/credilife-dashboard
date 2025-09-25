"use client"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, Eye, FileText, Image as ImageIcon, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface ImageFile {
  url: string
  name: string
  type?: 'image' | 'pdf' | 'document'
}

interface ImageGalleryProps {
  files: string | string[] | ImageFile[]
  label: string
  fieldName: string
  applicationId?: string | number
}

interface ImageViewModalProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  imageName: string
  onDownload: () => void
}

function ImageViewModal({ isOpen, onClose, imageUrl, imageName, onDownload }: ImageViewModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 z-10 bg-black/20 hover:bg-black/40 text-white"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex flex-col items-center space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">{imageName}</h3>
              <Button
                onClick={onDownload}
                className="flex items-center gap-2"
                size="sm"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
            <div className="w-full flex justify-center">
              <img
                src={imageUrl}
                alt={imageName}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  const fallbackDiv = target.nextElementSibling as HTMLElement
                  if (fallbackDiv) {
                    fallbackDiv.classList.remove('hidden')
                    fallbackDiv.classList.add('flex')
                  }
                }}
              />
              <div className="hidden flex-col items-center justify-center p-8 bg-gray-100 rounded-lg min-h-[300px]">
                <FileText className="h-16 w-16 text-gray-400 mb-4" />
                <p className="text-gray-600">Cannot preview this file</p>
                <p className="text-sm text-gray-500 mt-2">Click download to view the file</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function ImageGallery({ files, label, fieldName, applicationId }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<{ url: string; name: string } | null>(null)
  const { toast } = useToast()

  // Handle different input formats
  const processFiles = (): ImageFile[] => {
    if (!files) return []
    
    if (typeof files === 'string') {
      if (files.includes(',')) {
        // Comma-separated string of URLs
        return files.split(',').map((url, index) => ({
          url: url.trim(),
          name: `${fieldName}_${index + 1}`,
          type: getFileType(url.trim())
        }))
      } else {
        // Single URL
        return [{
          url: files,
          name: fieldName,
          type: getFileType(files)
        }]
      }
    }
    
    if (Array.isArray(files)) {
      if (typeof files[0] === 'string') {
        // Array of URL strings
        return (files as string[]).map((url, index) => ({
          url,
          name: `${fieldName}_${index + 1}`,
          type: getFileType(url)
        }))
      } else {
        // Array of ImageFile objects
        return files as ImageFile[]
      }
    }
    
    return []
  }

  const getFileType = (url: string): 'image' | 'pdf' | 'document' => {
    const ext = url.toLowerCase().split('.').pop() || ''
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
      return 'image'
    } else if (ext === 'pdf') {
      return 'pdf'
    }
    return 'document'
  }

  const handleDownload = async (url: string, fileName: string) => {
    try {
      // Try to fetch and download
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/octet-stream',
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch file')
      }
      
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      
      // Generate proper filename
      const fileExtension = url.split('.').pop() || 'file'
      const finalFileName = fileName.includes('.') ? fileName : `${fileName}.${fileExtension}`
      
      link.download = finalFileName
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)
      
      toast({
        variant: "success",
        title: "Download Started",
        description: `Downloading ${finalFileName}`
      })
    } catch (error) {
      console.error('Download failed:', error)
      // Fallback to opening in new tab
      window.open(url, '_blank')
      
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: "Opening file in new tab instead"
      })
    }
  }

  const handleView = (url: string, name: string) => {
    setSelectedImage({ url, name })
  }

  const processedFiles = processFiles()

  if (processedFiles.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        No files uploaded
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm text-gray-700">
        {label} ({processedFiles.length} file{processedFiles.length !== 1 ? 's' : ''})
      </h4>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {processedFiles.map((file, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center space-x-2 mb-2">
              {file.type === 'image' ? (
                <ImageIcon className="h-4 w-4 text-blue-500" />
              ) : (
                <FileText className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm font-medium truncate flex-1" title={file.name}>
                {file.name}
              </span>
            </div>
            
            {file.type === 'image' && (
              <div className="mb-2">
                <img
                  src={file.url}
                  alt={file.name}
                  className="w-full h-20 object-cover rounded cursor-pointer"
                  onClick={() => handleView(file.url, file.name)}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    const parent = target.parentElement
                    if (parent) {
                      parent.innerHTML = `
                        <div class="w-full h-20 bg-gray-200 rounded flex items-center justify-center text-gray-500 text-xs">
                          <div class="text-center">
                            <div>Image unavailable</div>
                            <div class="text-xs mt-1">Click to try download</div>
                          </div>
                        </div>
                      `
                      parent.onclick = () => handleView(file.url, file.name)
                    }
                  }}
                />
              </div>
            )}
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => handleView(file.url, file.name)}
              >
                <Eye className="h-3 w-3 mr-1" />
                View
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => handleDownload(file.url, file.name)}
              >
                <Download className="h-3 w-3 mr-1" />
                Download
              </Button>
            </div>
          </div>
        ))}
      </div>
      
      {selectedImage && (
        <ImageViewModal
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          imageUrl={selectedImage.url}
          imageName={selectedImage.name}
          onDownload={() => handleDownload(selectedImage.url, selectedImage.name)}
        />
      )}
    </div>
  )
}