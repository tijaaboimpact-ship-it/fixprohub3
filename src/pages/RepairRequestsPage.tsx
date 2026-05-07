/**
 * RepairRequestsPage — Technician Repair Request Management
 * 
 * Shows all repair requests from the backend API with real-time Socket.io updates.
 * Technicians can:
 *  - View all requests (filterable by status)
 *  - Update status: Pending → In Progress → Done
 *  - Execute device actions (Read Info, Flash, Unlock) with simulated feedback
 *  - Monitor action logs per request
 */

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ClipboardList, User, Phone, Smartphone, AlertCircle,
  Clock, Play, CheckCircle, ArrowRight, ChevronDown,
  RefreshCw, Wifi, WifiOff, Search, Filter,
  Info, Zap, Unlock, Terminal, X, Plus
} from 'lucide-react'
import {
  getRepairRequests, updateRepairRequest, createRepairRequest,
  type RepairRequest
} from '../services/api'
import socketService from '../services/socket'

// ── Status Helpers ──────────────────────────────────────────────────────────
const statusConfig = {
  pending: {
    label: 'Pending',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    dot: 'bg-amber-400',
    icon: Clock,
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    dot: 'bg-blue-400',
    icon: Play,
  },
  done: {
    label: 'Done',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-400',
    icon: CheckCircle,
  },
}

const nextStatus: Record<string, RepairRequest['status'] | null> = {
  pending: 'in_progress',
  in_progress: 'done',
  done: null,
}

// ── Device Action Definitions ───────────────────────────────────────────────
interface DeviceAction {
  id: string;
  label: string;
  icon: any;
  color: string;
  gradient: string;
}

const deviceActions: DeviceAction[] = [
  { id: 'read_info', label: 'Read Device Info', icon: Info, color: 'text-cyan-400', gradient: 'from-cyan-600 to-blue-600' },
  { id: 'flash', label: 'Flash Device', icon: Zap, color: 'text-yellow-400', gradient: 'from-yellow-600 to-orange-600' },
  { id: 'unlock_qualcomm', label: 'Unlock (Qualcomm)', icon: Unlock, color: 'text-green-400', gradient: 'from-green-600 to-emerald-600' },
  { id: 'unlock_mtk', label: 'Unlock (MTK)', icon: Unlock, color: 'text-purple-400', gradient: 'from-purple-600 to-violet-600' },
]

// ── Log Entry Type ──────────────────────────────────────────────────────────
interface LogEntry {
  timestamp: string;
  level: 'info' | 'success' | 'error' | 'warning';
  message: string;
}

