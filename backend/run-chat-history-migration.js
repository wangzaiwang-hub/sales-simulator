// 运行聊天记录表迁移脚本
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 错误：缺少 SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY 环境变量');
  console.error('请在 .env 文件中设置这些变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('📝 读取迁移脚本...');
    const migrationPath = path.join(__dirname, 'migrations', 'add-chat-history.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('🚀 执行迁移...');
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).single();

    if (error) {
      // 如果 exec_sql 函数不存在，尝试直接执行
      console.log('⚠️  exec_sql 函数不存在，请手动在 Supabase Dashboard 执行以下SQL：');
      console.log('\n' + '='.repeat(80));
      console.log(sql);
      console.log('='.repeat(80) + '\n');
      console.log('📍 执行步骤：');
      console.log('1. 打开 Supabase Dashboard');
      console.log('2. 进入 SQL Editor');
      console.log('3. 复制上面的 SQL 代码');
      console.log('4. 粘贴并执行');
      return;
    }

    console.log('✅ 迁移成功！');
    console.log('📊 结果：', data);

    // 验证表是否创建成功
    console.log('\n🔍 验证表结构...');
    const { data: tables, error: tablesError } = await supabase
      .from('ChatMessage')
      .select('*')
      .limit(1);

    if (tablesError) {
      console.error('❌ 表验证失败：', tablesError.message);
    } else {
      console.log('✅ ChatMessage 表已成功创建！');
    }

  } catch (error) {
    console.error('❌ 迁移失败：', error.message);
    console.error('\n请手动在 Supabase Dashboard → SQL Editor 中执行：');
    console.error('backend/migrations/add-chat-history.sql');
  }
}

runMigration();
