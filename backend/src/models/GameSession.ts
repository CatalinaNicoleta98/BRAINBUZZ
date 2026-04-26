import mongoose, { Schema } from "mongoose";

const finalPlayerSchema = new Schema(
  {
    playerId: { type: String, required: true },
    displayName: { type: String, required: true },
    avatarId: { type: String, required: true },
    score: { type: Number, required: true },
    correctAnswers: { type: Number, required: true },
  },
  { _id: false },
);

const sessionSchema = new Schema(
  {
    roomPin: { type: String, required: true, unique: true },
    quizId: { type: Schema.Types.ObjectId, ref: "Quiz", required: true },
    quizTitle: { type: String, required: true },
    hostName: { type: String, required: true },
    themeId: { type: String, required: true, default: "midnight" },
    status: { type: String, required: true },
    startedAt: { type: Date },
    endedAt: { type: Date },
    finalLeaderboard: { type: [finalPlayerSchema], default: [] },
  },
  { timestamps: true },
);

export const GameSessionModel = mongoose.model("GameSession", sessionSchema);
