/*
    handles parsing level data, also contains definitions and helpers
*/
import pako from 'pako';
import { TILE_SIZE2, COLOR_GREEN, OBJECT_TYPE_SOLID, OBJECT_TYPE_HAZARD, OBJECT_TYPE_PORTAL_SHIP, OBJECT_TYPE2_SOLID, OBJECT_TYPE2_HAZARD, OBJECT_TYPE2_DECORATIVE, OBJECT_TYPE2_PORTAL, OBJECT_TYPE2_PAD, OBJECT_TYPE2_RING, OBJECT_TYPE2_TRIGGER, OBJECT_TYPE2_SPEED, OBJECT_TYPE2_FLY, OBJECT_TYPE2_CUBE } from '../constants.js';

// parses a single object (comma separated key value pairs) into an object with the relevant properties, returns null if the object is invalid and should be skipped
function parseObject(objectString) {
    let parts = objectString.split(','),
        properties = {};
    
    for (let i = 0; i + 1 < parts.length; i += 2) {
        let key = parseInt(parts[i], 10),
            value = parts[i + 1];
        properties[key] = value;
    }

    let id = parseInt(properties[1] || '0', 10);
    return 0 === id ? null : {
        id: id,
        x: parseFloat(properties[2] || '0'),
        y: parseFloat(properties[3] || '0'),
        flipX: '1' === properties[4],
        flipY: '1' === properties[5],
        rot: parseFloat(properties[6] || '0'),
        scale: parseFloat(properties[32] || '1'),
        zLayer: parseInt(properties[24] || '0', 10),
        zOrder: parseInt(properties[25] || '0', 10),
        groups: properties[57] || '',
        color1: parseInt(properties[21] || '0', 10),
        color2: parseInt(properties[22] || '0', 10),
        _raw: properties
    };
}

