import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth';
import gameRoutes from './routes/game';
import shopRoutes from './routes/shop';
import productRoutes from './routes/product';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const corsOrigin = process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'https://sales-simulator-zeta-tau.vercel.app';

// 资源目录 - 本地开发时使用 ../resource，生产使用 /app/resource
const resourceDir = process.env.NODE_ENV === 'production' 
  ? path.resolve('/app/resource')
  : path.resolve(__dirname, '../../resource');

console.log('Resource directory:', resourceDir);

// 中间件
app.use(cors({
  origin: corsOrigin,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态资源
try {
  app.use('/resource', express.static(resourceDir));
  console.log('Resource static middleware enabled');
} catch (e) {
  console.log('Resource directory not found, skipping static middleware');
}
app.get('/tools/tileset-editor', (req, res) => {
  res.sendFile(resolveToolFile('tileset-editor.html'));
});
app.get('/tools/map-test', (req, res) => {
  res.sendFile(resolveToolFile('map-test.html'));
});
app.get('/tools/character-editor', (req, res) => {
  res.sendFile(resolveToolFile('character-editor.html'));
});
app.get('/tools/character-customizer', (req, res) => {
  res.sendFile(resolveToolFile('character-customizer.html'));
});
app.get('/tools/character-creator', (req, res) => {
  res.sendFile(resolveToolFile('character-creator.html'));
});
app.get('/tools/test-character-assets', (req, res) => {
  res.sendFile(resolveToolFile('test-character-assets.html'));
});
app.get('/tools/test-assets', (req, res) => {
  res.sendFile(resolveToolFile('test-assets.html'));
});

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/products', productRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 获取角色素材列表
app.get('/api/character-assets', (req, res) => {
  const fs = require('fs');
  const assetsPath = path.join(resourceDir, '32x32 Customizable Character Pack', 'Walk');
  
  try {
    const assets: Record<string, string[]> = {
      character: [],
      clothing: [],
      hair: [],
      eyes: []
    };

    // 读取各个文件夹
    const folders = ['Character', 'Clothing', 'Hair', 'Eyes'];
    folders.forEach(folder => {
      const folderPath = path.join(assetsPath, folder);
      if (fs.existsSync(folderPath)) {
        const files = fs.readdirSync(folderPath);
        assets[folder.toLowerCase()] = files.filter((f: string) => f.endsWith('.png'));
      }
    });

    res.json(assets);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Unknown error' });
  }
});

// 错误处理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Map payload is too large' });
  }

  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // 启动NPC状态定期更新任务（每5分钟）
  setInterval(async () => {
    try {
      console.log('🔄 Updating NPC states...');
      const response = await fetch(`http://localhost:${PORT}/api/game/update-npc-states-public`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data: any = await response.json();
        console.log(`✅ Updated ${data.updates?.length || 0} NPC states`);
      }
    } catch (error) {
      console.error('❌ Failed to update NPC states:', error);
    }
  }, 5 * 60 * 1000); // 5分钟
  
  console.log('⏰ NPC state update task started (every 5 minutes)');
});
