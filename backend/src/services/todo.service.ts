import { db } from '../db/index.js';
import { todos, users, todoCompletions } from '../db/schema.js';
import { eq, and, or, isNull, desc, gte, sql } from 'drizzle-orm';

export class TodoService {
    static async getAllTodos(role?: string, userId?: string) {
        // Get Jakarta time (UTC+7) start of day
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        // Fetch all relevant todos
        const allTodos = await db.query.todos.findMany({
            where: and(
                eq(todos.status, 'Pending'),
                or(isNull(todos.nextRunAt), sql`${todos.nextRunAt} <= ${now}`),
                role === 'Admin' ? undefined : or(
                    isNull(todos.assignedTo),
                    eq(todos.assignedTo, userId || '')
                )
            ),
            orderBy: [desc(todos.createdAt)]
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
                    photoProof: completion?.photoProof || null,
                    completionTime: completion?.completionTime || null,
                    completedBy: completion?.completedBy || null
                };
            }
            return todo;
        });
    }

    static async getHistory() {
        // For history, we want all non-recurring completed tasks 
        // PLUS all entries from todoCompletions (for recurring tasks)
        const onceOffCompleted = await db.query.todos.findMany({
            where: and(eq(todos.status, 'Completed'), eq(todos.isRecurring, false)),
            orderBy: [desc(todos.completionTime)]
        });

        const recurringCompletions = await db.query.todoCompletions.findMany({
            with: {
                todo: true
            },
            orderBy: [desc(todoCompletions.completionTime)]
        });

        // Map recurring completions to task-like objects
        const recurringHistory = recurringCompletions.map(c => ({
            ...(c.todo as any),
            status: 'Completed',
            photoProof: c.photoProof,
            completionTime: c.completionTime,
            completedBy: c.completedBy,
            id: c.todoId // Use original todo ID for UI consistency
        }));

        return [...onceOffCompleted, ...recurringHistory].sort((a, b) => 
            new Date(b.completionTime!).getTime() - new Date(a.completionTime!).getTime()
        );
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

    static async clearHistory() {
        // Clear non-recurring history
        await db.update(todos)
            .set({ status: 'Pending', photoProof: null, completionTime: null, completedBy: null })
            .where(eq(todos.status, 'Completed'));

        // Clear recurring history
        return await db.delete(todoCompletions).returning();
    }
}
