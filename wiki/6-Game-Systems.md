# Game Systems
Relevant source files
- [src/scenes/BootScene.js](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/scenes/BootScene.js)
- [src/systems/AudioManager.js](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/systems/AudioManager.js)
- [src/systems/BitmapFontParser.js](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/systems/BitmapFontParser.js)
- [src/systems/ColorManager.js](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/systems/ColorManager.js)
- [src/systems/GameState.js](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/systems/GameState.js)

The supporting systems in `gdweb` operate alongside the main physics and rendering loops to manage the global state, audio synchronization, dynamic color palettes, and high-performance text rendering. These systems are designed to be modular, allowing the `GameScene` to orchestrate complex behaviors like audio-reactive visuals and tweened background transitions without bloating the core physics logic.

### System Architecture Overview

The following diagram illustrates how the core system classes relate to the `GameScene` and their respective data structures.

**System-to-Entity Mapping**

Sources: [src/systems/AudioManager.js4-16](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/systems/AudioManager.js#L4-L16)[src/systems/ColorManager.js42-56](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/systems/ColorManager.js#L42-L56)[src/systems/GameState.js4-30](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/systems/GameState.js#L4-L30)[src/systems/BitmapFontParser.js8-18](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/systems/BitmapFontParser.js#L8-L18)

---

### GameState & GameObject

The `GameState` class acts as the single source of truth for the player's physical status and environment interaction. It tracks variables such as `yVelocity`, `onGround`, `gravityFlipped`, and `isDead`[src/systems/GameState.js8-29](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/systems/GameState.js#L8-L29) Complementing this is the `GameObject` schema, which defines the hitboxes used for collision detection [src/systems/GameState.js55-64](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/systems/GameState.js#L55-L64)

Additionally, this module provides utility functions for the asset pipeline, such as `findAtlasFrame` and `createImageFromAtlas`, which abstract the process of fetching textures from the `GJ_WebSheet` atlas [src/systems/GameState.js34-52](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/systems/GameState.js#L34-L52)

For details, see [GameState & GameObject (#6.1)](https://github.com/brokemutt/gdweb/blob/1c1d347a/GameState & GameObject (#6.1))

---

### Audio Manager

The `AudioClass` handles music playback, sound effects, and a sophisticated Web Audio API metering system. It uses an `AnalyserNode` to process real-time frequency data from `StereoMadness.mp3`[src/systems/AudioManager.js92-99](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/systems/AudioManager.js#L92-L99) This data is converted into a `meterValue` that decays or peaks based on the audio's amplitude [src/systems/AudioManager.js118-134](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/systems/AudioManager.js#L118-L134)

**Audio Metering Logic**

Sources: [src/systems/AudioManager.js92-114](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/systems/AudioManager.js#L92-L114)[src/systems/AudioManager.js118-135](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/systems/AudioManager.js#L118-L135)

For details, see [Audio Manager (#6.2)](https://github.com/brokemutt/gdweb/blob/1c1d347a/Audio Manager (#6.2))

---

### Color Manager

The `ColorManager` facilitates the iconic Geometry Dash color pulses and transitions. It maintains the current RGB values for the background (`ID_BACKGROUND_COLOR`) and ground (`ID_GROUND_COLOR`) [src/systems/ColorManager.js6-7](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/systems/ColorManager.js#L6-L7) When a color trigger is encountered in the level data, `triggerColor` initiates a `ColorTransition` that LERPs (linearly interpolates) the colors over a specified duration [src/systems/ColorManager.js59-66](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/systems/ColorManager.js#L59-L66)

| Constant | Default RGB | Role |
| --- | --- | --- |
| `ID_BACKGROUND_COLOR` | `(0, 102, 255)` | Main scene background tint |
| `ID_GROUND_COLOR` | `(0, 68, 170)` | Floor and ceiling tile tint |

Sources: [src/systems/ColorManager.js47-55](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/systems/ColorManager.js#L47-L55)[src/systems/ColorManager.js9-23](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/systems/ColorManager.js#L9-L23)

For details, see [Color Manager (#6.3)](https://github.com/brokemutt/gdweb/blob/1c1d347a/Color Manager (#6.3))

---

### Bitmap Font Parser

Because standard web fonts are insufficient for the game's stylized UI, `gdweb` includes a custom `BitmapFontParser`. During the `BootScene`, it reads AngelCode `.fnt` files and maps them to the `bigFont` and `goldFont` textures [src/scenes/BootScene.js63-66](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/scenes/BootScene.js#L63-L66) The parser calculates UV coordinates for every character and registers them as individual frames within the Phaser texture cache [src/systems/BitmapFontParser.js47-74](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/systems/BitmapFontParser.js#L47-L74)

For details, see [Bitmap Font Parser (#6.4)](https://github.com/brokemutt/gdweb/blob/1c1d347a/Bitmap Font Parser (#6.4))

---

**Sources:**

- [src/systems/AudioManager.js4-147](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/systems/AudioManager.js#L4-L147)
- [src/systems/ColorManager.js6-90](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/systems/ColorManager.js#L6-L90)
- [src/systems/GameState.js4-66](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/systems/GameState.js#L4-L66)
- [src/systems/BitmapFontParser.js8-92](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/systems/BitmapFontParser.js#L8-L92)
- [src/scenes/BootScene.js37-66](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/scenes/BootScene.js#L37-L66)