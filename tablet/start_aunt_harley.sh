#!/data/data/com.termux/files/usr/bin/bash
# Aunt Harley brain + server — one tap to wake her up.
# Run this in Termux on the tablet from wherever the aunt-harley folder lives.

cd "$(dirname "$0")"

MODEL="$HOME/storage/downloads/models/Qwen2.5-VL-3B-Instruct-Q4_K_M.gguf"
BRAIN_DIR="$HOME/llama"
HTTP_PORT=8080
PORT=1234

# 1. Start the brain (llama-server) if not already running
if ! curl -s "http://127.0.0.1:$PORT/health" > /dev/null; then
  echo "Waking Aunt Harley's brain..."
  nohup "$BRAIN_DIR/llama-server" \
    -m "$MODEL" \
    --host 127.0.0.1 \
    --port $PORT \
    -c 4096 \
    -t 4 \
    --cors "*" \
    > "$HOME/aunt-harley-brain.log" 2>&1 &
  sleep 3
fi

# 2. Serve Aunt Harley's chat page
if ! curl -s "http://127.0.0.1:$HTTP_PORT/tablet/" > /dev/null; then
  echo "Starting the chat page..."
  nohup python3 -m http.server $HTTP_PORT --bind 127.0.0.1 \
    --directory "$(pwd)" > "$HOME/aunt-harley-web.log" 2>&1 &
  sleep 2
fi

echo ""
echo "Aunt Harley is up!"
echo "Open her chat at:  http://127.0.0.1:$HTTP_PORT/tablet/"
echo "Tap Chrome menu, then 'Add to Home screen' to make her an app."
echo ""
echo "Logs:"
echo "  brain:  $HOME/aunt-harley-brain.log"
echo "  web:    $HOME/aunt-harley-web.log"