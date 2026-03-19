import { useState, useEffect } from 'react';
import { apiClient } from '@shared/apiClient';
import NavDrawer from '@shared/NavDrawer';

function App() {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [item, setItem] = useState<any>(null);
    const [wasteLogs, setWasteLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // In a real app, ID would come from URL. Mocking ID 1 for now or from query param.
    const urlParams = new URLSearchParams(window.location.search);
    const itemId = parseInt(urlParams.get('id') || '1');

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch inventory master to get name/image
                const inventory = await apiClient.getInventory();
                const foundItem = inventory.find((i: any) => i.id === itemId);
                setItem(foundItem);

                // Fetch waste logs
                const logs = await apiClient.getItemWaste(itemId);
                setWasteLogs(logs);
            } catch (error) {
                console.error('Failed to fetch waste detail', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [itemId]);

    if (isLoading) {
        return (
            <div className="bg-background-app  min-h-screen flex items-center justify-center">
                 <span className="material-symbols-outlined animate-spin text-primary text-4xl">refresh</span>
            </div>
        );
    }

    if (!item) {
        return (
            <div className="bg-background-app  min-h-screen flex flex-col items-center justify-center p-4">
                 <p className="text-slate-500 font-bold">Bahan tidak ditemukan.</p>
                 <button onClick={() => window.history.back()} className="mt-4 text-primary font-bold">Kembali</button>
            </div>
        );
    }

    const totalTerbuang = wasteLogs.reduce((sum, log) => sum + parseFloat(log.quantity), 0);
    const nilaiKerugian = totalTerbuang * parseFloat(item.pricePerUnit);

    return (
        <div className="bg-[var(--bg-app)] font-display text-[var(--text-main)] min-h-screen pb-32 antialiased animate-in fade-in duration-700">
            <div className="relative flex h-auto min-h-screen w-full flex-col max-w-2xl mx-auto glass border-x border-white/5 overflow-x-hidden shadow-2xl">
                <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} currentPort={5183} />
                
                {/* Header */}
                <header className="sticky top-0 z-50 glass border-b border-white/5 px-8 py-6 flex items-center justify-between shadow-xl">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => setDrawerOpen(true)}
                            className="size-12 glass flex items-center justify-center rounded-2xl text-primary hover:bg-primary/10 active:scale-90 transition-all border-white/10"
                        >
                            <span className="material-symbols-outlined font-black">menu</span>
                        </button>
                        <div className="space-y-1">
                            <h1 className="text-2xl font-black font-display tracking-tight text-[var(--text-main)] uppercase leading-none">Waste Detail</h1>
                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] opacity-80 leading-tight">Loss Intelligence</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => window.history.back()}
                        className="size-12 glass flex items-center justify-center rounded-2xl text-[var(--text-muted)] hover:bg-white/5 active:scale-90 transition-all border-white/10"
                    >
                        <span className="material-symbols-outlined font-black">arrow_back</span>
                    </button>
                </header>

                <main className="flex-1 p-8 space-y-12 custom-scrollbar animate-in fade-in slide-in-from-bottom-4 duration-1000">
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
                    <section className="space-y-6 pb-20">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-4">
                                <span className="material-symbols-outlined text-primary font-black">history</span>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] opacity-60">Audit Trail</h3>
                            </div>
                            <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">See All</button>
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
                </main>

                {/* Sticky Action */}
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-md px-8 z-50">
                    <button 
                        onClick={() => window.history.back()}
                        className="w-full bg-primary text-white font-black text-xs uppercase tracking-[0.3em] py-5 rounded-[2rem] shadow-3xl shadow-primary/40 flex items-center justify-center gap-4 active:scale-[0.95] hover:scale-[1.02] transition-all"
                    >
                        <span className="material-symbols-outlined font-black">arrow_back</span>
                        Kembali ke Ringkasan
                    </button>
                </div>
            </div>
        </div>
    );
}

export default App;

