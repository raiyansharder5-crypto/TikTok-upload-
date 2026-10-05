(() => {
  "use strict";

  const EXT = "FLAVOX";
  const CREDIT = "•Uploder method by -@flavox.3dits";

  let processing = false;
  let currentInput = null;

  const sleep = ms =>
    new Promise(resolve => setTimeout(resolve, ms));

  function log(...args) {
    console.log(`[${EXT}]`, ...args);
  }

  function isTikTokStudio() {
    return location.hostname.includes("tiktok.com");
  }

  function findVideoInput() {
    const inputs = [...document.querySelectorAll(
      'input[type="file"]'
    )];

    return inputs.find(input => {
      const accept = (input.getAttribute("accept") || "").toLowerCase();

      return (
        accept.includes("video") ||
        accept.includes(".mp4") ||
        accept.includes(".mov") ||
        accept.includes("video/*")
      );
    }) || inputs[0] || null;
  }

  function dispatchInputEvents(input) {
    input.dispatchEvent(
      new Event("input", {
        bubbles: true,
        composed: true
      })
    );

    input.dispatchEvent(
      new Event("change", {
        bubbles: true,
        composed: true
      })
    );
  }

  function setFileToInput(input, file) {
    const transfer = new DataTransfer();

    transfer.items.add(file);

    input.files = transfer.files;

    dispatchInputEvents(input);
  }

  function createProcessingUI(input) {
    removeProcessingUI();

    const parent =
      input.closest("div") ||
      input.parentElement ||
      document.body;

    const box = document.createElement("div");

    box.id = "flavox-processing-ui";

    box.innerHTML = `
      <div class="flavox-processing-inner">
        <div class="flavox-processing-logo">
          FLAVOX
        </div>

        <div class="flavox-processing-title">
          FLAVOX UPLOADER
        </div>

        <div class="flavox-processing-status">
          Preparing video…
        </div>

        <div class="flavox-progress">
          <div class="flavox-progress-bar"></div>
        </div>

        <div class="flavox-progress-text">
          0%
        </div>
      </div>
    `;

    Object.assign(box.style, {
      position: "absolute",
      inset: "0",
      zIndex: "999999",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0,0,0,.88)",
      borderRadius: "18px",
      pointerEvents: "none"
    });

    if (getComputedStyle(parent).position === "static") {
      parent.style.position = "relative";
    }

    parent.appendChild(box);

    return box;
  }

  function updateProcessingUI(box, progress, text) {
    if (!box) return;

    const bar = box.querySelector(
      ".flavox-progress-bar"
    );

    const percent = box.querySelector(
      ".flavox-progress-text"
    );

    const status = box.querySelector(
      ".flavox-processing-status"
    );

    if (bar) {
      bar.style.width = `${Math.max(
        0,
        Math.min(100, progress)
      )}%`;
    }

    if (percent) {
      percent.textContent =
        `${Math.round(progress)}%`;
    }

    if (status && text) {
      status.textContent = text;
    }
  }

  function removeProcessingUI() {
    document
      .querySelector("#flavox-processing-ui")
      ?.remove();
  }

  function showDynamicIsland() {
    document
      .querySelector("#flavox-dynamic-island")
      ?.remove();

    const island = document.createElement("div");

    island.id = "flavox-dynamic-island";

    island.innerHTML = `
      <div class="flavox-island-logo">
        FLAVOX
      </div>
      <div class="flavox-island-name">
        FLAVOX UPLOADER
      </div>
    `;

    Object.assign(island.style, {
      position: "fixed",
      top: "14px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: "2147483647",
      display: "flex",
      alignItems: "center",
      gap: "9px",
      padding: "9px 16px",
      borderRadius: "999px",
      background: "#050505",
      color: "#fff",
      boxShadow: "0 8px 35px rgba(0,0,0,.4)",
      fontFamily: "Arial,sans-serif",
      fontSize: "12px",
      fontWeight: "700"
    });

    document.body.appendChild(island);

    setTimeout(() => {
      island.remove();
    }, 5000);
  }

  async function processSelectedFile(input, file) {
    if (processing) return;

    processing = true;

    const box = createProcessingUI(input);

    try {
      const result =
        await window.FLAVOX_COMPRESSION.compress(
          file,
          (progress, text) => {
            updateProcessingUI(
              box,
              progress,
              text
            );
          }
        );

      if (!result?.file) {
        throw new Error(
          "Compression did not return a file"
        );
      }

      const finalFile = result.file;

      log(
        "Original:",
        file.size,
        "Compressed:",
        finalFile.size
      );

      setFileToInput(
        input,
        finalFile
      );

      updateProcessingUI(
        box,
        100,
        result.compressed
          ? "Ready for TikTok ✓"
          : "Original quality preserved ✓"
      );

      await sleep(700);

      removeProcessingUI();

      log("Compressed video placed into TikTok input.");

    } catch (error) {
      console.error(
        "[FLAVOX] Compression failed:",
        error
      );

      updateProcessingUI(
        box,
        100,
        "Compression failed — original preserved"
      );

      /*
       * Important:
       * Never replace the original file with a broken output.
       */
      try {
        setFileToInput(input, file);
      } catch (_) {}

      await sleep(1000);

      removeProcessingUI();

    } finally {
      processing = false;
    }
  }

  function attachInput(input) {
    if (!input || input.dataset.flavoxAttached) {
      return;
    }

    input.dataset.flavoxAttached = "1";
    currentInput = input;

    input.addEventListener(
      "change",
      async () => {
        const file = input.files?.[0];

        if (!file) return;

        if (!file.type.startsWith("video/")) {
          return;
        }

        log(
          "Video selected:",
          file.name,
          file.size
        );

        await processSelectedFile(
          input,
          file
        );
      },
      true
    );
  }

  function scanInputs() {
    const input = findVideoInput();

    if (input) {
      attachInput(input);
    }
  }

  function addObserver() {
    const observer =
      new MutationObserver(() => {
        scanInputs();
      });

    observer.observe(
      document.documentElement,
      {
        childList: true,
        subtree: true
      }
    );
  }

  function init() {
    if (!isTikTokStudio()) return;

    showDynamicIsland();

    scanInputs();
    addObserver();

    log(
      "FLAVOX uploader initialized."
    );
  }

  /*
   * compression.js must be loaded before content.js
   * exposes FLAVOX_COMPRESSION.
   */
  function waitForCompression() {
    if (window.FLAVOX_COMPRESSION) {
      init();
      return;
    }

    setTimeout(
      waitForCompression,
      100
    );
  }

  waitForCompression();
})();
