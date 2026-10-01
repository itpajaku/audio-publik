<template>
  <div class="glass-panel p-4 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-sky-950/40 border-sky-500/20 relative overflow-hidden">
    <!-- Subtle background accent icon -->
    <div class="absolute -right-6 -bottom-6 text-sky-500/5 pointer-events-none">
      <svg class="w-36 h-36" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/>
      </svg>
    </div>

    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
      <div class="flex items-start gap-3.5">
        <div class="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 shrink-0 mt-0.5">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-sky-400 uppercase tracking-wider">Antrean Siaran Otomatis</span>
            <span v-if="masterAutoEnabled" class="flex h-2 w-2 relative">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span v-else class="text-[10px] px-2 py-0.2 bg-amber-500/20 text-amber-300 rounded font-semibold">
              DIJEDA
            </span>
            <span class="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20 hidden sm:inline-block">
              🛡️ Lewati Jadwal Terlewat
            </span>
          </div>

          <div v-if="nextScheduledInfo" class="mt-0.5">
            <h4 class="text-sm font-bold text-white flex items-center gap-2">
              {{ nextScheduledInfo.schedule?.name || 'Pengumuman Terjadwal' }}
              <span class="text-xs font-normal text-slate-400">({{ nextScheduledInfo.audio?.title }})</span>
            </h4>
            <p class="text-xs text-slate-400">
              Jadwal Waktu: <span class="font-mono text-slate-200 font-semibold">{{ formatTimeDisplay(nextScheduledInfo.time) }}</span>
              • Mode: <span class="text-slate-300">{{ nextScheduledInfo.schedule?.mode === 'interval' ? 'Interval Berkala' : 'Jam Spesifik' }}</span>
            </p>
          </div>

          <div v-else class="mt-0.5">
            <h4 class="text-sm font-semibold text-slate-300">Tidak ada pengumuman terjadwal aktif saat ini</h4>
            <p class="text-xs text-slate-400">Aktifkan salah satu jadwal di tab "Jadwal Otomatis" untuk memulai siaran terjadwal.</p>
          </div>
        </div>
      </div>

      <!-- Countdown Ticker -->
      <div v-if="nextScheduledInfo && masterAutoEnabled" class="flex items-center gap-3 bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2 self-start sm:self-auto">
        <div class="text-right">
          <div class="text-[10px] font-semibold text-slate-400 uppercase">MULAI DALAM</div>
          <div class="font-mono text-base sm:text-lg font-black text-emerald-400 tracking-wider">
            {{ formatCountdown(nextScheduledInfo.secondsLeft) }}
          </div>
        </div>
        <button 
          v-if="nextScheduledInfo.audio"
          @click="playNextNow"
          class="btn btn-secondary text-xs px-2.5 py-1.5 rounded-lg border-sky-500/30 text-sky-300 hover:bg-sky-500/20"
          title="Putar Sekarang Tanpa Menunggu Waktu"
        >
          Siarkan Cepat
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBroadcastEngine } from '../composables/useBroadcastEngine'

const { nextScheduledInfo, masterAutoEnabled, playBroadcast } = useBroadcastEngine()

function formatCountdown(sec: number): string {
  if (sec <= 0) return '00:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  if (m >= 60) {
    const h = Math.floor(m / 60)
    const remM = m % 60
    return `${h}j ${remM}m`
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function formatTimeDisplay(t: string): string {
  if (!t) return ''
  return t.includes('WIB') ? t : `${t} WIB`
}

function playNextNow() {
  if (nextScheduledInfo.value && nextScheduledInfo.value.audio) {
    playBroadcast(nextScheduledInfo.value.audio, 'manual', nextScheduledInfo.value.schedule)
  }
}
</script>
