import { defineStore } from 'pinia'
import { supabase } from '@/supabase/supabaseClient'

interface UserPreferences {
  equipment?: string[]
  dislikes?: string[]
  likes?: string[]
  dietary_restrictions?: string[]
  other_preferences?: string[]
}

export const useUserPreferencesStore = defineStore('userPreferences', {
  state: () => ({
    preferences: null as UserPreferences | null,
  }),

  actions: {
    async loadPreferences() {
      try {
        const user = await supabase.auth.getUser()
        if (user.data.user) {
          const { data: preferences, error } = await supabase
            .from('user_preferences_v2')
            .select('*')
            .eq('user_id', user.data.user.id)
            .single()

          if (error) {
            console.error('Error loading preferences:', error)
            return
          }

          if (preferences) {
            this.preferences = {
              equipment: preferences.equipment || [],
              dislikes: preferences.dislikes || [],
              likes: preferences.likes || [],
              dietary_restrictions: preferences.dietary_restrictions || [],
              other_preferences: preferences.other_preferences || [],
            }
          }
        }
      } catch (err) {
        console.error('Error in loadPreferences:', err)
      }
    },

    async updatePreferences(newPreferences: Partial<UserPreferences>) {
      try {
        const user = await supabase.auth.getUser()
        if (!user.data.user) return

        // Merge new preferences with existing ones
        const mergedPreferences = {
          ...this.preferences,
          ...newPreferences,
        }

        // Update local state
        this.preferences = mergedPreferences

        // Update in Supabase
        const { error } = await supabase.from('user_preferences_v2').upsert({
          user_id: user.data.user.id,
          equipment: mergedPreferences.equipment || [],
          dislikes: mergedPreferences.dislikes || [],
          likes: mergedPreferences.likes || [],
          dietary_restrictions: mergedPreferences.dietary_restrictions || [],
          other_preferences: mergedPreferences.other_preferences || [],
        })

        if (error) {
          console.error('Error updating preferences:', error)
          throw error
        }
      } catch (err) {
        console.error('Error in updatePreferences:', err)
        throw err
      }
    },

    clearPreferences() {
      this.preferences = null
    },
  },
})
