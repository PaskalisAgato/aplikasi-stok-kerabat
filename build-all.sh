# build-all.sh - v4.0 (Performance Optimized)
set -e

echo "--- VERCEL CONSOLIDATED BUILD START ---"
echo "Build Mode: $( [ "$RUN_TSC" = "true" ] && echo "FULL (with TSC)" || echo "FAST (Vite only)" )"

# 0. Environment & Resource Optimization
export NODE_OPTIONS="--max-old-space-size=4096"
export VITE_CJS_IGNORE_WARNING=true
export GENERATE_SOURCEMAP=false # For any CRA-like tools if present

ROOT_DIR=$(pwd)
VITE_BIN="$ROOT_DIR/node_modules/.bin/vite"

# 1. Clean & Prepare
rm -rf dist-global
mkdir -p dist-global

# 2. Build Function
build_app_internal() {
  local name=$1
  local path=$2
  
  echo "[$name] Starting build..."
  cd "$ROOT_DIR/$path"
  
  if [ "$RUN_TSC" = "true" ]; then
    # Full build with type checking
    npm run build > /dev/null 2>&1
  else
    # FAST BUILD: Direct vite call avoids npx lookup and script overhead
    # --emptyOutDir is important for clean builds in each app directory
    $VITE_BIN build --emptyOutDir > /dev/null 2>&1
  fi
  
  cd "$ROOT_DIR"
  mkdir -p "dist-global/$name"
  if [ -d "$path/dist" ]; then
    cp -r "$path/dist/." "dist-global/$name/"
    echo "[$name] COMPLETED"
  else
    echo "[$name] ERROR: dist/ not found at $path"
    exit 1
  fi
}

# 3. App List
APPS=(
  "pos:apps/pos"
  "inventory:apps/inventory"
  "reports:apps/reports"
  "dashboard:apps/dashboard"
  "employees:apps/employees"
  "expenses:apps/expenses"
  "hpp:apps/hpp"
  "opname:apps/opname"
  "recipes:apps/recipes"
  "waste:apps/waste"
  "waste-detail:apps/waste-detail"
  "cogs:apps/cogs"
  "recipe-edit:apps/recipe-edit"
  "shifts:apps/shifts"
  "attendance:apps/attendance"
  "attendance-history:apps/attendance-history"
  "todo-list:apps/todo-list"
)

# 4. Improved Parallel Execution
# Vercel's standard build environment typically has 2-4 vCPUs.
# We'll use a dynamic job limiter to keep the CPU saturated.
MAX_JOBS=2 

for APP_DATA in "${APPS[@]}"; do
  NAME="${APP_DATA%%:*}"
  DIR="${APP_DATA#*:}"
  
  # Run in background
  ( build_app_internal "$NAME" "$DIR" ) &
  
  # Limit concurrency: wait if we hit MAX_JOBS
  while [ $(jobs -r | wc -l) -ge $MAX_JOBS ]; do
    sleep 2
  done
done

# Wait for all remaining background jobs
wait

# 5. Finalizing (Deploying main app to root)
echo "Consolidating builds..."
cp -rn dist-global/pos/* dist-global/ 2>/dev/null || true

echo "--- VERCEL CONSOLIDATED BUILD FINISHED ---"
