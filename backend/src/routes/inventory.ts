import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import * as schema from '../db/schema.js';
import { eq, sql, and, gte, desc } from 'drizzle-orm';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import ExcelJS from 'exceljs';

export const inventoryRouter = Router();

// ... existing routes ...

// GET Export Excel
inventoryRouter.get('/export', async (req: Request, res: Response) => {
    try {
        const items = await db.select({
            id: schema.inventory.id,
            name: schema.inventory.name,
            category: schema.inventory.category,
            unit: schema.inventory.unit,
            currentStock: schema.inventory.currentStock,
            minStock: schema.inventory.minStock,
            pricePerUnit: schema.inventory.pricePerUnit
        }).from(schema.inventory);
        const movements = await db.select({
            id: schema.stockMovements.id,
            inventoryId: schema.stockMovements.inventoryId,
            inventoryName: schema.inventory.name,
            type: schema.stockMovements.type,
            quantity: schema.stockMovements.quantity,
            reason: schema.stockMovements.reason,
            createdAt: schema.stockMovements.createdAt
        })
        .from(schema.stockMovements)
        .innerJoin(schema.inventory, eq(schema.stockMovements.inventoryId, schema.inventory.id))
        .orderBy(desc(schema.stockMovements.createdAt));

        const allSuppliers = await db.select().from(schema.suppliers);

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Kerabat POS';
        workbook.lastModifiedBy = 'Kerabat POS';
        workbook.created = new Date();

        // 1. Sheet Data Inventory
        const inventorySheet = workbook.addWorksheet('Data Inventory');
        inventorySheet.columns = [
            { header: 'ID', key: 'id', width: 5 },
            { header: 'Nama Barang', key: 'name', width: 25 },
            { header: 'Kategori', key: 'category', width: 15 },
            { header: 'Satuan', key: 'unit', width: 10 },
            { header: 'Stok Awal', key: 'initial', width: 12 },
            { header: 'Stok Masuk', key: 'in', width: 12 },
            { header: 'Stok Keluar', key: 'out', width: 12 },
            { header: 'Stok Akhir', key: 'final', width: 12 },
            { header: 'Harga Beli', key: 'price', width: 15 },
            { header: 'Nilai Stok', key: 'value', width: 15 },
            { header: 'Min Stok', key: 'min', width: 12 },
        ];

        // Style header
        inventorySheet.getRow(1).font = { bold: true };
        inventorySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

        items.forEach((item, index) => {
            const rowIdx = index + 2;
            inventorySheet.addRow({
                id: item.id,
                name: item.name,
                category: item.category,
                unit: item.unit,
                initial: 0,
                price: parseFloat(item.pricePerUnit),
                min: parseFloat(item.minStock)
            });

            // Formulas targeting 'Log Transaksi'
            inventorySheet.getCell(`F${rowIdx}`).value = {
                formula: `SUMIFS('Log Transaksi'!E:E, 'Log Transaksi'!B:B, A${rowIdx}, 'Log Transaksi'!D:D, "IN")`,
                result: 0
            };
            inventorySheet.getCell(`G${rowIdx}`).value = {
                formula: `SUMIFS('Log Transaksi'!E:E, 'Log Transaksi'!B:B, A${rowIdx}, 'Log Transaksi'!D:D, "OUT") + SUMIFS('Log Transaksi'!E:E, 'Log Transaksi'!B:B, A${rowIdx}, 'Log Transaksi'!D:D, "WASTE")`,
                result: 0
            };
            inventorySheet.getCell(`H${rowIdx}`).value = {
                formula: `E${rowIdx} + F${rowIdx} - G${rowIdx}`,
                result: parseFloat(item.currentStock)
            };
            inventorySheet.getCell(`J${rowIdx}`).value = {
                formula: `H${rowIdx} * I${rowIdx}`,
                result: parseFloat(item.currentStock) * parseFloat(item.pricePerUnit)
            };

            // Conditional Formatting for Low Stock (RED)
            inventorySheet.addConditionalFormatting({
                ref: `H${rowIdx}`,
                rules: [
                    {
                        type: 'expression',
                        formulae: [`H${rowIdx}<=K${rowIdx}`],
                        priority: 1,
                        style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFFC7CE' } }, font: { color: { argb: 'FF9C0006' } } }
                    }
                ]
            });

        });

        // 2. Sheet Log Transaksi
        const logSheet = workbook.addWorksheet('Log Transaksi');
        logSheet.columns = [
            { header: 'Tanggal', key: 'date', width: 20 },
            { header: 'ID Barang', key: 'id', width: 10 },
            { header: 'Nama Barang', key: 'name', width: 25 },
            { header: 'Jenis', key: 'type', width: 10 },
            { header: 'Jumlah', key: 'qty', width: 12 },
            { header: 'Keterangan', key: 'note', width: 30 },
        ];
        logSheet.getRow(1).font = { bold: true };
        logSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

        movements.forEach(m => {
            logSheet.addRow({
                date: m.createdAt.toLocaleString('id-ID'),
                id: m.inventoryId,
                name: m.inventoryName,
                type: m.type,
                qty: parseFloat(m.quantity),
                note: m.reason || '-'
            });
        });

        // 3. Sheet Supplier
        const supplierSheet = workbook.addWorksheet('Supplier');
        supplierSheet.columns = [
            { header: 'Nama Supplier', key: 'name', width: 25 },
            { header: 'Kontak', key: 'contact', width: 20 },
            { header: 'Alamat', key: 'address', width: 40 },
        ];
        supplierSheet.getRow(1).font = { bold: true };
        supplierSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
        allSuppliers.forEach(s => {
            supplierSheet.addRow({
                name: s.name,
                contact: s.contact || '-',
                address: s.address || '-'
            });
        });

        // 4. Sheet Dashboard
        const dashSheet = workbook.addWorksheet('Dashboard');
        dashSheet.getCell('A1').value = 'RINGKASAN INVENTORY';
        dashSheet.getCell('A1').font = { size: 16, bold: true };
        
        dashSheet.getCell('A3').value = 'Total Nilai Stok';
        dashSheet.getCell('B3').value = { formula: "SUM('Data Inventory'!J:J)" };
        dashSheet.getCell('B3').numFmt = '#,##0';
        dashSheet.getCell('B3').font = { bold: true };

        dashSheet.getCell('A4').value = 'Total Item';
        dashSheet.getCell('B4').value = { formula: "COUNTA('Data Inventory'!B:B) - 1" };
        dashSheet.getCell('B4').font = { bold: true };

        dashSheet.getCell('A6').value = 'NOTIFIKASI STOK MINIMUM';
        dashSheet.getCell('A6').font = { bold: true, color: { argb: 'FFFF0000' } };

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Inventory_Kerabat_POS.xlsx');

        await workbook.xlsx.write(res);
        res.status(200).end();

    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: 'Failed to generate export' });
    }
});

