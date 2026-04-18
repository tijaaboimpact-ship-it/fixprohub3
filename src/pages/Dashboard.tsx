import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Smartphone, Wrench, CheckCircle, AlertTriangle,
  TrendingUp, Download, Cpu, Zap, ShieldOff, Unlock,
  Activity, Clock, ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import StatsCard from '../components/StatsCard'
import RepairChart from '../components/RepairChart'
import BrandGrid from '../components/BrandGrid'
import QuickTools from '../components/QuickTools'
import PhoneMockup from '../components/PhoneMockup'
import RecentActivity from '../components/RecentActivity'
import LogConsole from '../components/LogConsole'
import type { PageId } from '../App'
import { supabase } from '../supabaseClient'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
}

interface DashboardProps {
  onNavigate: (page: PageId) => void
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [deviceCount, setDeviceCount] = useState<number>(0);

  useEffect(() => {
    // Fetch live data from Supabase
    const fetchCount = async () => {
      try {
        const { count, error } = await supabase.from('devices').select('id', { count: 'exact', head: true })
        if (error) throw error
        setDeviceCount(count || 0)
      } catch (err) {
        console.error("Database unavailable", err)
      }
    }
    fetchCount()
  }, [])

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Stats Row */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Server Connection"
          value="Online"
          change="Supabase"
          trend="up"
          icon={Activity}
          color="green"
          subtitle="Real-time link active"
        />
        <StatsCard
          title="Supported Devices"
          value={deviceCount.toString()}
          change="via Database"
          trend="up"
          icon={Smartphone}
          color="blue"
          subtitle="Supabase Live DB"
        />
        <StatsCard
          title="Success Rate"
          value="98.7%"
          change="+0.3%"
          trend="up"
          icon={CheckCircle}
          color="blue"
          subtitle="AI Calibrated"
        />
        <StatsCard
          title="Failed Operations"
          value="2"
          change="from Logs"
          trend="down"
          icon={AlertTriangle}
          color="orange"
          subtitle="AI Cases DB"
        />
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Charts */}
        <motion.div variants={item} className="xl:col-span-2 space-y-6">
          <RepairChart />
          
          {/* Quick Tools */}
          <QuickTools onNavigate={onNavigate} />
        </motion.div>

        {/* Right Column - Phone + Activity */}
        <motion.div variants={item} className="space-y-6">
          <PhoneMockup />
          <RecentActivity />
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <motion.div variants={item} className="xl:col-span-2">
          <BrandGrid />
        </motion.div>
        <motion.div variants={item}>
          <LogConsole />
        </motion.div>
      </div>
    </motion.div>
  )
}
