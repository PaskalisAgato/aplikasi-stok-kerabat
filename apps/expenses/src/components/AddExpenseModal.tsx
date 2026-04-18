import React, { useState } from 'react';
import { apiClient } from '@shared/apiClient';
import { getOptimizedImageUrl } from '@shared/supabase';
import { compressImage } from '@shared/utils/image';


interface AddExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (expense: any) => void;
    initialData?: any;
}

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ isOpen, onClose, onAdd, initialData }) => {
    const [name, setName] = useState('');
    const [vendor, setVendor] = useState('');
    const [amount, setAmount] = useState('');
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [categorySearch, setCategorySearch] = useState('');
    const [receipt, setReceipt] = useState<string | null>(null);
    const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [fundSource, setFundSource] = useState<'CASHIER' | 'OWNER'>('CASHIER');

    const fetchCategories = async () => {
        try {
            console.log('[ExpenseForm] Fetching categories...');
            const response = await apiClient.getExpenseCategories();
            const categoriesData = response?.data || [];
            console.log(`[ExpenseForm] Received ${categoriesData.length} categories`);
            setCategories(Array.isArray(categoriesData) ? categoriesData : []);
            
            if (Array.isArray(categoriesData) && categoriesData.length > 0 && !selectedCategory && !initialData) {
                setSelectedCategory(categoriesData[0].name);
            }
        } catch (error) {
            console.error('[ExpenseForm] Failed to fetch categories:', error);
        }
    };

    React.useEffect(() => {
        if (isOpen) {
            fetchCategories();
        }
    }, [isOpen]);

    React.useEffect(() => {
        if (initialData && isOpen && categories.length > 0) {
            setName(initialData.title || '');
            setVendor(initialData.vendor || '');
            setAmount(initialData.amount?.toString() || '');
            setSelectedCategory(initialData.category || '');
            const existingReceipt = initialData.receiptUrl || initialData.imageUrl || null;
            console.log('[ExpenseForm] Loading initial data, receipt:', existingReceipt);
            setReceipt(existingReceipt);
            setExpenseDate(new Date(initialData.expenseDate || initialData.date).toISOString().split('T')[0]);
            setFundSource(initialData.fundSource || 'CASHIER');
        } else if (isOpen && !initialData) {
            // Reset for new expense
            setName('');
            setVendor('');
            setAmount('');
            if (categories.length > 0) setSelectedCategory(categories[0].name);
            setReceipt(null);
            setExpenseDate(new Date().toISOString().split('T')[0]);
            setFundSource('CASHIER');
        }
    }, [initialData, isOpen, categories]);

    if (!isOpen) return null;

    const validateFile = (file: File): string | null => {
        console.log(`[ExpenseForm] Validating file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            return `Format [${file.type}] tidak valid. Hanya JPG, PNG, dan WEBP yang diperbolehkan.`;
        }
        return null;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            
            const validationError = validateFile(file);
            if (validationError) {
                alert(validationError);
                e.target.value = '';
                return;
            }

            setSelectedFile(file);
            
            const reader = new FileReader();
            reader.onloadend = async () => {
                const originalBase64 = reader.result as string;
                // Compress iteratively until below 300KB
                const compressedBlob = await compressImage(originalBase64, { maxSizeKB: 300 });
                const compressedBase64 = await new Promise<string>((resolve) => {
                    const r = new FileReader();
                    r.onloadend = () => resolve(r.result as string);
                    r.readAsDataURL(compressedBlob);
                });
                setReceipt(compressedBase64);
                e.target.value = ''; // Reset input
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('[ExpenseForm] Submit initiated');
        
        if (!name || !amount) {
            console.warn('[ExpenseForm] Submit blocked: missing name or amount');
            return;
        }

        setIsUploading(true);
        let finalReceiptUrl = receipt || '';

        try {
            // Stage 2: Database Save (Middleware validateBase64Image will handle Cloudinary upload)
            console.log('[ExpenseForm] Saving payload to Backend...');
            const expensePayload = {
                title: name,
                vendor,
                category: selectedCategory || 'Lainnya',
                amount: Number(amount),
                receiptUrl: receipt, // Pass Base64 string directly
                date: expenseDate,
                fundSource: fundSource
            };

            console.log('[ExpenseForm] Final Payload:', expensePayload);

            if (initialData?.id) {
                console.log(`[ExpenseForm] Updating expense ID: ${initialData.id}`);
                await apiClient.updateExpense(initialData.id, expensePayload);
            } else {
                console.log('[ExpenseForm] Creating new expense');
                await apiClient.addExpense(expensePayload);
            }
            console.log('[ExpenseForm] Final Stage: Complete');

            onAdd({}); 
            setName('');
            setAmount('');
            setSelectedCategory('coffee');
            setCategorySearch('');
            setReceipt(null);
            setSelectedFile(null);
            onClose();
        } catch (error: any) {
            console.error('Detailed Expense Save Failure:', {
                stage: selectedFile && !finalReceiptUrl ? 'Supabase Upload' : 'Backend API Call',
                error: error
            });

            let userFriendlyMessage = error.message || 'Unknown error';
            if (error.status === 403) {
                // Backend returns the real reason in error.message — show it directly
                // e.g. "KEAMANAN: Tidak bisa mencatat pengeluaran tanpa shift aktif."
                userFriendlyMessage = error.message || "Akses ditolak. Pastikan shift kasir sudah dibuka sebelum mencatat pengeluaran.";
            } else if (error.status === 401) {
                userFriendlyMessage = "Sesi berakhir. Silakan log out dan login kembali.";
            } else if (error.status === 500) {
                userFriendlyMessage = "Terjadi kesalahan di server. Silakan coba lagi.";
            }

            alert(`Gagal merekam pengeluaran: ${userFriendlyMessage}`);
        } finally {
            setIsUploading(false);
        }
    };

    const filteredCategories = (Array.isArray(categories) ? categories : []).filter(c =>
        c && c.name && c.name.toLowerCase().includes(categorySearch.toLowerCase())
    );

    const handleToggleCategory = (name: string) => {
        setSelectedCategory(prev => prev === name ? '' : name);
    };

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) {
            setIsAddingCategory(false);
            return;
        }
        try {
            console.log(`[ExpenseForm] Adding new category: ${newCategoryName.trim()}`);
            await apiClient.addExpenseCategory({ name: newCategoryName.trim(), icon: 'category' });
            console.log('[ExpenseForm] Category added successfully');
            setNewCategoryName('');
            setIsAddingCategory(false);
            // Instant re-fetch to update UI without reload
            fetchCategories();
        } catch (error: any) {
            console.error('[ExpenseForm] Failed to add category:', error);
            const msg = error.message || 'Gagal menambah kategori';
            alert(msg);
        }
    };

    const handleDeleteCategory = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (!confirm('Hapus kategori ini?')) return;
        try {
            await apiClient.deleteExpenseCategory(id);
            fetchCategories();
        } catch (error) {
            console.error('Failed to delete category:', error);
            alert('Gagal menghapus kategori');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm">
            {/* Bottom Sheet */}
            <div className="w-full bg-background-app  rounded-t-xl shadow-2xl flex flex-col max-h-[92vh] border-t border-primary/20">

                {/* Drag Handle */}
                <div className="flex h-6 w-full items-center justify-center flex-shrink-0">
                    <div className="h-1.5 w-12 rounded-full bg-primary/30" />
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-6 pb-8">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-[var(--text-main)] ">{initialData ? 'Edit Expense' : 'Add New Expense'}</h2>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-full flex items-center justify-center bg-primary/10 text-primary"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Expense Name & Vendor */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-primary/80 uppercase tracking-wider">Expense Name / Title</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="e.g. Arabica Beans Supply"
                                    required
                                    className="w-full h-14 px-4 rounded-lg bg-primary/5 border border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all  placeholder:text-slate-500"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-primary/80 uppercase tracking-wider">Vendor / Toko</label>
                                <input
                                    type="text"
                                    value={vendor}
                                    onChange={e => setVendor(e.target.value)}
                                    placeholder="e.g. Toko Makmur"
                                    required
                                    className="w-full h-14 px-4 rounded-lg bg-primary/5 border border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all  placeholder:text-slate-500"
                                />
                            </div>
                        </div>

                        {/* Amount */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-primary/80 uppercase tracking-wider">Amount (Rp)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-primary">Rp</span>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    placeholder="0"
                                    required
                                    className="w-full h-14 pl-12 pr-4 rounded-lg bg-primary/5 border border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all  text-xl font-bold"
                                />
                            </div>
                        </div>

                        {/* Date Picker */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-primary/80 uppercase tracking-wider">Tanggal Transaksi</label>
                            <input
                                type="date"
                                value={expenseDate}
                                onChange={e => setExpenseDate(e.target.value)}
                                className="w-full h-14 px-4 rounded-lg bg-primary/5 border border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all  font-medium"
                            />
                        </div>
    
                        {/* Fund Source Selection */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-primary/80 uppercase tracking-wider">Sumber Dana</label>
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setFundSource('CASHIER')}
                                    className={`flex-1 h-14 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                                        fundSource === 'CASHIER' 
                                        ? 'bg-primary/20 border-primary text-primary font-bold shadow-sm' 
                                        : 'bg-primary/5 border-primary/20 text-slate-500 hover:bg-primary/10'
                                    }`}
                                >
                                    <span className="material-symbols-outlined">payments</span>
                                    <span>Uang Kasir</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFundSource('OWNER')}
                                    className={`flex-1 h-14 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                                        fundSource === 'OWNER' 
                                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600 font-bold shadow-sm' 
                                        : 'bg-primary/5 border-primary/20 text-slate-500 hover:bg-primary/10'
                                    }`}
                                >
                                    <span className="material-symbols-outlined">person</span>
                                    <span>Uang Owner</span>
                                </button>
                            </div>
                            <p className="text-[10px] text-[var(--text-muted)] italic mt-1">
                                {fundSource === 'CASHIER' 
                                    ? '* Mengurangi saldo laci kasir saat closing.' 
                                    : '* Tidak mengurangi saldo laci kasir (pribadi owner).'}
                            </p>
                        </div>

                        {/* Categories — chip-based */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-primary/80 uppercase tracking-wider">Categories</label>

                            {/* Category Search */}
                            <div className="relative mb-4">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary/60" style={{ fontSize: '20px' }}>search</span>
                                <input
                                    type="text"
                                    value={categorySearch}
                                    onChange={e => setCategorySearch(e.target.value)}
                                    placeholder="Search categories..."
                                    className="w-full h-11 pl-11 pr-4 rounded-lg bg-primary/5 border border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all  text-sm placeholder:text-slate-500"
                                />
                            </div>

                            {/* Category Chips */}
                            <div className="flex flex-wrap gap-2">
                                {(Array.isArray(categories) ? filteredCategories : []).map(cat => {
                                    const isSelected = selectedCategory === cat.name;
                                    return (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => handleToggleCategory(cat.name)}
                                            className={`px-4 py-2 rounded-full border flex items-center gap-2 transition-all ${isSelected
                                                    ? 'border-primary/40 bg-primary text-white'
                                                    : 'border-primary/20 bg-primary/5 text-slate-400 hover:bg-primary/10'
                                                }`}
                                        >
                                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{cat.icon || 'category'}</span>
                                            <span className="text-sm font-medium">{cat.name}</span>
                                            <span 
                                                onClick={(e) => handleDeleteCategory(e, cat.id)}
                                                className="material-symbols-outlined hover:text-red-400 p-0.5 rounded-full transition-colors" 
                                                style={{ fontSize: '14px' }}
                                            >
                                                close
                                            </span>
                                        </button>
                                    );
                                })}

                                {/* Add new category section */}
                                {isAddingCategory ? (
                                    <div className="flex items-center gap-2 bg-primary/10 rounded-full pl-4 pr-1 py-1 border border-primary/30 animate-in zoom-in duration-300">
                                        <input
                                            autoFocus
                                            type="text"
                                            value={newCategoryName}
                                            onChange={e => setNewCategoryName(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                                            placeholder="Nama kategori..."
                                            className="bg-transparent border-none outline-none text-xs font-bold text-primary placeholder:text-primary/40 w-24"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddCategory}
                                            className="size-7 rounded-full bg-primary text-white flex items-center justify-center shadow-sm"
                                        >
                                            <span className="material-symbols-outlined text-sm">check</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsAddingCategory(false)}
                                            className="size-7 rounded-full bg-white/10 text-primary flex items-center justify-center"
                                        >
                                            <span className="material-symbols-outlined text-sm">close</span>
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setIsAddingCategory(true)}
                                        className="w-9 h-9 rounded-full border-2 border-dashed border-primary/30 flex items-center justify-center text-primary bg-primary/5 hover:bg-primary/10 transition-colors"
                                    >
                                        <span className="material-symbols-outlined">add</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Receipt Photo */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-primary/80 uppercase tracking-wider">Receipt Photo</label>
                            
                            {/* Hidden file input */}
                            <input
                                type="file"
                                id="receipt-upload"
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                {/* Upload Button */}
                                <button
                                    type="button"
                                    onClick={() => document.getElementById('receipt-upload')?.click()}
                                    className="aspect-square rounded-lg border-2 border-dashed border-primary/30 flex flex-col items-center justify-center bg-primary/5 hover:bg-primary/10 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-primary mb-2" style={{ fontSize: '32px' }}>add_a_photo</span>
                                    <span className="text-xs font-medium text-[var(--text-muted)] ">Take Photo</span>
                                </button>

                                {/* Thumbnail Preview */}
                                {receipt && (
                                    <div className="relative aspect-square rounded-lg overflow-hidden border border-primary/20 group">
                                        <img
                                            src={getOptimizedImageUrl(receipt)}
                                            alt="Receipt"
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                console.error('[ExpenseForm] Preview load failed for URL:', getOptimizedImageUrl(receipt));
                                                (e.target as HTMLImageElement).src = 'https://placehold.co/400x400?text=Gagal+Memuat+Bukti';
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="material-symbols-outlined text-[var(--text-main)]">visibility</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setReceipt(null);
                                                setSelectedFile(null);
                                            }}
                                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center"
                                        >
                                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="mt-10 mb-4">
                            <button
                                type="submit"
                                disabled={isUploading}
                                className={`w-full h-16 ${isUploading ? 'bg-slate-400' : 'bg-primary hover:bg-primary/90'} text-white rounded-xl font-bold text-lg shadow-lg shadow-primary/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all`}
                            >
                                {isUploading ? (
                                    <span className="material-symbols-outlined animate-spin">refresh</span>
                                ) : (
                                    <span className="material-symbols-outlined">check_circle</span>
                                )}
                                {isUploading ? 'Uploading & Saving...' : (initialData ? 'Update Expense' : 'Save Expense')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddExpenseModal;

