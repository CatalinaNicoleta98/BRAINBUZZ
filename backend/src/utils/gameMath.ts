interface RankablePlayer {
  id: string;
  displayName: string;
  avatarId: string;
  score: number;
  correctAnswers: number;
  connected: boolean;
}

export function calculateScoreAward(points: number, timeLimitSeconds: number, timerEndsAt: number, answeredAt: number, isCorrect: boolean) {
  if (!isCorrect) {
    return 0;
  }

  const timeRemainingRatio = Math.max((timerEndsAt - answeredAt) / (timeLimitSeconds * 1000), 0);
  const speedBonus = Math.round(points * 0.5 * timeRemainingRatio);
  return points + speedBonus;
}

export function buildRankedLeaderboard(players: RankablePlayer[]) {
  return [...players]
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return a.displayName.localeCompare(b.displayName);
    })
    .map((player, index) => ({
      rank: index + 1,
      playerId: player.id,
      displayName: player.displayName,
      avatarId: player.avatarId,
      score: player.score,
      correctAnswers: player.correctAnswers,
      connected: player.connected,
    }));
}
