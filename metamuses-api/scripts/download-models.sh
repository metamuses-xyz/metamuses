#!/bin/bash
# ============================================================================
# MetaMuses API - Model Download Script
# Downloads GGUF models from Hugging Face
# ============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MODELS_DIR="${MODELS_DIR:-./models}"
HF_TOKEN="${HF_TOKEN:-}"  # Optional: Set HF_TOKEN for private repos

# Logging functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# ============================================================================
# Model Repository Definitions
# ============================================================================

# Format: "repo_id|file_name|description"
declare -A MODELS=(
    # Fast Tier Models (~1.5B parameters)
    ["qwen2.5-1.5b-q5"]="Qwen/Qwen2.5-1.5B-Instruct-GGUF|qwen2.5-1.5b-instruct-q5_k_m.gguf|Qwen2.5 1.5B Q5_K_M - Fast tier"
    ["phi3-mini-q5"]="microsoft/Phi-3-mini-4k-instruct-gguf|Phi-3-mini-4k-instruct-q5_k_m.gguf|Phi-3 Mini Q5_K_M - Fast tier"

    # Medium Tier Models (~7-8B parameters)
    ["qwen2.5-7b-q5"]="Qwen/Qwen2.5-7B-Instruct-GGUF|qwen2.5-7b-instruct-q5_k_m.gguf|Qwen2.5 7B Q5_K_M - Medium tier"
    ["llama3.1-8b-q5"]="lmstudio-community/Meta-Llama-3.1-8B-Instruct-GGUF|Meta-Llama-3.1-8B-Instruct-Q5_K_M.gguf|LLaMA 3.1 8B Q5_K_M - Medium tier"

    # Heavy Tier Models (~72B parameters)
    ["qwen2.5-72b-awq"]="Qwen/Qwen2.5-72B-Instruct-AWQ|qwen2.5-72b-instruct-awq.gguf|Qwen2.5 72B AWQ - Heavy tier"

    # Specialized Models
    ["deepseek-coder-v2"]="deepseek-ai/DeepSeek-Coder-V2-Lite-Instruct-GGUF|deepseek-coder-v2-lite-instruct-q5_k_m.gguf|DeepSeek Coder V2 - Code tasks"

    # Custom: Qwen3-4B (requested)
    ["qwen3-4b-q5"]="unsloth/Qwen3-4B-Instruct-2507-GGUF|Qwen3-4B-Instruct-2507-Q5_K_M.gguf|Qwen3 4B Q5_K_M - Medium tier"
    ["qwen3-4b-q8"]="unsloth/Qwen3-4B-Instruct-2507-GGUF|Qwen3-4B-Instruct-2507-Q8_0.gguf|Qwen3 4B Q8_0 - Higher quality"
    ["qwen3-4b-f16"]="unsloth/Qwen3-4B-Instruct-2507-GGUF|Qwen3-4B-Instruct-2507-F16.gguf|Qwen3 4B F16 - Full precision"
)

# ============================================================================
# Functions
# ============================================================================

show_usage() {
    cat << EOF
Usage: $0 [OPTIONS] [MODEL_KEY]

Download GGUF models from Hugging Face for MetaMuses API.

OPTIONS:
    -l, --list              List all available models
    -a, --all              Download all recommended models
    -d, --dir DIR          Set models directory (default: ./models)
    -t, --token TOKEN      Set Hugging Face token (for private repos)
    -h, --help             Show this help message

MODEL_KEY:
    Key of the model to download (see --list for available models)

EXAMPLES:
    # List all available models
    $0 --list

    # Download a specific model
    $0 qwen3-4b-q5

    # Download all models from Qwen3-4B repository
    $0 qwen3-4b-q5 qwen3-4b-q8

    # Download to custom directory
    $0 --dir /mnt/models qwen3-4b-q5

    # Download with Hugging Face token
    $0 --token hf_... qwen3-4b-q5

ENVIRONMENT VARIABLES:
    MODELS_DIR             Models directory (default: ./models)
    HF_TOKEN              Hugging Face token

EOF
}

