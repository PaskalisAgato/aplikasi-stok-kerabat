/**
 * Centralized Mock Database for Kerabat POS Stok System
 * Synchronizes data across all 13 monorepo applications.
 */

export interface InventoryItem {
    id: number;
    name: string;
    category: string;
    unit: string;
    currentStock: number;
    systemStock: number;
    minStock: number;
    supplier: string;
    status: 'NORMAL' | 'KRITIS' | 'HABIS';
    pricePerUnit: number;
    imageUrl?: string;
    hasImage?: boolean;
}

export interface Expense {
    id: number;
    title: string;
    category: 'Bahan Baku' | 'Operasional' | 'Pemeliharaan' | 'Lainnya';
    date: string;
    amount: number;
    imageUrl?: string;
    receiptUrl?: string;
    hasReceipt?: boolean;
}

export interface Employee {
    id: number;
    name: string;
    role: 'Owner' | 'Manager' | 'Barista' | 'Server';
    status: 'Aktif' | 'Cuti' | 'Off';
    lastActive: string;
    image: string;
}

export interface RecipeIngredient {
    ingredientId: number;
    name: string;
    qty: number;
    unit: string;
}

export interface Recipe {
    id: number;
    name: string;
    description: string;
    category: 'Minuman' | 'Makanan' | 'Snack';
    hpp: number;
    price: number;
    margin: number;
    overhead: number;
    ingredients: RecipeIngredient[];
    imageUrl?: string;
    hasImage?: boolean;
}

export const INVENTORY: InventoryItem[] = [
    {
        id: 1,
        name: 'Signature Espresso Beans',
        category: 'Kopi',
        unit: 'kg',
        currentStock: 14.50,
        systemStock: 15.00,
        minStock: 5.0,
        supplier: 'Gayo Highlands Co.',
        status: 'NORMAL',
        pricePerUnit: 250000,
        imageUrl: ''
    },
    {
        id: 2,
        name: 'Gula Aren (Liquid)',
        category: 'Pemanis',
        unit: 'L',
        currentStock: 1.5,
        systemStock: 2.0,
        minStock: 5.0,
        supplier: 'Java Sweets Ltd.',
        status: 'KRITIS',
        pricePerUnit: 45000,
    },
    {
        id: 3,
        name: 'Susu UHT (Ultra High Temperature)',
        category: 'Susu',
        unit: 'L',
        currentStock: 12.0,
        systemStock: 12.0,
        minStock: 20.0,
        supplier: 'Frisian Flag Ind.',
        status: 'KRITIS',
        pricePerUnit: 18000,
    },
    {
        id: 4,
        name: 'Bubuk Kopi Robusta',
        category: 'Kopi',
        unit: 'g',
        currentStock: 2000,
        systemStock: 2000,
        minStock: 1000,
        supplier: 'Local Roast',
        status: 'NORMAL',
        pricePerUnit: 150,
    },
    {
        id: 5,
        name: 'Gula Pasir',
        category: 'Pemanis',
        unit: 'g',
        currentStock: 5000,
        systemStock: 5000,
        minStock: 2000,
        supplier: 'Indosugar',
        status: 'NORMAL',
        pricePerUnit: 15,
    }
];

export const EXPENSES: Expense[] = [
    {
        id: 1,
        title: 'Biji Kopi Arabika 5kg',
        category: 'Bahan Baku',
        date: '12 Okt',
        amount: 1250000,
        imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCYw2HfPAe8zfGJcB0VzrkrnyK7VQPfhfMdjUFcVaouxHHNhExNHzTrvrExSQ9A1rnZ3t3ubNGj6ggA6V5gbRNj01yt0JJEdh4RThkBIdkEXH0BwWcoIRuSazUBY1v6lUlA0soNcNLdGFsEBctVlTSOOPNfcWCZYUwq456t98VeHHD8DG03oIsjbRp_DugP2oKsRccj3tjJBmkohRSQWyQ14AFNqw4cMYpzeA-_bid9G9AgIsIjFhuGtZiJIMCp74xyJXvzmn4I2mM",
    },
    {
        id: 2,
        title: 'Listrik & Air',
        category: 'Operasional',
        date: '10 Okt',
        amount: 2400000,
    },
    {
        id: 3,
        title: 'Servis Mesin Espresso',
        category: 'Pemeliharaan',
        date: '08 Okt',
        amount: 850000,
    },
    {
        id: 4,
        title: 'Susu UHT 10 Karton',
        category: 'Bahan Baku',
        date: '05 Okt',
        amount: 1800000,
    }
];

export const EMPLOYEES: Employee[] = [
    {
        id: 1,
        name: 'Budi Santoso',
        role: 'Barista',
        status: 'Aktif',
        lastActive: '5 menit yang lalu',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBUsUqk-odior0NZzqURl7FAZ5yjl3o0tDZc3oZ2rHyeukgFgRjyjS83WCuTp3irHiZrcoozW5IC2T5_qcMvOLWEB99_OfNwaCg5Z0vDiE7b8Rh5_vdGGHCn1wMpnwp2hWyQUEyBOJ6CaX194kO52mP4VWwdSTddtmt24T2I4NPz31Qfv2Wu9kAxtdacDLtxfoMk_5-HRuNcCXwI9jMHkZUdt1rvQ9CIaV_NLIIW_GaVmHfMyagQg-9_HjjZFT9E3-yK73SaYNoPdo'
    },
    {
        id: 2,
        name: 'Ani Wijaya',
        role: 'Server',
        status: 'Aktif',
        lastActive: '15 menit yang lalu',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBUsUqk-odior0NZzqURl7FAZ5yjl3o0tDZc3oZ2rHyeukgFgRjyjS83WCuTp3irHiZrcoozW5IC2T5_qcMvOLWEB99_OfNwaCg5Z0vDiE7b8Rh5_vdGGHCn1wMpnwp2hWyQUEyBOJ6CaX194kO52mP4VWwdSTddtmt24T2I4NPz31Qfv2Wu9kAxtdacDLtxfoMk_5-HRuNcCXwI9jMHkZUdt1rvQ9CIaV_NLIIW_GaVmHfMyagQg-9_HjjZFT9E3-yK73SaYNoPdo'
    }
];

export const RECIPES: Recipe[] = [
    {
        id: 1,
        name: 'Kopi O',
        description: 'Kopi hitam pekat khas Kopitiam',
        category: 'Minuman',
        hpp: 4500,
        price: 12000,
        margin: 62,
        overhead: 10,
        ingredients: [
            { ingredientId: 4, name: 'Bubuk Kopi Robusta', qty: 20, unit: 'g' },
            { ingredientId: 5, name: 'Gula Pasir', qty: 10, unit: 'g' }
        ],
        imageUrl: ''
    },
    {
        id: 2,
        name: 'Teh Tarik',
        description: 'Teh susu tarik berbusa halus',
        category: 'Minuman',
        hpp: 6200,
        price: 15000,
        margin: 58,
        overhead: 12,
        ingredients: [
            { ingredientId: 6, name: 'Teh Bubuk', qty: 15, unit: 'g' },
            { ingredientId: 3, name: 'Susu UHT', qty: 100, unit: 'mL' }
        ],
        imageUrl: 'https://images.unsplash.com/photo-1561560613-cf6a1d8db045?q=80&w=200&auto=format&fit=crop'
    }
];
