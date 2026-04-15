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