list_models() {
    log "Available models:"
    echo ""

    echo -e "${BLUE}Fast Tier Models (< 500ms):${NC}"
    for key in "${!MODELS[@]}"; do
        IFS='|' read -r repo file desc <<< "${MODELS[$key]}"
        if [[ "$desc" == *"Fast tier"* ]]; then
            printf "  %-20s %s\n" "$key" "$desc"
        fi
    done

    echo ""
    echo -e "${BLUE}Medium Tier Models (< 2s):${NC}"
    for key in "${!MODELS[@]}"; do
        IFS='|' read -r repo file desc <<< "${MODELS[$key]}"
        if [[ "$desc" == *"Medium tier"* ]]; then
            printf "  %-20s %s\n" "$key" "$desc"
        fi
    done

    echo ""
    echo -e "${BLUE}Heavy Tier Models (< 5s):${NC}"
    for key in "${!MODELS[@]}"; do
        IFS='|' read -r repo file desc <<< "${MODELS[$key]}"
        if [[ "$desc" == *"Heavy tier"* ]]; then
            printf "  %-20s %s\n" "$key" "$desc"
        fi
    done

    echo ""
    echo -e "${BLUE}Specialized Models:${NC}"
    for key in "${!MODELS[@]}"; do
        IFS='|' read -r repo file desc <<< "${MODELS[$key]}"
        if [[ "$desc" == *"Code tasks"* ]] || [[ "$desc" == *"Higher quality"* ]] || [[ "$desc" == *"Full precision"* ]]; then
            printf "  %-20s %s\n" "$key" "$desc"
        fi
    done

    echo ""
}

check_prerequisites() {
    log "Checking prerequisites..."

    # Check if wget or curl is available
    if ! command -v wget &> /dev/null && ! command -v curl &> /dev/null; then
        error "Neither wget nor curl is installed. Please install one of them."
        exit 1
    fi

    # Check if huggingface-cli is available (optional but recommended)
    if command -v huggingface-cli &> /dev/null; then
        info "✓ huggingface-cli found (recommended for better download experience)"
    else
        warn "huggingface-cli not found. Using wget/curl (slower, no resume support)"
        warn "To install: pip install -U huggingface_hub[cli]"
    fi

    log "✓ Prerequisites check passed"
}

create_models_dir() {
    if [ ! -d "$MODELS_DIR" ]; then
        log "Creating models directory: $MODELS_DIR"
        mkdir -p "$MODELS_DIR"
    fi

    # Create tier subdirectories (optional organization)
    mkdir -p "$MODELS_DIR"/{fast,medium,heavy,specialized}
}

get_file_size() {
    local url="$1"
    local size

    if command -v curl &> /dev/null; then
        size=$(curl -sI "$url" | grep -i content-length | awk '{print $2}' | tr -d '\r')
    else
        size=$(wget --spider -S "$url" 2>&1 | grep -i content-length | awk '{print $2}' | tr -d '\r')
    fi

    if [ -n "$size" ]; then
        echo "$size" | awk '{printf "%.2f GB", $1/1024/1024/1024}'
    else
        echo "Unknown"
    fi
}

download_with_hf_cli() {
    local repo_id="$1"
    local filename="$2"
    local output_path="$3"

    log "Downloading using huggingface-cli..."

    local hf_args=""
    if [ -n "$HF_TOKEN" ]; then
        hf_args="--token $HF_TOKEN"
    fi

    huggingface-cli download \
        "$repo_id" \
        "$filename" \
        --local-dir "$MODELS_DIR" \
        --local-dir-use-symlinks False \
        $hf_args

    # Move to correct location
    if [ -f "$MODELS_DIR/$filename" ]; then
        mv "$MODELS_DIR/$filename" "$output_path"
    fi
}

download_with_wget() {
    local url="$1"
    local output_path="$2"

    log "Downloading using wget..."

    local wget_args="-c --progress=bar:force"
    if [ -n "$HF_TOKEN" ]; then
        wget_args="$wget_args --header='Authorization: Bearer $HF_TOKEN'"
    fi

    wget $wget_args -O "$output_path" "$url"
}

download_with_curl() {
    local url="$1"
    local output_path="$2"

    log "Downloading using curl..."

    local curl_args="-L -C - --progress-bar"
    if [ -n "$HF_TOKEN" ]; then
        curl_args="$curl_args -H 'Authorization: Bearer $HF_TOKEN'"
    fi

    curl $curl_args -o "$output_path" "$url"
}

