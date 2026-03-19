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
        <div className="bg-background-app  text-slate-900  min-h-screen flex flex-col font-display antialiased">
            <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} currentPort={5183} />
            <div className="relative flex h-auto min-h-screen w-full flex-col max-w-md mx-auto shadow-2xl border-x border-slate-800/10  overflow-x-hidden pb-8">

                {/* Header Section */}
                <header className="sticky top-0 z-50 bg-background-app/90  backdrop-blur-md border-b border-primary/10">
                    <div className="flex items-center p-4 gap-2">
                        <button onClick={() => setDrawerOpen(true)} className="size-10 flex items-center justify-center rounded-full hover:bg-primary/10 transition-colors active:scale-95 text-primary shrink-0">
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                        <div className="flex-1">
                            <h1 className="text-xs font-bold text-primary uppercase tracking-wider mb-0.5">Detail Pemborosan</h1>
                            <h2 className="text-xl font-extrabold leading-tight tracking-tight text-slate-900 ">{item.name}</h2>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto">

                    {/* Ingredient Context */}
                    <div className="p-4 flex items-center gap-4">
                        <div
                            className="size-20 rounded-2xl bg-white  bg-cover bg-center border border-slate-200  shadow-sm shrink-0"
                            style={{ backgroundImage: `url('${item.imageUrl || "https://images.unsplash.com/photo-1550508127-160fa31b2628?q=80&w=200&auto=format&fit=crop"}')` }}
                            title={item.name}
                        ></div>
                        <div className="flex-1">
                            <p className="text-slate-500  text-xs font-semibold uppercase tracking-wider mb-0.5">Outlet</p>
                            <p className="font-extrabold text-lg tracking-tight text-slate-900 ">Kerabat Kopi Tiam</p>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-primary/10  text-primary border border-primary/20  uppercase tracking-wider shadow-sm">{item.category}</span>
                                <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-emerald-500/10  text-emerald-600  border border-emerald-500/20  uppercase tracking-wider shadow-sm">In Stock</span>
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards Grid */}
                    <div className="px-4 grid grid-cols-2 gap-3 pb-2 pt-2">
                        <div className="col-span-2 bg-slate-50  border border-slate-200  rounded-2xl p-5 shadow-sm">
                            <p className="text-slate-500  text-xs font-bold uppercase tracking-widest">Total Terbuang (30 Hari)</p>
                            <div className="flex items-end justify-between mt-2">
                                <p className="text-3xl font-extrabold text-slate-900  tracking-tight">
                                    {totalTerbuang} <span className="text-lg font-semibold text-slate-500  ml-1">{item.unit}</span>
                                </p>
                                <div className="flex flex-col items-end gap-1">
                                    <span className="text-rose-600  flex items-center gap-0.5 text-[11px] font-bold bg-rose-500/10 px-2 py-0.5 rounded shadow-sm border border-rose-500/20">
                                         Live Data
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50  border border-slate-200  rounded-2xl p-4 shadow-sm">
                            <p className="text-slate-500  text-[10px] font-bold uppercase tracking-wider">Nilai Kerugian</p>
                            <p className="text-lg font-extrabold mt-1.5 tracking-tight text-slate-900 ">Rp {nilaiKerugian.toLocaleString('id-ID')}</p>
                        </div>

                        <div className="bg-slate-50  border border-slate-200  rounded-2xl p-4 shadow-sm">
                            <p className="text-slate-500  text-[10px] font-bold uppercase tracking-wider">Harga Satuan</p>
                            <p className="text-lg font-extrabold mt-1.5 tracking-tight text-slate-900 ">Rp {parseFloat(item.pricePerUnit).toLocaleString('id-ID')}</p>
                        </div>
                    </div>

                    {/* Waste Reasons Breakdown - Remains static representation for now */}
                    <section className="mt-8 px-4">
                        <h3 className="text-[11px] font-extrabold text-slate-500  uppercase tracking-widest mb-4">Penyebab Utama</h3>
                        <div className="space-y-4.5 flex flex-col gap-4">
                            <div className="group">
                                <div className="flex justify-between items-end mb-1.5 text-sm">
                                    <span className="font-bold tracking-tight text-slate-800 ">Kadaluarsa (Expired)</span>
                                    <span className="text-primary font-extrabold">50%</span>
                                </div>
                                <div className="w-full bg-slate-100  h-2.5 rounded-full overflow-hidden shadow-inner flex">
                                    <div className="bg-primary hover:bg-primary/90 transition-colors h-full rounded-full" style={{ width: '50%' }}></div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Recent Waste Log */}
                    <section className="mt-8 px-4 pb-8">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-[11px] font-extrabold text-slate-500  uppercase tracking-widest">Log Pembuangan</h3>
                        </div>

                        <div className="space-y-3">
                            {wasteLogs.length === 0 ? (
                                <p className="text-center text-slate-400 py-8 italic text-sm">Tidak ada log pembuangan untuk bahan ini.</p>
                            ) : (
                                wasteLogs.map((log: any) => (
                                    <div key={log.id} className="bg-white  p-4 rounded-2xl border border-slate-200  shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start">
                                            <div className="flex flex-col gap-0.5">
                                                <p className="font-extrabold text-sm tracking-tight text-slate-900 ">{log.quantity} {item.unit}</p>
                                                <p className="text-[11px] font-medium text-slate-500 ">{log.reason || 'Tidak ada alasan'}</p>
                                            </div>
                                            <div className="text-right flex flex-col gap-1 items-end">
                                                <p className="text-[11px] font-bold text-slate-700 ">
                                                    {new Date(log.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                                <p className="text-[9px] text-primary font-extrabold uppercase tracking-wider bg-primary/10 px-1.5 py-0.5 rounded">SYSTEM</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                </main>

                {/* Bottom Action */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background-light  to-transparent pt-10 max-w-md mx-auto z-40">
                    <button onClick={() => window.history.back()} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined">arrow_back</span>
                        Kembali ke Ringkasan
                    </button>
                </div>

            </div>
        </div>
    );
}

export default App;

