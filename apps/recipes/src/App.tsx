import { useState, useEffect } from 'react';
import { apiClient } from '@shared/apiClient';
import type { Recipe } from '@shared/mockDatabase'; // Types still useful

import NavDrawer from '@shared/NavDrawer';
import EditRecipeModal from './components/EditRecipeModal';

function App() {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [filterCategory, setFilterCategory] = useState<string>('Semua');
    const [searchQuery, setSearchQuery] = useState('');
    const [recipesList, setRecipesList] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchRecipes = async () => {
        try {
            setIsLoading(true);
            const data = await apiClient.getRecipes();
            setRecipesList(data);
        } catch (error) {
            console.error('Fetch recipes failed', error);
            alert('Gagal mengambil daftar resep.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRecipes();
    }, []);

    const filteredRecipes = recipesList.filter(recipe => {
        const matchCategory = filterCategory === 'Semua' || recipe.category === filterCategory;
        const matchSearch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCategory && matchSearch;
    });

    return (
    return (
        <div className="bg-[var(--bg-app)] font-display text-[var(--text-main)] min-h-screen pb-32 antialiased animate-in fade-in duration-700">
            <div className="relative flex h-auto min-h-screen w-full flex-col max-w-2xl mx-auto glass border-x border-white/5 overflow-x-hidden shadow-2xl">
                <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} currentPort={5184} />

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
                            <h1 className="text-2xl font-black font-display tracking-tight text-[var(--text-main)] uppercase">Menu & Resep</h1>
                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] opacity-80 font-bold leading-tight">Manajemen Harga Pokok Produksi</p>
                        </div>
                    </div>
                </header>

                {/* Search & Filters */}
                <div className="px-8 pt-10 pb-4 space-y-8 sticky top-[80px] z-20 glass border-b border-white/5 shadow-lg animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="relative group max-w-2xl">
                        <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-primary font-black">search</span>
                        <input
                            className="block w-full pl-14 pr-6 py-5 glass border-none rounded-[2rem] focus:ring-4 focus:ring-primary/20 text-[var(--text-main)] placeholder:text-[var(--text-muted)] text-base font-bold shadow-inner"
                            placeholder="Cari Menu atau Produk..."
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-none animate-in fade-in slide-in-from-left duration-1000 delay-200">
                        {['Semua', 'Minuman', 'Makanan', 'Snack'].map(cat => (
                            <button
                                key={cat}
                                onClick={() => setFilterCategory(cat)}
                                className={`px-8 py-3 rounded-2xl text-[10px] uppercase font-black tracking-widest transition-all active:scale-90 border shadow-xl ${filterCategory === cat
                                    ? 'btn-primary shadow-primary/20 scale-105'
                                    : 'glass text-[var(--text-muted)] border-white/5 hover:bg-primary/10 opacity-60'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Menu List */}
                <main className="flex-1 px-8 py-10 space-y-6 custom-scrollbar animate-in fade-in zoom-in duration-1000">
                    {filteredRecipes.map((recipe, idx) => (
                        <div 
                            key={recipe.id} 
                            style={{ animationDelay: `${idx * 50}ms` }}
                            className="card group p-6 flex flex-col sm:flex-row gap-6 transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] border-white/5 animate-in fade-in slide-in-from-bottom-4"
                        >
                            <div
                                className="size-32 rounded-[2rem] bg-[var(--bg-app)] bg-cover bg-center shrink-0 border-4 border-white/10 shadow-2xl transition-transform duration-700 group-hover:rotate-3 group-hover:scale-110"
                                style={{ backgroundImage: `url('${recipe.imageUrl || "https://images.unsplash.com/photo-1559525839-b184a4d698c7?q=80&w=200&auto=format&fit=crop"}')` }}
                            ></div>
                            
                            <div className="flex-1 flex flex-col justify-between space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-start gap-4">
                                        <h3 className="text-2xl font-black font-display tracking-tight text-[var(--text-main)] uppercase leading-tight group-hover:text-primary transition-colors truncate">{recipe.name}</h3>
                                        <div className="glass px-3 py-1.5 rounded-xl border-emerald-500/20 flex flex-col items-center shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                                             <span className="text-[7px] font-black text-emerald-500 uppercase tracking-widest opacity-60 italic">Margin</span>
                                             <span className="text-xs font-black text-emerald-500">{recipe.margin}%</span>
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-60 leading-relaxed italic line-clamp-2">{recipe.description}</p>
                                </div>

                                <div className="flex justify-between items-center pt-6 border-t border-white/5 relative">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[8px] font-black text-primary uppercase tracking-[0.3em] opacity-60">HPP</span>
                                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Rp {recipe.hpp.toLocaleString('id-ID')}</p>
                                        </div>
                                        <p className="text-2xl font-black text-primary font-display tracking-tighter uppercase leading-none">Rp {recipe.price.toLocaleString('id-ID')}</p>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedRecipe(recipe);
                                        }}
                                        className="size-12 glass flex items-center justify-center rounded-2xl text-primary hover:bg-primary/20 active:scale-75 transition-all border-white/10 shadow-xl group/btn"
                                    >
                                        <span className="material-symbols-outlined text-2xl font-black group-hover/btn:rotate-45 transition-transform">edit_square</span>
                                    </button>
                                </div>
                            </div>
                            
                            {/* Decorative Background Blob */}
                            <div className="absolute top-0 right-0 size-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                        </div>
                    ))}
                    
                    {isLoading && (
                        <div className="flex flex-col justify-center items-center py-32 gap-6 glass rounded-[3rem] opacity-60">
                            <div className="size-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] animate-pulse">Menghubungkan Database...</p>
                        </div>
                    )}

                    {!isLoading && filteredRecipes.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-32 glass rounded-[3rem] opacity-40 border-dashed border-2">
                            <span className="material-symbols-outlined text-7xl text-primary font-black mb-6">restaurant_menu</span>
                            <p className="font-black text-lg uppercase tracking-widest text-[var(--text-main)]">Daftar Menu Kosong</p>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] mt-2 italic">Belum ada menu atau resep yang terdaftar.</p>
                        </div>
                    )}
                </main>

                {/* Floating Action Button (Premium) */}
                <div className="fixed bottom-10 inset-x-0 flex justify-center z-[100] px-6 pointer-events-none">
                    <button
                        onClick={() => setSelectedRecipe({
                            id: Date.now(),
                            name: '',
                            description: '',
                            category: 'Minuman',
                            hpp: 0,
                            price: 0,
                            margin: 0,
                            ingredients: []
                        })}
                        className="pointer-events-auto flex items-center gap-4 accent-gradient text-slate-950 px-10 py-5 rounded-[2rem] shadow-2xl shadow-primary/40 active:scale-75 transition-all border-none ring-8 ring-[var(--bg-app)] group"
                    >
                        <span className="material-symbols-outlined text-3xl font-black group-hover:rotate-12 transition-transform">add_circle</span>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em]">Tambah Menu Baru</span>
                    </button>
                </div>

                {selectedRecipe && (
                    <EditRecipeModal
                        recipe={selectedRecipe}
                        onClose={() => { setSelectedRecipe(null); fetchRecipes(); }}
                    />
                )}
            </div>
        </div>
                {/* Edit Recipe Modal */}
                {selectedRecipe && (
                    <EditRecipeModal
                        recipe={selectedRecipe}
                        onClose={() => { setSelectedRecipe(null); fetchRecipes(); }}
                    />
                )}
            </div>
        </div>
    );
}

export default App;

