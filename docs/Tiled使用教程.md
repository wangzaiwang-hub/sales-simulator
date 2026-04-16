# 🗺️ Tiled Map Editor 快速入门教程

## 什么是Tiled？

Tiled是一个免费、开源的2D地图编辑器，专门用于创建游戏地图。它支持多种游戏引擎，是2D游戏开发的标准工具。

## 📥 安装Tiled

### 下载
访问官网：https://www.mapeditor.org/

### 各平台安装
- **Windows**: 下载.msi安装包，双击安装
- **macOS**: 下载.dmg文件，拖到Applications文件夹
- **Linux**: 使用包管理器或下载AppImage

## 🎯 5分钟快速上手

### 第1步：创建新地图

1. 打开Tiled
2. 点击 `File` → `New` → `New Map...`
3. 设置参数：
   - **Orientation**: Orthogonal（正交）
   - **Tile layer format**: CSV
   - **Tile size**: 48 x 48（根据你的素材调整）
   - **Map size**: 17 x 13（宽x高，单位是瓦片数量）
4. 点击 `Save As...` 保存地图

### 第2步：导入瓦片集

1. 在右侧 `Tilesets` 面板，点击 `New Tileset` 按钮
2. 选择 `Based on Tileset Image`
3. 点击 `Browse...` 选择你的瓦片集图片
   - 例如：`frontend/public/CGS_RU_HouseFree/img/tilesets/CGS_UrbanB.png`
4. 设置：
   - **Name**: 给瓦片集起个名字（如"室内瓦片"）
   - **Tile width/height**: 48 x 48
5. 点击 `Save As...` 保存瓦片集

### 第3步：绘制地图

1. 在 `Tilesets` 面板中选择一个瓦片
2. 使用工具栏的画笔工具（快捷键：B）
3. 在地图上点击绘制
4. 常用工具：
   - **B** - 画笔（Stamp Brush）
   - **E** - 橡皮擦（Eraser）
   - **F** - 填充（Bucket Fill）
   - **R** - 矩形选择
   - **S** - 选择工具

### 第4步：添加图层

1. 在 `Layers` 面板点击 `+` 按钮
2. 选择 `Tile Layer`
3. 创建多个图层：
   - **地面层** - 地板
   - **墙壁层** - 墙壁和障碍物
   - **装饰层** - 装饰物品
   - **碰撞层** - 用于碰撞检测（可选）

### 第5步：导出地图

1. 点击 `File` → `Export As...`
2. 选择格式：
   - **JSON** - 最常用，Phaser等引擎支持
   - **CSV** - 简单的数据格式
   - **Lua** - 适合Love2D等引擎
3. 保存文件

## 🎨 进阶技巧

### 使用对象层（Object Layer）

对象层用于放置非瓦片的元素，如：
- 玩家出生点
- 敌人位置
- 触发区域
- NPC位置

1. 创建对象层：`Layers` → `+` → `Object Layer`
2. 使用工具：
   - **矩形工具** - 创建矩形区域
   - **点工具** - 创建点位置
   - **多边形工具** - 创建复杂形状

### 添加自定义属性

给瓦片或对象添加属性：
1. 选择瓦片或对象
2. 在 `Properties` 面板点击 `+`
3. 添加属性，如：
   - `collision: true` - 是否可碰撞
   - `damage: 10` - 伤害值
   - `type: "door"` - 类型

### 使用地形工具（Terrain）

地形工具可以自动处理瓦片边缘：
1. 在 `Tilesets` 面板选择瓦片集
2. 点击 `Terrain` 标签
3. 创建地形类型
4. 分配瓦片到地形
5. 使用地形画笔绘制，Tiled会自动选择正确的边缘瓦片

### 使用模板（Templates）

模板可以重复使用对象：
1. 创建一个对象
2. 右键 → `Save As Template`
3. 在其他地方拖拽使用

## 🎮 在游戏中使用Tiled地图

### Phaser.js示例

