export default function manifest() {
  return {
    name: 'ZenFlow',
    short_name: 'ZenFlow',
    description: 'O sistema calmo pra subir no seu ritmo.',
    lang: 'pt-BR',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F4EEE3',
    theme_color: '#F4EEE3',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
