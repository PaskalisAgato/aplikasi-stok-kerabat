import { useState } from 'react';
import Header from './components/Header';
import SummaryCard from './components/SummaryCard';
import ExpenseList from './components/ExpenseList';
import Fab from './components/Fab';
import AddExpenseModal from './components/AddExpenseModal';
import TransactionsBg from './components/TransactionsBg';
import { EXPENSES } from '@shared/mockDatabase';


import NavDrawer from '@shared/NavDrawer';




function App() {
  const [activeTab, setActiveTab] = useState<'penjualan' | 'pengeluaran'>('pengeluaran');
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expensesList, setExpensesList] = useState(EXPENSES);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleAddExpense = (newExpense: any) => {
    setExpensesList([newExpense, ...expensesList]);
  };

  const hasAnyModalOpen = isExpenseModalOpen;

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased min-h-screen">
      <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} currentPort={5181} />
      {/* Dimmed background list — only visible when a modal is open */}
      {hasAnyModalOpen && <TransactionsBg onOpenStockDetail={() => { }} />}

      {/* Main page content */}
      <div className={hasAnyModalOpen ? 'overflow-hidden max-h-screen' : ''}>
        <Header activeTab={activeTab} onTabChange={setActiveTab} onMenuClick={() => setDrawerOpen(true)} />

        <main className="p-4 space-y-6 pb-24">
          {activeTab === 'pengeluaran' ? (
            <>
              <SummaryCard />
              <ExpenseList expenses={expensesList} />
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
