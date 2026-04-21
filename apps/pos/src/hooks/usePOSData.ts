import { useState, useEffect, useMemo } from 'react';
import { apiClient } from '@shared/apiClient';
import { db } from '@shared/services/db';
import { syncEngine } from '@shared/services/SyncEngine';

export interface Recipe {
    id: number;
    name: string;
    price: number;
    category: string;
    imageUrl?: string;
}

interface ApiResponse<T> {
    data: T[];
    meta: {
        page: number;
        limit: number;
        total: number;
    };
}

export function usePOSData() {
    const [items, setItems] = useState<Recipe[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchRecipes = async () => {
        try {
            setIsLoading(true);
            const response = await apiClient.getRecipes() as ApiResponse<Recipe>;
            setItems(response.data);
            
            // Cache menu items for offline access
            await db.inventoryCache.bulkPut(response.data.map(item => ({
                id: item.id,
                name: item.name,
                category: item.category,
                unit: 'pcs',
                currentStock: '0',
                minStock: '0',
                pricePerUnit: item.price.toString(),
                status: 'NORMAL',
                version: 1,
                updatedAt: new Date().toISOString()
            })));
        } catch (error) {
            console.error('Failed to load menu, trying local cache...', error);
            const cachedItems = await db.inventoryCache.toArray();
            if (cachedItems.length > 0) {
                setItems(cachedItems.map(c => ({
                    id: c.id,
                    name: c.name,
                    price: parseFloat(c.pricePerUnit),
                    category: c.category
                })));
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRecipes();
        syncEngine.pullInventory();
    }, []);

    const categories = useMemo(() => {
        return Array.from(new Set(items.map(i => i.category))).filter(Boolean);
    }, [items]);

    const filteredRecipes = useMemo(() => {
        const lowerSearch = searchTerm.toLowerCase();
        return items.filter((r) => {
            const matchesSearch = r.name.toLowerCase().includes(lowerSearch);
            const matchesCategory = !selectedCategory || r.category?.toLowerCase() === selectedCategory.toLowerCase();
            return matchesSearch && matchesCategory;
        });
    }, [items, searchTerm, selectedCategory]);

    return {
        items,
        isLoading,
        categories,
        selectedCategory,
        setSelectedCategory,
        searchTerm,
        setSearchTerm,
        filteredRecipes,
        refreshRecipes: fetchRecipes
    };
}