download_model() {
    local model_key="$1"

    if [ -z "${MODELS[$model_key]}" ]; then
        error "Unknown model key: $model_key"
        error "Run '$0 --list' to see available models"
        return 1
    fi

    IFS='|' read -r repo_id filename description <<< "${MODELS[$model_key]}"

    log ""
    log "=========================================="
    log "Downloading: $description"
    log "Repository: $repo_id"
    log "File: $filename"
    log "=========================================="

    local output_path="$MODELS_DIR/$filename"

    # Check if file already exists
    if [ -f "$output_path" ]; then
        warn "File already exists: $output_path"
        read -p "Overwrite? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "Skipping $model_key"
            return 0
        fi
        rm -f "$output_path"
    fi

    # Construct Hugging Face URL
    local hf_url="https://huggingface.co/$repo_id/resolve/main/$filename"

    # Show file size
    info "Checking file size..."
    local file_size=$(get_file_size "$hf_url")
    info "File size: $file_size"

    # Download using best available method
    if command -v huggingface-cli &> /dev/null; then
        download_with_hf_cli "$repo_id" "$filename" "$output_path"
    elif command -v wget &> /dev/null; then
        download_with_wget "$hf_url" "$output_path"
    else
        download_with_curl "$hf_url" "$output_path"
    fi

    # Verify download
    if [ -f "$output_path" ]; then
        local downloaded_size=$(du -h "$output_path" | cut -f1)
        log "✓ Successfully downloaded: $filename ($downloaded_size)"
    else
        error "Failed to download: $filename"
        return 1
    fi
}

download_all_models() {
    log "Downloading all recommended models..."

    # Recommended models for production
    local recommended_models=(
        "qwen2.5-1.5b-q5"    # Fast tier
        "qwen2.5-7b-q5"      # Medium tier
        "qwen3-4b-q5"        # Medium tier (Qwen3 4B)
        "deepseek-coder-v2"  # Specialized
    )

    local failed=0

    for model_key in "${recommended_models[@]}"; do
        if ! download_model "$model_key"; then
            ((failed++))
        fi
    done

    if [ $failed -eq 0 ]; then
        log "✓ All models downloaded successfully"
    else
        error "$failed model(s) failed to download"
        return 1
    fi
}

show_summary() {
    log ""
    log "=========================================="
    log "Download Summary"
    log "=========================================="
    log "Models directory: $MODELS_DIR"
    log ""
    log "Downloaded models:"

    if [ -d "$MODELS_DIR" ]; then
        for file in "$MODELS_DIR"/*.gguf; do
            if [ -f "$file" ]; then
                local size=$(du -h "$file" | cut -f1)
                local name=$(basename "$file")
                printf "  %-50s %s\n" "$name" "$size"
            fi
        done
    fi

    log ""
    log "Total disk usage: $(du -sh "$MODELS_DIR" 2>/dev/null | cut -f1)"
    log ""
    log "Next steps:"
    log "1. Update MODELS_DIR in .env: MODELS_DIR=$MODELS_DIR"
    log "2. Configure model tiers in src/inference/models.rs"
    log "3. Start the API: cargo run --bin metamuse-server"
    log ""
}

# ============================================================================
# Main Script
# ============================================================================

main() {
    local download_all=false
    local models_to_download=()

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -l|--list)
                list_models
                exit 0
                ;;
            -a|--all)
                download_all=true
                shift
                ;;
            -d|--dir)
                MODELS_DIR="$2"
                shift 2
                ;;
            -t|--token)
                HF_TOKEN="$2"
                shift 2
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            -*)
                error "Unknown option: $1"
                show_usage
                exit 1
                ;;
            *)
                models_to_download+=("$1")
                shift
                ;;
        esac
    done

    log ""
    log "=========================================="
    log "MetaMuses Model Download Script"
    log "=========================================="
    log ""

    # Check prerequisites
    check_prerequisites

    # Create models directory
    create_models_dir

    # Download models
    if [ "$download_all" = true ]; then
        download_all_models
    elif [ ${#models_to_download[@]} -eq 0 ]; then
        error "No models specified"
        echo ""
        show_usage
        exit 1
    else
        local failed=0
        for model_key in "${models_to_download[@]}"; do
            if ! download_model "$model_key"; then
                ((failed++))
            fi
        done

        if [ $failed -gt 0 ]; then
            error "$failed model(s) failed to download"
            exit 1
        fi
    fi

    # Show summary
    show_summary

    log "✓ Download completed successfully!"
}

# Run main function
main "$@"
