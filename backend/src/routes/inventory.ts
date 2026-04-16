import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import * as schema from '../db/schema.js';
import { eq, sql, and, gte, desc, ilike } from 'drizzle-orm';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { validateBase64Image } from '../middleware/validateImage.js';
import ExcelJS from 'exceljs';

export const inventoryRouter = Router();

// High-performance state/cache for Phase 4
const inventoryCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 30 * 1000; // 30 seconds

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

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Inventory_Kerabat_POS.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error: any) {
        console.error('Export Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: 'Gagal mengekspor data inventaris' });
        }
    }
});

// GET all inventory items with pagination, search, targeted IDs, and filtering
inventoryRouter.get('/', async (req: Request, res: Response) => {
    try {
        // 1. Input Validation & Parsing
        const maxLimit = 100; // Strict limit for production
        const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 20, 1), maxLimit);
        const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);
        const search = (req.query.search as string || '').trim();
        const statusFilter = req.query.status as string; // 'Normal', 'Kritis'
        const categoryFilter = req.query.category as string;
        const idsParam = req.query.ids as string;

        // Hardened IDs parsing: numeric filter, uniqueness, and max limit of 50
        let targetIds: number[] = [];
        if (idsParam) {
            const parsedIds = idsParam.split(',')
                .map(id => parseInt(id.trim()))
                .filter(id => !isNaN(id));
            // Take unique IDs and limit to 50 to prevent heavy queries
            targetIds = [...new Set(parsedIds)].slice(0, 50);
        }

        const cacheKey = `list_${limit}_${offset}_${search}_${statusFilter || ''}_${categoryFilter || ''}_${idsParam || ''}`;

        // 1. Check In-Memory Cache
        const cached = inventoryCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            res.setHeader('X-Cache-Status', 'HIT');
            return res.json(cached.data);
        }

        // 2. Build Base Where Clause (Optimized indexing handles this)
        let filters = [eq(schema.inventory.isDeleted, false)];
        
        if (targetIds.length > 0) {
            // Priority: If IDs are requested, we fetch exactly those IDs
            filters.push(sql`${schema.inventory.id} IN ${targetIds}`);
        } else if (search) {
            // Search filtering
            filters.push(ilike(schema.inventory.name, `%${search}%`));
        }

        // SQL-level Status Filtering Logic
        // NORMAL: currentStock > minStock
        // KRITIS/HABIS: currentStock <= minStock
        if (statusFilter === 'Normal') {
            filters.push(sql`${schema.inventory.currentStock} > ${schema.inventory.minStock}`);
        } else if (statusFilter === 'Kritis') {
            filters.push(sql`${schema.inventory.currentStock} <= ${schema.inventory.minStock}`);
        }

        if (categoryFilter && categoryFilter !== 'Semua') {
            filters.push(eq(schema.inventory.category, categoryFilter));
        }

        const whereClause = and(...filters);

        // 3. Get Total Count (for meta)
        const [countResult] = await db.select({
            count: sql<number>`count(*)`
        })
        .from(schema.inventory)
        .where(whereClause);

        const total = Number(countResult?.count || 0);

        // 4. Fetch Paginated Data with Selected Fields (Omit potentially large imageUrl)
        const rawItems = await db.select({
            id: schema.inventory.id,
            name: schema.inventory.name,
            category: schema.inventory.category,
            unit: schema.inventory.unit,
            currentStock: schema.inventory.currentStock,
            minStock: schema.inventory.minStock,
            pricePerUnit: schema.inventory.pricePerUnit,
            idealStock: schema.inventory.idealStock,
            containerWeight: schema.inventory.containerWeight,
            containerId: schema.inventory.containerId,
            imageUrl: sql`CASE WHEN ${schema.inventory.imageUrl} LIKE 'http%' THEN ${schema.inventory.imageUrl} ELSE NULL END`, // Prevent base64 from crashing the list view
            externalImageUrl: schema.inventory.externalImageUrl,
            hasImage: sql`CASE WHEN ${schema.inventory.imageUrl} IS NOT NULL THEN true ELSE false END`,
            version: schema.inventory.version,
        })
        .from(schema.inventory)
        .where(whereClause)
        .orderBy(desc(schema.inventory.createdAt))
        .limit(limit)
        .offset(offset);

        // 5. Post-process Status Label (cheap maps on small paged size)
        const pagedItems = rawItems.map(item => {
            const current = parseFloat(item.currentStock);
            const min = parseFloat(item.minStock);
            let status: 'NORMAL' | 'KRITIS' | 'HABIS' = 'NORMAL';
            if (current <= 0) status = 'HABIS';
            else if (current <= min) status = 'KRITIS';
            return { ...item, status };
        });

        const responseData = { 
            success: true, 
            data: pagedItems,
            meta: {
                total,
                limit,
                offset
            }
        };

        // 6. Update Cache
        inventoryCache.set(cacheKey, { data: responseData, timestamp: Date.now() });

        res.setHeader('X-Cache-Status', 'MISS');
        res.json(responseData);
    } catch (error: any) {
        console.error('Inventory Fetch Error:', error);
        res.status(500).json({ 
            success: false, 
            error: true,
            message: 'Gagal mengambil data inventaris',
            details: error.message 
        });
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
            containerWeight: schema.inventory.containerWeight,
            idealStock: schema.inventory.idealStock,
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

        if (!item) return res.status(404).json({ success: false, message: 'Item tidak ditemukan' });
        res.json({ success: true, data: item }); // Changed from `item[0]` to `item` because `[item]` already destructures it.
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal mengambil detail item' }); // Changed message as per instruction
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

        res.json({ success: true, data: logs });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal mengambil log harga' });
    }
});

