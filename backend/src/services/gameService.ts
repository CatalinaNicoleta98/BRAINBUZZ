import { GameSessionModel } from "../models/GameSession.js";
import { QuizModel } from "../models/Quiz.js";
import { createId } from "../utils/createId.js";
import { createPin } from "../utils/createPin.js";
import { HttpError } from "../utils/httpError.js";

type RoomStatus = "lobby" | "question" | "leaderboard" | "finished";

export interface LivePlayer {
  id: string;
  displayName: string;
  socketId: string;
  score: number;
  correctAnswers: number;
  connected: boolean;
}

interface LiveRoom {
  roomPin: string;
  hostSocketId: string;
  hostName: string;
  quizId: string;
  quizTitle: string;
  status: RoomStatus;
  currentQuestionIndex: number;
  players: Map<string, LivePlayer>;
  timerEndsAt?: number;
}

const liveRooms = new Map<string, LiveRoom>();

function getRoomOrThrow(roomPin: string) {
  const room = liveRooms.get(roomPin);
  if (!room) {
    throw new HttpError(404, "Room not found.");
  }

  return room;
}

function getSortedPlayers(players: Map<string, LivePlayer>) {
  return [...players.values()].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }

    return a.displayName.localeCompare(b.displayName);
  });
}

export function getRoom(roomPin: string) {
  return liveRooms.get(roomPin);
}

export async function createRoom(quizId: string, hostName: string, hostSocketId: string) {
  const quiz = await QuizModel.findById(quizId).lean();
  if (!quiz) {
    throw new HttpError(404, "Quiz not found.");
  }

  let roomPin = createPin();
  while (liveRooms.has(roomPin)) {
    roomPin = createPin();
  }

  liveRooms.set(roomPin, {
    roomPin,
    hostSocketId,
    hostName,
    quizId: quiz._id.toString(),
    quizTitle: quiz.title,
    status: "lobby",
    currentQuestionIndex: -1,
    players: new Map(),
  });

  await GameSessionModel.create({
    roomPin,
    quizId: quiz._id,
    quizTitle: quiz.title,
    hostName,
    status: "lobby",
  });

  return {
    roomPin,
    room: await buildRoomState(roomPin),
  };
}

export async function joinRoom(roomPin: string, displayName: string, socketId: string, playerId?: string) {
  const room = getRoomOrThrow(roomPin);
  const normalizedName = displayName.trim();

  const nameConflict = [...room.players.values()].find(
    (player) => player.displayName.toLowerCase() === normalizedName.toLowerCase() && player.id !== playerId,
  );
  if (nameConflict) {
    throw new HttpError(409, "That display name is already taken in this room.");
  }

  let player = playerId ? room.players.get(playerId) : undefined;
  if (player) {
    player.socketId = socketId;
    player.connected = true;
    player.displayName = normalizedName;
  } else {
    player = {
      id: playerId ?? createId("player"),
      displayName: normalizedName,
      socketId,
      score: 0,
      correctAnswers: 0,
      connected: true,
    };
    room.players.set(player.id, player);
  }

  return {
    playerId: player.id,
    room: await buildRoomState(roomPin),
  };
}

export function markParticipantDisconnected(socketId: string) {
  for (const room of liveRooms.values()) {
    if (room.hostSocketId === socketId) {
      room.hostSocketId = "";
      continue;
    }

    for (const player of room.players.values()) {
      if (player.socketId === socketId) {
        player.connected = false;
      }
    }
  }
}

export async function reconnectHost(roomPin: string, socketId: string) {
  const room = getRoomOrThrow(roomPin);
  room.hostSocketId = socketId;
  return buildRoomState(roomPin);
}

export async function buildRoomState(roomPin: string) {
  const room = getRoomOrThrow(roomPin);
  const quiz = await QuizModel.findById(room.quizId).lean();
  if (!quiz) {
    throw new HttpError(404, "Quiz not found.");
  }

  return {
    roomPin: room.roomPin,
    hostName: room.hostName,
    status: room.status,
    currentQuestionIndex: room.currentQuestionIndex,
    timerEndsAt: room.timerEndsAt ?? null,
    quiz: {
      id: room.quizId,
      title: room.quizTitle,
      questionCount: quiz.questions.length,
    },
    players: getSortedPlayers(room.players).map((player) => ({
      id: player.id,
      displayName: player.displayName,
      score: player.score,
      correctAnswers: player.correctAnswers,
      connected: player.connected,
    })),
  };
}
