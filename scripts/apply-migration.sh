#!/bin/bash

# Load environment variables
set -a
source frontend/.env
set +a

# Extract project ref from URL
PROJECT_REF=$(echo "$VITE_SUPABASE_URL" | sed 's/https:\/\///' | sed 's/\.supabase\.co//')

echo "Applying migration to project..."

# Read the migration SQL
MIGRATION_SQL=$(cat supabase/migrations/20251003000000_polymorphic_media_ownership.sql)

# Use psql via Supabase connection string
# Note: This would need the database password which we don't have

# Alternative: Use the REST API with service role key
# But PostgREST doesn't expose exec_sql by default

echo "Migration must be applied manually via Supabase dashboard:"
echo "https://supabase.com/dashboard/project/$PROJECT_REF/sql/new"
echo ""
echo "Run this SQL:"
echo "---"
cat supabase/migrations/20251003000000_polymorphic_media_ownership.sql
