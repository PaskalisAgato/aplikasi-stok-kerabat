import { db } from '../db/index.js';
import { todos, users, todoCompletions, todoSettings } from '../db/schema.js';
import { eq, and, or, isNull, desc, gte, sql } from 'drizzle-orm';

export class TodoService {
    static async getAllTodos(role?: string, userId?: string) {
        // Get Jakarta time (UTC+7) start of day
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        // Fetch all relevant todos (Limit 100 for safety)
        const allTodos = await db.query.todos.findMany({
            where: and(
                eq(todos.status, 'Pending'),
                or(isNull(todos.nextRunAt), sql`${todos.nextRunAt} <= ${now}`),
                role === 'Admin' ? undefined : or(
                    isNull(todos.assignedTo),
                    eq(todos.assignedTo, userId || '')
                )
            ),
            orderBy: [desc(todos.createdAt)],
            limit: 100
        });

        // Fetch today's completions
        const completions = await db.query.todoCompletions.findMany({
            where: gte(todoCompletions.completionTime, startOfDay),
        });

        const completionMap = new Map(completions.map(c => [c.todoId, c]));

        // Merge logic
        return allTodos.map(todo => {
            const completion = completionMap.get(todo.id);
            if (todo.isRecurring) {
                return {
                    ...todo,
                    status: completion ? 'Completed' : 'Pending',
                    hasPhotoProof: !!completion?.photoProof,
                    completionId: completion?.id || null,
                    completionTime: completion?.completionTime || null,
                    completedBy: completion?.completedBy || null
                };
            }
            return {
                ...todo,
                hasPhotoProof: !!todo.photoProof
            };
        });
    }

    static async getHistory(limit = 10, offset = 0) {
        // For history, we want all non-recurring completed tasks 
        // PLUS all entries from todoCompletions (for recurring tasks)
        
        // 1. Get counts for both
        const [onceOffCount] = await db.select({ count: sql<number>`count(*)` })
            .from(todos)
            .where(and(eq(todos.status, 'Completed'), eq(todos.isRecurring, false)));
            
        const [recurringCount] = await db.select({ count: sql<number>`count(*)` })
            .from(todoCompletions);

        const total = (Number(onceOffCount?.count) || 0) + (Number(recurringCount?.count) || 0);

        // 2. Fetch data using robust RAW SQL to avoid Drizzle union mapping issues
        const query = sql`
            SELECT 
                t.id, t.title, t.description, t.category, 
                'Completed' as status, 
                t.assigned_to as "assignedTo", 
                t.created_by as "createdBy", 
                t.is_recurring as "isRecurring", 
                t.interval_type as "intervalType", 
                t.interval_value as "intervalValue", 
                t.next_run_at as "nextRunAt", 
                t.deadline, 
                CASE WHEN (tc.photo_proof IS NOT NULL OR t.photo_proof IS NOT NULL) THEN true ELSE false END as "hasPhotoProof", 
                COALESCE(tc.completion_time, t.completion_time) as "completionTime", 
                COALESCE(tc.completed_by, t.completed_by) as "completedBy", 
                t.created_at as "createdAt",
                tc.id as "completionId",
                COALESCE(tc.photo_proof, t.photo_proof) as "photoProof"
            FROM ${todos} t
            LEFT JOIN ${todoCompletions} tc ON t.id = tc.todo_id
            WHERE (t.status = 'Completed' AND t.is_recurring = false)
               OR (t.is_recurring = true AND tc.id IS NOT NULL)
            ORDER BY "completionTime" DESC
            LIMIT ${limit}
            OFFSET ${offset}
        `;

        const result = await db.execute(query);
        const rows = (result as any).rows || result;

        return {
            items: rows,
            total
        };
    }

    static async createTodo(data: any) {
        const [newTodo] = await db.insert(todos).values({
            ...data,
            deadline: data.deadline ? new Date(data.deadline) : null,
            createdAt: new Date()
        }).returning();
        return newTodo;
    }

    static async updateTodo(id: number, data: any) {
        const updateData = { ...data };
        if (data.deadline) {
            updateData.deadline = new Date(data.deadline);
        }
        if (data.nextRunAt) {
            updateData.nextRunAt = new Date(data.nextRunAt);
        }

        const [updatedTodo] = await db.update(todos)
            .set(updateData)
            .where(eq(todos.id, id))
            .returning();
        return updatedTodo;
    }

