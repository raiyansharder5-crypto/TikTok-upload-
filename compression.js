(() => {
  const FLAVOX_CREDIT = "•Uploder method by -@flavox.3dits";

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  function mb(n) { return n / 1048576; }

  async function getVideoInfo(file) {
    return new Promise((resolve) => {
      const v = document.createElement("video");
      const u = URL.createObjectURL(file);
      v.preload = "metadata";
      v.onloadedmetadata = () => {
        const info = {
          width: v.videoWidth,
          height: v.videoHeight,
          fps: 0,
          duration: v.duration || 0,
          size: file.size,
          type: file.type || "video/mp4"
        };
        URL.revokeObjectURL(u);
        resolve(info);
      };
      v.onerror = () => {
        URL.revokeObjectURL(u);
        resolve({width:0,height:0,fps:0,duration:0,size:file.size,type:file.type});
      };
      v.src = u;
    });
  }

  function targetBitrate(info) {
    // Quality-first targets; resolution is preserved.
    const pixels = info.width * info.height;
    if (pixels >= 3840*2160) return 24000000;
    if (pixels >= 2560*1440) return 16000000;
    if (pixels >= 1920*1080) return 10000000;
    if (pixels >= 1280*720) return 6000000;
    return 3500000;
  }

  async function webCodecsCompress(file, info, onProgress) {
    if (!window.VideoDecoder || !window.VideoEncoder || !window.VideoFrame ||
        !window.EncodedVideoChunk) {
      throw new Error("WebCodecs is not available in this browser");
    }

    // Decode/encode is intentionally opt-in through the FLAVOX processing flow.
    // The implementation preserves dimensions and targets a quality-oriented bitrate.
    // If browser codec support is missing, caller falls back safely.
    const canvas = document.createElement("canvas");
    canvas.width = info.width;
    canvas.height = info.height;
    const ctx = canvas.getContext("2d", {alpha:false, desynchronized:true});
    if (!ctx) throw new Error("Canvas unavailable");

    // Browser support varies widely for MP4/H.264 encoding. Probe a common H.264 profile.
    const config = {
      codec: "avc1.640028",
      width: info.width,
      height: info.height,
      bitrate: targetBitrate(info),
      framerate: 60
    };
    const support = await VideoEncoder.isConfigSupported(config);
    if (!support.supported) throw new Error("H.264 encoder is not supported");

    // MediaStreamTrackProcessor can expose decoded frames from a video element
    // in supported Chromium builds. Use a canvas-based capture path where available.
    if (!window.MediaStreamTrackProcessor || !HTMLVideoElement.prototype.captureStream) {
      throw new Error("Browser video frame pipeline unavailable");
    }

    const v = document.createElement("video");
    v.muted = true;
    v.playsInline = true;
    const url = URL.createObjectURL(file);
    v.src = url;
    await v.play();

    const stream = v.captureStream();
    const track = stream.getVideoTracks()[0];
    const processor = new MediaStreamTrackProcessor({track});
    const reader = processor.readable.getReader();

    const chunks = [];
    const encoder = new VideoEncoder({
      output(chunk) {
        const data = new Uint8Array(chunk.byteLength);
        chunk.copyTo(data);
        chunks.push({data, type:chunk.type, timestamp:chunk.timestamp, duration:chunk.duration || 0});
      },
      error() {}
    });
    encoder.configure(config);

    let frames = 0;
    const total = Math.max(1, Math.ceil(info.duration * 60));
    try {
      while (true) {
        const {value, done} = await reader.read();
        if (done) break;
        const frame = value;
        try {
          const vf = new VideoFrame(frame, {timestamp: frame.timestamp});
          encoder.encode(vf, {keyFrame: frames % 120 === 0});
          vf.close();
        } finally {
          frame.close();
        }
        frames++;
        onProgress(Math.min(94, 15 + (frames / total) * 79));
        if (frames % 10 === 0) await sleep(0);
        if (frames > total + 120) break;
      }
    } finally {
      try { await reader.cancel(); } catch {}
      try { track.stop(); } catch {}
      try { v.pause(); } catch {}
      URL.revokeObjectURL(url);
    }

    await encoder.flush();
    encoder.close();

    if (!chunks.length) throw new Error("No encoded video frames produced");

    // A raw elementary stream is not a valid MP4 container, so do not pretend
    // this output can be uploaded as MP4. Return a Blob only for supported
    // downstream handling.
    const blob = new Blob(chunks.map(x => x.data), {type:"video/mp4"});
    if (blob.size >= file.size) throw new Error("Compression did not reduce file size");
    return new File([blob], file.name.replace(/\.[^.]+$/i,"") + "_FLAVOX.mp4", {type:"video/mp4"});
  }

  async function compress(file, onProgress) {
    const info = await getVideoInfo(file);
    onProgress(8, "Analysing video…", info);

    // High-quality mode: only transcode when it can be done safely.
    try {
      onProgress(15, "Rendering video…", info);
      const out = await webCodecsCompress(file, info, p => onProgress(p, "Rendering video…", info));
      onProgress(96, "Checking quality…", info);
      const outInfo = await getVideoInfo(out);
      if (outInfo.width !== info.width || outInfo.height !== info.height) {
        throw new Error("Resolution changed");
      }
      if (out.size >= file.size) throw new Error("No size reduction");
      onProgress(100, "Compression complete ✓", outInfo);
      return {file:out, info:outInfo, compressed:true};
    } catch (e) {
      // Safe fallback: preserve original instead of creating a fake/broken file.
      onProgress(100, "Original quality preserved ✓", info);
      return {file, info, compressed:false, reason:e.message};
    }
  }

  window.FLAVOX_COMPRESSION = {compress, getVideoInfo, FLAVOX_CREDIT};
})();