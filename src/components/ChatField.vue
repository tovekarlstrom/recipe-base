<script setup lang="ts">
import { searchRecipesByText } from '@/functions/queryDatabase'
import { Icon } from '@iconify/vue/dist/iconify.js'
import { ref } from 'vue'

interface SearchResult {
  id: string
  name: string
  description: string | null
  servings: number
  recipe_ingredients: {
    ingredient: string
    amount: string | null
    unit: string | null
  }[]
  similarity: number
}

const userInput = ref('')
const isLoading = ref(false)
const searchResults = ref<SearchResult[]>([])
const error = ref<string | null>(null)

const emit = defineEmits(['closeChat'])

const handleQuery = async () => {
  if (!userInput.value.trim()) return

  isLoading.value = true
  error.value = null
  try {
    console.log('Searching for:', userInput.value)
    const results = await searchRecipesByText(userInput.value, 0.1, 10) // Much lower threshold for more results
    console.log('Results:', results)
    searchResults.value = results
    if (results.length === 0) {
      error.value = 'No matching recipes found. Try different search terms.'
    }
  } catch (e) {
    console.error('Search error:', e)
    error.value = 'Failed to search recipes. Please try again.'
  } finally {
    isLoading.value = false
  }
}

const handleClose = () => {
  console.log('Closing chat field')
  emit('closeChat')
}

// document.getElementById("queryForm").addEventListener("submit", async (e) => {
//   e.preventDefault();
//   const queryText = document.getElementById("queryText");
//   const text = queryText.value;

//   if (text.length > 0) {
//     console.log("User wants to query the database: ", text);

//     // Anropa en function som genererar en embedding och laddar upp till vår databas.
//     const results = await queryDatabase(text);

//     console.log("Results are: ", results);

//     const resultsDiv = document.getElementById("responseText");
//     resultsDiv.innerHTML = "";
//     if (results.length > 0) {
//       results.forEach((result) => {
//         const resultElement = document.createElement("div");
//         resultElement.innerHTML = `<h3>Document ID: ${result.id}<h3><p>${
//           result.sentence
//         }</p><p><strong>Similarity: ${result.similarity.toFixed(
//           4
//         )}</strong></p>`;
//         resultsDiv.appendChild(resultElement);
//       });
//     } else {
//       resultsDiv.innerHTML = "<p>No results found unfortunately!</p>";
//     }

//     const chatbotResponse = await handleChatbotPrompt(results, text);
//     console.log("Ourr augmented response is: ", chatbotResponse);

//     console.log("Text and embedding was uploaded");
//     queryText.value = "";
//   }
// });
</script>
<template>
  <div class="bg-gray-800 rounded-2xl p-6 max-w-2xl w-full mx-4 relative">
    <button
      @click="handleClose"
      class="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors"
    >
      <Icon icon="mdi:close" class="w-6 h-6" />
    </button>

    <h2 class="text-xl font-bold text-white mb-6">Search Recipes</h2>

    <form @submit.prevent="handleQuery" class="mb-6">
      <div class="flex gap-2">
        <input
          v-model="userInput"
          type="text"
          placeholder="Search for recipes..."
          class="flex-1 bg-gray-700 text-white rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
        />
        <button
          type="submit"
          :disabled="isLoading"
          class="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="isLoading">Searching...</span>
          <span v-else>Search</span>
        </button>
      </div>
    </form>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-red-400 text-center py-4">
      {{ error }}
    </div>

    <!-- Results -->
    <div v-else-if="searchResults.length > 0" class="space-y-4">
      <div v-for="result in searchResults" :key="result.id" class="bg-gray-700 rounded-xl p-4">
        <div class="flex justify-between items-start mb-2">
          <h3 class="text-lg font-semibold text-white">{{ result.name }}</h3>
          <span class="text-gray-400 text-sm"
            >Match: {{ (result.similarity * 100).toFixed(0) }}%</span
          >
        </div>
        <p v-if="result.description" class="text-gray-300 text-sm mb-2">
          {{ result.description }}
        </p>
        <div class="flex gap-4 text-sm">
          <span class="text-gray-400">{{ result.servings }} servings</span>
          <span class="text-gray-400"
            >{{ result.recipe_ingredients?.length || 0 }} ingredients</span
          >
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="userInput" class="text-gray-400 text-center py-8">
      Start typing to search for recipes
    </div>
  </div>
</template>
