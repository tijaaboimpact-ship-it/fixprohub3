import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Smartphone, Users, Key, BrainCircuit,
  Plus, Trash2, RefreshCw, ShieldCheck, Database, AlertCircle,
  CheckCircle, XCircle, Edit3, Save, X, ShieldAlert, ListFilter
} from 'lucide-react'
import { supabase } from '../supabaseClient'

interface AdminPanelProps {
  user: { name: string; email: string; role: string } | null
}

type Tab = 'devices' | 'users' | 'licenses' | 'ai_cases' | 'security' | 'device_logs'

export default function AdminPanel({ user }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('devices')
  const [devices, setDevices] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [licenses, setLicenses] = useState<any[]>([])
  const [aiCases, setAiCases] = useState<any[]>([])
  const [securityLogs, setSecurityLogs] = useState<any[]>([])
  const [deviceLogs, setDeviceLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  
  // Device management state
  const [showAddDevice, setShowAddDevice] = useState(false)
  const [newDevice, setNewDevice] = useState({ model_name: '', brand: '', chipset: '', cpu_id: '' })
  const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null)
  const [editDevice, setEditDevice] = useState<any>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [
        { data: devRes }, 
        { data: userRes }, 
        { data: licRes }, 
        { data: aiRes },
        { data: secRes },
        { data: devLogRes }
      ] = await Promise.all([
        supabase.from('devices').select('*').order('created_at', { ascending: false }),
        supabase.from('users').select('*').order('created_at', { ascending: false }),
        supabase.from('licenses').select('*').order('created_at', { ascending: false }),
        supabase.from('repair_logs').select('*').order('created_at', { ascending: false }),
        supabase.from('security_logs').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('device_logs').select('*').order('created_at', { ascending: false }).limit(50),
      ])
      
      setDevices(devRes || [])
      setUsers(userRes || [])
      setLicenses(licRes || [])
      setAiCases(aiRes || [])
      setSecurityLogs(secRes || [])
      setDeviceLogs(devLogRes || [])
    } catch (err: any) {
      showToast(err.message || 'Error fetching data from Supabase', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const deleteDevice = async (id: string) => {
    if (!confirm('Are you sure you want to delete this device?')) return
    const { error } = await supabase.from('devices').delete().eq('id', id)
    if (error) {
       showToast(error.message, 'error')
       return
    }
    showToast('Device deleted successfully')
    fetchData()
  }

  const addDevice = async () => {
    if (!newDevice.model_name || !newDevice.brand) {
      showToast('Model name and brand are required', 'error')
      return;
    }
    
    const { error } = await supabase.from('devices').insert([{
      brand: newDevice.brand,
      model_name: newDevice.model_name,
      model_number: newDevice.model_name,
      chipset: newDevice.chipset,
      cpu_id: newDevice.cpu_id
    }])
    
    if (error) {
       showToast(error.message, 'error')
       return
    }

    showToast(`Added ${newDevice.model_name}`)
    setShowAddDevice(false)
    setNewDevice({ model_name: '', brand: '', chipset: '', cpu_id: '' })
    fetchData()
  }

  const startEditingDevice = (device: any) => {
    setEditingDeviceId(device.id)
    setEditDevice({ ...device })
  }

  const saveDeviceEdit = async () => {
    if (!editDevice) return
    const { error } = await supabase.from('devices').update({
      brand: editDevice.brand,
      model_name: editDevice.model_name,
      chipset: editDevice.chipset,
      cpu_id: editDevice.cpu_id
    }).eq('id', editDevice.id)

    if (error) {
      showToast(error.message, 'error')
      return
    }

    showToast('Device updated')
    setEditingDeviceId(null)
    setEditDevice(null)
    fetchData()
  }

  const toggleLicenseStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active'
    const { error } = await supabase.from('licenses').update({ status: newStatus }).eq('id', id)
    if (error) {
       showToast(error.message, 'error')
       return
    }
    showToast(`License ${newStatus}`)
    fetchData()
  }

  if (user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <ShieldCheck className="w-16 h-16 text-red-500/30 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Access Restricted</h2>
        <p className="text-gray-500 text-sm">Admin Panel is only accessible to administrators.</p>
      </div>
    )
  }

  const tabs: { id: Tab; label: string; icon: any; color: string }[] = [
    { id: 'devices', label: 'Devices', icon: Smartphone, color: 'text-blue-400' },
    { id: 'users', label: 'Users', icon: Users, color: 'text-emerald-400' },
    { id: 'licenses', label: 'Licenses', icon: Key, color: 'text-amber-400' },
    { id: 'ai_cases', label: 'AI Cases', icon: BrainCircuit, color: 'text-purple-400' },
    { id: 'security', label: 'Security', icon: ShieldAlert, color: 'text-red-400' },
    { id: 'device_logs', label: 'Ops Logs', icon: ListFilter, color: 'text-cyan-400' },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-7xl mx-auto pb-20">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -40 }}
            className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl font-medium text-sm ${toast.type === 'success' ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400' : 'bg-red-500/20 border border-red-500/40 text-red-400'}`}
          >
            {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
            <ShieldCheck className="w-8 h-8 text-emerald-500 drop-shadow-[0_0_10px_rgba(52,211,153,0.4)]" />
            Control Center
          </h1>
          <p className="text-gray-500 mt-2 text-sm font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Supabase Orchestration Active • Full CRUD Capable
          </p>
        </div>
        <button
          onClick={fetchData}
          className="mt-4 md:mt-0 flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-dark-800 border border-dark-600 text-sm font-bold text-gray-300 hover:bg-dark-700 hover:border-gray-500 transition-all shadow-lg"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Synchronize Data
        </button>
      </div>

      {/* Nav Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-dark-900 border border-dark-700 rounded-3xl w-fit">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === t.id ? 'bg-gradient-to-br from-dark-700 to-dark-800 border border-white/10 text-white shadow-xl' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <t.icon className={`w-4 h-4 ${activeTab === t.id ? t.color : 'text-gray-600'}`} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="min-h-[500px]">
        <AnimatePresence mode="wait">
          {/* ── DEVICES TAB ── */}
          {activeTab === 'devices' && (
            <motion.div key="devices" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-white text-lg flex items-center gap-3">
                  <Database className="w-5 h-5 text-blue-400" />
                  Hardware Inventory
                  <span className="px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-400 text-xs">{devices.length}</span>
                </h3>
                <button
                  onClick={() => setShowAddDevice(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-500 text-white text-sm font-bold hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
                >
                  <Plus className="w-4 h-4" /> Provision New Model
                </button>
              </div>

              {/* Add Device Form */}
              <AnimatePresence>
                {showAddDevice && (
                  <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="glass-card p-6 border border-blue-500/30 bg-blue-500/5">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-widest"><Plus className="w-4 h-4 text-blue-400" />New Device Configuration</h4>
                      <button onClick={() => setShowAddDevice(false)} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {[
                        { key: 'model_name', label: 'Model Name', placeholder: 'Galaxy S25 Ultra' },
                        { key: 'brand', label: 'Manufacturer', placeholder: 'Samsung' },
                        { key: 'chipset', label: 'SoC / Chipset', placeholder: 'Snapdragon 8 Elite' },
                        { key: 'cpu_id', label: 'CPU HWID', placeholder: '0x8004...' },
                      ].map(f => (
                        <div key={f.key}>
                          <label className="text-[10px] uppercase font-bold text-gray-500 mb-1.5 block">{f.label}</label>
                          <input placeholder={f.placeholder}
                            value={(newDevice as any)[f.key]}
                            onChange={e => setNewDevice(d => ({ ...d, [f.key]: e.target.value }))}
                            className="w-full bg-dark-700 border border-dark-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-all"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3 mt-8">
                      <button onClick={addDevice} className="flex-1 px-5 py-3 rounded-2xl bg-blue-500 text-white text-sm font-bold hover:bg-blue-600 shadow-xl shadow-blue-500/20">
                        Confirm Provisioning
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="glass-card border-white/5 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-dark-900 border-b border-white/5">
                    <tr>
                      {['Device Info', 'Chipset', 'HWID/CPU', 'Created', 'Actions'].map(h => (
                        <th key={h} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 bg-dark-800/20">
                    {devices.map((d) => (
                      <tr key={d.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4">
                          {editingDeviceId === d.id ? (
                            <div className="space-y-2">
                              <input value={editDevice?.model_name} onChange={e => setEditDevice({...editDevice, model_name: e.target.value})} className="bg-dark-700 border border-dark-500 rounded px-2 py-1 text-sm text-white w-full" />
                              <input value={editDevice?.brand} onChange={e => setEditDevice({...editDevice, brand: e.target.value})} className="bg-dark-700 border border-dark-500 rounded px-2 py-1 text-xs text-gray-400 w-full" />
                            </div>
                          ) : (
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-white tracking-tight">{d.model_name}</span>
                              <span className="text-xs text-blue-400/80 font-medium">{d.brand}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {editingDeviceId === d.id ? (
                            <input value={editDevice?.chipset} onChange={e => setEditDevice({...editDevice, chipset: e.target.value})} className="bg-dark-700 border border-dark-500 rounded px-2 py-1 text-xs text-white w-full" />
                          ) : (
                            <span className="text-xs text-gray-400 font-mono">{d.chipset || 'Unknown'}</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                           {editingDeviceId === d.id ? (
                            <input value={editDevice?.cpu_id} onChange={e => setEditDevice({...editDevice, cpu_id: e.target.value})} className="bg-dark-700 border border-dark-500 rounded px-2 py-1 text-xs text-white w-full" />
                          ) : (
                            <span className="px-2 py-1 rounded-md text-[10px] font-black bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">
                              {d.cpu_id || 'ANY'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-mono text-[10px] text-gray-600">
                          {new Date(d.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {editingDeviceId === d.id ? (
                              <>
                                <button onClick={saveDeviceEdit} className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors" title="Save">
                                  <Save className="w-4 h-4" />
                                </button>
                                <button onClick={() => setEditingDeviceId(null)} className="p-2 rounded-xl bg-dark-600 text-gray-400 hover:bg-dark-500" title="Cancel">
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => startEditingDevice(d)} className="p-2 rounded-xl bg-dark-600 text-gray-300 hover:bg-dark-500 hover:text-white transition-colors">
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button onClick={() => deleteDevice(d.id)} className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* ── SECURITY TAB ── */}
          {activeTab === 'security' && (
            <motion.div key="security" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-white text-lg flex items-center gap-3">
                  <ShieldAlert className="w-5 h-5 text-red-400" />
                  Security & Audit Logs
                </h3>
              </div>
              <div className="glass-card border-red-500/10 bg-red-500/5 p-4 flex gap-4 items-center">
                <div className="p-3 bg-red-500/20 rounded-2xl"><ShieldCheck className="w-6 h-6 text-red-500" /></div>
                <div>
                  <h4 className="text-red-400 font-bold text-sm uppercase tracking-wider">Antigravity Threat Engine</h4>
                  <p className="text-gray-400 text-xs">Real-time monitoring of authentication attempts, HWID mismatches, and signature verification.</p>
                </div>
              </div>
              <div className="glass-card border-white/5 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-dark-900 border-b border-white/5">
                    <tr>
                      {['Timestamp', 'Event Type', 'Identifier', 'IP/Origin', 'Status'].map(h => (
                        <th key={h} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 bg-dark-800/20">
                    {securityLogs.length === 0 ? (
                      <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-600 text-sm italic">No recent security events observed</td></tr>
                    ) : securityLogs.map((l) => (
                      <tr key={l.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-mono text-[10px] text-gray-500">{new Date(l.created_at).toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-bold ${l.action_type.includes('failed') || l.action_type.includes('mismatch') ? 'text-red-400' : 'text-emerald-400'}`}>
                            {l.action_type.replace(/_/g, ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-[10px] text-gray-400">{l.user_id || l.hwid_attempt || 'Anonymous'}</td>
                        <td className="px-6 py-4 font-mono text-[10px] text-gray-500">{l.ip_address || 'Internal'}</td>
                        <td className="px-6 py-4">
                           {l.action_type.includes('failed') ? (
                             <span className="flex items-center gap-1.5 text-red-500 font-bold text-[10px]"><XCircle className="w-3 h-3"/> DENIED</span>
                           ) : (
                             <span className="flex items-center gap-1.5 text-emerald-500 font-bold text-[10px]"><CheckCircle className="w-3 h-3"/> MONITORING</span>
                           )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

           {/* ── DEVICE LOGS TAB ── */}
           {activeTab === 'device_logs' && (
            <motion.div key="device_logs" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-white text-lg flex items-center gap-3">
                  <ListFilter className="w-5 h-5 text-cyan-400" />
                  Operation History (Device Logs)
                </h3>
              </div>
              <div className="glass-card border-white/5 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-dark-900 border-b border-white/5">
                    <tr>
                      {['Timestamp', 'Device Serial', 'Level', 'Message'].map(h => (
                        <th key={h} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 bg-dark-800/20 font-mono">
                    {deviceLogs.length === 0 ? (
                      <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-600 text-sm italic">No operations recorded in Supabase</td></tr>
                    ) : deviceLogs.map((l) => (
                      <tr key={l.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 text-[10px] text-gray-500">{new Date(l.created_at).toLocaleString()}</td>
                        <td className="px-6 py-4 text-[10px] text-blue-400">{l.device_id || 'System'}</td>
                        <td className="px-6 py-4">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${l.level === 'error' ? 'text-red-400 bg-red-400/10 border-red-400/20' : l.level === 'success' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' : 'text-gray-400 bg-dark-700 border-dark-600'}`}>
                            {l.level.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[11px] text-gray-300 max-w-md truncate" title={l.message}>{l.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* ── USERS TAB ── */}
          {activeTab === 'users' && (
            <motion.div key="users" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
               <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-white text-lg flex items-center gap-3">
                  <Users className="w-5 h-5 text-emerald-400" />
                  User Directives
                </h3>
              </div>
              <div className="glass-card overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="text-[10px] text-gray-500 uppercase font-black tracking-widest bg-dark-900 border-b border-white/5">
                    <tr>
                      {['Identity', 'Email Address', 'Privileges', 'Created At', 'Actions'].map(h => (
                        <th key={h} className="px-6 py-4">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4 flex items-center gap-3">
                           <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center font-black text-white shadow-lg">
                             {u.email?.[0].toUpperCase()}
                           </div>
                           <span className="font-bold text-white">{u.email?.split('@')[0] || 'Unknown'}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-400">{u.email}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${u.role === 'admin' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                            {u.role || 'technician'}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-[10px] text-gray-600">{new Date(u.created_at).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          {u.role !== 'admin' && (
                            <button className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* ── LICENSES TAB ── */}
          {activeTab === 'licenses' && (
            <motion.div key="licenses" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
               <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-white text-lg flex items-center gap-3">
                  <Key className="w-5 h-5 text-amber-500" />
                  Cryptographic Licenses
                </h3>
              </div>
              <div className="glass-card overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-dark-900 border-b border-white/5">
                    <tr>
                      {['License Identifier', 'Entitlement', 'Operational Status', 'Hardware Lock', 'Actions'].map(h => (
                        <th key={h} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 bg-dark-800/20">
                    {licenses.map((l) => (
                      <tr key={l.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4">
                           <div className="flex flex-col">
                             <span className="font-mono text-[11px] text-gray-300 tracking-wider">FIXPRO-{l.license_key?.slice(-12).toUpperCase()}</span>
                             <span className="text-[9px] text-gray-600 font-mono mt-0.5">UID: {l.user_id?.slice(-8)}</span>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 rounded-lg text-[9px] font-black tracking-widest bg-amber-500/10 text-amber-500 uppercase border border-amber-500/20">{l.plan_type}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full text-[10px] font-bold ${l.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-500'}`}>
                            {l.status === 'active' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {l.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-[10px] text-gray-500 truncate max-w-[120px]">{l.hwid || 'NOT_LINKED'}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => toggleLicenseStatus(l.id, l.status)}
                            className={`p-2 rounded-xl transition-all opacity-0 group-hover:opacity-100 ${l.status === 'active' ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'}`}
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* ── AI CASES TAB ── */}
          {activeTab === 'ai_cases' && (
            <motion.div key="ai_cases" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
               <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-white text-lg flex items-center gap-3">
                  <BrainCircuit className="w-5 h-5 text-purple-400" />
                  Neural Knowledge Nodes
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {aiCases.map((c, i) => (
                  <div key={c.id || i} className="glass-card p-5 flex items-center justify-between group hover:border-purple-500/30 transition-all">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-dark-800 flex items-center justify-center border border-white/5">
                        <Database className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-white">{c.error_type}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${c.is_success ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-500'}`}>
                            {c.is_success ? 'High Yield' : 'Experimental'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-1">{c.repair_method}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="text-right">
                         <div className="text-sm font-black text-white">{c.is_success ? '98%' : '42%'}</div>
                         <div className="text-[8px] text-gray-600 font-bold uppercase tracking-widest">Conf. Index</div>
                       </div>
                       <ChevronRight className="w-5 h-5 text-gray-700 group-hover:text-purple-400 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

function ChevronRight(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-right"><path d="m9 18 6-6-6-6"/></svg>
  )
}

