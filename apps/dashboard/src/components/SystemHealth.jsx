import React from 'react';

const SystemHealth = ({ health }) => {
    if (!health) return null;

    const { status, message, metrics } = health;

    const getStatusColor = () => {
        switch (status) {
            case 'CRITICAL': return 'bg-red-500 text-white';
            case 'WARNING': return 'bg-amber-500 text-white';
            default: return 'bg-emerald-500 text-white';
        }
    };

    const getStatusGlow = () => {
        switch (status) {
            case 'CRITICAL': return 'shadow-[0_0_20px_-5px_rgba(239,68,68,0.5)]';
            case 'WARNING': return 'shadow-[0_0_20px_-5px_rgba(245,158,11,0.5)]';
            default: return 'shadow-[0_0_20px_-5px_rgba(16,185,129,0.5)]';
        }
    };

    return (
        <div className={`glass p-6 rounded-[2rem] space-y-6 animate-in fade-in slide-in-from-right duration-700 ${getStatusGlow()}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-2xl glass flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined font-bold">query_stats</span>
                    </div>
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-widest opacity-60">System Health</h3>
                        <p className="text-[10px] font-bold text-[var(--text-muted)]">Real-time Performance Metrics</p>
                    </div>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-[0.2em] uppercase ${getStatusColor()}`}>
                    {status}
                </div>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--bg-surface-alt)] border border-white/5">
                <p className="text-xs font-bold leading-relaxed">{message}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl glass space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Latency</span>
                    <p className="text-lg font-black text-primary">{metrics.avgResponseTime}ms</p>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-primary transition-all duration-1000" 
                            style={{ width: `${Math.min(100, (metrics.avgResponseTime / 2000) * 100)}%` }}
                        ></div>
                    </div>
                </div>
                <div className="p-4 rounded-2xl glass space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Beban Egress</span>
                    <p className="text-lg font-black text-primary">{metrics.estimatedEgressMB}MB</p>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-blue-500 transition-all duration-1000" 
                            style={{ width: `${Math.min(100, (metrics.estimatedEgressMB / 20) * 100)}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest px-1">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Monitoring Active • 24h Rolling Window
            </div>
        </div>
    );
};

export default SystemHealth;
