// 资源文件API端点代码片段
// 将此代码插入到 index.ts 的 "// 错误处理" 之前

/*
// 直接提供资源文件的API端点（用于Railway部署）
app.get('/api/resource/*', (req, res) => {
  const fs = require('fs');
  const resourcePath = (req.params as any)[0] as string;
  const filePath = path.join(resourceDir, resourcePath);
  
  console.log('Resource request:', resourcePath);
  console.log('Full path:', filePath);
  
  // 安全检查：确保路径在resource目录内
  const normalizedPath = path.normalize(filePath);
  const normalizedResourceDir = path.normalize(resourceDir);
  
  if (!normalizedPath.startsWith(normalizedResourceDir)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  // 检查文件是否存在
  if (!fs.existsSync(filePath)) {
    console.log('File not found:', filePath);
    return res.status(404).json({ error: 'File not found' });
  }
  
  // 检查是否是文件
  const stats = fs.statSync(filePath);
  if (!stats.isFile()) {
    return res.status(404).json({ error: 'Not a file' });
  }
  
  // 设置正确的Content-Type
  const ext = path.extname(filePath).toLowerCase();
  const contentTypes: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.json': 'application/json',
  };
  
  const contentType = contentTypes[ext] || 'application/octet-stream';
  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'public, max-age=31536000');
  
  // 发送文件
  res.sendFile(filePath);
});
*/
