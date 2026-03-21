#!/bin/bash
# build-all.sh - Barebones Shell Script
set -e

echo "Starting Consolidated Monorepo Build..."

# 1. Clean and Create Output
rm -rf dist-global
mkdir -p dist-global

# 2. Build POS
echo "Building POS..."
cd apps/pos
npm run build
cd ../..
[ -d "apps/pos/dist" ] && cp -r apps/pos/dist/* dist-global/
echo "POS built."

# 3. Build Function for Others
build_app() {
    local name=$1
    if [ -d "apps/$name" ]; then
        echo "Building $name..."
        cd "apps/$name"
        npm run build
        cd ../..
        mkdir -p "dist-global/$name"
        [ -d "apps/$name/dist" ] && cp -r apps/name/dist/* "dist-global/$name/"
        echo "$name built."
    fi
}

# Run Builds
APPS=("inventory" "reports" "dashboard" "activity-history" "employees" "expenses" "hpp" "opname" "recipes" "settings" "waste" "waste-detail" "cogs" "recipe-edit" "shifts" "attendance" "attendance-history")

for APP in "${APPS[@]}"; do
    if [ -d "apps/$APP" ]; then
        echo "Building $APP..."
        cd "apps/$APP"
        npm run build
        cd ../..
        mkdir -p "dist-global/$APP"
        # Use a safe copy that handles the dist contents correctly
        cp -r "apps/$APP/dist/." "dist-global/$APP/"
        echo "$APP finished."
    fi
done

echo "CONSOLIDATED BUILD FINISHED"
