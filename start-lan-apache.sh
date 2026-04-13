#!/bin/bash

# 使用Apache启动局域网服务

echo "🌐 销售模拟器 - 局域网访问配置 (Apache)"
echo "=========================================="
echo ""

# 获取本机局域网IP
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "未找到")

if [ "$LOCAL_IP" = "未找到" ]; then
    echo "❌ 无法获取本机IP地址"
    echo "请手动运行: ipconfig getifaddr en0"
    exit 1
fi

echo "📍 本机局域网IP: $LOCAL_IP"
echo ""
echo "⚙️  配置步骤："
echo ""
echo "1️⃣  在SecondMe平台添加回调地址："
echo "   http://$LOCAL_IP/auth/callback"
echo ""
echo "2️⃣  更新环境变量（自动完成）..."

# 更新前端环境变量
cat > frontend/.env.local << EOF
# SecondMe OAuth配置
NEXT_PUBLIC_SECONDME_CLIENT_ID=3fd385c8-95d8-4ec9-a547-16e104da067f
NEXT_PUBLIC_SECONDME_REDIRECT_URI=http://$LOCAL_IP/auth/callback

# API配置
NEXT_PUBLIC_API_URL=http://$LOCAL_IP
BACKEND_URL=http://localhost:3001
EOF

# 更新后端环境变量
cat > backend/.env << EOF
# 服务器配置
PORT=3001
NODE_ENV=development
BASE_URL=http://$LOCAL_IP
FRONTEND_URL=http://$LOCAL_IP

# Supabase配置
SUPABASE_URL=https://mfcgydquomrdgajuwwkg.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mY2d5ZHF1b21yZGdhanV3d2tnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTcyMDg4OSwiZXhwIjoyMDkxMjk2ODg5fQ.D-Yo72rl8uLebmSqaLoCv1KMLmhiWVYhResdMp9dcyQ

# JWT配置
JWT_SECRET=b31cbe4bd01966349ce974320bacb76f082afb8ee03ac9e469d0c134225ed27d
JWT_EXPIRES_IN=7d

# SecondMe OAuth配置
SECONDME_CLIENT_ID=3fd385c8-95d8-4ec9-a547-16e104da067f
SECONDME_CLIENT_SECRET=161dd01325f55d8118b96537654dab02696851b2b915c14b29d0380645bae73c
SECONDME_REDIRECT_URI=http://$LOCAL_IP/auth/callback

# CORS配置
CORS_ORIGIN=http://$LOCAL_IP
EOF

echo "✅ 环境变量已更新"
echo ""
echo "3️⃣  创建日志目录..."
sudo mkdir -p /usr/local/var/log/httpd
echo "✅ 日志目录已创建"
echo ""
echo "4️⃣  启动Apache..."

# 检查80端口
if lsof -Pi :80 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  端口80已被占用，尝试停止Apache..."
    sudo apachectl stop 2>/dev/null
    sleep 2
fi

# 复制配置文件到临时目录
TEMP_CONF="/tmp/httpd-lan.conf"
cp "$(pwd)/httpd-lan.conf" "$TEMP_CONF"

# 启动Apache
echo "启动Apache反向代理..."
sudo apachectl -f "$TEMP_CONF" -k start

if [ $? -ne 0 ]; then
    echo "❌ Apache启动失败"
    echo ""
    echo "尝试查看错误信息："
    sudo apachectl -f "$TEMP_CONF" -t
    exit 1
fi

echo "✅ Apache已启动"
echo ""
echo "================================"
echo "🎉 配置完成！"
echo ""
echo "📱 局域网访问地址："
echo "   http://$LOCAL_IP"
echo ""
echo "🔗 请确保在SecondMe平台添加了回调地址："
echo "   http://$LOCAL_IP/auth/callback"
echo ""
echo "💡 其他设备访问："
echo "   1. 确保设备在同一局域网"
echo "   2. 在浏览器打开: http://$LOCAL_IP"
echo ""
echo "🛑 停止服务："
echo "   sudo apachectl stop"
echo ""
echo "📋 查看日志："
echo "   tail -f /usr/local/var/log/httpd/lan_access_log"
echo "   tail -f /usr/local/var/log/httpd/lan_error_log"
echo ""
