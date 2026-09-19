import { bikes, bikeImageMap, bikeCatalogue, ALLOWED_BIKE_BRANDS, ALLOWED_BIKE_CATEGORIES, ALLOWED_BIKE_CLASSES } from './bikes.js'
import vehicleCatalogueImage from '../assets/vehicle-catalogue.png'
import marutiSuzukiSwiftImageFront from '../assets/vehicles/maruti-suzuki/swift/swift-front.webp'
import marutiSuzukiSwiftImageRear from '../assets/vehicles/maruti-suzuki/swift/swift-rear.webp'
import marutiSuzukiSwiftImageSide from '../assets/vehicles/maruti-suzuki/swift/swift-side.webp'
import marutiSuzukiBalenoImageFront from '../assets/vehicles/maruti-suzuki/baleno/baleno-front.webp'
import marutiSuzukiBalenoImageRear from '../assets/vehicles/maruti-suzuki/baleno/baleno-rear.webp'
import marutiSuzukiBalenoImageSide from '../assets/vehicles/maruti-suzuki/baleno/baleno-side.webp'
import marutiSuzukiDzireImageFront from '../assets/vehicles/maruti-suzuki/dzire/dzire-front.webp'
import marutiSuzukiDzireImageRear from '../assets/vehicles/maruti-suzuki/dzire/dzire-rear.webp'
import marutiSuzukiDzireImageSide from '../assets/vehicles/maruti-suzuki/dzire/dzire-side.webp'
import marutiSuzukiFronxImageFront from '../assets/vehicles/maruti-suzuki/fronx/fronx-front.webp'
import marutiSuzukiFronxImageRear from '../assets/vehicles/maruti-suzuki/fronx/fronx-rear.webp'
import marutiSuzukiFronxImageSide from '../assets/vehicles/maruti-suzuki/fronx/fronx-side.webp'
import marutiSuzukiBrezzaImageFront from '../assets/vehicles/maruti-suzuki/brezza/brezza-front.webp'
import marutiSuzukiBrezzaImageRear from '../assets/vehicles/maruti-suzuki/brezza/brezza-rear.webp'
import marutiSuzukiBrezzaImageSide from '../assets/vehicles/maruti-suzuki/brezza/brezza-side.webp'
import marutiSuzukiGrandVitaraImageFront from '../assets/vehicles/maruti-suzuki/grand-vitara/grand-vitara-front.webp'
import marutiSuzukiGrandVitaraImageRear from '../assets/vehicles/maruti-suzuki/grand-vitara/grand-vitara-rear.webp'
import marutiSuzukiGrandVitaraImageSide from '../assets/vehicles/maruti-suzuki/grand-vitara/grand-vitara-side.webp'
import marutiSuzukiErtigaImageFront from '../assets/vehicles/maruti-suzuki/ertiga/ertiga-front.webp'
import marutiSuzukiErtigaImageRear from '../assets/vehicles/maruti-suzuki/ertiga/ertiga-rear.webp'
import marutiSuzukiErtigaImageSide from '../assets/vehicles/maruti-suzuki/ertiga/ertiga-side.webp'
import marutiSuzukiXl6ImageFront from '../assets/vehicles/maruti-suzuki/xl6/xl6-front.webp'
import marutiSuzukiXl6ImageRear from '../assets/vehicles/maruti-suzuki/xl6/xl6-rear.webp'
import marutiSuzukiXl6ImageSide from '../assets/vehicles/maruti-suzuki/xl6/xl6-side.webp'
import marutiSuzukiJimnyImageFront from '../assets/vehicles/maruti-suzuki/jimny/jimny-front.webp'
import marutiSuzukiJimnyImageRear from '../assets/vehicles/maruti-suzuki/jimny/jimny-rear.webp'
import marutiSuzukiJimnyImageSide from '../assets/vehicles/maruti-suzuki/jimny/jimny-side.webp'
import marutiSuzukiInvictoImageFront from '../assets/vehicles/maruti-suzuki/invicto/invicto-front.webp'
import marutiSuzukiInvictoImageRear from '../assets/vehicles/maruti-suzuki/invicto/invicto-rear.webp'
import marutiSuzukiInvictoImageSide from '../assets/vehicles/maruti-suzuki/invicto/invicto-side.webp'
import tataTiagoImageFront from '../assets/vehicles/tata/tiago/tiago-front.webp'
import tataTiagoImageRear from '../assets/vehicles/tata/tiago/tiago-rear.webp'
import tataTiagoImageSide from '../assets/vehicles/tata/tiago/tiago-side.webp'
import tataAltrozImageFront from '../assets/vehicles/tata/altroz/altroz-front.webp'
import tataAltrozImageRear from '../assets/vehicles/tata/altroz/altroz-rear.webp'
import tataAltrozImageSide from '../assets/vehicles/tata/altroz/altroz-side.webp'
import tataTigorImageFront from '../assets/vehicles/tata/tigor/tigor-front.webp'
import tataTigorImageRear from '../assets/vehicles/tata/tigor/tigor-rear.webp'
import tataTigorImageSide from '../assets/vehicles/tata/tigor/tigor-side.webp'
import tataPunchImageFront from '../assets/vehicles/tata/punch/punch-front.webp'
import tataPunchImageRear from '../assets/vehicles/tata/punch/punch-rear.webp'
import tataPunchImageSide from '../assets/vehicles/tata/punch/punch-side.webp'
import tataNexonImageFront from '../assets/vehicles/tata/nexon/nexon-front.webp'
import tataNexonImageRear from '../assets/vehicles/tata/nexon/nexon-rear.webp'
import tataNexonImageSide from '../assets/vehicles/tata/nexon/nexon-side.webp'
import tataHarrierImageFront from '../assets/vehicles/tata/harrier/harrier-front.webp'
import tataHarrierImageRear from '../assets/vehicles/tata/harrier/harrier-rear.webp'
import tataHarrierImageSide from '../assets/vehicles/tata/harrier/harrier-side.webp'
import tataSafariImageFront from '../assets/vehicles/tata/safari/safari-front.webp'
import tataSafariImageRear from '../assets/vehicles/tata/safari/safari-rear.webp'
import tataSafariImageSide from '../assets/vehicles/tata/safari/safari-side.webp'
import tataCurvvImageFront from '../assets/vehicles/tata/curvv/curvv-front.webp'
import tataCurvvImageRear from '../assets/vehicles/tata/curvv/curvv-rear.webp'
import tataCurvvImageSide from '../assets/vehicles/tata/curvv/curvv-side.webp'
import tataNexonEvImageFront from '../assets/vehicles/tata/nexon-ev/nexon-ev-front.webp'
import tataNexonEvImageRear from '../assets/vehicles/tata/nexon-ev/nexon-ev-rear.webp'
import tataNexonEvImageSide from '../assets/vehicles/tata/nexon-ev/nexon-ev-side.webp'
import tataPunchEvImageFront from '../assets/vehicles/tata/punch-ev/punch-ev-front.webp'
import tataPunchEvImageRear from '../assets/vehicles/tata/punch-ev/punch-ev-rear.webp'
import tataPunchEvImageSide from '../assets/vehicles/tata/punch-ev/punch-ev-side.webp'
import mahindraXuv3xoImageFront from '../assets/vehicles/mahindra/xuv-3xo/xuv-3xo-front.webp'
import mahindraXuv3xoImageRear from '../assets/vehicles/mahindra/xuv-3xo/xuv-3xo-rear.webp'
import mahindraXuv3xoImageSide from '../assets/vehicles/mahindra/xuv-3xo/xuv-3xo-side.webp'
import mahindraXuv700ImageFront from '../assets/vehicles/mahindra/xuv700/xuv700-front.webp'
import mahindraXuv700ImageRear from '../assets/vehicles/mahindra/xuv700/xuv700-rear.webp'
import mahindraXuv700ImageSide from '../assets/vehicles/mahindra/xuv700/xuv700-side.webp'
import mahindraScorpioImageFront from '../assets/vehicles/mahindra/scorpio/scorpio-front.webp'
import mahindraScorpioImageRear from '../assets/vehicles/mahindra/scorpio/scorpio-rear.webp'
import mahindraScorpioImageSide from '../assets/vehicles/mahindra/scorpio/scorpio-side.webp'
import mahindraScorpioNImageFront from '../assets/vehicles/mahindra/scorpio-n/scorpio-n-front.webp'
import mahindraScorpioNImageRear from '../assets/vehicles/mahindra/scorpio-n/scorpio-n-rear.webp'
import mahindraScorpioNImageSide from '../assets/vehicles/mahindra/scorpio-n/scorpio-n-side.webp'
import mahindraTharImageFront from '../assets/vehicles/mahindra/thar/thar-front.webp'
import mahindraTharImageRear from '../assets/vehicles/mahindra/thar/thar-rear.webp'
import mahindraTharImageSide from '../assets/vehicles/mahindra/thar/thar-side.webp'
import mahindraBoleroImageFront from '../assets/vehicles/mahindra/bolero/bolero-front.webp'
import mahindraBoleroImageRear from '../assets/vehicles/mahindra/bolero/bolero-rear.webp'
import mahindraBoleroImageSide from '../assets/vehicles/mahindra/bolero/bolero-side.webp'
import mahindraBoleroNeoImageFront from '../assets/vehicles/mahindra/bolero-neo/bolero-neo-front.webp'
import mahindraBoleroNeoImageRear from '../assets/vehicles/mahindra/bolero-neo/bolero-neo-rear.webp'
import mahindraBoleroNeoImageSide from '../assets/vehicles/mahindra/bolero-neo/bolero-neo-side.webp'
import mahindraMarazzoImageFront from '../assets/vehicles/mahindra/marazzo/marazzo-front.webp'
import mahindraMarazzoImageRear from '../assets/vehicles/mahindra/marazzo/marazzo-rear.webp'
import mahindraMarazzoImageSide from '../assets/vehicles/mahindra/marazzo/marazzo-side.webp'
import hyundaiGrandI10NiosImageFront from '../assets/vehicles/hyundai/grand-i10-nios/grand-i10-nios-front.webp'
import hyundaiGrandI10NiosImageRear from '../assets/vehicles/hyundai/grand-i10-nios/grand-i10-nios-rear.webp'
import hyundaiGrandI10NiosImageSide from '../assets/vehicles/hyundai/grand-i10-nios/grand-i10-nios-side.webp'
import hyundaiI20ImageFront from '../assets/vehicles/hyundai/i20/i20-front.webp'
import hyundaiI20ImageRear from '../assets/vehicles/hyundai/i20/i20-rear.webp'
import hyundaiI20ImageSide from '../assets/vehicles/hyundai/i20/i20-side.webp'
import hyundaiAuraImageFront from '../assets/vehicles/hyundai/aura/aura-front.webp'
import hyundaiAuraImageRear from '../assets/vehicles/hyundai/aura/aura-rear.webp'
import hyundaiAuraImageSide from '../assets/vehicles/hyundai/aura/aura-side.webp'
import hyundaiVernaImageFront from '../assets/vehicles/hyundai/verna/verna-front.webp'
import hyundaiVernaImageRear from '../assets/vehicles/hyundai/verna/verna-rear.webp'
import hyundaiVernaImageSide from '../assets/vehicles/hyundai/verna/verna-side.webp'
import hyundaiExterImageFront from '../assets/vehicles/hyundai/exter/exter-front.webp'
import hyundaiExterImageRear from '../assets/vehicles/hyundai/exter/exter-rear.webp'
import hyundaiExterImageSide from '../assets/vehicles/hyundai/exter/exter-side.webp'
import hyundaiVenueImageFront from '../assets/vehicles/hyundai/venue/venue-front.webp'
import hyundaiVenueImageRear from '../assets/vehicles/hyundai/venue/venue-rear.webp'
import hyundaiVenueImageSide from '../assets/vehicles/hyundai/venue/venue-side.webp'
import hyundaiCretaImageFront from '../assets/vehicles/hyundai/creta/creta-front.webp'
import hyundaiCretaImageRear from '../assets/vehicles/hyundai/creta/creta-rear.webp'
import hyundaiCretaImageSide from '../assets/vehicles/hyundai/creta/creta-side.webp'
import hyundaiAlcazarImageFront from '../assets/vehicles/hyundai/alcazar/alcazar-front.webp'
import hyundaiAlcazarImageRear from '../assets/vehicles/hyundai/alcazar/alcazar-rear.webp'
import hyundaiAlcazarImageSide from '../assets/vehicles/hyundai/alcazar/alcazar-side.webp'
import hyundaiTucsonImageFront from '../assets/vehicles/hyundai/tucson/tucson-front.webp'
import hyundaiTucsonImageRear from '../assets/vehicles/hyundai/tucson/tucson-rear.webp'
import hyundaiTucsonImageSide from '../assets/vehicles/hyundai/tucson/tucson-side.webp'
import hyundaiIoniq5ImageFront from '../assets/vehicles/hyundai/ioniq-5/ioniq-5-front.webp'
import hyundaiIoniq5ImageRear from '../assets/vehicles/hyundai/ioniq-5/ioniq-5-rear.webp'
import hyundaiIoniq5ImageSide from '../assets/vehicles/hyundai/ioniq-5/ioniq-5-side.webp'
import kiaSonetImageFront from '../assets/vehicles/kia/sonet/sonet-front.webp'
import kiaSonetImageRear from '../assets/vehicles/kia/sonet/sonet-rear.webp'
import kiaSonetImageSide from '../assets/vehicles/kia/sonet/sonet-side.webp'
import kiaSeltosImageFront from '../assets/vehicles/kia/seltos/seltos-front.webp'
import kiaSeltosImageRear from '../assets/vehicles/kia/seltos/seltos-rear.webp'
import kiaSeltosImageSide from '../assets/vehicles/kia/seltos/seltos-side.webp'
import kiaCarensImageFront from '../assets/vehicles/kia/carens/carens-front.webp'
import kiaCarensImageRear from '../assets/vehicles/kia/carens/carens-rear.webp'
import kiaCarensImageSide from '../assets/vehicles/kia/carens/carens-side.webp'
import kiaCarnivalImageFront from '../assets/vehicles/kia/carnival/carnival-front.webp'
import kiaCarnivalImageRear from '../assets/vehicles/kia/carnival/carnival-rear.webp'
import kiaCarnivalImageSide from '../assets/vehicles/kia/carnival/carnival-side.webp'
import kiaEv6ImageFront from '../assets/vehicles/kia/ev6/ev6-front.webp'
import kiaEv6ImageRear from '../assets/vehicles/kia/ev6/ev6-rear.webp'
import kiaEv6ImageSide from '../assets/vehicles/kia/ev6/ev6-side.webp'
import toyotaGlanzaImageFront from '../assets/vehicles/toyota/glanza/glanza-front.webp'
import toyotaGlanzaImageRear from '../assets/vehicles/toyota/glanza/glanza-rear.webp'
import toyotaGlanzaImageSide from '../assets/vehicles/toyota/glanza/glanza-side.webp'
import toyotaUrbanCruiserTaisorImageFront from '../assets/vehicles/toyota/urban-cruiser-taisor/urban-cruiser-taisor-front.webp'
import toyotaUrbanCruiserTaisorImageRear from '../assets/vehicles/toyota/urban-cruiser-taisor/urban-cruiser-taisor-rear.webp'
import toyotaUrbanCruiserTaisorImageSide from '../assets/vehicles/toyota/urban-cruiser-taisor/urban-cruiser-taisor-side.webp'
import toyotaUrbanCruiserHyryderImageFront from '../assets/vehicles/toyota/urban-cruiser-hyryder/urban-cruiser-hyryder-front.webp'
import toyotaUrbanCruiserHyryderImageRear from '../assets/vehicles/toyota/urban-cruiser-hyryder/urban-cruiser-hyryder-rear.webp'
import toyotaUrbanCruiserHyryderImageSide from '../assets/vehicles/toyota/urban-cruiser-hyryder/urban-cruiser-hyryder-side.webp'
import toyotaRumionImageFront from '../assets/vehicles/toyota/rumion/rumion-front.webp'
import toyotaRumionImageRear from '../assets/vehicles/toyota/rumion/rumion-rear.webp'
import toyotaRumionImageSide from '../assets/vehicles/toyota/rumion/rumion-side.webp'
import toyotaInnovaCrystaImageFront from '../assets/vehicles/toyota/innova-crysta/innova-crysta-front.webp'
import toyotaInnovaCrystaImageRear from '../assets/vehicles/toyota/innova-crysta/innova-crysta-rear.webp'
import toyotaInnovaCrystaImageSide from '../assets/vehicles/toyota/innova-crysta/innova-crysta-side.webp'
import toyotaInnovaHycrossImageFront from '../assets/vehicles/toyota/innova-hycross/innova-hycross-front.webp'
import toyotaInnovaHycrossImageRear from '../assets/vehicles/toyota/innova-hycross/innova-hycross-rear.webp'
import toyotaInnovaHycrossImageSide from '../assets/vehicles/toyota/innova-hycross/innova-hycross-side.webp'
import toyotaFortunerImageFront from '../assets/vehicles/toyota/fortuner/fortuner-front.webp'
import toyotaFortunerImageRear from '../assets/vehicles/toyota/fortuner/fortuner-rear.webp'
import toyotaFortunerImageSide from '../assets/vehicles/toyota/fortuner/fortuner-side.webp'
import toyotaLegenderImageFront from '../assets/vehicles/toyota/legender/legender-front.webp'
import toyotaLegenderImageRear from '../assets/vehicles/toyota/legender/legender-rear.webp'
import toyotaLegenderImageSide from '../assets/vehicles/toyota/legender/legender-side.webp'
import toyotaHiluxImageFront from '../assets/vehicles/toyota/hilux/hilux-front.webp'
import toyotaHiluxImageRear from '../assets/vehicles/toyota/hilux/hilux-rear.webp'
import toyotaHiluxImageSide from '../assets/vehicles/toyota/hilux/hilux-side.webp'
import toyotaCamryImageFront from '../assets/vehicles/toyota/camry/camry-front.webp'
import toyotaCamryImageRear from '../assets/vehicles/toyota/camry/camry-rear.webp'
import toyotaCamryImageSide from '../assets/vehicles/toyota/camry/camry-side.webp'
import toyotaLandCruiserImageFront from '../assets/vehicles/toyota/land-cruiser/land-cruiser-front.webp'
import toyotaLandCruiserImageRear from '../assets/vehicles/toyota/land-cruiser/land-cruiser-rear.webp'
import toyotaLandCruiserImageSide from '../assets/vehicles/toyota/land-cruiser/land-cruiser-side.webp'
import toyotaVellfireImageFront from '../assets/vehicles/toyota/vellfire/vellfire-front.webp'
import toyotaVellfireImageRear from '../assets/vehicles/toyota/vellfire/vellfire-rear.webp'
import toyotaVellfireImageSide from '../assets/vehicles/toyota/vellfire/vellfire-side.webp'
import hondaAmazeImageFront from '../assets/vehicles/honda/amaze/amaze-front.webp'
import hondaAmazeImageRear from '../assets/vehicles/honda/amaze/amaze-rear.webp'
import hondaAmazeImageSide from '../assets/vehicles/honda/amaze/amaze-side.webp'
import hondaCityImageFront from '../assets/vehicles/honda/city/city-front.webp'
import hondaCityImageRear from '../assets/vehicles/honda/city/city-rear.webp'
import hondaCityImageSide from '../assets/vehicles/honda/city/city-side.webp'
import hondaElevateImageFront from '../assets/vehicles/honda/elevate/elevate-front.webp'
import hondaElevateImageRear from '../assets/vehicles/honda/elevate/elevate-rear.webp'
import hondaElevateImageSide from '../assets/vehicles/honda/elevate/elevate-side.webp'
import hondaCityEHevImageFront from '../assets/vehicles/honda/city-e-hev/city-e-hev-front.webp'
import hondaCityEHevImageRear from '../assets/vehicles/honda/city-e-hev/city-e-hev-rear.webp'
import hondaCityEHevImageSide from '../assets/vehicles/honda/city-e-hev/city-e-hev-side.webp'
import renaultKwidImageFront from '../assets/vehicles/renault/kwid/kwid-front.webp'
import renaultKwidImageRear from '../assets/vehicles/renault/kwid/kwid-rear.webp'
import renaultKwidImageSide from '../assets/vehicles/renault/kwid/kwid-side.webp'
import renaultTriberImageFront from '../assets/vehicles/renault/triber/triber-front.webp'
import renaultTriberImageRear from '../assets/vehicles/renault/triber/triber-rear.webp'
import renaultTriberImageSide from '../assets/vehicles/renault/triber/triber-side.webp'
import renaultKigerImageFront from '../assets/vehicles/renault/kiger/kiger-front.webp'
import renaultKigerImageRear from '../assets/vehicles/renault/kiger/kiger-rear.webp'
import renaultKigerImageSide from '../assets/vehicles/renault/kiger/kiger-side.webp'
import renaultDusterImageFront from '../assets/vehicles/renault/duster/duster-front.webp'
import renaultDusterImageRear from '../assets/vehicles/renault/duster/duster-rear.webp'
import renaultDusterImageSide from '../assets/vehicles/renault/duster/duster-side.webp'
import nissanMagniteImageFront from '../assets/vehicles/nissan/magnite/magnite-front.webp'
import nissanMagniteImageRear from '../assets/vehicles/nissan/magnite/magnite-rear.webp'
import nissanMagniteImageSide from '../assets/vehicles/nissan/magnite/magnite-side.webp'
import nissanXTrailImageFront from '../assets/vehicles/nissan/x-trail/x-trail-front.webp'
import nissanXTrailImageRear from '../assets/vehicles/nissan/x-trail/x-trail-rear.webp'
import nissanXTrailImageSide from '../assets/vehicles/nissan/x-trail/x-trail-side.webp'
import volkswagenVirtusImageFront from '../assets/vehicles/volkswagen/virtus/virtus-front.webp'
import volkswagenVirtusImageRear from '../assets/vehicles/volkswagen/virtus/virtus-rear.webp'
import volkswagenVirtusImageSide from '../assets/vehicles/volkswagen/virtus/virtus-side.webp'
import volkswagenTaigunImageFront from '../assets/vehicles/volkswagen/taigun/taigun-front.webp'
import volkswagenTaigunImageRear from '../assets/vehicles/volkswagen/taigun/taigun-rear.webp'
import volkswagenTaigunImageSide from '../assets/vehicles/volkswagen/taigun/taigun-side.webp'
import volkswagenTiguanImageFront from '../assets/vehicles/volkswagen/tiguan/tiguan-front.webp'
import volkswagenTiguanImageRear from '../assets/vehicles/volkswagen/tiguan/tiguan-rear.webp'
import volkswagenTiguanImageSide from '../assets/vehicles/volkswagen/tiguan/tiguan-side.webp'
import skodaSlaviaImageFront from '../assets/vehicles/skoda/slavia/slavia-front.webp'
import skodaSlaviaImageRear from '../assets/vehicles/skoda/slavia/slavia-rear.webp'
import skodaSlaviaImageSide from '../assets/vehicles/skoda/slavia/slavia-side.webp'
import skodaKushaqImageFront from '../assets/vehicles/skoda/kushaq/kushaq-front.webp'
import skodaKushaqImageRear from '../assets/vehicles/skoda/kushaq/kushaq-rear.webp'
import skodaKushaqImageSide from '../assets/vehicles/skoda/kushaq/kushaq-side.webp'
import skodaKodiaqImageFront from '../assets/vehicles/skoda/kodiaq/kodiaq-front.webp'
import skodaKodiaqImageRear from '../assets/vehicles/skoda/kodiaq/kodiaq-rear.webp'
import skodaKodiaqImageSide from '../assets/vehicles/skoda/kodiaq/kodiaq-side.webp'
import skodaSuperbImageFront from '../assets/vehicles/skoda/superb/superb-front.webp'
import skodaSuperbImageRear from '../assets/vehicles/skoda/superb/superb-rear.webp'
import skodaSuperbImageSide from '../assets/vehicles/skoda/superb/superb-side.webp'
import mgCometEvImageFront from '../assets/vehicles/mg/comet-ev/comet-ev-front.webp'
import mgCometEvImageRear from '../assets/vehicles/mg/comet-ev/comet-ev-rear.webp'
import mgCometEvImageSide from '../assets/vehicles/mg/comet-ev/comet-ev-side.webp'
import mgAstorImageFront from '../assets/vehicles/mg/astor/astor-front.webp'
import mgAstorImageRear from '../assets/vehicles/mg/astor/astor-rear.webp'
import mgAstorImageSide from '../assets/vehicles/mg/astor/astor-side.webp'
import mgHectorImageFront from '../assets/vehicles/mg/hector/hector-front.webp'
import mgHectorImageRear from '../assets/vehicles/mg/hector/hector-rear.webp'
import mgHectorImageSide from '../assets/vehicles/mg/hector/hector-side.webp'
import mgHectorPlusImageFront from '../assets/vehicles/mg/hector-plus/hector-plus-front.webp'
import mgHectorPlusImageRear from '../assets/vehicles/mg/hector-plus/hector-plus-rear.webp'
import mgHectorPlusImageSide from '../assets/vehicles/mg/hector-plus/hector-plus-side.webp'
import mgZsEvImageFront from '../assets/vehicles/mg/zs-ev/zs-ev-front.webp'
import mgZsEvImageRear from '../assets/vehicles/mg/zs-ev/zs-ev-rear.webp'
import mgZsEvImageSide from '../assets/vehicles/mg/zs-ev/zs-ev-side.webp'
import mgGlosterImageFront from '../assets/vehicles/mg/gloster/gloster-front.webp'
import mgGlosterImageRear from '../assets/vehicles/mg/gloster/gloster-rear.webp'
import mgGlosterImageSide from '../assets/vehicles/mg/gloster/gloster-side.webp'
import mgWindsorEvImageFront from '../assets/vehicles/mg/windsor-ev/windsor-ev-front.webp'
import mgWindsorEvImageRear from '../assets/vehicles/mg/windsor-ev/windsor-ev-rear.webp'
import mgWindsorEvImageSide from '../assets/vehicles/mg/windsor-ev/windsor-ev-side.webp'
import jeepCompassImageFront from '../assets/vehicles/jeep/compass/compass-front.webp'
import jeepCompassImageRear from '../assets/vehicles/jeep/compass/compass-rear.webp'
import jeepCompassImageSide from '../assets/vehicles/jeep/compass/compass-side.webp'
import jeepMeridianImageFront from '../assets/vehicles/jeep/meridian/meridian-front.webp'
import jeepMeridianImageRear from '../assets/vehicles/jeep/meridian/meridian-rear.webp'
import jeepMeridianImageSide from '../assets/vehicles/jeep/meridian/meridian-side.webp'
import jeepWranglerImageFront from '../assets/vehicles/jeep/wrangler/wrangler-front.webp'
import jeepWranglerImageRear from '../assets/vehicles/jeep/wrangler/wrangler-rear.webp'
import jeepWranglerImageSide from '../assets/vehicles/jeep/wrangler/wrangler-side.webp'
import jeepGrandCherokeeImageFront from '../assets/vehicles/jeep/grand-cherokee/grand-cherokee-front.webp'
import jeepGrandCherokeeImageRear from '../assets/vehicles/jeep/grand-cherokee/grand-cherokee-rear.webp'
import jeepGrandCherokeeImageSide from '../assets/vehicles/jeep/grand-cherokee/grand-cherokee-side.webp'
import bmw2SeriesImageFront from '../assets/vehicles/bmw/2-series/2-series-front.webp'
import bmw2SeriesImageRear from '../assets/vehicles/bmw/2-series/2-series-rear.webp'
import bmw2SeriesImageSide from '../assets/vehicles/bmw/2-series/2-series-side.webp'
import bmw3SeriesImageFront from '../assets/vehicles/bmw/3-series/3-series-front.webp'
import bmw3SeriesImageRear from '../assets/vehicles/bmw/3-series/3-series-rear.webp'
import bmw3SeriesImageSide from '../assets/vehicles/bmw/3-series/3-series-side.webp'
import bmw5SeriesImageFront from '../assets/vehicles/bmw/5-series/5-series-front.webp'
import bmw5SeriesImageRear from '../assets/vehicles/bmw/5-series/5-series-rear.webp'
import bmw5SeriesImageSide from '../assets/vehicles/bmw/5-series/5-series-side.webp'
import bmwX1ImageFront from '../assets/vehicles/bmw/x1/x1-front.webp'
import bmwX1ImageRear from '../assets/vehicles/bmw/x1/x1-rear.webp'
import bmwX1ImageSide from '../assets/vehicles/bmw/x1/x1-side.webp'
import bmwX3ImageFront from '../assets/vehicles/bmw/x3/x3-front.webp'
import bmwX3ImageRear from '../assets/vehicles/bmw/x3/x3-rear.webp'
import bmwX3ImageSide from '../assets/vehicles/bmw/x3/x3-side.webp'
import bmwX5ImageFront from '../assets/vehicles/bmw/x5/x5-front.webp'
import bmwX5ImageRear from '../assets/vehicles/bmw/x5/x5-rear.webp'
import bmwX5ImageSide from '../assets/vehicles/bmw/x5/x5-side.webp'
import bmwX7ImageFront from '../assets/vehicles/bmw/x7/x7-front.webp'
import bmwX7ImageRear from '../assets/vehicles/bmw/x7/x7-rear.webp'
import bmwX7ImageSide from '../assets/vehicles/bmw/x7/x7-side.webp'
import bmwI4ImageFront from '../assets/vehicles/bmw/i4/i4-front.webp'
import bmwI4ImageRear from '../assets/vehicles/bmw/i4/i4-rear.webp'
import bmwI4ImageSide from '../assets/vehicles/bmw/i4/i4-side.webp'
import bmwI5ImageFront from '../assets/vehicles/bmw/i5/i5-front.webp'
import bmwI5ImageRear from '../assets/vehicles/bmw/i5/i5-rear.webp'
import bmwI5ImageSide from '../assets/vehicles/bmw/i5/i5-side.webp'
import bmwI7ImageFront from '../assets/vehicles/bmw/i7/i7-front.webp'
import bmwI7ImageRear from '../assets/vehicles/bmw/i7/i7-rear.webp'
import bmwI7ImageSide from '../assets/vehicles/bmw/i7/i7-side.webp'
import bmwIxImageFront from '../assets/vehicles/bmw/ix/ix-front.webp'
import bmwIxImageRear from '../assets/vehicles/bmw/ix/ix-rear.webp'
import bmwIxImageSide from '../assets/vehicles/bmw/ix/ix-side.webp'
import mercedesBenzAClassImageFront from '../assets/vehicles/mercedes-benz/a-class/a-class-front.webp'
import mercedesBenzAClassImageRear from '../assets/vehicles/mercedes-benz/a-class/a-class-rear.webp'
import mercedesBenzAClassImageSide from '../assets/vehicles/mercedes-benz/a-class/a-class-side.webp'
import mercedesBenzCClassImageFront from '../assets/vehicles/mercedes-benz/c-class/c-class-front.webp'
import mercedesBenzCClassImageRear from '../assets/vehicles/mercedes-benz/c-class/c-class-rear.webp'
import mercedesBenzCClassImageSide from '../assets/vehicles/mercedes-benz/c-class/c-class-side.webp'
import mercedesBenzEClassImageFront from '../assets/vehicles/mercedes-benz/e-class/e-class-front.webp'
import mercedesBenzEClassImageRear from '../assets/vehicles/mercedes-benz/e-class/e-class-rear.webp'
import mercedesBenzEClassImageSide from '../assets/vehicles/mercedes-benz/e-class/e-class-side.webp'
import mercedesBenzSClassImageFront from '../assets/vehicles/mercedes-benz/s-class/s-class-front.webp'
import mercedesBenzSClassImageRear from '../assets/vehicles/mercedes-benz/s-class/s-class-rear.webp'
import mercedesBenzSClassImageSide from '../assets/vehicles/mercedes-benz/s-class/s-class-side.webp'
import mercedesBenzGlaImageFront from '../assets/vehicles/mercedes-benz/gla/gla-front.webp'
import mercedesBenzGlaImageRear from '../assets/vehicles/mercedes-benz/gla/gla-rear.webp'
import mercedesBenzGlaImageSide from '../assets/vehicles/mercedes-benz/gla/gla-side.webp'
import mercedesBenzGlcImageFront from '../assets/vehicles/mercedes-benz/glc/glc-front.webp'
import mercedesBenzGlcImageRear from '../assets/vehicles/mercedes-benz/glc/glc-rear.webp'
import mercedesBenzGlcImageSide from '../assets/vehicles/mercedes-benz/glc/glc-side.webp'
import mercedesBenzGleImageFront from '../assets/vehicles/mercedes-benz/gle/gle-front.webp'
import mercedesBenzGleImageRear from '../assets/vehicles/mercedes-benz/gle/gle-rear.webp'
import mercedesBenzGleImageSide from '../assets/vehicles/mercedes-benz/gle/gle-side.webp'
import mercedesBenzGlsImageFront from '../assets/vehicles/mercedes-benz/gls/gls-front.webp'
import mercedesBenzGlsImageRear from '../assets/vehicles/mercedes-benz/gls/gls-rear.webp'
import mercedesBenzGlsImageSide from '../assets/vehicles/mercedes-benz/gls/gls-side.webp'
import mercedesBenzEqeImageFront from '../assets/vehicles/mercedes-benz/eqe/eqe-front.webp'
import mercedesBenzEqeImageRear from '../assets/vehicles/mercedes-benz/eqe/eqe-rear.webp'
import mercedesBenzEqeImageSide from '../assets/vehicles/mercedes-benz/eqe/eqe-side.webp'
import mercedesBenzEqsImageFront from '../assets/vehicles/mercedes-benz/eqs/eqs-front.webp'
import mercedesBenzEqsImageRear from '../assets/vehicles/mercedes-benz/eqs/eqs-rear.webp'
import mercedesBenzEqsImageSide from '../assets/vehicles/mercedes-benz/eqs/eqs-side.webp'
import audiA4ImageFront from '../assets/vehicles/audi/a4/a4-front.webp'
import audiA4ImageRear from '../assets/vehicles/audi/a4/a4-rear.webp'
import audiA4ImageSide from '../assets/vehicles/audi/a4/a4-side.webp'
import audiA6ImageFront from '../assets/vehicles/audi/a6/a6-front.webp'
import audiA6ImageRear from '../assets/vehicles/audi/a6/a6-rear.webp'
import audiA6ImageSide from '../assets/vehicles/audi/a6/a6-side.webp'
import audiA8ImageFront from '../assets/vehicles/audi/a8/a8-front.webp'
import audiA8ImageRear from '../assets/vehicles/audi/a8/a8-rear.webp'
import audiA8ImageSide from '../assets/vehicles/audi/a8/a8-side.webp'
import audiQ3ImageFront from '../assets/vehicles/audi/q3/q3-front.webp'
import audiQ3ImageRear from '../assets/vehicles/audi/q3/q3-rear.webp'
import audiQ3ImageSide from '../assets/vehicles/audi/q3/q3-side.webp'
import audiQ5ImageFront from '../assets/vehicles/audi/q5/q5-front.webp'
import audiQ5ImageRear from '../assets/vehicles/audi/q5/q5-rear.webp'
import audiQ5ImageSide from '../assets/vehicles/audi/q5/q5-side.webp'
import audiQ7ImageFront from '../assets/vehicles/audi/q7/q7-front.webp'
import audiQ7ImageRear from '../assets/vehicles/audi/q7/q7-rear.webp'
import audiQ7ImageSide from '../assets/vehicles/audi/q7/q7-side.webp'
import audiQ8ImageFront from '../assets/vehicles/audi/q8/q8-front.webp'
import audiQ8ImageRear from '../assets/vehicles/audi/q8/q8-rear.webp'
import audiQ8ImageSide from '../assets/vehicles/audi/q8/q8-side.webp'
import audiETronImageFront from '../assets/vehicles/audi/e-tron/e-tron-front.webp'
import audiETronImageRear from '../assets/vehicles/audi/e-tron/e-tron-rear.webp'
import audiETronImageSide from '../assets/vehicles/audi/e-tron/e-tron-side.webp'
import audiQ8ETronImageFront from '../assets/vehicles/audi/q8-e-tron/q8-e-tron-front.webp'
import audiQ8ETronImageRear from '../assets/vehicles/audi/q8-e-tron/q8-e-tron-rear.webp'
import audiQ8ETronImageSide from '../assets/vehicles/audi/q8-e-tron/q8-e-tron-side.webp'
import volvoS90ImageFront from '../assets/vehicles/volvo/s90/s90-front.webp'
import volvoS90ImageRear from '../assets/vehicles/volvo/s90/s90-rear.webp'
import volvoS90ImageSide from '../assets/vehicles/volvo/s90/s90-side.webp'
import volvoXc40ImageFront from '../assets/vehicles/volvo/xc40/xc40-front.webp'
import volvoXc40ImageRear from '../assets/vehicles/volvo/xc40/xc40-rear.webp'
import volvoXc40ImageSide from '../assets/vehicles/volvo/xc40/xc40-side.webp'
import volvoXc60ImageFront from '../assets/vehicles/volvo/xc60/xc60-front.webp'
import volvoXc60ImageRear from '../assets/vehicles/volvo/xc60/xc60-rear.webp'
import volvoXc60ImageSide from '../assets/vehicles/volvo/xc60/xc60-side.webp'
import volvoXc90ImageFront from '../assets/vehicles/volvo/xc90/xc90-front.webp'
import volvoXc90ImageRear from '../assets/vehicles/volvo/xc90/xc90-rear.webp'
import volvoXc90ImageSide from '../assets/vehicles/volvo/xc90/xc90-side.webp'
import volvoEx30ImageFront from '../assets/vehicles/volvo/ex30/ex30-front.webp'
import volvoEx30ImageRear from '../assets/vehicles/volvo/ex30/ex30-rear.webp'
import volvoEx30ImageSide from '../assets/vehicles/volvo/ex30/ex30-side.webp'
import volvoEx40ImageFront from '../assets/vehicles/volvo/ex40/ex40-front.webp'
import volvoEx40ImageRear from '../assets/vehicles/volvo/ex40/ex40-rear.webp'
import volvoEx40ImageSide from '../assets/vehicles/volvo/ex40/ex40-side.webp'
import volvoEx90ImageFront from '../assets/vehicles/volvo/ex90/ex90-front.webp'
import volvoEx90ImageRear from '../assets/vehicles/volvo/ex90/ex90-rear.webp'
import volvoEx90ImageSide from '../assets/vehicles/volvo/ex90/ex90-side.webp'
import lexusEsImageFront from '../assets/vehicles/lexus/es/es-front.webp'
import lexusEsImageRear from '../assets/vehicles/lexus/es/es-rear.webp'
import lexusEsImageSide from '../assets/vehicles/lexus/es/es-side.webp'
import lexusNxImageFront from '../assets/vehicles/lexus/nx/nx-front.webp'
import lexusNxImageRear from '../assets/vehicles/lexus/nx/nx-rear.webp'
import lexusNxImageSide from '../assets/vehicles/lexus/nx/nx-side.webp'
import lexusRxImageFront from '../assets/vehicles/lexus/rx/rx-front.webp'
import lexusRxImageRear from '../assets/vehicles/lexus/rx/rx-rear.webp'
import lexusRxImageSide from '../assets/vehicles/lexus/rx/rx-side.webp'
import lexusLxImageFront from '../assets/vehicles/lexus/lx/lx-front.webp'
import lexusLxImageRear from '../assets/vehicles/lexus/lx/lx-rear.webp'
import lexusLxImageSide from '../assets/vehicles/lexus/lx/lx-side.webp'
import lexusLmImageFront from '../assets/vehicles/lexus/lm/lm-front.webp'
import lexusLmImageRear from '../assets/vehicles/lexus/lm/lm-rear.webp'
import lexusLmImageSide from '../assets/vehicles/lexus/lm/lm-side.webp'
import landRoverDefenderImageFront from '../assets/vehicles/land-rover/defender/defender-front.webp'
import landRoverDefenderImageRear from '../assets/vehicles/land-rover/defender/defender-rear.webp'
import landRoverDefenderImageSide from '../assets/vehicles/land-rover/defender/defender-side.webp'
import landRoverDiscoveryImageFront from '../assets/vehicles/land-rover/discovery/discovery-front.webp'
import landRoverDiscoveryImageRear from '../assets/vehicles/land-rover/discovery/discovery-rear.webp'
import landRoverDiscoveryImageSide from '../assets/vehicles/land-rover/discovery/discovery-side.webp'
import landRoverRangeRoverEvoqueImageFront from '../assets/vehicles/land-rover/range-rover-evoque/range-rover-evoque-front.webp'
import landRoverRangeRoverEvoqueImageRear from '../assets/vehicles/land-rover/range-rover-evoque/range-rover-evoque-rear.webp'
import landRoverRangeRoverEvoqueImageSide from '../assets/vehicles/land-rover/range-rover-evoque/range-rover-evoque-side.webp'
import landRoverRangeRoverSportImageFront from '../assets/vehicles/land-rover/range-rover-sport/range-rover-sport-front.webp'
import landRoverRangeRoverSportImageRear from '../assets/vehicles/land-rover/range-rover-sport/range-rover-sport-rear.webp'
import landRoverRangeRoverSportImageSide from '../assets/vehicles/land-rover/range-rover-sport/range-rover-sport-side.webp'
import landRoverRangeRoverImageFront from '../assets/vehicles/land-rover/range-rover/range-rover-front.webp'
import landRoverRangeRoverImageRear from '../assets/vehicles/land-rover/range-rover/range-rover-rear.webp'
import landRoverRangeRoverImageSide from '../assets/vehicles/land-rover/range-rover/range-rover-side.webp'
import landRoverRangeRoverVelarImageFront from '../assets/vehicles/land-rover/range-rover-velar/range-rover-velar-front.webp'
import landRoverRangeRoverVelarImageRear from '../assets/vehicles/land-rover/range-rover-velar/range-rover-velar-rear.webp'
import landRoverRangeRoverVelarImageSide from '../assets/vehicles/land-rover/range-rover-velar/range-rover-velar-side.webp'
import miniCooperImageFront from '../assets/vehicles/mini/cooper/cooper-front.webp'
import miniCooperImageRear from '../assets/vehicles/mini/cooper/cooper-rear.webp'
import miniCooperImageSide from '../assets/vehicles/mini/cooper/cooper-side.webp'
import miniCooperSImageFront from '../assets/vehicles/mini/cooper-s/cooper-s-front.webp'
import miniCooperSImageRear from '../assets/vehicles/mini/cooper-s/cooper-s-rear.webp'
import miniCooperSImageSide from '../assets/vehicles/mini/cooper-s/cooper-s-side.webp'
import miniCountrymanImageFront from '../assets/vehicles/mini/countryman/countryman-front.webp'
import miniCountrymanImageRear from '../assets/vehicles/mini/countryman/countryman-rear.webp'
import miniCountrymanImageSide from '../assets/vehicles/mini/countryman/countryman-side.webp'
import miniConvertibleImageFront from '../assets/vehicles/mini/convertible/convertible-front.webp'
import miniConvertibleImageRear from '../assets/vehicles/mini/convertible/convertible-rear.webp'
import miniConvertibleImageSide from '../assets/vehicles/mini/convertible/convertible-side.webp'

