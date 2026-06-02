import './globals.css'
export const metadata = { title: 'ToDo App', description: 'Seu sistema de vida' }
export default function RootLayout({ children }) {
  return (<html lang="pt-BR"><body>{children}</body></html>)
}
