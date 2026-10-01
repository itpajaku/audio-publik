<template>
  <transition name="slide-fade">
    <div v-if="isPlaying" class="bg-gradient-to-r from-red-950/80 via-slate-900/95 to-slate-900 border-y border-red-500/40 px-4 py-3 shadow-2xl relative overflow-hidden backdrop-blur-md">
      <!-- Ambient red glow effect -->
      <div class="absolute -left-10 top-0 bottom-0 w-32 bg-red-600/20 blur-xl pointer-events-none"></div>

      <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
        <!-- Status indicator + Title -->
        <div class="flex items-center gap-4 w-full md:w-auto">
          <!-- ON AIR Badge with Pulse -->
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-600/30 border border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse">
            <span class="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]"></span>
            <span class="text-xs font-black tracking-widest text-red-200">
              {{ isChimePlaying ? 'CHIME PERINGATAN' : 'ON AIR — MENYIARKAN' }}
            </span>
          </div>

          <!-- Soundwave visualizer bars -->
          <div class="hidden sm:flex items-center gap-1 h-7">
            <span class="wave-bar !bg-red-400"></span>
            <span class="wave-bar !bg-red-400"></span>
            <span class="wave-bar !bg-red-400"></span>
            <span class="wave-bar !bg-red-400"></span>
            <span class="wave-bar !bg-red-400"></span>
            <span class="wave-bar !bg-red-400"></span>
          </div>

          <!-- Track Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <h3 class="text-sm sm:text-base font-bold text-white truncate">
                {{ currentAudio?.title || 'Pengumuman Suara' }}
              </h3>
              <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider"
                :class="broadcastType === 'automatic' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'"
              >
                {{ broadcastType === 'automatic' ? 'Otomatis' : 'Manual' }}
              </span>
            </div>
            <p class="text-xs text-slate-300 truncate">
              Kategori: <span class="text-slate-200 font-medium">{{ currentAudio?.category || 'Umum' }}</span>
              <span v-if="currentSchedule" class="text-slate-400"> • Jadwal: {{ currentSchedule.name }}</span>
            </p>
          </div>
        </div>

        <!-- Progress Scrub & Actions -->
        <div class="flex items-center justify-between w-full md:w-auto gap-4">
          <!-- Time Elapsed / Duration -->
          <div class="flex items-center gap-2 font-mono text-xs text-slate-300">
            <span class="font-bold text-red-300">{{ formatTime(currentTime) }}</span>
            <span class="text-slate-500">/</span>
            <span class="text-slate-400">{{ formatTime(duration) }}</span>
          </div>

          <!-- Progress Mini Bar -->
          <div class="w-24 sm:w-40 bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700/60">
            <div 
              class="bg-gradient-to-r from-red-500 to-amber-400 h-full transition-all duration-300"
              :style="{ width: progressPercent + '%' }"
            ></div>
          </div>

          <!-- Emergency Stop Button -->
          <button 
            @click="stopBroadcast"
            class="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-red-900/50 transition-all hover:scale-105 active:scale-95"
            title="Hentikan Siaran Sekarang"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <rect x="5" y="5" width="10" height="10" rx="1.5" />
            </svg>
            <span>Hentikan</span>
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBroadcastEngine } from '../composables/useBroadcastEngine'

const { 
  isPlaying, 
  isChimePlaying, 
  currentAudio, 
  currentSchedule, 
  broadcastType, 
  currentTime, 
  duration, 
  stopBroadcast 
} = useBroadcastEngine()

const progressPercent = computed(() => {
  if (!duration.value || duration.value === 0) return 0
  return Math.min(100, (currentTime.value / duration.value) * 100)
})

function formatTime(sec: number): string {
  if (!sec || isNaN(sec)) return '00:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}
</script>

<style scoped>
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}
</style>
