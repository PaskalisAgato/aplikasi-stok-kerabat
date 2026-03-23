# build-all.sh - v2.0 (deployment fix)
set -e

echo "--- VERCEL CONSOLIDATED BUILD START ---"

# 1. Clean
rm -rf dist-global
mkdir -p dist-global

# 2. Build POS (Main)
echo "Building POS..."
cd apps/pos && npm run build && cd ../..
cp -r apps/pos/dist/* dist-global/
echo "POS DONE"

# 3. Build Sub-apps
build_app() {
  local name=$1
  if [ -d "apps/$name" ]; then
    echo "Building $name..."
    cd "apps/$name" && npm run build && cd ../..
    mkdir -p "dist-global/$name"
    cp -r "apps/$name/dist/." "dist-global/$name/"
    echo "$name DONE"
  fi
}

# List all apps
APPS=("inventory" "reports" "dashboard" "activity-history" "employees" "expenses" "hpp" "opname" "recipes" "settings" "waste" "waste-detail" "cogs" "recipe-edit" "shifts" "attendance" "attendance-history" "todo-list")

for APP in "${APPS[@]}"; do
  build_app "$APP"
done

echo "--- VERCEL CONSOLIDATED BUILD FINISHED ---"
