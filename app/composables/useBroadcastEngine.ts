import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useChime } from './useChime'

export interface AudioItem {
  id: number
  title: string
  filename: string
  file_path: string
  url: string
  duration: number
  category: string
  description: string
  total_plays?: number
  active_schedules_count?: number
}

export interface ScheduleItem {
  id: number
  audio_id: number
  name: string
  mode: 'interval' | 'specific_times' | 'once'
  interval_minutes: number
  specific_times: string[]
  start_time: string
  end_time: string
  days_of_week: number[]
  is_active: boolean
  play_chime: boolean
  repeat_count: number
  repeat_delay_seconds: number
  last_played_at: string | null
  audio_title?: string
  audio_url?: string
  audio_duration?: number
  audio_category?: string
  audio_filename?: string
}

const isPlaying = ref(false)
const currentAudio = ref<AudioItem | null>(null)
const currentSchedule = ref<ScheduleItem | null>(null)
const broadcastType = ref<'automatic' | 'manual'>('manual')
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(0.85)
const isMuted = ref(false)
const isChimePlaying = ref(false)
const masterAutoEnabled = ref(true)

// Next announcement queue state
const nextScheduledInfo = ref<{
  schedule: ScheduleItem | null
  audio: AudioItem | null
  time: string
  secondsLeft: number
} | null>(null)

let audioElement: HTMLAudioElement | null = null
let intervalTimer: any = null
let repeatCounter = 1
let engineStartedAt = 0
let previousMasterAutoState = true
const processedSlots = new Set<string>()

export function getScheduleSlotsForDay(schedule: ScheduleItem): string[] {
  let times: string[] = []

  if (schedule.mode === 'specific_times') {
    let raw = schedule.specific_times
    if (typeof raw === 'string') {
      try { raw = JSON.parse(raw) } catch { raw = [] }
    }
    if (Array.isArray(raw)) {
      times = raw.filter(t => typeof t === 'string' && /^\d{1,2}:\d{2}$/.test(t))
    }
    return times.sort()
  }

  if (schedule.mode === 'interval') {
    const start = schedule.start_time || '08:00'
    const end = schedule.end_time || '20:00'
    const [startH, startM] = start.split(':').map(Number)
    const [endH, endM] = end.split(':').map(Number)
    const startMin = (startH || 0) * 60 + (startM || 0)
    const endMin = (endH || 0) * 60 + (endM || 0)
    const interval = Math.max(1, schedule.interval_minutes || 30)

    for (let m = startMin; m <= endMin; m += interval) {
      const h = Math.floor(m / 60)
      const min = m % 60
      if (h >= 24) break
      times.push(`${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`)
    }
    return times
  }

  if (schedule.mode === 'once') {
    if (schedule.start_time && /^\d{1,2}:\d{2}$/.test(schedule.start_time)) {
      return [schedule.start_time]
    }
  }

  return []
}

export function getNextScheduleSlot(schedule: ScheduleItem): { time: string; isTomorrow: boolean; dayName?: string; secondsLeft: number } | null {
  if (!schedule.is_active) return null

  const now = new Date()
  const currentDay = now.getDay()
  const slots = getScheduleSlotsForDay(schedule)
  const firstSlot = slots[0]
  if (!firstSlot) return null

  let days = schedule.days_of_week
  if (typeof days === 'string') {
    try { days = JSON.parse(days) } catch { days = [0, 1, 2, 3, 4, 5, 6] }
  }
  if (!Array.isArray(days)) days = [0, 1, 2, 3, 4, 5, 6]

  // 1. Check today's slots if today is an active day
  if (days.includes(currentDay)) {
    for (const slotTime of slots) {
      const [sH = 0, sM = 0] = slotTime.split(':').map(Number)
      const slotDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), sH, sM, 0, 0)
      const diffSec = Math.floor((slotDate.getTime() - now.getTime()) / 1000)
      if (diffSec > 0) {
        return { time: slotTime, isTomorrow: false, secondsLeft: diffSec }
      }
    }
  }

  // 2. Check upcoming days (1 to 7 days ahead)
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
  for (let offset = 1; offset <= 7; offset++) {
    const futureDate = new Date(now)
    futureDate.setDate(futureDate.getDate() + offset)
    const futureDay = futureDate.getDay()
    if (days.includes(futureDay)) {
      const [sH = 0, sM = 0] = firstSlot.split(':').map(Number)
      const slotDate = new Date(futureDate.getFullYear(), futureDate.getMonth(), futureDate.getDate(), sH, sM, 0, 0)
      const diffSec = Math.floor((slotDate.getTime() - now.getTime()) / 1000)
      return {
        time: firstSlot,
        isTomorrow: offset === 1,
        dayName: offset > 1 ? dayNames[futureDay] : undefined,
        secondsLeft: diffSec
      }
    }
  }

  return null
}

