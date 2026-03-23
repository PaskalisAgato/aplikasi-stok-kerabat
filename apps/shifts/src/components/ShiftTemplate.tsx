import React, { useState, useMemo, useEffect, useRef } from 'react';
import { apiClient } from '@shared/apiClient';
import { useShifts } from '@shared/hooks/useShifts';
import { useEmployees } from '@shared/hooks/useEmployees';
import { toast } from 'react-hot-toast';

const SHIFT_TYPES = [
    { label: 'Pagi', code: 'P', color: 'bg-blue-500/20 text-blue-400 border-blue-500/50', activeColor: 'bg-blue-500 text-white' },
    { label: 'Sore', code: 'S', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50', activeColor: 'bg-yellow-500 text-white' },
    { label: 'Malam', code: 'M', codeHex: '#94a3b8', color: 'bg-slate-500/20 text-slate-400 border-slate-500/50', activeColor: 'bg-slate-500 text-white' },
    { label: 'Libur', code: 'OFF', color: 'bg-red-500/20 text-red-400 border-red-500/50', activeColor: 'bg-red-500 text-white' }
];

interface ShiftSettings {
    P: { start: string, end: string },
    S: { start: string, end: string },
    M: { start: string, end: string }
}

interface GridItem {
    id: string;
    name: string;
    shifts: Record<string, string>; // dateStr -> shiftCode
}

interface ShiftTemplateProps {
    employees: any[];
    allShifts: any[];
    isLoading?: boolean;
}

export default function ShiftTemplate({ employees: initialEmployees, allShifts: initialShifts, isLoading }: ShiftTemplateProps) {
    const { createShift, updateShift, deleteShift } = useShifts();
    const { data: allEmployees } = useEmployees();

    // Dates
    const today = new Date();
    const [startDate, setStartDate] = useState(new Date(today.setDate(today.getDate() - today.getDay() + 1)).toISOString().split('T')[0]); // Monday
    const [endDate, setEndDate] = useState(new Date(today.setDate(today.getDate() + 6)).toISOString().split('T')[0]); // Sunday

    // Settings
    const [shiftSettings, setShiftSettings] = useState<ShiftSettings>({
        P: { start: '08:00', end: '16:00' },
        S: { start: '16:00', end: '00:00' },
        M: { start: '00:00', end: '08:00' }
    });

    // Grid Data
    const [gridData, setGridData] = useState<GridItem[]>([]);
    const [selectedEmployees, setSelectedEmployees] = useState<any[]>([]);

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
        const saved = localStorage.getItem('shift_grid_data');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setGridData(parsed.grid);
                setShiftSettings(parsed.settings);
                return;
            } catch (e) {}
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

    // Drag-to-fill logic
    const handleMouseDown = (rowIndex: number, colIndex: number) => {
        setDragStart({ row: rowIndex, col: colIndex });
        setDragEnd({ row: rowIndex, col: colIndex });
        setIsMenuOpen(null);
    };

    const handleMouseEnter = (rowIndex: number, colIndex: number) => {
        if (dragStart) {
            setDragEnd({ row: rowIndex, col: colIndex });
        }
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        if (dragStart && dragEnd) {
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

    // Auto Rotation Utility
    const autoGenerate = () => {
        const newGrid = [...gridData];
        const codes = ['P', 'S', 'M', 'OFF'];
        
        newGrid.forEach((emp, i) => {
            dates.forEach((date, j) => {
                // simple round robin based on index and day
                const idx = (i + j) % codes.length;
                emp.shifts[date] = codes[idx];
            });
        });
        setGridData(newGrid);
        toast.success("Jadwal diatur otomatis secara adil!");
    };

    // Database Sync
    const handleSave = async () => {
        try {
            const promises: any[] = [];
            gridData.forEach(emp => {
                Object.entries(emp.shifts).forEach(([date, code]) => {
                    const type = SHIFT_TYPES.find(t => t.code === code);
                    const existing = initialShifts.find(s => 
                        s.userId === emp.id && 
                        new Date(s.date).toISOString().split('T')[0] === date
                    );

                    if (type && type.code !== 'OFF') {
                        const settings = shiftSettings[type.code as keyof ShiftSettings];
                        if (!existing) {
                            promises.push(createShift({ userId: emp.id, date, startTime: settings.start, endTime: settings.end }));
                        } else if (existing.startTime !== settings.start) {
                            promises.push(updateShift({ id: existing.id, data: { startTime: settings.start, endTime: settings.end, date } }));
                        }
                    } else if (code === 'OFF' && existing) {
                        promises.push(deleteShift(existing.id));
                    }
                });
            });

            if (!promises.length) return toast.error("Tidak ada perubahan.");
            await Promise.all(promises);
            toast.success("Berhasil disimpan ke database!");
        } catch (e: any) {
            toast.error(e.message || "Gagal menyimpan.");
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

    return (
        <div className="space-y-8 animate-in fade-in duration-1000">
            {/* Header Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 glass p-8 rounded-[2.5rem] border-white/5 shadow-2xl">
                <div className="flex flex-wrap items-center gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-primary uppercase tracking-widest block">Start Date</label>
                        <input 
                            type="date" 
                            className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm font-bold focus:border-primary transition-all outline-none"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-primary uppercase tracking-widest block">End Date</label>
                        <input 
                            type="date" 
                            className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm font-bold focus:border-primary transition-all outline-none"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                        />
                    </div>
                    <div className="h-12 w-px bg-white/10 hidden lg:block" />
                    <button 
                        onClick={autoGenerate}
                        className="glass py-3 px-6 rounded-2xl text-[10px] font-black text-primary uppercase tracking-widest hover:bg-white/5 flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-sm">auto_fix</span>
                        Auto Rotasi
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <button onClick={handleExport} className="glass py-4 px-8 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:scale-105 transition-all active:scale-95">
                        Ekspor Excel
                    </button>
                    <button onClick={handleSave} className="bg-primary text-slate-950 py-4 px-10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-105 transition-all active:scale-95">
                        Simpan Jadwal
                    </button>
                </div>
            </div>

            {/* Shift Settings Panel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(['P', 'S', 'M'] as const).map(type => (
                    <div key={type} className="glass p-6 rounded-[2rem] border-white/5 space-y-4">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className={`size-10 rounded-xl flex items-center justify-center font-black text-sm ${SHIFT_TYPES.find(t => t.code === type)?.color}`}>
                                    {type}
                                </div>
                                <h4 className="text-xs font-black uppercase tracking-widest">Shift {type === 'P' ? 'Pagi' : type === 'S' ? 'Sore' : 'Malam'}</h4>
                            </div>
                            <button 
                                onClick={() => setShiftSettings({...shiftSettings, [type]: { start: '', end: '' }})}
                                className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                title="Hapus jam kerja"
                            >
                                <span className="material-symbols-outlined text-sm">delete_sweep</span>
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <input 
                                type="time" 
                                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                                value={shiftSettings[type].start}
                                onChange={e => setShiftSettings({...shiftSettings, [type]: {...shiftSettings[type], start: e.target.value}})}
                            />
                            <input 
                                type="time" 
                                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                                value={shiftSettings[type].end}
                                onChange={e => setShiftSettings({...shiftSettings, [type]: {...shiftSettings[type], end: e.target.value}})}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Employee Search */}
            <div className="flex justify-end pr-4">
               <div className="relative group/search">
                    <select 
                        className="bg-white/5 border border-white/10 rounded-2xl px-6 py-3 text-[10px] font-black uppercase tracking-widest outline-none transition-all focus:border-primary pr-12 appearance-none cursor-pointer"
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
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-sm pointer-events-none opacity-50 group-focus-within/search:text-primary group-focus-within/search:opacity-100">person_add</span>
               </div>
            </div>

            {/* Interactive Table */}
            <div className="relative group/table overflow-hidden rounded-[2.5rem] border border-white/5 glass shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse select-none">
                        <thead className="sticky top-0 z-20">
                            <tr className="bg-slate-900/80 backdrop-blur-xl border-b border-white/5">
                                <th className="p-6 text-left min-w-[200px] border-r border-white/5">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Karyawan</span>
                                </th>
                                {dates.map(date => (
                                    <th key={date} className="px-4 py-6 min-w-[100px] text-center border-r border-white/5">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase text-primary">
                                                {new Date(date).toLocaleDateString('id-ID', { weekday: 'short' })}
                                            </p>
                                            <p className="text-[9px] font-bold text-[var(--text-muted)]">{date.split('-')[2]}/{date.split('-')[1]}</p>
                                        </div>
                                    </th>
                                ))}
                                <th colSpan={3} className="px-4 py-6 border-r border-white/5">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Shift (Minggu)</span>
                                </th>
                                <th className="p-6 text-center">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Total Jam</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {gridData.map((row, rIdx) => (
                                <tr key={row.id} className="group/row hover:bg-white/[0.02] border-b border-white/5 transition-colors">
                                    <td className="p-6 border-r border-white/5">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-wider text-[var(--text-main)] group-hover/row:text-primary transition-colors">{row.name}</p>
                                                <p className="text-[9px] font-bold text-[var(--text-muted)] italic">User ID: #{row.id.slice(0, 8)}</p>
                                            </div>
                                            <button onClick={() => removeEmployee(row.id)} className="opacity-0 group-hover/row:opacity-100 p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all">
                                                <span className="material-symbols-outlined text-sm">remove_circle</span>
                                            </button>
                                        </div>
                                    </td>
                                    {dates.map((date, cIdx) => (
                                        <td 
                                            key={`${row.id}-${date}`}
                                            className={`p-1 border-r border-white/5 cursor-pointer relative transition-all duration-300 ${isSelected(rIdx, cIdx) ? 'bg-primary/20 scale-[0.98]' : ''}`}
                                            onMouseDown={() => handleMouseDown(rIdx, cIdx)}
                                            onMouseEnter={() => handleMouseEnter(rIdx, cIdx)}
                                            onMouseUp={handleMouseUp}
                                        >
                                            <div className={`h-12 w-full rounded-xl flex items-center justify-center text-[10px] font-black transition-all border ${SHIFT_TYPES.find(t => t.code === (row.shifts[date] || 'OFF'))?.color || ''}`}>
                                                {row.shifts[date] || 'OFF'}
                                            </div>
                                        </td>
                                    ))}
                                    <td className="p-4 border-r border-white/5 text-center font-bold text-blue-400 text-xs">{calculations[rIdx]?.P || 0}</td>
                                    <td className="p-4 border-r border-white/5 text-center font-bold text-yellow-400 text-xs">{calculations[rIdx]?.S || 0}</td>
                                    <td className="p-4 border-r border-white/5 text-center font-bold text-slate-400 text-xs">{calculations[rIdx]?.M || 0}</td>
                                    <td className="p-4 text-center">
                                        <div className="bg-primary/10 text-primary py-2 px-3 rounded-xl font-black text-[10px] inline-block shadow-lg shadow-primary/5">
                                            {calculations[rIdx]?.totalHours || 0}H
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-slate-900/50 backdrop-blur-xl border-t border-white/5">
                                <td className="p-6 border-r border-white/5">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#94a3b8]">Rekap Karyawan</span>
                                </td>
                                {dailyRecap.map((day, i) => (
                                    <td key={`recap-${i}`} className="p-4 border-r border-white/5">
                                        <div className="flex flex-col gap-1 items-center">
                                            <span className="text-blue-400 text-[10px] font-black">P: {day.P}</span>
                                            <span className="text-yellow-400 text-[10px] font-black">S: {day.S}</span>
                                            <span className="text-slate-400 text-[10px] font-black">M: {day.M}</span>
                                        </div>
                                    </td>
                                ))}
                                <td colSpan={4}></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Selection Menu (Popover) */}
                {isMenuOpen && (
                    <div 
                        className="fixed z-50 flex gap-2 p-2 glass border border-white/10 rounded-2xl shadow-2xl animate-in zoom-in duration-200"
                        style={{ top: isMenuOpen.y - 60, left: isMenuOpen.x - 100 }}
                    >
                        {SHIFT_TYPES.map(type => (
                            <button 
                                key={type.code}
                                onClick={() => applyShift(type.code)}
                                className={`size-12 rounded-xl flex items-center justify-center font-black text-xs transition-all hover:scale-110 active:scale-90 ${type.activeColor}`}
                            >
                                {type.code}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

