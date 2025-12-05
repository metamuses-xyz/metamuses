-- Points & Leaderboard System Migration
-- Created: December 5, 2025
-- Description: Implements modular task system, points tracking, streaks, and leaderboards

-- ============================================================================
-- 1. Tasks Table (Task Definitions)
-- ============================================================================

CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_type VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    base_points INTEGER NOT NULL,
    multiplier_type VARCHAR(20),
    config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    is_daily BOOLEAN DEFAULT false,
    is_repeatable BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_tasks_active ON tasks(is_active) WHERE is_active = true;

-- ============================================================================
-- 2. User Points Table (Aggregate Points)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_address VARCHAR(42) NOT NULL UNIQUE,
    total_points BIGINT DEFAULT 0 CHECK (total_points >= 0),
    lifetime_points BIGINT DEFAULT 0 CHECK (lifetime_points >= 0),
    current_streak INTEGER DEFAULT 0 CHECK (current_streak >= 0),
    longest_streak INTEGER DEFAULT 0 CHECK (longest_streak >= 0),
    last_checkin_date DATE,
    rank INTEGER,
    season_points BIGINT DEFAULT 0 CHECK (season_points >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_address CHECK (user_address ~* '^0x[a-fA-F0-9]{40}$')
);

CREATE INDEX IF NOT EXISTS idx_user_points_total ON user_points(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_user_points_season ON user_points(season_points DESC);
CREATE INDEX IF NOT EXISTS idx_user_points_address ON user_points(user_address);
CREATE INDEX IF NOT EXISTS idx_user_points_rank ON user_points(rank) WHERE rank IS NOT NULL;

-- ============================================================================
-- 3. Task Completions Table (Task History)
-- ============================================================================

CREATE TABLE IF NOT EXISTS task_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_address VARCHAR(42) NOT NULL,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    task_type VARCHAR(50) NOT NULL,
    points_awarded INTEGER NOT NULL,
    multiplier DECIMAL(5,2) DEFAULT 1.0 CHECK (multiplier >= 0),
    metadata JSONB DEFAULT '{}',
    completed_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT fk_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_completions_user ON task_completions(user_address, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_completions_task ON task_completions(task_type, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_completions_date ON task_completions(DATE(completed_at));
CREATE INDEX IF NOT EXISTS idx_completions_user_task ON task_completions(user_address, task_type);

-- Prevent duplicate daily check-ins
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_checkin_unique
ON task_completions(user_address, task_type, DATE(completed_at))
WHERE task_type = 'daily_checkin';

-- ============================================================================
-- 4. User Streaks Table (Consecutive Day Tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_streaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_address VARCHAR(42) NOT NULL UNIQUE,
    current_streak INTEGER DEFAULT 0 CHECK (current_streak >= 0),
    longest_streak INTEGER DEFAULT 0 CHECK (longest_streak >= 0),
    last_checkin_date DATE,
    streak_started_at DATE,
    total_checkins INTEGER DEFAULT 0 CHECK (total_checkins >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_address_streak CHECK (user_address ~* '^0x[a-fA-F0-9]{40}$')
);

CREATE INDEX IF NOT EXISTS idx_streaks_user ON user_streaks(user_address);
CREATE INDEX IF NOT EXISTS idx_streaks_current ON user_streaks(current_streak DESC);

-- ============================================================================
-- 5. Leaderboard Cache Table (Optimized Rankings)
-- ============================================================================

CREATE TABLE IF NOT EXISTS leaderboard_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    leaderboard_type VARCHAR(50) NOT NULL,
    user_address VARCHAR(42) NOT NULL,
    rank INTEGER NOT NULL CHECK (rank > 0),
    points BIGINT NOT NULL CHECK (points >= 0),
    username VARCHAR(100),
    nft_count INTEGER DEFAULT 0 CHECK (nft_count >= 0),
    streak INTEGER DEFAULT 0 CHECK (streak >= 0),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_leaderboard_entry UNIQUE (leaderboard_type, user_address)
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_type_rank ON leaderboard_cache(leaderboard_type, rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_user ON leaderboard_cache(user_address, leaderboard_type);

-- ============================================================================
-- 6. Point Transactions Table (Audit Trail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS point_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_address VARCHAR(42) NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    points_change INTEGER NOT NULL,
    balance_before BIGINT NOT NULL CHECK (balance_before >= 0),
    balance_after BIGINT NOT NULL CHECK (balance_after >= 0),
    task_completion_id UUID REFERENCES task_completions(id) ON DELETE SET NULL,
    reason TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_address_tx CHECK (user_address ~* '^0x[a-fA-F0-9]{40}$')
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON point_transactions(user_address, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON point_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_completion ON point_transactions(task_completion_id) WHERE task_completion_id IS NOT NULL;

-- ============================================================================
-- Initial Task Definitions
-- ============================================================================

INSERT INTO tasks (task_type, name, description, base_points, is_daily, is_repeatable, config) VALUES
('daily_checkin', 'Daily Check-In', 'Check in once per day to earn points and build your streak', 50, true, false, '{"streak_bonus_per_day": 10, "max_streak_bonus": 100}'),
('chat_duration_15', 'Chat 15 Minutes', 'Have a conversation with your AI companion for at least 15 minutes', 100, false, true, '{"min_duration_seconds": 900, "bonus_per_5_mins": 10}'),
('chat_duration_30', 'Chat 30 Minutes', 'Have a conversation with your AI companion for at least 30 minutes', 200, false, true, '{"min_duration_seconds": 1800, "bonus_per_5_mins": 15}'),
('send_10_messages', 'Send 10 Messages', 'Send 10 messages to your AI companion', 75, false, true, '{"message_count": 10}'),
('send_50_messages', 'Send 50 Messages', 'Send 50 messages to your AI companion in one day', 300, true, true, '{"message_count": 50}'),
('mint_first_nft', 'Mint First NFT', 'Mint your first MuseAI companion NFT', 500, false, false, '{}'),
('consecutive_7_days', '7-Day Streak', 'Check in for 7 consecutive days', 300, false, false, '{"required_days": 7}'),
('consecutive_30_days', '30-Day Streak', 'Check in for 30 consecutive days', 1500, false, false, '{"required_days": 30}')
ON CONFLICT (task_type) DO NOTHING;

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to update user points
CREATE OR REPLACE FUNCTION update_user_points()
RETURNS TRIGGER AS $$
BEGIN
    -- Update total_points and lifetime_points
    UPDATE user_points
    SET
        total_points = total_points + NEW.points_awarded,
        lifetime_points = lifetime_points + NEW.points_awarded,
        season_points = season_points + NEW.points_awarded,
        updated_at = NOW()
    WHERE user_address = NEW.user_address;

    -- Create user_points record if doesn't exist
    IF NOT FOUND THEN
        INSERT INTO user_points (user_address, total_points, lifetime_points, season_points)
        VALUES (NEW.user_address, NEW.points_awarded, NEW.points_awarded, NEW.points_awarded);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update points on task completion
CREATE TRIGGER trigger_update_user_points
AFTER INSERT ON task_completions
FOR EACH ROW
EXECUTE FUNCTION update_user_points();

-- Function to calculate user rank
CREATE OR REPLACE FUNCTION calculate_user_rank(p_user_address VARCHAR(42))
RETURNS INTEGER AS $$
DECLARE
    user_rank INTEGER;
BEGIN
    SELECT COUNT(*) + 1 INTO user_rank
    FROM user_points
    WHERE total_points > (
        SELECT total_points
        FROM user_points
        WHERE user_address = p_user_address
    );

    RETURN user_rank;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON TABLE tasks IS 'Defines available tasks and their point values';
COMMENT ON TABLE user_points IS 'Aggregate points and streaks for each user';
COMMENT ON TABLE task_completions IS 'Complete history of all task completions';
COMMENT ON TABLE user_streaks IS 'Tracks consecutive day check-in streaks';
COMMENT ON TABLE leaderboard_cache IS 'Pre-computed leaderboard for fast queries';
COMMENT ON TABLE point_transactions IS 'Audit trail of all point changes';

COMMENT ON COLUMN tasks.config IS 'JSONB configuration for task-specific parameters';
COMMENT ON COLUMN task_completions.metadata IS 'Task-specific metadata (duration, count, etc.)';
COMMENT ON COLUMN user_points.lifetime_points IS 'All-time points, never decreases';
COMMENT ON COLUMN user_points.season_points IS 'Points for current competitive season';
