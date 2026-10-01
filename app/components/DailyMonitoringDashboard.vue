<template>
  <div class="space-y-5">
    <!-- Header with Date Filter and Export actions -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h2 class="text-base sm:text-lg font-bold text-white flex items-center gap-2">
          <span>Monitoring & Rekap Siaran Seharian</span>
          <span class="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-semibold">
            {{ stats?.summary?.total_plays || 0 }} Siaran
          </span>
        </h2>
        <p class="text-xs text-slate-400">Pantau seluruh riwayat pemutaran audio otomatis dan manual sepanjang hari.</p>
      </div>

      <!-- Actions: Date switch, Export CSV, Print Report -->
      <div class="flex items-center flex-wrap gap-2 self-start sm:self-auto">
        <!-- Date Filter Buttons -->
        <div class="flex items-center bg-slate-900 border border-slate-700 rounded-xl p-0.5 text-xs">
          <button 
            @click="setDateFilter('today')"
            :class="dateFilter === 'today' ? 'bg-sky-500 text-white font-bold' : 'text-slate-400 hover:text-white'"
            class="px-2.5 py-1 rounded-lg transition-all"
          >
            Hari Ini
          </button>
          <button 
            @click="setDateFilter('yesterday')"
            :class="dateFilter === 'yesterday' ? 'bg-sky-500 text-white font-bold' : 'text-slate-400 hover:text-white'"
            class="px-2.5 py-1 rounded-lg transition-all"
          >
            Kemarin
          </button>
          <button 
            @click="setDateFilter('all')"
            :class="dateFilter === 'all' ? 'bg-sky-500 text-white font-bold' : 'text-slate-400 hover:text-white'"
            class="px-2.5 py-1 rounded-lg transition-all"
          >
            Semua
          </button>
        </div>

        <!-- Export CSV Button -->
        <button 
          @click="exportToCSV"
          class="btn btn-secondary text-xs py-1.5 px-3 rounded-xl border-slate-700 hover:bg-slate-800 flex items-center gap-1.5"
          title="Download Rekap CSV"
        >
          <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span class="hidden sm:inline">Export CSV</span>
        </button>

        <!-- Print Daily Logbook Button -->
        <button 
          @click="printReport"
          class="btn btn-secondary text-xs py-1.5 px-3 rounded-xl border-slate-700 hover:bg-slate-800 flex items-center gap-1.5"
          title="Cetak Lembar Laporan Tugas Pengumuman"
        >
          <svg class="w-3.5 h-3.5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          <span class="hidden sm:inline">Cetak</span>
        </button>
      </div>
    </div>

    <!-- KPI Summary Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <!-- Card 1: Total Plays -->
      <div class="glass-panel p-4 flex flex-col justify-between border-sky-500/20 bg-gradient-to-br from-slate-900/90 to-sky-950/30">
        <div class="flex items-center justify-between text-slate-400 text-xs mb-2">
          <span>Total Siaran</span>
          <span class="text-sky-400 text-base">📢</span>
        </div>
        <div class="font-mono text-2xl sm:text-3xl font-extrabold text-white">
          {{ stats?.summary?.total_plays || 0 }}
        </div>
        <div class="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
          <span class="text-emerald-400 font-bold">{{ stats?.summary?.successful_plays || 0 }} sukses</span>
          <span>mengudara</span>
          <span v-if="stats?.summary?.missed_plays" class="text-amber-400 font-medium">
            • {{ stats.summary.missed_plays }} dilewati (terlewat)
          </span>
        </div>
      </div>

      <!-- Card 2: Total Duration -->
      <div class="glass-panel p-4 flex flex-col justify-between border-emerald-500/20 bg-gradient-to-br from-slate-900/90 to-emerald-950/30">
        <div class="flex items-center justify-between text-slate-400 text-xs mb-2">
          <span>Durasi Mengudara</span>
          <span class="text-emerald-400 text-base">⏱️</span>
        </div>
        <div class="font-mono text-2xl sm:text-3xl font-extrabold text-emerald-300">
          {{ formatDuration(stats?.summary?.total_duration_seconds || 0) }}
        </div>
        <div class="text-[11px] text-slate-400 mt-1">
          Total waktu pengunjung mendengarkan
        </div>
      </div>

      <!-- Card 3: Otomatis vs Manual -->
      <div class="glass-panel p-4 flex flex-col justify-between border-purple-500/20 bg-gradient-to-br from-slate-900/90 to-purple-950/30">
        <div class="flex items-center justify-between text-slate-400 text-xs mb-2">
          <span>Otomatis vs Manual</span>
          <span class="text-purple-400 text-base">⚡</span>
        </div>
        <div class="flex items-baseline gap-2 font-mono text-2xl sm:text-3xl font-extrabold text-purple-300">
          <span>{{ stats?.summary?.automatic_plays || 0 }}</span>
          <span class="text-sm font-normal text-slate-400">/ {{ stats?.summary?.manual_plays || 0 }} manual</span>
        </div>
        <div class="text-[11px] text-slate-400 mt-1">
          {{ calculateAutoPercent }}% otomatisasi terjadwal
        </div>
      </div>

      <!-- Card 4: Active Schedules -->
      <div class="glass-panel p-4 flex flex-col justify-between border-amber-500/20 bg-gradient-to-br from-slate-900/90 to-amber-950/30">
        <div class="flex items-center justify-between text-slate-400 text-xs mb-2">
          <span>Jadwal Aktif</span>
          <span class="text-amber-400 text-base">📅</span>
        </div>
        <div class="font-mono text-2xl sm:text-3xl font-extrabold text-amber-300">
          {{ stats?.summary?.active_schedules || 0 }}
        </div>
        <div class="text-[11px] text-slate-400 mt-1">
          Dari total {{ stats?.summary?.total_schedules || 0 }} konfigurasi
        </div>
      </div>
    </div>

    <!-- Visual Charts: Hourly Activity & Top Played Audios -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <!-- Hourly Activity Bar Chart (2 cols) -->
      <div class="glass-panel p-4 lg:col-span-2">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-bold text-white flex items-center gap-2">
            <span>Grafik Intensitas Siaran Per Jam (06:00 - 21:00 WIB)</span>
          </h3>
          <span class="text-xs text-slate-400 font-mono">Frekuensi Siaran</span>
        </div>

        <!-- Bar chart visualizer -->
        <div class="flex items-end justify-between gap-1 sm:gap-2 h-40 pt-4 px-1 border-b border-slate-800">
          <div 
            v-for="item in stats?.hourlyDistribution || []" 
            :key="item.hour"
            class="flex-1 flex flex-col items-center gap-1.5 group relative"
          >
            <!-- Tooltip on hover -->
            <div class="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 px-2 py-0.5 rounded bg-slate-950 border border-slate-700 text-[10px] font-mono font-bold text-sky-300 whitespace-nowrap pointer-events-none z-20 shadow-lg">
              {{ item.label }}: {{ item.count }}x
            </div>

            <!-- Bar -->
            <div class="w-full max-w-[20px] bg-slate-800/80 rounded-t-sm flex items-end justify-center overflow-hidden h-28">
              <div 
                class="w-full transition-all duration-500 rounded-t-sm"
                :class="item.count > 0 ? 'bg-gradient-to-t from-sky-600 to-cyan-400 shadow-[0_0_8px_rgba(56,189,248,0.4)]' : 'bg-transparent'"
                :style="{ height: getBarHeight(item.count) }"
              ></div>
            </div>

            <!-- Hour Label -->
            <span class="text-[9px] sm:text-[10px] text-slate-400 font-mono">
              {{ item.hour }}
            </span>
          </div>
        </div>
      </div>

      <!-- Top Played Audios Ranking (1 col) -->
      <div class="glass-panel p-4">
        <h3 class="text-sm font-bold text-white mb-3">Pengumuman Paling Sering Diputar</h3>
        <div v-if="stats?.topAudios && stats.topAudios.length > 0" class="space-y-3">
          <div v-for="(audio, idx) in stats.topAudios" :key="idx" class="space-y-1">
            <div class="flex items-center justify-between text-xs">
              <span class="font-semibold text-slate-200 truncate pr-2" :title="audio.audio_title">
                {{ idx + 1 }}. {{ audio.audio_title }}
              </span>
              <span class="font-mono text-sky-400 font-bold shrink-0">
                {{ audio.play_count }}x
              </span>
            </div>
            <div class="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div 
                class="bg-gradient-to-r from-sky-500 to-emerald-400 h-full rounded-full"
                :style="{ width: getTopPercent(audio.play_count) + '%' }"
              ></div>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-8 text-xs text-slate-500">
          Belum ada rekaman siaran pada periode ini.
        </div>
      </div>
    </div>

    <!-- Chronological Broadcast Log Table -->
    <div class="glass-panel p-4 sm:p-5">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 class="text-sm font-bold text-white">Log Riwayat Siaran (Audit Trail)</h3>
          <p class="text-xs text-slate-400">Daftar lengkap setiap pemutaran audio dengan rincian waktu dan status.</p>
        </div>

        <!-- Filter Trigger Type & Search -->
        <div class="flex items-center gap-2">
          <select v-model="filterTrigger" class="bg-slate-900 border border-slate-700 text-xs rounded-xl px-2.5 py-1.5 text-slate-200">
            <option value="">Semua Catatan</option>
            <option value="automatic">Hanya Otomatis (Tersiar)</option>
            <option value="manual">Hanya Manual</option>
            <option value="missed">Jadwal Terlewat (Dilewati)</option>
          </select>

          <button 
            @click="clearAllLogs"
            class="btn btn-secondary text-xs py-1.5 px-2.5 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border-slate-700"
            title="Bersihkan Semua Catatan Riwayat"
          >
            Bersihkan Log
          </button>
        </div>
      </div>

      <!-- Desktop Table / Mobile Cards -->
      <div class="overflow-x-auto">
        <table v-if="filteredLogs.length > 0" class="w-full text-left text-xs">
          <thead>
            <tr class="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <th class="py-2.5 px-3">Waktu Siar</th>
              <th class="py-2.5 px-3">Judul Pengumuman</th>
              <th class="py-2.5 px-3">Kategori</th>
              <th class="py-2.5 px-3">Pemicu</th>
              <th class="py-2.5 px-3 text-right">Durasi</th>
              <th class="py-2.5 px-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 font-sans">
            <tr v-for="log in filteredLogs" :key="log.id" class="hover:bg-slate-800/30 transition-colors">
              <!-- Timestamp -->
              <td class="py-2.5 px-3 font-mono text-slate-300 whitespace-nowrap">
                {{ formatLogTime(log.played_at) }}
              </td>

              <!-- Audio Title -->
              <td class="py-2.5 px-3 font-semibold text-white">
                <div>{{ log.audio_title }}</div>
                <div v-if="log.details" class="text-[10px] text-slate-500 font-normal truncate max-w-xs">{{ log.details }}</div>
              </td>

              <!-- Category -->
              <td class="py-2.5 px-3 whitespace-nowrap text-slate-400">
                {{ log.category || 'Umum' }}
              </td>

              <!-- Trigger Type -->
              <td class="py-2.5 px-3 whitespace-nowrap">
                <span 
                  class="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase"
                  :class="log.trigger_type === 'automatic' ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30' : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'"
                >
                  {{ log.trigger_type === 'automatic' ? 'Otomatis' : 'Manual' }}
                </span>
              </td>

              <!-- Duration -->
              <td class="py-2.5 px-3 text-right font-mono text-slate-300 whitespace-nowrap">
                {{ log.duration_played }}s
              </td>

              <!-- Status -->
              <td class="py-2.5 px-3 text-center whitespace-nowrap">
                <span 
                  class="px-2 py-0.5 rounded text-[10px] font-semibold inline-flex items-center gap-1"
                  :class="{
                    'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30': log.status === 'success',
                    'bg-amber-500/20 text-amber-300 border border-amber-500/30': log.status === 'missed' || log.status === 'skipped',
                    'bg-rose-500/20 text-rose-400 border border-rose-500/30': log.status === 'interrupted' || log.status === 'failed'
                  }"
                >
                  <span v-if="log.status === 'success'">✓ Selesai</span>
                  <span v-else-if="log.status === 'missed' || log.status === 'skipped'">⏭️ Dilewati (Terlewat)</span>
                  <span v-else>⚠️ Terputus</span>
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Empty State -->
        <div v-else class="text-center py-8 text-slate-500 text-xs">
          Belum ada data pemutaran audio yang tercatat.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

