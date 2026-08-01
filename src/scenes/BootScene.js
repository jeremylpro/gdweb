/*
    the loading screen upon starting the game
*/
import * as Phaser from 'phaser';
import { setBlendModeAdd, setBlendModeNormal } from '../constants.js';
import { parseBMFont } from '../systems/BitmapFontParser.js';

class BootScene extends Phaser.Scene {
    constructor() {
        super({
            'key': "BootScene"
        });
    }
    preload() {
        ! function(game) {
            if (game.renderer.type === Phaser.WEBGL) {
                let webGLRenderingContext = game.renderer.gl;
                setBlendModeAdd(game.renderer.addBlendMode([webGLRenderingContext.SRC_ALPHA, webGLRenderingContext.ONE], webGLRenderingContext.FUNC_ADD)),
                setBlendModeNormal(game.renderer.addBlendMode([webGLRenderingContext.DST_COLOR, webGLRenderingContext.ONE_MINUS_SRC_ALPHA], webGLRenderingContext.FUNC_ADD));
            }
        }(this.game);

        let screenWidth = this.cameras.main.width,
            screenHeight = this.cameras.main.height,
            loadingBarWidth = 0.6 * screenWidth,
            
            // green loading bar
            loadingBar = this.add.rectangle(screenWidth / 2, screenHeight / 2, loadingBarWidth, 8, 0xFF00)
            .setOrigin(0.5, 0.5);
            
            loadingBar.scaleX = 0, this.load.on("progress", progress => {
                loadingBar.scaleX = progress;
            }),
        
        this.load.on("loaderror", fileObject => {}),
        // atlas
        this.load.atlas("GJ_WebSheet", 'assets/GJ_WebSheet.png', 'assets/GJ_WebSheet.json'),
        // atlas from original game
        this.load.atlas("GJ_GameSheet-hd", 'assets/GJ_GameSheet-hd.png', 'assets/GJ_GameSheet-hd.json'),
        this.load.atlas("GJ_GameSheet02-hd", 'assets/GJ_GameSheet02-hd.png', 'assets/GJ_GameSheet02-hd.json'),
        this.load.atlas("GJ_GameSheetIcons-hd", 'assets/GJ_GameSheetIcons-hd.png', 'assets/GJ_GameSheetIcons-hd.json'),
        // fonts
        this.load.image('bigFont', 'assets/bigFont.png'),
        this.load.text("bigFontFnt", "assets/bigFont.fnt"),
        this.load.image("goldFont", 'assets/goldFont.png'),
        this.load.text('goldFontFnt', "assets/goldFont.fnt"),
        // images
        this.load.image('game_bg_01', "assets/game_bg_01_001.png"),
        this.load.image("sliderBar", 'assets/sliderBar.png'),
        this.load.image('square04_001', "assets/square04_001.png"),
        this.load.image("GJ_square02", "assets/GJ_square02.png"),
        // level
        this.load.text("level_1", "assets/2.txt"),
        // audio
        this.load.audio('stereo_madness', "assets/StereoMadness.mp3"),
        this.load.audio('explode_11', "assets/explode_11.ogg"),
        this.load.audio('endStart_02', 'assets/endStart_02.ogg'),
        this.load.audio("playSound_01", 'assets/playSound_01.ogg'),
        this.load.audio("quitSound_01", "assets/quitSound_01.ogg"),
        this.load.audio("highscoreGet02", "assets/highscoreGet02.ogg");
    }
    create() { // caches level and font data
        // stereo madness
        this.cache.text.get("level_1");

        // cache fonts
        const bigFontRaw = this.cache.text.get("bigFontFnt");
        bigFontRaw && parseBMFont(this, "bigFont", bigFontRaw);
        const goldFontRaw = this.cache.text.get("goldFontFnt");
        goldFontRaw && parseBMFont(this, "goldFont", goldFontRaw),
        
        // start the game
        this.scene.start("GameScene");
    }
}

export { BootScene };
