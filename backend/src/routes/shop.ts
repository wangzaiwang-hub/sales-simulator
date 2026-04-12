import express from 'express';
import { shopController } from '../controllers/shopController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

router.use(authMiddleware);

// 获取商店信息
router.get('/', shopController.getShop);

// 获取库存
router.get('/inventory', shopController.getInventory);

// 更新库存
router.put('/inventory/:productId', shopController.updateInventory);

export default router;
