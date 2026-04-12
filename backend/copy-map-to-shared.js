// 将用户地图复制到共享地图
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少 SUPABASE_URL 或 SUPABASE_SERVICE_KEY');
  process.exit(1);
}

async function query(table, params = {}) {
  const url = new URL(`/rest/v1/${table}`, supabaseUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
    },
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Query failed: ${text}`);
  }

  return text ? JSON.parse(text) : [];
}

async function update(table, params, body) {
  const url = new URL(`/rest/v1/${table}`, supabaseUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url.toString(), {
    method: 'PATCH',
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Update failed: ${text}`);
  }

  return text ? JSON.parse(text) : [];
}

async function copyMapToShared() {
  console.log('🔄 将用户地图复制到共享地图...\n');

  // 查找有地图数据的用户
  console.log('1️⃣ 查找有地图数据的用户...');
  const progresses = await query('GameProgress', {
    select: 'userId,currentMap',
    limit: 100
  });

  const userWithMap = progresses.find(p => {
    return p.currentMap && 
           p.currentMap !== 'main' && 
           p.currentMap.length > 100 &&
           p.currentMap.trim().startsWith('{');
  });

  if (!userWithMap) {
    console.log('   ❌ 没有找到有效的地图数据');
    console.log('   💡 请先在 tileset-editor.html 中创建并保存地图');
    return;
  }

  console.log(`   ✅ 找到用户地图，数据长度: ${userWithMap.currentMap.length} 字符`);

  // 验证地图数据是否为有效JSON
  try {
    const mapData = JSON.parse(userWithMap.currentMap);
    console.log(`   ✅ 地图数据有效`);
    console.log(`      - 宽度: ${mapData.width}`);
    console.log(`      - 高度: ${mapData.height}`);
    console.log(`      - 瓦片大小: ${mapData.tileSize}`);
    console.log(`      - 图层数: ${mapData.layers?.length || 0}`);
  } catch (err) {
    console.log('   ❌ 地图数据不是有效的JSON');
    return;
  }

  // 更新 SharedMap 表
  console.log('\n2️⃣ 更新共享地图...');
  try {
    const updated = await update(
      'SharedMap',
      { 'isActive': 'eq.true' },
      { 
        mapData: userWithMap.currentMap,
        updatedAt: new Date().toISOString()
      }
    );

    if (updated.length > 0) {
      console.log('   ✅ 共享地图更新成功！');
      console.log(`   📊 地图数据长度: ${updated[0].mapData.length} 字符`);
    } else {
      console.log('   ⚠️  没有找到激活的共享地图记录');
    }
  } catch (err) {
    console.log('   ❌ 更新失败：', err.message);
  }

  console.log('\n✅ 完成！现在所有用户都应该能看到共享地图了。\n');
}

copyMapToShared().catch(console.error);
