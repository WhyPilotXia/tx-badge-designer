#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
腾讯标准 Logo 处理：
1. 从 8K 渲染图中自动检测并裁剪出 Logo 区域
2. 白底蓝字 -> 透明底白字（用于蓝底信息区）
"""
import os
from PIL import Image

SRC = os.path.join(os.path.dirname(__file__), "logo-hd.png")
OUT = os.path.join(os.path.dirname(__file__), "logo-white.png")

def main():
    im = Image.open(SRC).convert("RGB")
    w, h = im.size
    px = im.load()

    # 1) 扫描非白像素，定位 Logo 包围盒
    min_x, min_y, max_x, max_y = w, h, 0, 0
    step = 4  # 抽样步长，加速扫描
    for y in range(0, h, step):
        for x in range(0, w, step):
            r, g, b = px[x, y]
            # 白色背景阈值：接近纯白视为背景
            if not (r > 235 and g > 235 and b > 235):
                if x < min_x: min_x = x
                if x > max_x: max_x = x
                if y < min_y: min_y = y
                if y > max_y: max_y = y

    pad = 20
    min_x = max(0, min_x - pad); min_y = max(0, min_y - pad)
    max_x = min(w, max_x + pad); max_y = min(h, max_y + pad)
    logo = im.crop((min_x, min_y, max_x, max_y))
    lw, lh = logo.size
    print("logo bbox:", lw, "x", lh)

    # 2) 白底蓝字 -> 透明底白字
    #    以亮度/饱和度生成 alpha：蓝色字形处不透明，白底处全透明
    out = Image.new("RGBA", (lw, lh))
    src = logo.load()
    dst = out.load()
    for y in range(lh):
        for x in range(lw):
            r, g, b = src[x, y]
            # 计算与白色的距离作为不透明度依据
            whiteness = (r + g + b) / 3
            # 白底 -> alpha 0；蓝字（较暗/饱和） -> alpha 255
            alpha = 255 - whiteness
            alpha = int(max(0, min(255, alpha * 1.6)))  # 增强对比，收净边缘
            dst[x, y] = (255, 255, 255, alpha)

    out.save(OUT, "PNG")
    print("saved:", OUT, out.size)

if __name__ == "__main__":
    main()
