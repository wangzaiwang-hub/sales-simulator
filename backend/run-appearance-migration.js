const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少环境变量: SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🔄 运行角色外观迁移...\n');

  try {
    const sql = fs.readFileSync(
      path.join(__dirname, 'migrations/add-character-appearance.sql'),
      'utf8'
    );

    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // 如果rpc不可用，尝试直接执行
      console.log('⚠️  RPC方法不可用，请手动在Supabase Dashboard执行迁移');
      console.log('\n📋 迁移SQL:');
      console.log(sql);
      console.log('\n请复制上面的SQL到Supabase Dashboard的SQL Editor中执行');
      return;
    }

    console.log('✅ 迁移成功！');
  } catch (error) {
    console.error('❌ 迁移失败:', error.message);
    console.log('\n📋 请手动执行迁移:');
    console.log('1. 打开 Supabase Dashboard');
    console.log('2. 进入 SQL Editor');
    console.log('3. 执行以下SQL:');
    console.log('\nALTER TABLE "GameProgress" ADD COLUMN IF NOT EXISTS "characterAppearance" JSONB;');
  }
}

runMigration();
