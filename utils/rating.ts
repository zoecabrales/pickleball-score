// A local, DUPR-style rating estimate. It is NOT the official DUPR algorithm
// and never talks to DUPR; it only shows roughly where a player might land.

export type RatingMode = "singles" | "doubles";

export type RatingPoint = { day: string; rating: number };

export type ModeRating = {
  rating: number;
  matches: number;
  history: RatingPoint[];
};

export type PlayerRating = {
  id: string;
  name: string;
  singles: ModeRating;
  doubles: ModeRating;
};

export type RatingBook = Record<string, PlayerRating>;

export type RatedMatch = {
  sideA: string[];
  sideB: string[];
  scoreA: number;
  scoreB: number;
};

export const START_RATING = 3.5;
export const MIN_RATING = 2;
export const MAX_RATING = 8;
export const PROVISIONAL_MATCHES = 8;

// A 0.75 rating gap means roughly a 10-to-1 expected win edge.
const SCALE = 0.75;
const K_START = 0.3;
const K_FLOOR = 0.06;
const HISTORY_LIMIT = 30;
// Share of the result that comes from the win itself; the rest is the point margin.
const RESULT_WEIGHT = 0.5;

const clamp = (value: number) => Math.min(MAX_RATING, Math.max(MIN_RATING, value));

const round3 = (value: number) => Math.round(value * 1000) / 1000;

const emptyMode = (): ModeRating => ({
  rating: START_RATING,
  matches: 0,
  history: [],
});

export function getPlayerKey(name: string) {
  return name.trim().toLocaleLowerCase();
}

// New players move fast, then settle as their match count grows.
function kFactor(matches: number) {
  return Math.max(K_FLOOR, K_START / (1 + matches / 5));
}

function expectedScore(ownRating: number, opponentRating: number) {
  return 1 / (1 + Math.pow(10, (opponentRating - ownRating) / SCALE));
}

function recordPoint(
  history: RatingPoint[],
  day: string,
  rating: number,
): RatingPoint[] {
  const last = history[history.length - 1];
  const next =
    last && last.day === day
      ? [...history.slice(0, -1), { day, rating }]
      : [...history, { day, rating }];
  return next.slice(-HISTORY_LIMIT);
}

export function applyMatchToRatings(
  book: RatingBook,
  match: RatedMatch,
  day: string,
): RatingBook {
  const mode: RatingMode | null =
    match.sideA.length === 1 && match.sideB.length === 1
      ? "singles"
      : match.sideA.length === 2 && match.sideB.length === 2
        ? "doubles"
        : null;
  const totalPoints = match.scoreA + match.scoreB;
  if (!mode || totalPoints <= 0 || match.scoreA === match.scoreB) return book;

  const next: RatingBook = { ...book };
  const entryFor = (rawName: string): PlayerRating => {
    const name = rawName.trim();
    const id = getPlayerKey(name);
    return (
      next[id] ?? { id, name, singles: emptyMode(), doubles: emptyMode() }
    );
  };

  const teamA = match.sideA.map(entryFor);
  const teamB = match.sideB.map(entryFor);
  const average = (team: PlayerRating[]) =>
    team.reduce((sum, player) => sum + player[mode].rating, 0) / team.length;

  const expectedA = expectedScore(average(teamA), average(teamB));
  const resultA = match.scoreA > match.scoreB ? 1 : 0;
  const actualA =
    RESULT_WEIGHT * resultA + (1 - RESULT_WEIGHT) * (match.scoreA / totalPoints);

  const update = (team: PlayerRating[], surprise: number) => {
    team.forEach((player) => {
      const current = player[mode];
      const rating = round3(
        clamp(current.rating + kFactor(current.matches) * surprise),
      );
      next[player.id] = {
        ...player,
        [mode]: {
          rating,
          matches: current.matches + 1,
          history: recordPoint(current.history, day, rating),
        },
      };
    });
  };

  update(teamA, actualA - expectedA);
  update(teamB, expectedA - actualA);
  return next;
}

// Movement over the latest session: the last saved rating versus the one before it.
export function getRatingChange(mode: ModeRating): number {
  if (mode.history.length === 0) return 0;
  const latest = mode.history[mode.history.length - 1].rating;
  const previous =
    mode.history.length > 1
      ? mode.history[mode.history.length - 2].rating
      : START_RATING;
  return round3(latest - previous);
}

export function isProvisional(mode: ModeRating) {
  return mode.matches < PROVISIONAL_MATCHES;
}

export function formatRating(rating: number) {
  return rating.toFixed(3);
}

export function formatRatingChange(change: number) {
  if (Math.abs(change) < 0.0005) return "0.000";
  return `${change > 0 ? "+" : "−"}${Math.abs(change).toFixed(3)}`;
}

export function getRatedPlayers(book: RatingBook, mode: RatingMode) {
  return Object.values(book)
    .filter((player) => player[mode].matches > 0)
    .sort(
      (left, right) =>
        right[mode].rating - left[mode].rating ||
        right[mode].matches - left[mode].matches ||
        left.name.localeCompare(right.name),
    );
}

function sanitizeMode(value: unknown): ModeRating {
  if (!value || typeof value !== "object") return emptyMode();
  const raw = value as Partial<ModeRating>;
  const rating =
    typeof raw.rating === "number" && Number.isFinite(raw.rating)
      ? clamp(raw.rating)
      : START_RATING;
  const matches =
    typeof raw.matches === "number" && raw.matches > 0
      ? Math.floor(raw.matches)
      : 0;
  const history = Array.isArray(raw.history)
    ? raw.history
        .filter(
          (point): point is RatingPoint =>
            Boolean(point) &&
            typeof point.day === "string" &&
            typeof point.rating === "number" &&
            Number.isFinite(point.rating),
        )
        .slice(-HISTORY_LIMIT)
    : [];
  return { rating, matches, history };
}

// Saved data comes from disk, so rebuild every entry rather than trusting its shape.
export function sanitizeRatingBook(value: unknown): RatingBook {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const book: RatingBook = {};
  Object.values(value as Record<string, unknown>).forEach((entry) => {
    if (!entry || typeof entry !== "object") return;
    const raw = entry as Partial<PlayerRating>;
    if (typeof raw.name !== "string" || !raw.name.trim()) return;
    const id = getPlayerKey(raw.name);
    book[id] = {
      id,
      name: raw.name.trim(),
      singles: sanitizeMode(raw.singles),
      doubles: sanitizeMode(raw.doubles),
    };
  });
  return book;
}
