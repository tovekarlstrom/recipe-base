<script setup lang="ts">
const emit = defineEmits<{
  'update:modelValue': [value: string]
  input: [value: string]
}>()

const props = defineProps<{
  modelValue: string
  placeholder?: string
  required?: boolean
  id?: string
  class?: string
  focus?: string
}>()
</script>

<template>
  <div>
    <input
      :value="props.modelValue"
      @input="
        (e) => {
          const value = (e.target as HTMLInputElement).value
          emit('update:modelValue', value)
          emit('input', value)
        }
      "
      type="text"
      id="recipeName"
      class="w-full bg-gray-600 text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-300"
      placeholder="Ange receptnamn"
      required
    />
  </div>
</template>
