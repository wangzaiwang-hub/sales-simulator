// 检查数据库表和内容
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
    return { error: { code: response.status, message: text } };
  }

  return { data: text ? JSON.parse(text) : [] };
}

async function checkDatabase() {
  console.log('🔍 检查数据库表和内容...\n');

  // 检查 SharedMap 表是否存在
  console.log('1️⃣ 检查 SharedMap 表：');
  try {
    const { data: sharedMaps, error } = await query('SharedMap', { limit: 10 });

    if (error) {
      if (error.code === 404 || error.message.includes('relation') || error.message.includes('does not exist')) {
        console.log('   ❌ SharedMap 表不存在！');
        console.log('   💡 请在 Supabase Dashboard → SQL Editor 中运行：');
        console.log('      backend/migrations/add-shared-map.sql\n');
      } else {
        console.log('   ❌ 查询错误：', error.message);
      }
    } else {
      console.log('   ✅ SharedMap 表存在');
      console.log(`   📊 共有 ${sharedMaps.length} 条记录`);
      if (sharedMaps.length > 0) {
        console.log('   📝 记录详情：');
        sharedMaps.forEach((map, index) => {
          console.log(`      ${index + 1}. ID: ${map.id}`);
          console.log(`         名称: ${map.name}`);
          console.log(`         激活: ${map.isActive}`);
          console.log(`         创建者: ${map.createdBy || '无'}`);
          console.log(`         地图数据长度: ${map.mapData?.length || 0} 字符`);
          console.log(`         创建时间: ${map.createdAt}`);
        });
      } else {
        console.log('   ⚠️  表是空的，没有共享地图数据');
      }
      console.log('');
    }
  } catch (err) {
    console.log('   ❌ 检查失败：', err.message);
  }

  // 检查 GameProgress 表
  console.log('2️⃣ 检查 GameProgress 表：');
  try {
    const { data: progresses, error } = await query('GameProgress', { 
      select: 'id,userId,currentMap',
      limit: 5 
    });

    if (error) {
      console.log('   ❌ 查询错误：', error.message);
    } else {
      console.log('   ✅ GameProgress 表存在');
      console.log(`   📊 共有 ${progresses.length} 条记录`);
      if (progresses.length > 0) {
        console.log('   📝 记录详情：');
        progresses.forEach((progress, index) => {
          const hasMap = progress.currentMap && progress.currentMap !== 'main';
          console.log(`      ${index + 1}. 用户ID: ${progress.userId}`);
          console.log(`         有地图: ${hasMap ? '是' : '否'}`);
          if (hasMap) {
            console.log(`         地图数据长度: ${progress.currentMap.length} 字符`);
          }
        });
      }
      console.log('');
    }
  } catch (err) {
    console.log('   ❌ 检查失败：', err.message);
  }

  // 检查 User 表
  console.log('3️⃣ 检查 User 表：');
  try {
    const { data: users, error } = await query('User', {
      select: 'id,username,secondmeId',
      limit: 5
    });

    if (error) {
      console.log('   ❌ 查询错误：', error.message);
    } else {
      console.log('   ✅ User 表存在');
      console.log(`   📊 共有 ${users.length} 条记录`);
      if (users.length > 0) {
        console.log('   📝 用户列表：');
        users.forEach((user, index) => {
          console.log(`      ${index + 1}. ${user.username} (ID: ${user.id})`);
        });
      }
      console.log('');
    }
  } catch (err) {
    console.log('   ❌ 检查失败：', err.message);
  }

  console.log('✅ 数据库检查完成！\n');
}

checkDatabase().catch(console.error);