export const ALLOWED_VEHICLE_CLASSES = [
  'Hatchback',
  'Premium Hatchback',
  'Sedan',
  'Executive Sedan',
  'Luxury Sedan',
  'Compact SUV',
  'SUV',
  'Premium SUV',
  'Luxury SUV',
  'MUV',
  'MPV',
  'Van',
  'Premium Van',
  'Luxury Van',
  'Electric',
  'Premium Electric',
  'Luxury Electric',
  'Convertible',
  'Sports Car',
  'Supercar',
  'Off-Road',
  'Pickup',
  'Commercial Passenger Vehicle',
]

export const ALLOWED_BRANDS = Object.freeze([
  'Maruti Suzuki',
  'Tata',
  'Mahindra',
  'Hyundai',
  'Kia',
  'Toyota',
  'Honda',
  'Renault',
  'Nissan',
  'Volkswagen',
  'Skoda',
  'MG',
  'Jeep',
  'BMW',
  'Mercedes-Benz',
  'Audi',
  'Volvo',
  'Lexus',
  'Land Rover',
  'MINI',
])

export const ALLOWED_CATEGORIES = Object.freeze(['HATCHBACK', 'SEDAN', 'SUV', 'MUV', 'VAN', 'LUXURY'])

export const ALLOWED_FUEL_TYPES = Object.freeze(['Petrol', 'Diesel', 'Electric', 'Hybrid'])

