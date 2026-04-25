import React from 'react';
import SyncWidget from './SyncWidget';
import { PerformanceSettings } from '@shared/services/performance';

interface POSHeaderExtrasProps {
    showMemberPanel: boolean;
    setShowMemberPanel: (show: boolean) => void;
    selectedMember: any;
    setSelectedMember: (member: any) => void;
    setPointsToRedeem: (points: number) => void;
    searchMembers: (query: string) => void;
    memberSearch: string;
    setMemberSearch: (search: string) => void;
    memberSearchResults: any[];
    isAddingMember: boolean;
    setIsAddingMember: (adding: boolean) => void;
    newMemberName: string;
    setNewMemberName: (name: string) => void;
    newMemberPhone: string;
    setNewMemberPhone: (phone: string) => void;
    handleCreateMember: () => void;
    isCreatingMember: boolean;
    showDiscountPanel: boolean;
    setShowDiscountPanel: (show: boolean) => void;
    selectedDiscount: any;
    setSelectedDiscount: (discount: any) => void;
    loadDiscounts: () => void;
    availableDiscounts: any[];
    activeShift: any;
    pendingSyncs: number;
    setIsHandoverShiftOpen: (open: boolean) => void;
    setIsCloseShiftOpen: (open: boolean) => void;
    getSummary: (id: number) => Promise<any>;
    setShiftSummaryData: (data: any) => void;
    showNotification: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
    isActionMenuOpen: boolean;
    setIsActionMenuOpen: (open: boolean) => void;
    navigateTo: (view: any) => void;
    view: string;
    printQueueCount: number;
    pointsToRedeem: number;
}

