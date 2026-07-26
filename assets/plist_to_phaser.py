"""  
Convert a Cocos2d/TexturePacker plist sprite atlas to a Phaser 3 JSON atlas.  
  
Usage:  
    python plist_to_phaser.py input.plist output.json [--scale 0.5] [--image override.png]  
"""  
  
import re  
import json  
import argparse  
import xml.etree.ElementTree as ET  
  
  
def parse_vec2(s):  
    """Parse '{x,y}' -> (x, y)"""  
    m = re.fullmatch(r'\{(-?[\d.]+),(-?[\d.]+)\}', s.strip())  
    if not m:  
        raise ValueError(f"Cannot parse vec2: {s!r}")  
    return float(m.group(1)), float(m.group(2))  
  
  
def parse_rect(s):  
    """Parse '{{x,y},{w,h}}' -> (x, y, w, h)"""  
    m = re.fullmatch(r'\{\{(-?[\d.]+),(-?[\d.]+)\},\{(-?[\d.]+),(-?[\d.]+)\}\}', s.strip())  
    if not m:  
        raise ValueError(f"Cannot parse rect: {s!r}")  
    return tuple(float(m.group(i)) for i in range(1, 5))  
  
  
def plist_dict_to_py(elem):  
    """Recursively convert a plist <dict> element to a Python dict."""  
    result = {}  
    children = list(elem)  
    for i in range(0, len(children), 2):  
        key_elem = children[i]  
        val_elem = children[i + 1]  
        assert key_elem.tag == 'key', f"Expected <key>, got <{key_elem.tag}>"  
        key = key_elem.text  
        result[key] = plist_val_to_py(val_elem)  
    return result  
  
  
def plist_val_to_py(elem):  
    tag = elem.tag  
    if tag == 'dict':  
        return plist_dict_to_py(elem)  
    elif tag == 'array':  
        return [plist_val_to_py(c) for c in elem]  
    elif tag == 'string':  
        return elem.text or ''  
    elif tag == 'integer':  
        return int(elem.text)  
    elif tag == 'real':  
        return float(elem.text)  
    elif tag == 'true':  
        return True  
    elif tag == 'false':  
        return False  
    else:  
        raise ValueError(f"Unknown plist tag: <{tag}>")  
  
  
def convert(plist_path, output_path, scale_override=None, image_override=None):  
    tree = ET.parse(plist_path)  
    root = tree.getroot()  
  
    # The root <plist> contains a single <dict>  
    top = plist_dict_to_py(root.find('dict'))  
  
    frames_raw = top['frames']  
    meta_raw   = top['metadata']  
  
    # --- Metadata ---  
    image_name = image_override or meta_raw.get('realTextureFileName') or meta_raw.get('textureFileName', 'atlas.png')  
    fmt        = meta_raw.get('pixelFormat', 'RGBA8888')  
    size_str   = meta_raw.get('size', '{0,0}')  
    sw, sh     = parse_vec2(size_str)  
    smartupdate = meta_raw.get('smartupdate', '')  
    scale      = scale_override if scale_override is not None else 1  
  
    # --- Frames ---  
    phaser_frames = []  
    for filename, fd in frames_raw.items():  
        rotated = fd.get('textureRotated', False)  
  
        # Trimmed sprite dimensions (in atlas space)  
        sprite_w, sprite_h = parse_vec2(fd['spriteSize'])  
  
        # Full original source dimensions  
        src_w, src_h = parse_vec2(fd['spriteSourceSize'])  
  
        # Atlas position  
        rect_x, rect_y, rect_w, rect_h = parse_rect(fd['textureRect'])  
  
        # Offset: displacement of trimmed-sprite center from source center.  
        # Plist Y axis points up; screen Y points down, so offsetY is negated.  
        off_x, off_y = parse_vec2(fd['spriteOffset'])  
        ssx = src_w / 2 + off_x - sprite_w / 2  
        ssy = src_h / 2 - off_y - sprite_h / 2  
  
        # When rotated, the stored rect w/h are swapped relative to the sprite  
        frame_w = rect_h if rotated else rect_w  
        frame_h = rect_w if rotated else rect_h  
  
        trimmed = (sprite_w != src_w) or (sprite_h != src_h)  
  
        phaser_frames.append({  
            'filename': filename,  
            'rotated': rotated,  
            'trimmed': trimmed,  
            'sourceSize': {  
                'w': int(src_w),  
                'h': int(src_h),  
            },  
            'spriteSourceSize': {  
                'x': int(ssx),  
                'y': int(ssy),  
                'w': int(sprite_w),  
                'h': int(sprite_h),  
            },  
            'frame': {  
                'x': int(rect_x),  
                'y': int(rect_y),  
                'w': int(frame_w),  
                'h': int(frame_h),  
            },  
        })  
  
    output = {  
        'textures': [  
            {  
                'image': image_name,  
                'format': fmt,  
                'size': {'w': int(sw), 'h': int(sh)},  
                'scale': scale,  
                'frames': phaser_frames,  
            }  
        ],  
        'meta': {  
            'app': 'https://www.codeandweb.com/texturepacker',  
            'version': '3.0',  
            'smartupdate': smartupdate,  
        },  
    }  
  
    with open(output_path, 'w', encoding='utf-8') as f:  
        json.dump(output, f, indent='\t', ensure_ascii=False)  
  
    print(f"Wrote {len(phaser_frames)} frames to {output_path}")  
  
  
if __name__ == '__main__':  
    parser = argparse.ArgumentParser(description='Convert plist atlas to Phaser JSON')  
    parser.add_argument('input',  help='Input .plist file')  
    parser.add_argument('output', help='Output .json file')  
    parser.add_argument('--scale', type=float, default=None,  
                        help='Override scale value (default: 1)')  
    parser.add_argument('--image', default=None,  
                        help='Override image filename in output JSON')  
    args = parser.parse_args()  
  
    convert(args.input, args.output, scale_override=args.scale, image_override=args.image)