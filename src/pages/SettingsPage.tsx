import { motion } from 'framer-motion'
import { Settings, User, Key, Bell, Monitor, Palette, Shield, Database, Globe, HardDrive } from 'lucide-react'
import { useState } from 'react'

const settingsSections = [
  {
    title: 'General',
    icon: Settings,
    color: 'text-gray-400',
    items: [
      { label: 'Auto-detect devices on startup', type: 'toggle', enabled: true },
      { label: 'Show notifications', type: 'toggle', enabled: true },
      { label: 'Auto-update loaders', type: 'toggle', enabled: false },
      { label: 'Log level', type: 'select', value: 'Info' },
    ]
  },
  {
    title: 'USB Settings',
    icon: HardDrive,
    color: 'text-blue-400',
    items: [
      { label: 'COM port scan interval', type: 'select', value: '2 seconds' },
      { label: 'USB timeout', type: 'select', value: '30 seconds' },
      { label: 'Auto-reconnect', type: 'toggle', enabled: true },
    ]
  },
  {
    title: 'License',
    icon: Key,
    color: 'text-yellow-400',
    items: [
      { label: 'License Key', type: 'text', value: 'FXPR-XXXX-XXXX-XXXX' },
      { label: 'Status', type: 'badge', value: 'Active' },
      { label: 'Expires', type: 'text', value: '2025-12-31' },
    ]
  },
  {
    title: 'Appearance',
    icon: Palette,
    color: 'text-purple-400',
    items: [
      { label: 'Theme', type: 'select', value: 'Dark' },
      { label: 'Accent color', type: 'select', value: 'Red' },
      { label: 'Compact mode', type: 'toggle', enabled: false },
    ]
  },
]

export default function SettingsPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-4xl">
      <div className="glass-card p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center shadow-lg">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Settings</h2>
            <p className="text-xs text-gray-500">Configure FixPro Hub preferences</p>
          </div>
        </div>
      </div>

      {settingsSections.map((section, si) => (
        <motion.div key={section.title} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: si * 0.1 }} className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <section.icon className={`w-4 h-4 ${section.color}`} />
            {section.title}
          </h3>
          <div className="space-y-1">
            {section.items.map((item) => (
              <div key={item.label} className="flex items-center justify-between py-3 border-b border-dark-500/15 last:border-0">
                <span className="text-xs text-gray-400">{item.label}</span>
                {item.type === 'toggle' && (
                  <div className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${item.enabled ? 'bg-red-500/30' : 'bg-dark-600'}`}>
                    <div className={`w-4 h-4 rounded-full absolute top-0.5 transition-all ${item.enabled ? 'right-0.5 bg-red-500' : 'left-0.5 bg-gray-500'}`} />
                  </div>
                )}
                {item.type === 'select' && (
                  <select className="bg-dark-700 border border-dark-500/50 rounded-lg px-3 py-1.5 text-xs text-gray-300 focus:outline-none">
                    <option>{item.value}</option>
                  </select>
                )}
                {item.type === 'text' && (
                  <span className="text-xs font-mono text-gray-500">{item.value}</span>
                )}
                {item.type === 'badge' && (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-green-500/10 text-green-400 border border-green-500/20">{item.value}</span>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      ))}

      {/* About */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-white mb-2">About</h3>
        <div className="text-xs text-gray-500 space-y-1">
          <p>FixPro Hub Firmware Tool v3.0.0</p>
          <p>© 2024 FixPro Hub. All rights reserved.</p>
          <p className="text-gray-600">Build: 2024.12.15 | Engine: v2.4.1</p>
        </div>
      </div>
    </motion.div>
  )
}
