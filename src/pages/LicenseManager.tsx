import React, { useState } from 'react';
import { Key, Monitor, ShieldAlert, Zap, RefreshCw, Power } from 'lucide-react';

const LicenseManager: React.FC = () => {
  const [licenseKey] = useState('FIXPRO-LIFETIME-XXXX-9921');
  const [hwid] = useState('8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92');
  const [status] = useState('Active');
  const [resetsLeft] = useState(3);

  return (
    <div className="p-8 pb-32 w-full max-w-6xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
      
      {/* Header section with Neon Accents */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-blue-500 drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
            License & Security Manager
          </h1>
          <p className="text-gray-400 mt-2 font-mono text-sm">
            Manage your hardware binding and active SaaS subscription.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
          </span>
          <span className="text-green-400 font-bold tracking-widest text-sm uppercase">Secure Connection</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* License Card */}
        <div className="glass-card p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-500"></div>
          <div className="flex items-center gap-4 mb-6 relative z-10">
            <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-500/30">
              <Key className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-200">Active License</h3>
              <p className="text-sm text-blue-400 font-medium">{status} (Lifetime Plan)</p>
            </div>
          </div>
          <div className="space-y-2 relative z-10">
            <label className="text-xs text-gray-500 uppercase font-bold tracking-wider">License Key</label>
            <div className="p-3 bg-gray-900/80 border border-gray-800 rounded-lg flex justify-between items-center group-hover:border-blue-500/40 transition-colors">
              <code className="text-sm font-mono text-gray-300">{licenseKey}</code>
            </div>
          </div>
        </div>

        {/* HWID Binding Card */}
        <div className="glass-card p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl group-hover:bg-orange-500/20 transition-all duration-500"></div>
          <div className="flex items-center gap-4 mb-6 relative z-10">
            <div className="p-3 bg-orange-500/20 rounded-xl border border-orange-500/30">
              <Monitor className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-200">Hardware Bound (HWID)</h3>
              <p className="text-sm text-gray-400 font-medium">1 PC Allowed</p>
            </div>
          </div>
          <div className="space-y-2 relative z-10">
            <label className="text-xs text-gray-500 uppercase font-bold tracking-wider">Current Machine HWID (SHA-256)</label>
            <div className="p-3 bg-gray-900/80 border border-gray-800 rounded-lg group-hover:border-orange-500/40 transition-colors">
              <code className="text-xs font-mono text-gray-400 break-all">{hwid}</code>
            </div>
          </div>
        </div>

        {/* Actions Card */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-5 h-5 text-yellow-400" />
              <h3 className="text-lg font-bold text-gray-200">Actions</h3>
            </div>
            <p className="text-sm text-gray-400 font-medium mb-6">
              You have <span className="text-white font-bold">{resetsLeft} HWID resets</span> left for this year.
            </p>
          </div>
          <div className="space-y-3">
            <button className="w-full py-3 px-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-blue-500/50 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-white transition-all shadow-lg">
              <RefreshCw className="w-4 h-4" />
              Reset HWID Binding
            </button>
            <button className="w-full py-3 px-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/60 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-red-400 transition-all">
              <Power className="w-4 h-4" />
              Revoke Unauthorized Desktop
            </button>
          </div>
        </div>

      </div>

      <div className="glass-card mt-8 p-6 overflow-hidden">
        <h3 className="text-lg font-bold text-gray-200 mb-6 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-purple-400" />
          Recent Security Logs
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left font-mono">
            <thead className="text-xs text-gray-500 uppercase bg-gray-900/50">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg">Event Type</th>
                <th className="px-4 py-3">IP Address</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3 rounded-tr-lg">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              <tr className="hover:bg-gray-800/30 transition-colors">
                <td className="px-4 py-4 text-blue-400">Desktop Login Success</td>
                <td className="px-4 py-4 text-gray-300">192.168.1.45</td>
                <td className="px-4 py-4 text-gray-500">2 Mins Ago</td>
                <td className="px-4 py-4"><span className="px-2 py-1 bg-green-500/10 text-green-400 rounded text-xs">AUTHORIZED</span></td>
              </tr>
              <tr className="hover:bg-gray-800/30 transition-colors">
                <td className="px-4 py-4 text-orange-400">HWID Mismatch Blocked</td>
                <td className="px-4 py-4 text-gray-300">104.28.14.99</td>
                <td className="px-4 py-4 text-gray-500">Yesterday</td>
                <td className="px-4 py-4"><span className="px-2 py-1 bg-red-500/10 text-red-400 rounded text-xs">BLOCKED</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LicenseManager;
