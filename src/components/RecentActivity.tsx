import { motion } from 'framer-motion'
import { CheckCircle, XCircle, AlertTriangle, Download, Clock } from 'lucide-react'

const activities = [
  { id: 1, type: 'success', message: 'Flash completed for Samsung A54', time: '2 min ago', icon: CheckCircle, color: 'text-green-400' },
  { id: 2, type: 'success', message: 'FRP removed - Tecno Spark 10', time: '8 min ago', icon: CheckCircle, color: 'text-green-400' },
  { id: 3, type: 'error', message: 'Flash failed - Xiaomi Redmi Note 12', time: '15 min ago', icon: XCircle, color: 'text-red-400' },
  { id: 4, type: 'warning', message: 'Loader mismatch detected', time: '22 min ago', icon: AlertTriangle, color: 'text-orange-400' },
  { id: 5, type: 'info', message: 'Firmware v14.0.1 downloaded', time: '35 min ago', icon: Download, color: 'text-blue-400' },
  { id: 6, type: 'success', message: 'Bootloader unlocked - OnePlus 9', time: '1 hr ago', icon: CheckCircle, color: 'text-green-400' },
  { id: 7, type: 'success', message: 'IMEI repaired - Infinix Hot 30', time: '1.5 hr ago', icon: CheckCircle, color: 'text-green-400' },
]

export default function RecentActivity() {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
        </div>
        <span className="text-[10px] text-gray-500 bg-dark-700 px-2 py-1 rounded-md">{activities.length} events</span>
      </div>
      <div className="space-y-1 max-h-[280px] overflow-y-auto pr-1">
        {activities.map((act, i) => (
          <motion.div
            key={act.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-dark-700/50 transition-colors group cursor-pointer"
          >
            <act.icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${act.color}`} />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-300 group-hover:text-white transition-colors truncate">{act.message}</p>
              <p className="text-[10px] text-gray-600 mt-0.5">{act.time}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