// GET all inventory items with pagination
inventoryRouter.get('/', async (req: Request, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = parseInt(req.query.offset as string) || 0;

        // Explicitly project fields to avoid returning large base64 imageUrl blobs
        const items = await db.select({
            id: schema.inventory.id,
            name: schema.inventory.name,
            category: schema.inventory.category,
            unit: schema.inventory.unit,
            currentStock: schema.inventory.currentStock,
            minStock: schema.inventory.minStock,
            pricePerUnit: schema.inventory.pricePerUnit,
            discountPrice: schema.inventory.discountPrice,
            createdAt: schema.inventory.createdAt,
            version: schema.inventory.version,
            externalImageUrl: schema.inventory.externalImageUrl,
        })
        .from(schema.inventory)
        .where(eq(schema.inventory.isDeleted, false))
        .orderBy(desc(schema.inventory.createdAt))
        .limit(limit)
        .offset(offset);

        // Add dynamic status (NORMAL, KRITIS, HABIS) based on currentStock vs minStock
        const itemsWithStatus = items.map((item) => {
            const current = parseFloat(item.currentStock);
            const min = parseFloat(item.minStock);
            let status = 'NORMAL';
            if (current <= 0) status = 'HABIS';
            else if (current <= min) status = 'KRITIS';

            return { ...item, status };
        });

        // Prevent browsers/CDN from caching stale inventory
        res.setHeader('Cache-Control', 'no-store');
        res.json(itemsWithStatus);
    } catch (error) {
        console.error('Error fetching inventory:', error);
        res.status(500).json({ error: 'Failed to fetch inventory' });
    }
});

