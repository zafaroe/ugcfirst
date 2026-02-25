import type { User, CreditBalance, CreditTransaction } from '@/types'

export const mockUser: User = {
  id: 'user_1',
  email: 'dave@dropshipstore.com',
  name: 'Dave Wilson',
  avatar: '/images/avatars/user.svg',
  plan: 'pro',
  createdAt: '2024-01-15T00:00:00Z',
}

export const mockCreditBalance: CreditBalance = {
  total: 185,
  monthly: 250,
  purchased: 0,
  used: 65,
}

export const mockTransactions: CreditTransaction[] = [
  {
    id: 'txn_1',
    type: 'subscription',
    amount: 250,
    description: 'Pro Plan - Monthly Credits',
    createdAt: '2024-12-01T00:00:00Z',
  },
  {
    id: 'txn_2',
    type: 'usage',
    amount: -10,
    description: 'Video Generation - Nike Air Max Promo',
    createdAt: '2024-12-03T14:30:00Z',
  },
  {
    id: 'txn_3',
    type: 'usage',
    amount: -15,
    description: 'Auto Pilot - Smart Watch Feature',
    createdAt: '2024-12-04T09:15:00Z',
  },
  {
    id: 'txn_4',
    type: 'refund',
    amount: 10,
    description: 'Refund - Cosmetics Bundle (Generation Failed)',
    createdAt: '2024-12-02T11:00:00Z',
  },
  {
    id: 'txn_5',
    type: 'usage',
    amount: -10,
    description: 'Video Generation - Headphones Unboxing',
    createdAt: '2024-12-05T16:45:00Z',
  },
  {
    id: 'txn_6',
    type: 'usage',
    amount: -10,
    description: 'Video Generation - Fitness Tracker Ad',
    createdAt: '2024-12-06T10:20:00Z',
  },
  {
    id: 'txn_7',
    type: 'usage',
    amount: -10,
    description: 'Video Edit - Nike Air Max Promo',
    createdAt: '2024-12-06T14:00:00Z',
  },
]

export function getUserById(id: string): User | undefined {
  if (id === mockUser.id) return mockUser
  return undefined
}
