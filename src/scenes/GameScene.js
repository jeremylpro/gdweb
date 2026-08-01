/*
    the scene where the actual game happens
    includes main game loop and title screen and all that stuff, in 1 scene
*/
import * as Phaser from 'phaser';
import { SCREEN_WIDTH, SCREEN_HEIGHT, SHIP_CAMERA_Y_OFFSET, PLAYER_GAME_CAMERA_X, TICK_DELTA, PLAYER_SPEED, TIME_SCALE, JUMP_VELOCITY, COLOR_GREEN, COLOR_BLUE, OBJECT_TYPE_SOLID, OBJECT_TYPE_HAZARD, OBJECT_TYPE_PORTAL_CUBE, GROUND_BOUNDS_Y, BLEND_ADD, worldYToScreenY, setScreenWidth } from '../constants.js';
import { GameState } from '../systems/GameState.js';
import { LevelClass } from '../world/Level.js';
import { PlayerClass } from '../player/Player.js';
import { ID_BACKGROUND_COLOR, ID_GROUND_COLOR, ColorManager } from '../systems/ColorManager.js';
import { AudioClass } from '../systems/AudioManager.js';
import { emitCircleEffect, emitWinBurst } from '../effects.js';

class GameScene extends Phaser.Scene {
    constructor() {
        super({
            key: "GameScene"
        });
    }
    create() {
        // parallax
        this._bgSpeedX = 0.1,
        this._bgSpeedY = 0.1,

        this._menuCameraX = -PLAYER_GAME_CAMERA_X,
        this._prevCameraX = -PLAYER_GAME_CAMERA_X,
        
        this._bg = this.add.tileSprite(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, "game_bg_01")
        .setOrigin(0, 0).setScrollFactor(0).setDepth(-10);
        
        const backgroundHeight = this.textures.get('game_bg_01').source[0].height;
        this._bgInitY = backgroundHeight - SCREEN_HEIGHT - SHIP_CAMERA_Y_OFFSET,

        this._cameraX = -PLAYER_GAME_CAMERA_X,
        this._cameraY = 0,
        this._cameraXRef = {
            get 'value'() {
                return this._v;
            },
            _v: -PLAYER_GAME_CAMERA_X
        },
        
        // game systems
        this._state = new GameState(),
        this._level = new LevelClass(this, this._cameraXRef),
        this._player = new PlayerClass(this, this._state, this._level),
        this._colorManager = new ColorManager(),
        this._audio = new AudioClass(this);
        
        let levelData = this.cache.text.get("level_1");
        levelData && this._level.loadLevel(levelData),
        this._level.createEndPortal(this),

        this._glitterCenterX = 0,
        this._glitterCenterY = GROUND_BOUNDS_Y,
        this._glitterEmitter = this.add.particles(0, 0, 'GJ_WebSheet', {
            frame: 'square.png',
            speed: 0,
            scale: {
                start: 0.375,
                end: 0
            },
            alpha: {
                start: 1,
                end: 0
            },
            lifespan: {
                min: 200,
                max: 1800
            },
            frequency: 60,
            blendMode: BLEND_ADD,
            tint: COLOR_GREEN,
            emitting: false,
            emitCallback: particle => {
                particle.x = this._glitterCenterX + (2 * Math.random() - 1) * (SCREEN_WIDTH / 1.8),
                particle.y = this._glitterCenterY + 320 * (2 * Math.random() - 1);
            }
        }),
        this._level.additiveContainer.add(this._glitterEmitter),
        
        this._bg.setTint(this._colorManager.getHex(ID_BACKGROUND_COLOR)),
        this._level.setGroundColor(this._colorManager.getHex(ID_GROUND_COLOR)),
        
        this._level.additiveContainer.setVisible(false),
        this._level.container.setVisible(false),
        this._level.topContainer.setVisible(false),
        
        // stats
        this._attempts = 1,
        this._bestPercent = 0,
        this._lastPercent = 0,
        this._endPortalGameY = 240,
        this._resetGameplayState(),
        this._totalJumps = 0,
        this._playTime = 0,
        
        // menu state
        this._menuActive = true,
        this._slideIn = false,
        this._slideGroundX = null,
        this._firstPlay = true,
        
        this._player.setCubeVisible(false),
        this._player.setShipVisible(false),
        
        // ui elements
        (
            this._logo = this.add.image(0, 100, "GJ_WebSheet", "GJ_logo_001.png").setScrollFactor(0).setDepth(30),
            this._robLogo = this.add.image(160, 555, "GJ_WebSheet", 'RobTopLogoBig_001.png').setScrollFactor(0).setDepth(30).setScale(0.9),

            this._copyrightText = this.add.text(0, 625, "© 2026 RobTop Games · geometrydash.com", {
                fontSize: "14px",
                color: "#ffffff",
                fontFamily: "Arial"
            }).setOrigin(1, 1).setScrollFactor(0).setDepth(30).setAlpha(0.3),

            this._tryMeImg = this.add.image(0, 182.5, "GJ_WebSheet", "tryMe_001.png").setScrollFactor(0).setDepth(30),
            
            // create download links
            this._downloadBtns = []);
            const downloadLinks = [
                {
                    key: 'downloadSteam_001',
                    url: "https://store.steampowered.com/app/322170/Geometry_Dash"
                },
                {
                    key: 'downloadGoogle_001',
                    url: "https://play.google.com/store/apps/details?id=com.robtopx.geometryjump&hl=en"
                },
                {
                    key: "downloadApple_001",
                    url: 'https://apps.apple.com/us/app/geometry-dash/id625334537'
                }
            ];
            for (let i = 0; i < downloadLinks.length; i++) {
                const link = downloadLinks[i],
                    scale = 1 / 1.5,
                    button = this.add.image(0, 0, "GJ_WebSheet", link.key + '.png').setScrollFactor(0).setDepth(30).setScale(scale).setInteractive();
                this._makeBouncyButton(button, scale, () => window.open(link.url, "_blank"), () => this._menuActive),
                this._downloadBtns.push(button);
            }
            
            // fullscreen button
            const isFullscreen = this.scale.isFullscreen;
            this._menuFsBtn = this.add.image(33, 33, "GJ_WebSheet", isFullscreen ? 'toggleFullscreenOff_001.png' : "toggleFullscreenOn_001.png")
            .setScrollFactor(0).setDepth(30).setScale(0.64).setAlpha(0.8).setTint(Phaser.Display.Color.GetColor(0, Math.round(102), 255)).setInteractive(),
            this._expandHitArea(this._menuFsBtn, 1.5),
            this._makeBouncyButton(this._menuFsBtn, 0.64, () => {
                const newFullscreen = !this.scale.isFullscreen;
                this._menuFsBtn.setTexture("GJ_WebSheet", newFullscreen ? "toggleFullscreenOff_001.png" : 'toggleFullscreenOn_001.png'),
                this._expandHitArea(this._menuFsBtn, 1.5),
                this._toggleFullscreen();
           }, () => this._menuActive),
        
            // info button
            this._menuInfoBtn = this.add.image(SCREEN_WIDTH - 30 - 3, 33, "GJ_WebSheet", "GJ_infoIcon_001.png")
            .setScrollFactor(0).setDepth(30).setScale(0.64).setAlpha(0.8).setTint(Phaser.Display.Color.GetColor(0, Math.round(102), 255)).setInteractive(),
            
            this._expandHitArea(this._menuInfoBtn, 1.5),
            this._makeBouncyButton(
                this._menuInfoBtn, 0.64,
                () => {
                    this._buildInfoPopup();
                }, () => this._menuActive && !this._infoPopup
            ),
            
            // play button glitter
            this._menuGlitter = this.add.particles(0, 0, "GJ_WebSheet", {
                frame: "square.png",
                speed: 0,
                scale: {
                    start: 0.5,
                    end: 0
                },
                alpha: {
                    start: 0.6,
                    end: 0.2
                },
                lifespan: {
                    min: 1000,
                    max: 2000
                },
                frequency: 35,
                blendMode: BLEND_ADD,
                tint: 20670,
                x: {
                    min: -130,
                    max: 130
                },
                y: {
                    min: -100,
                    max: 100
                }
            }).setScrollFactor(0).setDepth(29),
            
            // animated play button
            this._playBtn = this.add.image(0, 0, "GJ_WebSheet", "GJ_playBtn_001.png")
            .setScrollFactor(0).setDepth(30).setInteractive(),
            
            this._playBtnPressed = false,
            this._makeBouncyButton(this._playBtn, 1,
                () => {
                    this._audio.playEffect("playSound_01", {
                        volume: 1
                    }),
                    this._startGame();
                }, () => this._menuActive && !this._playBtnPressed),
            
            this._positionMenuItems(),

            // input
            this._spaceWasDown = false,
            this._spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
            this._upKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),

