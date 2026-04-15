#!/bin/bash

# 环境变量检查脚本

echo "🔍 检查环境变量配置..."
echo ""

# 检查后端环境变量
echo "📦 后端环境变量:"
if [ -f backend/.env ]; then
    echo "✅ backend/.env 存在"
    
    # 检查必需的环境变量
    required_vars=("PORT" "NODE_ENV" "SUPABASE_URL" "SUPABASE_SERVICE_KEY" "JWT_SECRET" "FRONTEND_URL" "CORS_ORIGIN")
    
    for var in "${required_vars[@]}"; do
        if grep -q "^${var}=" backend/.env; then
            value=$(grep "^${var}=" backend/.env | cut -d '=' -f2)
            if [ -z "$value" ] || [[ "$value" == *"your_"* ]] || [[ "$value" == *"your-"* ]]; then
                echo "⚠️  ${var} 需要配置"
            else
                echo "✅ ${var} 已配置"
            fi
        else
            echo "❌ ${var} 缺失"
        fi
    done
else
    echo "❌ backend/.env 不存在"
    echo "   请复制 backend/.env.example 并配置"
fi

echo ""

# 检查前端环境变量
echo "🎨 前端环境变量:"
if [ -f frontend/.env.production ]; then
    echo "✅ frontend/.env.production 存在"
    
    # 检查必需的环境变量
    required_vars=("NEXT_PUBLIC_SECONDME_CLIENT_ID" "NEXT_PUBLIC_SECONDME_REDIRECT_URI" "NEXT_PUBLIC_API_URL")
    
    for var in "${required_vars[@]}"; do
        if grep -q "^${var}=" frontend/.env.production; then
            value=$(grep "^${var}=" frontend/.env.production | cut -d '=' -f2)
            if [ -z "$value" ] || [[ "$value" == *"your-"* ]]; then
                echo "⚠️  ${var} 需要配置"
            else
                echo "✅ ${var} 已配置"
            fi
        else
            echo "❌ ${var} 缺失"
        fi
    done
else
    echo "❌ frontend/.env.production 不存在"
    echo "   已创建模板文件，请配置"
fi

echo ""
echo "📝 提示："
echo "1. 确保所有环境变量都已正确配置"
echo "2. 不要在代码中硬编码敏感信息"
echo "3. 部署前请再次检查域名配置"
echo "4. 参考 DEPLOYMENT.md 获取详细部署指南"
