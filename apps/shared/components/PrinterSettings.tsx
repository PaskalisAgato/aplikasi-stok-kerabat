import React, { useState, useEffect } from 'react';
import { PrintService, PrinterConfig } from '@shared/services/PrintService';
import { useNotification } from './NotificationProvider';

interface PrinterSettingsProps {
    isOpen: boolean;
    onClose: () => void;
    isFullPage?: boolean;
}

const PrinterSettings: React.FC<PrinterSettingsProps> = ({ isOpen, onClose, isFullPage = false }) => {
    const [config, setConfig] = useState<PrinterConfig[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const { showNotification } = useNotification();

    useEffect(() => {
        const loadSettings = async () => {
            const saved = await PrintService.getSettings();
            setConfig(saved);
        };
        if (isOpen || isFullPage) loadSettings();
    }, [isOpen, isFullPage]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await PrintService.saveSettings(config);
            if (!isFullPage) onClose();
            else {
                showNotification('Pengaturan berhasil disimpan', 'success');
            }
        } catch (error) {
            showNotification('Gagal menyimpan pengaturan', 'error');
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
            connectionType: 'bridge',
            autoPrint: true
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
            const target = printer.connectionType === 'bluetooth' ? (printer.bluetoothDeviceName || 'Bluetooth') : 
                           printer.connectionType === 'serial' ? 'Serial Port' : printer.ip;
            alert('Test print berhasil dikirim ke ' + target);
        } else {
            let msg = 'Test print gagal. ';
            if (printer.connectionType === 'bluetooth') msg += 'Pastikan Bluetooth menyala.';
            else if (printer.connectionType === 'serial') msg += 'Pastikan kabel/bluetooth terhubung dan terdeteksi sebagai COM port.';
            else msg += 'Pastikan Bridge dan Printer menyala.';
            alert(msg);
        }
    };

    if (!isOpen && !isFullPage) return null;

    const Content = (
        <div className={`${isFullPage ? 'w-full' : 'bg-[var(--bg-app)] border border-[var(--border-dim)] w-full max-w-2xl rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in duration-300'}`}>
            {/* Header */}
            <div className={`p-8 border-b dark:border-white/5 border-slate-200 flex items-center justify-between shrink-0 ${isFullPage ? 'px-0' : ''}`}>
                <div>
                    <h2 className="text-xl font-bold tracking-tight dark:text-white dark:text-white text-slate-900 mb-1">Pengaturan Printer</h2>
                    <p className="text-xs dark:text-slate-400 dark:text-slate-400 text-slate-500 opacity-60">Konfigurasi jembatan cetak & rute kategori</p>
                </div>
                {!isFullPage && (
                    <button onClick={onClose} className="size-10 flex items-center justify-center rounded-xl hover:dark:bg-white/5 bg-white shadow-sm border border-slate-200 dark:text-slate-400 dark:text-slate-400 text-slate-500">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                )}
            </div>

            {/* Content Body */}
            <div className={`p-8 overflow-y-auto space-y-8 custom-scrollbar ${isFullPage ? 'px-0' : ''}`}>
                {config.map((printer) => (
                    <div key={printer.id} className="glass p-6 rounded-3xl space-y-6 border dark:border-white/5 border-slate-200">
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
                                <label className="text-[10px] font-black uppercase tracking-widest dark:text-slate-400 dark:text-slate-400 text-slate-500 opacity-60">Tipe Koneksi</label>
                                <select 
                                    value={printer.connectionType || 'bridge'}
                                    onChange={(e) => updatePrinter(printer.id, { connectionType: e.target.value as any })}
                                    className="w-full dark:bg-white/5 bg-white shadow-sm border border-slate-200 border dark:border-white/10 border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all"
                                >
                                    <option value="bridge">Local Bridge (IP)</option>
                                    <option value="bluetooth">Bluetooth (Direct BLE)</option>
                                    <option value="serial">Serial / Legacy Bluetooth (SPP)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest dark:text-slate-400 dark:text-slate-400 text-slate-500 opacity-60">Paper Width</label>
                                <select 
                                    value={printer.width}
                                    onChange={(e) => updatePrinter(printer.id, { width: parseInt(e.target.value) as 32 | 48 })}
                                    className="w-full dark:bg-white/5 bg-white shadow-sm border border-slate-200 border dark:border-white/10 border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all"
                                >
                                    <option value={32}>58mm (32 chars)</option>
                                    <option value={48}>80mm (48 chars)</option>
                                </select>
                            </div>
                        </div>

                        {printer.connectionType === 'bluetooth' ? (
                            <div className="space-y-3">
                                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                    <p className="text-[10px] font-bold text-amber-500 uppercase flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">info</span>
                                        Penting (BLE Mode)
                                    </p>
                                    <p className="text-[9px] text-amber-500/80 mt-1">
                                        Gunakan mode ini hanya jika printer Anda mendukung **Bluetooth 4.0/5.0 (BLE)**. 
                                        Jika printer tidak terdeteksi, gunakan tipe **"Serial / Legacy Bluetooth"**.
                                    </p>
                                </div>
                                <label className="text-[10px] font-black uppercase tracking-widest dark:text-slate-400 dark:text-slate-400 text-slate-500 opacity-60">Paired Bluetooth Device (BLE Only)</label>
                                <div className="flex gap-2">
                                    <div className="flex-1 dark:bg-white/5 bg-white shadow-sm border border-slate-200 border dark:border-white/10 border-slate-200 rounded-xl px-4 py-3 text-sm dark:text-slate-400 dark:text-slate-400 text-slate-500">
                                        {printer.bluetoothDeviceName || 'Not Paired'}
                                    </div>
                                    {PrintService.isBluetoothSupported() ? (
                                        <button 
                                            onClick={async () => {
                                                try {
                                                    const result = await PrintService.connectBluetooth(true);
                                                    if (result) {
                                                        updatePrinter(printer.id, { 
                                                            bluetoothDeviceName: result.name,
                                                            deviceId: result.deviceId 
                                                        });
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
                        ) : printer.connectionType === 'serial' ? (
                            <div className="space-y-3">
                                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                                    <p className="text-[10px] font-bold text-blue-400 uppercase flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">settings_bluetooth</span>
                                        Panduan Legacy Bluetooth (SPP)
                                    </p>
                                    <ul className="text-[9px] text-blue-400/80 mt-1 list-disc ml-4 space-y-1">
                                        <li>Pairing printer Anda di <b>Settings Bluetooth Laptop/PC</b> Anda terlebih dahulu.</li>
                                        <li>Jika di Linux, pastikan izin dialout aktif (cek panduan di bawah).</li>
                                        <li>Klik "Select Port" dan pilih <b>COM/RFCOMM</b> yang muncul.</li>
                                    </ul>
                                </div>
                                <label className="text-[10px] font-black uppercase tracking-widest dark:text-slate-400 dark:text-slate-400 text-slate-500 opacity-60">Serial / COM Port (Legacy BT)</label>
                                <div className="flex gap-2">
                                    <div className="flex-1 dark:bg-white/5 bg-white shadow-sm border border-slate-200 border dark:border-white/10 border-slate-200 rounded-xl px-4 py-3 text-sm dark:text-slate-400 dark:text-slate-400 text-slate-500 flex flex-col gap-1">
                                        <p className="font-bold">{printer.bluetoothDeviceName || 'Port Belum Dipilih'}</p>
                                        <p className="text-[9px] opacity-60">Pilih virtual port yang sesuai dengan printer Anda.</p>
                                    </div>
                                    {PrintService.isSerialSupported() ? (
                                        <button 
                                            onClick={async () => {
                                                try {
                                                    const result = await PrintService.connectSerial();
                                                    if (result) {
                                                        updatePrinter(printer.id, { 
                                                            bluetoothDeviceName: result.name,
                                                            deviceId: result.deviceId
                                                        });
                                                    }
                                                } catch (err: any) {
                                                    let msg = err.message || 'Gagal menyambungkan Serial port.';
                                                    if (msg.includes('Permission denied')) {
                                                        msg += '\n\nTip Linux: Jalankan `sudo usermod -a -G dialout $USER` lalu logout & login kembali.';
                                                    }
                                                    alert(msg);
                                                }
                                            }}
                                            className="px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl text-xs font-bold hover:bg-primary hover:text-slate-950 transition-all font-black"
                                        >
                                            Select Port
                                        </button>
                                    ) : (
                                        <div className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-[10px] font-black uppercase flex items-center">
                                            Not Supported
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest dark:text-slate-400 dark:text-slate-400 text-slate-500 opacity-60">Alamat IP Printer</label>
                                <input 
                                    value={printer.ip}
                                    onChange={(e) => updatePrinter(printer.id, { ip: e.target.value })}
                                    className="w-full dark:bg-white/5 bg-white shadow-sm border border-slate-200 border dark:border-white/10 border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all"
                                    placeholder="192.168.1.100"
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest dark:text-slate-400 dark:text-slate-400 text-slate-500 opacity-60">Kategori Rute (Pisahkan koma)</label>
                            <input 
                                value={printer.categories.join(', ')}
                                onChange={(e) => updatePrinter(printer.id, { categories: e.target.value.split(',').map(s => s.trim()).filter(s => s) })}
                                className="w-full dark:bg-white/5 bg-white shadow-sm border border-slate-200 border dark:border-white/10 border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all"
                                placeholder="Minuman, Kopi, dsb"
                            />
                            <p className="text-[10px] dark:text-slate-400 dark:text-slate-400 text-slate-500 opacity-40 italic">Kosongkan jika ingin mencetak semua struk pembayaran di sini.</p>
                        </div>

                        <div className="flex items-center justify-between p-4 dark:bg-white/5 bg-white shadow-sm border border-slate-200 rounded-2xl border dark:border-white/10 border-slate-200 group-hover:border-primary/20 transition-all">
                            <div className="space-y-0.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-primary">Auto Cetak</label>
                                <p className="text-[9px] dark:text-slate-400 dark:text-slate-400 text-slate-500 opacity-60">Cetak struk otomatis saat checkout</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={printer.autoPrint !== false}
                                    onChange={(e) => updatePrinter(printer.id, { autoPrint: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>

                        {/* Advanced Settings Section */}
                        <details className="group/adv">
                            <summary className="list-none cursor-pointer flex items-center gap-2 text-[10px] font-black uppercase tracking-widest dark:text-slate-400 dark:text-slate-400 text-slate-500 opacity-40 hover:opacity-100 transition-opacity py-2">
                                <span className="material-symbols-outlined text-[16px] group-open/adv:rotate-180 transition-transform">expand_more</span>
                                Pengaturan Lanjutan (Drawer & Branding)
                            </summary>
                            
                            <div className="space-y-6 pt-4 animate-in slide-in-from-top-2 duration-300">
                                <div className="flex items-center justify-between p-4 dark:bg-white/5 bg-white shadow-sm border border-slate-200 rounded-2xl border dark:border-white/10 border-slate-200">
                                    <div className="space-y-0.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Buka Laci Otomatis</label>
                                        <p className="text-[9px] dark:text-slate-400 dark:text-slate-400 text-slate-500 opacity-60">Picu laci kasir saat pembayaran tunai</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={!!printer.openCashDrawer}
                                            onChange={(e) => updatePrinter(printer.id, { openCashDrawer: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                    </label>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black uppercase tracking-widest dark:text-slate-400 dark:text-slate-400 text-slate-500 opacity-60">Judul Header (Nama Toko)</label>
                                        <input 
                                            value={printer.headerTitle || ''}
                                            onChange={(e) => updatePrinter(printer.id, { headerTitle: e.target.value })}
                                            className="w-full dark:bg-white/5 bg-white shadow-sm border border-slate-200 border dark:border-white/10 border-slate-200 rounded-xl px-4 py-2 text-xs focus:border-primary outline-none transition-all"
                                            placeholder="KERABAT KOPI TIAM"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black uppercase tracking-widest dark:text-slate-400 dark:text-slate-400 text-slate-500 opacity-60">Sub-judul Header</label>
                                        <input 
                                            value={printer.headerSubtitle || ''}
                                            onChange={(e) => updatePrinter(printer.id, { headerSubtitle: e.target.value })}
                                            className="w-full dark:bg-white/5 bg-white shadow-sm border border-slate-200 border dark:border-white/10 border-slate-200 rounded-xl px-4 py-2 text-xs focus:border-primary outline-none transition-all"
                                            placeholder="Premium Coffee & Toast"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black uppercase tracking-widest dark:text-slate-400 dark:text-slate-400 text-slate-500 opacity-60">Pesan Footer (Terima Kasih)</label>
                                        <input 
                                            value={printer.footerMessage || ''}
                                            onChange={(e) => updatePrinter(printer.id, { footerMessage: e.target.value })}
                                            className="w-full dark:bg-white/5 bg-white shadow-sm border border-slate-200 border dark:border-white/10 border-slate-200 rounded-xl px-4 py-2 text-xs focus:border-primary outline-none transition-all"
                                            placeholder="Terima Kasih! Selamat Menikmati"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-1 space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest dark:text-slate-400 dark:text-slate-400 text-slate-500 opacity-60">Info Struk</label>
                                        <div className="flex gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" checked={printer.showDate !== false} onChange={(e) => updatePrinter(printer.id, { showDate: e.target.checked })} className="rounded dark:border-white/10 border-slate-200 dark:bg-white/5 bg-white shadow-sm border border-slate-200 text-primary" />
                                                <span className="text-[10px] dark:text-white dark:text-white text-slate-900/60">Tgl/Jam</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" checked={!!printer.showCashier} onChange={(e) => updatePrinter(printer.id, { showCashier: e.target.checked })} className="rounded dark:border-white/10 border-slate-200 dark:bg-white/5 bg-white shadow-sm border border-slate-200 text-primary" />
                                                <span className="text-[10px] dark:text-white dark:text-white text-slate-900/60">Nama Kasir</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </details>

                        <div className="flex gap-3">
                            <button 
                                onClick={() => testPrint(printer)}
                                className="flex-1 py-3 rounded-xl border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[18px]">receipt</span>
                                Test Print
                            </button>
                            {printer.openCashDrawer && (
                                <button 
                                    onClick={async () => {
                                        const success = await PrintService.pulseDrawer(printer);
                                        if (success) alert('Perintah buka laci dikirim');
                                        else alert('Gagal mengirim perintah. Cek koneksi.');
                                    }}
                                    className="px-4 py-3 rounded-xl border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest hover:bg-emerald-500/5 transition-all flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-[18px]">sensor_door</span>
                                    Test Laci
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                <button 
                    onClick={addPrinter}
                    className="w-full py-4 rounded-2xl border-2 border-dashed dark:border-white/10 border-slate-200 dark:text-slate-400 dark:text-slate-400 text-slate-500 hover:border-primary/40 hover:text-primary transition-all flex items-center justify-center gap-2"
                >
                    <span className="material-symbols-outlined">add_circle</span>
                    Tambah Printer Baru
                </button>
            </div>

            {/* Footer */}
            <div className={`p-8 border-t dark:border-white/5 border-slate-200 bg-white/[0.02] flex gap-4 shrink-0 ${isFullPage ? 'px-0' : ''}`}>
                <button 
                    onClick={onClose}
                    className="flex-1 py-4 rounded-2xl border dark:border-white/10 border-slate-200 font-bold text-sm tracking-wide hover:dark:bg-white/5 bg-white shadow-sm border border-slate-200 transition-all"
                >
                    {isFullPage ? 'Kembali' : 'Batal'}
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
    );

    if (isFullPage) return Content;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 dark:bg-black bg-white/60 backdrop-blur-sm animate-in fade-in duration-300">
            {Content}
        </div>
    );
};

export default PrinterSettings;
