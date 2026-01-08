#!/bin/bash

# MetaMuses MuseAI Deployment Script
# Deploys to Metis Hyperion Testnet

set -e

echo "🚀 MetaMuses MuseAI Deployment to Hyperion Testnet"
echo "=================================================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "Please copy .env.example to .env and configure it"
    exit 1
fi

# Load environment variables
source .env

# Verify required variables
if [ -z "$PRIVATE_KEY" ] || [ "$PRIVATE_KEY" = "your_private_key_here" ]; then
    echo "❌ Error: PRIVATE_KEY not configured in .env"
    exit 1
fi

if [ -z "$BASE_URI" ]; then
    echo "❌ Error: BASE_URI not configured in .env"
    exit 1
fi

if [ -z "$MINT_START_TIME" ]; then
    echo "❌ Error: MINT_START_TIME not configured in .env"
    exit 1
fi

if [ -z "$MINT_END_TIME" ]; then
    echo "❌ Error: MINT_END_TIME not configured in .env"
    exit 1
fi

echo "📋 Deployment Configuration:"
echo "   Network: Metis Hyperion Testnet"
echo "   Chain ID: 133717"
echo "   RPC URL: $RPC_URL"
echo "   Base URI: $BASE_URI"
echo "   Mint Start: $MINT_START_TIME ($(date -r $MINT_START_TIME 2>/dev/null || date -d @$MINT_START_TIME 2>/dev/null || echo 'timestamp'))"
echo "   Mint End: $MINT_END_TIME ($(date -r $MINT_END_TIME 2>/dev/null || date -d @$MINT_END_TIME 2>/dev/null || echo 'timestamp'))"
echo ""

read -p "Continue with deployment? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled"
    exit 1
fi

echo ""
echo "🔨 Building contract..."
forge build

echo ""
echo "🚀 Deploying MuseAI contract..."
forge script script/DeployMuseAI.s.sol:DeployMuseAI \
  --rpc-url $RPC_URL \
  --broadcast \
  -vvvv

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Copy the deployed contract address from the output above"
echo "   2. Update metamuses-web/.env.local with:"
echo "      NEXT_PUBLIC_MUSEAI_CONTRACT_ADDRESS=<your_contract_address>"
echo "   3. Verify the contract on the block explorer (optional)"
echo "   4. Test minting through the frontend"
echo ""
echo "🔍 View on Explorer:"
echo "   https://explorer.hyperion-testnet.metis.io"
