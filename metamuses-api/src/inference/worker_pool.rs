use crate::inference::InferenceEngine;
use crate::types::{InferenceJob, InferenceResult, ModelTier, WorkerStatus};
use anyhow::Result;
use std::sync::atomic::{AtomicU32, AtomicUsize, Ordering};
use std::sync::Arc;
use tokio::sync::{mpsc, oneshot, RwLock, Mutex};
use tracing::{info, error};
use uuid::Uuid;

// ============================================================================
// Worker
// ============================================================================

pub struct Worker {
    pub id: Uuid,
    pub tier: ModelTier,
    engine: Arc<dyn InferenceEngine>,
    status: Arc<RwLock<WorkerStatus>>,
    current_tasks: Arc<AtomicU32>,
    max_concurrent: u32,
    total_requests_processed: Arc<AtomicUsize>,
}

impl Worker {
    pub fn new(
        tier: ModelTier,
        engine: Arc<dyn InferenceEngine>,
        max_concurrent: u32,
    ) -> Self {
        Self {
            id: Uuid::new_v4(),
            tier,
            engine,
            status: Arc::new(RwLock::new(WorkerStatus::Idle)),
            current_tasks: Arc::new(AtomicU32::new(0)),
            max_concurrent,
            total_requests_processed: Arc::new(AtomicUsize::new(0)),
        }
    }

    pub async fn process_job(&self, job: InferenceJob) -> Result<InferenceResult> {
        // Update status
        self.current_tasks.fetch_add(1, Ordering::SeqCst);
        if self.current_tasks.load(Ordering::SeqCst) == 1 {
            *self.status.write().await = WorkerStatus::Busy;
        }

        info!(
            "Worker {} processing job {} (tier: {:?})",
            self.id, job.id, self.tier
        );

        let start = std::time::Instant::now();

        // Build prompt with personality and context
        let prompt = self.build_prompt(&job);

        // Generate response
        let response = match self.engine.generate(&prompt).await {
            Ok(res) => res,
            Err(e) => {
                error!("Worker {} failed to generate response: {}", self.id, e);
                self.current_tasks.fetch_sub(1, Ordering::SeqCst);
                if self.current_tasks.load(Ordering::SeqCst) == 0 {
                    *self.status.write().await = WorkerStatus::Idle;
                }
                return Err(e);
            }
        };

        let latency_ms = start.elapsed().as_millis() as u64;

        // Update counters
        self.current_tasks.fetch_sub(1, Ordering::SeqCst);
        self.total_requests_processed.fetch_add(1, Ordering::SeqCst);

        if self.current_tasks.load(Ordering::SeqCst) == 0 {
            *self.status.write().await = WorkerStatus::Idle;
        }

        info!(
            "Worker {} completed job {} in {}ms",
            self.id, job.id, latency_ms
        );

        Ok(InferenceResult {
            request_id: job.id,
            content: response,
            model_name: self.engine.model_name().to_string(),
            tier: self.tier,
            latency_ms,
            from_cache: false,
            tokens_generated: None, // TODO: track tokens
        })
    }

    fn build_prompt(&self, job: &InferenceJob) -> String {
        let mut prompt = String::new();

        // Add personality context if available
        if let Some(traits) = &job.personality_traits {
            prompt.push_str(&format!(
                "You are an AI companion with the following traits:\n\
                 Creativity: {}/10, Wisdom: {}/10, Humor: {}/10, Empathy: {}/10\n\n",
                traits.creativity, traits.wisdom, traits.humor, traits.empathy
            ));
        }

        // Add conversation history
        for msg in &job.context {
            prompt.push_str(&format!("{}: {}\n", msg.role, msg.content));
        }

        // Add current query
        prompt.push_str(&format!("user: {}\nassistant: ", job.query));

        prompt
    }

    pub async fn is_available(&self) -> bool {
        let current = self.current_tasks.load(Ordering::SeqCst);
        current < self.max_concurrent
    }

