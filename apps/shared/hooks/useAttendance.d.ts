export declare function useAttendance(filters?: any): {
    todayAttendance: any;
    history: any[];
    isLoading: boolean;
    isActionLoading: boolean;
    error: Error | null;
    checkIn: import("@tanstack/react-query").UseMutateAsyncFunction<any, Error, {
        photo?: File | Blob;
        latitude?: number;
        longitude?: number;
        location?: string;
    }, unknown>;
    checkOut: import("@tanstack/react-query").UseMutateAsyncFunction<any, Error, {
        photo?: File | Blob;
        latitude?: number;
        longitude?: number;
        location?: string;
    }, unknown>;
    deleteRecord: import("@tanstack/react-query").UseMutateAsyncFunction<any, Error, string | number, unknown>;
    deleteByRange: import("@tanstack/react-query").UseMutateAsyncFunction<any, Error, {
        startDate: string;
        endDate: string;
    }, unknown>;
};
