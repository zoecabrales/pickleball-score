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
