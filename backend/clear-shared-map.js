/**
 * 清除共享地图数据
 * 用于修复包含无效路径的地图数据
 * 
 * 使用方法：
 * node clear-shared-map.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 错误：缺少 SUPABASE_URL 或 SUPABASE_SERVICE_KEY 环境变量');
  console.error('请确保 .env 文件中配置了这些变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearSharedMap() {
  try {
    console.log('🔄 正在清除共享地图数据...');
    
    // 删除所有共享地图
    const { error: deleteError } = await supabase
      .from('SharedMap')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // 删除所有记录
    
    if (deleteError) {
      console.error('❌ 删除失败:', deleteError);
      process.exit(1);
    }
    
    console.log('✅ 共享地图数据已清除');
    
    // 插入一个空的默认标记
    const { error: insertError } = await supabase
      .from('SharedMap')
      .insert({
        name: 'default',
        mapData: '{}',
        isActive: true,
      });
    
    if (insertError) {
      console.error('⚠️  插入默认标记失败:', insertError);
      console.log('这不影响游戏运行，游戏会自动使用默认地图');
    } else {
      console.log('✅ 已插入默认地图标记');
    }
    
    console.log('\n✨ 完成！游戏现在将使用默认地图。');
    console.log('💡 提示：你可以在地图编辑器中创建新地图并设为激活。');
    
  } catch (error) {
    console.error('❌ 发生错误:', error);
    process.exit(1);
  }
}

clearSharedMap();
