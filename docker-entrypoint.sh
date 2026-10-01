#!/bin/sh
set -e

# Pastikan direktori data dan audio selalu tersedia
mkdir -p /app/data /app/public/audio

# Jika direktori public/audio kosong (misalnya volume host baru),
# salin audio bawaan dari /app/defaults/audio
if [ -d "/app/defaults/audio" ] && [ -z "$(ls -A /app/public/audio 2>/dev/null)" ]; then
  echo ">>> Menginisialisasi berkas audio bawaan ke /app/public/audio..."
  cp -r /app/defaults/audio/* /app/public/audio/ 2>/dev/null || true
fi

# Jalankan perintah utama kontainer (node .output/server/index.mjs)
exec "$@"
