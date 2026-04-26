#!/bin/bash
# build-all.sh - v5.0 (Vercel Sequential - Reliable)
set -e

echo "--- VERCEL CONSOLIDATED BUILD START ---"

# 0. Environment
export NODE_OPTIONS="--max-old-space-size=4096"
export VITE_CJS_IGNORE_WARNING=true

ROOT_DIR=$(pwd)
VITE_BIN="$ROOT_DIR/node_modules/.bin/vite"

# 1. Clean & Prepare output
rm -rf dist-global
mkdir -p dist-global

# 2. App List
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
  "members:apps/members"
  "printer-settings:apps/printer-settings"
)

# 3. Build each app sequentially (reliable on Vercel)
for APP_DATA in "${APPS[@]}"; do
  NAME="${APP_DATA%%:*}"
  DIR="${APP_DATA#*:}"

  echo "[$NAME] Building..."
  cd "$ROOT_DIR/$DIR"
  if [ "$RUN_TSC" = "true" ]; then
    # Full build with type checking
    npm run build > /dev/null 2>&1
  else
    # FAST BUILD: Direct vite call avoids npx lookup and script overhead
    # --emptyOutDir is important for clean builds in each app directory
    "$VITE_BIN" build --emptyOutDir > /dev/null 2>&1
  fi
  
  cd "$ROOT_DIR"
  mkdir -p "dist-global/$NAME"
  if [ -d "$DIR/dist" ]; then
    cp -r "$DIR/dist/." "dist-global/$NAME/"
    echo "[$NAME] OK"
  else
    echo "[$NAME] FAILED: no dist/ folder"
    exit 1
  fi
done

# 4. Copy POS as root entry point
echo "Setting POS as root..."
cp -rn dist-global/pos/* dist-global/ 2>/dev/null || true

echo "--- BUILD FINISHED ---"
echo "Output: dist-global/"
ls dist-global/
