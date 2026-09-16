/**
 * Local IndexedDB Storage for VAYRO Customer Profile Photos
 * Frontend-only persistence without server/backend dependencies.
 */

const DB_NAME = 'vayro_db'
const DB_VERSION = 1
const STORE_NAME = 'profile_photos'
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_DIMENSION = 512 // 512x512 max bounds for fast local storage and rendering

export const PROFILE_PHOTO_EVENT = 'vayro:profile-photo-updated'

/**
 * Open or initialize IndexedDB database
 * @returns {Promise<IDBDatabase>}
 */
function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment.'))
      return
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'userId' })
      }
    }

    request.onsuccess = (event) => {
      resolve(event.target.result)
    }

    request.onerror = (event) => {
      reject(event.target.error || new Error('Failed to open profile photo database.'))
    }
  })
}

/**
 * Optimize / resize image using HTML5 Canvas
 * @param {File|Blob} file 
 * @returns {Promise<string>} Base64 DataURL
 */
function resizeAndOptimizeImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (readerEvent) => {
      const img = new Image()

      img.onload = () => {
        let width = img.width
        let height = img.height

        // Calculate aspect-ratio preserving dimensions
        if (width > height) {
          if (width > MAX_DIMENSION) {
            height = Math.round((height * MAX_DIMENSION) / width)
            width = MAX_DIMENSION
          }
        } else {
          if (height > MAX_DIMENSION) {
            width = Math.round((width * MAX_DIMENSION) / height)
            height = MAX_DIMENSION
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          // Fallback to raw dataURL if canvas context unavailable
          resolve(readerEvent.target.result)
          return
        }

        // Use high quality image smoothing
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, width, height)

        // Prefer WebP or JPEG for optimized storage
        const outputMime = file.type === 'image/png' ? 'image/png' : 'image/webp'
        const quality = outputMime === 'image/png' ? undefined : 0.92

        try {
          const optimizedDataUrl = canvas.toDataURL(outputMime, quality)
          resolve(optimizedDataUrl)
        } catch {
          resolve(readerEvent.target.result)
        }
      }

      img.onerror = () => {
        reject(new Error('Failed to parse selected image.'))
      }

      img.src = readerEvent.target.result
    }

    reader.onerror = () => {
      reject(new Error('Failed to read image file.'))
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Validate image file
 * @param {File} file 
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateProfileImageFile(file) {
  if (!file) {
    return { valid: false, error: 'No file was selected.' }
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Please select a valid image file (JPG, PNG, or WEBP).',
    }
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the maximum limit of 5 MB.`,
    }
  }

  return { valid: true }
}

/**
 * Get profile photo data URL for a user
 * @param {string} userId 
 * @returns {Promise<string|null>}
 */
export async function getProfilePhoto(userId) {
  if (!userId) return null

  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(userId)

      request.onsuccess = () => {
        const result = request.result
        resolve(result?.dataUrl || null)
      }

      request.onerror = () => {
        resolve(null)
      }
    })
  } catch (err) {
    console.warn('[ProfilePhotoStorage] Could not load photo from IndexedDB:', err)
    return null
  }
}

/**
 * Save profile photo for a user
 * @param {string} userId 
 * @param {File} file 
 * @returns {Promise<string>} Saved data URL
 */
export async function saveProfilePhoto(userId, file) {
  if (!userId) {
    throw new Error('User ID is required to save profile photo.')
  }

  const validation = validateProfileImageFile(file)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  const dataUrl = await resizeAndOptimizeImage(file)
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    const record = {
      userId,
      dataUrl,
      fileName: file.name,
      mimeType: file.type,
      updatedAt: new Date().toISOString(),
    }

    const request = store.put(record)

    request.onsuccess = () => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent(PROFILE_PHOTO_EVENT, {
            detail: { userId, dataUrl },
          }),
        )
      }
      resolve(dataUrl)
    }

    request.onerror = (event) => {
      reject(event.target.error || new Error('Failed to save profile photo to IndexedDB.'))
    }
  })
}

/**
 * Remove profile photo for a user
 * @param {string} userId 
 * @returns {Promise<boolean>}
 */
export async function removeProfilePhoto(userId) {
  if (!userId) return false

  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(userId)

      request.onsuccess = () => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent(PROFILE_PHOTO_EVENT, {
              detail: { userId, dataUrl: null },
            }),
          )
        }
        resolve(true)
      }

      request.onerror = (event) => {
        reject(event.target.error || new Error('Failed to delete profile photo.'))
      }
    })
  } catch (err) {
    console.warn('[ProfilePhotoStorage] Could not remove photo from IndexedDB:', err)
    return false
  }
}
