#!/usr/bin/env python3
"""
MetaMuses API - Model Download Script (Python)
Downloads GGUF models from Hugging Face with better progress tracking
"""

import os
import sys
import argparse
from pathlib import Path
from typing import Dict, List, Tuple
import hashlib

try:
    from huggingface_hub import hf_hub_download, list_repo_files
    from tqdm import tqdm
    HF_HUB_AVAILABLE = True
except ImportError:
    HF_HUB_AVAILABLE = False
    print("⚠️  Warning: huggingface_hub not installed")
    print("Install with: pip install huggingface-hub tqdm")

# ============================================================================
# Model Definitions
# ============================================================================

MODELS = {
    # Fast Tier Models (~1.5B parameters)
    "qwen2.5-1.5b-q5": {
        "repo_id": "Qwen/Qwen2.5-1.5B-Instruct-GGUF",
        "filename": "qwen2.5-1.5b-instruct-q5_k_m.gguf",
        "description": "Qwen2.5 1.5B Q5_K_M - Fast tier",
        "tier": "fast",
        "size_gb": 1.2,
    },
    "phi3-mini-q5": {
        "repo_id": "microsoft/Phi-3-mini-4k-instruct-gguf",
        "filename": "Phi-3-mini-4k-instruct-q5_k_m.gguf",
        "description": "Phi-3 Mini Q5_K_M - Fast tier",
        "tier": "fast",
        "size_gb": 2.3,
    },

    # Medium Tier Models (~7-8B parameters)
    "qwen2.5-7b-q5": {
        "repo_id": "Qwen/Qwen2.5-7B-Instruct-GGUF",
        "filename": "qwen2.5-7b-instruct-q5_k_m.gguf",
        "description": "Qwen2.5 7B Q5_K_M - Medium tier",
        "tier": "medium",
        "size_gb": 5.8,
    },
    "llama3.1-8b-q5": {
        "repo_id": "lmstudio-community/Meta-Llama-3.1-8B-Instruct-GGUF",
        "filename": "Meta-Llama-3.1-8B-Instruct-Q5_K_M.gguf",
        "description": "LLaMA 3.1 8B Q5_K_M - Medium tier",
        "tier": "medium",
        "size_gb": 6.1,
    },

    # Qwen3-4B Models (Multiple quantizations)
    "qwen3-4b-q4": {
        "repo_id": "unsloth/Qwen3-4B-Instruct-2507-GGUF",
        "filename": "Qwen3-4B-Instruct-2507-Q4_K_M.gguf",
        "description": "Qwen3 4B Q4_K_M - Balanced (fastest)",
        "tier": "medium",
        "size_gb": 2.5,
    },
    "qwen3-4b-q5": {
        "repo_id": "unsloth/Qwen3-4B-Instruct-2507-GGUF",
        "filename": "Qwen3-4B-Instruct-2507-Q5_K_M.gguf",
        "description": "Qwen3 4B Q5_K_M - Good quality",
        "tier": "medium",
        "size_gb": 3.0,
    },
    "qwen3-4b-q6": {
        "repo_id": "unsloth/Qwen3-4B-Instruct-2507-GGUF",
        "filename": "Qwen3-4B-Instruct-2507-Q6_K.gguf",
        "description": "Qwen3 4B Q6_K - Better quality",
        "tier": "medium",
        "size_gb": 3.5,
    },
    "qwen3-4b-q8": {
        "repo_id": "unsloth/Qwen3-4B-Instruct-2507-GGUF",
        "filename": "Qwen3-4B-Instruct-2507-Q8_0.gguf",
        "description": "Qwen3 4B Q8_0 - High quality",
        "tier": "medium",
        "size_gb": 4.3,
    },
    "qwen3-4b-f16": {
        "repo_id": "unsloth/Qwen3-4B-Instruct-2507-GGUF",
        "filename": "Qwen3-4B-Instruct-2507-F16.gguf",
        "description": "Qwen3 4B F16 - Full precision",
        "tier": "medium",
        "size_gb": 8.0,
    },

    # Heavy Tier Models (~72B parameters)
    "qwen2.5-72b-q4": {
        "repo_id": "Qwen/Qwen2.5-72B-Instruct-GGUF",
        "filename": "qwen2.5-72b-instruct-q4_k_m.gguf",
        "description": "Qwen2.5 72B Q4_K_M - Heavy tier",
        "tier": "heavy",
        "size_gb": 42.0,
    },

    # Specialized Models
    "deepseek-coder-v2": {
        "repo_id": "deepseek-ai/DeepSeek-Coder-V2-Lite-Instruct",
        "filename": "deepseek-coder-v2-lite-instruct-q5_k_m.gguf",
        "description": "DeepSeek Coder V2 - Code tasks",
        "tier": "specialized",
        "size_gb": 10.5,
    },
}

