export declare function useShifts(): {
    allShifts: any[];
    myShifts: any[];
    isLoading: boolean;
    error: Error | null;
    createShift: import("@tanstack/react-query").UseMutateAsyncFunction<any, Error, any, unknown>;
    updateShift: import("@tanstack/react-query").UseMutateAsyncFunction<any, Error, {
        id: number;
        data: any;
    }, unknown>;
    deleteShift: import("@tanstack/react-query").UseMutateAsyncFunction<any, Error, number, unknown>;
    isMutating: boolean;
};
