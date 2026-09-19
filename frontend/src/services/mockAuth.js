const USERS_KEY = 'vayro_mock_users'
const ACTIVITIES_KEY = 'vayro_mock_activities'

// Enriched seed accounts
const seedUsers = [
  {
    id: 'usr_customer_001',
    name: 'Aarav Mehta',
    email: 'customer@vayro.com',
    role: 'CUSTOMER',
    status: 'ACTIVE',
    phone: '+91 98765 43210',
    address: 'Bandra West, Mumbai, MH',
    joinedAt: '2025-08-12',
  },
  {
    id: 'usr_admin_001',
    name: 'Maya Rao',
    email: 'admin@vayro.com',
    role: 'ADMIN',
    status: 'ACTIVE',
    phone: '+91 98200 11223',
    address: 'Indiranagar, Bengaluru, KA',
    joinedAt: '2025-01-10',
  },
  {
    id: 'usr_customer_002',
    name: 'Rohan Verma',
    email: 'rohan.verma@example.com',
    role: 'CUSTOMER',
    status: 'ACTIVE',
    phone: '+91 98111 22334',
    address: 'Connaught Place, New Delhi, DL',
    joinedAt: '2025-09-18',
  },
  {
    id: 'usr_customer_003',
    name: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    role: 'CUSTOMER',
    status: 'ACTIVE',
    phone: '+91 98450 33445',
    address: 'Koramangala, Bengaluru, KA',
    joinedAt: '2025-10-05',
  },
  {
    id: 'usr_customer_004',
    name: 'Vikram Malhotra',
    email: 'vikram.m@example.com',
    role: 'CUSTOMER',
    status: 'ACTIVE',
    phone: '+91 97666 44556',
    address: 'Koregaon Park, Pune, MH',
    joinedAt: '2025-11-22',
  },
  {
    id: 'usr_customer_005',
    name: 'Ananya Desai',
    email: 'ananya.d@example.com',
    role: 'CUSTOMER',
    status: 'ACTIVE',
    phone: '+91 99888 77665',
    address: 'Jubilee Hills, Hyderabad, TS',
    joinedAt: '2025-12-01',
  },
]

const pause = (duration = 240) => new Promise((resolve) => window.setTimeout(resolve, duration))

function readRegisteredUsers() {
  try {
    return JSON.parse(window.localStorage.getItem(USERS_KEY) || '[]')
  } catch {
    return []
  }
}

function writeRegisteredUsers(users) {
  try {
    window.localStorage.setItem(USERS_KEY, JSON.stringify(users))
  } catch (err) {
    console.error('Failed to write users:', err)
  }
}

function logUserActivity({ type, title, detail }) {
  try {
    const raw = window.localStorage.getItem(ACTIVITIES_KEY)
    const activities = raw ? JSON.parse(raw) : []
    const newActivity = {
      id: `activity-${Date.now()}`,
      type,
      title,
      detail,
      occurredAt: 'Just now',
    }
    const updated = [newActivity, ...activities].slice(0, 10)
    window.localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(updated))
  } catch (err) {
    console.error('Failed to log user activity:', err)
  }
}

function toSessionUser({ password, ...user }) {
  return {
    ...user,
    status: user.status || 'ACTIVE',
    joinedAt: user.joinedAt || '2025-10-01',
  }
}

function createMockToken(user) {
  return `mock.${window.btoa(`${user.id}:${user.role}:${Date.now()}`)}.token`
}

function getAllUsers() {
  const registered = readRegisteredUsers()
  const map = new Map()
  for (const u of seedUsers) {
    map.set(u.id, { ...u })
  }
  for (const u of registered) {
    map.set(u.id, { ...map.get(u.id), ...u })
  }
  return Array.from(map.values())
}

export function getMockUsers() {
  return getAllUsers().map(toSessionUser)
}

export function getMockUserById(id) {
  const user = getAllUsers().find((u) => u.id === id)
  return user ? toSessionUser(user) : null
}

export async function authenticateMockUser({ email, password }) {
  await pause()
  const normalizedEmail = email.trim().toLowerCase()
  const user = getAllUsers().find((candidate) => candidate.email === normalizedEmail)

  if (!user || user.password !== password) {
    throw new Error('The email or password is incorrect.')
  }

  if (user.status === 'SUSPENDED') {
    throw new Error('Your account has been suspended by administration. Please contact fleet support.')
  }

  return { user: toSessionUser(user), token: createMockToken(user) }
}

export async function registerMockUser({ name, email, password, phone }) {
  await pause()
  const normalizedEmail = email.trim().toLowerCase()
  const existingUsers = getAllUsers()

  if (existingUsers.some((user) => user.email === normalizedEmail)) {
    throw new Error('An account with this email already exists.')
  }

  const user = {
    id: `usr_customer_${Date.now()}`,
    name: name.trim(),
    email: normalizedEmail,
    role: 'CUSTOMER',
    status: 'ACTIVE',
    phone: phone || '+91 98765 43210',
    address: 'Mumbai, Maharashtra',
    joinedAt: new Date().toISOString().slice(0, 10),
    password,
  }

  const registered = readRegisteredUsers()
  writeRegisteredUsers([...registered, user])
  return { user: toSessionUser(user), token: createMockToken(user) }
}

export async function updateMockUserProfile(userId, updates) {
  await pause(240)
  const users = getAllUsers()
  const index = users.findIndex((u) => u.id === userId)
  if (index === -1) throw new Error('User not found.')

  const updatedUser = { ...users[index], ...updates }
  const registered = readRegisteredUsers().filter((u) => u.id !== userId)
  writeRegisteredUsers([...registered, updatedUser])

  return toSessionUser(updatedUser)
}

export async function changeMockUserPassword(userId, { currentPassword, newPassword }) {
  await pause(280)
  const users = getAllUsers()
  const user = users.find((u) => u.id === userId)
  if (!user) throw new Error('User not found.')

  if (user.password !== currentPassword) {
    throw new Error('Current password does not match.')
  }

  const updatedUser = { ...user, password: newPassword }
  const registered = readRegisteredUsers().filter((u) => u.id !== userId)
  writeRegisteredUsers([...registered, updatedUser])

  return { success: true }
}

export async function updateMockUserStatus(userId, newStatus) {
  await pause(250)
  const users = getAllUsers()
  const user = users.find((u) => u.id === userId)
  if (!user) throw new Error('User not found.')

  if (user.status === newStatus) {
    return toSessionUser(user)
  }

  // Safety check: protect the only active admin account
  if (user.role === 'ADMIN' && newStatus === 'SUSPENDED') {
    const activeAdmins = users.filter((u) => u.role === 'ADMIN' && u.status === 'ACTIVE')
    if (activeAdmins.length <= 1) {
      throw new Error('This account is the only administrator and cannot be suspended.')
    }
  }

  const updatedUser = { ...user, status: newStatus }
  const registered = readRegisteredUsers().filter((u) => u.id !== userId)
  writeRegisteredUsers([...registered, updatedUser])

  logUserActivity({
    type: newStatus === 'SUSPENDED' ? 'cancelled' : 'confirmed',
    title: newStatus === 'SUSPENDED' ? 'User suspended' : 'User reactivated',
    detail: `${user.name} (${user.email}) · Marked ${newStatus}`,
  })

  return toSessionUser(updatedUser)
}


