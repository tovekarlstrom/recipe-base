import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/supabase/supabaseClient'

export const useAuthStore = defineStore('auth', () => {
  const isSignedIn = ref(false)

  // Initialize from Supabase session
  const initAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    isSignedIn.value = !!session
  }

  // Set auth state
  const setAuth = (value: boolean) => {
    isSignedIn.value = value
  }

  // Listen for auth state changes
  supabase.auth.onAuthStateChange((event, session) => {
    isSignedIn.value = !!session
  })

  return {
    isSignedIn,
    initAuth,
    setAuth,
  }
})