# Recommended presets
PRESETS = {
    "minimal": ["qwen3-4b-q5"],
    "recommended": ["qwen2.5-1.5b-q5", "qwen3-4b-q5", "qwen2.5-7b-q5"],
    "production": ["qwen2.5-1.5b-q5", "qwen3-4b-q5", "qwen2.5-7b-q5", "deepseek-coder-v2"],
    "qwen3-all": ["qwen3-4b-q4", "qwen3-4b-q5", "qwen3-4b-q6", "qwen3-4b-q8"],
    "qwen3-best": ["qwen3-4b-q6", "qwen3-4b-q8"],
}

# ============================================================================
# Helper Functions
# ============================================================================

def print_header():
    """Print script header"""
    print("\n" + "="*60)
    print("  MetaMuses Model Download Script")
    print("="*60 + "\n")

def print_models_table():
    """Print available models in a formatted table"""
    print("\n📦 Available Models:\n")

    tiers = ["fast", "medium", "heavy", "specialized"]
    tier_names = {
        "fast": "🚀 Fast Tier (< 500ms)",
        "medium": "⚡ Medium Tier (< 2s)",
        "heavy": "🔥 Heavy Tier (< 5s)",
        "specialized": "🎯 Specialized Models"
    }

    for tier in tiers:
        tier_models = {k: v for k, v in MODELS.items() if v.get("tier") == tier}
        if not tier_models:
            continue

        print(f"\n{tier_names.get(tier, tier.upper())}:")
        print("-" * 60)

        for key, info in tier_models.items():
            size_str = f"{info['size_gb']:.1f} GB"
            print(f"  {key:20s} {size_str:>10s}  {info['description']}")

def print_presets():
    """Print available presets"""
    print("\n🎯 Available Presets:\n")
    for preset_name, models in PRESETS.items():
        total_size = sum(MODELS[m]["size_gb"] for m in models)
        print(f"  {preset_name:15s} {len(models)} models ({total_size:.1f} GB)")
        for model in models:
            print(f"    - {model}")
    print()

def list_repo_files_safe(repo_id: str, token: str = None) -> List[str]:
    """Safely list files in a Hugging Face repository"""
    try:
        files = list_repo_files(repo_id, token=token)
        return [f for f in files if f.endswith('.gguf')]
    except Exception as e:
        print(f"⚠️  Warning: Could not list files in {repo_id}: {e}")
        return []

def download_model(
    model_key: str,
    models_dir: Path,
    token: str = None,
    force: bool = False
) -> bool:
    """Download a single model"""

    if model_key not in MODELS:
        print(f"❌ Unknown model: {model_key}")
        print(f"   Run with --list to see available models")
        return False

    info = MODELS[model_key]
    repo_id = info["repo_id"]
    filename = info["filename"]
    description = info["description"]
    size_gb = info["size_gb"]

    print(f"\n{'='*60}")
    print(f"📥 Downloading: {description}")
    print(f"   Repository: {repo_id}")
    print(f"   File: {filename}")
    print(f"   Size: ~{size_gb:.1f} GB")
    print(f"{'='*60}\n")

    output_path = models_dir / filename

    # Check if already exists
    if output_path.exists() and not force:
        print(f"✓ Model already exists: {filename}")
        response = input("  Overwrite? (y/N): ").strip().lower()
        if response != 'y':
            print("  Skipping...")
            return True
        output_path.unlink()

    # Download using huggingface_hub
    try:
        downloaded_path = hf_hub_download(
            repo_id=repo_id,
            filename=filename,
            local_dir=str(models_dir),
            local_dir_use_symlinks=False,
            token=token,
            resume_download=True,
        )

        # Verify file size
        actual_size = Path(downloaded_path).stat().st_size / (1024**3)  # GB
        print(f"\n✓ Successfully downloaded: {filename} ({actual_size:.2f} GB)")
        return True

    except Exception as e:
        print(f"\n❌ Failed to download {filename}: {e}")
        return False

