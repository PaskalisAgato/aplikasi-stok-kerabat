import { useState } from 'react';
import { INVENTORY } from '@shared/mockDatabase';


import NavDrawer from '@shared/NavDrawer';




function App() {
    const [drawerOpen, setDrawerOpen] = useState(false);
    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen flex flex-col antialiased">
            <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} currentPort={5177} />
            <div className="relative flex h-auto min-h-screen w-full flex-col max-w-md mx-auto shadow-2xl border-x border-slate-800/10 dark:border-slate-800/30">

                {/* Top Navigation Header */}
                <header className="sticky top-0 z-30 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md border-b border-primary/10 px-4 py-4 flex items-center gap-2">
                    <button onClick={() => setDrawerOpen(true)} className="size-10 flex items-center justify-center rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors active:scale-95 shrink-0">
                        <span className="material-symbols-outlined">menu</span>
                    </button>
                    <div className="flex items-center gap-3">
                        <div>
                            <h1 className="text-lg font-bold leading-tight tracking-tight">Stock Opname</h1>
                            <p className="text-xs text-primary font-bold uppercase tracking-wider mt-0.5">Kerabat Kopi Tiam</p>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto pb-8">

                    {/* Search Bar */}
                    <div className="p-4 relative z-20">
                        <div className="relative group shadow-sm rounded-xl">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors">search</span>
                            </div>
                            <input
                                className="block w-full pl-11 pr-4 py-3 bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/20 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-medium outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                placeholder="Search ingredients (e.g. Condensed Milk)"
                                type="text"
                            />
                        </div>
                    </div>

                    {/* Section Header */}
                    <div className="px-4 py-2 flex items-center justify-between">
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 tracking-tight">Ingredient List</h3>
                        <span className="text-[10px] bg-primary/10 border border-primary/20 text-primary px-2.5 py-1 rounded-full font-extrabold uppercase tracking-wider shadow-sm">
                            12 Items
                        </span>
                    </div>

                    {/* Inventory List */}
                    <div className="px-4 space-y-4 pt-2">
                        {INVENTORY.map(item => (
                            <div key={item.id} className="bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/10 rounded-2xl p-4 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500"></div>

                                <div className="flex gap-4 items-start mb-5">
                                    <div
                                        className="size-16 rounded-xl shrink-0 border border-slate-200 dark:border-primary/20 shadow-inner bg-cover bg-center"
                                        style={{ backgroundImage: `url('${item.imageUrl || "https://images.unsplash.com/photo-1559525839-b184a4d698c7?q=80&w=200&auto=format&fit=crop"}')` }}
                                        title={item.name}
                                    ></div>
                                    <div className="flex-1">
                                        <p className="font-bold text-base tracking-tight text-slate-900 dark:text-slate-100">{item.name}</p>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">Unit: {item.unit}</p>
                                        <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded border border-slate-200 dark:border-primary/20 bg-slate-50 dark:bg-primary/10 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider shadow-sm">
                                            <span className="material-symbols-outlined text-[14px]">inventory_2</span>
                                            System: {item.systemStock}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] uppercase font-extrabold text-slate-500 dark:text-slate-400 tracking-wider">Physical Stock</label>
                                        <div className="relative">
                                            <input
                                                className="w-full bg-slate-50 dark:bg-primary/5 border border-slate-200 dark:border-primary/10 rounded-xl text-center font-bold text-lg py-2.5 focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-primary/10 transition-all outline-none"
                                                type="number"
                                                defaultValue={item.currentStock}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] uppercase font-extrabold text-slate-500 dark:text-slate-400 tracking-wider">Difference</label>
                                        <div className={`w-full rounded-xl text-center font-extrabold text-lg py-2.5 border flex items-center justify-center gap-1 shadow-sm ${(item.currentStock - item.systemStock) < 0 ? 'bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/30' :
                                                (item.currentStock - item.systemStock) > 0 ? 'bg-green-50 dark:bg-green-900/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-900/30' :
                                                    'bg-slate-50 dark:bg-slate-900/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800/30'
                                            }`}>
                                            {(item.currentStock - item.systemStock).toFixed(2)}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-800/50 pt-4 mt-2">
                                    <label className="text-[10px] uppercase font-extrabold text-slate-500 dark:text-slate-400 tracking-wider">Reason for Adjustment</label>
                                    <div className="relative">
                                        <select className="w-full bg-slate-50 dark:bg-primary/5 border border-slate-200 dark:border-primary/10 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 py-3 pl-3 pr-10 focus:ring-2 focus:ring-primary appearance-none outline-none transition-all">
                                            <option>Select Reason</option>
                                            <option>Spillage</option>
                                            <option>Counting Error</option>
                                            <option>Theft/Missing</option>
                                            <option>Expired</option>
                                        </select>
                                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                                    </div>
                                </div>
                            </div>
                        ))}

                    </div>
                </main>



            </div>
        </div>
    );
}

export default App;
