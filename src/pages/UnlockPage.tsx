import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Unlock, ShieldOff, Key, Play } from 'lucide-react'

export default function UnlockPage() {
  const [selectedMethod, setSelectedMethod] = useState<string>('bootloader')
  const [isProcessing, setIsProcessing] = useState(false)
  const [logs, setLogs] = useState<string[]>(['[NIX] Unlock framework initialized...', '[NIX] Waiting for target device...'])

  useEffect(() => {
    if (window.electronAPI?.onUnlockEvent) {
      window.electronAPI.onUnlockEvent((payload: any) => {
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
        window.electronAPI.removeAllListeners('unlock-event')
      }
    }
  }, [])

  const methods = [
    { id: 'bootloader', name: 'Bootloader Unlock', icon: Unlock, desc: 'Unlocks bootloader via fastboot/OEM methods' },
    { id: 'network', name: 'Network/SIM Unlock', icon: Key, desc: 'Direct SIM unlock for supported modems' },
    { id: 'mdm', name: 'MDM Bypass', icon: ShieldOff, desc: 'Bypass Mobile Device Management locks' }
  ]

  const handleUnlock = () => {
    if (!window.electronAPI?.runUnlock) {
      setLogs(p => [...p, '[ERROR] Desktop environment not detected.'])
      return
    }
    setIsProcessing(true)
    window.electronAPI.runUnlock(selectedMethod)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="glass-card p-6 border-l-4 border-green-500">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
            <Unlock className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Universal Unlocker</h2>
            <p className="text-xs text-gray-400">Advanced bootloader and carrier network unlocking</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {methods.map(m => {
            const Icon = m.icon
            return (
              <motion.button 
                key={m.id} 
                onClick={() => setSelectedMethod(m.id)}
                whileHover={{ scale: 1.01 }}
                className={`w-full glass-card-hover p-4 text-left border ${selectedMethod === m.id ? 'border-green-500 bg-green-500/10' : 'border-dark-500/20 bg-dark-700/30'}`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${selectedMethod === m.id ? 'text-green-400' : 'text-gray-500'}`} />
                  <div>
                    <h3 className={`text-sm font-bold ${selectedMethod === m.id ? 'text-white' : 'text-gray-400'}`}>{m.name}</h3>
                    <p className="text-[10px] text-gray-500">{m.desc}</p>
                  </div>
                </div>
              </motion.button>
            )
          })}
          
          <motion.button 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }}
            onClick={handleUnlock}
            disabled={isProcessing}
            className="btn-premium w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-500 text-white font-bold tracking-wider shadow-lg flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />
            {isProcessing ? 'Processing Exploit...' : 'EXECUTE UNLOCK'}
          </motion.button>
        </div>

        <div className="glass-card p-5 h-full min-h-[300px] flex flex-col font-mono text-xs">
          <h3 className="text-gray-500 mb-3 uppercase font-bold tracking-widest text-[10px] border-b border-white/5 pb-2">Terminal Output</h3>
          <div className="flex-1 overflow-auto space-y-1">
            {logs.map((L, i) => (
              <div key={i} className={L.includes('success') ? 'text-green-400' : 'text-cyan-400'}>{L}</div>
            ))}
            <div className="text-cyan-400 animate-pulse">_</div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
