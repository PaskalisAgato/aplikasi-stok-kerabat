import React, { useState, useEffect } from 'react';
import { apiClient } from '@shared/apiClient';

interface FloorPlanModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectTable: (tableName: string) => void;
    openBills: any[];
    mode?: 'save' | 'open'; // 'save' = create new (disable occupied), 'open' = view existing (only enable occupied)
}

export const FloorPlanModal: React.FC<FloorPlanModalProps> = ({
    isOpen, onClose, onSelectTable, openBills, mode = 'save'
}) => {
    const [tables, setTables] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [manualName, setManualName] = useState('');

    useEffect(() => {
        if (isOpen) {
            setManualName('');
            loadTables();
        }
    }, [isOpen]);

    const loadTables = async () => {
        setLoading(true);
        try {
            const res: any = await apiClient.get('/tables');
            setTables(res.data || []);
        } catch (e) {
            console.error('Failed load tables', e);
        }
        setLoading(false);
    };

    if (!isOpen) return null;

    const occupiedTables = new Set(
        openBills.map(b => String(b.customerInfo || '').toLowerCase().trim())
    );

    let maxX = 800; 
    let maxY = 600; 
    tables.forEach(t => {
        if (t.x + t.width > maxX) maxX = t.x + t.width;
        if (t.y + t.height > maxY) maxY = t.y + t.height;
    });

    const PADDING = 40;
    const viewWidth = maxX + PADDING;
    const viewHeight = maxY + PADDING;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 lg:p-10 animate-fade-in">
            <div className="bg-white w-full max-w-5xl h-full max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
                <div className="p-4 md:p-6 bg-slate-50 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">table_restaurant</span>
                            {mode === 'save' ? 'Pilih Meja untuk Menyimpan' : 'Pilih Meja Aktif'}
                        </h2>
                        <p className="text-xs font-bold text-slate-500 mt-1">
                            {mode === 'save' 
                                ? 'Tap meja kosong untuk menempatkan pesanan baru.' 
                                : 'Tap meja berwarna merah untuk membuka kembali tagihannya.'}
                        </p>
                    </div>

                    {mode === 'save' && (
                        <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm shrink-0 w-full md:w-auto">
                            <input
                                type="text"
                                placeholder="Cth: T-Away Bapak Budi"
                                value={manualName}
                                onChange={(e) => setManualName(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && manualName.trim()) {
                                        onSelectTable(manualName.trim());
                                    }
                                }}
                                className="bg-transparent px-4 py-3 min-w-[200px] outline-none font-bold text-sm text-slate-900 w-full"
                            />
                            <button 
                                onClick={() => { if(manualName.trim()) onSelectTable(manualName.trim()) }}
                                disabled={!manualName.trim()}
                                className="bg-primary text-white font-black text-xs uppercase px-6 rounded-lg disabled:opacity-50 hover:bg-primary/90 transition"
                            >
                                Pilih
                            </button>
                        </div>
                    )}
                </div>

                {/* Floor Plan Viewport */}
                <div className="flex-1 bg-slate-200/50 p-6 relative overflow-auto custom-scrollbar flex items-center justify-center">
                    {loading ? (
                        <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    ) : tables.length === 0 ? (
                        <div className="text-center opacity-50">
                            <span className="material-symbols-outlined text-5xl mb-2">grid_off</span>
                            <p className="font-bold">Denah belum diatur.<br/>Gunakan input manual di atas, atau atur di Menu Pengaturan.</p>
                        </div>
                    ) : (
                        <div className="w-full h-full max-w-full overflow-auto custom-scrollbar p-2">
                            <div 
                                className="relative bg-white shadow-xl border border-slate-100 rounded-2xl mx-auto"
                                style={{ width: viewWidth, height: viewHeight }}
                            >
                                <style dangerouslySetInnerHTML={{__html: `
                                    .custom-floor-bg { 
                                        background-image: radial-gradient(#e2e8f0 1.5px, transparent 0);
                                        background-size: 30px 30px;
                                    }
                                `}} />
                                <div className="absolute inset-0 custom-floor-bg rounded-2xl pointer-events-none opacity-50"></div>
                                
                                {tables.map(table => {
                                    const isOccupied = occupiedTables.has(table.name.toLowerCase().trim());
                                    
                                    // Behaviors depending on mode (In Open mode: both occupied & empty are clickable!)
                                    const isDisabled = mode === 'save' ? isOccupied : false;
                                    
                                    let styling = '';
                                    if (isOccupied) {
                                        styling = mode === 'open'
                                            ? 'bg-red-50 text-red-600 border-2 border-red-500 hover:bg-red-100 hover:shadow-xl hover:shadow-red-500/30 cursor-pointer active:scale-95'
                                            : 'bg-red-50 text-red-400 border-2 border-red-200 cursor-not-allowed opacity-80';
                                    } else {
                                        styling = mode === 'save' || mode === 'open'
                                            ? 'bg-white text-slate-700 border-2 border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-500 cursor-pointer hover:shadow-xl hover:shadow-emerald-500/20 active:scale-95'
                                            : 'bg-slate-100/50 text-slate-400 border-2 border-slate-200 cursor-not-allowed opacity-50';
                                    }

                                    return (
                                        <button
                                            key={table.id}
                                            onClick={() => {
                                                if (!isDisabled) onSelectTable(table.name);
                                            }}
                                            disabled={isDisabled}
                                            style={{
                                                position: 'absolute',
                                                left: table.x,
                                                top: table.y,
                                                width: table.width,
                                                height: table.height,
                                            }}
                                            className={`
                                                flex flex-col items-center justify-center shadow-md select-none transition-all Group
                                                ${table.shape === 'circle' ? 'rounded-full' : 'rounded-2xl'}
                                                ${styling}
                                            `}
                                        >
                                            <span className="font-black text-base truncate px-2 text-center break-words leading-tight">{table.name}</span>
                                            {isOccupied && <span className="text-[10px] uppercase font-bold tracking-widest mt-1 opacity-70 border border-current px-1.5 rounded bg-white">Terisi</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Footer Buttons */}
                <div className="p-4 bg-white border-t flex justify-end shrink-0">
                    <button onClick={onClose} className="px-6 py-3 bg-slate-100 text-slate-600 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-slate-200 transition">
                        Batal
                    </button>
                </div>
            </div>
        </div>
    );
};
