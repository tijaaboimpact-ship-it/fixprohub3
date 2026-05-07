/// <reference types="w3c-web-usb" />
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Battery, Wifi, Signal, Usb, Smartphone, Loader2 } from 'lucide-react'
import { supabase } from '../supabaseClient'

// Declare the contextBridge API exposed by desktop/preload.js
let currentDeviceId: string | null = null;

// Helper to dispatch log events to LogConsole
async function emitLog(level: 'info' | 'success' | 'warning' | 'error', message: string) {
  // Dispatch to UI console
  window.dispatchEvent(new CustomEvent('device-log', { detail: { level, message } }))
  // Persist log to Supabase (non‑blocking)
  try {
    await supabase.from('device_logs').insert({
      level,
      message,
      device_id: currentDeviceId,
    })
  } catch (err) {
    console.error('Supabase log error:', err)
  }
}

interface DeviceDetails {
  serialNumber: string
  interfaces: number
  endpoints: number
  usbVersion: string
  deviceClass: number | string
}

export default function PhoneMockup() {
  const [device, setDevice] = useState<USBDevice | null>(null)
  const [details, setDetails] = useState<DeviceDetails | null>(null)
  const [actionRunning, setActionRunning] = useState<string | null>(null)

  // Extract deep info from a USBDevice
  const extractDetails = useCallback((dev: USBDevice): DeviceDetails => {
    let totalEndpoints = 0
    for (const cfg of dev.configurations) {
      for (const iface of cfg.interfaces) {
        for (const alt of iface.alternates) {
          totalEndpoints += alt.endpoints.length
        }
      }
    }
    return {
      serialNumber: dev.serialNumber || 'N/A',
      interfaces: dev.configurations.reduce((sum, c) => sum + c.interfaces.length, 0),
      endpoints: totalEndpoints,
      usbVersion: `${dev.usbVersionMajor}.${dev.usbVersionMinor}.${dev.usbVersionSubminor}`,
      deviceClass: dev.deviceClass || 'Vendor Spec',
    }
  }, [])

  // When a device is set, extract details and log
  const applyDevice = useCallback((dev: USBDevice | null) => {
    setDevice(dev)
    if (dev) {
      const d = extractDetails(dev)
      setDetails(d)
      currentDeviceId = d.serialNumber;

      emitLog('success', `[USB] Device connected: ${dev.manufacturerName || 'Generic'} ${dev.productName || 'Phone'}`)
      emitLog('info', `[USB] VID: 0x${dev.vendorId.toString(16).padStart(4, '0')} | PID: 0x${dev.productId.toString(16).padStart(4, '0')}`)
      emitLog('info', `[USB] Serial: ${d.serialNumber}`)
      emitLog('info', `[USB] USB ${d.usbVersion} • ${d.interfaces} interface(s) • ${d.endpoints} endpoint(s)`)
      emitLog('info', '[DEVICE] Reading device info...')
      emitLog('success', '[DEVICE] Device ready — awaiting command')
    } else {
      currentDeviceId = null;
      setDetails(null)
    }
  }, [extractDetails])

  useEffect(() => {
    if (!('usb' in navigator)) return

    // Check for already-granted devices
    navigator.usb.getDevices().then(devices => {
      if (devices.length > 0) {
        applyDevice(devices[0])
      }
    })

    const handleConnect = (event: USBConnectionEvent) => {
      applyDevice(event.device)
    }

    const handleDisconnect = (event: USBConnectionEvent) => {
      emitLog('warning', `[USB] Device disconnected: ${event.device.productName || 'Unknown'}`)
      emitLog('info', '[SYS] Awaiting new connection...')
      setDevice(null)
      setDetails(null)
    }

    navigator.usb.addEventListener('connect', handleConnect)
    navigator.usb.addEventListener('disconnect', handleDisconnect)

    return () => {
      navigator.usb.removeEventListener('connect', handleConnect)
      navigator.usb.removeEventListener('disconnect', handleDisconnect)
    }
  }, [applyDevice])

  const connectDevice = async () => {
    try {
      if ('usb' in navigator) {
        emitLog('info', '[USB] Scanning ports...')
        const usbDevice = await navigator.usb.requestDevice({ filters: [] })
        applyDevice(usbDevice)
      } else {
        emitLog('error', '[USB] WebUSB not supported in this browser')
        alert('WebUSB is not supported in your browser.')
      }
    } catch (error: any) {
      if (error?.name === 'NotFoundError') {
        emitLog('warning', '[USB] User cancelled device selection')
      } else {
        emitLog('error', `[USB] Connection failed: ${error?.message || error}`)
      }
      console.error('Connection failed:', error)
    }
  }

  // --- Action: Read device data ---
  const handleRead = async () => {
    if (!device) return
    setActionRunning('read')
    emitLog('info', '[READ] Opening device...')

    // If Electron is available, use the IPC bridge (more reliable, gets fastboot vars)
    if (window.electronAPI) {
      emitLog('info', '[READ] Electron detected — using fastboot getvar...')
      window.electronAPI.onReadResult((result) => {
        if (result.success && result.data) {
          emitLog('success', `[READ] Product   : ${result.data.product}`)
          emitLog('success', `[READ] Serial No : ${result.data.serialno}`)
          emitLog('success', `[READ] Android   : ${result.data.androidVer}`)
          emitLog('info',    `[READ] Secure    : ${result.data.secureboot}`)
          emitLog('info',    `[READ] Unlocked  : ${result.data.unlocked}`)
          emitLog('success', '[READ] Device read complete ✓')
        } else {
          emitLog('error', `[READ] Failed: ${result.error || 'unknown error'}`)
        }
        window.electronAPI?.removeAllListeners('read-result')
        setActionRunning(null)
      })
      window.electronAPI.readDevice(details?.serialNumber || 'COM3')
      return
    }

    // Fallback: WebUSB descriptor read (browser context)
    try {
      await device.open()
      emitLog('success', '[READ] Device opened via WebUSB')

      if (device.configuration === null && device.configurations.length > 0) {
        await device.selectConfiguration(device.configurations[0].configurationValue)
        emitLog('info', `[READ] Configuration ${device.configurations[0].configurationValue} selected`)
      }

      // Scan interfaces and endpoints, claim first one to attempt a read
      let claimedInterface: number | null = null
      let inEndpoint: number | null = null

      for (const cfg of device.configurations) {
        for (const iface of cfg.interfaces) {
          for (const alt of iface.alternates) {
            emitLog('info', `[READ] Interface ${iface.interfaceNumber}: class=0x${alt.interfaceClass.toString(16)}, sub=0x${alt.interfaceSubclass.toString(16)}, proto=0x${alt.interfaceProtocol.toString(16)}`)
            for (const ep of alt.endpoints) {
              emitLog('info', `[READ]   └─ EP${ep.endpointNumber} ${ep.direction} (${ep.type}), packetSize=${ep.packetSize}`)
              // Grab the first bulk-IN endpoint for data read
              if (ep.direction === 'in' && ep.type === 'bulk' && inEndpoint === null) {
                inEndpoint = ep.endpointNumber
                claimedInterface = iface.interfaceNumber
              }
            }
          }
        }
      }

      if (claimedInterface !== null) {
        // Claim the interface — THIS IS THE CRITICAL STEP that was missing before
        await device.claimInterface(claimedInterface)
        emitLog('info', `[READ] Interface ${claimedInterface} claimed`)

        if (inEndpoint !== null) {
          // Attempt to read up to 64 bytes from the bulk-IN endpoint
          try {
            const result = await device.transferIn(inEndpoint, 64)
            if (result.data && result.data.byteLength > 0) {
              const hex = Array.from(new Uint8Array(result.data.buffer))
                .map(b => b.toString(16).padStart(2, '0')).join(' ')
              emitLog('success', `[READ] Data (${result.data.byteLength}B): ${hex}`)
            } else {
              emitLog('info', '[READ] No data returned from device (device may not be in data-transfer mode)')
            }
          } catch (xferErr: any) {
            emitLog('warning', `[READ] transferIn: ${xferErr?.message} (device may require proprietary protocol)`)
          }
          await device.releaseInterface(claimedInterface)
        }
      } else {
        emitLog('warning', '[READ] No bulk-IN endpoint found — device may be in ADB/MTP mode')
      }

      emitLog('success', '[READ] Device info read complete ✓')
    } catch (err: any) {
      emitLog('error', `[READ] Failed: ${err?.message || err}`)
    } finally {
      try { await device.close() } catch { /* ignore */ }
      setActionRunning(null)
    }
  }

  // --- Action: Flash via Electron IPC ---
  const handleFlash = async () => {
    if (!device) return
    setActionRunning('flash')
    emitLog('warning', '[FLASH] ⚠ Flash operation initiated')
    emitLog('info', '[FLASH] Verifying device compatibility...')

    if (!window.electronAPI) {
      emitLog('error', '[FLASH] Electron API not available — run the app via the desktop client, not a plain browser.')
      emitLog('info', '[FLASH] Use the FixPro Hub Desktop (Electron) to execute real device operations.')
      setActionRunning(null)
      return
    }

    // Set up listener for flash event stream from main process
    window.electronAPI.onFlashEvent((payload) => {
      const { type, data } = payload
      if (type === 'log') {
        emitLog('info', String(data))
      } else if (type === 'progress') {
        emitLog('info', `[FLASH] Progress: ${data}%`)
      } else if (type === 'done') {
        emitLog('success', String(data))
        window.electronAPI?.removeAllListeners('fastboot-log')
        setActionRunning(null)
      } else if (type === 'error') {
        emitLog('error', String(data))
        window.electronAPI?.removeAllListeners('fastboot-log')
        setActionRunning(null)
      }
    })

    // Use 'system' partition as default; in a full implementation,
    // the selected loader from LoaderManager should be passed here.
    const vendorId = device.vendorId.toString(16).padStart(4, '0')
    emitLog('info', `[FLASH] VID 0x${vendorId} → dispatching to fastboot...`)
    window.electronAPI.flashDevice('system', '', undefined)
  }

  const getDeviceName = () => {
    if (!device) return 'Unknown Device'
    return `${device.manufacturerName || 'Generic'} ${device.productName || 'Phone'}`
  }

  return (
    <div className="glass-card p-6 min-h-[400px] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-white">Device Preview</h3>
          <p className="text-xs text-gray-500 mt-0.5">Live screen mirror</p>
        </div>
        {device ? (
          <span className="text-[10px] text-green-400 bg-green-500/10 px-2 py-1 rounded-md border border-green-500/20">Connected</span>
        ) : (
          <span className="text-[10px] text-orange-400 bg-orange-500/10 px-2 py-1 rounded-md border border-orange-500/20">Disconnected</span>
        )}
      </div>

      <div className="flex-1 flex items-center justify-center relative">
        <AnimatePresence mode="wait">
          {!device ? (
            <motion.div
              key="disconnected"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-dark-600 rounded-3xl w-full max-w-xs"
            >
              <div className="w-16 h-16 rounded-2xl bg-dark-700 flex items-center justify-center mb-6">
                <Usb className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-white font-semibold mb-2">No Device Detected</h4>
              <p className="text-xs text-gray-400 text-center mb-6">Connect your mobile phone via USB to stream the screen and read data.</p>
              <button 
                onClick={connectDevice}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold text-sm shadow-lg hover:scale-105 transition-transform"
              >
                Connect Device
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="connected"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="phone-frame w-48"
            >
              <div className="phone-screen relative overflow-hidden">
                {/* Notch */}
                <div className="phone-notch z-20" />

                {/* Status bar */}
                <div className="flex items-center justify-between px-4 py-1 -mt-1 relative z-10">
                  <span className="text-[9px] text-gray-400 font-mono">9:41</span>
                  <div className="flex items-center gap-1.5">
                    <Signal className="w-2.5 h-2.5 text-gray-400" />
                    <Wifi className="w-2.5 h-2.5 text-gray-400" />
                    <Battery className="w-3 h-2.5 text-green-400" />
                  </div>
                </div>

                {/* Screen content overlay */}
                <div className="absolute inset-0 bg-dark-900 border-[3px] border-dark-950 rounded-[inherit] z-0 flex flex-col pt-8 pb-4">
                   <div className="flex-1 px-3 py-2 space-y-2 overflow-y-auto custom-scrollbar">
                    {/* Device info header */}
                    <div className="bg-dark-700/80 rounded-lg p-2.5 text-center mt-2 border border-dark-600">
                      <Smartphone className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                      <p className="text-[10px] font-bold text-white leading-tight">{getDeviceName()}</p>
                      <p className="text-[8px] text-gray-400 mt-1 uppercase tracking-wider">Device Active</p>
                    </div>

                    {/* Deep info rows */}
                    <div className="space-y-1.5 mt-4">
                      {[
                        { label: 'Vendor ID', value: `0x${device.vendorId.toString(16).padStart(4, '0')}` },
                        { label: 'Product ID', value: `0x${device.productId.toString(16).padStart(4, '0')}` },
                        { label: 'Serial', value: details?.serialNumber || 'N/A' },
                        { label: 'USB Ver', value: details?.usbVersion || '—' },
                        { label: 'Interfaces', value: details?.interfaces?.toString() || '0' },
                        { label: 'Endpoints', value: details?.endpoints?.toString() || '0' },
                        { label: 'Class', value: String((details?.deviceClass ?? device.deviceClass) || 'Vendor Spec') },
                        { label: 'Mode', value: 'Live Read' },
                      ].map((row) => (
                        <div key={row.label} className="flex justify-between items-center bg-dark-800/80 rounded-md px-2 py-1.5 border border-white/5">
                          <span className="text-[8px] text-gray-400 font-medium">{row.label}</span>
                          <span className="text-[8px] text-green-400 font-mono">{row.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Action buttons */}
                    <div className="grid grid-cols-2 gap-1.5 mt-4">
                      <motion.div
                        whileHover={{ scale: actionRunning ? 1 : 1.05 }}
                        onClick={handleFlash}
                        className={`border rounded-md py-1.5 text-center cursor-pointer flex items-center justify-center gap-1 ${actionRunning === 'flash' ? 'bg-red-500/40 border-red-400/50' : 'bg-red-500/20 border-red-500/30'}`}
                      >
                        {actionRunning === 'flash' && <Loader2 className="w-2.5 h-2.5 text-red-400 animate-spin" />}
                        <span className="text-[8px] font-bold text-red-500">{actionRunning === 'flash' ? 'Flashing...' : 'Flash'}</span>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: actionRunning ? 1 : 1.05 }}
                        onClick={handleRead}
                        className={`border rounded-md py-1.5 text-center cursor-pointer flex items-center justify-center gap-1 ${actionRunning === 'read' ? 'bg-blue-500/40 border-blue-400/50' : 'bg-blue-500/20 border-blue-500/30'}`}
                      >
                        {actionRunning === 'read' && <Loader2 className="w-2.5 h-2.5 text-blue-400 animate-spin" />}
                        <span className="text-[8px] font-bold text-blue-500">{actionRunning === 'read' ? 'Reading...' : 'Read'}</span>
                      </motion.div>
                    </div>
                  </div>
                </div>

                {/* Home indicator */}
                <div className="absolute bottom-1 left-0 right-0 py-1 flex justify-center z-10">
                  <div className="w-12 h-[3px] bg-white/20 rounded-full" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Device info below mockup */}
      <AnimatePresence>
        {device && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-6 text-center space-y-1"
          >
            <p className="text-xs font-bold text-white">{getDeviceName()}</p>
            <p className="text-[10px] text-gray-400 font-mono">USB Connected • Device Reading Mode</p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className="text-[9px] px-2 py-1 rounded-md bg-green-500/20 text-green-400 border border-green-500/30 font-medium">LIVE</span>
              <span className="text-[9px] px-2 py-1 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30 font-medium">ADB/MTP Active</span>
              <button
                onClick={() => {
                  emitLog('warning', `[USB] User disconnected: ${device.productName || 'Device'}`)
                  emitLog('info', '[SYS] Awaiting new connection...')
                  setDevice(null)
                  setDetails(null)
                }}
                className="text-[9px] px-2 py-1 rounded-md bg-dark-700 text-gray-300 hover:bg-dark-600 transition border border-dark-500 font-medium ml-1"
              >
                Disconnect
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
