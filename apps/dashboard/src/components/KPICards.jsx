export default function KPICards({ reports }) {
    if (!reports) return null;

    const { revenueToday, expenses, netProfit } = reports;

    return (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card p-8 flex flex-col items-center text-center group hover:scale-[1.02] border-success/20 bg-success/5">
                <div className="size-16 rounded-2xl bg-success/10 flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-success text-4xl">payments</span>
                </div>
                <p className="text-xs font-black text-muted uppercase tracking-[0.2em]">Penjualan Hari Ini</p>
                <p className="text-3xl font-black text-main mt-2">Rp {(revenueToday || 0).toLocaleString('id-ID')}</p>
                <div className="mt-4 px-3 py-1 bg-success/10 rounded-full">
                    <p className="text-[10px] text-success font-bold uppercase">Real-time Data</p>
                </div>
            </div>

            <div className="card p-8 flex flex-col items-center text-center group hover:scale-[1.02] border-danger/20 bg-danger/5">
                <div className="size-16 rounded-2xl bg-danger/10 flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-danger text-4xl">shopping_cart</span>
                </div>
                <p className="text-xs font-black text-muted uppercase tracking-[0.2em]">Pengeluaran</p>
                <p className="text-3xl font-black text-main mt-2">Rp {(expenses || 0).toLocaleString('id-ID')}</p>
                <div className="mt-4 px-3 py-1 bg-danger/10 rounded-full">
                    <p className="text-[10px] text-danger font-bold uppercase">Operasional</p>
                </div>
            </div>

            <div className="card p-8 flex flex-col items-center text-center group hover:scale-[1.02] border-primary/20 bg-primary/5">
                <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-primary text-4xl">account_balance_wallet</span>
                </div>
                <p className="text-xs font-black text-muted uppercase tracking-[0.2em]">Profit Bersih</p>
                <p className="text-3xl font-black text-primary mt-2">Rp {(netProfit || 0).toLocaleString('id-ID')}</p>
                <div className="mt-4 px-3 py-1 bg-primary/10 rounded-full">
                    <p className="text-[10px] text-primary font-bold uppercase">Laba Akumulasi</p>
                </div>
            </div>
        </section>
    );
}

