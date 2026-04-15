import React from 'react';

const DailyReportCard = ({ report }) => {
  const isProfit = report.profit >= 0;

  return (
    <div className="bg-[#0f172a] border border-white/5 rounded-[2rem] overflow-hidden transition-all hover:border-white/20 group">
      {/* HEADER: WAKTU & KASIR */}
      <div className="p-6 border-b border-white/5 bg-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className={`size-12 rounded-2xl flex items-center justify-center ${report.status === 'OPEN' ? 'bg-amber-500/10 text-amber-500 animate-pulse' : 'bg-primary/10 text-primary'}`}>
            <span className="material-symbols-outlined font-black">
              {report.status === 'OPEN' ? 'lock_open' : 'calendar_today'}
            </span>
          </div>
          <div>
            <h4 className="text-sm font-black text-white uppercase tracking-tight">{report.date}</h4>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${report.status === 'OPEN' ? 'bg-amber-500 text-slate-950' : 'bg-white/10 text-white/60'}`}>
                {report.status === 'OPEN' ? 'Sedang Berjalan' : 'Selesai'}
              </span>
              <p className="text-[10px] font-bold text-white/40">{report.startTime} — {report.endTime}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
            <div className="text-right">
                <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Kasir</p>
                <p className="text-xs font-black text-white uppercase">{report.cashierName}</p>
            </div>
            <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center">
                <span className="material-symbols-outlined text-lg opacity-40">person</span>
            </div>
        </div>
      </div>

      {/* BODY: DATA UTAMA & TAMBAHAN */}
      <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12 relative">
          {/* Divider Horizontal (Mobile) atau Vertikal (Desktop) */}
          <div className="hidden md:block absolute left-1/2 top-10 bottom-10 w-px bg-white/5"></div>

          {/* KOLOM KIRI: ALUR PENJUALAN */}
          <div className="space-y-6">
              <div className="flex justify-between items-end">
                  <div className="space-y-1">
                      <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">Mulai (Modal)</p>
                      <p className="text-lg font-black text-white">Rp {report.initialCash.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1 text-right">
                      <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">Penjualan</p>
                      <p className="text-lg font-black text-emerald-500">+ Rp {report.totalSales.toLocaleString()}</p>
                  </div>
              </div>

              {/* Progress Bar Penjualan vs Modal (Simple Visual) */}
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-1000" 
                    style={{ width: `${Math.min((report.totalSales / (report.initialCash || 1)) * 100, 100)}%` }}
                  ></div>
              </div>

              <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                  <p className="text-[10px] font-black text-white uppercase tracking-widest">Saldo Akhir</p>
                  <p className="text-xl font-black text-white">Rp {report.initialCash.toLocaleString()}</p>
              </div>
          </div>

          {/* KOLOM KANAN: ARUS KAS & PENGELUARAN */}
          <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                      <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">Masuk (Lainnya)</p>
                      <p className="text-base font-black text-white">Rp 0</p>
                  </div>
                  <div className="space-y-1 text-right">
                      <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">Keluar (Biaya)</p>
                      <p className="text-base font-black text-red-500">- Rp {report.totalExpenses.toLocaleString()}</p>
                  </div>
              </div>

              <div className={`p-5 rounded-2xl border transition-all ${isProfit ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                  <div className="flex justify-between items-center">
                      <div>
                          <p className={`text-[10px] font-black uppercase tracking-widest ${isProfit ? 'text-emerald-500' : 'text-red-500'}`}>
                              Laci Kasir (Estimasi)
                          </p>
                          <p className="text-2xl font-black text-white mt-1">Rp {report.cashDrawer.toLocaleString()}</p>
                      </div>
                      <div className={`size-12 rounded-xl flex items-center justify-center ${isProfit ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                          <span className="material-symbols-outlined text-2xl font-black">
                              {isProfit ? 'trending_up' : 'trending_down'}
                          </span>
                      </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                      <p className="text-[9px] font-bold text-white/40 uppercase tracking-tighter">
                        {report.totalTransactions} Transaksi Terproses
                      </p>
                      <div className="flex items-center gap-1">
                          <span className={`size-2 rounded-full ${isProfit ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                          <p className={`text-[10px] font-black uppercase ${isProfit ? 'text-emerald-500' : 'text-red-500'}`}>
                            {isProfit ? 'Profit' : 'Defisit'}: Rp {Math.abs(report.profit).toLocaleString()}
                          </p>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* FOOTER: ACTIONS */}
      <div className="px-8 py-4 bg-white/[0.02] border-t border-white/5 flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-[10px] font-black uppercase tracking-widest text-white/60 hover:bg-white/10 hover:text-white transition-all">
              <span className="material-symbols-outlined text-sm">visibility</span>
              Detail
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-[10px] font-black uppercase tracking-widest text-white/60 hover:bg-white/10 hover:text-white transition-all">
              <span className="material-symbols-outlined text-sm">download</span>
              Export
          </button>
      </div>
    </div>
  );
};

export default DailyReportCard;
