import React, { useState, useEffect } from 'react';
import { apiClient } from '@shared/apiClient';
import Layout from '@shared/Layout';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import DailyReportCard from './components/DailyReportCard';

const COLORS = ['#c24b30', '#3c2a21', '#606c38', '#bc6c25', '#dda15e'];
// Terracotta, Espresso, Moss, Sienna, Sand

function App() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const getJakartaDate = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(d);
  const todayWib = getJakartaDate(new Date());
  const [customRange, setCustomRange] = useState({ start: todayWib, end: todayWib });
  const [reports, setReports] = useState([]);
  const [isReportsLoading, setIsReportsLoading] = useState(false);

  // Uang Masuk Owner state
  const [incomes, setIncomes] = useState([]);
  const [incomeForm, setIncomeForm] = useState({ title: '', amount: '', source: 'OWNER', incomeDate: todayWib, notes: '' });
  const [isSubmittingIncome, setIsSubmittingIncome] = useState(false);

  const fetchData = async () => {
    if (!customRange.start || !customRange.end) return;
    try {
      setIsLoading(true);
      setError(null);
      const params = { startDate: customRange.start, endDate: customRange.end };
      const response = await apiClient.getAnalyticsDashboard(params);
      setData(response.data);
      fetchReports();
      fetchOwnerIncome();
    } catch (error) {
      console.error('Failed to fetch analytics', error);
      setError('Gagal memuat data dashboard. Silakan periksa koneksi internet Anda dan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReports = async () => {
    if (!customRange.start || !customRange.end) return;
    try {
      setIsReportsLoading(true);
      const response = await apiClient.getShiftReports({ startDate: customRange.start, endDate: customRange.end });
      setReports(response.data || []);
    } catch (error) {
      console.error('Failed to fetch reports', error);
      setReports([]);
    } finally {
      setIsReportsLoading(false);
    }
  };

  const fetchOwnerIncome = async () => {
    if (!customRange.start || !customRange.end) return;
    try {
      const response = await apiClient.getOwnerIncome({ startDate: customRange.start, endDate: customRange.end });
      setIncomes(response.data || []);
    } catch (error) {
      console.error('Failed to fetch incomes', error);
      setIncomes([]);
    }
  };

  const handleIncomeSubmit = async (e) => {
    e.preventDefault();
    if (!incomeForm.title || !incomeForm.amount) return alert('Pastikan judul dan nominal terisi.');
    try {
      setIsSubmittingIncome(true);
      await apiClient.addOwnerIncome(incomeForm);
      setIncomeForm(prev => ({ ...prev, title: '', amount: '', notes: '' }));
      fetchOwnerIncome(); // Refresh data
    } catch (error) {
      alert('Gagal mencatat uang masuk: ' + error.message);
    } finally {
      setIsSubmittingIncome(false);
    }
  };

  const handleDeleteIncome = async (id) => {
    if (!window.confirm('Yakin ingin menghapus data uang masuk ini?')) return;
    try {
      await apiClient.deleteOwnerIncome(id);
      fetchOwnerIncome();
    } catch (error) {
      alert('Gagal menghapus uang masuk: ' + error.message);
    }
  };

  const handleDeleteReport = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus laporan shift ini? Tindakan ini tidak dapat dibatalkan.')) return;
    
    try {
      await apiClient.deleteCashierShift(id);
      setReports(prev => prev.filter(r => r.id !== id));
      // Also refresh dashboard data since sales might be affected if shift was active
      fetchData();
    } catch (error) {
      alert('Gagal menghapus laporan: ' + error.message);
    }
  };

  const exportToCSV = (reportsOrReport) => {
    const headers = ['Tanggal', 'Periode', 'Kasir', 'Status', 'Mulai', 'Penjualan', 'Pengeluaran', 'Laci Kasir', 'Profit', 'Transaksi'];
    const formatCSVField = (val) => {
      if (val === null || val === undefined) return '';
      const str = val.toString();
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const downloadCSV = (dataReports, filename) => {
      const rows = dataReports.map(r => [
        r.date, 
        `${r.startTime}-${r.endTime}`,
        r.cashierName,
        r.status,
        r.initialCash,
        r.totalSales,
        r.totalExpenses,
        r.cashDrawer,
        r.profit,
        r.totalTransactions
      ]);

      const csvRows = [
        headers.map(formatCSVField).join(','),
        ...rows.map(row => row.map(formatCSVField).join(','))
      ].join('\n');

      const blob = new Blob(['\uFEFF' + csvRows], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };

    if (Array.isArray(reportsOrReport)) {
      if (reportsOrReport.length === 0) return;
      downloadCSV(reportsOrReport, `Laporan_Harian_Kerabat_${new Date().toISOString().split('T')[0]}.csv`);
    } else {
      downloadCSV([reportsOrReport], `Laporan_Shift_${reportsOrReport.cashierName}_${reportsOrReport.date}.csv`);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [customRange]);

  const summary = data?.summary || {};
  const hourlySales = data?.hourlySales || [];
  const topProducts = data?.topProducts || [];
  const paymentMethods = data?.paymentMethods || [];
  const cashierPerformance = data?.cashierPerformance || [];
  const alerts = data?.alerts || [];
  const expenses = data?.expenses || { total: 0, recent: [] };

  // Prepare chart data with useMemo to avoid re-calculating on every render
  const chartData = React.useMemo(() => {
    return Array.from({ length: 24 }).map((_, i) => {
      const found = hourlySales.find(h => parseInt(h.hour) === i);
      return {
        hour: `${i}:00`,
        total: found ? parseFloat(found.total) : 0
      };
    });
  }, [hourlySales]);

  const pieData = React.useMemo(() => {
    return paymentMethods.map(pm => ({
      name: pm.method,
      value: parseFloat(pm.total)
    }));
  }, [paymentMethods]);

  return (
    <Layout 
      currentPort={5173} 
      title="Dashboard" 
      subtitle="BUSINESS ANALYTICS"
      headerExtras={
        <div className="flex items-center gap-3">
          <div className="hidden xs:flex flex-col items-end mr-3">
            <span className="text-[9px] font-black uppercase text-primary tracking-[0.2em] opacity-80 leading-none">System Status</span>
            <span className="text-[10px] font-black text-[var(--text-main)] uppercase tracking-widest leading-none mt-1">Live Feed</span>
          </div>
          <button 
            onClick={fetchData} 
            disabled={isLoading}
            className="size-11 flex items-center justify-center rounded-2xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all shadow-sm border border-primary/10 group"
          >
            <span className={`material-symbols-outlined font-black text-xl ${isLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'}`}>refresh</span>
          </button>
        </div>
      }
    >
      <div className="space-y-8 animate-in fade-in duration-500 pb-10">
        
        {/* HEADER: Filter & Refresh */}
        <div className="bg-white/5 p-4 rounded-[2.5rem] border border-white/5 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Tombol Hari */}
            <button
              onClick={() => {
                const today = getJakartaDate(new Date());
                setCustomRange({ start: today, end: today });
              }}
              className="shrink-0 py-2.5 px-5 rounded-2xl bg-primary text-slate-950 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/10 hover:bg-primary/90 active:scale-95 transition-all"
            >
              Hari Ini
            </button>

            {/* Date Range */}
            <div className="flex-1 flex items-center gap-2 w-full">
              <div className="flex-1">
                <p className="text-[8px] font-black uppercase opacity-30 mb-1 ml-1">Dari</p>
                <input
                  type="date"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 h-11 text-[11px] font-black text-[var(--text-main)] outline-none focus:border-primary cursor-pointer"
                  value={customRange.start}
                  onChange={(e) => setCustomRange(p => ({ ...p, start: e.target.value }))}
                />
              </div>
              <div className="flex-1">
                <p className="text-[8px] font-black uppercase opacity-30 mb-1 ml-1">Sampai</p>
                <input
                  type="date"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 h-11 text-[11px] font-black text-[var(--text-main)] outline-none focus:border-primary cursor-pointer"
                  value={customRange.end}
                  onChange={(e) => setCustomRange(p => ({ ...p, end: e.target.value }))}
                />
              </div>
            </div>

            {/* Sync Button */}
            <button
              onClick={fetchData}
              disabled={isLoading}
              className={`size-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all shrink-0 ${isLoading ? 'opacity-50' : ''}`}
            >
              <span className={`material-symbols-outlined text-xl ${isLoading ? 'animate-spin text-primary' : 'text-[var(--text-main)]/60'}`}>sync</span>
            </button>
          </div>
        </div>

        {isLoading && !data ? (
           <div className="flex flex-col items-center justify-center py-40">
              <div className="size-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-6"></div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Menganalisis Data Perusahaan...</p>
           </div>
        ) : (
          <>
            {/* 1. SUMMARY CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
              <SummaryCard title="Total Penjualan" value={summary.totalRevenue} icon="payments" color="text-[#bc6c25]" />
              <SummaryCard title="Uang Tunai" value={summary.cashRevenue} icon="payments" color="text-[#606c38]" />
              <SummaryCard title="Non Tunai" value={summary.nonCashRevenue} icon="credit_card" color="text-[#c24b30]" />
              <SummaryCard title="Total Transaksi" value={summary.totalTransactions} icon="shopping_cart" color="text-[#bc6c25]" suffix="Order" noCurrency />
              <SummaryCard title="Avg. Order" value={summary.avgOrderValue} icon="analytics" color="text-[#685634]" />
              <SummaryCard title="Pengeluaran" value={summary.totalExpenses} icon="shopping_bag" color="text-[#c24b30]" />
              <SummaryCard title="Profit Bersih" value={summary.grossProfit} icon="trending_up" color="text-primary" isHighlight />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* 2. MAIN CHART: HOURLY SALES */}
              <div className="lg:col-span-8 glass rounded-[2.5rem] p-8 border-white/5">
                <div className="flex justify-between items-center mb-10">
                  <div>
                    <h3 className="font-black uppercase tracking-[0.2em] text-xs text-primary opacity-60">Tren Penjualan Per Jam</h3>
                    <p className="text-[10px] font-bold text-primary mt-1">Berdasarkan Total Transaksi (WIB)</p>
                  </div>
                </div>
                <div className="h-[350px] w-full min-w-0 bg-white/[0.01] rounded-3xl overflow-hidden">
                  {chartData.some(d => d.total > 0) ? (
                    <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                        <XAxis 
                          dataKey="hour" 
                          stroke="#ffffff20" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false} 
                          dy={10}
                        />
                        <YAxis 
                          stroke="#ffffff20" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false}
                          tickFormatter={(v) => `Rp ${v/1000}k`}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold' }}
                          itemStyle={{ color: '#fbbf24' }}
                          formatter={(val) => [`Rp ${val.toLocaleString()}`, 'Penjualan']}
                        />
                        <Area type="monotone" dataKey="total" stroke="#fbbf24" strokeWidth={4} fillOpacity={1} fill="url(#colorTotal)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center opacity-20 gap-3">
                       <span className="material-symbols-outlined text-4xl">monitoring</span>
                       <p className="text-[10px] font-black uppercase tracking-widest">Belum ada aktivitas penjualan</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. PAYMENT BREAKDOWN (PIE CHART) */}
              <div className="lg:col-span-4 glass border-white/5 rounded-[2.5rem] p-8 flex flex-col items-center">
                <h3 className="font-black uppercase tracking-[0.2em] text-xs text-primary opacity-60 w-full mb-8">Metode Pembayaran</h3>
                <div className="h-[250px] w-full relative min-w-0">
                   {pieData.length > 0 ? (
                     <ResponsiveContainer width="100%" height="100%" minHeight={250}>
                       <PieChart>
                         <Pie
                           data={pieData}
                           cx="50%"
                           cy="50%"
                           innerRadius={60}
                           outerRadius={80}
                           paddingAngle={8}
                           dataKey="value"
                         >
                           {pieData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={4} />
                           ))}
                         </Pie>
                         <Tooltip 
                           contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', fontSize: '10px' }}
                         />
                       </PieChart>
                     </ResponsiveContainer>
                   ) : (
                      <div className="h-full w-full flex items-center justify-center opacity-10">
                         <span className="material-symbols-outlined text-5xl">pie_chart</span>
                      </div>
                   )}
                   <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                     <div className="text-center">
                        <p className="text-[10px] uppercase font-black opacity-40">Mix</p>
                        <p className="text-sm font-black text-[var(--text-main)]">{paymentMethods.length || 0} Cara</p>
                     </div>
                   </div>
                </div>
                <div className="w-full mt-6 space-y-2">
                   {pieData.map((d, i) => (
                     <div key={d.name} className="flex justify-between items-center text-[10px] font-black uppercase">
                       <div className="flex items-center gap-2">
                         <div className="size-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                         <span className="text-[var(--text-muted)] opacity-80">{d.name}</span>
                       </div>
                       <span className="text-[var(--text-main)]">Rp {d.value.toLocaleString()}</span>
                     </div>
                   ))}
                </div>
              </div>

              {/* 4. TOP PRODUCTS & CASHIER PERFORMANCE */}
              <div className="lg:col-span-8 glass border-white/5 rounded-[2.5rem] p-8">
                 <h3 className="font-black uppercase tracking-[0.2em] text-xs text-primary opacity-60 mb-8">5 Produk Terlaris</h3>
                 <div className="space-y-6">
                    {topProducts.map((p, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between items-end text-xs">
                          <p className="font-black text-[var(--text-main)] uppercase">{p.name}</p>
                          <p className="text-primary font-black uppercase tracking-tighter">{p.totalQty} terjual</p>
                        </div>
                        <div className="h-3 bg-white/5 rounded-full overflow-hidden flex">
                          <div 
                            className="bg-primary h-full transition-all duration-1000" 
                            style={{ width: `${(p.totalQty / topProducts[0].totalQty) * 100}%` }}
                          ></div>
                        </div>
                        <p className="text-[10px] font-bold opacity-40 text-right">Revenue: Rp {parseFloat(p.totalRevenue).toLocaleString()}</p>
                      </div>
                    ))}
                    {topProducts.length === 0 && <p className="text-center py-10 opacity-20 text-[10px] uppercase font-bold">Belum ada data penjualan</p>}
                 </div>
              </div>

              <div className="lg:col-span-4 space-y-6">
                  {/* CASHIER RANKING */}
                  <div className="glass border-white/5 rounded-[2.5rem] p-8">
                    <h3 className="font-black uppercase tracking-[0.2em] text-xs text-primary opacity-60 mb-6">Performa Kasir</h3>
                    <div className="space-y-4">
                      {cashierPerformance.map((c, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className={`text-xl font-black ${i === 0 ? 'text-primary' : 'opacity-20'}`}># {i + 1}</span>
                            <p className="text-[11px] font-black text-[var(--text-main)] uppercase">{c.name}</p>
                          </div>
                          <div className="text-right">
                             <p className="text-xs font-black text-[var(--text-main)]">Rp {parseFloat(c.salesVolume).toLocaleString()}</p>
                             <p className="text-[9px] font-bold text-primary">{c.transactionCount} Tx</p>
                          </div>
                        </div>
                      ))}
                      {cashierPerformance.length === 0 && <p className="text-center py-6 opacity-20 text-[10px] uppercase font-bold">Data tidak tersedia</p>}
                    </div>
                  </div>

                  {/* ALERT CENTER (CRITICAL ANOMALIES) */}
                  <div className="bg-[#0f172a] border border-red-500/20 rounded-[2.5rem] p-8 bg-red-500/5">
                     <h3 className="font-black uppercase tracking-[0.2em] text-xs text-red-500 mb-6 flex items-center gap-2">
                       <span className="material-symbols-outlined text-base">report</span>
                       Laporan Anomali
                     </h3>
                     <div className="space-y-4">
                        {alerts.length === 0 ? (
                          <div className="text-center py-6 opacity-40 flex flex-col items-center gap-2">
                             <span className="material-symbols-outlined text-3xl">verified</span>
                             <p className="text-[9px] font-black uppercase tracking-widest">Operasional Aman</p>
                          </div>
                        ) : alerts.map((a, i) => (
                          <div key={i} className={`p-4 rounded-2xl border ${a.type === 'VOID' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                             <p className="text-[10px] font-black text-[var(--text-main)] leading-tight">{a.message}</p>
                             <p className="text-[9px] text-[var(--text-muted)] mt-2 italic">Ket: {a.detail}</p>
                             <p className="text-[8px] font-black uppercase tracking-tighter text-primary mt-1">{new Date(a.time).toLocaleTimeString()}</p>
                          </div>
                        ))}
                     </div>
                  </div>
              </div>

              {/* 5. RECENT EXPENSES */}
              <div className="lg:col-span-12 glass border-white/5 rounded-[2.5rem] p-8">
                 <div className="flex justify-between items-center mb-8">
                   <h3 className="font-black uppercase tracking-[0.2em] text-xs text-primary opacity-60">5 Pengeluaran Terbaru</h3>
                   <span className="text-[11px] font-black text-red-500">Total: Rp {expenses.total.toLocaleString()}</span>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {expenses.recent.map((exp, i) => (
                      <div key={i} className="p-4 glass-lite border border-white/5 rounded-2xl relative overflow-hidden">
                         <div className="flex justify-between items-start mb-1">
                            <p className="text-[10px] font-black uppercase text-[var(--text-muted)] opacity-60">{exp.category}</p>
                            {exp.fundSource === 'OWNER' ? (
                               <span className="text-[7px] font-black px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase">Owner</span>
                            ) : (
                               <span className="text-[7px] font-black px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase">Kasir</span>
                            )}
                         </div>
                         <p className="text-xs font-black text-[var(--text-main)] truncate mt-1">{exp.title}</p>
                         <p className="text-sm font-black text-red-500 mt-2">Rp {parseFloat(exp.amount).toLocaleString()}</p>
                         <p className="text-[8px] font-black uppercase tracking-tighter mt-1 text-[var(--text-muted)] opacity-60">{new Date(exp.expenseDate).toLocaleDateString()}</p>
                      </div>
                    ))}
                    {expenses.recent.length === 0 && <p className="col-span-5 text-center py-10 opacity-20 text-[10px] uppercase font-bold">Tidak ada pengeluaran</p>}
                 </div>
              </div>

              {/* SECTION BARU: UANG MASUK OWNER */}
              <div className="lg:col-span-12 glass border-white/5 rounded-[2.5rem] p-8 mt-4">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="font-black uppercase tracking-[0.2em] text-xs text-emerald-500 flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">account_balance_wallet</span>
                    Pencatatan Uang Masuk & Modal
                  </h3>
                  <span className="text-[11px] font-black text-emerald-500">
                    Total: Rp {incomes.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0).toLocaleString()}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Form */}
                  <div className="lg:col-span-1 glass-lite p-6 rounded-[2rem] border border-white/5 h-fit">
                    <h4 className="text-[10px] uppercase font-black text-[var(--text-muted)] tracking-widest mb-6">Tambah Data</h4>
                    <form onSubmit={handleIncomeSubmit} className="space-y-4">
                      <div>
                        <label className="text-[9px] font-black uppercase text-[var(--text-muted)] mb-1 block">Judul/Keterangan</label>
                        <input 
                          type="text" 
                          required
                          value={incomeForm.title} onChange={e => setIncomeForm(p => ({...p, title: e.target.value}))}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-emerald-500 transition-colors"
                          placeholder="Contoh: Modal tambahan, Setoran" 
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase text-[var(--text-muted)] mb-1 block">Nominal (Rp)</label>
                        <input 
                          type="number" 
                          required
                          min="1"
                          value={incomeForm.amount} onChange={e => setIncomeForm(p => ({...p, amount: e.target.value}))}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-emerald-500 transition-colors"
                          placeholder="100000" 
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] font-black uppercase text-[var(--text-muted)] mb-1 block">Sumber Dana</label>
                          <select 
                            value={incomeForm.source} onChange={e => setIncomeForm(p => ({...p, source: e.target.value}))}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-black text-white outline-none focus:border-emerald-500"
                          >
                            <option value="OWNER">OWNER</option>
                            <option value="INVESTOR">INVESTOR</option>
                            <option value="LAINNYA">LAINNYA</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] font-black uppercase text-[var(--text-muted)] mb-1 block">Tanggal</label>
                          <input 
                            type="date" 
                            required
                            value={incomeForm.incomeDate} onChange={e => setIncomeForm(p => ({...p, incomeDate: e.target.value}))}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-black text-white outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase text-[var(--text-muted)] mb-1 block">Catatan Opsional</label>
                        <input 
                          type="text" 
                          value={incomeForm.notes} onChange={e => setIncomeForm(p => ({...p, notes: e.target.value}))}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-emerald-500 transition-colors"
                          placeholder="-" 
                        />
                      </div>
                      <button 
                        type="submit" 
                        disabled={isSubmittingIncome}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-black uppercase tracking-widest py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                      >
                        {isSubmittingIncome ? 'Menyimpan...' : 'Simpan Pemasukan'}
                      </button>
                    </form>
                  </div>

                  {/* List Riwayat */}
                  <div className="lg:col-span-2">
                    <h4 className="text-[10px] uppercase font-black text-[var(--text-muted)] tracking-widest mb-6">Riwayat Lengkap Uang Masuk</h4>
                    {(!incomes || incomes.length === 0) ? (
                      <div className="h-40 flex flex-col items-center justify-center border border-white/5 border-dashed rounded-3xl opacity-40">
                         <span className="material-symbols-outlined text-4xl mb-2">inbox</span>
                         <p className="text-[10px] font-black uppercase tracking-widest">Belum ada data uang masuk</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                        {incomes.map((inc) => (
                           <div key={inc.id} className="flex justify-between items-center p-4 bg-white/5 border border-white/5 rounded-2xl">
                              <div className="flex-1 min-w-0">
                                 <div className="flex items-center gap-2 mb-1">
                                   <p className="text-xs font-black text-white truncate">{inc.title}</p>
                                   <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase shrink-0">
                                     {inc.source}
                                   </span>
                                 </div>
                                 <p className="text-[10px] font-bold text-[var(--text-muted)]">{new Date(inc.incomeDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                 {inc.notes && <p className="text-[10px] text-white/40 italic mt-1 truncate max-w-[80%]">{inc.notes}</p>}
                              </div>
                              <div className="text-right flex items-center gap-4 shrink-0">
                                <span className="text-sm border-r border-white/10 pr-4 font-black text-emerald-400">Rp {parseFloat(inc.amount).toLocaleString()}</span>
                                <button 
                                  onClick={() => handleDeleteIncome(inc.id)}
                                  className="size-8 rounded-lg flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500/20 active:scale-95 transition-all outline-none"
                                >
                                  <span className="material-symbols-outlined text-sm">delete</span>
                                </button>
                              </div>
                           </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 6. DAILY REPORTS SECTION (THE SHIFT HISTORY STYLE) */}
              <div className="lg:col-span-12 space-y-8 mt-10">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                          <h2 className="text-2xl font-black tracking-tight text-[var(--text-main)] uppercase">Laporan Penjualan Harian</h2>
                          <p className="text-[10px] font-bold text-primary uppercase tracking-[0.4em] mt-1">Real-time Shift & Financial Reports</p>
                      </div>
                       <div className="flex items-center gap-2">
                           <button 
                             onClick={() => exportToCSV(reports)}
                             className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/5 text-[13px] font-bold text-[var(--text-main)] hover:bg-white/10 transition-all border border-white/10 min-w-[100px]"
                           >
                               <span className="material-symbols-outlined text-lg text-primary">description</span>
                               CSV
                           </button>
                       </div>
                  </div>

                  <div className="space-y-10">
                      {isReportsLoading ? (
                          <div className="py-20 flex flex-col items-center justify-center opacity-40">
                              <div className="size-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin mb-4"></div>
                              <p className="text-[9px] font-black uppercase tracking-widest">Memuat Laporan...</p>
                          </div>
                      ) : (
                          <>
                              {reports.map((report) => (
                                   <DailyReportCard 
                                     key={report.id} 
                                     report={report} 
                                     onDelete={handleDeleteReport}
                                     onExport={() => exportToCSV(report)}
                                   />
                              ))}
                              
                              {reports.length === 0 && (
                                  <div className="py-20 glass border-white/5 border-dashed flex flex-col items-center justify-center text-center p-10">
                                      <span className="material-symbols-outlined text-4xl text-[var(--text-main)] opacity-10 mb-4">history</span>
                                      <p className="text-xs font-black text-[var(--text-main)] opacity-20 uppercase tracking-[0.2em]">Belum ada riwayat laporan untuk periode ini</p>
                                  </div>
                              )}
                          </>
                      )}
                  </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

const SummaryCard = React.memo(({ title, value, icon, color, isHighlight, noCurrency, suffix }) => {
  return (
    <div className={`p-6 rounded-[2rem] border transition-all ${isHighlight ? 'bg-primary shadow-2xl shadow-primary/20 border-primary text-slate-950' : 'bg-white/5 border-white/5 text-white hover:border-white/20'}`}>
      <div className="flex justify-between items-start mb-6">
        <div className={`size-12 rounded-2xl flex items-center justify-center ${isHighlight ? 'bg-slate-950/10' : 'bg-white/5'}`}>
          <span className={`material-symbols-outlined ${isHighlight ? 'text-[var(--text-main)]' : color} text-2xl`}>{icon}</span>
        </div>
        {isHighlight && <div className="text-[8px] font-black uppercase bg-slate-950/20 px-2 py-1 rounded-full">Primary Metric</div>}
      </div>
      <div>
        <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isHighlight ? 'text-[var(--text-main)]/60' : 'text-[var(--text-muted)] opacity-60'}`}>{title}</p>
        <p className={`text-2xl font-black tracking-tight mt-1 ${isHighlight ? 'text-[var(--text-main)]' : 'text-[var(--text-main)]'}`}>
           {!noCurrency && <span className="text-[10px] mr-1 uppercase opacity-60">Rp</span>}
           {parseFloat(value || 0).toLocaleString()}
           {suffix && <span className="text-[10px] ml-1 uppercase opacity-60">{suffix}</span>}
        </p>
      </div>
    </div>
  );
});

export default App;

