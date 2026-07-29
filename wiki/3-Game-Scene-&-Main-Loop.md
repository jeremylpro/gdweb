# Game Scene & Main Loop
Relevant source files
- [src/scenes/GameScene.js](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/scenes/GameScene.js)

The `GameScene` class in `src/scenes/GameScene.js` serves as the central orchestrator for the entire application. It manages the transition between the title screen and active gameplay, coordinates the physics sub-stepping loop, handles camera logic, and manages the level-completion pipeline. It acts as the "glue" that connects the `PlayerClass`, `LevelClass`, `ColorManager`, and `AudioClass`.

## Core Orchestration

`GameScene` is a single Phaser Scene that maintains a state machine governed primarily by the `_menuActive` flag [[src/scenes/GameScene.js99](https://github.com/brokemutt/gdweb/blob/1c1d347a/[src/scenes/GameScene.js#L99-L99) When active, the scene displays the Geometry Dash title screen; when toggled, it triggers the gameplay "slide-in" transition and initializes the physics loop.

### System Initialization

During the `create()` lifecycle, `GameScene` instantiates the core subsystems:

- **GameState**: Tracks the physical properties and death state of the player [[src/scenes/GameScene.js44](https://github.com/brokemutt/gdweb/blob/1c1d347a/[src/scenes/GameScene.js#L44-L44)
- **LevelClass**: Manages the loading and rendering of level objects [[src/scenes/GameScene.js45](https://github.com/brokemutt/gdweb/blob/1c1d347a/[src/scenes/GameScene.js#L45-L45)
- **PlayerClass**: Handles player input, physics integration, and rendering [[src/scenes/GameScene.js46](https://github.com/brokemutt/gdweb/blob/1c1d347a/[src/scenes/GameScene.js#L46-L46)
- **ColorManager**: Manages background and ground color transitions [[src/scenes/GameScene.js47](https://github.com/brokemutt/gdweb/blob/1c1d347a/[src/scenes/GameScene.js#L47-L47)
- **AudioClass**: Manages music playback and real-time audio metering [[src/scenes/GameScene.js48](https://github.com/brokemutt/gdweb/blob/1c1d347a/[src/scenes/GameScene.js#L48-L48)

### Main Loop Logic Flow

The `update(time, deltaMs)` method handles the frame-by-frame logic. It uses a delta-quantization strategy to ensure deterministic physics simulation regardless of the monitor's refresh rate.

| Phase | Responsibility | Code Entity |
| --- | --- | --- |
| **Input Processing** | Capturing mouse/touch/keyboard for jumps | `PlayerClass.updateJump` |
| **Physics Step** | Advancing simulation by `TICK_DELTA` (240Hz) | `_quantizeDelta` |
| **Camera Sync** | Updating viewport based on player X/Y | `_updateCameraY` |
| **Visual Effects** | Updating background parallax and UI | `_bg.setTilePosition` |

**Sources:**

- [src/scenes/GameScene.js14-116](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/scenes/GameScene.js#L14-L116)
- [src/constants.js6](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/constants.js#L6-L6)

---

## Title Screen & UI

The title screen provides the entry point to the game. It features a bouncy UI system, a glitter particle emitter, and a pause menu. It also includes a custom 9-slice renderer for drawing Geometry Dash-style panels.

- **Menu State**: Controlled by `_menuActive`. When true, the player is hidden and the logo/buttons are visible [[src/scenes/GameScene.js99-106](https://github.com/brokemutt/gdweb/blob/1c1d347a/[src/scenes/GameScene.js#L99-L106)
- **Bouncy Buttons**: Implemented via `_makeBouncyButton`, which adds scale-based pointer interactions [[src/scenes/GameScene.js140](https://github.com/brokemutt/gdweb/blob/1c1d347a/[src/scenes/GameScene.js#L140-L140)
- **Glitter System**: A particle emitter (`_glitterEmitter`) that creates the ambient green square particles seen on the main menu [[src/scenes/GameScene.js56-79](https://github.com/brokemutt/gdweb/blob/1c1d347a/[src/scenes/GameScene.js#L56-L79)

For details, see [Title Screen & UI](/brokemutt/gdweb/3.1-title-screen-and-ui).

**Sources:**

- [src/scenes/GameScene.js56-165](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/scenes/GameScene.js#L56-L165)

---

## Physics Loop & Delta Quantization

To maintain consistency with the original game's physics, `GameScene` implements a sub-stepping loop. Instead of using Phaser's raw `delta`, it buffers time and executes the physics logic at a fixed `TICK_DELTA` (typically 240 Hz).

- **Delta Quantization**: The `_quantizeDelta` function ensures that the physics simulation remains deterministic [[src/scenes/GameScene.js336](https://github.com/brokemutt/gdweb/blob/1c1d347a/[src/scenes/GameScene.js#L336-L336)
- **Sub-stepping**: If the frame rate drops, the scene runs multiple physics steps per render frame to catch up.
- **Slide-in Transition**: When starting a level, the ground and player perform a specific "slide-in" animation before physics take over [[src/scenes/GameScene.js100-101](https://github.com/brokemutt/gdweb/blob/1c1d347a/[src/scenes/GameScene.js#L100-L101)

For details, see [Physics Loop & Delta Quantization](/brokemutt/gdweb/3.2-physics-loop-and-delta-quantization).

**Sources:**

- [src/scenes/GameScene.js336-350](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/scenes/GameScene.js#L336-L350)
- [src/constants.js6](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/constants.js#L6-L6)

---

## Camera Management & Screen Adaptation

The camera system tracks the player's horizontal progress automatically based on `PLAYER_SPEED`. Vertical tracking is more complex, involving different logic for Cube and Ship modes.

- **Vertical Following**: `_updateCameraY` manages the camera's Y-position, including bounds that prevent the camera from following the player too far into the air or ground [[src/scenes/GameScene.js35](https://github.com/brokemutt/gdweb/blob/1c1d347a/[src/scenes/GameScene.js#L35-L35)
- **Screen Adaptation**: The `_applyScreenResize` method recalculates `SCREEN_WIDTH` and updates the `LevelClass` and `Background` to ensure the game fills the browser window correctly [[src/scenes/GameScene.js28-29](https://github.com/brokemutt/gdweb/blob/1c1d347a/[src/scenes/GameScene.js#L28-L29)

For details, see [Camera Management & Screen Adaptation](/brokemutt/gdweb/3.3-camera-management-and-screen-adaptation).

**Sources:**

- [src/scenes/GameScene.js28-41](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/scenes/GameScene.js#L28-L41)

---

## Level Completion & End Screen

When the player reaches the end portal, `GameScene` triggers a multi-stage completion pipeline that transitions from gameplay to the statistics screen.

- **Trigger Pipeline**: Starts at `_triggerEndPortal` and moves through `_levelComplete`[[src/scenes/GameScene.js52](https://github.com/brokemutt/gdweb/blob/1c1d347a/[src/scenes/GameScene.js#L52-L52)
- **Visual Sequence**: Includes a camera tween (`_endCamTween`), the "Level Complete" text display, and a star-award animation.
- **Stats Tracking**: Displays attempts, total jumps, and time elapsed during the run [[src/scenes/GameScene.js90-96](https://github.com/brokemutt/gdweb/blob/1c1d347a/[src/scenes/GameScene.js#L90-L96)

For details, see [Level Completion & End Screen](/brokemutt/gdweb/3.4-level-completion-and-end-screen).

**Sources:**

- [src/scenes/GameScene.js90-97](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/scenes/GameScene.js#L90-L97)

---

## System Interconnectivity

The following diagram illustrates how `GameScene` coordinates the various subsystems and code entities during the main loop.

### GameScene Orchestration Diagram

**Sources:**

- [src/scenes/GameScene.js14-116](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/scenes/GameScene.js#L14-L116)
- [src/systems/GameState.js1-10](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/systems/GameState.js#L1-L10)
- [src/world/Level.js1-20](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/world/Level.js#L1-L20)

### Entity Mapping

| Logical System | Code Implementation | Primary File |
| --- | --- | --- |
| **Main Orchestrator** | `class GameScene` | `src/scenes/GameScene.js` |
| **Physics State** | `class GameState` | `src/systems/GameState.js` |
| **World Logic** | `class LevelClass` | `src/world/Level.js` |
| **Character Logic** | `class PlayerClass` | `src/player/Player.js` |
| **Audio Metering** | `class AudioClass` | `src/systems/AudioManager.js` |

**Sources:**

- [src/scenes/GameScene.js44-48](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/scenes/GameScene.js#L44-L48)