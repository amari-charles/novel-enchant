#!/bin/bash
# Manually trigger worker-dispatch for testing
# This simulates what pg_cron will do automatically every minute in production

echo "Triggering worker-dispatch..."
curl -X POST http://127.0.0.1:54321/functions/v1/worker-dispatch \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n"
