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
            className={`group cursor-pointer transition-all border p-3 flex flex-col justify-between overflow-hidden relative active:scale-95 touch-manipulation ${
                isHighlighted 
                ? 'border-primary ring-2 ring-primary/50 bg-primary/10 shadow-lg shadow-primary/10' 
                : 'border-[var(--border-dim)] bg-[var(--bg-app)] hover:border-primary/50 hover:bg-white/5 shadow-sm hover:shadow-xl hover:-translate-y-1'
            } rounded-xl h-[80px]`}
        >
            {/* Hover Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/0 via-primary/5 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none"></div>

            <div className="flex justify-between items-start gap-1 relative z-10">
                <h3 className="font-black text-[10px] sm:text-[11px] leading-tight text-[var(--text-main)] line-clamp-2 uppercase tracking-tight group-hover:text-primary transition-colors">
                    {item.name}
                </h3>
                {saleCount > 0 && (
                    <div className="flex flex-col items-end gap-1">
                        <span className="bg-primary text-slate-900 font-black text-[9px] px-2 py-0.5 rounded-full shadow-lg animate-in zoom-in-50 duration-200">
                             {saleCount}
                        </span>
                    </div>
                )}
            </div>
            
            <div className="flex items-end justify-between mt-1 relative z-10">
                <div className="flex flex-col">
                    <p className="text-primary font-black text-[12px] tracking-tight">
                        <span className="text-[8px] opacity-60 mr-0.5">Rp</span>
                        {item.price.toLocaleString('id-ID')}
                    </p>
                </div>
                <div className={`size-2 rounded-full transition-all duration-300 ${saleCount > 0 ? 'bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)] scale-125' : 'bg-primary/20'}`}></div>
            </div>
        </div>
    );
}, (prev, next) => 
    prev.item.id === next.item.id && 
    prev.item.price === next.item.price && 
    prev.saleCount === next.saleCount && 
    prev.isHighlighted === next.isHighlighted
);

ProductCard.displayName = 'ProductCard';