    static async completeTodo(id: number, userId: string, photoProof: string) {
        const todo = await db.query.todos.findFirst({ where: eq(todos.id, id) });
        if (!todo) throw new Error('Task not found');

        // Capture completion time
        const now = new Date();

        if (todo.isRecurring) {
            // Check if already completed today (for legacy isRecurring logic)
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const existing = await db.query.todoCompletions.findFirst({
                where: and(
                    eq(todoCompletions.todoId, id),
                    gte(todoCompletions.completionTime, startOfDay)
                )
            });

            if (existing) return existing;

            // 1. Record completion in todoCompletions (for history)
            const [completion] = await db.insert(todoCompletions).values({
                todoId: id,
                completedBy: userId,
                photoProof,
                completionTime: now
            }).returning();

            // 2. Generate the NEXT task instance
            if (todo.isRecurring && todo.intervalType) {
                const nextRun = this.calculateNextRun(
                    todo.nextRunAt || now, 
                    todo.intervalType as any, 
                    todo.intervalValue || 1
                );

                await db.insert(todos).values({
                    title: todo.title,
                    description: todo.description,
                    category: todo.category,
                    assignedTo: todo.assignedTo,
                    createdBy: todo.createdBy,
                    intervalType: todo.intervalType,
                    intervalValue: todo.intervalValue,
                    nextRunAt: nextRun,
                    photoUploadMode: todo.photoUploadMode,
                    status: 'Pending',
                    createdAt: now
                });

                // Also update the current task to 'Completed' so it leaves the active list
                await db.update(todos)
                    .set({ status: 'Completed', completionTime: now, completedBy: userId, photoProof })
                    .where(eq(todos.id, id));
            }

            return completion;
        } else {
            const [completedTodo] = await db.update(todos)
                .set({
                    status: 'Completed',
                    photoProof,
                    completedBy: userId,
                    completionTime: now
                })
                .where(eq(todos.id, id))
                .returning();
            return completedTodo;
        }
    }

    static calculateNextRun(current: Date, type: 'daily' | 'weekly' | 'monthly' | 'custom', value: number): Date {
        const next = new Date(current);
        switch (type) {
            case 'daily':
                next.setDate(next.getDate() + value);
                break;
            case 'weekly':
                next.setDate(next.getDate() + (value * 7));
                break;
            case 'monthly':
                next.setMonth(next.getMonth() + value);
                break;
            case 'custom':
                next.setDate(next.getDate() + value); // Assume custom uses days as default value
                break;
        }
        return next;
    }

    static async deleteTodo(id: number) {
        const [deletedTodo] = await db.delete(todos)
            .where(eq(todos.id, id))
            .returning();
        return deletedTodo;
    }

    static async getTodoPhoto(id: number) {
        const todo = await db.query.todos.findFirst({
            where: eq(todos.id, id),
            columns: { photoProof: true }
        });
        return todo?.photoProof;
    }

    static async getCompletionPhoto(id: number) {
        const completion = await db.query.todoCompletions.findFirst({
            where: eq(todoCompletions.id, id),
            columns: { photoProof: true }
        });
        return completion?.photoProof;
    }

    static async clearHistory() {
        // Clear non-recurring history
        await db.update(todos)
            .set({ status: 'Pending', photoProof: null, completionTime: null, completedBy: null })
            .where(eq(todos.status, 'Completed'));

        // Clear recurring history (No .returning() to avoid massive payload/memory issues)
        await db.delete(todoCompletions);
    }

    static async getSettings() {
        const settings = await db.select().from(todoSettings);
        // Default values if empty
        if (settings.length === 0) {
            return [{ settingKey: 'photo_upload_mode', settingValue: 'both' }];
        }
        return settings;
    }

    static async updateSetting(key: string, value: string) {
        const [setting] = await db.insert(todoSettings)
            .values({
                settingKey: key,
                settingValue: value,
                updatedAt: new Date()
            })
            .onConflictDoUpdate({
                target: todoSettings.settingKey,
                set: {
                    settingValue: value,
                    updatedAt: new Date()
                }
            })
            .returning();
        return setting;
    }
}
