// 检查ChatMessage表是否存在
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少Supabase配置');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkChatHistoryTable() {
  console.log('🔍 检查ChatMessage表是否存在...\n');

  try {
    // 尝试查询ChatMessage表
    const { data, error } = await supabase
      .from('ChatMessage')
      .select('*')
      .limit(1);

    if (error) {
      if (error.message.includes('does not exist') || error.code === '42P01') {
        console.log('❌ ChatMessage表不存在！');
        console.log('\n📋 你需要做的：');
        console.log('1. 打开 Supabase Dashboard: https://supabase.com/dashboard');
        console.log('2. 选择你的项目');
        console.log('3. 点击左侧菜单的 SQL Editor');
        console.log('4. 复制 backend/migrations/add-chat-history.sql 的内容');
        console.log('5. 粘贴到 SQL Editor 中');
        console.log('6. 点击 Run 按钮');
        console.log('\n⚠️  如果不运行迁移脚本，聊天记录功能将无法工作！\n');
        return false;
      }
      throw error;
    }

    console.log('✅ ChatMessage表存在！');
    
    // 查询记录数量
    const { count, error: countError } = await supabase
      .from('ChatMessage')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.log('⚠️  无法统计记录数量:', countError.message);
    } else {
      console.log(`📊 当前有 ${count} 条聊天记录\n`);
      
      if (count === 0) {
        console.log('💡 提示：表存在但没有记录，这是正常的。');
        console.log('   开始聊天后，记录会自动保存。\n');
      } else {
        // 显示最近的几条记录
        const { data: recentMessages, error: recentError } = await supabase
          .from('ChatMessage')
          .select('message, reply, createdAt')
          .order('createdAt', { ascending: false })
          .limit(3);

        if (!recentError && recentMessages) {
          console.log('📝 最近的聊天记录：');
          recentMessages.forEach((msg, index) => {
            console.log(`\n${index + 1}. 时间: ${new Date(msg.createdAt).toLocaleString('zh-CN')}`);
            console.log(`   用户: ${msg.message}`);
            console.log(`   NPC: ${msg.reply}`);
          });
          console.log('');
        }
      }
    }

    return true;
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
    return false;
  }
}

checkChatHistoryTable().then((exists) => {
  process.exit(exists ? 0 : 1);
});
