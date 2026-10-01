// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  app: {
    head: {
      title: 'AEROVOX — Sistem Siaran Audio Otomatis Bandara',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' },
        { name: 'description', content: 'Sistem Siaran Audio Otomatis dan Penjadwalan Dinamis Pengumuman Publik & Bandara' },
        { name: 'theme-color', content: '#090d16' }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap' }
      ],
      script: [
        {
          children: `(function(){try{var s=localStorage.getItem('aerovox_theme');var t=s||'dark';document.documentElement.setAttribute('data-theme',t);document.documentElement.classList.add(t);}catch(e){}})();`
        }
      ]
    }
  },

  css: ['~/assets/css/main.css']
})
