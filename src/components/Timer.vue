<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Icon } from '@iconify/vue'

defineOptions({
  name: 'RecipeTimer',
})

const props = defineProps<{
  initialMinutes?: number
  initialSeconds?: number
}>()

const minutes = ref(props.initialMinutes || 0)
const seconds = ref(props.initialSeconds || 0)
const isRunning = ref(false)
const intervalId = ref<ReturnType<typeof setInterval> | null>(null)

const displayTime = computed(() => {
  const paddedMinutes = minutes.value.toString().padStart(2, '0')
  const paddedSeconds = seconds.value.toString().padStart(2, '0')
  return `${paddedMinutes}:${paddedSeconds}`
})

const progress = computed(() => {
  const totalInitialSeconds = (props.initialMinutes || 0) * 60 + (props.initialSeconds || 0)
  const currentSeconds = minutes.value * 60 + seconds.value
  return totalInitialSeconds > 0 ? (currentSeconds / totalInitialSeconds) * 100 : 0
})

function startTimer() {
  if (!isRunning.value && (minutes.value > 0 || seconds.value > 0)) {
    isRunning.value = true
    intervalId.value = setInterval(() => {
      if (seconds.value === 0) {
        if (minutes.value === 0) {
          stopTimer()
          return
        }
        minutes.value--
        seconds.value = 59
      } else {
        seconds.value--
      }
    }, 1000)
  }
}

function pauseTimer() {
  if (intervalId.value) {
    clearInterval(intervalId.value)
    intervalId.value = null
  }
  isRunning.value = false
}

function resetTimer() {
  pauseTimer()
  minutes.value = props.initialMinutes || 0
  seconds.value = props.initialSeconds || 0
}

function stopTimer() {
  pauseTimer()
  if (minutes.value === 0 && seconds.value === 0) {
    // Play sound or show notification
    const audio = new Audio('/timer-done.mp3')
    audio.play().catch(() => {
      console.log('Audio playback failed')
    })
  }
}

// External control methods
function setTime(newMinutes: number, newSeconds: number = 0) {
  pauseTimer()
  minutes.value = newMinutes
  seconds.value = newSeconds
}

// Expose methods for external use
defineExpose({
  start: startTimer,
  pause: pauseTimer,
  reset: resetTimer,
  stop: stopTimer,
  setTime,
  isRunning: computed(() => isRunning.value),
  currentTime: computed(() => ({ minutes: minutes.value, seconds: seconds.value })),
})

// Clean up interval on component unmount
watch(
  () => minutes.value,
  (newValue) => {
    if (newValue === 0 && seconds.value === 0) {
      stopTimer()
    }
  },
)

watch(
  () => seconds.value,
  (newValue) => {
    if (newValue === 0 && minutes.value === 0) {
      stopTimer()
    }
  },
)
</script>

<template>
  <div class="bg-gray-700 rounded-2xl p-6 max-w-xs mx-auto">
    <div class="text-center mb-6">
      <div class="relative inline-block">
        <!-- Circular progress -->
        <svg class="w-32 h-32 transform -rotate-90">
          <circle
            class="text-gray-600"
            stroke-width="8"
            stroke="currentColor"
            fill="transparent"
            r="58"
            cx="64"
            cy="64"
          />
          <circle
            class="text-blue-500 transition-all duration-500"
            stroke-width="8"
            :stroke-dasharray="364"
            :stroke-dashoffset="364 - (364 * progress) / 100"
            stroke="currentColor"
            fill="transparent"
            r="58"
            cx="64"
            cy="64"
          />
        </svg>
        <!-- Time display -->
        <div class="absolute inset-0 flex items-center justify-center">
          <span class="text-4xl font-bold text-white">{{ displayTime }}</span>
        </div>
      </div>
    </div>

    <div class="flex justify-center space-x-4">
      <button
        v-if="!isRunning"
        @click="startTimer"
        class="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors duration-200"
        :disabled="minutes === 0 && seconds === 0"
      >
        <Icon icon="mdi:play" class="w-6 h-6" />
      </button>
      <button
        v-else
        @click="pauseTimer"
        class="p-2 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 transition-colors duration-200"
      >
        <Icon icon="mdi:pause" class="w-6 h-6" />
      </button>
      <button
        @click="resetTimer"
        class="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-200"
      >
        <Icon icon="mdi:refresh" class="w-6 h-6" />
      </button>
    </div>
  </div>
</template>

<style scoped>
circle {
  transition: stroke-dashoffset 0.5s ease;
}
</style>
