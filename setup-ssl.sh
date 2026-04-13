#!/bin/bash

# 生成自签名SSL证书

echo "🔐 生成自签名SSL证书..."
echo ""

# 获取本机IP
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "192.168.1.100")

echo "📍 本机IP: $LOCAL_IP"
echo ""

# 创建证书目录
CERT_DIR="$HOME/.ssl-certs"
mkdir -p "$CERT_DIR"

# 生成私钥和证书
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "$CERT_DIR/server.key" \
  -out "$CERT_DIR/server.crt" \
  -subj "/C=CN/ST=State/L=City/O=Dev/CN=$LOCAL_IP" \
  -addext "subjectAltName=IP:$LOCAL_IP,DNS:localhost"

if [ $? -eq 0 ]; then
    echo "✅ SSL证书已生成"
    echo ""
    echo "证书位置："
    echo "  私钥: $CERT_DIR/server.key"
    echo "  证书: $CERT_DIR/server.crt"
    echo ""
    echo "⚠️  重要提示："
    echo "1. 这是自签名证书，浏览器会显示安全警告"
    echo "2. 在浏览器中点击'高级' -> '继续访问'即可"
    echo "3. 或者将证书添加到系统信任列表"
    echo ""
    echo "添加到系统信任（可选）："
    echo "  sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain $CERT_DIR/server.crt"
    echo ""
else
    echo "❌ 证书生成失败"
    exit 1
fi
