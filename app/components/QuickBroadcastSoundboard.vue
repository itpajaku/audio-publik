<template>
  <div class="space-y-4">
    <!-- Top Filter & Search Bar -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      <!-- Search Input -->
      <div class="relative flex-1 max-w-md">
        <svg class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Cari pengumuman audio..." 
          class="form-input pl-10 pr-4 py-2 text-sm bg-slate-900/80 border-slate-700/70"
        />
        <button 
          v-if="searchQuery" 
          @click="searchQuery = ''" 
          class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
        >
          ✕
        </button>
      </div>

      <!-- Action Buttons: Record & Chime only -->
      <div class="flex items-center gap-2">
        <button 
          @click="$emit('open-recorder')"
          class="btn btn-secondary text-xs py-2 px-3 rounded-xl border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 flex items-center gap-1.5"
        >
          <svg class="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
          </svg>
          <span>Rekam Pengumuman</span>
        </button>

        <button 
          @click="playChimeOnly"
          class="btn btn-secondary text-xs py-2 px-3 rounded-xl border-slate-700 hover:bg-slate-800 flex items-center gap-1.5"
          title="Bunyikan Suara Chime Panggilan Bandara Saja"
        >
          <svg class="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span>Chime Saja</span>
        </button>
      </div>
    </div>

    <!-- Category Tabs Filter -->
    <div class="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
      <button 
        @click="selectedCategory = 'all'"
        :class="selectedCategory === 'all' ? 'bg-sky-500 text-white font-bold shadow-md shadow-sky-500/25' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/60 border border-slate-700/50'"
        class="px-3 py-1.5 rounded-lg whitespace-nowrap transition-all"
      >
        Semua Kategori ({{ audios.length }})
      </button>
      <button 
        v-for="cat in availableCategories" 
        :key="cat"
        @click="selectedCategory = cat"
        :class="selectedCategory === cat ? 'bg-sky-500 text-white font-bold shadow-md shadow-sky-500/25' : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/60 border border-slate-700/50'"
        class="px-3 py-1.5 rounded-lg whitespace-nowrap transition-all"
      >
        {{ cat }}
      </button>
    </div>

    <!-- Audios Grid / Soundboard -->
    <div v-if="filteredAudios.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
      <div 
        v-for="audio in filteredAudios" 
        :key="audio.id"
        class="glass-panel p-4 flex flex-col justify-between transition-all duration-200 hover:border-sky-500/40 hover:shadow-lg group relative"
        :class="{ 'border-red-500/60 ring-2 ring-red-500/20 bg-slate-900/90': currentAudio?.id === audio.id && isPlaying }"
      >
        <div>
          <!-- Category & Status Badge -->
          <div class="flex items-center justify-between gap-2 mb-2">
            <span class="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-sky-400 border border-slate-700/80">
              {{ audio.category || 'Umum' }}
            </span>

            <span v-if="currentAudio?.id === audio.id && isPlaying" class="badge badge-live text-[10px]">
              ON AIR
            </span>
            <span v-else class="text-[11px] text-slate-400 font-mono">
              {{ audio.total_plays || 0 }}x diputar
            </span>
          </div>

          <!-- Title -->
          <h3 class="text-sm font-bold text-white group-hover:text-sky-300 transition-colors line-clamp-1 mb-1" :title="audio.title">
            {{ audio.title }}
          </h3>

          <!-- Description -->
          <p class="text-xs text-slate-400 line-clamp-2 mb-3 min-h-[2rem]">
            {{ audio.description || 'Pengumuman audio publik untuk semua pengunjung fasilitas bandara.' }}
          </p>
        </div>

        <!-- Card Footer & Action Buttons -->
        <div class="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
          <!-- Preview Button -->
          <button 
            @click="previewAudio(audio)"
            class="btn btn-secondary text-xs py-1.5 px-2.5 rounded-lg flex items-center gap-1.5"
            title="Dengarkan sebelum disiarkan"
          >
            <svg v-if="previewingId === audio.id" class="w-3.5 h-3.5 text-sky-400" fill="currentColor" viewBox="0 0 20 20">
              <rect x="5" y="4" width="3" height="12" />
              <rect x="12" y="4" width="3" height="12" />
            </svg>
            <svg v-else class="w-3.5 h-3.5 text-slate-300" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.841z" />
            </svg>
            <span>{{ previewingId === audio.id ? 'Berhenti' : 'Preview' }}</span>
          </button>

          <!-- SIARKAN SEKARANG (Broadcast Now) Button -->
          <button 
            @click="broadcastAudio(audio)"
            :disabled="currentAudio?.id === audio.id && isPlaying"
            :class="currentAudio?.id === audio.id && isPlaying 
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
              : 'btn-broadcast'"
            class="btn text-xs py-1.5 px-3.5 rounded-lg font-bold flex items-center gap-1.5"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a6 6 0 00-6-6m6 10a9.96 9.96 0 001.272-4.836A9.97 9.97 0 0018 7" />
            </svg>
            <span>{{ currentAudio?.id === audio.id && isPlaying ? 'Menyiarkan...' : 'Siarkan Sekarang' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="glass-panel p-8 text-center text-slate-400">
      <div class="w-12 h-12 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-500 mb-3">
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h4 class="text-sm font-semibold text-white">Tidak ada pengumuman yang sesuai</h4>
      <p class="text-xs text-slate-500 mt-1">Coba sesuaikan kata kunci pencarian atau kategori yang dipilih.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBroadcastEngine, type AudioItem } from '../composables/useBroadcastEngine'
import { useChime } from '../composables/useChime'

const props = defineProps<{
  audios: AudioItem[]
}>()

defineEmits<{
  (e: 'open-recorder'): void
}>()

const { isPlaying, currentAudio, playBroadcast } = useBroadcastEngine()
const { playAirportChime } = useChime()

const searchQuery = ref('')
const selectedCategory = ref('all')
const previewingId = ref<number | null>(null)
let previewAudioEl: HTMLAudioElement | null = null

const availableCategories = computed(() => {
  const set = new Set<string>()
  props.audios.forEach(a => {
    if (a.category) set.add(a.category)
  })
  return Array.from(set)
})

const filteredAudios = computed(() => {
  return props.audios.filter(audio => {
    const matchesCat = selectedCategory.value === 'all' || audio.category === selectedCategory.value
    const matchesQuery = !searchQuery.value || 
      audio.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (audio.description && audio.description.toLowerCase().includes(searchQuery.value.toLowerCase()))
    return matchesCat && matchesQuery
  })
})

function previewAudio(audio: AudioItem) {
  if (previewingId.value === audio.id) {
    if (previewAudioEl) {
      previewAudioEl.pause()
      previewAudioEl = null
    }
    previewingId.value = null
    return
  }

  if (previewAudioEl) {
    previewAudioEl.pause()
  }

  previewAudioEl = new Audio(audio.url)
  previewingId.value = audio.id
  previewAudioEl.onended = () => {
    previewingId.value = null
    previewAudioEl = null
  }
  previewAudioEl.play().catch(e => {
    console.warn('Preview error', e)
    previewingId.value = null
  })
}

function broadcastAudio(audio: AudioItem) {
  if (previewAudioEl) {
    previewAudioEl.pause()
    previewingId.value = null
  }
  playBroadcast(audio, 'manual', null)
}

function playChimeOnly() {
  playAirportChime('airport3')
}
</script>
