import { useState, useEffect } from 'react';
import SummaryCard from './components/SummaryCard';
import ExpenseList from './components/ExpenseList';
import AddExpenseModal from './components/AddExpenseModal';
import { apiClient } from '@shared/apiClient';


import NavDrawer from '@shared/NavDrawer';

function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expensesList, setExpensesList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingExpense, setEditingExpense] = useState<any>(null);

  const fetchExpenses = async () => {
    try {
        setIsLoading(true);
        const data = await apiClient.getExpenses();
        if (!Array.isArray(data)) {
            setExpensesList([]);
            return;
        }
        const formatted = data.map((exp: any) => ({
            id: exp.id,
            title: exp.title || 'Untitled Expense',
            category: exp.category || 'General',
            date: exp.expenseDate || exp.date || new Date().toISOString(),
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
    fetchExpenses();
  };

  const handleEditExpense = (expense: any) => {
    setEditingExpense(expense);
    setIsExpenseModalOpen(true);
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

  const ExpenseSidebar = (
    <div className="space-y-10 animate-in fade-in slide-in-from-left duration-700">
        <div className="space-y-6">
            <div className="flex items-center gap-2 px-2">
                <span className="material-symbols-outlined text-primary text-sm font-black">bolt</span>
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Aksi Cepat</p>
            </div>
            <button 
              onClick={() => setIsExpenseModalOpen(true)} 
              className="btn-primary w-full py-5 rounded-2xl text-[10px] uppercase font-black tracking-widest shadow-primary/20 active:scale-95 transition-all"
            >
                <span className="material-symbols-outlined text-lg">add_circle</span>
                Tambah Pengeluaran
            </button>
        </div>

        <div className="mt-10 pt-10 border-t border-[var(--border-dim)] space-y-4">
            <SummaryCard total={totalExps} compact />
        </div>
    </div>
  );

  return (
    <div className="bg-[var(--bg-app)] text-[var(--text-main)] antialiased min-h-screen w-full overflow-hidden">
        <div className="fixed inset-0 flex flex-col max-w-[1600px] mx-auto glass border-x border-white/5 shadow-2xl overflow-hidden">
            <header className="z-50 glass border-b border-white/5 px-8 py-6 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => setDrawerOpen(true)}
                        className="size-12 glass flex items-center justify-center rounded-2xl text-primary hover:bg-primary/10 active:scale-90 transition-all border-white/10"
                    >
                        <span className="material-symbols-outlined font-black">menu</span>
                    </button>
                    <div className="space-y-1">
                        <h1 className="text-2xl font-black font-display tracking-tight text-[var(--text-main)] uppercase leading-tight">Pengeluaran</h1>
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] opacity-80 font-bold leading-tight">Manajemen Arus Kas</p>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                <aside className="hidden lg:flex w-80 glass border-r border-white/5 flex-col p-8 space-y-10 shrink-0 overflow-y-auto custom-scrollbar">
                    {ExpenseSidebar}
                </aside>

                <main className="flex-1 overflow-y-auto px-8 py-10 custom-scrollbar pb-32 lg:pb-10">
                    <div className="lg:hidden mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
                         <SummaryCard total={totalExps} />
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-6 glass rounded-[3rem] opacity-60">
                            <div className="size-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
                            <div className="text-center space-y-2">
                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] animate-pulse">Menghubungkan Server...</p>
                                <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-60 italic">Mengambil data transaksi terbaru</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-10 animate-in fade-in zoom-in duration-700">
                             <ExpenseList 
                               expenses={expensesList} 
                               onDelete={handleDeleteExpense} 
                               onEdit={handleEditExpense}
                             />
                        </div>
                    )}
                </main>
            </div>

            <footer className="glass border-t border-white/5 p-8 shrink-0 flex gap-4 lg:hidden">
                <button
                    onClick={() => {
                        setEditingExpense(null);
                        setIsExpenseModalOpen(true);
                    }}
                    className="w-full flex items-center justify-center gap-4 accent-gradient text-slate-950 px-10 py-5 rounded-[2rem] shadow-2xl shadow-primary/40 active:scale-95 transition-all border-none group"
                >
                    <span className="material-symbols-outlined text-3xl font-black group-hover:rotate-12 transition-transform">add_circle</span>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em]">Tambah Pengeluaran Baru</span>
                </button>
            </footer>

            <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} currentPort={5181} />
        </div>

        <AddExpenseModal
            isOpen={isExpenseModalOpen}
            onClose={() => {
                setIsExpenseModalOpen(false);
                setEditingExpense(null);
            }}
            onAdd={handleAddExpense}
            initialData={editingExpense}
        />
    </div>
  );
}

export default App;

