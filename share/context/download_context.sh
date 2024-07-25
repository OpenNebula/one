#!/bin/bash
# Always download latest context from one-apps
CONTEXT_API="https://api.github.com/repos/OpenNebula/one-apps/releases/latest"
curl -s $CONTEXT_API | jq -r '.assets[].browser_download_url' | xargs wget -P .
