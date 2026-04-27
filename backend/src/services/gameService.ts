import { GameSessionModel } from "../models/GameSession.js";
import { QuizModel } from "../models/Quiz.js";
import { createId } from "../utils/createId.js";
import { createPin } from "../utils/createPin.js";
import { buildRankedLeaderboard, calculateScoreAward } from "../utils/gameMath.js";
import { HttpError } from "../utils/httpError.js";

type RoomStatus = "waiting" | "question_live" | "reveal" | "leaderboard" | "finished";

export interface LivePlayer {
  id: string;
  displayName: string;
  avatarId: string;
  socketId: string;
  score: number;
  correctAnswers: number;
  connected: boolean;
  lastAnswerAt?: number;
}

interface LiveRoom {
  roomPin: string;
  hostSocketId: string;
  hostName: string;
  quizId: string;
  quizTitle: string;
  themeId: string;
  status: RoomStatus;
  currentQuestionIndex: number;
  players: Map<string, LivePlayer>;
  timerEndsAt?: number;
  timerHandle?: NodeJS.Timeout;
  answersByQuestion: Map<string, Map<string, AnswerRecord>>;
  currentRoundClosed: boolean;
}

interface AnswerRecord {
  playerId: string;
  optionId: string;
  isCorrect: boolean;
  scoreAwarded: number;
  answeredAt: number;
}

interface DistributionRow {
  optionId: string;
  text: string;
  count: number;
  isCorrect: boolean;
}

interface PlayerRevealPayload {
  roomPin: string;
  questionId: string;
  playerId: string;
  selectedOptionId?: string;
  selectedOptionText?: string;
  correctOptionId: string;
  correctOptionText: string;
  isCorrect: boolean;
  scoreAwarded: number;
  totalScore: number;
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

function buildDistribution(
  question: {
    correctOptionId: string;
    options: Array<{ id: string; text: string }>;
  },
  questionAnswers: Map<string, AnswerRecord>,
): DistributionRow[] {
  return question.options.map((option) => ({
    optionId: option.id,
    text: option.text,
    count: [...questionAnswers.values()].filter((entry) => entry.optionId === option.id).length,
    isCorrect: option.id === question.correctOptionId,
  }));
}

function buildPlayerRevealPayload(
  roomPin: string,
  question: {
    id: string;
    correctOptionId: string;
    options: Array<{ id: string; text: string }>;
  },
  player: LivePlayer,
  answer?: AnswerRecord,
): PlayerRevealPayload {
  const correctOption = question.options.find((option) => option.id === question.correctOptionId);
  const selectedOption = question.options.find((option) => option.id === answer?.optionId);

  return {
    roomPin,
    questionId: question.id,
    playerId: player.id,
    selectedOptionId: answer?.optionId,
    selectedOptionText: selectedOption?.text,
    correctOptionId: question.correctOptionId,
    correctOptionText: correctOption?.text ?? "",
    isCorrect: answer?.isCorrect ?? false,
    scoreAwarded: answer?.scoreAwarded ?? 0,
    totalScore: player.score,
  };
}

export function getRoom(roomPin: string) {
  return liveRooms.get(roomPin);
}

export async function createRoom(quizId: string, hostName: string, hostSocketId: string, themeId?: string) {
  const normalizedHostName = hostName.trim();
  if (!normalizedHostName) {
    throw new HttpError(400, "Host display name is required.");
  }

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
    hostName: normalizedHostName,
    quizId: quiz._id.toString(),
    quizTitle: quiz.title,
    themeId: themeId ?? quiz.themeId ?? "midnight",
    status: "waiting",
    currentQuestionIndex: -1,
    players: new Map(),
    answersByQuestion: new Map(),
    currentRoundClosed: false,
  });

  await GameSessionModel.create({
    roomPin,
    quizId: quiz._id,
    quizTitle: quiz.title,
    hostName: normalizedHostName,
    themeId: themeId ?? quiz.themeId ?? "midnight",
    status: "waiting",
  });

  return {
    roomPin,
    room: await buildRoomState(roomPin),
  };
}

