/**
 * apps/shared/hooks/useRecipes.ts
 *
 * TanStack Query hooks for recipes and BOM management.
 *
 * Usage:
 *   const { data: recipes } = useRecipes();
 *   const deleteRecipe = useDeleteRecipe();
 *   deleteRecipe.mutate(recipeId);
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    recipesService,
    type CreateRecipePayload,
    type UpdateRecipePayload,
} from '../services/recipesService';

// ── Query keys ─────────────────────────────────────────────────────────────────
export const recipesKeys = {
    all: ['recipes'] as const,
    list: () => [...recipesKeys.all, 'list'] as const,
};

// ── Query hooks ────────────────────────────────────────────────────────────────

/** Fetch all active recipes with BOM and computed HPP */
export const useRecipes = () =>
    useQuery({
        queryKey: recipesKeys.list(),
        queryFn: recipesService.fetchAll,
        staleTime: 1000 * 60, // 1 minute — menus don't change frequently
    });

// ── Mutation hooks ─────────────────────────────────────────────────────────────

/** Create a new recipe with optional BOM */
export const useCreateRecipe = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateRecipePayload) => recipesService.create(data),
        onSuccess: () => qc.invalidateQueries({ queryKey: recipesKeys.list() }),
    });
};

/** Update an existing recipe and replace its BOM */
export const useUpdateRecipe = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateRecipePayload }) =>
            recipesService.update(id, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: recipesKeys.list() }),
    });
};

/** Soft-delete a recipe (sets isActive = false) */
export const useDeleteRecipe = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => recipesService.remove(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: recipesKeys.list() }),
    });
};
