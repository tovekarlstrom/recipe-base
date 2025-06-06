<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import { useRecipesStore } from '@/stores/recipes'
import ChatField from '@/components/ChatField.vue'
import ChatBubble from '@/components/ChatBubble.vue'
import RecipeTimer from '@/components/Timer.vue'
import { useTimerStore } from '@/stores/timer'
import { initializeTimerStore } from '@/services/timer'
import { useUserPreferencesStore } from '@/stores/userPreferences'
import NavbarComponent from '@/components/NavbarComponent.vue'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/supabase/supabaseClient'

const router = useRouter()
const { prefetchRecipes } = useRecipesStore()
const timerStore = useTimerStore()
const userPreferencesStore = useUserPreferencesStore()
const authStore = useAuthStore()
const isChatOpen = ref(false)
const timerRef = ref<InstanceType<typeof RecipeTimer> | null>(null)

// Watch for auth state changes
watch(
  () => authStore.isSignedIn,
  (newValue) => {
    if (!newValue) {
      router.push('/signin')
    }
  },
)

onMounted(() => {
  authStore.initAuth()
})

onMounted(() => {
  const localFirstTime = localStorage.getItem('firstTime')

  if (localFirstTime !== 'false') {
    localStorage.setItem('firstTime', 'false')
    router.push('/onboarding')
  } else {
    // Load user preferences if they exist
    userPreferencesStore.loadPreferences()
  }
})

// Initialize the timer service with the store
onMounted(() => {
  console.log('App: Initializing timer store')
  initializeTimerStore(timerStore)
})

// Watch for timer state changes
watch(
  () => timerStore.showTimer,
  (newValue) => {
    console.log('App: Timer visibility changed:', newValue)
    if (newValue && timerRef.value) {
      console.log('App: Timer component reference:', timerRef.value)
      // Ensure the timer is properly initialized with the current duration
      const minutes = Math.floor(timerStore.timerDuration / 60)
      const seconds = timerStore.timerDuration % 60
      console.log('App: Setting timer duration:', { minutes, seconds })
      timerRef.value.setTime(minutes, seconds)
    }
  },
)

watch(
  () => timerStore.timerDuration,
  (newValue) => {
    console.log('App: Timer duration changed:', newValue)
    if (newValue > 0 && timerRef.value) {
      console.log('App: Setting timer duration on component')
      timerRef.value.setTime(Math.floor(newValue / 60), newValue % 60)
    }
  },
)

function handleChatOpen() {
  isChatOpen.value = !isChatOpen.value
}

onMounted(async () => {
  // Start loading recipes as soon as the app mounts
  await prefetchRecipes()
  // Load user preferences from Supabase if user is signed in
  const user = await supabase.auth.getUser()
  console.log('App: User:', user)
  if (user.data.user) {
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.data.user.id)
      .single()
    console.log('App: Preferences:', preferences)
    if (preferences) {
      userPreferencesStore.setPreferences(preferences)
    }
  }
})
</script>

<template>
  <div>
    <NavbarComponent v-if="authStore.isSignedIn" />
    <RouterView />

    <div v-if="authStore.isSignedIn">
      <div
        v-if="isChatOpen"
        class="fixed inset-0 flex items-center justify-center z-10 bg-black/50"
      >
        <ChatField @closeChat="handleChatOpen" />
      </div>
      <div class="fixed bottom-4 right-4">
        <ChatBubble @openChat="handleChatOpen" />
      </div>
      <Transition name="fade">
        <div v-if="timerStore.showTimer" class="fixed bottom-4 left-4 z-50">
          <RecipeTimer
            ref="timerRef"
            :initial-minutes="Math.floor(timerStore.timerDuration / 60)"
            :initial-seconds="timerStore.timerDuration % 60"
          />
        </div>
      </Transition>
    </div>
  </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
