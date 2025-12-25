#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
COMMIT_MSG=${1:-"chore: deploy sourceplus"}

echo "🚀 Starting SourcePlus deployment..."

cd "$SCRIPT_DIR"

if git status --porcelain | grep -q .; then
  echo "🔖 Committing changes..."
  git add .
  git commit -m "$COMMIT_MSG"
  git push
else
  echo "ℹ️ No git changes to commit."
fi

echo "🎨 Building frontend..."
cd "$SCRIPT_DIR/client"
npm install
npm run build

echo "⚙️ Building backend..."
cd "$SCRIPT_DIR/server"
npm install
npm run build

echo "🔄 Restarting services..."
pm2 restart sourceplus-api --update-env
sudo systemctl reload nginx

echo "✅ Deployment finished."
