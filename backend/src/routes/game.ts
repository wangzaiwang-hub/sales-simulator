import express from 'express';
import { gameController } from '../controllers/gameController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// 获取所有NPC的当前状态（不需要认证，供内部调用）
router.get('/npc-states-public', gameController.getNpcStates);

// 更新所有NPC的状态（不需要认证，供内部调用）
router.post('/update-npc-states-public', gameController.updateNpcStates);

// 所有游戏路由都需要认证
router.use(authMiddleware);

// 获取游戏进度
router.get('/progress', gameController.getProgress);

// 更新游戏进度
router.put('/progress', gameController.updateProgress);

// 获取当前用户地图
router.get('/map', gameController.getMap);

// 保存当前用户地图
router.put('/map', gameController.saveMap);

// 创建交易
router.post('/transaction', gameController.createTransaction);

// 获取交易历史
router.get('/transactions', gameController.getTransactions);

// 与 NPC 对话
router.post('/npc-chat', gameController.chatWithNpc);

// 获取关系列表
router.get('/relationships', gameController.getRelationships);

// 获取聊天历史
router.get('/chat-history', gameController.getChatHistory);

// 获取所有NPC的当前状态
router.get('/npc-states', gameController.getNpcStates);

// 更新所有NPC的状态（AI驱动）
router.post('/update-npc-states', gameController.updateNpcStates);

// 获取角色外观
router.get('/character-appearance', gameController.getCharacterAppearance);

// 更新角色外观
router.put('/character-appearance', gameController.updateCharacterAppearance);

export default router;
