import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import CameraCaptureModal from './CameraCaptureModal';
import { apiClient } from '@shared/apiClient';
import { getOptimizedImageUrl } from '@shared/supabase';

interface TaskCardProps {
    task: any;
    role: 'Admin' | 'Karyawan';
    photoUploadMode?: 'camera' | 'gallery' | 'both';
    onComplete?: (id: number, photo: string | string[]) => void;
    onEdit?: (task: any) => void;
    onDelete?: (id: number) => void;
}

export default function TaskCard({ task, role, photoUploadMode = 'both', onComplete, onEdit, onDelete }: TaskCardProps) {
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [timeLeft, setTimeLeft] = useState<string | null>(null);
    const [isOverdue, setIsOverdue] = useState(false);
    const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
    const [photoUrls, setPhotoUrls] = useState<string[]>([]);
    const [isLoadingPhoto, setIsLoadingPhoto] = useState(false);
    const [imageFullscreenIndex, setImageFullscreenIndex] = useState<number | null>(null);

    // Scroll Lock Logic for Fullscreen Image
    useEffect(() => {
        if (imageFullscreenIndex !== null) {
            const originalStyle = window.getComputedStyle(document.body).overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = originalStyle;
            };
        }
    }, [imageFullscreenIndex]);
    
    useEffect(() => {
        if (task.status === 'Completed' && task.hasPhotoProof && photoUrls.length === 0 && !isLoadingPhoto) {
            const fetchPhoto = async () => {
                setIsLoadingPhoto(true);
                try {
                    const id = task.isRecurring ? task.completionId : task.id;
                    const type = task.isRecurring ? 'completion' : 'todo';
                    const res = await apiClient.getTodoPhoto(id, type);
                    if (res?.data) {
                        const data = res.data;
                        if (Array.isArray(data)) {
                            setPhotoUrls(data);
                        } else if (typeof data === 'string') {
                            setPhotoUrls([data]);
                        }
                    }
                } catch (error) {
                    console.error('Failed to fetch photo', error);
                } finally {
                    setIsLoadingPhoto(false);
                }
            };
            fetchPhoto();
        }
    }, [task.status, task.hasPhotoProof, task.id, task.completionId, task.isRecurring, photoUrls.length]);

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
        setIsCameraOpen(false);
        setSelectedPhotos(prev => [...prev, base64]);
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

            {/* Gallery Upload - Always visible for Karyawan */}
            {role === 'Karyawan' && (
                <div className="pt-4 border-t border-white/5 flex flex-col gap-3">
                    <input 
                        type="file" 
                        id={`gallery-${task.id}`}
                        className="hidden" 
                        accept="image/jpeg, image/png, image/jpg"
                        multiple
                        onChange={async (e) => {
                            const files = Array.from(e.target.files || []);
                            if (files.length === 0) return;

                            const validFiles = files.filter(file => {
                                if (file.size > 2 * 1024 * 1024) {
                                    alert(`Ukuran file ${file.name} melebihi 2MB.`);
                                    return false;
                                }
                                if (!file.type.match(/image\/(jpeg|png|jpg)/)) {
                                    alert(`Format file ${file.name} tidak didukung. Gunakan JPG atau PNG.`);
                                    return false;
                                }
                                return true;
                            });

                            const base64Promises = validFiles.map(file => {
                                return new Promise<string>((resolve, reject) => {
                                    const reader = new FileReader();
                                    reader.onloadend = () => resolve(reader.result as string);
                                    reader.onerror = reject;
                                    reader.readAsDataURL(file);
                                });
                            });

                            try {
                                const base64s = await Promise.all(base64Promises);
                                setSelectedPhotos(prev => [...prev, ...base64s]);
                            } catch (error) {
                                console.error(error);
                            }
                            
                            e.target.value = '';
                        }}
                    />

                    {selectedPhotos.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                            {selectedPhotos.map((photo, index) => (
                                <div key={index} className="relative aspect-square rounded-xl bg-slate-900 border border-white/10 overflow-hidden group">
                                    <img src={photo} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                                    <button 
                                        onClick={() => setSelectedPhotos(prev => prev.filter((_, i) => i !== index))}
                                        className="absolute top-1 right-1 size-6 bg-black/60 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-red-500/80 transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <span className="material-symbols-outlined text-[10px] font-black">close</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Camera / Gallery mode buttons — only when task is not yet completed */}
                    {!isCompleted && (
                        <>
                            {photoUploadMode === 'both' ? (
                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        onClick={() => setIsCameraOpen(true)}
                                        disabled={isUploading}
                                        className={`h-12 rounded-xl flex items-center justify-center gap-2 transition-all border-2 border-dashed ${isUploading ? 'opacity-50 grayscale' : 'bg-white/5 border-white/10 hover:border-primary/40 hover:bg-primary/5'}`}
                                    >
                                        <span className="material-symbols-outlined text-primary text-xl font-black">photo_camera</span>
                                        <span className="text-[9px] font-black uppercase tracking-tight text-primary">KAMERA</span>
                                    </button>
                                    <button 
                                        onClick={() => document.getElementById(`gallery-${task.id}`)?.click()}
                                        disabled={isUploading}
                                        className={`h-12 rounded-xl flex items-center justify-center gap-2 transition-all border-2 border-dashed ${isUploading ? 'opacity-50 grayscale' : 'bg-white/5 border-white/10 hover:border-emerald-500/40 hover:bg-emerald-500/5'}`}
                                    >
                                        <span className="material-symbols-outlined text-emerald-500 text-xl font-black">photo_library</span>
                                        <span className="text-[9px] font-black uppercase tracking-tight text-emerald-500">GALERI</span>
                                    </button>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => {
                                        if (photoUploadMode === 'gallery') {
                                            document.getElementById(`gallery-${task.id}`)?.click();
                                        } else {
                                            setIsCameraOpen(true);
                                        }
                                    }}
                                    disabled={isUploading}
                                    className={`w-full h-12 rounded-xl flex items-center justify-center gap-3 transition-all border-2 border-dashed ${isUploading ? 'bg-primary/5 border-primary/40 animate-pulse' : 'bg-white/5 border-white/10 hover:border-primary/40 hover:bg-primary/5'}`}
                                >
                                    <span className="material-symbols-outlined text-primary text-xl font-black">
                                        {isUploading ? 'hourglass_empty' : 
                                         photoUploadMode === 'camera' ? 'photo_camera' : 
                                         'photo_library'}
                                    </span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                                        {isUploading ? 'Mengunggah...' : 
                                         photoUploadMode === 'camera' ? 'AMBIL KAMERA' : 
                                         'PILIH GALERI'}
                                    </span>
                                </button>
                            )}
                        </>
                    )}

                    {/* Always show gallery button when task is completed (for re-upload or additional proof) */}
                    {isCompleted && (
                        <button 
                            onClick={() => document.getElementById(`gallery-${task.id}`)?.click()}
                            disabled={isUploading}
                            className="w-full h-10 rounded-xl flex items-center justify-center gap-2 transition-all border-2 border-dashed bg-white/5 border-white/10 hover:border-emerald-500/40 hover:bg-emerald-500/5"
                        >
                            <span className="material-symbols-outlined text-emerald-500 text-lg font-black">photo_library</span>
                            <span className="text-[9px] font-black uppercase tracking-tight text-emerald-500">UPLOAD GALERI</span>
                        </button>
                    )}

                    {selectedPhotos.length > 0 && (
                        <button 
                            onClick={async () => {
                                if (!onComplete) return;
                                setIsUploading(true);
                                try {
                                    await onComplete(task.id, selectedPhotos);
                                    setSelectedPhotos([]);
                                } catch (e) {
                                    // error handled by parent
                                } finally {
                                    setIsUploading(false);
                                }
                            }}
                            disabled={isUploading}
                            className={`w-full h-12 ${isUploading ? 'bg-primary/50' : 'bg-primary'} text-slate-950 font-black uppercase tracking-widest rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary/20`}
                        >
                            {isUploading ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin text-lg">sync</span>
                                    MENGUNGGAH...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-lg">check_circle</span>
                                    SIMPAN & SELESAI
                                </>
                            )}
                        </button>
                    )}
                </div>
            )}

            <CameraCaptureModal 
                isOpen={isCameraOpen}
                onClose={() => setIsCameraOpen(false)}
                onCapture={handleCapture}
                category={task.category}
                photoUploadMode={photoUploadMode}
            />

            {/* History Details (Admin/Completed) */}
            {isCompleted && task.hasPhotoProof && (
                <div className="pt-5 border-t border-white/5 space-y-4">
                     <div className="grid grid-cols-2 gap-2">
                         {isLoadingPhoto ? (
                             <div className="col-span-full flex flex-col items-center gap-2 opacity-40 p-4">
                                 <div className="size-6 border-2 border-primary/20 border-t-primary animate-spin rounded-full"></div>
                                 <span className="text-[8px] font-black uppercase tracking-widest">Memuat Foto...</span>
                             </div>
                         ) : photoUrls.length > 0 ? (
                             photoUrls.map((url, idx) => (
                                 <div 
                                    key={idx}
                                    onClick={() => setImageFullscreenIndex(idx)}
                                    className="w-full aspect-video rounded-xl bg-slate-900 overflow-hidden border border-white/10 cursor-pointer group/thumb relative flex items-center justify-center" 
                                 >
                                     <img 
                                        src={getOptimizedImageUrl(url, { width: 400, height: 300 })} 
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover/thumb:scale-110" 
                                        alt={`Bukti ${idx + 1}`} 
                                     />
                                     <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-end p-2">
                                         <span className="text-[8px] text-white font-black uppercase tracking-widest flex items-center gap-1">
                                             <span className="material-symbols-outlined text-[10px]">visibility</span>
                                             Lihat
                                         </span>
                                     </div>
                                 </div>
                             ))
                         ) : (
                             <div className="col-span-full flex flex-col items-center gap-2 opacity-40 p-4">
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
            {imageFullscreenIndex !== null && photoUrls[imageFullscreenIndex] && createPortal(
                <div 
                    className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-300"
                    onClick={() => setImageFullscreenIndex(null)}
                >
                    <div className="absolute top-0 inset-x-0 p-6 flex justify-end items-start z-50 bg-gradient-to-b from-black/60 to-transparent">
                        <button 
                            onClick={(e) => { e.stopPropagation(); setImageFullscreenIndex(null); }}
                            className="size-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white active:scale-75 transition-all shadow-2xl"
                        >
                            <span className="material-symbols-outlined text-2xl font-black">close</span>
                        </button>
                    </div>
                    
                    <div className="relative w-full h-full max-w-5xl mx-auto flex items-center justify-center p-4">
                        <img 
                            src={getOptimizedImageUrl(photoUrls[imageFullscreenIndex])} 
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
