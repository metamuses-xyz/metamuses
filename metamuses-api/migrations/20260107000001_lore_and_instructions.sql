-- Migration: Add lore fields to companions and create user_instructions table
-- Phase 2: Character Lore & User Instructions System

-- Add lore fields to companions table
ALTER TABLE companions ADD COLUMN IF NOT EXISTS backstory TEXT;
ALTER TABLE companions ADD COLUMN IF NOT EXISTS origin_story TEXT;
ALTER TABLE companions ADD COLUMN IF NOT EXISTS quirks TEXT[];

-- Create indexes for the new fields
CREATE INDEX IF NOT EXISTS idx_companions_has_backstory ON companions((backstory IS NOT NULL));

-- User instructions table for customizing companion behavior
-- Supports both free-text instructions and structured behavior rules
CREATE TABLE IF NOT EXISTS user_instructions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    companion_id UUID NOT NULL,
    user_address VARCHAR(42) NOT NULL,

    -- Free-text custom instructions (like ChatGPT's custom instructions)
    custom_instructions TEXT,

    -- Structured behavior rules
    communication_style VARCHAR(50) CHECK (communication_style IN ('casual', 'formal', 'playful', 'professional')),
    response_length VARCHAR(20) CHECK (response_length IN ('concise', 'balanced', 'detailed', 'comprehensive')),
    topics_to_avoid TEXT[],
    topics_to_focus TEXT[],
    language_preference VARCHAR(10) DEFAULT 'en',

    -- Enable/disable specific behaviors
    use_emojis BOOLEAN DEFAULT true,
    be_proactive BOOLEAN DEFAULT false,
    remember_context BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Each user can have one set of instructions per companion
    UNIQUE(companion_id, user_address),

    FOREIGN KEY (companion_id) REFERENCES companions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_address) REFERENCES users(wallet_address) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Indexes for user_instructions
CREATE INDEX IF NOT EXISTS idx_user_instructions_companion ON user_instructions(companion_id);
CREATE INDEX IF NOT EXISTS idx_user_instructions_user ON user_instructions(user_address);
CREATE INDEX IF NOT EXISTS idx_user_instructions_companion_user ON user_instructions(companion_id, user_address);

-- Trigger for updated_at
CREATE TRIGGER update_user_instructions_updated_at BEFORE UPDATE ON user_instructions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tips tracking table (optional - for analytics)
CREATE TABLE IF NOT EXISTS tips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    companion_id UUID,
    nft_token_id BIGINT NOT NULL,
    tipper_address VARCHAR(42) NOT NULL,
    creator_address VARCHAR(42) NOT NULL,
    amount_wei NUMERIC(78) NOT NULL,
    creator_amount_wei NUMERIC(78) NOT NULL,
    platform_amount_wei NUMERIC(78) NOT NULL,
    tx_hash VARCHAR(66) UNIQUE NOT NULL,
    message TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (companion_id) REFERENCES companions(id) ON DELETE SET NULL,
    FOREIGN KEY (tipper_address) REFERENCES users(wallet_address) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Indexes for tips
CREATE INDEX IF NOT EXISTS idx_tips_companion ON tips(companion_id);
CREATE INDEX IF NOT EXISTS idx_tips_nft_token ON tips(nft_token_id);
CREATE INDEX IF NOT EXISTS idx_tips_tipper ON tips(tipper_address);
CREATE INDEX IF NOT EXISTS idx_tips_creator ON tips(creator_address);
CREATE INDEX IF NOT EXISTS idx_tips_created ON tips(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tips_tx_hash ON tips(tx_hash);
