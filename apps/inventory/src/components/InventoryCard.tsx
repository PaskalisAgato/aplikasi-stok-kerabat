import React from 'react';
import type { BahanBaku } from '../App';
import { getOptimizedImageUrl } from '@shared/supabase';

interface InventoryCardProps {
    item: BahanBaku;
    onSelect: (item: BahanBaku) => void;
    onEdit: (item: BahanBaku) => void;
    onDelete: (item: BahanBaku) => void;
}

const InventoryCard: React.FC<InventoryCardProps> = ({ item, onSelect, onEdit, onDelete }) => {
    const currentStock = parseFloat(item.currentStock);
    const containerWeight = parseFloat(item.containerWeight || '0');
    const minStock = parseFloat(item.minStock) || 100;

    return (
        <div 
            onClick={() => onSelect(item)}
            className={`card group cursor-pointer relative overflow-hidden transition-all duration-300 gpu ${currentStock === 0 ? 'bg-red-500/[0.02]' : ''} hover:scale-[1.01] active:scale-[0.98] border-white/5`}
        >
            {/* Image and Info */}
            <div className="flex justify-between items-start mb-6 relative z-10 gap-4">
                <div className="flex gap-4 items-start min-w-0 flex-1">
                    <div className="size-16 rounded-2xl overflow-hidden glass border border-white/10 shrink-0 bg-primary/5">
                        <img 
                            src={getOptimizedImageUrl(item.imageUrl || item.externalImageUrl || '', { width: 160, height: 160 })} 
                            alt={item.name}
                            loading="lazy"
                            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/160?text=No+Image';
                            }}
                        />
                    </div>
                    <div className="min-w-0 space-y-1">
                        <h3 className="font-black text-[var(--text-main)] text-lg font-display tracking-tight leading-tight uppercase group-hover:text-primary transition-colors line-clamp-2">{item.name}</h3>
                        <div className="flex items-center gap-2 opacity-50">
                            <span className="material-symbols-outlined text-[12px] font-black text-primary">local_shipping</span>
                            <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest truncate">{item.supplier || 'Pemasok Umum'}</p>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className={`text-[8px] font-black px-3 py-1.5 rounded-xl border uppercase tracking-widest ${
                        item.status === 'KRITIS' ? 'text-red-500 bg-red-500/10 border-red-500/20' :
                        item.status === 'HABIS' ? 'text-red-500 bg-red-500/10 border-red-500/20' :
                        'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
                    }`}>
                        {item.status}
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(item);
                            }}
                            className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 hover:bg-primary hover:text-white transition-all active:scale-90"
                        >
                            <span className="material-symbols-outlined text-sm font-black">edit</span>
                        </button>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(item);
                            }}
                            className="size-8 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20 hover:bg-red-500 hover:text-white transition-all active:scale-90"
                        >
                            <span className="material-symbols-outlined text-sm font-black">delete</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Stock Values */}
            <div className="flex items-end justify-between mt-auto mb-6 relative z-10 gap-4">
                <div className="space-y-1">
                    <p className="text-[8px] font-black text-primary uppercase tracking-[0.3em] opacity-70">Sisa Stok</p>
                    <p className={`text-3xl font-black font-display tracking-tighter ${currentStock === 0 ? 'text-red-500' : 'text-[var(--text-main)]'}`}>
                        {currentStock}
                        <span className={`text-[10px] font-black ml-2 uppercase opacity-50 font-sans tracking-widest ${currentStock === 0 ? 'text-red-400' : 'text-[var(--text-muted)]'}`}>{item.unit}</span>
                    </p>
                </div>
                <div className="text-right glass p-2 rounded-xl border-white/5">
                    <div className="flex flex-col items-end gap-0.5">
                        <p className="text-[8px] font-bold text-emerald-500 uppercase tracking-tight">KOTOR: {Number((currentStock + containerWeight).toFixed(2))}{item.unit}</p>
                        <p className="text-[8px] font-bold text-rose-500 uppercase tracking-tight">WADAH: {Number(containerWeight.toFixed(2))}{item.unit}</p>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-black/20 h-2 rounded-full overflow-hidden relative z-10 border border-white/5">
                <div className={`${item.status === 'KRITIS' || item.status === 'HABIS' ? 'bg-red-500' : 'bg-emerald-500'} h-full rounded-full transition-all duration-700 ease-out`}
                    style={{ width: `${Math.max(5, Math.min(100, (currentStock / (minStock * 2)) * 100))}%` }}>
                </div>
            </div>
        </div>
    );
};

export default React.memo(InventoryCard);
