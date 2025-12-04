#!/bin/bash
# Local development script to run multiple workers
# Usage: ./run-workers.sh [num_workers]

set -e

NUM_WORKERS=${1:-4}
THREADS_PER_WORKER=$((16 / NUM_WORKERS))

echo "╔════════════════════════════════════════════════════════════╗"
echo "║       MetaMuses Multi-Worker Development Runner            ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║  Workers: $NUM_WORKERS                                             ║"
echo "║  Threads per worker: $THREADS_PER_WORKER                                  ║"
echo "╚════════════════════════════════════════════════════════════╝"

# Check if Redis is running
if ! redis-cli ping > /dev/null 2>&1; then
    echo "❌ Redis is not running. Please start Redis first:"
    echo "   brew services start redis  (macOS)"
    echo "   sudo systemctl start redis (Linux)"
    exit 1
fi

echo "✅ Redis is running"

# Build release if needed
if [ ! -f "../target/release/metamuse-worker" ]; then
    echo "📦 Building release binary..."
    cd ..
    cargo build --release
    cd deploy
fi

# Kill any existing workers
echo "🛑 Stopping any existing workers..."
pkill -f "metamuse-worker" 2>/dev/null || true
sleep 2

# Start workers
echo "🚀 Starting $NUM_WORKERS workers..."
for i in $(seq 0 $((NUM_WORKERS - 1))); do
    echo "   Starting worker $i (threads: $THREADS_PER_WORKER)..."
    WORKER_ID=$i \
    TOTAL_WORKERS=$NUM_WORKERS \
    THREADS_PER_WORKER=$THREADS_PER_WORKER \
    BATCH_SIZE=512 \
    CONTEXT_SIZE=2048 \
    MODELS_DIR=../models \
    REDIS_URL=redis://127.0.0.1:6379 \
    REDIS_QUEUE_PREFIX=metamuse \
    ENABLE_SEMANTIC_CACHE=false \
    RUST_LOG=info \
    ../target/release/metamuse-worker > ../logs/worker-$i.log 2>&1 &

    echo "   Worker $i started (PID: $!)"
done

echo ""
echo "✅ All workers started!"
echo ""
echo "📝 View logs:"
for i in $(seq 0 $((NUM_WORKERS - 1))); do
    echo "   Worker $i: tail -f ../logs/worker-$i.log"
done
echo ""
echo "🛑 Stop all workers:"
echo "   pkill -f metamuse-worker"
echo ""
echo "Press Ctrl+C to stop this script (workers will continue running)"
echo ""

# Wait and show combined logs
mkdir -p ../logs
tail -f ../logs/worker-*.log 2>/dev/null || wait
