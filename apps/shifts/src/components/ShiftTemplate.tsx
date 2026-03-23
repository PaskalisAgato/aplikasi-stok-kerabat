import React, { useState, useMemo } from 'react';
import { apiClient } from '@shared/apiClient';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const SHIFT_TYPES = [
    { label: 'Shift Pagi', code: 'P', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { label: 'Shift Sore', code: 'S', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    { label: 'Shift Malam', code: 'M', color: 'bg-slate-200 text-slate-800 border-slate-300' },
    { label: 'Libur', code: 'OFF', color: 'bg-red-600 text-white border-red-700 font-bold' }
];

const INITIAL_DATA = [
    { name: 'A', shifts: ['P', 'OFF', 'S', 'OFF', 'M', 'S', 'M'] },
    { name: 'B', shifts: ['S', 'OFF', 'P', 'S', 'OFF', 'M', 'P'] },
    { name: 'C', shifts: ['M', 'OFF', 'OFF', 'M', 'P', 'P', 'S'] },
    { name: 'D', shifts: ['OFF', 'P', 'M', 'P', 'OFF', 'S', 'M'] },
    { name: 'E', shifts: ['OFF', 'S', 'P', 'OFF', 'S', 'M', 'P'] }
];

export default function ShiftTemplate() {
    const [data, setData] = useState(INITIAL_DATA);
    const [isExporting, setIsExporting] = useState(false);

    const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
        const newData = [...data];
        newData[rowIndex].shifts[colIndex] = value.toUpperCase();
        setData(newData);
    };

    const calculations = useMemo(() => {
        return data.map(emp => {
            const p = emp.shifts.filter(s => s === 'P').length;
            const s = emp.shifts.filter(s => s === 'S').length;
            const m = emp.shifts.filter(s => s === 'M').length;
            return { p, s, m, totalHours: (p + s + m) * 8 };
        });
    }, [data]);

    const dailyRecap = useMemo(() => {
        return DAYS.map((_, colIndex) => {
            const p = data.filter(emp => emp.shifts[colIndex] === 'P').length;
            const s = data.filter(emp => emp.shifts[colIndex] === 'S').length;
            const m = data.filter(emp => emp.shifts[colIndex] === 'M').length;
            return { p, s, m };
        });
    }, [data]);

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
            alert('Gagal mengekspor template.');
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
                    <h3 className="text-sm font-black uppercase tracking-widest text-primary">Template Penjadwalan</h3>
                    <p className="text-[10px] text-[var(--text-muted)] uppercase">Edit kode shift (P/S/M/OFF) pada tabel di bawah</p>
                </div>
                <button 
                    onClick={handleExport}
                    disabled={isExporting}
                    className="btn-primary py-2 px-6 text-[10px] flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-sm">{isExporting ? 'sync' : 'download'}</span>
                    {isExporting ? 'MENGEKSPOR...' : 'EKSPOR EXCEL'}
                </button>
            </div>

            <div className="overflow-x-auto rounded-[2rem] border border-white/10 glass shadow-2xl">
                <table className="w-full border-collapse text-[11px]">
                    <thead>
                        <tr>
                            <th rowSpan={2} className="bg-teal-700 text-white p-4 border border-teal-600 font-black uppercase min-w-[120px]">Nama</th>
                            {DAYS.map((day, i) => (
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
                            {DAYS.map((_, i) => (
                                <th key={`date-${i}`} className="bg-teal-600/50 text-white p-2 border border-teal-600 font-black">{i + 1}</th>
                            ))}
                            <th className="bg-teal-600/50 text-white p-2 border border-teal-600 font-black text-[9px]">Pagi</th>
                            <th className="bg-teal-600/50 text-white p-2 border border-teal-600 font-black text-[9px]">Sore</th>
                            <th className="bg-teal-600/50 text-white p-2 border border-teal-600 font-black text-[9px]">Malam</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {data.map((emp, rowIndex) => (
                            <tr key={emp.name} className="hover:bg-white/5 transition-colors">
                                <td className="p-4 border border-white/10 font-black text-[var(--text-main)] bg-white/5">{emp.name}</td>
                                {emp.shifts.map((shift, colIndex) => (
                                    <td key={`${emp.name}-${colIndex}`} className="p-1 border border-white/10">
                                        <input 
                                            type="text" 
                                            className={`w-full h-10 text-center uppercase font-black transition-all border rounded-lg outline-none focus:ring-2 focus:ring-primary/50 ${getShiftStyle(shift)}`}
                                            value={shift}
                                            onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                                        />
                                    </td>
                                ))}
                                {/* Calculations */}
                                <td className="p-2 border border-white/10 text-center font-bold text-primary">{calculations[rowIndex].p}</td>
                                <td className="p-2 border border-white/10 text-center font-bold text-yellow-500">{calculations[rowIndex].s}</td>
                                <td className="p-2 border border-white/10 text-center font-bold text-slate-400">{calculations[rowIndex].m}</td>
                                <td className="p-2 border border-white/10 text-center font-black bg-primary/5 text-primary text-xs">{calculations[rowIndex].totalHours}</td>
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

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {SHIFT_TYPES.map(type => (
                    <div key={type.code} className="flex items-center gap-3 glass p-4 rounded-2xl border-white/5">
                        <div className={`size-8 rounded-lg flex items-center justify-center font-black text-xs ${type.color}`}>{type.code}</div>
                        <div className="space-y-0.5">
                            <p className="text-[10px] font-black uppercase tracking-tighter text-[var(--text-main)]">{type.label}</p>
                            <p className="text-[9px] text-[var(--text-muted)] font-bold">8 Jam Kerja</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
