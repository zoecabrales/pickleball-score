import type { PlayerStats, RankingArchive } from "@/context/RankingContext";

export type MonthlyPlayer = PlayerStats & {
  winRate: number;
  diffPerMatch: number;
};

export type MonthlyHighlights = {
  monthLabel: string;
  sessions: number;
  matches: number;
  champion: MonthlyPlayer | null;
  mostImproved: { player: MonthlyPlayer; change: number | null } | null;
  dontSleepOn: MonthlyPlayer | null;
  duo: [MonthlyPlayer, MonthlyPlayer] | null;
};

const MIN_MATCHES = 3;

const sameMonth = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth();

function aggregate(snapshots: PlayerStats[][]) {
  const byId = new Map<string, PlayerStats>();
  snapshots.flat().forEach((player) => {
    const current = byId.get(player.id);
    byId.set(
      player.id,
      current
        ? {
            ...current,
            matches: current.matches + player.matches,
            wins: current.wins + player.wins,
            losses: current.losses + player.losses,
            pointsFor: current.pointsFor + player.pointsFor,
            pointsAgainst: current.pointsAgainst + player.pointsAgainst,
          }
        : { ...player },
    );
  });
  return byId;
}

function decorate(player: PlayerStats): MonthlyPlayer {
  return {
    ...player,
    winRate: player.matches ? player.wins / player.matches : 0,
    diffPerMatch: player.matches
      ? (player.pointsFor - player.pointsAgainst) / player.matches
      : 0,
  };
}

const byStrength = (left: MonthlyPlayer, right: MonthlyPlayer) =>
  right.winRate - left.winRate ||
  right.wins - left.wins ||
  right.diffPerMatch - left.diffPerMatch ||
  left.name.localeCompare(right.name);

export function getMonthlyHighlights(
  rankings: PlayerStats[],
  archive: RankingArchive[],
  now: Date = new Date(),
): MonthlyHighlights {
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const monthLabel = now.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  const thisMonthArchive = archive.filter((entry) =>
    sameMonth(new Date(entry.savedAt), now),
  );
  const previousArchive = archive.filter((entry) =>
    sameMonth(new Date(entry.savedAt), previousMonth),
  );

  // The live ladder has no date yet, so it counts toward the current month.
  const sessions = [
    ...(rankings.length > 0 ? [rankings] : []),
    ...thisMonthArchive.map((entry) => entry.rankings),
  ];
  const current = [...aggregate(sessions).values()]
    .filter((player) => player.matches > 0)
    .map(decorate);

  const empty: MonthlyHighlights = {
    monthLabel,
    sessions: sessions.length,
    matches: 0,
    champion: null,
    mostImproved: null,
    dontSleepOn: null,
    duo: null,
  };
  if (current.length === 0) return empty;

  const qualified = current.filter((player) => player.matches >= MIN_MATCHES);
  const pool = qualified.length > 0 ? qualified : current;
  const champion = [...pool].sort(byStrength)[0];

  // Baseline: last month's record, or earlier sessions this month.
  let baseline = aggregate(previousArchive.map((entry) => entry.rankings));
  if (baseline.size === 0 && sessions.length > 1) {
    baseline = aggregate(sessions.slice(1));
  }
  const latestOnly = baseline.size > 0 && previousArchive.length === 0;
  const latest = latestOnly ? aggregate([sessions[0]]) : null;

  const improvements = pool
    .map((player) => {
      const before = baseline.get(player.id);
      const recent = latest ? latest.get(player.id) : player;
      if (!before || !before.matches || !recent || !recent.matches) return null;
      return {
        player,
        change: recent.wins / recent.matches - before.wins / before.matches,
      };
    })
    .filter((item): item is { player: MonthlyPlayer; change: number } =>
      Boolean(item),
    )
    .sort(
      (left, right) =>
        right.change - left.change || byStrength(left.player, right.player),
    );

  let mostImproved: MonthlyHighlights["mostImproved"] = null;
  if (improvements.length > 0 && improvements[0].change > 0) {
    mostImproved = improvements[0];
  } else {
    // No history to compare against yet: best scoring margin outside the champion.
    const fallback = [...pool]
      .filter((player) => player.id !== champion.id)
      .sort((a, b) => b.diffPerMatch - a.diffPerMatch || byStrength(a, b))[0];
    if (fallback) mostImproved = { player: fallback, change: null };
  }

  const taken = new Set([champion.id, mostImproved?.player.id]);
  const dontSleepOn =
    [...pool]
      .filter((player) => !taken.has(player.id))
      .sort((a, b) => b.diffPerMatch - a.diffPerMatch || byStrength(a, b))[0] ??
    null;

  const duoScore = (player: MonthlyPlayer) =>
    player.winRate * 100 + player.diffPerMatch;
  const ranked = [...pool].sort(
    (a, b) => duoScore(b) - duoScore(a) || byStrength(a, b),
  );
  const duo: MonthlyHighlights["duo"] =
    ranked.length >= 2 ? [ranked[0], ranked[1]] : null;

  return {
    monthLabel,
    sessions: sessions.length,
    matches: Math.max(
      0,
      rankings.reduce((max, player) => Math.max(max, player.matches), 0),
    ) + thisMonthArchive.reduce((sum, entry) => sum + entry.totalMatches, 0),
    champion,
    mostImproved,
    dontSleepOn,
    duo,
  };
}