export async function joinRoom(roomPin: string, displayName: string, avatarId: string, socketId: string, playerId?: string) {
  const normalizedRoomPin = roomPin.trim();
  const room = getRoomOrThrow(normalizedRoomPin);
  const normalizedName = displayName.trim();
  if (!normalizedName) {
    throw new HttpError(400, "Display name is required.");
  }

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
    player.avatarId = avatarId;
  } else {
    player = {
      id: playerId ?? createId("player"),
      displayName: normalizedName,
      avatarId,
      socketId,
      score: 0,
      correctAnswers: 0,
      connected: true,
    };
    room.players.set(player.id, player);
  }

  return {
    playerId: player.id,
    room: await buildRoomState(normalizedRoomPin, player.id),
  };
}

export async function startGame(roomPin: string) {
  const room = getRoomOrThrow(roomPin);
  if (room.players.size === 0) {
    throw new HttpError(400, "At least one player must join before starting.");
  }

  room.currentQuestionIndex = 0;
  room.status = "question_live";

  await GameSessionModel.updateOne(
    { roomPin },
    {
      status: "question_live",
      startedAt: new Date(),
    },
  );

  return buildQuestionState(roomPin);
}

export async function nextQuestion(roomPin: string) {
  const room = getRoomOrThrow(roomPin);
  if (room.status !== "leaderboard") {
    throw new HttpError(409, "Leaderboard must be shown before moving to the next question.");
  }

  room.currentQuestionIndex += 1;
  room.status = "question_live";
  return buildQuestionState(roomPin);
}

export async function showLeaderboard(roomPin: string) {
  const room = getRoomOrThrow(roomPin);
  if (room.status !== "reveal") {
    throw new HttpError(409, "Reveal must complete before showing the leaderboard.");
  }

  const quiz = await QuizModel.findById(room.quizId).lean();
  if (!quiz) {
    throw new HttpError(404, "Quiz not found.");
  }

  const leaderboard = buildRankedLeaderboard(getSortedPlayers(room.players));
  const basePayload = {
    roomPin,
    questionIndex: room.currentQuestionIndex,
    totalQuestions: quiz.questions.length,
    leaderboard,
  };

  if (room.currentQuestionIndex >= quiz.questions.length - 1) {
    room.status = "finished";

    await GameSessionModel.updateOne(
      { roomPin },
      {
        status: "finished",
        endedAt: new Date(),
        finalLeaderboard: leaderboard.map((entry) => ({
          playerId: entry.playerId,
          displayName: entry.displayName,
          avatarId: room.players.get(entry.playerId)?.avatarId ?? "spark",
          score: entry.score,
          correctAnswers: entry.correctAnswers,
        })),
      },
    );

    return {
      type: "game:end" as const,
      payload: {
        ...basePayload,
        podium: leaderboard.slice(0, 3),
      },
    };
  }

  room.status = "leaderboard";
  return {
    type: "leaderboard" as const,
    payload: {
      ...basePayload,
      nextQuestionIndex: room.currentQuestionIndex + 1,
    },
  };
}

export async function getCurrentQuestion(roomPin: string) {
  const room = getRoomOrThrow(roomPin);
  if (room.status !== "question_live") {
    throw new HttpError(400, "No active question.");
  }

  const quiz = await QuizModel.findById(room.quizId).lean();
  if (!quiz) {
    throw new HttpError(404, "Quiz not found.");
  }

  const question = quiz.questions[room.currentQuestionIndex];
  if (!question || !room.timerEndsAt) {
    throw new HttpError(400, "No active question.");
  }

  return {
    roomPin,
    questionIndex: room.currentQuestionIndex,
    totalQuestions: quiz.questions.length,
    timerEndsAt: room.timerEndsAt,
    question: {
      id: question.id,
      prompt: question.prompt,
      options: question.options.map((option) => ({
        id: option.id,
        text: option.text,
      })),
      timeLimitSeconds: question.timeLimitSeconds,
      points: question.points,
    },
  };
}

