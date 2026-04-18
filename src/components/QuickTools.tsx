import { motion } from 'framer-motion'
import { Zap, ShieldOff, Unlock, Fingerprint, HardDrive, RotateCcw } from 'lucide-react'
import type { PageId } from '../App'

interface QuickToolsProps {
  onNavigate: (page: PageId) => void
}

const tools = [
  { id: 'flash' as PageId, name: 'Flash Firmware', icon: Zap, color: 'from-red-500 to-orange-500', shadow: 'shadow-red-500/20', desc: 'Write firmware to device' },
  { id: 'frp' as PageId, name: 'FRP Reset', icon: ShieldOff, color: 'from-blue-500 to-cyan-500', shadow: 'shadow-blue-500/20', desc: 'Remove Google lock' },
  { id: 'unlock' as PageId, name: 'Bootloader', icon: Unlock, color: 'from-green-500 to-emerald-500', shadow: 'shadow-green-500/20', desc: 'Unlock bootloader' },
  { id: 'flash' as PageId, name: 'IMEI Repair', icon: Fingerprint, color: 'from-purple-500 to-pink-500', shadow: 'shadow-purple-500/20', desc: 'Restore IMEI number' },
  { id: 'loaders' as PageId, name: 'Partition', icon: HardDrive, color: 'from-orange-500 to-amber-500', shadow: 'shadow-orange-500/20', desc: 'Manage partitions' },
  { id: 'flash' as PageId, name: 'Factory Reset', icon: RotateCcw, color: 'from-cyan-500 to-teal-500', shadow: 'shadow-cyan-500/20', desc: 'Reset device to factory' },
]

export default function QuickTools({ onNavigate }: QuickToolsProps) {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-white">Quick Tools</h3>
          <p className="text-xs text-gray-500 mt-0.5">Common repair operations</p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {tools.map((tool, i) => (
          <motion.button
            key={tool.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.4 }}
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate(tool.id)}
            className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-dark-700/30 border border-dark-500/20 hover:border-dark-400/40 transition-all group"
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center shadow-lg ${tool.shadow} group-hover:scale-110 transition-transform`}>
              <tool.icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-center">
              <p className="text-xs font-medium text-gray-300 group-hover:text-white transition-colors">{tool.name}</p>
              <p className="text-[10px] text-gray-600 mt-0.5">{tool.desc}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
