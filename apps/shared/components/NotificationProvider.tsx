import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface Notification {
    id: string;
    message: string;
    type: NotificationType;
    duration?: number;
}

interface NotificationContextType {
    showNotification: (message: string, type?: NotificationType, duration?: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const showNotification = useCallback((message: string, type: NotificationType = 'info', duration: number = 4000) => {
        const id = Math.random().toString(36).substring(2, 9);
        setNotifications((prev) => [...prev, { id, message, type, duration }]);

        setTimeout(() => {
            setNotifications((prev) => prev.filter((n) => n.id !== id));
        }, duration);
    }, []);

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
            <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none max-w-[90vw] sm:max-w-md">
                {notifications.map((n) => (
                    <div
                        key={n.id}
                        className={`
                            pointer-events-auto
                            flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border 
                            animate-in slide-in-from-right-10 fade-in duration-500
                            ${n.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-400' : ''}
                            ${n.type === 'error' ? 'bg-red-950/90 border-red-500/30 text-red-400' : ''}
                            ${n.type === 'warning' ? 'bg-amber-950/90 border-amber-500/30 text-amber-400' : ''}
                            ${n.type === 'info' ? 'bg-slate-900/90 border-white/10 text-[var(--text-main)]' : ''}
                            glass backdrop-blur-xl
                        `}
                    >
                        <div className={`
                            size-10 rounded-xl flex items-center justify-center
                            ${n.type === 'success' ? 'bg-emerald-500 text-slate-950' : ''}
                            ${n.type === 'error' ? 'bg-red-500 text-white' : ''}
                            ${n.type === 'warning' ? 'bg-amber-500 text-slate-950' : ''}
                            ${n.type === 'info' ? 'bg-primary text-slate-950' : ''}
                        `}>
                            <span className="material-symbols-outlined font-black">
                                {n.type === 'success' ? 'check_circle' : n.type === 'error' ? 'error' : n.type === 'warning' ? 'warning' : 'info'}
                            </span>
                        </div>
                        <div className="flex-1">
                            <p className="text-xs font-black uppercase tracking-widest opacity-60 mb-1">
                                {n.type === 'success' ? 'Berhasil' : n.type === 'error' ? 'Kesalahan' : n.type === 'warning' ? 'Peringatan' : 'Informasi'}
                            </p>
                            <p className="text-sm font-bold leading-relaxed">{n.message}</p>
                        </div>
                        <button 
                            onClick={() => setNotifications(prev => prev.filter(item => item.id !== n.id))}
                            className="opacity-40 hover:opacity-100 transition-opacity"
                        >
                            <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                    </div>
                ))}
            </div>
        </NotificationContext.Provider>
    );
};
