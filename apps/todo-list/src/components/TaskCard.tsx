import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import CameraCaptureModal from './CameraCaptureModal';
import { apiClient } from '@shared/apiClient';
import { getOptimizedImageUrl } from '@shared/supabase';

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
    const [timeLeft, setTimeLeft] = useState<string | null>(null);
    const [isOverdue, setIsOverdue] = useState(false);
    const [photoUrl, setPhotoUrl] = useState<string | null>(task.photoProof || null);
    const [isLoadingPhoto, setIsLoadingPhoto] = useState(false);
    const [isImageFullscreen, setIsImageFullscreen] = useState(false);

    // Scroll Lock Logic for Fullscreen Image
    useEffect(() => {
        if (isImageFullscreen) {
            const originalStyle = window.getComputedStyle(document.body).overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = originalStyle;
            };
        }
    }, [isImageFullscreen]);
    
    useEffect(() => {
        if (task.status === 'Completed' && task.hasPhotoProof && !photoUrl && !isLoadingPhoto) {
            const fetchPhoto = async () => {
                setIsLoadingPhoto(true);
                try {
                    const id = task.isRecurring ? task.completionId : task.id;
                    const type = task.isRecurring ? 'completion' : 'todo';
                    const res = await apiClient.getTodoPhoto(id, type);
                    if (res?.data) {
                        setPhotoUrl(res.data);
                    }
                } catch (error) {
                    console.error('Failed to fetch photo', error);
                } finally {
                    setIsLoadingPhoto(false);
                }
            };
            fetchPhoto();
        }
    }, [task.status, task.hasPhotoProof, task.id, task.completionId, task.isRecurring]);

    useEffect(() => {
        if (!task.deadline || task.status === 'Completed') {
            setTimeLeft(null);
            setIsOverdue(false);
            return;
        }

        const updateTime = () => {
            const now = new Date();
            const deadlineDate = new Date(task.deadline);
            
            if (task.isRecurring) {
                // For recurring tasks, shift the deadline date to today, keeping only the time
                deadlineDate.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());
            }
            
            const diff = deadlineDate.getTime() - now.getTime();

            if (diff <= 0) {
                setTimeLeft('OVERDUE');
                setIsOverdue(true);
            } else {
                setIsOverdue(false);
                
                if (task.isRecurring) {
                    // For "Rutin", just show the time (JAM: HH:mm)
                    const timeStr = deadlineDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                    setTimeLeft(`JAM: ${timeStr}`);
                } else {
                    const hours = Math.floor(diff / (1000 * 60 * 60));
                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    
                    if (hours > 24) setTimeLeft(`${Math.floor(hours / 24)}d left`);
                    else if (hours > 0) setTimeLeft(`${hours}h ${minutes}m left`);
                    else setTimeLeft(`${minutes}m left`);
                }
            }
        };

        updateTime();
        const interval = setInterval(updateTime, 1000 * 30); // Update every 30s
        return () => clearInterval(interval);
    }, [task.deadline, task.status, task.isRecurring]);

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
        <div className={`card group p-5 flex flex-col gap-4 transition-all border-white/5 relative ${isCompleted ? 'opacity-60 grayscale-[0.5]' : ''} ${isOverdue ? 'ring-2 ring-red-500/50 bg-red-500/5 shadow-[0_0_20px_rgba(239,68,68,0.1)]' : ''}`}>
            <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-2">
                         <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                            task.category === 'Opening' ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' :
                            task.category === 'Closing' ? 'text-amber-500 border-amber-500/20 bg-amber-500/5' :
                            'text-sky-500 border-sky-500/20 bg-sky-500/5'
                         }`}>
                             {task.category}
                         </span>

                         {timeLeft && (
                             <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full flex items-center gap-1 border animate-in fade-in zoom-in duration-500 ${
                                 isOverdue ? 'bg-red-500 text-white border-red-500' : 'bg-primary/10 text-primary border-primary/20'
                             }`}>
                                 <span className="material-symbols-outlined text-[10px] font-black">
                                     {isOverdue ? 'priority_high' : 'schedule'}
                                 </span>
                                 {timeLeft}
                             </span>
                         )}

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
                category={task.category}
            />

            {/* History Details (Admin/Completed) */}
            {isCompleted && task.hasPhotoProof && (
                <div className="pt-5 border-t border-white/5 space-y-4">
                     <div 
                        className="w-full aspect-video rounded-[2rem] bg-slate-900 overflow-hidden border border-white/10 cursor-pointer group/thumb relative flex items-center justify-center" 
                        onClick={() => photoUrl && setIsImageFullscreen(true)}
                     >
                         {isLoadingPhoto ? (
                             <div className="flex flex-col items-center gap-2 opacity-40">
                                 <div className="size-6 border-2 border-primary/20 border-t-primary animate-spin rounded-full"></div>
                                 <span className="text-[8px] font-black uppercase tracking-widest">Memuat Foto...</span>
                             </div>
                         ) : photoUrl ? (
                             <>
                                 <img 
                                    src={getOptimizedImageUrl(photoUrl, { width: 400, height: 300 })} 
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover/thumb:scale-110" 
                                    alt="Bukti" 
                                 />
                                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-end p-4">
                                     <span className="text-[10px] text-white font-black uppercase tracking-widest flex items-center gap-2">
                                         <span className="material-symbols-outlined text-sm">visibility</span>
                                         Lihat Foto Full
                                     </span>
                                 </div>
                             </>
                         ) : (
                             <div className="flex flex-col items-center gap-2 opacity-40">
                                 <span className="material-symbols-outlined text-2xl">image_not_supported</span>
                                 <span className="text-[8px] font-black uppercase tracking-widest text-center px-4">Gagal memuat foto</span>
                             </div>
                         )}
                     </div>
                     <div className="flex justify-between items-end">
                         <div className="space-y-0.5">
                             <p className="text-[8px] font-black text-muted uppercase tracking-widest opacity-60">Selesai pada</p>
                             <p className="text-[10px] font-black text-main uppercase tracking-tight">{task.completionTime ? new Date(task.completionTime).toLocaleString('id-ID') : '-'}</p>
                         </div>
                         <div className="text-right space-y-0.5">
                             <p className="text-[8px] font-black text-muted uppercase tracking-widest opacity-60">Oleh</p>
                             <p className="text-[10px] font-black text-primary uppercase tracking-tight">{task.completedByName || 'Staf'}</p>
                         </div>
                     </div>
                </div>
            )}

            {/* Fullscreen Image Overlay */}
            {isImageFullscreen && photoUrl && createPortal(
                <div 
                    className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-300"
                    onClick={() => setIsImageFullscreen(false)}
                >
                    <div className="absolute top-0 inset-x-0 p-6 flex justify-end items-start z-50 bg-gradient-to-b from-black/60 to-transparent">
                        <button 
                            onClick={(e) => { e.stopPropagation(); setIsImageFullscreen(false); }}
                            className="size-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white active:scale-75 transition-all shadow-2xl"
                        >
                            <span className="material-symbols-outlined text-2xl font-black">close</span>
                        </button>
                    </div>
                    
                    <div className="relative w-full h-full max-w-5xl mx-auto flex items-center justify-center p-4">
                        <img 
                            src={getOptimizedImageUrl(photoUrl)} 
                            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-300" 
                            alt="Bukti Full" 
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
