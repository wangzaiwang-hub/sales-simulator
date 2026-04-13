#!/bin/bash

# 检查局域网环境是否就绪

echo "🔍 检查局域网环境..."
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查计数
PASS=0
FAIL=0

# 1. 检查nginx
echo -n "1. 检查nginx安装... "
if command -v nginx &> /dev/null; then
    echo -e "${GREEN}✓ 已安装${NC}"
    nginx -v 2>&1 | head -1
    ((PASS++))
else
    echo -e "${RED}✗ 未安装${NC}"
    echo "   请运行: brew install nginx"
    ((FAIL++))
fi
echo ""

# 2. 检查前端服务
echo -n "2. 检查前端服务 (3000端口)... "
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${GREEN}✓ 运行中${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ 未运行${NC}"
    echo "   请在frontend目录运行: npm run dev"
    ((FAIL++))
fi
echo ""

# 3. 检查后端服务
echo -n "3. 检查后端服务 (3001端口)... "
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${GREEN}✓ 运行中${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ 未运行${NC}"
    echo "   请在backend目录运行: npm run dev"
    ((FAIL++))
fi
echo ""

# 4. 检查局域网IP
echo -n "4. 检查局域网IP... "
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)
if [ -n "$LOCAL_IP" ]; then
    echo -e "${GREEN}✓ $LOCAL_IP${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ 无法获取${NC}"
    ((FAIL++))
fi
echo ""

# 5. 检查80端口
echo -n "5. 检查80端口... "
if lsof -Pi :80 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠ 已被占用${NC}"
    echo "   建议使用8080端口方案: ./start-lan-8080.sh"
else
    echo -e "${GREEN}✓ 可用${NC}"
    ((PASS++))
fi
echo ""

# 6. 检查8080端口
echo -n "6. 检查8080端口... "
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠ 已被占用${NC}"
else
    echo -e "${GREEN}✓ 可用${NC}"
    ((PASS++))
fi
echo ""

# 总结
echo "================================"
echo "检查结果："
echo -e "通过: ${GREEN}$PASS${NC}"
echo -e "失败: ${RED}$FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✓ 环境就绪！${NC}"
    echo ""
    echo "下一步："
    if lsof -Pi :80 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "  ./start-lan-8080.sh  # 使用8080端口"
    else
        echo "  ./start-lan.sh       # 使用80端口（推荐）"
        echo "  或"
        echo "  ./start-lan-8080.sh  # 使用8080端口"
    fi
    echo ""
    if [ -n "$LOCAL_IP" ]; then
        echo "SecondMe回调地址："
        if lsof -Pi :80 -sTCP:LISTEN -t >/dev/null 2>&1; then
            echo "  http://$LOCAL_IP:8080/auth/callback"
        else
            echo "  http://$LOCAL_IP/auth/callback (80端口)"
            echo "  或"
            echo "  http://$LOCAL_IP:8080/auth/callback (8080端口)"
        fi
    fi
else
    echo -e "${RED}✗ 环境未就绪${NC}"
    echo ""
    echo "请先解决上述问题，然后重新运行此脚本。"
fi
echo ""
