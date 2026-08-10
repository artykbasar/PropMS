#!/usr/bin/env node

const { chromium, firefox, webkit } = require("playwright");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const DEFAULTS = {
  baseUrl: "http://127.0.0.1:8000",
  propertySlug: "99a-burlington-road",
  browsers: ["chromium", "firefox", "webkit"],
  renderer: "web-flow-vector",
  actions: ["download", "print"],
  languages: ["en"],
  outputDir: "/tmp/propms_pdf_matrix",
  timeoutMs: 180000,
  viewportWidth: 1600,
  viewportHeight: 1200,
  caseId: "",
  resume: false,
  keepOutput: false,
  failSnapshotEndpointStatus: 0
};
const SYSTEM_CHROMIUM_PATH = process.env.PROPMS_CHROMIUM_PATH || "/usr/bin/chromium-headless-shell";

function parseArgs(argv) {
  const options = Object.assign({}, DEFAULTS);
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const nextValue = argv[index + 1];
    if (token === "--base-url" && nextValue) {
      options.baseUrl = nextValue;
      index += 1;
    } else if (token === "--property-slug" && nextValue) {
      options.propertySlug = nextValue;
      index += 1;
    } else if (token === "--browsers" && nextValue) {
      options.browsers = nextValue.split(",").map((value) => value.trim()).filter(Boolean);
      index += 1;
    } else if (token === "--actions" && nextValue) {
      options.actions = nextValue.split(",").map((value) => value.trim()).filter(Boolean);
      index += 1;
    } else if (token === "--languages" && nextValue) {
      options.languages = nextValue.split(",").map((value) => value.trim()).filter(Boolean);
      index += 1;
    } else if (token === "--output-dir" && nextValue) {
      options.outputDir = nextValue;
      index += 1;
    } else if (token === "--timeout-ms" && nextValue) {
      options.timeoutMs = Number(nextValue) || DEFAULTS.timeoutMs;
      index += 1;
    } else if (token === "--viewport-width" && nextValue) {
      options.viewportWidth = Number(nextValue) || DEFAULTS.viewportWidth;
      index += 1;
    } else if (token === "--viewport-height" && nextValue) {
      options.viewportHeight = Number(nextValue) || DEFAULTS.viewportHeight;
      index += 1;
    } else if (token === "--case-id" && nextValue) {
      options.caseId = nextValue.trim();
      index += 1;
    } else if (token === "--resume") {
      options.resume = true;
    } else if (token === "--keep-output") {
      options.keepOutput = true;
    } else if (token === "--fail-snapshot-endpoint-status" && nextValue) {
      options.failSnapshotEndpointStatus = Number(nextValue) || 0;
      index += 1;
    }
  }
  return options;
}

