import React, { useState } from 'react';
import { apiClient } from '@shared/apiClient';

const MaintenanceTools = () => {
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [message, setMessage] = useState(null);

    const handleBackup = async () => {
        try {
            setIsBackingUp(true);
            setMessage({ type: 'info', text: 'Memulai pencadangan data...' });
            const res = await apiClient.triggerBackup();
            setMessage({ type: 'success', text: res.message || 'Pencadangan berhasil!' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Pencadangan gagal: ' + error.message });
        } finally {
            setIsBackingUp(false);
            setTimeout(() => setMessage(null), 5000);
        }
    };

    return (
        <div className="glass p-6 rounded-[2rem] space-y-6">
            <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl glass flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined font-bold">handyman</span>
                </div>
                <div>
                    <h3 className="text-sm font-black uppercase tracking-widest opacity-60">Maintenance</h3>
                    <p className="text-[10px] font-bold text-[var(--text-muted)]">Data Safety & Optimization</p>
                </div>
            </div>

            <div className="space-y-3">
                <button 
                    onClick={handleBackup}
                    disabled={isBackingUp}
                    className="w-full flex items-center justify-between p-4 rounded-2xl glass hover:bg-primary/5 transition-all group active:scale-[0.98] disabled:opacity-50"
                >
                    <div className="flex items-center gap-3 text-left">
                        <span className={`material-symbols-outlined text-primary ${isBackingUp ? 'animate-spin' : 'group-hover:rotate-12 transition-transform'}`}>
                            database
                        </span>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest">Backup Database</p>
                            <p className="text-[10px] font-bold text-[var(--text-muted)]">Ekspor JSON ke Server</p>
                        </div>
                    </div>
                    <span className="material-symbols-outlined text-[var(--text-muted)] opacity-40 group-hover:translate-x-1 transition-transform">
                        chevron_right
                    </span>
                </button>

                <div className="p-4 rounded-2xl border border-dashed border-white/10 opacity-60 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-blue-400">storage</span>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest">Storage Optimize</p>
                            <p className="text-[10px] font-bold text-[var(--text-muted)]">Otomatis via Server Task</p>
                        </div>
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest bg-white/5 px-2 py-1 rounded-full">AUTO</span>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center animate-in zoom-in duration-300 ${
                    message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                    message.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                    'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                }`}>
                    {message.text}
                </div>
            )}
        </div>
    );
};

export default MaintenanceTools;
