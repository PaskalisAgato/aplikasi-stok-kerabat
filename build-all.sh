#!/bin/bash
# build-all.sh - Consolidated Monorepo Build Script for Vercel

# Ensure we fail on any error
set -e

echo "🚀 Starting Consolidated Monorepo Build..."
echo "Current directory: $(pwd)"

# Create global dist directory
mkdir -p dist-global
echo "✅ Created dist-global"

# Function to build and copy an app
build_app() {
    local app_dir=$1
    local target_name=$2
    
    echo "----------------------------------------------------"
    echo "📦 Building $target_name..."
    cd "apps/$app_dir"
    npm install --no-audit --no-fund
    npm run build
    
    cd ../..
    
    if [ "$target_name" == "pos" ]; then
        cp -r "apps/$app_dir/dist/." dist-global/
        echo "✅ Copied $target_name to root"
    else
        mkdir -p "dist-global/$target_name"
        cp -r "apps/$app_dir/dist/." "dist-global/$target_name/"
        echo "✅ Copied $target_name to /$target_name/"
    fi
    
    # Sanity check
    ls -l "dist-global/$target_name/index.html" || ls -l "dist-global/index.html"
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
