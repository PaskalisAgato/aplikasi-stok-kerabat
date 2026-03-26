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
import { type CreateRecipePayload, type UpdateRecipePayload } from '../services/recipesService';
export declare const recipesKeys: {
    all: readonly ["recipes"];
    list: () => readonly ["recipes", "list"];
};
/** Fetch all active recipes with BOM and computed HPP */
export declare const useRecipes: () => import("@tanstack/react-query").UseQueryResult<import("../services/recipesService").Recipe[], Error>;
/** Create a new recipe with optional BOM */
export declare const useCreateRecipe: () => import("@tanstack/react-query").UseMutationResult<import("../services/recipesService").Recipe, Error, CreateRecipePayload, unknown>;
/** Update an existing recipe and replace its BOM */
export declare const useUpdateRecipe: () => import("@tanstack/react-query").UseMutationResult<{
    success: boolean;
    message: string;
}, Error, {
    id: number;
    data: UpdateRecipePayload;
}, unknown>;
/** Soft-delete a recipe (sets isActive = false) */
export declare const useDeleteRecipe: () => import("@tanstack/react-query").UseMutationResult<{
    success: boolean;
    message: string;
}, Error, number, unknown>;
