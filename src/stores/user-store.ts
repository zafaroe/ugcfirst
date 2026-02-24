import { create } from 'zustand'
import type { User, CreditBalance, CreditTransaction } from '@/types'
import { mockUser, mockCreditBalance, mockTransactions } from '@/mocks/data'
import { delay } from '@/lib/utils'

interface UserState {
  // State
  user: User | null
  creditBalance: CreditBalance | null
  transactions: CreditTransaction[]
  isLoading: boolean
  error: string | null

  // Actions
  fetchUser: () => Promise<void>
  fetchCreditBalance: () => Promise<void>
  fetchTransactions: () => Promise<void>
  updateUser: (data: Partial<User>) => Promise<void>
  deductCredits: (amount: number, description: string) => void
  addCredits: (amount: number, description: string) => void
  logout: () => void
}

export const useUserStore = create<UserState>((set, get) => ({
  // Initial state
  user: null,
  creditBalance: null,
  transactions: [],
  isLoading: false,
  error: null,

  // Fetch user data
  fetchUser: async () => {
    set({ isLoading: true, error: null })
    try {
      await delay(500) // Simulate API call
      set({ user: mockUser, isLoading: false })
    } catch {
      set({ error: 'Failed to fetch user', isLoading: false })
    }
  },

  // Fetch credit balance
  fetchCreditBalance: async () => {
    set({ isLoading: true, error: null })
    try {
      await delay(300)
      set({ creditBalance: mockCreditBalance, isLoading: false })
    } catch {
      set({ error: 'Failed to fetch credit balance', isLoading: false })
    }
  },

  // Fetch transactions
  fetchTransactions: async () => {
    set({ isLoading: true, error: null })
    try {
      await delay(300)
      set({ transactions: mockTransactions, isLoading: false })
    } catch {
      set({ error: 'Failed to fetch transactions', isLoading: false })
    }
  },

  // Update user profile
  updateUser: async (data) => {
    set({ isLoading: true, error: null })
    try {
      await delay(500)
      const currentUser = get().user
      if (currentUser) {
        set({
          user: { ...currentUser, ...data },
          isLoading: false,
        })
      }
    } catch {
      set({ error: 'Failed to update user', isLoading: false })
    }
  },

  // Deduct credits (for video generation)
  deductCredits: (amount, description) => {
    const { creditBalance, transactions } = get()
    if (!creditBalance) return

    const newTransaction: CreditTransaction = {
      id: `txn_${Date.now()}`,
      type: 'usage',
      amount: -amount,
      description,
      createdAt: new Date().toISOString(),
    }

    set({
      creditBalance: {
        ...creditBalance,
        total: creditBalance.total - amount,
        used: creditBalance.used + amount,
      },
      transactions: [newTransaction, ...transactions],
    })
  },

  // Add credits (for purchases/refunds)
  addCredits: (amount, description) => {
    const { creditBalance, transactions } = get()
    if (!creditBalance) return

    const newTransaction: CreditTransaction = {
      id: `txn_${Date.now()}`,
      type: 'purchase',
      amount,
      description,
      createdAt: new Date().toISOString(),
    }

    set({
      creditBalance: {
        ...creditBalance,
        total: creditBalance.total + amount,
        purchased: creditBalance.purchased + amount,
      },
      transactions: [newTransaction, ...transactions],
    })
  },

  // Logout
  logout: () => {
    set({
      user: null,
      creditBalance: null,
      transactions: [],
      error: null,
    })
  },
}))
