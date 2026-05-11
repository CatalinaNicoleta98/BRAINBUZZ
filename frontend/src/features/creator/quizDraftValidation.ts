export const QUIZ_LIMITS = {
  title: { min: 3, max: 80 },
  description: { min: 10, max: 240 },
  createdBy: { min: 2, max: 40 },
  questions: { min: 1, max: 20 },
  prompt: { min: 5, max: 180 },
  options: { min: 2, max: 6 },
  optionText: { min: 1, max: 120 },
  timeLimitSeconds: { min: 5, max: 60 },
  points: { min: 100, max: 5000 },
} as const;

export interface QuizDraftPayload {
  title: string;
  description: string;
  createdBy: string;
  themeId: string;
  coverEmoji: string;
  visibility: "private" | "public";
  questions: Array<{
    prompt: string;
    options: string[];
    correctOptionIndex: number;
    timeLimitSeconds: number;
    points: number;
  }>;
}

export interface QuizFieldErrors {
  title?: string;
  description?: string;
  createdBy?: string;
  questions?: string;
}

export function buildQuizValidationErrors(input: QuizDraftPayload) {
  const fieldErrors: QuizFieldErrors = {};
  const questionErrors: string[] = [];

  if (input.title.length < QUIZ_LIMITS.title.min) {
    fieldErrors.title = `Quiz title must be at least ${QUIZ_LIMITS.title.min} characters.`;
  } else if (input.title.length > QUIZ_LIMITS.title.max) {
    fieldErrors.title = `Quiz title must be ${QUIZ_LIMITS.title.max} characters or less.`;
  }

  if (input.description.length < QUIZ_LIMITS.description.min) {
    fieldErrors.description = `Description must be at least ${QUIZ_LIMITS.description.min} characters.`;
  } else if (input.description.length > QUIZ_LIMITS.description.max) {
    fieldErrors.description = `Description must be ${QUIZ_LIMITS.description.max} characters or less.`;
  }

  if (input.createdBy.length < QUIZ_LIMITS.createdBy.min) {
    fieldErrors.createdBy = "We could not determine the quiz creator name.";
  } else if (input.createdBy.length > QUIZ_LIMITS.createdBy.max) {
    fieldErrors.createdBy = `Creator name must be ${QUIZ_LIMITS.createdBy.max} characters or less.`;
  }

  if (input.questions.length < QUIZ_LIMITS.questions.min) {
    fieldErrors.questions = "Add at least one question before saving.";
  } else if (input.questions.length > QUIZ_LIMITS.questions.max) {
    fieldErrors.questions = `A quiz can contain up to ${QUIZ_LIMITS.questions.max} questions.`;
  }

  input.questions.forEach((question, index) => {
    const questionNumber = index + 1;

    if (question.prompt.length < QUIZ_LIMITS.prompt.min) {
      questionErrors.push(`Question ${questionNumber} needs a prompt with at least ${QUIZ_LIMITS.prompt.min} characters.`);
    } else if (question.prompt.length > QUIZ_LIMITS.prompt.max) {
      questionErrors.push(`Question ${questionNumber} prompt must be ${QUIZ_LIMITS.prompt.max} characters or less.`);
    }

    if (question.options.length < QUIZ_LIMITS.options.min) {
      questionErrors.push(`Question ${questionNumber} needs at least ${QUIZ_LIMITS.options.min} answer options.`);
    } else if (question.options.length > QUIZ_LIMITS.options.max) {
      questionErrors.push(`Question ${questionNumber} can have at most ${QUIZ_LIMITS.options.max} answer options.`);
    }

    question.options.forEach((option, optionIndex) => {
      if (option.length < QUIZ_LIMITS.optionText.min) {
        questionErrors.push(`Question ${questionNumber} option ${optionIndex + 1} cannot be empty.`);
      } else if (option.length > QUIZ_LIMITS.optionText.max) {
        questionErrors.push(
          `Question ${questionNumber} option ${optionIndex + 1} must be ${QUIZ_LIMITS.optionText.max} characters or less.`,
        );
      }
    });

    if (question.correctOptionIndex < 0 || question.correctOptionIndex >= question.options.length) {
      questionErrors.push(`Question ${questionNumber} must have a valid correct answer selected.`);
    }

    if (
      !Number.isInteger(question.timeLimitSeconds) ||
      question.timeLimitSeconds < QUIZ_LIMITS.timeLimitSeconds.min ||
      question.timeLimitSeconds > QUIZ_LIMITS.timeLimitSeconds.max
    ) {
      questionErrors.push(
        `Question ${questionNumber} time limit must be between ${QUIZ_LIMITS.timeLimitSeconds.min} and ${QUIZ_LIMITS.timeLimitSeconds.max} seconds.`,
      );
    }

    if (!Number.isInteger(question.points) || question.points < QUIZ_LIMITS.points.min || question.points > QUIZ_LIMITS.points.max) {
      questionErrors.push(
        `Question ${questionNumber} points must be between ${QUIZ_LIMITS.points.min} and ${QUIZ_LIMITS.points.max}.`,
      );
    }
  });

  if (questionErrors.length > 0 && !fieldErrors.questions) {
    fieldErrors.questions = questionErrors[0];
  }

  return { fieldErrors, questionErrors };
}
