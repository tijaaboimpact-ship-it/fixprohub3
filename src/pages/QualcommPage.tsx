import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Cpu, Zap, Trash2, FileText, HardDrive, Upload, Play, RefreshCcw, Info, ShieldCheck } from 'lucide-react'
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

export default function QualcommPage() {
  const [connected, setConnected] = useState(false)
  const [logs, setLogs] = useState<string[]>(['[SYS] Qualcomm EDL Module Ready', '[SYS] Waiting for device in 9008 mode...'])
  const [progress, setProgress] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedLoader, setSelectedLoader] = useState<string>('')
  const [selectedFirmwarePath, setSelectedFirmwarePath] = useState<string>('')
  const [selectedPartition, setSelectedPartition] = useState<string>('boot')

  const appendLogLine = (type: string, message: string) => {
    setLogs((prev) => [...prev, message])
    void emitLog(type as any, message)
  }

  useEffect(() => {
    if (window.electronAPI?.onQualcommEvent) {
      window.electronAPI.onQualcommEvent((payload: any) => {
        if (!payload) return
        switch (payload.type) {
          case 'info':
          case 'warning':
          case 'error':
          case 'success':
            appendLogLine(payload.type, payload.data)
            break
          case 'progress':
            setProgress(Number(payload.data) || 0)
            break
          case 'done':
            setIsProcessing(false)
            appendLogLine(payload.data === 0 ? 'success' : 'error', payload.data === 0 ? 'Operation Completed successfully ✓' : `Operation Failed (Code ${payload.data})`)
            break
          case 'detect':
             if (payload.found) {
                 appendLogLine('success', `Qualcomm Device Detected: ${payload.data}`)
                 setConnected(true)
             } else {
                 appendLogLine('warning', payload.data || 'No device detected')
                 setConnected(false)
             }
             setIsProcessing(false)
             break
        }
      })
    }

    return () => {
      if (window.electronAPI?.removeAllListeners) window.electronAPI.removeAllListeners('qualcomm-event')
    }
  }, [])

  const runDetect = () => {
    if (!window.electronAPI?.qualcommDetect) return
    setIsProcessing(true)
    setLogs(['[SYS] Scanning for Qualcomm QDLoader 9008...'])
    window.electronAPI.qualcommDetect()
  }

  const runReadInfo = () => {
    if (!window.electronAPI?.qualcommReadInfo) return
    setIsProcessing(true)
    setLogs(['[EDL] Reading Device Information...'])
    window.electronAPI.qualcommReadInfo(selectedLoader)
  }

  const runPrintGPT = () => {
    if (!window.electronAPI?.qualcommPrintGPT) return
    setIsProcessing(true)
    setLogs(['[EDL] Reading Partition Table (GPT)...'])
    window.electronAPI.qualcommPrintGPT(selectedLoader)
  }

  const runFlash = () => {
    if (!window.electronAPI?.qualcommFlash) return
    if (!selectedFirmwarePath) {
      appendLogLine('error', 'No firmware file selected.')
      return
    }
    setIsProcessing(true)
    setProgress(0)
    setLogs([`[FLASH] Writing ${selectedFirmwarePath.split('\\').pop()} to ${selectedPartition}...`]);
    window.electronAPI.qualcommFlash(selectedPartition, selectedFirmwarePath, selectedLoader)
  }

  const runReset = () => {
    if (!window.electronAPI?.qualcommReset) return
    setIsProcessing(true)
    setLogs(['[EDL] Sending Reset command...'])
    window.electronAPI.qualcommReset('reset', selectedLoader)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Cpu className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Qualcomm EDL Tool</h2>
              <p className="text-xs text-gray-500">Firehose + Sahara Protocol (QDLoader 9008)</p>
            </div>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${connected ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-dark-700 border-dark-500/30 text-gray-400'}`}>
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
            <span className="text-xs font-medium">{connected ? 'Connected — EDL' : 'No Device'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-400" /> Firehose Loader
            </h3>
            <div className="space-y-3">
              <label className="flex items-center justify-center w-full h-12 border-2 border-dashed border-dark-500/50 rounded-xl hover:border-blue-500/50 transition-colors cursor-pointer bg-dark-700/50 group relative overflow-hidden">
                <input 
                  type="file" 
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                  accept=".mbn,.bin,.elf" 
                  onChange={(e: any) => setSelectedLoader(e.target.files?.[0]?.path || '')} 
                />
                <span className="text-xs text-gray-400 font-medium group-hover:text-blue-400 text-center truncate w-full px-2">
                  {selectedLoader ? selectedLoader.split('\\').pop() : 'Select Custom Loader (Optional)'}
                </span>
              </label>
              <p className="text-[10px] text-gray-500">Auto-detect will attempt to find a compatible loader if left empty.</p>
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-blue-400" /> Flash Operations
            </h3>
            <div className="space-y-3">
               <select value={selectedPartition} onChange={e => setSelectedPartition(e.target.value)} className="w-full bg-dark-700 border border-dark-500/50 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-blue-500/40">
                  <option value="boot">boot</option>
                  <option value="recovery">recovery</option>
                  <option value="system">system</option>
                  <option value="vendor">vendor</option>
                  <option value="userdata">userdata</option>
                  <option value="persist">persist</option>
               </select>

               <label className="flex items-center justify-center w-full h-12 border-2 border-dashed border-dark-500/50 rounded-xl hover:border-blue-500/50 transition-colors cursor-pointer bg-dark-700/50 group relative overflow-hidden">
                 <input 
                   type="file" 
                   className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                   accept=".img,.bin,.xml" 
                   onChange={(e: any) => setSelectedFirmwarePath(e.target.files?.[0]?.path || '')} 
                 />
                 <span className="text-xs text-gray-400 font-medium group-hover:text-blue-400 text-center truncate w-full px-2">
                   {selectedFirmwarePath ? selectedFirmwarePath.split('\\').pop() : 'Select Image File'}
                 </span>
               </label>
            </div>
          </div>

          <div className="glass-card p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Play className="w-4 h-4 text-green-400" /> Main Actions
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={runDetect} disabled={isProcessing}
                className="w-full py-2.5 rounded-xl bg-dark-700 border border-dark-500/50 text-white text-xs font-semibold hover:border-blue-500/30 transition-all flex items-center justify-center gap-2">
                <RefreshCcw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} /> Scan
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={runReadInfo} disabled={!connected || isProcessing}
                className="w-full py-2.5 rounded-xl bg-dark-700 border border-dark-500/50 text-white text-xs font-semibold hover:border-blue-500/30 transition-all flex items-center justify-center gap-2">
                <Info className="w-3.5 h-3.5" /> Info
              </motion.button>
            </div>
            
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={runPrintGPT} disabled={!connected || isProcessing}
              className="w-full py-2.5 rounded-xl bg-dark-700 border border-dark-500/50 text-white text-xs font-semibold hover:border-blue-500/30 transition-all flex items-center justify-center gap-2">
              <FileText className="w-3.5 h-3.5" /> Read Partition Table
            </motion.button>

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={runFlash} disabled={!connected || isProcessing}
              className="btn-premium w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2">
              <Zap className="w-3.5 h-3.5" /> Flash Selected
            </motion.button>

            <div className="pt-2 border-t border-dark-500/20">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={runReset} disabled={!connected || isProcessing}
                className="w-full py-2.5 rounded-xl bg-dark-700/50 border border-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/5 transition-all flex items-center justify-center gap-2">
                <RefreshCcw className="w-3.5 h-3.5" /> Reset / Reboot
              </motion.button>
            </div>
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
                <motion.div animate={{ width: `${progress}%` }} className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full" />
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
                <span className="text-xs text-gray-500 ml-2 font-mono">qualcomm_edl.log</span>
              </div>
              <button onClick={() => setLogs([])} className="p-1.5 rounded-lg hover:bg-dark-600"><Trash2 className="w-3.5 h-3.5 text-gray-500" /></button>
            </div>
            <div className="flex-1 bg-dark-900/80 rounded-xl p-4 overflow-y-auto border border-dark-500/20 font-mono text-xs space-y-0.5">
              {logs.map((log, i) => (
                <div key={i} className={`${log.includes('✓') || log.includes('OK') || log.includes('success') ? 'text-green-400' : log.toLowerCase().includes('error') ? 'text-red-400' : 'text-blue-400'}`}>{log}</div>
              ))}
              <div className="text-blue-400 animate-pulse">{'> '}█</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