export const ALLOWED_TRANSMISSIONS = Object.freeze(['Automatic', 'Manual'])

export const ALLOWED_AVAILABILITIES = Object.freeze(['AVAILABLE', 'RESERVED', 'RENTED', 'MAINTENANCE', 'INACTIVE'])

const hourlyHours = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12]
const dailyDays = [1, 2, 3, 4, 5, 6, 7]
const longTermDays = [14, 21, 30]
const categoryRate = { HATCHBACK: 2100, SEDAN: 2800, SUV: 3300, MUV: 4200, VAN: 4800, LUXURY: 8500 }
const classRate = {
  Hatchback: 1,
  'Premium Hatchback': 1.12,
  Sedan: 1,
  'Executive Sedan': 1.3,
  'Luxury Sedan': 2.25,
  'Compact SUV': 1,
  SUV: 1.1,
  'Premium SUV': 1.28,
  'Luxury SUV': 2.35,
  MUV: 1,
  MPV: 1.04,
  Van: 1,
  'Premium Van': 1.25,
  'Luxury Van': 1.7,
  Electric: 1.12,
  'Premium Electric': 1.65,
  'Luxury Electric': 2.4,
  Convertible: 2.1,
  'Sports Car': 2.8,
  Supercar: 4.5,
  'Off-Road': 1.4,
  Pickup: 1.18,
  'Commercial Passenger Vehicle': 1.15,
}

