-- Add muse_id and is_public fields to companions table
-- This migration allows multiple companions per NFT and adds privacy control

-- Step 1: Add muse_id column (nullable initially)
ALTER TABLE companions
ADD COLUMN muse_id BIGINT;

-- Step 2: Populate muse_id with nft_token_id for existing records
-- This ensures existing companions have a valid muse_id
UPDATE companions
SET muse_id = nft_token_id
WHERE muse_id IS NULL;

-- Step 3: Make muse_id NOT NULL and UNIQUE
ALTER TABLE companions
ALTER COLUMN muse_id SET NOT NULL,
ADD CONSTRAINT companions_muse_id_unique UNIQUE (muse_id);

-- Step 4: Remove UNIQUE constraint from nft_token_id
-- This allows multiple companions per NFT
ALTER TABLE companions
DROP CONSTRAINT companions_nft_token_id_key;

-- Step 5: Add is_public column (default to false for privacy)
-- false = private (only owner can see/use)
-- true = public (other users can see/use)
ALTER TABLE companions
ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT false;

-- Step 6: Create indexes for efficient querying
CREATE INDEX idx_companions_muse_id ON companions(muse_id);
CREATE INDEX idx_companions_is_public ON companions(is_public);
CREATE INDEX idx_companions_nft_public ON companions(nft_token_id, is_public);

-- Comments for documentation
COMMENT ON COLUMN companions.muse_id IS 'Unique identifier for each companion instance. Multiple companions can share the same nft_token_id.';
COMMENT ON COLUMN companions.is_public IS 'Privacy control: false = owner only, true = public (visible to all users)';