function ensureCleanDir(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
  fs.mkdirSync(dirPath, { recursive: true });
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function atomicWriteJson(filePath, payload) {
  ensureDir(path.dirname(filePath));
  const tempPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(tempPath, JSON.stringify(payload, null, 2));
  fs.renameSync(tempPath, filePath);
}

function sha256(filePath) {
  const digest = crypto.createHash("sha256");
  digest.update(fs.readFileSync(filePath));
  return digest.digest("hex");
}

function collectMapRequestDiagnostics(requests) {
  const openStreetMapMatches = requests.filter((requestUrl) => /tile\.openstreetmap\.org/i.test(requestUrl));
  const googleStaticMapMatches = requests.filter((requestUrl) => /maps\.googleapis\.com\/maps\/api\/staticmap/i.test(requestUrl));
  return {
    totalRequestCount: requests.length,
    openStreetMapRequestCount: openStreetMapMatches.length,
    googleStaticMapRequestCount: googleStaticMapMatches.length,
    openStreetMapRequests: openStreetMapMatches,
    googleStaticMapRequests: googleStaticMapMatches
  };
}

function getBrowserType(name) {
  if (name === "chromium") {
    return chromium;
  }
  if (name === "firefox") {
    return firefox;
  }
  if (name === "webkit") {
    return webkit;
  }
  throw new Error(`Unsupported browser: ${name}`);
}

function getLaunchOptions(name) {
  if (name === "chromium" && fs.existsSync(SYSTEM_CHROMIUM_PATH)) {
    return {
      headless: true,
      executablePath: SYSTEM_CHROMIUM_PATH
    };
  }
  return { headless: true };
}

function sanitizeCaseToken(value) {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function buildCaseId(propertySlug, browserName, renderer, action, language) {
  return [
    sanitizeCaseToken(propertySlug),
    sanitizeCaseToken(browserName),
    sanitizeCaseToken(renderer),
    sanitizeCaseToken(action),
    sanitizeCaseToken(language)
  ].join("__");
}

function buildGuideUrl(baseUrl, propertySlug, language) {
  const guideUrl = new URL(`/instructions/${propertySlug}`, baseUrl);
  if (language && language !== "en") {
    guideUrl.searchParams.set("lang", language);
  }
  return guideUrl.toString();
}

async function snapshotState(page) {
  return page.evaluate(() => ({
    lifecycle: window.__propertyInstructionPdfLifecycle || null,
    generationDiagnostics: window.__propertyInstructionPdfGenerationDiagnostics || null,
    interactionDiagnostics: window.__propertyInstructionPdfInteractionDiagnostics || null,
    printDiagnostics: window.__propertyInstructionTabPrintDiagnostics || null,
    lastError: window.__propertyInstructionLastPdfError || null,
    lastDiagnostics: window.__propertyInstructionLastPdfDiagnostics || null,
    renderer: window.__propertyInstructionPdfRenderer || null,
    feedbackKind: document.querySelector("[data-guide-pdf-feedback]")?.getAttribute("data-feedback-kind") || null,
    feedbackMessage: document.querySelector("[data-guide-pdf-feedback-message]")?.textContent?.trim() || "",
    readyDialogOpen: (() => {
      const dialog = document.querySelector("[data-guide-print-ready-dialog]");
      return !!dialog && !dialog.hasAttribute("hidden") && (dialog.open || dialog.hasAttribute("open"));
    })(),
    buttons: Array.from(document.querySelectorAll(".pi-pdf-download, .property-instruction-print")).map((button) => ({
      text: button.textContent.trim(),
      disabled: !!button.disabled
    })),
    versionNumber: window._version_number || "",
    exportScriptUrl: document.querySelector('script[src*="property_instruction_export.js"]')?.src || ""
  }));
}

async function setLanguage(page, language) {
  if (!language || language === "en") {
    return;
  }
  await page.waitForFunction((requestedLanguage) => {
    const customSelect = document.querySelector("[data-guide-language-select]");
    const widgetSelect = document.querySelector(".goog-te-combo");
    const hasOption = (selectNode) => {
      if (!selectNode || !selectNode.options) {
        return false;
      }
      return Array.from(selectNode.options).some((optionNode) => {
        return String(optionNode.value || "").trim().toLowerCase() === requestedLanguage;
      });
    };
    return hasOption(customSelect) || hasOption(widgetSelect);
  }, language, { timeout: 45000 });
  await page.evaluate((requestedLanguage) => {
    const widgetSelect = document.querySelector(".goog-te-combo");
    const customSelect = document.querySelector("[data-guide-language-select]");
    const eventOptions = { bubbles: true };
    if (widgetSelect) {
      widgetSelect.value = requestedLanguage;
      widgetSelect.dispatchEvent(new Event("change", eventOptions));
      widgetSelect.dispatchEvent(new Event("input", eventOptions));
      return;
    }
    if (customSelect) {
      customSelect.value = requestedLanguage;
      customSelect.dispatchEvent(new Event("change", eventOptions));
      customSelect.dispatchEvent(new Event("input", eventOptions));
    }
  }, language);
  await page.waitForTimeout(5000);
}

async function waitForPropertyInstructionReady(page, actionSelector, timeoutMs) {
  await page.waitForSelector(".pi-page, .pi-shell, .guest-guide-page", { timeout: timeoutMs });
  await page.waitForFunction(
    (selector) => {
      const actionButton = document.querySelector(selector);
      if (!actionButton || actionButton.disabled) {
        return false;
      }
      if (!window.__propertyInstructionUiBound) {
        return false;
      }
      const toolbar = document.querySelector(".pi-guide-toolbar, .pi-toolbar, section.pi-guide-toolbar");
      if (!toolbar) {
        return false;
      }
      const mapNodes = Array.from(document.querySelectorAll("[data-guide-map-card], [data-guide-block-map]"));
      const representationReady = mapNodes.every((node) => {
        if (node.hasAttribute("data-guide-map-card")) {
          return node.hasAttribute("data-guide-map-pdf-representation");
        }
        if (node.hasAttribute("data-guide-block-map")) {
          return node.hasAttribute("data-guide-block-map-pdf-representation");
        }
        return true;
      });
      return representationReady;
    },
    actionSelector,
    { timeout: timeoutMs }
  );
}

async function waitForBoundedSignal(signalFactories, timeoutMs) {
  const wrapped = signalFactories.map(({ kind, makePromise }) => {
    return makePromise()
      .then((value) => ({ kind, value, ok: true }))
      .catch((error) => ({
        kind,
        ok: false,
        errorName: error && error.name ? error.name : "Error",
        errorMessage: error && error.message ? error.message : String(error)
      }));
  });
  const timer = new Promise((resolve) => {
    setTimeout(() => resolve({ kind: "timeout", ok: false, errorName: "TimeoutError", errorMessage: `Timed out after ${timeoutMs}ms` }), timeoutMs);
  });
  return Promise.race([timer, ...wrapped]);
}

function createPopupObserver(page) {
  const queuedPopups = [];
  page.on("popup", (popup) => {
    queuedPopups.push(popup);
  });
  return {
    takePopup() {
      if (!queuedPopups.length) {
        return null;
      }
      return queuedPopups.shift();
    }
  };
}

async function pollPrintSignal(page, popupObserver, timeoutMs) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const popup = popupObserver.takePopup();
    if (popup) {
      return { kind: "popup", popup };
    }
    const state = await page.evaluate(() => {
      const dialog = document.querySelector("[data-guide-print-ready-dialog]");
      const readyDialogOpen = !!dialog && !dialog.hasAttribute("hidden") && (dialog.open || dialog.hasAttribute("open"));
      const feedbackKind = document.querySelector("[data-guide-pdf-feedback]")?.getAttribute("data-feedback-kind") || "";
      return {
        readyDialogOpen,
        feedbackKind,
        lastError: window.__propertyInstructionLastPdfError || null
      };
    });
    if (state.readyDialogOpen) {
      return { kind: "dialog" };
    }
    if (state.feedbackKind === "error") {
      return {
        kind: "generation-error",
        errorName: "GenerationError",
        errorMessage: state.lastError || "PDF generation entered error feedback"
      };
    }
    await page.waitForTimeout(100);
  }
  return {
    kind: "timeout",
    errorName: "TimeoutError",
    errorMessage: `Timed out after ${timeoutMs}ms waiting for popup or ready dialog`
  };
}

