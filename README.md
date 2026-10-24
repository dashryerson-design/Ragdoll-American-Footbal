# Physics Based Boxing (PBB)

Active-ragdoll boxing in the browser. Both fighters are full physics ragdolls driven by muscles (PD controllers), so every punch, stagger and knockdown is simulated rather than animated.

**Play:** open `index.html` in a browser (three.js and cannon.js load from cdnjs).

Built on the engine from Ragdoll Shooters: the same ragdoll bodies and joints, muscle controllers, joint limits, gait and foot-planting walker, per-doll state swapping, and recorded sound clips (impacts, grunts, body falls, footsteps, breathing).

## What's in it
- A raised ring with bouncy ropes, corner posts, a lighting rig and a crowd that reacts to big shots
- Jab, cross, lead hook and rear uppercut; high block; duck
- Damage depends on where the glove lands and how fast it was really moving. Head shots stagger, body shots drain stamina, counters hit harder
- Stamina: punching tires you, and a tired fighter punches softer and moves slower
- Knockdowns: the body goes limp and the referee counts to 10. Mash Space to beat the count. Three knockdowns is a TKO
- Rounds (1, 3 or 5) with a 10-point-must judges' decision if it goes the distance
- Four AI opponents from Easy to Insane
- Keyboard/mouse and touch controls

## Controls
| Action | Keyboard / mouse | Touch |
|---|---|---|
| Move | WASD / arrows | joystick |
| Jab (lead hand) | Left click / J | JAB |
| Cross (rear hand) | Right click / K | CROSS |
| Lead hook | Q / U | HOOK |
| Rear uppercut | E / I | UPPER |
| Block (hold) | Shift / L | BLOCK |
| Duck (hold) | Space | DUCK |
| Get up when down | mash Space | mash DUCK / UP |
| Pause | P / Esc | II |

## Development
The source is `src/pbb.html`. The recorded sound clips (base64) live in `src/sounds.js` so the code stays readable.
Run `./build.sh` to produce `index.html`; commit both.
