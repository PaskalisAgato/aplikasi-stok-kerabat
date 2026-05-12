import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../../shared/Layout';
import { ModernTable } from '../../shared/components/ModernTable';
import { TemplateEditor } from './components/TemplateEditor';
import { VoucherGenerator } from './components/VoucherGenerator';
import { ScanValidator } from './components/ScanValidator';

// --- Types ---
type View = 'dashboard' | 'editor' | 'generator' | 'scan' | 'history';

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
    <div className="flex flex-col items-center justify-center py-20 gap-4 animate-pulse">
      <div className="size-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Sinkronisasi Data...</p>
    </div>
  );

  const stats = [
    { label: 'Total Issued', value: data?.overview?.total || 0, icon: 'database', trend: '+12% minggu ini' },
    { label: 'Redemptions', value: data?.overview?.redeemed || 0, icon: 'check_circle', trend: 'Conversion: ' + (data?.overview?.conversionRate || 0).toFixed(1) + '%' },
    { label: 'Revenue Generated', value: 'Rp ' + (data?.impact?.totalRevenue || 0).toLocaleString(), icon: 'payments', trend: 'ROI: ' + (data?.impact?.roi || 0) + 'x' },
    { label: 'Active Codes', value: data?.overview?.unused || 0, icon: 'schedule', trend: 'Segera berakhir: ' + (data?.overview?.expired || 0) },
  ];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card group relative overflow-hidden"
          >
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all" />
            <div className="flex items-center gap-4 mb-4">
              <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined font-black text-2xl">{stat.icon}</span>
              </div>
              <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">{stat.label}</p>
            </div>
            <h3 className="text-3xl font-display font-black tracking-tight text-[var(--text-main)]">{stat.value}</h3>
            <p className="mt-2 text-[10px] font-bold text-primary group-hover:opacity-100 transition-opacity uppercase tracking-widest">{stat.trend}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Batches Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <div>
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-1">Audit Trail</p>
              <h3 className="text-2xl font-black font-display tracking-tight text-[var(--text-main)] uppercase">Recent Batches</h3>
            </div>
            <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:translate-x-1 transition-transform flex items-center gap-2">
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          
          <ModernTable
            columns={[
              { 
                header: 'Batch Details', 
                render: (item) => (
                  <div>
                    <p className="text-sm font-black uppercase text-[var(--text-main)]">Promo Ramadhan Berkah {item.id}</p>
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">ID: BCH-928{item.id}</p>
                  </div>
                ) 
              },
              { 
                header: 'Quantity', 
                className: 'text-center',
                render: () => <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-mono font-black">500</span>
              },
              { 
                header: 'Date', 
                render: (item) => <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">1{item.id} Mei 2026</span>
              },
              { 
                header: 'Status', 
                className: 'text-right',
                render: () => (
                  <span className="px-3 py-1 rounded-full bg-[var(--success)]/10 text-[var(--success)] text-[10px] font-black uppercase tracking-tighter border border-[var(--success)]/20">
                    Active
                  </span>
                )
              }
            ]}
            data={[ {id: 1}, {id: 2}, {id: 3}, {id: 4}, {id: 5} ]}
          />
        </div>

        {/* Top Templates */}
        <div className="space-y-6">
          <div>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-1">Performance</p>
            <h3 className="text-2xl font-black font-display tracking-tight text-[var(--text-main)] uppercase">Top Templates</h3>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="p-6 card flex items-center gap-5 group cursor-pointer hover:border-primary/20 transition-all border-white/5">
                <div className="size-16 rounded-[1.75rem] bg-primary/5 flex items-center justify-center border border-primary/10 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                  <span className="material-symbols-outlined font-black text-2xl">layers</span>
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-[11px] font-black uppercase tracking-widest text-[var(--text-main)] truncate">Premium Cafe Promo v{i+1}</p>
                  <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em]">Digunakan di 12 batch</p>
                </div>
                <button className="size-10 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all flex items-center justify-center">
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
      case 'history': return (
        <div className="flex flex-col items-center justify-center py-40 glass rounded-[4rem] border-dashed border-2 border-primary/10">
          <span className="material-symbols-outlined text-6xl text-primary/20 mb-6">history</span>
          <h2 className="text-2xl font-display font-black text-primary/30 uppercase tracking-[0.5em]">Audit Logs & History</h2>
        </div>
      );
      default: return <DashboardView />;
    }
  };

  const getTitle = () => {
    switch(currentView) {
      case 'dashboard': return 'Voucher Overview';
      case 'editor': return 'Visual Designer';
      case 'generator': return 'Voucher Factory';
      case 'scan': return 'Vault Entry';
      default: return 'Transaction Logs';
    }
  };

  return (
    <Layout 
      currentPort={5201}
      title={getTitle()}
      subtitle="Enterprise Marketing Suite"
    >
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
    </Layout>
  );
};

export default App;
