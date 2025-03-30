import { useTimerStore } from '@/stores/timer'

let timerStore: ReturnType<typeof useTimerStore> | null = null

export function initializeTimerStore(store: ReturnType<typeof useTimerStore>) {
  console.log('Initializing timer store')
  timerStore = store
  console.log('Timer store initialized:', timerStore)
}

export function setTimer(duration: number) {
  if (!timerStore) {
    console.warn('Timer store not initialized, attempting to get store')
    timerStore = useTimerStore()
  }

  if (!timerStore) {
    console.error('Failed to initialize timer store')
    return
  }

  console.log('Setting timer for', duration, 'seconds')
  timerStore.setTimer(duration)
  console.log('Timer store state after setting:', {
    duration: timerStore.timerDuration,
    showTimer: timerStore.showTimer,
  })
}
