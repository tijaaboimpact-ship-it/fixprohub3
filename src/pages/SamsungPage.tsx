import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Smartphone, Play, Trash2, Upload, Download, ShieldOff, Info, RefreshCw } from 'lucide-react'

import { supabase } from '../supabaseClient'

// Helper to dispatch log events to LogConsole and persist to Supabase
async function emitLog(level: 'info' | 'success' | 'warning' | 'error', message: string, deviceId?: string | null) {
  window.dispatchEvent(new CustomEvent('device-log', { detail: { level, message } }))
  try {
    await supabase.from('device_logs').insert({ level, message, device_id: deviceId || null })
  } catch (err) {
    console.error('Supabase log error:', err)
  }
}

export default function SamsungPage() {
  const [connected, setConnected] = useState(false)
  const [logs, setLogs] = useState<string[]>(['[SYS] Samsung Odin Module Ready', '[SYS] Waiting for device in Download Mode...'])
  const [progress, setProgress] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  
  const [files, setFiles] = useState({
    bl: '',
    ap: '',
    cp: '',
    csc: ''
  })

  const mapLevel = (level: string): 'info' | 'success' | 'warning' | 'error' => {
    const l = level.trim().toUpperCase()
    if (l === 'SUCCESS') return 'success'
    if (l === 'ERROR') return 'error'
    if (l === 'WARNING' || l === 'WARN') return 'warning'
    return 'info'
  }

  const appendLogLine = (rawLine: string) => {
    const line = rawLine.trim()
    if (!line) return
    const pipeIdx = line.indexOf('|')
    let level = 'INFO'
    let message = line
    if (pipeIdx !== -1) {
      level = line.slice(0, pipeIdx)
      message = line.slice(pipeIdx + 1)
    }
    setLogs((prev) => [...prev, message])
    void emitLog(mapLevel(level), message)
  }

  useEffect(() => {
    if (window.electronAPI?.samsungCheck) {
      window.electronAPI.samsungCheck()
    }
    
    if (window.electronAPI?.onSamsungEvent) {
      window.electronAPI.onSamsungEvent((payload: any) => {
        if (!payload) return
        switch (payload.type) {
          case 'info':
          case 'warning':
          case 'error':
          case 'success':
            appendLogLine(`${payload.type.toUpperCase()}|${payload.data}`)
            break
          case 'progress':
            setProgress(Number(payload.data) || 0)
            break
          case 'done':
            setIsProcessing(false)
            appendLogLine(payload.data === 0 ? 'SUCCESS|Operation Completed successfully ✓' : `ERROR|Operation Failed (Code ${payload.data})`)
            break
          case 'detect':
             if (payload.found) {
                 appendLogLine(`SUCCESS|${payload.data}`)
                 setConnected(true)
             } else {
                 appendLogLine(`WARNING|${payload.data}`)
                 setConnected(false)
             }
             setIsProcessing(false)
             break
        }
      })
    }

    return () => {
      if (window.electronAPI?.removeAllListeners) window.electronAPI.removeAllListeners('samsung-event')
    }
  }, [])

  const runSamsungDetect = () => {
    if (!window.electronAPI?.samsungDetect) return
    setIsProcessing(true)
    setLogs(['[SYS] Scanning for Heimdall/Odin devices...'])
    window.electronAPI.samsungDetect()
  }

  const runSamsungFlash = () => {
    if (!window.electronAPI?.samsungFlash) return
    if (!files.ap && !files.bl && !files.cp && !files.csc) {
      appendLogLine('ERROR|No firmware files selected.')
      return
    }
    setIsProcessing(true)
    setProgress(0)
    setLogs(['[ODIN] Checking firmware files...', '[ODIN] Starting Odin flash...'])
    window.electronAPI.samsungFlash(files)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Samsung Odin Tool</h2>
              <p className="text-xs text-gray-500">Download Mode • BL/AP/CP/CSC Flash</p>
            </div>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${connected ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-dark-700 border-dark-500/30 text-gray-400'}`}>
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
            <span className="text-xs font-medium">{connected ? 'Connected — Odin' : 'No Device'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* File slots + controls */}
        <div className="lg:col-span-1 space-y-4">
          {/* Firmware file slots */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Firmware Files</h3>
            {(['bl', 'ap', 'cp', 'csc'] as const).map((slot) => {
              const currentPath = files[slot]
              return (
                <div key={slot} className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-bold text-cyan-400 w-8 uppercase">{slot}</span>
                  <label className="flex-1 border-2 border-dashed border-dark-500/30 rounded-lg p-2 text-center hover:border-cyan-500/30 transition-colors cursor-pointer bg-dark-700/50 relative overflow-hidden group">
                    <input 
                      type="file" 
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                      accept=".tar,.md5" 
                      onChange={(e: any) => setFiles(prev => ({ ...prev, [slot]: e.target.files?.[0]?.path || '' }))} 
                    />
                    <p className="text-[10px] text-gray-400 group-hover:text-cyan-400 transition-colors truncate w-full px-2">
                      {currentPath ? currentPath.split('\\').pop()?.split('/').pop() : `Drop ${slot.toUpperCase()} file or click`}
                    </p>
                  </label>
                </div>
              )
            })}
          </div>

          {/* Actions */}
          <div className="glass-card p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white mb-1">Actions</h3>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={runSamsungDetect} disabled={isProcessing}
              className="btn-premium w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 disabled:opacity-50">
              Connect Device in Download Mode
            </motion.button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={runSamsungFlash} disabled={!connected || isProcessing}
              className="btn-premium w-full py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-semibold shadow-lg shadow-red-500/20 disabled:opacity-50">
              Start Odin Flash
            </motion.button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={!connected || isProcessing}
              className="btn-premium w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold shadow-lg shadow-purple-500/20 disabled:opacity-50">
              Reset FRP
            </motion.button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={!connected || isProcessing}
              className="btn-premium w-full py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-semibold shadow-lg shadow-green-500/20 disabled:opacity-50">
              Factory Reset
            </motion.button>
          </div>

          {/* Options */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Options</h3>
            {['Auto Reboot', 'Re-Partition', 'F. Reset Time'].map(opt => (
              <label key={opt} className="flex items-center justify-between py-2 border-b border-dark-500/20 last:border-0 cursor-pointer">
                <span className="text-xs text-gray-400">{opt}</span>
                <div className="w-9 h-5 bg-dark-600 rounded-full relative">
                  <div className="w-4 h-4 bg-gray-500 rounded-full absolute top-0.5 left-0.5 transition-all" />
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Log */}
        <div className="lg:col-span-2 space-y-4">
          {progress > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">Odin Flash Progress</span>
                <span className={`text-xs font-bold ${progress >= 100 ? 'text-green-400' : 'text-white'}`}>{progress >= 100 ? 'PASS!' : `${progress}%`}</span>
              </div>
              <div className="w-full h-3 bg-dark-700 rounded-full overflow-hidden">
                <motion.div animate={{ width: `${Math.min(progress, 100)}%` }} className={`h-full rounded-full ${progress >= 100 ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-gradient-to-r from-cyan-500 to-blue-500'}`} />
              </div>
            </motion.div>
          )}

          <div className="glass-card p-5 h-[520px] flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500" /><div className="w-3 h-3 rounded-full bg-yellow-500" /><div className="w-3 h-3 rounded-full bg-green-500" /></div>
                <span className="text-xs text-gray-500 ml-2 font-mono">samsung_odin.log</span>
              </div>
              <button onClick={() => setLogs([])} className="p-1.5 rounded-lg hover:bg-dark-600"><Trash2 className="w-3.5 h-3.5 text-gray-500" /></button>
            </div>
            <div className="flex-1 bg-dark-900/80 rounded-xl p-4 overflow-y-auto border border-dark-500/20 font-mono text-xs space-y-0.5">
              {logs.map((log, i) => (
                <div key={i} className={`${log.includes('PASS') || log.includes('✓') ? 'text-green-400' : log.includes('FAIL') || log.includes('Error') ? 'text-red-400' : 'text-cyan-400'}`}>{log}</div>
              ))}
              <div className="text-cyan-400 animate-pulse">{'> '}█</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