export const POSHeaderExtras: React.FC<POSHeaderExtrasProps> = ({
    showMemberPanel, setShowMemberPanel,
    selectedMember, setSelectedMember,
    setPointsToRedeem, searchMembers,
    memberSearch, setMemberSearch,
    memberSearchResults,
    isAddingMember, setIsAddingMember,
    newMemberName, setNewMemberName,
    newMemberPhone, setNewMemberPhone,
    handleCreateMember, isCreatingMember,
    showDiscountPanel, setShowDiscountPanel,
    selectedDiscount, setSelectedDiscount,
    loadDiscounts, availableDiscounts,
    activeShift, pendingSyncs,
    setIsHandoverShiftOpen, setIsCloseShiftOpen,
    getSummary, setShiftSummaryData,
    showNotification,
    isActionMenuOpen, setIsActionMenuOpen,
    navigateTo, view, printQueueCount,
    pointsToRedeem
}) => {
    return (
        <div className="flex items-center gap-2 sm:gap-4 md:gap-6 flex-shrink-0">
            {/* Loyalty Nav Dropdowns */}
            <div className="flex items-center gap-2">
                <div className="relative">
                    <button 
                        onClick={() => { 
                            setShowMemberPanel(!showMemberPanel); 
                            setShowDiscountPanel(false); 
                            setIsActionMenuOpen(false); 
                            if (!showMemberPanel) searchMembers('');
                        }}
                        className={`h-11 px-4 rounded-2xl flex items-center justify-center gap-3 relative transition-all active:scale-95 shadow-lg border ${
                            showMemberPanel || selectedMember 
                                ? 'bg-primary text-[#faf9f6] border-primary/20 font-black' 
                                : 'bg-[var(--secondary)] border-white/5 text-[#fefae0]/80 hover:text-[#fefae0]'
                        }`}
                        title="Pilih Member"
                    >
                        <span className="material-symbols-outlined text-xl font-black">person_search</span>
                        <div className="flex flex-col items-start leading-none gap-0.5">
                            <span className="text-[10px] hidden sm:inline uppercase tracking-widest font-black">{selectedMember ? selectedMember.name.substring(0,12) : 'Loyalty'}</span>
                            {selectedMember && (
                                <span className="text-[8px] hidden sm:inline uppercase font-black tracking-tighter text-[#faf9f6]/70">Verified</span>
                            )}
                        </div>
                        {selectedMember && (
                            <span className="absolute -top-1 -right-1 size-3.5 bg-success border-2 border-[var(--secondary)] rounded-full shadow-lg animate-pulse" />
                        )}
                    </button>
                    {showMemberPanel && (
                        <>
                            <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm sm:bg-transparent sm:backdrop-blur-none" onClick={() => setShowMemberPanel(false)} />
                            <div className={`fixed inset-x-4 top-24 sm:absolute sm:inset-auto sm:right-0 sm:top-12 sm:mt-3 w-auto sm:w-80 max-w-[calc(100vw-32px)] ${PerformanceSettings.getGlassClass()} border border-[var(--border-dim)] rounded-3xl p-5 shadow-[var(--card-shadow)] z-50 animate-in slide-in-from-top-4 fade-in duration-300`}>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                                        <h4 className="font-black text-sm uppercase tracking-widest text-[var(--text-main)]">Pilih Member</h4>
                                        {selectedMember && (
                                            <button onClick={() => { setSelectedMember(null); setPointsToRedeem(0); }} className="text-[10px] text-red-400 font-bold hover:text-red-300">Hapus</button>
                                        )}
                                    </div>
                                    {!selectedMember ? (
                                        <div className="space-y-3">
                                            {isAddingMember ? (
                                                <div className="space-y-3 p-1 animate-in slide-in-from-right-2 duration-300">
                                                    <div className="space-y-2">
                                                        <input 
                                                            placeholder="Nama Member Baru"
                                                            value={newMemberName}
                                                            onChange={e => setNewMemberName(e.target.value)}
                                                            className="w-full bg-[var(--bg-app)] border border-[var(--border-dim)] rounded-xl px-4 py-3 text-xs text-[var(--text-main)] outline-none focus:border-primary"
                                                        />
                                                        <input 
                                                            placeholder="Nomor Handphone (WhatsApp)"
                                                            value={newMemberPhone}
                                                            onChange={e => setNewMemberPhone(e.target.value)}
                                                            className="w-full bg-[var(--bg-app)] border border-[var(--border-dim)] rounded-xl px-4 py-3 text-xs text-[var(--text-main)] outline-none focus:border-primary"
                                                        />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button 
                                                            onClick={() => setIsAddingMember(false)} 
                                                            className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-main)]"
                                                        >
                                                            Batal
                                                        </button>
                                                        <button 
                                                            onClick={handleCreateMember} 
                                                            disabled={isCreatingMember}
                                                            className="flex-[2] py-3 bg-primary text-[#0b1220] font-black uppercase tracking-[0.2em] text-[10px] rounded-xl shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50"
                                                        >
                                                            {isCreatingMember ? 'Menyimpan...' : 'Daftar & Pilih'}
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="relative group">
                                                        <input
                                                            autoFocus
                                                            placeholder="Cari nama / No HP..."
                                                            value={memberSearch}
                                                            onChange={e => { setMemberSearch(e.target.value); searchMembers(e.target.value); }}
                                                            onKeyDown={e => e.key === 'Escape' && setShowMemberPanel(false)}
                                                            className="w-full bg-[var(--bg-app)] border border-[var(--border-dim)] rounded-xl pl-4 pr-10 py-3 text-xs text-[var(--text-main)] outline-none focus:border-primary/40 shadow-inner"
                                                        />
                                                        <button 
                                                            onClick={() => setIsAddingMember(true)}
                                                            className="absolute right-2 top-1/2 -translate-y-1/2 size-8 flex items-center justify-center bg-primary text-[#0b1220] rounded-lg shadow-lg active:scale-90 transition-all hover:rotate-12"
                                                        >
                                                            <span className="material-symbols-outlined text-sm font-black">person_add</span>
                                                        </button>
                                                    </div>
                                                    {memberSearchResults.length > 0 && (
                                                        <div className="max-h-48 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                                                            {memberSearchResults.map((m) => (
                                                                <button key={m.id} onClick={() => {
                                                                    setSelectedMember({ id: m.id, name: m.name, phone: m.phone, points: m.points, level: m.level });
                                                                    setShowMemberPanel(false); setMemberSearch('');
                                                                }} className="w-full flex items-center justify-between px-3 py-3 rounded-xl hover:bg-primary/10 transition-all border border-transparent hover:border-primary/20 group">
                                                                    <div className="text-left">
                                                                        <p className="font-black text-[12px] text-[var(--text-main)] uppercase tracking-tight">{m.name}</p>
                                                                        <p className="text-[10px] text-primary font-bold">{m.phone}</p>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <span className="text-[11px] text-primary font-black font-display">{m.points.toLocaleString('id-ID')} <span className="text-[8px] opacity-60">PTS</span></span>
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="bg-[var(--bg-app)] p-3 rounded-xl border border-[var(--border-dim)] flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs font-black text-[var(--text-main)]">{selectedMember.name}</p>
                                                    <p className="text-[10px] text-[var(--text-muted)]">{selectedMember.phone}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Total Poin</p>
                                                    <p className="text-sm font-black text-primary">{selectedMember.points.toLocaleString('id-ID')}</p>
                                                </div>
                                            </div>
                                            {selectedMember.points > 0 && (
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Tukar Poin</label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="number" min={0} max={selectedMember.points}
                                                            value={pointsToRedeem || ''}
                                                            onChange={e => setPointsToRedeem(Math.min(selectedMember.points, Math.max(0, parseInt(e.target.value) || 0)))}
                                                            className="flex-1 bg-[var(--bg-app)] border border-[var(--border-dim)] rounded-xl px-3 py-2 text-xs text-[var(--text-main)] outline-none"
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                            <button onClick={() => setShowMemberPanel(false)} className="w-full py-2 bg-primary text-[#0b1220] font-black tracking-widest uppercase text-[10px] rounded-xl hover:opacity-90">Selesai</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="relative">
                    <button 
                        onClick={() => { setShowDiscountPanel(!showDiscountPanel); setShowMemberPanel(false); loadDiscounts(); setIsActionMenuOpen(false); }}
                        className={`h-11 px-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg border ${
                            showDiscountPanel || selectedDiscount 
                                ? 'bg-[#606c38] text-white border-[#606c38]/20 font-black' 
                                : 'bg-[var(--secondary)] border-white/5 text-[#fefae0]/80 hover:text-[#fefae0]'
                        }`}
                        title="Pilih Diskon"
                    >
                        <span className="material-symbols-outlined text-xl font-black">local_offer</span>
                        <span className="text-[10px] hidden sm:inline uppercase tracking-widest font-black">{selectedDiscount ? 'Applied' : 'Offer'}</span>
                    </button>
                    {showDiscountPanel && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowDiscountPanel(false)} />
                            <div className={`absolute right-0 mt-3 w-[280px] sm:w-80 ${PerformanceSettings.getGlassClass()} border border-[var(--border-dim)] rounded-2xl p-4 shadow-[var(--card-shadow)] z-50 animate-in slide-in-from-top-2 fade-in duration-200`}>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                                        <h4 className="font-black text-sm uppercase tracking-widest text-[var(--text-main)]">Pilih Diskon</h4>
                                        {selectedDiscount && (
                                            <button onClick={() => { setSelectedDiscount(null); setShowDiscountPanel(false); }} className="text-[10px] text-red-400 font-bold hover:text-red-300">Hapus</button>
                                        )}
                                    </div>
                                    <div className="max-h-56 overflow-y-auto space-y-2 custom-scrollbar">
                                        {availableDiscounts.length === 0 ? (
                                            <p className="text-[10px] text-[var(--text-muted)] text-center py-4 bg-[var(--bg-app)] rounded-xl border border-[var(--border-dim)]">Tidak ada diskon yang berlaku saat ini</p>
                                        ) : availableDiscounts.map((d) => (
                                            <button key={d.id} onClick={() => { setSelectedDiscount({ id: d.id, name: d.name, value: parseFloat(d.value), type: d.type }); setShowDiscountPanel(false); }} className={`w-full text-left p-3 rounded-xl transition-all border ${selectedDiscount?.id === d.id ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-[var(--bg-app)] border-[var(--border-dim)] hover:border-emerald-500/30'}`}>
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className={`font-black text-[11px] ${selectedDiscount?.id === d.id ? 'text-emerald-400' : 'text-[var(--text-main)]'}`}>{d.name}</span>
                                                    <span className="text-[11px] text-emerald-400 font-black">-Rp {d.discountAmount?.toLocaleString('id-ID')}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Shift Status */}
            {activeShift && (
                <div className="hidden min-[1100px]:flex items-center gap-3 bg-[var(--bg-surface)] px-4 py-2 rounded-2xl border border-[var(--border-dim)]">
                    <div className="size-8 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                        <span className="material-symbols-outlined text-sm text-primary">person</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black uppercase text-primary tracking-[0.2em] leading-none mb-1">Shift Aktif</span>
                        <span className="text-[10px] font-bold text-[var(--text-main)] leading-none whitespace-nowrap">{activeShift.userName || 'Kasir'}</span>
                    </div>
                    <button
                        onClick={() => setIsHandoverShiftOpen(true)}
                        className="ml-2 size-8 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                        title="Oper Shift (Handover)"
                    >
                        <span className="material-symbols-outlined text-sm">sync_alt</span>
                    </button>
                    <button 
                        onClick={async () => {
                            if (pendingSyncs > 0) {
                                showNotification(`Gagal Menutup Shift! Masih ada ${pendingSyncs} antrean cloud.`, "error");
                                return;
                            }
                            try {
                                const summary = await getSummary(activeShift.id);
                                setShiftSummaryData(summary.data);
                                setIsCloseShiftOpen(true);
                            } catch (error: any) {
                                console.error('Failed to load shift summary:', error);
                                showNotification('Gagal memuat ringkasan shift.', 'error');
                            }
                        }}
                        className={`ml-2 size-8 rounded-lg flex items-center justify-center cursor-pointer ${
                            pendingSyncs > 0 ? 'bg-gray-500/10 text-gray-500 cursor-not-allowed' : 'bg-red-500/10 hover:bg-red-500/20 text-red-500'
                        }`}
                        title={pendingSyncs > 0 ? "Tunggu Sync Selesai" : "Tutup Shift"}
                    >
                        <span className="material-symbols-outlined text-sm">{pendingSyncs > 0 ? 'cloud_sync' : 'logout'}</span>
                    </button>
                </div>
            )}

            {/* Consolidated Action Menu (3 Dots) */}
            <div className="relative">
                <button 
                    onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
                    className={`size-11 rounded-2xl flex items-center justify-center transition-all shadow-lg border ${
                        isActionMenuOpen 
                            ? 'bg-primary text-white border-primary/20' 
                            : 'bg-[var(--secondary)] border-white/5 text-[#fefae0]/80 hover:text-[#fefae0]'
                    }`}
                    title="Menu Aksi"
                >
                    <span className="material-symbols-outlined text-2xl font-black">more_vert</span>
                </button>

                {isActionMenuOpen && (
                    <>
                        <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setIsActionMenuOpen(false)}
                        />
                        
                        <div className={`absolute right-0 mt-3 w-64 ${PerformanceSettings.getGlassClass()} border border-[var(--border-dim)] rounded-2xl p-3 shadow-[var(--card-shadow)] z-50`}>
                            <div className="space-y-3">
                                {activeShift && (
                                    <>
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-primary opacity-60 ml-2">Kasir Aktif</p>
                                            <div className="bg-primary/5 rounded-xl p-3 border border-primary/20 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                                        <span className="material-symbols-outlined text-sm text-primary">person</span>
                                                    </div>
                                                    <span className="text-[11px] font-black text-[var(--text-main)] truncate max-w-[120px]">{activeShift.userName || 'Kasir'}</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => { setIsActionMenuOpen(false); setIsHandoverShiftOpen(true); }}
                                                        className="size-8 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-lg flex items-center justify-center"
                                                        title="Oper Shift"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">sync_alt</span>
                                                    </button>
                                                    <button 
                                                        onClick={async () => {
                                                            setIsActionMenuOpen(false);
                                                            if (pendingSyncs > 0) {
                                                                showNotification(`Gagal Menutup Shift! Masih ada ${pendingSyncs} antrean cloud.`, "error");
                                                                return;
                                                            }
                                                            try {
                                                                const summary = await getSummary(activeShift.id);
                                                                setShiftSummaryData(summary.data);
                                                                setIsCloseShiftOpen(true);
                                                            } catch (error: any) {
                                                                console.error('Failed to load shift summary:', error);
                                                                showNotification('Gagal memuat ringkasan shift.', 'error');
                                                            }
                                                        }}
                                                        className={`size-8 rounded-lg flex items-center justify-center ${
                                                            pendingSyncs > 0 ? 'bg-gray-500/10 text-gray-500' : 'bg-red-500/10 hover:bg-red-500/20 text-red-500'
                                                        }`}
                                                        title="Tutup Shift"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">{pendingSyncs > 0 ? 'cloud_sync' : 'logout'}</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="h-px bg-white/5 mx-2"></div>
                                    </>
                                )}

                                <div className="space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary opacity-60 ml-2">Sinkronisasi</p>
                                    <div className="bg-black/20 rounded-xl p-2">
                                        <SyncWidget />
                                    </div>
                                </div>

                                <div className="h-px bg-white/5 mx-2"></div>

                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary opacity-60 ml-2 mb-2">Navigasi</p>
                                    <button 
                                        onClick={() => { navigateTo('pos'); setIsActionMenuOpen(false); }}
                                        className={`w-full px-4 py-2.5 rounded-xl flex items-center gap-3 ${view === 'pos' ? 'bg-primary/20 text-primary font-black border border-primary/20' : 'text-[var(--text-muted)] hover:bg-white/5 font-bold'}`}
                                    >
                                        <span className="material-symbols-outlined text-base">point_of_sale</span>
                                        <span className="text-xs uppercase tracking-widest">Input Penjualan</span>
                                    </button>
                                    <button 
                                        onClick={() => { navigateTo('history'); setIsActionMenuOpen(false); }}
                                        className={`w-full px-4 py-2.5 rounded-xl flex items-center gap-3 ${view === 'history' ? 'bg-primary/20 text-primary font-black border border-primary/20' : 'text-[var(--text-muted)] hover:bg-white/5 font-bold'}`}
                                    >
                                        <span className="material-symbols-outlined text-base">history</span>
                                        <span className="text-xs uppercase tracking-widest">Riwayat Kasir</span>
                                    </button>
                                    <button 
                                        onClick={() => { navigateTo('print-queue'); setIsActionMenuOpen(false); }}
                                        className={`w-full px-4 py-2.5 rounded-xl flex items-center gap-3 relative ${view === 'print-queue' ? 'bg-primary/20 text-primary font-black border border-primary/20' : 'text-[var(--text-muted)] hover:bg-white/5 font-bold'}`}
                                    >
                                        <span className="material-symbols-outlined text-base">receipt_long</span>
                                        <span className="text-xs uppercase tracking-widest">Antrean Struk</span>
                                        {printQueueCount > 0 && (
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 size-5 bg-amber-500 text-slate-950 text-[10px] font-black rounded-full flex items-center justify-center shadow-lg">
                                                {printQueueCount}
                                            </span>
                                        )}
                                    </button>
                                    <button 
                                        onClick={() => { navigateTo('sync-queue'); setIsActionMenuOpen(false); }}
                                        className={`w-full px-4 py-2.5 rounded-xl flex items-center gap-3 ${view === 'sync-queue' ? 'bg-primary/20 text-primary font-black border border-primary/20' : 'text-[var(--text-muted)] hover:bg-white/5 font-bold'}`}
                                    >
                                        <span className="material-symbols-outlined text-base">cloud_sync</span>
                                        <span className="text-xs uppercase tracking-widest">Antrean Cloud</span>
                                    </button>
                                </div>

                                <div className="h-px bg-white/5 mx-2"></div>

                                <button 
                                    onClick={() => { navigateTo('printer-settings'); setIsActionMenuOpen(false); }}
                                    className={`w-full px-4 py-2.5 rounded-xl flex items-center gap-3 ${view === 'printer-settings' ? 'bg-primary/20 text-primary font-black border border-primary/20' : 'text-[var(--text-muted)] hover:bg-white/5 font-bold'}`}
                                >
                                    <span className="material-symbols-outlined text-base">print</span>
                                    <span className="text-xs uppercase tracking-widest">Pengaturan Printer</span>
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
