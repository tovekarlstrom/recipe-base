<script setup lang="ts">
import { ref } from 'vue'
import InputComponent from './InputComponent.vue'
import { supabase } from '@/supabase/supabaseClient'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const email = ref('')
const password = ref('')
const newUser = ref(false)
const error = ref('')
const success = ref('')
const router = useRouter()
const authStore = useAuthStore()

async function handleSubmit() {
  console.log('handleSubmit')
  try {
    if (newUser.value) {
      signUp()
    } else {
      signIn()
    }
  } catch (e) {
    error.value = 'Failed to sign in'
    console.error('Failed to sign in:', e)
  }
}

async function signIn() {
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  })
  if (signInError) {
    error.value = signInError.message || 'Ett fel uppstod vid inloggning'
    console.error('Error signing in:', signInError)
  } else {
    success.value = 'Inloggning lyckades'
    setTimeout(() => {
      authStore.setAuth(true)
      success.value = ''
      const localFirstTime = localStorage.getItem('firstTime')
      if (localFirstTime === null) {
        router.push('/onboarding')
      } else {
        router.push('/')
      }
    }, 3000)
  }
}

async function signUp() {
  const { data, error: signUpError } = await supabase.auth.signUp({
    email: email.value,
    password: password.value,
  })

  if (signUpError) {
    error.value = signUpError.message || 'Ett fel uppstod vid registrering'
    console.error('Error signing up:', signUpError)
  } else {
    console.log('Sign up successful:', data)
    success.value = 'Registrering lyckades'
    setTimeout(() => {
      authStore.setAuth(true)
      success.value = ''
      const localFirstTime = localStorage.getItem('firstTime')
      if (localFirstTime === null) {
        router.push('/onboarding')
      } else {
        router.push('/')
      }
    }, 3000)
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-900 pb-12 px-4 sm:px-6 lg:px-8">
    <div v-if="success" class="text-green-400 text-sm text-center">
      {{ success }}
    </div>
    <div v-else class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-white">
          {{ newUser ? 'Skapa ditt konto' : 'Logga in på ditt konto' }}
        </h2>
      </div>
      <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <div class="space-y-4">
          <div>
            <InputComponent v-model="email" type="email" required placeholder="E-postadress" />
          </div>
          <div>
            <InputComponent v-model="password" type="password" required placeholder="Lösenord" />
          </div>
        </div>

        <div v-if="error" class="text-red-400 text-sm text-center">
          {{ error }}
        </div>

        <div>
          <button
            type="submit"
            class="w-full px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {{ newUser ? 'Skapa konto' : 'Logga in' }}
          </button>
        </div>
      </form>

      <div class="text-center">
        <p class="text-sm text-gray-400">
          {{ newUser ? 'Har du redan ett konto?' : 'Har du inget konto?' }}
          <a
            @click="newUser = !newUser"
            class="font-medium text-blue-400 hover:text-blue-300 cursor-pointer transition-colors"
          >
            {{ newUser ? 'Logga in' : 'Skapa konto' }}
          </a>
        </p>
      </div>
    </div>
  </div>
</template>
