import { memo } from 'react';

interface Recipe {
    id: number;
    name: string;
    price: number;
    category: string;
    imageUrl?: string;
}

export const ProductCard = memo(({ 
    item, 
    saleCount, 
    isHighlighted, 
    onUpdateQty 
}: { 
    item: Recipe, 
    saleCount: number, 
    isHighlighted: boolean, 
    onUpdateQty: (id: number, delta: number) => void 
}) => {
    return (
        <div 
            onClick={() => onUpdateQty(item.id, 1)}
            className={`cursor-pointer transition-all border p-2.5 sm:p-3 flex flex-col justify-between ${isHighlighted ? 'border-primary ring-2 ring-primary/50 bg-primary/10 scale-[1.02] shadow-md z-10' : 'border-[var(--border-dim)] bg-[var(--bg-app)] hover:bg-[var(--glass-bg)] shadow-sm hover:shadow-md hover:-translate-y-0.5'} rounded-xl h-[72px]`}
        >
            <div className="flex justify-between items-start gap-1">
                <h3 className="font-black text-[10px] sm:text-[11px] leading-[1.1] text-[var(--text-main)] line-clamp-2 uppercase tracking-tight">{item.name}</h3>
                {saleCount > 0 && (
                    <span className="bg-primary text-slate-900 font-black text-[9px] px-1.5 py-0.5 rounded-md shadow-sm shrink-0">
                        x{saleCount}
                    </span>
                )}
            </div>
            
            <div className="flex items-end justify-between mt-1">
                <p className="text-primary font-black text-[10px]">
                    Rp {item.price.toLocaleString('id-ID')}
                </p>
                <div className="w-1.5 h-1.5 rounded-full bg-primary/60"></div>
            </div>
        </div>
    );
}, (prev, next) => prev.item.id === next.item.id && prev.saleCount === next.saleCount && prev.isHighlighted === next.isHighlighted);

ProductCard.displayName = 'ProductCard';
