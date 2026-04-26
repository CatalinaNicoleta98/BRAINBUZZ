# BrainBuzz

BrainBuzz is a Kahoot-inspired real-time quiz platform built for a Web Technologies exam project. Its core technical idea is strong WebSocket usage: the server owns the live room state, pushes question events, validates answers, computes score, and broadcasts leaderboard updates to every participant in real time.

## Stack

- Backend: Node.js, Express, TypeScript, MongoDB Atlas, Mongoose, Socket.IO
- Frontend: React, TypeScript, Vite, Tailwind CSS, Socket.IO Client
- Repository structure: one monorepo with `backend/` and `frontend/`

## Project structure

```text
backend/
  src/
    config/
    controllers/
    db/
    models/
    routes/
    services/
    sockets/
    types/
    utils/
frontend/
  src/
    app/
    features/
      game/
      host/
      player/
      quiz/
    shared/
      api/
      components/
      socket/
      types/
      utils/
```

## Features

- Host creates a quiz room
- Server generates a unique room PIN
- Players join by PIN and display name
- Host sees a live lobby of connected players
- Host starts the game
- Questions are broadcast live to all players
- Players answer in real time
- Server controls the active question, timer, scoring, and leaderboard
- Host sees live answer distribution bars while answers come in
- Results and leaderboard update after each round
- Final podium is shown when the quiz ends
- Reconnect state sync is supported for both host and player sessions

## Why WebSockets are needed

BrainBuzz is not a CRUD-style app where polling every few seconds would feel acceptable. The lobby, countdown, answer statistics, and leaderboard all need immediate two-way communication. Socket.IO lets the server push state transitions instantly, which creates the fast multiplayer quiz feel the project is aiming for.

## Server-authoritative game state

The backend is the single source of truth for the live game.

- Clients never calculate final score
- Clients never decide who is correct
- Clients never decide when a round ends
- Clients only send actions such as creating a room, joining, starting a game, or submitting an answer
- The server validates those actions, updates the room state, computes score, and broadcasts the result

## WebSocket event flow

- `room:create`
  Host creates a room for a selected quiz.
- `room:join`
  Player joins with room PIN and display name.
- `player:joined`
  Room members are notified when a player joins.
- `player:left`
  Room members are notified when a player disconnects.
- `game:start`
  Host starts the quiz.
- `question:show`
  Server broadcasts the active question and timer.
- `answer:submit`
  Player submits a selected option to the server.
- `answer:received`
  Server confirms that the answer was accepted.
- `stats:update`
  Host receives live answer distribution updates.
- `question:end`
  Server ends the round and reveals the correct answer.
- `leaderboard:update`
  Updated rankings are broadcast after scoring.
- `game:end`
  Final results and podium are broadcast.
- `state:sync`
  Reconnect and screen refresh recovery event.
- `error`
  Validation or flow errors are sent back meaningfully.

## Environment variables

Create a local `.env` file in the repository root based on `.env.example`.

- `MONGO_URI`
  MongoDB Atlas connection string using the `brainbuzz_api` user. The password belongs only in the local `.env` file and should never be committed.
- `PORT`
  Backend port, default `4000`
- `CLIENT_URL`
  Frontend origin allowed by backend CORS
- `VITE_API_URL`
  Frontend REST base URL
- `VITE_SOCKET_URL`
  Frontend Socket.IO URL

## Run locally

1. Copy `.env.example` to `.env`
2. Add your MongoDB Atlas password inside `MONGO_URI`
3. Install dependencies:

```bash
npm install
```

4. Start both apps:

```bash
npm run dev
```

5. Open `http://localhost:5173`

## Useful scripts

```bash
npm run dev
npm run dev:backend
npm run dev:frontend
npm run build
npm run lint
```
