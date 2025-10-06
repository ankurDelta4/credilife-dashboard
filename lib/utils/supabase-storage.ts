import { v4 as uuidv4 } from 'uuid'

const SUPABASE_URL = 'https://axjfqvdhphkugutkovam.supabase.co'
const SUPABASE_STORAGE_BUCKET = 'credilife-bucket'

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

export async function uploadToSupabaseStorage(
  file: File,
  folder: string = 'images'
): Promise<UploadResult> {
  try {
    // For client-side, use NEXT_PUBLIC_API_KEY
    const apiKey = typeof window !== 'undefined' 
      ? process.env.NEXT_PUBLIC_API_KEY 
      : (process.env.NEXT_PUBLIC_API_KEY || process.env.API_KEY)
    
    if (!apiKey) {
      throw new Error('Supabase API key not found')
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop() || 'jpg'
    const fileName = `${uuidv4()}.${fileExtension}`
    const filePath = `${folder}/${fileName}`
    
    // Upload to Supabase Storage
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${SUPABASE_STORAGE_BUCKET}/${filePath}`
    
    const formData = new FormData()
    formData.append('', file)
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Upload failed: ${response.status} - ${errorText}`)
    }

    // Construct public URL
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_STORAGE_BUCKET}/${filePath}`
    
    return {
      success: true,
      url: publicUrl
    }
  } catch (error) {
    console.error('Supabase upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    }
  }
}

export async function uploadMultipleFiles(
  files: File[],
  folder: string = 'images'
): Promise<{ success: boolean; urls: string[]; errors: string[] }> {
  const results = await Promise.allSettled(
    files.map(file => uploadToSupabaseStorage(file, folder))
  )
  
  const urls: string[] = []
  const errors: string[] = []
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      if (result.value.success && result.value.url) {
        urls.push(result.value.url)
      } else {
        errors.push(`File ${files[index].name}: ${result.value.error}`)
      }
    } else {
      errors.push(`File ${files[index].name}: ${result.reason}`)
    }
  })
  
  return {
    success: errors.length === 0,
    urls,
    errors
  }
}