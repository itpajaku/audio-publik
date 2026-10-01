<template>
  <header class="glass-header sticky top-0 z-50 px-4 py-3 sm:px-6">
    <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
      <!-- Brand & Status -->
      <div class="flex items-center justify-between w-full md:w-auto gap-4">
        <div class="flex items-center gap-3">
          <div class="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-400 shadow-lg shadow-sky-500/20 text-white font-black text-xl">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a6 6 0 00-6-6m6 10a9.96 9.96 0 001.272-4.836A9.97 9.97 0 0018 7" />
            </svg>
            <span class="absolute -top-1 -right-1 flex h-3 w-3">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>

          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                AEROVOX
                <span class="text-xs px-2 py-0.5 rounded-full font-semibold bg-sky-500/20 text-sky-400 border border-sky-500/30 font-mono">
                  v2.0
                </span>
              </h1>
            </div>
            <p class="text-xs text-slate-400">Sistem Siaran Audio & Pengumuman Pengunjung</p>
          </div>
        </div>

        <!-- Master Auto-Broadcast toggle & Theme toggle for mobile -->
        <div class="flex md:hidden items-center gap-2">
          <!-- Mobile Theme Toggle -->
          <button 
            @click="toggleTheme"
            class="theme-toggle-btn-mobile p-2 rounded-lg border flex items-center justify-center text-xs"
            :title="isDark ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'"
            :aria-label="isDark ? 'Mode Terang' : 'Mode Gelap'"
          >
            <svg v-if="!isDark" class="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <svg v-else class="w-4 h-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </button>

          <button 
            @click="toggleMasterAuto"
            :class="masterAutoEnabled ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'"
            class="px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <span class="w-2 h-2 rounded-full" :class="masterAutoEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'"></span>
            {{ masterAutoEnabled ? 'AUTO ON' : 'AUTO PAUSE' }}
          </button>
        </div>
      </div>

      <!-- Real-time Digital Clock & Airport Status -->
      <div class="flex items-center flex-wrap justify-center gap-4 w-full md:w-auto">
        <!-- Digital Clock Display -->
        <div class="flex items-center gap-3 system-clock-box rounded-xl px-3.5 py-1.5 shadow-inner">
          <div class="text-center">
            <div class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">WAKTU SISTEM (WIB)</div>
            <div class="font-mono text-lg font-bold text-sky-400 tracking-wider flex items-center justify-center gap-0.5">
              <span>{{ timeHours }}</span>
              <span :class="blinkColon ? 'opacity-100' : 'opacity-20'" class="transition-opacity">:</span>
              <span>{{ timeMinutes }}</span>
              <span :class="blinkColon ? 'opacity-100' : 'opacity-20'" class="transition-opacity">:</span>
              <span class="text-sky-300 text-sm font-normal">{{ timeSeconds }}</span>
            </div>
          </div>
          <div class="h-7 w-px bg-slate-700/80"></div>
          <div class="text-left text-[11px] text-slate-300 leading-tight">
            <div class="font-semibold text-white">{{ dateStr }}</div>
            <div class="text-slate-400 font-mono text-[10px]">UTC+07:00 • LIVE</div>
          </div>
        </div>

        <!-- Controls: Master Auto, Chime Test, Volume, Theme Toggle -->
        <div class="flex items-center gap-2">
          <!-- Master Auto Switch (Desktop) -->
          <button 
            @click="toggleMasterAuto"
            :class="masterAutoEnabled ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30' : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-800'"
            class="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all shadow-sm"
            title="Aktifkan/Jeda Siaran Otomatis"
          >
            <span class="w-2.5 h-2.5 rounded-full" :class="masterAutoEnabled ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-slate-500'"></span>
            <span>{{ masterAutoEnabled ? 'Otomatis Aktif' : 'Otomatis Dijeda' }}</span>
          </button>

          <!-- Test Airport Chime Button -->
          <button 
            @click="testChime"
            class="btn btn-secondary text-xs px-2.5 py-2 rounded-xl"
            title="Uji Bunyi Chime Bandara (Ding-Dong)"
          >
            <svg class="w-4 h-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span class="hidden sm:inline">Uji Chime</span>
          </button>

          <!-- Volume Slider -->
          <div class="flex items-center gap-1.5 volume-control-box rounded-xl px-2.5 py-1.5">
            <button @click="toggleMute" class="text-slate-400 hover:text-white transition-colors" title="Mute/Unmute">
              <svg v-if="isMuted || volume === 0" class="w-4 h-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clip-rule="evenodd" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
              <svg v-else class="w-4 h-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            </button>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.05" 
              :value="volume" 
              @input="onVolumeChange"
              class="w-16 sm:w-20 accent-sky-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
            />
          </div>

          <!-- Theme Toggle Switch (Desktop) -->
          <button 
            @click="toggleTheme" 
            class="theme-toggle-btn"
            :title="isDark ? 'Beralih ke Mode Terang (Light Mode)' : 'Beralih ke Mode Gelap (Dark Mode)'"
            :aria-label="isDark ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'"
          >
            <span class="theme-toggle-icon">
              <!-- Sun icon for light mode -->
              <svg v-if="!isDark" class="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <!-- Moon icon for dark mode -->
              <svg v-else class="w-4 h-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </span>
            <span class="hidden xl:inline text-xs font-semibold">
              {{ isDark ? 'Mode Gelap' : 'Mode Terang' }}
            </span>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useBroadcastEngine } from '../composables/useBroadcastEngine'
import { useChime } from '../composables/useChime'
import { useTheme } from '../composables/useTheme'

const { volume, isMuted, masterAutoEnabled, setVolume, toggleMute } = useBroadcastEngine()
const { playAirportChime } = useChime()
const { isDark, toggleTheme, initTheme } = useTheme()

const timeHours = ref('00')
const timeMinutes = ref('00')
const timeSeconds = ref('00')
const dateStr = ref('')
const blinkColon = ref(true)

let clockTimer: any = null

function updateClock() {
  const now = new Date()
  timeHours.value = now.getHours().toString().padStart(2, '0')
  timeMinutes.value = now.getMinutes().toString().padStart(2, '0')
  timeSeconds.value = now.getSeconds().toString().padStart(2, '0')
  blinkColon.value = !blinkColon.value

  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  }
  dateStr.value = now.toLocaleDateString('id-ID', options)
}

function toggleMasterAuto() {
  masterAutoEnabled.value = !masterAutoEnabled.value
}

function testChime() {
  playAirportChime('airport3')
}

function onVolumeChange(e: Event) {
  const target = e.target as HTMLInputElement
  setVolume(parseFloat(target.value))
}

onMounted(() => {
  initTheme()
  updateClock()
  clockTimer = setInterval(updateClock, 1000)
})

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer)
})
</script>
