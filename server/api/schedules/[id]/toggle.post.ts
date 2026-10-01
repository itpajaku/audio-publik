import { getDb } from '../../../utils/db'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID jadwal tidak valid' })
  }

  const db = getDb()
  const schedule = db.prepare('SELECT id, is_active FROM schedules WHERE id = ?').get(id) as any
  if (!schedule) {
    throw createError({ statusCode: 404, message: 'Jadwal tidak ditemukan' })
  }

  const newStatus = schedule.is_active ? 0 : 1
  db.prepare('UPDATE schedules SET is_active = ? WHERE id = ?').run(newStatus, id)

  return {
    success: true,
    is_active: Boolean(newStatus),
    message: newStatus ? 'Jadwal diaktifkan' : 'Jadwal dinonaktifkan'
  }
})
