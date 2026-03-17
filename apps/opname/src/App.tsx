import { useState, useEffect } from 'react';
import { apiClient } from '@shared/apiClient';
import NavDrawer from '@shared/NavDrawer';

function App() {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [inventoryList, setInventoryList] = useState<any[]>([]);
    const [physicalStocks, setPhysicalStocks] = useState<Record<number, string>>({});
    const [reasons, setReasons] = useState<Record<number, string>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const fetchInventory = async () => {
        try {
            setIsLoading(true);
            const data = await apiClient.getInventory();
            setInventoryList(data);
            
            // Initialize physical stocks with current stock values
            const initialStocks: Record<number, string> = {};
            data.forEach((item: any) => {
                initialStocks[item.id] = item.currentStock.toString();
            });
            setPhysicalStocks(initialStocks);
        } catch (error) {
            console.error('Failed to load inventory', error);
            alert('Gagal memuat data inventaris.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchInventory();
    }, []);

    const handleStockChange = (id: number, value: string) => {
        setPhysicalStocks(prev => ({ ...prev, [id]: value }));
    };

    const handleReasonChange = (id: number, value: string) => {
        setReasons(prev => ({ ...prev, [id]: value }));
    };

    const handleSaveOpname = async () => {
        setIsSaving(true);
        try {
            const adjustments = inventoryList.map(item => ({
                inventoryId: item.id,
                physicalStock: physicalStocks[item.id] || item.currentStock.toString(),
                reason: reasons[item.id] || 'Manual Opname'
            })).filter(adj => {
                const item = inventoryList.find(i => i.id === adj.inventoryId);
                return adj.physicalStock !== item.currentStock.toString();
            });

            if (adjustments.length === 0) {
                alert('Tidak ada perubahan stok yang dideteksi.');
                return;
            }

            await apiClient.submitOpname(adjustments);
            alert('Hasil opname berhasil disimpan!');
            await fetchInventory(); // Refresh data
        } catch (error) {
            console.error('Failed to save opname', error);
            alert('Gagal menyimpan hasil opname.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-background-app  font-display text-slate-900  min-h-screen flex flex-col antialiased">
            <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} currentPort={5177} />
            <div className="relative flex h-auto min-h-screen w-full flex-col max-w-md mx-auto shadow-2xl border-x border-slate-800/10 ">

                {/* Top Navigation Header */}
                <header className="sticky top-0 z-30 bg-background-app/90  backdrop-blur-md border-b border-primary/10 px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <button onClick={() => setDrawerOpen(true)} className="size-10 flex items-center justify-center rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors active:scale-95 shrink-0">
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                        <div>
                            <h1 className="text-lg font-bold leading-tight tracking-tight">Stock Opname</h1>
                            <p className="text-[10px] text-primary font-bold uppercase tracking-wider mt-0.5">Kerabat Kopi Tiam</p>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto pb-32">
                    {/* Search Bar */}
                    <div className="p-4 relative z-20">
                        <div className="relative group shadow-sm rounded-xl">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors">search</span>
                            </div>
                            <input
                                className="block w-full pl-11 pr-4 py-3 bg-white  border border-slate-200  rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-medium outline-none placeholder:text-slate-400 "
                                placeholder="Cari bahan baku..."
                                type="text"
                            />
                        </div>
                    </div>

                    {/* Section Header */}
                    <div className="px-4 py-2 flex items-center justify-between">
                        <h3 className="font-bold text-slate-900  tracking-tight">Daftar Bahan Baku</h3>
                        <span className="text-[10px] bg-primary/10 border border-primary/20 text-primary px-2.5 py-1 rounded-full font-extrabold uppercase tracking-wider shadow-sm">
                            {inventoryList.length} Items
                        </span>
                    </div>

                    {/* Inventory List */}
                    <div className="px-4 space-y-4 pt-2">
                        {isLoading ? (
                            <div className="flex justify-center py-10">
                                <span className="material-symbols-outlined animate-spin text-primary">refresh</span>
                            </div>
                        ) : inventoryList.map(item => {
                            const physical = parseFloat(physicalStocks[item.id] || item.currentStock);
                            const system = parseFloat(item.currentStock);
                            const diff = physical - system;

                            return (
                                <div key={item.id} className="bg-white  border border-slate-200  rounded-2xl p-4 shadow-sm relative overflow-hidden group">
                                    <div className="flex gap-4 items-start mb-5">
                                        <div
                                            className="size-16 rounded-xl shrink-0 border border-slate-200  shadow-inner bg-cover bg-center bg-slate-100"
                                            style={{ backgroundImage: item.imageUrl ? `url('${item.imageUrl}')` : 'none' }}
                                        >
                                            {!item.imageUrl && <span className="material-symbols-outlined text-slate-300 flex items-center justify-center h-full">image</span>}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-base tracking-tight text-slate-900 ">{item.name}</p>
                                            <p className="text-[11px] text-slate-500  font-medium mt-0.5">Satuan: {item.unit}</p>
                                            <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded border border-slate-200  bg-slate-50  text-[10px] font-bold text-slate-600  uppercase tracking-wider shadow-sm">
                                                <span className="material-symbols-outlined text-[14px]">inventory_2</span>
                                                Sistem: {item.currentStock}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] uppercase font-extrabold text-slate-500  tracking-wider">Stok Fisik</label>
                                            <div className="relative">
                                                <input
                                                    className="w-full bg-slate-50  border border-slate-200  rounded-xl text-center font-bold text-lg py-2.5 focus:ring-2 focus:ring-primary focus:bg-white  transition-all outline-none"
                                                    type="number"
                                                    value={physicalStocks[item.id] || ''}
                                                    onChange={(e) => handleStockChange(item.id, e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] uppercase font-extrabold text-slate-500  tracking-wider">Selisih</label>
                                            <div className={`w-full rounded-xl text-center font-extrabold text-lg py-2.5 border flex items-center justify-center gap-1 shadow-sm ${diff < 0 ? 'bg-red-50  text-red-600  border-red-200 ' :
                                                    diff > 0 ? 'bg-green-50  text-green-600  border-green-200 ' :
                                                        'bg-slate-50  text-slate-600  border-slate-200 '
                                                }`}>
                                                {diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 border-t border-slate-100  pt-4 mt-2">
                                        <label className="text-[10px] uppercase font-extrabold text-slate-500  tracking-wider">Alasan Penyesuaian</label>
                                        <div className="relative">
                                            <select 
                                                className="w-full bg-slate-50  border border-slate-200  rounded-xl text-sm font-medium text-slate-700  py-3 pl-3 pr-10 focus:ring-2 focus:ring-primary appearance-none outline-none transition-all"
                                                value={reasons[item.id] || ''}
                                                onChange={(e) => handleReasonChange(item.id, e.target.value)}
                                            >
                                                <option value="">Pilih Alasan</option>
                                                <option value="Spillage">Tumpah/Rusak</option>
                                                <option value="Counting Error">Salah Hitung</option>
                                                <option value="Theft/Missing">Gak Jelas/Hilang</option>
                                                <option value="Expired">Kadaluwarsa</option>
                                            </select>
                                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </main>

                <div className="fixed bottom-0 left-0 right-0 p-4 bg-background-app/80  backdrop-blur-md border-t border-primary/10 z-40 max-w-md mx-auto">
                    <button 
                        onClick={handleSaveOpname}
                        disabled={isSaving || isLoading}
                        className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:bg-slate-400"
                    >
                        {isSaving ? (
                            <span className="material-symbols-outlined animate-spin">refresh</span>
                        ) : (
                            <span className="material-symbols-outlined">save</span>
                        )}
                        {isSaving ? 'Menyimpan...' : 'Simpan Hasil Opname'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default App;

