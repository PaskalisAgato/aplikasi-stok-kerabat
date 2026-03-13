export default function KPICards({ reports }) {
    if (!reports) return null;

    const { revenueToday, expenses, netProfit } = reports;

    return (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card p-8 flex flex-col items-center text-center group hover:scale-[1.02] border-emerald-500/20 bg-emerald-500/5">
                <div className="size-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-green-500 text-4xl">payments</span>
                </div>
                <p className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Penjualan Hari Ini</p>
                <p className="text-3xl font-black text-slate-900  mt-2">Rp {(revenueToday || 0).toLocaleString('id-ID')}</p>
                <div className="mt-4 px-3 py-1 bg-emerald-500/10 rounded-full">
                    <p className="text-[10px] text-emerald-500 font-bold uppercase">Real-time Data</p>
                </div>
            </div>

            <div className="card p-8 flex flex-col items-center text-center group hover:scale-[1.02] border-red-500/20 bg-red-500/5">
                <div className="size-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-red-500 text-4xl">shopping_cart</span>
                </div>
                <p className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Pengeluaran</p>
                <p className="text-3xl font-black text-slate-900  mt-2">Rp {(expenses || 0).toLocaleString('id-ID')}</p>
                <div className="mt-4 px-3 py-1 bg-red-500/10 rounded-full">
                    <p className="text-[10px] text-red-500 font-bold uppercase">Operasional</p>
                </div>
            </div>

            <div className="card p-8 flex flex-col items-center text-center group hover:scale-[1.02] border-primary/20 bg-primary/5">
                <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-primary text-4xl">account_balance_wallet</span>
                </div>
                <p className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Profit Bersih</p>
                <p className="text-3xl font-black text-primary mt-2">Rp {(netProfit || 0).toLocaleString('id-ID')}</p>
                <div className="mt-4 px-3 py-1 bg-primary/10 rounded-full">
                    <p className="text-[10px] text-primary font-bold uppercase">Laba Akumulasi</p>
                </div>
            </div>
        </section>
    );
}

