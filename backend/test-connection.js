require('dotenv').config();

async function testConnection() {
  console.log('🔍 测试 Supabase 连接...');
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL);

  try {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/Product?select=id&limit=1`,
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        },
      },
    );

    const text = await response.text();
    console.log('HTTP状态:', response.status);
    console.log('响应内容:', text);

    if (!response.ok) {
      throw new Error(`Supabase request failed: ${response.status}`);
    }

    console.log('✅ 测试完成');
    process.exit(0);
  } catch (error) {
    console.error('❌ 连接失败:', error.message);
    console.error('详细错误:', error);
    process.exit(1);
  }
}

testConnection();
