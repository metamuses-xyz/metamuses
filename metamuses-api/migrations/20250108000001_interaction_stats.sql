-- Migration: Add interaction stats tracking for personality evolution
-- This table tracks interaction patterns per companion per level
-- Used to calculate trait evolution when companion levels up

-- Interaction stats table for trait evolution tracking
CREATE TABLE IF NOT EXISTS interaction_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    companion_id UUID NOT NULL REFERENCES companions(id) ON DELETE CASCADE,
    user_address VARCHAR(42) NOT NULL,
    level_range VARCHAR(20) NOT NULL,  -- e.g., "1-2" (from level 1 to level 2)

    -- Message counts by interaction type
    total_messages INTEGER NOT NULL DEFAULT 0,
    creative_interactions INTEGER NOT NULL DEFAULT 0,
    wisdom_interactions INTEGER NOT NULL DEFAULT 0,
    humor_interactions INTEGER NOT NULL DEFAULT 0,
    empathy_interactions INTEGER NOT NULL DEFAULT 0,
    logic_interactions INTEGER NOT NULL DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_counts CHECK (
        total_messages >= 0 AND
        creative_interactions >= 0 AND
        wisdom_interactions >= 0 AND
        humor_interactions >= 0 AND
        empathy_interactions >= 0 AND
        logic_interactions >= 0
    ),
    CONSTRAINT valid_level_range CHECK (level_range ~ '^\d+-\d+$'),

    -- Unique constraint: one stats row per companion + user + level range
    UNIQUE(companion_id, user_address, level_range)
);

-- Indexes for performance
CREATE INDEX idx_interaction_stats_companion ON interaction_stats(companion_id);
CREATE INDEX idx_interaction_stats_user ON interaction_stats(user_address);
CREATE INDEX idx_interaction_stats_level_range ON interaction_stats(level_range);
CREATE INDEX idx_interaction_stats_companion_user ON interaction_stats(companion_id, user_address);

-- Auto-update updated_at timestamp
CREATE TRIGGER update_interaction_stats_updated_at
    BEFORE UPDATE ON interaction_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE interaction_stats IS 'Tracks interaction patterns per companion per level for personality trait evolution';
COMMENT ON COLUMN interaction_stats.level_range IS 'Level range this stats row covers, e.g., "1-2" means from level 1 to level 2';
COMMENT ON COLUMN interaction_stats.total_messages IS 'Total number of messages in this level range';
COMMENT ON COLUMN interaction_stats.creative_interactions IS 'Count of interactions that triggered creativity trait';
COMMENT ON COLUMN interaction_stats.wisdom_interactions IS 'Count of interactions that triggered wisdom trait';
COMMENT ON COLUMN interaction_stats.humor_interactions IS 'Count of interactions that triggered humor trait';
COMMENT ON COLUMN interaction_stats.empathy_interactions IS 'Count of interactions that triggered empathy trait';
COMMENT ON COLUMN interaction_stats.logic_interactions IS 'Count of interactions that triggered logic trait';
