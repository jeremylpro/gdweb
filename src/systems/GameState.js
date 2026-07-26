/*
    player physics and scene helpers
*/
class GameState {
    constructor() {
        this.reset();
    }
    reset() {
        this.y = 30,
        this.lastY = 30, 
        this.lastGroundPosY = 30, 
        
        this.yVelocity = 0,
        
        this.onGround = true, 
        this.canJump = true, 
        this.isJumping = false, 
        this.gravityFlipped = false, 
        this.isFlying = false, 
        this.wasBoosted = false, 
        
        this.collideTop = 0, 
        this.collideBottom = 0, 
        
        this.onCeiling = false, 
        this.upKeyDown = false, 
        this.upKeyPressed = false, 
        this.isDead = false;
    }
}
const ATLAS_KEYS = ["GJ_WebSheet", "GJ_GameSheet-hd"];

// find which atlas a frame is in, if any
function findAtlasFrame(scene, frame) {
    for (let key of ATLAS_KEYS)
        if (scene.textures.exists(key)) {
            if (scene.textures.get(key).has(frame)) return {
                atlas: key,
                frame: frame
            };
        }
    return null;
}

// creates an image from an atlas frame or a regular texture, or returns null if neither exists
function createImageFromAtlas(scene, x, y, frame) {
    let frameMeta = findAtlasFrame(scene, frame);
    
    return frameMeta ? scene.add.image(x, y, frameMeta.atlas, frameMeta.frame)
        : scene.textures.exists(frame) ? scene.add.image(x, y, frame)
        : null;
}

// a collider object (hitbox)
class GameObject {
    constructor(type, x, y, width, height) {
        this.type = type,
        this.x = x,
        this.y = y,
        this.w = width,
        this.h = height,
        this.activated = false;
    }
}

export { GameState, ATLAS_KEYS, findAtlasFrame, createImageFromAtlas, GameObject };
