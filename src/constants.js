import * as Phaser from 'phaser';

let SCREEN_WIDTH = Math.round(10240 / 9); // 1138
const SCREEN_HEIGHT = 640,
    TILE_SIZE = 60, // tile size
    SHIP_CAMERA_Y_OFFSET = 180;

// the x screen position at which the player stays at 
let PLAYER_GAME_CAMERA_X = SCREEN_WIDTH / 2 - 150;

// changes screen width
function setScreenWidth(newWidth) {
    SCREEN_WIDTH = newWidth,
    PLAYER_GAME_CAMERA_X = newWidth / 2 - 150;
}

const
    TICK_DELTA = 1 / 240,
    PLAYER_SPEED = 11.540004,
    TIME_SCALE = 0.9,
    JUMP_VELOCITY = 1.916398,
    FLY_CEILING = 600, // ceiling height when entering ship mode, from bottom of screen
    TILE_SIZE2 = TILE_SIZE, // duplicate
    // player colors
    COLOR_GREEN = 0xFF00,
    COLOR_BLUE = 0xFFFF,
    // object types
    OBJECT_TYPE_SOLID = "solid",
    OBJECT_TYPE_HAZARD = "hazard",
    OBJECT_TYPE_PORTAL_SHIP = "portal_fly",
    OBJECT_TYPE_PORTAL_CUBE = "portal_cube",
    OBJECT_TYPE_PORTAL_BALL = "portal_ball",
    // pads
    OBJECT_TYPE_PAD_YELLOW = "pad_yellow",
    OBJECT_TYPE_PAD_BLUE = "pad_blue",
    OBJECT_TYPE_PAD_PINK = "pad_pink",
    PAD_YELLOW_VELOCITY = 32.428,
    PAD_PINK_VELOCITY = 20.955,
    PAD_BLUE_VELOCITY = 16.038,
    // the camera clips to this y value
    GROUND_BOUNDS_Y = 460;

// converts a world y coordinate to a screen y coordinate
function worldYToScreenY(worldY) {
    return GROUND_BOUNDS_Y - worldY;
}

let BLEND_ADD = Phaser.BlendModes.ADD,
    BLEND_NORMAL = Phaser.BlendModes.NORMAL;

function setBlendModeAdd(newMode) {
    BLEND_ADD = newMode;
}
function setBlendModeNormal(newMode) {
    BLEND_NORMAL = newMode;
}

// stuff from level data used in both ground and, level data of course
// duplicates
const OBJECT_TYPE2_SOLID = "solid",
    OBJECT_TYPE2_HAZARD = "hazard",
    OBJECT_TYPE2_DECORATIVE = "deco",
    OBJECT_TYPE2_PORTAL = "portal",
    OBJECT_TYPE2_PAD = "pad",
    OBJECT_TYPE2_RING = "ring",
    OBJECT_TYPE2_TRIGGER = "trigger",
    OBJECT_TYPE2_SPEED = "speed",
    OBJECT_TYPE2_FLY = "fly",
    OBJECT_TYPE2_CUBE = "cube",
    OBJECT_TYPE2_BALL = "ball"

export {
        SCREEN_WIDTH, SCREEN_HEIGHT, TILE_SIZE, SHIP_CAMERA_Y_OFFSET, PLAYER_GAME_CAMERA_X, setScreenWidth, TICK_DELTA, PLAYER_SPEED, TIME_SCALE, JUMP_VELOCITY, FLY_CEILING, TILE_SIZE2, COLOR_GREEN, COLOR_BLUE, OBJECT_TYPE_SOLID, OBJECT_TYPE_HAZARD, OBJECT_TYPE_PORTAL_SHIP, OBJECT_TYPE_PORTAL_CUBE, OBJECT_TYPE_PORTAL_BALL, OBJECT_TYPE_PAD_YELLOW, OBJECT_TYPE_PAD_BLUE, OBJECT_TYPE_PAD_PINK, PAD_YELLOW_VELOCITY, PAD_PINK_VELOCITY, PAD_BLUE_VELOCITY, GROUND_BOUNDS_Y, worldYToScreenY, BLEND_ADD, BLEND_NORMAL, setBlendModeAdd, setBlendModeNormal,
        OBJECT_TYPE2_SOLID, OBJECT_TYPE2_HAZARD, OBJECT_TYPE2_DECORATIVE, OBJECT_TYPE2_PORTAL, OBJECT_TYPE2_PAD, OBJECT_TYPE2_RING, OBJECT_TYPE2_TRIGGER, OBJECT_TYPE2_SPEED, OBJECT_TYPE2_FLY, OBJECT_TYPE2_CUBE, OBJECT_TYPE2_BALL
    };
