#!/bin/bash
# build-all.sh - Final Fixed Version
set -e
set -x # Debug mode

echo "🚀 Starting Consolidated Monorepo Build..."
echo "Current directory: $(pwd)"
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Vercel already runs npm install before this script.
# Running it again here can be slow or fail in CI.
echo "⏭️ Skipping redundant npm install (handled by Vercel CI)"

# Create global dist directory
mkdir -p dist-global
echo "✅ Created dist-global"

# Initialize report
REPORT="dist-global/build-report.txt"
echo "Build Report - $(date)" > $REPORT
echo "--------------------------" >> $REPORT

# Function to build and copy an app
build_app() {
    local app_dir=$1
    local target_name=$2
    
    echo "----------------------------------------------------"
    echo "📦 Building $target_name from folder apps/$app_dir..."
    
    # 1. Enter app directory
    cd "apps/$app_dir"
    
    # 2. Build process
    # Do NOT run npm install here. Vercel automatically installs root workspace devDependencies.
    # Running npm install here in production mode would prune devDependencies like 'vite' and 'tsc' (Error 127).
    npm run build
    
    # 3. Return to root
    cd ../..
    
    # 4. Copy results
    if [ "$target_name" == "pos" ]; then
        cp -r "apps/$app_dir/dist/." dist-global/
        echo "✅ Copied $target_name to root" >> $REPORT
    else
        mkdir -p "dist-global/$target_name"
        cp -r "apps/$app_dir/dist/." "dist-global/$target_name/"
        echo "✅ Copied $target_name to /$target_name/" >> $REPORT
    fi
    
    # Verify index.html exists
    if [ -f "dist-global/$target_name/index.html" ] || [ -f "dist-global/index.html" ]; then
         echo "   [VERIFIED] index.html exists for $target_name" >> $REPORT
    else
         echo "   [FAILED] index.html MISSING for $target_name" >> $REPORT
    fi
}

# 1. Build POS (Root)
build_app "pos" "pos"

# 2. Build Sub-apps
APPS=("inventory" "reports" "dashboard" "activity-history" "employees" "expenses" "hpp" "opname" "recipes" "settings" "waste" "waste-detail" "cogs" "recipe-edit" "shifts" "attendance" "attendance-history")

for APP in "${APPS[@]}"; do
    if [ -d "apps/$APP" ]; then
        build_app "$APP" "$APP"
    else
        echo "⚠️ Warning: apps/$APP not found" >> $REPORT
    fi
done

echo "--------------------------" >> $REPORT
echo "✅ ALL BUILDS COMPLETED SUCCESSFULLY!" >> $REPORT
ls -R dist-global >> $REPORT 2>&1 || true

echo "✅ Build script execution finished."