// GET Waste Summary (Phase 4 Optimized SQL)
inventoryRouter.get('/waste/summary', async (req: Request, res: Response) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // 1. Optimized Total Waste Value (Native SQL SUM)
        const totalValueExpr = sql<number>`COALESCE(SUM(CAST(${schema.stockMovements.quantity} AS float) * CAST(${schema.inventory.pricePerUnit} AS float)), 0)`;
        const totalWasteResult = await db.select({
            total: totalValueExpr
        })
        .from(schema.stockMovements)
        .innerJoin(schema.inventory, eq(schema.stockMovements.inventoryId, schema.inventory.id))
        .where(
            and(
                eq(schema.stockMovements.type, 'WASTE'),
                gte(schema.stockMovements.createdAt, thirtyDaysAgo)
            )
        );

        // 2. Top Waste Offenders (Already O(1) SQL)
        const wasteValueExpr = sql<number>`SUM(CAST(${schema.stockMovements.quantity} AS float) * CAST(${schema.inventory.pricePerUnit} AS float))`.as('total_waste_value');
        
        const topOffenders = await db.select({
            id: schema.inventory.id,
            name: schema.inventory.name,
            unit: schema.inventory.unit,
            totalWasteValue: wasteValueExpr
        })
        .from(schema.stockMovements)
        .innerJoin(schema.inventory, eq(schema.stockMovements.inventoryId, schema.inventory.id))
        .where(eq(schema.stockMovements.type, 'WASTE'))
        .groupBy(schema.inventory.id, schema.inventory.name, schema.inventory.unit)
        .orderBy(desc(wasteValueExpr))
        .limit(5);

        console.log(`[WasteSummary] Success. Months Total: ${totalWasteResult[0]?.total}, Offenders: ${topOffenders.length}`);

        res.json({
            success: true,
            data: {
                totalValueMonth: Number(totalWasteResult[0]?.total || 0),
                topOffenders
            }
        });
    } catch (error: any) {
        console.error('Waste Summary Critical Error:', {
            message: error.message,
            stack: error.stack,
            query: 'GET /waste/summary'
        });
        res.status(500).json({ 
            success: false, 
            message: 'Gagal mengambil ringkasan limbah',
            details: error.message 
        });
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

        res.json({ success: true, data: wasteLogs });
    } catch (error) {
        console.error('Error fetching item waste logs:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil log limbah item' });
    }
});

