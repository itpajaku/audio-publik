import { getDb } from '../../utils/db'

interface UpdateAudioBody {
  title?: string
  category?: string
  description?: string
  duration?: number
}

interface AudioRecord {
  id: number
  title: string
  filename: string
  file_path: string
  url: string
  duration: number
  category: string
  description: string
  created_at: string
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = (await readBody<UpdateAudioBody>(event)) || {}

  if (!id) {
    throw createError({ statusCode: 400, message: 'ID audio tidak valid' })
  }

  const db = getDb()
  const current = db.prepare('SELECT * FROM audios WHERE id = ?').get(id) as AudioRecord | undefined
  if (!current) {
    throw createError({ statusCode: 404, message: 'Audio tidak ditemukan' })
  }

  const title = body.title !== undefined ? String(body.title).trim() : current.title
  const category = body.category !== undefined ? String(body.category).trim() : current.category
  const description = body.description !== undefined ? String(body.description).trim() : current.description
  const duration = body.duration !== undefined ? Number(body.duration) : current.duration

  db.prepare(`
    UPDATE audios 
    SET title = ?, category = ?, description = ?, duration = ?
    WHERE id = ?
  `).run(title, category, description, duration, id)

  const updated = db.prepare('SELECT * FROM audios WHERE id = ?').get(id)
  return { success: true, data: updated }
})
