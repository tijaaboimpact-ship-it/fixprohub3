import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Terminal, Trash2 } from 'lucide-react'

// Only a real startup message — real entries come from PhoneMockup via the 'device-log' CustomEvent
const buildTime = new Date().toLocaleTimeString('en-US', { hour12: false })
const initialLogs = [
  { time: buildTime, level: 'info', message: '[SYS] FixPro Hub v3.0 initialized — awaiting device...' },
]

export default function LogConsole() {
  const [logs, setLogs] = useState(initialLogs)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleLog = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { level, message } = customEvent.detail;
      const time = new Date().toLocaleTimeString('en-US', { hour12: false });
      setLogs(prev => [...prev, { time, level, message }]);
    };
    window.addEventListener('device-log', handleLog);
    return () => window.removeEventListener('device-log', handleLog);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs])

  const clearLogs = () => setLogs([{ time: new Date().toLocaleTimeString('en-US', { hour12: false }), level: 'info', message: '[SYS] Console cleared' }])

  const levelClass = (level: string) => {
    switch (level) {
      case 'success': return 'log-success'
      case 'error': return 'log-error'
      case 'warning': return 'log-warning'
      case 'info': return 'log-info'
      default: return 'text-gray-400'
    }
  }

  return (
    <div className="glass-card p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-green-400" />
          <h3 className="text-sm font-semibold text-white">Log Console</h3>
        </div>
        <button
          onClick={clearLogs}
          className="p-1.5 rounded-lg hover:bg-dark-600 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5 text-gray-500 hover:text-gray-300" />
        </button>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 bg-dark-900/80 rounded-xl p-3 overflow-y-auto max-h-[280px] border border-dark-500/20"
      >
        {logs.map((log, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className="log-line flex gap-2"
          >
            <span className="text-gray-600 select-none">{log.time}</span>
            <span className={levelClass(log.level)}>{log.message}</span>
          </motion.div>
        ))}
        <div className="log-line text-green-400 animate-pulse mt-1">
          <span className="text-gray-600 select-none">{'>'}</span>
          <span className="ml-1">█</span>
        </div>
      </div>
    </div>
  )
}
