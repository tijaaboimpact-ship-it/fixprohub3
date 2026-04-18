import { motion } from 'framer-motion'

const brands = [
  { name: 'Samsung', color: '#1428a0', logo: '📱', count: 2840 },
  { name: 'Xiaomi', color: '#ff6900', logo: '📲', count: 1920 },
  { name: 'Tecno', color: '#0099ff', logo: '📳', count: 1560 },
  { name: 'Infinix', color: '#f5004f', logo: '📴', count: 1340 },
  { name: 'Oppo', color: '#1a8c1a', logo: '🔲', count: 1180 },
  { name: 'Vivo', color: '#415fff', logo: '⬛', count: 980 },
  { name: 'Huawei', color: '#cf0a2c', logo: '🔳', count: 870 },
  { name: 'Realme', color: '#ffc800', logo: '📵', count: 720 },
  { name: 'Nokia', color: '#124191', logo: '📶', count: 540 },
  { name: 'Motorola', color: '#5c2d91', logo: '📡', count: 460 },
  { name: 'LG', color: '#a50034', logo: '📻', count: 380 },
  { name: 'OnePlus', color: '#eb0028', logo: '📟', count: 650 },
]

export default function BrandGrid() {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-white">Supported Brands</h3>
          <p className="text-xs text-gray-500 mt-0.5">Select a brand to view devices</p>
        </div>
        <span className="text-xs text-gray-500 bg-dark-700 px-3 py-1 rounded-lg">{brands.length} brands</span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {brands.map((brand, i) => (
          <motion.button
            key={brand.name}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            whileHover={{ scale: 1.08, y: -4 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-dark-700/50 border border-dark-500/30 hover:border-dark-400/50 transition-all group cursor-pointer"
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-transform group-hover:scale-110"
              style={{ background: `${brand.color}20` }}
            >
              {brand.logo}
            </div>
            <span className="text-xs font-medium text-gray-300 group-hover:text-white transition-colors">{brand.name}</span>
            <span className="text-[10px] text-gray-600">{brand.count.toLocaleString()}</span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