export async function submitAnswer(roomPin: string, playerId: string, questionId: string, optionId: string) {
  const room = getRoomOrThrow(roomPin);
  if (room.status !== "question_live") {
    throw new HttpError(409, "Answers can only be submitted while the question is live.");
  }

  const quiz = await QuizModel.findById(room.quizId).lean();
  if (!quiz) {
    throw new HttpError(404, "Quiz not found.");
  }

  const question = quiz.questions[room.currentQuestionIndex];
  if (!question || question.id !== questionId) {
    throw new HttpError(400, "That question is no longer active.");
  }

  const player = room.players.get(playerId);
  if (!player) {
    throw new HttpError(404, "Player not found.");
  }

  const now = Date.now();
  if (!room.timerEndsAt || now > room.timerEndsAt) {
    throw new HttpError(400, "Answer window has already closed.");
  }

  if (room.currentRoundClosed) {
    throw new HttpError(409, "This round has already finished.");
  }

  const questionAnswers = room.answersByQuestion.get(questionId) ?? new Map<string, AnswerRecord>();
  if (questionAnswers.has(playerId)) {
    throw new HttpError(409, "Answer already submitted.");
  }

  const isCorrect = question.correctOptionId === optionId;
  const scoreAwarded = calculateScoreAward(
    question.points,
    question.timeLimitSeconds,
    room.timerEndsAt,
    now,
    isCorrect,
  );

  if (isCorrect) {
    player.score += scoreAwarded;
    player.correctAnswers += 1;
  }

  player.lastAnswerAt = now;
  questionAnswers.set(playerId, {
    playerId,
    optionId,
    isCorrect,
    scoreAwarded,
    answeredAt: now,
  });
  room.answersByQuestion.set(questionId, questionAnswers);

  return {
    answerCount: questionAnswers.size,
    playerCount: room.players.size,
    distribution: buildDistribution(question, questionAnswers).map((entry) => ({
      optionId: entry.optionId,
      text: entry.text,
      count: entry.count,
      isCorrect: entry.isCorrect,
    })),
  };
}

