import { useState, useEffect } from 'react';
import SummaryCard from './components/SummaryCard';
import ExpenseList from './components/ExpenseList';
import AddExpenseModal from './components/AddExpenseModal';
import { apiClient } from '@shared/apiClient';


import Layout from '@shared/Layout';

function App() {
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expensesList, setExpensesList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    <div className="space-y-10">
        <div className="space-y-6">
            <p className="text-xs font-black text-muted uppercase tracking-widest">Aksi Cepat</p>
            <button 
              onClick={() => setIsExpenseModalOpen(true)} 
              className="w-full btn-primary py-4 shadow-xl shadow-primary/30"
            >
                <span className="material-symbols-outlined">add_circle</span>
                Tambah Pengeluaran
            </button>
        </div>

        <div className="mt-8 pt-8 border-t border-border-dim">
            <SummaryCard total={totalExps} compact />
        </div>
    </div>
  );

  return (
    <Layout 
        currentPort={5181} 
        title="Pengeluaran" 
        sidebar={ExpenseSidebar}
        maxWidth="1400px"
    >
        <div className="lg:hidden mb-8">
             <SummaryCard total={totalExps} />
        </div>

        <div className="flex items-center justify-between mb-8 px-1">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-muted">Riwayat Pengeluaran</h2>
            <p className="text-xs font-bold text-muted">Total {expensesList.length} Transaksi</p>
        </div>

        {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-6">
                <span className="material-symbols-outlined animate-spin text-primary text-6xl">refresh</span>
                <div className="text-center">
                    <p className="text-sm font-black text-muted uppercase tracking-widest">Memuat data server...</p>
                    <p className="text-[10px] text-muted italic mt-2">Duduk santai sejenak, data sedang disiapkan.</p>
                </div>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <ExpenseList expenses={expensesList} onDelete={handleDeleteExpense} />
            </div>
        )}

        {/* Mobile Floating Action Button */}
        <div className="lg:hidden fixed bottom-10 right-8 z-[100]">
            <button
                onClick={() => setIsExpenseModalOpen(true)}
                className="size-16 bg-primary text-white rounded-full shadow-2xl shadow-primary/40 flex items-center justify-center active:scale-95 transition-transform"
            >
                <span className="material-symbols-outlined text-3xl">add</span>
            </button>
        </div>

      <AddExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onAdd={handleAddExpense}
      />
    </Layout>
  );
}

export default App;