// decode a level
function parseLevel(level) {
    let decompressed = function(level) {
            let base64 = function(input) {
                    let value = input.replace(/-/g, '+').replace(/_/g, '/');
                    for (; value.length % 4 != 0;) value += '=';
                    return value;
                }(level.trim()),

                binary = atob(base64),
                bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            
            let inflated = pako.inflate(bytes);
            return new TextDecoder().decode(inflated);
        }(level),

        parts = decompressed.split(';'),
        settings = parts.length > 0 ? parts[0] : '',
        objects = [];

    // parse objects
    for (let i = 1; i < parts.length; i++) {
        if (0 === parts[i].length) continue;
        let object = parseObject(parts[i]);
        object && objects.push(object);
    }

    return {
        settings: settings,
        objects: objects
    };
}
const OBJECT_DEFINITIONS = {
        1: {
            type: OBJECT_TYPE2_SOLID,
            frame: "square_01_001.png",
            gridW: 1,
            gridH: 1
        },
        2: {
            type: OBJECT_TYPE2_SOLID,
            frame: "square_02_001.png",
            gridW: 1,
            gridH: 1
        },
        3: {
            type: OBJECT_TYPE2_SOLID,
            frame: "square_03_001.png",
            gridW: 1,
            gridH: 1
        },
        4: {
            type: OBJECT_TYPE2_SOLID,
            frame: "square_04_001.png",
            gridW: 1,
            gridH: 1
        },
        5: {
            type: OBJECT_TYPE2_DECORATIVE,
            frame: 'square_05_001.png',
            gridW: 1,
            gridH: 1
        },
        6: {
            type: OBJECT_TYPE2_SOLID,
            frame: "square_06_001.png",
            gridW: 1,
            gridH: 1
        },
        7: {
            type: OBJECT_TYPE2_SOLID,
            frame: "square_07_001.png",
            gridW: 1,
            gridH: 1
        },
        83: {
            type: OBJECT_TYPE2_SOLID,
            frame: "square_08_001.png",
            gridW: 1,
            gridH: 1
        },
        40: {
            type: OBJECT_TYPE2_SOLID,
            frame: "plank_01_001.png",
            gridW: 1,
            gridH: 0.5,
            children: [{
                frame: "plank_01_color_001.png",
                tint: 0
            }]
        },
        8: {
            type: OBJECT_TYPE2_HAZARD,
            frame: 'spike_01_001.png',
            gridW: 1,
            gridH: 1,
            'spriteW': 30,
            'spriteH': 30,
            'hitboxScaleX': 0.2,
            'hitboxScaleY': 0.4
        },
        39: {
            type: OBJECT_TYPE2_HAZARD,
            frame: "spike_02_001.png",
            gridW: 1,
            gridH: 1,
            'spriteW': 30,
            'spriteH': 14,
            'hitboxScaleX': 0.2,
            'hitboxScaleY': 0.4
        },
        103: {
            type: OBJECT_TYPE2_HAZARD,
            frame: 'spike_03_001.png',
            gridW: 0.5,
            gridH: 0.5,
            'spriteW': 20,
            'spriteH': 19,
            'hitboxScaleX': 0.2,
            'hitboxScaleY': 0.4
        },
        392: {
            type: OBJECT_TYPE2_HAZARD,
            frame: "spike_04_001.png",
            gridW: 0.5,
            gridH: 0.5,
            'spriteW': 13,
            'spriteH': 12,
            'hitboxScaleX': 0.2,
            'hitboxScaleY': 0.4
        },
        9: {
            type: OBJECT_TYPE2_HAZARD,
            frame: "pit_01_001.png",
            gridW: 0,
            gridH: 0,
            'black': true,
            'spriteW': 30,
            'spriteH': 27,
            'hitboxScaleX': 0.3,
            'hitboxScaleY': 0.4,
            'randomFrames': ["pit_01_001.png", 'pit_02_001.png', "pit_03_001.png"]
        },
        61: {
            type: OBJECT_TYPE2_HAZARD,
            frame: 'pit_04_001.png',
            gridW: 0,
            gridH: 0,
            'black': true,
            'spriteW': 30,
            'spriteH': 18,
            'hitboxScaleX': 0.3,
            'hitboxScaleY': 0.4
        },
        10: {
            type: OBJECT_TYPE2_PORTAL,
            frame: "portal_01_front_001.png",
            gridW: 1,
            gridH: 3,
            'sub': 'gravity_flip'
        },
        11: {
            type: OBJECT_TYPE2_PORTAL,
            frame: 'portal_02_front_001.png',
            gridW: 1,
            gridH: 3,
            'sub': "gravity_normal"
        },
        12: {
            type: OBJECT_TYPE2_PORTAL,
            frame: "portal_03_front_001.png",
            gridW: 1,
            gridH: 3,
            'sub': OBJECT_TYPE2_CUBE,
            'portalParticle': true,
            'portalParticleColor': 5111552
        },
        13: {
            type: OBJECT_TYPE2_PORTAL,
            frame: "portal_04_front_001.png",
            gridW: 1,
            gridH: 3,
            'sub': OBJECT_TYPE2_FLY,
            'portalParticle': true,
            'portalParticleColor': 16711935
        },
        45: {
            type: OBJECT_TYPE2_PORTAL,
            frame: "portal_05_front_001.png",
            gridW: 1,
            gridH: 3,
            'sub': OBJECT_TYPE2_FLY
        },
        46: {
            type: OBJECT_TYPE2_PORTAL,
            frame: "portal_06_front_001.png",
            gridW: 1,
            gridH: 3,
            'sub': OBJECT_TYPE2_CUBE
        },
        47: {
            type: OBJECT_TYPE2_PORTAL,
            frame: 'portal_07_front_001.png',
            gridW: 1,
            gridH: 3,
            'sub': OBJECT_TYPE2_FLY
        },
        200: {
            type: OBJECT_TYPE2_SPEED,
            frame: "portal_09_front_001.png",
            gridW: 1,
            gridH: 3,
            'sub': "slow"
        },
        201: {
            type: OBJECT_TYPE2_SPEED,
            frame: "portal_10_front_001.png",
            gridW: 1,
            gridH: 3,
            'sub': "normal"
        },
        202: {
            type: OBJECT_TYPE2_SPEED,
            frame: "portal_08_front_001.png",
            gridW: 1,
            gridH: 3,
            'sub': "fast"
        },
        203: {
            type: OBJECT_TYPE2_SPEED,
            frame: "portal_11_front_001.png",
            gridW: 1,
            gridH: 3,
            'sub': "very_fast"
        },
        35: {
            type: OBJECT_TYPE2_PAD,
            frame: "bump_01_001.png",
            gridW: 26/31,
            gridH: 5/31,
            sub: "yellow"
        },
        67: {
            type: OBJECT_TYPE2_PAD,
            frame: "gravbump_01_001.png",
            gridW: 26/31,
            gridH: 5/31,
            sub: "blue"
        },
        140: {
            type: OBJECT_TYPE2_PAD,
            frame: "bump_03_001.png",
            gridW: 26/31,
            gridH: 5/31,
            sub: "pink"
        },
        36: {
            type: OBJECT_TYPE2_RING,
            frame: 'ring_01_001.png',
            gridW: 1,
            gridH: 1
        },
        84: {
            type: OBJECT_TYPE2_RING,
            frame: 'ring_02_001.png',
            gridW: 1,
            gridH: 1
        },
        141: {
            type: OBJECT_TYPE2_RING,
            frame: "ring_03_001.png",
            gridW: 1,
            gridH: 1
        },
        62: {
            type: OBJECT_TYPE2_SOLID,
            frame: "square_b_01_001.png",
            gridW: 1,
            gridH: 1
        },
        63: {
            type: OBJECT_TYPE2_SOLID,
            frame: "square_b_02_001.png",
            gridW: 1,
            gridH: 1
        },
        64: {
            type: OBJECT_TYPE2_SOLID,
            frame: "square_b_03_001.png",
            gridW: 1,
            gridH: 1
        },
        65: {
            type: OBJECT_TYPE2_SOLID,
            frame: "square_b_04_001.png",
            gridW: 1,
            gridH: 1
        },
        66: {
            type: OBJECT_TYPE2_SOLID,
            frame: "square_b_05_001.png",
            gridW: 1,
            gridH: 1
        },
        68: {
            type: OBJECT_TYPE2_SOLID,
            frame: 'square_b_06_001.png',
            gridW: 1,
            gridH: 1
        },
        195: {
            type: OBJECT_TYPE2_SOLID,
            frame: "square_01_001.png",
            gridW: 0.5,
            gridH: 0.5
        },
        196: {
            type: OBJECT_TYPE2_SOLID,
            frame: "plank_01_001.png",
            gridW: 0.5,
            gridH: 0.25
        },
        48: {
            type: OBJECT_TYPE2_DECORATIVE,
            frame: 'd_cloud_01_001.png',
            gridW: 0,
            gridH: 0
        },
        49: {
            type: OBJECT_TYPE2_DECORATIVE,
            frame: 'd_cloud_02_001.png',
            gridW: 0,
            gridH: 0
        },
        129: {
            type: OBJECT_TYPE2_DECORATIVE,
            frame: "d_cloud_03_001.png",
            gridW: 0,
            gridH: 0
        },
        130: {
            type: OBJECT_TYPE2_DECORATIVE,
            frame: 'd_cloud_04_001.png',
            gridW: 0,
            gridH: 0
        },
        131: {
            type: OBJECT_TYPE2_DECORATIVE,
            frame: "d_cloud_05_001.png",
            gridW: 0,
            gridH: 0
        },
        50: {
            type: OBJECT_TYPE2_DECORATIVE,
            frame: "d_ball_01_001.png",
            gridW: 0,
            gridH: 0
        },
        51: {
            type: OBJECT_TYPE2_DECORATIVE,
            frame: "d_ball_02_001.png",
            gridW: 0,
            gridH: 0
        },
        52: {
            type: OBJECT_TYPE2_DECORATIVE,
            frame: 'd_ball_03_001.png',
            gridW: 0,
            gridH: 0
        },
        53: {
            type: OBJECT_TYPE2_DECORATIVE,
            frame: "d_ball_04_001.png",
            gridW: 0,
            gridH: 0
        },
        54: {
            type: OBJECT_TYPE2_DECORATIVE,
            frame: 'd_ball_05_001.png',
            gridW: 0,
            gridH: 0
        },
        55: {
            type: OBJECT_TYPE2_DECORATIVE,
            frame: 'd_ball_06_001.png',
            gridW: 0,
            gridH: 0
        },
        56: {
            type: OBJECT_TYPE2_DECORATIVE,
            frame: "d_ball_07_001.png",
            gridW: 0,
            gridH: 0
        },
        57: {
            type: OBJECT_TYPE2_DECORATIVE,
            frame: 'd_ball_08_001.png',
            gridW: 0,
            gridH: 0
        },
        58: {
            type: OBJECT_TYPE2_DECORATIVE,
            frame: 'd_ball_09_001.png',
            gridW: 0,
            gridH: 0
        },
        60: {
            type: OBJECT_TYPE2_DECORATIVE,
            frame: "d_ball_06_001.png",
            gridW: 0,
            gridH: 0
        },
        125: {
            type: OBJECT_TYPE2_DECORATIVE,
            frame: "d_smallBall_01_001.png",
            gridW: 0,
            gridH: 0
        },
        126: {
            type: OBJECT_TYPE2_DECORATIVE,
            frame: "d_smallBall_02_001.png",
            gridW: 0,
            gridH: 0
        },
        127: {
            type: OBJECT_TYPE2_DECORATIVE,
            frame: 'd_smallBall_03_001.png',
            gridW: 0,
            gridH: 0
        },
        128: {
            type: OBJECT_TYPE2_DECORATIVE,
            frame: "d_smallBall_04_001.png",
            gridW: 0,
            gridH: 0
        },
        145: {
            type: OBJECT_TYPE2_DECORATIVE,
            frame: 'd_smallBall_05_001.png',
            gridW: 0,
            gridH: 0
        },
        41: {
            type: OBJECT_TYPE2_DECORATIVE,
            frame: "chain_01_001.png",
            gridW: 0,
            gridH: 0,
            blend: "additive",
            tint: COLOR_GREEN
        },
        123: {
            type: OBJECT_TYPE2_DECORATIVE,
            frame: "d_thorn_01_001.png",
            gridW: 0,
            gridH: 0
        },
        124: {
            type: OBJECT_TYPE2_DECORATIVE,
            frame: "d_thorn_02_001.png",
            gridW: 0,
            gridH: 0
        },
        15: {
            type: OBJECT_TYPE2_DECORATIVE,
            frame: "rod_01_001.png",
            gridW: 0,
            gridH: 0,
            z: -6,
            children: [{
                frame: 'rod_ball_01_001.png',
                localDy: -62,
                blend: "additive",
                tint: COLOR_GREEN,
                z: 1,
                audioScale: true
            }]
        },
        16: {
            type: OBJECT_TYPE2_DECORATIVE,
            frame: 'rod_02_001.png',
            gridW: 0,
            gridH: 0,
            z: -6,
            children: [{
                frame: "rod_ball_01_001.png",
                localDy: -46.5,
                blend: "additive",
                tint: COLOR_GREEN,
                z: 1,
                audioScale: true
            }]
        },
        17: {
            type: OBJECT_TYPE2_DECORATIVE,
            frame: 'rod_03_001.png',
            gridW: 0,
            gridH: 0,
            z: -6,
            children: [{
                frame: "rod_ball_01_001.png",
                localDy: -32.5,
                blend: "additive",
                tint: COLOR_GREEN,
                z: 1,
                audioScale: true
            }]
        },
        132: {
            type: OBJECT_TYPE2_DECORATIVE,
            frame: "d_arrow_01_001.png",
            gridW: 0,
            gridH: 0
        },
        133: {
            type: OBJECT_TYPE2_DECORATIVE,
            frame: "d_exmark_01_001.png",
            gridW: 0,
            gridH: 0
        },
        136: {
            type: OBJECT_TYPE2_DECORATIVE,
            frame: "d_qmark_01_001.png",
            gridW: 0,
            gridH: 0
        },
        151: {
            type: OBJECT_TYPE2_DECORATIVE,
            frame: "d_spikeart_01_001.png",
            gridW: 0,
            gridH: 0,
            blend: "additive",
            tint: COLOR_GREEN
        },
        152: {
            type: OBJECT_TYPE2_DECORATIVE,
            frame: 'd_spikeart_02_001.png',
            gridW: 0,
            gridH: 0,
            blend: "additive",
            tint: COLOR_GREEN
        },
        153: {
            type: OBJECT_TYPE2_DECORATIVE,
            frame: "d_spikeart_03_001.png",
            gridW: 0,
            gridH: 0,
            blend: "additive",
            tint: COLOR_GREEN
        },
        88: {
            type: OBJECT_TYPE2_HAZARD,
            frame: 'sawblade_01_001.png',
            gridW: 1,
            gridH: 1
        },
        89: {
            type: OBJECT_TYPE2_HAZARD,
            frame: "sawblade_02_001.png",
            gridW: 2,
            gridH: 2
        },
        98: {
            type: OBJECT_TYPE2_HAZARD,
            frame: "sawblade_03_001.png",
            gridW: 3,
            gridH: 3
        },
        18: {
            type: OBJECT_TYPE2_DECORATIVE,
            frame: "d_spikes_01_001.png",
            gridW: 0,
            gridH: 0,
            blend: "additive",
            tint: COLOR_GREEN
        },
        19: {
            type: OBJECT_TYPE2_DECORATIVE,
            frame: "d_spikes_02_001.png",
            gridW: 0,
            gridH: 0,
            blend: "additive",
            tint: COLOR_GREEN
        },
        20: {
            type: OBJECT_TYPE2_DECORATIVE,
            frame: "d_spikes_03_001.png",
            gridW: 0,
            gridH: 0,
            blend: "additive",
            tint: COLOR_GREEN
        },
        21: {
            type: OBJECT_TYPE2_DECORATIVE,
            frame: 'd_spikes_04_001.png',
            gridW: 0,
            gridH: 0,
            blend: 'additive',
            tint: COLOR_GREEN
        },
        135: {
            type: OBJECT_TYPE2_DECORATIVE,
            frame: "fakeSpike_01_001.png",
            gridW: 0,
            gridH: 0,
            'black': true
        },
        1889: {
            type: OBJECT_TYPE2_DECORATIVE,
            frame: "fakeSpike_01_001.png",
            gridW: 0,
            gridH: 0,
            'black': true
        },
        1890: {
            type: OBJECT_TYPE2_DECORATIVE,
            frame: "fakeSpike_02_001.png",
            gridW: 0,
            gridH: 0,
            'black': true
        },
        1891: {
            type: OBJECT_TYPE2_DECORATIVE,
            frame: "fakeSpike_03_001.png",
            gridW: 0,
            gridH: 0,
            'black': true
        },
        1892: {
            type: OBJECT_TYPE2_DECORATIVE,
            frame: "fakeSpike_04_001.png",
            gridW: 0,
            gridH: 0,
            'black': true
        },
        150: {
            type: OBJECT_TYPE2_DECORATIVE,
            frame: 'd_cross_01_001.png',
            gridW: 0,
            gridH: 0
        },
        134: {
            type: OBJECT_TYPE2_DECORATIVE,
            frame: "d_largeSquare_01_001.png",
            gridW: 0,
            gridH: 0
        },
        146: {
            type: OBJECT_TYPE2_DECORATIVE,
            frame: "d_largeSquare_02_001.png",
            gridW: 0,
            gridH: 0
        },
        138: {
            type: OBJECT_TYPE2_DECORATIVE,
            frame: "d_art_01_001.png",
            gridW: 0,
            gridH: 0
        },
        137: {
            type: OBJECT_TYPE2_DECORATIVE,
            frame: "brick_02_001.png",
            gridW: 0,
            gridH: 0
        },
        139: {
            type: OBJECT_TYPE2_DECORATIVE,
            frame: "d_brick_01_001.png",
            gridW: 0,
            gridH: 0
        },
        157: {
            type: OBJECT_TYPE2_DECORATIVE,
            frame: "d_wave_01_001.png",
            gridW: 0,
            gridH: 0
        },
        158: {
            type: OBJECT_TYPE2_DECORATIVE,
            frame: 'd_wave_02_001.png',
            gridW: 0,
            gridH: 0
        },
        159: {
            type: OBJECT_TYPE2_DECORATIVE,
            frame: "d_wave_03_001.png",
            gridW: 0,
            gridH: 0
        },
        143: {
            type: OBJECT_TYPE2_DECORATIVE,
            frame: 'd_circle_01_001.png',
            gridW: 0,
            gridH: 0
        },
        144: {
            type: OBJECT_TYPE2_DECORATIVE,
            frame: 'd_circle_02_001.png',
            gridW: 0,
            gridH: 0
        },
        22: {
            type: OBJECT_TYPE2_TRIGGER,
            frame: null,
            gridW: 0,
            gridH: 0,
            'enterEffect': 0
        },
        23: {
            type: OBJECT_TYPE2_TRIGGER,
            frame: null,
            gridW: 0,
            gridH: 0,
            'enterEffect': 1
        },
        24: {
            type: OBJECT_TYPE2_TRIGGER,
            frame: null,
            gridW: 0,
            gridH: 0,
            'enterEffect': 2
        },
        25: {
            type: OBJECT_TYPE2_TRIGGER,
            frame: null,
            gridW: 0,
            gridH: 0,
            'enterEffect': 3
        },
        26: {
            type: OBJECT_TYPE2_TRIGGER,
            frame: null,
            gridW: 0,
            gridH: 0,
            'enterEffect': 4
        },
        27: {
            type: OBJECT_TYPE2_TRIGGER,
            frame: null,
            gridW: 0,
            gridH: 0,
            'enterEffect': 5
        },
        28: {
            type: OBJECT_TYPE2_TRIGGER,
            frame: null,
            gridW: 0,
            gridH: 0,
            'enterEffect': 6
        },
        29: {
            type: OBJECT_TYPE2_TRIGGER,
            frame: null,
            gridW: 0,
            gridH: 0,
            'colorIdx': 1000
        },
        30: {
            type: OBJECT_TYPE2_TRIGGER,
            frame: null,
            gridW: 0,
            gridH: 0,
            'colorIdx': 1001
        },
        104: {
            type: OBJECT_TYPE2_TRIGGER,
            frame: null,
            gridW: 0,
            gridH: 0
        },
        105: {
            type: OBJECT_TYPE2_TRIGGER,
            frame: null,
            gridW: 0,
            gridH: 0
        },
        221: {
            type: OBJECT_TYPE2_TRIGGER,
            frame: null,
            gridW: 0,
            gridH: 0
        },
        899: {
            type: OBJECT_TYPE2_TRIGGER,
            frame: null,
            gridW: 0,
            gridH: 0
        },
        901: {
            type: OBJECT_TYPE2_TRIGGER,
            frame: null,
            gridW: 0,
            gridH: 0
        },
        1006: {
            type: OBJECT_TYPE2_TRIGGER,
            frame: null,
            gridW: 0,
            gridH: 0
        },
        44: {
            type: OBJECT_TYPE2_DECORATIVE,
            frame: null,
            gridW: 0,
            gridH: 0
        },
        142: {
            type: OBJECT_TYPE2_DECORATIVE,
            frame: "secretCoin_01_001.png",
            gridW: 1,
            gridH: 1
        },
        1329: {
            type: OBJECT_TYPE2_DECORATIVE,
            frame: "secretCoin_2_01_001.png",
            gridW: 1,
            gridH: 1
        }
    },

    // objects with glow variants
    OBJECT_GLOW_ARRAY = [1, 2, 3, 4, 6, 7, 83, 8, 39, 103, 392, 35, 36, 40, 140, 141, 62, 65, 66, 68, 195, 196];
for (let id of OBJECT_GLOW_ARRAY) // mark objects with glow variants as true in the main object definition
    OBJECT_DEFINITIONS[id] && (
        OBJECT_DEFINITIONS[id].glow = true
    );

// get object definition by id
function getObjectDefinition(key) {
    return OBJECT_DEFINITIONS[key] || null;
}

export { parseObject, parseLevel, getObjectDefinition, OBJECT_DEFINITIONS };
