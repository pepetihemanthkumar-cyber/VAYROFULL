import { cn } from '../../utils/cn'
import fallbackVehicleImage from '../../assets/vehicle-catalogue.png'
import { useEffect, useState } from 'react'

export function VehicleImage({ vehicle, className, priority = false }) {
  if (!vehicle) return null

  const imageCandidates = [vehicle.image, vehicle.images?.primary, ...(vehicle.images?.gallery || []), fallbackVehicleImage]
    .filter(Boolean)
    .filter((source, index, sources) => sources.indexOf(source) === index)
  const [imageIndex, setImageIndex] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const imageSource = imageCandidates[imageIndex] || fallbackVehicleImage
  const isCustomUrl = typeof imageSource === 'string' && (imageSource.startsWith('http') || imageSource.startsWith('data:') || imageSource.startsWith('/'))
  const imageLabel = vehicle.imageSource === 'fallback' ? `${vehicle.name} image, VAYRO fallback` : `${vehicle.name} vehicle image`

  useEffect(() => {
    setImageIndex(0)
    setIsLoaded(false)
  }, [vehicle.id, vehicle.image, vehicle.images?.primary])

  function handleImageError() {
    setImageIndex((index) => Math.min(index + 1, imageCandidates.length - 1))
    setIsLoaded(false)
  }

  const objectPosition = vehicle.imagePosition && !['top left', 'top right', 'bottom left', 'bottom right'].includes(vehicle.imagePosition)
    ? vehicle.imagePosition
    : 'center'

  return (
    <div
      className={cn('vehicle-image', !isCustomUrl || isLoaded ? 'is-loaded' : 'is-loading', className)}
      role="img"
      aria-label={imageLabel}
      data-priority={priority || undefined}
      style={{
        backgroundImage: isCustomUrl ? undefined : `url(${imageSource})`,
        backgroundPosition: isCustomUrl ? undefined : objectPosition,
      }}
    >
      {isCustomUrl && (
        <img
          src={imageSource}
          alt={vehicle.name || 'Vehicle'}
          loading={priority ? 'eager' : 'lazy'}
          onLoad={() => setIsLoaded(true)}
          onError={handleImageError}
          className={cn('vehicle-img-tag', isLoaded ? 'is-loaded' : 'is-loading')}
          style={{ objectPosition }}
        />
      )}
    </div>
  )
}
