#!/bin/bash
# build-all.sh - Debug Version
set -e
set -x

echo "DEBUG: Starting build-all.sh"
echo "DEBUG: Current Dir: $(pwd)"
ls -la

# Clean
rm -rf dist-global
mkdir -p dist-global

# Build POS
echo "DEBUG: Building POS"
cd apps/pos
ls -la
npm run build
cd ../..
cp -r apps/pos/dist/* dist-global/

# Apps List
OTHER_APPS=("inventory" "reports" "dashboard" "activity-history" "employees" "expenses" "hpp" "opname" "recipes" "settings" "waste" "waste-detail" "cogs" "recipe-edit" "shifts" "attendance" "attendance-history")

for APP in "${OTHER_APPS[@]}"; do
    if [ -d "apps/$APP" ]; then
        echo "DEBUG: Building $APP"
        cd "apps/$APP"
        ls -la
        npm run build
        cd ../..
        mkdir -p "dist-global/$APP"
        cp -r "apps/$APP/dist/." "dist-global/$APP/"
    else
        echo "DEBUG: Skipping $APP (not found)"
    fi
done

echo "DEBUG: Build All Finished"
ls -la dist-global
