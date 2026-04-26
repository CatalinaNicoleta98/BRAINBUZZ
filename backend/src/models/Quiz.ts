import mongoose, { Schema } from "mongoose";

const quizOptionSchema = new Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
  },
  { _id: false },
);

const quizQuestionSchema = new Schema(
  {
    id: { type: String, required: true },
    prompt: { type: String, required: true },
    options: { type: [quizOptionSchema], required: true },
    correctOptionId: { type: String, required: true },
    timeLimitSeconds: { type: Number, required: true, min: 5, max: 60 },
    points: { type: Number, required: true, min: 100, max: 5000 },
  },
  { _id: false },
);

const quizSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    createdBy: { type: String, required: true, trim: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User" },
    themeId: { type: String, required: true, default: "midnight" },
    coverEmoji: { type: String, required: true, default: "🧠" },
    visibility: { type: String, required: true, enum: ["private", "public"], default: "private" },
    questions: { type: [quizQuestionSchema], required: true },
  },
  { timestamps: true },
);

export const QuizModel = mongoose.model("Quiz", quizSchema);
