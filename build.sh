#!/usr/bin/env bash
# build.sh — Script de construcción para Render (sin Docker)
set -e

echo "🐍 Instalando dependencias de Python..."
pip install -r requirements.txt

echo "📦 Descargando Node.js portable..."
# Descargamos la versión LTS de Node.js (Linux x64)
NODE_VERSION="v20.11.0"
curl -fsSL https://nodejs.org/dist/$NODE_VERSION/node-$NODE_VERSION-linux-x64.tar.xz | tar -xJ --strip-components=1 -C . || {
    echo "❌ Error descargando Node.js. Intentando alternativa..."
    mkdir -p node_tmp
    curl -fsSL https://nodejs.org/dist/$NODE_VERSION/node-$NODE_VERSION-linux-x64.tar.xz | tar -xJ --strip-components=1 -C node_tmp
    export PATH=$PWD/node_tmp/bin:$PATH
}

# Asegurar que node está en el PATH
export PATH=$PWD/bin:$PATH

echo "✅ Node.js version: $(node -v)"
echo "✅ NPM version: $(npm -v)"

echo "🏗️ Construyendo el Frontend React..."
cd frontend
npm install
npm run build
cd ..

echo "✅ Frontend compilado exitosamente en frontend/dist/"
