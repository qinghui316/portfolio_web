#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="/home/zm/portfolio_web"
WEB_ROOT="/var/www/portfolio_web/dist"
WEB_OWNER="nginx:nginx"
NGINX_CONFIG="/etc/nginx/conf.d/portfolio.conf"

cd "$PROJECT_DIR"

NODE_VERSION="$(tr -d '[:space:]' < .nvmrc)"
NODE_BIN="$HOME/.nvm/versions/node/v$NODE_VERSION/bin"
if [[ ! -x "$NODE_BIN/node" ]]; then
  echo "Node.js $NODE_VERSION is not installed at $NODE_BIN" >&2
  exit 1
fi
export PATH="$NODE_BIN:$PATH"
echo "==> using Node.js $(node --version)"

echo "==> git pull"
git pull --ff-only

echo "==> npm ci"
npm ci

echo "==> npm run build"
npm run build

echo "==> precompress static text assets"
find dist -type f \( -name '*.js' -o -name '*.css' -o -name '*.json' -o -name '*.svg' \) -size +1024c -print0 \
  | xargs -0 -r gzip -9 -k -f

echo "==> validate nginx configuration"
sudo install -m 0644 deploy/nginx/portfolio.conf "$NGINX_CONFIG"
sudo nginx -t

echo "==> sync to $WEB_ROOT"
sudo rsync -a --delete dist/ "$WEB_ROOT/"
sudo chown -R "$WEB_OWNER" "$(dirname "$WEB_ROOT")"

echo "==> reload nginx"
sudo systemctl reload nginx

echo "==> done. https://portfolio.moonai.asia/"
