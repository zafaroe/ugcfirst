import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Apply theme class to document
 */
function applyThemeClass(theme: 'dark' | 'light') {
  if (typeof document !== 'undefined') {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }
}

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

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
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

      // Theme - locked to 'dark' (dark-only mode)
      // Store structure kept for potential future use
      theme: 'dark',
      setTheme: (_theme) => {
        // Dark-only mode: always stay dark
        set({ theme: 'dark' })
        applyThemeClass('dark')
      },

      // Creation wizard
      creationStep: 0,
      setCreationStep: (step) => set({ creationStep: step }),
      resetCreationWizard: () => set({ creationStep: 0 }),
    }),
    {
      name: 'ui-storage',
      // Only persist theme preference
      partialize: (state) => ({ theme: state.theme }),
      onRehydrateStorage: () => (state) => {
        // After hydration, sync DOM class with persisted theme
        if (state?.theme) {
          applyThemeClass(state.theme)
        }
      },
    }
  )
)
