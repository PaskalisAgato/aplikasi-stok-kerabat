import { getTargetUrl } from '@shared/navigation';

const CURRENT_PORT = 5173; // Dashboard

export default function BottomNav() {
    const inventoryUrl = getTargetUrl(5174);
    const posUrl = getTargetUrl(5186);
    const reportsUrl = getTargetUrl(5175);

    return (
        <nav className="fixed bottom-0 left-0 right-0 max-w-[390px] mx-auto bg-background-app/90  backdrop-blur-xl border-t border-slate-200  px-6 pb-6 pt-3 flex justify-between items-center z-40">
            {/* Home (active) */}
            <a className="flex flex-col items-center gap-1 group" href="#">
                <div className="bg-primary/20 p-1.5 rounded-xl">
                    <span className="material-symbols-outlined text-primary fill-1" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
                </div>
                <span className="text-[10px] font-bold text-primary">Home</span>
            </a>

            {/* Inventory */}
            <a className="flex flex-col items-center gap-1 group" href={inventoryUrl}>
                <div className="p-1.5">
                    <span className="material-symbols-outlined dark:text-slate-400 dark:text-slate-400 text-slate-500 group-hover:text-primary transition-colors">inventory</span>
                </div>
                <span className="text-[10px] font-medium dark:text-slate-400 dark:text-slate-400 text-slate-500 group-hover:text-primary">Inventory</span>
            </a>

            {/* Kasir/POS */}
            <a className="flex flex-col items-center gap-1 group" href={posUrl}>
                <div className="p-1.5">
                    <span className="material-symbols-outlined dark:text-slate-400 dark:text-slate-400 text-slate-500 group-hover:text-primary transition-colors">point_of_sale</span>
                </div>
                <span className="text-[10px] font-medium dark:text-slate-400 dark:text-slate-400 text-slate-500 group-hover:text-primary">Kasir</span>
            </a>

            {/* Laporan */}
            <a className="flex flex-col items-center gap-1 group" href={reportsUrl}>
                <div className="p-1.5">
                    <span className="material-symbols-outlined dark:text-slate-400 dark:text-slate-400 text-slate-500 group-hover:text-primary transition-colors">monitoring</span>
                </div>
                <span className="text-[10px] font-medium dark:text-slate-400 dark:text-slate-400 text-slate-500 group-hover:text-primary">Laporan</span>
            </a>
        </nav>
    );
}

