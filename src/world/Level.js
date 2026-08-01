/*
    ground and level objects
*/
import * as Phaser from 'phaser';
import { SCREEN_WIDTH, TILE_SIZE, SHIP_CAMERA_Y_OFFSET, PLAYER_GAME_CAMERA_X, FLY_CEILING, TILE_SIZE2, COLOR_GREEN, OBJECT_TYPE_SOLID, OBJECT_TYPE_HAZARD, OBJECT_TYPE_PORTAL_SHIP, OBJECT_TYPE_PORTAL_CUBE, worldYToScreenY, BLEND_ADD, BLEND_NORMAL,
    OBJECT_TYPE2_SOLID, OBJECT_TYPE2_HAZARD, OBJECT_TYPE2_DECORATIVE, OBJECT_TYPE2_PORTAL, OBJECT_TYPE2_PAD, OBJECT_TYPE_PAD_YELLOW, OBJECT_TYPE_PAD_BLUE, OBJECT_TYPE_PAD_PINK, OBJECT_TYPE2_RING, OBJECT_TYPE2_TRIGGER, OBJECT_TYPE2_SPEED, OBJECT_TYPE2_FLY, OBJECT_TYPE2_CUBE
 } from '../constants.js';
import { findAtlasFrame, createImageFromAtlas, GameObject } from '../systems/GameState.js';
import { parseLevel, getObjectDefinition } from './LevelLoader.js';

class LevelClass {
    constructor(scene, cameraXReference) {
        this._scene = scene,
        this._cameraXRef = cameraXReference,

        this.additiveContainer = scene.add.container(0, 0).setDepth(-1),
        this.container = scene.add.container(0, 0),
        this.topContainer = scene.add.container(0, 0).setDepth(13),
        
        this.objects = [],
        this.endXPos = 0,
        
        this._groundY = 0,
        this._ceilingY = null,
        this._flyGroundActive = false,
        this._groundAnimFrom = 0,
        this._groundAnimTo = 0,
        this._groundAnimTime = 0,
        this._groundAnimDuration = 0,
        this._groundAnimating = false,
        this._groundTargetValue = 0,
        this._flyFloorY = 0,
        this._flyCeilingY = 0,
        this.flyCameraTarget = null,

        this._colorTriggers = [],
        this._colorTriggerIdx = 0,
        this._audioScaleSprites = [],
        this._enterEffectTriggers = [],
        this._enterEffectTriggerIdx = 0,
        this._activeEnterEffect = 0,
        this._activeExitEffect = 0,
        
        this._sections = [],
        this._sectionContainers = [],
        this._collisionSections = [],
        this._nearbyBuffer = [],
        this._visMinSec = -1,
        this._visMaxSec = -1,
        
        this._groundStartScreenY = worldYToScreenY(0),
        this._ceilingStartScreenY = 0,
        
        this._buildGround();
    }

    // loads level data
    loadLevel(level) {
        let {
            objects: parsed
        } = parseLevel(level);
        this._spawnLevelObjects(parsed);
    }

