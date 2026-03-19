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
        <div className="bg-[var(--bg-app)] font-display text-[var(--text-main)] min-h-screen antialiased animate-in fade-in duration-700 overflow-hidden">
            <div className="fixed inset-0 flex flex-col max-w-2xl mx-auto glass border-x border-white/5 shadow-2xl overflow-hidden">

                {/* Header */}
                <header className="z-50 glass border-b border-white/5 px-8 py-6 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => setDrawerOpen(true)}
                            className="size-12 glass flex items-center justify-center rounded-2xl text-primary hover:bg-primary/10 active:scale-90 transition-all border-white/10"
                        >
                            <span className="material-symbols-outlined font-black">menu</span>
                        </button>
                        <div className="space-y-1">
                            <h1 className="text-2xl font-black font-display tracking-tight text-[var(--text-main)] uppercase leading-tight">Menu & Resep</h1>
                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] opacity-80 font-bold leading-tight">Manajemen HPP</p>
                        </div>
                    </div>
                </header>

                {/* Search & Filters */}
                <div className="px-8 pt-8 pb-4 space-y-6 glass border-b border-white/5 shrink-0">
                    <div className="relative group w-full">
                        <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-primary font-black">search</span>
                        <input
                            className="block w-full pl-14 pr-6 py-4 glass border-none rounded-[2rem] focus:ring-4 focus:ring-primary/20 text-[var(--text-main)] placeholder:text-[var(--text-muted)] text-base font-bold shadow-inner"
                            placeholder="Cari Menu atau Produk..."
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                        {['Semua', 'Minuman', 'Makanan', 'Snack'].map(cat => (
                            <button
                                key={cat}
                                onClick={() => setFilterCategory(cat)}
                                className={`px-6 py-2 rounded-2xl text-[9px] uppercase font-black tracking-widest transition-all active:scale-90 border whitespace-nowrap ${filterCategory === cat
                                    ? 'btn-primary shadow-primary/20'
                                    : 'glass text-[var(--text-muted)] border-white/5 hover:bg-primary/10 opacity-60'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Menu List */}
                <main className="flex-1 overflow-y-auto px-8 py-10 space-y-6 custom-scrollbar">
                    {filteredRecipes.map((recipe, idx) => (
                        <div 
                            key={recipe.id} 
                            style={{ animationDelay: `${idx * 50}ms` }}
                            className="card group p-6 flex flex-col sm:flex-row gap-6 transition-all duration-500 hover:scale-[1.01] active:scale-[0.99] border-white/5 relative"
                        >
                            <div
                                className="size-28 rounded-[2rem] bg-[var(--bg-app)] bg-cover bg-center shrink-0 border-4 border-white/10 shadow-2xl transition-transform duration-700 group-hover:rotate-3"
                                style={{ backgroundImage: `url('${recipe.imageUrl || "https://images.unsplash.com/photo-1559525839-b184a4d698c7?q=80&w=200&auto=format&fit=crop"}')` }}
                            ></div>
                            
                            <div className="flex-1 flex flex-col justify-between space-y-4 min-w-0">
                                <div className="space-y-1">
                                    <div className="flex justify-between items-start gap-4">
                                        <h3 className="text-xl font-black font-display tracking-tight text-[var(--text-main)] uppercase leading-tight group-hover:text-primary transition-colors truncate">{recipe.name}</h3>
                                        <div className="glass px-2.5 py-1 rounded-xl border-emerald-500/20 flex flex-col items-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                                             <span className="text-[6px] font-black text-emerald-500 uppercase tracking-widest opacity-60">Margin</span>
                                             <span className="text-[10px] font-black text-emerald-500">{recipe.margin}%</span>
                                        </div>
                                    </div>
                                    <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-60 leading-relaxed italic line-clamp-1">{recipe.description}</p>
                                </div>

                                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[7px] font-black text-primary uppercase tracking-widest opacity-60">HPP</span>
                                            <p className="text-[9px] font-black text-[var(--text-muted)] uppercase">Rp {recipe.hpp.toLocaleString('id-ID')}</p>
                                        </div>
                                        <p className="text-xl font-black text-primary font-display uppercase tracking-tight">Rp {recipe.price.toLocaleString('id-ID')}</p>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedRecipe(recipe);
                                        }}
                                        className="size-11 glass flex items-center justify-center rounded-2xl text-primary hover:bg-primary/20 active:scale-75 transition-all border-white/10 group/btn"
                                    >
                                        <span className="material-symbols-outlined text-xl font-black group-hover/btn:rotate-45 transition-transform">edit_square</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    {isLoading && (
                        <div className="flex flex-col justify-center items-center py-20 gap-6 opacity-60">
                            <div className="size-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Memuat Menu...</p>
                        </div>
                    )}
                </main>

                {/* Fixed Footer Action */}
                <footer className="glass border-t border-white/5 p-8 shrink-0">
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
                        className="w-full flex items-center justify-center gap-4 accent-gradient text-slate-950 px-10 py-5 rounded-[2rem] shadow-2xl shadow-primary/20 active:scale-95 transition-all border-none group"
                    >
                        <span className="material-symbols-outlined text-3xl font-black group-hover:rotate-12 transition-transform">add_circle</span>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em]">Tambah Menu Baru</span>
                    </button>
                </footer>



                {/* Hamburger Drawer Overlay */}
                <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} currentPort={5184} />
            </div>
        </div>
    );
}

export default App;