async function pollPopupAfterReadyPrint(page, popupObserver, timeoutMs) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const popup = popupObserver.takePopup();
    if (popup) {
      return { kind: "ready-popup", popup };
    }
    const state = await page.evaluate(() => {
      const feedbackKind = document.querySelector("[data-guide-pdf-feedback]")?.getAttribute("data-feedback-kind") || "";
      return {
        feedbackKind,
        lastError: window.__propertyInstructionLastPdfError || null
      };
    });
    if (state.feedbackKind === "error") {
      return {
        kind: "generation-error",
        errorName: "GenerationError",
        errorMessage: state.lastError || "PDF generation entered error feedback after clicking Print PDF"
      };
    }
    await page.waitForTimeout(100);
  }
  return {
    kind: "timeout",
    errorName: "TimeoutError",
    errorMessage: `Timed out after ${timeoutMs}ms waiting for print popup`
  };
}

async function pollDownloadSignal(page, downloadPromise, timeoutMs) {
  var settled = null;
  downloadPromise.then(function (download) {
    settled = { kind: "download", download: download };
  }).catch(function (error) {
    settled = {
      kind: "download-timeout",
      errorName: error && error.name ? error.name : "Error",
      errorMessage: error && error.message ? error.message : String(error)
    };
  });
  var startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (settled) {
      return settled;
    }
    var state = await page.evaluate(() => {
      const feedbackKind = document.querySelector("[data-guide-pdf-feedback]")?.getAttribute("data-feedback-kind") || "";
      return {
        feedbackKind,
        lastError: window.__propertyInstructionLastPdfError || null
      };
    });
    if (state.feedbackKind === "error") {
      return {
        kind: "generation-error",
        errorName: "GenerationError",
        errorMessage: state.lastError || "PDF generation entered error feedback"
      };
    }
    await page.waitForTimeout(100);
  }
  return {
    kind: "timeout",
    errorName: "TimeoutError",
    errorMessage: `Timed out after ${timeoutMs}ms waiting for download or generation error`
  };
}