    // creates large ground (and ceiling) tiles
    _buildGround() {
        const scene = this._scene,
            tileFrame = scene.textures.getFrame('GJ_WebSheet', 'groundSquare_01_001.png');
            
            this._tileW = tileFrame ? tileFrame.width : 1012,
            this._groundTiles = [],
            this._ceilingTiles = [];

        let numTiles = Math.ceil(SCREEN_WIDTH / this._tileW) + 2,
            groundY = worldYToScreenY(0); // GROUND_BOUNDS_Y
        const startWorldX = -PLAYER_GAME_CAMERA_X;

        for (let i = 0; i < numTiles; i++) {
            let worldX = startWorldX + i * this._tileW,
            
                groundImage = scene.add.image(0, groundY, "GJ_WebSheet", 'groundSquare_01_001.png');
            groundImage.setOrigin(0, 0),
            groundImage.setTint(17578),
            groundImage.setDepth(20),
            groundImage._worldX = worldX,
            this._groundTiles.push(groundImage);
            
            let ceilingImage = scene.add.image(0, groundY, "GJ_WebSheet", "groundSquare_01_001.png");
            ceilingImage.setOrigin(0, 1),
            ceilingImage.setFlipY(true),
            ceilingImage.setTint(17578),
            ceilingImage.setDepth(20),
            ceilingImage.setVisible(false),
            ceilingImage._worldX = worldX,
            this._ceilingTiles.push(ceilingImage);
        }
        this._maxGroundWorldX = startWorldX + (numTiles - 1) * this._tileW;
        
        const lineFrame = scene.textures.getFrame('GJ_WebSheet', "floorLine_01_001.png"),
        lineTextureWidth = lineFrame ? lineFrame.width : 888,
        lineScale = SCREEN_WIDTH / lineTextureWidth;
        
        this._groundLine = scene.add.image(SCREEN_WIDTH / 2, groundY - 1, 'GJ_WebSheet', 'floorLine_01_001.png')
            .setOrigin(0.5, 0).setScale(lineScale, 1).setBlendMode(BLEND_ADD).setDepth(21).setScrollFactor(0),
        this._ceilingLine = scene.add.image(SCREEN_WIDTH / 2, groundY + 1, "GJ_WebSheet", 'floorLine_01_001.png')
            .setOrigin(0.5, 1).setScale(lineScale, 1).setFlipY(true).setBlendMode(BLEND_ADD).setDepth(21).setScrollFactor(0).setVisible(false);
        
        const shadowOpacity = 100 / 0xFF;
        this._groundShadowL = scene.add.image(-1, groundY, "GJ_WebSheet", "groundSquareShadow_001.png")
            .setOrigin(0, 0).setScrollFactor(0).setDepth(22).setAlpha(shadowOpacity).setScale(0.7, 1).setBlendMode(BLEND_NORMAL), this._groundShadowR = scene.add.image(SCREEN_WIDTH + 1, groundY, 'GJ_WebSheet', "groundSquareShadow_001.png").setOrigin(1, 0).setScrollFactor(0).setDepth(22).setAlpha(shadowOpacity).setScale(0.7, 1).setFlipX(true).setBlendMode(BLEND_NORMAL), this._ceilingShadowL = scene.add.image(-1, groundY, "GJ_WebSheet", 'groundSquareShadow_001.png').setOrigin(0, 1).setScrollFactor(0).setDepth(22).setAlpha(shadowOpacity).setScale(0.7, 1).setFlipY(true).setBlendMode(BLEND_NORMAL).setVisible(false), this._ceilingShadowR = scene.add.image(SCREEN_WIDTH + 1, groundY, "GJ_WebSheet", 'groundSquareShadow_001.png').setOrigin(1, 1).setScrollFactor(0).setDepth(22).setAlpha(shadowOpacity).setScale(0.7, 1).setFlipX(true).setFlipY(true).setBlendMode(BLEND_NORMAL).setVisible(false);
    }
    // rebuilds tiles to fit within screen bounds again
    resizeScreen() {
        var maybeExistingGroundTiles, maybeExistingCeilingTiles;

        const scene = this._scene,
            tileW = this._tileW,

            // amount needed to cover screen + extra
            amount = Math.ceil(SCREEN_WIDTH / tileW) + 2,
            groundY = worldYToScreenY(0);
            
        for (; this._groundTiles.length < amount;) {
            const wx = this._maxGroundWorldX + tileW;

            let groundImage = scene.add.image(0, groundY, 'GJ_WebSheet', "groundSquare_01_001.png");
            groundImage
                .setOrigin(0, 0)
                .setTint((null == (maybeExistingGroundTiles = this._groundTiles[0]) ? undefined : maybeExistingGroundTiles.tintTopLeft) || 17578)
                .setDepth(20),
            
            groundImage._worldX = wx,
            this._groundTiles.push(groundImage);
            
            let ceilingImage = scene.add.image(0, groundY, 'GJ_WebSheet', "groundSquare_01_001.png");
            ceilingImage
                .setOrigin(0, 1)
                .setFlipY(true)
                .setTint((null == (maybeExistingCeilingTiles = this._groundTiles[0]) ? undefined : maybeExistingCeilingTiles.tintTopLeft) || 17578)
                .setDepth(20).setVisible(false),
                
            ceilingImage._worldX = wx,
            this._ceilingTiles.push(ceilingImage),
            
            this._maxGroundWorldX = wx;
        }

        const lineFrame = this._scene.textures.getFrame("GJ_WebSheet", "floorLine_01_001.png"),
            lineScale = SCREEN_WIDTH / (lineFrame ? lineFrame.width : 888); // using 1 liners i see
        
        this._groundLine.x = SCREEN_WIDTH / 2,
        this._groundLine.setScale(lineScale, 1),
        this._ceilingLine.x = SCREEN_WIDTH / 2,
        this._ceilingLine.setScale(lineScale, 1),
        this._groundShadowR.x = SCREEN_WIDTH + 1,
        this._ceilingShadowR.x = SCREEN_WIDTH + 1;
    }
    updateGroundTiles(cameraYOffset = 0) {
        const camX = this._cameraXRef.value,
            tileW = this._tileW;
        let groundY,
            ceilingY,

            maxGWX = this._maxGroundWorldX || -1 / 0;
            
        // animate ground and ceiling if in ship mode
        if (this._flyGroundActive && this._groundTargetValue > 0.001) {
            let groundTargetValue = this._groundTargetValue,
                groundOffset = 620,
                ceilingOffset = 20;

            groundY = this._groundStartScreenY + (groundOffset - this._groundStartScreenY) * groundTargetValue,
            ceilingY = this._ceilingStartScreenY + (ceilingOffset - this._ceilingStartScreenY) * groundTargetValue;

            let maxGround = worldYToScreenY(0) + cameraYOffset;
            groundY > maxGround && (groundY = maxGround);
        } else
            groundY = worldYToScreenY(0) + cameraYOffset,
            ceilingY = 0;
        
        for (let i = 0; i < this._groundTiles.length; i++) {
            let groundTile = this._groundTiles[i],
                ceilingTile = this._ceilingTiles[i];
            
            groundTile._worldX + tileW <= camX && (
                groundTile._worldX = maxGWX + tileW,
                ceilingTile._worldX = groundTile._worldX,
                maxGWX = groundTile._worldX,
                this._maxGroundWorldX = maxGWX
            );

            let sx = groundTile._worldX - camX;
            groundTile.x = sx, 
            groundTile.y = groundY, 
            ceilingTile.x = sx, 
            ceilingTile.y = ceilingY, 
            ceilingTile.setVisible(this._flyGroundActive && this._groundTargetValue > 0);
        }

        this._groundLine.y = groundY,
        this._flyGroundActive && this._groundTargetValue > 0 ? (
            this._ceilingLine.y = ceilingY,
            this._ceilingLine.setVisible(true)
        ) :
            this._ceilingLine.setVisible(false),

        this._groundShadowL.y = groundY,
        this._groundShadowR.y = groundY;

        let isCeilingVisible = this._flyGroundActive && this._groundTargetValue > 0;
        
        this._ceilingShadowL.y = ceilingY,
        this._ceilingShadowR.y = ceilingY,
        this._ceilingShadowL.setVisible(isCeilingVisible),
        this._ceilingShadowR.setVisible(isCeilingVisible);
    }
    shiftGroundTiles(xDelta) {
        for (let i = 0; i < this._groundTiles.length; i++)
            this._groundTiles[i]._worldX += xDelta,
            this._ceilingTiles[i]._worldX += xDelta;

        this._maxGroundWorldX += xDelta;
    }
    resetGroundTiles(startWorldX) {
        const tileW = this._tileW;
        for (let i = 0; i < this._groundTiles.length; i++)
            this._groundTiles[i]._worldX = startWorldX + i * tileW,
            this._ceilingTiles[i]._worldX = startWorldX + i * tileW;

        this._maxGroundWorldX = startWorldX + (this._groundTiles.length - 1) * tileW, this.resetGroundState();
    }
    resetGroundState() {
        this._flyGroundActive = false,
        this._groundTargetValue = 0,
        this._groundAnimating = false,
        this._groundY = 0, 
        this._ceilingY = null, 
        this.flyCameraTarget = null;
    }
    /* fly mode helpers */