// GET Single Inventory Item (Full Details including base64)
inventoryRouter.get('/:id', async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id as string);
        const [item] = await db.select({
            id: schema.inventory.id,
            name: schema.inventory.name,
            category: schema.inventory.category,
            unit: schema.inventory.unit,
            currentStock: schema.inventory.currentStock,
            minStock: schema.inventory.minStock,
            pricePerUnit: schema.inventory.pricePerUnit,
            discountPrice: schema.inventory.discountPrice,
            imageUrl: schema.inventory.imageUrl,
            externalImageUrl: schema.inventory.externalImageUrl,
            createdAt: schema.inventory.createdAt,
            version: schema.inventory.version
        })
        .from(schema.inventory)
        .where(
            and(
                eq(schema.inventory.id, id),
                eq(schema.inventory.isDeleted, false)
            )
        )
        .limit(1);

        if (!item) return res.status(404).json({ error: 'Item not found' });
        res.json(item);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch item details' });
    }
});

// GET Price Logs for an Item
inventoryRouter.get('/:id/price-logs', requireAuth, async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id as string);
        const logs = await db.select({
            id: schema.inventoryPriceLogs.id,
            oldPrice: schema.inventoryPriceLogs.oldPrice,
            newPrice: schema.inventoryPriceLogs.newPrice,
            oldDiscount: schema.inventoryPriceLogs.oldDiscount,
            newDiscount: schema.inventoryPriceLogs.newDiscount,
            changedBy: schema.users.name,
            timestamp: schema.inventoryPriceLogs.timestamp
        })
        .from(schema.inventoryPriceLogs)
        .leftJoin(schema.users, eq(schema.inventoryPriceLogs.changedBy, schema.users.id))
        .where(eq(schema.inventoryPriceLogs.itemId, id))
        .orderBy(desc(schema.inventoryPriceLogs.timestamp));

        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch price logs' });
    }
});

// GET Waste Summary
inventoryRouter.get('/waste/summary', async (req: Request, res: Response) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // 1. Total Waste Value (Joining with Inventory for price)
        const wasteMovements = await db.select({
            id: schema.stockMovements.id,
            quantity: schema.stockMovements.quantity,
            pricePerUnit: schema.inventory.pricePerUnit,
            createdAt: schema.stockMovements.createdAt
        })
        .from(schema.stockMovements)
        .innerJoin(schema.inventory, eq(schema.stockMovements.inventoryId, schema.inventory.id))
        .where(
            and(
                eq(schema.stockMovements.type, 'WASTE'),
                gte(schema.stockMovements.createdAt, thirtyDaysAgo)
            )
        );

        const totalWasteValue = wasteMovements.reduce((sum: number, m: any) => {
            return sum + (parseFloat(m.quantity) * parseFloat(m.pricePerUnit));
        }, 0);

        // 2. Top Waste Offenders
        const topOffenders = await db.select({
            id: schema.inventory.id,
            name: schema.inventory.name,
            unit: schema.inventory.unit,
            currentStock: schema.inventory.currentStock,
            totalWasteValue: sql<number>`SUM(${schema.stockMovements.quantity} * ${schema.inventory.pricePerUnit})`
        })
        .from(schema.stockMovements)
        .innerJoin(schema.inventory, eq(schema.stockMovements.inventoryId, schema.inventory.id))
        .where(eq(schema.stockMovements.type, 'WASTE'))
        .groupBy(schema.inventory.id)
        .orderBy(sql`total_waste_value DESC`)
        .limit(5);

        res.json({
            totalValueMonth: totalWasteValue,
            topOffenders
        });
    } catch (error) {
        console.error('Error fetching waste summary:', error);
        res.status(500).json({ error: 'Failed to fetch waste summary' });
    }
});

