#!/usr/bin/env bash
# build.sh — Script de build para Render
# Render ejecuta esto antes de arrancar la app.
#
# Configura en Render:
#   Build Command:  chmod +x build.sh && ./build.sh
#   Start Command:  python main.py

set -e

echo "📦 Instalando dependencias Python..."
pip install -r requirements.txt

echo "📦 Instalando dependencias Frontend..."
cd frontend
npm install

echo "🔨 Compilando frontend React..."
npm run build

echo "✅ Build completo!"
ls -la dist/
