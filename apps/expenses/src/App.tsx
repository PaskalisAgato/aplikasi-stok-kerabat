import { useState, useEffect } from 'react';
import SummaryCard from './components/SummaryCard';
import ExpenseList from './components/ExpenseList';
import AddExpenseModal from './components/AddExpenseModal';
import { apiClient } from '@shared/apiClient';
import type { ApiResponse } from '@shared/apiClient';
import Layout from '@shared/Layout';

interface ExpenseItem {
    id: number;
    title: string;
    category: string;
    date: string;
    amount: string;
    receiptUrl: string;
    hasReceipt?: boolean;
}

function App() {
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expensesList, setExpensesList] = useState<ExpenseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [page, setPage] = useState(0);
  const [_meta, setMeta] = useState<{ page: number; limit: number; total: number } | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const PAGE_SIZE = 20;

  const fetchExpenses = async (isLoadMore = false) => {
    try {
        if (!isLoadMore) {
            setIsLoading(true);
            setPage(0);
            setErrorMsg(null);
        }

        const currentPage = isLoadMore ? page + 1 : 0;
        console.log(`[ExpensesApp] Fetching expenses: Page ${currentPage}, Limit ${PAGE_SIZE}`);
        const response: ApiResponse<any> = await apiClient.getExpenses(PAGE_SIZE, currentPage * PAGE_SIZE);
        const { data, meta: responseMeta } = response;
        console.log(`[ExpensesApp] Success: Received ${data?.length || 0} items. Total available: ${responseMeta.total}`);
        if (responseMeta.page !== undefined) setMeta({ page: responseMeta.page, limit: responseMeta.limit, total: responseMeta.total });
        
        if (!Array.isArray(data)) {
            if (!isLoadMore) setExpensesList([]);
            return;
        }

        const formatted: ExpenseItem[] = data.map((exp: any) => ({
            id: exp.id,
            title: exp.title || 'Untitled Expense',
            category: exp.category || 'General',
            date: exp.expenseDate || exp.date || new Date().toISOString(),
            amount: exp.amount || '0',
            receiptUrl: exp.externalReceiptUrl || exp.receiptUrl || '',
            hasReceipt: !!exp.hasReceipt
        }));

        if (isLoadMore) {
            setExpensesList(prev => [...prev, ...formatted]);
            setPage(currentPage);
        } else {
            setExpensesList(formatted);
        }
        setHasMore(responseMeta.hasMore ?? (data.length >= responseMeta.limit));
    } catch (error: any) {
        console.error("Failed fetching expenses", error);
        setErrorMsg(error.message || "Gagal memuat data pengeluaran.");
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

    const handleExportExcel = async () => {
        try {
            console.log('[ExpensesApp] Exporting to Excel...');
            const blob = await apiClient.exportExpensesExcel();
            console.log(`[ExpensesApp] Export blob received: ${blob.size} bytes`);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Pengeluaran_Kerabat_POS_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('[ExpensesApp] Export failed:', error);
            alert('Gagal mengekspor data.');
        }
    };

  const totalExps = expensesList.reduce((sum, exp) => sum + parseFloat((exp.amount || 0).toString()), 0);

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
            <button 
              onClick={handleExportExcel} 
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl glass border-[var(--border-dim)] text-[var(--text-muted)] font-black text-[10px] uppercase tracking-widest hover:bg-primary/5 transition-all active:scale-[0.97]"
            >
                <span className="material-symbols-outlined text-lg font-black">table_chart</span>
                Ekspor Excel
            </button>
        </div>

        <div className="mt-10 pt-10 border-t border-[var(--border-dim)] space-y-4">
            <SummaryCard total={totalExps} compact />
        </div>
    </div>
  );

  return (
    <Layout
      currentPort={5181}
      title="Pengeluaran"
      subtitle="Manajemen Arus Kas"
      sidebar={ExpenseSidebar}
      headerExtras={
        <button onClick={handleExportExcel} className="size-11 glass flex items-center justify-center text-primary group shrink-0 rounded-2xl hover:bg-primary/5 active:scale-90 transition-all">
            <span className="material-symbols-outlined font-black group-hover:scale-110 transition-transform">table_chart</span>
        </button>
      }
      footer={
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
      }
    >
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
      ) : errorMsg ? (
          <div className="flex flex-col items-center justify-center py-24 gap-6 glass rounded-[3rem]">
              <span className="material-symbols-outlined text-5xl text-red-400">cloud_off</span>
              <div className="text-center space-y-2">
                  <p className="text-sm font-black text-red-400">Gagal memuat data</p>
                  <p className="text-[10px] text-[var(--text-muted)] max-w-xs">{errorMsg}</p>
              </div>
              <button
                  onClick={() => fetchExpenses()}
                  className="px-8 py-3 rounded-2xl bg-primary/10 text-primary font-black text-xs uppercase tracking-widest hover:bg-primary/20 active:scale-95 transition-all"
              >
                  Coba Lagi
              </button>
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

      {hasMore && !isLoading && (
          <div className="flex justify-center mt-12 pb-12">
              <button 
                  onClick={() => fetchExpenses(true)}
                  className="px-10 py-4 glass border-white/10 text-primary font-black text-xs uppercase tracking-[0.3em] rounded-2xl hover:bg-primary/5 active:scale-95 transition-all shadow-xl"
              >
                  Tampilkan Lebih Banyak
              </button>
          </div>
      )}

      <AddExpenseModal
          isOpen={isExpenseModalOpen}
          onClose={() => {
              setIsExpenseModalOpen(false);
              setEditingExpense(null);
          }}
          onAdd={handleAddExpense}
          initialData={editingExpense}
      />
    </Layout>
  );
}

export default App;
