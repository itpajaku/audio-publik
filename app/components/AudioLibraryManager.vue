<template>
  <div class="space-y-5">
    <!-- Header with Upload & Record Actions -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h2 class="text-base sm:text-lg font-bold text-white flex items-center gap-2">
          <span>Koleksi Audio & Studio Rekaman</span>
          <span class="text-xs px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 font-mono font-semibold">
            {{ audios.length }} Berkas
          </span>
        </h2>
        <p class="text-xs text-slate-400">Kelola berkas audio pengumuman, unggah file baru, atau rekam suara langsung lewat mikrofon.</p>
      </div>

      <!-- Action buttons -->
      <div class="flex items-center gap-2 self-start sm:self-auto">
        <!-- Direct Record Button -->
        <button 
          @click="openRecorderModal"
          class="btn btn-primary text-xs py-2 px-3.5 rounded-xl shadow-md shadow-sky-500/20 flex items-center gap-1.5"
        >
          <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
          </svg>
          <span>Rekam Suara Mic</span>
        </button>

        <!-- Upload File Button -->
        <button 
          @click="showUploadModal = true"
          class="btn btn-secondary text-xs py-2 px-3.5 rounded-xl border-slate-700 hover:bg-slate-800 flex items-center gap-1.5"
        >
          <svg class="w-4 h-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <span>Unggah Audio MP3</span>
        </button>
      </div>
    </div>

    <!-- Audios Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div 
        v-for="audio in audios" 
        :key="audio.id"
        class="glass-panel p-4 flex flex-col justify-between transition-all duration-200 hover:border-slate-600 relative group"
      >
        <div>
          <!-- Category & Action menu -->
          <div class="flex items-center justify-between gap-2 mb-2">
            <span class="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-sky-300 border border-slate-700/80">
              {{ audio.category || 'Umum' }}
            </span>

            <div class="flex items-center gap-1">
              <!-- Edit Button -->
              <button 
                @click="openEditModal(audio)"
                class="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Edit Informasi Audio"
              >
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>

              <!-- Delete Button -->
              <button 
                @click="deleteAudio(audio.id)"
                class="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                title="Hapus Berkas Audio"
              >
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Title -->
          <h3 class="text-sm font-bold text-white mb-1 line-clamp-1" :title="audio.title">
            {{ audio.title }}
          </h3>

          <!-- Filename & Description -->
          <p class="text-[11px] font-mono text-slate-400 truncate mb-1">
            📁 {{ audio.filename }}
          </p>
          <p class="text-xs text-slate-400 line-clamp-2 mb-3 min-h-[2rem]">
            {{ audio.description || 'Pengumuman suara untuk disiarkan ke seluruh pengunjung.' }}
          </p>
        </div>

        <!-- Inline Audio Player Bar -->
        <div class="pt-3 border-t border-slate-800/80">
          <audio :src="audio.url" controls class="w-full h-8 opacity-80 hover:opacity-100 transition-opacity rounded"></audio>
        </div>
      </div>
    </div>

    <!-- MODAL 1: UPLOAD FILE AUDIO -->
    <div v-if="showUploadModal" class="modal-overlay" @click.self="showUploadModal = false">
      <div class="modal-content p-5 sm:p-6 space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 class="text-base font-bold text-white flex items-center gap-2">
            <span>Unggah Berkas Audio Pengumuman</span>
          </h3>
          <button @click="showUploadModal = false" class="text-slate-400 hover:text-white text-lg">✕</button>
        </div>

        <form @submit.prevent="submitUpload" class="space-y-4">
          <!-- File Input -->
          <div>
            <label class="form-label">Pilih Berkas Audio (MP3, WAV, M4A, OGG) *</label>
            <input 
              type="file" 
              accept="audio/*" 
              required
              @change="onFileSelected"
              class="form-input text-xs"
            />
          </div>

          <!-- Title -->
          <div>
            <label class="form-label">Judul Pengumuman *</label>
            <input 
              v-model="uploadForm.title" 
              type="text" 
              required
              placeholder="Contoh: Panggilan Penumpang Lion Air JT-610"
              class="form-input"
            />
          </div>

          <!-- Category -->
          <div>
            <label class="form-label">Kategori Pengumuman</label>
            <input 
              v-model="uploadForm.category" 
              type="text" 
              placeholder="Contoh: Boarding Call, Informasi Layanan, dsb."
              class="form-input"
            />
          </div>

          <!-- Description -->
          <div>
            <label class="form-label">Keterangan / Deskripsi Singkat</label>
            <textarea 
              v-model="uploadForm.description" 
              rows="2"
              placeholder="Catatan teks isi pengumuman..."
              class="form-textarea"
            ></textarea>
          </div>

          <!-- Submit Buttons -->
          <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button type="button" @click="showUploadModal = false" class="btn btn-secondary text-xs">
              Batal
            </button>
            <button type="submit" :disabled="isUploading" class="btn btn-primary text-xs px-5">
              {{ isUploading ? 'Mengunggah...' : 'Simpan ke Koleksi' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL 2: EDIT AUDIO METADATA -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
      <div class="modal-content p-5 sm:p-6 space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 class="text-base font-bold text-white">Edit Informasi Audio</h3>
          <button @click="showEditModal = false" class="text-slate-400 hover:text-white text-lg">✕</button>
        </div>

        <form @submit.prevent="submitEdit" class="space-y-4">
          <div>
            <label class="form-label">Judul Pengumuman *</label>
            <input v-model="editForm.title" type="text" required class="form-input" />
          </div>

          <div>
            <label class="form-label">Kategori</label>
            <input v-model="editForm.category" type="text" class="form-input" />
          </div>

          <div>
            <label class="form-label">Keterangan / Deskripsi</label>
            <textarea v-model="editForm.description" rows="3" class="form-textarea"></textarea>
          </div>

          <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button type="button" @click="showEditModal = false" class="btn btn-secondary text-xs">Batal</button>
            <button type="submit" class="btn btn-primary text-xs px-5">Simpan Perubahan</button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL 3: STUDIO REKAMAN SUARA MIKROFON -->
    <div v-if="showRecorderModal" class="modal-overlay" @click.self="closeRecorderModal">
      <div class="modal-content p-5 sm:p-6 space-y-4 max-w-lg">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-red-500" :class="{ 'animate-ping': isRecording }"></div>
            <h3 class="text-base font-bold text-white">Studio Perekam Suara Pengumuman</h3>
          </div>
          <button @click="closeRecorderModal" class="text-slate-400 hover:text-white text-lg">✕</button>
        </div>

        <!-- Recording Console UI -->
        <div class="bg-slate-950/80 rounded-2xl p-6 border border-slate-800 text-center space-y-4">
          <!-- Digital Timer -->
          <div class="font-mono text-3xl sm:text-4xl font-black" :class="isRecording ? 'text-red-400' : 'text-slate-300'">
            {{ recordTimeStr }}
          </div>

          <!-- Status Text -->
          <div class="text-xs text-slate-400">
            <span v-if="isRecording" class="text-red-400 font-bold uppercase tracking-wider flex items-center justify-center gap-2">
              <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              Sedang Merekam Suara Pengumuman...
            </span>
            <span v-else-if="recordedBlob">
              Rekaman Selesai. Dengarkan atau Rekam Ulang.
            </span>
            <span v-else>
              Tekan tombol mikrofon di bawah untuk mulai merekam audio pengumuman Anda.
            </span>
          </div>

          <!-- Soundwave animated bars when recording -->
          <div v-if="isRecording" class="flex items-center justify-center gap-1.5 h-10">
            <span class="wave-bar !bg-red-400"></span>
            <span class="wave-bar !bg-red-400"></span>
            <span class="wave-bar !bg-red-400"></span>
            <span class="wave-bar !bg-red-400"></span>
            <span class="wave-bar !bg-red-400"></span>
            <span class="wave-bar !bg-red-400"></span>
            <span class="wave-bar !bg-red-400"></span>
            <span class="wave-bar !bg-red-400"></span>
          </div>

          <!-- Controls Buttons -->
          <div class="flex items-center justify-center gap-3 pt-2">
            <!-- Start Record -->
            <button 
              v-if="!isRecording"
              @click="startRecording"
              class="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-900/50 hover:scale-105 active:scale-95 transition-all"
              title="Mulai Rekam"
            >
              <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clip-rule="evenodd" />
              </svg>
            </button>

            <!-- Stop Record -->
            <button 
              v-else
              @click="stopRecording"
              class="w-16 h-16 rounded-full bg-slate-800 hover:bg-slate-700 text-red-400 border-2 border-red-500 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
              title="Selesai Rekam"
            >
              <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <rect x="5" y="5" width="10" height="10" rx="1.5" />
              </svg>
            </button>
          </div>

          <!-- Preview Player for recorded audio -->
          <div v-if="recordedAudioUrl && !isRecording" class="pt-3">
            <audio :src="recordedAudioUrl" controls class="w-full h-8 rounded opacity-90"></audio>
          </div>
        </div>

        <!-- Meta form for saved recording -->
        <div v-if="recordedBlob && !isRecording" class="space-y-3 pt-2">
          <div>
            <label class="form-label">Judul Pengumuman Rekaman *</label>
            <input 
              v-model="recordForm.title" 
              type="text" 
              required
              placeholder="Contoh: Pengumuman Boarding Gate 3"
              class="form-input"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="form-label">Kategori</label>
              <input 
                v-model="recordForm.category" 
                type="text" 
                placeholder="Suara Langsung"
                class="form-input"
              />
            </div>
            <div>
              <label class="form-label">Keterangan</label>
              <input 
                v-model="recordForm.description" 
                type="text" 
                placeholder="Rekaman mikrofon petugas"
                class="form-input"
              />
            </div>
          </div>

          <!-- Save recording button -->
          <div class="flex items-center justify-end gap-2 pt-2">
            <button type="button" @click="startRecording" class="btn btn-secondary text-xs">
              Rekam Ulang
            </button>
            <button 
              type="button" 
              @click="saveRecording" 
              :disabled="isSavingRecord" 
              class="btn btn-primary text-xs px-5"
            >
              {{ isSavingRecord ? 'Menyimpan...' : 'Simpan Audio ke Koleksi' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { type AudioItem } from '../composables/useBroadcastEngine'

const props = defineProps<{
  audios: AudioItem[]
}>()

const emit = defineEmits<{
  (e: 'refresh'): void
}>()

const showUploadModal = ref(false)
const showEditModal = ref(false)
const showRecorderModal = ref(false)
const isUploading = ref(false)
const isSavingRecord = ref(false)

const selectedFile = ref<File | null>(null)
const uploadForm = reactive({
  title: '',
  category: 'Pengumuman Bandara',
  description: ''
})

const editingId = ref<number | null>(null)
const editForm = reactive({
  title: '',
  category: '',
  description: ''
})

// Recording Studio State
const isRecording = ref(false)
const recordedBlob = ref<Blob | null>(null)
const recordedAudioUrl = ref('')
const recordSeconds = ref(0)
const recordTimeStr = ref('00:00')
let mediaRecorder: MediaRecorder | null = null
let recordedChunks: Blob[] = []
let recordTimer: any = null

const recordForm = reactive({
  title: '',
  category: 'Rekaman Suara',
  description: ''
})

function onFileSelected(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.files && target.files[0]) {
    selectedFile.value = target.files[0]
    if (!uploadForm.title) {
      uploadForm.title = target.files[0].name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ')
    }
  }
}

async function submitUpload() {
  if (!selectedFile.value) {
    alert('Pilih berkas audio terlebih dahulu')
    return
  }

  isUploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('title', uploadForm.title)
    formData.append('category', uploadForm.category)
    formData.append('description', uploadForm.description)

    await $fetch('/api/upload', {
      method: 'POST',
      body: formData
    })

    showUploadModal.value = false
    selectedFile.value = null
    uploadForm.title = ''
    uploadForm.description = ''
    emit('refresh')
  } catch (err: any) {
    alert(err?.message || 'Gagal mengunggah berkas audio')
  } finally {
    isUploading.value = false
  }
}

function openEditModal(audio: AudioItem) {
  editingId.value = audio.id
  editForm.title = audio.title
  editForm.category = audio.category || 'Umum'
  editForm.description = audio.description || ''
  showEditModal.value = true
}

async function submitEdit() {
  if (!editingId.value) return
  try {
    await $fetch(`/api/audios/${editingId.value}`, {
      method: 'PUT',
      body: editForm
    })
    showEditModal.value = false
    emit('refresh')
  } catch (err: any) {
    alert(err?.message || 'Gagal mengubah audio')
  }
}

async function deleteAudio(id: number) {
  if (!confirm('Apakah Anda yakin ingin menghapus audio ini dari koleksi?')) return
  try {
    await $fetch(`/api/audios/${id}`, { method: 'DELETE' })
    emit('refresh')
  } catch (err: any) {
    alert(err?.message || 'Gagal menghapus audio')
  }
}

// Media Recorder Methods
function openRecorderModal() {
  showRecorderModal.value = true
  recordedBlob.value = null
  recordedAudioUrl.value = ''
  recordSeconds.value = 0
  recordTimeStr.value = '00:00'
  recordForm.title = `Pengumuman Suara ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
  recordForm.category = 'Rekaman Suara'
  recordForm.description = 'Rekaman audio langsung petugas'
}

function closeRecorderModal() {
  if (isRecording.value) {
    stopRecording()
  }
  showRecorderModal.value = false
}

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    recordedChunks = []
    recordSeconds.value = 0
    recordTimeStr.value = '00:00'

    mediaRecorder = new MediaRecorder(stream)
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        recordedChunks.push(e.data)
      }
    }

    mediaRecorder.onstop = () => {
      recordedBlob.value = new Blob(recordedChunks, { type: 'audio/mp3' })
      recordedAudioUrl.value = URL.createObjectURL(recordedBlob.value)
      stream.getTracks().forEach(track => track.stop())
    }

    mediaRecorder.start()
    isRecording.value = true

    if (recordTimer) clearInterval(recordTimer)
    recordTimer = setInterval(() => {
      recordSeconds.value++
      const m = Math.floor(recordSeconds.value / 60)
      const s = recordSeconds.value % 60
      recordTimeStr.value = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }, 1000)
  } catch (err) {
    alert('Tidak dapat mengakses mikrofon. Pastikan izin mikrofon telah diberikan di peramban.')
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop()
  }
  isRecording.value = false
  if (recordTimer) {
    clearInterval(recordTimer)
    recordTimer = null
  }
}

async function saveRecording() {
  if (!recordedBlob.value) return
  if (!recordForm.title) {
    alert('Judul pengumuman harus diisi')
    return
  }

  isSavingRecord.value = true
  try {
    const file = new File([recordedBlob.value], 'rekaman_langsung.mp3', { type: 'audio/mp3' })
    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', recordForm.title)
    formData.append('category', recordForm.category)
    formData.append('description', recordForm.description)

    await $fetch('/api/upload', {
      method: 'POST',
      body: formData
    })

    showRecorderModal.value = false
    emit('refresh')
  } catch (err: any) {
    alert(err?.message || 'Gagal menyimpan rekaman')
  } finally {
    isSavingRecord.value = false
  }
}

defineExpose({
  openRecorderModal
})
</script>
