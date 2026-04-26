export interface JoinRoomPayload {
  roomPin: string;
  displayName: string;
  playerId?: string;
}

export interface CreateRoomPayload {
  quizId: string;
  hostName: string;
}

export interface SubmitAnswerPayload {
  roomPin: string;
  questionId: string;
  optionId: string;
}

export interface SyncStatePayload {
  roomPin: string;
  role: "host" | "player";
  participantId?: string;
}
