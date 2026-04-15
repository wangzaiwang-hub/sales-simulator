#!/bin/bash

# 前端部署脚本（Vercel）

echo "🚀 开始部署前端到 Vercel..."

# 检查是否安装了 Vercel CLI
if ! command -v vercel &> /dev/null
then
    echo "❌ Vercel CLI 未安装"
    echo "请运行: npm install -g vercel"
    exit 1
fi

# 进入前端目录
cd frontend

# 检查环境变量
echo "📋 检查环境变量..."
if [ ! -f .env.production ]; then
    echo "⚠️  .env.production 文件不存在，请先配置环境变量"
    exit 1
fi

# 部署到 Vercel
echo "📦 部署到 Vercel..."
vercel --prod

if [ $? -ne 0 ]; then
    echo "❌ 部署失败"
    exit 1
fi

echo "✅ 部署成功！"
echo "🌐 访问 Vercel 控制台查看部署状态"
