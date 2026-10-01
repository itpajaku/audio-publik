import { getDb } from '../../utils/db'

export default defineEventHandler(() => {
  const db = getDb()
  const schedules = db.prepare(`
    SELECT 
      s.*,
      a.title as audio_title,
      a.url as audio_url,
      a.duration as audio_duration,
      a.category as audio_category,
      a.filename as audio_filename
    FROM schedules s
    JOIN audios a ON s.audio_id = a.id
    ORDER BY s.is_active DESC, s.name ASC
  `).all()

  // Parse JSON fields
  const formatted = schedules.map((item: any) => ({
    ...item,
    specific_times: typeof item.specific_times === 'string' ? JSON.parse(item.specific_times || '[]') : item.specific_times,
    days_of_week: typeof item.days_of_week === 'string' ? JSON.parse(item.days_of_week || '[0,1,2,3,4,5,6]') : item.days_of_week,
    is_active: Boolean(item.is_active),
    play_chime: Boolean(item.play_chime)
  }))

  return { success: true, data: formatted }
})
