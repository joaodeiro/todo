'use client'
import { RevealProvider } from './reveal'
export default function DashboardLayout({ children }) {
  return <RevealProvider>{children}</RevealProvider>
}
