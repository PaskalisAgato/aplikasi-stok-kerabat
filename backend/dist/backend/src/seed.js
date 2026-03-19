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
const db_1 = require("./db");
const schema = __importStar(require("./db/schema"));
const mockDatabase_1 = require("../../apps/shared/mockDatabase");
async function seed() {
    console.log('🌱 Starting Database Seeding...');
    try {
        // 1. CLEAR EXISTING DATA (Optional, careful in production)
        console.log('🧹 Clearing old mock data...');
        // Order of deletion matters to avoid Foreign Key conflicts
        await db_1.db.delete(schema.saleItems);
        await db_1.db.delete(schema.sales);
        await db_1.db.delete(schema.shifts);
        await db_1.db.delete(schema.recipeIngredients);
        await db_1.db.delete(schema.recipes);
        await db_1.db.delete(schema.stockMovements);
        await db_1.db.delete(schema.inventory);
        await db_1.db.delete(schema.suppliers);
        await db_1.db.delete(schema.expenses);
        await db_1.db.delete(schema.users); // Clear all seeded mock users
        // 2. SEED EMPLOYEES
        console.log('👤 Seeding Employees (Users)...');
        for (const emp of mockDatabase_1.EMPLOYEES) {
            await db_1.db.insert(schema.users).values({
                id: `emp_${emp.id}`, // Mocking text ID
                name: emp.name,
                email: `${emp.name.toLowerCase().replace(' ', '')}@kerabat.com`,
                emailVerified: true,
                role: emp.role,
                image: emp.image,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }
        // 3. SEED SUPPLIERS (Derived from Inventory mocks)
        console.log('🏭 Seeding Suppliers...');
        const uniqueSuppliers = Array.from(new Set(mockDatabase_1.INVENTORY.map(item => item.supplier).filter(Boolean)));
        const supplierMap = new Map();
        for (const [index, supplierName] of uniqueSuppliers.entries()) {
            const [insertedSupplier] = await db_1.db.insert(schema.suppliers).values({
                name: supplierName,
                createdAt: new Date(),
            }).returning({ id: schema.suppliers.id });
            supplierMap.set(supplierName, insertedSupplier.id);
        }
        // 4. SEED INVENTORY
        console.log('📦 Seeding Inventory & Raw Materials...');
        for (const item of mockDatabase_1.INVENTORY) {
            await db_1.db.insert(schema.inventory).values({
                id: item.id, // Keeping original IDs for Recipe mapping
                name: item.name,
                category: item.category,
                unit: item.unit,
                currentStock: item.currentStock.toString(),
                minStock: item.minStock.toString(),
                pricePerUnit: item.pricePerUnit.toString(),
                imageUrl: item.imageUrl,
            });
            // Note: Since we kept original IDs, supplier references aren't strictly mapped here to maintain mock relationships
        }
        // 5. SEED EXPENSES
        console.log('💸 Seeding Expenses...');
        for (const exp of mockDatabase_1.EXPENSES) {
            await db_1.db.insert(schema.expenses).values({
                title: exp.title,
                category: exp.category,
                amount: exp.amount.toString(),
                createdAt: new Date(),
            });
        }
        // 6. SEED RECIPES & BOM (Bill of Materials)
        console.log('☕ Seeding Recipes & BOM (Ingredients)...');
        for (const recipe of mockDatabase_1.RECIPES) {
            const [insertedRecipe] = await db_1.db.insert(schema.recipes).values({
                id: recipe.id,
                name: recipe.name,
                category: recipe.category,
                price: recipe.price.toString(),
                margin: recipe.margin.toString(),
                imageUrl: recipe.imageUrl,
                isActive: true
            }).returning({ id: schema.recipes.id });
            // Seed Recipe Ingredients mapping
            if (recipe.ingredients && recipe.ingredients.length > 0) {
                for (const ing of recipe.ingredients) {
                    // Cek apakah ingredientId ini memang ada di inventory yang kita tabur di log No 4
                    const isInventoryExist = mockDatabase_1.INVENTORY.find(item => item.id === ing.ingredientId);
                    if (isInventoryExist) {
                        await db_1.db.insert(schema.recipeIngredients).values({
                            recipeId: insertedRecipe.id,
                            inventoryId: ing.ingredientId, // Sesuai mock data baku
                            quantity: ing.qty.toString()
                        });
                    }
                    else {
                        console.warn(`⚠️ Skipped Ingredient ID ${ing.ingredientId} for Recipe ${recipe.id} due to missing Inventory Reference!`);
                    }
                }
            }
        }
        console.log('✅ Seeding Completed Successfully!');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error during seeding:', error);
        process.exit(1);
    }
}
seed();