export async function advanceAfterQuestion(roomPin: string) {
  const room = getRoomOrThrow(roomPin);
  if (room.currentRoundClosed) {
    return null;
  }

  room.currentRoundClosed = true;
  room.status = "reveal";
  room.timerEndsAt = undefined;
  if (room.timerHandle) {
    clearTimeout(room.timerHandle);
    room.timerHandle = undefined;
  }

  const quiz = await QuizModel.findById(room.quizId).lean();
  if (!quiz) {
    throw new HttpError(404, "Quiz not found.");
  }

  const question = quiz.questions[room.currentQuestionIndex];
  if (!question) {
    throw new HttpError(400, "No active question.");
  }

  const questionAnswers = room.answersByQuestion.get(question.id) ?? new Map<string, AnswerRecord>();
  const distribution = buildDistribution(question, questionAnswers);
  const correctOption = question.options.find((option) => option.id === question.correctOptionId);
  const playerReveals = [...room.players.values()].map((player) => ({
    socketId: player.socketId,
    playerId: player.id,
    payload: buildPlayerRevealPayload(roomPin, question, player, questionAnswers.get(player.id)),
  }));

  await GameSessionModel.updateOne({ roomPin }, { status: "reveal" });

  return {
    roomPin,
    questionIndex: room.currentQuestionIndex,
    totalQuestions: quiz.questions.length,
    question: {
      id: question.id,
      prompt: question.prompt,
      correctOptionId: question.correctOptionId,
      correctOptionText: correctOption?.text ?? "",
    },
    distribution,
    nextStage: room.currentQuestionIndex >= quiz.questions.length - 1 ? ("finished" as const) : ("leaderboard" as const),
    playerReveals,
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

export async function buildRoomState(roomPin: string, viewerPlayerId?: string) {
  const room = getRoomOrThrow(roomPin);
  const quiz = await QuizModel.findById(room.quizId).lean();
  if (!quiz) {
    throw new HttpError(404, "Quiz not found.");
  }

  const currentQuestion = room.currentQuestionIndex >= 0 ? quiz.questions[room.currentQuestionIndex] : undefined;
  const currentQuestionAnswers = currentQuestion ? room.answersByQuestion.get(currentQuestion.id) ?? new Map<string, AnswerRecord>() : undefined;
  const viewerAnswer = viewerPlayerId && currentQuestionAnswers ? currentQuestionAnswers.get(viewerPlayerId) : undefined;
  const viewerPlayer = viewerPlayerId ? room.players.get(viewerPlayerId) : undefined;
  const correctOption =
    currentQuestion && (room.status === "reveal" || room.status === "leaderboard" || room.status === "finished")
      ? currentQuestion.options.find((option) => option.id === currentQuestion.correctOptionId)
      : undefined;

  const viewerRoundState =
    room.status === "question_live" && viewerAnswer
      ? "answer_locked"
      : room.status === "question_live"
        ? "question_live"
        : room.status;

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
      themeId: room.themeId,
      coverEmoji: quiz.coverEmoji,
      visibility: quiz.visibility,
    },
    currentQuestion:
      currentQuestion
        ? {
            id: currentQuestion.id,
            prompt: currentQuestion.prompt,
            options: currentQuestion.options.map((option) => ({
              id: option.id,
              text: option.text,
            })),
            timeLimitSeconds: currentQuestion.timeLimitSeconds,
            points: currentQuestion.points,
            correctOptionId: correctOption?.id,
          }
        : null,
    players: getSortedPlayers(room.players).map((player) => ({
      id: player.id,
      displayName: player.displayName,
      avatarId: player.avatarId,
      score: player.score,
      correctAnswers: player.correctAnswers,
      connected: player.connected,
    })),
    viewerState:
      viewerPlayerId && viewerPlayer
        ? {
            playerId: viewerPlayerId,
            roundState: viewerRoundState,
            selectedOptionId: viewerAnswer?.optionId,
            latestQuestionResult:
              currentQuestion && correctOption && (room.status === "reveal" || room.status === "leaderboard" || room.status === "finished")
                ? buildPlayerRevealPayload(roomPin, currentQuestion, viewerPlayer, viewerAnswer)
                : undefined,
          }
        : undefined,
  };
}

export async function buildQuestionState(roomPin: string) {
  const room = getRoomOrThrow(roomPin);
  const quiz = await QuizModel.findById(room.quizId).lean();
  if (!quiz) {
    throw new HttpError(404, "Quiz not found.");
  }

  const question = quiz.questions[room.currentQuestionIndex];
  if (!question) {
    throw new HttpError(400, "No question available.");
  }

  room.status = "question_live";
  room.timerEndsAt = Date.now() + question.timeLimitSeconds * 1000;
  room.currentRoundClosed = false;

  await GameSessionModel.updateOne({ roomPin }, { status: "question_live" });

  return {
    roomPin,
    questionIndex: room.currentQuestionIndex,
    totalQuestions: quiz.questions.length,
    timerEndsAt: room.timerEndsAt,
    question: {
      id: question.id,
      prompt: question.prompt,
      options: question.options.map((option) => ({
        id: option.id,
        text: option.text,
      })),
      timeLimitSeconds: question.timeLimitSeconds,
      points: question.points,
    },
  };
}

export function scheduleRoundTimeout(roomPin: string, onTimeout: (roomPin: string) => Promise<void>) {
  const room = getRoomOrThrow(roomPin);
  if (!room.timerEndsAt) {
    throw new HttpError(400, "Cannot schedule timeout without an active timer.");
  }

  if (room.timerHandle) {
    clearTimeout(room.timerHandle);
  }

  const delay = Math.max(room.timerEndsAt - Date.now(), 0);
  room.timerHandle = setTimeout(() => {
    void onTimeout(roomPin);
  }, delay);
}