    _computeFlyBounds(portalY) {
        let floorY = portalY - 300;
        return floorY = Math.floor(floorY / TILE_SIZE) * TILE_SIZE,
        floorY = Math.max(0, floorY), {
            floorY: floorY,
            ceilingY: floorY + FLY_CEILING
        };
    }
    setFlyMode(active, portalY) {
        if (active) {
            let bounds = this._computeFlyBounds(portalY);
            this._flyFloorY = bounds.floorY,
            this._flyCeilingY = bounds.ceilingY,
            this._flyGroundActive = true;

            let flyCameraTargetOffset = this._flyFloorY + 300;
            this.flyCameraTarget = flyCameraTargetOffset - 320 + SHIP_CAMERA_Y_OFFSET,
            this.flyCameraTarget < 0 && (
                this.flyCameraTarget = 0
            );
            
            let curCamY = this._scene && this._scene._cameraY || 0;
            this._groundStartScreenY = worldYToScreenY(0) + curCamY,
            this._ceilingStartScreenY = 0,
            this._groundAnimFrom = this._groundTargetValue,
            this._groundAnimTo = 1, this._groundAnimTime = 0,
            this._groundAnimDuration = 0.5,
            this._groundAnimating = true;
        } else
            this.flyCameraTarget = null,
            this._groundAnimFrom = this._groundTargetValue,
            this._groundAnimTo = 0,
            this._groundAnimTime = 0,
            this._groundAnimDuration = 0.5,
            this._groundAnimating = true;
        
    }
    setBallMode(active, portalY) {
        // Ball mode uses standard cube camera, no special bounds needed
        // Could add visual effects here in the future
        if (!active) {
            // Reset any ball-specific state if needed
        }
    }
    stepGroundAnimation(deltaTime) {
        if (!this._groundAnimating) return;
        this._groundAnimTime += deltaTime;
        let time = this._groundAnimDuration > 0
            ? Math.min(this._groundAnimTime / this._groundAnimDuration, 1)
            : 1;
        this._groundTargetValue = this._groundAnimFrom + (this._groundAnimTo - this._groundAnimFrom) * time,
            
        time >= 1 && (
            this._groundAnimating = false,
            this._groundTargetValue = this._groundAnimTo,
            0 === this._groundAnimTo && (
                this._flyGroundActive = false
            )
        );
    }
    // gets ship mode floor y, or 0 if not in ship mode 
    getFloorY() {
        return this._flyGroundActive ? this._flyFloorY : 0;
    }
    // gets ship mode ceiling y, or null if not in ship mode
    getCeilingY() {
        return this._flyGroundActive ? this._flyCeilingY : null;
    }
    /* visual helpers */

