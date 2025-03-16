<script setup lang="ts">
defineProps<{
  isOpen: boolean
}>()

defineEmits<{
  (e: 'close'): void
}>()
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="ease-out duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="ease-in duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="isOpen" class="fixed inset-0 z-50">
        <!-- Backdrop -->
        <div
          class="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
          @click="$emit('close')"
        ></div>

        <!-- Modal Content -->
        <div class="fixed inset-0 z-50 overflow-y-auto">
          <div class="flex min-h-full items-center justify-center p-4">
            <div
              class="relative transform overflow-hidden rounded-3xl bg-zinc-900 border border-zinc-800 p-6 text-left shadow-2xl transition-all w-[80%] max-w-6xl m-auto"
            >
              <!-- Close button -->
              <button
                type="button"
                class="absolute right-4 top-4 rounded-lg p-2 text-gray-400 hover:text-white hover:bg-gray-700 transition-all duration-200"
                @click="$emit('close')"
              >
                <span class="sr-only">Close</span>
                <svg
                  class="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="2"
                  stroke="currentColor"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <!-- Modal body -->
              <div class="w-full">
                <slot></slot>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
