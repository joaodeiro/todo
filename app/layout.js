import './globals.css'
export const metadata = {
  title: 'ZenFlow',
  description: 'O sistema calmo pra subir no seu ritmo.',
  applicationName: 'ZenFlow',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'ZenFlow', statusBarStyle: 'default' },
  formatDetection: { telephone: false },
}
export const viewport = {
  themeColor: '#F4EEE3',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}
export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
