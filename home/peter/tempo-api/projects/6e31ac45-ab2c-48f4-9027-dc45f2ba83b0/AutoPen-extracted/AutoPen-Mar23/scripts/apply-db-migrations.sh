#!/bin/bash
# Script to apply database migrations using Supabase SQL execution

echo "===== AUTOPEN EBOOK WORKFLOW DATABASE SETUP ====="
echo "Starting database migrations..."

# Get the current directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
MIGRATIONS_DIR="$PROJECT_DIR/migrations"
MIGRATION_FILE="$MIGRATIONS_DIR/combined_migration.sql"

# Execute the SQL file
if [ -f "$MIGRATION_FILE" ]; then
    echo "Applying migration from: $MIGRATION_FILE"
    cat "$MIGRATION_FILE" | npx supabase db execute
    
    # Check the exit status
    if [ $? -eq 0 ]; then
        echo "Migration completed successfully!"
    else
        echo "Migration failed! Please check the error messages above."
        echo "You may need to apply the migration manually via the Supabase dashboard."
        echo "See the instructions in migrations/README.md for details."
        exit 1
    fi
else
    echo "Error: Migration file not found at $MIGRATION_FILE"
    exit 1
fi

echo "All database migrations completed."
echo "Please verify the changes in your Supabase dashboard."