function createPricing(dailyRate) {
  return {
    hourly: Object.fromEntries(hourlyHours.map((hours) => [hours, Math.round(dailyRate * (0.14 + hours * 0.025))])),
    daily: Object.fromEntries(dailyDays.map((days) => [days, Math.round(dailyRate * days * (1 - Math.min(0.12, (days - 1) * 0.02)))])),
    longTerm: Object.fromEntries(longTermDays.map((days) => [days, Math.round(dailyRate * days * (days === 14 ? 0.82 : days === 21 ? 0.76 : 0.68))])),
    discounts: { 7: Math.round(dailyRate * 7 * 0.12), 14: Math.round(dailyRate * 14 * 0.18), 21: Math.round(dailyRate * 21 * 0.24), 30: Math.round(dailyRate * 30 * 0.32) },
  }
}

function createVehicle({ brand, model, category, vehicleClass, fuelType = 'Petrol', rate, status = 'AVAILABLE' }, index) {
  const dailyRate = rate || Math.round(categoryRate[category] * (classRate[vehicleClass] || 1))
  const id = `${brand}-${model}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const seats = category === 'VAN' || category === 'MUV' || vehicleClass === 'MPV' || vehicleClass === 'Premium Van' || vehicleClass === 'Luxury Van' ? 7 : (model === 'Safari' || model === 'XUV700' || model === 'Scorpio' || model === 'Scorpio-N' || model === 'Bolero' || model === 'Bolero Neo' || model === 'Alcazar' || model === 'Carens' || model === 'Hector Plus' || model === 'Kodiaq' || model === 'Gloster' || model === 'Meridian' || model === 'X7' || model === 'GLS' || model === 'Q7' || model === 'XC90' || model === 'LX' || model === 'Discovery' ? 7 : 5)
  const transmission = (vehicleClass.includes('Luxury') || vehicleClass.includes('Electric') || category === 'LUXURY' || category === 'VAN' || model === 'Camry' || model === 'Vellfire' || model === 'Ioniq 5' || model === 'EV6' || model === 'City e:HEV' || model === 'Windsor EV' || model === 'Comet EV' || model === 'ZS EV' || model === 'Grand Cherokee' || model === 'Invicto') ? 'Automatic' : (index % 3 === 0 ? 'Manual' : 'Automatic')

  return {
    id,
    name: `${brand} ${model}`,
    brand,
    model,
    year: 2024,
    vehicleType: 'car',
    category,
    class: vehicleClass,
    type: category,
    status,
    seats,
    transmission,
    fuelType,
    airConditioning: true,
    description: `VAYRO verified fleet ${brand} ${model} offering premium reliability, verified cabin hygiene, and versatile performance.`,
    features: ['Bluetooth Audio', 'Touchscreen Infotainment', 'Reverse Camera', 'Dual Airbags', 'Cruise Control', 'Climate Control'],
    dailyRate,
    pricing: createPricing(dailyRate),
    image: vehicleCatalogueImage,
    imagePosition: 'center',
    images: { primary: vehicleCatalogueImage, gallery: [] },
    imageVerified: false,
  }
}

export const catalogue = [
  ['Maruti Suzuki', [
    ['Swift', 'HATCHBACK', 'Hatchback'],
    ['Baleno', 'HATCHBACK', 'Premium Hatchback'],
    ['Dzire', 'SEDAN', 'Sedan'],
    ['Fronx', 'SUV', 'Compact SUV'],
    ['Brezza', 'SUV', 'Compact SUV'],
    ['Grand Vitara', 'SUV', 'Premium SUV', 'Hybrid'],
    ['Ertiga', 'MUV', 'MPV'],
    ['XL6', 'MUV', 'Premium Van'],
    ['Jimny', 'SUV', 'Off-Road'],
    ['Invicto', 'MUV', 'Premium Van', 'Hybrid'],
  ]],
  ['Tata', [
    ['Tiago', 'HATCHBACK', 'Hatchback'],
    ['Altroz', 'HATCHBACK', 'Premium Hatchback'],
    ['Tigor', 'SEDAN', 'Sedan'],
    ['Punch', 'SUV', 'Compact SUV'],
    ['Nexon', 'SUV', 'Compact SUV'],
    ['Harrier', 'SUV', 'Premium SUV', 'Diesel'],
    ['Safari', 'SUV', 'Premium SUV', 'Diesel'],
    ['Curvv', 'SUV', 'Premium SUV'],
    ['Nexon EV', 'SUV', 'Electric', 'Electric'],
    ['Punch EV', 'SUV', 'Electric', 'Electric'],
  ]],
  ['Mahindra', [
    ['XUV 3XO', 'SUV', 'Compact SUV'],
    ['XUV700', 'MUV', 'MPV', 'Diesel'],
    ['Scorpio', 'SUV', 'Premium SUV', 'Diesel'],
    ['Scorpio-N', 'SUV', 'Premium SUV', 'Diesel'],
    ['Thar', 'SUV', 'Off-Road', 'Diesel'],
    ['Bolero', 'MUV', 'MPV', 'Diesel'],
    ['Bolero Neo', 'SUV', 'Off-Road', 'Diesel'],
    ['Marazzo', 'MUV', 'MPV', 'Diesel'],
  ]],
  ['Hyundai', [
    ['Grand i10 Nios', 'HATCHBACK', 'Hatchback'],
    ['i20', 'HATCHBACK', 'Premium Hatchback'],
    ['Aura', 'SEDAN', 'Sedan'],
    ['Verna', 'SEDAN', 'Executive Sedan'],
    ['Exter', 'SUV', 'Compact SUV'],
    ['Venue', 'SUV', 'Compact SUV'],
    ['Creta', 'SUV', 'Premium SUV'],
    ['Alcazar', 'MUV', 'MPV'],
    ['Tucson', 'SUV', 'Premium SUV', 'Diesel'],
    ['Ioniq 5', 'LUXURY', 'Premium Electric', 'Electric'],
  ]],
  ['Kia', [
    ['Sonet', 'SUV', 'Compact SUV'],
    ['Seltos', 'SUV', 'Premium SUV'],
    ['Carens', 'MUV', 'MPV'],
    ['Carnival', 'VAN', 'Premium Van', 'Diesel'],
    ['EV6', 'LUXURY', 'Premium Electric', 'Electric'],
  ]],
  ['Toyota', [
    ['Glanza', 'HATCHBACK', 'Premium Hatchback'],
    ['Urban Cruiser Taisor', 'SUV', 'Compact SUV'],
    ['Urban Cruiser Hyryder', 'SUV', 'Premium SUV', 'Hybrid'],
    ['Rumion', 'MUV', 'MPV'],
    ['Innova Crysta', 'MUV', 'MPV', 'Diesel'],
    ['Innova HyCross', 'MUV', 'Premium Van', 'Hybrid'],
    ['Fortuner', 'SUV', 'Premium SUV', 'Diesel'],
    ['Legender', 'SUV', 'Luxury SUV', 'Diesel'],
    ['Hilux', 'SUV', 'Pickup', 'Diesel'],
    ['Camry', 'SEDAN', 'Executive Sedan', 'Hybrid'],
    ['Land Cruiser', 'SUV', 'Luxury SUV', 'Diesel'],
    ['Vellfire', 'VAN', 'Luxury Van', 'Hybrid'],
  ]],
  ['Honda', [
    ['Amaze', 'SEDAN', 'Sedan'],
    ['City', 'SEDAN', 'Executive Sedan'],
    ['Elevate', 'SUV', 'Premium SUV'],
    ['City e:HEV', 'SEDAN', 'Executive Sedan', 'Hybrid'],
  ]],
  ['Renault', [
    ['Kwid', 'HATCHBACK', 'Hatchback'],
    ['Triber', 'MUV', 'MPV'],
    ['Kiger', 'SUV', 'Compact SUV'],
    ['Duster', 'SUV', 'Premium SUV'],
  ]],
  ['Nissan', [
    ['Magnite', 'SUV', 'Compact SUV'],
    ['X-Trail', 'SUV', 'Premium SUV', 'Hybrid'],
  ]],
  ['Volkswagen', [
    ['Virtus', 'SEDAN', 'Executive Sedan'],
    ['Taigun', 'SUV', 'Premium SUV'],
    ['Tiguan', 'SUV', 'Premium SUV'],
  ]],
  ['Skoda', [
    ['Slavia', 'SEDAN', 'Executive Sedan'],
    ['Kushaq', 'SUV', 'Premium SUV'],
    ['Kodiaq', 'SUV', 'Luxury SUV'],
    ['Superb', 'LUXURY', 'Luxury Sedan'],
  ]],
  ['MG', [
    ['Comet EV', 'HATCHBACK', 'Electric', 'Electric'],
    ['Astor', 'SUV', 'Compact SUV'],
    ['Hector', 'SUV', 'Premium SUV'],
    ['Hector Plus', 'MUV', 'MPV'],
    ['ZS EV', 'SUV', 'Premium Electric', 'Electric'],
    ['Gloster', 'SUV', 'Luxury SUV', 'Diesel'],
    ['Windsor EV', 'SUV', 'Premium Electric', 'Electric'],
  ]],
  ['Jeep', [
    ['Compass', 'SUV', 'Premium SUV', 'Diesel'],
    ['Meridian', 'SUV', 'Premium SUV', 'Diesel'],
    ['Wrangler', 'SUV', 'Off-Road'],
    ['Grand Cherokee', 'SUV', 'Luxury SUV'],
  ]],
  ['BMW', [
    ['2 Series', 'LUXURY', 'Luxury Sedan'],
    ['3 Series', 'LUXURY', 'Luxury Sedan'],
    ['5 Series', 'LUXURY', 'Luxury Sedan'],
    ['X1', 'SUV', 'Luxury SUV'],
    ['X3', 'SUV', 'Luxury SUV'],
    ['X5', 'SUV', 'Luxury SUV'],
    ['X7', 'SUV', 'Luxury SUV'],
    ['i4', 'LUXURY', 'Luxury Electric', 'Electric'],
    ['i5', 'LUXURY', 'Luxury Electric', 'Electric'],
    ['i7', 'LUXURY', 'Luxury Electric', 'Electric'],
    ['iX', 'SUV', 'Luxury Electric', 'Electric'],
  ]],
  ['Mercedes-Benz', [
    ['A-Class', 'LUXURY', 'Luxury Sedan'],
    ['C-Class', 'LUXURY', 'Luxury Sedan'],
    ['E-Class', 'LUXURY', 'Luxury Sedan'],
    ['S-Class', 'LUXURY', 'Luxury Sedan'],
    ['GLA', 'SUV', 'Luxury SUV'],
    ['GLC', 'SUV', 'Luxury SUV'],
    ['GLE', 'SUV', 'Luxury SUV'],
    ['GLS', 'SUV', 'Luxury SUV'],
    ['EQE', 'LUXURY', 'Luxury Electric', 'Electric'],
    ['EQS', 'LUXURY', 'Luxury Electric', 'Electric'],
  ]],
  ['Audi', [
    ['A4', 'LUXURY', 'Luxury Sedan'],
    ['A6', 'LUXURY', 'Luxury Sedan'],
    ['A8', 'LUXURY', 'Luxury Sedan'],
    ['Q3', 'SUV', 'Luxury SUV'],
    ['Q5', 'SUV', 'Luxury SUV'],
    ['Q7', 'SUV', 'Luxury SUV'],
    ['Q8', 'SUV', 'Luxury SUV'],
    ['e-tron', 'SUV', 'Luxury Electric', 'Electric'],
    ['Q8 e-tron', 'SUV', 'Luxury Electric', 'Electric'],
  ]],
  ['Volvo', [
    ['S90', 'LUXURY', 'Luxury Sedan', 'Hybrid'],
    ['XC40', 'SUV', 'Luxury SUV'],
    ['XC60', 'SUV', 'Luxury SUV', 'Hybrid'],
    ['XC90', 'SUV', 'Luxury SUV', 'Hybrid'],
    ['EX30', 'SUV', 'Luxury Electric', 'Electric'],
    ['EX40', 'SUV', 'Luxury Electric', 'Electric'],
    ['EX90', 'SUV', 'Luxury Electric', 'Electric'],
  ]],
  ['Lexus', [
    ['ES', 'LUXURY', 'Luxury Sedan', 'Hybrid'],
    ['NX', 'SUV', 'Luxury SUV', 'Hybrid'],
    ['RX', 'SUV', 'Luxury SUV', 'Hybrid'],
    ['LX', 'SUV', 'Luxury SUV', 'Diesel'],
    ['LM', 'VAN', 'Luxury Van', 'Hybrid'],
  ]],
  ['Land Rover', [
    ['Defender', 'SUV', 'Off-Road', 'Diesel'],
    ['Discovery', 'SUV', 'Luxury SUV', 'Diesel'],
    ['Range Rover Evoque', 'SUV', 'Luxury SUV'],
    ['Range Rover Sport', 'SUV', 'Luxury SUV', 'Diesel'],
    ['Range Rover', 'SUV', 'Luxury SUV', 'Diesel'],
    ['Range Rover Velar', 'SUV', 'Luxury SUV'],
  ]],
  ['MINI', [
    ['Cooper', 'HATCHBACK', 'Premium Hatchback'],
    ['Cooper S', 'HATCHBACK', 'Premium Hatchback'],
    ['Countryman', 'SUV', 'Premium SUV'],
    ['Convertible', 'LUXURY', 'Convertible'],
  ]],
]


export const vehicleImageMap = {
  'maruti-suzuki-swift': { front: marutiSuzukiSwiftImageFront, rear: marutiSuzukiSwiftImageRear },
  'maruti-suzuki-baleno': { front: marutiSuzukiBalenoImageFront, rear: marutiSuzukiBalenoImageRear },
  'maruti-suzuki-dzire': { front: marutiSuzukiDzireImageFront, rear: marutiSuzukiDzireImageRear },
  'maruti-suzuki-fronx': { front: marutiSuzukiFronxImageFront, rear: marutiSuzukiFronxImageRear },
  'maruti-suzuki-brezza': { front: marutiSuzukiBrezzaImageFront, rear: marutiSuzukiBrezzaImageRear },
  'maruti-suzuki-grand-vitara': { front: marutiSuzukiGrandVitaraImageFront, rear: marutiSuzukiGrandVitaraImageRear },
  'maruti-suzuki-ertiga': { front: marutiSuzukiErtigaImageFront, rear: marutiSuzukiErtigaImageRear },
  'maruti-suzuki-xl6': { front: marutiSuzukiXl6ImageFront, rear: marutiSuzukiXl6ImageRear },
  'maruti-suzuki-jimny': { front: marutiSuzukiJimnyImageFront, rear: marutiSuzukiJimnyImageRear },
  'maruti-suzuki-invicto': { front: marutiSuzukiInvictoImageFront, rear: marutiSuzukiInvictoImageRear },
  'tata-tiago': { front: tataTiagoImageFront, rear: tataTiagoImageRear },
  'tata-altroz': { front: tataAltrozImageFront, rear: tataAltrozImageRear },
  'tata-tigor': { front: tataTigorImageFront, rear: tataTigorImageRear },
  'tata-punch': { front: tataPunchImageFront, rear: tataPunchImageRear },
  'tata-nexon': { front: tataNexonImageFront, rear: tataNexonImageRear },
  'tata-harrier': { front: tataHarrierImageFront, rear: tataHarrierImageRear },
  'tata-safari': { front: tataSafariImageFront, rear: tataSafariImageRear },
  'tata-curvv': { front: tataCurvvImageFront, rear: tataCurvvImageRear },
  'tata-nexon-ev': { front: tataNexonEvImageFront, rear: tataNexonEvImageRear },
  'tata-punch-ev': { front: tataPunchEvImageFront, rear: tataPunchEvImageRear },
  'mahindra-xuv-3xo': { front: mahindraXuv3xoImageFront, rear: mahindraXuv3xoImageRear },
  'mahindra-xuv700': { front: mahindraXuv700ImageFront, rear: mahindraXuv700ImageRear },
  'mahindra-scorpio': { front: mahindraScorpioImageFront, rear: mahindraScorpioImageRear },
  'mahindra-scorpio-n': { front: mahindraScorpioNImageFront, rear: mahindraScorpioNImageRear },
  'mahindra-thar': { front: mahindraTharImageFront, rear: mahindraTharImageRear },
  'mahindra-bolero': { front: mahindraBoleroImageFront, rear: mahindraBoleroImageRear },
  'mahindra-bolero-neo': { front: mahindraBoleroNeoImageFront, rear: mahindraBoleroNeoImageRear },
  'mahindra-marazzo': { front: mahindraMarazzoImageFront, rear: mahindraMarazzoImageRear },
  'hyundai-grand-i10-nios': { front: hyundaiGrandI10NiosImageFront, rear: hyundaiGrandI10NiosImageRear },
  'hyundai-i20': { front: hyundaiI20ImageFront, rear: hyundaiI20ImageRear },
  'hyundai-aura': { front: hyundaiAuraImageFront, rear: hyundaiAuraImageRear },
  'hyundai-verna': { front: hyundaiVernaImageFront, rear: hyundaiVernaImageRear },
  'hyundai-exter': { front: hyundaiExterImageFront, rear: hyundaiExterImageRear },
  'hyundai-venue': { front: hyundaiVenueImageFront, rear: hyundaiVenueImageRear },
  'hyundai-creta': { front: hyundaiCretaImageFront, rear: hyundaiCretaImageRear },
  'hyundai-alcazar': { front: hyundaiAlcazarImageFront, rear: hyundaiAlcazarImageRear },
  'hyundai-tucson': { front: hyundaiTucsonImageFront, rear: hyundaiTucsonImageRear },
  'hyundai-ioniq-5': { front: hyundaiIoniq5ImageFront, rear: hyundaiIoniq5ImageRear },
  'kia-sonet': { front: kiaSonetImageFront, rear: kiaSonetImageRear },
  'kia-seltos': { front: kiaSeltosImageFront, rear: kiaSeltosImageRear },
  'kia-carens': { front: kiaCarensImageFront, rear: kiaCarensImageRear },
  'kia-carnival': { front: kiaCarnivalImageFront, rear: kiaCarnivalImageRear },
  'kia-ev6': { front: kiaEv6ImageFront, rear: kiaEv6ImageRear },
  'toyota-glanza': { front: toyotaGlanzaImageFront, rear: toyotaGlanzaImageRear },
  'toyota-urban-cruiser-taisor': { front: toyotaUrbanCruiserTaisorImageFront, rear: toyotaUrbanCruiserTaisorImageRear },
  'toyota-urban-cruiser-hyryder': { front: toyotaUrbanCruiserHyryderImageFront, rear: toyotaUrbanCruiserHyryderImageRear },
  'toyota-rumion': { front: toyotaRumionImageFront, rear: toyotaRumionImageRear },
  'toyota-innova-crysta': { front: toyotaInnovaCrystaImageFront, rear: toyotaInnovaCrystaImageRear },
  'toyota-innova-hycross': { front: toyotaInnovaHycrossImageFront, rear: toyotaInnovaHycrossImageRear },
  'toyota-fortuner': { front: toyotaFortunerImageFront, rear: toyotaFortunerImageRear },
  'toyota-legender': { front: toyotaLegenderImageFront, rear: toyotaLegenderImageRear },
  'toyota-hilux': { front: toyotaHiluxImageFront, rear: toyotaHiluxImageRear },
  'toyota-camry': { front: toyotaCamryImageFront, rear: toyotaCamryImageRear },
  'toyota-land-cruiser': { front: toyotaLandCruiserImageFront, rear: toyotaLandCruiserImageRear },
  'toyota-vellfire': { front: toyotaVellfireImageFront, rear: toyotaVellfireImageRear },
  'honda-amaze': { front: hondaAmazeImageFront, rear: hondaAmazeImageRear },
  'honda-city': { front: hondaCityImageFront, rear: hondaCityImageRear },
  'honda-elevate': { front: hondaElevateImageFront, rear: hondaElevateImageRear },
  'honda-city-e-hev': { front: hondaCityEHevImageFront, rear: hondaCityEHevImageRear },
  'renault-kwid': { front: renaultKwidImageFront, rear: renaultKwidImageRear },
  'renault-triber': { front: renaultTriberImageFront, rear: renaultTriberImageRear },
  'renault-kiger': { front: renaultKigerImageFront, rear: renaultKigerImageRear },
  'renault-duster': { front: renaultDusterImageFront, rear: renaultDusterImageRear },
  'nissan-magnite': { front: nissanMagniteImageFront, rear: nissanMagniteImageRear },
  'nissan-x-trail': { front: nissanXTrailImageFront, rear: nissanXTrailImageRear },
  'volkswagen-virtus': { front: volkswagenVirtusImageFront, rear: volkswagenVirtusImageRear },
  'volkswagen-taigun': { front: volkswagenTaigunImageFront, rear: volkswagenTaigunImageRear },
  'volkswagen-tiguan': { front: volkswagenTiguanImageFront, rear: volkswagenTiguanImageRear },
  'skoda-slavia': { front: skodaSlaviaImageFront, rear: skodaSlaviaImageRear },
  'skoda-kushaq': { front: skodaKushaqImageFront, rear: skodaKushaqImageRear },
  'skoda-kodiaq': { front: skodaKodiaqImageFront, rear: skodaKodiaqImageRear },
  'skoda-superb': { front: skodaSuperbImageFront, rear: skodaSuperbImageRear },
  'mg-comet-ev': { front: mgCometEvImageFront, rear: mgCometEvImageRear },
  'mg-astor': { front: mgAstorImageFront, rear: mgAstorImageRear },
  'mg-hector': { front: mgHectorImageFront, rear: mgHectorImageRear },
  'mg-hector-plus': { front: mgHectorPlusImageFront, rear: mgHectorPlusImageRear },
  'mg-zs-ev': { front: mgZsEvImageFront, rear: mgZsEvImageRear },
  'mg-gloster': { front: mgGlosterImageFront, rear: mgGlosterImageRear },
  'mg-windsor-ev': { front: mgWindsorEvImageFront, rear: mgWindsorEvImageRear },
  'jeep-compass': { front: jeepCompassImageFront, rear: jeepCompassImageRear },
  'jeep-meridian': { front: jeepMeridianImageFront, rear: jeepMeridianImageRear },
  'jeep-wrangler': { front: jeepWranglerImageFront, rear: jeepWranglerImageRear },
  'jeep-grand-cherokee': { front: jeepGrandCherokeeImageFront, rear: jeepGrandCherokeeImageRear },
  'bmw-2-series': { front: bmw2SeriesImageFront, rear: bmw2SeriesImageRear },
  'bmw-3-series': { front: bmw3SeriesImageFront, rear: bmw3SeriesImageRear },
  'bmw-5-series': { front: bmw5SeriesImageFront, rear: bmw5SeriesImageRear },
  'bmw-x1': { front: bmwX1ImageFront, rear: bmwX1ImageRear },
  'bmw-x3': { front: bmwX3ImageFront, rear: bmwX3ImageRear },
  'bmw-x5': { front: bmwX5ImageFront, rear: bmwX5ImageRear },
  'bmw-x7': { front: bmwX7ImageFront, rear: bmwX7ImageRear },
  'bmw-i4': { front: bmwI4ImageFront, rear: bmwI4ImageRear },
  'bmw-i5': { front: bmwI5ImageFront, rear: bmwI5ImageRear },
  'bmw-i7': { front: bmwI7ImageFront, rear: bmwI7ImageRear },
  'bmw-ix': { front: bmwIxImageFront, rear: bmwIxImageRear },
  'mercedes-benz-a-class': { front: mercedesBenzAClassImageFront, rear: mercedesBenzAClassImageRear },
  'mercedes-benz-c-class': { front: mercedesBenzCClassImageFront, rear: mercedesBenzCClassImageRear },
  'mercedes-benz-e-class': { front: mercedesBenzEClassImageFront, rear: mercedesBenzEClassImageRear },
  'mercedes-benz-s-class': { front: mercedesBenzSClassImageFront, rear: mercedesBenzSClassImageRear },
  'mercedes-benz-gla': { front: mercedesBenzGlaImageFront, rear: mercedesBenzGlaImageRear },
  'mercedes-benz-glc': { front: mercedesBenzGlcImageFront, rear: mercedesBenzGlcImageRear },
  'mercedes-benz-gle': { front: mercedesBenzGleImageFront, rear: mercedesBenzGleImageRear },
  'mercedes-benz-gls': { front: mercedesBenzGlsImageFront, rear: mercedesBenzGlsImageRear },
  'mercedes-benz-eqe': { front: mercedesBenzEqeImageFront, rear: mercedesBenzEqeImageRear },
  'mercedes-benz-eqs': { front: mercedesBenzEqsImageFront, rear: mercedesBenzEqsImageRear },
  'audi-a4': { front: audiA4ImageFront, rear: audiA4ImageRear },
  'audi-a6': { front: audiA6ImageFront, rear: audiA6ImageRear },
  'audi-a8': { front: audiA8ImageFront, rear: audiA8ImageRear },
  'audi-q3': { front: audiQ3ImageFront, rear: audiQ3ImageRear },
  'audi-q5': { front: audiQ5ImageFront, rear: audiQ5ImageRear },
  'audi-q7': { front: audiQ7ImageFront, rear: audiQ7ImageRear },
  'audi-q8': { front: audiQ8ImageFront, rear: audiQ8ImageRear },
  'audi-e-tron': { front: audiETronImageFront, rear: audiETronImageRear },
  'audi-q8-e-tron': { front: audiQ8ETronImageFront, rear: audiQ8ETronImageRear },
  'volvo-s90': { front: volvoS90ImageFront, rear: volvoS90ImageRear },
  'volvo-xc40': { front: volvoXc40ImageFront, rear: volvoXc40ImageRear },
  'volvo-xc60': { front: volvoXc60ImageFront, rear: volvoXc60ImageRear },
  'volvo-xc90': { front: volvoXc90ImageFront, rear: volvoXc90ImageRear },
  'volvo-ex30': { front: volvoEx30ImageFront, rear: volvoEx30ImageRear },
  'volvo-ex40': { front: volvoEx40ImageFront, rear: volvoEx40ImageRear },
  'volvo-ex90': { front: volvoEx90ImageFront, rear: volvoEx90ImageRear },
  'lexus-es': { front: lexusEsImageFront, rear: lexusEsImageRear },
  'lexus-nx': { front: lexusNxImageFront, rear: lexusNxImageRear },
  'lexus-rx': { front: lexusRxImageFront, rear: lexusRxImageRear },
  'lexus-lx': { front: lexusLxImageFront, rear: lexusLxImageRear },
  'lexus-lm': { front: lexusLmImageFront, rear: lexusLmImageRear },
  'land-rover-defender': { front: landRoverDefenderImageFront, rear: landRoverDefenderImageRear },
  'land-rover-discovery': { front: landRoverDiscoveryImageFront, rear: landRoverDiscoveryImageRear },
  'land-rover-range-rover-evoque': { front: landRoverRangeRoverEvoqueImageFront, rear: landRoverRangeRoverEvoqueImageRear },
  'land-rover-range-rover-sport': { front: landRoverRangeRoverSportImageFront, rear: landRoverRangeRoverSportImageRear },
  'land-rover-range-rover': { front: landRoverRangeRoverImageFront, rear: landRoverRangeRoverImageRear },
  'land-rover-range-rover-velar': { front: landRoverRangeRoverVelarImageFront, rear: landRoverRangeRoverVelarImageRear },
  'mini-cooper': { front: miniCooperImageFront, rear: miniCooperImageRear },
  'mini-cooper-s': { front: miniCooperSImageFront, rear: miniCooperSImageRear },
  'mini-countryman': { front: miniCountrymanImageFront, rear: miniCountrymanImageRear },
  'mini-convertible': { front: miniConvertibleImageFront, rear: miniConvertibleImageRear },
}

export const cars = catalogue.flatMap(([brand, models]) =>
  models.map(([model, category, vehicleClass, fuelType = 'Petrol', rate, status = 'AVAILABLE'], index) => {
    const v = createVehicle({ brand, model, category, vehicleClass, fuelType, rate, status }, index)
    const localImgObj = vehicleImageMap[v.id]
    const localImgFront = localImgObj?.front || localImgObj
    const localImgRear = localImgObj?.rear || localImgObj
    if (localImgFront) {
      v.image = localImgFront
      v.imageVerified = true
      v.imageSource = 'local-verified'
      v.images = {
        primary: localImgFront,
        gallery: [localImgFront, localImgRear].filter(Boolean),
      }
    }
    return v
  }),
)

export { bikes, bikeImageMap, bikeCatalogue, ALLOWED_BIKE_BRANDS, ALLOWED_BIKE_CATEGORIES, ALLOWED_BIKE_CLASSES }

export const vehicles = [...cars, ...bikes]

export function validateVehicleImages(list = vehicles) {
  return list.map((vehicle) => {
    const imgObj = vehicle.vehicleType === 'bike' ? bikeImageMap[vehicle.id] : vehicleImageMap[vehicle.id]
    const front = imgObj?.front || imgObj
    const rear = imgObj?.rear || imgObj
    if (front) {
      return {
        ...vehicle,
        image: front,
        imageVerified: true,
        imageSource: 'local-verified',
        images: {
          primary: front,
          gallery: [front, rear].filter(Boolean),
        },
      }
    }
    return vehicle
  })
}


export function getVehicleById(id) {
  return vehicles.find((vehicle) => vehicle.id === id)
}

export function getVehicles() {
  return vehicles
}

export function getCars() {
  return cars
}

export function getBikes() {
  return bikes
}

