# Account system tests (local emulators only)

These never touch the real Firebase project. They need Java 21+, Node 18+, and (installed outside this repo) `firebase-tools`, `@firebase/rules-unit-testing`, `firebase@10.12.2` and Playwright with Chromium.

From the `firebase/` folder:

```bash
# security rules (54 cases)
npx firebase emulators:exec --only firestore --project demo-paf "node rules.test.mjs"
# the game's account screen in a real browser, against the Auth + Firestore emulators
PAF_LIBS=/path/to/folder-with-three.min.js-and-cannon.min.js NODE_PATH=/path/to/node_modules \
  npx firebase emulators:exec --only auth,firestore --project paf-accounts "node tests/conflict.test.js"
```

| file | covers |
|---|---|
| `account.test.js` | sign-up, username rules and uniqueness, email verification, sign-in/out, password reset, account deletion |
| `cloud.test.js` | upload, split saves, download, revision check, damaged saves, cloud delete, sign-in moving nothing |
| `conflict.test.js` | two devices: conflict screen, keep cloud / local / both, cancel, no free slot, concurrent uploads, races, interrupted uploads and deletion, quota, offline, hostile cloud fields, newer save format |
| `google.test.js` | Google sign-in: first-time setup, username suggestion and conflicts, linking to an email account, email collisions, a Google login owned by another account, sign-out/in, deletion, failures, offline. The pop-up itself is replaced by the same Firebase call with an emulator token (the real pop-up needs apis.google.com) |
| `exhibition.test.js` | career ids (added byte-for-byte, stable, duplicates split) and Exhibition data (read-only player copies, separate stats, no XP); no emulator needed |
| `exhibition-play.test.js` | Exhibition match end to end: menu, picker, real build, results, record, career byte-identical, quitting records nothing, career match still awards XP; no emulator needed |
| `online.test.js` | Online play with two separate browser contexts and accounts over a real WebRTC connection: lobby (host, join, leave, rejoin), online 1v1 Runs (guest = red WR/CB, reps, same score on both, forged guest messages ignored, first to 5, results), online Exhibition (guest's own career club roster, host and guest play calling with "Opponent Choosing Play", guest QB aims and throws, ball mirrored), dropped connection with hold + reconnect, a stranger refused, save integrity. Prints latency / snapshot size |
| `runs.test.js` | 1v1 Runs: mode picker in and out, Team Play list unchanged, best non-QB of each club by `ovr()`, QB builds blocked, WR / man-cover CB roles and AI QB, real reps with roles alternating, catches only from the game reception event, first to 5 (both sides), quitting, Team Play afterwards; no emulator needed (slow: plays real reps) |
| `music.test.js` | Menu music: starts on the main menu, keeps playing (same track, no restart) through submenus, silent from kickoff to the final whistle in every mode, resumes after, one audio element after repeated matches, tracks alternate when one ends, blocked autoplay starts on the first click; no emulator needed |
| `friends.test.js` | Friends + profile look with two accounts: request + accept, notification, no presence, friend's profile (avatar, calling card, Exhibition / 1v1 Runs stats, nothing private), saving a look, rules (own profile only, built-in ids only), account deletion cleanup |
| `progression.test.js` | Account Level: 100-level reward table + XP curve, XP only at real final whistles (once per match, capped, nothing for short or quit matches), level-up reveal, ownership vs equipped, Locker tab, cosmetics only on your own player (gloves; ball trail on your throw, none on an AI QB throw), Progression page; no emulator |
| `progression-cloud.test.js` | Account Level on an account: guest XP carried into a new account and uploaded in rule-sized steps, equipped items synced, same level on a second device, a tampered jump refused, public level |
| `offline.test.js` | the account screen with Firebase unreachable (no emulator needed) |

`PW` can point at a Playwright install if `require('playwright')` does not resolve.
