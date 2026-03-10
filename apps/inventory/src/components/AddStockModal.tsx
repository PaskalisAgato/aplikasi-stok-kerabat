import React, { useState } from 'react';

interface SelectedItem {
    id: string;
    name: string;
    unit: string;
    stock: number;
    image: string;
    quantity: number;
    price: number;
    discount: number;
}

interface AddStockModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const INITIAL_ITEMS: SelectedItem[] = [
    {
        id: '1',
        name: 'Kopi Bubuk House Blend',
        unit: 'kg',
        stock: 12,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC4oKEVVTq_w-ajobrLEjQ3SiWO7-mv3wQh6oDCuanZvwW7h-6b_UBnQYMT915FYsncIiqj5-7zf0Hy_OQVqPSgnTYsx2_X0BkrMQ9OcgB15RAcjbAu-yyKcV5_BXRzYq_vww5bMTaCZiI6hla3aTySaT79Scih4N0v9BuVmgbg1Hgn1HZrNvHQeH7pwS9_yHZHsE-6SqeroyLYBkjeUjM09ze2tLnlQpPLp_VKxLNm2uIlhKAXvBu7vhE6urhN7pS-8DEk4qWA2vE',
        quantity: 5,
        price: 125000,
        discount: 0
    },
    {
        id: '2',
        name: 'Susu UHT Full Cream',
        unit: 'Liter',
        stock: 24,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYJPqrumWFBpddN33EelptJNRQs1Jp2K684ZP27ncscanMqKguH5H7qfvN2BBwJib_hI9ZmavYcxcpYcUyt4b3H8em9lbb9G9RG9L4UlZN3GyaK1NzEuVWmwiS6WRWsPmALIIWpg7hlivc-Hg7EnFDRPaE0F5kteLEY1xLO7s6X6OM_ICUsydCEsPKjoWwhJsTvozbZDd5Xk2TCs0BKtRCKtBmbUaIjke8mqHjPNE1PKpjFJYWUyE4w26ignnBPIjvPAXtrkO6tvQ',
        quantity: 12,
        price: 18500,
        discount: 5
    }
];

