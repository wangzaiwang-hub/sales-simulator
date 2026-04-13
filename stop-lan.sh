#!/bin/bash

# 停止局域网服务脚本

echo "🛑 停止局域网服务..."
echo ""

# 停止nginx
if command -v nginx &> /dev/null; then
    sudo nginx -s stop 2>/dev/null
    echo "✅ nginx已停止"
else
    echo "⚠️  nginx未安装或未运行"
fi

echo ""
echo "💡 恢复本地开发配置..."

# 恢复前端环境变量
cat > frontend/.env.local << EOF
# SecondMe OAuth配置
NEXT_PUBLIC_SECONDME_CLIENT_ID=3fd385c8-95d8-4ec9-a547-16e104da067f
NEXT_PUBLIC_SECONDME_REDIRECT_URI=http://localhost:3000/auth/callback

# API配置
NEXT_PUBLIC_API_URL=http://localhost:3001
BACKEND_URL=http://localhost:3001
EOF

# 恢复后端环境变量
cat > backend/.env << EOF
# 服务器配置
PORT=3001
NODE_ENV=development
BASE_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000

# Supabase配置
SUPABASE_URL=https://mfcgydquomrdgajuwwkg.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mY2d5ZHF1b21yZGdhanV3d2tnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTcyMDg4OSwiZXhwIjoyMDkxMjk2ODg5fQ.D-Yo72rl8uLebmSqaLoCv1KMLmhiWVYhResdMp9dcyQ

# JWT配置
JWT_SECRET=b31cbe4bd01966349ce974320bacb76f082afb8ee03ac9e469d0c134225ed27d
JWT_EXPIRES_IN=7d

# SecondMe OAuth配置
SECONDME_CLIENT_ID=3fd385c8-95d8-4ec9-a547-16e104da067f
SECONDME_CLIENT_SECRET=161dd01325f55d8118b96537654dab02696851b2b915c14b29d0380645bae73c
SECONDME_REDIRECT_URI=http://localhost:3000/auth/callback

# CORS配置
CORS_ORIGIN=http://localhost:3000
EOF

echo "✅ 已恢复localhost配置"
echo ""
echo "🔄 请重启前后端服务以应用更改"
echo ""