export default function RepairRequestsPage() {
  // ── State ─────────────────────────────────────────────────────────────────
  const [requests, setRequests] = useState<RepairRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRequest, setSelectedRequest] = useState<RepairRequest | null>(null)
  const [showActions, setShowActions] = useState(false)
  const [actionLogs, setActionLogs] = useState<LogEntry[]>([])
  const [socketConnected, setSocketConnected] = useState(false)
  const [showNewForm, setShowNewForm] = useState(false)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const logEndRef = useRef<HTMLDivElement>(null)

  // New request form state
  const [newForm, setNewForm] = useState({
    customerName: '',
    phoneNumber: '',
    deviceType: '',
    problemDescription: '',
  })

  // ── Fetch Repair Requests ─────────────────────────────────────────────────
  const fetchRequests = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getRepairRequests()
      setRequests(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch repair requests')
      // Fallback: show empty state
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  // ── Socket.io Real-time Listeners ─────────────────────────────────────────
  useEffect(() => {
    // Connect to Socket.io
    socketService.connect()

    socketService.onConnect(() => {
      setSocketConnected(true)
      addLog('info', '[SOCKET] Connected to real-time server')
    })

    socketService.onDisconnect(() => {
      setSocketConnected(false)
      addLog('warning', '[SOCKET] Disconnected from real-time server')
    })

    // New request arrives in real-time
    socketService.onNewRequest((newReq) => {
      setRequests(prev => [newReq, ...prev])
      addLog('info', `[SOCKET] New repair request: ${newReq.customerName} — ${newReq.deviceType}`)
    })

    // Request status updated by another technician
    socketService.onRequestUpdated((updated) => {
      setRequests(prev =>
        prev.map(r => r.id === updated.id ? updated : r)
      )
      addLog('info', `[SOCKET] Request #${updated.id} updated → ${updated.status}`)
    })

    // Request deleted
    socketService.onRequestDeleted(({ id }) => {
      setRequests(prev => prev.filter(r => r.id !== id))
      addLog('warning', `[SOCKET] Request #${id} was removed`)
    })

    return () => {
      socketService.removeAllListeners()
      socketService.disconnect()
    }
  }, [])

  // Auto-scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [actionLogs])

  // ── Helper: Add Log Entry ─────────────────────────────────────────────────
  const addLog = (level: LogEntry['level'], message: string) => {
    setActionLogs(prev => [
      ...prev,
      { timestamp: new Date().toLocaleTimeString(), level, message }
    ])
  }

  // ── Status Update Handler ─────────────────────────────────────────────────
  const handleStatusUpdate = async (request: RepairRequest) => {
    const next = nextStatus[request.status]
    if (!next) return

    try {
      setUpdatingId(request.id)
      const updated = await updateRepairRequest(request.id, { status: next })
      setRequests(prev => prev.map(r => r.id === updated.id ? updated : r))
      if (selectedRequest?.id === updated.id) {
        setSelectedRequest(updated)
      }
      addLog('success', `[STATUS] Request #${request.id} updated: ${request.status} → ${next}`)
    } catch (err: any) {
      addLog('error', `[STATUS] Failed to update #${request.id}: ${err.message}`)
    } finally {
      setUpdatingId(null)
    }
  }

  // ── Device Action Handler (Simulated) ─────────────────────────────────────
  const handleDeviceAction = async (action: DeviceAction, request: RepairRequest) => {
    addLog('info', `[${action.id.toUpperCase()}] Starting "${action.label}" on ${request.deviceType}...`)

    // Simulate multi-step execution with delays
    const steps = getSimulatedSteps(action.id, request.deviceType)
    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700))
      addLog(steps[i].level, steps[i].message)
    }
  }

  // ── Create New Request ────────────────────────────────────────────────────
  const handleCreateRequest = async () => {
    if (!newForm.customerName || !newForm.deviceType || !newForm.problemDescription) {
      addLog('error', '[FORM] Customer Name, Device Type, and Problem Description are required')
      return
    }
    try {
      const created = await createRepairRequest(newForm)
      setRequests(prev => [created, ...prev])
      addLog('success', `[API] Created new request #${created.id} for ${created.customerName}`)
      setShowNewForm(false)
      setNewForm({ customerName: '', phoneNumber: '', deviceType: '', problemDescription: '' })
    } catch (err: any) {
      addLog('error', `[API] Failed to create request: ${err.message}`)
    }
  }

  // ── Filter Logic ──────────────────────────────────────────────────────────
  const filteredRequests = requests.filter(r => {
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus
    const matchesSearch = searchQuery === '' ||
      r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.deviceType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.problemDescription.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  // ── Count by Status ───────────────────────────────────────────────────────
  const counts = {
    all: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    in_progress: requests.filter(r => r.status === 'in_progress').length,
    done: requests.filter(r => r.status === 'done').length,
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="glass-card p-6 border-l-4 border-cyan-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Repair Requests</h2>
              <p className="text-xs text-gray-400">Manage incoming repair jobs • Real-time updates</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Socket Status */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
              socketConnected 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>
              {socketConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {socketConnected ? 'Live' : 'Offline'}
            </div>
            {/* Refresh */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95, rotate: 180 }}
              onClick={fetchRequests}
              className="p-2 rounded-xl bg-dark-700/50 border border-dark-500/30 text-gray-400 hover:text-white transition"
            >
              <RefreshCw className="w-4 h-4" />
            </motion.button>
            {/* New Request */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowNewForm(!showNewForm)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-sm font-bold shadow-lg shadow-cyan-500/20"
            >
              <Plus className="w-4 h-4" />
              New Request
            </motion.button>
          </div>
        </div>
      </div>

      {/* New Request Form (Collapsible) */}
      <AnimatePresence>
        {showNewForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-card p-6 space-y-4 border border-cyan-500/20">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Create New Repair Request</h3>
                <button onClick={() => setShowNewForm(false)} className="text-gray-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 font-medium mb-1 block">Customer Name *</label>
                  <input
                    value={newForm.customerName}
                    onChange={e => setNewForm(f => ({ ...f, customerName: e.target.value }))}
                    placeholder="John Doe"
                    className="w-full bg-dark-900 border border-dark-500 rounded-xl px-4 py-3 text-white text-sm focus:border-cyan-500 outline-none transition"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-medium mb-1 block">Phone Number</label>
                  <input
                    value={newForm.phoneNumber}
                    onChange={e => setNewForm(f => ({ ...f, phoneNumber: e.target.value }))}
                    placeholder="+20 100 123 4567"
                    className="w-full bg-dark-900 border border-dark-500 rounded-xl px-4 py-3 text-white text-sm focus:border-cyan-500 outline-none transition"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-medium mb-1 block">Device Type *</label>
                  <input
                    value={newForm.deviceType}
                    onChange={e => setNewForm(f => ({ ...f, deviceType: e.target.value }))}
                    placeholder="Samsung Galaxy S24"
                    className="w-full bg-dark-900 border border-dark-500 rounded-xl px-4 py-3 text-white text-sm focus:border-cyan-500 outline-none transition"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-medium mb-1 block">Problem Description *</label>
                  <input
                    value={newForm.problemDescription}
                    onChange={e => setNewForm(f => ({ ...f, problemDescription: e.target.value }))}
                    placeholder="Screen cracked, touch unresponsive..."
                    className="w-full bg-dark-900 border border-dark-500 rounded-xl px-4 py-3 text-white text-sm focus:border-cyan-500 outline-none transition"
                  />
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleCreateRequest}
                className="btn-premium w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold shadow-lg"
              >
                Submit Repair Request
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Status Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          {(['all', 'pending', 'in_progress', 'done'] as const).map(status => (
            <motion.button
              key={status}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                filterStatus === status
                  ? status === 'all'
                    ? 'bg-white/10 text-white border border-white/20'
                    : `${statusConfig[status as keyof typeof statusConfig]?.bg} ${statusConfig[status as keyof typeof statusConfig]?.color} border ${statusConfig[status as keyof typeof statusConfig]?.border}`
                  : 'bg-dark-700/30 text-gray-500 border border-dark-500/20 hover:text-gray-300'
              }`}
            >
              {status === 'all' ? 'All' : statusConfig[status as keyof typeof statusConfig]?.label}
              <span className="ml-2 opacity-60">({counts[status]})</span>
            </motion.button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, device, or problem..."
            className="w-full bg-dark-700/30 border border-dark-500/20 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-cyan-500/50 outline-none transition"
          />
        </div>
      </div>

      {/* Main Content: Requests + Actions/Logs */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Request List (2/3 width) */}
        <div className="xl:col-span-2 space-y-3">
          {loading ? (
            // Skeleton loading
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="glass-card p-5 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-dark-600" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-1/3 bg-dark-600 rounded" />
                      <div className="h-3 w-2/3 bg-dark-600/50 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="glass-card p-8 text-center">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <p className="text-red-400 font-medium">{error}</p>
              <p className="text-gray-500 text-sm mt-1">Make sure the backend server is running on the configured API URL</p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                onClick={fetchRequests}
                className="mt-4 px-6 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-sm font-medium"
              >
                Retry
              </motion.button>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <ClipboardList className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">No repair requests found</p>
              <p className="text-gray-500 text-xs mt-1">
                {filterStatus !== 'all' ? 'Try changing the filter' : 'Create a new request to get started'}
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredRequests.map((request, index) => {
                const cfg = statusConfig[request.status]
                const StatusIcon = cfg.icon
                const isSelected = selectedRequest?.id === request.id
                const isUpdating = updatingId === request.id

                return (
                  <motion.div
                    key={request.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => {
                      setSelectedRequest(request)
                      setShowActions(true)
                    }}
                    className={`glass-card p-5 cursor-pointer transition-all duration-300 group ${
                      isSelected
                        ? 'border-cyan-500/40 bg-cyan-500/5 ring-1 ring-cyan-500/20'
                        : 'hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className={`w-10 h-10 rounded-full ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                        <User className={`w-5 h-5 ${cfg.color}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-sm font-bold text-white truncate">{request.customerName}</h3>
                          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${request.status === 'in_progress' ? 'animate-pulse' : ''}`} />
                            {cfg.label}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {request.phoneNumber || 'N/A'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Smartphone className="w-3 h-3" />
                            {request.deviceType}
                          </span>
                        </div>

                        <p className="text-xs text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                          {request.problemDescription}
                        </p>

                        {/* Footer: Time + Actions */}
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                          <span className="text-[10px] text-gray-600 font-mono">
                            {new Date(request.createdAt).toLocaleDateString()} • {new Date(request.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>

                          {/* Status Advance Button */}
                          {nextStatus[request.status] && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleStatusUpdate(request)
                              }}
                              disabled={isUpdating}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                                isUpdating
                                  ? 'bg-dark-600 text-gray-500 cursor-wait'
                                  : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20'
                              }`}
                            >
                              {isUpdating ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <>
                                  <ArrowRight className="w-3 h-3" />
                                  Move to {statusConfig[nextStatus[request.status]!].label}
                                </>
                              )}
                            </motion.button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Right Panel: Device Actions + Logs (1/3 width) */}
        <div className="space-y-4">
          {/* Device Actions Panel */}
          <div className="glass-card p-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Terminal className="w-4 h-4" />
              Device Actions
              {selectedRequest && (
                <span className="text-cyan-400 font-mono normal-case">— #{selectedRequest.id}</span>
              )}
            </h3>

            {!selectedRequest ? (
              <p className="text-xs text-gray-600 text-center py-6">
                Select a repair request to execute device actions
              </p>
            ) : (
              <div className="space-y-2">
                {deviceActions.map(action => {
                  const Icon = action.icon
                  return (
                    <motion.button
                      key={action.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleDeviceAction(action, selectedRequest)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r ${action.gradient} bg-opacity-10 text-white text-sm font-medium shadow-lg transition-all hover:shadow-xl`}
                      style={{ background: `linear-gradient(135deg, rgba(0,0,0,0.3), rgba(0,0,0,0.5))` }}
                    >
                      <div className={`w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${action.color}`} />
                      </div>
                      <span className="text-xs font-bold text-gray-200">{action.label}</span>
                    </motion.button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Logs Panel */}
          <div className="glass-card p-5 flex flex-col" style={{ minHeight: '350px', maxHeight: '500px' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                Action Logs
              </h3>
              {actionLogs.length > 0 && (
                <button
                  onClick={() => setActionLogs([])}
                  className="text-[10px] text-gray-600 hover:text-gray-400 transition"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 font-mono text-[11px] custom-scrollbar">
              {actionLogs.length === 0 ? (
                <p className="text-gray-600 text-center py-8 text-xs">
                  No actions executed yet. Select a request and run a device action.
                </p>
              ) : (
                actionLogs.map((log, i) => (
                  <div
                    key={i}
                    className={`flex gap-2 leading-relaxed ${
                      log.level === 'success' ? 'text-emerald-400' :
                      log.level === 'error' ? 'text-red-400' :
                      log.level === 'warning' ? 'text-amber-400' :
                      'text-cyan-400'
                    }`}
                  >
                    <span className="text-gray-600 flex-shrink-0">{log.timestamp}</span>
                    <span>{log.message}</span>
                  </div>
                ))
              )}
              <div ref={logEndRef} />
            </div>

            {/* Blinking cursor */}
            <div className="mt-2 pt-2 border-t border-white/5">
              <span className="text-cyan-400 font-mono text-xs animate-pulse">█</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// Simulated device action steps
// Structure prepared for real tool integration (ADB, Fastboot, EDL, MTK)
// ──────────────────────────────────────────────────────────────────────────────
function getSimulatedSteps(actionId: string, deviceType: string): LogEntry[] {
  const ts = () => new Date().toLocaleTimeString()
  
  switch (actionId) {
    case 'read_info':
      return [
        { timestamp: ts(), level: 'info', message: `[ADB] Scanning USB ports...` },
        { timestamp: ts(), level: 'info', message: `[ADB] Device detected: ${deviceType}` },
        { timestamp: ts(), level: 'info', message: `[ADB] Reading device properties...` },
        { timestamp: ts(), level: 'info', message: `[ADB] Model: ${deviceType}` },
        { timestamp: ts(), level: 'info', message: `[ADB] Serial: FPH${Math.random().toString(36).substring(2, 10).toUpperCase()}` },
        { timestamp: ts(), level: 'info', message: `[ADB] Android Version: 14.0 (API 34)` },
        { timestamp: ts(), level: 'info', message: `[ADB] Security Patch: 2026-03-01` },
        { timestamp: ts(), level: 'info', message: `[ADB] Bootloader: Locked` },
        { timestamp: ts(), level: 'info', message: `[ADB] Battery: ${60 + Math.floor(Math.random() * 35)}%` },
        { timestamp: ts(), level: 'success', message: `[ADB] Device info read complete ✓` },
      ]

    case 'flash':
      return [
        { timestamp: ts(), level: 'info', message: `[FLASH] Initializing fastboot interface...` },
        { timestamp: ts(), level: 'info', message: `[FLASH] Target device: ${deviceType}` },
        { timestamp: ts(), level: 'info', message: `[FLASH] Verifying firmware image integrity...` },
        { timestamp: ts(), level: 'info', message: `[FLASH] SHA256 checksum verified ✓` },
        { timestamp: ts(), level: 'info', message: `[FLASH] Erasing system partition...` },
        { timestamp: ts(), level: 'info', message: `[FLASH] Writing firmware (0%)...` },
        { timestamp: ts(), level: 'info', message: `[FLASH] Writing firmware (25%)...` },
        { timestamp: ts(), level: 'info', message: `[FLASH] Writing firmware (50%)...` },
        { timestamp: ts(), level: 'info', message: `[FLASH] Writing firmware (75%)...` },
        { timestamp: ts(), level: 'info', message: `[FLASH] Writing firmware (100%)...` },
        { timestamp: ts(), level: 'success', message: `[FLASH] Firmware flashed successfully ✓ — Rebooting device` },
      ]

    case 'unlock_qualcomm':
      return [
        { timestamp: ts(), level: 'info', message: `[EDL] Checking Qualcomm 9008 EDL mode...` },
        { timestamp: ts(), level: 'info', message: `[EDL] Loading firehose programmer...` },
        { timestamp: ts(), level: 'info', message: `[EDL] Sahara handshake successful` },
        { timestamp: ts(), level: 'info', message: `[EDL] Sending OEM unlock payload...` },
        { timestamp: ts(), level: 'info', message: `[EDL] Verifying bootloader state...` },
        { timestamp: ts(), level: 'warning', message: `[EDL] Note: This is a simulated unlock. Connect real device for actual operation.` },
        { timestamp: ts(), level: 'success', message: `[EDL] Qualcomm unlock sequence complete ✓` },
      ]

    case 'unlock_mtk':
      return [
        { timestamp: ts(), level: 'info', message: `[MTK] Scanning for MediaTek BROM device...` },
        { timestamp: ts(), level: 'info', message: `[MTK] BROM detected on USB` },
        { timestamp: ts(), level: 'info', message: `[MTK] Loading Download Agent (DA)...` },
        { timestamp: ts(), level: 'info', message: `[MTK] DA loaded successfully` },
        { timestamp: ts(), level: 'info', message: `[MTK] Sending SLA challenge/response...` },
        { timestamp: ts(), level: 'info', message: `[MTK] Writing unlock flag to NVRAM...` },
        { timestamp: ts(), level: 'warning', message: `[MTK] Note: This is a simulated unlock. Connect real device for actual operation.` },
        { timestamp: ts(), level: 'success', message: `[MTK] MediaTek unlock complete ✓` },
      ]

    default:
      return [
        { timestamp: ts(), level: 'warning', message: `[SYSTEM] Unknown action: ${actionId}` },
      ]
  }
}
