import { getDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = (await readBody<Record<string, any>>(event)) || {}

  if (!id) {
    throw createError({ statusCode: 400, message: 'ID jadwal tidak valid' })
  }

  const db = getDb()
  const current = db.prepare('SELECT * FROM schedules WHERE id = ?').get(id) as any
  if (!current) {
    throw createError({ statusCode: 404, message: 'Jadwal tidak ditemukan' })
  }

  const audioId = body.audio_id !== undefined ? Number(body.audio_id) : current.audio_id
  const name = body.name !== undefined ? String(body.name).trim() : current.name
  const mode = body.mode !== undefined ? body.mode : current.mode
  const intervalMinutes = body.interval_minutes !== undefined ? Number(body.interval_minutes) : current.interval_minutes
  const specificTimes = body.specific_times !== undefined ? JSON.stringify(body.specific_times) : current.specific_times
  const startTime = body.start_time !== undefined ? body.start_time : current.start_time
  const endTime = body.end_time !== undefined ? body.end_time : current.end_time
  const daysOfWeek = body.days_of_week !== undefined ? JSON.stringify(body.days_of_week) : current.days_of_week
  const isActive = body.is_active !== undefined ? (body.is_active ? 1 : 0) : current.is_active
  const playChime = body.play_chime !== undefined ? (body.play_chime ? 1 : 0) : current.play_chime
  const repeatCount = body.repeat_count !== undefined ? Number(body.repeat_count) : current.repeat_count
  const repeatDelaySeconds = body.repeat_delay_seconds !== undefined ? Number(body.repeat_delay_seconds) : current.repeat_delay_seconds

  db.prepare(`
    UPDATE schedules SET
      audio_id = ?,
      name = ?,
      mode = ?,
      interval_minutes = ?,
      specific_times = ?,
      start_time = ?,
      end_time = ?,
      days_of_week = ?,
      is_active = ?,
      play_chime = ?,
      repeat_count = ?,
      repeat_delay_seconds = ?
    WHERE id = ?
  `).run(
    audioId,
    name,
    mode,
    intervalMinutes,
    specificTimes,
    startTime,
    endTime,
    daysOfWeek,
    isActive,
    playChime,
    repeatCount,
    repeatDelaySeconds,
    id
  )

  const updated = db.prepare('SELECT * FROM schedules WHERE id = ?').get(id)
  return { success: true, data: updated, message: 'Jadwal berhasil diperbarui' }
})
