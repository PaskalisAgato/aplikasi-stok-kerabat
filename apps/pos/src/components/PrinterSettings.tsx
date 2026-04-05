import React, { useState, useEffect } from 'react';
import { PrintService, PrinterConfig } from '@shared/services/PrintService';

interface PrinterSettingsProps {
    isOpen: boolean;
    onClose: () => void;
}

const PrinterSettings: React.FC<PrinterSettingsProps> = ({ isOpen, onClose }) => {
    const [config, setConfig] = useState<PrinterConfig[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const loadSettings = async () => {
            const saved = await PrintService.getSettings();
            setConfig(saved);
        };
        if (isOpen) loadSettings();
    }, [isOpen]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await PrintService.saveSettings(config);
            onClose();
        } catch (error) {
            alert('Gagal menyimpan pengaturan');
        } finally {
            setIsSaving(false);
        }
    };

    const addPrinter = () => {
        setConfig([...config, {
            id: Date.now().toString(),
            name: 'Printer Baru',
            ip: '192.168.1.100',
            port: 9100,
            width: 32,
            categories: [],
            connectionType: 'bridge'
        }]);
    };

    const removePrinter = (id: string) => {
        setConfig(config.filter(p => p.id !== id));
    };

    const updatePrinter = (id: string, updates: Partial<PrinterConfig>) => {
        setConfig(config.map(p => p.id === id ? { ...p, ...updates } : p));
    };

    const testPrint = async (printer: PrinterConfig) => {
        const success = await PrintService.testPrint(printer);
        if (success) {
            const target = printer.connectionType === 'bluetooth' ? (printer.bluetoothDeviceName || 'Bluetooth') : printer.ip;
            alert('Test print berhasil dikirim ke ' + target);
        } else {
            alert('Test print gagal. Pastikan' + (printer.connectionType === 'bluetooth' ? ' Bluetooth menyala.' : ' Bridge dan Printer menyala.'));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-[var(--bg-app)] border border-[var(--border-dim)] w-full max-w-2xl rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="p-8 border-b border-white/5 flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-white mb-1">Pengaturan Printer</h2>
                        <p className="text-xs text-[var(--text-muted)] opacity-60">Konfigurasi jembatan cetak & rute kategori</p>
                    </div>
                    <button onClick={onClose} className="size-10 flex items-center justify-center rounded-xl hover:bg-white/5 text-[var(--text-muted)]">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
                    {config.map((printer) => (
                        <div key={printer.id} className="glass p-6 rounded-3xl space-y-6 border border-white/5">
                            <div className="flex items-center justify-between">
                                <input 
                                    value={printer.name}
                                    onChange={(e) => updatePrinter(printer.id, { name: e.target.value })}
                                    className="bg-transparent border-none text-lg font-bold text-primary focus:ring-0 p-0 w-full"
                                    placeholder="Nama Printer"
                                />
                                <button onClick={() => removePrinter(printer.id)} className="text-red-400 p-2 hover:bg-red-400/10 rounded-lg">
                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60">Tipe Koneksi</label>
                                    <select 
                                        value={printer.connectionType || 'bridge'}
                                        onChange={(e) => updatePrinter(printer.id, { connectionType: e.target.value as 'bridge' | 'bluetooth' })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all"
                                    >
                                        <option value="bridge">Local Bridge (IP)</option>
                                        <option value="bluetooth">Bluetooth (Direct)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60">Paper Width</label>
                                    <select 
                                        value={printer.width}
                                        onChange={(e) => updatePrinter(printer.id, { width: parseInt(e.target.value) as 32 | 48 })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all"
                                    >
                                        <option value={32}>58mm (32 chars)</option>
                                        <option value={48}>80mm (48 chars)</option>
                                    </select>
                                </div>
                            </div>

                            {printer.connectionType === 'bluetooth' ? (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60">Paired Bluetooth Device</label>
                                    <div className="flex gap-2">
                                        <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-[var(--text-muted)]">
                                            {printer.bluetoothDeviceName || 'Not Paired'}
                                        </div>
                                        {PrintService.isBluetoothSupported() ? (
                                            <button 
                                                onClick={async () => {
                                                    try {
                                                        const name = await PrintService.connectBluetooth(true);
                                                        if (name) {
                                                            updatePrinter(printer.id, { bluetoothDeviceName: name });
                                                        } else {
                                                            alert('Pairing gagal atau dibatalkan');
                                                        }
                                                    } catch (err: any) {
                                                        alert(err.message || 'Bluetooth tidak didukung di browser ini.');
                                                    }
                                                }}
                                                className="px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl text-xs font-bold hover:bg-primary hover:text-slate-950 transition-all font-black"
                                            >
                                                Pair Now
                                            </button>
                                        ) : (
                                            <div className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-[10px] font-black uppercase flex items-center">
                                                Unsupported
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60">Alamat IP Printer</label>
                                    <input 
                                        value={printer.ip}
                                        onChange={(e) => updatePrinter(printer.id, { ip: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all"
                                        placeholder="192.168.1.100"
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60">Kategori Rute (Pisahkan koma)</label>
                                <input 
                                    value={printer.categories.join(', ')}
                                    onChange={(e) => updatePrinter(printer.id, { categories: e.target.value.split(',').map(s => s.trim()).filter(s => s) })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all"
                                    placeholder="Minuman, Kopi, dsb"
                                />
                                <p className="text-[10px] text-[var(--text-muted)] opacity-40 italic">Kosongkan jika ingin mencetak semua struk pembayaran di sini.</p>
                            </div>

                            <button 
                                onClick={() => testPrint(printer)}
                                className="w-full py-3 rounded-xl border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[18px]">print_connect</span>
                                Test Print & Cash Drawer
                            </button>
                        </div>
                    ))}

                    <button 
                        onClick={addPrinter}
                        className="w-full py-4 rounded-2xl border-2 border-dashed border-white/10 text-[var(--text-muted)] hover:border-primary/40 hover:text-primary transition-all flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined">add_circle</span>
                        Tambah Printer Baru
                    </button>
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-white/5 bg-white/[0.02] flex gap-4 shrink-0">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-4 rounded-2xl border border-white/10 font-bold text-sm tracking-wide hover:bg-white/5 transition-all"
                    >
                        Batal
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-[2] py-4 rounded-2xl bg-primary text-[#0b1220] font-black text-sm tracking-widest uppercase hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-primary/20"
                    >
                        {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrinterSettings;