// POST Bulk Stock Opname
inventoryRouter.post('/opname', requireAuth, async (req: Request, res: Response) => {
    try {
        const { adjustments } = req.body;
        const user = (req as any).user;

        if (!adjustments || !Array.isArray(adjustments)) {
            return res.status(400).json({ success: false, message: 'Invalid adjustments data' });
        }

        await db.transaction(async (tx) => {
            for (const adj of adjustments) {
                const { inventoryId, physicalStock, reason } = adj;
                
                // 1. Get current stock
                const [item] = await tx.select({
                    id: schema.inventory.id,
                    name: schema.inventory.name,
                    currentStock: schema.inventory.currentStock
                })
                .from(schema.inventory)
                .where(eq(schema.inventory.id, inventoryId))
                .limit(1);

                if (!item) continue;

                const currentStock = parseFloat(item.currentStock);
                const targetStock = parseFloat(physicalStock);
                const delta = targetStock - currentStock;

                if (delta === 0) continue;

                // 2. record movement
                await tx.insert(schema.stockMovements).values({
                    inventoryId,
                    type: 'OPNAME_ADJUSTMENT',
                    quantity: Math.abs(delta).toString(),
                    reason: reason || 'Manual Opname',
                    createdAt: new Date()
                });

                // 3. Update current stock
                await tx.update(schema.inventory)
                    .set({
                        currentStock: targetStock.toString(),
                        version: new Date()
                    })
                    .where(eq(schema.inventory.id, inventoryId));

                // 4. Log to Audit
                await tx.insert(schema.auditLogs).values({
                    userId: user.id,
                    action: `OPNAME_ADJUSTMENT: ${item.name} from ${currentStock} to ${targetStock}`,
                    tableName: 'inventory',
                    oldData: JSON.stringify({ currentStock: currentStock.toString() }),
                    newData: JSON.stringify({ currentStock: targetStock.toString(), reason }),
                    createdAt: new Date()
                });
            }
        });

        res.json({ success: true, message: 'Stock opname processed successfully' });
    } catch (error: any) {
        console.error('Opname Error:', error);
        res.status(500).json({ success: false, message: 'Gagal memproses stock opname', details: error.message });
    }
});

// POST new inventory item
    inventoryRouter.post('/', validateBase64Image('imageUrl'), async (req: Request, res: Response) => {
    try {
        const { name, category, unit, minStock, idealStock, pricePerUnit, discountPrice, containerWeight, containerId, imageUrl, currentStock, physicalStock } = req.body;
        
        if (!name || !category || !unit) {
             return res.status(400).json({ success: false, message: 'Kolom yang wajib diisi tidak lengkap' });
        }

        const wadah = parseFloat(containerWeight?.toString() || '0');
        let initialStock = '0';
        if (physicalStock !== undefined) {
            initialStock = (parseFloat(physicalStock.toString()) - wadah).toString();
        } else if (currentStock !== undefined) {
            initialStock = currentStock.toString();
        }

        const [newItem] = await db.insert(schema.inventory).values({
            name,
            category,
            unit,
            currentStock: initialStock,
            minStock: minStock?.toString() || '0',
            idealStock: idealStock?.toString() || '0',
            pricePerUnit: pricePerUnit?.toString() || '0',
            discountPrice: discountPrice?.toString() || '0',
            containerWeight: containerWeight?.toString() || '0',
            containerId: containerId ? parseInt(containerId.toString()) : null,
            imageUrl
        }).returning({
            id: schema.inventory.id,
            name: schema.inventory.name
        });

        res.status(201).json({ success: true, data: newItem });
    } catch (error) {
        console.error('Error creating inventory item:', error);
        res.status(500).json({ success: false, message: 'Gagal membuat item baru' });
    }
});

