#!/bin/bash
set -e

# Arguments passed from Jenkins
BRANCH=$1
PROJECT_TYPE=$2
GIT_USER=$3
GIT_PASS=$4

LIVE_DIR="/var/www/html/$BRANCH/$PROJECT_TYPE-project"

echo "--- 🛠️ Preparing Project: $BRANCH ($PROJECT_TYPE) ---"

# 1. Fresh Clone if directory is missing
if [ ! -d "$LIVE_DIR/.git" ]; then
    echo "⚠️ Initializing fresh directory for $BRANCH..."
    sudo rm -rf "$LIVE_DIR"
    sudo mkdir -p $(dirname "$LIVE_DIR")
    sudo git clone -b "$BRANCH" https://$GIT_USER:$GIT_PASS@github.com/Jawadaziz78/vue-project.git "$LIVE_DIR"
fi

cd "$LIVE_DIR"

# 2. Project Cleanup & Dependency Setup
if [ "$PROJECT_TYPE" != "laravel" ]; then
    # Clean previous state to ensure path injection works
    sudo rm -rf node_modules dist .env
    sudo chown -R ubuntu:ubuntu .
    
    # pnpm is now guaranteed by master_setup.sh
    pnpm install --ignore-scripts 
    
    # Permission fixes for hidden binaries (Esbuild/Vite)
    sudo find node_modules/.pnpm -name 'esbuild' -exec chmod +x {} +
    sudo chmod -R +x node_modules/.bin
    pnpm rebuild esbuild
fi

# 3. Final Permissions
sudo chown -R ubuntu:www-data "$LIVE_DIR"

echo "--- ✅ Prep Complete. Returning to Jenkinsfile for Build ---"
