import { useState, useEffect } from 'react';
import Layout from '@shared/Layout';
import { apiClient } from '@shared/apiClient';
import { useSession } from '@shared/authClient';
import TaskCard from './components/TaskCard';
import CreateTaskModal from './components/CreateTaskModal';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import CameraCaptureModal from './components/CameraCaptureModal';
import OverdueAlarmModal from './components/OverdueAlarmModal';
import { toast } from 'react-hot-toast';
import useTaskAlarm from './hooks/useTaskAlarm';

function App() {
    const { data: session } = useSession();
    const role = (session?.user?.role as 'Admin' | 'Karyawan') || 'Karyawan';

    const [todos, setTodos] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'Opening' | 'Closing' | 'Request' | 'History'>('Opening');
    const [isLoading, setIsLoading] = useState(true);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isClearHistoryOpen, setIsClearHistoryOpen] = useState(false);
    const [isAlarmCameraOpen, setIsAlarmCameraOpen] = useState(false);
    
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [taskIdToDelete, setTaskIdToDelete] = useState<number | null>(null);
    const [alarmTask, setAlarmTask] = useState<any>(null);

    const { overdueTasks, snoozeTask, stopTaskAlarm } = useTaskAlarm(todos);

    const [historyPage, setHistoryPage] = useState(1);
    const [hasMoreHistory, setHasMoreHistory] = useState(false);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);

    const fetchTodos = async () => {
        try {
            setIsLoading(true);
            const response = await apiClient.getTodos();
            setTodos(response.data);
            
            // Only fetch first page of history once or when explicitly needed
            if (role === 'Admin' && history.length === 0) {
                fetchHistory(1, true);
            }
        } catch (error) {
            console.error('Fetch failed', error);
            toast.error('Gagal memuat daftar tugas.');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchHistory = async (page: number, replace = false) => {
        if (role !== 'Admin') return;
        try {
            setIsHistoryLoading(true);
            const response = await apiClient.getTodoHistory(page, 20);
            if (replace) {
                setHistory(response.data);
            } else {
                setHistory(prev => [...prev, ...response.data]);
            }
            setHistoryPage(page);
            setHasMoreHistory(response.data.length === 20 && (page * 20) < response.meta.total);
        } catch (error) {
            console.error('History fetch failed', error);
            toast.error('Gagal memuat riwayat.');
        } finally {
            setIsHistoryLoading(false);
        }
    };

    useEffect(() => {
        fetchTodos();
    }, [role]);

    const handleLoadMore = () => {
        fetchHistory(historyPage + 1);
    };

    const handleCreateOrUpdate = async (data: any) => {
        try {
            if (selectedTask) {
                await apiClient.updateTodo(selectedTask.id, data);
                toast.success('Tugas berhasil diperbarui!');
            } else {
                await apiClient.createTodo(data);
                toast.success('Tugas baru ditambahkan!');
            }
            setIsCreateModalOpen(false);
            setSelectedTask(null);
            fetchTodos();
        } catch (error) {
            toast.error('Gagal menyimpan tugas.');
        }
    };

    const handleDelete = async () => {
        if (taskIdToDelete === null) return;
        try {
            await apiClient.deleteTodo(taskIdToDelete);
            toast.success('Tugas dihapus.');
            setIsDeleteModalOpen(false);
            setTaskIdToDelete(null);
            fetchTodos();
        } catch (error) {
            toast.error('Gagal menghapus tugas.');
        }
    };

    const handleComplete = async (id: number, photo: string) => {
        try {
            // Backend middleware validateBase64Image('photoProof') will handle Cloudinary
            await apiClient.completeTodo(id, photo);
            toast.success('Tugas selesai! Kerja bagus ✨');
            fetchTodos();
            // Refresh first page of history to show the new completion
            if (role === 'Admin') fetchHistory(1, true);
        } catch (error) {
            console.error('Complete todo failed', error);
            toast.error('Gagal menyelesaikan tugas.');
        }
    };

    const handleClearHistory = async () => {
        try {
            await apiClient.clearTodoHistory();
            toast.success('Seluruh riwayat dibersihkan.');
            setIsClearHistoryOpen(false);
            setHistory([]);
            setHistoryPage(1);
            setHasMoreHistory(false);
        } catch (error) {
            toast.error('Gagal membersihkan riwayat.');
        }
    };

    const filteredTasks = activeTab === 'History' 
        ? history 
        : todos.filter(t => t.category === activeTab && t.status !== 'Completed');

    const categories = ['Opening', 'Closing', 'Request'];
    if (role === 'Admin') categories.push('History');

    return (
        <Layout
            currentPort={5191}
            title="Daftar Tugas"
            subtitle={`${role} Dashboard`}
            footer={role === 'Admin' && (
                <footer className="glass border-t border-white/5 p-8 shrink-0 flex gap-4">
                    <button
                        onClick={() => { setSelectedTask(null); setIsCreateModalOpen(true); }}
                        className="flex-1 flex items-center justify-center gap-4 accent-gradient text-slate-950 px-10 py-5 rounded-[2rem] shadow-2xl shadow-primary/20 active:scale-95 transition-all border-none group"
                    >
                        <span className="material-symbols-outlined text-3xl font-black group-hover:rotate-12 transition-transform">add_circle</span>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em]">Tambah Tugas Baru</span>
                    </button>
                    {activeTab === 'History' && history.length > 0 && (
                        <button
                            onClick={() => setIsClearHistoryOpen(true)}
                            className="glass text-red-500 px-8 py-5 rounded-[2rem] flex items-center justify-center gap-3 hover:bg-red-500/10 transition-all active:scale-95"
                        >
                            <span className="material-symbols-outlined text-2xl font-black">delete_sweep</span>
                            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Bersihkan</span>
                        </button>
                    )}
                </footer>
            )}
        >
            <div className="space-y-8 pb-32">
                {/* Custom Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-none sticky top-0 z-10 bg-[var(--bg-app)]/80 backdrop-blur-sm py-4">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveTab(cat as any)}
                            className={`px-6 py-3 rounded-2xl text-[10px] uppercase font-black tracking-widest transition-all active:scale-90 border whitespace-nowrap ${activeTab === cat
                                ? 'bg-primary/20 border-primary text-primary shadow-xl shadow-primary/10'
                                : 'glass text-muted border-white/5 hover:bg-primary/10 opacity-60'
                                }`}
                        >
                            {cat === 'Request' ? 'Permintaan Admin' : cat}
                        </button>
                    ))}
                </div>

                {isLoading ? (
                    <div className="flex flex-col justify-center items-center py-20 gap-6 opacity-60">
                        <div className="size-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Memuat Tugas...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                        {filteredTasks.length === 0 ? (
                            <div className="col-span-full py-32 flex flex-col items-center justify-center glass rounded-[3rem] opacity-40 border-dashed border-2">
                                <span className="material-symbols-outlined text-7xl text-primary font-black mb-6">task_alt</span>
                                <h3 className="text-xl font-black uppercase tracking-[0.2em] text-main">Tugas Selesai!</h3>
                                <p className="text-[10px] uppercase tracking-widest mt-2 opacity-60 italic text-center px-8">Tidak ada tugas tertunda di kategori ini.</p>
                            </div>
                        ) : (
                            filteredTasks.map(task => (
                                <TaskCard 
                                    key={task.id} 
                                    task={task} 
                                    role={role}
                                    photoUploadMode={task.photoUploadMode}
                                    onEdit={(t) => { setSelectedTask(t); setIsCreateModalOpen(true); }}
                                    onDelete={(id) => { setTaskIdToDelete(id); setIsDeleteModalOpen(true); }}
                                    onComplete={handleComplete}
                                />
                            ))
                        )}

                        {activeTab === 'History' && hasMoreHistory && (
                            <div className="col-span-full flex justify-center pt-8">
                                <button
                                    onClick={handleLoadMore}
                                    disabled={isHistoryLoading}
                                    className="glass px-12 py-4 rounded-full border border-white/10 hover:bg-white/5 active:scale-95 transition-all flex items-center gap-3 group disabled:opacity-50"
                                >
                                    {isHistoryLoading ? (
                                        <div className="size-4 border-2 border-primary/20 border-t-primary animate-spin rounded-full"></div>
                                    ) : (
                                        <span className="material-symbols-outlined text-primary group-hover:rotate-180 transition-transform">refresh</span>
                                    )}
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                                        {isHistoryLoading ? 'Memuat...' : 'Muat Lebih Banyak'}
                                    </span>
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modals */}
            <CreateTaskModal 
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSave={handleCreateOrUpdate}
                task={selectedTask}
            />

            <DeleteConfirmationModal 
                isOpen={isDeleteModalOpen}
                title="Hapus Tugas?"
                message="Apakah Anda yakin ingin menghapus tugas ini secara permanen?"
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
            />

            <DeleteConfirmationModal 
                isOpen={isClearHistoryOpen}
                title="Bersihkan Riwayat?"
                message="Semua riwayat tugas yang sudah selesai akan dihapus secara permanen. Lanjutkan?"
                onClose={() => setIsClearHistoryOpen(false)}
                onConfirm={handleClearHistory}
            />

            <OverdueAlarmModal 
                tasks={overdueTasks}
                onSnooze={snoozeTask}
                onStop={stopTaskAlarm}
                onComplete={(task) => {
                    setAlarmTask(task);
                    setIsAlarmCameraOpen(true);
                }}
            />

            <CameraCaptureModal 
                isOpen={isAlarmCameraOpen}
                onClose={() => setIsAlarmCameraOpen(false)}
                onCapture={(base64) => {
                    if (alarmTask) {
                        handleComplete(alarmTask.id, base64);
                        setIsAlarmCameraOpen(false);
                    }
                }}
                userName={session?.user?.name || undefined}
                category={alarmTask?.category}
                photoUploadMode={alarmTask?.photoUploadMode}
            />
        </Layout>
    );
}

export default App;
