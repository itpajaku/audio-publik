import path from 'node:path'
import fs from 'node:fs'
import { sendStream, setHeader, setResponseStatus, createError, getHeader } from 'h3'

export default defineEventHandler((event) => {
  const rawSlug = getRouterParam(event, 'slug')
  if (!rawSlug) {
    throw createError({ statusCode: 400, message: 'Audio filename is required' })
  }

  // Decode URI component and prevent directory traversal
  let decodedSlug = ''
  try {
    decodedSlug = decodeURIComponent(rawSlug)
  } catch {
    decodedSlug = rawSlug
  }

  const safeFilename = path.normalize(decodedSlug).replace(/^(\.\.[\/\\])+/, '')
  const filePath = path.resolve(process.cwd(), 'public/audio', safeFilename)

  if (!fs.existsSync(filePath)) {
    throw createError({ statusCode: 404, message: 'Berkas audio tidak ditemukan' })
  }

  const stat = fs.statSync(filePath)
  if (!stat.isFile()) {
    throw createError({ statusCode: 404, message: 'Berkas audio tidak valid' })
  }

  const ext = path.extname(filePath).toLowerCase()
  const mimeTypes: Record<string, string> = {
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.m4a': 'audio/mp4',
    '.aac': 'audio/aac',
    '.flac': 'audio/flac',
    '.weba': 'audio/webm'
  }

  setHeader(event, 'Content-Type', mimeTypes[ext] || 'application/octet-stream')
  setHeader(event, 'Accept-Ranges', 'bytes')
  setHeader(event, 'Cache-Control', 'public, max-age=86400')

  const range = getHeader(event, 'range')
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-')
    const start = parseInt(parts[0], 10)
    const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1
    const chunkSize = end - start + 1

    setResponseStatus(event, 206)
    setHeader(event, 'Content-Range', `bytes ${start}-${end}/${stat.size}`)
    setHeader(event, 'Content-Length', chunkSize)
    return sendStream(event, fs.createReadStream(filePath, { start, end }))
  }

  setHeader(event, 'Content-Length', stat.size)
  return sendStream(event, fs.createReadStream(filePath))
})
