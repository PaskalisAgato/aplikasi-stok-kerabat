import { db } from '../db/index.js';
import { todos, users } from '../db/schema.js';
import { eq, and, or, isNull, desc } from 'drizzle-orm';

export class TodoService {
    static async getAllTodos(role?: string, userId?: string) {
        if (role === 'Admin') {
            return await db.query.todos.findMany({
                orderBy: [desc(todos.createdAt)]
            });
        }
        
        // For Employees: Show pending tasks or tasks assigned to them
        return await db.query.todos.findMany({
            where: and(
                eq(todos.status, 'Pending'),
                or(
                    isNull(todos.assignedTo),
                    eq(todos.assignedTo, userId || '')
                )
            ),
            orderBy: [desc(todos.createdAt)]
        });
    }

    static async getHistory() {
        return await db.query.todos.findMany({
            where: eq(todos.status, 'Completed'),
            orderBy: [desc(todos.completionTime)]
        });
    }

    static async createTodo(data: any) {
        const [newTodo] = await db.insert(todos).values({
            ...data,
            createdAt: new Date()
        }).returning();
        return newTodo;
    }

    static async updateTodo(id: number, data: any) {
        const [updatedTodo] = await db.update(todos)
            .set({ ...data })
            .where(eq(todos.id, id))
            .returning();
        return updatedTodo;
    }

    static async completeTodo(id: number, userId: string, photoProof: string) {
        const [completedTodo] = await db.update(todos)
            .set({
                status: 'Completed',
                photoProof,
                completedBy: userId,
                completionTime: new Date()
            })
            .where(eq(todos.id, id))
            .returning();
        return completedTodo;
    }

    static async deleteTodo(id: number) {
        const [deletedTodo] = await db.delete(todos)
            .where(eq(todos.id, id))
            .returning();
        return deletedTodo;
    }

    static async clearHistory() {
        return await db.delete(todos)
            .where(eq(todos.status, 'Completed'))
            .returning();
    }
}
