'use client'
import { RevealProvider } from './reveal'
import { Sidebar, TopBar } from './rail'
import { Toaster } from './toaster'

export default function DashboardLayout({ children }) {
  return (
    <RevealProvider>
      <div className="shell">
        <Sidebar />
        <div className="shell-main">
          <TopBar />
          <div className="shell-content">{children}</div>
        </div>
      </div>
      <Toaster />
    </RevealProvider>
  )
}
