// src/shared/apiClient.ts
// Centralized API utility for all Kerabat POS Monorepo apps

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const apiClient = {
    // ---- INVENTORY ENPOINTS ----
    getInventory: async () => {
        const res = await fetch(`${API_BASE_URL}/inventory`);
        if (!res.ok) throw new Error('Failed to fetch inventory');
        return res.json();
    },

    getItemMovements: async (id: number) => {
        const res = await fetch(`${API_BASE_URL}/inventory/${id}/movements`);
        if (!res.ok) throw new Error('Failed to fetch item movements');
        return res.json();
    },

    addInventoryItem: async (data: any) => {
        const res = await fetch(`${API_BASE_URL}/inventory`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to add inventory item');
        return res.json();
    },

    updateInventoryItem: async (id: number, data: any) => {
        const res = await fetch(`${API_BASE_URL}/inventory/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to update inventory item');
        return res.json();
    },

    submitOpname: async (adjustments: any[]) => {
        const res = await fetch(`${API_BASE_URL}/inventory/opname`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adjustments })
        });
        if (!res.ok) throw new Error('Failed to submit stock opname');
        return res.json();
    },

    recordStockMovement: async (inventoryId: number, data: any) => {
         const res = await fetch(`${API_BASE_URL}/inventory/${inventoryId}/movement`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to record stock movement');
        return res.json();
    },

    getWasteSummary: async () => {
        const res = await fetch(`${API_BASE_URL}/inventory/waste/summary`);
        if (!res.ok) throw new Error('Failed to fetch waste summary');
        return res.json();
    },

    getStockInHistory: async () => {
        const res = await fetch(`${API_BASE_URL}/inventory/movements/in`);
        if (!res.ok) throw new Error('Failed to fetch stock in history');
        return res.json();
    },

    getItemWaste: async (id: number) => {
        const res = await fetch(`${API_BASE_URL}/inventory/${id}/waste`);
        if (!res.ok) throw new Error('Failed to fetch item waste logs');
        return res.json();
    },

    // ---- RECIPES ENPOINTS ----
    getRecipes: async () => {
        const res = await fetch(`${API_BASE_URL}/recipes`);
        if (!res.ok) throw new Error('Failed to fetch recipes');
        return res.json();
    },

    createRecipe: async (data: any) => {
        const res = await fetch(`${API_BASE_URL}/recipes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to create recipe');
        return res.json();
    },

    updateRecipe: async (id: number, data: any) => {
        const res = await fetch(`${API_BASE_URL}/recipes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to update recipe');
        return res.json();
    },

    deleteRecipe: async (id: number) => {
        const res = await fetch(`${API_BASE_URL}/recipes/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete recipe');
        return res.json();
    },

    // ---- SALES / POS ENPOINTS ----
    checkoutCart: async (checkoutData: any) => {
        const res = await fetch(`${API_BASE_URL}/sales`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(checkoutData)
        });
        if (!res.ok) throw new Error('Checkout failed');
        return res.json();
    },

    // ---- FINANCE ENPOINTS ----
    getFinanceReports: async () => {
        const res = await fetch(`${API_BASE_URL}/finance/reports`);
        if (!res.ok) throw new Error('Failed to fetch financial reports');
        return res.json();
    },
    
    getExpenses: async () => {
        const res = await fetch(`${API_BASE_URL}/finance/expenses`);
        if (!res.ok) throw new Error('Failed to fetch expenses');
        return res.json();
    },

    addExpense: async (data: any) => {
        const res = await fetch(`${API_BASE_URL}/finance/expenses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to record expense');
        return res.json();
    },

    deleteExpense: async (id: number) => {
        const res = await fetch(`${API_BASE_URL}/finance/expenses/${id}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error('Failed to delete expense');
        return res.json();
    },

    getHPPAnalysis: async () => {
        const res = await fetch(`${API_BASE_URL}/finance/hpp`);
        if (!res.ok) throw new Error('Failed to fetch HPP analysis');
        return res.json();
    }
};
