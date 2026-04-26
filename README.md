# BrainBuzz

BrainBuzz is a full-stack real-time quiz game inspired by Kahoot. It is designed around strong WebSocket usage, with the backend acting as the single source of truth for room state, question flow, timers, answer validation, scoring, and leaderboards.

## Tech stack

- Backend: Node.js, Express, TypeScript, MongoDB, Mongoose, Socket.IO
- Frontend: React, TypeScript, Vite, Tailwind CSS, Socket.IO Client
- Structure: one repository with `backend/` and `frontend/`

## Planned features

- Host creates a room from a saved quiz
- Unique room PIN generation
- Players join with a PIN and display name
- Real-time lobby updates
- Server-controlled question flow, timers, scoring, and leaderboard
- Live answer statistics for the host
- Final podium and results screen
- Reconnect-oriented state sync

## Local setup

1. Copy `.env.example` to `.env`
2. Put your Atlas password only in `.env`
3. Install dependencies with `npm install`
4. Start both apps with `npm run dev`

## Environment variables

- `MONGO_URI`
- `PORT`
- `CLIENT_URL`
- `VITE_API_URL`
- `VITE_SOCKET_URL`

More detailed setup and architecture notes will be added as the project is completed.
