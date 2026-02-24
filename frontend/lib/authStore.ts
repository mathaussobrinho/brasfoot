import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  nome: string
  sobrenome?: string
  login?: string
  email?: string
  tecnicoOverall?: number
}

interface AuthState {
  token: string | null
  user: User | null
  setAuth: (token: string, user: User) => void
  clearAuth: () => void
  loadFromStorage: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      clearAuth: () => {
        if (typeof window !== 'undefined') {
          document.cookie = 'token=; path=/; max-age=0'
        }
        set({ token: null, user: null })
      },
      loadFromStorage: () => {
        if (typeof window === 'undefined') return
        const token = localStorage.getItem('token')
        const userStr = localStorage.getItem('user')
        const user = userStr ? (JSON.parse(userStr) as User) : null
        const userId = localStorage.getItem('userId')
        if (token && (user || userId)) {
          set({
            token,
            user: user || (userId ? { id: userId, nome: '' } : null)
          })
        }
      }
    }),
    { name: 'brashero-auth', partialize: (s) => ({ token: s.token, user: s.user }) }
  )
)
