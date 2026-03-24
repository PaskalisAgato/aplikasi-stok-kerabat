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
    const [assignedTo, setAssignedTo] = useState('');
    const [deadline, setDeadline] = useState('');

    useEffect(() => {
        if (task) {
            setTitle(task.title);
            setDescription(task.description);
            setCategory(task.category);
            setAssignedTo(task.assignedTo || '');
            setDeadline(task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : '');
        } else {
            setTitle('');
            setDescription('');
            setCategory('Opening');
            setAssignedTo('');
            setDeadline('');
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

                    <div className="space-y-6">
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

                        {/* Deadline */}
                        <div className="space-y-3">
                             <div className="flex justify-between items-center ml-1">
                                <label className="text-[10px] font-black text-muted uppercase tracking-widest flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[10px]">timer</span>
                                    Tenggat Waktu
                                </label>
                                <button 
                                    type="button" 
                                    onClick={() => setDeadline('')}
                                    className="text-[8px] font-black text-primary uppercase tracking-widest hover:underline"
                                >
                                    Hapus
                                </button>
                             </div>
                             <input
                                 type="datetime-local"
                                 value={deadline}
                                 onChange={(e) => setDeadline(e.target.value)}
                                 className="w-full h-14 bg-white/5 border-white/10 rounded-2xl px-6 text-main font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                             />
                             <div className="grid grid-cols-4 gap-2">
                                 {[1, 2, 4, 8].map(h => (
                                     <button
                                         key={h}
                                         type="button"
                                         onClick={() => {
                                             const d = new Date();
                                             d.setHours(d.getHours() + h);
                                             // Fast format to datetime-local
                                             const offset = d.getTimezoneOffset();
                                             const localDate = new Date(d.getTime() - (offset * 60 * 1000));
                                             setDeadline(localDate.toISOString().slice(0, 16));
                                         }}
                                         className="h-10 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black text-muted uppercase tracking-widest active:scale-90 transition-all hover:border-primary/40 hover:text-primary"
                                     >
                                         +{h} Jam
                                     </button>
                                 ))}
                             </div>
                        </div>

                        {/* Description & Category ... */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Deskripsi / Detail</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full h-24 bg-white/5 border-white/10 rounded-2xl p-6 text-main font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:opacity-20 resize-none"
                                placeholder="Jelaskan langkah-langkah detail tugas ini..."
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
                    </div>

                    <button
                        onClick={() => onSave({ title, description, category, assignedTo: assignedTo || null, deadline: deadline || null })}
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
