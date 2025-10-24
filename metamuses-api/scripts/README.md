# Scripts Directory

Utility scripts for MetaMuses API management.

## 📥 Model Download Scripts

### download-models.py (Recommended)

Python script with progress bars and better error handling.

**Quick Start**:
```bash
# Install dependencies
pip install huggingface-hub tqdm

# Download Qwen3-4B Q5 (recommended)
python scripts/download-models.py qwen3-4b-q5

# Download production set
python scripts/download-models.py --preset production

# List all models
python scripts/download-models.py --list
```

**Features**:
- ✅ Progress bars with tqdm
- ✅ Resume interrupted downloads
- ✅ Presets for common configurations
- ✅ Browse repository files
- ✅ Better error handling

### download-models.sh

Bash script alternative (no Python required).

**Quick Start**:
```bash
# Download single model
bash scripts/download-models.sh qwen3-4b-q5

# Download all recommended
bash scripts/download-models.sh --all

# List models
bash scripts/download-models.sh --list
```

**Features**:
- ✅ No Python dependencies
- ✅ Works with wget or curl
- ✅ Supports huggingface-cli

## 🚀 Common Usage Examples

### Download Qwen3-4B (from your request)

```bash
# Python (shows progress)
python scripts/download-models.py qwen3-4b-q5

# Bash
bash scripts/download-models.sh qwen3-4b-q5
```

### Download Multiple Quantizations

```bash
# Download Q5 and Q8 variants
python scripts/download-models.py qwen3-4b-q5 qwen3-4b-q8

# Download all Qwen3-4B variants
python scripts/download-models.py --preset qwen3-all
```

### Download to Custom Directory

```bash
# Python
python scripts/download-models.py --dir /mnt/models qwen3-4b-q5

# Bash
bash scripts/download-models.sh --dir /mnt/models qwen3-4b-q5
```

### Download with Hugging Face Token

For private repositories:

```bash
# Set token as environment variable
export HF_TOKEN=hf_your_token_here

# Or pass directly
python scripts/download-models.py --token hf_... qwen3-4b-q5
```

## 📊 Available Presets (Python only)

| Preset | Models | Size | Description |
|--------|--------|------|-------------|
| `minimal` | 1 | ~3 GB | Just Qwen3-4B Q5 |
| `recommended` | 3 | ~10 GB | Fast + Medium tiers |
| `production` | 4 | ~21 GB | Full production set |
| `qwen3-all` | 5 | ~21 GB | All Qwen3-4B quantizations |
| `qwen3-best` | 2 | ~8 GB | Q6 + Q8 (highest quality) |

```bash
# Download preset
python scripts/download-models.py --preset recommended
```

## 🔍 Browse Repository Files

```bash
# List all GGUF files in a repository
python scripts/download-models.py --browse unsloth/Qwen3-4B-Instruct-2507-GGUF
```

## 📖 Full Documentation

See [docs/MODEL_MANAGEMENT.md](../docs/MODEL_MANAGEMENT.md) for:
- Complete model list
- Quantization comparison
- Storage requirements
- Performance tuning
- Troubleshooting

## 🆘 Troubleshooting

### Python script not found

```bash
# Install dependencies
pip install huggingface-hub tqdm

# Or use conda
conda install -c conda-forge huggingface_hub tqdm
```

### Bash script: command not found

```bash
# Make executable
chmod +x scripts/download-models.sh

# Run with bash explicitly
bash scripts/download-models.sh qwen3-4b-q5
```

### Download interrupted

```bash
# Python script automatically resumes
python scripts/download-models.py qwen3-4b-q5

# Bash with wget also resumes
bash scripts/download-models.sh qwen3-4b-q5
```

### Permission denied

```bash
# Create models directory
mkdir -p models

# Or use sudo for system-wide installation
sudo python scripts/download-models.py --dir /opt/models qwen3-4b-q5
```

---

**For deployment scripts, see: [../deployment/scripts/](../deployment/scripts/)**
