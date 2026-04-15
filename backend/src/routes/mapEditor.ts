import express from 'express';
import { mapEditorController } from '../controllers/mapEditorController';

const router = express.Router();

// 地图编辑器专用路由（不需要认证）
router.get('/list', mapEditorController.getMapList);
router.get('/map', mapEditorController.getMap);
router.post('/map', mapEditorController.saveMap);
router.delete('/map/:id', mapEditorController.deleteMap);
router.get('/shared', mapEditorController.getSharedMap);
router.post('/active', mapEditorController.setActiveMap);

export default router;
