(() => {
  "use strict";

  const scriptUrl = document.currentScript?.src;
  if (!scriptUrl) return;

  const baseUrl = new URL("./", scriptUrl);
  const urls = {
    main: new URL("index.html", baseUrl).href,
    map: new URL("d-building-map.html", baseUrl).href,
    b: new URL("b-letter-flow/index.html", baseUrl).href,
    g: new URL("g-statue-anamorphosis/index.html", baseUrl).href,
    final: new URL("d-final-sorting/index.html", baseUrl).href
  };
  const path = decodeURIComponent(location.pathname).replaceAll("\\", "/");
  const page = path.includes("/b-letter-flow/") ? "b"
    : path.includes("/g-statue-anamorphosis/") ? "g"
      : path.includes("/d-final-sorting/") ? "final"
        : path.endsWith("/d-building-map.html") ? "map"
          : "story";
  const K = "d-case-";
  const fixedKeys = [
    "d-building-investigation-v1",
    "d-building-investigation-complete",
    "b-center-ar-success",
    "g-object-ar-success",
    "d-final-sorting-success"
  ];
  const mapAnswers = {
    "w-ring": "stolen",
    "stone-art": "stolen",
    "running-person": "safe",
    "three-kirie-panels": "safe",
    "indoor-tree": "safe"
  };

  function put(key, value = "true") {
    try { localStorage.setItem(key, value); } catch (error) { console.warn("デバッグ進捗を保存できませんでした", error); }
  }

  function remove(key) {
    try { localStorage.removeItem(key); } catch (error) { console.warn("デバッグ進捗を削除できませんでした", error); }
  }

  function yes(key) {
    try { return localStorage.getItem(key) === "true"; } catch { return false; }
  }

  function ensureIntroDone() {
    put(K + "intro-done");
    put(K + "intro-stage", "terminal-home");
    put(K + "intro-index", "0");
  }

  function setMapComplete() {
    ensureIntroDone();
    put("d-building-investigation-v1", JSON.stringify(mapAnswers));
    put("d-building-investigation-complete");
  }

  function ensureRecoveryMenu() {
    setMapComplete();
    put(K + "map-reported");
    put(K + "post-letters-report-done");
    put(K + "read-w");
    put(K + "read-g");
    put(K + "post-letters-continue");
    put(K + "post-recovery-brief-done");
  }

  function removeFinalProgress() {
    remove("d-final-sorting-success");
    remove(K + "post-final");
    remove(K + "post-ending");
    remove(K + "post-ending-done");
    remove(K + "post-final-interruption-shown");
  }

  function resetAll() {
    fixedKeys.forEach(remove);
    const caseKeys = [];
    try {
      for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (key?.startsWith(K)) caseKeys.push(key);
      }
    } catch (error) {
      console.warn("デバッグ進捗を列挙できませんでした", error);
    }
    caseKeys.forEach(remove);
  }

  function go(url) {
    location.href = url;
  }

  function skipIntro() {
    resetAll();
    ensureIntroDone();
    go(urls.map);
  }

  function completeMap() {
    ensureIntroDone();
    [
      "b-center-ar-success", "g-object-ar-success", "d-final-sorting-success",
      K + "map-reported", K + "read-w", K + "read-g", K + "reported-b", K + "reported-g",
      K + "first-recovery", K + "post-letters-report-done", K + "post-letters-continue",
      K + "post-recovery-brief-done", K + "post-report-b", K + "post-report-g",
      K + "post-final", K + "post-ending", K + "post-ending-done"
    ].forEach(remove);
    ["b", "g"].forEach(which => {
      remove(K + `post-report-${which}-answered`);
      remove(K + `post-report-${which}-missed`);
    });
    remove(K + "post-final-interruption-shown");
    setMapComplete();
    go(urls.main);
  }

  function completeRecovery(which) {
    ensureRecoveryMenu();
    removeFinalProgress();
    const successKey = which === "b" ? "b-center-ar-success" : "g-object-ar-success";
    put(successKey);
    if (!yes("b-center-ar-success") || !yes("g-object-ar-success")) put(K + "first-recovery", which);
    remove(K + `reported-${which}`);
    remove(K + `post-report-${which}`);
    remove(K + `post-report-${which}-answered`);
    remove(K + `post-report-${which}-missed`);
    go(urls.main);
  }

  function completeBothRecoveries() {
    ensureRecoveryMenu();
    removeFinalProgress();
    put("b-center-ar-success");
    put("g-object-ar-success");
    put(K + "first-recovery", "b");
    [K + "reported-b", K + "reported-g", K + "post-report-b", K + "post-report-g"].forEach(remove);
    ["b", "g"].forEach(which => {
      remove(K + `post-report-${which}-answered`);
      remove(K + `post-report-${which}-missed`);
    });
    go(urls.main);
  }

  function completeFinal() {
    ensureRecoveryMenu();
    put("b-center-ar-success");
    put("g-object-ar-success");
    put(K + "reported-b");
    put(K + "reported-g");
    put("d-final-sorting-success");
    remove(K + "post-ending");
    remove(K + "post-ending-done");
    go(urls.main);
  }

  const actions = {
    intro: skipIntro,
    map: completeMap,
    b: () => completeRecovery("b"),
    g: () => completeRecovery("g"),
    both: completeBothRecoveries,
    final: completeFinal,
    reset: () => {
      if (!window.confirm("デバッグ用を含む、このゲームの進捗をすべて消しますか？")) return;
      resetAll();
      go(urls.main);
    },
    main: () => go(urls.main),
    "view-map": () => go(urls.map),
    "view-b": () => go(urls.b),
    "view-g": () => go(urls.g),
    "view-final": () => go(urls.final)
  };

  const labels = {
    map: "今のD館調査をクリアして戻る",
    b: "今のB館ゲームをクリアして戻る",
    g: "今のG館ゲームをクリアして戻る",
    final: "今の最終ゲームをクリアして戻る"
  };
  const currentAction = labels[page] ? `<button type="button" class="ar-debug__primary" data-debug-action="${page}">${labels[page]}</button>` : "";
  // A temporary display preference, separate from saved game progress.
  const mapDisplay = window.DMapDisplay;
  const mapBlueKey = "ar-debug-d-map-blue-level-v1";
  if (mapDisplay) {
    let savedLevel = 1;
    try { savedLevel = Number(sessionStorage.getItem(mapBlueKey)); } catch { /* Default works without storage. */ }
    mapDisplay.setLevel(savedLevel);
  }
  const mapDisplayControl = mapDisplay ? `
      <div class="ar-debug__display ar-debug__actions">
        <strong>D館の表示</strong>
        <p id="arDebugMapBlueHint">地図・3D・端末ホーム共通。採用色は1です。</p>
        <button type="button" data-debug-map-blue aria-describedby="arDebugMapBlueHint"></button>
      </div>` : "";

  const style = document.createElement("style");
  style.textContent = `
    .ar-debug { all: initial; position: fixed; top: max(12px, env(safe-area-inset-top)); right: max(12px, env(safe-area-inset-right)); z-index: 2147483647; color: #f7f2df; font: 13px/1.4 system-ui, -apple-system, "Segoe UI", sans-serif; }
    .ar-debug, .ar-debug * { box-sizing: border-box; }
    .ar-debug [hidden] { display: none !important; }
    .ar-debug button { all: unset; box-sizing: border-box; min-height: 44px; cursor: pointer; font: inherit; touch-action: manipulation; }
    .ar-debug .ar-debug__toggle { display: block; margin-left: auto; padding: 9px 12px; border: 1px solid #d7b45d !important; border-radius: 7px; background: #102b25 !important; color: #ffe3a0 !important; font-weight: 800 !important; letter-spacing: .08em; box-shadow: 0 4px 18px #0008; }
    .ar-debug .ar-debug__toggle:hover, .ar-debug .ar-debug__toggle:focus-visible { background: #1c4439 !important; outline: 2px solid #ffe3a0 !important; outline-offset: 2px; }
    .ar-debug__panel { width: min(300px, calc(100vw - 24px - env(safe-area-inset-left) - env(safe-area-inset-right))); max-height: calc(100vh - 80px); max-height: calc(100dvh - 80px - env(safe-area-inset-top) - env(safe-area-inset-bottom)); margin-top: 8px; padding: 14px; overflow: auto; overscroll-behavior: contain; -webkit-overflow-scrolling: touch; border: 1px solid #b89442; border-radius: 10px; background: #081713f2; box-shadow: 0 12px 34px #000a; backdrop-filter: blur(10px); }
    .ar-debug__panel strong { display: block; color: #ffe3a0; font-size: 14px; }
    .ar-debug__panel p { margin: 4px 0 12px; color: #c7d7d1; font-size: 11px; }
    .ar-debug__actions { display: grid; gap: 7px; }
    .ar-debug__actions button { display: block; width: 100%; padding: 9px 10px; border: 1px solid #45675e !important; border-radius: 7px; background: #14352d !important; color: #f8f3e5 !important; text-align: left; }
    .ar-debug__actions button:hover, .ar-debug__actions button:focus-visible { border-color: #edc96e !important; background: #205044 !important; outline: none !important; }
    .ar-debug__actions .ar-debug__primary { border-color: #e0b84f !important; background: #72561c !important; color: #fff3c8 !important; font-weight: 800 !important; }
    .ar-debug__actions .ar-debug__danger { margin-top: 5px; border-color: #8b4d4d !important; background: #3a1d1d !important; color: #ffd6d6 !important; }
    .ar-debug__display { margin-bottom: 14px; padding-bottom: 14px; border-bottom: 1px solid #45675e; }
    .ar-debug__display p { margin-bottom: 0; }
    .ar-debug__return { position: sticky; top: -14px; z-index: 1; margin: -14px -14px 12px; padding: 12px 14px; background: #081713; border-bottom: 1px solid #45675e; }
  `;
  document.head.append(style);

  const tools = document.createElement("aside");
  tools.className = "ar-debug";
  tools.setAttribute("aria-label", "デバッグメニュー");
  tools.innerHTML = `
    <button type="button" class="ar-debug__toggle" aria-expanded="false" aria-controls="arDebugPanel" aria-label="デバッグメニューを開く">DEBUG</button>
    <section class="ar-debug__panel" id="arDebugPanel" aria-label="確認する画面と進捗" hidden>
      <div class="ar-debug__actions ar-debug__return"><button type="button" data-debug-close>ゲームに戻る（閉じる）</button></div>
      <strong>デバッグ</strong>
      <p>制作確認用です。「ゲームに戻る」はメニューだけを閉じます。制限時間はメニュー表示中も進みます。</p>
      <div class="ar-debug__display ar-debug__actions">
        <strong>画面を開く</strong>
        <p>進捗を変えずに移動します。</p>
        <button type="button" data-debug-action="view-map">D館の調査画面</button>
        <button type="button" data-debug-action="view-b">B館のゲーム画面</button>
        <button type="button" data-debug-action="view-g">G館のゲーム画面</button>
        <button type="button" data-debug-action="view-final">最終ゲームの画面</button>
        <button type="button" data-debug-action="main">本編画面へ戻る</button>
      </div>
      ${mapDisplayControl}
      <div class="ar-debug__actions">
        <strong>進捗を変更する</strong>
        <p>このブラウザーの保存データを変更します。</p>
        ${currentAction}
        <button type="button" data-debug-action="intro">導入を省略してD館調査へ</button>
        <button type="button" data-debug-action="map">D館調査をクリアして本編へ</button>
        <button type="button" data-debug-action="b">B館ゲームをクリアして本編へ</button>
        <button type="button" data-debug-action="g">G館ゲームをクリアして本編へ</button>
        <button type="button" data-debug-action="both">B館・G館を両方クリア</button>
        <button type="button" data-debug-action="final">最終ゲームをクリアして結末へ</button>
        <button type="button" class="ar-debug__danger" data-debug-action="reset">全進捗をリセット</button>
      </div>
    </section>
  `;
  document.body.append(tools);

  const toggle = tools.querySelector(".ar-debug__toggle");
  const panel = tools.querySelector(".ar-debug__panel");
  const mapBlueButton = tools.querySelector("[data-debug-map-blue]");
  function syncMapBlueButton() {
    if (!mapBlueButton) return;
    const level = mapDisplay.getLevel();
    mapBlueButton.textContent = `青の濃さ ${level}/5　↻`;
    mapBlueButton.setAttribute("aria-label", `青の濃さ ${level}/5。押すと次の濃さへ`);
  }
  syncMapBlueButton();
  mapBlueButton?.addEventListener("click", () => {
    const level = mapDisplay.setLevel(mapDisplay.getLevel() % 5 + 1);
    try {
      if (level === 1) sessionStorage.removeItem(mapBlueKey);
      else sessionStorage.setItem(mapBlueKey, String(level));
    } catch { /* Keep the current display even if storage is unavailable. */ }
    syncMapBlueButton();
  });
  function togglePanel(force) {
    const open = typeof force === "boolean" ? force : panel.hidden;
    panel.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", `デバッグメニューを${open ? "閉じる" : "開く"}`);
    toggle.textContent = open ? "閉じる ×" : "DEBUG";
    if (open) {
      panel.scrollTop = 0;
      panel.querySelector("[data-debug-close]")?.focus({ preventScroll: true });
    } else toggle.focus({ preventScroll: true });
  }

  toggle.addEventListener("click", () => togglePanel());
  tools.querySelector("[data-debug-close]").addEventListener("click", () => togglePanel(false));
  tools.addEventListener("click", event => {
    const action = event.target.closest("[data-debug-action]")?.dataset.debugAction;
    if (action) actions[action]?.();
  });
  document.addEventListener("keydown", event => {
    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "d") {
      event.preventDefault();
      togglePanel();
    } else if (event.key === "Escape" && !panel.hidden) {
      togglePanel(false);
      toggle.focus();
    }
  });
})();
