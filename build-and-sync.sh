#!/bin/bash
# build-and-sync.sh
set -e
echo "--- STARTING FULL OPTIMIZED BUILD ---"
npm run build:android
echo "--- CONSOLIDATION DONE, SYNCING TO CAPACITOR ---"
cd apps/pos
npx cap sync
echo "--- BUILD AND SYNC COMPLETE ---"
