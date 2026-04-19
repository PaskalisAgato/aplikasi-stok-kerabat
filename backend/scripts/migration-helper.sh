#!/bin/bash
# migration-helper.sh - Database Porting Utility

# 1. Configuration (FILL THESE FROM YOUR DASHBOARDS)
OLD_DB_URL="[PASTE_RENDER_DB_URL_HERE]"
NEW_DB_URL="[PASTE_KOYEB_DB_URL_HERE]"

echo "--- KERABAT POS DATABASE MIGRATION START ---"

# 2. Dump from Render
echo "Step 1: Dumping data from Render PostgreSQL..."
pg_dump "$OLD_DB_URL" --format=custom --file=kerabat_pos_dump.backup

if [ $? -eq 0 ]; then
  echo "✅ Dump successful: kerabat_pos_dump.backup created."
else
  echo "❌ Error during dump. Check connectivity to Render."
  exit 1
fi

# 3. Restore to Koyeb
echo "Step 2: Restoring data to Koyeb PostgreSQL..."
pg_restore --clean --if-exists --no-owner --no-privileges --dbname="$NEW_DB_URL" kerabat_pos_dump.backup

if [ $? -eq 0 ]; then
  echo "✅ Restore successful! Data is now on Koyeb."
else
  echo "❌ Error during restore. Check connectivity to Koyeb."
  exit 1
fi

echo "--- MIGRATION COMPLETE ---"
echo "Recommended Next Step: Run 'npm run db:push' from backend to sync any missing schema changes."
