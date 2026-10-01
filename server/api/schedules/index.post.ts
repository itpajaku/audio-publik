import { getDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const body = (await readBody<Record<string, any>>(event)) || {}

  if (!body.audio_id || !body.name) {
    throw createError({ statusCode: 400, message: 'Audio dan Nama Jadwal harus diisi' })
  }

  const db = getDb()

  const mode = body.mode || 'interval' // 'interval' | 'specific_times' | 'once'
  const intervalMinutes = Number(body.interval_minutes) || 30
  const specificTimes = JSON.stringify(Array.isArray(body.specific_times) ? body.specific_times : [])
  const startTime = body.start_time || '07:00'
  const endTime = body.end_time || '21:00'
  const daysOfWeek = JSON.stringify(Array.isArray(body.days_of_week) ? body.days_of_week : [0, 1, 2, 3, 4, 5, 6])
  const isActive = body.is_active === false ? 0 : 1
  const playChime = body.play_chime === false ? 0 : 1
  const repeatCount = Math.max(1, Number(body.repeat_count) || 1)
  const repeatDelaySeconds = Math.max(1, Number(body.repeat_delay_seconds) || 3)

  const stmt = db.prepare(`
    INSERT INTO schedules (
      audio_id, name, mode, interval_minutes, specific_times, 
      start_time, end_time, days_of_week, is_active, play_chime, 
      repeat_count, repeat_delay_seconds
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const res = stmt.run(
    body.audio_id,
    body.name.trim(),
    mode,
    intervalMinutes,
    specificTimes,
    startTime,
    endTime,
    daysOfWeek,
    isActive,
    playChime,
    repeatCount,
    repeatDelaySeconds
  )

  const created = db.prepare('SELECT * FROM schedules WHERE id = ?').get(res.lastInsertRowid)

  return { success: true, data: created, message: 'Jadwal berhasil dibuat' }
})
