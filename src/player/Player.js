/*
    the player class, handles sprites, visuals, input, just about everything
*/
// is 30 half the player size?
// UPDATE: 30 is tile size in units, i believe
import { PLAYER_GAME_CAMERA_X, TIME_SCALE, JUMP_VELOCITY, TILE_SIZE2, COLOR_GREEN, COLOR_BLUE, OBJECT_TYPE_SOLID, OBJECT_TYPE_HAZARD, OBJECT_TYPE_PORTAL_SHIP, OBJECT_TYPE_PORTAL_CUBE, OBJECT_TYPE_PAD_YELLOW, OBJECT_TYPE_PAD_BLUE, OBJECT_TYPE_PAD_PINK, PAD_YELLOW_VELOCITY, PAD_PINK_VELOCITY, PAD_BLUE_VELOCITY, worldYToScreenY, BLEND_ADD } from '../constants.js';
import { findAtlasFrame } from '../systems/GameState.js';
import { StreakClass, createSpriteLayer } from './PlayerRenderer.js';

class PlayerClass {
    constructor(scene, state, level) {
        this._scene = scene, 
        this.p = state, // why did he call it p
        this._gameLayer = level, 
        this._rotation = 0, 
        this.rotateActionActive = false, 
        this.rotateActionTime = 0, 
        this.rotateActionDuration = 0, 
        this.rotateActionStart = 0, 
        this.rotateActionTotal = 0, 
        this._showHitboxes = false, 
        this._lastLandObject = null, 
        this._lastXOffset = 0, 
        this._lastCameraX = 0, 
        this._lastCameraY = 0, 
        this._createSprites(), 
        this._initParticles(scene), 
        scene.events.on("shutdown", () => this._cleanupExplosion());
    }
    // creates all the sprites the player will render with
    _createSprites() {
        const scene = this._scene,
            screenY = worldYToScreenY(this.p.y),
            playerX = PLAYER_GAME_CAMERA_X;

        // if theres a _playerSpriteLayer. then tint it green
        // holy convoluted!!
        if (
            this._playerGlowLayer = createSpriteLayer(scene, playerX, screenY, "player_01_glow_001.png", 9, false),
            this._playerSpriteLayer = createSpriteLayer(scene, playerX, screenY, 'player_01_001.png', 10, true),
            this._playerOverlayLayer = createSpriteLayer(scene, playerX, screenY, "player_01_2_001.png", 8, true),
            this._playerExtraLayer = createSpriteLayer(scene, playerX, screenY, "player_01_extra_001.png", 12, true), 
           
            this._playerGlowLayer && (
                this._playerGlowLayer.sprite.setTint(COLOR_BLUE),
                this._playerGlowLayer.sprite._glowEnabled = false
            ),

        this._playerSpriteLayer ) // if this then
            this._playerSpriteLayer.sprite.setTint(COLOR_GREEN);
        else { // else if not, create a green rectangle as a placeholder
            let fallback = scene.add.rectangle(playerX, screenY, TILE_SIZE2, TILE_SIZE2, COLOR_GREEN);
            fallback.setDepth(10),
            this._playerSpriteLayer = {
                sprite: fallback
            };
        }

        // if shipe glow layer exists
        if (
        // set overlay layer blue if it exists
        this._playerOverlayLayer && this._playerOverlayLayer.sprite.setTint(COLOR_BLUE),
        
        this._shipGlowLayer = createSpriteLayer(scene, playerX, screenY, "ship_01_glow_001.png", 9, false),
        this._shipSpriteLayer = createSpriteLayer(scene, playerX, screenY, "ship_01_001.png", 10, false),
        this._shipOverlayLayer = createSpriteLayer(scene, playerX, screenY, 'ship_01_2_001.png', 8, false),
        this._shipExtraLayer = createSpriteLayer(scene, playerX, screenY, "ship_01_extra_001.png", 12, false),
        
        this._shipGlowLayer && (
            this._shipGlowLayer.sprite.setTint(COLOR_BLUE),
            this._shipGlowLayer.sprite._glowEnabled = false
        ),
        
        // if 
        this._shipSpriteLayer
        ) // then
            this._shipSpriteLayer.sprite.setTint(COLOR_GREEN);
        else {
            // else if not, create a green triangle as a placeholder
            let fallback = scene.add.polygon(playerX, screenY, [
                { OBJECT_TYPE_HAZARD: -72, OBJECT_TYPE_SOLID: 40 }, { OBJECT_TYPE_HAZARD: 72, OBJECT_TYPE_SOLID: 0 }, { OBJECT_TYPE_HAZARD: -72, OBJECT_TYPE_SOLID: -40 }, { OBJECT_TYPE_HAZARD: -40, OBJECT_TYPE_SOLID: 0 }
            ], COLOR_GREEN);
            fallback.setDepth(10).setVisible(false),
            this._shipSpriteLayer = {
                sprite: fallback
            };
        }
        
        this._shipOverlayLayer && this._shipOverlayLayer.sprite.setTint(COLOR_BLUE),
        
        this.playerSprite = this._playerSpriteLayer.sprite,
        this.shipSprite = this._shipSpriteLayer.sprite, 
        this._playerLayers = [
            this._playerSpriteLayer,
            this._playerGlowLayer,
            this._playerOverlayLayer,
            this._playerExtraLayer
        ], 
        this._shipLayers = [
            this._shipSpriteLayer, 
            this._shipGlowLayer, 
            this._shipOverlayLayer, 
            this._shipExtraLayer
        ], 
        this._allLayers = [
            ...this._playerLayers,
            ...this._shipLayers
        ];
    }
    _initParticles(scene) {
        // moving along floor particles
        this._particleEmitter = scene.add.particles(0, 0, "GJ_WebSheet", {
            frame: "square.png",
            speed: {
                min: 110,
                max: 190
            },
            angle: {
                min: 225,
                max: 315
            },
            lifespan: {
                min: 150,
                max: 450
            },
            scale: {
                start: 0.5,
                end: 0
            },
            gravityY: 600,
            frequency: 1000 / 30,
            blendMode: "ADD",
            alpha: {
                start: 1,
                end: 0
            },
            tint: COLOR_GREEN
        }),
        this._particleEmitter.stop(),
        this._particleEmitter.setDepth(9),
        this._gameLayer.container.add(this._particleEmitter),
        
        // ship mode flying particles
        this._flyParticleEmitter = scene.add.particles(0, 0, "GJ_WebSheet", {
            frame: 'square.png',
            speed: {
                min: 22,
                max: 38
            },
            angle: {
                min: 225,
                max: 315
            },
            lifespan: {
                min: 150,
                max: 450
            },
            scale: {
                start: 0.5,
                end: 0
            },
            gravityY: 600,
            frequency: 1000 / 30,
            blendMode: "ADD",
            tint: {
                start: 16737280,
                end: 16711680
            },
            alpha: {
                start: 1,
                end: 0
            }
        }),
        this._flyParticleEmitter.stop(),
        this._flyParticleEmitter.setDepth(9),
        this._gameLayer.container.add(this._flyParticleEmitter),
        
        // ship fly particles (faster)
        this._flyParticle2Emitter = scene.add.particles(0, 0, "GJ_WebSheet", {
            frame: "square.png",
            speed: {
                min: 220,
                max: 380
            },
            angle: {
                min: 180,
                max: 360
            },
            lifespan: {
                min: 150,
                max: 450
            },
            scale: {
                start: 0.75,
                end: 0
            },
            gravityY: 600,
            frequency: 1000 / 30,
            blendMode: "ADD",
            tint: {
                start: 16760320,
                end: 16711680
            },
            alpha: {
                start: 1,
                end: 0
            }
        }),
        this._flyParticle2Emitter.stop(),
        this._flyParticle2Emitter.setDepth(9),
        this._gameLayer.container.add(this._flyParticle2Emitter),
        
        // ship ground drag particles
        this._shipDragEmitter = scene.add.particles(0, 0, 'GJ_WebSheet', {
            frame: "square.png",
            OBJECT_TYPE_HAZARD: {
                min: -18,
                max: 18
            },
            speed: {
                min: 149.2 * 1.5,
                max: 229.2 * 1.5
            },
            angle: {
                min: 205,
                max: 295
            },
            lifespan: {
                min: 80,
                max: 220
            },
            scale: {
                start: 0.375,
                end: 0
            },
            gravityX: -700,
            gravityY: 600,
            frequency: 25,
            blendMode: "ADD",
            alpha: {
                start: 1,
                end: 0
            }
        }),
        this._shipDragEmitter.stop(),
        this._shipDragEmitter.setDepth(22),

        this._shipDragActive = false,
        this._particleActive = false,
        this._flyParticle2Active = false,
        this._flyParticleActive = false;
        
        // particles upon landing
        const landParticlesConfig = {
            frame: "square.png",
            speed: {
                min: 250,
                max: 350
            },
            angle: {
                min: 210,
                max: 330
            },
            lifespan: {
                min: 50,
                max: 600
            },
            scale: {
                start: 0.625,
                end: 0
            },
            gravityY: 1000,
            blendMode: "ADD",
            alpha: {
                start: 1,
                end: 0
            },
            tint: COLOR_GREEN,
            emitting: false
        };

        this._landEmitter1 = scene.add.particles(0, 0, 'GJ_WebSheet', {
            ...landParticlesConfig
        }),
        this._landEmitter2 = scene.add.particles(0, 0, "GJ_WebSheet", {
            ...landParticlesConfig
        }),
        
        this._aboveContainer = scene.add.container(0, 0),
        this._aboveContainer.setDepth(13),
        this._aboveContainer.add(this._landEmitter1),
        this._aboveContainer.add(this._landEmitter2),
        this._landIdx = false,
        // streak_01 goes unused?
        this._streak = new StreakClass(this._scene, "streak_01", 0.231, 10, 8, 100, COLOR_BLUE, 0.7),
        this._streak.addToContainer(this._gameLayer.container, 8);
    }
    _updateParticles(cameraX, cameraY, deltaTime) { // cameraX is unused
        if (this.p.isDead) return;

        const playerWorldX = this._scene._playerWorldX,
            playerWorldY = worldYToScreenY(this.p.y);

        // move particles
        this._particleEmitter.particleX = playerWorldX - 20,
        this._particleEmitter.particleY = playerWorldY + 26;
        
        const isOnGround = this.p.onGround && !this.p.isFlying;

        // start or stop ground particles
        isOnGround && !this._particleActive ? (
            this._particleEmitter.start(),
            this._particleActive = true
        ) : !isOnGround && this._particleActive && (
            this._particleEmitter.stop(),
            this._particleActive = false
        );

        // ship flying particles
        {
            const cosRotation = Math.cos(this._rotation),
                sinRotation = Math.sin(this._rotation),
                offsetX = -24,
                offsetY = 18,
                pX = playerWorldX + offsetX * cosRotation - offsetY * sinRotation,
                pY = playerWorldY + offsetX * sinRotation + offsetY * cosRotation,
                jitter = 2 * (2 * Math.random() - 1) * 2;

            this._flyParticleEmitter.particleX = pX,
            this._flyParticleEmitter.particleY = pY + jitter,
            this._flyParticle2Emitter.particleX = pX,
            this._flyParticle2Emitter.particleY = pY + jitter,
            this._streak.setPosition(pX + 8, pY);
        }
        this._streak.update(deltaTime);

        // fly particles
        const isFlying = this.p.isFlying;
        isFlying && !this._flyParticleActive ? (
            this._flyParticleEmitter.start(),
            this._flyParticleActive = true
        ) : !isFlying && this._flyParticleActive && (
            this._flyParticleEmitter.stop(),
            this._flyParticleActive = false
        );

        // flying boost particles
        const isJumpInputDown = this.p.isFlying && this.p.upKeyDown;
        isJumpInputDown && !this._flyParticle2Active ? (
            this._flyParticle2Emitter.start(),
            this._flyParticle2Active = true
        ) : !isJumpInputDown && this._flyParticle2Active && (
            this._flyParticle2Emitter.stop(),
            this._flyParticle2Active = false
        ),

        this._shipDragEmitter.x = PLAYER_GAME_CAMERA_X,
        this._shipDragEmitter.particleY = worldYToScreenY(this.p.y) + cameraY + 30;

        // ship ground drag particles
        const inShipAndOnGround = this.p.isFlying && this.p.onGround && !this.p.onCeiling;
        inShipAndOnGround && !this._shipDragActive ? (
            this._shipDragEmitter.start(),
            this._shipDragActive = true
        ) : !inShipAndOnGround && this._shipDragActive && (
            this._shipDragEmitter.stop(),
            this._shipDragActive = false
        );
    }
    setCubeVisible(visible) {
        this._playerSpriteLayer.sprite.setVisible(visible),
        this._playerGlowLayer && this._playerGlowLayer.sprite.setVisible(visible && this._playerGlowLayer.sprite._glowEnabled),
        this._playerOverlayLayer && this._playerOverlayLayer.sprite.setVisible(visible),
        this._playerExtraLayer && this._playerExtraLayer.sprite.setVisible(visible);
    }
    setShipVisible(visible) {
        this._shipSpriteLayer.sprite.setVisible(visible),
        this._shipGlowLayer && this._shipGlowLayer.sprite.setVisible(visible && this._shipGlowLayer.sprite._glowEnabled),
        this._shipOverlayLayer && this._shipOverlayLayer.sprite.setVisible(visible),
        this._shipExtraLayer && this._shipExtraLayer.sprite.setVisible(visible);
    }
    // updates the player position and other visual elements
    syncSprites(cameraX, cameraY, deltaTime, playerScreenX) {
        if (this._endAnimating) return;
        const screenX = undefined !== playerScreenX ? playerScreenX : PLAYER_GAME_CAMERA_X,
            screenY = worldYToScreenY(this.p.y) + cameraY,
            rotation = this._rotation;

        if (
        this._lastCameraX = cameraX,
        this._lastCameraY = cameraY,
        this._aboveContainer.x = -cameraX,
        this._aboveContainer.y = cameraY,
        
        // if
        this.p.isFlying) { // then
            const offset = 10,
                cosRot = Math.cos(rotation),
                sinRot = Math.sin(rotation),
                
                OFFA = -offset * sinRot,
                OFFB = offset * cosRot,
                OFFC = offset * sinRot,
                OFFD = -offset * cosRot;
            for (const layer of this._shipLayers)
                layer && (
                    layer.sprite.x = screenX + OFFA,
                    layer.sprite.y = screenY + OFFB,
                    layer.sprite.rotation = rotation
                );
            for (const layer of this._playerLayers)
                layer && (
                    layer.sprite.x = screenX + OFFC,
                    layer.sprite.y = screenY + OFFD,
                    layer.sprite.rotation = rotation
                );
        } else {
            for (const layer of this._allLayers)
                layer && (
                    layer.sprite.x = screenX,
                    layer.sprite.y = screenY,
                    layer.sprite.rotation = rotation
                );
        }

        this._updateParticles(cameraX, cameraY, deltaTime);
    }
    // enters ship gamemode
    enterShipMode(portal = null) {
        if (this.p.isFlying) return;
        this.p.isFlying = true,
        this._scene.toggleGlitter(true),

        this.p.yVelocity *= 0.5,
        this.p.onGround = false,
        this.p.canJump = false,
        this.p.isJumping = false,

        this.stopRotation(),
        
        this._rotation = 0,
        this._particleEmitter.stop(),
        this._flyParticle2Active = false,
        
        this._streak.reset(),
        this._streak.start(),
        this.setShipVisible(true);
        
        for (const layer of this._playerLayers)
            layer && layer.sprite.setScale(0.55);
        
        let playerY = this.p.y;
        portal && (
            playerY = undefined !== portal.portalY ?
                portal.portalY : portal.y
            ),
        
        this._gameLayer.setFlyMode(true, playerY);
    }
    // exits ship gamemode
    exitShipMode() {
        if (this.p.isFlying) {
            this.p.isFlying = false,
            this._scene.toggleGlitter(false),
            
            this.p.yVelocity *= 0.5,
            this.p.onGround = false,
            this.p.canJump = false,
            this.p.isJumping = false,
            
            this.stopRotation(),
            
            this._rotation = 0,
            this._flyParticleEmitter.stop(),
            this._flyParticleActive = false,
            this._flyParticle2Emitter.stop(),
            this._flyParticle2Active = false,
            this._shipDragEmitter.stop(),
            this._shipDragActive = false,
            this._particleActive = false,
            
            this._streak.stop(),
            this._streak.reset(),
            this.setShipVisible(false),
            this.setCubeVisible(true);
            
            for (const layer of this._playerLayers)
                layer && layer.sprite.setScale(1);
                
            this._gameLayer.setFlyMode(false, 0);
        }
    }
    hitGround() {
        const wasAirborne = !this.p.onGround;
        if (this.p.isFlying || (this.p.lastGroundY = this.p.y),

        this.p.yVelocity = 0, 
        this.p.onGround = true, 
        this.p.canJump = true, 
        this.p.isJumping = false, 
        this.stopRotation(),

        // if
        wasAirborne && !this.p.isFlying) {
            this._landIdx = !this._landIdx;

            const emitter = this._landIdx ? this._landEmitter1 : this._landEmitter2,
                burstX = this._lastCameraX + PLAYER_GAME_CAMERA_X,
                burstY = worldYToScreenY(this.p.y) + 30;
            
            emitter.explode(10, burstX, burstY);
        }
    }
    hitPad(padType) {
        if (padType === OBJECT_TYPE_PAD_YELLOW) {
            this.p.yVelocity = PAD_YELLOW_VELOCITY * this.flipMod(),
            this.p.isJumping  = true,
            this.p.onGround   = false,
            this.p.canJump    = false,
            this.runRotateAction();
        } else if (padType === OBJECT_TYPE_PAD_BLUE) {
            this.p.gravityFlipped = !this.p.gravityFlipped;
            this.p.yVelocity = PAD_BLUE_VELOCITY * this.flipMod(),
            this.p.isJumping  = true,
            this.p.onGround   = false,
            this.p.canJump    = false,
            this.runRotateAction();
        } else if (padType === OBJECT_TYPE_PAD_PINK) {
            this.p.yVelocity = PAD_PINK_VELOCITY * this.flipMod(),
            this.p.isJumping  = true,
            this.p.onGround   = false,
            this.p.canJump    = false,
            this.runRotateAction();
        }
    }
    // kill the player and create explosion particles
    killPlayer() {
        if (this.p.isDead) return;
        this.p.isDead = true,
        this._scene.toggleGlitter(false),
        this._particleEmitter.stop(),
        this._particleActive = false,
        this._flyParticleEmitter.stop(),
        this._flyParticleActive = false,
        this._flyParticle2Emitter.stop(),
        this._flyParticle2Active = false,
        this._shipDragEmitter.stop(),
        this._shipDragActive = false,
        this._streak.stop(),
        this._streak.reset();

        const scene = this._scene,
            deathScreenX = scene._playerWorldX - scene._cameraX,
            deathScreenY = worldYToScreenY(this.p.y) + this._lastCameraY,
            deathScale = 0.9;

        scene.add.particles(deathScreenX, deathScreenY, 'GJ_WebSheet', {
            frame: "square.png",
            speed: {
                min: 200,
                max: 800
            },
            angle: {
                min: 0,
                max: 360
            },
            scale: {
                start: 18 / 32,
                end: 0
            },
            alpha: {
                start: 1,
                end: 0
            },
            lifespan: {
                min: 50,
                max: 800
            },
            quantity: 100,
            stopAfter: 100,
            blendMode: BLEND_ADD,
            tint: COLOR_GREEN,
            OBJECT_TYPE_HAZARD: {
                min: -20,
                max: 20
            },
            OBJECT_TYPE_SOLID: {
                min: -20,
                max: 20
            }
        }).setScrollFactor(0).setDepth(15);
        
        // expanding circle
        // why didnt he use emitCircleEffect? maybe this was before that existed?
        const crashCircle = scene.add.graphics()
            .setScrollFactor(0)
            .setDepth(15)
            .setBlendMode(BLEND_ADD),
        circleTweenState = {
            t: 0
        };
        scene.tweens.add({
            targets: circleTweenState,
            t: 1,
            duration: 500,
            ease: 'Quad.Out',
            onUpdate: () => {
                const radius = 18 + 144 * circleTweenState.t,
                    alpha = 1 - circleTweenState.t;
                crashCircle.clear(),
                crashCircle.fillStyle(COLOR_GREEN, alpha),
                crashCircle.fillCircle(deathScreenX, deathScreenY, radius);
            },
            onComplete: () => crashCircle.destroy()
        }),
        
        this._createExplosionPieces(deathScreenX, deathScreenY, deathScale),
        this.setCubeVisible(false),
        this.setShipVisible(false);
    }
    // creates the pieces for the player explosion effect that collide with the ground
    _createExplosionPieces(centerX, centerY, scale) {
        const scene = this._scene,

            sizeModifier = 40 * scale, // 36
            textureSize = Math.round(2 * sizeModifier), // 72
            
            renderTexture = scene.make.renderTexture({
                OBJECT_TYPE_HAZARD: 0,
                OBJECT_TYPE_SOLID: 0,
                width: textureSize,
                height: textureSize,
                add: false
            }),

            layerOrder = [
                this._playerGlowLayer,
                this._playerOverlayLayer,
                this._shipGlowLayer,
                this._shipOverlayLayer,
                this._playerSpriteLayer,
                this._playerExtraLayer,
                this._shipSpriteLayer,
                this._shipExtraLayer
            ];

        for (const layer of layerOrder) {
            if (!layer || !layer.sprite.visible) continue;
            
            const sprite = layer.sprite;
            renderTexture.draw(
                sprite,
                textureSize / 2 + (sprite.x - centerX),
                textureSize / 2 + (sprite.y - centerY)
            );
        }

        // create unique texture by slicing up the sprite
        const UID = "__deathRT_" + Date.now();
        renderTexture.saveTexture(UID);
        const pieceTexture = scene.textures.get(UID);
        
        // randomly decide how many pieces to slice the texture into (between 2 and 4 in each dimension, with a bias towards 2)
        let columns = 2 + Math.round(2 * Math.random()),
            rows = 2 + Math.round(2 * Math.random());
        const random = Math.random();

        random > 0.95 ?
            columns = 1 :
        random > 0.9 && (
            rows = 1
        );

        const baseSpeed = 9.34740324 * 0.8,
            halfBaseSpeed = 0.5 * baseSpeed,
            baseSpeed2 = 1 * baseSpeed, // ?
            variance = 0.45,
            colW = textureSize / columns,
            rowH = textureSize / rows,
            colWidths = [],
            rowHeights = [],
            colStarts = [0],
            rowStarts = [0];

        let totalColW = 0,
            totalRowH = 0;

        for (let c = 0; c < columns - 1; c++) {
            const OBJECT_TYPE_PORTAL_CUBE = Math.round(colW * (0.55 + Math.random() * variance * 2));
            colWidths.push(OBJECT_TYPE_PORTAL_CUBE),
            totalColW += OBJECT_TYPE_PORTAL_CUBE,
            colStarts.push(totalColW);
        }
        
        colWidths.push(textureSize - totalColW);
        for (let r = 0; r < rows - 1; r++) {
            const h = Math.round(rowH * (0.55 + Math.random() * variance * 2));
            rowHeights.push(h),
            totalRowH += h,
            rowStarts.push(totalRowH);
        }
        rowHeights.push(textureSize - totalRowH),
        this._explosionPieces = [], this._explosionContainer = scene.add.container(centerX, centerY).setDepth(16);
        
        let pieceIndex = 0;
        for (let c = 0; c < columns; c++) {
            const pieceW = colWidths[c],
                startX = colStarts[c];
            for (let r = 0; r < rows; r++) {
                const pieceH = rowHeights[r],
                    startY = rowStarts[r];
                if (pieceW <= 0 || pieceH <= 0) continue;

                pieceIndex++;

                const pieceUID = 'piece_' + c + '_' + r;
                pieceTexture.add(pieceUID, 0, startX, startY, pieceW, pieceH);
                
                const sprite = scene.add.image(0, 0, UID, pieceUID);
                sprite.x = startX + pieceW / 2 - textureSize / 2,
                sprite.y = -(startY + pieceH / 2 - textureSize / 2),
                this._explosionContainer.add(sprite);
                
                // for every other piece, add a particle emitter for the piece that emits from the piece position
                let pieceEmitter = null;
                if (pieceIndex % 2 == 0) {
                    const sparkleDuration = 200 + 200 * Math.random(),
                        thisSprite = sprite;

                    pieceEmitter = scene.add.particles(0, 0, "GJ_WebSheet", {
                        frame: 'square.png',
                        speed: 0,
                        scale: {
                            start: 0.5,
                            end: 0
                        },
                        alpha: {
                            start: 1,
                            end: 0
                        },
                        lifespan: sparkleDuration,
                        frequency: 25,
                        quantity: 1,
                        emitting: true,
                        blendMode: BLEND_ADD,
                        tint: COLOR_GREEN,
                        emitCallback: particle => {
                            particle.x = thisSprite.x + 3 * (2 * Math.random() - 1) * 2,
                            particle.y = thisSprite.y + 3 * (2 * Math.random() - 1) * 2;
                        }
                    }),
                    this._explosionContainer.addAt(pieceEmitter, 0);
                }

                const thisConfig = {
                    spr: sprite,
                    particle: pieceEmitter,
                    xVel: halfBaseSpeed + (2 * Math.random() - 1) * baseSpeed2,
                    yVel: -(12 + 6 * (2 * Math.random() - 1)),
                    timer: 1.4,
                    fadeTime: 0.5,
                    rotDelta: 360 * (2 * Math.random() - 1) / 60,
                    halfSize: Math.min(pieceW, pieceH) / 2
                };
                this._explosionPieces.push(thisConfig);
            }
        }

        // calculate the y position at which the pieces should collide with the ground
        this._explosionGroundSY = worldYToScreenY(0) + this._lastCameraY,

        this._explosionRT = renderTexture,
        this._explosionTexKey = UID;
    }
    updateExplosionPieces(deltaTime) {
        if (!this._explosionPieces || 0 === this._explosionPieces.length) return;
       
        const deltaSeconds = deltaTime / 1000,
            speedFactor = Math.min(60 * deltaSeconds * 0.9, 2),
            gravity = 0.5 * speedFactor * 2,
            groundRelY = this._explosionGroundSY - this._explosionContainer.y;
            
        let i = 0;
        for (; i < this._explosionPieces.length;) {
            const piece = this._explosionPieces[i];
            if (piece.timer -= deltaSeconds,
                
            //if
                piece.timer > 0) {
                {
                    piece.yVel += gravity,
                    piece.xVel *= 0.98 + 0.02 * (1 - speedFactor);
                    
                    let newX = piece.spr.x + piece.xVel * speedFactor,
                    newY = piece.spr.y + piece.yVel * speedFactor;
                    
                    // bounce!
                    const groundLimit = groundRelY - piece.halfSize;
                    if (newY > groundLimit && piece.yVel > 0 && (
                        newY = groundLimit,
                        piece.yVel *= -0.8,
                        Math.abs(piece.yVel) < 3 && (piece.yVel = -3)
                    ),

                    piece.spr.x = newX,
                    piece.spr.y = newY,
                    piece.spr.angle += piece.rotDelta * speedFactor,
                    
                // if
                piece.timer < piece.fadeTime) {
                        const fadeAlpha = piece.timer / piece.fadeTime;
                        piece.spr.setAlpha(fadeAlpha),
                        piece.particle && piece.particle.setAlpha(fadeAlpha);
                    }
                }
                i++;
            } else
                piece.particle && (
                    piece.particle.stop(),
                    piece.particle.destroy()
                ),
                
                piece.spr.destroy(),
                this._explosionPieces.splice(i, 1);
        }

        // cleanup if there are no pieces
        0 === this._explosionPieces.length && this._cleanupExplosion();
    }
    // clean up everything related to the explosion
    _cleanupExplosion() {
        if (this._explosionPieces) {
            for (const piece of this._explosionPieces)
                piece.particle && (
                    piece.particle.stop(),
                    piece.particle.destroy()
                ),

                piece.spr && piece.spr.destroy();
        }

        this._explosionContainer && (
            this._explosionContainer.destroy(),
            this._explosionContainer = null
        ),
        
        this._explosionTexKey && (
            this._scene.textures.remove(this._explosionTexKey),
            this._explosionTexKey = null
        ),
        
        this._explosionRT && (
            this._explosionRT.destroy(),
            this._explosionRT = null
        ),
        
        this._explosionPieces = null;
    }
    // plays portal shine effect on world object
    _playPortalShine(object) {
        const scene = this._scene,
            portalScreenX = object.x,
            portalScreenY = worldYToScreenY(object.portalY),
            
            frames = [
                "portalshine_02_front_001.png",
                "portalshine_02_back_001.png"
            ],

            containers = [
                this._gameLayer.topContainer,
                this._gameLayer.container
            ];
            
        for (let i = 0; i < 2; i++) {
            const atlasFrame = findAtlasFrame(scene, frames[i]);
            if (!atlasFrame) continue;

            const image = scene.add.image(portalScreenX, portalScreenY, atlasFrame.atlas, atlasFrame.frame);
            
            image.setBlendMode(BLEND_ADD),
            image.setAlpha(0),
            containers[i].add(image),
            scene.tweens.add({
                targets: image,
                alpha: {
                    from: 0,
                    to: 1
                },
                duration: 50,
                onComplete: () => {
                    scene.tweens.add({
                        targets: image,
                        alpha: 0,
                        duration: 400,
                        onComplete: () => image.destroy()
                    });
                }
            });
        }
    }
    // snap player x on certain grid positions
    _checkSnapJump(landedObject) {
        const snapPatterns = [
            { dx: 240, dy: 60 },
            { dx: 300, dy: -60 },
            { dx: 180, dy: 120 }
        ],
        previousObject = this._lastLandObject;

        if (previousObject && previousObject !== landedObject && previousObject.type === OBJECT_TYPE_SOLID) {
            const prevX = previousObject.x,
                prevY = previousObject.y,

                newX = landedObject.x,
                newY = landedObject.y,

                gravityAxis = this.p.gravityFlipped ? -1 : 1;
            
            let isSnappable = false;
            for (const pattern of snapPatterns)
                if (Math.abs(newX - (prevX + pattern.dx)) <= 2 &&
                    Math.abs(newY - (prevY + pattern.dy * gravityAxis)) <= 2) {
                    isSnappable = true;
                    break;
                }
                
            if (isSnappable) {
                const targetX = landedObject.x + this._lastXOffset,
                    currentX = this._scene._playerWorldX;
                let snappedX;
                snappedX = Math.abs(targetX - currentX) <= 2 ? targetX : targetX > currentX ? currentX + 2 : currentX - 2,
                this._scene._playerWorldX = snappedX;    
            }
        }
        
        this._lastLandObject = landedObject,
        this._lastXOffset = this._scene._playerWorldX - landedObject.x;
    }
    _isFallingPastThreshold() {
        return this.p.gravityFlipped ? this.p.yVelocity > 0.25 : this.p.yVelocity < -0.25;
    }
    // returns 1 or -1 based on gravity direction
    flipMod() {
        return this.p.gravityFlipped ? -1 : 1;
    }
    // starts the rotation animation for when the player is airborne
    runRotateAction() {
        this.rotateActionActive = true,
        this.rotateActionTime = 0,
        this.rotateActionDuration = 0.39 / TIME_SCALE,
        this.rotateActionStart = this._rotation,
        this.rotateActionTotal = Math.PI * this.flipMod();
    }
    stopRotation() {
        this.rotateActionActive = false;
    }
    updateRotateAction(deltaTime) {
        if (!this.rotateActionActive) return;

        this.rotateActionTime += deltaTime,
        this.rotateActionTime >= this.rotateActionDuration && (
            this.rotateActionActive = false
        );
        let time = Math.min(this.rotateActionTime / this.rotateActionDuration, 1);
        this._rotation = this.rotateActionStart + this.rotateActionTotal * time;
    }
    convertToClosestRotation() {
        let tau = Math.PI / 2;
        return Math.round(this._rotation / tau) * tau;
    }
    // sphericaal linear interpolation
    slerp2D(from, to, t) {
        let diff = to - from;
        for (; diff > Math.PI;) diff -= 2 * Math.PI;
        for (; diff < -Math.PI;) diff += 2 * Math.PI;
        return from + diff * t;
    }
    // updates rotation while on ground
    updateGroundRotation(deltaTime) {
        let snapped = this.convertToClosestRotation(),
            maxRate = 0.1575 * 3,
            blend = Math.min(1 * deltaTime, maxRate * deltaTime);
        this._rotation = this.slerp2D(this._rotation, snapped, blend);
    }
    // updates the ship rotation
    updateShipRotation(deltaTime) {
        let dy = -(this.p.y - this.p.lastY),
            dx = 10.3860036 * deltaTime;
        if (dx * dx + dy * dy >= 0.6 * deltaTime) {
            let targetAngle = Math.atan2(dy, dx),
                maxRate = 0.15,
                blend = Math.min(1 * deltaTime, maxRate * deltaTime);
            this._rotation = this.slerp2D(this._rotation, targetAngle, blend);
        }
    }
    playerIsFalling() {
        return this.p.gravityFlipped ? this.p.yVelocity > 3.832796 : this.p.yVelocity < 3.832796;
    }
    updateJump(deltaTime) {
        if (this.p.isFlying)
            this._updateFlyJump(deltaTime);
        else {
            if (this.p.upKeyDown && this.p.canJump) // jump
                this.p.isJumping = true,
                this.p.onGround = false,
                this.p.canJump = false,
                this.p.upKeyPressed = false,
                this.p.yVelocity = 22.360064 * this.flipMod(),
                this.runRotateAction();
            else { if (this.p.isJumping) // rising
                    this.p.yVelocity -= JUMP_VELOCITY * deltaTime * this.flipMod(),
                    this.playerIsFalling() && (
                        this.p.isJumping = false,
                        this.p.onGround = false
                    );
                else {
                    // falling
                    if (this.playerIsFalling() && (this.p.canJump = false),
                    this.p.yVelocity -= JUMP_VELOCITY * deltaTime * this.flipMod(),
                    
                    this.p.gravityFlipped
                        ? this.p.yVelocity = Math.min(this.p.yVelocity, 30)
                        : this.p.yVelocity = Math.max(this.p.yVelocity, -30),
                        
                    this._isFallingPastThreshold() && !this.rotateActionActive &&
                        this.runRotateAction(),
                        
                    // if
                    this.playerIsFalling()) {
                        let isFallingFast;
                        isFallingFast = this.p.gravityFlipped
                            ? this.p.yVelocity > 4
                            : this.p.yVelocity < -4,
                            
                        isFallingFast && (this.p.onGround = false);
                    }
                }
            }
        }
    }
    // ship flying
    _updateFlyJump(deltaTime) {
        let gravityMultiplier = 0.8;
        this.p.upKeyDown && !this.p.wasBoosted && (
            gravityMultiplier = -1
        ),
        this.p.upKeyDown || this.playerIsFalling() || (
            gravityMultiplier = 1.2
        );

        let damp = 0.4;
        this.p.upKeyDown && this.playerIsFalling() && (
            damp = 0.5
        ),
        
        this.p.yVelocity -= JUMP_VELOCITY * deltaTime * this.flipMod() * gravityMultiplier * damp,
        
        this.p.upKeyDown && (
            this.p.onGround = false
        ),

        this.p.wasBoosted || (
            this.p.gravityFlipped ? (
                this.p.yVelocity = Math.max(this.p.yVelocity, -16),
                this.p.yVelocity = Math.min(this.p.yVelocity, 12.8)
            )
            : (
                this.p.yVelocity = Math.max(this.p.yVelocity, -12.8),
                this.p.yVelocity = Math.min(this.p.yVelocity, 16)
            )
        );
    }
    checkCollisions(cameraX) {
        const halfSize = 30, // 80% sure this is half size
            worldX = cameraX + PLAYER_GAME_CAMERA_X,
            playerY = this.p.y,
            lastPlayerY = this.p.lastY,
            innerMargin = this.p.isFlying ? 12 : 20;
        
        this.p.collideTop = 0,
        this.p.collideBottom = 0,
        this.p.onCeiling = false;
        
        let landedOnObject = false;
        const nearbyObjects = this._gameLayer.getNearbySectionObjects(worldX);
        
        for (let object of nearbyObjects) {
            let objectLeft = object.x - object.w / 2,
                objectRight = object.x + object.w / 2,
                objectBottom = object.y - object.h / 2,
                objectTop = object.y + object.h / 2;

            if (!(worldX + 30 <= objectLeft || worldX - 30 >= objectRight || playerY + halfSize <= objectBottom || playerY - halfSize >= objectTop)) {
                
                if (object.type !== OBJECT_TYPE_PORTAL_SHIP) { // ship portal

                    if (object.type !== OBJECT_TYPE_PORTAL_CUBE) { // cube portal

                        if (object.type === OBJECT_TYPE_HAZARD) // hazard
                            return void this.killPlayer();
                        
                        if (object.type === OBJECT_TYPE_SOLID) { // solid
                            let topEdge = playerY - halfSize + innerMargin,
                                lastTopEdge = lastPlayerY - halfSize + innerMargin,
                                bottomEdge = playerY + halfSize - innerMargin,
                                lastBottomEdge = lastPlayerY + halfSize - innerMargin;
                            
                            const crashMargin = 9,
                                isCrashing =
                                    worldX + crashMargin > objectLeft &&
                                    worldX - crashMargin < objectRight &&
                                    playerY + crashMargin > objectBottom &&
                                    playerY - crashMargin < objectTop,

                                landingOnTop = (this.p.yVelocity <= 0 || this.p.onGround) &&
                                    (topEdge >= objectTop || lastTopEdge >= objectTop);

                            // cube crashing
                            if (isCrashing && !landingOnTop) return void this.killPlayer();

                            if (worldX + 30 - 5 > objectLeft && worldX - 30 + 5 < objectRight) {
                                if ((topEdge >= objectTop || lastTopEdge >= objectTop) && (this.p.yVelocity <= 0 || this.p.onGround)) {
                                    // land on top of block
                                    this.p.y = objectTop + halfSize, 
                                    this.hitGround(), 
                                    landedOnObject = true, 
                                    this.p.collideBottom = objectTop, 
                                    this.p.isFlying || this._checkSnapJump(object);
                                    continue;
                                }
                                if ((bottomEdge <= objectBottom || lastBottomEdge <= objectBottom) && (this.p.yVelocity >= 0 || this.p.onGround) && this.p.isFlying) {
                                    // hit ceiling in ship mode    
                                    this.p.y = objectBottom - halfSize, 
                                    this.hitGround(), 
                                    this.p.onCeiling = true, 
                                    this.p.collideTop = objectBottom;
                                    continue;
                                }
                            }
                        }
                    } else 
                        // cube portal
                        object.activated || (
                            object.activated = true,
                            this._playPortalShine(object),
                            this.exitShipMode()
                        );
                } else
                    // ship portal
                    object.activated || (
                        object.activated = true,
                        this._playPortalShine(object),
                        this.enterShipMode(object)
                    );
                if (object.type === OBJECT_TYPE_PAD_YELLOW ||  
                    object.type === OBJECT_TYPE_PAD_PINK   ||  
                    object.type === OBJECT_TYPE_PAD_BLUE) {  
                
                    // only trigger when landing on top of the pad  
                    let topEdge     = playerY - halfSize + innerMargin,  
                        lastTopEdge = lastPlayerY - halfSize + innerMargin;  
                
                    if ((topEdge >= objectTop || lastTopEdge >= objectTop) &&  
                        (this.p.yVelocity <= 0 || this.p.onGround)) {  
                        this.p.y = objectTop + halfSize,  
                        this.hitPad(object.type),  
                        landedOnObject = true;  
                        continue;  
                    }
                }
            }
        }
        
        // crush between ceiling and ground
        if (0 !== this.p.collideTop && 0 !== this.p.collideBottom) {
            if (Math.abs(this.p.collideTop - this.p.collideBottom) < 48)
                return void this.killPlayer();
        }

        // ground
        let floorY = this._gameLayer.getFloorY();
        landedOnObject || this.p.y <= floorY + 30 && (
            this.p.y = floorY + 30,
            this.hitGround()
        );

        // ceiling
        let ceilingY = this._gameLayer.getCeilingY();
        if (null !== ceilingY && this.p.y >= ceilingY - 30 && (
            this.p.y = ceilingY - 30,
            this.hitGround(),
            this.p.onCeiling = true
        ),
        
        // if
        this.p.isFlying) {
            const onFloor = this.p.y <= floorY + 30,
                isOnCeiling = null !== ceilingY && this.p.y >= ceilingY - 30;

            landedOnObject || onFloor || 0 !== this.p.collideTop || isOnCeiling || (
                this.p.onGround = false
            );
        }
    }
    // draws hitboxes for debugging
    drawHitboxes(graphics, cameraX, cameraY) {
        if (graphics.clear(),
        
        !this._showHitboxes) return;

        const halfSize = 30,
            halfSize2 = 30, // maybe y?
            offsettedCameraX = cameraX + PLAYER_GAME_CAMERA_X, // this is where the player stays on screen
            playerY = this.p.y,
            innerMargin = this.p.isFlying ? 12 : 20,
            nearbyObjects = this._gameLayer.getNearbySectionObjects(offsettedCameraX);
        
        // draw hitboxes
        for (let object of nearbyObjects) {
            let screenX = object.x - cameraX,
                screenY = worldYToScreenY(object.y) + cameraY,
                color = 0xFF00;
            
            object.type === OBJECT_TYPE_HAZARD
            ? color = 0xFF4444 // hazard
            : object.type !== OBJECT_TYPE_PORTAL_SHIP && object.type !== OBJECT_TYPE_PORTAL_CUBE || (
                color = 0x4488FF // ships
            ),
            
            graphics.lineStyle(2, color, 0.7),
            graphics.strokeRect(screenX - object.w / 2, screenY - object.h / 2, object.w, object.h);
        }

        const playerScreenX = PLAYER_GAME_CAMERA_X,
            playerScreenY = worldYToScreenY(playerY) + cameraY;

        graphics.lineStyle(2, 0xFFFF, 0.8),
        graphics.strokeRect(playerScreenX - halfSize, playerScreenY - halfSize2, TILE_SIZE2, TILE_SIZE2),
        graphics.lineStyle(2, 0xFFFF00, 0.8),
        graphics.strokeRect(playerScreenX - halfSize + 5, playerScreenY - halfSize2, 50, TILE_SIZE2),
        graphics.lineStyle(2, 0xFF0000, 0.8),
        graphics.strokeRect(playerScreenX - halfSize, playerScreenY - halfSize2 + 5, TILE_SIZE2, 50);
        let innerTopY = worldYToScreenY(playerY - halfSize2 + innerMargin) + cameraY,
            innerBottomY = worldYToScreenY(playerY + halfSize2 - innerMargin) + cameraY;
        graphics.lineStyle(2, 0xFF8800, 0.9), graphics.lineBetween(playerScreenX - halfSize - 8, innerTopY, playerScreenX + halfSize + 8, innerTopY), graphics.lineBetween(playerScreenX - halfSize - 8, innerBottomY, playerScreenX + halfSize + 8, innerBottomY), (graphics.lineStyle(2, 16777215, 1), graphics.strokeRect(playerScreenX - 9, playerScreenY - 9, 36, 18));
    }
    setShowHitboxes(value) {
        this._showHitboxes = value;
    }
    playEndAnimation(endX, onComplete, portalY) {
        this._endAnimating = true;
        const scene = this._scene,
            landingY = portalY || 240,
            startWorldX = scene._playerWorldX,
            startY = this.p.y,

            targetX = endX + 100,
            targetY = landingY - 40,

            pAX = startWorldX,
            pAY = startY,
            pBX = startWorldX + 80,
            pBY = landingY + 300,
            
            visibleSprites = [
                this._playerSpriteLayer,
                this._playerGlowLayer,
                this._playerOverlayLayer,
                this._playerExtraLayer,
                this._shipSpriteLayer,
                this._shipGlowLayer,
                this._shipOverlayLayer,
                this._shipExtraLayer
            ].filter(layer => layer && layer.sprite.visible).map(layer => layer.sprite);
            
        this._particleEmitter.stop(),
        this._flyParticleEmitter.stop(),
        this._flyParticle2Emitter.stop(),
        this._shipDragEmitter.stop();

        const isFlying = this.p.isFlying,
            shipLayers = [this._shipSpriteLayer, this._shipGlowLayer, this._shipOverlayLayer, this._shipExtraLayer],
            playerLayers = [this._playerSpriteLayer, this._playerGlowLayer, this._playerOverlayLayer, this._playerExtraLayer],
            spritePieces = visibleSprites.map(sprite => {
                let localY = 0;
                if (isFlying) {
                    const filteredShipLayers = shipLayers.some(layer => layer && layer.sprite === sprite),
                        playerLayers = playerLayers.some(layer => layer && layer.sprite === sprite);
                    filteredShipLayers ? localY = 10 : playerLayers && (localY = -10);
                }
                return {
                    spr: sprite,
                    localY: localY
                };
            }),

            streak = this._streak,
            tweenState = {
                val: 0
            };

        scene.tweens.add({
            targets: tweenState,
            val: 1,
            duration: 1000,
            ease: time => Math.pow(time, 1.2),
            onUpdate: () => { // bezier curve
                const time = tweenState.val,

                    curveX = (1 - time) ** 3 * pAX + 3 * (1 - time) ** 2 * time * pAX + 3 * (1 - time) * time ** 2 * pBX + time ** 3 * targetX,
                    curveY = (1 - time) ** 3 * pAY + 3 * (1 - time) ** 2 * time * pAY + 3 * (1 - time) * time ** 2 * pBY + time ** 3 * targetY,
                    
                    screenX = curveX - scene._cameraX,
                    screenY = worldYToScreenY(curveY) + scene._cameraY,

                    alpha = 1 - time * time,
                    rotation = spritePieces[0].spr.rotation,
                    cosR = Math.cos(rotation),
                    sinR = Math.sin(rotation);

                for (const piece of spritePieces) {
                    const xOffset = -piece.localY * sinR,
                        yOffset = piece.localY * cosR;

                    piece.spr.setPosition(screenX + xOffset, screenY + yOffset), piece.spr.setAlpha(alpha);
                }
                streak.setPosition(curveX, worldYToScreenY(curveY)),
                streak.update(scene.game.loop.delta / 1000);
            },
            onComplete: () => {
                for (const piece of spritePieces)
                    piece.spr.setVisible(false);
                
                streak.stop(),
                streak.reset(),
                onComplete();
            }
        });
        // spin
        for (const sprite of visibleSprites) scene.tweens.add({
            targets: sprite,
            angle: sprite.angle + 360,
            duration: 1000,
            ease: time => Math.pow(time, 1.5)
        });
    }
    reset() {
        this._cleanupExplosion(),
        this._endAnimating = false,
        this._lastLandObject = null,
        this._lastXOffset = 0,
        this.stopRotation(),
        this.rotateActionTime = 0,
        this._rotation = 0,
        this._lastCameraX = 0,
        this._lastCameraY = 0,
        this.setCubeVisible(true),
        this.setShipVisible(false);
        for (const layer of this._allLayers)
            layer && layer.sprite.setAlpha(1);
        for (const layer of this._playerLayers)
            layer && layer.sprite.setScale(1);
        this._particleEmitter.stop(),
        this._particleActive = false,
        this._flyParticleEmitter.stop(),
        this._flyParticleActive = false,
        this._flyParticle2Emitter.stop(),
        this._flyParticle2Active = false,
        this._shipDragEmitter.stop(),
        this._shipDragActive = false,
        this._streak.stop(),
        this._streak.reset();
    }
}
export { PlayerClass };
