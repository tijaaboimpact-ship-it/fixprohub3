import { useState } from 'react'
import { motion } from 'framer-motion'
import { CircuitBoard, Usb, Play, Trash2, FileText, HardDrive, Upload, Shield } from 'lucide-react'

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

export default function MediaTekPage() {
  const [connected, setConnected] = useState(false)
  const [logs, setLogs] = useState<string[]>(['[SYS] MediaTek BROM Module Ready', '[SYS] Waiting for device in BROM mode...'])
  const [progress, setProgress] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedDA, setSelectedDA] = useState('MTK_AllInOne_DA.bin')
  const [selectedFirmwarePath, setSelectedFirmwarePath] = useState<string>('')
  const [selectedScatterPath, setSelectedScatterPath] = useState<string>('')
  const [selectedPartition, setSelectedPartition] = useState<string>('boot')

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
    if (window.electronAPI?.mtkCheck) {
      window.electronAPI.mtkCheck()
    }
    
    if (window.electronAPI?.onMtkEvent) {
      window.electronAPI.onMtkEvent((payload: any) => {
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
                 appendLogLine(`SUCCESS|MediaTek Device Detected: ${payload.data}`)
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
      if (window.electronAPI?.removeAllListeners) window.electronAPI.removeAllListeners('mtk-event')
    }
  }, [])

  const runMtkDetect = () => {
    if (!window.electronAPI?.mtkDetect) return
    setIsProcessing(true)
    setLogs(['[SYS] Scanning for MediaTek BROM devices...'])
    window.electronAPI.mtkDetect()
  }

  const runMtkFlash = () => {
    if (!window.electronAPI?.mtkFlash) return
    if (!selectedFirmwarePath) {
      appendLogLine('ERROR|No firmware selected for flashing.')
      return
    }
    setIsProcessing(true)
    setProgress(0)
    setLogs(['[FLASH] Connecting to BROM and analyzing scatter...'])
    window.electronAPI.mtkFlash(selectedPartition, selectedFirmwarePath, selectedDA, selectedScatterPath)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <CircuitBoard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">MediaTek BROM Tool</h2>
              <p className="text-xs text-gray-500">Boot ROM + Download Agent Protocol</p>
            </div>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${connected ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-dark-700 border-dark-500/30 text-gray-400'}`}>
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
            <span className="text-xs font-medium">{connected ? 'Connected — BROM' : 'No Device'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-400" /> Download Agent
            </h3>
            <select value={selectedDA} onChange={e => setSelectedDA(e.target.value)} className="w-full bg-dark-700 border border-dark-500/50 rounded-xl px-3 py-2.5 text-xs text-gray-300 focus:outline-none focus:border-orange-500/40">
              <option>MTK_AllInOne_DA.bin</option>
              <option>MTK_DA_MT6769.bin</option>
              <option>MTK_DA_MT6785.bin</option>
              <option>MTK_DA_MT6833.bin</option>
              <option>MTK_DA_MT6853.bin</option>
            </select>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Upload className="w-4 h-4 text-orange-400" /> Scatter / Preloader
            </h3>
            <label className="flex flex-col items-center justify-center w-full min-h-[5rem] border-2 border-dashed border-dark-500/40 rounded-xl hover:border-orange-500/50 transition-colors cursor-pointer bg-dark-700/50 group relative overflow-hidden p-3">
               <input 
                 type="file" 
                 className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                 accept=".txt,.bin" 
                 onChange={(e: any) => setSelectedScatterPath(e.target.files?.[0]?.path || '')} 
               />
               <Upload className="w-6 h-6 text-gray-600 mb-1 group-hover:text-orange-400 transition-colors" />
               <span className="text-[11px] text-gray-400 font-medium group-hover:text-orange-400 text-center truncate w-full" title={selectedScatterPath}>
                 {selectedScatterPath ? selectedScatterPath.split('\\').pop()?.split('/').pop() : 'Select Scatter / Preloader (Optional)'}
               </span>
            </label>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-orange-400" /> Firmware Array
            </h3>
            <div className="space-y-3">
               <select value={selectedPartition} onChange={e => setSelectedPartition(e.target.value)} className="w-full bg-dark-700 border border-dark-500/50 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-orange-500/40">
                  <option value="boot">boot</option>
                  <option value="recovery">recovery</option>
                  <option value="system">system</option>
                  <option value="vendor">vendor</option>
                  <option value="userdata">userdata</option>
                  <option value="preloader">preloader</option>
                  <option value="lk">lk</option>
               </select>

               <label className="flex items-center justify-center w-full h-12 border-2 border-dashed border-dark-500/50 rounded-xl hover:border-orange-500/50 transition-colors cursor-pointer bg-dark-700/50 group relative overflow-hidden">
                 <input 
                   type="file" 
                   className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                   accept=".img,.bin" 
                   onChange={(e: any) => setSelectedFirmwarePath(e.target.files?.[0]?.path || '')} 
                 />
                 <span className="text-xs text-gray-400 font-medium group-hover:text-orange-400 text-center truncate w-full px-2" title={selectedFirmwarePath}>
                   {selectedFirmwarePath ? selectedFirmwarePath.split('\\').pop()?.split('/').pop() : 'Select .img / .bin'}
                 </span>
               </label>
            </div>
          </div>

          <div className="glass-card p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Play className="w-4 h-4 text-green-400" /> Actions
            </h3>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={runMtkDetect} disabled={isProcessing}
              className="btn-premium w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-semibold shadow-lg shadow-orange-500/20 disabled:opacity-50">
              Connect BROM / Handshake
            </motion.button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={runMtkFlash} disabled={!connected || isProcessing}
              className="btn-premium w-full py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-semibold shadow-lg shadow-red-500/20 disabled:opacity-50">
              Flash Partition
            </motion.button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={!connected || isProcessing}
              className="btn-premium w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold shadow-lg shadow-purple-500/20 disabled:opacity-50">
              Format + Download
            </motion.button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={!connected || isProcessing}
              className="btn-premium w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 disabled:opacity-50">
              Read Back
            </motion.button>
          </div>
        </div>

        {/* Log */}
        <div className="lg:col-span-2 space-y-4">
          {progress > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">Flash Progress</span>
                <span className="text-xs font-bold text-white">{progress}%</span>
              </div>
              <div className="w-full h-3 bg-dark-700 rounded-full overflow-hidden">
                <motion.div animate={{ width: `${progress}%` }} className="h-full bg-gradient-to-r from-orange-500 to-green-500 rounded-full" />
              </div>
            </motion.div>
          )}

          <div className="glass-card p-5 h-[500px] flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <span className="text-xs text-gray-500 ml-2 font-mono">mtk_brom.log</span>
              </div>
              <button onClick={() => setLogs([])} className="p-1.5 rounded-lg hover:bg-dark-600"><Trash2 className="w-3.5 h-3.5 text-gray-500" /></button>
            </div>
            <div className="flex-1 bg-dark-900/80 rounded-xl p-4 overflow-y-auto border border-dark-500/20 font-mono text-xs space-y-0.5">
              {logs.map((log, i) => (
                <div key={i} className={`${log.includes('✓') || log.includes('OK') ? 'text-green-400' : log.includes('Error') ? 'text-red-400' : 'text-orange-400'}`}>{log}</div>
              ))}
              <div className="text-orange-400 animate-pulse">{'> '}█</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
