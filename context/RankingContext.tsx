import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, Alert } from "react-native";
import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
  applyMatchToRatings,
  sanitizeRatingBook,
  type RatingBook,
} from "@/utils/rating";

type Side = "a" | "b";

export type PlayerStats = {
  id: string;
  name: string;
  matches: number;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
};

export type PairStats = {
  id: string;
  names: [string, string];
  matches: number;
  wins: number;
  losses: number;
};

export type RankingArchive = {
  id: string;
  savedAt: string;
  totalMatches: number;
  rankings: PlayerStats[];
  duos?: PairStats[];
};

type MatchPlayers = {
  sideA: string[];
  sideB: string[];
  scoreA: number;
  scoreB: number;
};

type RankingContextValue = {
  rankings: PlayerStats[];
  duos: PairStats[];
  rankingArchive: RankingArchive[];
  ratings: RatingBook;
  registeredPlayers: string[];
  absentPlayers: string[];
  totalMatches: number;
  isLoaded: boolean;
  setPlayerPresent: (name: string, present: boolean) => Promise<void>;
  addRegisteredPlayer: (name: string) => Promise<boolean>;
  removeRegisteredPlayer: (name: string) => Promise<void>;
  recordMatch: (match: MatchPlayers) => Promise<void>;
  resetRankings: () => Promise<void>;
  wipeAllData: () => Promise<void>;
  wipeCount: number;
};

const STORAGE_KEY = "pickleball-score:individual-rankings:v1";
// Ratings outlive daily ladder resets, so they are stored separately.
const RATINGS_STORAGE_KEY = "pickleball-score:ratings:v1";
const RankingContext = createContext<RankingContextValue | null>(null);

function getLocalDayKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDayArchiveDate(dayKey: string) {
  const [year, month, day] = dayKey.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

function getPlayerId(name: string) {
  return name.trim().toLocaleLowerCase();
}

function getUniquePlayerNames(names: string[]) {
  const byId = new Map<string, string>();
  names.forEach((rawName) => {
    const name = rawName.trim();
    if (name) byId.set(getPlayerId(name), name);
  });
  return [...byId.values()].sort((left, right) => left.localeCompare(right));
}

export function RankingProvider({ children }: { children: ReactNode }) {
  const [rankings, setRankings] = useState<PlayerStats[]>([]);
  const [duos, setDuos] = useState<PairStats[]>([]);
  const [rankingArchive, setRankingArchive] = useState<RankingArchive[]>([]);
  const [ratings, setRatings] = useState<RatingBook>({});
  const [registeredPlayers, setRegisteredPlayers] = useState<string[]>([]);
  const [absentPlayers, setAbsentPlayers] = useState<string[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [ratingsLoaded, setRatingsLoaded] = useState(false);
  const [activeDay, setActiveDay] = useState(() =>
    getLocalDayKey(new Date()),
  );
  const [currentDay, setCurrentDay] = useState(() =>
    getLocalDayKey(new Date()),
  );
  const [rolloverFailed, setRolloverFailed] = useState(false);
  const isLoaded =
    hasLoaded &&
    ratingsLoaded &&
    (currentDay <= activeDay || rolloverFailed);
  const [wipeCount, setWipeCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    AsyncStorage.getItem(RATINGS_STORAGE_KEY)
      .then((stored) => {
        if (stored && isMounted) {
          setRatings(sanitizeRatingBook(JSON.parse(stored)));
        }
      })
      .catch(() => {
        // Ratings are an estimate, so unreadable data simply starts fresh.
      })
      .finally(() => {
        if (isMounted) setRatingsLoaded(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!stored) return;
        const parsed: unknown = JSON.parse(stored);
        if (isMounted && Array.isArray(parsed)) {
          setRankings(parsed as PlayerStats[]);
          setRegisteredPlayers(
            getUniquePlayerNames(
              parsed.map((player) => (player as PlayerStats).name),
            ),
          );
          setTotalMatches(
            Math.max(
              0,
              ...parsed.map((player) => (player as PlayerStats).matches),
            ),
          );
        } else if (isMounted && parsed && typeof parsed === "object") {
          const saved = parsed as {
            rankings?: unknown;
            totalMatches?: unknown;
            rankingArchive?: unknown;
            registeredPlayers?: unknown;
            duos?: unknown;
            absentPlayers?: unknown;
            rankingDay?: unknown;
          };
          if (Array.isArray(saved.absentPlayers)) {
            setAbsentPlayers(
              saved.absentPlayers.filter(
                (name): name is string => typeof name === "string",
              ),
            );
          }
          if (
            typeof saved.rankingDay === "string" &&
            /^\d{4}-\d{2}-\d{2}$/.test(saved.rankingDay) &&
            getLocalDayKey(getDayArchiveDate(saved.rankingDay)) ===
              saved.rankingDay
          ) {
            setActiveDay(saved.rankingDay);
          }
          if (Array.isArray(saved.duos)) {
            setDuos(saved.duos as PairStats[]);
          }
          const savedRankings = Array.isArray(saved.rankings)
            ? (saved.rankings as PlayerStats[])
            : [];
          const savedArchive = Array.isArray(saved.rankingArchive)
            ? (saved.rankingArchive as RankingArchive[])
            : [];
          if (Array.isArray(saved.rankings)) {
            setRankings(savedRankings);
          }
          if (typeof saved.totalMatches === "number") {
            setTotalMatches(saved.totalMatches);
          }
          if (Array.isArray(saved.rankingArchive)) {
            setRankingArchive(savedArchive);
          }
          const savedPlayers = Array.isArray(saved.registeredPlayers)
            ? saved.registeredPlayers.filter(
                (name): name is string => typeof name === "string",
              )
            : [];
          setRegisteredPlayers(
            getUniquePlayerNames([
              ...savedPlayers,
              ...savedRankings.map((player) => player.name),
              ...savedArchive.flatMap((archive) =>
                archive.rankings.map((player) => player.name),
              ),
            ]),
          );
        }
      })
      .catch(() => {
        // A corrupted local value should not prevent a new offline season.
      })
      .finally(() => {
        if (isMounted) setHasLoaded(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let isMounted = true;

    const updateCurrentDay = () => {
      const nextDay = getLocalDayKey(new Date());
      setCurrentDay(nextDay);
      setRolloverFailed(false);
    };

    const scheduleMidnightCheck = () => {
      const now = new Date();
      const nextMidnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
      );
      timer = setTimeout(() => {
        if (!isMounted) return;
        updateCurrentDay();
        scheduleMidnightCheck();
      }, nextMidnight.getTime() - now.getTime() + 50);
    };

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") updateCurrentDay();
    });
    scheduleMidnightCheck();

    return () => {
      isMounted = false;
      clearTimeout(timer);
      subscription.remove();
    };
  }, []);

  const archiveAndResetRankings = useCallback(
    async (savedAt: Date, nextDay: string) => {
      const nextArchive =
        rankings.length > 0 || totalMatches > 0
          ? [
              {
                id: new Date().toISOString(),
                savedAt: savedAt.toISOString(),
                rankings: rankings.map((player) => ({ ...player })),
                duos: duos.map((duo) => ({ ...duo })),
                totalMatches,
              },
              ...rankingArchive,
            ]
          : rankingArchive;

      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          rankings: [],
          duos: [],
          registeredPlayers,
          totalMatches: 0,
          rankingArchive: nextArchive,
          absentPlayers,
          rankingDay: nextDay,
        }),
      );
      setRankings([]);
      setDuos([]);
      setRankingArchive(nextArchive);
      setTotalMatches(0);
      setActiveDay(nextDay);
    },
    [
      rankings,
      totalMatches,
      duos,
      rankingArchive,
      registeredPlayers,
      absentPlayers,
    ],
  );

  useEffect(() => {
    if (!hasLoaded || currentDay <= activeDay || rolloverFailed) {
      return;
    }

    let isMounted = true;
    void archiveAndResetRankings(getDayArchiveDate(activeDay), currentDay)
      .catch(() => {
        if (!isMounted) return;
        setRolloverFailed(true);
        Alert.alert(
          "Could not save previous rankings",
          "Your current ladder is still available. Reopen the app to retry, or use Save Today & Start Fresh.",
        );
      });

    return () => {
      isMounted = false;
    };
  }, [
    hasLoaded,
    activeDay,
    currentDay,
    rolloverFailed,
    archiveAndResetRankings,
  ]);

  const recordMatch = useCallback(
    async (match: MatchPlayers) => {
      const byId = new Map(
        rankings.map((player) => [player.id, { ...player }]),
      );
      const winningSide: Side = match.scoreA > match.scoreB ? "a" : "b";

      const updatePlayers = (names: string[], side: Side) => {
        const won = side === winningSide;
        const pointsFor = side === "a" ? match.scoreA : match.scoreB;
        const pointsAgainst = side === "a" ? match.scoreB : match.scoreA;

        names.forEach((rawName) => {
          const name = rawName.trim();
          const id = getPlayerId(name);
          const current = byId.get(id) ?? {
            id,
            name,
            matches: 0,
            wins: 0,
            losses: 0,
            pointsFor: 0,
            pointsAgainst: 0,
          };

          byId.set(id, {
            ...current,
            name: current.name || name,
            matches: current.matches + 1,
            wins: current.wins + Number(won),
            losses: current.losses + Number(!won),
            pointsFor: current.pointsFor + pointsFor,
            pointsAgainst: current.pointsAgainst + pointsAgainst,
          });
        });
      };

      updatePlayers(match.sideA, "a");
      updatePlayers(match.sideB, "b");

      const duosById = new Map(
        duos.map((duo) => [duo.id, { ...duo }] as const),
      );
      const updateDuo = (names: string[], side: Side) => {
        if (names.length !== 2) return;
        const [first, second] = names
          .map((name) => name.trim())
          .sort((left, right) =>
            getPlayerId(left).localeCompare(getPlayerId(right)),
          );
        const id = `${getPlayerId(first)}|${getPlayerId(second)}`;
        const current = duosById.get(id) ?? {
          id,
          names: [first, second] as [string, string],
          matches: 0,
          wins: 0,
          losses: 0,
        };
        const won = side === winningSide;
        duosById.set(id, {
          ...current,
          matches: current.matches + 1,
          wins: current.wins + Number(won),
          losses: current.losses + Number(!won),
        });
      };
      updateDuo(match.sideA, "a");
      updateDuo(match.sideB, "b");
      const nextDuos = [...duosById.values()];

      const nextRankings = [...byId.values()].sort((left, right) => {
        const leftRate = left.matches ? left.wins / left.matches : 0;
        const rightRate = right.matches ? right.wins / right.matches : 0;
        return (
          rightRate - leftRate ||
          right.wins - left.wins ||
          left.name.localeCompare(right.name)
        );
      });
      const nextTotalMatches = totalMatches + 1;
      const nextRatings = applyMatchToRatings(ratings, match, activeDay);
      const nextRegisteredPlayers = getUniquePlayerNames([
        ...registeredPlayers,
        ...match.sideA,
        ...match.sideB,
      ]);

      setRankings(nextRankings);
      setDuos(nextDuos);
      setRatings(nextRatings);
      setRegisteredPlayers(nextRegisteredPlayers);
      setTotalMatches(nextTotalMatches);
      await AsyncStorage.multiSet([
        [RATINGS_STORAGE_KEY, JSON.stringify(nextRatings)],
        [
          STORAGE_KEY,
          JSON.stringify({
            rankings: nextRankings,
            duos: nextDuos,
            registeredPlayers: nextRegisteredPlayers,
            totalMatches: nextTotalMatches,
            rankingArchive,
            absentPlayers,
            rankingDay: activeDay,
          }),
        ],
      ]);
    },
    [
      rankings,
      duos,
      ratings,
      rankingArchive,
      registeredPlayers,
      absentPlayers,
      totalMatches,
      activeDay,
    ],
  );

  const addRegisteredPlayer = useCallback(
    async (rawName: string) => {
      const name = rawName.trim();
      if (!name) return false;
      const nextRegisteredPlayers = getUniquePlayerNames([
        ...registeredPlayers,
        name,
      ]);
      if (nextRegisteredPlayers.length === registeredPlayers.length) {
        return false;
      }

      // New players start Not ready so they don't join an in-progress tournament.
      const nextAbsent = [...absentPlayers, name];
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          rankings,
          duos,
          registeredPlayers: nextRegisteredPlayers,
          totalMatches,
          rankingArchive,
          absentPlayers: nextAbsent,
          rankingDay: activeDay,
        }),
      );
      setRegisteredPlayers(nextRegisteredPlayers);
      setAbsentPlayers(nextAbsent);
      return true;
    },
    [rankings, duos, registeredPlayers, absentPlayers, totalMatches, rankingArchive, activeDay],
  );

  const removeRegisteredPlayer = useCallback(
    async (rawName: string) => {
      const id = getPlayerId(rawName);
      const nextRegisteredPlayers = registeredPlayers.filter(
        (name) => getPlayerId(name) !== id,
      );
      if (nextRegisteredPlayers.length === registeredPlayers.length) return;

      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          rankings,
          duos,
          registeredPlayers: nextRegisteredPlayers,
          totalMatches,
          rankingArchive,
          absentPlayers,
          rankingDay: activeDay,
        }),
      );
      setRegisteredPlayers(nextRegisteredPlayers);
    },
    [rankings, duos, registeredPlayers, absentPlayers, totalMatches, rankingArchive, activeDay],
  );

  const setPlayerPresent = useCallback(
    async (rawName: string, present: boolean) => {
      const id = getPlayerId(rawName);
      const others = absentPlayers.filter((name) => getPlayerId(name) !== id);
      const nextAbsent = present ? others : [...others, rawName.trim()];
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          rankings,
          duos,
          registeredPlayers,
          totalMatches,
          rankingArchive,
          absentPlayers: nextAbsent,
          rankingDay: activeDay,
        }),
      );
      setAbsentPlayers(nextAbsent);
    },
    [rankings, duos, registeredPlayers, absentPlayers, totalMatches, rankingArchive, activeDay],
  );

  const resetRankings = useCallback(async () => {
    await archiveAndResetRankings(new Date(), currentDay);
  }, [archiveAndResetRankings, currentDay]);

  const wipeAllData = useCallback(async () => {
    await AsyncStorage.clear();
    setRankings([]);
    setDuos([]);
    setRankingArchive([]);
    setRatings({});
    setRegisteredPlayers([]);
    setAbsentPlayers([]);
    setTotalMatches(0);
    setActiveDay(currentDay);
    setWipeCount((count) => count + 1);
  }, [currentDay]);

  const value = useMemo(
    () => ({
      rankings,
      duos,
      rankingArchive,
      ratings,
      registeredPlayers,
      absentPlayers,
      setPlayerPresent,
      totalMatches,
      isLoaded,
      addRegisteredPlayer,
      removeRegisteredPlayer,
      recordMatch,
      resetRankings,
      wipeAllData,
      wipeCount,
    }),
    [
      rankings,
      duos,
      rankingArchive,
      ratings,
      registeredPlayers,
      absentPlayers,
      setPlayerPresent,
      totalMatches,
      isLoaded,
      addRegisteredPlayer,
      removeRegisteredPlayer,
      recordMatch,
      resetRankings,
      wipeAllData,
      wipeCount,
    ],
  );

  return (
    <RankingContext.Provider value={value}>{children}</RankingContext.Provider>
  );
}

export function useRankings() {
  const context = useContext(RankingContext);
  if (!context)
    throw new Error("useRankings must be used inside RankingProvider");
  return context;
}
