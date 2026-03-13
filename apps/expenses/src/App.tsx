import { useState, useEffect } from 'react';
import Header from './components/Header';
import SummaryCard from './components/SummaryCard';
import ExpenseList from './components/ExpenseList';
import Fab from './components/Fab';
import AddExpenseModal from './components/AddExpenseModal';
import TransactionsBg from './components/TransactionsBg';
import { apiClient } from '@shared/apiClient';


import NavDrawer from '@shared/NavDrawer';




function App() {
  const [activeTab, setActiveTab] = useState<'penjualan' | 'pengeluaran'>('pengeluaran');
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expensesList, setExpensesList] = useState<any[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchExpenses = async () => {
    try {
        setIsLoading(true);
        const data = await apiClient.getExpenses();
        // Ensure data is an array before mapping
        if (!Array.isArray(data)) {
            console.error("API returned non-array for expenses", data);
            setExpensesList([]);
            return;
        }
        // Keep raw date (ISO string) - ExpenseList will handle display formatting
        const formatted = data.map((exp: any) => ({
            id: exp.id,
            title: exp.title || 'Untitled Expense',
            category: exp.category || 'General',
            date: exp.expenseDate || exp.date || new Date().toISOString(), // raw ISO date for filtering
            amount: exp.amount || '0',
            imageUrl: exp.receiptUrl || exp.imageUrl || ''
        }));
        setExpensesList(formatted);
    } catch (error) {
        console.error("Failed fetching expenses", error);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleAddExpense = () => {
    // Re-fetch after add
    fetchExpenses();
  };

  const handleDeleteExpense = async (id: number) => {
    if (!window.confirm('Hapus kartu pengeluaran ini?')) return;
    try {
      await apiClient.deleteExpense(id);
      fetchExpenses();
    } catch (error) {
      console.error("Failed to delete expense", error);
      alert("Gagal menghapus data.");
    }
  };

  const totalExps = expensesList.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
  const hasAnyModalOpen = isExpenseModalOpen;

  return (
    <div className="bg-background-light  font-display text-slate-900  antialiased min-h-screen transition-colors duration-300">
      <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} currentPort={5181} />
      
      <div className="flex flex-col min-h-screen lg:flex-row max-w-[1400px] mx-auto">
        
        {/* Desktop Sidebar - Side Controls */}
        <aside className="hidden lg:flex w-80 h-screen sticky top-0 bg-surface border-r border-[var(--border-color)] flex-col p-8 space-y-10">
            <div className="flex items-center gap-4">
                <button onClick={() => setDrawerOpen(true)} className="size-10 flex items-center justify-center rounded-full bg-primary/10 text-primary">
                    <span className="material-symbols-outlined">menu</span>
                </button>
                <h1 className="text-xl font-black tracking-tight">Expenses</h1>
            </div>

            <div className="space-y-6">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Aksi Cepat</p>
                <button 
                  onClick={() => setIsExpenseModalOpen(true)} 
                  className="w-full btn-primary py-4 shadow-xl shadow-primary/30"
                >
                    <span className="material-symbols-outlined">add_circle</span>
                    Tambah Pengeluaran
                </button>
            </div>

            <div className="mt-auto pt-8 border-t border-[var(--border-color)]">
                <SummaryCard total={totalExps} compact />
            </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
            {/* Header (Mobile) */}
            <header className="lg:hidden sticky top-0 z-30 bg-background-light/80  backdrop-blur-md p-4 border-b border-[var(--border-color)]">
                <div className="flex items-center gap-3">
                    <button onClick={() => setDrawerOpen(true)} className="size-10 flex items-center justify-center rounded-full bg-primary/10 text-primary">
                        <span className="material-symbols-outlined">menu</span>
                    </button>
                    <h2 className="text-lg font-black tracking-tight">Pengeluaran</h2>
                </div>
            </header>

            <main className="p-4 md:p-8 md:pt-12">
                <div className="lg:hidden mb-8">
                     <SummaryCard total={totalExps} />
                </div>

                <div className="flex items-center justify-between mb-8 px-1">
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Riwayat Pengeluaran</h2>
                    <p className="text-xs font-bold text-slate-500">Total {expensesList.length} Transaksi</p>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-6">
                        <span className="material-symbols-outlined animate-spin text-primary text-6xl">refresh</span>
                        <div className="text-center">
                            <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Memuat data server...</p>
                            <p className="text-[10px] text-slate-400 italic mt-2">Cold start mungkin memerlukan waktu lebih lama.</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <ExpenseList expenses={expensesList} onDelete={handleDeleteExpense} />
                    </div>
                )}
            </main>

            {/* Mobile Floating Action Button */}
            <div className="lg:hidden fixed bottom-6 right-6 z-30">
                <button
                    onClick={() => setIsExpenseModalOpen(true)}
                    className="size-16 bg-primary text-white rounded-full shadow-2xl shadow-primary/40 flex items-center justify-center active:scale-95 transition-transform"
                >
                    <span className="material-symbols-outlined text-3xl">add</span>
                </button>
            </div>
        </div>
      </div>

      {/* Modals */}
      <AddExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onAdd={handleAddExpense}
      />
    </div>
  );
}

export default App;

