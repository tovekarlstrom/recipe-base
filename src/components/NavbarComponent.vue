<script setup lang="ts">
import { supabase } from '@/supabase/supabaseClient'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
const router = useRouter()
const authStore = useAuthStore()
async function signOut() {
  await supabase.auth.signOut()
  router.push('/signin')
  authStore.setAuth(false)
}
</script>

<template>
  <div class="flex justify-end items-center pt-4 px-4">
    <button class="bg-blue-500 text-white px-4 py-2 rounded-md" @click="signOut">Logga ut</button>
  </div>
</template>
