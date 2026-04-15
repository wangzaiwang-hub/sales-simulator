import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth';
import gameRoutes from './routes/game';
import shopRoutes from './routes/shop';
import productRoutes from './routes/product';
import mapEditorRoutes from './routes/mapEditor';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const corsOrigin = process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'https://sales-simulator-zeta.vercel.app';

const toolsDir = path.resolve(__dirname, '../');

console.log('Tools directory:', toolsDir);
console.log('CORS origin:', corsOrigin);

app.use(cors({
  origin: corsOrigin,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 地图编辑器专用保存端点 - 完全公开，不需要认证
app.post('/api/map-editor/save', async (req, res) => {
  try {
    const { map, mapName } = req.body;
    
    console.log('=== Map Editor Save Request ===');
    console.log('Map name:', mapName);
    console.log('Has map data:', !!map);
    
    if (!map || !mapName) {
      return res.status(400).json({ error: 'Map and mapName are required' });
    }
    
    const { selectMany, insertRows, updateRows, eq } = await import('./lib/supabase');
    const mapJson = JSON.stringify(map);
    
    // 检查是否已存在同名地图
    const existingMaps = await selectMany('SharedMap', { ...eq('name', mapName) });
    
    if (existingMaps && existingMaps.length > 0) {
      // 更新现有地图
      console.log('Updating existing map:', mapName);
      const [updated] = await updateRows('SharedMap', { ...eq('name', mapName) }, { mapData: mapJson }) as any[];
      
      console.log('Map updated successfully:', updated?.id);
      return res.json({
        message: 'Map updated successfully',
        mapId: updated?.id,
        mapName: updated?.name,
      });
    } else {
      // 创建新地图
      console.log('Creating new map:', mapName);
      const [created] = await insertRows('SharedMap', {
        name: mapName,
        mapData: mapJson,
        isActive: false,
      }) as any[];
      
      console.log('Map created successfully:', created?.id);
      return res.json({
        message: 'Map saved successfully',
        mapId: created?.id,
        mapName: created?.name,
      });
    }
  } catch (error) {
    console.error('Save map error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to save map' });
  }
});

// 地图保存端点 - 放在路由注册之前，不需要认证
app.post('/api/game/save-map-temp', async (req, res) => {
  try {
    const { map, mapName } = req.body;
    
    console.log('Received save map request:', { mapName, hasMap: !!map });
    
    if (!map || !mapName) {
      return res.status(400).json({ error: 'Map and mapName are required' });
    }
    
    const { selectMany, insertRows, updateRows, eq } = await import('./lib/supabase');
    const mapJson = JSON.stringify(map);
    
    // 检查是否已存在同名地图
    const existingMaps = await selectMany('SharedMap', { ...eq('name', mapName) });
    
    if (existingMaps && existingMaps.length > 0) {
      // 更新现有地图
      console.log('Updating existing map:', mapName);
      const [updated] = await updateRows('SharedMap', { ...eq('name', mapName) }, { mapData: mapJson }) as any[];
      
      console.log('Map updated successfully:', updated?.id);
      return res.json({
        message: 'Map updated successfully',
        mapId: updated?.id,
        mapName: updated?.name,
      });
    } else {
      // 创建新地图
      console.log('Creating new map:', mapName);
      const [created] = await insertRows('SharedMap', {
        name: mapName,
        mapData: mapJson,
        isActive: false,
      }) as any[];
      
      console.log('Map created successfully:', created?.id);
      return res.json({
        message: 'Map saved successfully',
        mapId: created?.id,
        mapName: created?.name,
      });
    }
  } catch (error) {
    console.error('Save map error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to save map' });
  }
});

// 提供工具页面（HTML文件）
app.get('/tools/tileset-editor', (req, res) => {
  res.sendFile(path.join(toolsDir, 'tileset-editor.html'));
});

app.get('/tools/map-test', (req, res) => {
  res.sendFile(path.join(toolsDir, 'map-test.html'));
});

app.get('/tools/map-editor', (req, res) => {
  res.sendFile(path.join(toolsDir, 'map-editor.html'));
});

app.get('/tools/character-creator', (req, res) => {
  res.sendFile(path.join(toolsDir, 'character-creator.html'));
});

app.get('/tools/character-customizer', (req, res) => {
  res.sendFile(path.join(toolsDir, 'character-customizer.html'));
});

app.get('/tools/character-editor', (req, res) => {
  res.sendFile(path.join(toolsDir, 'character-editor.html'));
});

app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/products', productRoutes);
app.use('/api/map-editor', mapEditorRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Map payload is too large' });
  }

  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
  console.log('Environment: ' + (process.env.NODE_ENV || 'development'));
  
  setInterval(async () => {
    try {
      console.log('Updating NPC states...');
      const response = await fetch('http://localhost:' + PORT + '/api/game/update-npc-states-public', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data: any = await response.json();
        console.log('Updated ' + (data.updates?.length || 0) + ' NPC states');
      }
    } catch (error) {
      console.error('Failed to update NPC states:', error);
    }
  }, 5 * 60 * 1000);
  
  console.log('NPC state update task started (every 5 minutes)');
});
