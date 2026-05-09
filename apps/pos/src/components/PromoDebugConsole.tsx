import React, { useState } from 'react';
import { usePromo } from '../hooks/usePromo';
import { Terminal, RefreshCcw, Check, X } from 'lucide-react';

export const PromoDebugConsole: React.FC = () => {
    const { activeRules, configVersion, isSyncing, syncRules } = usePromo();
    const [isOpen, setIsOpen] = useState(false);

    if (!isOpen) {
        return (
            <button 
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 bg-slate-800 text-green-400 p-2 rounded-full shadow-xl opacity-50 hover:opacity-100 transition-opacity z-50"
                title="Open Promo Debug Panel"
            >
                <Terminal className="w-5 h-5" />
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 w-[400px] bg-slate-900 border border-slate-700 shadow-2xl rounded-lg overflow-hidden flex flex-col z-50 text-xs font-mono text-green-400">
            {/* Header */}
            <div className="bg-slate-800 p-2 flex justify-between items-center border-b border-slate-700">
                <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 ml-1" />
                    <span className="font-bold text-white">Promo Debug Console</span>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white mr-1">
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Content */}
            <div className="p-3 space-y-3 h-[300px] overflow-y-auto">
                <div className="flex items-center justify-between bg-black/30 p-2 rounded">
                    <span>Config Version: <strong className="text-white">{configVersion}</strong></span>
                    <button 
                        onClick={() => syncRules(true)}
                        className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded"
                    >
                        <RefreshCcw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} /> Sync DB
                    </button>
                </div>

                <div>
                    <h4 className="text-slate-400 mb-1 border-b border-slate-800 pb-1">Active Rules ({activeRules.length})</h4>
                    {activeRules.length === 0 && <p className="text-slate-500 italic">No rules active.</p>}
                    <div className="space-y-2 mt-2">
                        {activeRules.map((rule, i) => (
                            <div key={i} className="bg-slate-800/50 p-2 rounded border border-slate-800">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-blue-400 font-bold">{rule.code}</span>
                                    <span className="text-[10px] bg-slate-700 px-1 rounded text-slate-300">v{rule.configVersion}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-300">
                                    <span>Type: {rule.type}</span>
                                    <span>Val: {rule.value}</span>
                                    <span>Min: {rule.minPurchase}</span>
                                    <span>Cap: {rule.maxDiscount || 'None'}</span>
                                    <span>Used: {rule.usedCount}{rule.usageLimit ? `/${rule.usageLimit}` : ''}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
