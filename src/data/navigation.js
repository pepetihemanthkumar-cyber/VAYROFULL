import {
  Bike,
  BookOpenCheck,
  CarFront,
  ClipboardList,
  HelpCircle,
  LayoutDashboard,
  UserRound,
  UsersRound,
  Wrench,
} from 'lucide-react'

export const customerNavigation = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, end: true }],
  },
  {
    label: 'Fleet Catalogue',
    items: [
      { label: 'Cars', to: '/cars', icon: CarFront },
      { label: 'Bikes', to: '/bikes', icon: Bike },
    ],
  },
  {
    label: 'Rentals',
    items: [{ label: 'Bookings', to: '/bookings', icon: BookOpenCheck }],
  },
  {
    label: 'Account',
    items: [
      { label: 'Profile', to: '/profile', icon: UserRound },
      { label: 'Help & FAQ', to: '/help', icon: HelpCircle },
    ],
  },
]

export const adminNavigation = {
  label: 'Administration',
  items: [
    { label: 'Admin Dashboard', to: '/admin/dashboard', icon: LayoutDashboard, end: true },
    { label: 'Manage Fleet', to: '/admin/vehicles', icon: Wrench },
    { label: 'Manage Bookings', to: '/admin/bookings', icon: ClipboardList },
    { label: 'Users', to: '/admin/users', icon: UsersRound },
  ],
}

const pageTitles = [
  { match: /^\/admin\/dashboard$/, title: 'Fleet overview', section: 'Fleet Operations' },
  { match: /^\/admin\/vehicles\/new$/, title: 'Add vehicle', section: 'Fleet Operations' },
  { match: /^\/admin\/vehicles\/[^/]+\/edit$/, title: 'Edit vehicle', section: 'Fleet Operations' },
  { match: /^\/admin\/vehicles\/[^/]+$/, title: 'Vehicle details', section: 'Fleet Operations' },
  { match: /^\/admin\/vehicles$/, title: 'Fleet inventory', section: 'Fleet Operations' },
  { match: /^\/admin\/bookings\/[^/]+$/, title: 'Booking operations', section: 'Administration' },
  { match: /^\/admin\/bookings$/, title: 'Booking operations', section: 'Administration' },
  { match: /^\/admin\/users\/[^/]+$/, title: 'User profile', section: 'Administration' },
  { match: /^\/admin\/users$/, title: 'User directory', section: 'Administration' },
  { match: /^\/bookings\/new/, title: 'New reservation', section: 'Rentals' },
  { match: /^\/bookings\/[^/]+$/, title: 'Booking details', section: 'Rentals' },
  { match: /^\/bookings$/, title: 'My bookings', section: 'Rentals' },
  { match: /^\/cars\/[^/]+$/, title: 'Car details', section: 'Fleet' },
  { match: /^\/cars$/, title: 'Car catalogue', section: 'Fleet' },
  { match: /^\/bikes\/[^/]+$/, title: 'Bike details', section: 'Fleet' },
  { match: /^\/bikes$/, title: 'Bike catalogue', section: 'Fleet' },
  { match: /^\/vehicles\/[^/]+$/, title: 'Vehicle details', section: 'Fleet' },
  { match: /^\/vehicles$/, title: 'Fleet inventory', section: 'Fleet' },
  { match: /^\/help/, title: 'Help & support', section: 'Account' },
  { match: /^\/profile/, title: 'Account profile', section: 'Account' },
  { match: /^\/dashboard$/, title: 'Dashboard', section: 'Overview' },
]

export function getPageContext(pathname) {
  return pageTitles.find(({ match }) => match.test(pathname)) || pageTitles.at(-1)
}
