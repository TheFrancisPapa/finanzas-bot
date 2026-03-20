#!/usr/bin/env bash
# build.sh — Manguito PWA Build Script
set -e

echo "--- 🥭 INICIANDO MANGUITO BUILD ---"

# 1. Configurar Node.js (Vite requiere >= 22 en Render)
echo "📦 Configurando Node.js v22.14.0..."
NODE_VERSION="v22.14.0"
NODE_TAR="node-$NODE_VERSION-linux-x64.tar.gz"
URL="https://nodejs.org/dist/$NODE_VERSION/$NODE_TAR"

mkdir -p node_bin
curl -fsSL "$URL" | tar -xz --strip-components=1 -C node_bin
export PATH=$PWD/node_bin/bin:$PATH

echo "✅ Node.js: $(node -v)"

# 2. Construir Frontend (React)
echo "🏗️ Instalando dependencias del Frontend..."
cd frontend
npm install
echo "🔨 Compilando Frontend (dist)..."
npm run build
cd ..

# 3. Construir Backend (Python)
echo "🐍 Instalando dependencias del Backend..."
pip install --upgrade pip
pip install -r requirements.txt

echo "--- ✅ BUILD COMPLETADO EXITOSAMENTE ---"
