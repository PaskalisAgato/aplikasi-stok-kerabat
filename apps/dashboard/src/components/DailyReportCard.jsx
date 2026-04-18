const DailyReportCard = ({ report, onDelete, onExport }) => {
  const isProfit = report.profit >= 0;

  return (
    <div className="glass border dark:border-white/5 border-slate-200 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden transition-all hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 group" id={`report-${report.id}`}>
      {/* ... existing header and body ... */}
      {/* HEADER: WAKTU & KASIR */}
      <div className="p-4 md:p-6 border-b dark:border-white/5 border-slate-200 bg-white/[0.03] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3 md:gap-4">
          <div className={`size-12 md:size-14 rounded-2xl md:rounded-[1.5rem] flex items-center justify-center ${report.status === 'OPEN' ? 'bg-amber-500/10 text-amber-500 animate-pulse' : 'bg-primary/10 text-primary'} border border-white/5 shadow-inner`}>
            <span className="material-symbols-outlined text-xl md:text-2xl font-black">
              {report.status === 'OPEN' ? 'lock_open' : 'event_available'}
            </span>
          </div>
          <div>
            <h4 className="text-sm md:text-base font-black dark:text-white dark:text-white text-slate-900 uppercase tracking-tight">{report.date}</h4>
            <div className="flex items-center gap-2 md:gap-3 mt-1">
              <span className={`px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest ${report.status === 'OPEN' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'bg-white/10 text-[var(--text-main)] opacity-60'}`}>
                {report.status === 'OPEN' ? 'Open' : 'Closed'}
              </span>
              <p className="text-[10px] md:text-[11px] font-bold dark:text-slate-400 dark:text-slate-400 text-slate-500 flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px] md:text-[14px]">schedule</span>
                {report.startTime} — {report.endTime}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-4 dark:bg-black bg-white/20 p-1.5 md:p-2 pr-4 md:pr-6 rounded-xl md:rounded-2xl border dark:border-white/5 border-slate-200 w-full sm:w-auto">
            <div className="size-8 md:size-10 rounded-lg md:rounded-xl dark:bg-white/5 bg-white shadow-sm border border-slate-200 flex items-center justify-center border dark:border-white/5 border-slate-200 shadow-lg">
                <span className="material-symbols-outlined text-lg md:text-xl text-primary font-black">person</span>
            </div>
            <div className="text-left">
                <p className="text-[8px] md:text-[9px] font-black dark:text-slate-400 dark:text-slate-400 text-slate-500 opacity-60 uppercase tracking-[0.2em]">Partner</p>
                <p className="text-[10px] md:text-xs font-black dark:text-white dark:text-white text-slate-900 uppercase tracking-tight">{report.cashierName}</p>
            </div>
        </div>
      </div>

      {/* BODY: 2-COLUMN LAYOUT */}
      <div className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 relative">
          {/* Vertical Divider (Desktop) */}
          <div className="hidden md:block absolute left-1/2 top-10 bottom-10 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>

          {/* KOLOM KIRI: ALUR PENJUALAN */}
          <div className="space-y-6 md:space-y-8">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary text-xs md:text-sm">analytics</span>
                <h5 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] dark:text-slate-400 dark:text-slate-400 text-slate-500 opacity-60">Aliran Penjualan</h5>
              </div>

              <div className="grid grid-cols-2 gap-4 md:gap-8">
                  <div className="space-y-1">
                      <p className="text-[9px] md:text-[10px] font-bold dark:text-slate-400 dark:text-slate-400 text-slate-500 uppercase tracking-widest">Mulai (Modal)</p>
                      <p className="text-xl md:text-2xl font-black dark:text-white dark:text-white text-slate-900 tracking-tight">
                        <span className="text-[10px] md:text-xs dark:text-slate-400 dark:text-slate-400 text-slate-500 opacity-60 mr-1">Rp</span>
                        {report.initialCash.toLocaleString()}
                      </p>
                  </div>
                  <div className="space-y-1 text-right">
                      <p className="text-[9px] md:text-[10px] font-bold dark:text-slate-400 dark:text-slate-400 text-slate-500 uppercase tracking-widest">Penjualan</p>
                      <p className="text-xl md:text-2xl font-black text-emerald-500 tracking-tight">
                        <span className="text-sm md:text-base font-black mr-1">+</span>
                        {report.totalSales.toLocaleString()}
                      </p>
                  </div>
              </div>

              {/* Decorative Progress Bar */}
              <div className="h-1.5 md:h-2 dark:bg-white/5 bg-white shadow-sm border border-slate-200 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.3)]" 
                    style={{ width: `${Math.min((report.totalSales / (report.initialCash || 1)) * 100, 100)}%` }}
                  ></div>
              </div>

              <div className="flex justify-between items-center dark:bg-white/5 bg-white shadow-sm border border-slate-200 p-4 md:p-5 rounded-2xl md:rounded-[1.5rem] border dark:border-white/5 border-slate-200 shadow-lg">
                  <p className="text-[10px] md:text-[11px] font-black dark:text-white dark:text-white text-slate-900/60 uppercase tracking-[0.2em]">Target Penutupan</p>
                  <p className="text-lg md:text-xl font-black dark:text-white dark:text-white text-slate-900 tracking-tight">
                    <span className="text-[10px] md:text-xs opacity-40 mr-1">Rp</span>
                    {report.initialCash.toLocaleString()}
                  </p>
              </div>
          </div>

          {/* KOLOM KANAN: ARUS KAS & PENGELUARAN */}
          <div className="space-y-6 md:space-y-8">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-red-500 text-xs md:text-sm">account_balance_wallet</span>
                <h5 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] dark:text-slate-400 dark:text-slate-400 text-slate-500 opacity-60">Arus Kas & Biaya</h5>
              </div>

              <div className="grid grid-cols-2 gap-4 md:gap-8">
                  <div className="space-y-1">
                      <p className="text-[9px] md:text-[10px] font-bold dark:text-slate-400 dark:text-slate-400 text-slate-500 uppercase tracking-widest">Masuk (Lainnya)</p>
                      <p className="text-xl md:text-2xl font-black dark:text-white dark:text-white text-slate-900 tracking-tight">
                        <span className="text-[10px] md:text-xs dark:text-slate-400 dark:text-slate-400 text-slate-500 opacity-60 mr-1">Rp</span>
                        {report.cashIn.toLocaleString()}
                      </p>
                  </div>
                  <div className="space-y-1 text-right">
                      <p className="text-[9px] md:text-[10px] font-bold dark:text-slate-400 dark:text-slate-400 text-slate-500 uppercase tracking-widest">Keluar (Biaya)</p>
                      <p className="text-xl md:text-2xl font-black text-red-500 tracking-tight">
                        <span className="text-sm md:text-base font-black mr-1">-</span>
                        {report.totalExpenses.toLocaleString()}
                      </p>
                  </div>
              </div>

              <div className={`p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border relative overflow-hidden transition-all ${isProfit ? 'bg-emerald-500/[0.07] border-emerald-500/20 shadow-lg shadow-emerald-500/5' : 'bg-red-500/[0.07] border-red-500/20 shadow-lg shadow-red-500/5'}`}>
                  {/* Decorative background icon */}
                  <span className={`absolute -right-4 -bottom-4 material-symbols-outlined text-6xl md:text-8xl opacity-[0.03] rotate-12 ${isProfit ? 'text-emerald-500' : 'text-red-500'}`}>
                    {isProfit ? 'account_balance' : 'trending_down'}
                  </span>

                  <div className="flex justify-between items-start relative z-10">
                      <div>
                          <p className={`text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${isProfit ? 'text-emerald-500' : 'text-red-500'}`}>
                              Laci Kasir (Estimasi)
                          </p>
                          <p className="text-2xl md:text-3xl font-black dark:text-white dark:text-white text-slate-900 tracking-tighter">
                            <span className="text-[10px] md:text-sm dark:text-slate-400 dark:text-slate-400 text-slate-500 opacity-60 mr-1.5 uppercase font-bold">Rp</span>
                            {report.cashDrawer.toLocaleString()}
                          </p>
                      </div>
                      <div className={`size-10 md:size-14 rounded-xl md:rounded-2xl flex items-center justify-center ${isProfit ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-red-500 shadow-lg shadow-red-500/20'} text-slate-950`}>
                          <span className="material-symbols-outlined text-xl md:text-3xl font-black">
                              {isProfit ? 'trending_up' : 'trending_down'}
                          </span>
                      </div>
                  </div>

                  <div className="mt-4 md:mt-6 pt-4 md:pt-5 border-t dark:border-white/5 border-slate-200 flex justify-between items-center relative z-10">
                      <div className="flex flex-col">
                        <p className="text-[9px] md:text-[10px] font-bold dark:text-white dark:text-white text-slate-900/40 uppercase tracking-tighter">
                          {report.totalTransactions} Transaksi
                        </p>
                        <p className="text-[8px] md:text-[9px] font-black text-primary uppercase mt-0.5">Verified System</p>
                      </div>
                      <div className="flex items-center gap-2 dark:bg-black bg-white/40 px-3 md:px-4 py-1.5 md:py-2 rounded-full border dark:border-white/5 border-slate-200">
                          <span className={`size-1.5 md:size-2 rounded-full ${isProfit ? 'bg-emerald-500 animate-pulse' : 'bg-red-500 animate-pulse'}`}></span>
                          <p className={`text-[9px] md:text-[11px] font-black uppercase tracking-tight ${isProfit ? 'text-emerald-500' : 'text-red-500'}`}>
                            {isProfit ? 'Profit' : 'Defisit'}: <span className="dark:text-white dark:text-white text-slate-900 ml-1">Rp {Math.abs(report.profit).toLocaleString()}</span>
                          </p>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* FOOTER: ACTIONS */}
      <div className="px-6 md:px-10 py-5 bg-white/[0.02] border-t dark:border-white/5 border-slate-200 flex flex-wrap md:flex-nowrap justify-end gap-2 md:gap-3 md:opacity-0 md:group-hover:opacity-100 md:translate-y-4 md:group-hover:translate-y-0 transition-all duration-300">
          <button 
            onClick={() => alert(`Laporan Shift ${report.cashierName} pada ${report.date}\nStatus: ${report.status}\nTotal Transaksi: ${report.totalTransactions}\nProfit: Rp ${report.profit.toLocaleString()}`)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-md dark:bg-white/5 bg-white shadow-sm border border-slate-200 text-[13px] font-bold dark:text-white dark:text-white text-slate-900/60 hover:dark:bg-white/10 bg-white shadow-md border border-slate-200 hover:dark:text-white dark:text-white text-slate-900 transition-all border dark:border-white/10 border-slate-200 min-w-[80px]"
          >
              <span className="material-symbols-outlined text-lg">visibility</span>
              Detail
          </button>
          <button 
            onClick={onExport}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-md dark:bg-white/5 bg-white shadow-sm border border-slate-200 text-[13px] font-bold dark:text-white dark:text-white text-slate-900/60 hover:dark:bg-white/10 bg-white shadow-md border border-slate-200 hover:dark:text-white dark:text-white text-slate-900 transition-all border dark:border-white/10 border-slate-200 min-w-[80px]"
          >
              <span className="material-symbols-outlined text-lg text-primary">description</span>
              CSV
          </button>
          <button 
            onClick={() => onDelete && onDelete(report.id)}
            className="flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-md bg-red-500/10 text-red-500 text-[13px] font-bold hover:bg-red-500 hover:text-white transition-all border border-red-500/20 min-w-[80px]"
          >
              <span className="material-symbols-outlined text-lg">delete</span>
              Hapus
          </button>
      </div>
    </div>
  );
};

export default DailyReportCard;
