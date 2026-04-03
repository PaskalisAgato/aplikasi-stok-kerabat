
interface OverdueAlarmModalProps {
    tasks: any[];
    onSnooze: (id: number) => void;
    onStop: (id: number) => void;
    onComplete: (task: any) => void;
}

export default function OverdueAlarmModal({ tasks, onSnooze, onStop, onComplete }: OverdueAlarmModalProps) {
    if (tasks.length === 0) return null;

    const currentTask = tasks[0]; // Focus on the first overdue task

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-red-950/90 backdrop-blur-xl animate-pulse" />
            
            <div className="relative w-full max-w-lg bg-slate-900 rounded-[3rem] border-4 border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.5)] overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-10 flex flex-col items-center text-center space-y-8">
                    {/* Ringing Icon */}
                    <div className="size-24 rounded-full bg-red-500 flex items-center justify-center text-white animate-bounce shadow-[0_0_30px_rgba(239,68,68,0.8)]">
                        <span className="material-symbols-outlined text-5xl font-black">notifications_active</span>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-4xl font-black text-white uppercase tracking-tighter">TUGAS TERLAMBAT!</h2>
                        <p className="text-red-400 font-black uppercase tracking-[0.3em] text-[10px]">Peringatan Keamanan Operasional</p>
                    </div>

                    <div className="w-full p-6 bg-red-500/10 rounded-3xl border border-red-500/20">
                        <h3 className="text-2xl font-black text-white uppercase leading-tight">{currentTask.title}</h3>
                        <p className="text-red-400/60 text-xs font-bold mt-2 uppercase tracking-widest">
                            Deadline: {new Date(currentTask.deadline).toLocaleString('id-ID')}
                        </p>
                    </div>

                    {tasks.length > 1 && (
                        <p className="text-white/40 text-[10px] font-black uppercase tracking-widest italic">
                            + {tasks.length - 1} tugas lainnya juga terlambat
                        </p>
                    )}

                    <div className="grid grid-cols-1 w-full gap-4">
                        <input 
                            type="file" 
                            id={`alarm-gallery-${currentTask.id}`}
                            className="hidden" 
                            accept="image/*"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                    // Use a temporary callback pattern or just call onComplete if it handles base64
                                    // Actually, OverdueAlarmModal.onComplete expects the task object to open the camera modal
                                    // I'll modify the prop to optionally handle direct completion
                                    onComplete({ ...currentTask, photoProof: reader.result as string });
                                };
                                reader.readAsDataURL(file);
                            }}
                        />
                        {currentTask.photoUploadMode === 'both' ? (
                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={() => onComplete(currentTask)}
                                    className="h-20 bg-primary/20 hover:bg-primary/30 text-white rounded-[1.5rem] font-black uppercase tracking-widest flex flex-col items-center justify-center gap-1 transition-all active:scale-95 border border-primary/20"
                                >
                                    <span className="material-symbols-outlined text-3xl font-black">photo_camera</span>
                                    <span className="text-[10px]">Kamera</span>
                                </button>
                                <button 
                                    onClick={() => document.getElementById(`alarm-gallery-${currentTask.id}`)?.click()}
                                    className="h-20 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-500 rounded-[1.5rem] font-black uppercase tracking-widest flex flex-col items-center justify-center gap-1 transition-all active:scale-95 border border-emerald-500/20"
                                >
                                    <span className="material-symbols-outlined text-3xl font-black">photo_library</span>
                                    <span className="text-[10px]">Galeri</span>
                                </button>
                            </div>
                        ) : (
                            <button 
                                onClick={() => {
                                    if (currentTask.photoUploadMode === 'gallery') {
                                        document.getElementById(`alarm-gallery-${currentTask.id}`)?.click();
                                    } else {
                                        onComplete(currentTask);
                                    }
                                }}
                                className="h-20 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-[1.5rem] font-black uppercase tracking-widest flex items-center justify-center gap-4 transition-all active:scale-95 shadow-xl"
                            >
                                <span className="material-symbols-outlined text-3xl font-black">
                                    {currentTask.photoUploadMode === 'gallery' ? 'photo_library' : 'photo_camera'}
                                </span>
                                {currentTask.photoUploadMode === 'gallery' ? 'Upload Dari Galeri' : 'Ambil Foto Bukti'}
                            </button>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => onSnooze(currentTask.id)}
                                className="h-16 bg-white/10 hover:bg-white/20 text-white rounded-[1.5rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 border border-white/10"
                            >
                                <span className="material-symbols-outlined text-xl">snooze</span>
                                Snooze
                            </button>
                            <button 
                                onClick={() => onStop(currentTask.id)}
                                className="h-16 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded-[1.5rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 border border-red-500/20"
                            >
                                <span className="material-symbols-outlined text-xl">notifications_off</span>
                                Matikan
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
