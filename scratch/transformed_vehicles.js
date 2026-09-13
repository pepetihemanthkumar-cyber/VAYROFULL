import { bikes, bikeCatalogue, bikeImageMap } from './transformed_bikes.js';

const vehicleCatalogueImage = "../assets/vehicle-catalogue.png";
const marutiSuzukiSwiftImage = "../assets/vehicles/maruti-suzuki/swift/swift.webp";
const marutiSuzukiBalenoImage = "../assets/vehicles/maruti-suzuki/baleno/baleno.webp";
const marutiSuzukiDzireImage = "../assets/vehicles/maruti-suzuki/dzire/dzire.webp";
const marutiSuzukiFronxImage = "../assets/vehicles/maruti-suzuki/fronx/fronx.webp";
const marutiSuzukiBrezzaImage = "../assets/vehicles/maruti-suzuki/brezza/brezza.webp";
const marutiSuzukiGrandVitaraImage = "../assets/vehicles/maruti-suzuki/grand-vitara/grand-vitara.webp";
const marutiSuzukiErtigaImage = "../assets/vehicles/maruti-suzuki/ertiga/ertiga.webp";
const marutiSuzukiXl6Image = "../assets/vehicles/maruti-suzuki/xl6/xl6.webp";
const marutiSuzukiJimnyImage = "../assets/vehicles/maruti-suzuki/jimny/jimny.webp";
const marutiSuzukiInvictoImage = "../assets/vehicles/maruti-suzuki/invicto/invicto.webp";
const tataTiagoImage = "../assets/vehicles/tata/tiago/tiago.webp";
const tataAltrozImage = "../assets/vehicles/tata/altroz/altroz.webp";
const tataTigorImage = "../assets/vehicles/tata/tigor/tigor.webp";
const tataPunchImage = "../assets/vehicles/tata/punch/punch.webp";
const tataNexonImage = "../assets/vehicles/tata/nexon/nexon.webp";
const tataHarrierImage = "../assets/vehicles/tata/harrier/harrier.webp";
const tataSafariImage = "../assets/vehicles/tata/safari/safari.webp";
const tataCurvvImage = "../assets/vehicles/tata/curvv/curvv.webp";
const tataNexonEvImage = "../assets/vehicles/tata/nexon-ev/nexon-ev.webp";
const tataPunchEvImage = "../assets/vehicles/tata/punch-ev/punch-ev.webp";
const mahindraXuv3xoImage = "../assets/vehicles/mahindra/xuv-3xo/xuv-3xo.webp";
const mahindraXuv700Image = "../assets/vehicles/mahindra/xuv700/xuv700.webp";
const mahindraScorpioImage = "../assets/vehicles/mahindra/scorpio/scorpio.webp";
const mahindraScorpioNImage = "../assets/vehicles/mahindra/scorpio-n/scorpio-n.webp";
const mahindraTharImage = "../assets/vehicles/mahindra/thar/thar.webp";
const mahindraBoleroImage = "../assets/vehicles/mahindra/bolero/bolero.webp";
const mahindraBoleroNeoImage = "../assets/vehicles/mahindra/bolero-neo/bolero-neo.webp";
const mahindraMarazzoImage = "../assets/vehicles/mahindra/marazzo/marazzo.webp";
const hyundaiGrandI10NiosImage = "../assets/vehicles/hyundai/grand-i10-nios/grand-i10-nios.webp";
const hyundaiI20Image = "../assets/vehicles/hyundai/i20/i20.webp";
const hyundaiAuraImage = "../assets/vehicles/hyundai/aura/aura.webp";
const hyundaiVernaImage = "../assets/vehicles/hyundai/verna/verna.webp";
const hyundaiExterImage = "../assets/vehicles/hyundai/exter/exter.webp";
const hyundaiVenueImage = "../assets/vehicles/hyundai/venue/venue.webp";
const hyundaiCretaImage = "../assets/vehicles/hyundai/creta/creta.webp";
const hyundaiAlcazarImage = "../assets/vehicles/hyundai/alcazar/alcazar.webp";
const hyundaiTucsonImage = "../assets/vehicles/hyundai/tucson/tucson.webp";
const hyundaiIoniq5Image = "../assets/vehicles/hyundai/ioniq-5/ioniq-5.webp";
const kiaSonetImage = "../assets/vehicles/kia/sonet/sonet.webp";
const kiaSeltosImage = "../assets/vehicles/kia/seltos/seltos.webp";
const kiaCarensImage = "../assets/vehicles/kia/carens/carens.webp";
const kiaCarnivalImage = "../assets/vehicles/kia/carnival/carnival.webp";
const kiaEv6Image = "../assets/vehicles/kia/ev6/ev6.webp";
const toyotaGlanzaImage = "../assets/vehicles/toyota/glanza/glanza.webp";
const toyotaUrbanCruiserTaisorImage = "../assets/vehicles/toyota/urban-cruiser-taisor/urban-cruiser-taisor.webp";
const toyotaUrbanCruiserHyryderImage = "../assets/vehicles/toyota/urban-cruiser-hyryder/urban-cruiser-hyryder.webp";
const toyotaRumionImage = "../assets/vehicles/toyota/rumion/rumion.webp";
const toyotaInnovaCrystaImage = "../assets/vehicles/toyota/innova-crysta/innova-crysta.webp";
const toyotaInnovaHycrossImage = "../assets/vehicles/toyota/innova-hycross/innova-hycross.webp";
const toyotaFortunerImage = "../assets/vehicles/toyota/fortuner/fortuner.webp";
const toyotaLegenderImage = "../assets/vehicles/toyota/legender/legender.webp";
const toyotaHiluxImage = "../assets/vehicles/toyota/hilux/hilux.webp";
const toyotaCamryImage = "../assets/vehicles/toyota/camry/camry.webp";
const toyotaLandCruiserImage = "../assets/vehicles/toyota/land-cruiser/land-cruiser.webp";
const toyotaVellfireImage = "../assets/vehicles/toyota/vellfire/vellfire.webp";
const hondaAmazeImage = "../assets/vehicles/honda/amaze/amaze.webp";
const hondaCityImage = "../assets/vehicles/honda/city/city.webp";
const hondaElevateImage = "../assets/vehicles/honda/elevate/elevate.webp";
const hondaCityEHevImage = "../assets/vehicles/honda/city-e-hev/city-e-hev.webp";
const renaultKwidImage = "../assets/vehicles/renault/kwid/kwid.webp";
const renaultTriberImage = "../assets/vehicles/renault/triber/triber.webp";
const renaultKigerImage = "../assets/vehicles/renault/kiger/kiger.webp";
const renaultDusterImage = "../assets/vehicles/renault/duster/duster.webp";
const nissanMagniteImage = "../assets/vehicles/nissan/magnite/magnite.webp";
const nissanXTrailImage = "../assets/vehicles/nissan/x-trail/x-trail.webp";
const volkswagenVirtusImage = "../assets/vehicles/volkswagen/virtus/virtus.webp";
const volkswagenTaigunImage = "../assets/vehicles/volkswagen/taigun/taigun.webp";
const volkswagenTiguanImage = "../assets/vehicles/volkswagen/tiguan/tiguan.webp";
const skodaSlaviaImage = "../assets/vehicles/skoda/slavia/slavia.webp";
const skodaKushaqImage = "../assets/vehicles/skoda/kushaq/kushaq.webp";
const skodaKodiaqImage = "../assets/vehicles/skoda/kodiaq/kodiaq.webp";
const skodaSuperbImage = "../assets/vehicles/skoda/superb/superb.webp";
const mgCometEvImage = "../assets/vehicles/mg/comet-ev/comet-ev.webp";
const mgAstorImage = "../assets/vehicles/mg/astor/astor.webp";
const mgHectorImage = "../assets/vehicles/mg/hector/hector.webp";
const mgHectorPlusImage = "../assets/vehicles/mg/hector-plus/hector-plus.webp";
const mgZsEvImage = "../assets/vehicles/mg/zs-ev/zs-ev.webp";
const mgGlosterImage = "../assets/vehicles/mg/gloster/gloster.webp";
const mgWindsorEvImage = "../assets/vehicles/mg/windsor-ev/windsor-ev.webp";
const jeepCompassImage = "../assets/vehicles/jeep/compass/compass.webp";
const jeepMeridianImage = "../assets/vehicles/jeep/meridian/meridian.webp";
const jeepWranglerImage = "../assets/vehicles/jeep/wrangler/wrangler.webp";
const jeepGrandCherokeeImage = "../assets/vehicles/jeep/grand-cherokee/grand-cherokee.webp";
const bmw2SeriesImage = "../assets/vehicles/bmw/2-series/2-series.webp";
const bmw3SeriesImage = "../assets/vehicles/bmw/3-series/3-series.webp";
const bmw5SeriesImage = "../assets/vehicles/bmw/5-series/5-series.webp";
const bmwX1Image = "../assets/vehicles/bmw/x1/x1.webp";
const bmwX3Image = "../assets/vehicles/bmw/x3/x3.webp";
const bmwX5Image = "../assets/vehicles/bmw/x5/x5.webp";
const bmwX7Image = "../assets/vehicles/bmw/x7/x7.webp";
const bmwI4Image = "../assets/vehicles/bmw/i4/i4.webp";
const bmwI5Image = "../assets/vehicles/bmw/i5/i5.webp";
const bmwI7Image = "../assets/vehicles/bmw/i7/i7.webp";
const bmwIxImage = "../assets/vehicles/bmw/ix/ix.webp";
const mercedesBenzAClassImage = "../assets/vehicles/mercedes-benz/a-class/a-class.webp";
const mercedesBenzCClassImage = "../assets/vehicles/mercedes-benz/c-class/c-class.webp";
const mercedesBenzEClassImage = "../assets/vehicles/mercedes-benz/e-class/e-class.webp";
const mercedesBenzSClassImage = "../assets/vehicles/mercedes-benz/s-class/s-class.webp";
const mercedesBenzGlaImage = "../assets/vehicles/mercedes-benz/gla/gla.webp";
const mercedesBenzGlcImage = "../assets/vehicles/mercedes-benz/glc/glc.webp";
const mercedesBenzGleImage = "../assets/vehicles/mercedes-benz/gle/gle.webp";
const mercedesBenzGlsImage = "../assets/vehicles/mercedes-benz/gls/gls.webp";
const mercedesBenzEqeImage = "../assets/vehicles/mercedes-benz/eqe/eqe.webp";
const mercedesBenzEqsImage = "../assets/vehicles/mercedes-benz/eqs/eqs.webp";
const audiA4Image = "../assets/vehicles/audi/a4/a4.webp";
const audiA6Image = "../assets/vehicles/audi/a6/a6.webp";
const audiA8Image = "../assets/vehicles/audi/a8/a8.webp";
const audiQ3Image = "../assets/vehicles/audi/q3/q3.webp";
const audiQ5Image = "../assets/vehicles/audi/q5/q5.webp";
const audiQ7Image = "../assets/vehicles/audi/q7/q7.webp";
const audiQ8Image = "../assets/vehicles/audi/q8/q8.webp";
const audiETronImage = "../assets/vehicles/audi/e-tron/e-tron.webp";
const audiQ8ETronImage = "../assets/vehicles/audi/q8-e-tron/q8-e-tron.webp";
const volvoS90Image = "../assets/vehicles/volvo/s90/s90.webp";
const volvoXc40Image = "../assets/vehicles/volvo/xc40/xc40.webp";
const volvoXc60Image = "../assets/vehicles/volvo/xc60/xc60.webp";
const volvoXc90Image = "../assets/vehicles/volvo/xc90/xc90.webp";
const volvoEx30Image = "../assets/vehicles/volvo/ex30/ex30.webp";
const volvoEx40Image = "../assets/vehicles/volvo/ex40/ex40.webp";
const volvoEx90Image = "../assets/vehicles/volvo/ex90/ex90.webp";
const lexusEsImage = "../assets/vehicles/lexus/es/es.webp";
const lexusNxImage = "../assets/vehicles/lexus/nx/nx.webp";
const lexusRxImage = "../assets/vehicles/lexus/rx/rx.webp";
const lexusLxImage = "../assets/vehicles/lexus/lx/lx.webp";
const lexusLmImage = "../assets/vehicles/lexus/lm/lm.webp";
const landRoverDefenderImage = "../assets/vehicles/land-rover/defender/defender.webp";
const landRoverDiscoveryImage = "../assets/vehicles/land-rover/discovery/discovery.webp";
const landRoverRangeRoverEvoqueImage = "../assets/vehicles/land-rover/range-rover-evoque/range-rover-evoque.webp";
const landRoverRangeRoverSportImage = "../assets/vehicles/land-rover/range-rover-sport/range-rover-sport.webp";
const landRoverRangeRoverImage = "../assets/vehicles/land-rover/range-rover/range-rover.webp";
const landRoverRangeRoverVelarImage = "../assets/vehicles/land-rover/range-rover-velar/range-rover-velar.webp";
const miniCooperImage = "../assets/vehicles/mini/cooper/cooper.webp";
const miniCooperSImage = "../assets/vehicles/mini/cooper-s/cooper-s.webp";
const miniCountrymanImage = "../assets/vehicles/mini/countryman/countryman.webp";
const miniConvertibleImage = "../assets/vehicles/mini/convertible/convertible.webp";

