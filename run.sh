#!/bin/bash

echo "🚀 Запуск микросервисного приложения..."

# Установка зависимостей
echo "📦 Установка зависимостей..."
pip install -r requirements.txt

# Запуск сервисов в фоне
echo "🔧 Запуск Text Service (порт 5001)..."
cd /workspace/text-service
python app.py > /tmp/text-service.log 2>&1 &
TEXT_PID=$!

echo "🔧 Запуск File Service (порт 5002)..."
cd /workspace/file-service
python app.py > /tmp/file-service.log 2>&1 &
FILE_PID=$!

echo "🔧 Запуск API Gateway (порт 5000)..."
cd /workspace/api-gateway
python app.py > /tmp/api-gateway.log 2>&1 &
GATEWAY_PID=$!

echo ""
echo "✅ Все сервисы запущены!"
echo ""
echo "📊 Сервисы:"
echo "   - API Gateway: http://localhost:5000"
echo "   - Text Service: http://localhost:5001"
echo "   - File Service: http://localhost:5002"
echo ""
echo "PID процессов:"
echo "   - Text Service: $TEXT_PID"
echo "   - File Service: $FILE_PID"
echo "   - API Gateway: $GATEWAY_PID"
echo ""
echo "Логи:"
echo "   - /tmp/text-service.log"
echo "   - /tmp/file-service.log"
echo "   - /tmp/api-gateway.log"
echo ""
echo "Для остановки выполните: kill $TEXT_PID $FILE_PID $GATEWAY_PID"
