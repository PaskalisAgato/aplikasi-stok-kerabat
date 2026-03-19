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
exports.productsRouter = void 0;
const express_1 = require("express");
const db_1 = require("../db");
const schema = __importStar(require("../db/schema"));
const drizzle_orm_1 = require("drizzle-orm");
exports.productsRouter = (0, express_1.Router)();
// GET all products with ingredients (BOM)
exports.productsRouter.get('/', async (req, res) => {
    try {
        const allProducts = await db_1.db.select().from(schema.products).where((0, drizzle_orm_1.eq)(schema.products.isActive, true));
        const productIds = allProducts.map(p => p.id);
        let allIngredients = [];
        let inventoryItems = {};
        if (productIds.length > 0) {
            allIngredients = await db_1.db.select()
                .from(schema.productIngredients)
                .where((0, drizzle_orm_1.inArray)(schema.productIngredients.productId, productIds));
            const invIds = Array.from(new Set(allIngredients.map(i => i.inventoryId)));
            if (invIds.length > 0) {
                const invRows = await db_1.db.select().from(schema.inventory).where((0, drizzle_orm_1.inArray)(schema.inventory.id, invIds));
                invRows.forEach(row => {
                    inventoryItems[row.id] = row;
                });
            }
        }
        const productsWithBOM = allProducts.map(product => {
            const ingredients = allIngredients
                .filter(ing => ing.productId === product.id)
                .map(ing => {
                const inv = inventoryItems[ing.inventoryId];
                return {
                    ingredientId: ing.inventoryId,
                    qty: parseFloat(ing.quantity),
                    name: inv ? inv.name : 'Unknown',
                    unit: inv ? inv.unit : ''
                };
            });
            // Re-calculate current HPP based on current inventory prices
            let currentHpp = 0;
            ingredients.forEach(ing => {
                const inv = inventoryItems[ing.ingredientId];
                if (inv && parseFloat(inv.pricePerUnit) > 0) {
                    currentHpp += (ing.qty * parseFloat(inv.pricePerUnit));
                }
            });
            return {
                ...product,
                price: parseFloat(product.price),
                margin: parseFloat(product.margin),
                hpp: currentHpp > 0 ? currentHpp : 0,
                ingredients
            };
        });
        res.json(productsWithBOM);
    }
    catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});
// POST create new Product
exports.productsRouter.post('/', async (req, res) => {
    try {
        const { name, category, price, margin, imageUrl, ingredients } = req.body;
        if (!name || !category || price === undefined || price === null) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const result = await db_1.db.transaction(async (tx) => {
            const [newProduct] = await tx.insert(schema.products).values({
                name,
                category,
                price: price.toString(),
                margin: margin?.toString() || '0',
                imageUrl,
            }).returning();
            if (ingredients && Array.isArray(ingredients) && ingredients.length > 0) {
                const bomInserts = ingredients.map(ing => ({
                    productId: newProduct.id,
                    inventoryId: ing.ingredientId,
                    quantity: ing.qty.toString()
                }));
                await tx.insert(schema.productIngredients).values(bomInserts);
            }
            return newProduct;
        });
        res.status(201).json(result);
    }
    catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Failed to create product', detail: error.message });
    }
});
// PUT update existing Product and its BOM
exports.productsRouter.put('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { name, category, price, margin, imageUrl, ingredients } = req.body;
        if (!name || !category || price === undefined || price === null) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        await db_1.db.transaction(async (tx) => {
            // 1. Update product
            await tx.update(schema.products)
                .set({
                name,
                category,
                price: price.toString(),
                margin: margin?.toString() || '0',
                imageUrl,
            })
                .where((0, drizzle_orm_1.eq)(schema.products.id, id));
            // 2. Delete existing BOM entries
            await tx.delete(schema.productIngredients)
                .where((0, drizzle_orm_1.eq)(schema.productIngredients.productId, id));
            // 3. Re-insert updated BOM
            if (ingredients && Array.isArray(ingredients) && ingredients.length > 0) {
                const bomInserts = ingredients.map((ing) => ({
                    productId: id,
                    inventoryId: ing.ingredientId,
                    quantity: ing.qty.toString()
                }));
                await tx.insert(schema.productIngredients).values(bomInserts);
            }
        });
        res.json({ success: true, message: 'Product updated' });
    }
    catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Failed to update product', detail: error.message });
    }
});
// DELETE product (soft delete)
exports.productsRouter.delete('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await db_1.db.update(schema.products)
            .set({ isActive: false })
            .where((0, drizzle_orm_1.eq)(schema.products.id, id));
        res.json({ success: true, message: 'Product deleted' });
    }
    catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});
