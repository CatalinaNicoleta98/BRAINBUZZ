import type { Server, Socket } from "socket.io";
import {
  advanceAfterQuestion,
  buildRoomState,
  createRoom,
  getCurrentQuestion,
  getRoom,
  joinRoom,
  markParticipantDisconnected,
  nextQuestion,
  reconnectHost,
  startGame,
  submitAnswer,
} from "../services/gameService.js";
import type { CreateRoomPayload, JoinRoomPayload, SubmitAnswerPayload, SyncStatePayload } from "../types/socket.js";
import { HttpError } from "../utils/httpError.js";

function emitError(socket: Socket, message: string) {
  socket.emit("error", { message });
}

async function handleAsync(socket: Socket, work: () => Promise<void>) {
  try {
    await work();
  } catch (error) {
    if (error instanceof HttpError) {
      emitError(socket, error.message);
      return;
    }

    emitError(socket, error instanceof Error ? error.message : "Unexpected socket error.");
  }
}

export function registerSocketHandlers(io: Server) {
  io.on("connection", (socket) => {
    socket.on("room:create", (payload: CreateRoomPayload, callback?: (response: unknown) => void) => {
      void handleAsync(socket, async () => {
        const result = await createRoom(payload.quizId, payload.hostName, socket.id);
        socket.data.role = "host";
        socket.data.roomPin = result.roomPin;
        await socket.join(result.roomPin);
        callback?.(result);
        io.to(result.roomPin).emit("state:sync", result.room);
      });
    });

    socket.on("room:join", (payload: JoinRoomPayload, callback?: (response: unknown) => void) => {
      void handleAsync(socket, async () => {
        const result = await joinRoom(payload.roomPin, payload.displayName, socket.id, payload.playerId);
        socket.data.role = "player";
        socket.data.roomPin = payload.roomPin;
        socket.data.playerId = result.playerId;
        await socket.join(payload.roomPin);
        callback?.(result);
        io.to(payload.roomPin).emit("player:joined", {
          roomPin: payload.roomPin,
          playerId: result.playerId,
          displayName: payload.displayName,
        });
        io.to(payload.roomPin).emit("state:sync", result.room);
      });
    });

    socket.on("state:sync", (payload: SyncStatePayload, callback?: (response: unknown) => void) => {
      void handleAsync(socket, async () => {
        if (payload.role === "host") {
          const state = await reconnectHost(payload.roomPin, socket.id);
          socket.data.role = "host";
          socket.data.roomPin = payload.roomPin;
          await socket.join(payload.roomPin);
          callback?.(state);
          return;
        }

        const room = getRoom(payload.roomPin);
        if (!room) {
          throw new HttpError(404, "Room not found.");
        }

        if (!payload.participantId) {
          throw new HttpError(400, "Missing participant ID for player sync.");
        }

        const participant = room.players.get(payload.participantId);
        if (!participant) {
          throw new HttpError(404, "Player not found for reconnect.");
        }

        const result = await joinRoom(payload.roomPin, participant.displayName, socket.id, payload.participantId);
        socket.data.role = "player";
        socket.data.roomPin = payload.roomPin;
        socket.data.playerId = result.playerId;
        await socket.join(payload.roomPin);
        callback?.(result.room);
        io.to(payload.roomPin).emit("state:sync", result.room);
      });
    });

    socket.on("game:start", (roomPin: string) => {
      void handleAsync(socket, async () => {
        const questionState = await startGame(roomPin);
        io.to(roomPin).emit("game:start", { roomPin });
        io.to(roomPin).emit("question:show", questionState);
        io.to(roomPin).emit("state:sync", await buildRoomState(roomPin));
      });
    });

    socket.on("game:next", (roomPin: string) => {
      void handleAsync(socket, async () => {
        const questionState = await nextQuestion(roomPin);
        io.to(roomPin).emit("question:show", questionState);
        io.to(roomPin).emit("state:sync", await buildRoomState(roomPin));
      });
    });

    socket.on("answer:submit", (payload: SubmitAnswerPayload, callback?: (response: unknown) => void) => {
      void handleAsync(socket, async () => {
        const playerId = socket.data.playerId as string | undefined;
        if (!playerId) {
          throw new HttpError(401, "Player session missing.");
        }

        const stats = await submitAnswer(payload.roomPin, playerId, payload.questionId, payload.optionId);
        callback?.({ ok: true });
        socket.emit("answer:received", {
          questionId: payload.questionId,
          optionId: payload.optionId,
        });
        io.to(payload.roomPin).emit("stats:update", stats);

        const room = getRoom(payload.roomPin);
        const currentQuestion = await getCurrentQuestion(payload.roomPin);
        if (room && (stats.answerCount >= room.players.size || Date.now() >= currentQuestion.timerEndsAt)) {
          const roundResult = await advanceAfterQuestion(payload.roomPin);
          io.to(payload.roomPin).emit("question:end", roundResult.payload);
          io.to(payload.roomPin).emit("leaderboard:update", roundResult.payload.leaderboard);
          if (roundResult.type === "game:end") {
            io.to(payload.roomPin).emit("game:end", roundResult.payload);
          }
          io.to(payload.roomPin).emit("state:sync", await buildRoomState(payload.roomPin));
        }
      });
    });

    socket.on("question:timeout", (roomPin: string) => {
      void handleAsync(socket, async () => {
        const roundResult = await advanceAfterQuestion(roomPin);
        io.to(roomPin).emit("question:end", roundResult.payload);
        io.to(roomPin).emit("leaderboard:update", roundResult.payload.leaderboard);
        if (roundResult.type === "game:end") {
          io.to(roomPin).emit("game:end", roundResult.payload);
        }
        io.to(roomPin).emit("state:sync", await buildRoomState(roomPin));
      });
    });

    socket.on("disconnect", () => {
      markParticipantDisconnected(socket.id);
      const roomPin = socket.data.roomPin as string | undefined;
      if (!roomPin || !getRoom(roomPin)) {
        return;
      }

      void handleAsync(socket, async () => {
        io.to(roomPin).emit("player:left", { socketId: socket.id });
        io.to(roomPin).emit("state:sync", await buildRoomState(roomPin));
      });
    });
  });
}
