import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '@shared/apiClient';

interface TableEntity {
    id: number;
    name: string;
    shape: 'rect' | 'circle';
    x: number;
    y: number;
    width: number;
    height: number;
    isActive: boolean;
}

export const FloorPlanEditor: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [tables, setTables] = useState<TableEntity[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedTable, setSelectedTable] = useState<number | null>(null);

    // Edit modal states for name changing
    const [isEditingName, setIsEditingName] = useState(false);
    const [editNameValue, setEditNameValue] = useState('');

    const gridRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadTables();
    }, []);

    const loadTables = async () => {
        setLoading(true);
        try {
            const res: any = await apiClient.get('/tables');
            setTables(res.data || []);
        } catch (e) {
            console.error("Failed to load tables", e);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await apiClient.post('/tables/bulk', { items: tables });
            alert("Denah berhasil disimpan!");
        } catch (e) {
            console.error(e);
            alert("Gagal menyimpan denah.");
        }
        setSaving(false);
    };

    const addTable = async (shape: 'rect' | 'circle') => {
        try {
            const res: any = await apiClient.post('/tables', { 
                name: `Meja ${tables.length + 1}`,
                shape: shape,
                x: 50, y: 50, width: 100, height: shape === 'circle' ? 100 : 80
            });
            setTables([...tables, res.data]);
        } catch (e) {
            console.error("Add failed", e);
        }
    };

    const deleteSelected = async () => {
        if (!selectedTable) return;
        if (!confirm("Hapus meja ini?")) return;
        try {
            await apiClient.delete(`/tables/${selectedTable}`);
            setTables(tables.filter(t => t.id !== selectedTable));
            setSelectedTable(null);
        } catch (e) {
            console.error(e);
        }
    };

    // Dragging Logic
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const handlePointerDown = (e: React.PointerEvent, id: number) => {
        e.stopPropagation();
        setSelectedTable(id);
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const parentRect = gridRef.current?.getBoundingClientRect();
        
        if (parentRect) {
            // Calculate mouse offset inside the element relative to its top-left
            const offsetX = e.clientX - rect.left;
            const offsetY = e.clientY - rect.top;
            setDragOffset({ x: offsetX, y: offsetY });
            setIsDragging(true);
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        }
    };

    const handlePointerMove = (e: React.PointerEvent, id: number) => {
        if (!isDragging || selectedTable !== id) return;
        const parentRect = gridRef.current?.getBoundingClientRect();
        if (parentRect) {
            // New absolute x,y relative to the grid container
            let newX = e.clientX - parentRect.left - dragOffset.x;
            let newY = e.clientY - parentRect.top - dragOffset.y;

            // Simple snap to grid (10px)
            newX = Math.round(newX / 10) * 10;
            newY = Math.round(newY / 10) * 10;

            // Bounds check
            if (newX < 0) newX = 0;
            if (newY < 0) newY = 0;
            
            setTables(prev => prev.map(t => t.id === id ? { ...t, x: newX, y: newY } : t));
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        setIsDragging(false);
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    };

    const openNameEdit = () => {
        if (!selectedTable) return;
        const t = tables.find(x => x.id === selectedTable);
        if (t) {
            setEditNameValue(t.name);
            setIsEditingName(true);
        }
    };

    const saveNameEdit = async () => {
        if (!selectedTable) return;
        try {
            await apiClient.put(`/tables/${selectedTable}`, { name: editNameValue });
            setTables(prev => prev.map(t => t.id === selectedTable ? { ...t, name: editNameValue } : t));
            setIsEditingName(false);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-100 text-slate-800">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-white border-b shadow-sm z-10 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors active:scale-95">
                        <span className="material-symbols-outlined font-black">arrow_back</span>
                    </button>
                    <div>
                        <h2 className="font-black text-lg tracking-tight leading-none text-slate-900">Editor Denah Meja</h2>
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1">Geser & Atur Layout Ruangan</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <button onClick={() => addTable('rect')} className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-lg text-xs hover:bg-slate-300 transition-colors flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px]">crop_square</span> + Kotak
                    </button>
                    <button onClick={() => addTable('circle')} className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-lg text-xs hover:bg-slate-300 transition-colors flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px]">radio_button_unchecked</span> + Bundar
                    </button>
                    <div className="w-px h-6 bg-slate-300 mx-2"></div>
                    <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-primary text-white font-black uppercase text-xs tracking-widest rounded-lg shadow-lg hover:bg-primary/90 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50">
                        <span className="material-symbols-outlined text-[18px]">save</span> 
                        {saving ? 'Menyimpan...' : 'Simpan Layout'}
                    </button>
                </div>
            </div>

            {/* Toolbar for selected table */}
            {selectedTable && (
                <div className="bg-white px-6 py-3 border-b flex items-center gap-3 shrink-0 animate-fade-in shadow-sm z-10">
                    <span className="text-xs font-bold text-slate-500">Meja Terpilih:</span>
                    <span className="text-sm font-black text-primary px-3 py-1 bg-primary/10 rounded-md">
                        {tables.find(t => t.id === selectedTable)?.name}
                    </span>
                    <button onClick={openNameEdit} className="px-3 py-1.5 text-xs font-bold bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition">
                        Ganti Nama
                    </button>
                    <button onClick={deleteSelected} className="px-3 py-1.5 text-xs font-bold bg-red-100 text-red-600 rounded-lg ml-auto hover:bg-red-200 transition">
                        <span className="material-symbols-outlined text-[14px] align-middle mr-1">delete</span> Hapus Meja
                    </button>
                </div>
            )}

            {/* Editing Modal */}
            {isEditingName && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl w-80">
                        <h3 className="font-black text-lg mb-4 text-slate-900">Ubah Nama Meja</h3>
                        <input 
                            value={editNameValue} 
                            onChange={e => setEditNameValue(e.target.value)} 
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-bold mb-4 focus:border-primary outline-none"
                            placeholder="Cth: VIP 1"
                            onFocus={e => e.target.select()}
                        />
                        <div className="flex gap-2">
                            <button onClick={() => setIsEditingName(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 text-sm">Batal</button>
                            <button onClick={saveNameEdit} className="flex-[2] py-3 bg-primary text-white font-black rounded-xl shadow-lg hover:bg-primary/90 text-sm">Simpan Nama</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Canvas Area */}
            <div 
                className="flex-1 overflow-auto bg-[#eef2f6] relative p-10" 
                onClick={(e) => {
                    // Deselect if clicking on empty background
                    if (e.target === e.currentTarget) setSelectedTable(null);
                }}
            >
                <div 
                    ref={gridRef}
                    className="relative bg-white shadow-xl rounded-xl custom-grid-bg border border-slate-200"
                    style={{ width: '1200px', height: '1200px', margin: '0 auto' }}
                    onClick={(e) => { if (e.target === e.currentTarget) setSelectedTable(null); }}
                >
                    {/* Grid Pattern (Optional inline style for dot grid) */}
                    <style dangerouslySetInnerHTML={{__html: `
                        .custom-grid-bg { 
                            background-image: radial-gradient(#cbd5e1 1px, transparent 0);
                            background-size: 20px 20px;
                        }
                    `}} />

                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-50">
                            <div className="size-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        tables.map(table => {
                            const isSelected = selectedTable === table.id;
                            return (
                                <div
                                    key={table.id}
                                    onPointerDown={(e) => handlePointerDown(e, table.id)}
                                    onPointerMove={(e) => handlePointerMove(e, table.id)}
                                    onPointerUp={handlePointerUp}
                                    onPointerCancel={handlePointerUp}
                                    style={{
                                        position: 'absolute',
                                        left: table.x,
                                        top: table.y,
                                        width: table.width,
                                        height: table.height,
                                        touchAction: 'none'
                                    }}
                                    className={`
                                        flex items-center justify-center shadow-md select-none transition-shadow
                                        ${table.shape === 'circle' ? 'rounded-full' : 'rounded-xl'}
                                        ${isSelected ? 'bg-primary/90 text-white shadow-primary/40 ring-4 ring-primary/30 scale-105 z-20 cursor-grabbing' : 'bg-slate-100 text-slate-700 border-2 border-slate-300 hover:border-primary/50 cursor-grab z-10'}
                                    `}
                                >
                                    <span className="font-black text-sm tracking-tight px-2 text-center break-words pointer-events-none">
                                        {table.name}
                                    </span>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};
