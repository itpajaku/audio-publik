<template>
  <div class="space-y-4">
    <!-- Header with "Tambah Jadwal Baru" button -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h2 class="text-base sm:text-lg font-bold text-white flex items-center gap-2">
          <span>Manajemen Jadwal Otomatis Dinamis</span>
          <span class="text-xs px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 font-mono font-semibold">
            {{ schedules.length }} Jadwal
          </span>
        </h2>
        <p class="text-xs text-slate-400">Atur waktu pemutaran otomatis berdasarkan interval berkala atau jam-jam spesifik.</p>
      </div>

      <button 
        @click="openAddModal"
        class="btn btn-primary text-xs py-2 px-3.5 rounded-xl shadow-md shadow-sky-500/20 flex items-center gap-1.5 self-start sm:self-auto"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
        </svg>
        <span>Buat Jadwal Baru</span>
      </button>
    </div>

    <!-- Anti-Collision / Missed Schedule Protection Information Banner -->
    <div class="p-3 rounded-xl bg-slate-900/70 border border-sky-500/20 flex items-start sm:items-center gap-2.5 text-xs text-slate-300">
      <div class="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 shrink-0 mt-0.5 sm:mt-0">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      </div>
      <div>
        <span class="font-semibold text-white">Proteksi Anti-Tumpang Tindih & Jadwal Terlewat:</span>
        <span class="text-slate-400 ml-1">
          Jika jadwal terlewat (akibat aplikasi off, komputer standby, atau siaran lain sedang aktif), audio <strong>tidak akan dipaksa memutar otomatis</strong> agar tidak mengganggu jadwal yang akan datang.
        </span>
      </div>
    </div>

    <!-- Schedules Grid / List -->
    <div v-if="schedules.length > 0" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div 
        v-for="item in schedules" 
        :key="item.id"
        class="glass-panel p-4 flex flex-col justify-between transition-all duration-200 hover:border-slate-600 relative group"
        :class="{ 'border-sky-500/30': item.is_active, 'opacity-70': !item.is_active }"
      >
        <div>
          <!-- Top Row: Mode badge & Active Toggle -->
          <div class="flex items-center justify-between gap-2 mb-2">
            <div class="flex items-center gap-2 flex-wrap">
              <span 
                class="badge text-[10px]"
                :class="item.mode === 'interval' ? 'bg-sky-500/20 text-sky-300 border-sky-500/30' : 'bg-purple-500/20 text-purple-300 border-purple-500/30'"
              >
                {{ item.mode === 'interval' ? `Interval: Tiap ${item.interval_minutes} Menit` : 'Jam Tertentu' }}
              </span>

              <span v-if="item.play_chime" class="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
                <span>🔔</span> Chime
              </span>

              <span v-if="item.repeat_count > 1" class="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                Ulang {{ item.repeat_count }}x
              </span>
            </div>

            <!-- Toggle Switch -->
            <div class="flex items-center shrink-0">
              <button 
                type="button" 
                role="switch" 
                :aria-checked="item.is_active" 
                @click.stop="toggleScheduleActive(item)"
                class="toggle-switch"
                :class="{ 'active': item.is_active }"
                :title="item.is_active ? 'Jadwal Aktif (Klik untuk menonaktifkan)' : 'Jadwal Nonaktif (Klik untuk mengaktifkan)'"
                :aria-label="(item.is_active ? 'Nonaktifkan' : 'Aktifkan') + ' jadwal ' + item.name"
              >
                <span class="toggle-knob"></span>
              </button>
            </div>
          </div>

          <!-- Schedule Name -->
          <h3 class="text-sm sm:text-base font-bold text-white mb-1">
            {{ item.name }}
          </h3>

          <!-- Audio Title & Category -->
          <div class="flex items-center gap-2 text-xs text-sky-400 font-medium mb-3">
            <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            <span class="truncate">{{ item.audio_title || 'Audio Pengumuman' }}</span>
            <span class="text-slate-500">•</span>
            <span class="text-slate-400 text-[11px]">{{ item.audio_category || 'Umum' }}</span>
          </div>

          <!-- Specific Times tags if mode === 'specific_times' -->
          <div v-if="item.mode === 'specific_times' && item.specific_times && item.specific_times.length > 0" class="mb-3">
            <div class="text-[11px] text-slate-400 mb-1 flex items-center justify-between">
              <span>Waktu Siar Spesifik:</span>
              <span class="text-[10px] text-sky-400 font-mono">{{ item.specific_times.length }} waktu/hari</span>
            </div>
            <div class="flex flex-wrap gap-1.5">
              <span 
                v-for="t in item.specific_times" 
                :key="t"
                class="px-2 py-0.5 rounded bg-slate-800 border font-mono text-xs font-semibold"
                :class="isNextSlot(item, t) 
                  ? 'border-emerald-500/70 text-emerald-300 bg-emerald-950/40 ring-1 ring-emerald-500/30' 
                  : 'border-slate-700 text-slate-200'"
              >
                {{ t }} WIB
                <span v-if="isNextSlot(item, t)" class="ml-1 text-[9px] text-emerald-400">● Berikutnya</span>
              </span>
            </div>
          </div>

          <!-- Interval slots preview if mode === 'interval' -->
          <div v-if="item.mode === 'interval'" class="mb-3">
            <div class="text-[11px] text-slate-400 mb-1 flex items-center justify-between">
              <span>Slot Waktu Siar (Tiap {{ item.interval_minutes }}m):</span>
              <span class="text-[10px] text-sky-400 font-mono">{{ getScheduleSlots(item).length }} slot/hari</span>
            </div>
            <div class="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto pr-1">
              <span 
                v-for="t in getScheduleSlots(item).slice(0, 10)" 
                :key="t"
                class="px-2 py-0.5 rounded bg-slate-800 border font-mono text-[11px] font-semibold"
                :class="isNextSlot(item, t) 
                  ? 'border-emerald-500/70 text-emerald-300 bg-emerald-950/40 ring-1 ring-emerald-500/30' 
                  : 'border-slate-700 text-slate-300'"
              >
                {{ t }}
              </span>
              <span v-if="getScheduleSlots(item).length > 10" class="px-1.5 py-0.5 rounded bg-slate-800/60 text-[10px] text-slate-400 font-mono">
                +{{ getScheduleSlots(item).length - 10 }} lagi
              </span>
            </div>
          </div>

          <!-- Operating Hours & Days -->
          <div class="grid grid-cols-2 gap-2 text-xs text-slate-400 bg-slate-900/60 rounded-xl p-2.5 mb-3 border border-slate-800">
            <div>
              <span class="text-slate-500 block text-[10px] uppercase font-semibold">Jam Operasional</span>
              <span class="font-mono text-slate-200 font-medium">{{ item.start_time }} - {{ item.end_time }} WIB</span>
            </div>
            <div>
              <span class="text-slate-500 block text-[10px] uppercase font-semibold">Hari Aktif</span>
              <span class="text-slate-300 font-medium">{{ formatDays(item.days_of_week) }}</span>
            </div>
          </div>
        </div>

        <!-- Footer actions: Next Run, Edit, Delete, Immediate Manual Broadcast -->
        <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
          <div class="text-[11px] space-y-0.5">
            <div class="text-slate-300 flex items-center gap-1.5">
              <span class="text-slate-500 text-[10px]">Berikutnya:</span>
              <span class="font-mono text-emerald-400 font-semibold text-xs">
                {{ formatNextRun(item) }}
              </span>
            </div>
            <div class="text-slate-500 text-[10px]">
              <span v-if="item.last_played_at">Terakhir: {{ formatLastPlayed(item.last_played_at) }}</span>
              <span v-else>Belum pernah disiarkan</span>
            </div>
          </div>

          <div class="flex items-center gap-1.5">
            <!-- Manual Trigger Now -->
            <button 
              @click="triggerScheduleNow(item)"
              class="btn btn-secondary text-xs py-1 px-2.5 rounded-lg text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
              title="Putar Jadwal Ini Sekarang"
            >
              Putar Sekarang
            </button>

            <!-- Edit Button -->
            <button 
              @click="openEditModal(item)"
              class="btn btn-secondary text-xs py-1 px-2 rounded-lg text-slate-300 hover:text-white"
              title="Edit Jadwal"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>

            <!-- Delete Button -->
            <button 
              @click="deleteSchedule(item.id)"
              class="btn btn-secondary text-xs py-1 px-2 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
              title="Hapus Jadwal"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty Schedules state -->
    <div v-else class="glass-panel p-8 text-center text-slate-400">
      <div class="w-12 h-12 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-500 mb-3">
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <h4 class="text-sm font-semibold text-white">Belum Ada Jadwal Siaran Otomatis</h4>
      <p class="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
        Buat jadwal baru dengan interval berkala (misal: tiap 30 menit) atau jam-jam spesifik untuk memutar pengumuman secara otomatis.
      </p>
      <button @click="openAddModal" class="btn btn-primary text-xs mt-4">
        + Buat Jadwal Pertama
      </button>
    </div>

    <!-- MODAL: ADD / EDIT SCHEDULE -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-content p-5 sm:p-6 space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 class="text-base font-bold text-white flex items-center gap-2">
            <span>{{ isEditing ? 'Edit Jadwal Siaran Otomatis' : 'Buat Jadwal Siaran Baru' }}</span>
          </h3>
          <button @click="showModal = false" class="text-slate-400 hover:text-white text-lg">✕</button>
        </div>

        <form @submit.prevent="saveSchedule" class="space-y-4">
          <!-- Audio Selection -->
          <div>
            <label class="form-label">Pilih Audio Pengumuman *</label>
            <select v-model="form.audio_id" required class="form-select">
              <option disabled value="">-- Pilih Berkas Audio --</option>
              <option v-for="a in audios" :key="a.id" :value="a.id">
                {{ a.title }} ({{ a.category }})
              </option>
            </select>
          </div>

          <!-- Schedule Name -->
          <div>
            <label class="form-label">Nama / Label Jadwal *</label>
            <input 
              v-model="form.name" 
              type="text" 
              required 
              placeholder="Contoh: Pengingat Antrean Online Pagi"
              class="form-input"
            />
          </div>

          <!-- Mode Selector (Interval vs Specific Times) -->
          <div>
            <label class="form-label">Mode Penjadwalan Dinamis *</label>
            <div class="grid grid-cols-2 gap-2">
              <button 
                type="button" 
                @click="form.mode = 'interval'"
                :class="form.mode === 'interval' ? 'bg-sky-500/20 text-sky-300 border-sky-500/60 font-bold' : 'bg-slate-900 text-slate-400 border-slate-800'"
                class="p-2.5 rounded-xl border text-xs text-center transition-all flex flex-col items-center gap-1"
              >
                <span class="text-sm">⏱️ Interval Berkala</span>
                <span class="text-[10px] text-slate-400">Putar setiap X menit sekali</span>
              </button>

              <button 
                type="button" 
                @click="form.mode = 'specific_times'"
                :class="form.mode === 'specific_times' ? 'bg-sky-500/20 text-sky-300 border-sky-500/60 font-bold' : 'bg-slate-900 text-slate-400 border-slate-800'"
                class="p-2.5 rounded-xl border text-xs text-center transition-all flex flex-col items-center gap-1"
              >
                <span class="text-sm">⏰ Jam Spesifik</span>
                <span class="text-[10px] text-slate-400">Tepat pada jam-jam tertentu</span>
              </button>
            </div>
          </div>

          <!-- If Interval Mode -->
          <div v-if="form.mode === 'interval'" class="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 space-y-2">
            <label class="form-label">Interval Pemutaran (Menit)</label>
            <div class="flex items-center gap-3">
              <input 
                v-model.number="form.interval_minutes" 
                type="number" 
                min="1" 
                max="720" 
                required 
                class="form-input w-28 font-mono text-center font-bold text-sky-300"
              />
              <span class="text-xs text-slate-300">Menit Sekali</span>
            </div>
            <!-- Quick Chips -->
            <div class="flex flex-wrap gap-1.5 pt-1">
              <button 
                v-for="mins in [10, 15, 30, 45, 60, 90, 120]" 
                :key="mins"
                type="button"
                @click="form.interval_minutes = mins"
                class="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
              >
                {{ mins }}m
              </button>
            </div>
          </div>

          <!-- If Specific Times Mode -->
          <div v-if="form.mode === 'specific_times'" class="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 space-y-2.5">
            <label class="form-label">Daftar Jam Siaran (Format 24 Jam, Contoh: 08:00)</label>
            <div class="flex items-center gap-2">
              <input 
                v-model="newSpecificTime" 
                type="time" 
                class="form-input w-36 font-mono text-sm"
              />
              <button 
                type="button" 
                @click="addSpecificTime"
                class="btn btn-secondary text-xs py-2 px-3 rounded-lg border-sky-500/40 text-sky-300"
              >
                + Tambah Jam
              </button>
            </div>

            <!-- Added Times Badges -->
            <div class="flex flex-wrap gap-1.5 pt-1">
              <span 
                v-for="(t, idx) in form.specific_times" 
                :key="t"
                class="px-2.5 py-1 rounded-lg bg-sky-950/80 border border-sky-500/30 text-sky-300 text-xs font-mono font-semibold flex items-center gap-1.5"
              >
                <span>{{ t }} WIB</span>
                <button type="button" @click="removeSpecificTime(idx)" class="hover:text-red-400">✕</button>
              </span>
              <span v-if="form.specific_times.length === 0" class="text-xs text-amber-400">
                Belum ada jam yang ditambahkan. Tambahkan minimal 1 jam.
              </span>
            </div>
          </div>

          <!-- Operating Hours Range -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="form-label">Jam Operasional Mulai</label>
              <input v-model="form.start_time" type="time" required class="form-input font-mono text-sm" />
            </div>
            <div>
              <label class="form-label">Jam Operasional Selesai</label>
              <input v-model="form.end_time" type="time" required class="form-input font-mono text-sm" />
            </div>
          </div>

          <!-- Active Days Selector -->
          <div>
            <label class="form-label">Hari Siaran Aktif</label>
            <div class="grid grid-cols-7 gap-1">
              <button 
                v-for="d in dayOptions" 
                :key="d.value"
                type="button"
                @click="toggleDay(d.value)"
                :class="form.days_of_week.includes(d.value) 
                  ? 'bg-sky-500 text-white font-bold' 
                  : 'bg-slate-900 text-slate-400 border border-slate-800'"
                class="py-1.5 rounded-lg text-xs transition-all text-center"
              >
                {{ d.short }}
              </button>
            </div>
          </div>

          <!-- Extra Broadcast Options: Chime & Repeat -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <!-- Chime Toggle -->
            <div 
              @click="form.play_chime = !form.play_chime"
              class="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors"
            >
              <div>
                <span class="text-xs font-bold text-white block">Putar Chime Pembuka</span>
                <span class="text-[10px] text-slate-400">Bunyi ding-dong bandara sebelum suara</span>
              </div>
              <button 
                type="button" 
                role="switch" 
                :aria-checked="form.play_chime" 
                @click.stop="form.play_chime = !form.play_chime"
                class="toggle-switch"
                :class="{ 'active': form.play_chime }"
                :title="form.play_chime ? 'Chime Aktif' : 'Chime Nonaktif'"
              >
                <span class="toggle-knob"></span>
              </button>
            </div>

            <!-- Repeat Count -->
            <div class="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div>
                <span class="text-xs font-bold text-white block">Pengulangan Siaran</span>
                <span class="text-[10px] text-slate-400">Putar berturut-turut</span>
              </div>
              <select v-model.number="form.repeat_count" class="bg-slate-800 text-white text-xs border border-slate-700 rounded-lg p-1.5">
                <option :value="1">1x Putar</option>
                <option :value="2">2x Putar</option>
              </select>
            </div>
          </div>

          <!-- Submit Buttons -->
          <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button type="button" @click="showModal = false" class="btn btn-secondary text-xs">
              Batal
            </button>
            <button type="submit" class="btn btn-primary text-xs px-5">
              {{ isEditing ? 'Simpan Perubahan' : 'Buat Jadwal' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { 
  useBroadcastEngine, 
  getScheduleSlotsForDay, 
  getNextScheduleSlot, 
  type ScheduleItem, 
  type AudioItem 
} from '../composables/useBroadcastEngine'

const props = defineProps<{
  schedules: ScheduleItem[]
  audios: AudioItem[]
}>()

const emit = defineEmits<{
  (e: 'refresh'): void
}>()

const { playBroadcast } = useBroadcastEngine()

function getScheduleSlots(item: ScheduleItem): string[] {
  return getScheduleSlotsForDay(item)
}

function formatNextRun(item: ScheduleItem): string {
  if (!item.is_active) return 'Nonaktif'
  const next = getNextScheduleSlot(item)
  if (!next) return 'Selesai hari ini'
  if (next.isTomorrow) return `Besok ${next.time} WIB`
  if (next.dayName) return `${next.dayName} ${next.time} WIB`
  return `${next.time} WIB`
}

function isNextSlot(item: ScheduleItem, slotTime: string): boolean {
  if (!item.is_active) return false
  const next = getNextScheduleSlot(item)
  return next !== null && !next.isTomorrow && !next.dayName && next.time === slotTime
}

const showModal = ref(false)
const isEditing = ref(false)
const editingId = ref<number | null>(null)
const newSpecificTime = ref('08:00')

const dayOptions = [
  { value: 1, short: 'Sen' },
  { value: 2, short: 'Sel' },
  { value: 3, short: 'Rab' },
  { value: 4, short: 'Kam' },
  { value: 5, short: 'Jum' },
  { value: 6, short: 'Sab' },
  { value: 0, short: 'Min' }
]

const form = reactive({
  audio_id: '' as string | number,
  name: '',
  mode: 'interval' as 'interval' | 'specific_times',
  interval_minutes: 30,
  specific_times: [] as string[],
  start_time: '07:30',
  end_time: '20:00',
  days_of_week: [1, 2, 3, 4, 5],
  is_active: true,
  play_chime: true,
  repeat_count: 1,
  repeat_delay_seconds: 3
})

function formatDays(days: number[]): string {
  if (!days || days.length === 0) return 'Tidak aktif'
  if (days.length === 7) return 'Setiap Hari'
  if (days.length === 5 && days.every(d => [1, 2, 3, 4, 5].includes(d))) return 'Senin - Jumat'
  const names = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
  return days.map(d => names[d]).join(', ')
}

function formatLastPlayed(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
  } catch {
    return dateStr
  }
}

function openAddModal() {
  isEditing.value = false
  editingId.value = null
  form.audio_id = props.audios[0]?.id ?? ''
  form.name = ''
  form.mode = 'interval'
  form.interval_minutes = 30
  form.specific_times = ['08:00', '13:00']
  form.start_time = '07:30'
  form.end_time = '20:00'
  form.days_of_week = [1, 2, 3, 4, 5]
  form.is_active = true
  form.play_chime = true
  form.repeat_count = 1
  form.repeat_delay_seconds = 3
  showModal.value = true
}

function openEditModal(item: ScheduleItem) {
  isEditing.value = true
  editingId.value = item.id
  form.audio_id = item.audio_id
  form.name = item.name
  form.mode = item.mode === 'specific_times' ? 'specific_times' : 'interval'
  form.interval_minutes = item.interval_minutes || 30
  form.specific_times = Array.isArray(item.specific_times) ? [...item.specific_times] : []
  form.start_time = item.start_time || '07:30'
  form.end_time = item.end_time || '20:00'
  form.days_of_week = Array.isArray(item.days_of_week) ? [...item.days_of_week] : [1, 2, 3, 4, 5]
  form.is_active = item.is_active
  form.play_chime = item.play_chime
  form.repeat_count = item.repeat_count || 1
  form.repeat_delay_seconds = item.repeat_delay_seconds || 3
  showModal.value = true
}

function toggleDay(d: number) {
  const idx = form.days_of_week.indexOf(d)
  if (idx >= 0) {
    if (form.days_of_week.length > 1) {
      form.days_of_week.splice(idx, 1)
    }
  } else {
    form.days_of_week.push(d)
    form.days_of_week.sort()
  }
}

function addSpecificTime() {
  if (newSpecificTime.value && !form.specific_times.includes(newSpecificTime.value)) {
    form.specific_times.push(newSpecificTime.value)
    form.specific_times.sort()
  }
}

function removeSpecificTime(idx: number) {
  form.specific_times.splice(idx, 1)
}

async function saveSchedule() {
  try {
    if (form.mode === 'specific_times' && form.specific_times.length === 0) {
      alert('Tambahkan minimal 1 jam siaran untuk mode Jam Spesifik.')
      return
    }

    if (isEditing.value && editingId.value) {
      await $fetch(`/api/schedules/${editingId.value}`, {
        method: 'PUT',
        body: form
      })
    } else {
      await $fetch('/api/schedules', {
        method: 'POST',
        body: form
      })
    }
    showModal.value = false
    emit('refresh')
  } catch (err: any) {
    alert(err?.message || 'Gagal menyimpan jadwal')
  }
}

async function toggleScheduleActive(item: ScheduleItem) {
  const previousState = item.is_active
  // Optimistic update for instant visual feedback
  item.is_active = !previousState
  try {
    const res: any = await $fetch(`/api/schedules/${item.id}/toggle`, { method: 'POST' })
    if (res && typeof res.is_active === 'boolean') {
      item.is_active = res.is_active
    }
    emit('refresh')
  } catch (e) {
    item.is_active = previousState
    console.error('Failed to toggle schedule active state:', e)
  }
}

async function deleteSchedule(id: number) {
  if (!confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) return
  try {
    await $fetch(`/api/schedules/${id}`, { method: 'DELETE' })
    emit('refresh')
  } catch (e) {
    console.error(e)
  }
}

function triggerScheduleNow(item: ScheduleItem) {
  const audio = props.audios.find(a => a.id === item.audio_id)
  if (audio) {
    playBroadcast(audio, 'manual', item)
  }
}
</script>
