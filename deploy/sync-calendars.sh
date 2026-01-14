#!/bin/bash
# Calendar Sync Cron Script
# This script is called by cron to automatically sync Airbnb/Booking.com calendars

# Load environment variables
source /var/www/smartcheckin/.env

# Call the sync API
curl -X POST \
  -H "Authorization: Bearer $SYNC_SECRET_KEY" \
  -H "Content-Type: application/json" \
  https://smartcheckin.ge/api/sync/calendars \
  >> /var/log/smartcheckin-sync.log 2>&1

echo "" >> /var/log/smartcheckin-sync.log
echo "Sync completed at $(date)" >> /var/log/smartcheckin-sync.log
echo "---" >> /var/log/smartcheckin-sync.log
