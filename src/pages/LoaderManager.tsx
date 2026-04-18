import { useState } from 'react'
import { motion } from 'framer-motion'
import { HardDrive, Download, Trash2, Search, Upload, Check, FileText, RefreshCw } from 'lucide-react'

const mockLoaders = [
  { name: 'prog_ufs_firehose_sm8250.mbn', chipset: 'SM8250', type: 'Firehose', size: '412 KB', devices: 14, status: 'active' },
  { name: 'prog_ufs_firehose_sm6150.mbn', chipset: 'SM6150', type: 'Firehose', size: '385 KB', devices: 22, status: 'active' },
  { name: 'prog_emmc_firehose_sm8150.mbn', chipset: 'SM8150', type: 'Firehose', size: '398 KB', devices: 8, status: 'active' },
  { name: 'prog_ufs_firehose_sdm845.mbn', chipset: 'SDM845', type: 'Firehose', size: '376 KB', devices: 18, status: 'active' },
  { name: 'MTK_AllInOne_DA.bin', chipset: 'MT67xx', type: 'DA', size: '2.1 MB', devices: 45, status: 'active' },
  { name: 'MTK_DA_MT6769.bin', chipset: 'MT6769', type: 'DA', size: '890 KB', devices: 12, status: 'active' },
  { name: 'MTK_DA_MT6785.bin', chipset: 'MT6785', type: 'DA', size: '920 KB', devices: 9, status: 'outdated' },
  { name: 'MTK_DA_MT6833.bin', chipset: 'MT6833', type: 'DA', size: '845 KB', devices: 16, status: 'active' },
]

export default function LoaderManager() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'Firehose' | 'DA'>('all')
  const filtered = mockLoaders.filter(l => (filter === 'all' || l.type === filter) && l.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <HardDrive className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Loader Manager</h2>
              <p className="text-xs text-gray-500">Manage Firehose (.mbn) and DA (.bin) loaders</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <motion.button whileHover={{ scale: 1.05 }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium">
              <Upload className="w-3.5 h-3.5" /> Upload Loader
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
              <RefreshCw className="w-3.5 h-3.5" /> Check Updates
            </motion.button>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="glass-card p-4 flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search loaders..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-dark-700 border border-dark-500/50 text-xs text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-purple-500/40" />
        </div>
        <div className="flex gap-2">
          {(['all', 'Firehose', 'DA'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === f ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-dark-700 text-gray-500 border border-dark-500/30 hover:text-gray-300'}`}>
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-500 ml-auto">{filtered.length} loaders</span>
      </div>

      {/* Loader table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-500/30">
                <th className="text-left px-5 py-3 text-[10px] text-gray-500 uppercase tracking-wider font-medium">Loader Name</th>
                <th className="text-left px-5 py-3 text-[10px] text-gray-500 uppercase tracking-wider font-medium">Chipset</th>
                <th className="text-left px-5 py-3 text-[10px] text-gray-500 uppercase tracking-wider font-medium">Type</th>
                <th className="text-left px-5 py-3 text-[10px] text-gray-500 uppercase tracking-wider font-medium">Size</th>
                <th className="text-left px-5 py-3 text-[10px] text-gray-500 uppercase tracking-wider font-medium">Devices</th>
                <th className="text-left px-5 py-3 text-[10px] text-gray-500 uppercase tracking-wider font-medium">Status</th>
                <th className="text-left px-5 py-3 text-[10px] text-gray-500 uppercase tracking-wider font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((loader, i) => (
                <motion.tr key={loader.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className="border-b border-dark-500/10 hover:bg-dark-700/30 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-400 flex-shrink-0" />
                      <span className="text-xs font-mono text-gray-300">{loader.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-400">{loader.chipset}</td>
                  <td className="px-5 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-md ${loader.type === 'Firehose' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'}`}>{loader.type}</span>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-500">{loader.size}</td>
                  <td className="px-5 py-3 text-xs text-gray-400">{loader.devices}</td>
                  <td className="px-5 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-md ${loader.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-orange-500/10 text-orange-400'}`}>{loader.status}</span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 rounded-lg hover:bg-dark-600 transition-colors"><Download className="w-3.5 h-3.5 text-gray-500 hover:text-blue-400" /></button>
                      <button className="p-1.5 rounded-lg hover:bg-dark-600 transition-colors"><Trash2 className="w-3.5 h-3.5 text-gray-500 hover:text-red-400" /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  )
}
