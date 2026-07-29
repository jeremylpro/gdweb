# Visual Effects
Relevant source files
- [assets/GJ_WebSheet.png](https://github.com/brokemutt/gdweb/blob/1c1d347a/assets/GJ_WebSheet.png)
- [src/effects.js](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/effects.js)
- [src/scenes/GameScene.js](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/scenes/GameScene.js)

This section documents the visual feedback systems in `gdweb`, specifically focusing on procedural graphics and particle bursts used during level progression and completion. These effects are managed primarily through `src/effects.js` and integrated into the `GameScene` pipeline.

## Overview

The visual effects system provides high-fidelity feedback for player achievements and environmental interactions. It utilizes a combination of Phaser 3's `Graphics` object for procedural shapes (circles/rings) and the `ParticleEmitter` class for sprite-based bursts.

Key characteristics include:

- **Depth Layering**: Effects are strictly layered above world objects but below UI elements, typically using depth 55 for graphics and 57 for particles [src/effects.js19-92](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/effects.js#L19-L92)
- **Blend Modes**: Most effects utilize `BLEND_ADD` to create a "glowing" or "vibrant" aesthetic consistent with the Geometry Dash style [src/effects.js20-82](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/effects.js#L20-L82)
- **Lifecycle Management**: Procedural effects are designed to be "fire-and-forget," utilizing tweens with `onComplete` destruction handlers [src/effects.js46](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/effects.js#L46-L46)

### Visual System Architecture

The following diagram illustrates the relationship between the effect triggers in `GameScene` and the utility functions in `effects.js`.

**Effect Trigger Flow**

Sources: [src/scenes/GameScene.js12](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/scenes/GameScene.js#L12-L12)[src/effects.js16-95](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/effects.js#L16-L95)

---

## Procedural Circle Effects

The `emitCircleEffect` function generates expanding circles or rings. It is highly configurable, allowing for filled shapes or strokes, and custom easing functions.

- **Easing**: Uses `Quad.Out` for filled circles to simulate a rapid expansion that slows down, or `Linear` for rings [src/effects.js32](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/effects.js#L32-L32)
- **Alpha Control**: Supports a `pingPong` mode where the alpha fades in and then out, calculated based on the tween progress [src/effects.js35](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/effects.js#L35-L35)
- **Rendering**: Uses `thisGraphics.fillCircle` or `thisGraphics.strokeCircle` (with a line width of 4) depending on the `filled` boolean [src/effects.js38-44](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/effects.js#L38-L44)

| Parameter | Type | Description |
| --- | --- | --- |
| `filled` | Boolean | If true, renders a solid circle; if false, renders a ring [src/effects.js12](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/effects.js#L12-L12) |
| `pingPong` | Boolean | If true, alpha peaks at 0.5 progress and fades back to 0 [src/effects.js35](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/effects.js#L35-L35) |
| `duration` | Number | Lifetime of the effect in milliseconds [src/effects.js11](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/effects.js#L11-L11) |

Sources: [src/effects.js16-48](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/effects.js#L16-L48)

---

## Win Burst Sequence

The `emitWinBurst` function is a composite effect triggered when the player successfully completes a level. It combines a large procedural circle with a particle explosion.

- **Randomization**: The burst is placed randomly within the viewport, constrained by a 200px margin [src/effects.js52-54](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/effects.js#L52-L54)
- **Particle Configuration**: Spawns 25 particles using the `square.png` frame from the `GJ_WebSheet` atlas [src/effects.js59-81](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/effects.js#L59-L81)
- **Motion**: Particles move at high speeds (520–920 units) in all directions (0–360 degrees) with a shrinking scale from 0.4 to 0.13 [src/effects.js61-71](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/effects.js#L61-L71)

**Entity Association: Win Sequence**

Sources: [src/effects.js51-93](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/effects.js#L51-L93)

---

## Integration in GameScene

Visual effects are integrated into the `GameScene` completion pipeline. When the player touches the end portal, `_levelComplete` is called, which initiates the first circle effect [src/scenes/GameScene.js12-52](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/scenes/GameScene.js#L12-L52) Later, during the "Level Complete" text animation, `emitWinBurst` is triggered to provide celebratory feedback.

For details on the specific particle emitters used for player movement (exhaust, sliding, and death), see [Particle Systems & Depth Layering](/brokemutt/gdweb/7.1-particle-systems-and-depth-layering).

### Child Pages

- [Particle Systems & Depth Layering](/brokemutt/gdweb/7.1-particle-systems-and-depth-layering) — Detailed documentation of all `Phaser.GameObjects.Particles` instances, including player trails and environmental effects.

Sources: [src/scenes/GameScene.js12](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/scenes/GameScene.js#L12-L12)[src/effects.js1-96](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/effects.js#L1-L96)