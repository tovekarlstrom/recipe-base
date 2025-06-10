import { defineStore } from 'pinia'
import { supabase } from '@/supabase/supabaseClient'

interface UserPreferences {
  cookingExperience?: 'Dålig' | 'Medel' | 'Avancerad' | 'Professionell'
  canReadRecipes?: boolean
  dietaryRestrictions?: string
  equipment?: string[]
  created_at?: string
}

export const useOnboardingStore = defineStore('onboardingStore', {
  state: () => ({
    preferences: null as UserPreferences | null,
    preferencesHistory: [] as UserPreferences[],
  }),

  actions: {
    async setPreferences(preferences: UserPreferences) {
      // Merge new preferences with existing ones
      const mergedPreferences = {
        ...this.preferences,
        ...preferences,
        created_at: new Date().toISOString(),
      }

      this.preferences = mergedPreferences
      // Store in localStorage for persistence
      localStorage.setItem('userPreferences', JSON.stringify(mergedPreferences))

      // Save to Supabase
      try {
        const user = await supabase.auth.getUser()
        if (user.data.user) {
          // Insert new preferences with timestamp
          const { error: insertError } = await supabase.from('user_preferences').insert({
            user_id: user.data.user.id,
            ...mergedPreferences,
          })

          if (insertError) {
            console.error('Error saving preferences to Supabase:', insertError)
            throw insertError
          }
        }
      } catch (err) {
        console.error('Error in setPreferences:', err)
        throw err
      }
    },

    async loadPreferences() {
      const stored = localStorage.getItem('userPreferences')
      if (stored) {
        try {
          this.preferences = JSON.parse(stored)
        } catch (err) {
          console.error('Error parsing stored preferences:', err)
          this.preferences = null
        }
      }

      // Load preferences history from Supabase
      try {
        const user = await supabase.auth.getUser()
        if (user.data.user) {
          const { data: preferences, error } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', user.data.user.id)
            .order('created_at', { ascending: false })

          if (error) {
            console.error('Error loading preferences history:', error)
          } else if (preferences) {
            this.preferencesHistory = preferences
          }
        }
      } catch (err) {
        console.error('Error loading preferences history:', err)
      }
    },

    clearPreferences() {
      this.preferences = null
      this.preferencesHistory = []
      localStorage.removeItem('userPreferences')
    },
  },
})
