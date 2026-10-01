import { getDb } from '../../utils/db'

export default defineEventHandler(() => {
  const db = getDb()
  const audios = db.prepare(`
    SELECT 
      a.*,
      (SELECT COUNT(*) FROM playback_logs l WHERE l.audio_id = a.id) as total_plays,
      (SELECT COUNT(*) FROM schedules s WHERE s.audio_id = a.id AND s.is_active = 1) as active_schedules_count
    FROM audios a
    ORDER BY a.title ASC
  `).all()

  return { success: true, data: audios }
})