async function runOne(options, browserName, renderer, action, language, caseId) {
  const browserType = getBrowserType(browserName);
  const progressDir = path.join(options.outputDir, "progress");
  const progressPath = path.join(progressDir, `${caseId}.progress.json`);
  const resultPath = path.join(options.outputDir, `${browserName}-${renderer}-${language}-${action}.json`);
  const startedAtIso = new Date().toISOString();
  const startedAtMs = Date.now();
  const progress = {
    caseId,
    browser: browserName,
    renderer,
    action,
    language,
    url: buildGuideUrl(options.baseUrl, options.propertySlug, language),
    startedAt: startedAtIso,
    stages: []
  };
  const result = {
    caseId,
    browser: browserName,
    renderer,
    action,
    language,
    url: progress.url,
    startedAt: startedAtIso,
    success: false,
    failedStage: null
  };
  const requests = [];
  const consoleMessages = [];
  const pageErrors = [];
  const popupUrls = [];
  let currentStage = "case-started";
  let browser = null;
  let context = null;
  let page = null;
  let popupObserver = null;

  function markStage(stage, extra) {
    currentStage = stage;
    progress.stages.push(Object.assign({
      stage,
      timestamp: new Date().toISOString(),
      elapsedMs: Date.now() - startedAtMs,
      browser: browserName,
      renderer,
      action,
      language,
      url: result.url
    }, extra || {}));
    atomicWriteJson(progressPath, progress);
  }

  markStage("case-started");

  try {
    browser = await browserType.launch(getLaunchOptions(browserName));
    markStage("browser-launched");
    context = await browser.newContext({
      acceptDownloads: true,
      bypassCSP: true,
      viewport: {
        width: options.viewportWidth,
        height: options.viewportHeight
      }
    });
    page = await context.newPage();
    page.on("request", (request) => requests.push(request.url()));
    page.on("console", (message) => consoleMessages.push({
      type: message.type(),
      text: message.text()
    }));
    page.on("pageerror", (error) => pageErrors.push({
      name: error.name,
      message: error.message
    }));
    if (options.failSnapshotEndpointStatus > 0) {
      await page.route("**/api/method/propms.map_snapshot.pdf_assets.public_map_snapshot_image**", async (route) => {
        await route.fulfill({
          status: options.failSnapshotEndpointStatus,
          contentType: "text/plain; charset=utf-8",
          body: `forced snapshot endpoint failure ${options.failSnapshotEndpointStatus}`
        });
      });
    }
    popupObserver = createPopupObserver(page);
    markStage("page-created");

    markStage("navigation-started", { waitUntil: "domcontentloaded" });
    await page.goto(result.url, { waitUntil: "domcontentloaded", timeout: Math.min(options.timeoutMs, 60000) });
    markStage("dom-content-loaded");
    await setLanguage(page, language);
    markStage("language-ready");
    const actionSelector = action === "download" ? ".pi-pdf-download" : ".property-instruction-print";
    await waitForPropertyInstructionReady(page, actionSelector, 30000);
    markStage("application-ready");
    await page.waitForSelector(`${actionSelector}:not([disabled])`, { timeout: 30000 });
    markStage("action-button-ready");

    if (action === "download") {
      markStage("action-clicked");
      const downloadTimeoutMs = 30000;
      const downloadPromise = page.waitForEvent("download", { timeout: downloadTimeoutMs });
      await page.click(actionSelector);
      markStage("generation-started");
      const downloadSignal = await pollDownloadSignal(page, downloadPromise, downloadTimeoutMs);
      if (downloadSignal.kind !== "download" || !downloadSignal.download) {
        throw new Error(`Download signal failed: ${downloadSignal.kind}: ${downloadSignal.errorMessage || "unknown error"}`);
      }
      const download = downloadSignal.download;
      const pdfDir = path.join(options.outputDir, "pdf");
      fs.mkdirSync(pdfDir, { recursive: true });
      const pdfPath = path.join(pdfDir, `${browserName}-${renderer}-${language}-${action}.pdf`);
      await download.saveAs(pdfPath);
      result.downloadPath = pdfPath;
      result.downloadSize = fs.statSync(pdfPath).size;
      result.downloadSha256 = sha256(pdfPath);
      markStage("artifact-validated", {
        artifactKind: "download",
        artifactPath: pdfPath
      });
    } else {
      const firstSignalTimeoutMs = 30000;
      const readyPrintTimeoutMs = 30000;
      markStage("action-clicked");
      await page.click(actionSelector);
      markStage("generation-started");
      const firstPrintSignal = await pollPrintSignal(page, popupObserver, firstSignalTimeoutMs);
      markStage(firstPrintSignal.kind === "dialog" ? "ready-dialog-seen" : firstPrintSignal.kind === "popup" ? "popup-seen" : "print-signal-failed", firstPrintSignal);
      if (firstPrintSignal.kind === "timeout" || firstPrintSignal.kind === "generation-error") {
        throw new Error(`Print signal failed at first stage: ${firstPrintSignal.kind}: ${firstPrintSignal.errorMessage || "unknown error"}`);
      }
      if (firstPrintSignal.kind === "popup" && firstPrintSignal.popup) {
        const popup = firstPrintSignal.popup;
        result.popupOpened = true;
        popupUrls.push(popup.url());
        await popup.waitForLoadState("domcontentloaded", { timeout: 5000 }).catch(() => null);
      } else {
        await page.click("[data-guide-pdf-ready-print]");
        markStage("ready-print-clicked");
        const readyPopupSignal = await pollPopupAfterReadyPrint(page, popupObserver, readyPrintTimeoutMs);
        if (readyPopupSignal.kind === "timeout" || readyPopupSignal.kind === "generation-error") {
          throw new Error(`Print popup failed after ready dialog: ${readyPopupSignal.kind}: ${readyPopupSignal.errorMessage || "unknown error"}`);
        }
        const readyPopup = readyPopupSignal.popup || null;
        result.popupOpened = !!readyPopup;
        if (readyPopup) {
          popupUrls.push(readyPopup.url());
          markStage("popup-seen", { popupUrl: readyPopup.url() });
          await readyPopup.waitForLoadState("domcontentloaded", { timeout: 5000 }).catch(() => null);
        }
      }
    }

    await page.waitForTimeout(1500);
    markStage("state-captured");
    result.state = await snapshotState(page);
    if (result.state.renderer !== options.renderer) {
      throw new Error(`Unexpected PDF renderer: ${result.state.renderer || "missing"}`);
    }
    result.mapRequestDiagnostics = collectMapRequestDiagnostics(requests);
    result.vectorFontRequests = requests.filter((requestUrl) => /\/assets\/propms\/js\/vendor\/fonts\//.test(requestUrl));
    result.browserFontRequests = requests.filter((requestUrl) => /\/assets\/frappe\/css\/fonts\/inter\//.test(requestUrl));
    result.consoleMessages = consoleMessages;
    result.pageErrors = pageErrors;
    result.popupUrls = popupUrls;
    result.success = true;
    markStage("case-completed");
  } catch (error) {
    result.success = false;
    result.failedStage = currentStage;
    result.errorName = error && error.name ? error.name : "Error";
    result.errorMessage = error && error.message ? error.message : String(error);
    result.consoleMessages = consoleMessages;
    result.pageErrors = pageErrors;
    result.popupUrls = popupUrls;
    if (page) {
      try {
        result.state = await snapshotState(page);
      } catch (snapshotError) {
        result.stateCaptureError = snapshotError && snapshotError.message ? snapshotError.message : String(snapshotError);
      }
    }
    result.mapRequestDiagnostics = collectMapRequestDiagnostics(requests);
  } finally {
    result.finishedAt = new Date().toISOString();
    try {
      markStage("browser-close-started");
    } catch (error) {
      // Ignore progress write errors during shutdown.
    }
    if (browser) {
      await browser.close().catch(() => null);
    }
    try {
      markStage("browser-closed");
    } catch (error) {
      // Ignore progress write errors during shutdown.
    }
    atomicWriteJson(resultPath, result);
  }

  return result;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.resume || options.keepOutput) {
    ensureDir(options.outputDir);
  } else {
    ensureCleanDir(options.outputDir);
  }
  const manifest = {
    generatedAt: new Date().toISOString(),
    options
  };
  atomicWriteJson(path.join(options.outputDir, "manifest.json"), manifest);

  const resultsByCaseId = new Map();
  const cases = [];
  for (const browserName of options.browsers) {
    for (const action of options.actions) {
      for (const language of options.languages) {
        const renderer = options.renderer;
        const caseId = buildCaseId(options.propertySlug, browserName, renderer, action, language);
        cases.push({ browserName, renderer, action, language, caseId });
      }
    }
  }

  for (const caseEntry of cases) {
    if (options.caseId && caseEntry.caseId !== options.caseId) {
      continue;
    }
    const resultPath = path.join(
      options.outputDir,
      `${caseEntry.browserName}-${caseEntry.renderer}-${caseEntry.language}-${caseEntry.action}.json`
    );
    if (options.resume && fs.existsSync(resultPath)) {
      try {
        const existingResult = JSON.parse(fs.readFileSync(resultPath, "utf8"));
        if (existingResult && existingResult.success === true) {
          resultsByCaseId.set(caseEntry.caseId, {
            browser: caseEntry.browserName,
            renderer: caseEntry.renderer,
            action: caseEntry.action,
            language: caseEntry.language,
            lifecycle: existingResult.state && existingResult.state.lifecycle ? existingResult.state.lifecycle.currentStage : null,
            generationStage: existingResult.state && existingResult.state.generationDiagnostics ? existingResult.state.generationDiagnostics.currentStage : null,
            feedbackKind: existingResult.state ? existingResult.state.feedbackKind : null,
            download: !!existingResult.downloadPath,
            popupOpened: !!existingResult.popupOpened,
            lastError: existingResult.state ? existingResult.state.lastError : null,
            success: true,
            skippedByResume: true,
            caseId: caseEntry.caseId
          });
          atomicWriteJson(path.join(options.outputDir, "summary.json"), Array.from(resultsByCaseId.values()));
          continue;
        }
      } catch (error) {
        // Fall through and rerun corrupted or incomplete results.
      }
    }
    const result = await runOne(
      options,
      caseEntry.browserName,
      caseEntry.renderer,
      caseEntry.action,
      caseEntry.language,
      caseEntry.caseId
    );
    resultsByCaseId.set(caseEntry.caseId, {
            browser: caseEntry.browserName,
            renderer: caseEntry.renderer,
            action: caseEntry.action,
            language: caseEntry.language,
            lifecycle: result.state && result.state.lifecycle ? result.state.lifecycle.currentStage : null,
            generationStage: result.state && result.state.generationDiagnostics ? result.state.generationDiagnostics.currentStage : null,
            feedbackKind: result.state ? result.state.feedbackKind : null,
            download: !!result.downloadPath,
            popupOpened: !!result.popupOpened,
            lastError: result.state ? result.state.lastError : null,
            success: !!result.success,
            failedStage: result.failedStage || null,
            caseId: caseEntry.caseId
          });
    atomicWriteJson(path.join(options.outputDir, "summary.json"), Array.from(resultsByCaseId.values()));
    if (!result.success) {
      throw new Error(`Case ${caseEntry.caseId} failed at stage ${result.failedStage || "unknown"}: ${result.errorMessage || "unknown error"}`);
    }
  }

  const results = Array.from(resultsByCaseId.values());
  if (!results.length) {
    throw new Error(options.caseId ? `No case matched --case-id ${options.caseId}` : "No cases were executed");
  }
  atomicWriteJson(path.join(options.outputDir, "summary.json"), results);
  process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exit(1);
});
