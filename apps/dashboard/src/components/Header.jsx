export default function Header({ onMenuClick, onNotificationClick }) {
    return (
        <header className="flex items-center gap-2 p-4 sticky top-0 z-20 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-primary/10">
            <button onClick={onMenuClick} className="size-10 flex items-center justify-center rounded-full hover:bg-primary/10 transition-colors text-primary active:scale-95 shrink-0">
                <span className="material-symbols-outlined">menu</span>
            </button>
            <div className="flex flex-1 items-center gap-3">
                <div className="size-9 rounded-full overflow-hidden border-2 border-primary/20 bg-primary/10 flex items-center justify-center shrink-0">
                    <img
                        alt="Profile"
                        className="w-full h-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBMSQAXTr3VOuV6nqhGIV7OTm1NOG_aL8F-OCZHgdGrQ6r0DKscdGOhocLuX9hpwNlJs_Vcrj_SfhW_H-8B_H1jSFMnzrBF0cfjTuSfYQoM3FhMcykPVPSJnWA3sxLPRvAu0438yjvCcS8FBtNOzmD4De8TjbVbrqwknrpNh3JXkWlBTm5K2bEZQsF1-RqU3noicRXcbhZ5CPVBBUGwkFO8Gz0AoJUleqMGCunBMC8vSc4XiPEpTX-8PzQn951I_xGcK46NPCsM3uU"
                    />
                </div>
                <div>
                    <p className="text-[9px] uppercase tracking-widest text-primary font-bold">Dashboard</p>
                    <h1 className="text-base font-bold leading-tight tracking-tight">Kerabat Kopi Tiam</h1>
                </div>
            </div>
            <button onClick={onNotificationClick} className="relative p-2 rounded-full hover:bg-primary/10 transition-colors shrink-0">
                <span className="material-symbols-outlined text-slate-900 dark:text-slate-100">notifications</span>
                <span className="absolute top-2 right-2 flex h-1.5 w-1.5 rounded-full bg-red-500"></span>
            </button>
        </header>
    );
}
