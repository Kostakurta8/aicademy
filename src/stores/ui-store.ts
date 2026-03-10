import { create } from 'zustand'

interface UIStore {
  sidebarCollapsed: boolean
  sidebarMobileOpen: boolean
  activeModal: string | null
  commandPaletteOpen: boolean

  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setSidebarMobileOpen: (open: boolean) => void
  setActiveModal: (modal: string | null) => void
  setCommandPaletteOpen: (open: boolean) => void
  toggleCommandPalette: () => void
}

export const useUIStore = create<UIStore>()((set) => ({
  sidebarCollapsed: false,
  sidebarMobileOpen: false,
  activeModal: null,
  commandPaletteOpen: false,

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setSidebarMobileOpen: (open) => set({ sidebarMobileOpen: open }),
  setActiveModal: (modal) => set({ activeModal: modal }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
}))
