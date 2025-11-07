-- Initial schema for MetaMuses AI Companion System
-- Phase 1: Foundation - Users, Companions, Messages, Facts, and Preferences

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (wallet owners)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    username VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_users_last_active ON users(last_active DESC);

-- Companions table (one per NFT)
CREATE TABLE IF NOT EXISTS companions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nft_token_id BIGINT UNIQUE NOT NULL,
    owner_address VARCHAR(42) NOT NULL,
    name VARCHAR(100) NOT NULL,

    -- Personality traits (0-100 scale)
    creativity SMALLINT NOT NULL DEFAULT 50 CHECK (creativity BETWEEN 0 AND 100),
    wisdom SMALLINT NOT NULL DEFAULT 50 CHECK (wisdom BETWEEN 0 AND 100),
    humor SMALLINT NOT NULL DEFAULT 50 CHECK (humor BETWEEN 0 AND 100),
    empathy SMALLINT NOT NULL DEFAULT 50 CHECK (empathy BETWEEN 0 AND 100),
    logic SMALLINT NOT NULL DEFAULT 50 CHECK (logic BETWEEN 0 AND 100),

    -- Progression system
    level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
    experience_points BIGINT NOT NULL DEFAULT 0 CHECK (experience_points >= 0),

    -- Metadata
    description TEXT,
    avatar_url TEXT,
    metadata_uri TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (owner_address) REFERENCES users(wallet_address) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX idx_companions_owner ON companions(owner_address);
CREATE INDEX idx_companions_token ON companions(nft_token_id);
CREATE INDEX idx_companions_level ON companions(level DESC);
CREATE INDEX idx_companions_created ON companions(created_at DESC);

-- Conversation messages
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    companion_id UUID NOT NULL,
    user_address VARCHAR(42) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,

    -- Inference metadata
    model_name VARCHAR(100),
    tokens_used INTEGER,
    latency_ms INTEGER,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (companion_id) REFERENCES companions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_address) REFERENCES users(wallet_address) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX idx_messages_companion ON messages(companion_id, created_at DESC);
CREATE INDEX idx_messages_user ON messages(user_address, created_at DESC);
CREATE INDEX idx_messages_created ON messages(created_at DESC);

-- Important facts extracted from conversations
CREATE TABLE IF NOT EXISTS facts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    companion_id UUID NOT NULL,
    user_address VARCHAR(42) NOT NULL,
    category VARCHAR(50),
    fact_text TEXT NOT NULL,
    confidence REAL NOT NULL DEFAULT 1.0 CHECK (confidence BETWEEN 0.0 AND 1.0),
    source_message_id UUID,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (companion_id) REFERENCES companions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_address) REFERENCES users(wallet_address) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (source_message_id) REFERENCES messages(id) ON DELETE SET NULL
);

CREATE INDEX idx_facts_companion ON facts(companion_id);
CREATE INDEX idx_facts_category ON facts(category);
CREATE INDEX idx_facts_user ON facts(user_address);
CREATE INDEX idx_facts_created ON facts(created_at DESC);

-- Companion interactions (for XP/evolution tracking)
CREATE TABLE IF NOT EXISTS interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    companion_id UUID NOT NULL,
    user_address VARCHAR(42) NOT NULL,
    interaction_type VARCHAR(50) NOT NULL,
    xp_gained INTEGER NOT NULL DEFAULT 0,
    metadata JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (companion_id) REFERENCES companions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_address) REFERENCES users(wallet_address) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX idx_interactions_companion ON interactions(companion_id, created_at DESC);
CREATE INDEX idx_interactions_type ON interactions(interaction_type);
CREATE INDEX idx_interactions_created ON interactions(created_at DESC);

-- User preferences per companion
CREATE TABLE IF NOT EXISTS preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    companion_id UUID NOT NULL,
    user_address VARCHAR(42) NOT NULL,
    key VARCHAR(100) NOT NULL,
    value TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (companion_id) REFERENCES companions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_address) REFERENCES users(wallet_address) ON UPDATE CASCADE ON DELETE CASCADE,

    UNIQUE(companion_id, user_address, key)
);

CREATE INDEX idx_preferences_companion_user ON preferences(companion_id, user_address);
CREATE INDEX idx_preferences_key ON preferences(key);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at columns
CREATE TRIGGER update_companions_updated_at BEFORE UPDATE ON companions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_facts_updated_at BEFORE UPDATE ON facts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_preferences_updated_at BEFORE UPDATE ON preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update user's last_active on message insert
CREATE OR REPLACE FUNCTION update_user_last_active()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users SET last_active = NOW() WHERE wallet_address = NEW.user_address;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_last_active_on_message AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION update_user_last_active();
