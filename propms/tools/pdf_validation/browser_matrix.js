#!/usr/bin/env node

const { chromium, webkit } = require("playwright");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const DEFAULTS = {
  baseUrl: "http://127.0.0.1:8000",
  propertySlug: "99a-burlington-road",
  browsers: ["chromium", "webkit"],
  renderers: ["default", "raster", "vector", "legacy"],
  actions: ["download", "print"],
  languages: ["en"],
  outputDir: "/tmp/propms_pdf_matrix",
  timeoutMs: 180000,
  viewportWidth: 1600,
  viewportHeight: 1200
};

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
    } else if (token === "--renderers" && nextValue) {
      options.renderers = nextValue.split(",").map((value) => value.trim()).filter(Boolean);
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
    }
  }
  return options;
}

function ensureCleanDir(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
  fs.mkdirSync(dirPath, { recursive: true });
}

function sha256(filePath) {
  const digest = crypto.createHash("sha256");
  digest.update(fs.readFileSync(filePath));
  return digest.digest("hex");
}

function getBrowserType(name) {
  if (name === "chromium") {
    return chromium;
  }
  if (name === "webkit") {
    return webkit;
  }
  throw new Error(`Unsupported browser: ${name}`);
}

function buildGuideUrl(baseUrl, propertySlug, renderer, language) {
  const guideUrl = new URL(`/instructions/${propertySlug}`, baseUrl);
  if (renderer === "legacy") {
    guideUrl.searchParams.set("propms_pdf_layout", "legacy");
  }
  if (renderer === "raster" || renderer === "vector") {
    guideUrl.searchParams.set("propms_pdf_layout", "adaptive");
  }
  if (renderer === "vector") {
    guideUrl.searchParams.set("propms_pdf_renderer", "vector");
  }
  if (renderer === "raster") {
    guideUrl.searchParams.set("propms_pdf_renderer", "raster");
  }
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

async function runOne(options, browserName, renderer, action, language) {
  const browserType = getBrowserType(browserName);
  const browser = await browserType.launch({ headless: true });
  const context = await browser.newContext({
    acceptDownloads: true,
    bypassCSP: true,
    viewport: {
      width: options.viewportWidth,
      height: options.viewportHeight
    }
  });
  const page = await context.newPage();
  const requests = [];
  const consoleMessages = [];
  const pageErrors = [];
  const popupUrls = [];

  page.on("request", (request) => requests.push(request.url()));
  page.on("console", (message) => consoleMessages.push({
    type: message.type(),
    text: message.text()
  }));
  page.on("pageerror", (error) => pageErrors.push({
    name: error.name,
    message: error.message
  }));

  const url = buildGuideUrl(options.baseUrl, options.propertySlug, renderer, language);
  const result = {
    browser: browserName,
    renderer,
    action,
    language,
    url,
    startedAt: new Date().toISOString()
  };

  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: options.timeoutMs });
    await setLanguage(page, language);
    const actionSelector = action === "download" ? ".pi-pdf-download" : ".property-instruction-print";
    await page.waitForSelector(`${actionSelector}:not([disabled])`, { timeout: 30000 });

    if (action === "download") {
      const downloadPromise = page.waitForEvent("download", { timeout: options.timeoutMs });
      await page.click(actionSelector);
      const download = await downloadPromise;
      const pdfDir = path.join(options.outputDir, "pdf");
      fs.mkdirSync(pdfDir, { recursive: true });
      const pdfPath = path.join(pdfDir, `${browserName}-${renderer}-${language}-${action}.pdf`);
      await download.saveAs(pdfPath);
      result.downloadPath = pdfPath;
      result.downloadSize = fs.statSync(pdfPath).size;
      result.downloadSha256 = sha256(pdfPath);
    } else {
      const popupPromise = page.waitForEvent("popup", { timeout: options.timeoutMs }).catch(() => null);
      const dialogPromise = page.waitForFunction(() => {
        const dialog = document.querySelector("[data-guide-print-ready-dialog]");
        return !!dialog && !dialog.hasAttribute("hidden") && (dialog.open || dialog.hasAttribute("open"));
      }, { timeout: options.timeoutMs }).then(() => "dialog").catch(() => null);
      await page.click(actionSelector);
      const firstPrintSignal = await Promise.race([
        popupPromise.then((popup) => ({ kind: "popup", popup })),
        dialogPromise.then((kind) => kind ? ({ kind }) : null)
      ]);
      if (firstPrintSignal && firstPrintSignal.kind === "popup" && firstPrintSignal.popup) {
        const popup = firstPrintSignal.popup;
        result.popupOpened = true;
        popupUrls.push(popup.url());
        await popup.waitForLoadState("load", { timeout: 30000 }).catch(() => null);
      } else {
        if (!firstPrintSignal || firstPrintSignal.kind !== "dialog") {
          await page.waitForFunction(() => {
            const dialog = document.querySelector("[data-guide-print-ready-dialog]");
            return !!dialog && !dialog.hasAttribute("hidden") && (dialog.open || dialog.hasAttribute("open"));
          }, { timeout: options.timeoutMs });
        }
        const readyPopupPromise = page.waitForEvent("popup", { timeout: 30000 }).catch(() => null);
        await page.click("[data-guide-pdf-ready-print]");
        const readyPopup = await readyPopupPromise;
        result.popupOpened = !!readyPopup;
        if (readyPopup) {
          popupUrls.push(readyPopup.url());
          await readyPopup.waitForLoadState("load", { timeout: 30000 }).catch(() => null);
        }
      }
    }

    await page.waitForTimeout(1500);
    result.state = await snapshotState(page);
    result.vectorFontRequests = requests.filter((requestUrl) => /\/assets\/propms\/js\/vendor\/fonts\//.test(requestUrl));
    result.browserFontRequests = requests.filter((requestUrl) => /\/assets\/frappe\/css\/fonts\/inter\//.test(requestUrl));
    result.consoleMessages = consoleMessages;
    result.pageErrors = pageErrors;
    result.popupUrls = popupUrls;
  } finally {
    result.finishedAt = new Date().toISOString();
    await browser.close();
  }

  return result;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  ensureCleanDir(options.outputDir);
  const manifest = {
    generatedAt: new Date().toISOString(),
    options
  };
  fs.writeFileSync(path.join(options.outputDir, "manifest.json"), JSON.stringify(manifest, null, 2));

  const results = [];
  for (const browserName of options.browsers) {
    for (const renderer of options.renderers) {
      for (const action of options.actions) {
        for (const language of options.languages) {
          const result = await runOne(options, browserName, renderer, action, language);
          const resultPath = path.join(
            options.outputDir,
            `${browserName}-${renderer}-${language}-${action}.json`
          );
          fs.writeFileSync(resultPath, JSON.stringify(result, null, 2));
          results.push({
            browser: browserName,
            renderer,
            action,
            language,
            lifecycle: result.state && result.state.lifecycle ? result.state.lifecycle.currentStage : null,
            generationStage: result.state && result.state.generationDiagnostics ? result.state.generationDiagnostics.currentStage : null,
            feedbackKind: result.state ? result.state.feedbackKind : null,
            download: !!result.downloadPath,
            popupOpened: !!result.popupOpened,
            lastError: result.state ? result.state.lastError : null
          });
        }
      }
    }
  }

  fs.writeFileSync(path.join(options.outputDir, "summary.json"), JSON.stringify(results, null, 2));
  process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exit(1);
});
