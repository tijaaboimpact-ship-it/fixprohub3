import { motion } from 'framer-motion'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string
  change: string
  trend: 'up' | 'down'
  icon: any
  color: 'red' | 'green' | 'blue' | 'orange' | 'purple' | 'cyan'
  subtitle: string
}

const colorMap = {
  red: {
    bg: 'from-red-500/20 to-red-600/5',
    icon: 'bg-red-500/20 text-red-400',
    glow: 'glow-red',
    border: 'border-red-500/10',
    bar: 'bg-red-500',
  },
  green: {
    bg: 'from-green-500/20 to-green-600/5',
    icon: 'bg-green-500/20 text-green-400',
    glow: 'glow-green',
    border: 'border-green-500/10',
    bar: 'bg-green-500',
  },
  blue: {
    bg: 'from-blue-500/20 to-blue-600/5',
    icon: 'bg-blue-500/20 text-blue-400',
    glow: 'glow-blue',
    border: 'border-blue-500/10',
    bar: 'bg-blue-500',
  },
  orange: {
    bg: 'from-orange-500/20 to-orange-600/5',
    icon: 'bg-orange-500/20 text-orange-400',
    glow: 'glow-orange',
    border: 'border-orange-500/10',
    bar: 'bg-orange-500',
  },
  purple: {
    bg: 'from-purple-500/20 to-purple-600/5',
    icon: 'bg-purple-500/20 text-purple-400',
    glow: 'glow-purple',
    border: 'border-purple-500/10',
    bar: 'bg-purple-500',
  },
  cyan: {
    bg: 'from-cyan-500/20 to-cyan-600/5',
    icon: 'bg-cyan-500/20 text-cyan-400',
    glow: 'glow-cyan',
    border: 'border-cyan-500/10',
    bar: 'bg-cyan-500',
  },
}

export default function StatsCard({ title, value, change, trend, icon: Icon, color, subtitle }: StatsCardProps) {
  const c = colorMap[color]
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.2 }}
      className={`glass-card p-5 ${c.glow} border ${c.border} relative overflow-hidden`}
    >
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${c.bg} opacity-50`} />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl ${c.icon} flex items-center justify-center`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className={`flex items-center gap-1 text-xs font-medium ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
            {trend === 'up' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {change}
          </div>
        </div>
        
        <h3 className="text-2xl font-bold text-white mb-0.5">{value}</h3>
        <p className="text-xs text-gray-400">{title}</p>
        <p className="text-[10px] text-gray-600 mt-1">{subtitle}</p>

        {/* Mini bar decoration */}
        <div className="mt-3 flex gap-1">
          {[60, 40, 80, 55, 70, 90, 45, 65].map((h, i) => (
            <div key={i} className="flex-1">
              <div className={`${c.bar} rounded-full opacity-30`} style={{ height: `${h / 5}px` }} />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
