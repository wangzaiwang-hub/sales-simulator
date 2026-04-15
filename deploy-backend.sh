#!/bin/bash

# 后端部署脚本（Railway）

echo "🚀 开始部署后端到 Railway..."

# 检查是否安装了 Railway CLI
if ! command -v railway &> /dev/null
then
    echo "❌ Railway CLI 未安装"
    echo "请运行: npm install -g @railway/cli"
    exit 1
fi

# 进入后端目录
cd backend

# 检查环境变量
echo "📋 检查环境变量..."
if [ ! -f .env ]; then
    echo "⚠️  .env 文件不存在，请先配置环境变量"
    echo "参考 .env.example 创建 .env 文件"
    exit 1
fi

# 构建项目
echo "🔨 构建项目..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 构建失败"
    exit 1
fi

echo "✅ 构建成功"

# 部署到 Railway
echo "📦 部署到 Railway..."
railway up

if [ $? -ne 0 ]; then
    echo "❌ 部署失败"
    exit 1
fi

echo "✅ 部署成功！"
echo "🌐 访问 Railway 控制台查看部署状态"
