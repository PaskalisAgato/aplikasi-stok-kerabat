/**
 * Centralized Mock Database for Kerabat POS Stok System
 * Synchronizes data across all 13 monorepo applications.
 */
export interface InventoryItem {
    id: number;
    name: string;
    category: string;
    unit: string;
    currentStock: number;
    systemStock: number;
    minStock: number;
    supplier: string;
    status: 'NORMAL' | 'KRITIS' | 'HABIS';
    pricePerUnit: number;
    imageUrl?: string;
}
export interface Expense {
    id: number;
    title: string;
    category: 'Bahan Baku' | 'Operasional' | 'Pemeliharaan' | 'Lainnya';
    date: string;
    amount: number;
    imageUrl?: string;
}
export interface Employee {
    id: number;
    name: string;
    role: 'Owner' | 'Manager' | 'Barista' | 'Server';
    status: 'Aktif' | 'Cuti' | 'Off';
    lastActive: string;
    image: string;
}
export interface RecipeIngredient {
    ingredientId: number;
    name: string;
    qty: number;
    unit: string;
}
export interface Recipe {
    id: number;
    name: string;
    description: string;
    category: 'Minuman' | 'Makanan' | 'Snack';
    hpp: number;
    price: number;
    margin: number;
    ingredients: RecipeIngredient[];
    imageUrl?: string;
}
export declare const INVENTORY: InventoryItem[];
export declare const EXPENSES: Expense[];
export declare const EMPLOYEES: Employee[];
export declare const RECIPES: Recipe[];