export interface LogItem {
  id: number
  audio_id: number | null
  schedule_id: number | null
  audio_title: string
  category: string
  trigger_type: string
  played_at: string
  duration_played: number
  status: string
  details: string
}

export interface StatsData {
  summary: {
    total_plays: number
    total_duration_seconds: number
    automatic_plays: number
    manual_plays: number
    successful_plays: number
    missed_plays?: number
    active_schedules: number
    total_schedules: number
  }
  topAudios: {
    audio_title: string
    category: string
    play_count: number
    total_duration: number
  }[]
  hourlyDistribution: {
    hour: string
    label: string
    count: number
  }[]
  categoryBreakdown: {
    category: string
    count: number
    total_duration: number
  }[]
}

const dateFilter = ref('today')
const filterTrigger = ref('')
const stats = ref<StatsData | null>(null)
const logs = ref<LogItem[]>([])

const calculateAutoPercent = computed(() => {
  if (!stats.value || !stats.value.summary.total_plays) return 0
  const ratio = (stats.value.summary.automatic_plays / stats.value.summary.total_plays) * 100
  return Math.round(ratio)
})

const filteredLogs = computed(() => {
  return logs.value.filter(item => {
    if (!filterTrigger.value) return true
    if (filterTrigger.value === 'missed') {
      return item.status === 'missed' || item.status === 'skipped'
    }
    if (filterTrigger.value === 'automatic') {
      return item.trigger_type === 'automatic' && item.status !== 'missed' && item.status !== 'skipped'
    }
    return item.trigger_type === filterTrigger.value
  })
})

