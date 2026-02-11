#!/bin/bash
# Start a local HTTP server for the NES emulator page
# Usage: ./serve.sh [port]
PORT="${1:-8080}"
echo "Starting server at http://localhost:$PORT"
echo "Open in browser to play."
echo "Press Ctrl+C to stop."
python3 -m http.server "$PORT" --directory "$(dirname "$0")"
