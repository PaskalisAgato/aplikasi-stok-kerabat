import { eq, inArray } from 'drizzle-orm';
import { db } from '../config/db.js';
import * as schema from '../db/schema.js';
import { deleteFromCloudinary } from '../utils/cloudinary.js';

export class ProductService {
    static async getAllProducts() {
        const allRecipes = await db.select().from(schema.recipes).where(eq(schema.recipes.isActive, true));
        const recipeIds = allRecipes.map((r: typeof schema.recipes.$inferSelect) => r.id);
        
        let allIngredients: (typeof schema.recipeIngredients.$inferSelect)[] = [];
        let inventoryItems: Record<number, typeof schema.inventory.$inferSelect> = {};

        if (recipeIds.length > 0) {
            allIngredients = await db.select()
                .from(schema.recipeIngredients)
                .where(inArray(schema.recipeIngredients.recipeId, recipeIds));
                
            const invIds = Array.from(new Set(allIngredients.map((i: typeof schema.recipeIngredients.$inferSelect) => i.inventoryId)));
            
            if (invIds.length > 0) {
                const invRows = await db.select().from(schema.inventory).where(inArray(schema.inventory.id, invIds));
                invRows.forEach((row: typeof schema.inventory.$inferSelect) => {
                    inventoryItems[row.id] = row;
                });
            }
        }

        return allRecipes.map((recipe: typeof schema.recipes.$inferSelect) => {
            const ingredients = allIngredients
                .filter((ing: typeof schema.recipeIngredients.$inferSelect) => ing.recipeId === recipe.id)
                .map((ing: typeof schema.recipeIngredients.$inferSelect) => {
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
                if(inv && parseFloat(inv.pricePerUnit) > 0) {
                    const price = parseFloat(inv.pricePerUnit);
                    const isBulk = inv.unit === 'Kg' || inv.unit === 'L';
                    const pricePerGram = isBulk ? price / 1000 : price;
                    currentHpp += (ing.qty * pricePerGram);
                }
            });

            return {
                ...recipe,
                imageUrl: (recipe.imageUrl && !recipe.imageUrl.startsWith('data:')) ? recipe.imageUrl : undefined, // Include URL/path, omit large Base64
                hasImage: !!recipe.imageUrl,
                price: parseFloat(recipe.price),
                margin: parseFloat(recipe.margin),
                overhead: parseFloat(recipe.overhead),
                hpp: currentHpp > 0 ? currentHpp : 0, 
                ingredients
            };
        });
    }

    static async getProductPhoto(id: number) {
        const [recipe] = await db.select({
            imageUrl: schema.recipes.imageUrl
        })
        .from(schema.recipes)
        .where(eq(schema.recipes.id, id))
        .limit(1);

        return recipe?.imageUrl || null;
    }

    static async createProduct(data: any) {
        const toNumericString = (val: any) => {
            if (val === undefined || val === null || val === '') return '0';
            const num = Number(val);
            return isNaN(num) ? '0' : num.toString();
        };

        return await db.transaction(async (tx: any) => {
            try {
                const { name, category, price, margin, overhead, imageUrl, ingredients } = data;
                const [newRecipe] = await tx.insert(schema.recipes).values({
                    name,
                    category,
                    price: toNumericString(price),
                    margin: toNumericString(margin),
                    overhead: toNumericString(overhead || 10),
                    imageUrl,
                }).returning();

                if (ingredients && Array.isArray(ingredients) && ingredients.length > 0) {
                    const bomInserts = ingredients
                        .filter((ing: any) => ing.ingredientId && ing.qty !== undefined)
                        .map((ing: any) => ({
                            recipeId: newRecipe.id,
                            inventoryId: ing.ingredientId,
                            quantity: toNumericString(ing.qty)
                        }));
                    
                    if (bomInserts.length > 0) {
                        await tx.insert(schema.recipeIngredients).values(bomInserts);
                    }
                }
                
                return newRecipe;
            } catch (error) {
                console.error("[ProductService.createProduct] Transaction failed:", error);
                throw error;
            }
        });
    }

    static async updateProduct(id: number, data: any) {
        const toNumericString = (val: any) => {
            if (val === undefined || val === null || val === '') return null;
            const num = Number(val);
            return isNaN(num) ? '0' : num.toString();
        };

        const result: any = await db.transaction(async (tx: any) => {
            try {
                const { name, category, price, margin, overhead, imageUrl, ingredients } = data;

                // 1. Fetch old recipe to check for image updates
                const [oldRecipe] = await tx.select({ imageUrl: schema.recipes.imageUrl })
                    .from(schema.recipes)
                    .where(eq(schema.recipes.id, id))
                    .limit(1);

                // 2. Update main recipe data
                const updatePayload: any = {};
                if (name) updatePayload.name = name;
                if (category) updatePayload.category = category;
                
                let oldImageToDelete: string | null = null;
                if (imageUrl !== undefined) {
                    updatePayload.imageUrl = imageUrl;
                    if (oldRecipe?.imageUrl && oldRecipe.imageUrl !== imageUrl && oldRecipe.imageUrl.includes('cloudinary.com')) {
                        // Mark for deletion after successful transaction
                        oldImageToDelete = oldRecipe.imageUrl;
                    }
                }

                const priceStr = toNumericString(price);
                if (priceStr !== null) updatePayload.price = priceStr;
                
                const marginStr = toNumericString(margin);
                if (marginStr !== null) updatePayload.margin = marginStr;

                const overheadStr = toNumericString(overhead);
                if (overheadStr !== null) updatePayload.overhead = overheadStr;

                if (Object.keys(updatePayload).length > 0) {
                    await tx.update(schema.recipes)
                        .set(updatePayload)
                        .where(eq(schema.recipes.id, id));
                }

                // 2. Refresh Ingredients (BOM)
                // Delete existing ingredients for this recipe
                await tx.delete(schema.recipeIngredients)
                    .where(eq(schema.recipeIngredients.recipeId, id));

                // Insert new ingredients if provided
                if (ingredients && Array.isArray(ingredients) && ingredients.length > 0) {
                    const bomInserts = ingredients
                        .filter((ing: any) => ing.ingredientId && (ing.qty !== undefined && ing.qty !== null))
                        .map((ing: any) => ({
                            recipeId: id,
                            inventoryId: ing.ingredientId,
                            quantity: toNumericString(ing.qty) || '0'
                        }));
                    
                    if (bomInserts.length > 0) {
                        await tx.insert(schema.recipeIngredients).values(bomInserts);
                    }
                }
                
                return { success: true, oldImageToDelete };
            } catch (error) {
                console.error(`[ProductService.updateProduct] Transaction failed for ID ${id}:`, error);
                throw error;
            }
        });

        if (result?.oldImageToDelete) {
            // Delete old image asynchronously after successful commit
            deleteFromCloudinary(result.oldImageToDelete).catch(err => 
                console.error('[Cloudinary Cleanup] Failed:', err)
            );
        }

        return result;
    }

    static async deleteProduct(id: number) {
        const [recipe] = await db.select({ imageUrl: schema.recipes.imageUrl })
            .from(schema.recipes)
            .where(eq(schema.recipes.id, id))
            .limit(1);

        const result = await db.update(schema.recipes)
            .set({ isActive: false })
            .where(eq(schema.recipes.id, id));
            
        if (recipe?.imageUrl && recipe.imageUrl.includes('cloudinary.com')) {
            // Cleanup Cloudinary asynchronously
            deleteFromCloudinary(recipe.imageUrl).catch(console.error);
        }

        return result;
    }
}

