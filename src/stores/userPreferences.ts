import { defineStore } from 'pinia'

interface UserPreferences {
  id: string
  user_id: string
  summary: string
  preferences: {
    dietary_restrictions: string[]
    favorite_cuisines: string[]
    cooking_skill_level: string
    allergies: string[]
    dislikes: string[]
  }
  created_at: string
  updated_at: string
}

export const useUserPreferencesStore = defineStore('userPreferences', {
  state: () => ({
    preferences: null as UserPreferences | null,
  }),

  actions: {
    setPreferences(preferences: UserPreferences) {
      this.preferences = preferences
    },

    loadPreferences() {
      // This is now handled in App.vue by loading from Supabase
      return this.preferences
    },

    clearPreferences() {
      this.preferences = null
    },

    getDietaryRestrictions() {
      return this.preferences?.preferences.dietary_restrictions || []
    },

    getFavoriteCuisines() {
      return this.preferences?.preferences.favorite_cuisines || []
    },

    getCookingSkillLevel() {
      return this.preferences?.preferences.cooking_skill_level || ''
    },

    getAllergies() {
      return this.preferences?.preferences.allergies || []
    },

    getDislikes() {
      return this.preferences?.preferences.dislikes || []
    },
  },
})