// GET Item Specific Waste
inventoryRouter.get('/:id/waste', async (req: Request, res: Response) => {
    try {
        const inventoryId = parseInt(req.params.id as string);
        const wasteLogs = await db.select({
            id: schema.stockMovements.id,
            quantity: schema.stockMovements.quantity,
            reason: schema.stockMovements.reason,
            createdAt: schema.stockMovements.createdAt
        })
            .from(schema.stockMovements)
            .where(
                and(
                    eq(schema.stockMovements.inventoryId, inventoryId),
                    eq(schema.stockMovements.type, 'WASTE')
                )
            )
            .orderBy(schema.stockMovements.createdAt);

        res.json(wasteLogs);
    } catch (error) {
        console.error('Error fetching item waste logs:', error);
        res.status(500).json({ error: 'Failed to fetch item waste logs' });
    }
});

// POST new inventory item
inventoryRouter.post('/', async (req: Request, res: Response) => {
    try {
        const { name, category, unit, minStock, pricePerUnit, discountPrice, imageUrl } = req.body;
        
        if (!name || !category || !unit) {
             return res.status(400).json({ error: 'Missing required fields' });
        }

        const [newItem] = await db.insert(schema.inventory).values({
            name,
            category,
            unit,
            currentStock: '0',
            minStock: minStock?.toString() || '0',
            pricePerUnit: pricePerUnit?.toString() || '0',
            discountPrice: discountPrice?.toString() || '0',
            imageUrl
        }).returning({
            id: schema.inventory.id,
            name: schema.inventory.name
        });

        res.status(201).json(newItem);
    } catch (error) {
        console.error('Error adding inventory item:', error);
        res.status(500).json({ error: 'Failed to add inventory item' });
    }
});

