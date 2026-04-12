#!/bin/bash

# HTTPS反代启动脚本

echo "🚀 启动销售模拟器 (HTTPS模式)"
echo "================================"
echo ""

# 检查是否在项目根目录
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ 错误：请在项目根目录运行此脚本"
    exit 1
fi

# 检查证书文件
if [ ! -f "frontend/certs/local-ip.crt" ] || [ ! -f "frontend/certs/local-ip.key" ]; then
    echo "❌ 错误：证书文件不存在"
    echo "请先生成证书文件："
    echo "  cd frontend/certs"
    echo "  openssl req -x509 -newkey rsa:4096 -keyout local-ip.key -out local-ip.crt -days 365 -nodes -config openssl-local-ip.cnf"
    exit 1
fi

# 检查环境变量
if ! grep -q "https://192.168.110.169:3443" frontend/.env.local; then
    echo "⚠️  警告：frontend/.env.local 可能未配置HTTPS地址"
fi

if ! grep -q "https://192.168.110.169:3443" backend/.env; then
    echo "⚠️  警告：backend/.env 可能未配置HTTPS地址"
fi

echo "📝 启动步骤："
echo "1. 启动后端服务 (http://localhost:3001)"
echo "2. 启动前端服务 (http://localhost:3000)"
echo "3. 启动HTTPS反代 (https://192.168.110.169:3443)"
echo ""

# 启动后端
echo "🔧 启动后端服务..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# 等待后端启动
sleep 3

# 启动前端
echo "🎨 启动前端服务..."
cd frontend
npm run dev &
FRONTEND_PID=$!

# 等待前端启动
sleep 5

# 启动HTTPS反代
echo "🔒 启动HTTPS反代..."
npm run dev:https-proxy &
PROXY_PID=$!
cd ..

echo ""
echo "✅ 所有服务已启动！"
echo ""
echo "📱 访问地址："
echo "  - 本地：https://127.0.0.1:3443"
echo "  - 局域网：https://192.168.110.169:3443"
echo ""
echo "⚠️  首次访问需要信任证书"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
trap "echo ''; echo '🛑 停止所有服务...'; kill $BACKEND_PID $FRONTEND_PID $PROXY_PID 2>/dev/null; exit 0" INT

wait