            this._pauseBtn = this.add.image(SCREEN_WIDTH - 30, 30, "GJ_WebSheet", "GJ_pauseBtn_clean_001.png")
                .setScrollFactor(0).setDepth(30).setAlpha(75 / 255).setVisible(false),
            this._pauseBtn.setInteractive(),
            this._expandHitArea(this._pauseBtn, 2),
            this._pauseBtn.on("pointerdown", () => this._pauseGame()),
            
            this._escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC),
            this._escKey.on("down", () => {
                this._paused
                ? this._resumeGame()
                : this._menuActive || this._slideIn || this._state.isDead || this._levelWon || this._pauseGame();
            }),
            
            this._paused = false,
            this._pauseContainer = null,
            this._sfxVolume = this.game.registry.get("userSfxVol") ?? 1,

            this.input.on("pointerdown", () => {
                this._menuActive || this._paused || this._pushButton();
            }),
            this.input.on("pointerup", () => {
                this._menuActive || this._paused || this._releaseButton();
            }),
            
            window.addEventListener("pointerup", () => this._releaseButton()),
            window.addEventListener("touchend", () => this._releaseButton()),
            
            this.scale.on("enterfullscreen", () => this._onFullscreenChange(true)),
            this.scale.on("leavefullscreen", () => this._onFullscreenChange(false)),
            
            this._buildHUD(),
            
            document.addEventListener("visibilitychange", () => {
                document.hidden
                ? this._audio.pauseMusic()
                : this._menuActive || this._paused || this._state.isDead || this._levelWon || this._audio.resumeMusic();
            }),
            window.addEventListener("orientationchange", () => {
                this.time.delayedCall(100, () => this.scale.refresh());
            }),
            window.addEventListener("resize", () => {
                this.scale.refresh();
            }),

            this.game.registry.get("fadeInFromBlack") && (
                this.game.registry.remove("fadeInFromBlack"),
                this.cameras.main.fadeIn(400, 0, 0, 0)
            );
    }
    _buildHUD() {
        this._attemptsLabel = this.add.bitmapText(0, 0, "bigFont", 'Attempt\x201', 65).setOrigin(0.5, 0.5).setVisible(false),
        this._level.topContainer.add(this._attemptsLabel),
        this._positionAttemptsLabel(),

        this._fpsText = this.add.text(SCREEN_WIDTH - 20, 10, '', {
            fontSize: "28px",
            fill: "#ff0000",
            fontFamily: "Arial"
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(999).setVisible(false),
        this._fpsAccum = 0,
        this._fpsFrames = 0,
        this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.H).on("down", () => {
            this._fpsText.setVisible(!this._fpsText.visible);
        });
    }
    toggleGlitter(active) {
        active
        ? this._glitterEmitter.start()
        : this._glitterEmitter.stop();
    }
    // recursively set timeScale for all particle emitters in the level, used for pausing
    _setParticleTimeScale(scale) {
        const walk = object => {
            object && "ParticleEmitter" === object.type && (
                object.timeScale = scale
            ),
            object && object.list &&
                object.list.forEach(walk);
        };
        walk(this._level.container),
        walk(this._level.topContainer),
        this._glitterEmitter && (
            this._glitterEmitter.timeScale = scale
        );
    }
    _pauseGame() {
        this._paused || this._menuActive || this._slideIn || this._state.isDead || this._levelWon || (
            this._paused = true,
            this._pauseBtn.setVisible(false),
            this._audio.pauseMusic(),
            this._setParticleTimeScale(0),
            this._buildPauseOverlay()
        );
    }
    _resumeGame() {
        this._paused && (
            this._setParticleTimeScale(1),
            this._paused = false,
            this._pauseBtn.setVisible(true).setAlpha(75 / 255),
            this._audio.resumeMusic(),
            this._pauseContainer && (
                this._pauseContainer.destroy(),
                this._pauseContainer = null
            )
        );
    }
    _buildPauseOverlay() {
        const containerX = SCREEN_WIDTH / 2,
            containerY = 320,
            panelWidth = SCREEN_WIDTH - 40;

        this._pauseContainer = this.add.container(0, 0).setScrollFactor(0).setDepth(100);
        const backdrop = this.add.rectangle(containerX, containerY, SCREEN_WIDTH, SCREEN_HEIGHT, 0, 75 / 255);
        backdrop.setInteractive(), this._pauseContainer.add(backdrop);

        const corner = 0.325 * this.textures.get("square04_001").source[0].width,
            nineSliceCorner = this._drawScale9(containerX, containerY, panelWidth, 600, 'square04_001', corner, 0, 150 / 255);
        this._pauseContainer.add(nineSliceCorner);
        
        const isFullscreen = this.scale.isFullscreen,

            fullscreenButton = this.add.image(containerX - panelWidth / 2 + 40, 60, 'GJ_WebSheet', isFullscreen ? "toggleFullscreenOff_001.png" : 'toggleFullscreenOn_001.png').setScale(0.64).setInteractive();
        this._expandHitArea(fullscreenButton, 2.5),
        this._pauseContainer.add(fullscreenButton),
        this._makeBouncyButton(fullscreenButton, 0.64, () => {
            const notFullscreen = !this.scale.isFullscreen;
            fullscreenButton.setTexture("GJ_WebSheet", notFullscreen ? 'toggleFullscreenOff_001.png' : "toggleFullscreenOn_001.png"),
            this._expandHitArea(fullscreenButton, 2.5),
            this._toggleFullscreen();
        }),
        
        // label
        this._pauseContainer.add(this.add.bitmapText(containerX, 65, 'bigFont', "Stereo Madness", 40).setOrigin(0.5, 0.5));

        // best percent bar
        const barY = 170,
            bestPercent = this._bestPercent || 0,
            percentBarImage = this.add.image(containerX, barY, 'GJ_WebSheet', "GJ_progressBar_001.png").setTint(0).setAlpha(125 / 255);
        this._pauseContainer.add(percentBarImage);

        const progressBarFrame = this.textures.getFrame("GJ_WebSheet", "GJ_progressBar_001.png"),
            barWidth = progressBarFrame ? progressBarFrame.width : 680,
            barHeight = progressBarFrame ? progressBarFrame.height : 40,
            fillWidth = Math.max(1, Math.floor(barWidth * (bestPercent / 100))),
            fill = this.add.image(0, 0, 'GJ_WebSheet', "GJ_progressBar_001.png").setTint(65280).setScale(0.992, 0.86).setOrigin(0, 0.5).setCrop(0, 0, fillWidth, barHeight);
        fill.setPosition(containerX - 0.992 * barWidth / 2, barY), this._pauseContainer.add(fill),
        
        this._pauseContainer.add(this.add.bitmapText(containerX, barY, "bigFont", bestPercent + '%', 30).setOrigin(0.5, 0.5).setScale(0.7)),
        this._pauseContainer.add(this.add.bitmapText(containerX, 130, "bigFont", "Normal Mode", 30).setOrigin(0.5, 0.5).setScale(0.78)); // there only is normal mode.. lol
        
        const pauseButtons = [
            {
                frame: "GJ_replayBtn_001.png",
                action: () => {
                    this._resumeGame(), this._restartLevel();
                }
            },
            {
                frame: "GJ_playBtn2_001.png",
                action: () => this._resumeGame()
            },
            {
                frame: "GJ_menuBtn_001.png",
                action: () => {
                    this._audio.playEffect("quitSound_01"), this._audio.stopMusic(), this._resumeGame(), this.scene.restart();
                }
            }
        ],
            buttonWidths = pauseButtons.map(button => {
                const frame = this.textures.getFrame("GJ_WebSheet", button.frame);
                return frame ? frame.width : 246;
            });

        let buttonsX = containerX - (buttonWidths.reduce((a, b) => a + b, 0) + 40 * (pauseButtons.length - 1)) / 2;
        for (let i = 0; i < pauseButtons.length; i++) {
            const thisMeta = pauseButtons[i],
                thisWidth = buttonWidths[i],
                button = this.add.image(buttonsX + thisWidth / 2, 330, "GJ_WebSheet", thisMeta.frame).setInteractive();
            this._pauseContainer.add(button),
            this._makeBouncyButton(button, 1, thisMeta.action),
            buttonsX += thisWidth + 40;
        }

        // volume sliders
        const sliderY = 500,
            sliderScale = 0.7,
            grooveFrame = this.textures.getFrame("GJ_WebSheet", "slidergroove.png"),
            grooveWidth = grooveFrame ? grooveFrame.width : 420,

            addSlider = (x, icon, value, onChange) => {
                this._pauseContainer.add(this.add.image(x - 180 - 5, sliderY, "GJ_WebSheet", icon).setScale(1.2));
                
                const trackWidth = (grooveWidth - 8) * sliderScale,
                    trackX = x - grooveWidth * sliderScale / 2 + 2.8,
                    trackVisualFill = value * trackWidth,
                    
                    fill = this.add.tileSprite(trackX, sliderY, trackVisualFill > 0 ? trackVisualFill : 1, 11.2, "sliderBar").setOrigin(0, 0.5).setVisible(trackVisualFill > 0);
                this._pauseContainer.add(fill);
                
                // the outline
                const sliderGroove = this.add.image(x, sliderY, 'GJ_WebSheet', "slidergroove.png").setScale(sliderScale);
                this._pauseContainer.add(sliderGroove);
                
                const sliderThumbX = trackX + value * trackWidth,
                    sliderThumb = this.add.image(sliderThumbX, sliderY, 'GJ_WebSheet', "sliderthumb.png").setScale(sliderScale).setInteractive({
                        'draggable': true,
                        'useHandCursor': true
                    });
                this._pauseContainer.add(sliderThumb),
                
                // input
                sliderThumb.on("pointerdown", () => sliderThumb.setTexture("GJ_WebSheet", "sliderthumbsel.png")),
                sliderThumb.on("pointerup", () => sliderThumb.setTexture("GJ_WebSheet", "sliderthumb.png")),
                sliderThumb.on("pointerout", () => sliderThumb.setTexture("GJ_WebSheet", 'sliderthumb.png')),
                sliderThumb.on("drag", (pointer, dragX) => {
                    sliderThumb.x = Math.max(trackX, Math.min(trackX + trackWidth, dragX));
                    const alpha = (sliderThumb.x - trackX) / trackWidth,
                        capped = alpha < 0.03 ? 0 : alpha; // cover elipses
                    
                    fill.width = Math.max(1, capped * trackWidth),
                    fill.setVisible(capped > 0),
                    onChange(capped);
                });
            };
            
        addSlider(containerX - 200, "gj_songIcon_001.png", this._audio.getUserMusicVolume(),
            value => this._audio.setUserMusicVolume(value)
        ),
        addSlider(containerX + 200, "GJ_sfxIcon_001.png", this._sfxVolume, value => {
            this._sfxVolume = value,
            this.game.registry.set("userSfxVol", value);
        });
    }
    _buildInfoPopup() {
        if (this._infoPopup) return;
        
        const centerX = SCREEN_WIDTH / 2,
            centerY = 320,
            panelHeight = 336;
        this._infoPopup = this.add.container(0, 0).setScrollFactor(0).setDepth(200);
        
        // dim background
        const dimBackground = this.add.rectangle(centerX, centerY, SCREEN_WIDTH, SCREEN_HEIGHT, 0, 100 / 255);
        dimBackground.setInteractive(),
        this._infoPopup.add(dimBackground);
        
        // background panel
        const corner = 0.325 * this.textures.get("GJ_square02").source[0].width,
            backgroundPanel = this._drawScale9(centerX, centerY, 480, panelHeight, 'GJ_square02', corner, 16777215, 1);
        this._infoPopup.add(backgroundPanel);

        // close button
        const closeButton = this.add.image(centerX - 240 + 20, 172, 'GJ_WebSheet', "GJ_closeBtn_001.png").setScale(0.8).setInteractive();
        this._infoPopup.add(closeButton),
        this._expandHitArea(closeButton, 2),
        this._makeBouncyButton(closeButton, 0.8, () => this._closeInfoPopup());

        // throw text on the panel
        let infoYCursor = 206;
        const creditsLabel = this.add.bitmapText(centerX, infoYCursor, "bigFont", "Credits", 40).setOrigin(0.5, 0.5);
        this._infoPopup.add(creditsLabel), infoYCursor += 70;
        const byRobTopLabel = this.add.bitmapText(centerX, infoYCursor, 'goldFont', "Made by RobTop Games", 40).setOrigin(0.5, 0.5).setScale(0.6);
        this._infoPopup.add(byRobTopLabel), infoYCursor += 60;
        const songLabel = this.add.bitmapText(centerX, infoYCursor, "goldFont", "Song: Stereo Madness", 40).setOrigin(0.5, 0.5).setScale(0.6);
        this._infoPopup.add(songLabel), infoYCursor += 30;
        const songArtistLabel = this.add.bitmapText(centerX - 20, infoYCursor, "goldFont", "by ForeverBound", 40).setOrigin(0.5, 0.5).setScale(0.6);
        this._infoPopup.add(songArtistLabel);
        // youtube link button
        const youtubeX = centerX - 10 + 0.6 * songArtistLabel.width / 2,
            youtubeSongButton = this.add.image(youtubeX + 20 + 50 - 10, infoYCursor + 2, "GJ_WebSheet", 'gj_ytIcon_001.png').setScale(0.5).setInteractive();
        this._infoPopup.add(youtubeSongButton),
        this._expandHitArea(youtubeSongButton, 2),
        this._makeBouncyButton(youtubeSongButton, 0.5, () => {
            window.open("https://www.youtube.com/watch?v=JhKyKEDxo8Q", "_blank");
        });

        // copyright text
        const copyrightLabel = this.add.text(centerX, 446, "© 2026 RobTop Games. All rights reserved.", {
            'fontSize': '12px',
            'color': "#000000",
            'fontFamily': "Arial"
        }).setOrigin(0.5, 0.5).setAlpha(0.7).setResolution(2);
        this._infoPopup.add(copyrightLabel);
        
        // distrubution warning
        const distrubutionWarningLabel = this.add.text(centerX, 463, "Unauthorized copying, distribution, or hosting of this demo is prohibited.", { // sorry robtop! please forgive me!
            'fontSize': "12px",
            'color': '#000000',
            'fontFamily': "Arial"
        }).setOrigin(0.5, 0.5).setAlpha(0.7).setResolution(2);
        this._infoPopup.add(distrubutionWarningLabel);
    }
    _closeInfoPopup() {
        this._infoPopup && (this._infoPopup.destroy(), this._infoPopup = null);
    }
    /* ui helpers */
    // expands the hit area of an interactive image by a multiplier
    _expandHitArea(image, multiplier) {
        const width = image.width,
            height = image.height,
            pX = width * (multiplier - 1) / 2,
            pY = height * (multiplier - 1) / 2;
        image.input.hitArea.setTo(-pX, -pY, width + 2 * pX, height + 2 * pY);
    }
    // animates a button with a bounce effect when pressed, and adds callback
    _makeBouncyButton(image, baseScale, onClick, isActiveCheck) {
        const pressedScale = 1.26 * baseScale;
        return image.on("pointerdown", () => {
            isActiveCheck && !isActiveCheck() || (
                image._pressed = true,
                this.tweens.killTweensOf(image, "scale"), this.tweens.add({
                    targets: image,
                    scale: pressedScale,
                    duration: 300,
                    ease: "Bounce.Out"
                })
            );
        }),
        image.on("pointerout", () => {
            image._pressed && (
                image._pressed = false,
                this.tweens.killTweensOf(image, "scale"),
                this.tweens.add({
                    targets: image,
                    scale: baseScale,
                    duration: 400,
                    ease: "Bounce.Out"
                })
            );
        }),
        image.on('pointerup', () => {
            image._pressed && (
                image._pressed = false,
                this.tweens.killTweensOf(image, "scale"),
                image.setScale(baseScale),
                onClick()
            );
        }),
        // return
        image;
    }
    _toggleFullscreen() {
        if (this.scale.isFullscreen) this.scale.stopFullscreen();
        else {
            this.scale.startFullscreen();
            try {
                screen.orientation.lock("landscape").catch(() => {});
            } catch (any) {}
        }
    }
    // draws a 9 slice image
    _drawScale9(x, y, width, height, textureKey, cornerSize, tint, alpha) {
        const container = this.add.container(x, y),
            texture = this.textures.get(textureKey),
            source = texture.source[0],
            sourceWidth = source.width,
            sourceHeight = source.height,
            mainWidth = width - 2 * cornerSize,
            mainHeight = height - 2 * cornerSize,

            slices = [
                {
                    sx: 0,
                    sy: 0,
                    sw: cornerSize,
                    sh: cornerSize,
                    dx: -width / 2,
                    dy: -height / 2,
                    dw: cornerSize,
                    dh: cornerSize
                },
                {
                    sx: cornerSize,
                    sy: 0,
                    sw: sourceWidth - 2 * cornerSize,
                    sh: cornerSize,
                    dx: -width / 2 + cornerSize,
                    dy: -height / 2,
                    dw: mainWidth,
                    dh: cornerSize
                },
                {
                    sx: sourceWidth - cornerSize,
                    sy: 0,
                    sw: cornerSize,
                    sh: cornerSize,
                    dx: width / 2 - cornerSize,
                    dy: -height / 2,
                    dw: cornerSize,
                    dh: cornerSize
                },
                {
                    sx: 0,
                    sy: cornerSize,
                    sw: cornerSize,
                    sh: sourceHeight - 2 * cornerSize,
                    dx: -width / 2,
                    dy: -height / 2 + cornerSize,
                    dw: cornerSize,
                    dh: mainHeight
                },
                {
                    sx: cornerSize,
                    sy: cornerSize,
                    sw: sourceWidth - 2 * cornerSize,
                    sh: sourceHeight - 2 * cornerSize,
                    dx: -width / 2 + cornerSize,
                    dy: -height / 2 + cornerSize,
                    dw: mainWidth,
                    dh: mainHeight
                },
                {
                    sx: sourceWidth - cornerSize,
                    sy: cornerSize,
                    sw: cornerSize,
                    sh: sourceHeight - 2 * cornerSize,
                    dx: width / 2 - cornerSize,
                    dy: -height / 2 + cornerSize,
                    dw: cornerSize,
                    dh: mainHeight
                },
                {
                    sx: 0,
                    sy: sourceHeight - cornerSize,
                    sw: cornerSize,
                    sh: cornerSize,
                    dx: -width / 2,
                    dy: height / 2 - cornerSize,
                    dw: cornerSize,
                    dh: cornerSize
                },
                {
                    sx: cornerSize,
                    sy: sourceHeight - cornerSize,
                    sw: sourceWidth - 2 * cornerSize,
                    sh: cornerSize,
                    dx: -width / 2 + cornerSize,
                    dy: height / 2 - cornerSize,
                    dw: mainWidth,
                    dh: cornerSize
                },
                {
                    sx: sourceWidth - cornerSize,
                    sy: sourceHeight - cornerSize,
                    sw: cornerSize,
                    sh: cornerSize,
                    dx: width / 2 - cornerSize,
                    dy: height / 2 - cornerSize,
                    dw: cornerSize,
                    dh: cornerSize
                }
            ];
        
        for (let i = 0; i < slices.length; i++) {
            const slice = slices[i],
                key = "_s9_" + i;
            texture.has(key) || texture.add(key, 0, slice.sx, slice.sy, slice.sw, slice.sh);
            const piece = this.add.image(slice.dx, slice.dy, textureKey, key).setOrigin(0, 0).setDisplaySize(slice.dw, slice.dh);
            undefined !== tint && piece.setTint(tint),
            undefined !== alpha && piece.setAlpha(alpha),
            container.add(piece);
        }
        return container;
    }
    /* other */

    _startGame() {
        if (!this._menuActive) return;
        if (
            this._menuActive = false,
            this._slideIn = true,
            
            // destroy menu glitter
            this._menuGlitter && (
                this._menuGlitter.destroy(),
                this._menuGlitter = null
            ),
            
            // destroy play button with an animation
            this._playBtn && (
                this.tweens.killTweensOf(this._playBtn),
                this.tweens.add({
                    targets: this._playBtn,
                    scale: 0.01,
                    duration: 200,
                    ease: "Quad.In",
                    onComplete: () => {
                        this._playBtn.destroy(), 
                        this._playBtn = null;
                    }
                })
            ),
            
            // destroy menu items with an animation
            this._robLogo && this.tweens.add({
                targets: this._robLogo,
                y: SCREEN_HEIGHT + this._robLogo.height,
                duration: 300,
                ease: "Quad.In",
                onComplete: () => {
                    this._robLogo.destroy(), 
                    this._robLogo = null;
                }
            }),
            this._copyrightText && this.tweens.add({
                targets: this._copyrightText,
                y: 680,
                duration: 300,
                ease: 'Quad.In',
                onComplete: () => {
                    this._copyrightText.destroy(), 
                    this._copyrightText = null;
                }
            }),
            this._menuFsBtn && this.tweens.add({
                targets: this._menuFsBtn,
                y: -this._menuFsBtn.height,
                duration: 300,
                ease: "Quad.In",
                onComplete: () => {
                    this._menuFsBtn.destroy(), 
                    this._menuFsBtn = null;
                }
            }),
            this._menuInfoBtn && this.tweens.add({
                targets: this._menuInfoBtn,
                y: -this._menuInfoBtn.height,
                duration: 300,
                ease: 'Quad.In',
                onComplete: () => {
                    this._menuInfoBtn.destroy(),
                    this._menuInfoBtn = null;
                }
            }),
            this._closeInfoPopup(), this._tryMeImg && this.tweens.add({
                targets: this._tryMeImg,
                y: -this._tryMeImg.height,
                duration: 300,
                ease: "Quad.In",
                onComplete: () => {
                    this._tryMeImg.destroy(),
                    this._tryMeImg = null;
                }
            }),
            
        // if
            this._downloadBtns) {
            for (const button of this._downloadBtns)
                this.tweens.killTweensOf(button),
                this.tweens.add({
                    targets: button,
                    y: SCREEN_HEIGHT + button.height,
                    duration: 300,
                    ease: "Quad.In",
                    onComplete: () => button.destroy()
                }
            );
            this._downloadBtns = null;
        }

        this._logo && this.tweens.add({
            targets: this._logo,
            y: -this._logo.height,
            duration: 300,
            ease: "Quad.In",
            onComplete: () => {
                this._logo.destroy(),
                this._logo = null;
            }
        }),
        
        this._cameraX = -PLAYER_GAME_CAMERA_X,
        this._cameraY = 0,
        this._cameraXRef._v = this._cameraX,
        this._prevCameraX = this._cameraX;

        const groundOffset = this._cameraX - (this._menuCameraX || 0);
        this._level.shiftGroundTiles(groundOffset),
        this._playerWorldX = this._cameraX,
        this._state.y = 30,
        this._state.onGround = true,

        this._level.additiveContainer.setVisible(true),
        this._level.container.setVisible(true),
        this._level.topContainer.setVisible(true),

        this._player.setCubeVisible(true),
        this._player.reset(),
        this._attemptsLabel.setVisible(this._attempts > 1),
        
        this._positionAttemptsLabel();
    }
    _pushButton() {
        if (this._menuActive)
            return this._audio.playEffect("playSound_01", {
                'volume': 1
            }),
            void this._startGame();

        this._slideIn || this._state.isDead || (
            this._state.upKeyDown = true,
            this._state.upKeyPressed = true,
            (!this._state.isFlying || this._state.isBall) && this._state.canJump && (
                this._player.updateJump(0),
                this._totalJumps++
            ));
    }
    _releaseButton() {
        this._state.upKeyDown = false,
        this._state.upKeyPressed = false;
    }
    _positionMenuItems() {
        const centerX = SCREEN_WIDTH / 2;
        if (
            this._logo && (
                this._logo.x = centerX
            ),
            this._menuInfoBtn && (
                this._menuInfoBtn.x = SCREEN_WIDTH - 30 - 3
            ),
            this._copyrightText && (
                this._copyrightText.x = SCREEN_WIDTH - 20
            ),
            this._tryMeImg && (
                this._tryMeImg.x = centerX + 175
            ),
            this._menuGlitter && (
                this._menuGlitter.x = centerX,
                this._menuGlitter.y = 320
            ),
            this._playBtn && (
                this._playBtn.x = centerX,
                this.tweens.killTweensOf(this._playBtn, 'y'),
                this._playBtn.y = 320,
                this.tweens.add({
                    targets: this._playBtn,
                    y: 324,
                    duration: 750,
                    ease: 'Quad.InOut',
                    yoyo: true,
                    repeat: -1
                })
            ),
            
        // if
            this._downloadBtns) {
            const right = SCREEN_WIDTH - 130,
                y = 555,
                spacing = 210;
            for (let i = 0; i < this._downloadBtns.length; i++)
                this._downloadBtns[i].setPosition(right - i * spacing, y);
        }
    }
    _positionAttemptsLabel() {
        let x = this._cameraX + SCREEN_WIDTH / 2;
        this._attempts > 1 && (x += 100),
        this._attemptsLabel.setPosition(x, 150);
    }
    _resetGameplayState() {
        this._cameraX = -PLAYER_GAME_CAMERA_X,
        this._cameraY = 0,
        this._cameraXRef._v = -PLAYER_GAME_CAMERA_X,
        this._prevCameraX = -PLAYER_GAME_CAMERA_X,
        this._playerWorldX = 0,
        this._deltaBuffer = 0,
        this._deathTimer = 0,
        this._deathSoundPlayed = false,
        this._newBestShown = false,
        this._hadNewBest = false,
        this._levelWon = false,
        this._endCameraOverride = false,
        this._endCamTween = null,
        this._spaceWasDown = false;
    }
    _restartLevel() {
        this._attempts++;
        const previousCameraX = this._cameraX;
        this._resetGameplayState(),
        this._state.reset(),
        this._player.reset(),
        this._glitterEmitter.stop(),
        this._level.resetObjects(),
        this._level.shiftGroundTiles(this._cameraX - previousCameraX),
        this._level.resetGroundState(),
        this._level.resetColorTriggers(),
        this._level.resetEnterEffectTriggers(),
        this._level.resetVisibility(),
        this._colorManager.reset(),
        this._audio.reset(),
        this._audio.startMusic(),
        this._paused = false,
        this._pauseContainer && (
            this._pauseContainer.destroy(),
            this._pauseContainer = null
        ),
        this._pauseBtn.setVisible(true).setAlpha(75 / 255),
        this._attemptsLabel.setText("Attempt " + this._attempts),
        this._attemptsLabel.setVisible(true),
        this._positionAttemptsLabel();
    }
    _onFullscreenChange(isFullscreen) {
        isFullscreen || setScreenWidth(1138),

        this.time.delayedCall(200, () => this._applyScreenResize());
    }
    _applyScreenResize() {
        if (this.scale.isFullscreen) {
            const ratio = window.innerWidth / window.innerHeight;
            setScreenWidth(Math.round(SCREEN_HEIGHT * ratio));
        }
        if (
            this.scale.setGameSize(SCREEN_WIDTH, SCREEN_HEIGHT),
            this.scale.refresh(),
            this._bg.setSize(SCREEN_WIDTH, SCREEN_HEIGHT),
            this._pauseBtn.x = SCREEN_WIDTH - 30,
            
            this._menuActive && this._positionMenuItems(),
            this._paused && this._pauseContainer && (
                this._pauseContainer.destroy(),
                this._pauseContainer = null,
                this._buildPauseOverlay()
            ),
            this._level.resizeScreen(),
        // if
            !this._menuActive) {
            const previousX = this._cameraX;
            this._cameraX = this._playerWorldX - PLAYER_GAME_CAMERA_X,
            this._cameraXRef._v = this._cameraX,
            this._level.additiveContainer.x = -this._cameraX,
            this._level.additiveContainer.y = this._cameraY,
            this._level.container.x = -this._cameraX,
            this._level.container.y = this._cameraY,
            this._level.topContainer.x = -this._cameraX,
            this._level.topContainer.y = this._cameraY,
            this._level.shiftGroundTiles(this._cameraX - previousX),
            this._level.updateGroundTiles(this._cameraY),
            this._level.updateVisibility(this._cameraX), 
            this._level.applyEnterEffects(this._cameraX);

            const syncX = this._playerWorldX - this._cameraX;
            this._player.syncSprites(this._cameraX, this._cameraY, 0, syncX);
        }
    }
    _updateBackground() {
        this._bg.tilePositionX += (this._cameraX - this._prevCameraX) * this._bgSpeedX,
        this._prevCameraX = this._cameraX,
        this._bg.tilePositionY = this._bgInitY - this._cameraY * this._bgSpeedY;
    }
    _updateCameraY(speedFactor) {
        let cameraY = this._cameraY,
            targetY = cameraY;

        if (null !== this._level.flyCameraTarget)
            targetY = this._level.flyCameraTarget;
        else {
            let py = this._state.y,
                upper = 140,
                lower = 80,
                worldY = cameraY - SHIP_CAMERA_Y_OFFSET + 320;
            
            py > worldY + upper
                ? targetY = py - 320 - upper + SHIP_CAMERA_Y_OFFSET
            : py < worldY - lower && (
                targetY = py - 320 + lower + SHIP_CAMERA_Y_OFFSET
            );
        }
        (
            targetY < 0 && (
                targetY = 0
            ),
            
        // if
            0 !== speedFactor) && (
            cameraY += (targetY - cameraY) / (10 / speedFactor),
            (
                cameraY < 0 && (cameraY = 0),
                this._cameraY = cameraY
            )
        );
    }
    // returns the quantized delta to be used for movement, and stores the leftover in a buffer for the next frame
    _quantizeDelta(deltaMs) {
        let total = deltaMs / 1000 + this._deltaBuffer,
            steps = Math.round(total / TICK_DELTA);
        
        steps < 0 && (steps = 0),
        steps > 60 && (steps = 60);
            
        let used = steps * TICK_DELTA;
        return this._deltaBuffer = total - used,
            
            60 * used;
    }
    // main update loop
    update(time, deltaMs) {
        // fps counter
        if (
            this._fpsAccum += deltaMs,
            this._fpsFrames++,
            this._fpsAccum >= 250 && (
                this._fpsText.setText(Math.round(1000 * this._fpsFrames / this._fpsAccum)),
                this._fpsAccum = 0,
                this._fpsFrames = 0
            ),
            
        // if
            this._paused)
            return void(this._deltaBuffer = 0);

        // title screen
        if (this._menuActive) {
            if ((this._spaceKey.isDown || this._upKey.isDown) && !this._spaceWasDown)
                return this._spaceWasDown = true,
                    this._audio.playEffect("playSound_01", {
                        volume: 1
                    }),
                    void this._startGame();

            this._spaceWasDown = this._spaceKey.isDown || this._upKey.isDown;
            const frames = Math.min(deltaMs / 1000 * 60, 2),
                titleScreenSpeed = 0.25;
            this._menuCameraX = (this._menuCameraX || 0) + frames * PLAYER_SPEED * TIME_SCALE * titleScreenSpeed;
            const cameraX = this._cameraX;
            return this._cameraX = this._menuCameraX,
                this._updateBackground(),
                this._cameraX = cameraX,
                this._prevCameraX = this._menuCameraX,
                this._cameraXRef._v = this._menuCameraX,
                this._level.stepGroundAnimation(deltaMs / 1000),
                void this._level.updateGroundTiles(this._cameraY);
        }
        // the slide into gameplay effect
        if (this._slideIn) {
            const frames = this._quantizeDelta(deltaMs);
            this._playerWorldX += frames * PLAYER_SPEED * TIME_SCALE;
            const groundMultiplier = 0.25;
            this._slideGroundX = (this._slideGroundX || this._cameraX) + frames * PLAYER_SPEED * TIME_SCALE * groundMultiplier, this._cameraXRef._v = this._slideGroundX;
            const playerScreenX = this._playerWorldX - this._cameraX;
            if (
                this._player.updateGroundRotation(frames * TIME_SCALE),
                this._player.syncSprites(this._cameraX, this._cameraY, deltaMs / 1000, playerScreenX),
                this._level.additiveContainer.x = -this._cameraX,
                this._level.additiveContainer.y = this._cameraY,
                this._level.container.x = -this._cameraX,
                this._level.container.y = this._cameraY,
                this._level.topContainer.x = -this._cameraX, 
                this._level.topContainer.y = this._cameraY, 
                this._level.updateVisibility(this._cameraX), 
                this._updateBackground(), 
                this._level.stepGroundAnimation(deltaMs / 1000), 
                this._level.updateGroundTiles(this._cameraY),

            // if
                this._playerWorldX >= 0) {
                this._slideIn = false,
                this._deltaBuffer = 0,
                this._playerWorldX = 0,
                this._cameraX = this._playerWorldX - PLAYER_GAME_CAMERA_X,
                this._cameraXRef._v = this._cameraX;

                const xDelta = this._cameraX - this._slideGroundX;
                this._level.shiftGroundTiles(xDelta),
                this._firstPlay && (
                    this._firstPlay = false,
                    this._audio.startMusic()
                ),

                this._pauseBtn.setVisible(true).setAlpha(0),
                this.tweens.add({
                    targets: this._pauseBtn,
                    alpha: 75 / 255,
                    duration: 500
                });
            }
            return;
        }
        // gameplay
        let jumpHotkey = this._spaceKey.isDown || this._upKey.isDown;
        if (jumpHotkey && !this._spaceWasDown
            ? this._pushButton()
            : !jumpHotkey && this._spaceWasDown &&
            this._releaseButton(),
        
            this._spaceWasDown = jumpHotkey,
            !this.input.activePointer.isDown || this._state.upKeyDown || this._state.isDead || (
                this._state.upKeyDown = true
            ),
            
            this._level.updateEndPortalY(this._cameraY, this._state.isFlying || this._state.isBall),
        // if
            !this._levelWon && !this._state.isDead && this._level.endXPos > 0) {
            // distance till you essentially win    
            const endPortalDistance = 600;
            this._playerWorldX >= this._level.endXPos - endPortalDistance && (
                this._levelWon = true,
                this._endPortalGameY = this._level._endPortalGameY || 240,
                this._triggerEndPortal()
            );
        }

        // win
        if (this._levelWon) {
            if (this._deltaBuffer = 0,
            // if
                this._endCamTween) {
                const tween = this._endCamTween;
                this._cameraX = tween.fromX + (tween.toX - tween.fromX) * tween.p,
                this._cameraY = tween.fromY + (tween.toY - tween.fromY) * tween.p;
            }
            return this._cameraXRef._v = this._cameraX,
                this._level.additiveContainer.x = -this._cameraX,
                this._level.additiveContainer.y = this._cameraY, 
                this._level.container.x = -this._cameraX, 
                this._level.container.y = this._cameraY, 
                this._level.topContainer.x = -this._cameraX, 
                this._level.topContainer.y = this._cameraY,
                this._updateBackground(),
                this._level.stepGroundAnimation(deltaMs / 1000),
                void this._level.updateGroundTiles(this._cameraY);
        }

        // dead
        if (this._state.isDead) {
            if (this._deathSoundPlayed || (
                this._audio.stopMusic(),
                this._audio.playEffect("explode_11", {
                    volume: 0.65
                }),
                this._deathSoundPlayed = true
            ),
            // if
                !this._newBestShown) {
                this._newBestShown = true;
                // the end position
                let endXPosition = this._level.endXPos || 6000,
                    playerWorldX = this._playerWorldX;
                this._lastPercent = Math.min(99, Math.max(0, Math.floor(playerWorldX / endXPosition * 100))),
                this._lastPercent > this._bestPercent && (
                    this._bestPercent = this._lastPercent,
                    this._hadNewBest = true,
                    this._showNewBest()
                );
            }
            this._player.updateExplosionPieces(deltaMs),
            this._deathTimer += deltaMs;
            let deathTime = this._hadNewBest ? 1400 : 1000;

            return void(this._deathTimer > deathTime && this._restartLevel());
        }

        this._playTime += deltaMs / 1000,
        this._audio.update(deltaMs / 1000),
        this._level.updateAudioScale(this._audio.getMeteringValue());

        let physicsTotal = this._quantizeDelta(deltaMs),
            subSteps = physicsTotal > 0 ? Math.max(1, Math.round(4 * physicsTotal)) : 0;
        // 60 tick cap
        subSteps > 60 && (
            subSteps = 60
        );

        let subDelta = subSteps > 0 ? physicsTotal / subSteps : 0,
            subDeltaScaled = subDelta * TIME_SCALE;

        const prevY = this._state.y;
        for (let i = 0; i < subSteps; i++)
            this._state.lastY = this._state.y,
            this._player.updateJump(subDeltaScaled),
            this._state.y += this._state.yVelocity * subDeltaScaled,
            this._player.checkCollisions(this._playerWorldX - PLAYER_GAME_CAMERA_X),
            this._playerWorldX += subDelta * PLAYER_SPEED * TIME_SCALE,
            this._state.isFlying || this._state.isBall || (
                this._state.onGround
                ? this._player.updateGroundRotation(subDeltaScaled)
                : this._player.rotateActionActive &&
                this._player.updateRotateAction(TICK_DELTA)
            );
        
        if (
            this._state.lastY = prevY,
        // if
            !this._endCameraOverride) {
                // the camera's position during gameplay
            const cameraPositionX = this._playerWorldX - PLAYER_GAME_CAMERA_X;
            if (this._level.endXPos > 0) {
                const endLeft = this._level.endXPos - SCREEN_WIDTH;
                if (cameraPositionX >= endLeft - 200) {
                    this._endCameraOverride = true,
                    this._cameraX = cameraPositionX;
                    
                    const endPortalY = -140 + (this._level._endPortalGameY || 240),
                        easeFactor = 1.8,
                        ease = time => time < 0.5
                        ? Math.pow(2 * time, easeFactor) / 2
                        : 1 - Math.pow(2 * (1 - time), easeFactor) / 2;

                    this._endCamTween = {
                        p: 0,
                        fromX: this._cameraX,
                        toX: endLeft,
                        fromY: this._cameraY,
                        toY: endPortalY
                    },
                    this.tweens.add({
                        targets: this._endCamTween,
                        p: 1,
                        duration: 1200,
                        ease: ease
                    });
                } else
                    this._cameraX = cameraPositionX;
            } else
                this._cameraX = cameraPositionX;
        }
        
        if (this._endCameraOverride && this._endCamTween) {
            const endCamTween = this._endCamTween;
            this._cameraX = endCamTween.fromX + (endCamTween.toX - endCamTween.fromX) * endCamTween.p,
            this._cameraY = endCamTween.fromY + (endCamTween.toY - endCamTween.fromY) * endCamTween.p;
        }
        
        this._cameraXRef._v = this._cameraX, 
        this._endCameraOverride || 
            this._updateCameraY(physicsTotal),
        
        this._level.additiveContainer.x = -this._cameraX,
        this._level.additiveContainer.y = this._cameraY,
        
        this._level.container.x = -this._cameraX, 
        this._level.container.y = this._cameraY, 
        
        this._level.topContainer.x = -this._cameraX, 
        this._level.topContainer.y = this._cameraY;

        // color triggers
        let playerWorldX = this._playerWorldX;
        for (let trigger of this._level.checkColorTriggers(playerWorldX))
            this._colorManager.triggerColor(trigger.index, trigger.color, trigger.duration),
            trigger.tintGround &&
                this._colorManager.triggerColor(ID_GROUND_COLOR, trigger.color, trigger.duration);
        
        this._colorManager.step(deltaMs / 1000),
        this._bg.setTint(this._colorManager.getHex(ID_BACKGROUND_COLOR)),
        this._level.setGroundColor(this._colorManager.getHex(ID_GROUND_COLOR)),
        
        this._level.updateVisibility(this._cameraX),
        this._level.checkEnterEffectTriggers(playerWorldX),
        this._level.applyEnterEffects(this._cameraX),
        
        this._glitterCenterX = this._cameraX + SCREEN_WIDTH / 2,
        this._glitterCenterY = GROUND_BOUNDS_Y - this._cameraY,
        
        this._updateBackground(),
        this._level.stepGroundAnimation(deltaMs / 1000),
        this._level.updateGroundTiles(this._cameraY),
        this._state.isFlying && this._player.updateShipRotation(physicsTotal);

        const cameraOffsetX = this._playerWorldX - this._cameraX;
        this._player.syncSprites(this._cameraX, this._cameraY, deltaMs / 1000, cameraOffsetX);
    }
    /* end sequence */
    _showNewBest() {
        let centerX = SCREEN_WIDTH / 2,
            container = this.add.image(0, 0, "GJ_WebSheet", "GJ_newBest_001.png").setOrigin(0.5, 1),
            percentageText = this.add.bitmapText(0, 2, "bigFont", this._lastPercent + '%', 65).setOrigin(0.5, 0).setScale(1.1),
            newBestContainer = this.add.container(centerX, 300, [container, percentageText]).setScrollFactor(0).setDepth(60).setScale(0.01);
        
        this.tweens.add({
            targets: newBestContainer,
            scale: 1,
            duration: 400,
            ease: 'Elastic.Out',
            easeParams: [1, 0.6],
            onComplete: () => {
                this.tweens.add({
                    targets: newBestContainer,
                    scale: 0.01,
                    duration: 200,
                    delay: 700,
                    ease: 'Quad.In',
                    onComplete: () => {
                        newBestContainer.setVisible(false), newBestContainer.destroy();
                    }
                });
            }
        });
    }
    _triggerEndPortal() {
        this._player.playEndAnimation(this._level.endXPos, () => this._levelComplete(), this._endPortalGameY);
    }
    _levelComplete() {
        const x = this._level.endXPos - this._cameraX,
            y = worldYToScreenY(this._endPortalGameY) + this._cameraY;
        for (let i = 0; i < 5; i++)
            this.time.delayedCall(50 * i, () => emitCircleEffect(this, x, y, 10, SCREEN_WIDTH, 500, false, true, COLOR_GREEN));
            
        emitCircleEffect(this, x, y, 10, 1000, 500, true, false, COLOR_GREEN),
        this._showCompleteEffect();
    }
    _showCompleteEffect() {
        this._audio.fadeOutMusic(1500),
        this.sound.play("endStart_02", {
            volume: 0.8
        }),

        // beams
        (! function(scene, cx, cy, color) {
            const scale = 2,
                beamCount = 8,

                startWidth = 1 * scale,
                baseWidth = 30 * scale,
                widthVariance = 20 * scale,

                beamLength = Math.round(Math.sqrt(SCREEN_WIDTH ** 2 + 102400)) + 32.5 * scale,
                
                durationBase = 180,
                durationVar = 40,
                delayStep = 195,
                startDelay = 40,
                delayVar = 40,

                maxAlpha = 155 / 0xFF,
                minAlpha = 100 / 0xFF,
                delayIncrement = 400,

                startAngle = -135,
                angleIncrement = 90 / beamCount,

                angles = Array.from({
                    length: beamCount
                }, (_, i) => startAngle + i * angleIncrement);

            for (let i = angles.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [angles[i], angles[j]] = [angles[j], angles[i]];
            }

            let maxDelay = 0;
            const activeBeams = [];

            for (let i = 0; i < beamCount; i++) {
                const spawnDelay = i * delayStep + startDelay + delayVar * (2 * Math.random() - 1),
                    targetWidth = baseWidth + widthVariance * (2 * Math.random() - 1),
                    duration = durationBase + durationVar * (2 * Math.random() - 1),
                    alpha = Math.min(1, Math.max(0, maxAlpha + minAlpha * (2 * Math.random() - 1))),
                    rotation = angles[i] + angleIncrement * Math.random() + 180,
                    
                    beamGraphic = scene.add.graphics().setScrollFactor(0).setDepth(-1).setBlendMode(BLEND_ADD).setPosition(cx, cy).setAngle(rotation).setAlpha(alpha).setVisible(false),
                    
                    tweenData = {
                        h: 1,
                        w: startWidth
                    };

                scene.time.delayedCall(Math.max(0, spawnDelay), () => {
                    beamGraphic.setVisible(true), scene.tweens.add({
                        targets: tweenData,
                        h: beamLength,
                        w: targetWidth,
                        duration: duration,
                        ease: "Quad.Out",
                        onUpdate: () => {
                            const endPos = startWidth + (tweenData.w - startWidth) / 4;
                            
                            beamGraphic.clear(),
                            beamGraphic.fillStyle(color, 1),
                            beamGraphic.beginPath(),
                            
                            beamGraphic.moveTo(-endPos / 2, 0),
                            beamGraphic.lineTo(endPos / 2, 0),
                            beamGraphic.lineTo(tweenData.w / 2, tweenData.h), 
                            beamGraphic.lineTo(-tweenData.w / 2, tweenData.h), 
                            
                            beamGraphic.closePath(), 
                            beamGraphic.fillPath();
                        }
                    });
                }),
                
                spawnDelay > maxDelay && (
                    maxDelay = spawnDelay
                ),
                activeBeams.push(beamGraphic);
            }

            scene.time.delayedCall(maxDelay + delayIncrement, () => {
                for (const beam of activeBeams) {
                    const exitDelay = 200 * Math.random(),
                        exitDuration = 400 + 100 * (2 * Math.random() - 1);
                    
                        scene.tweens.add({
                        targets: beam,
                        alpha: 0,
                        delay: exitDelay,
                        duration: exitDuration,
                        onComplete: () => beam.destroy()
                    });
                }
            });
        }(this, this._level.endXPos - this._cameraX + 60, worldYToScreenY(this._endPortalGameY) + this._cameraY, COLOR_GREEN), this.cameras.main.shake(1950, 0.004), this.time.delayedCall(1950, () => this._showCompleteText()));
    }
    _showCompleteText() {
        const centerX = SCREEN_WIDTH / 2,
            
            levelCompleteSplash = this.add.image(centerX, 250, 'GJ_WebSheet', "GJ_levelComplete_001.png").setScrollFactor(0).setDepth(60).setScale(0.01);
        
        this.tweens.add({
            targets: levelCompleteSplash,
            scale: 1.1,
            duration: 660,
            ease: 'Elastic.Out',
            easeParams: [1, 0.6],
            onComplete: () => {
                this.tweens.add({
                    targets: levelCompleteSplash,
                    scale: 0.01,
                    duration: 220,
                    delay: 880,
                    ease: 'Quad.In',
                    onComplete: () => {
                        levelCompleteSplash.setVisible(false), levelCompleteSplash.destroy();
                    }
                });
            }
        });

        // through particles on screen
        const tints = [COLOR_GREEN, 0xFFFFFF];
        for (let i = 0; i < 2; i++)
            this.add.particles(centerX, 250, "GJ_WebSheet", {
                frame: "square.png",
                speed: {
                    min: 300,
                    max: 700
                },
                angle: {
                    min: 0,
                    max: 360
                },
                scale: {
                    start: 0.4,
                    end: 0.13
                },
                lifespan: {
                    min: 0,
                    max: 1000
                },
                quantity: 50,
                stopAfter: 200,
                blendMode: BLEND_ADD,
                tint: tints[i],
                x: {
                    min: -800,
                    max: 800
                },
                y: {
                    min: -80,
                    max: 80
                }
            }
            ).setScrollFactor(0).setDepth(59);

        const portalX = this._level.endXPos - this._cameraX,
            portalY = worldYToScreenY(this._endPortalGameY) + this._cameraY;

        emitCircleEffect(this, portalX, portalY, 10, SCREEN_WIDTH, 800, true, false, COLOR_GREEN),
        emitCircleEffect(this, centerX, 250, 10, 1000, 800, true, false, COLOR_GREEN);
        
        for (let i = 0; i < 5; i++)
            this.time.delayedCall(50 * i, () => emitCircleEffect(this, portalX, portalY, 10, SCREEN_WIDTH, 500, false, true, COLOR_GREEN));

        for (let i = 0; i < 10; i++) {
            const burstDelay = 150 * i + (160 * Math.random() - 80);
            this.time.delayedCall(Math.max(0, burstDelay), () => emitWinBurst(this, COLOR_GREEN, COLOR_BLUE));
        }

        this.time.delayedCall(1500, () => this._showEndLayer());
    }
    _showEndLayer() {
        this._pauseBtn &&
            this.tweens.add({
                targets: this._pauseBtn,
                alpha: 0,
                duration: 300
            });
    
        const centerX = SCREEN_WIDTH / 2,
            centerY = 320;

        // end layer overlay
        this._endLayerOverlay = this.add.rectangle(centerX, centerY, SCREEN_WIDTH, SCREEN_HEIGHT, 0, 0).setScrollFactor(0).setDepth(200).setInteractive(),
        (
            this._endLayerInternal = this.add.container(0, -640).setScrollFactor(0).setDepth(201),
            this.tweens.add({
                targets: this._endLayerOverlay,
                alpha: 100 / 255,
                duration: 1000
            })
        );

        const slideState = {
            p: 0
        };
        this.tweens.add({
            targets: slideState,
            p: 1,
            duration: 1000,
            ease: "Bounce.Out",
            onUpdate: () => {
                this._endLayerInternal.y = 650 * slideState.p - 640;
            },
            onComplete: () => this._playStarAward()
        });
        
        const tableWidth = 712,
            tableHeight = 460,

            tableX = (SCREEN_WIDTH - tableWidth) / 2;
            
        this._endLayerInternal.add(this.add.rectangle(tableX + 356, 310, tableWidth, tableHeight, 0, 180 / 255));
      
        const sideFrame = this.textures.getFrame("GJ_WebSheet", "GJ_table_side_001.png"),
            sideScaleY = sideFrame ? tableHeight / sideFrame.height : 1;
        
        this._endLayerInternal.add(this.add.image(tableX - 40, 80, "GJ_WebSheet", 'GJ_table_side_001.png').setOrigin(0, 0).setScale(1, sideScaleY)),
        this._endLayerInternal.add(this.add.image(tableX + tableWidth + 40, 80, "GJ_WebSheet", 'GJ_table_side_001.png').setOrigin(1, 0).setFlipX(true).setScale(1, sideScaleY));
            
        const tableTop = this.add.image(tableX + 356, 70, "GJ_WebSheet", "GJ_table_top_001.png");
        this._endLayerInternal.add(tableTop), this._endLayerInternal.add(this.add.image(tableX + 356, 560, "GJ_WebSheet", "GJ_table_bottom_001.png"));
        
        const chainTopY = tableTop.y - 65;
        this._endLayerInternal.add(this.add.image(centerX - 312, chainTopY, 'GJ_WebSheet', "chain_01_001.png").setOrigin(0.5, 1)), this._endLayerInternal.add(this.add.image(centerX + 312, chainTopY, 'GJ_WebSheet', 'chain_01_001.png').setOrigin(0.5, 1)), this._endLayerInternal.add(this.add.image(centerX, 170, "GJ_WebSheet", "GJ_levelComplete_001.png").setScale(0.8));
        
        const fontScale = 0.8;
        let statsCursorY = 250;
        
        // attempts
        const attemptsLabel = this.add.bitmapText(centerX, statsCursorY, 'goldFont', "Attempts: " + this._attempts, 40).setOrigin(0.5, 0.5).setScale(fontScale);
        this._endLayerInternal.add(attemptsLabel),
        statsCursorY += 48,
        // jumps
        this._endLayerInternal.add(this.add.bitmapText(centerX, statsCursorY, "goldFont", "Jumps: " + this._totalJumps, 40).setOrigin(0.5, 0.5).setScale(fontScale)),
        statsCursorY += 48;
        
        const totalSeconds = Math.floor(this._playTime),
            hours = Math.floor(totalSeconds / 3600),
            minutes = Math.floor(totalSeconds % 3600 / 60),
            seconds = totalSeconds % 60;
            
        let formattedTime;
        formattedTime = hours > 0 ? String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0') : String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
        
        const lastStatY = statsCursorY;
        this._endLayerInternal.add(this.add.bitmapText(centerX, statsCursorY, "goldFont", "Time: " + formattedTime, 40).setOrigin(0.5, 0.5).setScale(fontScale));
        
        // random win text
        const winPool = ["Awesome!", "Good\nJob!", "Well\nDone!", "Impressive!", "Amazing!", 'Incredible!', "Skillful!", 'Brilliant!', "Not\nbad!", "Warp\nSpeed!", 'Challenge\x0aBreaker!', 'Reflex\x0aMaster!', "I am\nspeechless...", "You are...\nThe One!", "How is this\npossible!?", "You beat\nme..."],
            winText = winPool[Math.floor(Math.random() * winPool.length)],
            xOffset = 225;

        this._endLayerInternal.add(this.add.bitmapText(centerX + xOffset, lastStatY, 'bigFont', winText, 40).setOrigin(0.5, 0.5).setScale(0.8).setCenterAlign()),
        this._endLayerInternal.add(this.add.image(centerX - xOffset, 352.5, "GJ_WebSheet", 'getIt_001.png').setScale(1 / 1.5));
        
        // store links
        const storeLinks = [
            {
                key: "downloadApple_001",
                url: "https://apps.apple.com/us/app/geometry-dash/id625334537"
            },
            {
                key: "downloadGoogle_001",
                url: "https://play.google.com/store/apps/details?id=com.robtopx.geometryjump&hl=en"
            },
            {
                key: "downloadSteam_001",
                url: "https://store.steampowered.com/app/322170/Geometry_Dash"
            }
        ];

        for (let i = 0; i < storeLinks.length; i++) {
            const store = storeLinks[i],
                iconXOffset = (i - 1) * xOffset,
                iconScale = 1 / 1.5,
                storeIcon = this.add.image(centerX + iconXOffset, 437.5, "GJ_WebSheet", store.key + ".png").setScale(iconScale).setInteractive();
            
            this._endLayerInternal.add(storeIcon),
            this._makeBouncyButton(storeIcon, iconScale, () => window.open(store.url, "_blank"));
        }

        attemptsLabel.width, // ?

        // _playStarAward values
        this._endStarX = centerX + xOffset,
        this._endStarY = lastStatY - 77.5;

        // action buttons
        const footerButtons = [
            {
                frame: 'GJ_replayBtn_001.png',
                dx: -200,
                action: () => this._hideEndLayer(() => this._restartLevel())
            },
            {
                frame: 'GJ_menuBtn_001.png',
                dx: 200,
                action: () => {
                    this._audio.playEffect("quitSound_01"),
                    this._audio.stopMusic(),
                    this.game.registry.set("fadeInFromBlack", true),
                    this.cameras.main.fadeOut(400, 0, 0, 0, (camera, progress) => {
                        progress >= 1 && this.scene.restart();
                    });
                }
            }
        ];

        for (const buttonConfig of footerButtons) {
            const buttonImage = this.add.image(centerX + buttonConfig.dx, 555, "GJ_WebSheet", buttonConfig.frame).setInteractive();
            this._endLayerInternal.add(buttonImage),
            this._makeBouncyButton(buttonImage, 1, buttonConfig.action);
        }
    }
    _playStarAward() {
        if (!this._endLayerInternal) return;

        const starX = this._endStarX,
            starY = this._endStarY,

            starSprite = this.add.image(starX, starY, "GJ_WebSheet", "GJ_bigStar_001.png").setScale(3).setAlpha(0);
        
        this._endLayerInternal.add(starSprite),
        this.tweens.add({
            targets: starSprite,
            scale: 0.8,
            alpha: 1,
            duration: 300,
            delay: 0,
            ease: "Bounce.Out"
        }),
        
        this.time.delayedCall(100, () => {
            this._audio.playEffect("highscoreGet02");

            const worldX = starX,
                worldY = starY + this._endLayerInternal.y;
            
            this.add.particles(worldX, worldY, "GJ_WebSheet", {
                frame: "square.png",
                speed: {
                    min: 200,
                    max: 600
                },
                angle: {
                    min: 0,
                    max: 360
                },
                scale: {
                    start: 0.5,
                    end: 0
                },
                alpha: {
                    start: 1,
                    end: 0
                },
                lifespan: {
                    min: 200,
                    max: 600
                },
                quantity: 30,
                stopAfter: 30,
                blendMode: BLEND_ADD,
                tint: 0xFFFF00
            }).setScrollFactor(0).setDepth(202);
            
            const burstGraphic = this.add.graphics().setScrollFactor(0).setDepth(202).setBlendMode(BLEND_ADD),
                burstState = {
                    t: 0
                };

            this.tweens.add({
                targets: burstState,
                t: 1,
                duration: 400,
                ease: "Quad.Out",
                onUpdate: () => {
                    burstGraphic.clear(),
                    burstGraphic.fillStyle(0xFFFF00, 1 - burstState.t),
                    burstGraphic.fillCircle(worldX, worldY, 20 + 200 * burstState.t);
                },
                onComplete: () => burstGraphic.destroy()
            });
        });
    }
    _hideEndLayer(callback) {
        if (!this._endLayerInternal)
            return void(callback && callback());
        
        const endTarget = {
            p: 0
        };

        this.tweens.add({
            targets: endTarget,
            p: 1,
            duration: 500,
            ease: t => t < 0.5 ? Math.pow(2 * t, 2) / 2 : 1 - Math.pow(2 * (1 - t), 2) / 2,
            onUpdate: () => {
                this._endLayerInternal.y = -640 * endTarget.p;
            },
            onComplete: () => {
                this._endLayerInternal.destroy(), this._endLayerInternal = null, this._endLayerOverlay && (this._endLayerOverlay.destroy(), this._endLayerOverlay = null), callback && callback();
            }
        }),
        
        this.tweens.add({
            targets: this._endLayerOverlay,
            alpha: 0,
            duration: 500
        });
    }
}

export { GameScene };
