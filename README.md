# AEROVOX — Sistem Siaran Audio Otomatis Bandara & Publik

Aplikasi otomasi siaran audio dan pengumuman publik dinamis berbasis **Nuxt 4**, **Vue 3**, dan **SQLite (`better-sqlite3`)**.

---

## 🚀 Panduan Deploy Menggunakan Docker Compose

Deploy aplikasi ini sangat mudah dan sudah dilengkapi dengan konfigurasi multi-stage build, healthcheck otomatis, serta persistensi data (database & berkas audio).

### 1. Prasyarat
- Docker Engine (v20.10 ke atas)
- Docker Compose (v2.0 ke atas)

### 2. Konfigurasi Lingkungan (Opsional)
Salin berkas `.env.example` menjadi `.env` jika ingin mengubah konfigurasi port atau pengaturan lainnya:
```bash
cp .env.example .env
```
Default port adalah `3000`. Jika ingin menjalankan di port lain (misal port 8080), ubah nilai `PORT=8080` di berkas `.env`.

### 3. Build & Jalankan Kontainer
Jalankan perintah berikut di direktori proyek:
```bash
docker compose up -d --build
```
> **Catatan:** Flag `-d` menjalankan kontainer di latar belakang (*detached mode*), dan `--build` memastikan image dibangun dengan pembaruan kode terbaru.

Aplikasi akan aktif dan dapat diakses di:
👉 **`http://localhost:3000`** (atau port yang Anda atur).

---

## 📂 Persistensi Data & Berkas Audio

Docker Compose telah mengonfigurasi 2 volume bind-mount agar data Anda tetap aman saat kontainer diperbarui atau di-restart:

| Path Host | Path Kontainer | Keterangan |
| :--- | :--- | :--- |
| `./data` | `/app/data` | Menyimpan database SQLite (`broadcast.db`), riwayat log pemutaran, jadwal siaran, dan pengaturan. |
| `./public/audio` | `/app/public/audio` | Menyimpan berkas audio pengumuman (MP3/WAV/OGG), baik audio bawaan maupun audio yang diunggah pengguna. |

> 💡 **Fitur Inisialisasi Otomatis:**
> Jika Anda menjalankan aplikasi pada server baru dengan folder `./public/audio` kosong, kontainer secara otomatis menyalin berkas audio bawaan dari image cadangan agar aplikasi langsung siap pakai.

---

## 🛠️ Perintah Berguna Docker Compose

- **Melihat status kontainer & healthcheck:**
  ```bash
  docker compose ps
  ```

- **Melihat log aplikasi secara langsung (live logs):**
  ```bash
  docker compose logs -f
  ```

- **Menghentikan aplikasi:**
  ```bash
  docker compose down
  ```

- **Merestart aplikasi:**
  ```bash
  docker compose restart
  ```

- **Memperbarui aplikasi setelah `git pull`:**
  ```bash
  git pull
  docker compose up -d --build
  ```

---

## 💻 Menjalankan Secara Lokal (Tanpa Docker)

Pastikan telah menginstal **Node.js v20+** atau **v22+**:

```bash
# 1. Pasang dependensi
npm install

# 2. Jalankan server pengembangan
npm run dev

# 3. Akses di browser
# http://localhost:3000
```

Untuk build produksi secara manual:
```bash
npm run build
node .output/server/index.mjs
```
