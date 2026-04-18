import { useState } from 'react'
import { motion } from 'framer-motion'
import { ShieldOff, Smartphone, Zap } from 'lucide-react'

export default function FRPPage() {
  const [vendor, setVendor] = useState('samsung')
  const [logs, setLogs] = useState<string[]>(['[FRP] Module Ready. Connect device in MTP or ADB mode.'])
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (window.electronAPI?.onFrpEvent) {
      window.electronAPI.onFrpEvent((payload: any) => {
        if (!payload) return
        if (payload.type === 'log' || payload.type === 'success' || payload.type === 'error') {
          setLogs(prev => [...prev, payload.data])
        }
        if (payload.type === 'done') {
          setIsProcessing(false)
        }
      })
    }
    return () => {
      if (window.electronAPI?.removeAllListeners) {
        window.electronAPI.removeAllListeners('frp-event')
      }
    }
  }, [])

  const vendors = ['Samsung', 'Xiaomi', 'Huawei', 'Motorola', 'Vivo', 'Oppo', 'Generic Android']

  const handleBypass = (mode: string) => {
    if (!window.electronAPI?.runFrp) {
      setLogs(p => [...p, '[ERROR] Desktop environment not detected.'])
      return
    }
    setIsProcessing(true)
    window.electronAPI.runFrp(vendor, mode)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="glass-card p-6 border-l-4 border-pink-500">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-pink-500/10 flex items-center justify-center">
            <ShieldOff className="w-6 h-6 text-pink-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">FRP Factory Reset Protection</h2>
            <p className="text-xs text-gray-400">Bypass Google Account locks over ADB/MTP/Test Mode</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 space-y-5">
           <div>
             <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Target Manufacturer</label>
             <select 
                value={vendor} 
                onChange={(e) => setVendor(e.target.value)}
                className="w-full bg-dark-900 border border-dark-500 rounded-xl px-4 py-3 text-white text-sm focus:border-pink-500 outline-none"
             >
               {vendors.map(v => (
                 <option key={v} value={v.toLowerCase()}>{v}</option>
               ))}
             </select>
           </div>
           
           <div className="space-y-3 pt-2 border-t border-white/5">
             <motion.button 
               whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
               onClick={() => handleBypass('adb')} disabled={isProcessing}
               className="btn-premium w-full py-4 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold shadow-lg"
             >
               {isProcessing ? 'Bypassing...' : 'Run FRP Bypass (ADB)'}
             </motion.button>

             <motion.button 
               whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
               onClick={() => handleBypass('test_mode')} disabled={isProcessing}
               className="btn-premium w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-bold opacity-80"
             >
               Run Samsung Test Mode (*#0*#)
             </motion.button>
           </div>
        </div>

        <div className="glass-card p-5 h-full min-h-[300px] flex flex-col font-mono text-xs">
          <h3 className="text-gray-500 mb-3 uppercase font-bold tracking-widest text-[10px] border-b border-white/5 pb-2">Diagnostic Output</h3>
          <div className="flex-1 overflow-auto space-y-1">
            {logs.map((L, i) => (
              <div key={i} className={L.includes('✓') ? 'text-green-400' : 'text-pink-400'}>{L}</div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
