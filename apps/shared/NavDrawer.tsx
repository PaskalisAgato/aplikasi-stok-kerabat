import React from 'react';
import { NAV_LINKS, getTargetUrl } from './navigation';

interface NavDrawerProps {
    open: boolean;
    onClose: () => void;
    currentPort?: number;
}

const NavDrawer: React.FC<NavDrawerProps> = ({ open, onClose, currentPort }) => {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex">
            <div
                className="absolute inset-0 bg-slate-900/50"
                onClick={onClose}
            />
            <div className="relative w-72 max-w-[80vw] bg-white dark:bg-[#0f172a] h-full flex flex-col shadow-2xl animate-slideInLeft border-r border-slate-200 dark:border-slate-800 pointer-events-auto">
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a]">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Menu</h2>
                    <button onClick={onClose} className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 rounded-lg transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                    {NAV_LINKS.map((link) => {
                        const isActive = currentPort === link.port;
                        const targetUrl = getTargetUrl(link.port);

                        return (
                            <a
                                key={link.port}
                                href={isActive ? '#' : targetUrl}
                                onClick={(e) => {
                                    if (isActive) {
                                        e.preventDefault();
                                        onClose();
                                    }
                                }}
                                className={`
                                    flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                                    ${isActive
                                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400'
                                        : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-[#1e293b]'}
                                `}
                            >
                                <span className="material-symbols-outlined">{link.icon}</span>
                                <span className="font-medium">{link.label}</span>
                            </a>
                        );
                    })}
                </nav>
            </div>
            <style>{`
                @keyframes slideInLeft {
                    from { transform: translateX(-100%); }
                    to { transform: translateX(0); }
                }
                .animate-slideInLeft {
                    animation: slideInLeft 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};

export default NavDrawer;



