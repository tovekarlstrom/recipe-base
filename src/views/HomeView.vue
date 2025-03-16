<script setup lang="ts">
import { ref } from 'vue'
import AddRecipe from '@/components/AddRecipe.vue'
import RecipeList from '@/components/RecipeList.vue'
import RecipeTimer from '@/components/Timer.vue'
import ButtonComponent from '@/components/ButtonComponent.vue'
import BaseModal from '@/components/BaseModal.vue'

const isAddRecipeOpen = ref(false)
const isViewRecipesOpen = ref(false)
const timerRef = ref<InstanceType<typeof RecipeTimer> | null>(null)

function openModalAddRecipe() {
  console.log('openModalAddRecipe')
  isAddRecipeOpen.value = !isAddRecipeOpen.value
}

function openModalViewRecipes() {
  console.log('openModalViewRecipes')
  isViewRecipesOpen.value = !isViewRecipesOpen.value
}
</script>

<template>
  <main class="min-h-screen">
    <!-- Hero Section -->
    <div class="relative overflow-hidden py-24 sm:py-32">
      <!-- Background gradient -->
      <div
        class="absolute inset-0 bg-gradient-to-b from-black-900 via-black-900/80 to-black-900"
      ></div>

      <!-- Content -->
      <div class="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div class="mx-auto max-w-2xl text-center">
          <h1 class="text-4xl font-bold tracking-tight text-white sm:text-6xl mb-4">Recipe Base</h1>
          <p class="text-lg leading-8 text-gray-300 mb-8">
            Your digital cookbook for preserving and sharing cherished family recipes. Create,
            discover, and keep your culinary heritage alive.
          </p>

          <!-- Main Actions -->
          <div class="flex flex-col sm:flex-row items-center justify-center gap-6 mt-10">
            <ButtonComponent
              text="Add Your Recipe"
              variant="primary"
              size="lg"
              class="w-full sm:w-auto transform hover:scale-105 transition-transform duration-200"
              @click="openModalAddRecipe"
            />
            <ButtonComponent
              text="Explore Recipes"
              variant="secondary"
              size="lg"
              class="w-full sm:w-auto transform hover:scale-105 transition-transform duration-200"
              @click="openModalViewRecipes"
            />
          </div>

          <!-- Features -->
          <div class="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-3 text-left">
            <div class="bg-gray-800/50 rounded-xl p-6 backdrop-blur-sm">
              <div class="text-blue-400 mb-2">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <h3 class="text-white font-semibold mb-2">Preserve Traditions</h3>
              <p class="text-gray-400 text-sm">
                Keep your family recipes safe and organized for generations to come.
              </p>
            </div>
            <div class="bg-gray-800/50 rounded-xl p-6 backdrop-blur-sm">
              <div class="text-blue-400 mb-2">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 class="text-white font-semibold mb-2">Smart Timer</h3>
              <p class="text-gray-400 text-sm">
                Built-in cooking timer to help you achieve perfect results every time.
              </p>
            </div>
            <div class="bg-gray-800/50 rounded-xl p-6 backdrop-blur-sm">
              <div class="text-blue-400 mb-2">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 class="text-white font-semibold mb-2">Recipe Chat</h3>
              <p class="text-gray-400 text-sm">
                Get instant help and share cooking tips with our AI-powered chat assistant.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <BaseModal :is-open="isAddRecipeOpen" @close="openModalAddRecipe">
      <AddRecipe />
    </BaseModal>

    <BaseModal :is-open="isViewRecipesOpen" @close="openModalViewRecipes">
      <RecipeList />
    </BaseModal>

    <!-- Timer (moved to bottom) -->
    <div class="fixed bottom-4 left-4">
      <RecipeTimer ref="timerRef" :initial-minutes="5" :initial-seconds="0" />
    </div>
  </main>
</template>
