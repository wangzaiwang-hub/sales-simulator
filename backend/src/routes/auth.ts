import express from 'express';
import { authController } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// SecondMe OAuth登录
router.post('/secondme', authController.secondmeLogin);

// 刷新token
router.post('/refresh', authController.refreshToken);

// 获取当前用户信息
router.get('/me', authMiddleware, authController.getCurrentUser);

// 更新当前用户 NPC 画像
router.put('/profile', authMiddleware, authController.updateProfile);

export default router;
