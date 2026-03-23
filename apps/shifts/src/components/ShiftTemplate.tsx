import React, { useState, useMemo, useEffect } from 'react';
import { apiClient, apiFetch } from '@shared/apiClient';
import { useEmployees } from '@shared/hooks/useEmployees';
import { useSession } from '@shared/authClient';
import { toast } from 'react-hot-toast';

const SHIFT_TYPES = [
    { label: 'Pagi', code: 'P', color: 'bg-blue-500/20 text-blue-400 border-blue-500/50', activeColor: 'bg-blue-500 text-white' },
    { label: 'Sore', code: 'S', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50', activeColor: 'bg-yellow-500 text-white' },
    { label: 'Malam', code: 'M', codeHex: '#94a3b8', color: 'bg-slate-500/20 text-slate-400 border-slate-500/50', activeColor: 'bg-slate-500 text-white' },
    { label: 'Libur', code: 'OFF', color: 'bg-red-500/20 text-red-400 border-red-500/50', activeColor: 'bg-red-500 text-white' }
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
    const [endDate, setEndDate] = useState(new Date(today.setDate(today.getDate() + 6)).toISOString().split('T')[0]); // Sunday

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

    // Columns based on range
    const dates = useMemo(() => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const dayList: string[] = [];
        let current = new Date(start);
        
        while (current <= end) {
            dayList.push(current.toISOString().split('T')[0]);
            current.setDate(current.getDate() + 1);
        }
        return dayList;
    }, [startDate, endDate]);

    // Load from Local Storage or API
    useEffect(() => {
        if (isAdmin) {
            const saved = localStorage.getItem('shift_grid_data');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    setGridData(parsed.grid);
                    setShiftSettings(parsed.settings);
                    return;
                } catch (e) {}
            }
        }

        // Default if no storage
        if (initialEmployees.length) {
            const initialGrid = initialEmployees.map(emp => ({
                id: emp.id,
                name: emp.name,
                shifts: initialShifts.reduce((acc, s) => {
                    if (s.userId === emp.id) {
                        const d = new Date(s.date).toISOString().split('T')[0];
                        let code = 'OFF';
                        
                        // Priority 1: Use the 'note' field if it contains the shift code (e.g. "Shift P")
                        if (s.note && s.note.startsWith('Shift ')) {
                            const extracted = s.note.replace('Shift ', '');
                            if (['P', 'S', 'M', 'OFF'].includes(extracted)) {
                                code = extracted;
                            }
                        } 
                        
                        // Priority 2: Fallback to time-based matching (matching current settings)
                        if (code === 'OFF') {
                            if (s.startTime === shiftSettings.P.start) code = 'P';
                            else if (s.startTime === shiftSettings.S.start) code = 'S';
                            else if (s.startTime === shiftSettings.M.start) code = 'M';
                        }
                        
                        acc[d] = code;
                    }
                    return acc;
                }, {} as Record<string, string>)
            }));
            setGridData(initialGrid);
        }
    }, [initialEmployees, initialShifts, isAdmin, shiftSettings]);

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
                const dateStr = dates[c];
                newGrid[r].shifts[dateStr] = code;
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
    };


    // Database Sync
    const handleSave = async () => {
        if (!isAdmin) return;
        
        const loadingToast = toast.loading("Menyimpan jadwal...");
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

            const result = await apiFetch<any>('/shifts/batch', {
                method: 'POST',
                body: JSON.stringify({ shifts: apiItems })
            });

            if (result.count !== undefined) {
                toast.dismiss(loadingToast);
                toast.success(`Jadwal ditertibkan ke database!`);
            }
        } catch (e: any) {
            toast.dismiss(loadingToast);
            toast.error("Gagal simpan: " + e.message);
        }
    };

    const handleExport = async () => {
        // Logic for Excel export matching UI
        toast.loading("Mengekspor Excel...");
        // Reuse apiClient.exportShiftTemplate or custom logic
        await apiClient.exportShiftTemplate(); 
        toast.dismiss();
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
        <div className="space-y-8 animate-in fade-in duration-1000">
            {/* My Schedule Card (Karyawan Only) */}
            {!isAdmin && myShifts && (
                <div className="glass p-6 rounded-[2rem] border-primary/20 bg-primary/5 animate-in slide-in-from-top-4 duration-700">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="size-12 rounded-2xl bg-primary flex items-center justify-center text-slate-950">
                            <span className="material-symbols-outlined text-2xl">calendar_month</span>
                        </div>
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-primary">Jadwal Saya</h3>
                            <p className="text-xs font-bold text-[var(--text-muted)]">Minggu ini • {startDate} - {endDate}</p>
                        </div>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                        {dates.map(date => (
                            <div key={date} className={`min-w-[100px] p-4 rounded-xl border flex flex-col items-center gap-3 transition-all ${myShifts[date] && myShifts[date] !== 'OFF' ? 'bg-primary/20 border-primary/40 scale-105 shadow-lg shadow-primary/10' : 'bg-white/5 border-white/5 opacity-60'}`}>
                                <p className="text-sm font-black uppercase text-primary leading-tight">
                                    {new Date(date).toLocaleDateString('id-ID', { weekday: 'short' })}
                                </p>
                                <div className={`size-12 rounded-xl flex items-center justify-center text-sm font-black border-2 ${SHIFT_TYPES.find(t => t.code === (myShifts[date] || 'OFF'))?.color}`}>
                                    {myShifts[date] || 'OFF'}
                                </div>
                                <p className="text-sm font-bold text-[var(--text-muted)]">{date.split('-')[2]}/{date.split('-')[1]}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Header Controls (Mobile Optimized) */}
            <div className="flex flex-col gap-4">
                <div className="glass p-6 rounded-[2rem] border-white/5 shadow-2xl space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                             <span className={`text-xs font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border w-fit ${isAdmin ? 'bg-primary/10 text-primary border-primary/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                                {isAdmin ? 'Mode Admin' : 'Mode Karyawan'}
                            </span>
                        </div>
                        <button onClick={handleExport} className="glass p-3 rounded-2xl flex items-center justify-center hover:scale-105 transition-all outline-none min-h-[44px] min-w-[44px]" title="Ekspor Excel">
                            <span className="material-symbols-outlined text-xl">download</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-primary uppercase tracking-widest block">Start Date</label>
                            <input 
                                type="date" 
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-sm font-bold focus:border-primary transition-all outline-none min-h-[48px]"
                                value={startDate}
                                disabled={!isAdmin}
                                onChange={e => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-primary uppercase tracking-widest block">End Date</label>
                            <input 
                                type="date" 
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-sm font-bold focus:border-primary transition-all outline-none min-h-[48px]"
                                value={endDate}
                                disabled={!isAdmin}
                                onChange={e => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>

                </div>
            </div>

            {/* Shift Settings Panel */}
            {isAdmin && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {(['P', 'S', 'M'] as const).map(type => (
                        <div key={type} className={`glass p-6 rounded-[2rem] border-white/5 space-y-4 transition-all duration-500 ${!shiftSettings[type].active ? 'opacity-40 grayscale translate-y-2' : ''}`}>
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className={`size-10 rounded-xl flex items-center justify-center font-black text-sm ${SHIFT_TYPES.find(t => t.code === type)?.color}`}>
                                        {type}
                                    </div>
                                    <h4 className="text-sm font-black uppercase tracking-widest">Shift {type === 'P' ? 'Pagi' : type === 'S' ? 'Sore' : 'Malam'}</h4>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => setShiftSettings({...shiftSettings, [type]: { ...shiftSettings[type], active: !shiftSettings[type].active }})}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${shiftSettings[type].active ? 'bg-primary' : 'bg-white/10'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-slate-900 transition-transform ${shiftSettings[type].active ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                    <button 
                                        onClick={() => setShiftSettings({...shiftSettings, [type]: { ...shiftSettings[type], start: '', end: '' }})}
                                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                        title="Hapus jam kerja"
                                    >
                                        <span className="material-symbols-outlined text-sm">delete_sweep</span>
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <input 
                                    type="time" 
                                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold outline-none disabled:cursor-not-allowed"
                                    value={shiftSettings[type].start}
                                    disabled={!shiftSettings[type].active}
                                    onChange={e => setShiftSettings({...shiftSettings, [type]: {...shiftSettings[type], start: e.target.value}})}
                                />
                                <input 
                                    type="time" 
                                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold outline-none disabled:cursor-not-allowed"
                                    value={shiftSettings[type].end}
                                    disabled={!shiftSettings[type].active}
                                    onChange={e => setShiftSettings({...shiftSettings, [type]: {...shiftSettings[type], end: e.target.value}})}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Employee Search (Mobile Optimized) */}
            {isAdmin && (
                <div className="w-full">
                   <div className="relative group/search">
                        <select 
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-black uppercase tracking-widest outline-none transition-all focus:border-primary pr-12 appearance-none cursor-pointer min-h-[56px]"
                            onChange={(e) => {
                                const emp = allEmployees?.find((u: any) => u.id === e.target.value);
                                if (emp) addEmployee(emp);
                                e.target.value = "";
                            }}
                        >
                            <option value="">+ Tambah Karyawan</option>
                            {allEmployees?.map((u: any) => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </select>
                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-xl pointer-events-none opacity-50 group-focus-within/search:text-primary group-focus-within/search:opacity-100">person_add</span>
                   </div>
                </div>
            )}

            {/* Interactive Table */}
            <div className="relative group/table overflow-hidden rounded-[2.5rem] border border-white/5 glass shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse select-none">
                        <thead className="sticky top-0 z-20">
                            <tr className="bg-slate-900/80 backdrop-blur-xl border-b border-white/5">
                                <th className="p-4 text-left min-w-[150px] border-r border-white/5">
                                    <span className="text-sm font-black uppercase tracking-[0.2em] text-primary">Karyawan</span>
                                </th>
                                {dates.map(date => (
                                    <th key={date} className="px-2 py-4 min-w-[80px] text-center border-r border-white/5">
                                        <div className="space-y-0.5">
                                            <p className="text-sm font-black uppercase text-primary leading-tight">
                                                {new Date(date).toLocaleDateString('id-ID', { weekday: 'short' })}
                                            </p>
                                            <p className="text-sm font-bold text-[var(--text-muted)] leading-tight">{date.split('-')[2]}/{date.split('-')[1]}</p>
                                        </div>
                                    </th>
                                ))}
                                <th colSpan={3} className="px-2 py-4 min-w-[120px] border-r border-white/5">
                                    <span className="text-sm font-black uppercase tracking-[0.2em] text-primary">Total</span>
                                </th>
                                <th className="p-4 text-center min-w-[80px]">
                                    <span className="material-symbols-outlined text-primary text-2xl">timer</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {gridData.map((row, rIdx) => (
                                <tr key={row.id} className={`group/row border-b border-white/5 transition-all duration-500 ${row.id === currentUser?.id ? 'bg-primary/[0.03] ring-1 ring-inset ring-primary/20 relative z-10' : 'hover:bg-white/[0.02]'}`}>
                                    <td className="p-4 border-r border-white/5">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className={`text-sm font-black uppercase tracking-wider transition-colors truncate ${row.id === currentUser?.id ? 'text-primary' : 'text-[var(--text-main)]'}`}>
                                                        {row.name}
                                                    </p>
                                                    {row.id === currentUser?.id && (
                                                        <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest">SAYA</span>
                                                    )}
                                                </div>
                                                <p className="text-sm font-bold text-[var(--text-muted)] truncate opacity-60">ID: {row.id.slice(0, 5)}</p>
                                            </div>
                                            {isAdmin && (
                                                <button onClick={() => removeEmployee(row.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all min-h-[44px] min-w-[44px] flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-xl">close</span>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    {dates.map((date, cIdx) => (
                                        <td 
                                            key={`${row.id}-${date}`}
                                            className={`p-1 border-r border-white/5 relative transition-all duration-300 ${isAdmin ? 'cursor-pointer' : 'cursor-default'} ${isSelected(rIdx, cIdx) ? 'bg-primary/20' : ''}`}
                                            onMouseDown={() => handleMouseDown(rIdx, cIdx)}
                                            onMouseEnter={() => handleMouseEnter(rIdx, cIdx)}
                                            onMouseUp={handleMouseUp}
                                        >
                                            <div className={`h-11 w-full rounded-xl flex items-center justify-center text-sm font-black transition-all border ${SHIFT_TYPES.find(t => t.code === (row.shifts[date] || 'OFF'))?.color || ''}`}>
                                                {row.shifts[date] || 'OFF'}
                                            </div>
                                        </td>
                                    ))}
                                    <td className="p-2 border-r border-white/5 text-center font-black text-blue-400 text-sm">{calculations[rIdx]?.P || 0}</td>
                                    <td className="p-2 border-r border-white/5 text-center font-black text-yellow-400 text-sm">{calculations[rIdx]?.S || 0}</td>
                                    <td className="p-2 border-r border-white/5 text-center font-black text-slate-400 text-sm">{calculations[rIdx]?.M || 0}</td>
                                    <td className="p-2 text-center">
                                        <div className="bg-primary/10 text-primary py-1.5 px-2 rounded-lg font-black text-sm shadow-sm">
                                            {calculations[rIdx]?.totalHours || 0}H
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-slate-900/50 backdrop-blur-xl border-t border-white/5">
                                <td className="p-6 border-r border-white/5">
                                    <span className="text-sm font-black uppercase tracking-widest text-[#94a3b8]">Rekap Karyawan</span>
                                </td>
                                {dailyRecap.map((day, i) => (
                                    <td key={`recap-${i}`} className="p-4 border-r border-white/5">
                                        <div className="flex flex-col gap-1 items-center min-w-[60px]">
                                            <span className="text-blue-400 text-sm font-black">P: {day.P}</span>
                                            <span className="text-yellow-400 text-sm font-black">S: {day.S}</span>
                                            <span className="text-slate-400 text-sm font-black">M: {day.M}</span>
                                        </div>
                                    </td>
                                ))}
                                <td colSpan={4}></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Selection Menu (Popover) */}
                {isAdmin && isMenuOpen && (
                    <div 
                        className="fixed z-50 flex gap-3 p-3 glass border border-white/10 rounded-2xl shadow-2xl animate-in zoom-in duration-200"
                        style={{ top: isMenuOpen.y - 80, left: isMenuOpen.x - 100 }}
                    >
                        {SHIFT_TYPES.filter(t => t.code === 'OFF' || (shiftSettings[t.code as keyof ShiftSettings] && shiftSettings[t.code as keyof ShiftSettings].active)).map(type => (
                            <button 
                                key={type.code}
                                onClick={() => applyShift(type.code)}
                                className={`size-14 rounded-xl flex items-center justify-center font-black text-sm transition-all hover:scale-110 active:scale-90 ${type.activeColor}`}
                            >
                                {type.code}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {isAdmin && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 bg-slate-900/95 backdrop-blur-2xl px-6 py-4 rounded-[2rem] border border-white/10 shadow-2xl animate-in slide-in-from-bottom-8 duration-700 w-[calc(100%-3rem)] max-w-lg">
                    <button 
                        onClick={handleSave} 
                        className="flex-1 flex items-center justify-center gap-3 h-14 rounded-2xl text-sm font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-lg bg-primary text-slate-950 shadow-primary/20"
                    >
                        <span className="material-symbols-outlined text-2xl">save</span>
                        Simpan Jadwal
                    </button>
                </div>
            )}
            
            {/* Added padding at bottom to avoid overlap with floating bar */}
            {isAdmin && <div className="h-32" />}
        </div>
    );
}

