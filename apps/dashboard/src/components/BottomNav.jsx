export default function BottomNav() {
    return (
        <nav className="fixed bottom-0 left-0 right-0 max-w-[390px] mx-auto bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-xl border-t border-slate-200 dark:border-white/10 px-6 pb-6 pt-3 flex justify-between items-center z-40">
            <a className="flex flex-col items-center gap-1 group" href="#">
                <div className="bg-primary/20 p-1.5 rounded-xl">
                    <span className="material-symbols-outlined text-primary fill-1" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
                </div>
                <span className="text-[10px] font-bold text-primary">Home</span>
            </a>
            <a className="flex flex-col items-center gap-1 group" href="#">
                <div className="p-1.5">
                    <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">inventory</span>
                </div>
                <span className="text-[10px] font-medium text-slate-400 group-hover:text-primary">Inventory</span>
            </a>
            <a className="flex flex-col items-center gap-1 group" href="#">
                <div className="p-1.5">
                    <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">receipt_long</span>
                </div>
                <span className="text-[10px] font-medium text-slate-400 group-hover:text-primary">Transactions</span>
            </a>
            <a className="flex flex-col items-center gap-1 group" href="#">
                <div className="p-1.5">
                    <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">monitoring</span>
                </div>
                <span className="text-[10px] font-medium text-slate-400 group-hover:text-primary">Reports</span>
            </a>
        </nav>
    );
}
