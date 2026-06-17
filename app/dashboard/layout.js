'use client'
import { RevealProvider } from './reveal'
import { Sidebar, TopBar, BottomNav } from './rail'

export default function DashboardLayout({ children }) {
  return (
    <RevealProvider>
      <div className="shell">
        <Sidebar />
        <div className="shell-main">
          <TopBar />
          <div className="shell-content">{children}</div>
        </div>
        <BottomNav />
      </div>
    </RevealProvider>
  )
}
