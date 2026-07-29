# Level System
Relevant source files
- [assets/1.txt](https://github.com/brokemutt/gdweb/blob/1c1d347a/assets/1.txt)
- [src/world/Level.js](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/world/Level.js)
- [src/world/LevelLoader.js](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/world/LevelLoader.js)

The Level System is responsible for transforming raw, compressed level data into a playable 2D environment. It handles the lifecycle of game objects from decompression and parsing to runtime visibility management and collision detection.

### System Architecture

The data flow begins with `assets/1.txt`, which contains the level data in a custom Geometry Dash format. This data is processed by the `LevelLoader` and managed at runtime by `LevelClass`.

#### Data Flow Overview

1. **Storage**: Level data is stored as a Base64-encoded, pako-compressed string in `assets/1.txt`.
2. **Loading**: `LevelLoader.js` provides `parseLevel` to decompress the string and `parseObject` to map raw key-value pairs into structured metadata [src/world/LevelLoader.js8-68](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/world/LevelLoader.js#L8-L68)
3. **Initialization**: `LevelClass` (defined in `src/world/Level.js`) receives these objects, instantiates them as `GameObject` entities, and organizes them into spatial sections [src/world/Level.js11-63](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/world/Level.js#L11-L63)
4. **Runtime**: During the game loop, `LevelClass` performs visibility culling and manages dynamic ground/ceiling animations [src/world/Level.js235-260](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/world/Level.js#L235-L260)

### Core Components

| Component | File | Responsibility |
| --- | --- | --- |
| `LevelLoader` | `src/world/LevelLoader.js` | Decoding, decompression (pako), and object property mapping. |
| `LevelClass` | `src/world/Level.js` | Scene graph management, section-based culling, and ground recycling. |
| `GameObject` | `src/systems/GameState.js` | The base runtime entity containing hitboxes and activation state. |
| `OBJECT_DEFINITIONS` | `src/world/LevelLoader.js` | Static registry mapping ID to types (Solid, Hazard, Portal, etc.). |

#### Level Data Flow Diagram

This diagram illustrates how data moves from the static asset file into the Phaser scene graph.

**Sources:**[src/world/LevelLoader.js37-68](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/world/LevelLoader.js#L37-L68)[src/world/Level.js11-55](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/world/Level.js#L11-L55)[src/systems/GameState.js46-55](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/systems/GameState.js#L46-L55)

### Level Loading & Object Definitions

The loading process translates the legacy GD format (comma-separated integers) into modern JavaScript objects. Key mapping includes property `1` for Object ID, `2` for X position, and `3` for Y position [src/world/LevelLoader.js18-22](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/world/LevelLoader.js#L18-L22)

The `OBJECT_DEFINITIONS` registry determines the physical behavior of an ID, such as whether it is a `OBJECT_TYPE2_SOLID` or `OBJECT_TYPE2_HAZARD`[src/world/LevelLoader.js69-137](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/world/LevelLoader.js#L69-L137)

For details, see [Level Loading & Object Definitions](/brokemutt/gdweb/5.1-level-loading-and-object-definitions).

### Runtime World Management

To maintain performance at 240Hz, the world is divided into 400-pixel wide "sections" [src/world/Level.js240-245](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/world/Level.js#L240-L245)`LevelClass` only renders objects within the current camera view, significantly reducing the draw call count.

It also manages the "Fly Mode" transition, where the ground and ceiling dynamically slide to accommodate the Ship's vertical movement range [src/world/Level.js290-310](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/world/Level.js#L290-L310)

#### Section Management Diagram

This diagram shows how `LevelClass` manages spatial partitioning for the Phaser renderer.

**Sources:**[src/world/Level.js235-265](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/world/Level.js#L235-L265)[src/world/Level.js16-18](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/world/Level.js#L16-L18)

For details, see [Runtime World Management](/brokemutt/gdweb/5.2-runtime-world-management).

### Summary of Subsystems

- **Collision**: Handled by the `Player` checking against `GameObject` hitboxes within the `LevelClass` nearby buffer.
- **Triggers**: Color and effect triggers are parsed during load and checked against the player's X position during the update loop [src/world/Level.js36-40](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/world/Level.js#L36-L40)
- **Recycling**: Ground tiles are repositioned as the player moves to create an infinite floor effect [src/world/Level.js180-210](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/world/Level.js#L180-L210)

**Sources:**[src/world/Level.js1-111](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/world/Level.js#L1-L111)[src/world/LevelLoader.js1-229](https://github.com/brokemutt/gdweb/blob/1c1d347a/src/world/LevelLoader.js#L1-L229)[assets/1.txt1-50](https://github.com/brokemutt/gdweb/blob/1c1d347a/assets/1.txt#L1-L50)