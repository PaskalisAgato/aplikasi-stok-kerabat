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
        <div className="bg-background-light  text-slate-900  min-h-screen flex flex-col font-display antialiased">
            <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} currentPort={5184} />
            <div className="relative flex h-auto min-h-screen w-full flex-col max-w-md mx-auto shadow-2xl border-x border-slate-800/10  overflow-x-hidden pb-8">

                {/* Header */}
                <header className="sticky top-0 z-30 bg-background-light/90  backdrop-blur-md border-b border-primary/10 px-4 py-4">
                    <div className="flex items-center gap-2">
                        <button onClick={() => setDrawerOpen(true)} className="size-10 flex items-center justify-center rounded-full bg-primary/10 hover:bg-primary/20 transition-colors active:scale-95 text-primary shrink-0">
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>menu</span>
                        </button>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => window.location.href = `http://${window.location.hostname}:5173`}
                                className="flex items-center justify-center size-10 rounded-full hover:bg-primary/10 transition-colors active:scale-95 text-primary"
                            >
                                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>arrow_back</span>
                            </button>
                            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 ">Kelola Resep & HPP</h1>
                        </div>
                    </div>
                </header>

                {/* Search & Filters */}
                <div className="px-4 pt-6 pb-2 space-y-4 sticky top-[73px] z-20 bg-background-light/95  backdrop-blur-sm">
                    <label className="relative flex items-center group">
                        <span className="material-symbols-outlined absolute left-4 text-slate-400 group-focus-within:text-primary transition-colors text-[22px]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>search</span>
                        <input
                            className="w-full h-12 pl-12 pr-4 rounded-xl border border-slate-200  bg-slate-100  focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-slate-900  placeholder:text-slate-500 font-medium transition-all shadow-sm"
                            placeholder="Cari menu (Kopi O, Teh Tarik...)"
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </label>

                    <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        {/* Inline styles used for scrollbar-hide to ensure it works without custom css classes initially */}
                        <style>{`
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
            `}</style>

                        {['Semua', 'Minuman', 'Makanan', 'Snack'].map(cat => (
                            <button
                                key={cat}
                                onClick={() => setFilterCategory(cat)}
                                className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors active:scale-95 shadow-sm ${filterCategory === cat
                                    ? 'bg-primary text-white shadow-primary/20'
                                    : 'bg-white  text-slate-700  border border-slate-200  hover:bg-primary/10'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Menu List */}
                <main className="flex-1 px-4 py-2 space-y-4">
                    {filteredRecipes.map(recipe => (
                        <div key={recipe.id} className="bg-white [#1a140f] border border-slate-200  rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
                            <div className="flex p-4 gap-4">
                                <div
                                    className="size-24 rounded-xl bg-slate-100  bg-cover bg-center shrink-0 border border-slate-100  shadow-inner group-hover:scale-105 transition-transform duration-500"
                                    style={{ backgroundImage: `url('${recipe.imageUrl || "https://images.unsplash.com/photo-1559525839-b184a4d698c7?q=80&w=200&auto=format&fit=crop"}')` }}
                                    title={recipe.name}
                                ></div>
                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start gap-2">
                                            <h3 className="font-extrabold text-lg text-slate-900  tracking-tight leading-tight">{recipe.name}</h3>
                                            <span className="px-2 py-1 rounded-md text-[9px] font-extrabold bg-green-500/10 text-green-600  border border-green-500/20 uppercase tracking-widest shrink-0 shadow-sm">Margin {recipe.margin}%</span>
                                        </div>
                                        <p className="text-[13px] text-slate-500  mt-1.5 italic font-medium leading-snug">{recipe.description}</p>
                                    </div>

                                    <div className="flex justify-between items-end pt-3 border-t border-slate-100  mt-2">
                                        <div className="space-y-0.5">
                                            <p className="text-[10px] text-slate-400  uppercase font-bold tracking-widest">HPP: Rp {recipe.hpp.toLocaleString('id-ID')}</p>
                                            <p className="text-primary font-extrabold text-base tracking-tight">Rp {recipe.price.toLocaleString('id-ID')}</p>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedRecipe(recipe);
                                            }}
                                            className="size-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-primary  text-slate-600 hover:text-white    transition-all active:scale-90 shadow-sm">
                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    {isLoading && (
                        <div className="flex justify-center items-center py-10">
                            <span className="material-symbols-outlined animate-spin text-primary text-3xl">refresh</span>
                        </div>
                    )}

                    {!isLoading && filteredRecipes.length === 0 && (
                        <div className="text-center py-10 text-slate-500">
                            <p>Belum ada Menu/Resep Tersedia</p>
                        </div>
                    )}
                </main>

                {/* Floating Action Button */}
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
                    className="fixed bottom-6 right-4 sm:right-auto sm:left-[calc(50%+192px-72px)] size-14 bg-gradient-to-br from-primary to-[#b36a2b] hover:from-[#b36a2b] hover:to-[#915421] text-white rounded-full shadow-lg shadow-primary/30 flex items-center justify-center z-40 ring-4 ring-background-light  transition-transform active:scale-95 group">
                    <span className="material-symbols-outlined text-[32px] group-hover:rotate-90 transition-transform duration-300">add</span>
                </button>
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