    /* applies common visual properties to a sprite based on data
        args:
            scene: the phaser scene, used for looking up frame data
            sprite: the sprite to apply properties to
            frameName: the frame name of the sprite, used for looking up custom data
            objData: the object data containing properties to apply
            overrides: optional overrides for certain properties
                tint: if specified, applies this tint instead of the default
                black: if true, applies a black tint
    */
    _applyVisualProps(scene, sprite, frameName, objData, overrides = null) {
        if (!sprite) return;

        let {
            dx: dx,
            dy: dy
        } = function(scene, frameName) {
            let atlasMeta = findAtlasFrame(scene, frameName);
            if (!atlasMeta) return {
                dx: 0,
                dy: 0
            };

            let texture = scene.textures.get(atlasMeta.atlas).get(atlasMeta.frame);
            if (!texture) return {
                dx: 0,
                dy: 0
            };

            let customTextureData = texture.customData || {};
            if (customTextureData.gjSpriteOffset) return {
                dx: customTextureData.gjSpriteOffset.x || 0,
                dy: -(customTextureData.gjSpriteOffset.y || 0)
            };

            let realWidth = texture.realWidth,
                realHeight = texture.realHeight,
                width = texture.width,
                height = texture.height,
                spriteSourceX = 0,
                spriteSourceY = 0;
            
            return customTextureData.spriteSourceSize && (
                spriteSourceX = customTextureData.spriteSourceSize.x || 0,
                spriteSourceY = customTextureData.spriteSourceSize.y || 0
            ), {
                'dx': realWidth / 2 - (spriteSourceX + width / 2),
                'dy': realHeight / 2 - (spriteSourceY + height / 2)
            };
        }(scene, frameName);
        
        objData.flipX && sprite.setFlipX(true),
        objData.flipY && sprite.setFlipY(true);

        let rotation = (sprite.getData("gjBaseRotationDeg") || 0) + objData.rot;
        0 !== rotation && sprite.setAngle(rotation),
        1 !== objData.scale && sprite.setScale(objData.scale),
        
        overrides && (
            undefined !== overrides.tint
                ? sprite.setTint(overrides.tint)
                : overrides.black && sprite.setTint(0)
            );
    }
    // applies visual properties and blend mode based on object definition, also sets a custom _eeLayer property used for sorting
    _addVisualSprite(sprite, objectDefinition = null) {
        sprite && (
            objectDefinition && "additive" === objectDefinition.blend
            ? (
                sprite.setBlendMode(BLEND_ADD),
                sprite._eeLayer = 0
            ) : objectDefinition && objectDefinition._portalFront
            ? sprite._eeLayer = 2
            : objectDefinition && undefined !== objectDefinition.z && objectDefinition.z < 0
            ? sprite._eeLayer = 0
            : sprite._eeLayer = 1
        );
    }
    // get the name of a glow frame based on the normal frame name
    _getGlowFrameName(frameName) {
        return frameName && frameName.endsWith("_001.png")
        ? frameName.replace('_001.png', '_glow_001.png')
        : null;
    }
    // adds a glow sprite if the object definition has a glow property, also applies visual properties to it
    _addGlowSprite(scene, x, y, frameName, objectData, worldX) {
        let glowFrame = this._getGlowFrameName(frameName);
        if (!glowFrame) return;
        if (!findAtlasFrame(scene, glowFrame) && !scene.textures.exists(glowFrame)) return;
        
        let sprite = createImageFromAtlas(scene, x, y, glowFrame);
        sprite && (
            this._applyVisualProps(scene, sprite, glowFrame, objectData),
            sprite.setBlendMode(BLEND_ADD),
            sprite._eeLayer = 0,
            undefined !== worldX && (
                sprite._eeWorldX = worldX,
                sprite._eeBaseY = y,
                this._addToSection(sprite)
            )
        );
    }
    /* level objects */
    // spawns level objects based on parsed level data
    _spawnLevelObjects(levelObjects) {
        const scene = this._scene;
        let levelSet = new Set();
        this._lastObjectX = 0;
        
        for (let object of levelObjects) {
            let definition = getObjectDefinition(object.id);
            
            // invisible triggers
            if (definition && definition.type === OBJECT_TYPE2_TRIGGER) {
                // hardcoded ids? thats scary!!
                29 !== object.id && 30 !== object.id || this._colorTriggers.push({
                    x: 2 * object.x,
                    index: 29 === object.id ? 1000 : 1001,
                    color: {
                        r: parseInt(object._raw[7] ?? 255, 10),
                        g: parseInt(object._raw[8] ?? 255, 10),
                        b: parseInt(object._raw[9] ?? 255, 10)
                    },
                    duration: parseFloat(object._raw[10] ?? 0),
                    tintGround: '1' === object._raw[14]
                }),
                
                definition.enterEffect && this._enterEffectTriggers.push({
                    x: 2 * object.x,
                    effect: definition.enterEffect
                });
                
                continue;
            }

            // a unit conversion of 30px to 60px?
            let worldX = 2 * object.x,
                worldY = 2 * object.y;
            
            worldX > this._lastObjectX && (
                this._lastObjectX = worldX
            );

            let frameName = definition ? definition.frame : null;

            if (definition && definition.randomFrames && (
                frameName = definition.randomFrames[Math.floor(Math.random() * definition.randomFrames.length)]),
                
                // if
                frameName) {

                let screenX = worldX,
                    screenY = worldYToScreenY(worldY);
                const isPortal = (definition.type === OBJECT_TYPE2_PORTAL || definition.type === OBJECT_TYPE2_SPEED) && frameName.includes("_front_");
                
                // back layer for portals
                if (isPortal) {
                    const backFrame = frameName.replace('_front_', "_back_");
                    let backSprite = createImageFromAtlas(scene, screenX, screenY, backFrame);
                    backSprite && (
                        this._applyVisualProps(scene, backSprite, backFrame, object),
                        backSprite._eeLayer = 1,
                        backSprite._eeWorldX = worldX,
                        backSprite._eeBaseY = screenY,
                        this._addToSection(backSprite)
                    );
                }

                // glow layer
                definition.glow && this._addGlowSprite(scene, screenX, screenY, frameName, object, worldX);
                
                const flaggedDefinition = isPortal ? {
                    ...definition,
                    _portalFront: true
                } : definition;

                // main sprite
                let mainSprite = createImageFromAtlas(scene, screenX, screenY, frameName);
                if (mainSprite && (
                    this._applyVisualProps(scene, mainSprite, frameName, object, definition),
                    this._addVisualSprite(mainSprite, flaggedDefinition),
                    mainSprite._eeWorldX = worldX,
                    mainSprite._eeBaseY = screenY,
                    this._addToSection(mainSprite)
                ),
                
                // secondary
                definition && (definition.type === OBJECT_TYPE2_SOLID || definition.type === OBJECT_TYPE2_HAZARD)) {
                    let overlayFrame = frameName.replace("_001.png", "_2_001.png"),
                        overlaySprite = findAtlasFrame(scene, overlayFrame) ? createImageFromAtlas(scene, screenX, screenY, overlayFrame) : null;
                    
                    overlaySprite && (
                        this._applyVisualProps(scene, overlaySprite, overlayFrame, object),
                        this._addVisualSprite(overlaySprite),
                        overlaySprite._eeWorldX = worldX,
                        overlaySprite._eeBaseY = screenY,
                        this._addToSection(overlaySprite)
                    );
                }

                // children
                if (definition.children)
                    for (let child of definition.children) {
                        let cdx = child.dx || 0,
                            cdy = child.dy || 0;
                        
                        if (undefined !== child.localDx || undefined !== child.localDy) {
                            let lx = child.localDx || 0,
                                ly = child.localDy || 0;
                            
                            object.flipX && (lx = -lx),
                            object.flipY && (ly = -ly);
                            
                            let rotation = (object.rot || 0) * Math.PI / 180;
                            cdx = lx * Math.cos(rotation) - ly * Math.sin(rotation),
                            cdy = lx * Math.sin(rotation) + ly * Math.cos(rotation);
                        }
                        let childSprite = createImageFromAtlas(scene, screenX + cdx, screenY + cdy, child.frame);
                        childSprite && (
                            this._applyVisualProps(scene, childSprite, child.frame, object, child),
                            
                            child.audioScale && (
                                childSprite.setScale(0.1),
                                childSprite.setAlpha(0.9),
                                childSprite._eeAudioScale = true,
                                this._audioScaleSprites.push(childSprite)
                            ),

                            (undefined !== child.z ? child.z : -1) < 0 ? (
                                childSprite._eeLayer = 1,
                                childSprite._eeBehindParent = true
                            )
                                : this._addVisualSprite(childSprite, child),
                                childSprite._eeWorldX = worldX + cdx,
                                childSprite._eeBaseY = screenY + cdy,
                                this._addToSection(childSprite)
                        );
                    }
            } else definition || levelSet.add(object.id);
            
            // portal particle emitters
            if (definition && definition.portalParticle && frameName) {
                let px = worldX,
                    py = worldYToScreenY(worldY);
                const portalScale = 2;
                let ex = px - 5 * portalScale,
                    ey = py;
                const zone = {
                        getRandomPoint: pt => {
                            let ang = (190 * Math.random() + 85) * Math.PI / 180,
                                rad = 20 * portalScale + 40 * Math.random() * portalScale;
                            return pt.x = Math.cos(ang) * rad, pt.y = Math.sin(ang) * rad, pt;
                        }
                    },
                    particleSpeedOffset = 20;
                let emitter = scene.add.particles(ex, ey, "GJ_WebSheet", {
                    frame: "square.png",
                    lifespan: {
                        'min': 200,
                        'max': 1000
                    },
                    speed: 0,
                    scale: {
                        start: 0.75,
                        end: 0.125
                    },
                    alpha: {
                        start: 0.5,
                        end: 0
                    },
                    tint: definition.portalParticleColor,
                    blendMode: Phaser.BlendModes.ADD,
                    frequency: 20,
                    maxParticles: 0,
                    emitting: true,
                    emitZone: {
                        type: "random",
                        source: zone
                    },
                    emitCallback: particle => {
                        let tx = -particle.x,
                            ty = -particle.y,
                            d = Math.sqrt(tx * tx + ty * ty) || 1,
                            lifeMs = particle.life / 1000,
                            speed = (d - particleSpeedOffset) / (lifeMs || 0.3);
                        particle.velocityX = tx / d * speed,
                        particle.velocityY = ty / d * speed;
                    }
                });
                emitter.setDepth(14),
                emitter._eeLayer = 2,
                emitter._eeWorldX = worldX,
                emitter._eeBaseY = ey,
                this._addToSection(emitter);
            }

            // collission objects
            if (definition) {
                // solid block
                if (definition.type === OBJECT_TYPE2_SOLID && definition.gridW > 0 && definition.gridH > 0) {
                    let hitboxWidth = definition.gridW * TILE_SIZE,
                        hitboxHeight = definition.gridH * TILE_SIZE,
                        hitbox = new GameObject(OBJECT_TYPE_SOLID, worldX, worldY, hitboxWidth, hitboxHeight);
                    
                    // make solid object collidable
                    this.objects.push(hitbox),
                    this._addCollisionToSection(hitbox);
                } else {
                    if (definition.type === OBJECT_TYPE2_HAZARD) {
                        let hitboxWidth = 0,
                            hitboxHeight = 0;
                        if (definition.spriteW > 0 && definition.spriteH > 0 && undefined !== definition.hitboxScaleX && undefined !== definition.hitboxScaleY
                            ? (
                                hitboxWidth = definition.spriteW * definition.hitboxScaleX * 2,
                                hitboxHeight = definition.spriteH * definition.hitboxScaleY * 2
                            ) : definition.gridW > 0 && definition.gridH > 0 && (
                                hitboxWidth = 12 * definition.gridW,
                                hitboxHeight = 24 * definition.gridH
                            ),
                            // if
                            hitboxWidth > 0 && hitboxHeight > 0) {
                            let hitbox = new GameObject(OBJECT_TYPE_HAZARD, worldX, worldY, hitboxWidth, hitboxHeight);
                            this.objects.push(hitbox),
                            this._addCollisionToSection(hitbox);
                        }
                    } else {
                        // portal
                        if (definition.type === OBJECT_TYPE2_PORTAL) {
                            let hitboxWidth = 90,
                                hitboxHeight = definition.gridH * TILE_SIZE,
                                portalType = null;
                            if ("fly" === definition.sub
                                ? portalType = OBJECT_TYPE_PORTAL_SHIP
                                : 'cube' === definition.sub && (
                                    portalType = OBJECT_TYPE_PORTAL_CUBE
                                ),
                                // if
                                portalType) {
                                let hitbox = new GameObject(portalType, worldX, worldY, hitboxWidth, hitboxHeight);
                                hitbox.portalY = worldY,

                                this.objects.push(hitbox),
                                this._addCollisionToSection(hitbox);
                            }
                        } else if (definition.type === OBJECT_TYPE2_PAD) {
                            let padType = null;  
                            if      (definition.sub === "yellow") padType = OBJECT_TYPE_PAD_YELLOW;  
                            else if (definition.sub === "blue")   padType = OBJECT_TYPE_PAD_BLUE;  
                            else if (definition.sub === "pink")   padType = OBJECT_TYPE_PAD_PINK;  
                        
                            if (padType) {  
                                let hitboxHeight = definition.gridH * TILE_SIZE,
                                    hitboxWidth  = definition.gridW * TILE_SIZE,
                                // shift center down: bottom of cell is worldY - TILE_SIZE/2,  
                                // then move up by half the pad height to get the center 
                                hitbox       = new GameObject(padType, worldX, worldY, hitboxWidth, hitboxHeight);
                                this.objects.push(hitbox);
                                this._addCollisionToSection(hitbox);
                            }
                        }
                    }
                }
            }
        }
        levelSet.size,
        // sort triggers by x position
        this._colorTriggers.sort((a, b) => a.x - b.x),
        this._enterEffectTriggers.sort((a, b) => a.x - b.x),
        // finalize
        this.endXPos = Math.max(SCREEN_WIDTH + 1200, this._lastObjectX + 680);
    }
    // creates the end portal at the end of the level
    createEndPortal(scene) {
        var gradientBarFrame;
        if (this.endXPos <= 0) return;
        const px = this.endXPos,
            py = worldYToScreenY(240),
            endTileSize = Math.round(16); // ?? why not just 16?

        this._endPortalContainer = scene.add.container(px, py);
        for (let i = 0; i < endTileSize; i++) {
            const squarePiece = scene.add.image(0, (i - Math.floor(endTileSize / 2)) * TILE_SIZE, "GJ_WebSheet", "square_02_001.png")
                .setAngle(-90);
            this._endPortalContainer.add(squarePiece);
        }
        this.container.add(this._endPortalContainer),
        
        this._endPortalShine = scene.add.image(px - 58, py, 'GJ_WebSheet', 'gradientBar.png');
        
        const gbHeight = (null == (gradientBarFrame = scene.textures.getFrame("GJ_WebSheet", "gradientBar.png"))
        ? undefined
        : gradientBarFrame.height) || 64;

        this._endPortalShine.setBlendMode(BLEND_ADD),
        this._endPortalShine.setTint(COLOR_GREEN),
        this._endPortalShine.setScale(1, 960 / gbHeight),
        this.additiveContainer.add(this._endPortalShine);

        const ex = px - 30,
            zone = {
                getRandomPoint: pt => {
                    const ang = (85 + 190 * Math.random()) * Math.PI / 180,
                        rad = 320 + 80 * (2 * Math.random() - 1);
                    return pt.x = Math.cos(ang) * rad,
                            pt.y = Math.sin(ang) * rad,
                            pt;
                }
            };
        
        this._endPortalEmitter = scene.add.particles(ex, py, "GJ_WebSheet", {
            frame: "square.png",
            lifespan: {
                min: 200,
                max: 1000
            },
            speed: 0,
            scale: {
                start: 0.75,
                end: 0.125
            },
            alpha: {
                start: 1,
                end: 0
            },
            tint: COLOR_GREEN,
            blendMode: Phaser.BlendModes.ADD,
            frequency: 10,
            maxParticles: 100,
            emitting: true,
            emitZone: {
                type: "random",
                source: zone
            },
            emitCallback: p => {
                const tx = -p.x,
                    ty = -p.y,
                    d = Math.sqrt(tx * tx + ty * ty) || 1,
                    speed = (d - 20) / (p.life / 1000 || 0.3);
                p.velocityX = tx / d * speed, p.velocityY = ty / d * speed;
            }
        }),
        
        this._endPortalEmitter.setDepth(14),
        this.topContainer.add(this._endPortalEmitter),
        this._endPortalGameY = 240;
    }
    updateEndPortalY(camWorldY, flyActive) {
        if (!this._endPortalContainer) return;
        const targetY = 140 + camWorldY;
        let clampedY;
        clampedY = flyActive ? targetY : Math.max(240, targetY);
        const screenY = worldYToScreenY(clampedY);
        this._endPortalContainer.y = screenY, this._endPortalShine.y = screenY, this._endPortalEmitter.y = screenY, this._endPortalGameY = clampedY;
    }
    checkColorTriggers(playerWorldX) {
        let triggers = [];

        for (; this._colorTriggerIdx < this._colorTriggers.length;) {
            let trigger = this._colorTriggers[this._colorTriggerIdx];
            if (!(trigger.x <= playerWorldX)) break;

            triggers.push(trigger),
            this._colorTriggerIdx++;
        }
        
        return triggers;
    }
    /* other */