function formatDuration(sec: number): string {
  if (!sec) return '0 m'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  if (m === 0) return `${s} dtk`
  return `${m}m ${s}s`
}

function formatLogTime(str: string): string {
  try {
    const d = new Date(str)
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB'
  } catch {
    return str
  }
}

function getBarHeight(count: number): string {
  if (!count || count === 0) return '0%'
  const max = Math.max(...(stats.value?.hourlyDistribution.map(h => h.count) || [1]), 1)
  const percent = Math.min(100, Math.max(15, (count / max) * 100))
  return `${percent}%`
}

function getTopPercent(count: number): number {
  if (!stats.value?.topAudios || stats.value.topAudios.length === 0) return 0
  const max = Math.max(...stats.value.topAudios.map(a => a.play_count), 1)
  return (count / max) * 100
}

async function fetchStatsAndLogs() {
  try {
    const [statsRes, logsRes] = await Promise.all([
      $fetch<{ success: boolean; data: StatsData }>(`/api/logs/stats?date=${dateFilter.value}`),
      $fetch<{ success: boolean; data: LogItem[] }>(`/api/logs?date=${dateFilter.value}`)
    ])
    if (statsRes && statsRes.data) {
      stats.value = statsRes.data
    }
    if (logsRes && logsRes.data) {
      logs.value = logsRes.data
    }
  } catch (e) {
    console.error('Error fetching logs and stats', e)
  }
}

