import path from 'node:path'
import fs from 'node:fs'
import { getDb } from '../utils/db'

export default defineEventHandler(async (event) => {
  const form = await readMultipartFormData(event)
  if (!form || form.length === 0) {
    throw createError({ statusCode: 400, message: 'Tidak ada berkas yang diunggah' })
  }

  let title = ''
  let category = 'Rekaman Baru'
  let description = ''
  let fileBuffer: Buffer | null = null
  let originalFilename = ''
  let mimeType = ''

  for (const part of form) {
    if (part.name === 'title') {
      title = part.data.toString('utf-8').trim()
    } else if (part.name === 'category') {
      category = part.data.toString('utf-8').trim()
    } else if (part.name === 'description') {
      description = part.data.toString('utf-8').trim()
    } else if (part.name === 'file' && part.data) {
      fileBuffer = part.data
      originalFilename = part.filename || 'recording.mp3'
      mimeType = part.type || 'audio/mpeg'
    }
  }

  if (!fileBuffer || fileBuffer.length === 0) {
    throw createError({ statusCode: 400, message: 'Data audio kosong' })
  }

  // Determine file extension
  let ext = path.extname(originalFilename).toLowerCase()
  if (!ext || ext === '.') {
    if (mimeType.includes('wav')) ext = '.wav'
    else if (mimeType.includes('ogg')) ext = '.ogg'
    else if (mimeType.includes('mp4') || mimeType.includes('m4a')) ext = '.m4a'
    else ext = '.mp3'
  }

  const timestamp = Date.now()
  const sanitizedTitle = (title || 'Audio').replace(/[^a-zA-Z0-9_\-]/g, '_').toLowerCase()
  const finalFilename = `${sanitizedTitle}_${timestamp}${ext}`

  const publicAudioDir = path.resolve(process.cwd(), 'public/audio')
  if (!fs.existsSync(publicAudioDir)) {
    fs.mkdirSync(publicAudioDir, { recursive: true })
  }

  const destinationPath = path.join(publicAudioDir, finalFilename)
  fs.writeFileSync(destinationPath, fileBuffer)

  const finalTitle = title || originalFilename.replace(/\.[^/.]+$/, '').replace(/_/g, ' ')
  const publicUrl = `/audio/${encodeURIComponent(finalFilename)}`

  const db = getDb()
  const stmt = db.prepare(`
    INSERT INTO audios (title, filename, file_path, url, duration, category, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  const result = stmt.run(finalTitle, finalFilename, destinationPath, publicUrl, 0, category, description)

  const createdAudio = db.prepare('SELECT * FROM audios WHERE id = ?').get(result.lastInsertRowid)

  return {
    success: true,
    data: createdAudio,
    message: 'Audio berhasil diunggah / disimpan!'
  }
})
