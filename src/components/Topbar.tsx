import { Search, Bell, Usb, Wifi, WifiOff, LogOut, UserCircle } from 'lucide-react'
import { useState } from 'react'
import type { PageId } from '../App'

const pageNames: Record<PageId, string> = {
  dashboard: 'Dashboard',
  qualcomm: 'Qualcomm EDL',
  mediatek: 'MediaTek BROM',
  samsung: 'Samsung Odin',
  flash: 'Flash Tool',
  unlock: 'Bootloader Unlock',
  frp: 'FRP Reset',
  loaders: 'Loader Manager',
  ai: 'AI Assistant',
  license: 'License & HWID',
  settings: 'Settings',
  admin: 'Admin Panel',
}

interface TopbarProps {
  activePage: PageId
  onToggleSidebar: () => void
  user: { name: string; email: string; role: string } | null
  onLogout: () => void
}

export default function Topbar({ activePage, user, onLogout }: TopbarProps) {
  const [usbConnected] = useState(true)
  const [showUserMenu, setShowUserMenu] = useState(false)

  return (
    <header className="h-16 bg-dark-800/80 backdrop-blur-xl border-b border-dark-500/30 flex items-center justify-between px-6 z-10 relative">
      {/* Page title */}
      <div>
        <h2 className="text-lg font-semibold text-white">{pageNames[activePage]}</h2>
        <p className="text-xs text-gray-500">Professional Firmware Servicing Platform</p>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search devices..."
            className="w-64 h-9 pl-10 pr-4 rounded-xl bg-dark-700 border border-dark-500/50 text-sm text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-red-500/40 focus:ring-1 focus:ring-red-500/20 transition-all"
          />
        </div>

        {/* USB status */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${usbConnected ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
          <Usb className={`w-3.5 h-3.5 ${usbConnected ? 'text-green-400' : 'text-red-400'}`} />
          <span className={`text-xs font-medium ${usbConnected ? 'text-green-400' : 'text-red-400'}`}>
            {usbConnected ? 'USB' : 'No USB'}
          </span>
        </div>

        {/* WiFi */}
        <button className="w-9 h-9 rounded-xl bg-dark-700 border border-dark-500/40 flex items-center justify-center hover:bg-dark-600 transition-colors">
          {usbConnected ? <Wifi className="w-4 h-4 text-green-400" /> : <WifiOff className="w-4 h-4 text-gray-500" />}
        </button>

        {/* Notifications */}
        <button className="w-9 h-9 rounded-xl bg-dark-700 border border-dark-500/40 flex items-center justify-center hover:bg-dark-600 transition-colors relative">
          <Bell className="w-4 h-4 text-gray-400" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
        </button>

        {/* User Menu */}
        <div className="relative">
          <button
            id="user-menu-trigger"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-dark-700 border border-dark-500/40 hover:bg-dark-600 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <UserCircle className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <p className="text-xs font-medium text-gray-300 max-w-[80px] truncate">{user?.name || 'User'}</p>
              <p className="text-[10px] text-gray-500 capitalize">{user?.role || 'member'}</p>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-dark-800 border border-dark-500/50 rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="p-3 border-b border-dark-600">
                <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 bg-red-500/10 text-red-400 text-[10px] font-bold uppercase rounded tracking-wider">
                  {user?.role}
                </span>
              </div>
              <button
                id="logout-btn"
                onClick={() => { setShowUserMenu(false); onLogout(); }}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Click-outside overlay */}
      {showUserMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
      )}
    </header>
  )
}
