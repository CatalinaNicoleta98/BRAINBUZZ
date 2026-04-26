export const demoQuiz = {
  title: "BrainBuzz Launch Night",
  description: "A punchy mixed-knowledge quiz for showing off live multiplayer game flow.",
  themeId: "midnight",
  coverEmoji: "🧠",
  visibility: "public" as const,
  questions: [
    {
      prompt: "Which web API keeps a client-server connection open for two-way real-time communication?",
      options: ["LocalStorage", "WebSocket", "Service Worker", "Fetch"],
      correctOptionIndex: 1,
      timeLimitSeconds: 15,
      points: 1000,
    },
    {
      prompt: "Which CSS utility framework powers the BrainBuzz frontend?",
      options: ["Bootstrap", "Bulma", "Tailwind CSS", "Foundation"],
      correctOptionIndex: 2,
      timeLimitSeconds: 12,
      points: 900,
    },
    {
      prompt: "In a server-authoritative quiz app, who decides the final score?",
      options: ["The fastest browser", "The host laptop", "The backend server", "Each player client"],
      correctOptionIndex: 2,
      timeLimitSeconds: 15,
      points: 1200,
    },
  ],
};
