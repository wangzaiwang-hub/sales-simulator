import { Request, Response } from 'express';
import { eq, order, selectMany, selectOne } from '../lib/supabase';

export const productController = {
  async getProducts(req: Request, res: Response) {
    try {
      const { category } = req.query;

      const products = await selectMany('Product', {
        select: '*',
        ...(category ? eq('category', category as string) : {}),
        order: order('name'),
      });

      res.json(products);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get products' });
    }
  },

  async getProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const product = await selectOne('Product', {
        select: '*',
        ...eq('id', id),
      });

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      res.json(product);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get product' });
    }
  },
};
