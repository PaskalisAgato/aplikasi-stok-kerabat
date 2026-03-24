import { useState, useEffect } from 'react';
import { apiClient } from '@shared/apiClient';
import Layout from '@shared/Layout';

function App() {
    const [item, setItem] = useState<any>(null);
    const [wasteLogs, setWasteLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const urlParams = new URLSearchParams(window.location.search);
    const itemId = parseInt(urlParams.get('id') || '1');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const inventory = await apiClient.getInventory();
                const foundItem = inventory.data.find((i: any) => i.id === itemId);
                setItem(foundItem);

                const logs = await apiClient.getItemWaste(itemId);
                setWasteLogs(logs.data);
            } catch (error) {
                console.error('Failed to fetch waste detail', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [itemId]);

    const totalTerbuang = wasteLogs.reduce((sum, log) => sum + parseFloat(log.quantity), 0);
    const nilaiKerugian = item ? totalTerbuang * parseFloat(item.pricePerUnit) : 0;

    return (
        <Layout
            currentPort={5185}
            title={item?.name || "Waste Detail"}
            subtitle="Loss Intelligence"
            footer={
                <footer className="p-8 glass border-t border-white/5 shrink-0 z-50">
                    <button 
                        onClick={() => window.history.back()}
                        className="w-full bg-primary text-white font-black text-xs uppercase tracking-[0.3em] py-5 rounded-[2rem] shadow-3xl shadow-primary/40 flex items-center justify-center gap-4 active:scale-[0.95] hover:scale-[1.02] transition-all"
                    >
                        <span className="material-symbols-outlined font-black">arrow_back</span>
                        Kembali ke Ringkasan
                    </button>
                </footer>
            }
        >
            {isLoading ? (
                <div className="flex flex-col justify-center items-center py-32 gap-6 glass rounded-[3rem] opacity-60">
                    <div className="size-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Menganalisis Detail...</p>
                </div>
            ) : !item ? (
                <div className="flex flex-col items-center justify-center p-16 text-center glass rounded-[3rem] border-dashed border-2 opacity-40">
                    <span className="material-symbols-outlined text-6xl text-primary font-black mb-4">error</span>
                    <p className="font-black text-xs uppercase tracking-widest">Bahan tidak ditemukan</p>
                    <button onClick={() => window.history.back()} className="mt-4 text-primary font-bold uppercase text-[10px] tracking-widest">Kembali</button>
                </div>
            ) : (
                <div className="space-y-12">
                    {/* Item Hero */}
                    <section className="flex flex-col items-center gap-8 py-6">
                        <div className="relative group">
                            <div
                                className="size-40 rounded-[2.5rem] glass border-4 border-white/10 bg-cover bg-center overflow-hidden shadow-2xl group-hover:rotate-3 transition-transform duration-500"
                                style={{ backgroundImage: `url('${item.imageUrl || "https://images.unsplash.com/photo-1550508127-160fa31b2628?q=80&w=200&auto=format&fit=crop"}')` }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-primary text-white p-3 rounded-2xl shadow-2xl border-4 border-[var(--bg-app)]">
                                <span className="material-symbols-outlined text-xl font-black">inventory_2</span>
                            </div>
                        </div>
                        <div className="text-center space-y-2">
                            <h2 className="text-3xl font-black font-display tracking-tight text-primary uppercase leading-none">{item.name}</h2>
                            <div className="flex items-center justify-center gap-3">
                                <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">{item.category}</span>
                                <span className="px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">Active Analysis</span>
                            </div>
                        </div>
                    </section>

                    {/* Impact Metrics */}
                    <section className="grid grid-cols-2 gap-6">
                        <div className="col-span-2 card p-8 border-white/5 bg-gradient-to-br from-primary/10 to-transparent relative overflow-hidden group">
                            <div className="relative z-10 space-y-2">
                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Total Loss (30D)</p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-5xl font-black font-display tracking-tighter text-[var(--text-main)] group-hover:scale-105 transition-transform origin-left">{totalTerbuang}</p>
                                    <p className="text-xl font-black text-primary uppercase opacity-60">{item.unit}</p>
                                </div>
                            </div>
                            <span className="absolute -right-4 -bottom-4 material-symbols-outlined text-[100px] text-primary/5 font-black rotate-12">trending_down</span>
                        </div>

                        <div className="glass p-6 rounded-[2rem] border-white/5 space-y-2">
                            <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-60">Revenue Loss</p>
                            <p className="text-xl font-black font-display text-[var(--text-main)]">Rp {nilaiKerugian.toLocaleString('id-ID')}</p>
                        </div>

                        <div className="glass p-6 rounded-[2rem] border-white/5 space-y-2">
                            <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-60">Unit Cost</p>
                            <p className="text-xl font-black font-display text-[var(--text-main)]">Rp {parseFloat(item.pricePerUnit).toLocaleString('id-ID')}</p>
                        </div>
                    </section>

                    {/* Breakdown */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-4 px-2">
                            <span className="material-symbols-outlined text-primary font-black">bar_chart</span>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] opacity-60">Causal Analysis</h3>
                        </div>
                        <div className="card p-8 border-white/5">
                            <div className="space-y-6">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-[var(--text-main)]">Kadaluarsa (Expired)</span>
                                    <span className="text-primary">50%</span>
                                </div>
                                <div className="h-4 w-full glass rounded-full overflow-hidden p-1 border-white/5">
                                    <div className="h-full bg-primary rounded-full shadow-[0_0_15px_rgba(255,191,0,0.4)]" style={{ width: '50%' }}></div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Recent Logs */}
                    <section className="space-y-6 pb-10">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-4">
                                <span className="material-symbols-outlined text-primary font-black">history</span>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] opacity-60">Audit Trail</h3>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {wasteLogs.length === 0 ? (
                                <div className="card p-12 text-center border-dashed border-white/10 opacity-40">
                                    <p className="text-xs font-black uppercase tracking-widest">No Records Found</p>
                                </div>
                            ) : (
                                wasteLogs.map((log: any) => (
                                    <div key={log.id} className="card p-6 border-white/5 hover:bg-white/5 transition-all flex items-center justify-between group">
                                        <div className="space-y-1">
                                            <p className="text-lg font-black font-display text-[var(--text-main)] leading-none group-hover:text-primary transition-colors">
                                                {log.quantity} {item.unit}
                                            </p>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60">{log.reason || 'Manual Adjustment'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">
                                                {new Date(log.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                            </p>
                                            <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-40">
                                                {new Date(log.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                </div>
            )}
        </Layout>
    );
}

export default App;
