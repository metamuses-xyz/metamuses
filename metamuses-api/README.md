# MetaMuses API - Rust Backend with Alith Framework

High-performance AI inference backend for MetaMuses with parallel model execution, intelligent routing, and semantic caching.

## Architecture Overview

This backend implements a sophisticated AI inference system with:

- **Multi-tier Model Execution**: Fast, Medium, Heavy tiers + Specialized models
- **Worker Pool Management**: Parallel inference with load balancing
- **Intelligent Query Routing**: Automatic complexity analysis
- **Semantic Caching**: Qdrant vector database for query similarity matching
- **Redis Queue System**: Priority-based job queuing
- **Alith Framework Integration**: LlamaCpp and MistralRS inference engines

## Project Structure

```
metamuses-api/
├── src/
│   ├── types.rs              # Core type definitions
│   ├── config.rs             # Configuration management
│   ├── inference/
│   │   ├── engine.rs         # Inference engine trait & implementations
│   │   ├── worker_pool.rs    # Worker pool with load balancing
│   │   └── models.rs         # Model registry & configurations
│   ├── routing/
│   │   ├── intelligent_router.rs  # Smart query routing
│   │   └── complexity.rs          # Query complexity analyzer
│   ├── queue/
│   │   └── redis_manager.rs       # Redis queue management
│   ├── cache/
│   │   └── semantic.rs            # Semantic cache with Qdrant
│   └── lib.rs                # Module exports
├── Cargo.toml
└── .env.example
```

## Prerequisites

- Rust 1.75+
- Redis server
- Qdrant vector database
- AI models (GGUF format for LlamaCpp)

## Installation

1. **Clone and navigate to the project**:
   ```bash
   cd metamuses-api
   ```

