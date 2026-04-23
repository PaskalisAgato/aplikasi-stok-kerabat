#!/bin/bash
# consolidate-dist.sh - v1.0
set -e

echo "--- CONSOLIDATING TURBO BUILDS ---"
ROOT_DIR=$(pwd)
rm -rf dist-global
mkdir -p dist-global

# Apps to consolidate into dist
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
  "printer-settings:apps/printer-settings"
  "members:apps/members"
)

for APP_DATA in "${APPS[@]}"; do
  NAME="${APP_DATA%%:*}"
  DIR="${APP_DATA#*:}"
  
  mkdir -p "dist-global/$NAME"
  if [ -d "$DIR/dist" ]; then
    cp -r "$DIR/dist/." "dist-global/$NAME/"
    echo "[$NAME] Consolidated"
  else
    echo "[$NAME] SKIP (no dist folder found)"
  fi
done

# POS remains at the root of dist-global for the main application entry
echo "Setting POS as root entry..."
cp -rn dist-global/pos/* dist-global/ 2>/dev/null || true

echo "--- CONSOLIDATION FINISHED ---"
