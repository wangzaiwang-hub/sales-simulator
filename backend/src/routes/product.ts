import express from 'express';
import { productController } from '../controllers/productController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

router.use(authMiddleware);

// 获取所有商品
router.get('/', productController.getProducts);

// 获取单个商品
router.get('/:id', productController.getProduct);

export default router;
