#!/bin/bash
set -e
BRANCH=$1
PROJECT_TYPE=$2
GIT_USER=$3
GIT_PASS=$4

LIVE_DIR="/var/www/html/$BRANCH/$PROJECT_TYPE-project"

echo "--- 🛠️ Preparing Infrastructure for $BRANCH ($PROJECT_TYPE) ---"

# Self-Healing Folder Setup
if [ ! -d "$LIVE_DIR/.git" ]; then
    echo "⚠️ Initializing fresh directory for $BRANCH..."
    sudo rm -rf "$LIVE_DIR"
    sudo mkdir -p $(dirname "$LIVE_DIR")
    sudo git clone -b "$BRANCH" https://$GIT_USER:$GIT_PASS@github.com/Jawadaziz78/vue-project.git "$LIVE_DIR"
fi

cd "$LIVE_DIR"

# Dependency Maintenance
if [ "$PROJECT_TYPE" != "laravel" ]; then
    if ! command -v pnpm &> /dev/null; then
        sudo npm install -g pnpm
    fi
    sudo rm -rf node_modules dist .env
    sudo chown -R ubuntu:ubuntu .
    pnpm config set ignore-scripts true
    pnpm install
    
    sudo find node_modules/.pnpm -name 'esbuild' -exec chmod +x {} +
    sudo chmod -R +x node_modules/.bin
    pnpm config set ignore-scripts false
    pnpm rebuild esbuild
fi

# Directory Permissions
sudo chmod +x /var/www /var/www/html /var/www/html/"$BRANCH"
sudo chown -R ubuntu:www-data "$LIVE_DIR"