// PUT update inventory item master data (Hardened for Price & RBAC)
inventoryRouter.put('/:id', requireAdmin, async (req: Request, res: Response) => {
    try {
        const inventoryId = parseInt(req.params.id as string);
        const { name, category, unit, minStock, pricePerUnit, discountPrice, imageUrl, currentStock, version } = req.body;
        const user = (req as any).user;

        // 1. Validation
        if (pricePerUnit !== undefined && (isNaN(Number(pricePerUnit)) || Number(pricePerUnit) < 0)) {
            return res.status(400).json({ error: 'Harga beli tidak valid' });
        }
        if (discountPrice !== undefined && (isNaN(Number(discountPrice)) || Number(discountPrice) < 0)) {
            return res.status(400).json({ error: 'Harga diskon tidak valid' });
        }
        if (pricePerUnit !== undefined && discountPrice !== undefined && Number(discountPrice) > Number(pricePerUnit)) {
            return res.status(400).json({ error: 'Harga diskon tidak boleh lebih besar dari harga beli' });
        }

        const results = await db.transaction(async (tx: any) => {
            const oldItemArr = await tx.select({
                id: schema.inventory.id,
                name: schema.inventory.name,
                pricePerUnit: schema.inventory.pricePerUnit,
                discountPrice: schema.inventory.discountPrice,
                currentStock: schema.inventory.currentStock,
                version: schema.inventory.version,
                isDeleted: schema.inventory.isDeleted
            }).from(schema.inventory).where(eq(schema.inventory.id, inventoryId)).limit(1);
            if (oldItemArr.length === 0) return { error: 'Item not found', status: 404 };
            const oldItem = oldItemArr[0];

            if (oldItem.isDeleted) return { error: 'Item has been deleted', status: 410 };

            // Concurrency Check (Optimistic Locking)
            if (version && new Date(version).getTime() !== new Date(oldItem.version).getTime()) {
                return { error: 'Data telah diperbarui oleh user lain. Mohon muat ulang halaman.', status: 409 };
            }

            // 2. Handle Price Audit Logging
            const newPrice = pricePerUnit !== undefined ? pricePerUnit.toString() : oldItem.pricePerUnit;
            const newDiscount = discountPrice !== undefined ? discountPrice.toString() : oldItem.discountPrice;

            if (newPrice !== oldItem.pricePerUnit || newDiscount !== oldItem.discountPrice) {
                await tx.insert(schema.inventoryPriceLogs).values({
                    itemId: inventoryId,
                    oldPrice: oldItem.pricePerUnit,
                    newPrice: newPrice,
                    oldDiscount: oldItem.discountPrice,
                    newDiscount: newDiscount,
                    changedBy: user.id
                });
            }

            const oldStock = parseFloat(oldItem.currentStock);
            const newStock = currentStock !== undefined ? parseFloat(currentStock.toString()) : oldStock;
            const delta = newStock - oldStock;

            // 3. Handle Stock Adjustment Log
            if (delta !== 0) {
                await tx.insert(schema.stockMovements).values({
                    inventoryId,
                    type: delta > 0 ? 'IN' : 'OUT',
                    quantity: Math.abs(delta).toString(),
                    reason: `Manual Adjustment from ${oldStock} to ${newStock}`,
                    createdAt: new Date()
                });
            }

            const [updatedItem] = await tx.update(schema.inventory)
                .set({
                    ...(name && { name }),
                    ...(category && { category }),
                    ...(unit && { unit }),
                    ...(minStock !== undefined && { minStock: minStock.toString() }),
                    ...(pricePerUnit !== undefined && { pricePerUnit: newPrice }),
                    ...(discountPrice !== undefined && { discountPrice: newDiscount }),
                    ...(imageUrl !== undefined && { imageUrl }),
                    ...(currentStock !== undefined && { currentStock: newStock.toString() }),
                    version: new Date() // Update version on every change
                })
                .where(eq(schema.inventory.id, inventoryId))
                .returning({
                    id: schema.inventory.id,
                    name: schema.inventory.name,
                    category: schema.inventory.category,
                    unit: schema.inventory.unit,
                    currentStock: schema.inventory.currentStock,
                    minStock: schema.inventory.minStock,
                    pricePerUnit: schema.inventory.pricePerUnit,
                    discountPrice: schema.inventory.discountPrice,
                    version: schema.inventory.version,
                    externalImageUrl: schema.inventory.externalImageUrl
                });

            // Log to Audit
            await tx.insert(schema.auditLogs).values({
                userId: user.id,
                action: `UPDATE_INVENTORY_ENTERPRISE: ${updatedItem.name}`,
                tableName: 'inventory',
                oldData: JSON.stringify(oldItem),
                newData: JSON.stringify(updatedItem),
                createdAt: new Date()
            });

            return updatedItem;
        });

        if (results?.error) {
            return res.status(results.status).json({ success: false, message: results.error });
        }

        if (!results) {
            return res.status(404).json({ error: 'Item not found' });
        }

        res.json(results);
    } catch (error) {
        console.error('Error updating inventory item:', error);
        res.status(500).json({ error: 'Failed to update inventory item' });
    }
});

// GET Item Specific Movements
inventoryRouter.get('/:id/movements', async (req: Request, res: Response) => {
    try {
        const inventoryId = parseInt(req.params.id as string);
        const movements = await db.select({
            id: schema.stockMovements.id,
            type: schema.stockMovements.type,
            quantity: schema.stockMovements.quantity,
            reason: schema.stockMovements.reason,
            supplierName: schema.suppliers.name,
            createdAt: schema.stockMovements.createdAt
        })
        .from(schema.stockMovements)
        .leftJoin(schema.suppliers, eq(schema.stockMovements.supplierId, schema.suppliers.id))
        .where(eq(schema.stockMovements.inventoryId, inventoryId))
        .orderBy(sql`${schema.stockMovements.createdAt} DESC`)
        .limit(20);

        res.json(movements);
    } catch (error) {
        console.error('Error fetching item movements:', error);
        res.status(500).json({ error: 'Failed to fetch movements' });
    }
});

