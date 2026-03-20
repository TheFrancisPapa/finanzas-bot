# Multi-stage Dockerfile para Render (Python + React)

# Fase 1: Build del Frontend (Node)
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Fase 2: Backend (Python)
FROM python:3.11-slim
WORKDIR /app

# Instalar dependencias del sistema necesarias
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código del proyecto
COPY . .

# Copiar el build del frontend desde la Fase 1
# api/servidor.py está configurado para servir desde frontend/dist
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Exponer puerto (Render inyecta $PORT)
ENV PORT=8080
EXPOSE 8080

# Comando para arrancar la aplicación
CMD ["python", "main.py"]
