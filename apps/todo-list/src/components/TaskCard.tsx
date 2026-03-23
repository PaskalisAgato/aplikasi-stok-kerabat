import { useState } from 'react';
import CameraCaptureModal from './CameraCaptureModal';

interface TaskCardProps {
    task: any;
    role: 'Admin' | 'Karyawan';
    onComplete?: (id: number, photo: string) => void;
    onEdit?: (task: any) => void;
    onDelete?: (id: number) => void;
}

export default function TaskCard({ task, role, onComplete, onEdit, onDelete }: TaskCardProps) {
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    
    const handleCapture = async (base64: string) => {
        if (!onComplete) return;
        setIsUploading(true);
        try {
            await onComplete(task.id, base64);
        } finally {
            setIsUploading(false);
        }
    };

    const isCompleted = task.status === 'Completed';

    return (
        <div className={`card group p-5 flex flex-col gap-4 transition-all border-white/5 relative ${isCompleted ? 'opacity-60 grayscale-[0.5]' : ''}`}>
            <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                         <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                            task.category === 'Opening' ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' :
                            task.category === 'Closing' ? 'text-amber-500 border-amber-500/20 bg-amber-500/5' :
                            'text-sky-500 border-sky-500/20 bg-sky-500/5'
                         }`}>
                             {task.category}
                         </span>
                          {task.isRecurring && (
                             <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-primary/40 bg-primary/10 text-primary flex items-center gap-1">
                                 <span className="material-symbols-outlined text-[10px] font-black">autorenew</span>
                                 Rutin
                             </span>
                          )}
                          {!isCompleted && !task.isRecurring && (
                             <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-500">
                                 Sekali Saja
                             </span>
                          )}
                          {isCompleted && (
                             <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 flex items-center gap-1">
                                 <span className="material-symbols-outlined text-[10px] font-black">check_circle</span>
                                 Selesai
                             </span>
                         )}
                    </div>
                    <h3 className="text-lg font-black font-display tracking-tight text-main uppercase leading-tight truncate">{task.title}</h3>
                    <p className="text-[10px] text-muted font-bold uppercase tracking-widest opacity-60 line-clamp-2">{task.description}</p>
                </div>

                {role === 'Admin' && (
                    <div className="flex gap-1">
                        <button onClick={() => onEdit?.(task)} className="size-8 glass rounded-lg text-primary hover:bg-primary/20 flex items-center justify-center transition-all">
                            <span className="material-symbols-outlined text-sm font-black">edit</span>
                        </button>
                        <button onClick={() => onDelete?.(task.id)} className="size-8 glass rounded-lg text-red-500 hover:bg-red-500/20 flex items-center justify-center transition-all">
                            <span className="material-symbols-outlined text-sm font-black">delete</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Employee Action Area */}
            {!isCompleted && role === 'Karyawan' && (
                <div className="pt-4 border-t border-white/5 flex flex-col gap-3">
                    <button 
                        onClick={() => setIsCameraOpen(true)}
                        disabled={isUploading}
                        className={`w-full h-12 rounded-xl flex items-center justify-center gap-3 transition-all border-2 border-dashed ${isUploading ? 'bg-primary/5 border-primary/40 animate-pulse' : 'bg-white/5 border-white/10 hover:border-primary/40 hover:bg-primary/5'}`}
                    >
                        <span className="material-symbols-outlined text-primary text-xl font-black">photo_camera</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">{isUploading ? 'Mengunggah...' : 'Ambil Foto Bukti'}</span>
                    </button>
                </div>
            )}

            <CameraCaptureModal 
                isOpen={isCameraOpen}
                onClose={() => setIsCameraOpen(false)}
                onCapture={handleCapture}
            />

            {/* History Details (Admin/Completed) */}
            {isCompleted && task.photoProof && (
                <div className="pt-4 border-t border-white/5 flex items-center gap-4">
                     <div className="size-16 rounded-xl bg-slate-800 overflow-hidden border border-white/10 cursor-pointer hover:scale-110 transition-transform" onClick={() => window.open(task.photoProof, '_blank')}>
                         <img src={task.photoProof} className="w-full h-full object-cover" alt="Bukti" />
                     </div>
                     <div className="flex-1 min-w-0 space-y-0.5">
                         <p className="text-[8px] font-black text-muted uppercase tracking-widest opacity-60 italic">Selesai pada {new Date(task.completionTime).toLocaleString('id-ID')}</p>
                         <p className="text-[9px] font-black text-main uppercase tracking-tight">Oleh: <span className="text-primary">{task.completedByName || 'Staf'}</span></p>
                     </div>
                </div>
            )}
        </div>
    );
}
