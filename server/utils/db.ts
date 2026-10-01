import Database from 'better-sqlite3'
import path from 'node:path'
import fs from 'node:fs'

let _db: Database.Database | null = null

export function getDb(): Database.Database {
  if (_db) return _db

  const dataDir = path.resolve(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  const dbPath = path.join(dataDir, 'broadcast.db')
  _db = new Database(dbPath)
  _db.pragma('journal_mode = WAL')
  _db.pragma('foreign_keys = ON')

  initSchema(_db)
  seedInitialAudios(_db)

  return _db
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS audios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      filename TEXT NOT NULL,
      file_path TEXT NOT NULL,
      url TEXT NOT NULL,
      duration REAL DEFAULT 0,
      category TEXT DEFAULT 'Umum',
      description TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      audio_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      mode TEXT NOT NULL DEFAULT 'interval', -- 'interval' | 'specific_times' | 'once'
      interval_minutes INTEGER DEFAULT 30,
      specific_times TEXT DEFAULT '[]',     -- JSON array of 'HH:mm' strings
      start_time TEXT DEFAULT '07:00',
      end_time TEXT DEFAULT '21:00',
      days_of_week TEXT DEFAULT '[0,1,2,3,4,5,6]', -- 0=Minggu, 1=Senin, dst.
      is_active INTEGER DEFAULT 1,
      play_chime INTEGER DEFAULT 1,
      repeat_count INTEGER DEFAULT 1,
      repeat_delay_seconds INTEGER DEFAULT 3,
      last_played_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (audio_id) REFERENCES audios(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS playback_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      audio_id INTEGER,
      schedule_id INTEGER,
      audio_title TEXT NOT NULL,
      category TEXT DEFAULT 'Umum',
      trigger_type TEXT NOT NULL, -- 'automatic' | 'manual'
      played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      duration_played REAL DEFAULT 0,
      status TEXT DEFAULT 'success', -- 'success' | 'interrupted' | 'failed'
      details TEXT DEFAULT '',
      FOREIGN KEY (audio_id) REFERENCES audios(id) ON DELETE SET NULL,
      FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE SET NULL
    );
  `)
}

function seedInitialAudios(db: Database.Database) {
  const count = db.prepare('SELECT COUNT(*) as cnt FROM audios').get() as { cnt: number }
  if (count.cnt > 0) return

  const defaultMeta: Record<string, { title: string; category: string; description: string }> = {
    'anti_gratifikasi.mp3': {
      title: 'Himbauan Anti Gratifikasi & Suap',
      category: 'Integritas & Kepatuhan',
      description: 'Pengumuman kepatuhan larangan pemberian imbalan atau gratifikasi dalam bentuk apapun.'
    },
    'baca_doa.mp3': {
      title: 'Doa Bersama Memulai Pelayanan',
      category: 'Himbauan & Ibadah',
      description: 'Doa pembuka pelayanan dan keselamatan seluruh pengunjung dan staf.'
    },
    'iklan_antrian_online.mp3': {
      title: 'Informasi Antrean Online Pengunjung',
      category: 'Layanan Pengunjung',
      description: 'Panduan tata cara pengambilan dan pemantauan nomor antrean secara mandiri.'
    },
    'informasi_dan_pencegahan_percaloan.mp3': {
      title: 'Peringatan & Pencegahan Percaloan',
      category: 'Keamanan & Ketertiban',
      description: 'Himbauan waspada calo dan penegasan semua layanan resmi tanpa perantara.'
    },
    'program_smap.mp3': {
      title: 'Sosialisasi Sistem Manajemen Anti Penyuapan (SMAP)',
      category: 'Integritas & Kepatuhan',
      description: 'Penjelasan penerapan standar SMAP ISO 37001 untuk pelayanan bersih transparan.'
    },
    'SMAP (Bu Ketua).MP3.mp3': {
      title: 'Pesan Kebijakan Mutu & SMAP Pimpinan',
      category: 'Kebijakan Pimpinan',
      description: 'Sambutan dan komitmen pimpinan terkait pelayanan prima bebas korupsi.'
    },
    'tata_tertib.mp3': {
      title: 'Tata Tertib Pengunjung & Fasilitas',
      category: 'Keamanan & Ketertiban',
      description: 'Aturan ketertiban, kebersihan, dan keselamatan bagi seluruh visitor di area gedung.'
    }
  }

  const audioDir = path.resolve(process.cwd(), 'public/audio')
  if (!fs.existsSync(audioDir)) return

  const files = fs.readdirSync(audioDir)
  const insertStmt = db.prepare(`
    INSERT INTO audios (title, filename, file_path, url, duration, category, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const seededAudioIds: { id: number; filename: string }[] = []

  for (const file of files) {
    if (!file.match(/\.(mp3|wav|ogg|m4a|aac)$/i)) continue

    const meta = defaultMeta[file] || {
      title: file.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
      category: 'Pengumuman Bandara',
      description: 'Pengumuman publik berkala'
    }

    const publicUrl = `/audio/${encodeURIComponent(file)}`
    const filePath = path.join(audioDir, file)

    const res = insertStmt.run(
      meta.title,
      file,
      filePath,
      publicUrl,
      0, // Duration will be detected on client load or estimated
      meta.category,
      meta.description
    )

    seededAudioIds.push({ id: Number(res.lastInsertRowid), filename: file })
  }

  // Also seed realistic initial schedules so user immediately has active automatic schedules!
  const insertScheduleStmt = db.prepare(`
    INSERT INTO schedules (audio_id, name, mode, interval_minutes, specific_times, start_time, end_time, days_of_week, is_active, play_chime, repeat_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  // 1. Doa pagi jam 08:00
  const doaAudio = seededAudioIds.find(a => a.filename.includes('baca_doa'))
  if (doaAudio) {
    insertScheduleStmt.run(
      doaAudio.id,
      'Doa Bersama Pembuka Pelayanan',
      'specific_times',
      0,
      JSON.stringify(['08:00', '13:00']),
      '07:30',
      '17:00',
      JSON.stringify([1, 2, 3, 4, 5]),
      1,
      1,
      1
    )
  }

  // 2. Tata Tertib setiap 45 menit
  const tataTertibAudio = seededAudioIds.find(a => a.filename.includes('tata_tertib'))
  if (tataTertibAudio) {
    insertScheduleStmt.run(
      tataTertibAudio.id,
      'Pengingat Tata Tertib & Keamanan Area',
      'interval',
      45,
      JSON.stringify([]),
      '08:00',
      '20:00',
      JSON.stringify([0, 1, 2, 3, 4, 5, 6]),
      1,
      1,
      1
    )
  }

  // 3. Anti Calo setiap 60 menit
  const caloAudio = seededAudioIds.find(a => a.filename.includes('percaloan'))
  if (caloAudio) {
    insertScheduleStmt.run(
      caloAudio.id,
      'Himbauan Waspada Calo & Layanan Bebas Biaya',
      'interval',
      60,
      JSON.stringify([]),
      '08:30',
      '19:00',
      JSON.stringify([1, 2, 3, 4, 5]),
      1,
      1,
      1
    )
  }

  // 4. Antrean Online setiap 30 menit
  const antrianAudio = seededAudioIds.find(a => a.filename.includes('antrian'))
  if (antrianAudio) {
    insertScheduleStmt.run(
      antrianAudio.id,
      'Informasi Layanan & Nomor Antrean Online',
      'interval',
      30,
      JSON.stringify([]),
      '08:15',
      '17:00',
      JSON.stringify([1, 2, 3, 4, 5]),
      1,
      1,
      1
    )
  }

  // Pre-seed some realistic historical playback logs for today so the monitoring dashboard has initial data!
  const insertLogStmt = db.prepare(`
    INSERT INTO playback_logs (audio_id, schedule_id, audio_title, category, trigger_type, played_at, duration_played, status, details)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const todayStr = new Date().toISOString().split('T')[0]
  if (doaAudio) {
    insertLogStmt.run(
      doaAudio.id,
      1,
      'Doa Bersama Memulai Pelayanan',
      'Himbauan & Ibadah',
      'automatic',
      `${todayStr} 08:00:15`,
      124,
      'success',
      'Jadwal terjadwal jam 08:00 WIB'
    )
  }
  if (antrianAudio) {
    insertLogStmt.run(
      antrianAudio.id,
      4,
      'Informasi Antrean Online Pengunjung',
      'Layanan Pengunjung',
      'automatic',
      `${todayStr} 08:30:00`,
      28,
      'success',
      'Interval otomatis 30 menit'
    )
    insertLogStmt.run(
      antrianAudio.id,
      4,
      'Informasi Antrean Online Pengunjung',
      'Layanan Pengunjung',
      'automatic',
      `${todayStr} 09:00:00`,
      28,
      'success',
      'Interval otomatis 30 menit'
    )
  }
  if (tataTertibAudio) {
    insertLogStmt.run(
      tataTertibAudio.id,
      2,
      'Tata Tertib Pengunjung & Fasilitas',
      'Keamanan & Ketertiban',
      'manual',
      `${todayStr} 09:15:30`,
      45,
      'success',
      'Siaran manual oleh petugas'
    )
  }
}
