import React, { useState, useMemo, useEffect } from 'react';
import { apiClient, apiFetch } from '@shared/apiClient';
import { useShifts } from '@shared/hooks/useShifts';
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
    const [lastSavedHash, setLastSavedHash] = useState<string>('');
    const hasChanges = useMemo(() => JSON.stringify(gridData) !== lastSavedHash, [gridData, lastSavedHash]);

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
                        if (s.startTime === shiftSettings.P.start) code = 'P';
                        else if (s.startTime === shiftSettings.S.start) code = 'S';
                        else if (s.startTime === shiftSettings.M.start) code = 'M';
                        acc[d] = code;
                    }
                    return acc;
                }, {} as Record<string, string>)
            }));
            setGridData(initialGrid);
        }
    }, [initialEmployees]);

    // Save to Local Storage
    useEffect(() => {
        if (gridData.length) {
            localStorage.setItem('shift_grid_data', JSON.stringify({ grid: gridData, settings: shiftSettings }));
        }
    }, [gridData, shiftSettings]);

    // Validation (Only show if there are unsaved changes)
    const validationErrors = useMemo(() => {
        if (!hasChanges) return []; // Hide errors if already saved
        const errors: string[] = [];
        dates.forEach(date => {
            let pagi = 0;
            let sore = 0;
            let malam = 0;
            let off = 0;
            
            gridData.forEach(emp => {
                const code = emp.shifts[date] || 'OFF';
                if (code === 'P') pagi++;
                else if (code === 'S') sore++;
                else if (code === 'M') malam++;
                else if (code === 'OFF') off++;
            });

            const dayName = new Date(date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });

            // Rule 1: Malam must be > Pagi
            if (malam <= pagi && (pagi > 0 || malam > 0)) {
                errors.push(`[${dayName}] Malam (${malam}) harus lebih banyak dari Pagi (${pagi})`);
            }

            // Rule 2: No OFF Condition (Min 2P, 2M)
            if (off === 0 && gridData.length >= 4) {
                if (pagi < 2 || malam < 2) {
                    errors.push(`[${dayName}] Tanpa OFF: Minimal 2 Pagi & 2 Malam (Saat ini P:${pagi}, M:${malam})`);
                }
            }
        });
        return errors;
    }, [gridData, dates]);

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

    const balanceSchedules = (manual = true) => {
        const newGrid = [...gridData];
        const activeCodes = (['P', 'S', 'M'] as const).filter(code => shiftSettings[code].active);
        
        if (activeCodes.length === 0) return;

        dates.forEach((date) => {
            let pagi: number[] = [];
            let sore: number[] = [];
            let malam: number[] = [];
            let offCount = 0;

            newGrid.forEach((emp, i) => {
                const code = emp.shifts[date] || 'OFF';
                // Validate if current assigned code is still active. If not, reset to OFF
                if (code !== 'OFF' && !shiftSettings[code as keyof ShiftSettings].active) {
                    emp.shifts[date] = 'OFF';
                    offCount++;
                } else if (code === 'P') pagi.push(i);
                else if (code === 'S') sore.push(i);
                else if (code === 'M') malam.push(i);
                else offCount++;
            });

            // 1. Priority Malam > Pagi (Only if Malam is active)
            if (shiftSettings.M.active) {
                while (malam.length <= pagi.length && (sore.length > 0 || pagi.length > 0)) {
                    if (sore.length > 0) {
                        const idx = sore.pop()!;
                        newGrid[idx].shifts[date] = 'M';
                        malam.push(idx);
                    } else if (pagi.length > 1) { 
                        const idx = pagi.pop()!;
                        newGrid[idx].shifts[date] = 'M';
                        malam.push(idx);
                    } else break;
                }
            }

            // 2. No OFF Condition (Min 2P, 2M) - Only if both P and M are active
            if (offCount === 0 && newGrid.length >= 4 && shiftSettings.P.active && shiftSettings.M.active) {
                while (pagi.length < 2 && sore.length > 0) {
                    const idx = sore.pop()!;
                    newGrid[idx].shifts[date] = 'P';
                    pagi.push(idx);
                }
                while (pagi.length < 2 && (malam.length > pagi.length + 1)) {
                    const idx = malam.pop()!;
                    newGrid[idx].shifts[date] = 'P';
                    pagi.push(idx);
                }
            }
        });
        setGridData(newGrid);
        if (manual) toast.success("Jadwal diseimbangkan (berdasarkan shift aktif)!");
    };

    // Advanced Weekly Rotation
    const autoGenerate = (isManual = true) => {
        const newGrid = [...gridData];
        const activeCodes = (['P', 'S', 'M'] as const).filter(code => shiftSettings[code].active);
        
        if (activeCodes.length === 0) {
            toast.error("Aktifkan setidaknya satu shift untuk rotasi!");
            return;
        }

        newGrid.forEach((emp, i) => {
            let currentIdx = activeCodes.indexOf(emp.lastShiftCode as any);
            if (currentIdx === -1) currentIdx = i % activeCodes.length;
            else currentIdx = (currentIdx + 1) % activeCodes.length;

            const targetCode = activeCodes[currentIdx];
            // Constraint: Malam -> Pagi not allowed, shift to next active code (usually Sore)
            let finalCode: string = targetCode;
            if (targetCode === 'P' && emp.lastShiftCode === 'M') {
                finalCode = activeCodes.find(c => c !== 'P' && c !== 'M') || 'OFF';
            }
            const offDayIndex = i % 7; 

            dates.forEach((date, j) => {
                if (j === offDayIndex) emp.shifts[date] = 'OFF';
                else emp.shifts[date] = finalCode;
            });
            emp.lastShiftCode = finalCode;
        });

        setGridData(newGrid);
        // Trigger balancing after generation
        setTimeout(() => balanceSchedules(false), 50);
        if (isManual) toast.success("Jadwal mingguan otomatis dibuat!");
    };

    const generateNextWeek = () => {
        const currentEnd = new Date(endDate);
        const nextStart = new Date(currentEnd);
        nextStart.setDate(nextStart.getDate() + 1);
        const nextEnd = new Date(nextStart);
        nextEnd.setDate(nextEnd.getDate() + 6);

        setStartDate(nextStart.toISOString().split('T')[0]);
        setEndDate(nextEnd.toISOString().split('T')[0]);
        
        // Wait for dates to update in useMemo then run autoGenerate?
        // Better: trigger a flag or use useEffect
        setTimeout(() => autoGenerate(false), 50); 
        toast.loading("Menyiapkan minggu berikutnya...", { duration: 1000 });
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
                setLastSavedHash(JSON.stringify(gridData));
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
            {/* Validation Warnings */}
            {isAdmin && validationErrors.length > 0 && (
                <div className="glass p-6 rounded-[2rem] border-red-500/20 bg-red-500/5 animate-in slide-in-from-top-4 duration-700">
                    <div className="flex items-center gap-4 text-red-500 mb-4">
                        <div className="size-12 rounded-2xl bg-red-500/20 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-2xl">warning</span>
                        </div>
                        <h4 className="text-sm font-black uppercase tracking-[0.2em]">Peringatan Validasi</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {validationErrors.map((err, i) => (
                            <div key={i} className="flex items-center gap-3 text-sm font-bold text-red-400/80 bg-red-500/5 p-4 rounded-xl border border-red-500/10">
                                <span className="size-2 rounded-full bg-red-500 shrink-0" />
                                {err}
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

                    {isAdmin && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <button 
                                onClick={() => autoGenerate()}
                                className="glass py-4 px-4 rounded-2xl text-sm font-black text-primary uppercase tracking-widest hover:bg-white/5 flex flex-col items-center justify-center gap-2 min-h-[72px]"
                            >
                                <span className="material-symbols-outlined text-2xl">autorenew</span>
                                Auto Rotasi
                            </button>
                            <button 
                                onClick={() => balanceSchedules()}
                                className="bg-white/5 border border-white/10 py-4 px-4 rounded-2xl text-sm font-black text-primary uppercase tracking-widest hover:border-primary flex flex-col items-center justify-center gap-2 transition-all min-h-[72px]"
                            >
                                <span className="material-symbols-outlined text-2xl">balance</span>
                                Balance Jadwal
                            </button>
                            <button 
                                onClick={generateNextWeek}
                                className="bg-white/5 border border-white/10 py-4 px-4 rounded-2xl text-sm font-black text-[#94a3b8] uppercase tracking-widest hover:border-primary/50 flex flex-col items-center justify-center gap-2 transition-all min-h-[72px]"
                            >
                                <span className="material-symbols-outlined text-2xl">event_repeat</span>
                                Lanjut Minggu
                            </button>
                        </div>
                    )}
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

            {/* Thumb-friendly Bottom Navigation for Admins */}
            {isAdmin && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 bg-slate-900/95 backdrop-blur-2xl px-6 py-4 rounded-[2rem] border border-white/10 shadow-2xl animate-in slide-in-from-bottom-8 duration-700 w-[calc(100%-3rem)] max-w-lg">
                    <button 
                        onClick={handleSave} 
                        className={`flex-1 flex items-center justify-center gap-3 h-14 rounded-2xl text-sm font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-lg ${validationErrors.length > 0 ? 'bg-orange-500 text-slate-950 shadow-orange-500/20' : 'bg-primary text-slate-950 shadow-primary/20'}`}
                    >
                        <span className="material-symbols-outlined text-2xl">
                            {validationErrors.length > 0 ? 'warning' : 'save'}
                        </span>
                        {validationErrors.length > 0 ? 'Simpan Tetap' : 'Simpan Jadwal'}
                    </button>
                    {validationErrors.length > 0 && (
                        <div className="size-14 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center animate-pulse shrink-0">
                            <span className="material-symbols-outlined text-2xl">error_outline</span>
                        </div>
                    )}
                </div>
            )}
            
            {/* Added padding at bottom to avoid overlap with floating bar */}
            {isAdmin && <div className="h-32" />}
        </div>
    );
}

