import { getDb } from '../../utils/db'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID jadwal tidak valid' })
  }

  const db = getDb()
  const exists = db.prepare('SELECT id FROM schedules WHERE id = ?').get(id)
  if (!exists) {
    throw createError({ statusCode: 404, message: 'Jadwal tidak ditemukan' })
  }

  db.prepare('DELETE FROM schedules WHERE id = ?').run(id)

  return { success: true, message: 'Jadwal berhasil dihapus' }
})
