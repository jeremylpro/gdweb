# Assets Reference
Relevant source files
- [assets/1.txt](https://github.com/brokemutt/gdweb/blob/1c1d347a/assets/1.txt)
- [assets/GJ_WebSheet.json](https://github.com/brokemutt/gdweb/blob/1c1d347a/assets/GJ_WebSheet.json)
- [assets/GJ_WebSheet.png](https://github.com/brokemutt/gdweb/blob/1c1d347a/assets/GJ_WebSheet.png)
- [assets/GJ_square02.png](https://github.com/brokemutt/gdweb/blob/1c1d347a/assets/GJ_square02.png)
- [assets/StereoMadness.mp3](https://github.com/brokemutt/gdweb/blob/1c1d347a/assets/StereoMadness.mp3)
- [assets/bigFont.fnt](https://github.com/brokemutt/gdweb/blob/1c1d347a/assets/bigFont.fnt)
- [assets/bigFont.png](https://github.com/brokemutt/gdweb/blob/1c1d347a/assets/bigFont.png)
- [assets/endStart_02.ogg](https://github.com/brokemutt/gdweb/blob/1c1d347a/assets/endStart_02.ogg)
- [assets/explode_11.ogg](https://github.com/brokemutt/gdweb/blob/1c1d347a/assets/explode_11.ogg)
- [assets/game_bg_01_001.png](https://github.com/brokemutt/gdweb/blob/1c1d347a/assets/game_bg_01_001.png)
- [assets/goldFont.fnt](https://github.com/brokemutt/gdweb/blob/1c1d347a/assets/goldFont.fnt)
- [assets/goldFont.png](https://github.com/brokemutt/gdweb/blob/1c1d347a/assets/goldFont.png)
- [assets/highscoreGet02.ogg](https://github.com/brokemutt/gdweb/blob/1c1d347a/assets/highscoreGet02.ogg)
- [assets/playSound_01.ogg](https://github.com/brokemutt/gdweb/blob/1c1d347a/assets/playSound_01.ogg)
- [assets/quitSound_01.ogg](https://github.com/brokemutt/gdweb/blob/1c1d347a/assets/quitSound_01.ogg)
- [assets/sliderBar.png](https://github.com/brokemutt/gdweb/blob/1c1d347a/assets/sliderBar.png)
- [assets/square04_001.png](https://github.com/brokemutt/gdweb/blob/1c1d347a/assets/square04_001.png)

The `assets/` directory contains all external resources required to run **gdweb**, including the sprite atlas, bitmap fonts, audio files, and compressed level data. These assets are loaded into memory during the `BootScene` lifecycle to ensure smooth gameplay without runtime IO stutters.

## Asset Loading Lifecycle

All assets are queued and loaded in the `BootScene.preload` method. The scene uses a progress bar UI to track loading status before handing off control to the `GameScene`.

- **Texture Atlas**: `GJ_WebSheet.json` and `GJ_WebSheet.png`.
- **Fonts**: `bigFont` and `goldFont` (FNT + PNG).
- **Audio**: MP3 for music, OGG for sound effects.
- **Level Data**: `1.txt` (Compressed/Encoded).

Sources: [src/scenes/BootScene.js16-52](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/scenes/BootScene.js#L16-L52)

## Sprite Atlas (GJ_WebSheet)

The core of the game's visuals is the `GJ_WebSheet` texture atlas. It bundles hundreds of individual frames—including player icons, obstacles, UI buttons, and portal components—into a single image to optimize GPU performance.

- **Manifest**: `assets/GJ_WebSheet.json` defines the coordinates and dimensions for every frame (e.g., `GJ_logo_001.png`, `GJ_playBtn_001.png`).
- **Texture**: `assets/GJ_WebSheet.png` provides the raw pixel data.
- **Resolution**: System functions like `findAtlasFrame` and `createImageFromAtlas` are used throughout the codebase to fetch these frames by their filename keys.

For details, see [Sprite Atlas (GJ_WebSheet)](/brokemutt/gdweb/8.1-sprite-atlas-(gj_websheet)).

Sources: [assets/GJ_WebSheet.json1-137](https://github.com/brokemutt/gdweb/blob/1c1d347a/assets/GJ_WebSheet.json#L1-L137)[src/systems/GameState.js12-25](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/systems/GameState.js#L12-L25)

## Bitmap Fonts

The game utilizes two primary bitmap fonts for UI and scoring. Unlike standard vector fonts, these are pre-rendered into textures for high-performance rendering in Phaser.

| Font Key | File Path | Usage |
| --- | --- | --- |
| `bigFont` | `assets/bigFont.fnt` | Main titles, level names, "Level Complete" text. |
| `goldFont` | `assets/goldFont.fnt` | Percentage displays, attempt counts, and secondary stats. |

The `BitmapFontParser` system processes the AngelCode `.fnt` format to map character IDs to specific regions on the associated `.png` sheets.

Sources: [assets/bigFont.fnt1-4](https://github.com/brokemutt/gdweb/blob/1c1d347a/assets/bigFont.fnt#L1-L4)[assets/goldFont.fnt1-4](https://github.com/brokemutt/gdweb/blob/1c1d347a/assets/goldFont.fnt#L1-L4)[src/systems/BitmapFontParser.js1-10](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/systems/BitmapFontParser.js#L1-L10)

## Audio Assets

The audio system manages background music and synchronized sound effects.

- **Background Music**: `StereoMadness.mp3` is the primary track. It is analyzed in real-time by the `AudioManager` to drive visual "pulsing" effects in the level environment.
- **Sound Effects**: Standard OGG files handle game events:

- `explode_11.ogg`: Triggered on player death.
- `playSound_01.ogg` / `quitSound_01.ogg`: UI interactions.
- `endStart_02.ogg`: Played when entering the end portal.

For details, see [Audio Assets](/brokemutt/gdweb/8.2-audio-assets).

Sources: [src/systems/AudioManager.js14-35](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/systems/AudioManager.js#L14-L35)[src/scenes/BootScene.js37-43](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/scenes/BootScene.js#L37-L43)

## UI and Backgrounds

Specific UI components and background layers are stored as standalone images outside the main atlas:

- **Background**: `game_bg_01_001.png` provides the scrolling parallax backdrop.
- **Panels**: `GJ_square02.png` and `square04_001.png` are used for 9-slice UI windows and menus.
- **Sliders**: `sliderBar.png` is used in the options/pause menu.

Sources: [src/scenes/BootScene.js23-27](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/scenes/BootScene.js#L23-L27)[src/scenes/GameScene.js332-345](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/scenes/GameScene.js#L332-L345)

## Level Data (1.txt)

The level layout is stored in `assets/1.txt`. This file contains a highly compressed string representing the entire level structure.

1. **Format**: The data is Base64 encoded and compressed using the DEFLATE algorithm.
2. **Processing**: The `LevelLoader` decodes the string and uses `pako` for decompression.
3. **Structure**: The resulting string is a semicolon-delimited list of objects, where each object is a comma-separated list of key-value pairs (e.g., `1,1,2,100,3,15` maps to `ID=1, X=100, Y=15`).

### Data Flow Diagram

Sources: [assets/1.txt1](https://github.com/brokemutt/gdweb/blob/1c1d347a/assets/1.txt#L1-L1)[src/world/LevelLoader.js51-75](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/world/LevelLoader.js#L51-L75)

## Asset Integration Mapping

This diagram illustrates how various asset types are associated with specific system classes in the code.

Sources: [src/systems/GameState.js12-25](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/systems/GameState.js#L12-L25)[src/systems/AudioManager.js68-85](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/systems/AudioManager.js#L68-L85)[src/player/PlayerRenderer.js15-30](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/player/PlayerRenderer.js#L15-L30)