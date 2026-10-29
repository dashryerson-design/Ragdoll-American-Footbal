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
| `offline.test.js` | the account screen with Firebase unreachable (no emulator needed) |

`PW` can point at a Playwright install if `require('playwright')` does not resolve.
