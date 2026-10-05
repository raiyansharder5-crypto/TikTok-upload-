# FLAVOX Uploader — Chrome/Edge Extension

## Install
1. Extract this ZIP.
2. Open `chrome://extensions` (or Edge `edge://extensions`).
3. Enable **Developer mode**.
4. Choose **Load unpacked**.
5. Select this extension folder.

## What it does
- Golden FLAVOX UI with compact logo.
- Selects a local video and reads resolution, duration and file size.
- Lets you choose target guidance: Original / 4K / 1440P / 1080P and Original / 60 FPS / 30 FPS.
- Opens TikTok Studio upload directly.
- Copies the recommended settings.

## Important
A browser extension cannot force TikTok's server-side encoder to keep a particular bitrate or disable compression. For the best quality, upload the highest-quality original file and use TikTok's own high-quality upload options when available.

## New Dynamic Island UI
When TikTok Studio opens, FLAVOX displays a compact Apple Dynamic-Island-style notification at the top with the supplied FLAVOX logo and the name **FLAVOX UPLOADER**. It auto-hides after a few seconds and can be closed manually.


### Latest update
- Fixed Dynamic Island logo by embedding the FLAVOX logo directly.
- Selecting a video now changes the Select Video area into a size-aware processing/analyzing view with preview, progress and detected metadata.
- Processing is client-side analysis/preparation UI; TikTok's final server-side encoding remains controlled by TikTok.


### Upload-area processing update
The processing UI is now shown **inside TikTok Studio's actual "Select video to upload" area**. The extension watches TikTok's real video file input and, after a video is selected, replaces that upload box visually with a FLAVOX processing/progress interface based on the selected file size.


### Final processing flow
1. User selects a video in TikTok Studio.
2. FLAVOX shows an Apple Dynamic-Island-style popup with the supplied logo and live processing status.
3. The processing overlay appears inside TikTok Studio's upload area.
4. Processing duration is based on the selected file size.
5. When it reaches 100%, FLAVOX removes only its overlay and leaves TikTok's original file input and selected File intact, allowing TikTok Studio to continue the normal upload flow.


### Dynamic Island behavior
The popup now contains only the FLAVOX logo and **FLAVOX UPLOADER**. It appears when TikTok Studio opens, stays for exactly about 5 seconds, then disappears automatically. No “Rendering”, “Processing”, “Analyzing”, FPS, progress, or other status text is shown in the popup.


### Next-step behavior
After the FLAVOX visual processing reaches 100%, it does not create or fake another upload page. The overlay is removed, and FLAVOX looks for TikTok Studio's real visible **Next / Continue** control and clicks it so TikTok Studio moves to its next step.


### First UI options
- **High Quality Upload** ON/OFF toggle.
- **Watermark** ON/OFF toggle.
- Top-right TikTok button opens **@flavox.3dits**.
- Profile card also has an OPEN button for **@flavox.3dits**.
- Toggle settings are saved with Chrome extension storage.


### Automatic publish description credit
When the TikTok Studio publish/post form appears, FLAVOX detects the description/caption field and automatically appends:
`•Uploder method by -@flavox.3dits`
It will not add the credit twice if it is already present.
