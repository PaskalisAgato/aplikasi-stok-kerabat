import { eq, inArray } from 'drizzle-orm';
import { db } from '../config/db.js';
import * as schema from '../db/schema.js';
export class ProductService {
    static async getAllProducts() {
        const allRecipes = await db.select().from(schema.recipes).where(eq(schema.recipes.isActive, true));
        const recipeIds = allRecipes.map((r) => r.id);
        let allIngredients = [];
        let inventoryItems = {};
        if (recipeIds.length > 0) {
            allIngredients = await db.select()
                .from(schema.recipeIngredients)
                .where(inArray(schema.recipeIngredients.recipeId, recipeIds));
            const invIds = Array.from(new Set(allIngredients.map((i) => i.inventoryId)));
            if (invIds.length > 0) {
                const invRows = await db.select().from(schema.inventory).where(inArray(schema.inventory.id, invIds));
                invRows.forEach((row) => {
                    inventoryItems[row.id] = row;
                });
            }
        }
        return allRecipes.map((recipe) => {
            const ingredients = allIngredients
                .filter((ing) => ing.recipeId === recipe.id)
                .map((ing) => {
                const inv = inventoryItems[ing.inventoryId];
                return {
                    ingredientId: ing.inventoryId,
                    qty: parseFloat(ing.quantity),
                    name: inv ? inv.name : 'Unknown',
                    unit: inv ? inv.unit : ''
                };
            });
            let currentHpp = 0;
            ingredients.forEach(ing => {
                const inv = inventoryItems[ing.ingredientId];
                if (inv && parseFloat(inv.pricePerUnit) > 0) {
                    currentHpp += (ing.qty * parseFloat(inv.pricePerUnit));
                }
            });
            return {
                ...recipe,
                imageUrl: undefined, // Omit large Base64
                hasImage: !!recipe.imageUrl,
                price: parseFloat(recipe.price),
                margin: parseFloat(recipe.margin),
                hpp: currentHpp > 0 ? currentHpp : 0,
                ingredients
            };
        });
    }
    static async getProductPhoto(id) {
        const [recipe] = await db.select({
            imageUrl: schema.recipes.imageUrl
        })
            .from(schema.recipes)
            .where(eq(schema.recipes.id, id))
            .limit(1);
        return recipe?.imageUrl || null;
    }
    static async createProduct(data) {
        const { name, category, price, margin, imageUrl, ingredients } = data;
        return await db.transaction(async (tx) => {
            const [newRecipe] = await tx.insert(schema.recipes).values({
                name,
                category,
                price: price.toString(),
                margin: margin?.toString() || '0',
                imageUrl,
            }).returning();
            if (ingredients && Array.isArray(ingredients) && ingredients.length > 0) {
                const bomInserts = ingredients.map((ing) => ({
                    recipeId: newRecipe.id,
                    inventoryId: ing.ingredientId,
                    quantity: ing.qty.toString()
                }));
                await tx.insert(schema.recipeIngredients).values(bomInserts);
            }
            return newRecipe;
        });
    }
    static async updateProduct(id, data) {
        const { name, category, price, margin, imageUrl, ingredients } = data;
        return await db.transaction(async (tx) => {
            // 1. Update main recipe data
            const updatePayload = {
                name,
                category,
                imageUrl,
            };
            // Defensive check for mandatory numeric fields
            if (price !== undefined && price !== null) {
                updatePayload.price = price.toString();
            }
            if (margin !== undefined && margin !== null) {
                updatePayload.margin = margin.toString();
            }
            await tx.update(schema.recipes)
                .set(updatePayload)
                .where(eq(schema.recipes.id, id));
            // 2. Refresh Ingredients (BOM)
            // Delete existing ingredients for this recipe
            await tx.delete(schema.recipeIngredients)
                .where(eq(schema.recipeIngredients.recipeId, id));
            // Insert new ingredients if provided
            if (ingredients && Array.isArray(ingredients) && ingredients.length > 0) {
                const bomInserts = ingredients
                    .filter((ing) => ing.ingredientId && ing.qty !== undefined)
                    .map((ing) => ({
                    recipeId: id,
                    inventoryId: ing.ingredientId,
                    quantity: ing.qty.toString()
                }));
                if (bomInserts.length > 0) {
                    await tx.insert(schema.recipeIngredients).values(bomInserts);
                }
            }
            return { success: true };
        });
    }
    static async deleteProduct(id) {
        return await db.update(schema.recipes)
            .set({ isActive: false })
            .where(eq(schema.recipes.id, id));
    }
}