    pub async fn get_load(&self) -> u32 {
        self.current_tasks.load(Ordering::SeqCst)
    }

    pub async fn get_status(&self) -> WorkerStatus {
        *self.status.read().await
    }
}

// ============================================================================
// Worker Pool
// ============================================================================

pub struct WorkerPool {
    pub tier: ModelTier,
    workers: Arc<RwLock<Vec<Arc<Worker>>>>,
    task_queue: mpsc::UnboundedSender<(InferenceJob, oneshot::Sender<Result<InferenceResult>>)>,
    shutdown_tx: Option<mpsc::Sender<()>>,
}

impl WorkerPool {
    pub async fn new(
        tier: ModelTier,
        num_workers: usize,
        model_config: crate::types::ModelConfig,
    ) -> Result<Self> {
        info!("Creating worker pool for tier {:?} with {} workers", tier, num_workers);

        let (task_tx, task_rx) = mpsc::unbounded_channel::<(InferenceJob, oneshot::Sender<Result<InferenceResult>>)>();
        let (shutdown_tx, mut shutdown_rx) = mpsc::channel::<()>(1);

        let mut workers = Vec::new();

        // Create workers
        for i in 0..num_workers {
            info!("Initializing worker {}/{} for tier {:?}", i + 1, num_workers, tier);

            let engine = crate::inference::ModelFactory::create_engine(&model_config).await?;
            let max_concurrent = tier.max_concurrent_requests() as u32;

            let worker = Arc::new(Worker::new(tier, Arc::from(engine), max_concurrent));
            workers.push(worker);

            info!("Worker {} initialized successfully", i + 1);
        }

        let workers = Arc::new(RwLock::new(workers));

        // Spawn task dispatcher
        let workers_clone = workers.clone();
        let task_rx = Arc::new(Mutex::new(task_rx));

        tokio::spawn(async move {
            loop {
                tokio::select! {
                    task = async {
                        let mut rx = task_rx.lock().await;
                        rx.recv().await
                    } => {
                        if let Some((job, response_tx)) = task {
                            // Select least loaded worker
                            let worker = Self::select_worker(&workers_clone).await;

                            // Spawn task on worker
                            tokio::spawn(async move {
                                let result = worker.process_job(job).await;
                                let _ = response_tx.send(result);
                            });
                        }
                    }
                    _ = shutdown_rx.recv() => {
                        info!("Worker pool shutting down");
                        break;
                    }
                }
            }
        });

        Ok(Self {
            tier,
            workers,
            task_queue: task_tx,
            shutdown_tx: Some(shutdown_tx),
        })
    }

    async fn select_worker(workers: &Arc<RwLock<Vec<Arc<Worker>>>>) -> Arc<Worker> {
        let workers_guard = workers.read().await;

        // Find worker with lowest current load
        workers_guard
            .iter()
            .min_by_key(|w| w.current_tasks.load(Ordering::SeqCst))
            .unwrap()
            .clone()
    }

    pub async fn submit_job(&self, job: InferenceJob) -> Result<InferenceResult> {
        let (response_tx, response_rx) = oneshot::channel();

        self.task_queue
            .send((job, response_tx))
            .map_err(|_| anyhow::anyhow!("Failed to enqueue job"))?;

        response_rx
            .await
            .map_err(|_| anyhow::anyhow!("Failed to receive response from worker"))?
    }

    pub async fn get_active_workers(&self) -> usize {
        let workers = self.workers.read().await;
        let mut active = 0;

        for worker in workers.iter() {
            if worker.get_load().await > 0 {
                active += 1;
            }
        }

        active
    }

    pub async fn get_total_workers(&self) -> usize {
        self.workers.read().await.len()
    }

    pub async fn shutdown(&mut self) {
        if let Some(tx) = self.shutdown_tx.take() {
            let _ = tx.send(()).await;
        }
    }
}
