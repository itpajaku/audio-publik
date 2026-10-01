import { getDb } from '../../utils/db'
import fs from 'node:fs'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID audio tidak valid' })
  }

  const db = getDb()
  const audio = db.prepare('SELECT * FROM audios WHERE id = ?').get(id) as any
  if (!audio) {
    throw createError({ statusCode: 404, message: 'Audio tidak ditemukan' })
  }

  // Delete from db
  db.prepare('DELETE FROM audios WHERE id = ?').run(id)

  // Optionally remove file if it exists and is an uploaded audio
  try {
    if (audio.file_path && fs.existsSync(audio.file_path)) {
      // only delete if it was created in public/audio
      fs.unlinkSync(audio.file_path)
    }
  } catch (err) {
    console.error('Error removing audio file:', err)
  }

  return { success: true, message: 'Audio berhasil dihapus' }
})
