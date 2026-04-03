import React, { useState, useMemo, useEffect } from 'react';
import { apiClient, apiFetch } from '@shared/apiClient';
import { useEmployees } from '@shared/hooks/useEmployees';
import { useSession } from '@shared/authClient';
import { toast } from 'react-hot-toast';

const SHIFT_TYPES = [
    { label: 'Pagi', code: 'P', color: 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/50', activeColor: 'bg-blue-500 text-white' },
    { label: 'Sore', code: 'S', color: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/50', activeColor: 'bg-yellow-500 text-white' },
    { label: 'Malam', code: 'M', codeHex: '#94a3b8', color: 'bg-slate-500/20 text-slate-600 dark:text-slate-400 border-slate-500/50', activeColor: 'bg-slate-500 text-white' },
    { label: 'Libur', code: 'OFF', color: 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/50', activeColor: 'bg-red-500 text-white' }
];

interface ShiftSettings {
    P: { start: string, end: string, active: boolean },
    S: { start: string, end: string, active: boolean },
    M: { start: string, end: string, active: boolean }
}

interface GridItem {
    id: string;
    name: string;
    shifts: Record<string, string>; // dateStr -> shiftCode
    lastShiftCode?: string;
}

const toDateStr = (date: Date | string) => {
    const d = new Date(date);
    if (!isNaN(d.getTime())) {
        const year = d.getUTCFullYear();
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    return String(date).split('T')[0];
};

interface ShiftTemplateProps {
    employees: any[];
    allShifts: any[];
    isLoading?: boolean;
}

export default function ShiftTemplate({ employees: initialEmployees, allShifts: initialShifts, isLoading }: ShiftTemplateProps) {
    const { data: session, isPending: isSessionLoading } = useSession();
    const isAdmin = session?.user?.role?.toUpperCase() === 'ADMIN';
    const currentUser = session?.user;

    // const { createShift, updateShift, deleteShift } = useShifts();
    const { data: allEmployees } = useEmployees();

    // Dates
    const today = new Date();
    const [startDate, setStartDate] = useState(new Date(today.setDate(today.getDate() - today.getDay() + 1)).toISOString().split('T')[0]); // Monday
    const [endDate, setEndDate] = useState(new Date(new Date(startDate).setDate(new Date(startDate).getDate() + 6)).toISOString().split('T')[0]); // Sunday

    // Settings
    const [shiftSettings, setShiftSettings] = useState<ShiftSettings>({
        P: { start: '08:00', end: '16:00', active: true },
        S: { start: '16:00', end: '00:00', active: true },
        M: { start: '00:00', end: '08:00', active: true }
    });

    // Grid Data
    const [gridData, setGridData] = useState<GridItem[]>([]);

    // Selection State (for drag-to-fill)
    const [dragStart, setDragStart] = useState<{ row: number, col: number } | null>(null);
    const [dragEnd, setDragEnd] = useState<{ row: number, col: number } | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState<{ row: number, col: number, x: number, y: number } | null>(null);
    const [pendingDeletions, setPendingDeletions] = useState<string[]>([]);
    const [zoom, setZoom] = useState(1);

    // Columns based on range
    const dates = useMemo(() => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const dayList: string[] = [];
        let current = new Date(start);
        
        while (current <= end) {
            dayList.push(toDateStr(current));
            current.setDate(current.getDate() + 1);
        }
        return dayList;
    }, [startDate, endDate]);

    // 1. Initial Load (Settings & Local Storage)
    useEffect(() => {
        const loadInitial = async () => {
            // Load global settings from DB first
            try {
                const globalSettings = await apiFetch<any[]>('/shifts/settings');
                if (globalSettings && globalSettings.length > 0) {
                    const mappedSettings: ShiftSettings = { ...shiftSettings };
                    globalSettings.forEach(s => {
                        if (mappedSettings[s.code as keyof ShiftSettings]) {
                            mappedSettings[s.code as keyof ShiftSettings] = {
                                start: s.startTime,
                                end: s.endTime,
                                active: s.isActive
                            };
                        }
                    });
                    setShiftSettings(mappedSettings);
                }
            } catch (e) {
                console.error("Failed to load global shift settings", e);
            }

            if (isAdmin) {
                const saved = localStorage.getItem('shift_grid_data');
                if (saved) {
                    try {
                        const parsed = JSON.parse(saved);
                        if (parsed && parsed.grid) setGridData(parsed.grid);
                    } catch (e) {
                        console.error('[ShiftTemplate] Failed to parse cached grid data:', e);
                        localStorage.removeItem('shift_grid_data');
                    }
                }
            }
        };
        
        loadInitial();
    }, [isAdmin]);

    // 2. Load from API (Merge with gridData)
    useEffect(() => {
        if (initialEmployees.length) {
            setGridData(prev => {
                // If it's pure initial load for Karyawan (empty prev)
                const baseGrid = prev.length > 0 ? prev : initialEmployees.map(emp => ({
                    id: emp.id,
                    name: emp.name,
                    shifts: {}
                }));

                return baseGrid.map(row => {
                    const mappedShifts: Record<string, string> = { ...row.shifts };
                    
                    initialShifts.forEach(s => {
                        if (s.userId === row.id) {
                            const d = toDateStr(s.date);
                            let code = 'OFF';
                            
                            // Priority 1: Use the 'note' field if it contains the shift code (e.g. "Shift P")
                            if (s.note && s.note.startsWith('Shift ')) {
                                const extracted = s.note.replace('Shift ', '');
                                if (['P', 'S', 'M', 'OFF'].includes(extracted)) code = extracted;
                            } 
                            
                            // Priority 2: Fallback to time-based matching
                            if (code === 'OFF') {
                                if (s.startTime === shiftSettings.P.start) code = 'P';
                                else if (s.startTime === shiftSettings.S.start) code = 'S';
                                else if (s.startTime === shiftSettings.M.start) code = 'M';
                            }
                            
                            mappedShifts[d] = code;
                        }
                    });

                    return { ...row, shifts: mappedShifts };
                });
            });
        }
    }, [initialEmployees, initialShifts, shiftSettings]);

    // Save to Local Storage
    useEffect(() => {
        if (gridData.length) {
            localStorage.setItem('shift_grid_data', JSON.stringify({ grid: gridData, settings: shiftSettings }));
        }
    }, [gridData, shiftSettings]);


    // Drag-to-fill logic
    const handleMouseDown = (rowIndex: number, colIndex: number) => {
        if (!isAdmin) return;
        setDragStart({ row: rowIndex, col: colIndex });
        setDragEnd({ row: rowIndex, col: colIndex });
        setIsMenuOpen(null);
    };

    const handleMouseEnter = (rowIndex: number, colIndex: number) => {
        if (isAdmin && dragStart) {
            setDragEnd({ row: rowIndex, col: colIndex });
        }
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        if (isAdmin && dragStart && dragEnd) {
            // Open selection menu at mouse position
            setIsMenuOpen({ 
                row: dragStart.row, 
                col: dragStart.col, 
                x: e.clientX, 
                y: e.clientY 
            });
        }
    };

    const applyShift = (code: string) => {
        if (!dragStart || !dragEnd) return;

        const startRow = Math.min(dragStart.row, dragEnd.row);
        const endRow = Math.max(dragStart.row, dragEnd.row);
        const startCol = Math.min(dragStart.col, dragEnd.col);
        const endCol = Math.max(dragStart.col, dragEnd.col);

        const newGrid = [...gridData];
        for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
                newGrid[r].shifts[dates[c]] = code;
            }
        }
        setGridData(newGrid);
        setDragStart(null);
        setDragEnd(null);
        setIsMenuOpen(null);
    };

    // Employee Management
    const addEmployee = (emp: any) => {
        if (gridData.find(g => g.id === emp.id)) return;
        setGridData([...gridData, { id: emp.id, name: emp.name, shifts: {} }]);
    };

    const removeEmployee = (id: string) => {
        setGridData(gridData.filter(g => g.id !== id));
        setPendingDeletions(prev => [...new Set([...prev, id])]);
    };


    // Database Sync
    const handleSave = async () => {
        if (!isAdmin) return;
        
        // Validation: Malam > Pagi
        const errors: string[] = [];
        gridData.forEach(row => {
            dates.forEach((date, i) => {
                const tomorrow = dates[i+1];
                if (tomorrow && row.shifts[date] === 'M' && row.shifts[tomorrow] === 'P') {
                    errors.push(`${row.name}: Shift Malam tidak boleh dilanjut Pagi pada ${date}`);
                }
            });
        });

        if (errors.length > 0) {
            toast.error(errors[0], { duration: 4000 });
            return;
        }

        const loadingToast = toast.loading("Menyimpan jadwal & pengaturan...");
        try {
            const apiItems: any[] = [];
            gridData.forEach(row => {
                Object.entries(row.shifts).forEach(([date, code]) => {
                    if (code === 'OFF') return;
                    const settings = shiftSettings[code as keyof typeof shiftSettings];
                    if (settings) {
                        apiItems.push({
                            userId: row.id,
                            date: date,
                            startTime: settings.start,
                            endTime: settings.end,
                            note: `Shift ${code}`
                        });
                    }
                });
            });

            const userIdsToSync = [...new Set([...gridData.map(g => g.id), ...pendingDeletions])];
            const result = await apiFetch<any>('/shifts/batch', {
                method: 'POST',
                body: JSON.stringify({ 
                    shifts: apiItems,
                    startDate,
                    endDate,
                    userIdsToSync,
                    settings: shiftSettings // Full State Save
                })
            });

            if (result && result.count !== undefined) {
                toast.dismiss(loadingToast);
                toast.success(`Jadwal & Pengaturan disimpan! (${result.count} data)`);
                setPendingDeletions([]);
            } else {
                throw new Error(result?.error || "Gagal menyimpan data.");
            }
        } catch (e: any) {
            console.error('[ShiftTemplate] Save error:', e);
            toast.dismiss(loadingToast);
            toast.error("Gagal simpan: " + e.message);
        }
    };

    const handleExport = async () => {
        const loadingToast = toast.loading("Menyiapkan Dokumen Excel...");
        try {
            const blob = await apiClient.exportSchedule({ gridData, startDate, endDate, dates });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `jadwal-shift-${startDate}-${endDate}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.dismiss(loadingToast);
            toast.success("Ekspor berhasil!");
        } catch (e: any) {
            toast.dismiss(loadingToast);
            toast.error("Gagal ekspor: " + e.message);
        }
    };

    // Real-time Calculations
    const calculations = useMemo(() => {
        return gridData.map(emp => {
            const counts = { P: 0, S: 0, M: 0, totalHours: 0 };
            Object.values(emp.shifts).forEach(code => {
                if (code === 'P') { counts.P++; counts.totalHours += 8; }
                if (code === 'S') { counts.S++; counts.totalHours += 8; }
                if (code === 'M') { counts.M++; counts.totalHours += 8; }
            });
            return counts;
        });
    }, [gridData]);

    const dailyRecap = useMemo(() => {
        return dates.map(date => {
            const recap = { P: 0, S: 0, M: 0 };
            gridData.forEach(emp => {
                const code = emp.shifts[date];
                if (code === 'P') recap.P++;
                if (code === 'S') recap.S++;
                if (code === 'M') recap.M++;
            });
            return recap;
        });
    }, [gridData, dates]);

    const isSelected = (r: number, c: number) => {
        if (!dragStart || !dragEnd) return false;
        const startRow = Math.min(dragStart.row, dragEnd.row);
        const endRow = Math.max(dragStart.row, dragEnd.row);
        const startCol = Math.min(dragStart.col, dragEnd.col);
        const endCol = Math.max(dragStart.col, dragEnd.col);
        return r >= startRow && r <= endRow && c >= startCol && c <= endCol;
    };

    if (isSessionLoading || isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <div className="size-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <p className="text-sm font-black text-primary uppercase tracking-widest animate-pulse">Menyiapkan Jadwal...</p>
            </div>
        );
    }

    const myRowIdx = gridData.findIndex(g => g.id === currentUser?.id);
    const myShifts = myRowIdx !== -1 ? gridData[myRowIdx].shifts : null;

    return (
        <div className="space-y-8 animate-in fade-in duration-1000 pb-32">
            {/* Role / Mode Indicator */}
            <div className="flex justify-end -mt-6 mb-4">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isAdmin ? 'bg-primary text-slate-950' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-white/10'}`}>
                    {isAdmin ? 'Mode: Administrator' : 'Mode: Karyawan'}
                </span>
            </div>

            {/* My Schedule (Karyawan View) */}
            {!isAdmin && myShifts && (
                <div className="space-y-6">
                    <div className="glass p-6 rounded-[2.5rem] border-primary/20 bg-primary/5">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="size-12 rounded-2xl bg-primary flex items-center justify-center text-slate-950 shadow-lg shadow-primary/20">
                                <span className="material-symbols-outlined text-2xl">person_pin</span>
                            </div>
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-widest text-primary">Jadwal Saya</h3>
                                <p className="text-xs font-bold text-gray-500 dark:text-slate-400">Periode Aktif • {startDate} - {endDate}</p>
                            </div>
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                            {dates.map(date => (
                                <div key={date} className={`min-w-[110px] p-5 rounded-2xl border flex flex-col items-center gap-3 transition-all ${myShifts[date] && myShifts[date] !== 'OFF' ? 'bg-primary text-slate-950 border-primary scale-105 shadow-xl shadow-primary/20' : 'bg-gray-100/50 dark:bg-white/5 border-gray-200 dark:border-white/5 opacity-40'}`}>
                                    <p className="text-xs font-black uppercase opacity-60 text-gray-600 dark:text-slate-400">
                                        {new Date(date).toLocaleDateString('id-ID', { weekday: 'short' })}
                                    </p>
                                    <div className="text-xl font-black">{myShifts[date] || 'OFF'}</div>
                                    <p className="text-[10px] font-bold opacity-60">{date.split('-')[2]}/{date.split('-')[1]}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {(['P', 'S', 'M'] as const).map(code => (
                            <div key={code} className={`glass p-5 rounded-3xl border border-white/5 flex items-center gap-4 transition-all ${shiftSettings[code].active ? '' : 'opacity-40 grayscale'}`}>
                                <div className={`size-12 min-w-[3rem] rounded-xl flex items-center justify-center font-black ${code === 'P' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' : code === 'S' ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' : 'bg-slate-500/20 text-slate-600 dark:text-slate-400'}`}>
                                    {code}
                                </div>
                                <div>
                                    <h4 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-slate-100 mb-1">Shift {code === 'P' ? 'Pagi' : code === 'S' ? 'Sore' : 'Malam'}</h4>
                                    <p className="text-xs font-bold text-gray-500 dark:text-slate-400">{shiftSettings[code].start} - {shiftSettings[code].end}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Shift Settings (Admin Only) */}
            {isAdmin && (
                <div className="glass p-8 rounded-[2.5rem] border-white/5 space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="size-12 min-w-[3rem] rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-900 dark:text-slate-100">
                            <span className="material-symbols-outlined text-2xl font-black">settings_accessibility</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-lg font-black uppercase tracking-widest text-gray-900 dark:text-slate-100 leading-tight truncate">Pengaturan Shift</h2>
                            <p className="text-xs font-bold text-gray-500 dark:text-slate-500 uppercase tracking-wider truncate">Jam operasional & status shift</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {(['P', 'S', 'M'] as const).map(code => (
                            <div key={code} className={`p-6 rounded-3xl border transition-all duration-500 ${shiftSettings[code].active ? 'bg-white/[0.03] border-white/10' : 'bg-black/20 border-white/5 opacity-40 grayscale'}`}>
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className={`size-10 rounded-xl flex items-center justify-center font-black ${code === 'P' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' : code === 'S' ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' : 'bg-slate-500/20 text-slate-600 dark:text-slate-400'}`}>
                                            {code}
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-widest text-gray-700 dark:text-slate-200">Shift {code === 'P' ? 'Pagi' : code === 'S' ? 'Sore' : 'Malam'}</span>
                                    </div>
                                    <button 
                                        onClick={() => setShiftSettings(p => ({ ...p, [code]: { ...p[code], active: !p[code].active } }))}
                                        className={`w-12 h-6 rounded-full relative transition-all duration-300 ${shiftSettings[code].active ? 'bg-primary' : 'bg-slate-800'}`}
                                    >
                                        <div className={`absolute top-1 size-4 rounded-full bg-slate-950 transition-all duration-300 ${shiftSettings[code].active ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <p className="text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Masuk</p>
                                        <input type="time" value={shiftSettings[code].start} onChange={e => setShiftSettings(p => ({ ...p, [code]: { ...p[code], start: e.target.value } }))} disabled={!shiftSettings[code].active} className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 dark:text-slate-100 outline-none focus:border-primary transition-all disabled:opacity-30" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Pulang</p>
                                        <input type="time" value={shiftSettings[code].end} onChange={e => setShiftSettings(p => ({ ...p, [code]: { ...p[code], end: e.target.value } }))} disabled={!shiftSettings[code].active} className="w-full bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 dark:text-slate-100 outline-none focus:border-primary transition-all disabled:opacity-30" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Date Range & Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass p-6 rounded-[2rem] border-white/5 flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex-1 w-full space-y-2">
                        <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">Mulai Dari</label>
                        <input type="date" value={startDate} disabled={!isAdmin} onChange={e => setStartDate(e.target.value)} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-5 py-3 text-sm font-bold text-gray-900 dark:text-slate-100 outline-none focus:border-primary transition-all" />
                    </div>
                    <div className="flex-1 w-full space-y-2">
                        <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">Sampai Dengan</label>
                        <input type="date" value={endDate} disabled={!isAdmin} onChange={e => setEndDate(e.target.value)} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-5 py-3 text-sm font-bold text-gray-900 dark:text-slate-100 outline-none focus:border-primary transition-all" />
                    </div>
                </div>
                <div className="flex gap-4 items-stretch">
                    <div className="flex glass rounded-[2rem] border-white/5 p-1">
                        <button 
                            onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                            className="p-3 hover:bg-white/5 rounded-2xl text-primary transition-all"
                            title="Zoom Out"
                        >
                            <span className="material-symbols-outlined">zoom_out</span>
                        </button>
                        <button 
                            onClick={() => setZoom(1)}
                            className="px-4 text-[10px] font-black text-primary uppercase tracking-widest hover:bg-white/5 rounded-2xl transition-all"
                        >
                            {Math.round(zoom * 100)}%
                        </button>
                        <button 
                            onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                            className="p-3 hover:bg-white/5 rounded-2xl text-primary transition-all"
                            title="Zoom In"
                        >
                            <span className="material-symbols-outlined">zoom_in</span>
                        </button>
                    </div>
                    {isAdmin && (
                        <div className="flex-1 glass p-4 rounded-[2rem] border-white/5 flex items-center justify-center">
                            <select 
                                className="w-full bg-transparent text-sm font-black uppercase tracking-widest text-gray-500 dark:text-slate-300 outline-none appearance-none text-center cursor-pointer"
                                onChange={e => {
                                    const emp = allEmployees?.find((u: any) => u.id === e.target.value);
                                    if (emp) addEmployee(emp);
                                    e.target.value = "";
                                }}
                            >
                                <option value="" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">+ Tambah Karyawan</option>
                                {allEmployees?.filter((u: any) => !gridData.some(g => g.id === u.id)).map((u: any) => (
                                    <option key={u.id} value={u.id} className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">{u.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <button onClick={handleExport} className="glass w-20 rounded-[2rem] border-white/5 flex items-center justify-center text-primary hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/20">
                        <span className="material-symbols-outlined text-3xl">download</span>
                    </button>
                </div>
            </div>

            {/* Main Interactive Table */}
            <div className="relative group/table overflow-hidden rounded-[2.5rem] border border-white/5 glass shadow-2xl">
                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
                    <table 
                        className="w-full border-collapse select-none transition-transform duration-300 origin-top-left"
                        style={{ 
                            transform: `scale(${zoom})`,
                            width: `${100 / zoom}%`,
                            marginBottom: zoom > 1 ? `${(zoom - 1) * 100}%` : 0 // Add margin to prevent table from being cut off at bottom when zoomed
                        }}
                    >
                        <thead>
                            <tr className="bg-gray-100/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/5">
                                <th className="p-6 text-left min-w-[200px] border-r border-gray-200 dark:border-white/5">
                                    <span className="text-sm font-black uppercase tracking-[0.3em] text-primary">Karyawan</span>
                                </th>
                                {dates.map(date => (
                                    <th key={date} className="px-4 py-6 min-w-[100px] text-center border-r border-gray-200 dark:border-white/5">
                                        <p className="text-[10px] font-black uppercase text-primary mb-1 tracking-widest">
                                            {new Date(date).toLocaleDateString('id-ID', { weekday: 'short' })}
                                        </p>
                                        <p className="text-sm font-black text-gray-900 dark:text-slate-100 leading-none">{date.split('-')[2]}/{date.split('-')[1]}</p>
                                    </th>
                                ))}
                                <th colSpan={3} className="px-4 py-6 min-w-[140px] text-center border-r border-gray-200 dark:border-white/5 text-xs font-black uppercase tracking-widest text-primary">Shift</th>
                                <th className="p-6 text-center min-w-[100px]"><span className="material-symbols-outlined text-primary">timer</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {gridData.map((row, rIdx) => (
                                <tr key={row.id} className={`border-b border-gray-200 dark:border-white/5 transition-all ${row.id === currentUser?.id ? 'bg-primary/5' : ''}`}>
                                    <td className="p-4 border-r border-gray-200 dark:border-white/5">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className={`text-sm font-black uppercase truncate ${row.id === currentUser?.id ? 'text-primary' : 'text-gray-900 dark:text-slate-100'}`}>{row.name}</p>
                                                    {row.id === currentUser?.id && <span className="text-[8px] font-black bg-primary text-slate-950 px-1.5 py-0.5 rounded uppercase">SAYA</span>}
                                                </div>
                                                <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500">ID: {row.id.slice(0, 8)}</p>
                                            </div>
                                            {isAdmin && (
                                                <button onClick={() => removeEmployee(row.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"><span className="material-symbols-outlined text-xl">close</span></button>
                                            )}
                                        </div>
                                    </td>
                                    {dates.map((date, cIdx) => (
                                        <td key={`${row.id}-${date}`} className={`p-1 border-r border-gray-200 dark:border-white/5 relative ${isAdmin ? 'cursor-pointer' : 'cursor-default'} ${isSelected(rIdx, cIdx) ? 'bg-primary/10' : ''}`} onMouseDown={() => handleMouseDown(rIdx, cIdx)} onMouseEnter={() => handleMouseEnter(rIdx, cIdx)} onMouseUp={handleMouseUp}>
                                            <div className={`h-12 w-full rounded-2xl flex items-center justify-center text-sm font-black border transition-all ${SHIFT_TYPES.find(t => t.code === (row.shifts[date] || 'OFF'))?.color} dark:brightness-110`}>
                                                {row.shifts[date] || 'OFF'}
                                            </div>
                                        </td>
                                    ))}
                                    <td className="text-center font-black text-blue-600 dark:text-blue-400 text-xs border-r border-gray-200 dark:border-white/5">{calculations[rIdx].P}</td>
                                    <td className="text-center font-black text-yellow-600 dark:text-yellow-400 text-xs border-r border-gray-200 dark:border-white/5">{calculations[rIdx].S}</td>
                                    <td className="text-center font-black text-gray-500 dark:text-slate-400 text-xs border-r border-gray-200 dark:border-white/5">{calculations[rIdx].M}</td>
                                    <td className="text-center">
                                        <div className="bg-primary/10 text-primary py-1 px-2 rounded-xl font-black text-xs inline-block">{calculations[rIdx].totalHours}H</div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-gray-100/50 dark:bg-slate-900/50 backdrop-blur-xl border-t border-gray-200 dark:border-white/5">
                                <td className="p-6 border-r border-gray-200 dark:border-white/5 font-black uppercase tracking-widest text-[10px] text-gray-500 dark:text-slate-500 text-center">Rekap Harian</td>
                                {dailyRecap.map((day, i) => (
                                    <td key={i} className="p-4 border-r border-gray-200 dark:border-white/5">
                                        <div className="flex flex-col gap-0.5 items-center">
                                            <span className="text-[10px] font-black text-blue-600 dark:text-blue-400">P: {day.P}</span>
                                            <span className="text-[10px] font-black text-yellow-600 dark:text-yellow-400">S: {day.S}</span>
                                            <span className="text-[10px] font-black text-gray-400 dark:text-slate-400">M: {day.M}</span>
                                        </div>
                                    </td>
                                ))}
                                <td colSpan={4}></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Popover Menu */}
                {isAdmin && isMenuOpen && (
                    <div className="fixed z-50 flex gap-4 p-4 glass border border-white/10 rounded-[2rem] shadow-2xl animate-in zoom-in duration-200" style={{ top: isMenuOpen.y - 100, left: isMenuOpen.x - 120 }}>
                        {SHIFT_TYPES.filter(t => t.code === 'OFF' || shiftSettings[t.code as keyof ShiftSettings].active).map(type => (
                            <button key={type.code} onClick={() => applyShift(type.code)} className={`size-16 rounded-2xl flex items-center justify-center text-lg font-black transition-all hover:scale-110 active:scale-90 ${type.activeColor}`}>
                                {type.code}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Floating Save Button */}
            {isAdmin && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-40 w-full max-w-md px-6">
                    <button onClick={handleSave} className="w-full bg-primary text-slate-950 h-16 rounded-[2rem] font-black uppercase tracking-[0.3em] text-sm shadow-2xl shadow-primary/30 flex items-center justify-center gap-4 hover:scale-105 active:scale-95 transition-all">
                        <span className="material-symbols-outlined text-3xl">cloud_sync</span>
                        Simpan State HRIS
                    </button>
                </div>
            )}
        </div>
    );
}
