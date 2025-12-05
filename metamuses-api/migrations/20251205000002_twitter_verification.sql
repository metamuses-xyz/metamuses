-- Twitter Verification System Migration
-- Stores user Twitter handle verifications with wallet signatures

-- Twitter verifications table
CREATE TABLE IF NOT EXISTS twitter_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_address VARCHAR(42) NOT NULL,
    twitter_handle VARCHAR(100) NOT NULL,
    signature TEXT NOT NULL,
    message TEXT NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_valid BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',

    -- One verification per wallet address
    UNIQUE(user_address)
);

CREATE INDEX IF NOT EXISTS idx_twitter_verifications_user ON twitter_verifications(user_address);
CREATE INDEX IF NOT EXISTS idx_twitter_verifications_handle ON twitter_verifications(twitter_handle);

-- Twitter task completions tracking
CREATE TABLE IF NOT EXISTS twitter_task_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_address VARCHAR(42) NOT NULL,
    task_type VARCHAR(50) NOT NULL, -- 'follow_twitter' or 'retweet_post'
    twitter_handle VARCHAR(100) NOT NULL,
    verification_id UUID REFERENCES twitter_verifications(id),
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',

    -- Unique constraint for follow task (one per user)
    UNIQUE(user_address, task_type)
);

CREATE INDEX IF NOT EXISTS idx_twitter_task_completions_user ON twitter_task_completions(user_address);
CREATE INDEX IF NOT EXISTS idx_twitter_task_completions_task ON twitter_task_completions(task_type);
