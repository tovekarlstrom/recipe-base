import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const isSignedIn = ref(false)

  // Initialize from localStorage
  const initAuth = () => {
    const storedValue = localStorage.getItem('isSignedIn')
    isSignedIn.value = storedValue === 'true'
  }

  // Set auth state
  const setAuth = (value: boolean) => {
    isSignedIn.value = value
    localStorage.setItem('isSignedIn', value.toString())
  }

  // Watch for localStorage changes
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key === 'isSignedIn') {
        initAuth()
      }
    })
  }

  return {
    isSignedIn,
    initAuth,
    setAuth,
  }
})
