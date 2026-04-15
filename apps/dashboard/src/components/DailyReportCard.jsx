const DailyReportCard = ({ report, onDelete }) => {
  const isProfit = report.profit >= 0;

  return (
    <div className="bg-[#0f172a] border border-white/5 rounded-[2.5rem] overflow-hidden transition-all hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 group">
      {/* HEADER: WAKTU & KASIR */}
      <div className="p-6 border-b border-white/5 bg-white/[0.03] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className={`size-14 rounded-[1.5rem] flex items-center justify-center ${report.status === 'OPEN' ? 'bg-amber-500/10 text-amber-500 animate-pulse' : 'bg-primary/10 text-primary'} border border-white/5 shadow-inner`}>
            <span className="material-symbols-outlined text-2xl font-black">
              {report.status === 'OPEN' ? 'lock_open' : 'event_available'}
            </span>
          </div>
          <div>
            <h4 className="text-base font-black text-white uppercase tracking-tight">{report.date}</h4>
            <div className="flex items-center gap-3 mt-1.5">
              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${report.status === 'OPEN' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'bg-white/10 text-white/60'}`}>
                {report.status === 'OPEN' ? 'Open Shift' : 'Closed'}
              </span>
              <p className="text-[11px] font-bold text-white/40 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">schedule</span>
                {report.startTime} — {report.endTime}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-black/20 p-2 pr-6 rounded-2xl border border-white/5">
            <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 shadow-lg">
                <span className="material-symbols-outlined text-xl text-primary font-black">person</span>
            </div>
            <div className="text-left">
                <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Operator</p>
                <p className="text-xs font-black text-white uppercase tracking-tight">{report.cashierName}</p>
            </div>
        </div>
      </div>

      {/* BODY: 2-COLUMN LAYOUT */}
      <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-16 relative">
          {/* Vertical Divider (Desktop) */}
          <div className="hidden md:block absolute left-1/2 top-10 bottom-10 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>

          {/* KOLOM KIRI: ALUR PENJUALAN */}
          <div className="space-y-8">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary text-sm">analytics</span>
                <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Aliran Penjualan</h5>
              </div>

              <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1.5">
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Mulai (Modal)</p>
                      <p className="text-2xl font-black text-white tracking-tight">
                        <span className="text-xs opacity-40 mr-1">Rp</span>
                        {report.initialCash.toLocaleString()}
                      </p>
                  </div>
                  <div className="space-y-1.5 text-right">
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Penjualan</p>
                      <p className="text-2xl font-black text-emerald-500 tracking-tight">
                        <span className="text-base font-black mr-1">+</span>
                        {report.totalSales.toLocaleString()}
                      </p>
                  </div>
              </div>

              {/* Decorative Progress Bar */}
              <div className="h-2 bg-white/5 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.3)]" 
                    style={{ width: `${Math.min((report.totalSales / (report.initialCash || 1)) * 100, 100)}%` }}
                  ></div>
              </div>

              <div className="flex justify-between items-center bg-white/5 p-5 rounded-[1.5rem] border border-white/5 shadow-lg">
                  <p className="text-[11px] font-black text-white/60 uppercase tracking-[0.2em]">Target Penutupan</p>
                  <p className="text-xl font-black text-white tracking-tight">
                    <span className="text-xs opacity-40 mr-1">Rp</span>
                    {report.initialCash.toLocaleString()}
                  </p>
              </div>
          </div>

          {/* KOLOM KANAN: ARUS KAS & PENGELUARAN */}
          <div className="space-y-8">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-red-500 text-sm">account_balance_wallet</span>
                <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Arus Kas & Biaya</h5>
              </div>

              <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1.5">
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Masuk (Lainnya)</p>
                      <p className="text-2xl font-black text-white tracking-tight">
                        <span className="text-xs opacity-40 mr-1">Rp</span>
                        {report.cashIn.toLocaleString()}
                      </p>
                  </div>
                  <div className="space-y-1.5 text-right">
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Keluar (Biaya)</p>
                      <p className="text-2xl font-black text-red-500 tracking-tight">
                        <span className="text-base font-black mr-1">-</span>
                        {report.totalExpenses.toLocaleString()}
                      </p>
                  </div>
              </div>

              <div className={`p-6 rounded-[2rem] border relative overflow-hidden transition-all ${isProfit ? 'bg-emerald-500/[0.07] border-emerald-500/20 shadow-lg shadow-emerald-500/5' : 'bg-red-500/[0.07] border-red-500/20 shadow-lg shadow-red-500/5'}`}>
                  {/* Decorative background icon */}
                  <span className={`absolute -right-4 -bottom-4 material-symbols-outlined text-8xl opacity-[0.03] rotate-12 ${isProfit ? 'text-emerald-500' : 'text-red-500'}`}>
                    {isProfit ? 'account_balance' : 'trending_down'}
                  </span>

                  <div className="flex justify-between items-start relative z-10">
                      <div>
                          <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${isProfit ? 'text-emerald-500' : 'text-red-500'}`}>
                              Laci Kasir (Estimasi)
                          </p>
                          <p className="text-3xl font-black text-white tracking-tighter">
                            <span className="text-sm opacity-40 mr-1.5 uppercase font-bold">Rp</span>
                            {report.cashDrawer.toLocaleString()}
                          </p>
                      </div>
                      <div className={`size-14 rounded-2xl flex items-center justify-center ${isProfit ? 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]'} text-slate-950`}>
                          <span className="material-symbols-outlined text-3xl font-black">
                              {isProfit ? 'trending_up' : 'trending_down'}
                          </span>
                      </div>
                  </div>

                  <div className="mt-6 pt-5 border-t border-white/5 flex justify-between items-center relative z-10">
                      <div className="flex flex-col">
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-tighter">
                          {report.totalTransactions} Transaksi
                        </p>
                        <p className="text-[9px] font-black text-primary uppercase mt-0.5">Verified System</p>
                      </div>
                      <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-full border border-white/5">
                          <span className={`size-2 rounded-full ${isProfit ? 'bg-emerald-500 animate-pulse' : 'bg-red-500 animate-pulse'}`}></span>
                          <p className={`text-[11px] font-black uppercase tracking-tight ${isProfit ? 'text-emerald-500' : 'text-red-500'}`}>
                            {isProfit ? 'Profit' : 'Defisit'}: <span className="text-white ml-1">Rp {Math.abs(report.profit).toLocaleString()}</span>
                          </p>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* FOOTER: ACTIONS */}
      <div className="px-10 py-5 bg-white/[0.02] border-t border-white/5 flex justify-end gap-4 opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0">
          <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/5 text-[10px] font-black uppercase tracking-widest text-white/60 hover:bg-white/10 hover:text-white transition-all border border-white/5">
              <span className="material-symbols-outlined text-lg">visibility</span>
              Detail Pelaporan
          </button>
          <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-slate-950 text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-lg">download</span>
              Export PDF
          </button>
          <button 
            onClick={() => onDelete && onDelete(report.id)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
          >
              <span className="material-symbols-outlined text-lg">delete</span>
              Hapus
          </button>
      </div>
    </div>
  );
};

export default DailyReportCard;
