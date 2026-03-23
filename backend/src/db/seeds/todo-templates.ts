import { db } from '../index.js';
import { todos } from '../schema.js';

const ADMIN_ID = 'admin_primary';

const openingTasks = [
    { title: 'Bersihkan area café', description: 'Meja, kursi, dan lantai harus bersih dan rapi.' },
    { title: 'Nyalakan mesin & peralatan', description: 'Mesin kopi, grinder, dan peralatan elektronik lainnya.' },
    { title: 'Cek stok bahan baku', description: 'Kopi, teh, susu, roti, dan topping.' },
    { title: 'Siapkan display menu', description: 'Pastikan papan menu dan harga sudah sesuai.' },
    { title: 'Siapkan alat servis', description: 'Cup, sendok, dan peralatan makan lainnya.' },
    { title: 'Cek kebersihan toilet', description: 'Pastikan tisu dan sabun tersedia, serta lantai kering.' },
    { title: 'Siapkan kasir / POS', description: 'Pastikan sistem menyala dan modal awal tersedia.' },
    { title: 'Pasang poster promosi', description: 'Verifikasi atau pasang materi promosi yang berlaku.' },
];

const closingTasks = [
    { title: 'Bersihkan area café', description: 'Meja, kursi, dan lantai dibersihkan untuk besok.' },
    { title: 'Matikan mesin & peralatan', description: 'Pastikan semua mesin kopi dan listrik yang tidak perlu sudah mati.' },
    { title: 'Simpan sisa bahan baku', description: 'Simpan bahan makanan/minuman sisa di tempat aman/pendingin.' },
    { title: 'Hitung kas harian', description: 'Hitung uang tunai dan buat laporan penjualan harian.' },
    { title: 'Rapikan dekorasi & furnitur', description: 'Atur kembali meja, kursi, dan dekorasi.' },
    { title: 'Kosongkan tempat sampah', description: 'Buang sampah dan bersihkan tong sampah.' },
    { title: 'Matikan lampu & elektronik', description: 'Matikan lampu yang tidak diperlukan.' },
    { title: 'Kunci café & cek keamanan', description: 'Pastikan semua pintu, jendela, dan alarm aman.' },
];

async function seed() {
    console.log('--- Seeding Daily Checklist Templates ---');
    
    const tasks = [
        ...openingTasks.map(t => ({ ...t, category: 'Opening', isRecurring: true, createdBy: ADMIN_ID })),
        ...closingTasks.map(t => ({ ...t, category: 'Closing', isRecurring: true, createdBy: ADMIN_ID })),
    ];

    for (const task of tasks) {
        await db.insert(todos).values(task).onConflictDoNothing();
        console.log(`Inserted: [${task.category}] ${task.title}`);
    }

    console.log('--- Seeding Completed ---');
    process.exit(0);
}

seed();
