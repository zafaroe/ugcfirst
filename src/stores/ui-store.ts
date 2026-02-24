import { create } from 'zustand'

interface UIState {
  // Sidebar/Navigation
  isSidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void

  // Modal state
  isModalOpen: boolean
  modalContent: React.ReactNode | null
  openModal: (content: React.ReactNode) => void
  closeModal: () => void

  // Toast notifications (managed separately by Toast context, but can store config here)

  // Loading overlay
  isGlobalLoading: boolean
  globalLoadingMessage: string | null
  setGlobalLoading: (loading: boolean, message?: string) => void

  // Theme (for future dark/light mode)
  theme: 'dark' | 'light'
  setTheme: (theme: 'dark' | 'light') => void

  // Video creation wizard state
  creationStep: number
  setCreationStep: (step: number) => void
  resetCreationWizard: () => void
}

export const useUIStore = create<UIState>((set) => ({
  // Sidebar
  isSidebarOpen: false,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),

  // Modal
  isModalOpen: false,
  modalContent: null,
  openModal: (content) => set({ isModalOpen: true, modalContent: content }),
  closeModal: () => set({ isModalOpen: false, modalContent: null }),

  // Global loading
  isGlobalLoading: false,
  globalLoadingMessage: null,
  setGlobalLoading: (loading, message) =>
    set({ isGlobalLoading: loading, globalLoadingMessage: message || null }),

  // Theme
  theme: 'dark',
  setTheme: (theme) => set({ theme }),

  // Creation wizard
  creationStep: 0,
  setCreationStep: (step) => set({ creationStep: step }),
  resetCreationWizard: () => set({ creationStep: 0 }),
}))