def download_preset(
    preset_name: str,
    models_dir: Path,
    token: str = None,
    force: bool = False
) -> Tuple[int, int]:
    """Download a preset collection of models"""

    if preset_name not in PRESETS:
        print(f"❌ Unknown preset: {preset_name}")
        print(f"   Available presets: {', '.join(PRESETS.keys())}")
        return 0, 0

    models = PRESETS[preset_name]
    total_size = sum(MODELS[m]["size_gb"] for m in models)

    print(f"\n🎯 Downloading preset: {preset_name}")
    print(f"   Models: {len(models)}")
    print(f"   Total size: ~{total_size:.1f} GB")

    success_count = 0
    fail_count = 0

    for i, model_key in enumerate(models, 1):
        print(f"\n[{i}/{len(models)}] ", end="")
        if download_model(model_key, models_dir, token, force):
            success_count += 1
        else:
            fail_count += 1

    return success_count, fail_count

def show_summary(models_dir: Path):
    """Show download summary"""
    print(f"\n{'='*60}")
    print("📊 Download Summary")
    print(f"{'='*60}\n")

    print(f"Models directory: {models_dir}")
    print("\nDownloaded models:")

    total_size = 0
    for file in sorted(models_dir.glob("*.gguf")):
        size_bytes = file.stat().st_size
        size_gb = size_bytes / (1024**3)
        total_size += size_gb
        print(f"  {file.name:50s} {size_gb:>6.2f} GB")

    print(f"\n  Total: {total_size:.2f} GB")

    print("\n📝 Next steps:")
    print(f"  1. Update .env: MODELS_DIR={models_dir}")
    print("  2. Configure model tiers in src/inference/models.rs")
    print("  3. Start API: cargo run --bin metamuse-server")
    print()

# ============================================================================
# Main Script
# ============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="Download GGUF models from Hugging Face",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )

    parser.add_argument(
        "models",
        nargs="*",
        help="Model keys to download (see --list)",
    )
    parser.add_argument(
        "-l", "--list",
        action="store_true",
        help="List all available models",
    )
    parser.add_argument(
        "--presets",
        action="store_true",
        help="List available presets",
    )
    parser.add_argument(
        "-p", "--preset",
        metavar="NAME",
        help="Download a preset collection (minimal/recommended/production/qwen3-all)",
    )
    parser.add_argument(
        "-d", "--dir",
        default="./models",
        help="Models directory (default: ./models)",
    )
    parser.add_argument(
        "-t", "--token",
        help="Hugging Face token (for private repos)",
    )
    parser.add_argument(
        "-f", "--force",
        action="store_true",
        help="Force re-download even if file exists",
    )
    parser.add_argument(
        "--browse",
        metavar="REPO_ID",
        help="Browse GGUF files in a Hugging Face repository",
    )

    args = parser.parse_args()

    # Print header
    print_header()

    # Check if huggingface_hub is available
    if not HF_HUB_AVAILABLE:
        print("❌ Error: huggingface_hub is not installed")
        print("\nInstall with:")
        print("  pip install huggingface-hub tqdm")
        print("\nOr use the bash script: scripts/download-models.sh")
        sys.exit(1)

    # Handle list option
    if args.list:
        print_models_table()
        return

    # Handle presets option
    if args.presets:
        print_presets()
        return

    # Handle browse option
    if args.browse:
        print(f"📂 Browsing GGUF files in: {args.browse}\n")
        files = list_repo_files_safe(args.browse, args.token)
        if files:
            for i, file in enumerate(files, 1):
                print(f"  {i}. {file}")
        else:
            print("  No GGUF files found")
        return

    # Get token from environment if not provided
    token = args.token or os.environ.get("HF_TOKEN")

    # Create models directory
    models_dir = Path(args.dir).resolve()
    models_dir.mkdir(parents=True, exist_ok=True)

    # Download models
    success_count = 0
    fail_count = 0

    if args.preset:
        # Download preset
        success_count, fail_count = download_preset(
            args.preset, models_dir, token, args.force
        )
    elif args.models:
        # Download specific models
        for model_key in args.models:
            if download_model(model_key, models_dir, token, args.force):
                success_count += 1
            else:
                fail_count += 1
    else:
        print("❌ No models specified")
        print("\nUsage:")
        print("  python scripts/download-models.py --list")
        print("  python scripts/download-models.py qwen3-4b-q5")
        print("  python scripts/download-models.py --preset recommended")
        sys.exit(1)

    # Show summary
    show_summary(models_dir)

    # Print result
    print(f"{'='*60}")
    if fail_count == 0:
        print(f"✓ Successfully downloaded {success_count} model(s)")
    else:
        print(f"⚠️  Downloaded {success_count} model(s), {fail_count} failed")
    print(f"{'='*60}\n")

    sys.exit(0 if fail_count == 0 else 1)

if __name__ == "__main__":
    main()
