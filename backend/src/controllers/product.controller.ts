import { Request, Response } from 'express';
import { ProductService } from '../services/product.service.js';

export class ProductController {
    static async getAll(req: Request, res: Response) {
        try {
            const products = await ProductService.getAllProducts();
            res.json(products);
        } catch (error) {
            console.error('Error in ProductController.getAll:', error);
            res.status(500).json({ error: 'Failed to fetch products' });
        }
    }

    static async create(req: Request, res: Response) {
        try {
            const { name, category, price } = req.body;
            if (!name || !category || price === undefined) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            const product = await ProductService.createProduct(req.body);
            res.status(201).json(product);
        } catch (error) {
            console.error('Error in ProductController.create:', error);
            res.status(500).json({ error: 'Failed to create product' });
        }
    }

    static async update(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id as string);
            if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });
            
            await ProductService.updateProduct(id, req.body);
            res.json({ success: true, message: 'Product updated' });
        } catch (error) {
            console.error('Error in ProductController.update:', error);
            res.status(500).json({ error: 'Failed to update product' });
        }
    }

    static async delete(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id as string);
            if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });
            
            await ProductService.deleteProduct(id);
            res.json({ success: true, message: 'Product deleted' });
        } catch (error) {
            console.error('Error in ProductController.delete:', error);
            res.status(500).json({ error: 'Failed to delete product' });
        }
    }
}
