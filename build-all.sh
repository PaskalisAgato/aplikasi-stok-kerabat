#!/bin/bash
# build-all.sh - Simplified & Verbose Build Script
set -e

echo "🚀 [CONSOLIDATED BUILD] STARTING..."

# 1. Root Information
echo "📍 Current Directory: $(pwd)"
echo "🟢 Node Version: $(node -v)"
echo "🟢 NPM Version: $(npm -v)"

# 2. Preparation
echo "🧹 Cleaning previous build..."
rm -rf dist-global
mkdir -p dist-global
echo "✅ Prepared dist-global folder."

# 3. Build Function
build_and_copy() {
    local app_dir=$1
    local target_path=$2
    
    echo "----------------------------------------------------"
    echo "📦 Building module: $app_dir..."
    
    if [ ! -d "apps/$app_dir" ]; then
        echo "⚠️ Warning: apps/$app_dir not found skipping."
        return
    fi
    
    cd "apps/$app_dir"
    
    # Run Build
    echo "🛠️ Running 'npm run build' in apps/$app_dir..."
    npm run build
    
    # Copy Output
    cd ../..
    
    if [ "$target_path" == "root" ]; then
        echo "📂 Copying $app_dir to root of dist-global..."
        cp -r "apps/$app_dir/dist/." dist-global/
    else
        echo "📂 Copying $app_dir to /$target_path/ in dist-global..."
        mkdir -p "dist-global/$target_path"
        cp -r "apps/$app_dir/dist/." "dist-global/$target_path/"
    fi
    
    echo "✅ Module $app_dir built successfully."
}

# 4. Sequential Builds
# We build POS first because it goes to the root
build_and_copy "pos" "root"

# Then build all others
OTHER_APPS=("inventory" "reports" "dashboard" "activity-history" "employees" "expenses" "hpp" "opname" "recipes" "settings" "waste" "waste-detail" "cogs" "recipe-edit" "shifts" "attendance" "attendance-history")

for APP in "${OTHER_APPS[@]}"; do
    build_and_copy "$APP" "$APP"
done

echo "----------------------------------------------------"
echo "🏁 [CONSOLIDATED BUILD] FINISHED SUCCESSFULLY!"
echo "📍 Output located in: $(pwd)/dist-global"
ls -F dist-global
