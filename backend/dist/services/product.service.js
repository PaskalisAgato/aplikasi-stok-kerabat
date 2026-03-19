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
exports.ProductService = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../config/db");
const schema = __importStar(require("../db/schema"));
class ProductService {
    static async getAllProducts() {
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
        return allRecipes.map(recipe => {
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
    }
    static async createProduct(data) {
        const { name, category, price, margin, imageUrl, ingredients } = data;
        return await db_1.db.transaction(async (tx) => {
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
    }
    static async updateProduct(id, data) {
        const { name, category, price, margin, imageUrl, ingredients } = data;
        return await db_1.db.transaction(async (tx) => {
            await tx.update(schema.recipes)
                .set({
                name,
                category,
                price: price.toString(),
                margin: margin?.toString() || '0',
                imageUrl,
            })
                .where((0, drizzle_orm_1.eq)(schema.recipes.id, id));
            await tx.delete(schema.recipeIngredients)
                .where((0, drizzle_orm_1.eq)(schema.recipeIngredients.recipeId, id));
            if (ingredients && Array.isArray(ingredients) && ingredients.length > 0) {
                const bomInserts = ingredients.map((ing) => ({
                    recipeId: id,
                    inventoryId: ing.ingredientId,
                    quantity: ing.qty.toString()
                }));
                await tx.insert(schema.recipeIngredients).values(bomInserts);
            }
            return { success: true };
        });
    }
    static async deleteProduct(id) {
        return await db_1.db.update(schema.recipes)
            .set({ isActive: false })
            .where((0, drizzle_orm_1.eq)(schema.recipes.id, id));
    }
}
exports.ProductService = ProductService;
