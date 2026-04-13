#!/bin/bash

# 使用Apache启动HTTPS局域网服务

echo "🌐 销售模拟器 - 局域网HTTPS访问配置"
echo "=========================================="
echo ""

# 获取本机局域网IP
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "未找到")

if [ "$LOCAL_IP" = "未找到" ]; then
    echo "❌ 无法获取本机IP地址"
    exit 1
fi

echo "📍 本机局域网IP: $LOCAL_IP"
echo ""

# 检查证书
CERT_DIR="$HOME/.ssl-certs"
if [ ! -f "$CERT_DIR/server.crt" ] || [ ! -f "$CERT_DIR/server.key" ]; then
    echo "⚠️  SSL证书不存在，正在生成..."
    ./setup-ssl.sh
    if [ $? -ne 0 ]; then
        echo "❌ 证书生成失败"
        exit 1
    fi
fi

echo "✅ SSL证书已就绪"
echo ""
echo "⚙️  配置步骤："
echo ""
echo "1️⃣  在SecondMe平台添加回调地址："
echo "   https://$LOCAL_IP/auth/callback"
echo ""
echo "2️⃣  更新环境变量（自动完成）..."

# 更新前端环境变量
cat > frontend/.env.local << EOF
# SecondMe OAuth配置
NEXT_PUBLIC_SECONDME_CLIENT_ID=3fd385c8-95d8-4ec9-a547-16e104da067f
NEXT_PUBLIC_SECONDME_REDIRECT_URI=https://$LOCAL_IP/auth/callback

# API配置
NEXT_PUBLIC_API_URL=https://$LOCAL_IP
BACKEND_URL=http://localhost:3001
EOF

# 更新后端环境变量
cat > backend/.env << EOF
# 服务器配置
PORT=3001
NODE_ENV=development
BASE_URL=https://$LOCAL_IP
FRONTEND_URL=https://$LOCAL_IP

# Supabase配置
SUPABASE_URL=https://mfcgydquomrdgajuwwkg.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mY2d5ZHF1b21yZGdhanV3d2tnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTcyMDg4OSwiZXhwIjoyMDkxMjk2ODg5fQ.D-Yo72rl8uLebmSqaLoCv1KMLmhiWVYhResdMp9dcyQ

# JWT配置
JWT_SECRET=b31cbe4bd01966349ce974320bacb76f082afb8ee03ac9e469d0c134225ed27d
JWT_EXPIRES_IN=7d

# SecondMe OAuth配置
SECONDME_CLIENT_ID=3fd385c8-95d8-4ec9-a547-16e104da067f
SECONDME_CLIENT_SECRET=161dd01325f55d8118b96537654dab02696851b2b915c14b29d0380645bae73c
SECONDME_REDIRECT_URI=https://$LOCAL_IP/auth/callback

# CORS配置
CORS_ORIGIN=https://$LOCAL_IP
EOF

echo "✅ 环境变量已更新"
echo ""
echo "3️⃣  准备Apache配置..."

# 创建日志目录
sudo mkdir -p /usr/local/var/log/httpd
sudo mkdir -p /usr/local/var/run/apache2

# 复制配置文件并替换证书路径
TEMP_CONF="/tmp/httpd-lan-ssl.conf"
sed "s|CERT_PATH|$CERT_DIR|g" "$(pwd)/httpd-lan-ssl.conf" > "$TEMP_CONF"

echo "✅ 配置已准备"
echo ""
echo "4️⃣  启动Apache HTTPS服务..."

# 停止现有Apache
sudo apachectl stop 2>/dev/null
sleep 2

# 启动Apache
sudo apachectl -f "$TEMP_CONF" -k start

if [ $? -ne 0 ]; then
    echo "❌ Apache启动失败"
    echo ""
    echo "尝试查看错误信息："
    sudo apachectl -f "$TEMP_CONF" -t
    exit 1
fi

echo "✅ Apache HTTPS已启动"
echo ""
echo "================================"
echo "🎉 配置完成！"
echo ""
echo "📱 局域网访问地址："
echo "   https://$LOCAL_IP"
echo ""
echo "🔗 SecondMe回调地址："
echo "   https://$LOCAL_IP/auth/callback"
echo ""
echo "⚠️  首次访问提示："
echo "   浏览器会显示'不安全'警告（因为是自签名证书）"
echo "   点击'高级' -> '继续访问'即可"
echo ""
echo "💡 其他设备访问："
echo "   1. 确保设备在同一局域网"
echo "   2. 在浏览器打开: https://$LOCAL_IP"
echo "   3. 接受安全警告并继续"
echo ""
echo "🛑 停止服务："
echo "   sudo apachectl stop"
echo "   ./stop-lan-apache.sh  # 恢复localhost配置"
echo ""
echo "📋 查看日志："
echo "   tail -f /usr/local/var/log/httpd/lan_ssl_access_log"
echo "   tail -f /usr/local/var/log/httpd/lan_ssl_error_log"
echo ""
