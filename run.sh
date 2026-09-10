#!/bin/bash
# Clean shutdown on Ctrl+C
trap 'kill $(jobs -p) 2>/dev/null; exit' SIGINT SIGTERM EXIT

# Automatically detect current Wi-Fi/LAN IP address
LAN_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "localhost")

echo "================================================================="
echo "  🚀 Starting Skill Sphere (Backend + Frontend on Network)"
echo "  🌐 Share this link with friends on your Wi-Fi:"
echo "     👉 http://${LAN_IP}:3000"
echo ""
echo "  💻 Localhost Link: http://localhost:3000"
echo "  ⚙️  Backend Docs:  http://${LAN_IP}:8000/docs"
echo "  Press Ctrl+C anytime to stop both servers."
echo "================================================================="

# Start FastAPI Backend in background
(cd sih26097-backend && ./venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --reload) &

# Start Next.js Frontend in background
(cd frontend && npm run dev) &

# Wait for both processes
wait