function setDateFilter(filter: string) {
  dateFilter.value = filter
  fetchStatsAndLogs()
}

async function clearAllLogs() {
  if (!confirm('Apakah Anda yakin ingin mengosongkan seluruh catatan log siaran?')) return
  try {
    await $fetch('/api/logs/clear', { method: 'POST' })
    await fetchStatsAndLogs()
  } catch (e) {
    console.error(e)
  }
}

function exportToCSV() {
  if (logs.value.length === 0) {
    alert('Tidak ada data untuk diekspor.')
    return
  }
  const headers = ['Waktu', 'Judul Pengumuman', 'Kategori', 'Pemicu', 'Durasi (Detik)', 'Status', 'Catatan']
  const rows = logs.value.map(l => [
    `"${l.played_at}"`,
    `"${l.audio_title.replace(/"/g, '""')}"`,
    `"${(l.category || '').replace(/"/g, '""')}"`,
    `"${l.trigger_type}"`,
    l.duration_played,
    `"${l.status}"`,
    `"${(l.details || '').replace(/"/g, '""')}"`
  ])

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', `rekap-siaran-${dateFilter.value}-${new Date().toISOString().slice(0, 10)}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function printReport() {
  window.print()
}

onMounted(() => {
  fetchStatsAndLogs()
})

defineExpose({
  fetchStatsAndLogs
})
</script>
