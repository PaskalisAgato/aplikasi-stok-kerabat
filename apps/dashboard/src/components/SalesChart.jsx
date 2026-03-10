export default function SalesChart() {
    return (
        <section className="mt-6 px-4">
            <div className="bg-slate-500/5 dark:bg-white/5 rounded-xl p-5 border border-slate-200 dark:border-white/10">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight">Penjualan 7 Hari</h2>
                        <p className="text-slate-500 text-xs">Total: Rp 29.750.000</p>
                    </div>
                    <span className="material-symbols-outlined text-primary">bar_chart</span>
                </div>

                <div className="flex items-end justify-between h-32 gap-2 mt-4 px-1">
                    <div className="flex flex-col items-center gap-2 flex-1 group">
                        <div className="w-full bg-primary/20 rounded-t-sm relative" style={{ height: "65%" }}>
                            <div className="absolute bottom-0 w-full bg-primary/40 rounded-t-sm h-1/2"></div>
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">Sen</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 flex-1 group">
                        <div className="w-full bg-primary/20 rounded-t-sm relative" style={{ height: "45%" }}>
                            <div className="absolute bottom-0 w-full bg-primary/40 rounded-t-sm h-1/2"></div>
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">Sel</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 flex-1 group">
                        <div className="w-full bg-primary/20 rounded-t-sm relative" style={{ height: "55%" }}>
                            <div className="absolute bottom-0 w-full bg-primary/40 rounded-t-sm h-1/2"></div>
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">Rab</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 flex-1 group">
                        <div className="w-full bg-primary/40 rounded-t-md relative h-[90%] ring-2 ring-primary ring-inset">
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-primary text-white text-[9px] px-1.5 py-0.5 rounded shadow-lg font-bold">HOT</div>
                        </div>
                        <span className="text-[10px] text-primary font-bold">Kam</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 flex-1 group">
                        <div className="w-full bg-primary/20 rounded-t-sm relative" style={{ height: "50%" }}>
                            <div className="absolute bottom-0 w-full bg-primary/40 rounded-t-sm h-1/2"></div>
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">Jum</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 flex-1 group">
                        <div className="w-full bg-primary/20 rounded-t-sm relative" style={{ height: "40%" }}>
                            <div className="absolute bottom-0 w-full bg-primary/40 rounded-t-sm h-1/2"></div>
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">Sab</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 flex-1 group">
                        <div className="w-full bg-primary/20 rounded-t-sm relative" style={{ height: "30%" }}>
                            <div className="absolute bottom-0 w-full bg-primary/40 rounded-t-sm h-1/2"></div>
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">Min</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
