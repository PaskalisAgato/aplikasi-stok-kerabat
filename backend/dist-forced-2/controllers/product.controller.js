import { ProductService } from '../services/product.service.js';
export class ProductController {
    static async getAll(req, res) {
        try {
            const outletId = req.query.outletId ? parseInt(req.query.outletId) : undefined;
            const products = await ProductService.getAllProducts(outletId);
            res.json(products);
        }
        catch (error) {
            console.error('Error in ProductController.getAll:', error);
            res.status(500).json({ error: 'Failed to fetch products' });
        }
    }
    static async getPhoto(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id))
                return res.status(400).json({ error: 'ID tidak valid' });
            const outletId = req.query.outletId ? parseInt(req.query.outletId) : undefined;
            const photo = await ProductService.getProductPhoto(id, outletId);
            if (!photo) {
                return res.status(404).json({ error: 'Foto tidak ditemukan' });
            }
            res.json({ success: true, data: photo });
        }
        catch (error) {
            console.error('Error in ProductController.getPhoto:', error);
            res.status(500).json({ error: 'Failed to fetch photo' });
        }
    }
    static async create(req, res) {
        try {
            const { name, category, price, outletId } = req.body;
            if (!name || !category || price === undefined) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            const product = await ProductService.createProduct(req.body);
            res.status(201).json(product);
        }
        catch (error) {
            console.error('Error in ProductController.create:', error);
            res.status(500).json({ error: 'Failed to create product' });
        }
    }
    static async update(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id))
                return res.status(400).json({ error: 'ID tidak valid' });
            const { name, category, price } = req.body;
            if (!name || !category || price === undefined) {
                return res.status(400).json({ error: 'Nama, kategori, dan harga wajib diisi' });
            }
            await ProductService.updateProduct(id, req.body);
            res.json({ success: true, message: 'Produk berhasil diperbarui' });
        }
        catch (error) {
            console.error(`[ProductController.update] Failed for ID ${req.params.id}:`, {
                error: error.message,
                body: req.body
            });
            res.status(500).json({
                success: false,
                error: true,
                message: error.message || 'Gagal memperbarui produk'
            });
        }
    }
    static async delete(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id))
                return res.status(400).json({ error: 'Invalid ID' });
            const outletId = req.query.outletId ? parseInt(req.query.outletId) : undefined;
            await ProductService.deleteProduct(id, outletId);
            res.json({ success: true, message: 'Product deleted' });
        }
        catch (error) {
            console.error('Error in ProductController.delete:', error);
            res.status(500).json({ error: error.message || 'Failed to delete product' });
        }
    }
}