const AddStockModal: React.FC<AddStockModalProps> = ({ isOpen, onClose }) => {
    const [items, setItems] = useState<SelectedItem[]>(INITIAL_ITEMS);

    if (!isOpen) return null;

    const handleQuantityChange = (id: string, delta: number) => {
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
        ));
    };

    const handleInputChange = (id: string, field: 'price' | 'discount', value: string) => {
        const numValue = parseFloat(value) || 0;
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, [field]: numValue } : item
        ));
    };

    const calculateTotal = () => {
        return items.reduce((acc, item) => {
            const itemTotal = item.quantity * item.price;
            const discounted = itemTotal * (1 - item.discount / 100);
            return acc + discounted;
        }, 0);
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm">
            {/* Bottom Sheet Modal */}
            <div className="w-full bg-background-light dark:bg-background-dark rounded-t-xl shadow-2xl flex flex-col max-h-[92vh] border-t border-primary/20">

                {/* Header */}
                <header className="flex items-center p-4 border-b border-slate-200 dark:border-primary/20">
                    <button onClick={onClose} className="text-primary flex size-10 items-center justify-center rounded-full hover:bg-primary/10 transition-colors">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold flex-1 ml-2">Update Stok Masuk</h2>
                    <div className="text-primary flex size-10 items-center justify-center rounded-full">
                        <span className="material-symbols-outlined">history</span>
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-y-auto pb-40">
                    {/* Search */}
                    <div className="px-4 py-4">
                        <div className="flex w-full items-stretch rounded-xl h-12 shadow-sm bg-slate-100 dark:bg-primary/10">
                            <div className="text-primary/70 flex items-center justify-center pl-4">
                                <span className="material-symbols-outlined">search</span>
                            </div>
                            <input
                                className="w-full bg-transparent border-none focus:ring-0 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-primary/40 px-4 pl-2 text-base"
                                placeholder="Cari bahan (e.g. Kopi, Gula, Susu)"
                            />
                        </div>
                    </div>

                    {/* Selected Items Label */}
                    <div className="px-4 py-2 flex justify-between items-center">
                        <h3 className="text-slate-900 dark:text-slate-100 text-lg font-bold">Bahan Terpilih</h3>
                        <span className="text-xs font-semibold px-2 py-1 bg-primary/20 text-primary rounded-full uppercase tracking-wider">{items.length} Items</span>
                    </div>

                    {/* Items List */}
                    <div className="space-y-3 px-4 py-2">
                        {items.map(item => (
                            <div key={item.id} className="flex flex-col gap-4 bg-white dark:bg-primary/5 p-4 rounded-xl border border-slate-100 dark:border-primary/10 shadow-sm">
                                <div className="flex gap-4 justify-between">
                                    <div className="flex items-start gap-4">
                                        <div
                                            className="bg-center bg-no-repeat aspect-square bg-cover rounded-lg size-[64px] border border-slate-200 dark:border-primary/20"
                                            style={{ backgroundImage: `url("${item.image}")` }}
                                        />
                                        <div className="flex flex-1 flex-col justify-center">
                                            <p className="text-slate-900 dark:text-slate-100 text-base font-semibold leading-tight">{item.name}</p>
                                            <p className="text-slate-500 dark:text-primary/60 text-sm font-normal">Satuan: {item.unit} • Stok: {item.stock} {item.unit}</p>
                                        </div>
                                    </div>
                                    <div className="shrink-0">
                                        <div className="flex items-center gap-3 text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-primary/20 p-1 rounded-full">
                                            <button
                                                onClick={() => handleQuantityChange(item.id, -1)}
                                                className="flex h-8 w-8 items-center justify-center rounded-full bg-white dark:bg-background-dark text-primary shadow-sm active:scale-95 transition-transform"
                                            >
                                                <span className="material-symbols-outlined text-sm font-bold">remove</span>
                                            </button>
                                            <span className="text-base font-bold w-8 text-center">{item.quantity}</span>
                                            <button
                                                onClick={() => handleQuantityChange(item.id, 1)}
                                                className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-sm active:scale-95 transition-transform"
                                            >
                                                <span className="material-symbols-outlined text-sm font-bold">add</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-primary/10">
                                    <div className="flex flex-col flex-1">
                                        <p className="text-slate-500 dark:text-primary/70 text-xs font-medium pb-1 ml-1 uppercase">Harga Beli (Rp)</p>
                                        <input
                                            type="number"
                                            value={item.price}
                                            onChange={(e) => handleInputChange(item.id, 'price', e.target.value)}
                                            className="w-full rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/50 border border-slate-200 dark:border-primary/30 bg-transparent h-11 px-3 text-sm"
                                        />
                                    </div>
                                    <div className="flex flex-col flex-1">
                                        <p className="text-slate-500 dark:text-primary/70 text-xs font-medium pb-1 ml-1 uppercase">Diskon (%)</p>
                                        <input
                                            type="number"
                                            value={item.discount}
                                            onChange={(e) => handleInputChange(item.id, 'discount', e.target.value)}
                                            className="w-full rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/50 border border-slate-200 dark:border-primary/30 bg-transparent h-11 px-3 text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Add More Button */}
                    <div className="px-4 py-6">
                        <div className="bg-primary/5 rounded-xl p-4 border border-dashed border-primary/30 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-primary/10 transition-colors">
                            <span className="material-symbols-outlined text-primary text-3xl">add_circle</span>
                            <p className="text-primary font-medium">Tambah Bahan Lain</p>
                        </div>
                    </div>
                </div>

                {/* Footer / Sticky Bottom */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-t border-slate-200 dark:border-primary/20 z-20">
                    <div className="max-w-md mx-auto space-y-3">
                        <div className="flex justify-between items-center px-1">
                            <span className="text-slate-500 dark:text-primary/60 text-sm">Total Belanja</span>
                            <span className="text-slate-900 dark:text-slate-100 text-lg font-bold">
                                Rp {calculateTotal().toLocaleString('id-ID')}
                            </span>
                        </div>
                        <button className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
                            <span className="material-symbols-outlined">inventory_2</span>
                            Simpan Stok
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddStockModal;
