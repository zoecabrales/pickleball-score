export type WinningSide = "a" | "b" | null;
export type ServingSide = "a" | "b";
export type ServerNumber = 1 | 2;

export function getNextDoublesServe(
  servingSide: ServingSide,
  serverNumber: ServerNumber,
): { servingSide: ServingSide; serverNumber: ServerNumber } {
  if (serverNumber === 1) {
    return { servingSide, serverNumber: 2 };
  }

  return {
    servingSide: servingSide === "a" ? "b" : "a",
    serverNumber: 1,
  };
}

export function getWinningSide(
  scoreA: number,
  scoreB: number,
  target: number,
): WinningSide {
  if (scoreA >= target && scoreA > scoreB) return "a";
  if (scoreB >= target && scoreB > scoreA) return "b";
  return null;
}

export function isExtensionDecision(
  scoreA: number,
  scoreB: number,
  target: number,
) {
  return (
    scoreA === scoreB &&
    scoreA === target - 1 &&
    (target === 11 || target === 15)
  );
}

export function getWinPercentage(wins: number, matches: number) {
  return matches === 0 ? 0 : Math.round((wins / matches) * 100);
}

// Ranks for an already-sorted ladder. Equal wins and matches share a rank,
// and the next distinct record gets the next number (1, 1, 2), so no medal is skipped.
export function getSharedRanks<T extends { wins: number; matches: number }>(
  sortedPlayers: T[],
): number[] {
  const ranks: number[] = [];
  sortedPlayers.forEach((player, index) => {
    const previous = sortedPlayers[index - 1];
    const tied =
      previous &&
      previous.wins === player.wins &&
      previous.matches === player.matches;
    if (index === 0) ranks.push(1);
    else ranks.push(tied ? ranks[index - 1] : ranks[index - 1] + 1);
  });
  return ranks;
}

// Leaders of an already-sorted ladder: everyone tied with the first row.
export function getTopRanked<T extends { wins: number; matches: number }>(
  sortedPlayers: T[],
): T[] {
  const [first] = sortedPlayers;
  if (!first) return [];
  return sortedPlayers.filter(
    (player) => player.wins === first.wins && player.matches === first.matches,
  );
}
