export const VAYRO_LOCATIONS = [
  {
    id: 'vga-central',
    name: 'VAYRO Vijayawada Central',
    city: 'Vijayawada',
    address: 'MG Road, Governorpet, Vijayawada, AP 520002',
    type: 'HUB',
    landmark: 'Near Benz Circle',
  },
  {
    id: 'vga-airport',
    name: 'Vijayawada Airport (VGA)',
    city: 'Vijayawada',
    address: 'Gannavaram Airport Terminal, Arrival Bay 2, AP 521102',
    type: 'AIRPORT',
    landmark: 'Arrival Terminal P1',
  },
  {
    id: 'vga-station',
    name: 'Vijayawada Railway Station (BZA)',
    city: 'Vijayawada',
    address: 'Station Road, Tarapet, Vijayawada, AP 520001',
    type: 'STATION',
    landmark: 'Platform 1 East Concourse',
  },
  {
    id: 'hyd-central',
    name: 'VAYRO Hyderabad Central',
    city: 'Hyderabad',
    address: 'Road No 36, Jubilee Hills, Hyderabad, TS 500033',
    type: 'HUB',
    landmark: 'Opp. Metro Station Pillar 1640',
  },
  {
    id: 'hyd-airport',
    name: 'Hyderabad Airport (HYD)',
    city: 'Hyderabad',
    address: 'Rajiv Gandhi International Airport, Shamshabad, TS 500409',
    type: 'AIRPORT',
    landmark: 'Car Rental Zone Level 0',
  },
  {
    id: 'hyd-station',
    name: 'Secunderabad Railway Station (SC)',
    city: 'Hyderabad',
    address: 'Station Road, Regimental Bazaar, Secunderabad, TS 500025',
    type: 'STATION',
    landmark: 'South Exit Parking Bay',
  },
  {
    id: 'blr-central',
    name: 'VAYRO Bengaluru Central',
    city: 'Bengaluru',
    address: '100 Feet Road, Indiranagar, Bengaluru, KA 560038',
    type: 'HUB',
    landmark: 'Near 12th Main Junction',
  },
  {
    id: 'blr-airport',
    name: 'Bengaluru Airport (BLR)',
    city: 'Bengaluru',
    address: 'Kempegowda International Airport, Devanahalli, Bengaluru, KA 560300',
    type: 'AIRPORT',
    landmark: 'Terminal 1 & 2 Mobility Pavilion',
  },
  {
    id: 'blr-station',
    name: 'Bengaluru City Station (SBC)',
    city: 'Bengaluru',
    address: 'Gubbi Thotadappa Rd, Majestic, Bengaluru, KA 560023',
    type: 'STATION',
    landmark: 'Majestic Concourse Gate 3',
  },
  {
    id: 'maa-central',
    name: 'VAYRO Chennai Central',
    city: 'Chennai',
    address: 'Anna Salai, T. Nagar, Chennai, TN 600017',
    type: 'HUB',
    landmark: 'Near Panagal Park',
  },
  {
    id: 'maa-airport',
    name: 'Chennai Airport (MAA)',
    city: 'Chennai',
    address: 'Meenambakkam, Chennai, TN 600027',
    type: 'AIRPORT',
    landmark: 'Domestic Arrival Ground Floor',
  },
  {
    id: 'maa-station',
    name: 'Chennai Central Railway Station (MAS)',
    city: 'Chennai',
    address: 'Kannappar Thidal, Periyamet, Chennai, TN 600003',
    type: 'STATION',
    landmark: 'Main Porch Parking Lot',
  },
]

export const DRIVE_EASE_LOCATIONS = VAYRO_LOCATIONS

export const DEFAULT_PICKUP_LOCATION = VAYRO_LOCATIONS[0].name

export const DEFAULT_RETURN_LOCATION = VAYRO_LOCATIONS[0].name

export function getLocationByName(name) {
  if (!name) return VAYRO_LOCATIONS[0]
  return VAYRO_LOCATIONS.find((loc) => loc.name === name) || { name, address: 'VAYRO Authorized Depot' }
}
