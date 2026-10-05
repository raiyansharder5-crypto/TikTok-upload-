# FLAVOX Smart Quality Workflow

1. Select a video in TikTok Studio.
2. Analyze source resolution, duration and file size.
3. Try a real browser-side high-quality transcode when supported.
4. Preserve the original resolution.
5. Check the output.
6. If safe compression is unavailable or the result is not smaller/valid, keep the original file instead of producing a broken fake file.
7. Continue the TikTok Studio upload flow.
8. Add `•Uploder method by -@flavox.3dits` to the description when the publish form appears.

Important: browser-side WebCodecs support varies by browser and video codec. This extension never reports a successful compressed file when encoding was not actually successful. TikTok may still perform its own server-side processing after upload.
