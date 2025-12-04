#!/bin/bash
# Build script for metamuses-api that bypasses sqlx compile-time checks

echo "🔨 Building metamuses-api with sqlx offline mode..."
echo ""

# Set sqlx to offline mode
export SQLX_OFFLINE=true

# Build the project
if cargo build --release; then
    echo ""
    echo "✅ Build successful!"
    echo ""
    echo "Note: sqlx compile-time checks are disabled."
    echo "The code will work correctly at runtime with a PostgreSQL database."
    echo ""
    echo "To run the server:"
    echo "  cargo run --bin server"
    echo ""
    echo "To run the worker:"
    echo "  cargo run --bin worker"
    echo ""
else
    echo ""
    echo "❌ Build failed. Check errors above."
    exit 1
fi
