#!/bin/bash
# build-all.sh - Consolidated Monorepo Build Script for Vercel

# Exit on error
set -e

echo "🚀 Starting Consolidated Monorepo Build..."

# 1. Setup Global Dist folder
ROOT_DIST="dist-global"
rm -rf $ROOT_DIST
mkdir -p $ROOT_DIST

# 2. Function to build an app
build_app() {
    local APP_PATH=$1
    local APP_NAME=$2
    echo "----------------------------------------------------"
    echo "📦 Building $APP_NAME..."
    cd "$APP_PATH"
    
    # Install dependencies only if not present (Vercel usually handles this at root)
    # But for safety in monorepos:
    npm install
    
    # Build
    npm run build
    
    # Move to global dist
    if [ "$APP_NAME" == "pos" ]; then
        # POS goes to root
        cp -r dist/* "../../$ROOT_DIST/"
    else
        # Others go to sub-folders
        mkdir -p "../../$ROOT_DIST/$APP_NAME"
        cp -r dist/* "../../$ROOT_DIST/$APP_NAME/"
    fi
    
    cd ../..
}

# 3. Build the core POS app FIRST (goes to root)
build_app "apps/pos" "pos"

# 4. Build other apps
APPS=("inventory" "reports" "dashboard" "activity-history" "employees" "expenses" "hpp" "opname" "recipes" "settings" "waste" "waste-detail" "cogs" "recipe-edit")

for APP in "${APPS[@]}"; do
    if [ -d "apps/$APP" ]; then
        build_app "apps/$APP" "$APP"
    else
        echo "⚠️ Warning: Directory apps/$APP not found, skipping..."
    fi
done

echo "----------------------------------------------------"
echo "✅ Build Complete! Multi-app structure ready in $ROOT_DIST"
ls -F $ROOT_DIST
