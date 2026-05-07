import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import Dashboard from './pages/Dashboard'
import QualcommPage from './pages/QualcommPage'
import MediaTekPage from './pages/MediaTekPage'
import SamsungPage from './pages/SamsungPage'
import FlashPage from './pages/FlashPage'
import UnlockPage from './pages/UnlockPage'
import FRPPage from './pages/FRPPage'
import RepairRequestsPage from './pages/RepairRequestsPage'
import LoaderManager from './pages/LoaderManager'
import SettingsPage from './pages/SettingsPage'
import AIAssistantPage from './pages/AIAssistantPage'
import LicenseManager from './pages/LicenseManager'
import AuthPage from './pages/AuthPage'
import AdminPanel from './pages/AdminPanel'
import LandingPage from './pages/LandingPage'

export type PageId = 'dashboard' | 'requests' | 'qualcomm' | 'mediatek' | 'samsung' | 'flash' | 'unlock' | 'frp' | 'loaders' | 'ai' | 'settings' | 'license' | 'admin'

function App() {
  const [activePage, setActivePage] = useState<PageId>('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [showAuth, setShowAuth] = useState(false)

  const handleLogout = () => {
    setUser(null)
    setActivePage('dashboard')
  }

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard onNavigate={setActivePage} />
      case 'requests': return <RepairRequestsPage />
      case 'qualcomm': return <QualcommPage />
      case 'mediatek': return <MediaTekPage />
      case 'samsung': return <SamsungPage />
      case 'flash': return <FlashPage />
      case 'unlock': return <UnlockPage />
      case 'frp': return <FRPPage />
      case 'loaders': return <LoaderManager />
      case 'ai': return <AIAssistantPage />
      case 'license': return <LicenseManager />
      case 'admin': return <AdminPanel user={user} />
      case 'settings': return <SettingsPage />
      default: return <Dashboard onNavigate={setActivePage} />
    }
  }

  if (!user) {
    if (showAuth) {
      return (
        <div className="relative">
          <button 
            onClick={() => setShowAuth(false)} 
            className="absolute top-6 left-6 z-50 text-gray-400 hover:text-white flex items-center justify-center p-2 rounded-full hover:bg-dark-700/50 transition"
          >
            ← Back to Home
          </button>
          <AuthPage onAuthSuccess={(loggedInUser) => setUser(loggedInUser)} />
        </div>
      )
    }
    return <LandingPage onGetStarted={() => setShowAuth(true)} />
  }

  return (
    <div className="flex h-screen overflow-hidden bg-mesh-dark text-gray-200 selection:bg-cyan-500/30 font-sans tracking-tight">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        userRole={user?.role}
      />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Topbar
          activePage={activePage}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          user={user}
          onLogout={handleLogout}
        />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 relative z-10 custom-scrollbar">
          <div className="max-w-7xl mx-auto w-full h-full">
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
