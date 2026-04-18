import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Upload, Check, AlertTriangle, Info } from 'lucide-react'

interface Firmware {
  device_name: string;
  firmware_version: string;
  android_version: string;
  download_link: string;
  file_size: string;
  region: string;
}

export default function FlashPage() {
  const [firmwareList, setFirmwareList] = useState<Firmware[]>([])
  const [selectedFirmware, setSelectedFirmware] = useState<number | null>(null)
  const [progress, setProgress] = useState(0)
  const [isFlashing, setIsFlashing] = useState(false)
  const [aiWarning, setAiWarning] = useState<string | null>(null)
  const [electronMissing, setElectronMissing] = useState(false)
  const [flashLog, setFlashLog] = useState<{ type: string; text: string }[]>([])

  useEffect(() => {
    fetch('http://localhost:5000/api/firmware')
      .then(res => res.json())
      .then(data => setFirmwareList(data))
      .catch(err => console.error("Failed fetching firmware:", err))
  }, [])

  const startFlash = async () => {
    if (selectedFirmware === null) return

    setAiWarning(null)
    const firmware = firmwareList[selectedFirmware]

    // Validate using backend AI before attempting real flash
    try {
      const response = await fetch('http://localhost:5000/api/ai/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceInfo: {
            device_name: firmware.device_name,
            current_android_version: firmware.android_version,
            current_firmware: firmware.firmware_version,
          },
          firmwareInfo: firmware
        })
      })
      const validation = await response.json()
      if (!validation.pass || validation.warnings.length > 0) {
        setAiWarning(validation.errors[0] || validation.warnings[0])
        if (!validation.pass) return
      }
    } catch (err) {
      console.warn('[FlashPage] AI Validation unavailable — proceeding without it', err)
    }

    // Check if running inside Electron desktop app
    if (!window.electronAPI) {
      setElectronMissing(true)
      return
    }

    setIsFlashing(true)
    setProgress(0)
    setFlashLog([])

    // Listen for real progress + log events streamed from main process
    window.electronAPI.onFlashEvent((payload) => {
      const { type, data } = payload

      if (type === 'log' || type === 'error') {
        setFlashLog(prev => [...prev, { type, text: String(data) }])
      }

      if (type === 'progress') {
        setProgress(Number(data))
      }

      if (type === 'done') {
        setFlashLog(prev => [...prev, { type: 'done', text: String(data) }])
        setProgress(100)
        setIsFlashing(false)
        window.electronAPI?.removeAllListeners('fastboot-log')
      }

      if (type === 'error') {
        setIsFlashing(false)
        window.electronAPI?.removeAllListeners('fastboot-log')
      }
    })

    // Dispatch the real fastboot flash IPC call
    // firmware.download_link would be the local path in a real scenario
    window.electronAPI.flashDevice('system', firmware.download_link || '', undefined)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="glass-card p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/20">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Universal Flash Tool (AI Powered)</h2>
            <p className="text-xs text-gray-500">Flash firmware to connected device directly from backend data</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Firmware selection */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Available Firmware (from Server)</h3>
          
          <div className="space-y-2">
            {firmwareList.length === 0 ? (
              <p className="text-xs text-center text-gray-500 py-4">Loading firmware...</p>
            ) : firmwareList.map((fw, i) => (
              <motion.button
                key={i}
                whileHover={{ x: 4 }}
                onClick={() => setSelectedFirmware(i)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${selectedFirmware === i ? 'bg-red-500/10 border-red-500/30' : 'bg-dark-700/30 border-dark-500/20 hover:border-dark-400/40'}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-300 truncate">{fw.device_name} - {fw.firmware_version}</p>
                    <div className="flex gap-3 mt-1">
                      <span className="text-[10px] text-gray-500">Region: {fw.region}</span>
                      <span className="text-[10px] text-gray-600">Size: {fw.file_size}</span>
                      <span className="text-[10px] text-gray-600">Android {fw.android_version}</span>
                    </div>
                  </div>
                  {selectedFirmware === i && <Check className="w-4 h-4 text-red-400" />}
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Flash controls */}
        <div className="space-y-4">

          {/* Electron-missing notice */}
          {electronMissing && (
            <AnimatePresence>
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                className="glass-card p-4 border border-blue-500/30 bg-blue-500/10">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-bold text-blue-400">Desktop App Required</h3>
                    <p className="text-xs text-blue-300/80 mt-1">
                      Real device flashing requires the FixPro Hub Desktop (Electron) client.
                      This browser build can list firmware but cannot execute fastboot commands directly.
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          )}

          {/* AI Warning */}
          {aiWarning && (
            <AnimatePresence>
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                className="glass-card p-4 border border-orange-500/30 bg-orange-500/10">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-orange-400">AI Warning</h3>
                    <p className="text-xs text-orange-300/80 mt-1">{aiWarning}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          )}

          {/* Real-time progress bar */}
          {progress > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5">
              <div className="flex justify-between mb-2">
                <span className="text-xs text-gray-400">Flashing via Fastboot...</span>
                <span className={`text-xs font-bold ${progress >= 100 ? 'text-green-400' : 'text-white'}`}>
                  {progress >= 100 ? 'Done ✓' : `${progress}%`}
                </span>
              </div>
              <div className="w-full h-3 bg-dark-700 rounded-full overflow-hidden">
                <motion.div animate={{ width: `${progress}%` }}
                  className="h-full bg-gradient-to-r from-red-500 to-green-500 rounded-full" />
              </div>
            </motion.div>
          )}

          {/* Real fastboot log output */}
          {flashLog.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="glass-card p-4 max-h-48 overflow-y-auto font-mono bg-dark-900/80 border border-dark-500/20 rounded-xl">
              {flashLog.map((entry, i) => (
                <div key={i} className={`text-[10px] leading-5 ${
                  entry.type === 'error' ? 'text-red-400' :
                  entry.type === 'done'  ? 'text-green-400' :
                  'text-gray-400'
                }`}>
                  {entry.text}
                </div>
              ))}
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={startFlash}
            disabled={selectedFirmware === null || isFlashing}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-bold shadow-lg shadow-red-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" />
            {isFlashing ? 'Flashing...' : 'Validate & Flash'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