// GET Recent Stock In (Restock History) - General
inventoryRouter.get('/movements/in', async (req: Request, res: Response) => {
    try {
        const history = await db.select({
            id: schema.stockMovements.id,
            inventoryName: schema.inventory.name,
            quantity: schema.stockMovements.quantity,
            unit: schema.inventory.unit,
            supplierName: schema.suppliers.name,
            reason: schema.stockMovements.reason,
            createdAt: schema.stockMovements.createdAt
        })
        .from(schema.stockMovements)
        .innerJoin(schema.inventory, eq(schema.stockMovements.inventoryId, schema.inventory.id))
        .leftJoin(schema.suppliers, eq(schema.stockMovements.supplierId, schema.suppliers.id))
        .where(eq(schema.stockMovements.type, 'IN'))
        .orderBy(sql`${schema.stockMovements.createdAt} DESC`)
        .limit(50);

        res.json(history);
    } catch (error) {
        console.error('Error fetching stock in history:', error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

// POST Movement (In, Out, Waste, Adjust)
inventoryRouter.post('/:id/movement', requireAuth, async (req: Request, res: Response) => {
    try {
        const inventoryId = parseInt(req.params.id as string);
        const { type, quantity, reason, supplierId, supplierName, expiryDate, createdAt } = req.body;
        const user = (req as any).user;

        if (!type || quantity === undefined || isNaN(Number(quantity))) {
             return res.status(400).json({ error: 'Missing or invalid type or quantity' });
        }

        const numericQty = parseFloat(quantity);
        let multiplier = 1;
        if (type === 'OUT' || type === 'WASTE') {
            multiplier = -1;
        }

        const adjustment = numericQty * multiplier;

        await db.transaction(async (tx: any) => {
            let finalSupplierId = supplierId;
            
            if (supplierName && !finalSupplierId) {
                const existingSupplier = await tx.select().from(schema.suppliers).where(eq(schema.suppliers.name, supplierName)).limit(1);
                if (existingSupplier.length > 0) {
                    finalSupplierId = existingSupplier[0].id;
                } else {
                    const [newSup] = await tx.insert(schema.suppliers).values({ name: supplierName }).returning({ id: schema.suppliers.id });
                    finalSupplierId = newSup.id;
                }
            }

            const expiry = expiryDate ? new Date(expiryDate) : null;
            const customDate = createdAt ? new Date(createdAt) : undefined;
            
            await tx.insert(schema.stockMovements).values({
                inventoryId,
                type,
                quantity: quantity.toString(),
                reason,
                supplierId: finalSupplierId,
                expiryDate: expiry,
                ...(customDate && { createdAt: customDate })
            });

            const [updatedInventory] = await tx.update(schema.inventory)
                .set({
                    currentStock: sql`${schema.inventory.currentStock} + ${adjustment}`
                })
                .where(eq(schema.inventory.id, inventoryId))
                .returning();

            // Log to Audit
            await tx.insert(schema.auditLogs).values({
                userId: user.id,
                action: `STOCK_MOVEMENT: ${type} ${quantity} for ${updatedInventory.name}`,
                tableName: 'stock_movements',
                newData: JSON.stringify({ type, quantity, reason, currentStock: updatedInventory.currentStock }),
                createdAt: new Date()
            });
        });

        res.status(200).json({ success: true, message: 'Stock updated' });
    } catch (error) {
        console.error('Error recording movement:', error);
        res.status(500).json({ error: (error as Error).message || 'Failed to record stock movement' });
    }
});
// DELETE inventory item
inventoryRouter.delete('/:id', requireAuth, async (req: Request, res: Response) => {
    try {
        const inventoryId = parseInt(req.params.id as string);
        const user = (req as any).user;

        const item = await db.select({
            id: schema.inventory.id,
            name: schema.inventory.name
        }).from(schema.inventory).where(eq(schema.inventory.id, inventoryId)).limit(1);
        if (item.length === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }

        await db.transaction(async (tx: any) => {
            // SOFT DELETE: Just set the flag and update version
            await tx.update(schema.inventory)
                .set({ 
                    isDeleted: true,
                    version: new Date()
                })
                .where(eq(schema.inventory.id, inventoryId));

            // Log to Audit
            await tx.insert(schema.auditLogs).values({
                userId: user.id,
                action: `SOFT_DELETE_INVENTORY: ${item[0].name}`,
                tableName: 'inventory',
                oldData: JSON.stringify(item[0]),
                createdAt: new Date()
            });
        });

        res.json({ success: true, message: 'Item deleted successfully' });
    } catch (error) {
        console.error('Error deleting inventory item:', error);
        res.status(500).json({ error: 'Failed to delete inventory item' });
    }
});


