import { useState, memo } from 'react';

interface Recipe {
    id: number;
    name: string;
    price: number;
    category: string;
    imageUrl?: string;
}

export const CartItem = memo(({ 
    item, 
    salesCount, 
    updateQty, 
    note, 
    onNoteChange 
}: { 
    item: Recipe & { qty?: number }, 
    salesCount: number, 
    updateQty: (id: number, delta: number) => void, 
    note?: string, 
    onNoteChange: (id: number, note: string) => void 
}) => {
    const [showNoteInput, setShowNoteInput] = useState(false);
    return (
        <div className="flex flex-col py-2 border-b border-[var(--border-dim)] last:border-0 hover:bg-[var(--glass-bg)] -mx-1 px-1 rounded-lg transition-colors relative">
            <div className="flex items-center justify-between w-full">
                <div className="flex-1 min-w-0 pr-2">
                    <p className="font-black text-[10px] sm:text-[11px] uppercase tracking-tight truncate text-[var(--text-main)] leading-none mb-0.5">{item.name}</p>
                    <p className="text-[9px] font-bold text-primary leading-none">Rp {(item.price * salesCount).toLocaleString('id-ID')}</p>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="flex items-center gap-1.5 sm:gap-2 bg-[var(--bg-app)] rounded-lg p-0.5 sm:p-1 border border-[var(--border-dim)]">
                        <button 
                            onClick={() => updateQty(item.id, -1)}
                            className="size-5 sm:size-6 rounded flex items-center justify-center hover:bg-red-500/20 text-red-500 transition-colors font-black text-[10px] sm:text-xs"
                        >
                            -
                        </button>
                        <span className="text-[9px] sm:text-[10px] font-black w-4 text-center text-[var(--text-main)]">{salesCount}</span>
                        <button 
                            onClick={() => updateQty(item.id, 1)}
                            className="size-5 sm:size-6 rounded flex items-center justify-center hover:bg-emerald-500/20 text-emerald-500 transition-colors font-black text-[10px] sm:text-xs"
                        >
                            +
                        </button>
                    </div>
                    
                    <button 
                        onClick={() => setShowNoteInput(!showNoteInput)}
                        className={`size-6 rounded flex items-center justify-center transition-all ${note ? 'bg-amber-500/20 text-amber-500' : 'text-[var(--text-muted)] hover:bg-white/10'}`}
                        title="Serta Catatan"
                    >
                        <span className="material-symbols-outlined text-xs">notes</span>
                    </button>
                </div>
            </div>

            {!showNoteInput && note && (
                <div 
                    onClick={() => setShowNoteInput(true)}
                    className="p-1 px-2 mt-1 bg-amber-500/5 rounded-lg cursor-pointer hover:bg-amber-500/10 transition-colors border border-amber-500/10"
                >
                    <p className="text-[8px] font-black text-amber-500 uppercase flex items-center gap-1">
                        <span className="material-symbols-outlined text-[10px] opacity-70">notes</span>
                        <span className="opacity-50">Catatan:</span> {note}
                    </p>
                </div>
            )}

            {showNoteInput && (
                <div className="mt-2 p-1 animate-in fade-in slide-in-from-top-1">
                    <input 
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-[var(--text-main)] focus:outline-none focus:border-primary transition-all shadow-inner"
                        placeholder="Contoh: Pedas, No MSG..."
                        value={note || ''}
                        onChange={(e) => onNoteChange(item.id, e.target.value)}
                        onBlur={() => setShowNoteInput(false)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') setShowNoteInput(false);
                            if (e.key === 'Escape') setShowNoteInput(false);
                        }}
                        autoFocus
                    />
                </div>
            )}
        </div>
    );
});

CartItem.displayName = 'CartItem';
