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

function toLocalISOString(date: Date) {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function App() {

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expensesList, setExpensesList] = useState<ExpenseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [page, setPage] = useState(0);
  const [summary, setSummary] = useState<{ totalExpenses: number; totalTransactions: number } | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const PAGE_SIZE = 20;

  // 1. Initial State from LocalStorage
  const [startDate, setStartDate] = useState(() => {
    const saved = localStorage.getItem('expenseFilter');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (parsed.startDate) return parsed.startDate;
        } catch (e) { console.error("Filter parse error", e); }
    }
    const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0);
    return toLocalISOString(d);
  });

  const [endDate, setEndDate] = useState(() => {
    const saved = localStorage.getItem('expenseFilter');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (parsed.endDate) return parsed.endDate;
        } catch (e) { console.error("Filter parse error", e); }
    }
    const d = new Date(); d.setHours(23, 59, 59, 999);
    return toLocalISOString(d);
  });

  // 2. Persist State
  useEffect(() => {
    localStorage.setItem('expenseFilter', JSON.stringify({ startDate, endDate }));
  }, [startDate, endDate]);

  // 3. Single Source of Truth Fetching
  const fetchExpenses = async (isLoadMore = false) => {
    try {
        if (!isLoadMore) {
            setIsLoading(true);
            setPage(0);
            setErrorMsg(null);
        }

        const currentPage = isLoadMore ? page + 1 : 0;
        
        const response: ApiResponse<any> = await apiClient.getExpenses(
            PAGE_SIZE, 
            currentPage * PAGE_SIZE,
            startDate,
            endDate
        );
        
        const { data, summary: responseSummary, meta } = response;
        
        setSummary(responseSummary || { totalExpenses: 0, totalTransactions: 0 });
        setHasMore(!!meta?.hasMore);

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
    } catch (error: any) {
        console.error("Failed fetching expenses", error);
        setErrorMsg(error.message || "Gagal memuat data pengeluaran.");
    } finally {
        setIsLoading(false);
    }
  };

  // 4. Auto-fetch on date change
  useEffect(() => {
    fetchExpenses(false);
  }, [startDate, endDate]);

  const handleAddExpense = () => {
    fetchExpenses(false);
  };

  const handleEditExpense = (expense: any) => {
    setEditingExpense(expense);
    setIsExpenseModalOpen(true);
  };

  const handleDeleteExpense = async (id: number) => {
    const pin = prompt('Masukkan PIN Supervisor untuk menghapus pengeluaran:');
    if (pin !== '1234') {
        alert('PIN Salah! Akses ditolak.');
        return;
    }
    
    try {
      await apiClient.deleteExpense(id);
      fetchExpenses(false);
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

  const totalExps = summary?.totalExpenses || 0;

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
            <SummaryCard 
                total={summary?.totalExpenses || 0} 
                title={expensesList.length > 0 ? 'Total Filter Periode' : 'Total Pengeluaran'}
                compact 
            />
            <div className="glass p-5 rounded-2xl space-y-2 border border-white/5">
                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-60">Total Transaksi</p>
                <p className="text-xl font-black text-[var(--text-main)]">{summary?.totalTransactions || 0} Slip</p>
            </div>
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
                className="w-full flex items-center justify-center gap-4 accent-gradient text-[var(--text-main)] px-10 py-5 rounded-[2rem] shadow-2xl shadow-primary/40 active:scale-95 transition-all border-none group"
            >
                <span className="material-symbols-outlined text-3xl font-black group-hover:rotate-12 transition-transform">add_circle</span>
                <span className="text-[10px] font-black uppercase tracking-[0.4em]">Tambah Pengeluaran Baru</span>
            </button>
        </footer>
      }
    >
      <div className="lg:hidden mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
           <SummaryCard 
                total={totalExps} 
                title={expensesList.length > 0 ? 'Total Filter Periode' : 'Total Pengeluaran'}
           />
      </div>

      {/* Optimized Filter UI (Mobile First) */}
      <div className="glass rounded-[2rem] p-5 md:p-8 mb-10 border border-white/5 space-y-6">
          <div className="flex items-center gap-3 px-2">
              <span className="material-symbols-outlined text-primary font-black">calendar_month</span>
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Filter Laporan</p>
          </div>

          <div className="flex flex-wrap items-end gap-3 md:gap-4 bg-black/20 p-5 rounded-[2rem] border border-white/5">
              <div className="flex-1 min-w-[140px] space-y-2">
                  <label className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1 opacity-50">Dari</label>
                  <input 
                      type="datetime-local" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-[var(--bg-card)] border border-white/10 rounded-xl px-4 py-3 text-[11px] font-bold text-[var(--text-main)] outline-none"
                  />
              </div>

              <div className="flex-1 min-w-[140px] space-y-2">
                  <label className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1 opacity-50">Sampai</label>
                  <input 
                      type="datetime-local" 
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-[var(--bg-card)] border border-white/10 rounded-xl px-4 py-3 text-[11px] font-bold text-[var(--text-main)] outline-none"
                  />
              </div>

              <div className="flex gap-2 w-full md:w-auto">
                  <button 
                      onClick={() => fetchExpenses(false)}
                      className="btn-primary flex-1 md:flex-none px-6 py-3 rounded-xl text-[10px] uppercase font-black tracking-widest shadow-lg shadow-primary/10"
                  >
                      Cari
                  </button>
                  <button 
                      onClick={() => {
                          localStorage.removeItem('expenseFilter');
                          const d = new Date(); d.setDate(1); d.setHours(0,0,0,0);
                          const now = new Date(); now.setHours(23,59,59,999);
                          setStartDate(toLocalISOString(d));
                          setEndDate(toLocalISOString(now));
                      }}
                      className="glass px-4 py-3 rounded-xl text-[10px] uppercase font-black text-[var(--text-muted)] tracking-widest hover:bg-white/5 transition-all active:scale-95"
                  >
                      Reset
                  </button>
              </div>
          </div>
      </div>

      {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-6 glass rounded-[3rem] opacity-60">
              <div className="size-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
              <div className="text-center space-y-2">
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] animate-pulse">Menghubungkan Server...</p>
                  <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-60 italic">Mengambil data filter terbaru</p>
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
      ) : expensesList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6 glass rounded-[3rem] border border-dashed border-white/10 opacity-70">
              <span className="material-symbols-outlined text-6xl text-[var(--text-muted)] opacity-20">inventory_2</span>
              <div className="text-center space-y-2">
                  <p className="text-sm font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Data Tidak Ditemukan</p>
                  <p className="text-[10px] text-[var(--text-muted)] opacity-60 uppercase tracking-widest font-black italic">Tidak ada pengeluaran di periode ini</p>
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
