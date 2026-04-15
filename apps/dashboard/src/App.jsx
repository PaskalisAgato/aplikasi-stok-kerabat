import React, { useState, useEffect } from 'react';
import { apiClient } from '@shared/apiClient';
import Layout from '@shared/Layout';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import DailyReportCard from './components/DailyReportCard';

const COLORS = ['#fbbf24', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6'];

function App() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('today');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const [reports, setReports] = useState([]);
  const [isReportsLoading, setIsReportsLoading] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const params = dateFilter === 'custom' 
        ? { startDate: customRange.start, endDate: customRange.end }
        : { date: dateFilter };
      
      const response = await apiClient.getAnalyticsDashboard(params);
      setData(response.data);
      
      // Fetch shift reports separately
      fetchReports();
    } catch (error) {
      console.error('Failed to fetch analytics', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      setIsReportsLoading(true);
      const range = dateFilter === 'custom'
        ? { startDate: customRange.start, endDate: customRange.end }
        : dateFilter === 'today'
          ? { startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0] }
          : { startDate: new Date(Date.now() - 86400000).toISOString().split('T')[0], endDate: new Date(Date.now() - 86400000).toISOString().split('T')[0] };

      const response = await apiClient.getShiftReports(range);
      setReports(response.data || []);
    } catch (error) {
      console.error('Failed to fetch reports', error);
      setReports([]);
    } finally {
      setIsReportsLoading(false);
    }
  };

  const handleDeleteReport = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus laporan shift ini? Tindakan ini tidak dapat dibatalkan.')) return;
    
    try {
      await apiClient.deleteShift(id);
      setReports(prev => prev.filter(r => r.id !== id));
      // Also refresh dashboard data since sales might be affected if shift was active
      fetchData();
    } catch (error) {
      alert('Gagal menghapus laporan: ' + error.message);
    }
  };

  const exportToCSV = () => {
    if (reports.length === 0) return;
    const headers = ['Tanggal', 'Kasir', 'Mulai', 'Penjualan', 'Pengeluaran', 'Laci Kasir', 'Profit', 'Transaksi'];
    const rows = reports.map(r => [
      r.date, r.cashierName, r.initialCash, r.totalSales, r.totalExpenses, r.cashDrawer, r.profit, r.totalTransactions
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Harian_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // 1-minute auto-refresh
    return () => clearInterval(interval);
  }, [dateFilter]);

  const summary = data?.summary || {};
  const hourlySales = data?.hourlySales || [];
  const topProducts = data?.topProducts || [];
  const paymentMethods = data?.paymentMethods || [];
  const cashierPerformance = data?.cashierPerformance || [];
  const alerts = data?.alerts || [];
  const expenses = data?.expenses || { total: 0, recent: [] };

  // Prepare chart data
  const chartData = Array.from({ length: 24 }).map((_, i) => {
    const found = hourlySales.find(h => parseInt(h.hour) === i);
    return {
      hour: `${i}:00`,
      total: found ? parseFloat(found.total) : 0
    };
  });

  const pieData = paymentMethods.map(pm => ({
    name: pm.method,
    value: parseFloat(pm.total)
  }));

  return (
    <Layout currentPort={5173} title="Enterprise Dashboard" subtitle="Data-Driven Business Control">
      <div className="space-y-8 animate-in fade-in duration-500 pb-10">
        
        {/* HEADER: Filter & Refresh */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white/5 p-5 rounded-[2rem] border border-white/5 shadow-2xl">
          <div className="flex gap-4 p-1.5 bg-black/20 rounded-2xl w-full md:w-auto overflow-x-auto">
            {['today', 'yesterday', 'custom'].map((f) => (
              <button
                key={f}
                onClick={() => setDateFilter(f)}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  dateFilter === f ? 'bg-primary text-slate-950 shadow-lg shadow-primary/20' : 'text-white/40 hover:text-white'
                }`}
              >
                {f === 'today' ? 'Hari Ini' : f === 'yesterday' ? 'Kemarin' : 'Kustom'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-5 w-full md:w-auto mt-4 md:mt-0">
            {dateFilter === 'custom' && (
              <div className="flex items-center gap-2 animate-in slide-in-from-right-4">
                <input 
                  type="date" 
                  className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-primary"
                  value={customRange.start}
                  onChange={(e) => setCustomRange(p => ({ ...p, start: e.target.value }))}
                />
                <span className="text-xs opacity-40">s/d</span>
                <input 
                  type="date" 
                  className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-primary"
                  value={customRange.end}
                  onChange={(e) => setCustomRange(p => ({ ...p, end: e.target.value }))}
                />
                <button onClick={fetchData} className="size-10 bg-primary text-slate-950 rounded-xl flex items-center justify-center hover:scale-105 transition-all">
                  <span className="material-symbols-outlined font-black">search</span>
                </button>
              </div>
            )}
            <button 
              onClick={fetchData}
              disabled={isLoading}
              className={`size-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all ${isLoading ? 'animate-spin opacity-50' : ''}`}
            >
              <span className="material-symbols-outlined text-xl">refresh</span>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <SummaryCard title="Total Penjualan" value={summary.totalRevenue} icon="payments" color="text-amber-500" />
              <SummaryCard title="Total Transaksi" value={summary.totalTransactions} icon="shopping_cart" color="text-blue-500" suffix="Order" noCurrency />
              <SummaryCard title="Avg. Order" value={summary.avgOrderValue} icon="analytics" color="text-emerald-500" />
              <SummaryCard title="Total Pengeluaran" value={summary.totalExpenses} icon="shopping_bag" color="text-red-500" />
              <SummaryCard title="Profit Bersih" value={summary.grossProfit} icon="trending_up" color="text-primary" isHighlight />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* 2. MAIN CHART: HOURLY SALES */}
              <div className="lg:col-span-8 bg-[#0f172a] border border-white/5 rounded-[2.5rem] p-8">
                <div className="flex justify-between items-center mb-10">
                  <div>
                    <h3 className="font-black uppercase tracking-[0.2em] text-xs text-white/40">Tren Penjualan Per Jam</h3>
                    <p className="text-[10px] font-bold text-primary mt-1">Berdasarkan Total Transaksi (WIB)</p>
                  </div>
                </div>
                <div className="h-[350px] w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <AreaChart data={chartData}>
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
                </div>
              </div>

              {/* 3. PAYMENT BREAKDOWN (PIE CHART) */}
              <div className="lg:col-span-4 bg-[#0f172a] border border-white/5 rounded-[2.5rem] p-8 flex flex-col items-center">
                <h3 className="font-black uppercase tracking-[0.2em] text-xs text-white/40 w-full mb-8">Metode Pembayaran</h3>
                <div className="h-[250px] w-full relative min-w-0">
                   <ResponsiveContainer width="100%" height="100%" minWidth={0}>
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
                   <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                     <div className="text-center">
                        <p className="text-[10px] uppercase font-black opacity-40">Mix</p>
                        <p className="text-sm font-black text-white">{paymentMethods.length} Cara</p>
                     </div>
                   </div>
                </div>
                <div className="w-full mt-6 space-y-2">
                   {pieData.map((d, i) => (
                     <div key={d.name} className="flex justify-between items-center text-[10px] font-black uppercase">
                       <div className="flex items-center gap-2">
                         <div className="size-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                         <span className="opacity-60">{d.name}</span>
                       </div>
                       <span>Rp {d.value.toLocaleString()}</span>
                     </div>
                   ))}
                </div>
              </div>

              {/* 4. TOP PRODUCTS & CASHIER PERFORMANCE */}
              <div className="lg:col-span-8 bg-[#0f172a] border border-white/5 rounded-[2.5rem] p-8">
                 <h3 className="font-black uppercase tracking-[0.2em] text-xs text-white/40 mb-8">5 Produk Terlaris</h3>
                 <div className="space-y-6">
                    {topProducts.map((p, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between items-end text-xs">
                          <p className="font-black text-white uppercase">{p.name}</p>
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
                  <div className="bg-[#0f172a] border border-white/5 rounded-[2.5rem] p-8">
                    <h3 className="font-black uppercase tracking-[0.2em] text-xs text-white/40 mb-6">Performa Kasir</h3>
                    <div className="space-y-4">
                      {cashierPerformance.map((c, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className={`text-xl font-black ${i === 0 ? 'text-primary' : 'opacity-20'}`}># {i + 1}</span>
                            <p className="text-[11px] font-black text-white uppercase">{c.name}</p>
                          </div>
                          <div className="text-right">
                             <p className="text-xs font-black text-white">Rp {parseFloat(c.salesVolume).toLocaleString()}</p>
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
                             <p className="text-[10px] font-black text-white leading-tight">{a.message}</p>
                             <p className="text-[9px] opacity-60 mt-2 italic">Ket: {a.detail}</p>
                             <p className="text-[8px] font-black uppercase tracking-tighter text-primary mt-1">{new Date(a.time).toLocaleTimeString()}</p>
                          </div>
                        ))}
                     </div>
                  </div>
              </div>

              {/* 5. RECENT EXPENSES */}
              <div className="lg:col-span-12 bg-[#0f172a] border border-white/5 rounded-[2.5rem] p-8">
                 <div className="flex justify-between items-center mb-8">
                   <h3 className="font-black uppercase tracking-[0.2em] text-xs text-white/40">5 Pengeluaran Terbaru</h3>
                   <span className="text-[11px] font-black text-red-500">Total: Rp {expenses.total.toLocaleString()}</span>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {expenses.recent.map((exp, i) => (
                      <div key={i} className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                         <p className="text-[10px] font-black uppercase opacity-40 mb-1">{exp.category}</p>
                         <p className="text-xs font-black text-white truncate">{exp.title}</p>
                         <p className="text-sm font-black text-red-500 mt-2">Rp {parseFloat(exp.amount).toLocaleString()}</p>
                         <p className="text-[8px] font-black uppercase tracking-tighter mt-1 opacity-40">{new Date(exp.expenseDate).toLocaleDateString()}</p>
                      </div>
                    ))}
                    {expenses.recent.length === 0 && <p className="col-span-5 text-center py-10 opacity-20 text-[10px] uppercase font-bold">Tidak ada pengeluaran</p>}
                 </div>
              </div>

              {/* 6. DAILY REPORTS SECTION (THE SHIFT HISTORY STYLE) */}
              <div className="lg:col-span-12 space-y-8 mt-10">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                          <h2 className="text-2xl font-black tracking-tight text-white uppercase">Laporan Penjualan Harian</h2>
                          <p className="text-[10px] font-bold text-primary uppercase tracking-[0.4em] mt-1">Real-time Shift & Financial Reports</p>
                      </div>
                      <div className="flex items-center gap-6">
                          <button 
                            onClick={exportToCSV}
                            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all border border-white/5"
                          >
                              <span className="material-symbols-outlined text-sm text-primary">download</span>
                              Export CSV
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
                                  />
                              ))}
                              
                              {reports.length === 0 && (
                                  <div className="py-20 bg-white/5 rounded-[2.5rem] border border-white/5 border-dashed flex flex-col items-center justify-center text-center p-10">
                                      <span className="material-symbols-outlined text-4xl opacity-10 mb-4">history</span>
                                      <p className="text-xs font-black text-white/20 uppercase tracking-[0.2em]">Belum ada riwayat laporan untuk periode ini</p>
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

function SummaryCard({ title, value, icon, color, isHighlight, noCurrency, suffix }) {
  return (
    <div className={`p-6 rounded-[2rem] border transition-all ${isHighlight ? 'bg-primary shadow-2xl shadow-primary/20 border-primary text-slate-950' : 'bg-[#0f172a] border-white/5 text-white hover:border-white/20'}`}>
      <div className="flex justify-between items-start mb-6">
        <div className={`size-12 rounded-2xl flex items-center justify-center ${isHighlight ? 'bg-slate-950/10' : 'bg-white/5'}`}>
          <span className={`material-symbols-outlined ${isHighlight ? 'text-slate-900' : color} text-2xl`}>{icon}</span>
        </div>
        {isHighlight && <div className="text-[8px] font-black uppercase bg-slate-950/20 px-2 py-1 rounded-full">Primary Metric</div>}
      </div>
      <div>
        <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isHighlight ? 'text-slate-950/60' : 'opacity-40'}`}>{title}</p>
        <p className={`text-2xl font-black tracking-tight mt-1 ${isHighlight ? 'text-slate-950' : 'text-white'}`}>
           {!noCurrency && <span className="text-[10px] mr-1 uppercase opacity-60">Rp</span>}
           {parseFloat(value || 0).toLocaleString()}
           {suffix && <span className="text-[10px] ml-1 uppercase opacity-60">{suffix}</span>}
        </p>
      </div>
    </div>
  );
}

export default App;

