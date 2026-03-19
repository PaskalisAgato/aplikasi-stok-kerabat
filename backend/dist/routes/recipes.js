"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.recipesRouter = void 0;
const express_1 = require("express");
const db_1 = require("../db");
const schema = __importStar(require("../db/schema"));
const drizzle_orm_1 = require("drizzle-orm");
exports.recipesRouter = (0, express_1.Router)();
// GET all recipes with ingredients
exports.recipesRouter.get('/', async (req, res) => {
    try {
        const allRecipes = await db_1.db.select().from(schema.recipes).where((0, drizzle_orm_1.eq)(schema.recipes.isActive, true));
        const recipeIds = allRecipes.map(r => r.id);
        let allIngredients = [];
        let inventoryItems = {};
        if (recipeIds.length > 0) {
            allIngredients = await db_1.db.select()
                .from(schema.recipeIngredients)
                .where((0, drizzle_orm_1.inArray)(schema.recipeIngredients.recipeId, recipeIds));
            const invIds = Array.from(new Set(allIngredients.map(i => i.inventoryId)));
            if (invIds.length > 0) {
                const invRows = await db_1.db.select().from(schema.inventory).where((0, drizzle_orm_1.inArray)(schema.inventory.id, invIds));
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
                if (inv && parseFloat(inv.pricePerUnit) > 0) {
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
    }
    catch (error) {
        console.error('Error fetching recipes:', error);
        res.status(500).json({ error: 'Failed to fetch recipes' });
    }
});
// POST create new Recipe
exports.recipesRouter.post('/', async (req, res) => {
    try {
        const { name, category, price, margin, imageUrl, ingredients } = req.body;
        if (!name || !category || !price) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const result = await db_1.db.transaction(async (tx) => {
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
    }
    catch (error) {
        console.error('Error creating recipe:', error);
        res.status(500).json({ error: 'Failed to create recipe' });
    }
});
// PUT update existing Recipe and its BOM
exports.recipesRouter.put('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { name, category, price, margin, imageUrl, ingredients } = req.body;
        if (!name || !category || !price) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        await db_1.db.transaction(async (tx) => {
            // 1. Update recipe
            await tx.update(schema.recipes)
                .set({
                name,
                category,
                price: price.toString(),
                margin: margin?.toString() || '0',
                imageUrl,
            })
                .where((0, drizzle_orm_1.eq)(schema.recipes.id, id));
            // 2. Delete existing BOM entries
            await tx.delete(schema.recipeIngredients)
                .where((0, drizzle_orm_1.eq)(schema.recipeIngredients.recipeId, id));
            // 3. Re-insert updated BOM
            if (ingredients && Array.isArray(ingredients) && ingredients.length > 0) {
                const bomInserts = ingredients.map((ing) => ({
                    recipeId: id,
                    inventoryId: ing.ingredientId,
                    quantity: ing.qty.toString()
                }));
                await tx.insert(schema.recipeIngredients).values(bomInserts);
            }
        });
        res.json({ success: true, message: 'Recipe updated' });
    }
    catch (error) {
        console.error('Error updating recipe:', error);
        res.status(500).json({ error: 'Failed to update recipe' });
    }
});
// DELETE recipe (soft delete - set inactive)
exports.recipesRouter.delete('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await db_1.db.update(schema.recipes)
            .set({ isActive: false })
            .where((0, drizzle_orm_1.eq)(schema.recipes.id, id));
        res.json({ success: true, message: 'Recipe deleted' });
    }
    catch (error) {
        console.error('Error deleting recipe:', error);
        res.status(500).json({ error: 'Failed to delete recipe' });
    }
});
