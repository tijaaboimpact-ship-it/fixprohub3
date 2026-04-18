import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, Cpu, HardDrive, Database, BrainCircuit, ArrowRight, Star, Lock, Mail, Phone, MessageSquare, TerminalSquare, AlertTriangle, Zap } from 'lucide-react'

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }, exit: { opacity: 0, y: -20, transition: { duration: 0.4 } } }
const stagger = { visible: { transition: { staggerChildren: 0.2 } } }

interface LandingPageProps {
  onGetStarted: () => void;
}

type Tab = 'home' | 'services' | 'about' | 'contact'

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  const [activeTab, setActiveTab] = useState<Tab>('home')

  const NavLink = ({ label, tab }: { label: string, tab: Tab }) => (
    <button 
      onClick={() => setActiveTab(tab)}
      className={`text-sm font-semibold transition ${activeTab === tab ? 'text-red-400' : 'text-gray-300 hover:text-white'}`}
    >
      {label}
    </button>
  )

  return (
    <div className="min-h-screen bg-dark-900 text-white selection:bg-red-500/30 overflow-x-hidden font-sans flex flex-col">
      
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-red-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] right-[-10%] w-[40%] h-[60%] bg-orange-600/10 rounded-full blur-[140px]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-50 flex items-center justify-between p-6 max-w-7xl mx-auto w-full backdrop-blur-md border-b border-white/5 sticky top-0 bg-dark-900/80">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('home')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/20">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight hidden sm:block">FixProHub</span>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8 bg-dark-800/50 px-6 py-2 rounded-full border border-dark-600">
          <NavLink label="Home" tab="home" />
          <NavLink label="Services" tab="services" />
          <NavLink label="About Us" tab="about" />
          <NavLink label="Contact" tab="contact" />
        </div>

        <div className="flex items-center gap-4">
          <button onClick={onGetStarted} className="text-sm font-semibold text-gray-300 hover:text-white hidden sm:block transition">Login</button>
          <button onClick={onGetStarted} className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold text-sm rounded-full shadow-lg shadow-red-500/20 hover:scale-105 transition-transform">
            Platform Access
          </button>
        </div>
      </nav>

      <main className="flex-1 relative z-10">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div key="home" initial="hidden" animate="visible" exit="exit" variants={stagger}>
               {/* Hero Section */}
              <section className="pt-24 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
                <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/30 bg-red-500/10 mb-8 backdrop-blur-sm">
                  <BrainCircuit className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-bold text-red-400 tracking-wider uppercase">AI-Powered Mobile Repair</span>
                </motion.div>
                
                <motion.h1 variants={fadeIn} className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-tight max-w-4xl text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                  Empowering Technicians with <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-500">AI Precision</span>
                </motion.h1>
                
                <motion.p variants={fadeIn} className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl font-medium leading-relaxed">
                  Global, intelligent, and secure. FixProHub is the all-in-one platform for mobile repair professionals to diagnose, repair, and secure smartphones with unmatched confidence.
                </motion.p>
                
                <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4 mb-20">
                  <button onClick={onGetStarted} className="px-8 py-4 rounded-full bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold shadow-[0_0_40px_rgba(239,68,68,0.4)] hover:scale-105 transition-transform flex items-center justify-center gap-2">
                    Get Started for Free <ArrowRight className="w-5 h-5" />
                  </button>
                  <button onClick={() => setActiveTab('services')} className="px-8 py-4 rounded-full bg-dark-800 border border-dark-600 text-white font-bold hover:bg-dark-700 transition flex items-center justify-center gap-2">
                    Watch How It Works
                  </button>
                </motion.div>
              </section>

              {/* Quick Testimonials Preview */}
              <section className="py-12 px-6 max-w-7xl mx-auto">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="glass-card p-10 border border-dark-600 rounded-3xl relative">
                    <div className="flex gap-1 mb-6 text-orange-400"><Star className="w-5 h-5 fill-current"/><Star className="w-5 h-5 fill-current"/><Star className="w-5 h-5 fill-current"/><Star className="w-5 h-5 fill-current"/><Star className="w-5 h-5 fill-current"/></div>
                    <p className="text-lg text-gray-300 italic mb-8">"FixProHub completely changed how my repair shop operates. The automated EFS backups alone have saved me from losing hundreds of dollars on bricked devices."</p>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-dark-600 flex items-center justify-center font-bold text-xl">A</div>
                      <div><div className="font-bold">Ahmed</div><div className="text-xs text-red-400">Lead Technician (UAE)</div></div>
                    </div>
                  </div>
                  <div className="glass-card p-10 border border-dark-600 rounded-3xl relative">
                    <div className="flex gap-1 mb-6 text-orange-400"><Star className="w-5 h-5 fill-current"/><Star className="w-5 h-5 fill-current"/><Star className="w-5 h-5 fill-current"/><Star className="w-5 h-5 fill-current"/><Star className="w-5 h-5 fill-current"/></div>
                    <p className="text-lg text-gray-300 italic mb-8">"As a beginner, I was terrified of flashing firmware. The AI diagnostics and pre-flash checks make me feel like I have a master technician standing right over my shoulder."</p>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-dark-600 flex items-center justify-center font-bold text-xl">S</div>
                      <div><div className="font-bold">Sarah</div><div className="text-xs text-red-400">Independent Tech (USA)</div></div>
                    </div>
                  </div>
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'services' && (
             <motion.div key="services" initial="hidden" animate="visible" exit="exit" variants={stagger} className="pt-16 pb-24 px-6 max-w-7xl mx-auto">
               <motion.div variants={fadeIn} className="text-center mb-16">
                 <h2 className="text-4xl md:text-5xl font-black mb-4">Our Services & Features</h2>
                 <p className="text-gray-400 max-w-2xl mx-auto">Comprehensive solutions designed to end the "hardware vs. software" debate and supercharge your repair shop.</p>
               </motion.div>

               <motion.div variants={fadeIn} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-24">
                {[
                  { icon: ShieldCheck, title: 'Pre-Flash Safety', desc: 'Automatically cross-references compatibility and enforces rollback prevention before flashing to prevent bricking.' },
                  { icon: HardDrive, title: 'Critical Backups', desc: 'Enjoy peace of mind with automatic backups of EFS, NVRAM, and Modem files before major operations.' },
                  { icon: BrainCircuit, title: 'AI Diagnostics', desc: 'Upload error logs and let the AI pinpoint the exact root cause of specific device failures instantly.' },
                  { icon: Database, title: '500+ Solutions', desc: 'Access highly verified step-by-step repair cases covering a massive global range of smartphone models.' },
                  { icon: Cpu, title: 'Firmware Analysis', desc: 'Stops you from hunting for files. We analyze the connected device and recommend the exact safest firmware.' },
                  { icon: Lock, title: 'Military Security', desc: 'AES-256 encryption, cryptographic request signing, and complete tamper-evident audit logs.' },
                ].map((feature, idx) => (
                  <div key={idx} className="p-8 rounded-3xl bg-dark-800/40 border border-white/5 hover:border-red-500/30 transition-colors group">
                    <div className="w-12 h-12 rounded-2xl bg-dark-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <feature.icon className="w-6 h-6 text-red-400" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
                  </div>
                ))}
              </motion.div>

              <motion.div variants={fadeIn} className="mb-24">
                <h3 className="text-3xl font-black mb-10 text-center">How It Works</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="border border-dark-600 rounded-3xl p-8 relative overflow-hidden bg-dark-800/20">
                    <div className="text-7xl font-black text-red-500/10 absolute -top-4 -right-4">1</div>
                    <TerminalSquare className="w-10 h-10 text-red-400 mb-6 relative z-10" />
                    <h4 className="text-xl font-bold mb-4 relative z-10">Connect & Diagnose</h4>
                    <p className="text-gray-400 relative z-10">Detect the device automatically. FixProHub's AI scans system logs, baseband, and partition table to identify hidden faults.</p>
                  </div>
                  <div className="border border-dark-600 rounded-3xl p-8 relative overflow-hidden bg-dark-800/20">
                     <div className="text-7xl font-black text-orange-500/10 absolute -top-4 -right-4">2</div>
                     <Zap className="w-10 h-10 text-orange-400 mb-6 relative z-10" />
                    <h4 className="text-xl font-bold mb-4 relative z-10">Get Smart Recommendations</h4>
                    <p className="text-gray-400 relative z-10">Access instant, verified repair steps. If flash is needed, the system auto-runs pre-flash compatibility and secures backups.</p>
                  </div>
                  <div className="border border-dark-600 rounded-3xl p-8 relative overflow-hidden bg-dark-800/20">
                     <div className="text-7xl font-black text-red-500/10 absolute -top-4 -right-4">3</div>
                     <ShieldCheck className="w-10 h-10 text-red-400 mb-6 relative z-10" />
                    <h4 className="text-xl font-bold mb-4 relative z-10">Execute with Confidence</h4>
                    <p className="text-gray-400 relative z-10">Apply the solution safely. With real-time security layers, execute operations knowing we're actively preventing bricking scenarios.</p>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={fadeIn} className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left">
                <div className="bg-dark-800/40 border border-white/5 p-10 rounded-3xl">
                   <h3 className="text-2xl font-bold mb-6 text-orange-400">For Beginners</h3>
                   <ul className="space-y-4">
                     <li className="flex gap-3"><ArrowRight className="w-5 h-5 text-gray-500 shrink-0"/> <div><strong>Zero Guesswork:</strong> Follow guided, AI-validated repair methods instead of risky forum advice.</div></li>
                     <li className="flex gap-3"><ArrowRight className="w-5 h-5 text-gray-500 shrink-0"/> <div><strong>Safe Learning Curve:</strong> Built-in safeguards prevent catastrophic errors like accidental firm updates or IMEI loss.</div></li>
                     <li className="flex gap-3"><ArrowRight className="w-5 h-5 text-gray-500 shrink-0"/> <div><strong>Instant Knowledge:</strong> Tap into a database of 500+ successful cases on day one.</div></li>
                   </ul>
                </div>
                <div className="bg-dark-800/40 border border-white/5 p-10 rounded-3xl">
                   <h3 className="text-2xl font-bold mb-6 text-red-400">For Professionals</h3>
                   <ul className="space-y-4">
                     <li className="flex gap-3"><ArrowRight className="w-5 h-5 text-gray-500 shrink-0"/> <div><strong>Maximized Efficiency:</strong> Cut diagnostic time in half. Automate the tedious backup and firmware-matching.</div></li>
                     <li className="flex gap-3"><ArrowRight className="w-5 h-5 text-gray-500 shrink-0"/> <div><strong>Advanced Capabilities:</strong> Safely perform complex maneuvers ensuring you never lose client partitions.</div></li>
                     <li className="flex gap-3"><ArrowRight className="w-5 h-5 text-gray-500 shrink-0"/> <div><strong>Scalability:</strong> Manage operations and track repair history across your shop with confidence.</div></li>
                   </ul>
                </div>
              </motion.div>

             </motion.div>
          )}

          {activeTab === 'about' && (
             <motion.div key="about" initial="hidden" animate="visible" exit="exit" variants={stagger} className="pt-16 pb-24 px-6 max-w-4xl mx-auto">
               <motion.div variants={fadeIn} className="text-center mb-16">
                 <h2 className="text-4xl md:text-5xl font-black mb-6">About FixProHub</h2>
                 <p className="text-xl text-gray-400">The Ultimate AI-Powered Mobile Repair Platform</p>
               </motion.div>

               <motion.div variants={fadeIn} className="prose prose-invert prose-lg max-w-none text-gray-300 leading-relaxed space-y-8">
                 <p>
                  At FixProHub, we believe that advanced smartphone repair shouldn't be a guessing game. Born from the need to bridge the gap between complex hardware issues and intricate software bugs, FixProHub leverages cutting-edge Artificial Intelligence to simplify the repair process.
                 </p>
                 <div className="p-8 border-l-4 border-red-500 bg-red-500/5 my-10 rounded-r-2xl italic text-xl">
                   "We are your intelligent assistant in the digital repair age."
                 </div>
                 <p>
                   Whether you're a beginner learning the ropes or a seasoned expert handling complex firmware operations, our platform is designed to make your daily operations safer, faster, and more profitable.
                 </p>
               </motion.div>

               <motion.div variants={fadeIn} className="mt-20">
                 <h3 className="text-2xl font-bold mb-6">Security You Can Trust</h3>
                 <p className="text-gray-400 mb-8">Security isn't just a feature; it's our foundation. We protect your workspace with:</p>
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                   <div className="p-6 border border-dark-600 rounded-2xl bg-dark-800/30">
                     <Lock className="w-8 h-8 text-red-400 mb-4" />
                     <div className="font-bold mb-2">AES-256 Encryption</div>
                     <div className="text-sm text-gray-400">The global standard for securing sensitive user data and repair logs.</div>
                   </div>
                   <div className="p-6 border border-dark-600 rounded-2xl bg-dark-800/30">
                     <ShieldCheck className="w-8 h-8 text-red-400 mb-4" />
                     <div className="font-bold mb-2">Tamper-Proof Logs</div>
                     <div className="text-sm text-gray-400">A comprehensive trail of every operation performed, ensuring transparency.</div>
                   </div>
                   <div className="p-6 border border-dark-600 rounded-2xl bg-dark-800/30">
                     <AlertTriangle className="w-8 h-8 text-red-400 mb-4" />
                     <div className="font-bold mb-2">Request Signing</div>
                     <div className="text-sm text-gray-400">Eliminates Man-in-the-Middle (MITM) attacks for secure execution environments.</div>
                   </div>
                 </div>
               </motion.div>
             </motion.div>
          )}

          {activeTab === 'contact' && (
             <motion.div key="contact" initial="hidden" animate="visible" exit="exit" variants={stagger} className="pt-16 pb-24 px-6 max-w-5xl mx-auto">
               <motion.div variants={fadeIn} className="text-center mb-16">
                 <h2 className="text-4xl md:text-5xl font-black mb-6">Contact Us</h2>
                 <p className="text-xl text-gray-400">Have questions? Our global support team is ready to assist you.</p>
               </motion.div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                 <motion.div variants={fadeIn} className="space-y-8">
                   <div className="flex items-start gap-6 p-6 border border-dark-600 rounded-3xl bg-dark-800/30">
                     <div className="w-14 h-14 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center shrink-0">
                       <Mail className="w-6 h-6" />
                     </div>
                     <div>
                       <h3 className="text-xl font-bold mb-2">Email Us</h3>
                       <p className="text-gray-400 mb-2">Drop us an email anytime and we will get back to you within 24 hours.</p>
                       <a href="mailto:support@fixprohub.com" className="text-red-400 font-bold hover:underline">support@fixprohub.com</a>
                     </div>
                   </div>

                   <div className="flex items-start gap-6 p-6 border border-dark-600 rounded-3xl bg-dark-800/30">
                     <div className="w-14 h-14 bg-orange-500/10 text-orange-500 rounded-2xl flex items-center justify-center shrink-0">
                       <Phone className="w-6 h-6" />
                     </div>
                     <div>
                       <h3 className="text-xl font-bold mb-2">Phone Support</h3>
                       <p className="text-gray-400 mb-2">Available 24/7 for urgent technical assistance and queries.</p>
                       <a href="tel:+1800FIXPRO" className="text-orange-400 font-bold hover:underline">+1-800-FIX-PRO</a>
                     </div>
                   </div>

                   <div className="flex items-start gap-6 p-6 border border-dark-600 rounded-3xl bg-dark-800/30">
                     <div className="w-14 h-14 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center shrink-0">
                       <MessageSquare className="w-6 h-6" />
                     </div>
                     <div>
                       <h3 className="text-xl font-bold mb-2">Community Forum</h3>
                       <p className="text-gray-400 mb-2">Join our active Discord community to connect with other technicians worldwide.</p>
                       <button className="text-blue-400 font-bold hover:underline">Join Discord Server</button>
                     </div>
                   </div>
                 </motion.div>

                 <motion.div variants={fadeIn} className="glass-card p-10 border border-dark-600 rounded-3xl">
                   <h3 className="text-2xl font-bold mb-6">Send us a message</h3>
                   <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                     <div className="grid grid-cols-2 gap-4">
                       <div>
                         <label className="block text-sm text-gray-400 mb-2">First Name</label>
                         <input type="text" className="w-full bg-dark-900 border border-dark-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition" placeholder="John" />
                       </div>
                       <div>
                         <label className="block text-sm text-gray-400 mb-2">Last Name</label>
                         <input type="text" className="w-full bg-dark-900 border border-dark-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition" placeholder="Doe" />
                       </div>
                     </div>
                     <div>
                       <label className="block text-sm text-gray-400 mb-2">Email Address</label>
                       <input type="email" className="w-full bg-dark-900 border border-dark-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition" placeholder="john@example.com" />
                     </div>
                     <div>
                       <label className="block text-sm text-gray-400 mb-2">Message</label>
                       <textarea rows={4} className="w-full bg-dark-900 border border-dark-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition resize-none" placeholder="How can we help you?"></textarea>
                     </div>
                     <button className="w-full py-4 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold hover:scale-[1.02] transition-transform">
                       Send Message
                     </button>
                   </form>
                 </motion.div>
               </div>
             </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer CTA always visible before actual footer? Actually let's put it at the very bottom */}
      <footer className="relative z-10 border-t border-dark-700 bg-dark-950 px-6 py-12 text-center mt-auto">
        <h2 className="text-3xl font-black mb-4">Stop Guessing. Start Repairing with AI.</h2>
        <p className="text-gray-400 mb-8 max-w-xl mx-auto">Join thousands of global technicians who are repairing smarter, faster, and safer with FixProHub.</p>
        <div className="flex justify-center gap-4">
          <button onClick={onGetStarted} className="px-8 py-3 rounded-full bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:scale-105 transition-transform">
            Start Your 14-Day Free Trial
          </button>
          <button className="px-8 py-3 rounded-full bg-dark-800 border border-dark-600 text-white font-bold hover:bg-dark-700 transition">
            View Pricing Plans
          </button>
        </div>
      </footer>

    </div>
  )
}

