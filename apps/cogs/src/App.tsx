import { useState } from 'react';
import { INVENTORY } from '../../shared/mockDatabase';
import NavDrawer from '../../shared/NavDrawer';

function App() {
    const [drawerOpen, setDrawerOpen] = useState(false);
    return (
        <div className="bg-background-light  font-display text-slate-900  min-h-screen flex flex-col antialiased">
            <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} currentPort={5180} />
            <div className="relative flex h-auto min-h-screen w-full flex-col max-w-md mx-auto shadow-2xl border-x border-slate-800/10 ">
                {/* Header Section */}
                <div className="flex items-center bg-background-light/90  backdrop-blur-md p-4 pb-3 sticky top-0 z-30 border-b border-primary/10  gap-2">
                    <button onClick={() => setDrawerOpen(true)} className="flex items-center justify-center size-10 rounded-full hover:bg-primary/10 transition-colors active:scale-95 text-primary shrink-0">
                        <span className="material-symbols-outlined">menu</span>
                    </button>
                    <h2 className="text-slate-900  text-lg font-bold leading-tight tracking-tight flex-1">COGS Analysis</h2>
                </div>
                <main className="flex-1 overflow-y-auto pb-8">
                    {/* Ingredient Summary */}
                    <div className="flex p-4">
                        <div className="flex w-full flex-col gap-4 items-start">
                            <div className="flex gap-4 items-center w-full">
                                <div
                                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-xl size-24 border border-slate-200  shrink-0 shadow-sm"
                                    style={{ backgroundImage: `url('${INVENTORY[0].imageUrl}')` }}
                                    title={INVENTORY[0].name}
                                ></div>
                                <div className="flex flex-col flex-1 pl-1">
                                    <p className="text-slate-900  text-xl font-bold leading-tight tracking-tight mb-1">{INVENTORY[0].name}</p>
                                    <p className="text-primary text-base font-bold leading-normal mb-1 tracking-tight">Rp 125.000 / <span className="text-sm">{INVENTORY[0].unit}</span></p>
                                    <p className="text-slate-500  text-[11px] font-medium leading-normal mt-0.5">Last updated: 2 hours ago</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* KPI Cards */}
                    <div className="flex flex-col gap-3 px-4 pt-2 pb-6">
                        <div className="flex flex-col gap-1.5 rounded-xl p-4 bg-primary/5  border border-primary/10  shadow-sm">
                            <p className="text-slate-500  text-xs font-semibold uppercase tracking-wider">Total Spending</p>
                            <p className="text-slate-900  text-2xl font-extrabold leading-tight tracking-tight">Rp 4.2M</p>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
export default App;
