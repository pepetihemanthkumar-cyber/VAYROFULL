import { vehicles } from './vehicles'

/**
 * Asset-preparation manifest.
 *
 * Contains 1:1 asset status for all 207 fleet models (414 total 2-angle authentic photographs).
 */
export const vehicleImageAssetManifest = Object.freeze(
  vehicles.map((vehicle) => {
    const isVerifiedLocalAsset = vehicle.imageSource === 'local-authentic' || vehicle.imageSource === 'local-verified'
    const fullGallery = vehicle.images?.gallery || []
    const gallery2Angle = fullGallery.slice(0, 2)
    const galleryCount = gallery2Angle.length

    return Object.freeze({
      vehicleId: vehicle.id,
      brand: vehicle.brand,
      model: vehicle.model,
      category: vehicle.category,
      class: vehicle.class,
      imagePath: isVerifiedLocalAsset ? vehicle.images?.primary || vehicle.image : null,
      gallery: gallery2Angle,
      galleryCount,
      angles: ['Front 3/4', 'Rear 3/4'],
      imageSource: isVerifiedLocalAsset ? 'local-verified' : 'missing',
      status: isVerifiedLocalAsset && galleryCount === 2 ? 'verified' : 'awaiting-asset',
    })
  }),
)


export const vehicleImageAssetByVehicleId = Object.freeze(
  Object.fromEntries(vehicleImageAssetManifest.map((entry) => [entry.vehicleId, entry])),
)