    resetColorTriggers() {
        this._colorTriggerIdx = 0;
    }
    _addToSection(sprite) {
        const sectionIndex = Math.max(0, Math.floor(sprite._eeWorldX / 400));
        this._sections[sectionIndex] || (this._sections[sectionIndex] = []),
        this._sections[sectionIndex].push(sprite);

        const layer = undefined !== sprite._eeLayer ? sprite._eeLayer : 1;
        if (2 === layer) return void this.topContainer.add(sprite);

        if (!this._sectionContainers[sectionIndex]) {
            const container = {
                additive: this._scene.add.container(0, 0),
                normal: this._scene.add.container(0, 0)
            };
            this.additiveContainer.add(container.additive),
            this.container.add(container.normal),
            this._sectionContainers[sectionIndex] = container;
        }
        const sectionContainer = this._sectionContainers[sectionIndex];
        
        0 === layer
        ? sectionContainer.additive.add(sprite)
        : sprite._eeBehindParent
        ? sectionContainer.normal.addAt(sprite, 0)
        : sectionContainer.normal.add(sprite);
    }
    _addCollisionToSection(object) {
        const sectionIndex = Math.max(0, Math.floor(object.x / 400));
        this._collisionSections[sectionIndex] || (this._collisionSections[sectionIndex] = []),
        this._collisionSections[sectionIndex].push(object);
    }
    _setSectionVisible(sectionIndex, visible) {
        const container = this._sectionContainers[sectionIndex];
        container && (
            container.additive.visible = visible,
            container.normal.visible = visible
        );
    }
    // culling
    updateVisibility(camX) {
        const last = this._sectionContainers.length - 1;
        if (last < 0) return;
        const newMin = Math.max(0, Math.floor((camX - 140) / 400)),
            newMax = Math.min(last, Math.floor((camX + SCREEN_WIDTH + 140) / 400)),
            prevMin = this._visMinSec,
            prevMax = this._visMaxSec;

        if (prevMin < 0) {
            for (let i = 0; i <= last; i++)
                this._setSectionVisible(i, i >= newMin && i <= newMax);
            return this._visMinSec = newMin,
                void(this._visMaxSec = newMax);
        }

        if (newMin !== prevMin || newMax !== prevMax) {
            if (newMin > prevMin) {
                for (let i = prevMin; i <= Math.min(newMin - 1, prevMax); i++)
                    this._setSectionVisible(i, false);
            }
            if (newMax < prevMax) {
                for (let i = Math.max(newMax + 1, prevMin); i <= prevMax; i++) 
                    this._setSectionVisible(i, false);
            }
            if (newMin < prevMin) {
                for (let i = newMin; i <= Math.min(prevMin - 1, newMax); i++) 
                    this._setSectionVisible(i, true);
            }
            if (newMax > prevMax) {
                for (let i = Math.max(prevMax + 1, newMin); i <= newMax; i++) 
                    this._setSectionVisible(i, true);
            }
            this._visMinSec = newMin, this._visMaxSec = newMax;
        }
    }
    // returns all objects in nearby sections for collision checking
    getNearbySectionObjects(worldX) {
        const centerSection = Math.max(0, Math.floor(worldX / 400)),
            minSection = Math.max(0, centerSection - 1),
            maxSection = Math.min(this._collisionSections.length - 1, centerSection + 1),
            buffer = this._nearbyBuffer;
        buffer.length = 0;
        for (let i = minSection; i <= maxSection; i++) {
            const section = this._collisionSections[i];
            if (section) {
                for (let j = 0; j < section.length; j++)
                    buffer.push(section[j]);
            }
        }
        return buffer;
    }
    checkEnterEffectTriggers(playerWorldX) {
        for (; this._enterEffectTriggerIdx < this._enterEffectTriggers.length;) {
            let trigger = this._enterEffectTriggers[this._enterEffectTriggerIdx];
            if (!(trigger.x <= playerWorldX)) break;

            this._activeEnterEffect = trigger.effect,
            this._activeExitEffect = trigger.effect,
            this._enterEffectTriggerIdx++;
        }
    }
    resetEnterEffectTriggers() {
        this._enterEffectTriggerIdx = 0,
        this._activeEnterEffect = 0,
        this._activeExitEffect = 0;
        for (let i = 0; i < this._sections.length; i++) {
            this._setSectionVisible(i, true);
            const section = this._sections[i];
            if (section)
                for (let j = 0; j < section.length; j++) {
                    const sprite = section[j];
                    sprite._eeActive = false,
                    sprite.visible = true,
                    sprite.x = sprite._eeWorldX, 
                    sprite.y = sprite._eeBaseY, 
                    sprite._eeAudioScale || sprite.setScale(1), 
                    sprite.setAlpha(1);
                }
        }
    }
    // slide / scale / fae sprites in and out as they come across the visible window edges
    applyEnterEffects(cameraX) {
        const sectionWidth = 400,
            edgeMargin = 140,
            effectDistance = 200,
            leftEdge = cameraX,
            rightEdge = cameraX + SCREEN_WIDTH,
            centerX = cameraX + SCREEN_WIDTH / 2,

            minSection = Math.max(0, Math.floor((leftEdge - edgeMargin) / sectionWidth)),
            maxSection = Math.min(this._sections.length - 1, Math.floor((rightEdge + edgeMargin) / sectionWidth));
        
        for (let i = minSection; i <= maxSection; i++) {
            const section = this._sections[i];
            if (!section) continue;

            const sectionStartX = i * sectionWidth,
                isFullyInside = sectionStartX >= leftEdge + edgeMargin && sectionStartX + sectionWidth <= rightEdge - edgeMargin;
            for (let j = 0; j < section.length; j++) {
                const sprite = section[j];
                if (isFullyInside) {
                    sprite._eeActive && (
                        sprite._eeActive = false,
                        sprite.y = sprite._eeBaseY,
                        sprite.x = sprite._eeWorldX, 
                        sprite._eeAudioScale || sprite.setScale(1),
                        sprite.setAlpha(1)
                    );
                    continue;
                }
                const spriteWorldX = sprite._eeWorldX,
                    isOnRightSide = spriteWorldX > centerX;

                let visibilityTime;
                if (visibilityTime = isOnRightSide
                    ? Math.max(0, Math.min(1, (rightEdge - spriteWorldX) / edgeMargin))
                    : Math.max(0, Math.min(1, (spriteWorldX - leftEdge) / edgeMargin)),
                // if
                visibilityTime >= 1) {
                    sprite._eeActive && (
                        sprite._eeActive = false,
                        sprite.y = sprite._eeBaseY,
                        sprite.x = sprite._eeWorldX,
                        sprite._eeAudioScale || sprite.setScale(1),
                        sprite.setAlpha(1)
                    );
                    continue;
                }

                sprite._eeActive = true;
                const effect = isOnRightSide ? this._activeEnterEffect : this._activeExitEffect,
                    inversedVisibilityTime = 1 - visibilityTime;
                let targetY = sprite._eeBaseY,
                    targetX = sprite._eeWorldX,
                    targetAlpha = visibilityTime,
                    targetScale = 1;

                switch (effect) {
                    case 0:
                        break;
                    case 1:
                        targetY = sprite._eeBaseY + effectDistance * inversedVisibilityTime;
                        break;
                    case 2:
                        targetY = sprite._eeBaseY - effectDistance * inversedVisibilityTime;
                        break;
                    case 3:
                        targetX = sprite._eeWorldX - effectDistance * inversedVisibilityTime;
                        break;
                    case 4:
                        targetX = sprite._eeWorldX + effectDistance * inversedVisibilityTime;
                        break;
                    case 5:
                        sprite._eeAudioScale || (
                            targetScale = visibilityTime
                        );
                        break;
                    case 6:
                        sprite._eeAudioScale || (
                            targetScale = 1 + 0.75 * inversedVisibilityTime
                        );
                }

                sprite.x !== targetX && (sprite.x = targetX),
                sprite.y !== targetY && (sprite.y = targetY), 
                sprite.alpha !== targetAlpha && (sprite.alpha = targetAlpha),
                sprite._eeAudioScale || sprite.scaleX === targetScale || sprite.setScale(targetScale);
            }
        }
    }
    setGroundColor(hexColor) {
        for (let tile of this._groundTiles)
            tile.setTint(hexColor);
        for (let tile of this._ceilingTiles)
            tile.setTint(hexColor);
    }
    updateAudioScale(scale) {
        for (let sprite of this._audioScaleSprites) sprite.setScale(scale);
    }
    resetVisibility() {
        this._visMinSec = -1,
        this._visMaxSec = -1;
    }
    resetObjects() {
        for (let object of this.objects)
            object.activated = false;
        for (let sprite of this._audioScaleSprites)
            sprite.setScale(0.1);
    }
}

export { LevelClass };
