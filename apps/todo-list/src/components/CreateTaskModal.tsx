import { useState, useEffect } from 'react';

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    task?: any; // For editing
}

export default function CreateTaskModal({ isOpen, onClose, onSave, task }: CreateTaskModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Opening');
    const [photoUploadMode, setPhotoUploadMode] = useState<'camera' | 'gallery' | 'both'>('both');
    const [assignedTo, setAssignedTo] = useState('');
    const [deadline, setDeadline] = useState('');
    const [deadlineTime, setDeadlineTime] = useState('');
    const [intervalType, setIntervalType] = useState('daily');
    const [intervalValue, setIntervalValue] = useState(1);

    const isRecurringDaily = category !== 'Request' && intervalType === 'daily';

    useEffect(() => {
        if (task) {
            setTitle(task.title);
            setDescription(task.description);
            setCategory(task.category || 'Opening');
            setPhotoUploadMode(task.photoUploadMode || 'both');
            setAssignedTo(task.assignedTo || '');
            const taskDeadline = task.deadline ? new Date(task.deadline) : null;
            setDeadline(taskDeadline ? taskDeadline.toISOString().slice(0, 16) : '');
            setDeadlineTime(taskDeadline ? taskDeadline.toTimeString().slice(0, 5) : '');
            setIntervalType(task.intervalType || 'daily');
            setIntervalValue(task.intervalValue || 1);
        } else {
            setTitle('');
            setDescription('');
            setCategory('Opening');
            setPhotoUploadMode('both');
            setAssignedTo('');
            setDeadline('');
            setDeadlineTime('');
            setIntervalType('daily');
            setIntervalValue(1);
        }
    }, [task, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
            
            <div className="relative w-full max-w-lg bg-surface rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
                <div className="p-8 space-y-8">
                    <div className="flex justify-between items-center">
                        <div className="space-y-1">
                            <h3 className="text-2xl font-black text-main uppercase tracking-tight">{task ? 'Edit Tugas' : 'Tambah Tugas Baru'}</h3>
                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] opacity-80 italic">Manajemen To-Do Staf</p>
                        </div>
                        <button onClick={onClose} className="size-12 glass rounded-2xl flex items-center justify-center text-muted hover:text-primary transition-all">
                            <span className="material-symbols-outlined font-black">close</span>
                        </button>
                    </div>

                    <div className="space-y-5">
                        {/* Title */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Judul Tugas</label>
                            <input
                                type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full h-14 bg-white/5 border-white/10 rounded-2xl px-6 text-main font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:opacity-20"
                                    placeholder="Contoh: Nyalakan Mesin Kopi"
                            />
                        </div>

                        {/* Category */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Kategori</label>
                            <div className="grid grid-cols-3 gap-3">
                                {['Opening', 'Closing', 'Request'].map(cat => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setCategory(cat)}
                                        className={`h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                                            category === cat ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/10 text-muted'
                                        }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Photo Mode Selection */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[10px]">photo_library</span>
                                Mode Bukti Foto
                            </label>
                            <div className="flex p-1.5 bg-white/5 border border-white/10 rounded-2xl items-stretch h-14">
                                {[
                                    { id: 'camera', label: 'Kamera', icon: 'photo_camera' },
                                    { id: 'gallery', label: 'Galeri', icon: 'imagesmode' },
                                    { id: 'both', label: 'Bebas', icon: 'add_to_photos' }
                                ].map(option => (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => setPhotoUploadMode(option.id as any)}
                                        className={`flex-1 flex items-center justify-center gap-2 rounded-xl transition-all active:scale-95 ${
                                            photoUploadMode === option.id 
                                            ? 'bg-primary text-slate-950 font-black' 
                                            : 'text-muted hover:bg-white/5 font-bold'
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-lg">{option.icon}</span>
                                        <span className="text-[8px] uppercase tracking-widest">{option.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Interval Settings (Allow for all except REQUEST) */}
                        {category !== 'Request' && (
                            <div className="p-5 bg-white/5 border border-white/10 rounded-[2rem] space-y-4">
                                <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-1">Pengaturan Perulangan</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <label className="text-[8px] font-black text-muted uppercase tracking-widest ml-1">Tipe</label>
                                        <select
                                            value={intervalType}
                                            onChange={(e) => setIntervalType(e.target.value)}
                                            className="w-full h-12 bg-white/5 border-white/10 rounded-xl px-4 text-xs text-main font-bold outline-none cursor-pointer"
                                        >
                                            <option value="daily">Harian</option>
                                            <option value="weekly">Mingguan</option>
                                            <option value="monthly">Bulanan</option>
                                            <option value="custom">Custom (Hari)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[8px] font-black text-muted uppercase tracking-widest ml-1">Nilai Interval</label>
                                        <input
                                            type="number"
                                            value={intervalValue}
                                            onChange={(e) => setIntervalValue(parseInt(e.target.value))}
                                            className="w-full h-12 bg-white/5 border-white/10 rounded-xl px-4 text-xs text-main font-bold outline-none"
                                            min="1"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Deadline */}
                        <div className="space-y-3">
                             <div className="flex justify-between items-center ml-1">
                                <label className="text-[10px] font-black text-muted uppercase tracking-widest flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[10px]">timer</span>
                                    {isRecurringDaily ? 'Jam Deadline (24 Jam)' : 'Tenggat Waktu'}
                                </label>
                                <button 
                                    type="button" 
                                    onClick={() => { setDeadline(''); setDeadlineTime(''); }}
                                    className="text-[8px] font-black text-primary uppercase tracking-widest hover:underline"
                                >
                                    Hapus
                                </button>
                             </div>
                             {isRecurringDaily ? (
                                 <input
                                     type="time"
                                     value={deadlineTime}
                                     onChange={(e) => setDeadlineTime(e.target.value)}
                                     className="w-full h-14 bg-white/5 border-white/10 rounded-2xl px-6 text-main font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                 />
                             ) : (
                                 <input
                                     type="datetime-local"
                                     value={deadline}
                                     onChange={(e) => setDeadline(e.target.value)}
                                     className="w-full h-14 bg-white/5 border-white/10 rounded-2xl px-6 text-main font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                 />
                             )}
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Deskripsi / Detail</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full h-24 bg-white/5 border-white/10 rounded-2xl p-6 text-main font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:opacity-20 resize-none"
                                placeholder="..."
                            />
                        </div>

                    </div>

                    <button
                        onClick={() => {
                            // Build deadline based on mode
                            let finalDeadline: string | null = null;
                            if (isRecurringDaily && deadlineTime) {
                                // For daily recurring: combine today's date + selected time
                                const today = new Date();
                                const [h, m] = deadlineTime.split(':').map(Number);
                                today.setHours(h, m, 0, 0);
                                finalDeadline = today.toISOString();
                            } else if (deadline) {
                                finalDeadline = deadline;
                            }

                            onSave({ 
                                title, 
                                description, 
                                category, 
                                photoUploadMode,
                                assignedTo: assignedTo || null, 
                                deadline: finalDeadline,
                                isRecurring: category !== 'Request',
                                intervalType: category !== 'Request' ? intervalType : null,
                                intervalValue: category !== 'Request' ? intervalValue : null,
                                nextRunAt: category !== 'Request' ? (task?.nextRunAt ? task.nextRunAt : new Date()) : null
                            });
                        }}
                        disabled={!title}
                        className="w-full h-16 btn-primary shadow-2xl disabled:opacity-50 disabled:grayscale"
                    >
                        <span className="material-symbols-outlined font-black">save</span>
                        SIMPAN PERUBAHAN
                    </button>
                </div>
            </div>
        </div>
    );
}
