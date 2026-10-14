# Pickle Scorer

Pickle Scorer is a mobile app for scoring pickleball matches and keeping track of how a group of players performs over a session. It works fully offline and stores everything on the device. No account, internet connection, or server is required.

## Purpose

Pickleball groups often rely on paper, memory, or chat messages to keep score and decide who plays next. This leads to disputes about the score or the server, uneven playing time, and no clear record of who is playing well.

Pickle Scorer addresses three needs:

1. Score a match correctly, including serve order and win conditions.
2. Keep a record of results for the people playing today.
3. Suggest fair and balanced teams for the next game.

It is a scorekeeper and session tracker. It is not a rating service and does not connect to external systems such as DUPR.

## Who it is for

Pickle Scorer is intended for casual groups, clubs, open-play organizers, and friends who play together regularly and want a simple way to track games without setting up an online service.

### Beginners

- Handles the scoring rules so players do not need to memorize them. In doubles, only the serving side can score, a lost rally moves the serve to the second server and then to a side out, and a game ends when a side reaches the target score while ahead.
- Includes a short first-launch guide and a hint card on the Play tab that explains the next step.
- Starts new players with a neutral record, and marks their results as provisional until they have played enough games.

### Intermediate players

- Records every finished match automatically, so wins, losses, and win rate are always current.
- Shows a ladder of individual rankings for the session.
- Tracks doubles partnerships and shows which duos win most often.
- Supports the option to extend a game when the score is tied one point before the target (11 to 15, or 15 to 21).

### Advanced players

- Provides a tournament mode that builds balanced doubles lineups, pairing stronger players with developing ones so games stay competitive.
- Prioritizes players who have played the fewest games, so everyone gets similar court time.
- Keeps archives of past sessions, so results can be compared over time.
- Uses a transparent, rule-based ranking that players can verify themselves.

## Features

### Play

- Singles and doubles scoring.
- Serve tracking for doubles, including first and second server and side outs.
- Games start at a target of 11 and can be extended to 15 and then 21.
- Point undo for correcting mistakes.
- Automatic saving of each finished match to the rankings.
- Session mode, where players are entered or chosen manually.
- Tournament mode, where lineups are generated automatically from the roster.

### Players

- A roster of registered players that persists between sessions.
- Duplicate name detection that ignores letter case and extra spaces.
- A Ready or Not ready toggle for each player, so tournament lineups only include people who are actually present.
- A collapsible player list and a Top duos section for doubles partnerships.

### Rankings

- A ladder ordered by win rate, then total wins, then name.
- Shared ranks when players have identical records.
- A save and reset action that archives the current session and starts a fresh one while keeping the roster.
- Automatically archives the current ladder and starts a fresh ranking day after local midnight, including when the app is reopened later.
- An archive of previous sessions.

### Dashboard and settings

- A summary of the current leader or tied leaders, registered players, and total matches.
- A replay option for the welcome guide.
- A control to erase all local data.

## How the tournament lineup works

1. Only players marked Ready are considered.
2. In the first round, no one has a record, so players are assigned to teams at random.
3. After that, players who have played the fewest games are selected first.
4. Among the selected players, the strongest is partnered with the developing player so that teams are balanced.

## How rankings work

Players are ordered by win rate (wins divided by matches played). Ties are broken by total wins, and then alphabetically by name. Players with identical wins and matches share the same rank, for example 1, 1, 2.

Rankings are based on results within a session and reset when the session is saved or the local calendar day ends. If the app is closed at midnight, it saves and resets the ladder the next time the app is opened. This keeps the ladder meaningful for the group playing that day. Win rate becomes more reliable as players complete more games; a handful of games gives an early indication, and ten or more gives a better picture.

## Privacy and data

All data is stored locally on the device using the platform's local storage. Nothing is uploaded. Erasing all data from the settings screen removes the roster, rankings, duos, archives, and saved preferences.

## Technology

- Expo SDK 57 and React Native
- Expo Router for navigation
- TypeScript
- AsyncStorage for local persistence

## Getting started

Requirements: Node.js and npm.

```bash
npm install
npx expo start
```

Useful commands:

```bash
npx expo lint        # lint
npx tsc --noEmit     # type check
```

Some features may need a development build rather than Expo Go:

```bash
npx expo run:ios
npx expo run:android
```

### Building with EAS

```bash
npx eas-cli@latest build --platform android --profile preview
```

This produces an installable Android APK using the preview profile defined in `eas.json`.

## Project structure

```
app/            Screens and navigation (Expo Router)
components/     Shared UI components
context/        Ranking, theme, and guide state
utils/          Scoring, ranking, and lineup logic
constants/      Shared constants
assets/         Images and icons
```

## Limitations

- Data lives on a single device and is not synchronized between phones.
- Ratings are not opponent-aware, so a win against a strong team counts the same as a win against a weaker one.
- Individual match history is not stored beyond aggregated results.

## License

See the [LICENSE](./LICENSE) file.
