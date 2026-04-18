import { useEffect, useRef } from 'react'
import { Chart, registerables } from 'chart.js'
import { BarChart2, TrendingUp } from 'lucide-react'

Chart.register(...registerables)

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const flashData = [320, 480, 390, 620, 510, 780, 650, 820, 740, 910, 860, 1050]
const frpData = [120, 190, 160, 280, 220, 340, 290, 380, 310, 420, 370, 480]
const unlockData = [80, 120, 95, 180, 140, 210, 170, 250, 200, 290, 240, 320]

export default function RepairChart() {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)

  useEffect(() => {
    if (!chartRef.current) return

    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const ctx = chartRef.current.getContext('2d')
    if (!ctx) return

    // Create gradients
    const redGradient = ctx.createLinearGradient(0, 0, 0, 300)
    redGradient.addColorStop(0, 'rgba(239, 68, 68, 0.3)')
    redGradient.addColorStop(1, 'rgba(239, 68, 68, 0.02)')

    const blueGradient = ctx.createLinearGradient(0, 0, 0, 300)
    blueGradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)')
    blueGradient.addColorStop(1, 'rgba(59, 130, 246, 0.02)')

    const greenGradient = ctx.createLinearGradient(0, 0, 0, 300)
    greenGradient.addColorStop(0, 'rgba(34, 197, 94, 0.3)')
    greenGradient.addColorStop(1, 'rgba(34, 197, 94, 0.02)')

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Flash Operations',
            data: flashData,
            borderColor: '#ef4444',
            backgroundColor: redGradient,
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHoverBorderColor: '#ef4444',
            pointHoverBackgroundColor: '#0a0a0f',
            pointHoverBorderWidth: 2,
          },
          {
            label: 'FRP Resets',
            data: frpData,
            borderColor: '#3b82f6',
            backgroundColor: blueGradient,
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHoverBorderColor: '#3b82f6',
            pointHoverBackgroundColor: '#0a0a0f',
            pointHoverBorderWidth: 2,
          },
          {
            label: 'Unlocks',
            data: unlockData,
            borderColor: '#22c55e',
            backgroundColor: greenGradient,
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHoverBorderColor: '#22c55e',
            pointHoverBackgroundColor: '#0a0a0f',
            pointHoverBorderWidth: 2,
          },
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index',
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: {
              color: '#6b7280',
              font: { size: 11, family: 'Inter' },
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 20,
            }
          },
          tooltip: {
            backgroundColor: 'rgba(17, 17, 24, 0.95)',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            titleColor: '#fff',
            bodyColor: '#9ca3af',
            padding: 12,
            cornerRadius: 12,
            titleFont: { size: 13, weight: '600' as any },
            bodyFont: { size: 12 },
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.03)' },
            ticks: { color: '#4b5563', font: { size: 11 } },
            border: { display: false },
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.03)' },
            ticks: { color: '#4b5563', font: { size: 11 } },
            border: { display: false },
          }
        }
      }
    })

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [])

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
            <BarChart2 className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Repair Statistics</h3>
            <p className="text-xs text-gray-500">Monthly overview for 2024</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-green-400 bg-green-500/10 px-3 py-1.5 rounded-lg">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>+24.5% this year</span>
        </div>
      </div>
      <div className="h-[280px]">
        <canvas ref={chartRef} />
      </div>
    </div>
  )
}
