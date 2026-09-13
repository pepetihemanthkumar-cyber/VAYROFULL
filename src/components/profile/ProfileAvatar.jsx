import { AnimatePresence, motion } from 'framer-motion'
import { Camera, Image as ImageIcon, Loader2, Trash2, Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { cn } from '../../utils/cn'

function getInitials(name) {
  return (name || 'User')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function ProfileAvatar({
  user: userProp,
  size = 'md',
  editable = false,
  className,
  ariaLabel,
}) {
  const { user: authUser, profilePhoto, isLoadingPhoto, uploadProfilePhoto, removeProfilePhoto } = useAuth()
  const toast = useToast()
  const user = userProp || authUser

  const [isUploading, setIsUploading] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const containerRef = useRef(null)
  const fileInputRef = useRef(null)

  const initials = getInitials(user?.name)
  const hasPhoto = Boolean(profilePhoto)

  // Close menu on outside click or Escape
  useEffect(() => {
    if (!isMenuOpen) return

    function handleOutsideClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsMenuOpen(false)
      }
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMenuOpen])

  function handleTriggerClick() {
    if (!editable) return
    if (hasPhoto) {
      setIsMenuOpen((prev) => !prev)
    } else {
      fileInputRef.current?.click()
    }
  }

  function handleSelectNewFile() {
    setIsMenuOpen(false)
    fileInputRef.current?.click()
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0]
    // Reset file input so same file can be re-selected if desired
    event.target.value = ''

    if (!file) return

    setIsUploading(true)
    try {
      await uploadProfilePhoto(file)
      toast.success('Profile photo updated successfully.')
    } catch (err) {
      toast.error(err.message || 'Failed to update profile photo.')
    } finally {
      setIsUploading(false)
    }
  }

  async function handleRemovePhoto() {
    setIsMenuOpen(false)
    setIsUploading(true)
    try {
      await removeProfilePhoto()
      toast.info('Profile photo removed.')
    } catch (err) {
      toast.error(err.message || 'Failed to remove profile photo.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'profile-avatar-wrapper',
        `profile-avatar-wrapper--${size}`,
        editable && 'is-editable',
        className,
      )}
    >
      <div
        className={cn('profile-avatar', `profile-avatar--${size}`)}
        onClick={handleTriggerClick}
        role={editable ? 'button' : undefined}
        tabIndex={editable ? 0 : undefined}
        aria-label={ariaLabel || `${user?.name || 'User'} profile avatar`}
        aria-haspopup={editable && hasPhoto ? 'menu' : undefined}
        aria-expanded={editable && hasPhoto ? isMenuOpen : undefined}
        onKeyDown={(e) => {
          if (editable && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            handleTriggerClick()
          }
        }}
      >
        {/* Profile Image or Initials Fallback */}
        {hasPhoto ? (
          <img
            src={profilePhoto}
            alt={user?.name ? `${user.name}'s profile photo` : 'User profile photo'}
            className="profile-avatar-img"
            loading="eager"
          />
        ) : (
          <span className="profile-avatar-fallback" aria-hidden="true">
            {initials}
          </span>
        )}

        {/* Loading Spinner */}
        {(isUploading || isLoadingPhoto) && (
          <div className="profile-avatar-loading">
            <Loader2 className="spinner-icon" size={size === 'xl' ? 24 : 16} />
          </div>
        )}

        {/* Camera Hover Overlay for Editable Avatars */}
        {editable && !isUploading && !isLoadingPhoto && (
          <div className="profile-avatar-overlay" aria-hidden="true">
            <Camera size={size === 'xl' ? 22 : 16} strokeWidth={2} />
            {size === 'xl' && <span className="overlay-text">Change</span>}
          </div>
        )}
      </div>

      {/* Hidden Native File Input */}
      {editable && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="profile-avatar-file-input"
          tabIndex={-1}
          aria-hidden="true"
          onChange={handleFileChange}
        />
      )}

      {/* Popover Action Menu */}
      {editable && (
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              className="profile-avatar-menu"
              role="menu"
              initial={{ opacity: 0, y: 6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.96 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            >
              <button
                type="button"
                role="menuitem"
                className="avatar-menu-item"
                onClick={handleSelectNewFile}
              >
                <Upload size={14} aria-hidden="true" />
                <span>Change photo</span>
              </button>
              <button
                type="button"
                role="menuitem"
                className="avatar-menu-item avatar-menu-item--danger"
                onClick={handleRemovePhoto}
              >
                <Trash2 size={14} aria-hidden="true" />
                <span>Remove photo</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}
