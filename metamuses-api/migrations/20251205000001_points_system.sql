-- Points and Leaderboard System Migration
-- Creates tables for gamification system with daily check-ins, streaks, and leaderboards

-- Task definitions table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_type VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    base_points INTEGER NOT NULL DEFAULT 0,
    config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User aggregate points table
CREATE TABLE IF NOT EXISTS user_points (
    user_address VARCHAR(42) NOT NULL PRIMARY KEY,
    total_points BIGINT NOT NULL DEFAULT 0,
    lifetime_points BIGINT NOT NULL DEFAULT 0,
    season_points BIGINT NOT NULL DEFAULT 0,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    rank INTEGER,
    last_checkin_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_points_total ON user_points(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_user_points_rank ON user_points(rank);

-- Task completions table (audit trail)
CREATE TABLE IF NOT EXISTS task_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_address VARCHAR(42) NOT NULL,
    task_id UUID NOT NULL REFERENCES tasks(id),
    task_type VARCHAR(50) NOT NULL,
    points_awarded INTEGER NOT NULL,
    multiplier DECIMAL(5,2) DEFAULT 1.0,
    metadata JSONB DEFAULT '{}',
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique index for daily check-in constraint
-- Note: We'll enforce "once per day" in application logic instead of DB constraint
-- because DATE casting in PostgreSQL is not immutable in indexes

CREATE INDEX IF NOT EXISTS idx_task_completions_user ON task_completions(user_address, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_completions_task ON task_completions(task_type, completed_at DESC);

-- User streaks table
CREATE TABLE IF NOT EXISTS user_streaks (
    user_address VARCHAR(42) NOT NULL PRIMARY KEY,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_checkin_date DATE,
    streak_started_at DATE,
    total_checkins INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leaderboard cache table (for optimized queries)
CREATE TABLE IF NOT EXISTS leaderboard_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    leaderboard_type VARCHAR(50) NOT NULL,
    user_address VARCHAR(42) NOT NULL,
    rank INTEGER NOT NULL,
    points BIGINT NOT NULL,
    streak INTEGER DEFAULT 0,
    cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(leaderboard_type, user_address)
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_cache_type_rank ON leaderboard_cache(leaderboard_type, rank);

-- Point transactions table (full audit log)
CREATE TABLE IF NOT EXISTS point_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_address VARCHAR(42) NOT NULL,
    transaction_type VARCHAR(20) NOT NULL,
    points_change INTEGER NOT NULL,
    balance_before BIGINT NOT NULL DEFAULT 0,
    balance_after BIGINT NOT NULL,
    task_completion_id UUID,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_point_transactions_user ON point_transactions(user_address, created_at DESC);

-- Function to update user_points automatically
CREATE OR REPLACE FUNCTION update_user_points()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_points (user_address, total_points, lifetime_points)
    VALUES (NEW.user_address, NEW.points_awarded, NEW.points_awarded)
    ON CONFLICT (user_address) DO UPDATE SET
        total_points = user_points.total_points + NEW.points_awarded,
        lifetime_points = user_points.lifetime_points + NEW.points_awarded,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update points
DROP TRIGGER IF EXISTS trigger_update_user_points ON task_completions;
CREATE TRIGGER trigger_update_user_points
AFTER INSERT ON task_completions
FOR EACH ROW
EXECUTE FUNCTION update_user_points();

-- Seed initial tasks
INSERT INTO tasks (task_type, name, description, base_points, config) VALUES
    ('daily_checkin', 'Daily Check-in', 'Check in once per day to earn points and build your streak', 50, '{"max_streak_bonus": 100, "streak_bonus_per_day": 10}'),
    ('chat_duration_15min', 'Chat 15 Minutes', 'Chat with your AI companion for 15+ minutes', 100, '{"required_minutes": 15}'),
    ('send_10_messages', 'Send 10 Messages', 'Send 10 messages to your AI companion', 75, '{"required_messages": 10}'),
    ('mint_nft', 'Mint NFT', 'Mint your first MuseAI companion NFT', 500, '{"one_time": true}'),
    ('complete_profile', 'Complete Profile', 'Fill out your user profile', 200, '{"one_time": true}'),
    ('invite_friend', 'Invite a Friend', 'Invite a friend to join MetaMuses', 300, '{"repeatable": true}'),
    ('win_weekly_challenge', 'Win Weekly Challenge', 'Win the weekly challenge competition', 1000, '{"one_time_per_week": true}'),
    ('achieve_30_day_streak', 'Achieve 30 Day Streak', 'Maintain a 30-day consecutive check-in streak', 2000, '{"one_time": true, "required_streak": 30}')
ON CONFLICT (task_type) DO NOTHING;
