import type { PlayerStats } from "@/context/RankingContext";

export type BalancedDoublesTeams = {
  teamA: [string, string];
  teamB: [string, string];
};

function compareSkill(left: PlayerStats, right: PlayerStats) {
  const leftWinRate = left.matches ? left.wins / left.matches : 0;
  const rightWinRate = right.matches ? right.wins / right.matches : 0;

  return (
    rightWinRate - leftWinRate ||
    right.wins - left.wins ||
    left.name.localeCompare(right.name)
  );
}

function selectBalancedPlayers(players: PlayerStats[], count: number) {
  const rankedPlayers = [...players].sort(compareSkill);
  if (count >= rankedPlayers.length) return rankedPlayers;

  const upperHalfSize = Math.ceil(rankedPlayers.length / 2);
  const strongerCount = Math.ceil(count / 2);
  const developingCount = Math.floor(count / 2);

  return [
    ...rankedPlayers.slice(0, upperHalfSize).slice(0, strongerCount),
    ...rankedPlayers.slice(upperHalfSize).slice(0, developingCount),
  ];
}

export function getNextBalancedDoublesTeams(
  rankings: PlayerStats[],
  registeredPlayerNames: string[] = [],
): BalancedDoublesTeams | null {
  const playersById = new Map<string, PlayerStats>();
  registeredPlayerNames.forEach((rawName) => {
    const name = rawName.trim();
    const id = name.toLocaleLowerCase();
    if (name && !playersById.has(id)) {
      playersById.set(id, {
        id,
        name,
        matches: 0,
        wins: 0,
        losses: 0,
        pointsFor: 0,
        pointsAgainst: 0,
      });
    }
  });
  rankings.forEach((player) => {
    if (player.name.trim()) {
      playersById.set(player.name.trim().toLocaleLowerCase(), player);
    }
  });

  const uniquePlayers = [...playersById.values()];

  if (uniquePlayers.length < 4) return null;

  const byMatchCount = new Map<number, PlayerStats[]>();
  uniquePlayers.forEach((player) => {
    const group = byMatchCount.get(player.matches) ?? [];
    group.push(player);
    byMatchCount.set(player.matches, group);
  });

  const matchCounts = [...byMatchCount.keys()].sort(
    (left, right) => left - right,
  );
  const selectedPlayers: PlayerStats[] = [];

  for (const matchCount of matchCounts) {
    const group = byMatchCount.get(matchCount) ?? [];
    const remainingSlots = 4 - selectedPlayers.length;
    selectedPlayers.push(...selectBalancedPlayers(group, remainingSlots));
    if (selectedPlayers.length === 4) break;
  }

  if (selectedPlayers.length < 4) return null;

  const [strongest, secondStrongest, strongestDeveloping, secondDeveloping] =
    selectedPlayers.sort(compareSkill);

  return {
    teamA: [strongest.name, strongestDeveloping.name],
    teamB: [secondStrongest.name, secondDeveloping.name],
  };
}
