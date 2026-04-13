#!/bin/bash

# 清理缓存脚本 - 只在遇到问题时使用

echo "🧹 清理开发缓存..."
echo ""

# 停止进程
echo "1️⃣ 停止运行中的进程..."
pkill -f "next dev" 2>/dev/null
pkill -f "tsx watch" 2>/dev/null
sleep 2

# 清理前端缓存
echo "2️⃣ 清理前端缓存..."
rm -rf frontend/.next
rm -rf frontend/node_modules/.cache
echo "   ✅ 前端缓存已清理"

# 清理后端缓存
echo "3️⃣ 清理后端缓存..."
rm -rf backend/dist
rm -rf backend/node_modules/.cache
echo "   ✅ 后端缓存已清理"

# 重新编译后端
echo "4️⃣ 重新编译后端..."
cd backend && npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "   ✅ 后端编译成功"
else
    echo "   ❌ 后端编译失败"
fi
cd ..

echo ""
echo "✅ 缓存清理完成！"
echo ""
echo "请重新启动开发服务器："
echo "  终端1: cd backend && npm run dev"
echo "  终端2: cd frontend && npm run dev"
echo ""
