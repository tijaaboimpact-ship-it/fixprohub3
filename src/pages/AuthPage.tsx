import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Mail, User, ShieldCheck, ArrowRight, Loader2, Wrench } from 'lucide-react'
import { supabase } from '../supabaseClient'

interface AuthPageProps {
  onAuthSuccess: (user: any) => void;
}

export default function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isLogin) {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        
        if (signInError) throw signInError;
        
        if (data.user) {
          // You might want to fetch user role from a custom table here if configured
          onAuthSuccess({
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.full_name || 'Admin',
            role: 'admin' // By default, assigning admin or checking if needed
          });
        }
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            }
          }
        })
        
        if (signUpError) throw signUpError;
        
        if (data.user) {
          onAuthSuccess({
            id: data.user.id,
            email: data.user.email,
            name: name,
            role: 'admin'
          });
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-6 bg-[url('/grid.svg')] bg-center relative overflow-hidden">
      {/* Decorative Blob */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-red-500/10 blur-[120px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', delay: 0.1 }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/20 mx-auto mb-4"
          >
            <Wrench className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white tracking-tight">FixPro Hub</h1>
          <p className="text-gray-400 mt-2 text-sm">{isLogin ? 'Sign in to your account' : 'Create an admin/tech account'}</p>
        </div>

        <div className="glass-card p-8 rounded-2xl relative overflow-hidden backdrop-blur-xl border border-dark-500/50">
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
          
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleAuth} className="space-y-4">
            <AnimatePresence>
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1"
                >
                  <label className="text-xs text-gray-400 font-medium ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      required={!isLogin}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Tech Name"
                      className="w-full bg-dark-800/50 border border-dark-500/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500/50 focus:bg-dark-700/50 transition-all placeholder:text-gray-600"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-medium ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@fixpro.com"
                  className="w-full bg-dark-800/50 border border-dark-500/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500/50 focus:bg-dark-700/50 transition-all placeholder:text-gray-600"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-400 font-medium ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-dark-800/50 border border-dark-500/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500/50 focus:bg-dark-700/50 transition-all placeholder:text-gray-600"
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              disabled={loading}
              type="submit"
              className="w-full relative py-3 mt-4 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-bold shadow-lg shadow-red-500/20 disabled:opacity-70 group overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <div className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {isLogin ? 'Secure Login' : 'Create Account'}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
            </motion.button>
          </form>

          {/* Social Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="h-[1px] flex-1 bg-white/5" />
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Secure Gateway</span>
            <div className="h-[1px] flex-1 bg-white/5" />
          </div>

          {/* Google Login Button */}
          <motion.button
             whileHover={{ scale: 1.01, backgroundColor: 'rgba(255,255,255,0.05)' }}
             whileTap={{ scale: 0.99 }}
             onClick={async () => {
               setLoading(true)
               const { error } = await supabase.auth.signInWithOAuth({
                 provider: 'google',
                 options: {
                   redirectTo: `${window.location.origin}/auth/callback`
                 }
               })
               if (error) setError(error.message)
               setLoading(false)
             }}
             className="w-full py-3 rounded-xl border border-white/5 bg-white/2 flex items-center justify-center gap-3 text-sm font-bold text-gray-300 hover:text-white transition-all shadow-xl"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </motion.button>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
              <button
                type="button"
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="text-red-400 font-semibold hover:text-red-300 hover:underline transition-colors"
              >
                {isLogin ? 'Sign up' : 'Login instead'}
              </button>
            </p>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-gray-600 text-xs font-medium">
          <ShieldCheck className="w-4 h-4" />
          Secured by FixPro AI Shield
        </div>
      </motion.div>
    </div>
  )
}
