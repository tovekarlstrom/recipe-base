<script setup lang="ts">
import { ref } from 'vue'
import AddRecipe from '@/components/AddRecipe.vue'
import RecipeList from '@/components/RecipeList.vue'
import ButtonComponent from '@/components/ButtonComponent.vue'
import BaseModal from '@/components/BaseModal.vue'

const isAddRecipeOpen = ref(false)
const isViewRecipesOpen = ref(false)

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
          <h1 class="text-4xl font-bold tracking-tight text-white sm:text-6xl mb-4">ReceptBase</h1>
          <p class="text-lg leading-8 text-gray-300 mb-8">
            Din digitala kokbok för att bevara och dela dina älskade familjerecept. Skapa, upptäck
            och håll din kulinariska arv vid liv.
          </p>

          <!-- Main Actions -->
          <div class="flex flex-col sm:flex-row items-center justify-center gap-6 mt-10">
            <ButtonComponent
              text="Lägg till ditt recept"
              variant="primary"
              size="lg"
              class="w-full sm:w-auto transform hover:scale-105 transition-transform duration-200"
              @click="openModalAddRecipe"
            />
            <ButtonComponent
              text="Utforska recept"
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
              <h3 class="text-white font-semibold mb-2">Bevara traditioner</h3>
              <p class="text-gray-400 text-sm">
                Håll dina familjerecept säkra och organiserade för kommande generationer.
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
              <h3 class="text-white font-semibold mb-2">Smart timer</h3>
              <p class="text-gray-400 text-sm">
                Inbyggd kökstimer för att hjälpa dig uppnå perfekta resultat varje gång.
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
              <h3 class="text-white font-semibold mb-2">Receptchatt</h3>
              <p class="text-gray-400 text-sm">
                Få omedelbar hjälp och dela koktips med vår AI-drivna chattassistent.
              </p>
            </div>
          </div>

          <!-- AI Disclosure -->
          <div
            class="mt-16 bg-blue-900/30 border border-blue-500/30 rounded-xl p-4 mb-8 backdrop-blur-sm"
          >
            <div class="flex items-start gap-3">
              <svg
                class="w-5 h-5 text-blue-400 mt-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 class="text-blue-400 font-semibold mb-1">AI-drivna funktioner</h3>
                <p class="text-gray-300 text-sm">
                  Denna applikation använder artificiell intelligens för att förbättra din
                  kokupplevelse. Vår AI-assistent ger förslag och vägledning, men observera att allt
                  AI-genererat innehåll bör noggrant granskas och verifieras av dig. Vi garanterar
                  inte riktigheten, säkerheten eller pålitligheten av AI-genererat innehåll.
                </p>
              </div>
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
  </main>
</template>
