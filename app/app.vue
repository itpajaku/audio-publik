<template>
  <div class="min-h-screen flex flex-col text-slate-100 pb-20 md:pb-6 transition-colors duration-300">
    <!-- Top Airport PA Command Header -->
    <AirportHeader />

    <!-- Live Broadcast "ON AIR" Banner (Active when audio is playing) -->
    <LiveBroadcastBanner />

    <!-- Main Container -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 py-5 sm:px-6 space-y-5">
      <!-- Next Announcement Countdown Widget -->
      <NextAnnouncementWidget class="no-print" />

      <!-- Desktop Tabs Navigation Pill Bar -->
      <div class="hidden md:flex items-center justify-between border-b border-slate-800 pb-3 no-print">
        <nav class="flex items-center gap-2">
          <button 
            v-for="tab in navigationTabs" 
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="activeTab === tab.id 
              ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold shadow-md shadow-sky-500/20 border border-sky-400/40' 
              : 'btn-secondary text-slate-400 hover:text-white border border-slate-700/60'"
            class="px-4 py-2 rounded-xl text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <span>{{ tab.icon }}</span>
            <span>{{ tab.label }}</span>
            <span v-if="tab.badge" class="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-sky-400 border border-slate-700/60 font-mono">
              {{ tab.badge }}
            </span>
          </button>
        </nav>

        <div class="text-xs text-slate-400 font-mono">
          STATUS: <span class="text-emerald-400 font-semibold">SISTEM SIARAN ONLINE</span>
        </div>
      </div>

      <!-- Tab Content 1: Quick Broadcast Soundboard -->
      <section v-show="activeTab === 'soundboard'" class="space-y-4 no-print">
        <QuickBroadcastSoundboard 
          :audios="audios" 
          @open-recorder="onOpenRecorderFromSoundboard"
        />
      </section>

      <!-- Tab Content 2: Dynamic Custom Schedule Manager -->
      <section v-show="activeTab === 'schedules'" class="space-y-4 no-print">
        <ScheduleManager 
          :schedules="schedules" 
          :audios="audios" 
          @refresh="fetchData"
        />
      </section>

      <!-- Tab Content 3: Daily Monitoring & Playback Logs (Printable) -->
      <section v-show="activeTab === 'monitoring'" class="space-y-4">
        <DailyMonitoringDashboard 
          ref="monitoringRef"
        />
      </section>

      <!-- Tab Content 4: Audio Library & Voice Recorder -->
      <section v-show="activeTab === 'library'" class="space-y-4 no-print">
        <AudioLibraryManager 
          ref="libraryRef"
          :audios="audios" 
          @refresh="fetchData"
        />
      </section>
    </main>

    <!-- Mobile Bottom Navigation Bar -->
    <nav class="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-header px-2 py-2 border-t border-slate-800 flex items-center justify-around no-print">
      <button 
        v-for="tab in navigationTabs" 
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="activeTab === tab.id ? 'text-sky-400 font-bold' : 'text-slate-400 hover:text-slate-200'"
        class="flex flex-col items-center gap-1 text-[11px] p-1.5 relative transition-colors"
      >
        <span class="text-lg leading-none">{{ tab.icon }}</span>
        <span>{{ tab.shortLabel }}</span>
        <span 
          v-if="activeTab === tab.id" 
          class="absolute -top-1 w-6 h-0.5 bg-sky-400 rounded-full"
        ></span>
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useBroadcastEngine, type AudioItem, type ScheduleItem } from './composables/useBroadcastEngine'
import { useTheme } from './composables/useTheme'
import AirportHeader from './components/AirportHeader.vue'
import LiveBroadcastBanner from './components/LiveBroadcastBanner.vue'
import NextAnnouncementWidget from './components/NextAnnouncementWidget.vue'
import QuickBroadcastSoundboard from './components/QuickBroadcastSoundboard.vue'
import ScheduleManager from './components/ScheduleManager.vue'
import DailyMonitoringDashboard from './components/DailyMonitoringDashboard.vue'
import AudioLibraryManager from './components/AudioLibraryManager.vue'

const { initTheme } = useTheme()

const activeTab = ref<'soundboard' | 'schedules' | 'monitoring' | 'library'>('soundboard')
const audios = ref<AudioItem[]>([])
const schedules = ref<ScheduleItem[]>([])
const monitoringRef = ref<any>(null)
const libraryRef = ref<any>(null)

const { startScheduler, stopScheduler } = useBroadcastEngine()

const navigationTabs = computed(() => [
  { id: 'soundboard' as const, label: 'Siaran Langsung', shortLabel: 'Siaran', icon: '📢', badge: `${audios.value.length}` },
  { id: 'schedules' as const, label: 'Jadwal Otomatis', shortLabel: 'Jadwal', icon: '⏱️', badge: `${schedules.value.filter(s => s.is_active).length}` },
  { id: 'monitoring' as const, label: 'Monitoring Seharian', shortLabel: 'Monitoring', icon: '📊' },
  { id: 'library' as const, label: 'Koleksi & Rekaman', shortLabel: 'Audio', icon: '🎙️' }
])

async function fetchData() {
  try {
    const [audiosRes, schedulesRes] = await Promise.all([
      $fetch<{ success: boolean; data: AudioItem[] }>('/api/audios'),
      $fetch<{ success: boolean; data: ScheduleItem[] }>('/api/schedules')
    ])

    if (audiosRes?.data) {
      audios.value = audiosRes.data
    }
    if (schedulesRes?.data) {
      schedules.value = schedulesRes.data
    }

    if (monitoringRef.value?.fetchStatsAndLogs) {
      monitoringRef.value.fetchStatsAndLogs()
    }
  } catch (err) {
    console.error('Error fetching data:', err)
  }
}

function onOpenRecorderFromSoundboard() {
  activeTab.value = 'library'
  setTimeout(() => {
    if (libraryRef.value?.openRecorderModal) {
      libraryRef.value.openRecorderModal()
    }
  }, 100)
}

onMounted(async () => {
  initTheme()
  await fetchData()

  // Start background broadcast scheduler engine
  startScheduler(() => ({
    schedules: schedules.value,
    audios: audios.value
  }))
})

onUnmounted(() => {
  stopScheduler()
})
</script>
