(function () {
  const $ = (id) => document.getElementById(id);

  const enName = $("enName");
  const zhName = $("zhName");
  const outEn = $("outEn");
  const outZh = $("outZh");

  const uploader = $("uploader");
  const photoInput = $("photoInput");
  const photoImg = $("photoImg");
  const photoBox = $("photoBox");

  const card = $("card");
  const flipBtn = $("flipBtn");
  const downloadBtn = $("downloadBtn");
  const tabs = document.querySelectorAll(".tab");

  const adjustPhoto = $("adjustPhoto");
  const adjustCtl = $("adjustCtl");
  const photoScale = $("photoScale");
  const photoY = $("photoY");
  const brandLogo = $("brandLogo");

  /* ---------- 文本同步 ---------- */
  const syncText = () => {
    outEn.textContent = enName.value || "Your Name";
    outZh.textContent = zhName.value || "姓名";
  };
  enName.addEventListener("input", syncText);
  zhName.addEventListener("input", syncText);
  syncText();

  /* ---------- 照片上传 ---------- */
  const loadFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      photoImg.src = e.target.result;
      photoBox.classList.add("has-img");
    };
    reader.readAsDataURL(file);
  };

  uploader.addEventListener("click", () => photoInput.click());
  photoInput.addEventListener("change", (e) => loadFile(e.target.files[0]));

  ["dragenter", "dragover"].forEach((ev) =>
    uploader.addEventListener(ev, (e) => {
      e.preventDefault();
      uploader.classList.add("is-drag");
    })
  );
  ["dragleave", "drop"].forEach((ev) =>
    uploader.addEventListener(ev, (e) => {
      e.preventDefault();
      uploader.classList.remove("is-drag");
    })
  );
  uploader.addEventListener("drop", (e) => {
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    loadFile(file);
  });

  /* ---------- 照片微调 ---------- */
  const applyPhotoTransform = () => {
    const s = photoScale.value / 100;
    const y = photoY.value;
    photoImg.style.transform = `scale(${s}) translateY(${y}px)`;
  };
  adjustPhoto.addEventListener("change", () => {
    adjustCtl.hidden = !adjustPhoto.checked;
  });
  photoScale.addEventListener("input", applyPhotoTransform);
  photoY.addEventListener("input", applyPhotoTransform);

  /* ---------- 翻面 ---------- */
  const setSide = (side) => {
    const isBack = side === "back";
    card.classList.toggle("is-flipped", isBack);
    tabs.forEach((t) => t.classList.toggle("is-active", t.dataset.side === side));
  };
  card.addEventListener("click", () => {
    setSide(card.classList.contains("is-flipped") ? "front" : "back");
  });
  flipBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    setSide(card.classList.contains("is-flipped") ? "front" : "back");
  });
  tabs.forEach((t) => t.addEventListener("click", () => setSide(t.dataset.side)));

  /* ---------- 下载正面 PNG ---------- */
  downloadBtn.addEventListener("click", async () => {
    try {
      await document.fonts.ready;
      await ensureFontLoaded();
    } catch (_) {}
    const data = renderFrontToPng();
    const a = document.createElement("a");
    a.href = data;
    a.download = `腾讯工卡_${(enName.value || "badge").replace(/\s+/g, "")}.png`;
    a.click();
  });

  // 预加载字体到 FontFace，确保 canvas 绘制时可用
  async function ensureFontLoaded() {
    if (document.fonts && document.fonts.check('16px "TencentW7"')) return;
    try {
      const ff = new FontFace("TencentW7", 'url("assets/tencent-w7.ttf")');
      await ff.load();
      document.fonts.add(ff);
    } catch (_) {}
  }

  /* 纯 Canvas 手绘正面：白底 + 证件照 + 蓝色信息区 + 文字，稳定无跨域限制 */
  function renderFrontToPng() {
    // 逻辑尺寸（与卡片比例一致 0.63:1）
    const W = 720;
    const H = Math.round(W / 0.63); // ≈1143
    const R = Math.round(W * 0.061); // 圆角，对应 22px/360px

    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    // 圆角裁剪
    roundRect(ctx, 0, 0, W, H, R);
    ctx.clip();

    // 背景白
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);

    const infoH = Math.round(H * 0.33);
    const photoH = H - infoH;

    // 照片区（纯白底，缩小时周围留白）
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, photoH);
    if (photoBox.classList.contains("has-img") && photoImg.complete && photoImg.naturalWidth) {
      drawPhotoCover(ctx, photoImg, 0, 0, W, photoH);
    }

    // 信息区（腾讯蓝）
    ctx.fillStyle = "#1f3fa0";
    ctx.fillRect(0, photoH, W, infoH);

    const padX = Math.round(W * 0.061);
    const enText = enName.value || "Your Name";
    const zhText = zhName.value || "姓名";

    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#ffffff";

    // 英文名/分割线/中文名：整体上移贴近照片
    // 顶部间距 ≈ 0.75 个英文字高（与页面 padding-top 19px/26px 同步）
    const enSize = Math.round(W * 0.072);
    const zhSize = Math.round(W * 0.068);

    // 英文名（baseline = 顶部间距 0.75字高 + 字形高 0.8字高）
    const enY = photoH + Math.round(enSize * 1.55);
    ctx.font = `700 ${enSize}px "TencentW7", sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText(enText, padX, enY);

    // 下划线（与页面同步：稍细，间距同页面 margin 8px/26px）
    const lineY = enY + Math.round(enSize * 0.31);
    ctx.fillRect(padX, lineY, W - padX * 2, 3);

    // 中文名（与页面同步：线下方留出约 0.3 字高视觉间距，再加自身字形高）
    ctx.font = `${zhSize}px "TencentW7", sans-serif`;
    const zhY = lineY + Math.round(zhSize * 1.1);
    ctx.save();
    ctx.textAlign = "left";
    drawSpacedText(ctx, zhText, padX, zhY, W * 0.011);
    ctx.restore();

    // 底部品牌：官方标准 Logo（透明底白字）
    if (brandLogo && brandLogo.complete && brandLogo.naturalWidth) {
      const lw = Math.round(W * 0.36);
      const lh = Math.round(lw * brandLogo.naturalHeight / brandLogo.naturalWidth);
      const lx = Math.round((W - lw) / 2);
      const ly = photoH + infoH - lh - Math.round(infoH * 0.075);
      ctx.drawImage(brandLogo, lx, ly, lw, lh);
    }

    return canvas.toDataURL("image/png");
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // cover 基准 × 用户缩放；缩小时居中留白（object-position center 20% + 上下微调），放大时自动收边不露白
  function drawPhotoCover(ctx, img, dx, dy, dw, dh) {
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const scaleUser = photoScale.value / 100;
    const cover = Math.max(dw / iw, dh / ih);
    const s = cover * scaleUser;
    const w = iw * s;
    const h = ih * s;

    let x = dx + (dw - w) / 2;
    let y = dy + (dh - h) * 0.20 + Number(photoY.value) / 100 * dh;

    // 放大时保证对应维度铺满，不露白边
    if (w >= dw) x = Math.min(dx, Math.max(x, dx + dw - w));
    if (h >= dh) y = Math.min(dy, Math.max(y, dy + dh - h));

    ctx.save();
    ctx.beginPath();
    ctx.rect(dx, dy, dw, dh);
    ctx.clip();
    ctx.drawImage(img, x, y, w, h);
    ctx.restore();
  }

  function drawSpacedText(ctx, text, x, y, spacing) {
    let cx = x;
    for (const ch of text) {
      ctx.fillText(ch, cx, y);
      cx += ctx.measureText(ch).width + spacing;
    }
  }
})();