// PUT update inventory item master data (Hardened for Price & RBAC)
inventoryRouter.put('/:id', requireAdmin, validateBase64Image('imageUrl'), async (req: Request, res: Response) => {
    try {
        const inventoryId = parseInt(req.params.id as string);
        const { name, category, unit, minStock, idealStock, pricePerUnit, discountPrice, containerWeight, containerId, imageUrl, currentStock, physicalStock, version } = req.body;
        const user = (req as any).user;

        // 1. Validation
        if (pricePerUnit !== undefined && (isNaN(Number(pricePerUnit)) || Number(pricePerUnit) < 0)) {
            return res.status(400).json({ success: false, message: 'Harga beli tidak valid' });
        }
        if (discountPrice !== undefined && (isNaN(Number(discountPrice)) || Number(discountPrice) < 0)) {
            return res.status(400).json({ success: false, message: 'Harga diskon tidak valid' });
        }
        if (pricePerUnit !== undefined && discountPrice !== undefined && Number(discountPrice) > Number(pricePerUnit)) {
            return res.status(400).json({ success: false, message: 'Harga diskon tidak boleh lebih besar dari harga beli' });
        }

        const results = await db.transaction(async (tx: any) => {
            const oldItemArr = await tx.select({
                id: schema.inventory.id,
                name: schema.inventory.name,
                pricePerUnit: schema.inventory.pricePerUnit,
                discountPrice: schema.inventory.discountPrice,
                containerWeight: schema.inventory.containerWeight,
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
            const currentContainerWeight = containerWeight !== undefined ? parseFloat(containerWeight.toString()) : parseFloat(oldItem.containerWeight || '0');
            
            // Deduction logic: If physicalStock is provided, use it to calculate net stock.
            // Otherwise, use currentStock (which is assumed to be net if unchanged).
            let newStock = oldStock;
            let currentGross = 0;
            let currentTare = currentContainerWeight;

            if (physicalStock !== undefined) {
                currentGross = parseFloat(physicalStock.toString());
                
                // If a containerId is provided, we should probably fetch it, but for speed, 
                // we'll rely on the tare being passed if it's a "custom" one or the item's default.
                // In a stricter system, we'd fetch the container by ID here.
                
                if (currentGross < currentTare) {
                    return { error: `Berat kotor (${currentGross}) tidak boleh lebih kecil dari berat wadah (${currentTare})`, status: 400 };
                }
                
                newStock = currentGross - currentTare;
                
                // Snapshot logging
                await tx.insert(schema.inventorySnapshots).values({
                    inventoryId,
                    grossWeight: currentGross.toString(),
                    tareWeight: currentTare.toString(),
                    netWeight: newStock.toString(),
                    measuredBy: user.id,
                    source: 'MANUAL',
                    timestamp: new Date()
                });

            } else if (currentStock !== undefined) {
                newStock = parseFloat(currentStock.toString());
            }
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
                    ...(idealStock !== undefined && { idealStock: idealStock.toString() }),
                    ...(pricePerUnit !== undefined && { pricePerUnit: newPrice }),
                    ...(discountPrice !== undefined && { discountPrice: newDiscount }),
                    ...(containerWeight !== undefined && { containerWeight: containerWeight.toString() }),
                    ...(containerId !== undefined && { containerId: containerId ? parseInt(containerId.toString()) : null }),
                    ...(imageUrl !== undefined && { imageUrl }),
                    ...(newStock !== oldStock && { currentStock: newStock.toString() }),
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
                    containerWeight: schema.inventory.containerWeight,
                    idealStock: schema.inventory.idealStock,
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
            return res.status(404).json({ success: false, message: 'Item tidak ditemukan' }); // Changed message as per instruction
        }

        res.json({ success: true, data: results });
    } catch (error) {
        console.error('Error updating inventory item:', error);
        res.status(500).json({ success: false, message: 'Gagal memperbarui item inventaris' });
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

        res.json({
            success: true,
            data: movements,
            meta: { total: movements.length, limit: 20, page: 1 }
        });
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

        res.json({
            success: true,
            data: history,
            meta: { total: history.length, limit: 50, page: 1 }
        });
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

            // Weight Snapshot Integration
            if (req.body.grossWeight !== undefined && req.body.tareWeight !== undefined) {
                await tx.insert(schema.inventorySnapshots).values({
                    inventoryId,
                    grossWeight: req.body.grossWeight.toString(),
                    tareWeight: req.body.tareWeight.toString(),
                    netWeight: quantity.toString(),
                    measuredBy: user.id,
                    source: 'MANUAL',
                    timestamp: customDate || new Date()
                });
            }

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
                newData: JSON.stringify({ type, quantity, reason, currentStock: updatedInventory.currentStock, grossWeight: req.body.grossWeight, tareWeight: req.body.tareWeight }),
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


