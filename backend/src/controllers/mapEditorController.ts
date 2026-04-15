import { Request, Response } from 'express';
import { eq, insertRows, selectMany, selectOne, updateRows } from '../lib/supabase';

type Row = Record<string, any>;

export const mapEditorController = {
  // 获取所有地图列表
  async getMapList(req: Request, res: Response) {
    try {
      const maps = await selectMany<Row>('SharedMap', {
        select: 'id,name,createdAt,updatedAt',
        order: 'updatedAt.desc',
      });

      res.json({ maps });
    } catch (error) {
      console.error('Get map list error:', error);
      res.status(500).json({ error: 'Failed to load map list' });
    }
  },

  // 根据ID或名称获取地图
  async getMap(req: Request, res: Response) {
    try {
      const { id, name } = req.query;

      let map;
      if (id) {
        map = await selectOne<Row>('SharedMap', {
          select: '*',
          ...eq('id', id as string),
        });
      } else if (name) {
        map = await selectOne<Row>('SharedMap', {
          select: '*',
          ...eq('name', name as string),
        });
      } else {
        // 默认获取最新的地图
        const maps = await selectMany<Row>('SharedMap', {
          select: '*',
          order: 'updatedAt.desc',
          limit: 1,
        });
        map = maps[0];
      }

      if (!map || !map.mapData) {
        return res.status(404).json({ error: 'Map not found' });
      }

      let mapData;
      try {
        mapData = JSON.parse(map.mapData as string);
      } catch (e) {
        return res.status(500).json({ error: 'Invalid map data' });
      }

      res.json({
        map: mapData,
        mapId: map.id,
        mapName: map.name,
      });
    } catch (error) {
      console.error('Get map error:', error);
      res.status(500).json({ error: 'Failed to load map' });
    }
  },

  // 保存地图（创建新地图或更新现有地图）
  async saveMap(req: Request, res: Response) {
    try {
      const { map, mapName, mapId } = req.body;

      console.log('Received save map request, name:', mapName, 'id:', mapId);

      if (!map || typeof map !== 'object') {
        console.log('Invalid map payload');
        return res.status(400).json({ error: 'Map payload is required' });
      }

      if (!map.width || !map.height || !Array.isArray(map.layers)) {
        console.log('Invalid map format');
        return res.status(400).json({ error: 'Invalid map format' });
      }

      if (!mapName) {
        return res.status(400).json({ error: 'Map name is required' });
      }

      const mapJson = JSON.stringify(map);
      console.log('Map JSON length:', mapJson.length);

      let savedMap;

      if (mapId) {
        // 更新现有地图
        console.log('Updating existing map:', mapId);
        const [updated] = await updateRows<Row>(
          'SharedMap',
          { ...eq('id', mapId) },
          {
            mapData: mapJson,
            name: mapName, // 也更新名称
            updatedAt: new Date().toISOString(),
          }
        );
        savedMap = updated;
      } else {
        // 创建新地图 - 让数据库自动生成UUID
        console.log('Creating new map:', mapName);
        const [created] = await insertRows<Row>('SharedMap', {
          name: mapName,
          mapData: mapJson,
          isActive: false, // 新地图默认不激活
          createdBy: null,
        });
        savedMap = created;
      }

      console.log('Map saved successfully:', savedMap?.id);
      res.json({
        message: 'Map saved successfully',
        mapId: savedMap?.id,
        mapName: savedMap?.name,
      });
    } catch (error) {
      console.error('Save map error:', error);
      res.status(500).json({ error: 'Failed to save map' });
    }
  },

  // 删除地图
  async deleteMap(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // 这里需要使用 Supabase 的 DELETE 方法
      // 暂时返回未实现
      res.status(501).json({ error: 'Delete not implemented yet' });
    } catch (error) {
      console.error('Delete map error:', error);
      res.status(500).json({ error: 'Failed to delete map' });
    }
  },

  // 获取激活的共享地图（游戏使用）
  async getSharedMap(req: Request, res: Response) {
    try {
      const sharedMap = await selectOne<Row>('SharedMap', {
        select: '*',
        ...eq('isActive', true),
      });

      if (!sharedMap || !sharedMap.mapData) {
        return res.status(404).json({ error: 'No shared map found' });
      }

      let map;
      try {
        map = JSON.parse(sharedMap.mapData as string);
      } catch (e) {
        return res.status(500).json({ error: 'Invalid map data' });
      }

      res.json({
        map,
        isShared: true,
        mapId: sharedMap.id,
      });
    } catch (error) {
      console.error('Get shared map error:', error);
      res.status(500).json({ error: 'Failed to load map' });
    }
  },

  // 设置激活的地图（游戏将使用这个地图）
  async setActiveMap(req: Request, res: Response) {
    try {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Map ID is required' });
      }

      // 先查询所有激活的地图并取消激活
      const activeMaps = await selectMany<Row>('SharedMap', {
        select: 'id',
        ...eq('isActive', true),
      });

      for (const activeMap of activeMaps) {
        await updateRows<Row>(
          'SharedMap',
          { ...eq('id', activeMap.id) },
          { isActive: false }
        );
      }

      // 激活指定的地图
      await updateRows<Row>(
        'SharedMap',
        { ...eq('id', id) },
        { isActive: true }
      );

      res.json({ message: 'Map activated successfully' });
    } catch (error) {
      console.error('Set active map error:', error);
      res.status(500).json({ error: 'Failed to activate map' });
    }
  },
};
