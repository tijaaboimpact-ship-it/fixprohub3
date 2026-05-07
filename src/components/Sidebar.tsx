import { motion } from 'framer-motion'
import {
  LayoutDashboard, Cpu, CircuitBoard, Smartphone,
  Zap, Unlock, ShieldOff, HardDrive, Settings,
  ChevronLeft, ChevronRight, Wrench, BrainCircuit, ShieldCheck, ClipboardList
} from 'lucide-react'
import type { PageId } from '../App'

interface SidebarProps {
  activePage: PageId
  onNavigate: (page: PageId) => void
  collapsed: boolean
  onToggle: () => void
  userRole?: string
}

import { ShieldAlert } from 'lucide-react'

const menuItems: { id: PageId; label: string; icon: any; color: string; adminOnly?: boolean }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-accent-red' },
  { id: 'requests', label: 'Repair Requests', icon: ClipboardList, color: 'text-cyan-400' },
  { id: 'qualcomm', label: 'Qualcomm', icon: Cpu, color: 'text-accent-blue' },
  { id: 'mediatek', label: 'MediaTek', icon: CircuitBoard, color: 'text-accent-orange' },
  { id: 'samsung', label: 'Samsung', icon: Smartphone, color: 'text-accent-cyan' },
  { id: 'flash', label: 'Flash Tool', icon: Zap, color: 'text-yellow-400' },
  { id: 'unlock', label: 'Unlock', icon: Unlock, color: 'text-accent-green' },
  { id: 'frp', label: 'FRP Reset', icon: ShieldOff, color: 'text-accent-pink' },
  { id: 'loaders', label: 'Loaders', icon: HardDrive, color: 'text-accent-purple' },
  { id: 'ai', label: 'AI Assistant', icon: BrainCircuit, color: 'text-purple-400' },
  { id: 'license', label: 'License & HWID', icon: ShieldAlert, color: 'text-blue-500' },
  { id: 'admin', label: 'Admin Panel', icon: ShieldCheck, color: 'text-emerald-400', adminOnly: true },
  { id: 'settings', label: 'Settings', icon: Settings, color: 'text-gray-400' },
]

export default function Sidebar({ activePage, onNavigate, collapsed, onToggle, userRole }: SidebarProps) {
  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="h-full bg-dark-800 border-r border-dark-500/30 flex flex-col relative z-20"
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-dark-500/30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/20">
            <Wrench className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="text-lg font-bold gradient-text">FixPro Hub</h1>
              <p className="text-[10px] text-gray-500 -mt-1">Firmware Tool v3.0</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {menuItems.filter(item => !item.adminOnly || userRole === 'admin').map((item) => {
          const isActive = activePage === item.id
          const Icon = item.icon
          return (
            <motion.button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.97 }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                ${isActive
                  ? 'sidebar-active bg-gradient-to-r from-red-500/10 to-transparent'
                  : 'hover:bg-dark-600/50'
                }`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${isActive ? item.color : 'text-gray-500 group-hover:text-gray-300'}`} />
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`text-sm font-medium truncate ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}
                >
                  {item.label}
                </motion.span>
              )}
              {isActive && !collapsed && (
                <motion.div
                  layoutId="activeIndicator"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-red-500"
                />
              )}
            </motion.button>
          )
        })}
      </nav>

      {/* Connection status */}
      <div className="p-4 border-t border-dark-500/30">
        {!collapsed && (
          <div className="glass-card p-3 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-gray-400">Device Connected</span>
            </div>
            <p className="text-[11px] text-gray-500 font-mono">COM3 • Qualcomm EDL</p>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-dark-600 border border-dark-400 flex items-center justify-center hover:bg-dark-500 transition-colors z-30"
      >
        {collapsed ? <ChevronRight className="w-3 h-3 text-gray-400" /> : <ChevronLeft className="w-3 h-3 text-gray-400" />}
      </button>
    </motion.aside>
  )
}
