#!/bin/bash
set -e

CONFIG_FILE="/etc/one/fabricmanager.conf"

# --- 1. Load Configuration ---
if [ ! -f "$CONFIG_FILE" ]; then
  echo "Error: Configuration file $CONFIG_FILE not found." >&2
  exit 1
fi
source "$CONFIG_FILE" || { echo "Error sourcing config file $CONFIG_FILE"; exit 1; }

# Substitute version in URL
FINAL_URL="${IMAGE_URL}"

# --- 2. Check if Image Exists ---
if [ -f "$IMAGE_PATH" ]; then
  echo "Image already exists at $IMAGE_PATH. Skipping download."
  exit 0
fi

echo "Image not found at $IMAGE_PATH."
echo "Attempting download from $FINAL_URL..."

# --- 3. Download ---
TMP_DIR=$(mktemp -d)
TMP_FILE="$TMP_DIR/downloaded_image.qcow2"

# Ensure destination directory exists
mkdir -p "$(dirname "$IMAGE_PATH")"

echo "Downloading to temporary file $TMP_FILE..."
if ! curl --fail --location --progress-bar --output "$TMP_FILE" "$FINAL_URL"; then
  echo "Error: Image download failed." >&2
  rm -rf "$TMP_DIR"
  exit 1
fi
echo "Download complete."

# --- 4. Verify Checksum ---
echo "Verifying checksum..."
DOWNLOAD_SHA=$(sha256sum "$TMP_FILE" | awk '{print $1}')

if [ "$DOWNLOAD_SHA" != "$IMAGE_SHA256" ]; then
  echo "Error: Checksum mismatch!" >&2
  echo "  Expected: $IMAGE_SHA256" >&2
  echo "  Obtained: $DOWNLOAD_SHA" >&2
  rm -rf "$TMP_DIR"
  exit 1
fi
echo "Checksum verified."

# --- 5. Install Image ---
echo "Moving image to final location $IMAGE_PATH..."
mv "$TMP_FILE" "$IMAGE_PATH"

echo "Setting permissions..."
chown "$IMAGE_OWNER" "$IMAGE_PATH"

rm -rf "$TMP_DIR"

echo "Image successfully installed at $IMAGE_PATH."
exit 0