const ALLOWED_VEHICLE_CLASSES = [
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

const ALLOWED_BRANDS = Object.freeze([
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

const ALLOWED_CATEGORIES = Object.freeze(['HATCHBACK', 'SEDAN', 'SUV', 'MUV', 'VAN', 'LUXURY'])

const ALLOWED_FUEL_TYPES = Object.freeze(['Petrol', 'Diesel', 'Electric', 'Hybrid'])

const ALLOWED_TRANSMISSIONS = Object.freeze(['Automatic', 'Manual'])

const ALLOWED_AVAILABILITIES = Object.freeze(['AVAILABLE', 'RESERVED', 'RENTED', 'MAINTENANCE', 'INACTIVE'])

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
    description: `DriveEase verified fleet ${brand} ${model} offering premium reliability, verified cabin hygiene, and versatile performance.`,
    features: ['Bluetooth Audio', 'Touchscreen Infotainment', 'Reverse Camera', 'Dual Airbags', 'Cruise Control', 'Climate Control'],
    dailyRate,
    pricing: createPricing(dailyRate),
    image: vehicleCatalogueImage,
    imagePosition: 'center',
    images: { primary: vehicleCatalogueImage, gallery: [] },
    imageVerified: false,
  }
}

const catalogue = [
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


const vehicleImageMap = {
  'maruti-suzuki-swift': marutiSuzukiSwiftImage,
  'maruti-suzuki-baleno': marutiSuzukiBalenoImage,
  'maruti-suzuki-dzire': marutiSuzukiDzireImage,
  'maruti-suzuki-fronx': marutiSuzukiFronxImage,
  'maruti-suzuki-brezza': marutiSuzukiBrezzaImage,
  'maruti-suzuki-grand-vitara': marutiSuzukiGrandVitaraImage,
  'maruti-suzuki-ertiga': marutiSuzukiErtigaImage,
  'maruti-suzuki-xl6': marutiSuzukiXl6Image,
  'maruti-suzuki-jimny': marutiSuzukiJimnyImage,
  'maruti-suzuki-invicto': marutiSuzukiInvictoImage,
  'tata-tiago': tataTiagoImage,
  'tata-altroz': tataAltrozImage,
  'tata-tigor': tataTigorImage,
  'tata-punch': tataPunchImage,
  'tata-nexon': tataNexonImage,
  'tata-harrier': tataHarrierImage,
  'tata-safari': tataSafariImage,
  'tata-curvv': tataCurvvImage,
  'tata-nexon-ev': tataNexonEvImage,
  'tata-punch-ev': tataPunchEvImage,
  'mahindra-xuv-3xo': mahindraXuv3xoImage,
  'mahindra-xuv700': mahindraXuv700Image,
  'mahindra-scorpio': mahindraScorpioImage,
  'mahindra-scorpio-n': mahindraScorpioNImage,
  'mahindra-thar': mahindraTharImage,
  'mahindra-bolero': mahindraBoleroImage,
  'mahindra-bolero-neo': mahindraBoleroNeoImage,
  'mahindra-marazzo': mahindraMarazzoImage,
  'hyundai-grand-i10-nios': hyundaiGrandI10NiosImage,
  'hyundai-i20': hyundaiI20Image,
  'hyundai-aura': hyundaiAuraImage,
  'hyundai-verna': hyundaiVernaImage,
  'hyundai-exter': hyundaiExterImage,
  'hyundai-venue': hyundaiVenueImage,
  'hyundai-creta': hyundaiCretaImage,
  'hyundai-alcazar': hyundaiAlcazarImage,
  'hyundai-tucson': hyundaiTucsonImage,
  'hyundai-ioniq-5': hyundaiIoniq5Image,
  'kia-sonet': kiaSonetImage,
  'kia-seltos': kiaSeltosImage,
  'kia-carens': kiaCarensImage,
  'kia-carnival': kiaCarnivalImage,
  'kia-ev6': kiaEv6Image,
  'toyota-glanza': toyotaGlanzaImage,
  'toyota-urban-cruiser-taisor': toyotaUrbanCruiserTaisorImage,
  'toyota-urban-cruiser-hyryder': toyotaUrbanCruiserHyryderImage,
  'toyota-rumion': toyotaRumionImage,
  'toyota-innova-crysta': toyotaInnovaCrystaImage,
  'toyota-innova-hycross': toyotaInnovaHycrossImage,
  'toyota-fortuner': toyotaFortunerImage,
  'toyota-legender': toyotaLegenderImage,
  'toyota-hilux': toyotaHiluxImage,
  'toyota-camry': toyotaCamryImage,
  'toyota-land-cruiser': toyotaLandCruiserImage,
  'toyota-vellfire': toyotaVellfireImage,
  'honda-amaze': hondaAmazeImage,
  'honda-city': hondaCityImage,
  'honda-elevate': hondaElevateImage,
  'honda-city-e-hev': hondaCityEHevImage,
  'renault-kwid': renaultKwidImage,
  'renault-triber': renaultTriberImage,
  'renault-kiger': renaultKigerImage,
  'renault-duster': renaultDusterImage,
  'nissan-magnite': nissanMagniteImage,
  'nissan-x-trail': nissanXTrailImage,
  'volkswagen-virtus': volkswagenVirtusImage,
  'volkswagen-taigun': volkswagenTaigunImage,
  'volkswagen-tiguan': volkswagenTiguanImage,
  'skoda-slavia': skodaSlaviaImage,
  'skoda-kushaq': skodaKushaqImage,
  'skoda-kodiaq': skodaKodiaqImage,
  'skoda-superb': skodaSuperbImage,
  'mg-comet-ev': mgCometEvImage,
  'mg-astor': mgAstorImage,
  'mg-hector': mgHectorImage,
  'mg-hector-plus': mgHectorPlusImage,
  'mg-zs-ev': mgZsEvImage,
  'mg-gloster': mgGlosterImage,
  'mg-windsor-ev': mgWindsorEvImage,
  'jeep-compass': jeepCompassImage,
  'jeep-meridian': jeepMeridianImage,
  'jeep-wrangler': jeepWranglerImage,
  'jeep-grand-cherokee': jeepGrandCherokeeImage,
  'bmw-2-series': bmw2SeriesImage,
  'bmw-3-series': bmw3SeriesImage,
  'bmw-5-series': bmw5SeriesImage,
  'bmw-x1': bmwX1Image,
  'bmw-x3': bmwX3Image,
  'bmw-x5': bmwX5Image,
  'bmw-x7': bmwX7Image,
  'bmw-i4': bmwI4Image,
  'bmw-i5': bmwI5Image,
  'bmw-i7': bmwI7Image,
  'bmw-ix': bmwIxImage,
  'mercedes-benz-a-class': mercedesBenzAClassImage,
  'mercedes-benz-c-class': mercedesBenzCClassImage,
  'mercedes-benz-e-class': mercedesBenzEClassImage,
  'mercedes-benz-s-class': mercedesBenzSClassImage,
  'mercedes-benz-gla': mercedesBenzGlaImage,
  'mercedes-benz-glc': mercedesBenzGlcImage,
  'mercedes-benz-gle': mercedesBenzGleImage,
  'mercedes-benz-gls': mercedesBenzGlsImage,
  'mercedes-benz-eqe': mercedesBenzEqeImage,
  'mercedes-benz-eqs': mercedesBenzEqsImage,
  'audi-a4': audiA4Image,
  'audi-a6': audiA6Image,
  'audi-a8': audiA8Image,
  'audi-q3': audiQ3Image,
  'audi-q5': audiQ5Image,
  'audi-q7': audiQ7Image,
  'audi-q8': audiQ8Image,
  'audi-e-tron': audiETronImage,
  'audi-q8-e-tron': audiQ8ETronImage,
  'volvo-s90': volvoS90Image,
  'volvo-xc40': volvoXc40Image,
  'volvo-xc60': volvoXc60Image,
  'volvo-xc90': volvoXc90Image,
  'volvo-ex30': volvoEx30Image,
  'volvo-ex40': volvoEx40Image,
  'volvo-ex90': volvoEx90Image,
  'lexus-es': lexusEsImage,
  'lexus-nx': lexusNxImage,
  'lexus-rx': lexusRxImage,
  'lexus-lx': lexusLxImage,
  'lexus-lm': lexusLmImage,
  'land-rover-defender': landRoverDefenderImage,
  'land-rover-discovery': landRoverDiscoveryImage,
  'land-rover-range-rover-evoque': landRoverRangeRoverEvoqueImage,
  'land-rover-range-rover-sport': landRoverRangeRoverSportImage,
  'land-rover-range-rover': landRoverRangeRoverImage,
  'land-rover-range-rover-velar': landRoverRangeRoverVelarImage,
  'mini-cooper': miniCooperImage,
  'mini-cooper-s': miniCooperSImage,
  'mini-countryman': miniCountrymanImage,
  'mini-convertible': miniConvertibleImage,
}

const cars = catalogue.flatMap(([brand, models]) =>
  models.map(([model, category, vehicleClass, fuelType = 'Petrol', rate, status = 'AVAILABLE'], index) => {
    const v = createVehicle({ brand, model, category, vehicleClass, fuelType, rate, status }, index)
    const localImg = vehicleImageMap[v.id]
    if (localImg) {
      v.image = localImg
      v.imageVerified = true
      v.imageSource = 'local-verified'
      v.images = {
        primary: localImg,
        gallery: [localImg],
      }
    }
    return v
  }),
)

export { bikes, bikeImageMap, bikeCatalogue, ALLOWED_BIKE_BRANDS, ALLOWED_BIKE_CATEGORIES, ALLOWED_BIKE_CLASSES }

const vehicles = [...cars, ...bikes]

function validateVehicleImages(list = vehicles) {
  return list.map((vehicle) => {
    const localImg = vehicle.vehicleType === 'bike' ? bikeImageMap[vehicle.id] : vehicleImageMap[vehicle.id]
    if (localImg) {
      return {
        ...vehicle,
        image: localImg,
        imageVerified: true,
        imageSource: 'local-verified',
        images: {
          primary: localImg,
          gallery: [localImg],
        },
      }
    }
    return vehicle
  })
}

function getVehicleById(id) {
  return vehicles.find((vehicle) => vehicle.id === id)
}

function getVehicles() {
  return vehicles
}

function getCars() {
  return cars
}

function getBikes() {
  return bikes
}


export { vehicles, vehicleCatalogue, vehiclesById };