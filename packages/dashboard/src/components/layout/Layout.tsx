import { Outlet } from 'react-router-dom'
import { TooltipProvider } from '@cloudflare/kumo'
import { Sidebar } from './Sidebar'

export function Layout() {
  return (
    <TooltipProvider>
      <div className="h-screen flex">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </TooltipProvider>
  )
}
