(() => {
  "use strict";

  const FLAVOX_CREDIT = "•Uploder method by -@flavox.3dits";

  let corePromise = null;

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  function getCoreURL() {
    return chrome.runtime.getURL("ffmpeg/ffmpeg-core.js");
  }

  function getWasmURL() {
    return chrome.runtime.getURL("ffmpeg/ffmpeg-core.wasm");
  }

  async function loadCore(onProgress = () => {}) {
    if (corePromise) return corePromise;

    corePromise = (async () => {
      onProgress(2, "Loading FFmpeg…");

      const moduleSource = await fetch(getCoreURL()).then(r => {
        if (!r.ok) throw new Error("Unable to load ffmpeg-core.js");
        return r.text();
      });

      const blobURL = URL.createObjectURL(
        new Blob([moduleSource], { type: "text/javascript" })
      );

      try {
        const mod = await import(blobURL);

        if (!mod || typeof mod.default !== "function") {
          throw new Error("Invalid FFmpeg core module");
        }

        const Module = {
          noInitialRun: true,
          noExitRuntime: true,

          locateFile(path) {
            if (path.endsWith(".wasm")) {
              return getWasmURL();
            }
            return chrome.runtime.getURL("ffmpeg/" + path);
          },

          logger(message) {
            if (message?.message) {
              console.debug("[FLAVOX FFmpeg]", message.message);
            }
          }
        };

        const core = await mod.default(Module);

        if (!core || !core.ready) {
          throw new Error("FFmpeg core failed to initialize");
        }

        await core.ready;

        onProgress(8, "FFmpeg ready ✓");

        return core;
      } finally {
        URL.revokeObjectURL(blobURL);
      }
    })();

    try {
      return await corePromise;
    } catch (error) {
      corePromise = null;
      throw error;
    }
  }

  function getVideoInfo(file) {
    return new Promise(resolve => {
      const video = document.createElement("video");
      const url = URL.createObjectURL(file);

      video.preload = "metadata";

      video.onloadedmetadata = () => {
        const info = {
          width: video.videoWidth || 0,
          height: video.videoHeight || 0,
          duration: video.duration || 0,
          size: file.size,
          type: file.type || "video/mp4"
        };

        URL.revokeObjectURL(url);
        video.remove();

        resolve(info);
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        video.remove();

        resolve({
          width: 0,
          height: 0,
          duration: 0,
          size: file.size,
          type: file.type || "video/mp4"
        });
      };

      video.src = url;
    });
  }

  function chooseBitrate(info) {
    const pixels = info.width * info.height;

    if (pixels >= 3840 * 2160) return 24000000;
    if (pixels >= 2560 * 1440) return 16000000;
    if (pixels >= 1920 * 1080) return 10000000;
    if (pixels >= 1280 * 720) return 6000000;

    return 3500000;
  }

  function extensionFromName(name) {
    const m = name.match(/\.([a-z0-9]+)$/i);
    return m ? m[1].toLowerCase() : "mp4";
  }

  function makeInputName(file) {
    const ext = extensionFromName(file.name);

    if (["mp4", "mov", "m4v", "webm", "mkv"].includes(ext)) {
      return `input.${ext}`;
    }

    return "input.mp4";
  }

  async function writeFile(core, name, file) {
    const data = new Uint8Array(await file.arrayBuffer());

    if (!core.FS) {
      throw new Error("FFmpeg filesystem is unavailable");
    }

    core.FS.writeFile(name, data);
  }

  function readFile(core, name) {
    const data = core.FS.readFile(name);
    return new Uint8Array(data);
  }

  function removeFile(core, name) {
    try {
      core.FS.unlink(name);
    } catch (_) {}
  }

  async function compress(file, onProgress = () => {}) {
    const info = await getVideoInfo(file);

    onProgress(5, "Analysing video…", info);

    if (!info.width || !info.height) {
      throw new Error("Unable to read video dimensions");
    }

    const core = await loadCore((p, text) => {
      onProgress(p, text, info);
    });

    const inputName = makeInputName(file);
    const outputName = "flavox_output.mp4";

    try {
      onProgress(10, "Preparing video…", info);

      await writeFile(core, inputName, file);

      const bitrate = chooseBitrate(info);

      const duration = Math.max(1, info.duration);

      core.setProgress((progress) => {
        const ratio = Math.max(
          0,
          Math.min(1, Number(progress?.progress || 0))
        );

        const percent = 12 + ratio * 78;

        onProgress(
          Math.min(90, percent),
          "Compressing with FFmpeg…",
          info
        );
      });

      core.setLogger(message => {
        const text = message?.message || "";

        const match = text.match(
          /time=(\d+):(\d+):(\d+(?:\.\d+)?)/i
        );

        if (match) {
          const current =
            Number(match[1]) * 3600 +
            Number(match[2]) * 60 +
            Number(match[3]);

          const ratio = Math.max(
            0,
            Math.min(1, current / duration)
          );

          onProgress(
            12 + ratio * 78,
            "Compressing with FFmpeg…",
            info
          );
        }
      });

      onProgress(12, "Starting FFmpeg…", info);

      const result = core.exec(
        "-i",
        inputName,

        "-map",
        "0:v:0",
        "-map",
        "0:a?",

        "-c:v",
        "libx264",

        "-preset",
        "medium",

        "-b:v",
        String(bitrate),

        "-maxrate",
        String(Math.round(bitrate * 1.15)),

        "-bufsize",
        String(bitrate * 2),

        "-pix_fmt",
        "yuv420p",

        "-movflags",
        "+faststart",

        "-c:a",
        "aac",

        "-b:a",
        "192k",

        "-ar",
        "48000",

        "-ac",
        "2",

        outputName
      );

      if (result !== 0) {
        throw new Error(`FFmpeg failed with code ${result}`);
      }

      onProgress(92, "Reading compressed video…", info);

      const output = readFile(core, outputName);

      if (!output.length) {
        throw new Error("FFmpeg produced an empty file");
      }

      const compressedFile = new File(
        [output],
        file.name.replace(/\.[^.]+$/i, "") + "_FLAVOX.mp4",
        {
          type: "video/mp4",
          lastModified: Date.now()
        }
      );

      onProgress(96, "Checking output…", info);

      if (compressedFile.size >= file.size) {
        onProgress(
          100,
          "Original retained — compression would increase size",
          info
        );

        return {
          file,
          info,
          compressed: false,
          reason: "Compressed file was not smaller"
        };
      }

      const outputInfo = await getVideoInfo(compressedFile);

      if (
        outputInfo.width !== info.width ||
        outputInfo.height !== info.height
      ) {
        throw new Error("Output resolution changed");
      }

      onProgress(100, "Compression complete ✓", outputInfo);

      return {
        file: compressedFile,
        info: outputInfo,
        compressed: true,
        originalSize: file.size,
        compressedSize: compressedFile.size
      };

    } finally {
      removeFile(core, inputName);
      removeFile(core, outputName);
    }
  }

  window.FLAVOX_COMPRESSION = {
    compress,
    getVideoInfo,
    loadCore,
    FLAVOX_CREDIT
  };
})();
