export default function useTaskAlarm(todos: any[]): {
    overdueTasks: any[];
    isAlarmPlaying: boolean;
    snoozeTask: (taskId: number) => void;
    stopTaskAlarm: (taskId: number) => void;
    stopAlarm: () => void;
};
