/**
 * apps/shared/services/recipesService.ts
 *
 * Typed service layer for all /api/recipes endpoints.
 */
export interface RecipeIngredient {
    ingredientId: number;
    qty: number;
    name: string;
    unit: string;
}
export interface Recipe {
    id: number;
    name: string;
    category: string;
    price: number;
    margin: number;
    hpp: number;
    imageUrl?: string | null;
    isActive: boolean;
    ingredients: RecipeIngredient[];
    createdAt?: string;
}
export interface CreateRecipePayload {
    name: string;
    category: string;
    price: number | string;
    margin?: number | string;
    imageUrl?: string;
    ingredients?: Array<{
        ingredientId: number;
        qty: number;
    }>;
}
export interface UpdateRecipePayload extends CreateRecipePayload {
}
export declare const recipesService: {
    /** GET /api/recipes — all active recipes with BOM and computed HPP */
    fetchAll: () => Promise<Recipe[]>;
    /** POST /api/recipes — create new recipe with optional BOM */
    create: (data: CreateRecipePayload) => Promise<Recipe>;
    /** PUT /api/recipes/:id — replace recipe data and BOM */
    update: (id: number, data: UpdateRecipePayload) => Promise<{
        success: boolean;
        message: string;
    }>;
    /** DELETE /api/recipes/:id — soft-delete (sets isActive = false) */
    remove: (id: number) => Promise<{
        success: boolean;
        message: string;
    }>;
};
