import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useTimerStore = defineStore('timer', () => {
  const timerDuration = ref(0)
  const showTimer = ref(false)

  function setTimer(duration: number) {
    console.log('Timer store: Setting timer for', duration, 'seconds')
    timerDuration.value = duration
    showTimer.value = true
    console.log('Timer store state:', {
      duration: timerDuration.value,
      showTimer: showTimer.value,
    })
  }

  function hideTimer() {
    console.log('Timer store: Hiding timer')
    showTimer.value = false
    timerDuration.value = 0
    console.log('Timer store state:', {
      duration: timerDuration.value,
      showTimer: showTimer.value,
    })
  }

  return {
    timerDuration,
    showTimer,
    setTimer,
    hideTimer,
  } as const
})