2. **Install dependencies**:
   ```bash
   cargo build
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start required services**:
   ```bash
   # Start Redis
   redis-server

   # Start Qdrant (Docker)
   docker run -p 6333:6333 -p 6334:6334 qdrant/qdrant
   ```

## Configuration

Edit `.env` file with your settings:

### Server
- `HOST`: Server bind address (default: 0.0.0.0)
- `PORT`: Server port (default: 8080)

### Redis
- `REDIS_URL`: Redis connection URL
- `REDIS_QUEUE_PREFIX`: Queue prefix for namespacing

### Qdrant
- `QDRANT_URL`: Qdrant server URL
- `QDRANT_API_KEY`: Optional API key

### Models
- `MODELS_DIR`: Directory containing model files
- `ENABLE_FAST_TIER`: Enable fast tier models
- `ENABLE_MEDIUM_TIER`: Enable medium tier models
- `ENABLE_HEAVY_TIER`: Enable heavy tier models

### Worker Pools
- `FAST_TIER_WORKERS`: Number of fast tier workers (default: 10)
- `MEDIUM_TIER_WORKERS`: Number of medium tier workers (default: 5)
- `HEAVY_TIER_WORKERS`: Number of heavy tier workers (default: 2)

### Cache
- `ENABLE_SEMANTIC_CACHE`: Enable semantic caching
- `CACHE_SIMILARITY_THRESHOLD`: Similarity threshold (0.0-1.0, default: 0.95)
- `CACHE_TTL_HOURS`: Cache TTL in hours (default: 24)

## Model Tiers

### Fast Tier (< 500ms)
- **Models**: Qwen2.5-1.5B, Phi-3-Mini
- **Use Case**: Simple queries, greetings, quick responses
- **Workers**: 10 concurrent

### Medium Tier (< 2s)
- **Models**: Qwen2.5-7B, LLaMA-3.1-8B
- **Use Case**: General conversations, moderate complexity
- **Workers**: 5 concurrent

### Heavy Tier (< 5s)
- **Models**: Qwen2.5-72B
- **Use Case**: Complex reasoning, detailed analysis
- **Workers**: 2 concurrent

### Specialized
- **Code**: DeepSeek-Coder-V2-Lite
- **Math**: Specialized math models
- **Reasoning**: Advanced reasoning models

## Usage

### As a Library

```rust
use metamuses_api::*;
use std::sync::Arc;
use tokio::sync::RwLock;
use uuid::Uuid;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Load configuration
    let config = Config::from_env()?;

    // Initialize components
    let cache = SemanticCache::new(
        &config.qdrant_url,
        "metamuse_cache".to_string(),
        config.cache_similarity_threshold,
        config.cache_ttl_hours,
    ).await?;

    let queue_manager = RedisQueueManager::new(
        &config.redis_url,
        config.redis_queue_prefix.clone(),
    ).await?;

    // Create router
    let router = IntelligentRouter::new(
        Arc::new(cache),
        Arc::new(RwLock::new(queue_manager)),
    );

    // Process inference request
    let request = InferenceRequest {
        id: Uuid::new_v4(),
        muse_id: 1,
        user_query: "Hello, how are you?".to_string(),
        user_address: "0x123...".to_string(),
        context: vec![],
        personality_traits: None,
        priority: Priority::Normal,
        created_at: chrono::Utc::now().timestamp(),
    };

    let result = router.route_and_execute(request).await?;
    println!("Response: {}", result.content);

    Ok(())
}
```

## Development

### Build
```bash
cargo build
```

### Run Tests
```bash
cargo test
```

### Run Benchmarks
```bash
cargo bench
```

### Format Code
```bash
cargo fmt
```

### Lint
```bash
cargo clippy
```

## Components

### Inference Engine
- **LlamaEngineWrapper**: CPU-optimized inference via LlamaCpp
- **MistralRsEngineWrapper**: GPU-accelerated inference
- **ModelFactory**: Dynamic engine creation based on tier

### Worker Pool
- Load-balanced task distribution
- Concurrent request handling per worker
- Automatic worker selection (least loaded)
- Status monitoring and metrics

### Intelligent Router
1. **Cache Check**: Semantic similarity search in Qdrant
2. **Complexity Analysis**: Heuristic-based query classification
3. **Tier Selection**: Route to appropriate model tier
4. **Job Enqueueing**: Priority-based Redis queue
5. **Result Waiting**: Polling with timeout
6. **Cache Update**: Store successful results

### Semantic Cache
- **FastEmbed**: 384-dimensional embeddings
- **Qdrant**: Vector similarity search
- **Cosine Distance**: Similarity metric
- **TTL**: Automatic expiration

### Redis Queue
- **Priority Queues**: Critical > High > Normal > Low
- **Sorted Sets**: FIFO within priority
- **Job Storage**: TTL-based job metadata
- **Pub/Sub**: Job notifications

## Performance

### Target Latencies
- **Fast Tier**: < 500ms
- **Medium Tier**: < 2s
- **Heavy Tier**: < 5s
- **Cache Hit**: < 10ms

### Throughput
- **Fast Tier**: 10 concurrent requests
- **Medium Tier**: 5 concurrent requests
- **Heavy Tier**: 2 concurrent requests

## Implementation Status

### ✅ Completed (Steps 1-5)
- [x] Project setup and Cargo.toml
- [x] Core types and data structures
- [x] Model loading with Alith framework
- [x] Worker pool implementation
- [x] Redis queue integration
- [x] Intelligent router with complexity analyzer
- [x] Semantic cache with Qdrant

### 🔄 Next Steps (Steps 6-9)

As per the RUST_ALITH_STEP_BY_STEP_IMPLEMENTATION.md guide:

1. **API Layer with Axum** (Step 6)
   - HTTP handlers for chat endpoints
   - WebSocket support for streaming
   - Middleware (CORS, auth, rate limiting)
   - Request validation

2. **Integration with Existing Services** (Step 7)
   - Blockchain integration (Metis Hyperion testnet)
   - IPFS integration for metadata
   - NFT verification

3. **Testing & Benchmarking** (Step 8)
   - Integration tests
   - Load tests
   - Performance benchmarks
   - Unit tests for each module

4. **Production Hardening** (Step 9)
   - Enhanced error handling
   - Prometheus metrics
   - Structured logging
   - Health checks
   - Graceful shutdown

## License

Part of the MetaMuses project.