import { useState, useEffect, useRef } from 'react';

const ALARM_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3';

export default function useTaskAlarm(todos: any[]) {
    const [overdueTasks, setOverdueTasks] = useState<any[]>([]);
    const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const snoozedUntilRef = useRef<Record<number, number>>({});
    const stoppedTasksRef = useRef<Set<number>>(new Set());

    const startAlarm = () => {
        if (audioRef.current && audioRef.current.paused) {
            audioRef.current.play().catch(err => console.log("Audio play blocked", err));
            setIsAlarmPlaying(true);
            if (navigator.vibrate) {
                navigator.vibrate([500, 200, 500, 200, 500]);
            }
        }
    };

    const stopAlarm = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setIsAlarmPlaying(false);
            if (navigator.vibrate) {
                navigator.vibrate(0);
            }
        }
    };

    const checkDeadlines = () => {
        const nowDate = new Date();
        const now = nowDate.getTime();
        const activeOverdue = todos.filter(task => {
            if (task.status === 'Completed' || !task.deadline) return false;
            
            const deadlineDate = new Date(task.deadline);
            if (task.isRecurring) {
                deadlineDate.setFullYear(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate());
                // If deadline time already passed today, shift to tomorrow (next occurrence)
                if (deadlineDate.getTime() <= now) {
                    deadlineDate.setDate(deadlineDate.getDate() + 1);
                }
            }
            const deadlineTime = deadlineDate.getTime();
            const isLate = now > deadlineTime;
            
            if (!isLate) return false;

            // Check if snoozed
            const snoozedUntil = snoozedUntilRef.current[task.id];
            if (snoozedUntil && now < snoozedUntil) return false;

            // Check if manually stopped for this session
            if (stoppedTasksRef.current.has(task.id)) return false;

            return true;
        });

        setOverdueTasks(activeOverdue);

        if (activeOverdue.length > 0) {
            if (!isAlarmPlaying) {
                startAlarm();
            }
        } else {
            if (isAlarmPlaying) {
                stopAlarm();
            }
        }
    };

    useEffect(() => {
        audioRef.current = new Audio(ALARM_SOUND_URL);
        audioRef.current.loop = true;

        const interval = setInterval(checkDeadlines, 5000);
        checkDeadlines();

        return () => {
            clearInterval(interval);
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, [todos]); // Only re-run when todos list changes

    const snoozeTask = (taskId: number) => {
        snoozedUntilRef.current[taskId] = new Date().getTime() + 5 * 60 * 1000; // 5 mins
        checkDeadlines();
    };

    const stopTaskAlarm = (taskId: number) => {
        stoppedTasksRef.current.add(taskId);
        checkDeadlines();
    };

    return {
        overdueTasks,
        isAlarmPlaying,
        snoozeTask,
        stopTaskAlarm,
        stopAlarm
    };
}
