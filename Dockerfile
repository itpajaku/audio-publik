# ====================================================================
# Tahap 1: Builder - Build aplikasi Nuxt 4 & dependensi native
# ====================================================================
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Pasang kakas kompilasi C++ untuk modul native Node (better-sqlite3 / node-gyp)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Salin berkas manifes dependensi
COPY package.json package-lock.json ./

# Pasang dependensi secara bersih (termasuk devDependencies untuk nuxt build)
RUN npm ci

# Salin seluruh kode sumber proyek
COPY . .

# Build aplikasi Nuxt untuk produksi (.output/)
RUN npm run build


# ====================================================================
# Tahap 2: Runner - Kontainer produksi yang ringan & aman
# ====================================================================
FROM node:22-bookworm-slim AS runner

WORKDIR /app

# Pasang utilitas runtime:
# - curl (untuk healthcheck)
# - dumb-init (penanganan sinyal SIGTERM/SIGINT yang tepat untuk PID 1)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    dumb-init \
    && rm -rf /var/lib/apt/lists/*

# Variabel Lingkungan Produksi
ENV NODE_ENV=production
ENV NITRO_HOST=0.0.0.0
ENV HOST=0.0.0.0
ENV NITRO_PORT=3000
ENV PORT=3000

# Salin hasil build dari tahap builder
COPY --from=builder /app/.output /app/.output

# Salin cadangan berkas audio bawaan untuk inisialisasi volume baru
COPY --from=builder /app/public/audio /app/defaults/audio

# Salin skrip entrypoint & bersihkan format line ending Windows (CRLF -> LF)
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN sed -i 's/\r$//' /app/docker-entrypoint.sh && chmod +x /app/docker-entrypoint.sh

# Pastikan folder data dan public/audio tersedia
RUN mkdir -p /app/data /app/public/audio

# Port aplikasi
EXPOSE 3000

# Healthcheck untuk memastikan server web merespons dengan benar
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/api/ping || exit 1

ENTRYPOINT ["/usr/bin/dumb-init", "--", "/app/docker-entrypoint.sh"]
CMD ["node", ".output/server/index.mjs"]
