import React, { useRef, useState, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
    items: any[];
    sales: Record<number, number>;
    updateQty: (id: number, delta: number) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ items, sales, updateQty }) => {
    const parentRef = useRef<HTMLDivElement>(null);
    const [columnCount, setColumnCount] = useState(2);

    // Dynamic column count based on standard tailwind breakpoints
    useEffect(() => {
        const updateColumns = () => {
            const width = window.innerWidth;
            if (width >= 1536) setColumnCount(6); // 2xl
            else if (width >= 1280) setColumnCount(5); // xl
            else if (width >= 1024) setColumnCount(3); // lg (Optimized for side-by-side)
            else if (width >= 768) setColumnCount(4); // md (Full width)
            else setColumnCount(2); // default
        };

        updateColumns();
        window.addEventListener('resize', updateColumns);
        return () => window.removeEventListener('resize', updateColumns);
    }, []);

    const rowCount = Math.ceil(items.length / columnCount);

    const rowVirtualizer = useVirtualizer({
        count: rowCount,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 72 + 12, // Card height (72px) + gap-3 (12px)
        overscan: 5,
    });

    return (
        <div 
            ref={parentRef}
            className="flex-1 overflow-y-auto custom-scrollbar h-full w-full"
            id="product-grid-container"
        >
            <div
                style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                }}
            >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const rowStartIndex = virtualRow.index * columnCount;
                    const rowItems = items.slice(rowStartIndex, rowStartIndex + columnCount);

                    return (
                        <div
                            key={virtualRow.key}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: `72px`,
                                transform: `translateY(${virtualRow.start + 16}px)`, // +16 for p-4 padding top
                                display: 'grid',
                                gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
                                gap: '12px',
                                paddingLeft: '16px',
                                paddingRight: '16px',
                            }}
                        >
                            {rowItems.map((item) => (
                                <ProductCard 
                                    key={item.id} 
                                    item={item} 
                                    saleCount={sales[item.id] || 0} 
                                    isHighlighted={false}
                                    onUpdateQty={updateQty} 
                                />
                            ))}
                        </div>
                    );
                })}

                {items.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-64 opacity-20">
                        <span className="material-symbols-outlined text-6xl mb-2">inventory_2</span>
                        <p className="font-black uppercase tracking-[0.3em] text-xs">Produk tidak ditemukan</p>
                    </div>
                )}
            </div>
        </div>
    );
};
