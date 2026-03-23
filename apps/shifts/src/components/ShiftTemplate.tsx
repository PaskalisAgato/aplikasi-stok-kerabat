import React, { useState, useMemo, useEffect } from 'react';
import { apiClient } from '@shared/apiClient';
import { useShifts } from '@shared/hooks/useShifts';
import { toast } from 'react-hot-toast';

const DAYS_NAME = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const SHIFT_TYPES = [
    { label: 'Shift Pagi', code: 'P', color: 'bg-blue-100 text-blue-800 border-blue-200', start: '08:00', end: '16:00' },
    { label: 'Shift Sore', code: 'S', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', start: '16:00', end: '00:00' },
    { label: 'Shift Malam', code: 'M', color: 'bg-slate-200 text-slate-800 border-slate-300', start: '00:00', end: '08:00' },
    { label: 'Libur', code: 'OFF', color: 'bg-red-600 text-white border-red-700 font-bold', start: '', end: '' }
];

interface ShiftTemplateProps {
    employees: any[];
    allShifts: any[];
}

export default function ShiftTemplate({ employees, allShifts }: ShiftTemplateProps) {
    const { createShift, updateShift, deleteShift } = useShifts();
    const [isExporting, setIsExporting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Get current week dates (Monday to Sunday)
    const weekDates = useMemo(() => {
        const today = new Date();
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(today.setDate(diff));
        
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            return d.toISOString().split('T')[0];
        });
    }, []);

    // Local state for the grid
    const [gridData, setGridData] = useState<any[]>([]);

    // Initialize/Sync grid data from props
    useEffect(() => {
        if (!employees.length) return;

        const initialGrid = employees.map(emp => {
            const shifts = weekDates.map(dateStr => {
                const shift = allShifts.find(s => 
                    s.userId === emp.id && 
                    new Date(s.date).toISOString().split('T')[0] === dateStr
                );
                
                if (!shift) return 'OFF';
                if (shift.startTime === '08:00') return 'P';
                if (shift.startTime === '16:00') return 'S';
                if (shift.startTime === '00:00') return 'M';
                return 'P'; // Default if unknown
            });
            return { id: emp.id, name: emp.name, shifts };
        });
        setGridData(initialGrid);
    }, [employees, allShifts, weekDates]);

    const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
        const newData = [...gridData];
        const val = value.toUpperCase();
        if (['P', 'S', 'M', 'OFF'].includes(val) || val === '') {
            newData[rowIndex].shifts[colIndex] = val;
            setGridData(newData);
        }
    };

    const calculations = useMemo(() => {
        return gridData.map(emp => {
            const p = emp.shifts.filter((s: string) => s === 'P').length;
            const s = emp.shifts.filter((s: string) => s === 'S').length;
            const m = emp.shifts.filter((s: string) => s === 'M').length;
            return { p, s, m, totalHours: (p + s + m) * 8 };
        });
    }, [gridData]);

    const dailyRecap = useMemo(() => {
        return weekDates.map((_, colIndex) => {
            const p = gridData.filter(emp => emp.shifts[colIndex] === 'P').length;
            const s = gridData.filter(emp => emp.shifts[colIndex] === 'S').length;
            const m = gridData.filter(emp => emp.shifts[colIndex] === 'M').length;
            return { p, s, m };
        });
    }, [gridData, weekDates]);

    const handleSave = async () => {
        try {
            setIsSaving(true);
            const promises: any[] = [];

            gridData.forEach((emp) => {
                emp.shifts.forEach((code: string, colIndex: number) => {
                    const date = weekDates[colIndex];
                    const type = SHIFT_TYPES.find(t => t.code === code);
                    
                    const existing = allShifts.find(s => 
                        s.userId === emp.id && 
                        new Date(s.date).toISOString().split('T')[0] === date
                    );

                    if (type && type.code !== 'OFF') {
                        if (!existing) {
                            // CREATE
                            promises.push(createShift({
                                userId: emp.id,
                                date: date,
                                startTime: type.start,
                                endTime: type.end
                            }));
                        } else if (existing.startTime !== type.start) {
                            // UPDATE
                            promises.push(updateShift({
                                id: existing.id,
                                data: {
                                    startTime: type.start,
                                    endTime: type.end,
                                    date: date
                                }
                            }));
                        }
                    } else if (code === 'OFF' && existing) {
                        // DELETE
                        promises.push(deleteShift(existing.id));
                    }
                });
            });

            if (promises.length === 0) {
                toast.error('Tidak ada perubahan untuk disimpan.');
                return;
            }

            await Promise.all(promises);
            toast.success('Jadwal berhasil diperbarui!');
        } catch (error: any) {
            toast.error(error.message || 'Gagal menyimpan jadwal.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleExport = async () => {
        try {
            setIsExporting(true);
            const blob = await apiClient.exportShiftTemplate();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Template_Shift_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export failed', error);
            toast.error('Gagal mengekspor template.');
        } finally {
            setIsExporting(false);
        }
    };

    const getShiftStyle = (code: string) => {
        const type = SHIFT_TYPES.find(t => t.code === code);
        return type ? type.color : 'bg-white text-slate-400';
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
                <div className="space-y-1">
                    <h3 className="text-sm font-black uppercase tracking-widest text-primary">Template Penjadwalan Mingguan</h3>
                    <p className="text-[10px] text-[var(--text-muted)] uppercase italic">Minggu: {weekDates[0]} s/d {weekDates[6]}</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="btn-primary py-2 px-6 text-[10px] flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 border-none shadow-emerald-500/20"
                    >
                        <span className="material-symbols-outlined text-sm">{isSaving ? 'sync' : 'save'}</span>
                        {isSaving ? 'MENYIMPAN...' : 'SIMPAN JADWAL'}
                    </button>
                    <button 
                        onClick={handleExport}
                        disabled={isExporting}
                        className="glass py-2 px-6 text-[10px] flex items-center gap-2 rounded-xl text-primary font-black uppercase tracking-widest hover:bg-white/5 transition-all"
                    >
                        <span className="material-symbols-outlined text-sm">{isExporting ? 'sync' : 'download'}</span>
                        {isExporting ? 'MENGEKSPOR...' : 'EKSPOR EXCEL'}
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto rounded-[2rem] border border-white/10 glass shadow-2xl">
                <table className="w-full border-collapse text-[11px]">
                    <thead>
                        <tr>
                            <th rowSpan={2} className="bg-teal-700 text-white p-4 border border-teal-600 font-black uppercase min-w-[120px]">Nama</th>
                            {DAYS_NAME.map((day, i) => (
                                <th key={day} className="bg-teal-700 text-white p-2 border border-teal-600 font-black uppercase min-w-[80px]">
                                    {day}
                                </th>
                            ))}
                            <th colSpan={3} className="bg-teal-700 text-white p-2 border border-teal-600 font-black uppercase text-center">
                                Jumlah Shift (Minggu)
                            </th>
                            <th rowSpan={2} className="bg-teal-700 text-white p-4 border border-teal-600 font-black uppercase min-w-[100px]">Total Jam</th>
                        </tr>
                        <tr>
                            {weekDates.map((date, i) => (
                                <th key={`date-${i}`} className="bg-teal-600/50 text-white p-2 border border-teal-600 font-black">{date.split('-')[2]}</th>
                            ))}
                            <th className="bg-teal-600/50 text-white p-2 border border-teal-600 font-black text-[9px]">Pagi</th>
                            <th className="bg-teal-600/50 text-white p-2 border border-teal-600 font-black text-[9px]">Sore</th>
                            <th className="bg-teal-600/50 text-white p-2 border border-teal-600 font-black text-[9px]">Malam</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {gridData.map((emp, rowIndex) => (
                            <tr key={emp.id} className="hover:bg-white/5 transition-colors">
                                <td className="p-4 border border-white/10 font-black text-[var(--text-main)] bg-white/5 truncate max-w-[150px]">{emp.name}</td>
                                {emp.shifts.map((shift: string, colIndex: number) => (
                                    <td key={`${emp.id}-${colIndex}`} className="p-1 border border-white/10">
                                        <input 
                                            type="text" 
                                            className={`w-full h-10 text-center uppercase font-black transition-all border rounded-lg outline-none focus:ring-2 focus:ring-primary/50 ${getShiftStyle(shift)}`}
                                            value={shift}
                                            onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                                            maxLength={3}
                                            placeholder="OFF"
                                        />
                                    </td>
                                ))}
                                {/* Calculations */}
                                <td className="p-2 border border-white/10 text-center font-bold text-primary">{calculations[rowIndex]?.p || 0}</td>
                                <td className="p-2 border border-white/10 text-center font-bold text-yellow-500">{calculations[rowIndex]?.s || 0}</td>
                                <td className="p-2 border border-white/10 text-center font-bold text-slate-400">{calculations[rowIndex]?.m || 0}</td>
                                <td className="p-2 border border-white/10 text-center font-black bg-primary/5 text-primary text-xs">{calculations[rowIndex]?.totalHours || 0}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colSpan={8} className="bg-teal-700 text-white p-3 font-black uppercase tracking-wider pl-4">Jumlah Karyawan / Shift (Hari)</td>
                            <td colSpan={5} className="bg-slate-900 border-none"></td>
                        </tr>
                        {SHIFT_TYPES.slice(0, 3).map((type, i) => (
                            <tr key={type.label}>
                                <td className="p-3 border border-white/10 bg-teal-600/30 font-bold text-white uppercase text-[10px]">{type.label}</td>
                                {dailyRecap.map((recap, colIndex) => (
                                    <td key={`recap-${i}-${colIndex}`} className="p-3 border border-white/10 text-center font-black text-white bg-slate-800/50">
                                        {i === 0 ? recap.p : i === 1 ? recap.s : recap.m}
                                    </td>
                                ))}
                                <td colSpan={5} className="border-none bg-transparent"></td>
                            </tr>
                        ))}
                    </tfoot>
                </table>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {SHIFT_TYPES.map(type => (
                    <div key={type.code} className="flex items-center gap-3 glass p-4 rounded-2xl border-white/5">
                        <div className={`size-8 rounded-lg flex items-center justify-center font-black text-xs ${type.color}`}>{type.code}</div>
                        <div className="space-y-0.5">
                            <p className="text-[10px] font-black uppercase tracking-tighter text-[var(--text-main)]">{type.label}</p>
                            <p className="text-[9px] text-[var(--text-muted)] font-bold">{type.start && type.end ? `${type.start} - ${type.end}` : 'Libur'}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
