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
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased min-h-screen">
      <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} currentPort={5181} />
      {/* Dimmed background list — only visible when a modal is open */}
      {hasAnyModalOpen && <TransactionsBg onOpenStockDetail={() => { }} />}

      {/* Main page content */}
      <div className={hasAnyModalOpen ? 'overflow-hidden max-h-screen' : ''}>
        <header className="p-4 border-b border-primary/10 flex items-center justify-between">
             <div className="flex items-center gap-2">
                 <button onClick={() => setDrawerOpen(true)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                     <span className="material-symbols-outlined text-primary">menu</span>
                 </button>
                 <h2 className="text-lg font-bold">Pengeluaran</h2>
             </div>
        </header>

        <main className="p-4 space-y-6 pb-24">
          {activeTab === 'pengeluaran' ? (
            <>
              <SummaryCard total={totalExps} />
              {isLoading ? (
                  <div className="flex flex-col items-center justify-center p-12 space-y-4">
                      <span className="material-symbols-outlined animate-spin text-primary text-4xl">refresh</span>
                      <p className="text-sm text-slate-500 animate-pulse">Memuat data dari server...</p>
                      <p className="text-[10px] text-slate-400 italic">Jika ini memakan waktu lama, server mungkin sedang "bangun" (Cold Start).</p>
                  </div>
              ) : (
                  <ExpenseList expenses={expensesList} onDelete={handleDeleteExpense} />
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-slate-500 dark:text-slate-400">
              <span className="material-symbols-outlined" style={{ fontSize: '64px', opacity: 0.2 }}>bar_chart</span>
              <p className="mt-4">Data Penjualan (TBD)</p>
            </div>
          )}
        </main>

        <Fab onClick={() => setIsExpenseModalOpen(true)} />
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