async function recordMissedScheduleLog(schedule: ScheduleItem, audio: AudioItem, slotTime: string, reason: string) {
  try {
    await $fetch('/api/logs', {
      method: 'POST',
      body: {
        audio_id: audio.id,
        schedule_id: schedule.id,
        audio_title: audio.title,
        category: audio.category,
        trigger_type: 'automatic',
        duration_played: 0,
        status: 'missed',
        details: `Dilewati otomatis jam ${slotTime} WIB (${reason}). Tidak diputar paksa agar tidak mengganggu jadwal yang akan datang.`
      }
    })
  } catch (e) {
    console.error('Gagal mencatat log jadwal terlewat:', e)
  }
}

export function useBroadcastEngine() {
  const { playAirportChime } = useChime()

  function getAudioEl(): HTMLAudioElement {
    if (!audioElement && typeof window !== 'undefined') {
      audioElement = new Audio()
      audioElement.preload = 'auto'

      audioElement.ontimeupdate = () => {
        if (audioElement) {
          currentTime.value = audioElement.currentTime
          duration.value = audioElement.duration || duration.value
        }
      }

      audioElement.onloadedmetadata = () => {
        if (audioElement && audioElement.duration) {
          duration.value = audioElement.duration
        }
      }

      audioElement.onended = async () => {
        if (currentSchedule.value && repeatCounter < (currentSchedule.value.repeat_count || 1)) {
          repeatCounter++
          const delaySec = currentSchedule.value.repeat_delay_seconds || 3
          setTimeout(() => {
            if (audioElement && currentAudio.value) {
              audioElement.currentTime = 0
              audioElement.play().catch(e => console.warn('Repeat play failed', e))
            }
          }, delaySec * 1000)
          return
        }

        // Broadcast completed!
        await recordPlaybackLog('success')
        resetPlayer()
      }

      audioElement.onerror = async (err) => {
        console.error('Audio playback error', err)
        await recordPlaybackLog('failed', 'Error saat memutar file audio')
        resetPlayer()
      }
    }
    return audioElement!
  }

  function resetPlayer() {
    isPlaying.value = false
    isChimePlaying.value = false
    currentAudio.value = null
    currentSchedule.value = null
    currentTime.value = 0
    duration.value = 0
    repeatCounter = 1
  }

  async function recordPlaybackLog(status: 'success' | 'interrupted' | 'failed', details: string = '') {
    if (!currentAudio.value) return
    try {
      await $fetch('/api/logs', {
        method: 'POST',
        body: {
          audio_id: currentAudio.value.id,
          schedule_id: currentSchedule.value ? currentSchedule.value.id : null,
          audio_title: currentAudio.value.title,
          category: currentAudio.value.category,
          trigger_type: broadcastType.value,
          duration_played: Math.round(currentTime.value),
          status,
          details: details || (broadcastType.value === 'automatic'
            ? `Siaran otomatis: ${currentSchedule.value?.name || 'Jadwal'}`
            : 'Siaran manual langsung dari operator')
        }
      })
    } catch (e) {
      console.error('Gagal mencatat log siaran:', e)
    }
  }

  async function playBroadcast(
    audio: AudioItem,
    type: 'automatic' | 'manual' = 'manual',
    schedule: ScheduleItem | null = null
  ) {
    const el = getAudioEl()

    if (isPlaying.value) {
      // If currently playing, interrupt previous
      el.pause()
      await recordPlaybackLog('interrupted', 'Diinterupsi oleh siaran berikutnya')
    }

    currentAudio.value = audio
    currentSchedule.value = schedule
    broadcastType.value = type
    isPlaying.value = true
    repeatCounter = 1

    el.volume = volume.value

    const shouldPlayChime = schedule ? schedule.play_chime : true
    if (shouldPlayChime) {
      isChimePlaying.value = true
      await playAirportChime('airport3')
      isChimePlaying.value = false
    }

    el.src = audio.url
    try {
      await el.play()
    } catch (err) {
      console.error('Autoplay prevented or error', err)
      isPlaying.value = false
      await recordPlaybackLog('failed', 'Pemutaran diblokir oleh browser (autoplay policy)')
    }
  }

  function stopBroadcast() {
    if (audioElement && isPlaying.value) {
      audioElement.pause()
      recordPlaybackLog('interrupted', 'Dihentikan manual oleh petugas pengumuman')
      resetPlayer()
    }
  }

  function setVolume(val: number) {
    volume.value = Math.max(0, Math.min(1, val))
    if (audioElement) {
      audioElement.volume = volume.value
    }
  }

  function toggleMute() {
    isMuted.value = !isMuted.value
    if (audioElement) {
      audioElement.muted = isMuted.value
    }
  }

  // Scheduler logic: Calculate next upcoming run and trigger active schedules on exact time
  function evaluateSchedules(schedules: ScheduleItem[], audios: AudioItem[]) {
    if (!masterAutoEnabled.value) {
      previousMasterAutoState = false
      nextScheduledInfo.value = null
      return
    }

    // If master auto was just re-enabled, set engine start time to now so past schedules are not triggered
    if (!previousMasterAutoState && masterAutoEnabled.value) {
      engineStartedAt = Date.now()
      previousMasterAutoState = true
    }

    if (schedules.length === 0) {
      nextScheduledInfo.value = null
      return
    }

    const now = new Date()
    const nowMs = now.getTime()
    const currentDay = now.getDay()
    const todayDateStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`

    let closestSchedule: ScheduleItem | null = null
    let closestAudio: AudioItem | null = null
    let closestTimeStr = ''
    let minSecondsRemaining = Infinity

    for (const schedule of schedules) {
      if (!schedule.is_active) continue

      let days = schedule.days_of_week
      if (typeof days === 'string') {
        try { days = JSON.parse(days) } catch { days = [0, 1, 2, 3, 4, 5, 6] }
      }
      if (!Array.isArray(days) || !days.includes(currentDay)) continue

      const audio = audios.find(a => a.id === schedule.audio_id)
      if (!audio) continue

      const slots = getScheduleSlotsForDay(schedule)

      for (const slotTime of slots) {
        const [slotH = 0, slotM = 0] = slotTime.split(':').map(Number)
        const slotDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), slotH, slotM, 0, 0)
        const slotTimeMs = slotDate.getTime()
        const diffMs = slotTimeMs - nowMs
        const diffSec = Math.floor(diffMs / 1000)
        const slotKey = `${schedule.id}-${todayDateStr}-${slotTime}`

        // PAST / MISSED SLOT DETECTION:
        // A schedule slot is considered MISSED / PASSED if:
        // 1. diffSec < -15 (scheduled moment was more than 15 seconds ago), OR
        // 2. The scheduled slot arrived before or while the engine was initializing (e.g. app was off, closed, or sleeping)
        const isPastSlot = diffSec < -15
        const isArrivedBeforeStartup = slotTimeMs <= (engineStartedAt + 1000)

        if (isPastSlot || isArrivedBeforeStartup) {
          // STRICT RULE: JANGAN PAKSA AUDIO UNTUK MEMUTAR SECARA OTOMATIS JIKA JADWAL TERLEWAT!
          // Mark as processed so it never triggers retroactively.
          if (!processedSlots.has(slotKey)) {
            processedSlots.add(slotKey)
          }
          continue
        }

        // TRIGGER WINDOW:
        // Target slot is arriving right now (between 0 and 15 seconds after the exact slot second).
        const isDueNow = diffSec <= 1 && diffSec >= -15

        if (isDueNow) {
          if (!processedSlots.has(slotKey)) {
            processedSlots.add(slotKey)

            if (isPlaying.value) {
              // Channel is currently occupied by another broadcast!
              // Do NOT force playback late or disrupt upcoming broadcasts!
              recordMissedScheduleLog(
                schedule,
                audio,
                slotTime,
                'Saluran audio sedang sibuk memutar siaran lain'
              )
            } else {
              // Channel is free: Trigger automatic broadcast!
              playBroadcast(audio, 'automatic', schedule)
            }
          }
          continue
        }

        // FUTURE / UPCOMING SLOT:
        if (diffSec > 0 && diffSec < minSecondsRemaining) {
          minSecondsRemaining = diffSec
          closestSchedule = schedule
          closestAudio = audio
          closestTimeStr = `${slotTime} WIB`
        }
      }
    }

    // If no more slots remaining for today, check upcoming slot for tomorrow/next active day!
    if (!closestSchedule) {
      for (const schedule of schedules) {
        if (!schedule.is_active) continue
        const audio = audios.find(a => a.id === schedule.audio_id)
        if (!audio) continue

        const nextSlot = getNextScheduleSlot(schedule)
        if (nextSlot && nextSlot.secondsLeft > 0 && nextSlot.secondsLeft < minSecondsRemaining) {
          minSecondsRemaining = nextSlot.secondsLeft
          closestSchedule = schedule
          closestAudio = audio
          const label = nextSlot.isTomorrow 
            ? `${nextSlot.time} WIB (Besok)` 
            : nextSlot.dayName 
              ? `${nextSlot.time} WIB (${nextSlot.dayName})`
              : `${nextSlot.time} WIB`
          closestTimeStr = label
        }
      }
    }

    if (closestSchedule && closestAudio && minSecondsRemaining < Infinity) {
      nextScheduledInfo.value = {
        schedule: closestSchedule,
        audio: closestAudio,
        time: closestTimeStr,
        secondsLeft: minSecondsRemaining
      }
    } else {
      nextScheduledInfo.value = null
    }
  }

  function startScheduler(fetchSchedulesAndAudios: () => { schedules: ScheduleItem[]; audios: AudioItem[] }) {
    if (intervalTimer) clearInterval(intervalTimer)
    engineStartedAt = Date.now()
    previousMasterAutoState = masterAutoEnabled.value
    processedSlots.clear()

    // Immediate initial evaluation to set nextScheduledInfo without triggering stale audio
    const initial = fetchSchedulesAndAudios()
    evaluateSchedules(initial.schedules, initial.audios)

    intervalTimer = setInterval(() => {
      const { schedules, audios } = fetchSchedulesAndAudios()
      evaluateSchedules(schedules, audios)
    }, 1000)
  }

  function stopScheduler() {
    if (intervalTimer) {
      clearInterval(intervalTimer)
      intervalTimer = null
    }
  }

  return {
    isPlaying,
    isChimePlaying,
    currentAudio,
    currentSchedule,
    broadcastType,
    currentTime,
    duration,
    volume,
    isMuted,
    masterAutoEnabled,
    nextScheduledInfo,
    playBroadcast,
    stopBroadcast,
    setVolume,
    toggleMute,
    startScheduler,
    stopScheduler,
    getScheduleSlotsForDay,
    getNextScheduleSlot
  }
}
