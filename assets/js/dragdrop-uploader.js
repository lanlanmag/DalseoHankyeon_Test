(function () {
  'use strict';

  function preventDefaults(e) { e.preventDefault(); e.stopPropagation(); }
  function isImageFile(file) { return /^image\//.test(file.type || ""); }

  function attach(canvas, unityInstance, opts = {}) {
    const maxSize = opts.maxSize || 2048; // 리사이즈 상한
    const targetObject = opts.targetObject || "PhotoUpload";
    const targetMethod  = opts.targetMethod  || "OnImageDropped";
    const jpegQuality = ('jpegQuality' in opts) ? opts.jpegQuality : 0.85;

    ["dragenter", "dragover", "dragleave", "drop"].forEach((ev) => {
      canvas.addEventListener(ev, preventDefaults, false);
    });

    canvas.addEventListener("drop", async (e) => {
      const files = Array.from(e.dataTransfer.files || []);
      const imageFiles = files.filter(isImageFile);

      for (const file of imageFiles) {
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = async () => {
            let w = img.width, h = img.height;
            if (w > maxSize || h > maxSize) {
              const r = Math.min(maxSize / w, maxSize / h);
              w = Math.round(w * r); h = Math.round(h * r);
            }
            const c = document.createElement("canvas");
            c.width = w; c.height = h;
            const ctx = c.getContext("2d");
            ctx.drawImage(img, 0, 0, w, h);

            // 무조건 JPG로
            const mime = "image/jpeg";
            const dataUrl = c.toDataURL(mime, jpegQuality);

            unityInstance.SendMessage(
              targetObject,
              targetMethod,
              JSON.stringify({
                name: file.name.replace(/\.[^.]+$/, "") + ".jpg",
                type: mime,
                size: file.size,               // 주의: 원본 크기
                lastModified: file.lastModified,
                dataUrl
              })
            );
          };
          img.src = reader.result;
        };
        reader.readAsDataURL(file);
      }
    }, false);

    console.log('[DragDropUploader] attached');
  }

  window.DragDropUploader = { attach };
})();
