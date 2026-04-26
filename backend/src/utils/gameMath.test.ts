import { describe, expect, it } from "vitest";
import { buildRankedLeaderboard, calculateScoreAward } from "./gameMath.js";

describe("calculateScoreAward", () => {
  it("returns zero for incorrect answers", () => {
    expect(calculateScoreAward(1000, 15, 15000, 5000, false)).toBe(0);
  });

  it("awards base points plus speed bonus for correct answers", () => {
    const score = calculateScoreAward(1000, 10, 10_000, 2_000, true);
    expect(score).toBe(1400);
  });
});

describe("buildRankedLeaderboard", () => {
  it("sorts by score descending then display name ascending", () => {
    const leaderboard = buildRankedLeaderboard([
      { id: "2", displayName: "Zed", avatarId: "nova", score: 1200, correctAnswers: 1, connected: true },
      { id: "1", displayName: "Ava", avatarId: "spark", score: 1200, correctAnswers: 2, connected: true },
      { id: "3", displayName: "Mia", avatarId: "echo", score: 900, correctAnswers: 1, connected: false },
    ]);

    expect(leaderboard.map((entry) => entry.playerId)).toEqual(["1", "2", "3"]);
    expect(leaderboard[0]?.rank).toBe(1);
    expect(leaderboard[1]?.rank).toBe(2);
  });
});
