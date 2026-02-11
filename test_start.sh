#!/bin/bash
cd /Users/sandro/Desktop/projects/regime-maker
rm -f db/db.db

# Start API
cd API
python3 web.py &
API_PID=$!
cd ..

# Wait for API
sleep 2

# Start Vite
cd WEB
npx vite --port 8000 --host 127.0.0.1 &
VITE_PID=$!
cd ..

# Wait for Vite
sleep 3

echo "API PID: $API_PID"
echo "VITE PID: $VITE_PID"
echo "Both running. Press Ctrl+C to stop."

# Keep alive
wait
