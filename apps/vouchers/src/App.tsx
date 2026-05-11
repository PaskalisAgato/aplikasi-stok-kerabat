import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Ticket, 
  Settings, 
  MousePointer2, 
  History, 
  Plus, 
  QrCode, 
  ArrowRight, 
  Search,
  Filter,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  Menu,
  X,
  Database,
  Layers,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TemplateEditor } from './components/TemplateEditor';
import { VoucherGenerator } from './components/VoucherGenerator';
import { ScanValidator } from './components/ScanValidator';

// --- Types ---
type View = 'dashboard' | 'editor' | 'generator' | 'scan' | 'history';

// --- Components ---

const Sidebar = ({ currentView, setView }: { currentView: View, setView: (v: View) => void }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'editor', label: 'Template Editor', icon: MousePointer2 },
    { id: 'generator', label: 'Generate Bulk', icon: Ticket },
    { id: 'scan', label: 'Scan Validator', icon: QrCode },
    { id: 'history', label: 'History Batches', icon: History },
  ];

  return (
    <div className="w-72 h-screen border-r border-white/5 flex flex-col p-6 sticky top-0 hidden lg:flex bg-[#0a0a0a]">
      <div className="flex items-center gap-3 mb-12">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
          <Ticket className="w-6 h-6 text-black" />
        </div>
        <div>
          <h2 className="font-outfit font-bold text-lg tracking-tight">VoucherPRO</h2>
          <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-medium">Enterprise Edition</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id as View)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                isActive 
                  ? 'bg-white text-black font-semibold shadow-[0_0_20px_rgba(255,255,255,0.1)]' 
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-black' : 'text-white/40 group-hover:text-white'}`} />
              <span className="text-sm">{item.label}</span>
              {isActive && (
                <motion.div 
                  layoutId="active-pill" 
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-black" 
                />
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto p-4 glass rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-[10px] font-bold text-indigo-400">
            ADMIN
          </div>
          <div className="truncate">
            <p className="text-xs font-semibold truncate">Premium Account</p>
            <p className="text-[10px] text-white/40">v1.2.0-stable</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Header = ({ title }: { title: string }) => {
  return (
    <header className="h-20 flex items-center justify-between px-8 border-b border-white/5 bg-[#050505]/50 backdrop-blur-xl sticky top-0 z-30">
      <div>
        <h1 className="text-2xl font-outfit font-bold tracking-tight">{title}</h1>
        <div className="flex items-center gap-2 text-[10px] text-white/30 uppercase tracking-widest mt-1">
          <span>Stok Kerabat</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-white/60">Voucher Management</span>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-white/60 transition-colors" />
          <input 
            type="text" 
            placeholder="Search vouchers..." 
            className="bg-white/5 border border-white/5 rounded-full py-2 pl-10 pr-6 text-sm focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all w-64"
          />
        </div>
        <button className="p-2 hover:bg-white/5 rounded-full transition-colors relative">
          <div className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full border-2 border-black" />
          <div className="w-5 h-5 flex flex-col gap-1 items-end justify-center">
            <div className="w-5 h-0.5 bg-white/60 rounded-full" />
            <div className="w-3 h-0.5 bg-white/60 rounded-full" />
          </div>
        </button>
      </div>
    </header>
  );
};

// --- View: Dashboard ---
const DashboardView = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/vouchers/analytics')
      .then(res => res.json())
      .then(json => {
        if (json.success) setData(json.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="p-8 space-y-8 flex flex-col items-center justify-center min-h-[60vh]">
      <motion.div 
        animate={{ rotate: 360 }} 
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-12 h-12 border-4 border-white/5 border-t-white rounded-full"
      />
      <p className="text-white/20 uppercase tracking-widest text-[10px] font-black">Syncing Marketing Vault...</p>
    </div>
  );

  const stats = [
    { label: 'Total Issued', value: data?.overview?.total || 0, icon: Database, trend: '+12% this week' },
    { label: 'Redemptions', value: data?.overview?.redeemed || 0, icon: CheckCircle2, trend: 'Conversion: ' + (data?.overview?.conversionRate || 0).toFixed(1) + '%' },
    { label: 'Revenue Generated', value: 'Rp ' + (data?.impact?.totalRevenue || 0).toLocaleString(), icon: FileText, trend: 'ROI: ' + (data?.impact?.roi || 0) + 'x' },
    { label: 'Active Codes', value: data?.overview?.unused || 0, icon: Clock, trend: 'Expires soon: ' + (data?.overview?.expired || 0) },
  ];

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 rounded-[2.5rem] glass hover:border-white/20 transition-all group relative overflow-hidden"
          >
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all" />
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-2xl bg-white/5 text-white/60 group-hover:text-white transition-colors">
                <stat.icon className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-white/30 uppercase tracking-widest">{stat.label}</p>
            </div>
            <h3 className="text-3xl font-outfit font-black tracking-tight">{stat.value}</h3>
            <p className="mt-2 text-[10px] font-bold text-white/20 group-hover:text-white/40 transition-colors">{stat.trend}</p>
          </motion.div>
        ))}
      </div>

      {/* Analytics Chart & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 p-8 rounded-[3rem] glass border-white/5 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-outfit font-black tracking-tight">Redemption Velocity</h3>
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Daily performance over last 30 days</p>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 rounded-xl bg-white/5 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all">Month</button>
              <button className="px-4 py-2 rounded-xl bg-white text-black text-[10px] font-bold uppercase tracking-widest">Week</button>
            </div>
          </div>

          <div className="h-64 flex items-end gap-2 px-2">
            {(data?.dailyRedemptions || Array.from({length: 14})).map((day: any, i: number) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full relative">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: day ? (day.count * 10) + '%' : '10%' }}
                    className="w-full bg-gradient-to-t from-white/5 to-white/20 rounded-t-lg group-hover:from-white/10 group-hover:to-white transition-all relative"
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white text-black px-2 py-1 rounded text-[10px] font-black">{day?.count || 0}</div>
                  </motion.div>
                </div>
                <span className="text-[8px] font-bold text-white/20 uppercase tracking-tighter truncate w-full text-center">
                  {day?.date ? new Date(day.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : '---'}
                </span>
              </div>
            ))}
          </div>
        </div>
        {/* Main Table Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-outfit font-bold">Recent Batches</h3>
            <button className="text-sm text-white/40 hover:text-white transition-colors flex items-center gap-2">
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="rounded-3xl glass overflow-hidden border border-white/5">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 text-[10px] uppercase tracking-widest text-white/40 font-bold border-b border-white/5">
                  <th className="px-6 py-4">Batch Name</th>
                  <th className="px-6 py-4 text-center">Qty</th>
                  <th className="px-6 py-4">Created At</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[1,2,3,4,5].map((_, i) => (
                  <tr key={i} className="group hover:bg-white/[0.02] transition-colors cursor-pointer">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-semibold group-hover:text-white transition-colors">Promo Ramadhan Berkah {i+1}</p>
                        <p className="text-xs text-white/30">ID: BCH-928{i}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-3 py-1 rounded-full bg-white/5 text-xs font-mono">500</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-white/40 font-mono">1{i} Mei 2026</td>
                    <td className="px-6 py-4 text-right">
                      <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-[10px] font-bold uppercase tracking-tighter border border-green-500/20">Active</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar Mini List */}
        <div className="space-y-6">
          <h3 className="text-xl font-outfit font-bold">Top Templates</h3>
          <div className="space-y-4">
            {[1,2,3].map((_, i) => (
              <div key={i} className="p-4 rounded-3xl glass flex items-center gap-4 group cursor-pointer hover:border-white/20 transition-all">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:border-white/30 transition-all">
                  <Layers className="w-8 h-8 text-white/20 group-hover:text-white/60 transition-all" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-bold truncate">Premium Cafe Promo v{i+1}</p>
                  <p className="text-xs text-white/30">Used in 12 batches</p>
                </div>
                <button className="p-2 rounded-full bg-white/5 text-white/40 group-hover:bg-white group-hover:text-black transition-all">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---
const App = () => {
  const [currentView, setView] = useState<View>('dashboard');
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view') as View;
    if (viewParam && ['dashboard', 'editor', 'generator', 'scan', 'history'].includes(viewParam)) {
      setView(viewParam);
    }
  }, []);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <DashboardView />;
      case 'editor': return <TemplateEditor />;
      case 'generator': return <VoucherGenerator />;
      case 'scan': return <ScanValidator />;
      case 'history': return <div className="p-8 text-center py-40 border-4 border-dashed border-white/5 rounded-[4rem] mx-8"><History className="w-20 h-20 text-white/5 mx-auto mb-6" /><h2 className="text-2xl font-outfit font-bold opacity-30 uppercase tracking-widest leading-loose">Audit Logs & History</h2></div>;
      default: return <DashboardView />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#050505] text-white/90 selection:bg-white selection:text-black">
      <Sidebar currentView={currentView} setView={setView} />
      <main className="flex-1 min-w-0 flex flex-col bg-gradient-to-br from-[#0c0c0c] to-[#050505]">
        <Header title={
          currentView === 'dashboard' ? 'Overview' : 
          currentView === 'editor' ? 'Visual Designer' : 
          currentView === 'generator' ? 'Voucher Factory' : 
          currentView === 'scan' ? 'Vault Entry' : 'Transaction Logs'
        } />
        
        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default App;
