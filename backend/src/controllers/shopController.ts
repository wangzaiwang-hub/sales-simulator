import { Request, Response } from 'express';
import crypto from 'crypto';
import { eq, inList, insertRows, selectMany, selectOne, updateRows } from '../lib/supabase';

type Row = Record<string, any>;

async function attachProducts(inventory: Row[]) {
  if (inventory.length === 0) {
    return inventory;
  }

  const products = await selectMany<Row>('Product', {
    select: '*',
    ...inList(
      'id',
      inventory.map((item) => item.productId),
    ),
  });

  const productMap = new Map(products.map((product) => [product.id, product]));

  return inventory.map((item) => ({
    ...item,
    product: productMap.get(item.productId) ?? null,
  }));
}

export const shopController = {
  async getShop(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;

      const shop = await selectOne<Row>('Shop', {
        select: '*',
        ...eq('userId', userId),
      });

      if (!shop) {
        return res.status(404).json({ error: 'Shop not found' });
      }

      const inventory = await selectMany<Row>('Inventory', {
        select: '*',
        ...eq('shopId', shop.id),
      });

      res.json({
        ...shop,
        inventory: await attachProducts(inventory),
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get shop' });
    }
  },

  async getInventory(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;

      const shop = await selectOne<Row>('Shop', {
        select: '*',
        ...eq('userId', userId),
      });

      if (!shop) {
        return res.status(404).json({ error: 'Shop not found' });
      }

      const inventory = await selectMany<Row>('Inventory', {
        select: '*',
        ...eq('shopId', shop.id),
      });

      res.json(await attachProducts(inventory));
    } catch (error) {
      res.status(500).json({ error: 'Failed to get inventory' });
    }
  },

  async updateInventory(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { productId } = req.params;
      const { quantity, buyPrice, sellPrice } = req.body;

      const shop = await selectOne<Row>('Shop', {
        select: '*',
        ...eq('userId', userId),
      });

      if (!shop) {
        return res.status(404).json({ error: 'Shop not found' });
      }

      const existing = await selectOne<Row>('Inventory', {
        select: '*',
        ...eq('shopId', shop.id),
        ...eq('productId', productId),
      });

      let inventory: Row | null = null;

      if (existing) {
        const [updated] = await updateRows<Row>(
          'Inventory',
          { ...eq('id', existing.id) },
          {
            ...(quantity !== undefined && { quantity }),
            ...(buyPrice !== undefined && { buyPrice }),
            ...(sellPrice !== undefined && { sellPrice }),
          },
        );
        inventory = updated;
      } else {
        const [created] = await insertRows<Row>('Inventory', {
          id: crypto.randomUUID(),
          shopId: shop.id,
          productId,
          quantity: quantity || 0,
          buyPrice: buyPrice || 0,
          sellPrice: sellPrice || 0,
        });
        inventory = created;
      }

      const product = await selectOne<Row>('Product', {
        select: '*',
        ...eq('id', productId),
      });

      res.json({
        ...inventory,
        product,
      });
    } catch (error) {
      console.error('Update inventory error:', error);
      res.status(500).json({ error: 'Failed to update inventory' });
    }
  },
};
