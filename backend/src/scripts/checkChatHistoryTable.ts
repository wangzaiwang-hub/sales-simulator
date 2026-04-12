// 检查ChatMessage表是否存在
import { selectMany, order } from '../lib/supabase';

async function checkChatHistoryTable() {
  console.log('🔍 检查ChatMessage表是否存在...\n');

  try {
    // 尝试查询ChatMessage表
    const messages = await selectMany<any>('ChatMessage', {
      select: '*',
      limit: 1,
    });

    console.log('✅ ChatMessage表存在！');
    
    // 查询所有记录
    const allMessages = await selectMany<any>('ChatMessage', {
      select: '*',
      order: order('createdAt', false),
    });

    console.log(`📊 当前有 ${allMessages.length} 条聊天记录\n`);
    
    if (allMessages.length === 0) {
      console.log('💡 提示：表存在但没有记录，这是正常的。');
      console.log('   开始聊天后，记录会自动保存。\n');
    } else {
      // 显示最近的几条记录
      const recentMessages = allMessages.slice(0, 3);
      console.log('📝 最近的聊天记录：');
      recentMessages.forEach((msg: any, index: number) => {
        console.log(`\n${index + 1}. 时间: ${new Date(msg.createdAt).toLocaleString('zh-CN')}`);
        console.log(`   用户: ${msg.message}`);
        console.log(`   NPC: ${msg.reply}`);
      });
      console.log('');
    }

    return true;
  } catch (error: any) {
    if (error.message?.includes('does not exist') || error.code === '42P01') {
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
    
    console.error('❌ 检查失败:', error.message);
    return false;
  }
}

checkChatHistoryTable().then((exists) => {
  process.exit(exists ? 0 : 1);
});
