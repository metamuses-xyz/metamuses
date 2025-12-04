#!/bin/bash
# MetaMuses API Deployment Script for Hetzner ARM64
# Usage: ./deploy.sh [num_workers]

set -e

NUM_WORKERS=${1:-4}  # Default to 4 workers
THREADS_PER_WORKER=$((16 / NUM_WORKERS))  # Auto-calculate threads based on 16 CPUs

echo "╔════════════════════════════════════════════════════════════╗"
echo "║          MetaMuses API Deployment Script                   ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║  Workers: $NUM_WORKERS                                             ║"
echo "║  Threads per worker: $THREADS_PER_WORKER                                  ║"
echo "║  Total CPU utilization: $((NUM_WORKERS * THREADS_PER_WORKER)) threads                       ║"
echo "╚════════════════════════════════════════════════════════════╝"

# Configuration
DEPLOY_DIR="/opt/metamuses-api"
MODEL_URL="https://huggingface.co/Qwen/Qwen2.5-3B-Instruct-GGUF/resolve/main/qwen2.5-3b-instruct-q4_k_m.gguf"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root (sudo ./deploy.sh)"
    exit 1
fi

echo ""
echo "📦 Step 1: Installing dependencies..."
apt-get update
apt-get install -y clang libclang-dev cmake build-essential redis-server

echo ""
echo "👤 Step 2: Creating metamuse user..."
id -u metamuse &>/dev/null || useradd -r -s /bin/false metamuse

echo ""
echo "📁 Step 3: Setting up directories..."
mkdir -p $DEPLOY_DIR/{bin,models,logs}
chown -R metamuse:metamuse $DEPLOY_DIR

echo ""
echo "🦀 Step 4: Building release binary..."
cd /tmp
if [ ! -d "metamuses-api" ]; then
    echo "   Cloning repository..."
    git clone https://github.com/metamuses-xyz/metamuses.git metamuses-api-repo
    cd metamuses-api-repo/metamuses-api
else
    cd metamuses-api
    git pull
fi

echo "   Building with release optimizations..."
cargo build --release

echo ""
echo "📥 Step 5: Installing binaries..."
cp target/release/metamuse-server $DEPLOY_DIR/bin/
cp target/release/metamuse-worker $DEPLOY_DIR/bin/
chmod +x $DEPLOY_DIR/bin/*

echo ""
echo "🤖 Step 6: Downloading model (if not exists)..."
if [ ! -f "$DEPLOY_DIR/models/qwen2.5-3b-instruct-q4_k_m.gguf" ]; then
    echo "   Downloading Qwen2.5-3B-Instruct model (~2GB)..."
    wget -q --show-progress -O $DEPLOY_DIR/models/qwen2.5-3b-instruct-q4_k_m.gguf $MODEL_URL
else
    echo "   Model already exists, skipping download."
fi

echo ""
echo "⚙️ Step 7: Installing systemd services..."

# Create worker service template with dynamic thread count
cat > /etc/systemd/system/metamuse-worker@.service << EOF
[Unit]
Description=MetaMuses AI Inference Worker %i
After=network.target redis.service
Wants=redis.service

[Service]
Type=simple
User=metamuse
Group=metamuse
WorkingDirectory=$DEPLOY_DIR

# Worker instance configuration
Environment=WORKER_ID=%i
Environment=TOTAL_WORKERS=$NUM_WORKERS
Environment=THREADS_PER_WORKER=$THREADS_PER_WORKER
Environment=BATCH_SIZE=512
Environment=CONTEXT_SIZE=2048

# Model and Redis configuration
Environment=MODELS_DIR=$DEPLOY_DIR/models
Environment=REDIS_URL=redis://127.0.0.1:6379
Environment=REDIS_QUEUE_PREFIX=metamuse

# Disable semantic cache for now
Environment=ENABLE_SEMANTIC_CACHE=false

# Log configuration
Environment=RUST_LOG=info

ExecStart=$DEPLOY_DIR/bin/metamuse-worker

# Restart configuration
Restart=always
RestartSec=5
StartLimitBurst=5
StartLimitIntervalSec=60

# Resource limits per worker
LimitNOFILE=65536
MemoryMax=$((32 / NUM_WORKERS))G

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=metamuse-worker-%i

[Install]
WantedBy=multi-user.target
EOF

# Create server service
cat > /etc/systemd/system/metamuse-server.service << EOF
[Unit]
Description=MetaMuses API Server
After=network.target redis.service
Wants=redis.service

[Service]
Type=simple
User=metamuse
Group=metamuse
WorkingDirectory=$DEPLOY_DIR

Environment=HOST=0.0.0.0
Environment=PORT=8081
Environment=REDIS_URL=redis://127.0.0.1:6379
Environment=REDIS_QUEUE_PREFIX=metamuse
Environment=MODELS_DIR=$DEPLOY_DIR/models
Environment=ENABLE_SEMANTIC_CACHE=false
Environment=RUST_LOG=info

ExecStart=$DEPLOY_DIR/bin/metamuse-server

Restart=always
RestartSec=5
LimitNOFILE=65536

StandardOutput=journal
StandardError=journal
SyslogIdentifier=metamuse-server

[Install]
WantedBy=multi-user.target
EOF

echo ""
echo "🔄 Step 8: Reloading systemd..."
systemctl daemon-reload

echo ""
echo "🚀 Step 9: Starting services..."

# Enable and start Redis
systemctl enable redis-server
systemctl start redis-server

# Enable and start API server
systemctl enable metamuse-server
systemctl start metamuse-server

# Enable and start worker instances
for i in $(seq 0 $((NUM_WORKERS - 1))); do
    echo "   Starting worker $i..."
    systemctl enable metamuse-worker@$i
    systemctl start metamuse-worker@$i
done

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Service status:"
echo "   Server: $(systemctl is-active metamuse-server)"
for i in $(seq 0 $((NUM_WORKERS - 1))); do
    echo "   Worker $i: $(systemctl is-active metamuse-worker@$i)"
done

echo ""
echo "📝 Useful commands:"
echo "   View server logs:  journalctl -u metamuse-server -f"
echo "   View worker logs:  journalctl -u metamuse-worker@0 -f"
echo "   Restart all:       systemctl restart metamuse-server metamuse-worker@{0..$((NUM_WORKERS-1))}"
echo "   Stop all:          systemctl stop metamuse-server metamuse-worker@{0..$((NUM_WORKERS-1))}"
echo ""
echo "🌐 API endpoint: http://localhost:8081/health"
