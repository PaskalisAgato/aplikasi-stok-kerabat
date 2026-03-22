import { db } from './db/index.js';
import * as schema from './db/schema.js';
import { INVENTORY, EXPENSES, EMPLOYEES, RECIPES } from '../../apps/shared/mockDatabase.js';
import { eq } from 'drizzle-orm';

async function seed() {
    console.log('🌱 Starting Database Seeding...');
    try {
        // 1. CLEAR EXISTING DATA (Optional, careful in production)
        console.log('🧹 Clearing old mock data...');
        // Order of deletion matters to avoid Foreign Key conflicts
        await db.delete(schema.saleItems);
        await db.delete(schema.sales);
        await db.delete(schema.shifts);
        await db.delete(schema.recipeIngredients);
        await db.delete(schema.recipes);
        await db.delete(schema.stockMovements);
        await db.delete(schema.inventory);
        await db.delete(schema.suppliers);
        await db.delete(schema.expenses);
        await db.delete(schema.users); // Clear all seeded mock users

        // 2. SEED EMPLOYEES
        console.log('👤 Seeding Employees (Users)...');
        
        // Add a default Admin for initial setup
        await db.insert(schema.users).values({
            id: 'admin_primary',
            name: 'Administrator',
            email: 'admin@stok-kerabat.com',
            emailVerified: true,
            role: 'Admin',
            pin: '1234', // Default PIN for dev/initial setup
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        for (const emp of EMPLOYEES) {
            await db.insert(schema.users).values({
                id: `emp_${emp.id}`, // Mocking text ID
                name: emp.name,
                email: `${emp.name.toLowerCase().replace(' ', '')}@kerabat.com`,
                emailVerified: true,
                role: emp.role === 'Owner' || emp.role === 'Manager' ? 'Admin' : 'Karyawan',
                pin: emp.role === 'Owner' || emp.role === 'Manager' ? '5678' : '0000', // Default PINs
                image: emp.image,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }

        // 3. SEED SUPPLIERS (Derived from Inventory mocks)
        console.log('🏭 Seeding Suppliers...');
        const uniqueSuppliers = Array.from(new Set(INVENTORY.map(item => item.supplier).filter(Boolean)));
        const supplierMap = new Map<string, number>();

        for (const [index, supplierName] of uniqueSuppliers.entries()) {
            const [insertedSupplier] = await db.insert(schema.suppliers).values({
                name: supplierName,
                createdAt: new Date(),
            }).returning({ id: schema.suppliers.id });
            supplierMap.set(supplierName, insertedSupplier.id);
        }

        // 4. SEED INVENTORY
        console.log('📦 Seeding Inventory & Raw Materials...');
        for (const item of INVENTORY) {
            await db.insert(schema.inventory).values({
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
        for (const exp of EXPENSES) {
            await db.insert(schema.expenses).values({
                title: exp.title,
                category: exp.category,
                amount: exp.amount.toString(),
                createdAt: new Date(),
            });
        }

        // 6. SEED RECIPES & BOM (Bill of Materials)
        console.log('☕ Seeding Recipes & BOM (Ingredients)...');
        for (const recipe of RECIPES) {
            const [insertedRecipe] = await db.insert(schema.recipes).values({
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
                    const isInventoryExist = INVENTORY.find(item => item.id === ing.ingredientId);
                    
                    if (isInventoryExist) {
                        await db.insert(schema.recipeIngredients).values({
                            recipeId: insertedRecipe.id,
                            inventoryId: ing.ingredientId, // Sesuai mock data baku
                            quantity: ing.qty.toString()
                        });
                    } else {
                        console.warn(`⚠️ Skipped Ingredient ID ${ing.ingredientId} for Recipe ${recipe.id} due to missing Inventory Reference!`);
                    }
                }
            }
        }

        console.log('✅ Seeding Completed Successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error during seeding:', error);
        process.exit(1);
    }
}

seed();