```javascript
// 预加载
function preload() {
    // 加载地图JSON
    this.load.tilemapTiledJSON('map', 'assets/map.json');
    // 加载瓦片集图片
    this.load.image('tiles', 'assets/tileset.png');
}

// 创建
function create() {
    // 创建地图
    const map = this.make.tilemap({ key: 'map' });
    
    // 添加瓦片集
    const tileset = map.addTilesetImage('室内瓦片', 'tiles');
    
    // 创建图层
    const groundLayer = map.createLayer('地面层', tileset, 0, 0);
    const wallLayer = map.createLayer('墙壁层', tileset, 0, 0);
    
    // 设置碰撞
    wallLayer.setCollisionByProperty({ collision: true });
}
```

### Unity示例

1. 导入 `2D Tilemap Editor` 包
2. 创建 `Tilemap` 对象
3. 导入瓦片集图片
4. 在 `Tile Palette` 中创建瓦片
5. 使用画笔工具绘制

### Godot示例

1. 创建 `TileMap` 节点
2. 在 `TileSet` 中导入瓦片集
3. 使用内置编辑器绘制
4. 或导入Tiled的JSON文件（需要插件）

## 💡 实用技巧

### 快捷键

- **Ctrl + N** - 新建地图
- **Ctrl + S** - 保存
- **Ctrl + Z** - 撤销
- **Ctrl + Y** - 重做
- **B** - 画笔工具
- **E** - 橡皮擦
- **F** - 填充工具
- **R** - 矩形选择
- **Space + 拖拽** - 移动视图
- **Ctrl + 滚轮** - 缩放

### 工作流程建议

1. **先规划后绘制** - 在纸上或脑海中先设计地图布局
2. **使用图层** - 不同元素放在不同图层，便于管理
3. **命名规范** - 给图层和对象起有意义的名字
4. **经常保存** - Ctrl+S是你的好朋友
5. **使用网格** - 保持对齐，让地图看起来整洁
6. **测试碰撞** - 在游戏中测试碰撞是否正确

### 常见问题

**Q: 瓦片显示不正确？**
A: 检查瓦片大小设置是否与图片匹配

**Q: 导出的JSON文件很大？**
A: 使用CSV格式的图层，或启用压缩

**Q: 如何创建多层建筑？**
A: 使用多个图层，或创建多个地图文件

**Q: 如何添加动画瓦片？**
A: 在瓦片集编辑器中选择瓦片，添加动画帧

## 📚 学习资源

### 官方资源
- **官方文档**: https://doc.mapeditor.org/
- **官方教程**: https://doc.mapeditor.org/en/stable/manual/introduction/
- **示例地图**: Tiled安装目录中的examples文件夹

### 视频教程
- YouTube搜索 "Tiled Map Editor Tutorial"
- Bilibili搜索 "Tiled教程"

### 社区
- **官方论坛**: https://discourse.mapeditor.org/
- **Discord**: 在官网可以找到链接
- **GitHub**: https://github.com/mapeditor/tiled

## 🎯 练习项目

### 初级：创建一个房间
1. 创建10x10的地图
2. 绘制地板
3. 添加四周的墙壁
4. 放置一扇门
5. 添加一些家具

### 中级：创建一个房子
1. 创建多个房间
2. 使用不同的图层
3. 添加门和窗户
4. 放置家具和装饰
5. 添加碰撞属性

### 高级：创建一个小镇
1. 创建大地图（50x50或更大）
2. 设计街道布局
3. 创建多个建筑
4. 添加NPC位置点
5. 创建触发区域
6. 导出并在游戏引擎中测试

## 🚀 下一步

1. **尝试我的简易编辑器** - 打开 `map-editor.html` 练习基础概念
2. **下载Tiled** - 体验专业工具的强大功能
3. **创建你的第一个地图** - 使用你的素材创建一个房间
4. **在游戏中测试** - 导出地图并在游戏引擎中加载
5. **学习进阶功能** - 探索自动地形、动画瓦片等功能

记住：熟能生巧！多练习，你很快就能创建出精美的游戏地图！🎨
