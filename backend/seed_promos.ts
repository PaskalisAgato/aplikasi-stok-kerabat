import "dotenv/config";
import { db } from "./src/config/db.js";
import * as schema from "./src/db/schema.js";
import { ilike, or } from "drizzle-orm";

async function run() {
    try {
        console.log("--- Menjalankan Seed Promos Kerabat Kopitiam ---");

        // 1. Cari Recipe ID berdasarkan nama secara dinamis
        const recipes = await db.select().from(schema.recipes).where(
            or(
                ilike(schema.recipes.name, '%Teh Tarik%'),
                ilike(schema.recipes.name, '%Kopi Hitam%'),
                ilike(schema.recipes.name, '%Kopi Susu%'),
                ilike(schema.recipes.name, '%Thai Tea%'),
                ilike(schema.recipes.name, '%Lemon Tea%')
            )
        );

        console.log("Ditemukan Menu Relevan:");
        recipes.forEach(r => console.log(`- ID: ${r.id} | Name: ${r.name} | Cat: ${r.category}`));

        const getIds = (keyword: string) => recipes.filter(r => r.name.toLowerCase().includes(keyword.toLowerCase())).map(r => r.id);

        const tehTarikIds = getIds("Teh Tarik");
        const kopiHitamIds = getIds("Kopi Hitam");
        const kopiSusuIds = getIds("Kopi Susu");
        const thaiTeaIds = getIds("Thai Tea");
        const lemonTeaIds = getIds("Lemon Tea");

        const insertedPromos = [];

        // Hapus promo seed lama jika ada (agar tidak dobel jika di-run ulang)
        await db.delete(schema.discounts).where(ilike(schema.discounts.name, '%[Seed]%'));

        // ============================================
        // PROMO 1: Teh Tarik 10.000 (Selama persediaan ada)
        // ============================================
        if (tehTarikIds.length > 0) {
            console.log("Menambahkan Promo Teh Tarik Kerabat Rp 10.000...");
            const p1 = await db.insert(schema.discounts).values({
                name: "[Seed] Teh Tarik Kerabat 10.000",
                type: "nominal",
                priority: 8, // High priority
                conditions: JSON.stringify({
                    productIds: tehTarikIds,
                    flatPrice: "10000"
                }),
            }).returning();
            insertedPromos.push(p1[0]);
        } else {
            console.warn("⚠️ Menu Teh Tarik tidak ditemukan. Promo dilewati.");
        }

        // ============================================
        // PROMO 2: Paket Kombo Lebih Hemat (25.000)
        // ============================================
        if (tehTarikIds.length > 0 && (kopiHitamIds.length > 0 || kopiSusuIds.length > 0)) {
            console.log("Menambahkan Promo Paket Kombo...");
            // Kombo 1: Teh Tarik + Kopi Hitam
            if (kopiHitamIds.length > 0) {
                const p2a = await db.insert(schema.discounts).values({
                    name: "[Seed] Paket Kombo: Teh Tarik + Kopi Hitam",
                    type: "bundling",
                    priority: 7,
                    conditions: JSON.stringify({
                        productIds: [tehTarikIds[0], kopiHitamIds[0]],
                        flatPrice: "25000"
                    }),
                }).returning();
                insertedPromos.push(p2a[0]);
            }
            // Kombo 2: Teh Tarik + Kopi Susu
            if (kopiSusuIds.length > 0) {
                const p2b = await db.insert(schema.discounts).values({
                    name: "[Seed] Paket Kombo: Teh Tarik + Kopi Susu",
                    type: "bundling",
                    priority: 7,
                    conditions: JSON.stringify({
                        productIds: [tehTarikIds[0], kopiSusuIds[0]],
                        flatPrice: "25000"
                    }),
                }).returning();
                insertedPromos.push(p2b[0]);
            }
        }

        // ============================================
        // PROMO 3: Flash Promo 15:00 - 16:00 (Semua 10.000)
        // ============================================
        const flashIds = [...tehTarikIds, ...thaiTeaIds, ...lemonTeaIds];
        if (flashIds.length > 0) {
            console.log("Menambahkan Flash Promo Jam 15-16...");
            const p3 = await db.insert(schema.discounts).values({
                name: "[Seed] Flash Promo 15:00 - 16:00",
                type: "time-based",
                priority: 9, // Highest priority during active hours
                conditions: JSON.stringify({
                    productIds: flashIds,
                    flatPrice: "10000",
                    startHour: 15,
                    endHour: 16
                }),
            }).returning();
            insertedPromos.push(p3[0]);
        }

        // ============================================
        // PROMO 4: Beli 2 Lebih Hemat Semua Minuman (25.000 Mix Bebas)
        // ============================================
        console.log("Menambahkan Promo Beli 2 Semua Minuman...");
        const p4 = await db.insert(schema.discounts).values({
            name: "[Seed] Beli 2 Hemat (Semua Minuman)",
            type: "mix_and_match",
            priority: 6,
            isStackable: false,
            conditions: JSON.stringify({
                category: "Minuman",
                minQty: 2,
                flatPrice: "25000"
            }),
        }).returning();
        insertedPromos.push(p4[0]);

        // ============================================
        // PROMO 5: Bonus Voucher 3.000
        // ============================================
        console.log("Menambahkan Bonus Voucher...");
        const p5 = await db.insert(schema.discounts).values({
            name: "[Seed] Bonus Repeat Voucher",
            type: "nominal",
            value: "3000",
            priority: 10, // Always applies if voucher code matches
            voucherCode: "BONUS3K",
            isStackable: true, // Can stack with flat-price combos
        }).returning();
        insertedPromos.push(p5[0]);

        console.log(`\n✅ Berhasil memasukkan ${insertedPromos.length} skenario promo!`);
        process.exit(0);

    } catch (e) {
        console.error("Terjadi Error:", e);
        process.exit(1);
    }
}
run();
