'use client'
import { RevealProvider } from './reveal'
import { Rail } from './rail'

export default function DashboardLayout({ children }) {
  return (
    <RevealProvider>
      <div className="shell">
        <Rail />
        <div className="shell-main">{children}</div>
      </div>
    </RevealProvider>
  )
}
