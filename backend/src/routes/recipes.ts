import { Router, Request, Response } from 'express';
import { db } from '../db';
import * as schema from '../db/schema';
import { eq, inArray } from 'drizzle-orm';

export const recipesRouter = Router();

// GET all recipes with ingredients
recipesRouter.get('/', async (req: Request, res: Response) => {
    try {
        const allRecipes = await db.select().from(schema.recipes).where(eq(schema.recipes.isActive, true));
        
        const recipeIds = allRecipes.map(r => r.id);
        
        let allIngredients: any[] = [];
        let inventoryItems: Record<number, any> = {};

        if (recipeIds.length > 0) {
            allIngredients = await db.select()
                .from(schema.recipeIngredients)
                .where(inArray(schema.recipeIngredients.recipeId, recipeIds));
                
            const invIds = Array.from(new Set(allIngredients.map(i => i.inventoryId)));
            
            if (invIds.length > 0) {
                const invRows = await db.select().from(schema.inventory).where(inArray(schema.inventory.id, invIds));
                invRows.forEach(row => {
                    inventoryItems[row.id] = row;
                });
            }
        }

        const recipesWithBOM = allRecipes.map(recipe => {
            const ingredients = allIngredients
                .filter(ing => ing.recipeId === recipe.id)
                .map(ing => {
                    const inv = inventoryItems[ing.inventoryId];
                    return {
                        ingredientId: ing.inventoryId,
                        qty: parseFloat(ing.quantity),
                        name: inv ? inv.name : 'Unknown',
                        unit: inv ? inv.unit : ''
                    };
                });
            
            // Re-calculate mock HPP based on current price/unit if needed
            let currentHpp = 0;
            ingredients.forEach(ing => {
                const inv = inventoryItems[ing.ingredientId];
                if(inv && parseFloat(inv.pricePerUnit) > 0) {
                    currentHpp += (ing.qty * parseFloat(inv.pricePerUnit));
                }
            });

            return {
                ...recipe,
                price: parseFloat(recipe.price),
                margin: parseFloat(recipe.margin),
                hpp: currentHpp > 0 ? currentHpp : 0, 
                ingredients
            };
        });

        res.json(recipesWithBOM);
    } catch (error) {
        console.error('Error fetching recipes:', error);
        res.status(500).json({ error: 'Failed to fetch recipes' });
    }
});

// POST create new Recipe
recipesRouter.post('/', async (req: Request, res: Response) => {
    try {
        const { name, category, price, margin, imageUrl, ingredients } = req.body;
        
        if (!name || !category || !price) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await db.transaction(async (tx) => {
            const [newRecipe] = await tx.insert(schema.recipes).values({
                name,
                category,
                price: price.toString(),
                margin: margin?.toString() || '0',
                imageUrl,
            }).returning();

            if (ingredients && Array.isArray(ingredients) && ingredients.length > 0) {
                const bomInserts = ingredients.map(ing => ({
                    recipeId: newRecipe.id,
                    inventoryId: ing.ingredientId,
                    quantity: ing.qty.toString()
                }));
                await tx.insert(schema.recipeIngredients).values(bomInserts);
            }
            
            return newRecipe;
        });

        res.status(201).json(result);
    } catch (error) {
        console.error('Error creating recipe:', error);
        res.status(500).json({ error: 'Failed to create recipe' });
    }
});
