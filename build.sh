#!/usr/bin/env bash
# build.sh — Script de construcción ultra-robusto para Render
set -e

echo "--- 🛠️ INICIANDO BUILD SCRIPT ---"

echo "🐍 [1/4] Instalando dependencias de Python..."
pip install --upgrade pip
pip install -r requirements.txt

echo "📦 [2/4] Instalando Node.js v22 (LTS)..."
# Usamos v22.14.0 porque Vite requiere >= 20.19 o >= 22.12
NODE_VERSION="v22.14.0"
NODE_TAR="node-$NODE_VERSION-linux-x64.tar.gz"
URL="https://nodejs.org/dist/$NODE_VERSION/$NODE_TAR"

# Crear carpeta para node y descargar
mkdir -p node_bin
curl -fsSL "$URL" | tar -xz --strip-components=1 -C node_bin

# Agregar al PATH
export PATH=$PWD/node_bin/bin:$PATH

echo "✅ Node.js: $(node -v)"
echo "✅ NPM: $(npm -v)"

echo "🏗️ [3/4] Instalando dependencias del Frontend..."
cd frontend
npm install --no-audit --no-fund

echo "🔨 [4/4] Compilando Frontend (Vite)..."
npm run build

echo "--- ✅ BUILD FINALIZADO EXITOSAMENTE ---"
cd ..
