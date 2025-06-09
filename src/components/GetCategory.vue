<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits(['filter'])

const categorys = ref<string[]>([
  'Alla kategorier',
  'Vegansk',
  'Vegetarisk',
  'Glutenfri',
  'Laktosfri',
  'Lågt kaloritag',
  'Högt protein',
  'Fika',
  'Förrätt',
  'Huvudrätt',
  'Efterrätt',
  'Soppa',
  'Sallad',
  'Snack',
  'Drink',
])

const callFilterCategory = (category: string) => {
  emit('filter', category)
}
</script>

<template>
  <div>
    <select
      @change="callFilterCategory(($event.target as HTMLSelectElement).value)"
      class="bg-gray-700 text-white px-4 py-2 rounded-md mb-4 p-2"
    >
      <option v-for="category in categorys" :key="category" :value="category">
        {{ category }}
      </option>
    </select>
  </div>
</template>
