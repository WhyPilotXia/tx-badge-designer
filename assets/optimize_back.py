#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
反面动物园素材优化：
实物翻拍 -> 去噪、锐化、增强色彩与对比，向矢量印刷质感靠拢，同时保留全部细节。
"""
import os
from PIL import Image, ImageFilter, ImageEnhance

SRC = os.path.join(os.path.dirname(__file__), "back-src.jpg")
OUT = os.path.join(os.path.dirname(__file__), "card-back.jpg")

def main():
    im = Image.open(SRC).convert("RGB")

    # 1) 轻度中值去噪，抹平翻拍噪点与纸面纹理，但保留边缘
    im = im.filter(ImageFilter.MedianFilter(size=3))

    # 2) 双边式柔化 + 细节锐化（先轻微平滑再 UnsharpMask，靠近矢量色块观感）
    im = im.filter(ImageFilter.SMOOTH_MORE)
    im = im.filter(ImageFilter.UnsharpMask(radius=2.4, percent=140, threshold=2))

    # 3) 增强色彩饱和度（还原印刷鲜艳蓝调）
    im = ImageEnhance.Color(im).enhance(1.18)

    # 4) 轻微提升对比度，让色块更干净
    im = ImageEnhance.Contrast(im).enhance(1.08)

    # 5) 轻微提亮，去掉翻拍偏灰
    im = ImageEnhance.Brightness(im).enhance(1.03)

    # 6) 最终清晰度再收一刀
    im = ImageEnhance.Sharpness(im).enhance(1.25)

    im.save(OUT, "JPEG", quality=95, optimize=True)
    print("saved:", OUT, im.size)

if __name__ == "__main__":
    main()
