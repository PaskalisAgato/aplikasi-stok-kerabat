# build-all.sh - v3.1 (trigger deploy 2026-03-25 22:45)
set -e

echo "--- VERCEL CONSOLIDATED BUILD START ---"
echo "Build Mode: $( [ "$RUN_TSC" = "true" ] && echo "FULL (with TSC)" || echo "FAST (Vite only)" )"

# 1. Clean
rm -rf dist-global
mkdir -p dist-global

# 2. Build Function
build_app_internal() {
  local name=$1
  local path=$2
  
  echo "[$name] Building..."
  cd "$path"
  
  if [ "$RUN_TSC" = "true" ]; then
    npm run build > /dev/null 2>&1
  else
    # Run vite build directly using npx to avoid overhead
    npx vite build > /dev/null 2>&1
  fi
  
  cd - > /dev/null
  mkdir -p "dist-global/$name"
  cp -r "$path/dist/." "dist-global/$name/"
  echo "[$name] DONE"
}

# 3. Parallel Execution Logic
# We'll build in batches to avoid OOM in Vercel containers
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

MAX_JOBS=4
COUNT=0

for APP_DATA in "${APPS[@]}"; do
  NAME="${APP_DATA%%:*}"
  DIR="${APP_DATA#*:}"
  
  build_app_internal "$NAME" "$DIR" &
  
  COUNT=$((COUNT + 1))
  if [ $((COUNT % MAX_JOBS)) -eq 0 ]; then
    wait # Wait for current batch to finish
  fi
done

wait # Wait for any remaining background jobs

# 4. Finalizing
# Move POS to root level of dist-global (optional, based on vercel.json)
# Based on current vercel.json, POS files should be in the root of dist-global
cp -rn dist-global/pos/* dist-global/ 2>/dev/null || true

echo "--- VERCEL CONSOLIDATED BUILD FINISHED ---"
