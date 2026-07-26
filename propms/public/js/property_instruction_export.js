(function () {
  if (window.__propertyInstructionUiBound) {
    return;
  }
  window.__propertyInstructionUiBound = true;

  var HTML2CANVAS_LIBRARY_URL = "/assets/propms/js/vendor/html2canvas.min.js";
  var JSPDF_LIBRARY_URL = "/assets/propms/js/vendor/jspdf.umd.min.js";
  var QRCODE_LIBRARY_URL = "/assets/propms/js/vendor/qrcodegen.js";
  var PUBLIC_PDF_IMAGE_ENDPOINT = "/api/method/propms.property_management_solution.doctype.property_instruction.property_instruction.public_pdf_image";
  var OPEN_STREET_MAP_TILE_TEMPLATE = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
  var PDF_LAYOUT_VERSION = "2026-07-25-contents-qr-v1";
  var PDF_EXPORT_WIDTH = 794;
  var PDF_EXPORT_PAGE_HEIGHT = 1122;
  var PDF_EXPORT_OFFSCREEN_LEFT = -20000;
  var PDF_EXPORT_PAGE_PADDING_TOP = 34;
  var PDF_EXPORT_PAGE_PADDING_RIGHT = 38;
  var PDF_EXPORT_PAGE_PADDING_BOTTOM = 40;
  var PDF_EXPORT_PAGE_PADDING_LEFT = 38;
  var PDF_EXPORT_FOOTER_HEIGHT = 20;
  var PDF_EXPORT_FOOTER_GAP = 10;
  var PDF_EXPORT_PAGE_BODY_HEIGHT = PDF_EXPORT_PAGE_HEIGHT - PDF_EXPORT_PAGE_PADDING_TOP - PDF_EXPORT_PAGE_PADDING_BOTTOM - PDF_EXPORT_FOOTER_HEIGHT - PDF_EXPORT_FOOTER_GAP;
  var PDF_EXPORT_TIMEOUT_MS = 240000;
  var PDF_EXPORT_IMAGE_RATIO_TOLERANCE = 0.02;
  var PDF_EXPORT_IMAGE_CLIP_TOLERANCE = 1.5;
  var PRINT_PAGE_WIDTH_PT = 594;
  var PRINT_PAGE_HEIGHT_PT = 840;
  var PRINT_PAGE_LAYOUT_SETTLE_MS = 40;
  var PDF_EXPORT_FONT_LOADS = [
    '400 16px "PropMS PDF Inter"',
    '500 16px "PropMS PDF Inter"',
    '600 16px "PropMS PDF Inter"',
    '700 16px "PropMS PDF Inter"'
  ];
  var GUIDE_SETTLE_TIMEOUT_MS = 45000;
  var GUIDE_SETTLE_QUIET_MS = 2500;
  var GUIDE_SETTLE_STABLE_INTERVAL_MS = 1500;
  var GUIDE_SETTLE_STABLE_PASSES = 2;
  var SOURCE_LANGUAGE = "en";
  var RTL_LANGUAGE_PREFIXES = ["ar", "fa", "he", "ku", "ps", "ur", "yi"];
  var GOOGLE_PRESENTATION_SELECTORS = [
    "iframe.goog-te-banner-frame",
    "iframe.VIpgJd-ZVi9od-ORHb-OEVmcd",
    ".goog-te-banner-frame.skiptranslate",
    ".VIpgJd-ZVi9od-xl07Ob-OEVmcd",
    ".VIpgJd-ZVi9od-SmfZ-OEVmcd",
    "#goog-gt-tt",
    ".goog-te-balloon-frame",
    ".goog-tooltip",
    ".goog-text-highlight"
  ];
  var PDF_WARM_PREPARE_TIMEOUT_MS = 1500;
  var PDF_PROGRESS_HISTORY_LIMIT = 6;
  var PDF_PROGRESS_HISTORY_PREFIX = "propmsPdfProgressHistory::";
  var PDF_QR_MODULE_BORDER = 4;
  var PROTECTED_GUIDE_FIELDS = {
    address: true,
    wifi_name: true,
    wifi_password: true
  };
  var translationState = {
    generation: 0,
    requestedLanguage: "",
    readyLanguage: "",
    readySnapshot: null,
    originalSnapshot: null,
    lastMutationAt: Date.now(),
    baselineCapturedAt: 0,
    firstMutationAt: 0,
    widgetScriptRequestedAt: 0,
    stablePassTimestamps: [],
    mutationTimestamps: [],
    sectionReadiness: {},
    stableGeneration: 0,
    progressObservations: [],
    diagnostics: {},
    readyAt: 0,
    lastLanguageSelectedAt: Date.now(),
    settlingPromise: null,
    settlingGeneration: 0,
    preparationPromise: null,
    preparationKey: "",
    warmupScheduled: false,
    googleUiObserverBound: false,
    googleUiEnforceScheduled: false
  };
  var pdfPreparationState = {
    preparedState: null,
    artifactCache: {},
    warmupPromise: null,
    imageDataCache: new Map(),
    mapImageCache: new Map(),
    qrImageCache: new Map(),
    decodedTileImageCache: new Map()
  };
  var pdfExportController = {
    activePromise: null,
    activeLanguage: "",
    readyObjectUrl: "",
    readyMimeType: "",
    readySize: 0,
    readyObjectUrlRevokeTimer: 0
  };
  var activePrintController = null;
  var instructionBlockMapModels = null;

  function getGoogleWidgetState() {
    window.__propertyInstructionGoogleWidgetState = window.__propertyInstructionGoogleWidgetState || {};
    return window.__propertyInstructionGoogleWidgetState;
  }

  function startPdfPerformance() {
    window.__propertyInstructionPdfPerformance = {
      startedAt: Date.now(),
      languageSelectedToTranslationReadyMs: 0,
      translationReadyToExportPreparedMs: 0,
      translationReadyMs: 0,
      modelExtractionMs: 0,
      exportDomConstructionMs: 0,
      imagePreparationMs: 0,
      mapPreparationMs: 0,
      paginationMs: 0,
      fontReadinessMs: 0,
      frameCreatedAt: 0,
      frameStylesReadyMs: 0,
      frameFontsReadyMs: 0,
      pageDomReplacementMs: [],
      pageCaptureMs: [],
      encodingMs: 0,
      jsPdfAssemblyMs: 0,
      blobCreationMs: 0,
      qrGenerationMs: 0,
      contentsResolutionMs: 0,
      buttonClickToPdfBlobMs: 0,
      warmRepeatedDownloadMs: 0,
      totalMs: 0
    };
    return window.__propertyInstructionPdfPerformance;
  }

  function getPdfPerformanceState() {
    return window.__propertyInstructionPdfPerformance || startPdfPerformance();
  }

  function getBrowserFamily() {
    var userAgent = String((navigator && navigator.userAgent) || "").toLowerCase();
    if (userAgent.indexOf("firefox") !== -1) {
      return "Firefox";
    }
    if (userAgent.indexOf("safari") !== -1 && userAgent.indexOf("chrome") === -1 && userAgent.indexOf("chromium") === -1) {
      return "WebKit";
    }
    return "Chromium";
  }

  function isSafariFamily() {
    return getBrowserFamily() === "WebKit";
  }

  function setPdfExportLifecycle(stageName) {
    var lifecycle = window.__propertyInstructionPdfLifecycle || {
      startedAt: Date.now(),
      browserFamily: getBrowserFamily(),
      currentStage: "idle",
      transitions: []
    };
    var nextStage = String(stageName || "idle");
    if (lifecycle.currentStage !== nextStage) {
      lifecycle.transitions.push({
        stage: nextStage,
        at: Date.now(),
        elapsedMs: Math.max(0, Date.now() - lifecycle.startedAt)
      });
      lifecycle.currentStage = nextStage;
    }
    window.__propertyInstructionPdfLifecycle = lifecycle;
    return lifecycle;
  }

  function recordPdfPerformance(performanceState, key, startedAt, value) {
    if (!performanceState || !key) {
      return;
    }
    performanceState[key] = typeof value === "number" ? value : (Date.now() - startedAt);
  }

  function getProgressHistoryStorageKey(pageCount, renderScale) {
    return [
      PDF_PROGRESS_HISTORY_PREFIX,
      getBrowserFamily(),
      String(pageCount || 0),
      String(renderScale || 1.8),
      PDF_LAYOUT_VERSION
    ].join("");
  }

  function readProgressHistory(pageCount, renderScale) {
    try {
      var storageValue = window.sessionStorage.getItem(getProgressHistoryStorageKey(pageCount, renderScale));
      if (!storageValue) {
        return [];
      }
      var parsed = JSON.parse(storageValue);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function writeProgressHistory(pageCount, renderScale, history) {
    try {
      window.sessionStorage.setItem(
        getProgressHistoryStorageKey(pageCount, renderScale),
        JSON.stringify((history || []).slice(-PDF_PROGRESS_HISTORY_LIMIT))
      );
    } catch (error) {
      return null;
    }
    return history;
  }

  function recordProgressHistory(pageCount, renderScale, performanceState) {
    if (!pageCount || !performanceState) {
      return;
    }
    var history = readProgressHistory(pageCount, renderScale);
    history.push({
      totalMs: performanceState.totalMs || 0,
      translationReadyMs: performanceState.translationReadyMs || 0,
      translationReadyToExportPreparedMs: performanceState.translationReadyToExportPreparedMs || 0,
      imagePreparationMs: performanceState.imagePreparationMs || 0,
      mapPreparationMs: performanceState.mapPreparationMs || 0,
      qrGenerationMs: performanceState.qrGenerationMs || 0,
      contentsResolutionMs: performanceState.contentsResolutionMs || 0,
      paginationMs: performanceState.paginationMs || 0,
      pageCaptureMs: (performanceState.pageCaptureMs || []).reduce(function (sum, value) {
        return sum + (Number(value) || 0);
      }, 0),
      encodingMs: performanceState.encodingMs || 0,
      jsPdfAssemblyMs: performanceState.jsPdfAssemblyMs || 0,
      blobCreationMs: performanceState.blobCreationMs || 0
    });
    writeProgressHistory(pageCount, renderScale, history);
  }

  function getAverageProgressHistory(pageCount, renderScale) {
    var history = readProgressHistory(pageCount, renderScale).filter(function (entry) {
      return entry && Number(entry.totalMs) > 0;
    });
    if (!history.length) {
      return null;
    }
    var keys = [
      "totalMs",
      "translationReadyMs",
      "translationReadyToExportPreparedMs",
      "imagePreparationMs",
      "mapPreparationMs",
      "qrGenerationMs",
      "contentsResolutionMs",
      "paginationMs",
      "pageCaptureMs",
      "encodingMs",
      "jsPdfAssemblyMs",
      "blobCreationMs"
    ];
    var averages = {};
    keys.forEach(function (key) {
      averages[key] = Math.round(history.reduce(function (sum, entry) {
        return sum + (Number(entry[key]) || 0);
      }, 0) / history.length);
    });
    return averages;
  }

  function getPdfExportStylesheetText() {
    var styleNode = document.getElementById("property-instruction-pdf-export-css");
    return styleNode ? String(styleNode.textContent || "") : "";
  }

  function schedulePdfLibraryWarmup() {
    if (pdfPreparationState.warmupPromise) {
      return pdfPreparationState.warmupPromise;
    }
    pdfPreparationState.warmupPromise = new Promise(function (resolve) {
      requestIdleWork(function () {
        prewarmPdfLibraries().finally(function () {
          pdfPreparationState.warmupPromise = null;
          resolve();
        });
      }, PDF_WARM_PREPARE_TIMEOUT_MS);
    });
    return pdfPreparationState.warmupPromise;
  }

  function requestIdleWork(callback, timeoutMs) {
    var effectiveTimeout = timeoutMs || PDF_WARM_PREPARE_TIMEOUT_MS;
    if (window.requestIdleCallback) {
      var completed = false;
      var timeoutHandle = 0;
      var idleHandle = window.requestIdleCallback(function (deadline) {
        if (completed) {
          return;
        }
        completed = true;
        if (timeoutHandle) {
          window.clearTimeout(timeoutHandle);
        }
        callback(deadline);
      }, {
        timeout: effectiveTimeout
      });
      timeoutHandle = window.setTimeout(function () {
        if (completed) {
          return;
        }
        completed = true;
        if (window.cancelIdleCallback) {
          window.cancelIdleCallback(idleHandle);
        }
        callback({
          didTimeout: true,
          timeRemaining: function () { return 0; }
        });
      }, effectiveTimeout);
      return {
        idleHandle: idleHandle,
        timeoutHandle: timeoutHandle
      };
    }
    return window.setTimeout(callback, Math.min(effectiveTimeout, 250));
  }

  function hashString(value) {
    var text = String(value || "");
    var hash = 5381;
    for (var index = 0; index < text.length; index += 1) {
      hash = ((hash << 5) + hash) + text.charCodeAt(index);
      hash = hash >>> 0;
    }
    return hash.toString(16);
  }

  function summarizeDiagnosticImageSource(source, role, extra) {
    var rawSource = String(source || "").trim();
    var mimeMatch = rawSource.match(/^data:([^;,]+)/i);
    var summary = Object.assign({
      role: role || "image",
      sourceKind: rawSource ? (isDataUrl(rawSource) ? "data" : (isSameOriginUrl(rawSource) ? "same-origin" : "external")) : "missing",
      mimeType: mimeMatch ? mimeMatch[1].toLowerCase() : "",
      encodedLength: rawSource.length,
      safeId: rawSource ? hashString(rawSource.slice(0, 128)) : ""
    }, extra || {});
    return summary;
  }

  async function copyValue(value) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(value);
      return;
    }

    const fallback = document.createElement("textarea");
    fallback.value = value;
    fallback.setAttribute("readonly", "readonly");
    fallback.style.position = "absolute";
    fallback.style.left = "-9999px";
    document.body.appendChild(fallback);
    fallback.select();
    document.execCommand("copy");
    document.body.removeChild(fallback);
  }

  function getGuideRoot() {
    return document.querySelector("[data-guide-root]");
  }

  function getGuideScreen() {
    return document.querySelector("[data-guide-screen]");
  }

  function normalizeText(value) {
    return String(value || "")
      .replace(/\u00a0/g, " ")
      .replace(/\r/g, "")
      .split("\n")
      .map(function (line) {
        return line.replace(/\s+/g, " ").trim();
      })
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function getVisibleText(element) {
    if (!element) {
      return "";
    }
    return normalizeText(element.innerText || element.textContent || "");
  }

  function getGuideTitle() {
    return getVisibleText(document.querySelector("[data-guide-field='title']"));
  }

  function sanitizePdfFilenamePart(value) {
    var normalized = String(value || "");
    if (normalized.normalize) {
      normalized = normalized.normalize("NFKC");
    }
    normalized = normalized
      .replace(/[\u0000-\u001f\u007f]+/g, " ")
      .replace(/[\/\\:*?"<>|]+/g, " ")
      .replace(/\s+/g, " ")
      .replace(/[. ]+$/g, "")
      .trim();
    return normalized;
  }

  function buildTranslatedPdfFilename(fallbackFilename) {
    var fallback = String(fallbackFilename || "guest-guide.pdf").trim() || "guest-guide.pdf";
    var translatedTitle = sanitizePdfFilenamePart(getGuideTitle());
    var translatedKicker = sanitizePdfFilenamePart(
      getVisibleText(document.querySelector("[data-guide-kicker]"))
    );
    var parts = [translatedTitle, translatedKicker].filter(Boolean);
    if (!parts.length) {
      return fallback;
    }
    var stem = parts.join(" - ").replace(/\s{2,}/g, " ").trim();
    if (!stem) {
      return fallback;
    }
    if (stem.length > 136) {
      stem = stem.slice(0, 136).replace(/[. ]+$/g, "").trim();
    }
    return (stem || sanitizePdfFilenamePart(fallback.replace(/\.pdf$/i, "")) || "guest-guide") + ".pdf";
  }

  function getPdfFilename(downloadButton) {
    var fallback = String(downloadButton.getAttribute("data-pdf-filename") || "guest-guide.pdf").trim() || "guest-guide.pdf";
    return buildTranslatedPdfFilename(fallback);
  }

  function getWidgetLanguage() {
    const widgetSelect = document.querySelector(".goog-te-combo");
    if (!widgetSelect || !widgetSelect.value) {
      return "";
    }
    return String(widgetSelect.value).trim().toLowerCase();
  }

  function getGuideLanguage() {
    return (
      getWidgetLanguage() ||
      String((getGuideRoot() && getGuideRoot().getAttribute("lang")) || document.documentElement.lang || SOURCE_LANGUAGE)
        .trim()
        .toLowerCase()
    );
  }

  function getGoogleTranslateEngineContainer() {
    return document.querySelector(".pi-google-translate-engine");
  }

  function getCustomLanguageSelect() {
    return document.querySelector("[data-guide-language-select]");
  }

  function getTranslationStatusElement() {
    return document.querySelector("[data-guide-translation-status]");
  }

  function getPdfProgressPanel() {
    return document.querySelector("[data-pdf-progress]");
  }

  function getPdfProgressLabel() {
    return document.querySelector("[data-pdf-progress-label]");
  }

  function getPdfProgressEta() {
    return document.querySelector("[data-pdf-progress-eta]");
  }

  function getPdfProgressBar() {
    return document.querySelector("[data-pdf-progress-bar]");
  }

  function getShowOriginalButton() {
    return document.querySelector("[data-guide-show-original]");
  }

  function getDownloadButton() {
    return document.querySelector(".pi-pdf-download");
  }

  function getPrintButton() {
    return document.querySelector(".property-instruction-print");
  }

  function getPdfDownloadAnchor() {
    var anchor = document.querySelector("[data-pdf-download-anchor]");
    if (anchor) {
      return anchor;
    }
    anchor = document.createElement("a");
    anchor.hidden = true;
    anchor.setAttribute("data-pdf-download-anchor", "");
    anchor.setAttribute("aria-hidden", "true");
    anchor.setAttribute("tabindex", "-1");
    document.body.appendChild(anchor);
    return anchor;
  }

  function getGuideCopyText(copyKey, fallbackText) {
    var copyNode = document.querySelector("[data-guide-progress-copy='" + copyKey + "']");
    var text = getVisibleText(copyNode);
    return text || String(fallbackText || "");
  }

  function resetPdfProgressUi() {
    var panel = getPdfProgressPanel();
    var label = getPdfProgressLabel();
    var eta = getPdfProgressEta();
    var bar = getPdfProgressBar();
    if (label) {
      label.textContent = "";
    }
    if (eta) {
      eta.textContent = "";
    }
    if (bar) {
      bar.value = 0;
      bar.setAttribute("aria-valuenow", "0");
    }
    if (panel) {
      panel.hidden = true;
    }
    window.__propertyInstructionPdfProgressUi = null;
  }

  function clearReadyPdfObjectUrl() {
    var anchor = getPdfDownloadAnchor();
    if (pdfExportController.readyObjectUrlRevokeTimer) {
      window.clearTimeout(pdfExportController.readyObjectUrlRevokeTimer);
      pdfExportController.readyObjectUrlRevokeTimer = 0;
    }
    if (anchor) {
      anchor.removeAttribute("href");
      anchor.removeAttribute("download");
    }
    if (!pdfExportController.readyObjectUrl) {
      return;
    }
    if (pdfExportController.readyObjectUrl && window.URL && window.URL.revokeObjectURL) {
      window.URL.revokeObjectURL(pdfExportController.readyObjectUrl);
    }
    pdfExportController.readyObjectUrl = "";
  }

  function scheduleReadyPdfObjectUrlRevocation() {
    if (pdfExportController.readyObjectUrlRevokeTimer) {
      window.clearTimeout(pdfExportController.readyObjectUrlRevokeTimer);
    }
    pdfExportController.readyObjectUrlRevokeTimer = window.setTimeout(function () {
      clearReadyPdfObjectUrl();
    }, 5 * 60 * 1000);
  }

  function createReadyPdfObjectUrl(blob) {
    if (!blob || !window.URL || !window.URL.createObjectURL) {
      return "";
    }
    clearReadyPdfObjectUrl();
    var objectUrl = window.URL.createObjectURL(blob);
    pdfExportController.readyObjectUrl = objectUrl;
    pdfExportController.readyMimeType = blob.type || "";
    pdfExportController.readySize = blob.size || 0;
    scheduleReadyPdfObjectUrlRevocation();
    return objectUrl;
  }

  function triggerAutomaticPdfDownload(blob, filename) {
    var anchor = getPdfDownloadAnchor();
    if (!anchor) {
      return false;
    }
    var objectUrl = createReadyPdfObjectUrl(blob);
    if (!objectUrl) {
      return false;
    }
    anchor.href = objectUrl;
    anchor.download = filename;
    if (!anchor.parentNode) {
      document.body.appendChild(anchor);
    }
    updateTranslationDiagnostics({
      pdfDownloadAttempt: {
        mimeType: pdfExportController.readyMimeType,
        size: pdfExportController.readySize,
        objectUrlCreated: !!objectUrl,
        automaticDownloadAttempted: true,
        clickTimestamp: Date.now(),
        browserFamily: getBrowserFamily()
      }
    });
    anchor.click();
    return true;
  }

  function updatePdfProgressUi(stepName, details) {
    var panel = getPdfProgressPanel();
    var label = getPdfProgressLabel();
    var eta = getPdfProgressEta();
    var bar = getPdfProgressBar();
    if (!panel || !label || !bar) {
      return;
    }

    var stageDetails = details || {};
    var progressValue = 0;
    var labelText = "";
    switch (stepName) {
      case "wait-translation":
        progressValue = 12;
        labelText = getGuideCopyText("wait_translation", "Waiting for translation");
        break;
      case "load-libraries":
        progressValue = 22;
        labelText = getGuideCopyText("prepare_dependencies", "Loading PDF tools");
        break;
      case "wait-images":
        progressValue = 32;
        labelText = getGuideCopyText("prepare_assets", "Preparing photographs, maps and QR codes");
        break;
      case "prepare-layout":
      case "build-export":
      case "extract-model":
      case "paginate":
      case "validate":
        progressValue = 48;
        labelText = getGuideCopyText("build_layout", "Building and paginating layout");
        break;
      case "render-pdf":
        progressValue = 52;
        labelText = getGuideCopyText("render_page", "Rendering page");
        break;
      case "finalize-pdf":
        progressValue = 94;
        labelText = getGuideCopyText("assemble_pdf", "Encoding and assembling PDF");
        break;
      case "prepare-print-preview":
        progressValue = 98;
        labelText = getGuideCopyText("prepare_print_preview", "Preparing print preview…");
        break;
      case "open-print-dialog":
        progressValue = 100;
        labelText = getGuideCopyText("opening_print_dialog", "Opening print dialog…");
        break;
      case "download-ready":
        progressValue = 100;
        labelText = getGuideCopyText("pdf_ready", "PDF ready");
        break;
      case "starting-download":
        progressValue = 100;
        labelText = getGuideCopyText("starting_download", "Starting download…");
        break;
      case "download-started":
        progressValue = 100;
        labelText = getGuideCopyText("download_started", "Download started");
        break;
      default:
        progressValue = 4;
        labelText = getGuideCopyText("prepare_dependencies", "Loading PDF tools");
        break;
    }

    if (stageDetails.pageIndex && stageDetails.pageCount && stepName === "render-pdf") {
      progressValue = 50 + Math.round((Math.max(0, stageDetails.pageIndex - 1) / Math.max(stageDetails.pageCount, 1)) * 40);
      labelText = getGuideCopyText("render_page", "Rendering page") + " " + stageDetails.pageIndex + " " + getGuideCopyText("of_total", "of") + " " + stageDetails.pageCount;
    }
    progressValue = Math.max(
      window.__propertyInstructionPdfProgressUi && typeof window.__propertyInstructionPdfProgressUi.value === "number"
        ? window.__propertyInstructionPdfProgressUi.value
        : 0,
      Math.min(progressValue, 100)
    );

    panel.hidden = false;
    label.textContent = labelText;
    bar.value = progressValue;
    bar.setAttribute("aria-valuenow", String(progressValue));

    var averageHistory = stageDetails.averageHistory || null;
    var elapsedMs = Number(stageDetails.elapsedMs || 0);
    if (eta) {
      if (averageHistory && averageHistory.totalMs && elapsedMs > 0 && progressValue < 100) {
        var remainingMs = Math.max(0, averageHistory.totalMs - elapsedMs);
        if (remainingMs >= 1000) {
          eta.textContent = getGuideCopyText("about_remaining", "About") + " " + Math.max(1, Math.round(remainingMs / 1000)) + " " + getGuideCopyText("seconds_remaining", "seconds remaining");
        } else {
          eta.textContent = "";
        }
      } else {
        eta.textContent = "";
      }
    }

    window.__propertyInstructionPdfProgressUi = {
      step: stepName,
      value: progressValue,
      label: labelText,
      eta: eta ? eta.textContent : ""
    };
  }

  function setTranslationStatus(message) {
    var statusElement = getTranslationStatusElement();
    if (statusElement) {
      statusElement.textContent = String(message || "");
    }
  }

  function syncShowOriginalButton(selectedLanguage) {
    var button = getShowOriginalButton();
    var customSelect = getCustomLanguageSelect();
    var activeLanguage = String(selectedLanguage || SOURCE_LANGUAGE).trim().toLowerCase() || SOURCE_LANGUAGE;
    var shouldShow = !!(
      button
      && customSelect
      && !customSelect.disabled
      && activeLanguage !== SOURCE_LANGUAGE
    );
    if (!button) {
      return;
    }
    button.hidden = !shouldShow;
    button.setAttribute("aria-hidden", shouldShow ? "false" : "true");
    if (!shouldShow) {
      button.disabled = false;
      button.removeAttribute("aria-disabled");
    }
  }

  function setPdfExportControlsDisabled(disabled) {
    var shouldDisable = !!disabled;
    var customSelect = getCustomLanguageSelect();
    var showOriginalButton = getShowOriginalButton();
    if (customSelect) {
      customSelect.disabled = shouldDisable;
      customSelect.setAttribute("aria-disabled", shouldDisable ? "true" : "false");
    }
    if (showOriginalButton) {
      showOriginalButton.disabled = shouldDisable;
      showOriginalButton.setAttribute("aria-disabled", shouldDisable ? "true" : "false");
    }
  }

  function setGuidePdfActionButtonsDisabled(disabled) {
    [getDownloadButton(), getPrintButton()].forEach(function (button) {
      if (!button) {
        return;
      }
      button.disabled = !!disabled;
      button.classList.toggle("is-disabled", !!disabled);
      button.setAttribute("aria-disabled", disabled ? "true" : "false");
    });
  }

  function expireCookie(name) {
    var host = window.location.hostname || "";
    var domains = ["", host];
    if (host && host.indexOf(".") !== -1) {
      domains.push("." + host);
    }
    domains.forEach(function (domain) {
      document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/"
        + (domain ? "; domain=" + domain : "");
    });
  }

  function resetToSourceLanguage() {
    expireCookie("googtrans");
    try {
      window.localStorage.removeItem("googtrans");
    } catch (error) {
      // Ignore storage access failures.
    }
    var currentUrl = new URL(window.location.href);
    window.location.assign(currentUrl.pathname + currentUrl.search + currentUrl.hash);
  }

  function syncCustomLanguageSelectorFromGoogle() {
    var customSelect = getCustomLanguageSelect();
    var hiddenSelect = document.querySelector(".goog-te-combo");
    if (!customSelect) {
      return;
    }
    if (!hiddenSelect) {
      customSelect.disabled = true;
      syncShowOriginalButton(SOURCE_LANGUAGE);
      return;
    }
    var optionMarkup = [];
    optionMarkup.push('<option value="' + SOURCE_LANGUAGE + '">Original - English</option>');
    Array.prototype.slice.call(hiddenSelect.options || []).forEach(function (optionNode) {
      var optionValue = String(optionNode.value || "").trim().toLowerCase();
      var optionLabel = String(optionNode.textContent || optionNode.innerText || "").trim();
      if (!optionValue || optionValue === SOURCE_LANGUAGE) {
        return;
      }
      optionMarkup.push(
        '<option value="' + optionValue.replace(/"/g, "&quot;") + '" translate="no">' +
        optionLabel.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") +
        '</option>'
      );
    });
    if (customSelect.getAttribute("data-options-signature") !== optionMarkup.join("|")) {
      customSelect.innerHTML = optionMarkup.join("");
      customSelect.setAttribute("data-options-signature", optionMarkup.join("|"));
    }
    customSelect.disabled = false;
    var selectedLanguage = getWidgetLanguage() || SOURCE_LANGUAGE;
    if (customSelect.value !== selectedLanguage) {
      customSelect.value = selectedLanguage;
    }
    syncShowOriginalButton(selectedLanguage);
  }

  function applyCustomLanguageSelection(nextLanguage) {
    var hiddenSelect = document.querySelector(".goog-te-combo");
    var normalizedLanguage = String(nextLanguage || SOURCE_LANGUAGE).trim().toLowerCase() || SOURCE_LANGUAGE;
    if (
      pdfExportController.activePromise &&
      normalizedLanguage !== (pdfExportController.activeLanguage || SOURCE_LANGUAGE)
    ) {
      return;
    }
    if (normalizedLanguage === SOURCE_LANGUAGE) {
      if (hiddenSelect && Array.prototype.slice.call(hiddenSelect.options || []).some(function (optionNode) {
        return String(optionNode.value || "").trim().toLowerCase() === SOURCE_LANGUAGE;
      })) {
        hiddenSelect.value = SOURCE_LANGUAGE;
        hiddenSelect.dispatchEvent(new Event("change", { bubbles: true }));
        hiddenSelect.dispatchEvent(new Event("input", { bubbles: true }));
        syncShowOriginalButton(SOURCE_LANGUAGE);
        return;
      }
      resetToSourceLanguage();
      return;
    }
    if (!hiddenSelect) {
      return;
    }
    hiddenSelect.value = normalizedLanguage;
    hiddenSelect.dispatchEvent(new Event("change", { bubbles: true }));
    hiddenSelect.dispatchEvent(new Event("input", { bubbles: true }));
    syncShowOriginalButton(normalizedLanguage);
  }

  function getInstructionBlockMapModels() {
    if (instructionBlockMapModels) {
      return instructionBlockMapModels;
    }
    var dataNode = document.getElementById("pi-instruction-block-maps-data");
    if (!dataNode) {
      instructionBlockMapModels = [];
      return instructionBlockMapModels;
    }
    try {
      var parsed = JSON.parse(dataNode.textContent || "[]");
      instructionBlockMapModels = Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      instructionBlockMapModels = [];
    }
    return instructionBlockMapModels;
  }

  function createInstructionBlockMapShell(mapModel) {
    if (!mapModel || !mapModel.embed_url) {
      return null;
    }
    var shell = document.createElement("div");
    shell.className = "pi-instruction-map-shell notranslate";
    shell.setAttribute("translate", "no");
    shell.setAttribute("data-guide-block-map", "");
    shell.setAttribute("data-guide-block-map-embed-url", mapModel.embed_url || "");
    shell.setAttribute("data-guide-block-map-latitude", mapModel.latitude != null ? String(mapModel.latitude) : "");
    shell.setAttribute("data-guide-block-map-longitude", mapModel.longitude != null ? String(mapModel.longitude) : "");
    shell.setAttribute("data-guide-block-map-center-latitude", mapModel.center_latitude != null ? String(mapModel.center_latitude) : "");
    shell.setAttribute("data-guide-block-map-center-longitude", mapModel.center_longitude != null ? String(mapModel.center_longitude) : "");
    shell.setAttribute("data-guide-block-map-marker-latitude", mapModel.marker_latitude != null ? String(mapModel.marker_latitude) : "");
    shell.setAttribute("data-guide-block-map-marker-longitude", mapModel.marker_longitude != null ? String(mapModel.marker_longitude) : "");
    shell.setAttribute("data-guide-block-map-coordinate-source", mapModel.coordinate_source || "");
    shell.setAttribute("data-guide-block-map-zoom", mapModel.zoom != null ? String(mapModel.zoom) : "");
    shell.setAttribute("data-guide-block-map-external-url", mapModel.external_url || "");
    shell.setAttribute("data-guide-block-map-attribution", mapModel.attribution || "© OpenStreetMap contributors");

    var iframe = document.createElement("iframe");
    iframe.className = "pi-instruction-map";
    iframe.src = mapModel.embed_url;
    iframe.loading = "lazy";
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = "no-referrer-when-downgrade";
    iframe.title = String(mapModel.title || "Map");
    iframe.setAttribute("translate", "no");
    shell.appendChild(iframe);

    return shell;
  }

  function createInstructionBlockMapLink(mapModel) {
    if (!mapModel || !mapModel.external_url) {
      return null;
    }
    var linkWrap = document.createElement("div");
    linkWrap.className = "pi-link";
    var link = document.createElement("a");
    link.href = mapModel.external_url;
    link.target = "_blank";
    link.rel = "noopener noreferrer nofollow";
    link.setAttribute("data-pdf-block-field", "link_label");
    link.setAttribute("data-guide-block-link", "");
    link.setAttribute("data-guide-signature", "");
    link.setAttribute("data-guide-translation-kind", "translatable");
    link.textContent = String(mapModel.link_label || "Open in Google Maps");
    linkWrap.appendChild(link);
    return linkWrap;
  }

  function hydrateInstructionBlockMaps() {
    getInstructionBlockMapModels().forEach(function (mapModel) {
      if (!mapModel || !mapModel.name) {
        return;
      }
      var blockNode = document.querySelector('[data-guide-block-id="' + CSS.escape(String(mapModel.name)) + '"]');
      if (!blockNode) {
        return;
      }
      if (!blockNode.querySelector("[data-guide-block-map]")) {
        var mapShell = createInstructionBlockMapShell(mapModel);
        if (mapShell) {
          var existingLinkWrap = blockNode.querySelector(".pi-link");
          if (existingLinkWrap) {
            blockNode.insertBefore(mapShell, existingLinkWrap);
          } else {
            blockNode.appendChild(mapShell);
          }
        }
      }
      if (mapModel.external_url && !blockNode.querySelector(".pi-link")) {
        var linkWrap = createInstructionBlockMapLink(mapModel);
        if (linkWrap) {
          blockNode.appendChild(linkWrap);
        }
      }
    });
  }

  function scheduleStickyToolbarOffsetSync() {
    if (translationState.stickyToolbarOffsetFrame) {
      return;
    }
    translationState.stickyToolbarOffsetFrame = window.requestAnimationFrame(function () {
      translationState.stickyToolbarOffsetFrame = 0;
      syncStickyToolbarOffset();
    });
  }

  function syncStickyToolbarOffset() {
    var shell = document.querySelector(".pi-shell");
    var toolbar = document.querySelector("[data-guide-toolbar]");
    if (!shell || !toolbar) {
      return;
    }
    var toolbarRect = toolbar.getBoundingClientRect();
    var computedToolbarStyle = window.getComputedStyle(toolbar);
    var stickyTop = parseFloat(computedToolbarStyle.top || "0") || 0;
    var toolbarBottomOffset = Math.max(0, Math.ceil(stickyTop + toolbarRect.height));
    shell.style.setProperty("--pi-toolbar-bottom-offset", toolbarBottomOffset + "px");
    window.__propertyInstructionStickyDiagnostics = window.__propertyInstructionStickyDiagnostics || {};
    window.__propertyInstructionStickyDiagnostics.toolbarBottomOffset = toolbarBottomOffset;
    window.__propertyInstructionStickyDiagnostics.toolbarHeight = Math.ceil(toolbarRect.height);
    window.__propertyInstructionStickyDiagnostics.toolbarTop = stickyTop;
    scheduleActiveSectionNavigationSync();
  }

  function ensureStickyToolbarObservers() {
    if (translationState.stickyToolbarObserversBound) {
      return;
    }
    translationState.stickyToolbarObserversBound = true;
    var toolbar = document.querySelector("[data-guide-toolbar]");
    if (!toolbar) {
      return;
    }
    if (window.ResizeObserver) {
      translationState.stickyToolbarResizeObserver = new ResizeObserver(function () {
        scheduleStickyToolbarOffsetSync();
      });
      translationState.stickyToolbarResizeObserver.observe(toolbar);
    }
    window.addEventListener("resize", scheduleStickyToolbarOffsetSync, { passive: true });
    scheduleStickyToolbarOffsetSync();
  }

  function getStickyGapPx() {
    var shell = document.querySelector(".pi-shell");
    var gapValue = shell ? window.getComputedStyle(shell).getPropertyValue("--pi-sticky-gap") : "";
    return parseFloat(gapValue || "0") || 0;
  }

  function getGuideActivationY() {
    var toolbar = document.querySelector("[data-guide-toolbar]");
    if (!toolbar) {
      return 0;
    }
    return Math.max(0, toolbar.getBoundingClientRect().bottom + getStickyGapPx());
  }

  function getActiveGuideSectionId(sectionNodes, activationY, atDocumentBottom) {
    if (!sectionNodes || !sectionNodes.length) {
      return "";
    }
    if (atDocumentBottom) {
      return String(
        sectionNodes[sectionNodes.length - 1].getAttribute("id")
        || sectionNodes[sectionNodes.length - 1].getAttribute("data-guide-section-anchor")
        || ""
      );
    }
    var activeId = String(sectionNodes[0].getAttribute("id") || sectionNodes[0].getAttribute("data-guide-section-anchor") || "");
    sectionNodes.forEach(function (sectionNode) {
      var rect = sectionNode.getBoundingClientRect();
      if (rect.top <= activationY) {
        activeId = String(sectionNode.getAttribute("id") || sectionNode.getAttribute("data-guide-section-anchor") || activeId);
      }
    });
    return activeId;
  }

  function syncActiveSectionNavigation() {
    translationState.activeSectionNavFrame = 0;
    if (window.innerWidth <= 768) {
      return;
    }
    var sectionNodes = Array.prototype.slice.call(document.querySelectorAll("[data-guide-section]"));
    var navLinks = Array.prototype.slice.call(document.querySelectorAll(".pi-nav a[href^='#']"));
    if (!sectionNodes.length || !navLinks.length) {
      return;
    }
    var atDocumentBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
    var activeId = getActiveGuideSectionId(sectionNodes, getGuideActivationY(), atDocumentBottom);
    navLinks.forEach(function (linkNode) {
      if (String(linkNode.getAttribute("href") || "") === "#" + activeId) {
        linkNode.setAttribute("aria-current", "location");
      } else {
        linkNode.removeAttribute("aria-current");
      }
    });
  }

  function scheduleActiveSectionNavigationSync() {
    if (translationState.activeSectionNavFrame) {
      return;
    }
    translationState.activeSectionNavFrame = window.requestAnimationFrame(syncActiveSectionNavigation);
  }

  function ensureSectionNavObserver() {
    if (translationState.sectionNavObserverBound) {
      return;
    }
    translationState.sectionNavObserverBound = true;
    window.addEventListener("scroll", scheduleActiveSectionNavigationSync, { passive: true });
    window.addEventListener("resize", scheduleActiveSectionNavigationSync, { passive: true });
    window.addEventListener("hashchange", scheduleActiveSectionNavigationSync);
    scheduleActiveSectionNavigationSync();
  }

  function getGooglePresentationNodes() {
    return Array.prototype.slice.call(document.querySelectorAll(GOOGLE_PRESENTATION_SELECTORS.join(", "))).filter(function (node) {
      return !node.closest(".pi-google-translate-engine");
    });
  }

  function resetGoogleInjectedOffsets() {
    [
      document.body,
      document.documentElement,
      document.querySelector(".page-content-wrapper"),
      document.querySelector(".page_content"),
      document.querySelector(".pi-page")
    ].forEach(function (node) {
      if (!node || !node.style) {
        return;
      }
      node.style.setProperty("top", "0px", "important");
      node.style.setProperty("margin-top", "0px", "important");
      node.style.setProperty("transform", "none", "important");
    });
  }

  function scheduleGoogleUiHide() {
    if (translationState.googleUiEnforceScheduled) {
      return;
    }
    translationState.googleUiEnforceScheduled = true;
    window.requestAnimationFrame(function () {
      translationState.googleUiEnforceScheduled = false;
      enforceGoogleUiHidden();
    });
  }

  function enforceGoogleUiHidden() {
    resetGoogleInjectedOffsets();
    var matchedSelectors = [];
    getGooglePresentationNodes().forEach(function (node) {
      if (node && node.style) {
        node.style.setProperty("display", "none", "important");
        node.style.setProperty("visibility", "hidden", "important");
        node.style.setProperty("height", "0px", "important");
        node.style.setProperty("max-height", "0px", "important");
        node.style.setProperty("margin", "0px", "important");
        node.style.setProperty("padding", "0px", "important");
        node.setAttribute("aria-hidden", "true");
        matchedSelectors.push(node.className || node.id || node.tagName.toLowerCase());
      }
    });
    window.__propertyInstructionGoogleUiDiagnostics = {
      matchedSelectors: matchedSelectors,
      bodyTop: document.body && document.body.style ? document.body.style.getPropertyValue("top") : "",
      bodyMarginTop: document.body && document.body.style ? document.body.style.getPropertyValue("margin-top") : "",
      htmlTop: document.documentElement && document.documentElement.style ? document.documentElement.style.getPropertyValue("top") : "",
      htmlMarginTop: document.documentElement && document.documentElement.style ? document.documentElement.style.getPropertyValue("margin-top") : "",
      computedBodyTop: window.getComputedStyle(document.body).top,
      computedHtmlTop: window.getComputedStyle(document.documentElement).top
    };
  }

  function isRtlLanguage(languageCode) {
    return RTL_LANGUAGE_PREFIXES.some(function (prefix) {
      return languageCode === prefix || languageCode.indexOf(prefix + "-") === 0;
    });
  }

  function getGuideDirection(languageCode) {
    var guideRoot = getGuideRoot();
    if (guideRoot) {
      var explicitDirection = String(guideRoot.getAttribute("dir") || "").trim().toLowerCase();
      if (explicitDirection === "rtl" || explicitDirection === "ltr") {
        return explicitDirection;
      }
      var computedDirection = window.getComputedStyle(guideRoot).direction;
      if (computedDirection === "rtl") {
        return computedDirection;
      }
    }
    return isRtlLanguage(languageCode) ? "rtl" : "ltr";
  }

  function getGuideField(fieldName) {
    return document.querySelector("[data-guide-field='" + fieldName + "']");
  }

  function getFieldWithLabel(fieldName) {
    var valueElement = getGuideField(fieldName);
    if (!valueElement) {
      return null;
    }
    var fieldContainer = valueElement.closest(".pi-meta-item, .pi-copy-row, .pi-address-row") || valueElement.parentElement;
    var labelElement = fieldContainer ? fieldContainer.querySelector(".pi-label") : null;
    return {
      labelNodeId: getSemanticNodeId(labelElement),
      valueNodeId: getSemanticNodeId(valueElement),
      label: getVisibleText(labelElement),
      value: getVisibleText(valueElement)
    };
  }

  function markExportNodeNotranslate(node) {
    if (!node) {
      return node;
    }
    node.classList.add("notranslate");
    node.setAttribute("translate", "no");
    return node;
  }

  function normalizeHref(rawHref) {
    if (!rawHref) {
      return "";
    }

    try {
      var parsed = new URL(rawHref, window.location.origin);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        return parsed.toString();
      }
    } catch (error) {
      return "";
    }

    return "";
  }

  function getGuideRootDataAttribute(attributeName) {
    var guideRoot = getGuideRoot();
    if (!guideRoot) {
      return "";
    }
    return String(guideRoot.getAttribute(attributeName) || "").trim();
  }

  function getGuideRootBooleanAttribute(attributeName) {
    return getGuideRootDataAttribute(attributeName) === "1";
  }

  function isDataUrl(value) {
    return String(value || "").trim().toLowerCase().indexOf("data:") === 0;
  }

  function isSameOriginUrl(rawUrl) {
    if (!rawUrl) {
      return false;
    }
    try {
      return new URL(rawUrl, window.location.origin).origin === window.location.origin;
    } catch (error) {
      return false;
    }
  }

  function resolveExportImageUrl(sourceUrl) {
    var rawUrl = String(sourceUrl || "").trim();
    if (!rawUrl) {
      return "";
    }
    if (isDataUrl(rawUrl)) {
      return rawUrl;
    }

    var absoluteUrl = new URL(rawUrl, window.location.origin);
    if (
      absoluteUrl.origin === window.location.origin &&
      absoluteUrl.pathname === PUBLIC_PDF_IMAGE_ENDPOINT
    ) {
      return absoluteUrl.toString();
    }

    var proxyUrl = new URL(PUBLIC_PDF_IMAGE_ENDPOINT, window.location.origin);
    proxyUrl.searchParams.set("url", absoluteUrl.toString());
    return proxyUrl.toString();
  }

  function getSemanticNodeId(element) {
    if (!element) {
      return "";
    }
    if (element.hasAttribute("data-guide-kicker")) {
      return "guide:kicker";
    }
    if (element.hasAttribute("data-guide-empty-state")) {
      return "guide:empty";
    }
    if (element.hasAttribute("data-guide-label")) {
      return "label:" + element.getAttribute("data-guide-label");
    }
    if (element.hasAttribute("data-guide-field")) {
      return "field:" + element.getAttribute("data-guide-field");
    }
    if (element.hasAttribute("data-guide-map-title")) {
      return "map:title";
    }
    if (element.hasAttribute("data-guide-map-link")) {
      return "map:link_label";
    }
    if (element.hasAttribute("data-guide-section-title")) {
      var section = element.closest("[data-guide-section]");
      return "section:" + (section ? section.getAttribute("data-guide-section-anchor") || "" : "") + ":title";
    }
    if (element.hasAttribute("data-guide-block-title")) {
      var blockForTitle = element.closest("[data-guide-block]");
      return "block:" + (blockForTitle ? blockForTitle.getAttribute("data-guide-block-id") || "" : "") + ":title";
    }
    if (element.hasAttribute("data-guide-block-body")) {
      var blockForBody = element.closest("[data-guide-block]");
      return "block:" + (blockForBody ? blockForBody.getAttribute("data-guide-block-id") || "" : "") + ":body";
    }
    if (element.hasAttribute("data-guide-block-caption")) {
      var blockForCaption = element.closest("[data-guide-block]");
      return "block:" + (blockForCaption ? blockForCaption.getAttribute("data-guide-block-id") || "" : "") + ":caption";
    }
    if (element.hasAttribute("data-guide-block-link")) {
      var blockForLink = element.closest("[data-guide-block]");
      return "block:" + (blockForLink ? blockForLink.getAttribute("data-guide-block-id") || "" : "") + ":link_label";
    }
    return "";
  }

  function collectStructuredContentLinks(structuredContent, sourceNodeId, links, blockId) {
    (structuredContent || []).forEach(function (item) {
      if (item.type === "paragraph") {
        collectStructuredInlineLinks(item.content || [], sourceNodeId, links, blockId);
      } else if (item.type === "list") {
        (item.items || []).forEach(function (listItem) {
          collectStructuredInlineLinks(listItem || [], sourceNodeId, links, blockId);
        });
      }
    });
  }

  function collectStructuredInlineLinks(inlineContent, sourceNodeId, links, blockId) {
    (inlineContent || []).forEach(function (part) {
      if (!part) {
        return;
      }
      if (part.type === "link") {
        var href = normalizeHref(part.href || "");
        if (href) {
          links.push({
            href: href,
            label: normalizeText(flattenStructuredInlineContent(part.content || [])) || href,
            sourceNodeId: sourceNodeId || "",
            blockId: blockId || ""
          });
        }
      }
      if (part.content) {
        collectStructuredInlineLinks(part.content, sourceNodeId, links, blockId);
      }
    });
  }

  function dedupeGuideLinks(links) {
    var uniqueLinks = [];
    var seen = {};
    (links || []).forEach(function (linkEntry) {
      if (!linkEntry || !linkEntry.href) {
        return;
      }
      var href = normalizeHref(linkEntry.href);
      if (!href || seen[href]) {
        return;
      }
      seen[href] = true;
      uniqueLinks.push({
        href: href,
        label: normalizeText(linkEntry.label || "") || href,
        sourceNodeId: linkEntry.sourceNodeId || "",
        blockId: linkEntry.blockId || "",
        kind: linkEntry.kind || "external"
      });
    });
    return uniqueLinks;
  }

  function escapeWifiQrValue(value) {
    return String(value || "").replace(/([\\\\;,:"])/g, "\\$1");
  }

  function buildWifiQrPayload(model) {
    if (!model || !model.showWifiQr || !model.wifiName || !model.wifiName.value) {
      return null;
    }
    var securityType = String(model.wifiSecurityType || "WPA").trim().toUpperCase();
    var ssid = String(model.wifiName.value || "");
    var password = model.wifiPassword && model.wifiPassword.value ? String(model.wifiPassword.value) : "";
    var hidden = !!model.wifiHiddenNetwork;
    if ((securityType === "WPA" || securityType === "WEP") && !password) {
      return null;
    }
    if (securityType === "OPEN") {
      return "WIFI:T:nopass;S:" + escapeWifiQrValue(ssid) + ";H:" + (hidden ? "true" : "false") + ";;";
    }
    return "WIFI:T:" + securityType + ";S:" + escapeWifiQrValue(ssid) + ";P:" + escapeWifiQrValue(password) + ";H:" + (hidden ? "true" : "false") + ";;";
  }

  function createQrPngDataUri(payload) {
    var qrCode = window.qrcodegen.QrCode.encodeText(payload, window.qrcodegen.QrCode.Ecc.MEDIUM);
    var border = PDF_QR_MODULE_BORDER;
    var moduleCount = qrCode.size + border * 2;
    var targetPixels = 384;
    var moduleScale = Math.max(1, Math.floor(targetPixels / moduleCount));
    var size = moduleCount * moduleScale;
    var canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    var context = canvas.getContext("2d", { alpha: false });
    if (!context) {
      throw new Error("QR canvas unavailable");
    }
    context.imageSmoothingEnabled = false;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, size, size);
    context.fillStyle = "#000000";
    for (var y = 0; y < qrCode.size; y += 1) {
      for (var x = 0; x < qrCode.size; x += 1) {
        if (qrCode.getModule(x, y)) {
          context.fillRect(
            (x + border) * moduleScale,
            (y + border) * moduleScale,
            moduleScale,
            moduleScale
          );
        }
      }
    }
    return canvas.toDataURL("image/png");
  }

  function getOrCreateQrImageDataUri(payload, qrImageCache) {
    var cacheKey = hashString(payload);
    if (!qrImageCache.has(cacheKey)) {
      qrImageCache.set(cacheKey, createQrPngDataUri(payload));
    }
    return qrImageCache.get(cacheKey);
  }

  function getSemanticSourceNodes() {
    var guideScreen = getGuideScreen();
    if (!guideScreen) {
      return [];
    }
    return Array.prototype.slice.call(guideScreen.querySelectorAll("[data-guide-signature]")).filter(function (element) {
      return !!getSemanticNodeId(element);
    });
  }

  function getTranslationKind(element) {
    if (!element) {
      return "translatable";
    }
    return String(element.getAttribute("data-guide-translation-kind") || "translatable").trim().toLowerCase() || "translatable";
  }

  function getSemanticNodeMeta(element) {
    var allowIdenticalLanguages = [];
    if (element) {
      allowIdenticalLanguages = String(element.getAttribute("data-guide-allow-identical-languages") || "")
        .split(",")
        .map(function (languageCode) {
          return String(languageCode || "").trim().toLowerCase();
        })
        .filter(function (languageCode) {
          return !!languageCode;
        });
    }
    return {
      kind: getTranslationKind(element),
      allowIdentical: element ? element.getAttribute("data-guide-allow-identical") === "1" : false,
      allowIdenticalLanguages: allowIdenticalLanguages
    };
  }

  function redactSensitiveValue(nodeId, value) {
    if (!nodeId) {
      return value;
    }
    if (nodeId.indexOf("field:") === 0) {
      var fieldName = nodeId.slice(6);
      if (PROTECTED_GUIDE_FIELDS[fieldName]) {
        return "[redacted]";
      }
    }
    return value;
  }

  function getSnapshotValueForNode(element) {
    if (!element) {
      return "";
    }
    if (element.hasAttribute("data-guide-block-body")) {
      return flattenStructuredContent(extractStructuredContent(element));
    }
    return getVisibleText(element);
  }

  function captureSemanticSnapshot(options) {
    var settings = options || {};
    var guideScreen = getGuideScreen();
    if (!guideScreen) {
      throw new Error("Guide content unavailable");
    }

    var nodeMap = {};
    var nodeMeta = {};
    var orderedNodeIds = [];
    var duplicateNodeIds = [];
    getSemanticSourceNodes().forEach(function (element) {
      var nodeId = getSemanticNodeId(element);
      var value = getSnapshotValueForNode(element);
      var meta = getSemanticNodeMeta(element);
      if (!value && meta.kind === "translatable") {
        meta.kind = "optional_empty";
      }
      if (nodeMap.hasOwnProperty(nodeId)) {
        duplicateNodeIds.push(nodeId);
      }
      nodeMap[nodeId] = settings.redactProtectedValues ? redactSensitiveValue(nodeId, value) : value;
      nodeMeta[nodeId] = meta;
      orderedNodeIds.push(nodeId);
    });

    return {
      languageCode: getGuideLanguage(),
      direction: getGuideDirection(getGuideLanguage()),
      sections: guideScreen.querySelectorAll("[data-guide-section]").length,
      blocks: guideScreen.querySelectorAll("[data-guide-block]").length,
      nodeCount: orderedNodeIds.length,
      orderedNodeIds: orderedNodeIds,
      nodeMap: nodeMap,
      nodeMeta: nodeMeta,
      duplicateNodeIds: duplicateNodeIds
    };
  }

  function snapshotsEqual(leftSnapshot, rightSnapshot) {
    if (!leftSnapshot || !rightSnapshot) {
      return false;
    }
    if (
      leftSnapshot.languageCode !== rightSnapshot.languageCode ||
      leftSnapshot.direction !== rightSnapshot.direction ||
      leftSnapshot.sections !== rightSnapshot.sections ||
      leftSnapshot.blocks !== rightSnapshot.blocks ||
      leftSnapshot.nodeCount !== rightSnapshot.nodeCount
    ) {
      return false;
    }
    for (var index = 0; index < leftSnapshot.orderedNodeIds.length; index += 1) {
      var nodeId = leftSnapshot.orderedNodeIds[index];
      if (nodeId !== rightSnapshot.orderedNodeIds[index]) {
        return false;
      }
      if ((leftSnapshot.nodeMap[nodeId] || "") !== (rightSnapshot.nodeMap[nodeId] || "")) {
        return false;
      }
    }
    return true;
  }

  function getSnapshotHash(snapshot) {
    if (!snapshot) {
      return "";
    }
    return hashString(JSON.stringify({
      languageCode: snapshot.languageCode,
      direction: snapshot.direction,
      sections: snapshot.sections,
      blocks: snapshot.blocks,
      orderedNodeIds: snapshot.orderedNodeIds,
      nodeMap: snapshot.nodeMap
    }));
  }

  function getGuideIdentity(downloadButton) {
    var buttonIdentity = downloadButton ? String(downloadButton.getAttribute("data-guide-identity") || "").trim() : "";
    if (buttonIdentity) {
      return buttonIdentity;
    }
    var guideRoot = getGuideRoot();
    return String((guideRoot && guideRoot.getAttribute("data-guide-identity")) || window.location.pathname || "property-instruction").trim();
  }

  function getPreparedStateKey(guideIdentity, languageCode, generation, snapshotHash) {
    return [
      guideIdentity || "property-instruction",
      languageCode || SOURCE_LANGUAGE,
      String(generation || 0),
      snapshotHash || "",
      PDF_LAYOUT_VERSION
    ].join("::");
  }

  function redactSnapshot(snapshot) {
    if (!snapshot) {
      return null;
    }
    var redactedMap = {};
    var redactedMeta = {};
    snapshot.orderedNodeIds.forEach(function (nodeId) {
      redactedMap[nodeId] = redactSensitiveValue(nodeId, snapshot.nodeMap[nodeId] || "");
      redactedMeta[nodeId] = Object.assign({}, snapshot.nodeMeta[nodeId] || {});
    });
    return {
      languageCode: snapshot.languageCode,
      direction: snapshot.direction,
      sections: snapshot.sections,
      blocks: snapshot.blocks,
      nodeCount: snapshot.nodeCount,
      orderedNodeIds: snapshot.orderedNodeIds.slice(),
      nodeMap: redactedMap,
      nodeMeta: redactedMeta,
      duplicateNodeIds: (snapshot.duplicateNodeIds || []).slice()
    };
  }

  function redactNodeMap(nodeMap) {
    var redactedMap = {};
    Object.keys(nodeMap || {}).forEach(function (nodeId) {
      redactedMap[nodeId] = redactSensitiveValue(nodeId, nodeMap[nodeId] || "");
    });
    return redactedMap;
  }

  function summarizeNodeMapDiff(actualMap, expectedMap) {
    var mismatches = [];
    Object.keys(expectedMap || {}).forEach(function (nodeId) {
      var actualValue = normalizeText((actualMap && actualMap[nodeId]) || "");
      var expectedValue = normalizeText(expectedMap[nodeId] || "");
      if (actualValue !== expectedValue) {
        mismatches.push({
          nodeId: nodeId,
          expectedLength: expectedValue.length,
          actualLength: actualValue.length
        });
      }
    });
    return mismatches;
  }

  function getSnapshotProgressFingerprint(snapshot, snapshotAnalysis) {
    if (!snapshot || !snapshotAnalysis) {
      return "";
    }

    var changedValues = snapshotAnalysis.changedTranslatableNodeIds.map(function (nodeId) {
      return nodeId + "=" + String(snapshot.nodeMap[nodeId] || "");
    });

    return JSON.stringify({
      changedValues: changedValues,
      unexpectedUnchangedNodeIds: snapshotAnalysis.unexpectedUnchangedTranslatableNodeIds.slice(),
      missingRequiredNodeIds: snapshotAnalysis.missingRequiredNodeIds.slice()
    });
  }

  function updateTranslationDiagnostics(patch) {
    translationState.diagnostics = Object.assign({}, translationState.diagnostics || {}, patch || {});
    window.__propertyInstructionTranslationDiagnostics = translationState.diagnostics;
  }

  function initializeTranslationDiagnostics() {
    translationState.diagnostics = {
      generation: translationState.generation,
      selectedLanguage: translationState.requestedLanguage || getGuideLanguage() || SOURCE_LANGUAGE,
      originalSnapshot: translationState.originalSnapshot ? redactSnapshot(translationState.originalSnapshot) : null,
      settledSnapshot: null,
      finalSnapshot: null,
      baselineCapturedAt: translationState.baselineCapturedAt,
      widgetScriptRequestedAt: translationState.widgetScriptRequestedAt || Number(window.__propertyInstructionGoogleScriptRequestedAt || 0) || 0,
      firstTranslationMutationAt: translationState.firstMutationAt,
      totalSemanticNodes: 0,
      expectedTranslatableNodeCount: 0,
      changedTranslatableNodeCount: 0,
      intentionallyUnchangedNodeCount: 0,
      unexpectedUnchangedTranslatableNodeCount: 0,
      missingRequiredNodeCount: 0,
      changedTranslatableNodeIds: [],
      intentionallyUnchangedNodeIds: [],
      unexpectedUnchangedTranslatableNodeIds: [],
      missingRequiredNodeIds: [],
      duplicateNodeIds: [],
      unexpectedNodeIds: [],
      orderMismatchNodeIds: [],
      mutationTimestamps: [],
      stablePassTimestamps: [],
      progressObservations: [],
      sectionReadiness: {},
      parityMismatches: [],
      exportParityMap: {},
      abortReason: "",
      abortCode: "",
      googleWidget: {
        scriptRequestedAt: translationState.widgetScriptRequestedAt || Number(window.__propertyInstructionGoogleScriptRequestedAt || 0) || 0,
        scriptLoadedAt: 0,
        scriptErrorAt: 0,
        callbackInvokedAt: 0,
        elementConstructedAt: 0,
        containerPopulatedAt: 0,
        selectAppearedAt: 0,
        optionCount: 0,
        requestedLanguageAvailable: false,
        selectedValue: "",
        firstTranslationMutationAt: translationState.firstMutationAt,
        firstChangedNodeAt: 0,
        lastSemanticProgressAt: 0
      }
    };
    window.__propertyInstructionTranslationDiagnostics = translationState.diagnostics;
  }

  function setTranslationAbortReason(reason, code) {
    updateTranslationDiagnostics({
      abortReason: reason,
      abortCode: code || ""
    });
  }

  function invalidatePreparedPdfArtifacts() {
    translationState.preparationPromise = null;
    translationState.preparationKey = "";
    pdfPreparationState.preparedState = null;
    pdfPreparationState.warmupPromise = null;
    pdfPreparationState.artifactCache = {};
    clearReadyPdfObjectUrl();
    window.__propertyInstructionLastPdfBlob = null;
    window.__propertyInstructionLastPdfLanguage = "";
  }

  function clearTranslationReadyState() {
    translationState.readyLanguage = "";
    translationState.readySnapshot = null;
    translationState.sectionReadiness = {};
    translationState.stablePassTimestamps = [];
    translationState.stableGeneration = 0;
    translationState.readyAt = 0;
    invalidatePreparedPdfArtifacts();
  }

  function resetTranslationGeneration(nextLanguage) {
    translationState.generation += 1;
    translationState.requestedLanguage = nextLanguage || SOURCE_LANGUAGE;
    translationState.lastLanguageSelectedAt = Date.now();
    clearTranslationReadyState();
    translationState.lastMutationAt = Date.now();
    initializeTranslationDiagnostics();
    schedulePdfPreparationWarmup(document.querySelector(".pi-pdf-download"));
  }

  function syncTranslationLanguageState() {
    var widgetLanguage = getWidgetLanguage();
    var currentLanguage = widgetLanguage || translationState.requestedLanguage || SOURCE_LANGUAGE;
    var widgetState = getGoogleWidgetState();
    var widgetSelect = document.querySelector(".goog-te-combo");
    var widgetOptions = widgetSelect ? Array.prototype.slice.call(widgetSelect.options || []) : [];
    var selectAppearedAt = widgetSelect ? (translationState.selectAppearedAt || Date.now()) : 0;
    if (widgetSelect && !translationState.selectAppearedAt) {
      translationState.selectAppearedAt = selectAppearedAt;
    }
    var container = getGoogleTranslateEngineContainer();
    if (container && container.children.length && !translationState.widgetContainerPopulatedAt) {
      translationState.widgetContainerPopulatedAt = Date.now();
    }
    if (!translationState.requestedLanguage) {
      translationState.requestedLanguage = SOURCE_LANGUAGE;
    }
    if (
      widgetLanguage &&
      currentLanguage !== translationState.requestedLanguage &&
      !(
        currentLanguage === SOURCE_LANGUAGE &&
        translationState.requestedLanguage &&
        translationState.requestedLanguage !== SOURCE_LANGUAGE
      )
    ) {
      resetTranslationGeneration(currentLanguage);
    }
    updateTranslationDiagnostics({
      selectedLanguage: translationState.requestedLanguage || SOURCE_LANGUAGE,
      widgetScriptRequestedAt: translationState.widgetScriptRequestedAt || Number(window.__propertyInstructionGoogleScriptRequestedAt || 0) || 0,
      firstTranslationMutationAt: translationState.firstMutationAt,
      googleWidget: {
        scriptRequestedAt: translationState.widgetScriptRequestedAt || Number(window.__propertyInstructionGoogleScriptRequestedAt || 0) || 0,
        scriptLoadedAt: Number(widgetState.scriptLoadedAt || 0) || 0,
        scriptErrorAt: Number(widgetState.scriptErrorAt || 0) || 0,
        callbackInvokedAt: Number(widgetState.callbackInvokedAt || 0) || 0,
        elementConstructedAt: Number(widgetState.elementConstructedAt || 0) || 0,
        containerPopulatedAt: Number(translationState.widgetContainerPopulatedAt || 0) || 0,
        selectAppearedAt: Number(translationState.selectAppearedAt || 0) || 0,
        optionCount: widgetOptions.length,
        requestedLanguageAvailable: !translationState.requestedLanguage || translationState.requestedLanguage === SOURCE_LANGUAGE || widgetOptions.some(function (option) {
          return String(option.value || "").trim().toLowerCase() === translationState.requestedLanguage;
        }),
        selectedValue: widgetLanguage,
        firstTranslationMutationAt: translationState.firstMutationAt,
        firstChangedNodeAt: Number(translationState.firstChangedNodeAt || 0) || 0,
        lastSemanticProgressAt: Number(translationState.lastSemanticProgressAt || 0) || 0
      }
    });
    syncCustomLanguageSelectorFromGoogle();
    syncShowOriginalButton(translationState.requestedLanguage || SOURCE_LANGUAGE);
    scheduleStickyToolbarOffsetSync();
    enforceGoogleUiHidden();
    return translationState.requestedLanguage || SOURCE_LANGUAGE;
  }

  function ensureTranslationObservers() {
    if (translationState.guideObserverBound) {
      return;
    }
    var guideScreen = getGuideScreen();
    if (!guideScreen) {
      return;
    }

    var mutationObserver = new MutationObserver(function () {
      var timestamp = Date.now();
      translationState.lastMutationAt = timestamp;
      if (!translationState.firstMutationAt) {
        translationState.firstMutationAt = timestamp;
      }
      translationState.mutationTimestamps.push(timestamp);
      translationState.mutationTimestamps = translationState.mutationTimestamps.slice(-120);
      translationState.readySnapshot = null;
      translationState.readyLanguage = "";
      invalidatePreparedPdfArtifacts();
      syncTranslationLanguageState();
      updateTranslationDiagnostics({
        firstTranslationMutationAt: translationState.firstMutationAt,
        mutationTimestamps: translationState.mutationTimestamps.slice(-60)
      });
    });

    mutationObserver.observe(guideScreen, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["class", "style", "dir", "lang"]
    });

    document.addEventListener("change", function (event) {
      var customSelect = event.target.closest("[data-guide-language-select]");
      if (customSelect) {
        setTranslationStatus("");
        applyCustomLanguageSelection(customSelect.value || SOURCE_LANGUAGE);
        scheduleStickyToolbarOffsetSync();
        return;
      }
      var widgetSelect = event.target.closest(".goog-te-combo");
      if (!widgetSelect) {
        return;
      }
      var requestedLanguage = String(widgetSelect.value || "").trim().toLowerCase() || SOURCE_LANGUAGE;
      if (requestedLanguage !== (translationState.requestedLanguage || SOURCE_LANGUAGE)) {
        resetTranslationGeneration(requestedLanguage);
      }
    });

    var widgetObserver = new MutationObserver(function () {
      syncTranslationLanguageState();
      scheduleGoogleUiHide();
    });
    widgetObserver.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["value", "lang", "dir", "class"]
    });

    if (!translationState.googleUiObserverBound) {
      var googleUiObserver = new MutationObserver(function (mutations) {
        var shouldUpdate = mutations.some(function (mutation) {
          if (mutation.type === "attributes") {
            return mutation.target === document.body
              || mutation.target === document.documentElement
              || GOOGLE_PRESENTATION_SELECTORS.some(function (selector) {
                return mutation.target.matches && mutation.target.matches(selector);
              });
          }
          return Array.prototype.slice.call(mutation.addedNodes || []).some(function (node) {
            return node.nodeType === 1 && (
              GOOGLE_PRESENTATION_SELECTORS.some(function (selector) {
                return (node.matches && node.matches(selector)) || (node.querySelector && node.querySelector(selector));
              })
            );
          });
        });
        if (shouldUpdate) {
          scheduleGoogleUiHide();
        }
      });
      googleUiObserver.observe(document.documentElement, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ["style", "class"]
      });
      translationState.googleUiObserverBound = true;
    }

    translationState.guideObserverBound = true;
    setTranslationStatus("");
    scheduleGoogleUiHide();
  }

  function ensureOriginalSnapshotCaptured() {
    ensureTranslationObservers();
    if (!translationState.originalSnapshot) {
      translationState.widgetScriptRequestedAt = Number(window.__propertyInstructionGoogleScriptRequestedAt || 0) || 0;
      translationState.originalSnapshot = captureSemanticSnapshot();
      translationState.baselineCapturedAt = Date.now();
      translationState.requestedLanguage = SOURCE_LANGUAGE;
      initializeTranslationDiagnostics();
      updateTranslationDiagnostics({
        originalSnapshot: redactSnapshot(translationState.originalSnapshot),
        baselineCapturedAt: translationState.baselineCapturedAt,
        widgetScriptRequestedAt: translationState.widgetScriptRequestedAt
      });
    }
  }

  function sleep(durationMs) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, durationMs);
    });
  }

  async function exposeGuideSectionsForTranslation() {
    var guideScreen = getGuideScreen();
    if (!guideScreen) {
      return Promise.resolve();
    }
    var sections = Array.prototype.slice.call(guideScreen.querySelectorAll("[data-guide-section], [data-guide-block]"));
    var originalScrollX = window.scrollX;
    var originalScrollY = window.scrollY;
    var originalActiveElement = document.activeElement;

    async function restoreFocus() {
      if (originalActiveElement && typeof originalActiveElement.focus === "function") {
        try {
          originalActiveElement.focus({ preventScroll: true });
        } catch (error) {
          try {
            originalActiveElement.focus();
          } catch (focusError) {
            return null;
          }
        }
      }
      return null;
    }

    for (var index = 0; index < sections.length; index += 1) {
      var sectionNode = sections[index];
      var parentNode = sectionNode.parentNode;
      if (!parentNode) {
        continue;
      }
      var rect = sectionNode.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        continue;
      }
      var placeholder = document.createElement("div");
      placeholder.setAttribute("aria-hidden", "true");
      placeholder.style.width = rect.width + "px";
      placeholder.style.height = rect.height + "px";
      placeholder.style.margin = "0";
      placeholder.style.padding = "0";
      placeholder.style.border = "0";
      placeholder.style.visibility = "hidden";
      placeholder.style.pointerEvents = "none";
      parentNode.insertBefore(placeholder, sectionNode);

      var previousCssText = sectionNode.style.cssText;
      sectionNode.style.position = "fixed";
      sectionNode.style.left = "0";
      sectionNode.style.top = "0";
      sectionNode.style.width = rect.width + "px";
      sectionNode.style.maxWidth = rect.width + "px";
      sectionNode.style.maxHeight = Math.max(rect.height, 240) + "px";
      sectionNode.style.overflow = "visible";
      sectionNode.style.margin = "0";
      sectionNode.style.zIndex = "-1";
      sectionNode.style.opacity = "0.01";
      sectionNode.style.pointerEvents = "none";
      sectionNode.style.background = "#ffffff";

      await waitForTwoAnimationFrames();
      await sleep(240);

      var sectionStartedAt = Date.now();
      while (Date.now() - sectionStartedAt < 5000) {
        if (
          normalizeText(sectionNode.innerText || sectionNode.textContent || "").length &&
          Date.now() - translationState.lastMutationAt >= 900
        ) {
          break;
        }
        await sleep(220);
      }

      sectionNode.style.cssText = previousCssText;
      if (placeholder.parentNode) {
        placeholder.parentNode.removeChild(placeholder);
      }

      var readinessKey = sectionNode.getAttribute("data-guide-section-anchor") ||
        sectionNode.getAttribute("data-guide-block-id") ||
        "node-" + index;
      translationState.sectionReadiness[readinessKey] = {
        exposedAt: Date.now(),
        textLength: normalizeText(sectionNode.innerText || sectionNode.textContent || "").length,
        primedWithoutScroll: true
      };
      translationState.diagnostics.sectionReadiness = translationState.sectionReadiness;
      await restoreFocus();
      await waitForTwoAnimationFrames();
    }

    if (Math.abs(window.scrollX - originalScrollX) > 1 || Math.abs(window.scrollY - originalScrollY) > 1) {
      throw new Error("Guide translation priming changed the viewport");
    }

    await restoreFocus();
    return Promise.resolve();
  }

  function analyzeSnapshotState(currentSnapshot, originalSnapshot, expectedLanguage) {
    var analysis = {
      changedTranslatableNodeIds: [],
      intentionallyUnchangedNodes: [],
      unexpectedUnchangedTranslatableNodeIds: [],
      missingRequiredNodeIds: [],
      unexpectedNodeIds: [],
      duplicateNodeIds: (currentSnapshot.duplicateNodeIds || []).slice(),
      orderMismatchNodeIds: [],
      expectedTranslatableNodeIds: [],
      structureOk: true
    };

    if (!currentSnapshot || !originalSnapshot) {
      analysis.structureOk = false;
      return analysis;
    }

    var currentNodeSet = {};
    currentSnapshot.orderedNodeIds.forEach(function (nodeId) {
      currentNodeSet[nodeId] = true;
    });

    var originalOrder = originalSnapshot.orderedNodeIds;
    originalOrder.forEach(function (nodeId, index) {
      var meta = originalSnapshot.nodeMeta[nodeId] || {};
      var kind = meta.kind || "translatable";
      var originalValue = originalSnapshot.nodeMap[nodeId] || "";
      var currentValue = currentSnapshot.nodeMap[nodeId] || "";
      var currentIndex = currentSnapshot.orderedNodeIds.indexOf(nodeId);
      var allowIdenticalLanguages = Array.isArray(meta.allowIdenticalLanguages) ? meta.allowIdenticalLanguages : [];
      var allowsIdenticalForLanguage = expectedLanguage && allowIdenticalLanguages.indexOf(expectedLanguage) !== -1;

      if (currentIndex === -1) {
        analysis.missingRequiredNodeIds.push(nodeId);
        return;
      }
      if (currentIndex !== index) {
        analysis.orderMismatchNodeIds.push(nodeId);
      }
      if (kind === "translatable") {
        analysis.expectedTranslatableNodeIds.push(nodeId);
        if (currentValue !== originalValue) {
          analysis.changedTranslatableNodeIds.push(nodeId);
        } else if (meta.allowIdentical) {
          analysis.intentionallyUnchangedNodes.push({
            nodeId: nodeId,
            reason: "global-allow-identical"
          });
        } else if (allowsIdenticalForLanguage) {
          analysis.intentionallyUnchangedNodes.push({
            nodeId: nodeId,
            reason: "language-specific-identical",
            language: expectedLanguage
          });
        } else {
          analysis.unexpectedUnchangedTranslatableNodeIds.push(nodeId);
        }
      } else {
        analysis.intentionallyUnchangedNodes.push({
          nodeId: nodeId,
          reason: "non-translatable-kind",
          kind: kind
        });
      }
      if (originalValue && !currentValue) {
        analysis.missingRequiredNodeIds.push(nodeId);
      }
    });

    currentSnapshot.orderedNodeIds.forEach(function (nodeId) {
      if (!originalSnapshot.nodeMeta[nodeId]) {
        analysis.unexpectedNodeIds.push(nodeId);
      }
    });

    analysis.structureOk = !(
      analysis.duplicateNodeIds.length ||
      analysis.orderMismatchNodeIds.length ||
      analysis.missingRequiredNodeIds.length ||
      analysis.unexpectedNodeIds.length
    );

    return analysis;
  }

  function recordTranslationProgress(snapshotAnalysis, quietFor) {
    translationState.progressObservations.push({
      observedAt: Date.now(),
      elapsedMs: Date.now() - (translationState.translationWaitStartedAt || Date.now()),
      selectedLanguage: translationState.requestedLanguage || SOURCE_LANGUAGE,
      generation: translationState.generation,
      changedTranslatableCount: snapshotAnalysis.changedTranslatableNodeIds.length,
      unexpectedUnchangedCount: snapshotAnalysis.unexpectedUnchangedTranslatableNodeIds.length,
      missingRequiredCount: snapshotAnalysis.missingRequiredNodeIds.length,
      lastMutationAgeMs: quietFor,
      stablePassCount: translationState.stablePassTimestamps.length
    });
    translationState.progressObservations = translationState.progressObservations.slice(-30);
    updateTranslationDiagnostics({
      progressObservations: translationState.progressObservations.slice()
    });
  }

  function classifyTranslationTimeout(expectedLanguage, snapshotAnalysis) {
    var diagnostics = translationState.diagnostics || {};
    var googleWidget = diagnostics.googleWidget || {};
    if (googleWidget.scriptErrorAt) {
      return "widget-script-load-failed";
    }
    if (googleWidget.scriptRequestedAt && !googleWidget.scriptLoadedAt && !googleWidget.scriptErrorAt) {
      return "widget-script-load-failed";
    }
    if (googleWidget.scriptLoadedAt && !googleWidget.callbackInvokedAt) {
      return "widget-callback-not-invoked";
    }
    if (googleWidget.callbackInvokedAt && !googleWidget.elementConstructedAt) {
      return "widget-callback-not-invoked";
    }
    if (expectedLanguage !== SOURCE_LANGUAGE && !googleWidget.selectAppearedAt) {
      return "widget-select-not-created";
    }
    if (expectedLanguage !== SOURCE_LANGUAGE && !googleWidget.requestedLanguageAvailable) {
      return "requested-language-not-available";
    }
    if (expectedLanguage !== SOURCE_LANGUAGE && googleWidget.selectedValue !== expectedLanguage) {
      return "language-selection-not-applied";
    }
    if (!snapshotAnalysis.structureOk) {
      return "translation-structure-invalid";
    }
    if (expectedLanguage !== SOURCE_LANGUAGE && snapshotAnalysis.changedTranslatableNodeIds.length <= 0) {
      return "translation-never-started";
    }
    if (expectedLanguage !== SOURCE_LANGUAGE && snapshotAnalysis.unexpectedUnchangedTranslatableNodeIds.length > 0) {
      return snapshotAnalysis.changedTranslatableNodeIds.length > 0 ? "translation-partial" : "unexpected-unchanged-translatable-nodes";
    }
    if (translationState.firstChangedNodeAt && translationState.lastSemanticProgressAt && (Date.now() - translationState.lastSemanticProgressAt) > Math.max(GUIDE_SETTLE_QUIET_MS * 4, 10000)) {
      return "translation-stalled";
    }
    return "translation-timeout-unknown";
  }

  async function waitForGuideTranslationReadiness() {
    ensureOriginalSnapshotCaptured();
    syncTranslationLanguageState();
    var expectedLanguage = translationState.requestedLanguage || SOURCE_LANGUAGE;
    var readinessGeneration = translationState.generation;
    var startedAt = Date.now();
    translationState.translationWaitStartedAt = startedAt;
    translationState.progressObservations = [];
    translationState.lastSnapshotProgressFingerprint = "";
    translationState.lastSemanticProgressAt = 0;
    var lastStableSnapshot = null;
    var primedSections = false;
    translationState.stablePassTimestamps = [];
    translationState.stableGeneration = readinessGeneration;
    if (expectedLanguage === SOURCE_LANGUAGE) {
      var englishSnapshot = captureSemanticSnapshot();
      var englishAnalysis = analyzeSnapshotState(englishSnapshot, translationState.originalSnapshot, expectedLanguage);
      if (!englishAnalysis.structureOk) {
        setTranslationAbortReason("Guide structure changed before PDF rendering", "translation-structure-invalid");
        throw new Error("Guide structure changed before PDF rendering");
      }
      translationState.readyLanguage = expectedLanguage;
      translationState.readySnapshot = englishSnapshot;
      translationState.readyAt = Date.now();
      translationState.stablePassTimestamps = [Date.now()];
      updateTranslationDiagnostics({
        settledSnapshot: captureSemanticSnapshot({ redactProtectedValues: true }),
        selectedLanguage: SOURCE_LANGUAGE,
        stablePassTimestamps: translationState.stablePassTimestamps.slice()
      });
      getPdfPerformanceState().languageSelectedToTranslationReadyMs =
        translationState.lastLanguageSelectedAt
          ? Math.max(0, translationState.readyAt - translationState.lastLanguageSelectedAt)
          : 0;
      schedulePdfPreparationWarmup(document.querySelector(".pi-pdf-download"));
      return englishSnapshot;
    }

    while (Date.now() - startedAt < GUIDE_SETTLE_TIMEOUT_MS) {
      var syncedLanguage = syncTranslationLanguageState();
      var currentLanguage = syncedLanguage || getGuideLanguage() || SOURCE_LANGUAGE;
      var rawQuietFor = Date.now() - translationState.lastMutationAt;
      var currentSnapshot = captureSemanticSnapshot();
      var snapshotAnalysis = analyzeSnapshotState(currentSnapshot, translationState.originalSnapshot, expectedLanguage);
      var progressFingerprint = getSnapshotProgressFingerprint(currentSnapshot, snapshotAnalysis);
      if (snapshotAnalysis.changedTranslatableNodeIds.length) {
        if (!translationState.firstChangedNodeAt) {
          translationState.firstChangedNodeAt = Date.now();
        }
      }
      if (progressFingerprint !== translationState.lastSnapshotProgressFingerprint) {
        translationState.lastSnapshotProgressFingerprint = progressFingerprint;
        translationState.lastSemanticProgressAt = Date.now();
      }
      var semanticQuietFor = Date.now() - (translationState.lastSemanticProgressAt || translationState.lastMutationAt || Date.now());
      updateTranslationDiagnostics({
        mutationTimestamps: translationState.mutationTimestamps.slice(-60),
        semanticQuietForMs: semanticQuietFor,
        rawQuietForMs: rawQuietFor,
        totalSemanticNodes: currentSnapshot.nodeCount,
        expectedTranslatableNodeCount: snapshotAnalysis.expectedTranslatableNodeIds.length,
        changedTranslatableNodeCount: snapshotAnalysis.changedTranslatableNodeIds.length,
        intentionallyUnchangedNodeCount: snapshotAnalysis.intentionallyUnchangedNodes.length,
        unexpectedUnchangedTranslatableNodeCount: snapshotAnalysis.unexpectedUnchangedTranslatableNodeIds.length,
        missingRequiredNodeCount: snapshotAnalysis.missingRequiredNodeIds.length,
        changedTranslatableNodeIds: snapshotAnalysis.changedTranslatableNodeIds.slice(),
        intentionallyUnchangedNodeIds: snapshotAnalysis.intentionallyUnchangedNodes.map(function (node) { return node.nodeId; }),
        intentionallyUnchangedNodes: snapshotAnalysis.intentionallyUnchangedNodes.slice(),
        unexpectedUnchangedTranslatableNodeIds: snapshotAnalysis.unexpectedUnchangedTranslatableNodeIds.slice(),
        missingRequiredNodeIds: snapshotAnalysis.missingRequiredNodeIds.slice(),
        duplicateNodeIds: snapshotAnalysis.duplicateNodeIds.slice(),
        unexpectedNodeIds: snapshotAnalysis.unexpectedNodeIds.slice(),
        orderMismatchNodeIds: snapshotAnalysis.orderMismatchNodeIds.slice(),
        sectionReadiness: translationState.sectionReadiness
      });
      recordTranslationProgress(snapshotAnalysis, semanticQuietFor);

      if (
        !primedSections &&
        expectedLanguage !== SOURCE_LANGUAGE &&
        Date.now() - startedAt >= 8000 &&
        snapshotAnalysis.unexpectedUnchangedTranslatableNodeIds.length > 0
      ) {
        primedSections = true;
        await exposeGuideSectionsForTranslation();
        lastStableSnapshot = null;
        translationState.stablePassTimestamps = [];
        await sleep(420);
        continue;
      }

      if (
        translationState.generation !== readinessGeneration ||
        currentLanguage !== expectedLanguage ||
        !snapshotAnalysis.structureOk ||
        (expectedLanguage !== SOURCE_LANGUAGE && snapshotAnalysis.unexpectedUnchangedTranslatableNodeIds.length > 0) ||
        (expectedLanguage !== SOURCE_LANGUAGE && snapshotAnalysis.changedTranslatableNodeIds.length <= 0) ||
        semanticQuietFor < GUIDE_SETTLE_QUIET_MS
      ) {
        lastStableSnapshot = null;
        translationState.stablePassTimestamps = [];
        if (translationState.generation !== readinessGeneration) {
          setTranslationAbortReason("Selected translation changed while the guide was preparing", "language-selection-not-applied");
          throw new Error("Selected translation changed while the guide was preparing");
        }
        await sleep(420);
        continue;
      }

      if (lastStableSnapshot && snapshotsEqual(lastStableSnapshot, currentSnapshot)) {
        if (
          !translationState.stablePassTimestamps.length ||
          Date.now() - translationState.stablePassTimestamps[translationState.stablePassTimestamps.length - 1] >= GUIDE_SETTLE_STABLE_INTERVAL_MS
        ) {
          translationState.stablePassTimestamps.push(Date.now());
        }
      } else {
        lastStableSnapshot = currentSnapshot;
        translationState.stablePassTimestamps = [Date.now()];
      }

      translationState.diagnostics.stablePassTimestamps = translationState.stablePassTimestamps.slice();

      if (translationState.stablePassTimestamps.length >= GUIDE_SETTLE_STABLE_PASSES) {
        translationState.readyLanguage = expectedLanguage;
        translationState.readySnapshot = currentSnapshot;
        translationState.readyAt = Date.now();
        updateTranslationDiagnostics({
          settledSnapshot: captureSemanticSnapshot({ redactProtectedValues: true })
        });
        getPdfPerformanceState().languageSelectedToTranslationReadyMs =
          translationState.lastLanguageSelectedAt
            ? Math.max(0, translationState.readyAt - translationState.lastLanguageSelectedAt)
            : 0;
        schedulePdfPreparationWarmup(document.querySelector(".pi-pdf-download"));
        return currentSnapshot;
      }

      await sleep(420);
    }

    var timeoutSnapshot = captureSemanticSnapshot();
    var timeoutAnalysis = analyzeSnapshotState(timeoutSnapshot, translationState.originalSnapshot, expectedLanguage);
    var timeoutCode = classifyTranslationTimeout(expectedLanguage, timeoutAnalysis);
    setTranslationAbortReason("Translation did not settle in time", timeoutCode);
    throw new Error("Translation did not settle in time");
  }

  function waitForGuideToSettle() {
    return waitForGuideTranslationReadiness().catch(function (error) {
      if (!(translationState.diagnostics || {}).abortReason) {
        setTranslationAbortReason(error && error.message ? error.message : "Translation did not settle", "translation-timeout-unknown");
      }
      throw error;
    });
  }

  function getCurrentSnapshotIfReady(expectedLanguage, expectedGeneration) {
    if (!translationState.readySnapshot) {
      return null;
    }
    if ((translationState.readyLanguage || SOURCE_LANGUAGE) !== (expectedLanguage || SOURCE_LANGUAGE)) {
      return null;
    }
    if ((translationState.stableGeneration || translationState.generation) !== (expectedGeneration || translationState.generation)) {
      return null;
    }
    var currentSnapshot = captureSemanticSnapshot();
    return snapshotsEqual(currentSnapshot, translationState.readySnapshot) ? translationState.readySnapshot : null;
  }

  function ensureSettledGuideSnapshot() {
    ensureOriginalSnapshotCaptured();
    syncTranslationLanguageState();
    var expectedLanguage = translationState.requestedLanguage || SOURCE_LANGUAGE;
    var expectedGeneration = translationState.generation;
    var readySnapshot = getCurrentSnapshotIfReady(expectedLanguage, expectedGeneration);
    if (readySnapshot) {
      return Promise.resolve(readySnapshot);
    }

    var currentSnapshot = captureSemanticSnapshot();
    var currentLanguage = getGuideLanguage() || SOURCE_LANGUAGE;
    var quietFor = Date.now() - translationState.lastMutationAt;
    var snapshotAnalysis = analyzeSnapshotState(currentSnapshot, translationState.originalSnapshot, expectedLanguage);
    if (
      currentLanguage === expectedLanguage &&
      snapshotAnalysis.structureOk &&
      (expectedLanguage === SOURCE_LANGUAGE || snapshotAnalysis.changedTranslatableNodeIds.length > 0) &&
      snapshotAnalysis.unexpectedUnchangedTranslatableNodeIds.length === 0 &&
      quietFor >= GUIDE_SETTLE_QUIET_MS
    ) {
      return sleep(320).then(function () {
        var confirmationSnapshot = captureSemanticSnapshot();
        var confirmationAnalysis = analyzeSnapshotState(confirmationSnapshot, translationState.originalSnapshot, expectedLanguage);
        if (
          getGuideLanguage() === expectedLanguage &&
          snapshotsEqual(currentSnapshot, confirmationSnapshot) &&
          confirmationAnalysis.structureOk &&
          (expectedLanguage === SOURCE_LANGUAGE || confirmationAnalysis.changedTranslatableNodeIds.length > 0) &&
          confirmationAnalysis.unexpectedUnchangedTranslatableNodeIds.length === 0 &&
          (Date.now() - translationState.lastMutationAt) >= 250
        ) {
          translationState.readyLanguage = expectedLanguage;
          translationState.readySnapshot = confirmationSnapshot;
          translationState.readyAt = Date.now();
          translationState.stableGeneration = expectedGeneration;
          translationState.stablePassTimestamps = [Date.now() - 320, Date.now()];
          updateTranslationDiagnostics({
            settledSnapshot: captureSemanticSnapshot({ redactProtectedValues: true }),
            stablePassTimestamps: translationState.stablePassTimestamps.slice(),
            readySnapshotInvalidationReason: "non-semantic-change-ignored"
          });
          return confirmationSnapshot;
        }
        return waitForGuideToSettle();
      });
    }

    if (
      translationState.settlingPromise &&
      translationState.settlingGeneration === expectedGeneration
    ) {
      return translationState.settlingPromise;
    }

    translationState.settlingGeneration = expectedGeneration;
    translationState.settlingPromise = waitForGuideToSettle().finally(function () {
      if (translationState.settlingGeneration === expectedGeneration) {
        translationState.settlingPromise = null;
      }
    });
    return translationState.settlingPromise;
  }

  function extractStructuredInlineContent(node) {
    if (!node) {
      return [];
    }

    if (node.nodeType === Node.TEXT_NODE) {
      var textValue = String(node.textContent || "");
      if (!normalizeText(textValue)) {
        return [];
      }
      return [{ type: "text", value: textValue }];
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return [];
    }

    var tagName = node.tagName.toLowerCase();
    if (tagName === "br") {
      return [{ type: "br" }];
    }

    if (tagName === "a") {
      var href = normalizeHref(node.getAttribute("href"));
      return [{
        type: "link",
        href: href,
        content: extractStructuredInlineContentFromChildren(node)
      }];
    }

    if (tagName === "strong" || tagName === "b" || tagName === "em" || tagName === "i") {
      return [{
        type: tagName === "b" ? "strong" : tagName === "i" ? "em" : tagName,
        content: extractStructuredInlineContentFromChildren(node)
      }];
    }

    return extractStructuredInlineContentFromChildren(node);
  }

  function extractStructuredInlineContentFromChildren(node) {
    var content = [];
    Array.prototype.slice.call(node.childNodes).forEach(function (childNode) {
      content = content.concat(extractStructuredInlineContent(childNode));
    });
    return content;
  }

  function extractStructuredContent(node) {
    if (!node) {
      return [];
    }
    var content = [];
    var blockTags = { p: true, ul: true, ol: true, li: true, br: true, a: true };

    Array.prototype.slice.call(node.childNodes).forEach(function (childNode) {
      if (childNode.nodeType === Node.TEXT_NODE) {
        if (normalizeText(childNode.textContent || "")) {
          content.push({
            type: "paragraph",
            content: [{ type: "text", value: childNode.textContent || "" }]
          });
        }
        return;
      }

      if (childNode.nodeType !== Node.ELEMENT_NODE) {
        return;
      }

      var tagName = childNode.tagName.toLowerCase();
      if (tagName === "p") {
        content.push({ type: "paragraph", content: extractStructuredInlineContentFromChildren(childNode) });
        return;
      }
      if (tagName === "ul" || tagName === "ol") {
        content.push({
          type: "list",
          ordered: tagName === "ol",
          items: Array.prototype.slice.call(childNode.children).filter(function (listChild) {
            return listChild.tagName && listChild.tagName.toLowerCase() === "li";
          }).map(function (listItem) {
            return extractStructuredInlineContentFromChildren(listItem);
          })
        });
        return;
      }
      if (blockTags[tagName]) {
        content.push({ type: "paragraph", content: extractStructuredInlineContent(childNode) });
        return;
      }
      var nestedContent = extractStructuredContent(childNode);
      nestedContent.forEach(function (item) {
        content.push(item);
      });
    });

    return content;
  }

  function flattenStructuredInlineContent(inlineContent) {
    return inlineContent.map(function (part) {
      if (part.type === "text") {
        return part.value || "";
      }
      if (part.type === "br") {
        return "\n";
      }
      if (part.content) {
        return flattenStructuredInlineContent(part.content);
      }
      return "";
    }).join("");
  }

  function flattenStructuredContent(structuredContent) {
    return normalizeText(structuredContent.map(function (item) {
      if (item.type === "paragraph") {
        return flattenStructuredInlineContent(item.content || []);
      }
      if (item.type === "list") {
        return (item.items || []).map(function (listItem) {
          return flattenStructuredInlineContent(listItem || []);
        }).join("\n");
      }
      return "";
    }).join("\n\n"));
  }

  function appendStructuredInlineContent(documentNode, parentNode, inlineContent) {
    inlineContent.forEach(function (part) {
      if (part.type === "text") {
        parentNode.appendChild(documentNode.createTextNode(part.value || ""));
        return;
      }
      if (part.type === "br") {
        parentNode.appendChild(documentNode.createElement("br"));
        return;
      }
      if (part.type === "link") {
        var link = documentNode.createElement("a");
        link.href = part.href || "";
        link.target = "_blank";
        link.rel = "noopener noreferrer nofollow";
        appendStructuredInlineContent(documentNode, link, part.content || []);
        parentNode.appendChild(link);
        return;
      }
      if (part.type === "strong" || part.type === "em") {
        var inlineElement = documentNode.createElement(part.type);
        appendStructuredInlineContent(documentNode, inlineElement, part.content || []);
        parentNode.appendChild(inlineElement);
        return;
      }
    });
  }

  function appendStructuredContent(documentNode, parentNode, structuredContent) {
    structuredContent.forEach(function (item) {
      if (item.type === "paragraph") {
        var paragraph = documentNode.createElement("p");
        appendStructuredInlineContent(documentNode, paragraph, item.content || []);
        parentNode.appendChild(paragraph);
        return;
      }
      if (item.type === "list") {
        var list = documentNode.createElement(item.ordered ? "ol" : "ul");
        (item.items || []).forEach(function (listItemContent) {
          var listItem = documentNode.createElement("li");
          appendStructuredInlineContent(documentNode, listItem, listItemContent || []);
          list.appendChild(listItem);
        });
        parentNode.appendChild(list);
      }
    });
  }

  function createManagedImage(documentNode, options, pendingImages) {
    var frame = documentNode.createElement("div");
    frame.className = options.frameClassName || "pi-export-image-frame";
    frame.setAttribute("data-export-image-frame", options.imageRole || "image");

    var resolvedSourceUrl = resolveExportImageUrl(options.src);
    var img = documentNode.createElement("img");
    img.className = options.className;
    img.alt = options.alt || "";
    img.loading = "eager";
    img.decoding = "sync";
    img.referrerPolicy = "strict-origin-when-cross-origin";
    img.setAttribute("data-export-image-role", options.imageRole || "image");
    img.setAttribute("data-export-image-original-src", String(options.src || ""));
    img.setAttribute("data-export-image-resolved-src", resolvedSourceUrl);
    img.setAttribute("data-export-image-fetch-src", resolvedSourceUrl);
    img.removeAttribute("width");
    img.removeAttribute("height");
    img.style.width = "auto";
    img.style.height = "auto";
    img.style.maxWidth = "100%";
    img.style.maxHeight = "100%";
    img.style.objectFit = "contain";
    img.style.objectPosition = "center";
    img.style.flex = "0 0 auto";
    frame.appendChild(img);
    img.__exportPlaceholderClass = options.placeholderClass || "pi-export-image-placeholder";
    img.__exportPlaceholderText = options.placeholderText || "";
    return frame;
  }

  function blobToDataUri(blob) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        resolve(String(reader.result || ""));
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async function getExportImageDataUri(url, cache) {
    if (!cache.has(url)) {
      cache.set(url, (async function () {
        var response = await fetch(url, {
          credentials: "same-origin",
          cache: "no-store"
        });
        if (!response.ok) {
          throw new Error("Unable to prepare PDF image: " + response.status);
        }
        var contentType = String(response.headers.get("content-type") || "").toLowerCase();
        if (contentType.indexOf("image/") !== 0) {
          throw new Error("PDF image endpoint returned a non-image response.");
        }
        return blobToDataUri(await response.blob());
      })());
    }
    return cache.get(url);
  }

  function replaceImageWithPlaceholder(img) {
    var frame = img && img.closest ? img.closest("[data-export-image-frame]") : null;
    if (!frame) {
      return;
    }
    var placeholder = frame.ownerDocument.createElement("div");
    placeholder.className = img.__exportPlaceholderClass || "pi-export-image-placeholder";
    if (img.__exportPlaceholderText) {
      placeholder.textContent = img.__exportPlaceholderText;
    }
    while (frame.firstChild) {
      frame.removeChild(frame.firstChild);
    }
    frame.appendChild(placeholder);
  }

  async function inlineExportImages(exportRoot, exportImageDataCache) {
    var uniqueFetchUrls = [];
    var seenUrls = {};
    var imageNodes = Array.prototype.slice.call(exportRoot.querySelectorAll("img[data-export-image-fetch-src]"));

    await Promise.all(imageNodes.map(async function (img) {
      var fetchUrl = String(img.getAttribute("data-export-image-fetch-src") || "").trim();
      if (!fetchUrl) {
        replaceImageWithPlaceholder(img);
        return;
      }
      if (isDataUrl(fetchUrl)) {
        img.src = fetchUrl;
        img.setAttribute("data-export-image-resolved-src", fetchUrl);
        return;
      }
      if (!seenUrls[fetchUrl]) {
        seenUrls[fetchUrl] = true;
        uniqueFetchUrls.push(fetchUrl);
      }
      try {
        var dataUri = await getExportImageDataUri(fetchUrl, exportImageDataCache);
        img.src = dataUri;
        img.setAttribute("data-export-image-resolved-src", dataUri);
      } catch (error) {
        replaceImageWithPlaceholder(img);
      }
    }));

    return {
      imageCount: imageNodes.length,
      uniqueFetchCount: uniqueFetchUrls.length,
      uniqueFetchUrls: uniqueFetchUrls.map(function (url) {
        return summarizeDiagnosticImageSource(url, "image");
      })
    };
  }

  function fitImageSize(naturalWidth, naturalHeight, maxWidth, maxHeight) {
    var scale = Math.min(maxWidth / naturalWidth, maxHeight / naturalHeight, 1);
    return {
      width: Math.round(naturalWidth * scale),
      height: Math.round(naturalHeight * scale)
    };
  }

  function getPdfImageMaxHeight(img) {
    var role = String(img.getAttribute("data-export-image-role") || "image");
    var ratio = img.naturalWidth / img.naturalHeight;
    if (role === "cover") {
      return ratio < 0.9 ? 340 : 240;
    }
    if (role === "map") {
      return 300;
    }
    if (ratio < 0.9) {
      return 330;
    }
    if (ratio < 1.2) {
      return 310;
    }
    return 285;
  }

  function chooseCardImageLayout(cardNode, img, fitted, availableWidth) {
    var ratio = img.naturalWidth / img.naturalHeight;
    var bodyTextLength = cardNode ? normalizeText(cardNode.innerText || cardNode.textContent || "").length : 0;
    if (ratio < 0.9) {
      return {
        layout: "portrait-side-by-side",
        mediaWidth: Math.min(Math.max(fitted.width, 320), Math.min(availableWidth, 380))
      };
    }
    if (ratio > 1.15) {
      return {
        layout: "landscape-stacked",
        mediaWidth: availableWidth
      };
    }
    if (bodyTextLength > 220) {
      return {
        layout: "portrait-side-by-side",
        mediaWidth: Math.min(Math.max(fitted.width, 300), Math.min(availableWidth, 360))
      };
    }
    return {
      layout: "landscape-stacked",
      mediaWidth: availableWidth
    };
  }

  function applyExportImageSizing(exportRoot) {
    var diagnostics = [];
    Array.prototype.slice.call(exportRoot.querySelectorAll("img")).forEach(function (img) {
      if (!img.naturalWidth || !img.naturalHeight) {
        return;
      }
      var frame = img.closest("[data-export-image-frame]");
      if (!frame) {
        return;
      }
      img.removeAttribute("width");
      img.removeAttribute("height");
      img.style.width = "auto";
      img.style.height = "auto";
      img.style.maxWidth = "100%";
      img.style.maxHeight = "100%";
      img.style.objectFit = "contain";

      var frameStyles = window.getComputedStyle(frame);
      var horizontalPadding = (parseFloat(frameStyles.paddingLeft || "0") || 0) + (parseFloat(frameStyles.paddingRight || "0") || 0);
      var availableWidth = Math.max(1, frame.clientWidth - horizontalPadding);
      var fitted = fitImageSize(
        img.naturalWidth,
        img.naturalHeight,
        availableWidth,
        getPdfImageMaxHeight(img)
      );
      var role = String(img.getAttribute("data-export-image-role") || "image");
      var cardNode = role === "card" ? img.closest(".pi-export-card") : null;
      var chosenLayout = null;
      var mediaWidth = availableWidth;

      if (cardNode) {
        chosenLayout = chooseCardImageLayout(cardNode, img, fitted, availableWidth);
        mediaWidth = chosenLayout.mediaWidth;
        cardNode.classList.remove("pi-export-card--portrait-side", "pi-export-card--landscape-stacked");
        cardNode.classList.add(
          chosenLayout.layout === "portrait-side-by-side"
            ? "pi-export-card--portrait-side"
            : "pi-export-card--landscape-stacked"
        );
        var mediaColumn = cardNode.querySelector(".pi-export-card-media");
        if (mediaColumn) {
          mediaColumn.style.width = chosenLayout.layout === "portrait-side-by-side"
            ? mediaWidth + "px"
            : "100%";
          mediaColumn.style.minWidth = chosenLayout.layout === "portrait-side-by-side"
            ? mediaWidth + "px"
            : "0";
        }
      } else if (role === "cover") {
        mediaWidth = Math.min(availableWidth, 320);
      }

      img.style.width = fitted.width + "px";
      img.style.height = fitted.height + "px";
      frame.style.width = role === "card" && chosenLayout && chosenLayout.layout === "portrait-side-by-side"
        ? mediaWidth + "px"
        : "100%";
      frame.style.height = fitted.height + "px";
      frame.style.maxHeight = "none";
      frame.style.minHeight = "0";

      diagnostics.push({
        image: summarizeDiagnosticImageSource(
          img.getAttribute("data-export-image-original-src") || img.currentSrc || img.src || "",
          role
        ),
        role: role,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        renderedWidth: fitted.width,
        renderedHeight: fitted.height,
        frameWidth: Number(frame.clientWidth.toFixed ? frame.clientWidth.toFixed(2) : frame.clientWidth),
        frameHeight: fitted.height,
        imageRatio: Number((img.naturalWidth / img.naturalHeight).toFixed(6)),
        chosenLayout: chosenLayout ? chosenLayout.layout : (role === "cover" ? "cover-two-column" : role === "map" ? "map-full-width" : "default")
      });
    });
    return diagnostics;
  }

  function validateExportImageClipping(exportRoot) {
    return Array.prototype.slice.call(exportRoot.querySelectorAll("img")).map(function (img) {
      var frame = img.closest("[data-export-image-frame]");
      if (!frame) {
        throw new Error("Export image frame missing.");
      }
      var imageRect = img.getBoundingClientRect();
      var frameRect = frame.getBoundingClientRect();
      if (!img.naturalWidth || !img.naturalHeight || !imageRect.width || !imageRect.height || !frameRect.width || !frameRect.height) {
        throw new Error("One or more export images did not render with measurable frame dimensions.");
      }
      var naturalRatio = img.naturalWidth / img.naturalHeight;
      var renderedRatio = imageRect.width / imageRect.height;
      var ratioDifference = Math.abs(renderedRatio - naturalRatio) / naturalRatio;
      var clippedHorizontally = imageRect.left < (frameRect.left - PDF_EXPORT_IMAGE_CLIP_TOLERANCE) || imageRect.right > (frameRect.right + PDF_EXPORT_IMAGE_CLIP_TOLERANCE);
      var clippedVertically = imageRect.top < (frameRect.top - PDF_EXPORT_IMAGE_CLIP_TOLERANCE) || imageRect.bottom > (frameRect.bottom + PDF_EXPORT_IMAGE_CLIP_TOLERANCE);
      var diagnostics = {
        image: summarizeDiagnosticImageSource(img.currentSrc || img.src || "", String(img.getAttribute("data-export-image-role") || "image")),
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        renderedWidth: Number(imageRect.width.toFixed(2)),
        renderedHeight: Number(imageRect.height.toFixed(2)),
        frameWidth: Number(frameRect.width.toFixed(2)),
        frameHeight: Number(frameRect.height.toFixed(2)),
        naturalRatio: Number(naturalRatio.toFixed(6)),
        renderedRatio: Number(renderedRatio.toFixed(6)),
        difference: Number((ratioDifference * 100).toFixed(4)),
        clippedHorizontally: clippedHorizontally,
        clippedVertically: clippedVertically
      };
      if (clippedHorizontally || clippedVertically) {
        throw new Error("export-image-clipped");
      }
      return diagnostics;
    });
  }

  function parseNumericDataAttribute(element, attributeName) {
    if (!element) {
      return null;
    }
    var rawValue = String(element.getAttribute(attributeName) || "").trim();
    if (!rawValue) {
      return null;
    }
    var parsedValue = Number(rawValue);
    return Number.isFinite(parsedValue) ? parsedValue : null;
  }

  function parseGoogleMapCoordinatesFromUrl(rawUrl) {
    var text = String(rawUrl || "").trim();
    if (!text) {
      return null;
    }
    var atMatch = text.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    if (atMatch) {
      return {
        latitude: Number(atMatch[1]),
        longitude: Number(atMatch[2])
      };
    }
    return null;
  }

  function getSectionGoogleMapsLink(sectionModel) {
    var blocks = (sectionModel && sectionModel.blocks) || [];
    for (var index = 0; index < blocks.length; index += 1) {
      var block = blocks[index];
      if (!block || !block.linkHref) {
        continue;
      }
      var normalizedHref = normalizeHref(block.linkHref);
      if (normalizedHref.indexOf("https://www.google.com/maps") === 0 || normalizedHref.indexOf("https://maps.google.com") === 0) {
        return {
          href: normalizedHref,
          label: block.linkLabel || normalizedHref,
          sourceNodeId: block.id ? ("block:" + block.id + ":link_label") : "",
          blockId: block.id || ""
        };
      }
    }
    return null;
  }

  function extractGuideModel() {
    var guideScreen = getGuideScreen();
    if (!guideScreen) {
      throw new Error("Guide page unavailable");
    }

    var sections = Array.prototype.slice.call(guideScreen.querySelectorAll("[data-guide-section]")).map(function (sectionNode) {
      var blocks = Array.prototype.slice.call(sectionNode.querySelectorAll("[data-guide-block]")).map(function (blockNode) {
        var title = getVisibleText(blockNode.querySelector("[data-guide-block-title]"));
        var bodyNode = blockNode.querySelector("[data-guide-block-body]");
        var bodyContent = extractStructuredContent(bodyNode);
        var caption = getVisibleText(blockNode.querySelector("[data-guide-block-caption]"));
        var linkNode = blockNode.querySelector("[data-guide-block-link]");
        var imageNode = blockNode.querySelector("[data-guide-block-image]");
        var mapNode = blockNode.querySelector("[data-guide-block-map]");
        return {
          id: blockNode.getAttribute("data-guide-block-id") || "",
          type: blockNode.getAttribute("data-guide-block-type") || "Text",
          stepNumber: getVisibleText(blockNode.querySelector("[data-guide-step-number]")),
          title: title,
          body: flattenStructuredContent(bodyContent),
          bodyContent: bodyContent,
          caption: caption,
          linkLabel: getVisibleText(linkNode),
          linkHref: normalizeHref(linkNode && linkNode.getAttribute("href")),
          imageSrc: imageNode ? String(imageNode.getAttribute("src") || "").trim() : "",
          imageAlt: imageNode ? String(imageNode.getAttribute("alt") || "").trim() : "",
          mapEmbedUrl: mapNode ? String(mapNode.getAttribute("data-guide-block-map-embed-url") || "").trim() : "",
          mapLatitude: parseNumericDataAttribute(mapNode, "data-guide-block-map-latitude"),
          mapLongitude: parseNumericDataAttribute(mapNode, "data-guide-block-map-longitude"),
          mapCenterLatitude: parseNumericDataAttribute(mapNode, "data-guide-block-map-center-latitude"),
          mapCenterLongitude: parseNumericDataAttribute(mapNode, "data-guide-block-map-center-longitude"),
          mapMarkerLatitude: parseNumericDataAttribute(mapNode, "data-guide-block-map-marker-latitude"),
          mapMarkerLongitude: parseNumericDataAttribute(mapNode, "data-guide-block-map-marker-longitude"),
          mapCoordinateSource: mapNode ? String(mapNode.getAttribute("data-guide-block-map-coordinate-source") || "").trim() : "",
          mapZoom: parseNumericDataAttribute(mapNode, "data-guide-block-map-zoom") || 16,
          mapExternalUrl: normalizeHref(mapNode && mapNode.getAttribute("data-guide-block-map-external-url")),
          mapAttribution: mapNode ? String(mapNode.getAttribute("data-guide-block-map-attribution") || "").trim() : ""
        };
      }).filter(function (block) {
        return block.title || block.body || block.caption || block.linkLabel || block.imageSrc || block.mapEmbedUrl;
      });

      return {
        anchor: sectionNode.getAttribute("data-guide-section-anchor") || "",
        title: getVisibleText(sectionNode.querySelector("[data-guide-section-title]")),
        blocks: blocks
      };
    }).filter(function (section) {
      return section.title || section.blocks.length;
    });

    var domSectionCount = guideScreen.querySelectorAll("[data-guide-section]").length;
    var domBlockCount = guideScreen.querySelectorAll("[data-guide-block]").length;
    var extractedBlockCount = sections.reduce(function (count, section) {
      return count + section.blocks.length;
    }, 0);

    if (!sections.length || sections.length !== domSectionCount || extractedBlockCount !== domBlockCount) {
      throw new Error("Guide content changed while preparing the PDF");
    }

    var mapCard = document.querySelector("[data-guide-map-card]");
    var mapLink = document.querySelector("[data-guide-map-link]") || document.querySelector(".pi-hero .pi-btn-primary");
    var contentsTitleNode = document.querySelector("[data-guide-contents-title]");
    var coverNode = document.querySelector("[data-guide-cover]");
    var languageCode = getGuideLanguage();
    var emptyNode = document.querySelector("[data-guide-empty-state]");
    var guideKicker = document.querySelector("[data-guide-kicker]");
    var parkingSection = sections.find(function (sectionModel) {
      return sectionModel.anchor === "parking";
    });
    var parkingLink = getSectionGoogleMapsLink(parkingSection);
    var mapLinkHref = normalizeHref(mapLink && mapLink.getAttribute("href"));
    var fallbackCoordinates = parseGoogleMapCoordinatesFromUrl(mapLinkHref);
    var propertyLatitude = parseNumericDataAttribute(mapCard, "data-guide-map-latitude");
    var propertyLongitude = parseNumericDataAttribute(mapCard, "data-guide-map-longitude");
    if (!Number.isFinite(propertyLatitude) && fallbackCoordinates) {
      propertyLatitude = fallbackCoordinates.latitude;
    }
    if (!Number.isFinite(propertyLongitude) && fallbackCoordinates) {
      propertyLongitude = fallbackCoordinates.longitude;
    }

    var guideLinks = [];
    if (mapLinkHref) {
      guideLinks.push({
        href: mapLinkHref,
        label: getVisibleText(mapLink),
        sourceNodeId: "map:link_label",
        kind: "property-map"
      });
    }
    if (parkingLink && parkingLink.href) {
      guideLinks.push({
        href: parkingLink.href,
        label: parkingLink.label || parkingLink.href,
        sourceNodeId: parkingLink.sourceNodeId || "",
        blockId: parkingLink.blockId || "",
        kind: "parking-map"
      });
    }
    sections.forEach(function (sectionModel) {
      (sectionModel.blocks || []).forEach(function (blockModel) {
        if (blockModel.linkHref) {
          guideLinks.push({
            href: blockModel.linkHref,
            label: blockModel.linkLabel || blockModel.linkHref,
            sourceNodeId: blockModel.id ? ("block:" + blockModel.id + ":link_label") : "",
            blockId: blockModel.id || "",
            kind: "block-link"
          });
        }
        if (blockModel.mapExternalUrl) {
          guideLinks.push({
            href: blockModel.mapExternalUrl,
            label: blockModel.linkLabel || blockModel.mapExternalUrl,
            sourceNodeId: blockModel.id ? ("block:" + blockModel.id + ":link_label") : "",
            blockId: blockModel.id || "",
            kind: "block-map"
          });
        }
        collectStructuredContentLinks(
          blockModel.bodyContent || [],
          blockModel.id ? ("block:" + blockModel.id + ":body") : "",
          guideLinks,
          blockModel.id || ""
        );
      });
    });

    return {
      languageCode: languageCode,
      direction: getGuideDirection(languageCode),
      title: getGuideTitle(),
      kicker: getVisibleText(guideKicker),
      contentsTitle: getVisibleText(contentsTitleNode),
      quickAccessTitle: getGuideCopyText("quick_access", "Quick access"),
      emptyMessage: getVisibleText(emptyNode),
      showWifiQr: getGuideRootBooleanAttribute("data-guide-show-wifi-qr"),
      wifiSecurityType: getGuideRootDataAttribute("data-guide-wifi-security-type") || "WPA",
      wifiHiddenNetwork: getGuideRootBooleanAttribute("data-guide-wifi-hidden-network"),
      coverImage: coverNode ? {
        src: String(coverNode.getAttribute("src") || "").trim(),
        alt: String(coverNode.getAttribute("alt") || "").trim()
      } : null,
      address: getFieldWithLabel("address"),
      checkIn: getFieldWithLabel("check_in"),
      checkOut: getFieldWithLabel("check_out"),
      wifiName: getFieldWithLabel("wifi_name"),
      wifiPassword: getFieldWithLabel("wifi_password"),
      emergencyContact: getFieldWithLabel("emergency_contact"),
      lastReviewed: getFieldWithLabel("last_reviewed"),
      map: {
        title: getVisibleText(document.querySelector("[data-guide-map-title]")),
        imageSrc: mapCard ? String(mapCard.getAttribute("data-guide-map-image") || "").trim() : "",
        linkHref: mapLinkHref,
        linkLabel: getVisibleText(mapLink),
        latitude: propertyLatitude,
        longitude: propertyLongitude,
        zoom: parseNumericDataAttribute(mapCard, "data-guide-map-zoom") || 16,
        attribution: mapCard ? String(mapCard.getAttribute("data-guide-map-attribution") || "").trim() : ""
      },
      parkingMap: {
        linkHref: parkingLink ? parkingLink.href : "",
        linkLabel: parkingLink ? parkingLink.label : "",
        linkSourceNodeId: parkingLink ? parkingLink.sourceNodeId : "",
        latitude: propertyLatitude,
        longitude: propertyLongitude,
        zoom: parseNumericDataAttribute(mapCard, "data-guide-map-parking-zoom") || 15,
        attribution: mapCard ? String(mapCard.getAttribute("data-guide-map-attribution") || "").trim() : ""
      },
      contentsEntries: sections.map(function (sectionModel) {
        return {
          anchor: sectionModel.anchor,
          title: sectionModel.title,
          count: (sectionModel.blocks || []).length
        };
      }),
      guideLinks: dedupeGuideLinks(guideLinks),
      sections: sections,
      counts: {
        sections: domSectionCount,
        blocks: domBlockCount
      }
    };
  }

  function appendExportMetaItem(documentNode, parentNode, fieldData) {
    if (!fieldData || !fieldData.value) {
      return;
    }
    var item = documentNode.createElement("div");
    item.className = "pi-export-meta-item";
    var label = documentNode.createElement("span");
    label.className = "pi-export-label";
    label.textContent = fieldData.label || "";
    if (fieldData.labelNodeId) {
      label.setAttribute("data-export-source-id", fieldData.labelNodeId);
    }
    var value = documentNode.createElement("span");
    value.className = "pi-export-value";
    value.textContent = fieldData.value;
    if (fieldData.valueNodeId) {
      value.setAttribute("data-export-source-id", fieldData.valueNodeId);
    }
    item.appendChild(label);
    item.appendChild(value);
    parentNode.appendChild(item);
  }

  function createPdfContentsPanel(documentNode, model) {
    if (!model.contentsEntries || !model.contentsEntries.length) {
      return null;
    }
    var panel = documentNode.createElement("section");
    panel.className = "pi-export-contents";
    panel.setAttribute("data-pdf-contents-panel", "1");
    var title = documentNode.createElement("h2");
    title.className = "pi-export-panel-title";
    title.textContent = model.contentsTitle || getGuideCopyText("in_this_guide", "In this guide");
    panel.appendChild(title);

    var list = documentNode.createElement("ol");
    list.className = "pi-export-contents-list";
    panel.appendChild(list);

    (model.contentsEntries || []).forEach(function (entry) {
      var item = documentNode.createElement("li");
      var link = documentNode.createElement("a");
      link.className = "pi-export-contents-link";
      link.href = "#" + entry.anchor;
      link.setAttribute("data-pdf-internal-target", entry.anchor);
      link.textContent = entry.title || entry.anchor;
      link.setAttribute("data-export-source-id", "section:" + entry.anchor + ":title");
      item.appendChild(link);
      var pageNumber = documentNode.createElement("span");
      pageNumber.className = "pi-export-contents-page";
      pageNumber.setAttribute("data-pdf-contents-page", entry.anchor);
      item.appendChild(pageNumber);
      list.appendChild(item);
    });
    return panel;
  }

  function createPdfQrPanel(documentNode, titleText, qrEntries, panelClassName) {
    if (!qrEntries || !qrEntries.length) {
      return null;
    }
    var panel = documentNode.createElement("section");
    panel.className = panelClassName || "pi-export-quick-access";
    var title = documentNode.createElement("h2");
    title.className = "pi-export-panel-title";
    title.textContent = titleText || getGuideCopyText("quick_access", "Quick access");
    panel.appendChild(title);
    var list = documentNode.createElement("div");
    list.className = "pi-export-qr-grid";
    panel.appendChild(list);

    qrEntries.forEach(function (entry) {
      var card = documentNode.createElement("article");
      card.className = "pi-export-qr-card";
      if (entry.linkHref) {
        var link = documentNode.createElement("a");
        link.href = entry.linkHref;
        link.target = "_blank";
        link.rel = "noopener noreferrer nofollow";
        link.className = "pi-export-qr-link";
        link.textContent = entry.label;
        if (entry.sourceNodeId) {
          link.setAttribute("data-export-source-id", entry.sourceNodeId);
        }
        card.appendChild(link);
      } else {
        var text = documentNode.createElement("p");
        text.className = "pi-export-qr-label";
        text.textContent = entry.label;
        card.appendChild(text);
      }
      card.appendChild(
        createManagedImage(documentNode, {
          src: entry.qrImageSrc,
          alt: entry.label || "",
          className: "pi-export-qr-image",
          frameClassName: "pi-export-image-frame pi-export-qr-frame",
          imageRole: "qr",
          placeholderClass: "pi-export-image-placeholder"
        }, [])
      );
      list.appendChild(card);
    });

    return panel;
  }

  function createExportRoot() {
    var exportRoot = document.createElement("div");
    exportRoot.className = "pi-pdf-export-root";
    exportRoot.setAttribute("data-property-instruction-export", "root");
    exportRoot.setAttribute("lang", "en");
    exportRoot.setAttribute("dir", "ltr");
    exportRoot.setAttribute("aria-hidden", "true");
    markExportNodeNotranslate(exportRoot);
    exportRoot.style.position = "absolute";
    exportRoot.style.left = "0";
    exportRoot.style.top = "0";
    exportRoot.style.width = PDF_EXPORT_WIDTH + "px";
    exportRoot.style.background = "#ffffff";
    exportRoot.style.pointerEvents = "none";
    exportRoot.style.overflow = "visible";
    exportRoot.style.visibility = "visible";
    exportRoot.style.opacity = "1";
    exportRoot.style.zIndex = "0";
    return exportRoot;
  }

  function mountExportRoot(exportRoot) {
    if (!exportRoot || exportRoot.parentNode) {
      return exportRoot;
    }
    exportRoot.style.position = "fixed";
    exportRoot.style.left = PDF_EXPORT_OFFSCREEN_LEFT + "px";
    exportRoot.style.top = "0";
    exportRoot.style.opacity = "0";
    exportRoot.style.visibility = "visible";
    exportRoot.style.pointerEvents = "none";
    exportRoot.style.zIndex = "-2147483647";
    exportRoot.style.contain = "layout style paint";
    document.body.appendChild(exportRoot);
    return exportRoot;
  }

  function destroyExportRoot(exportRoot) {
    if (exportRoot && exportRoot.parentNode) {
      exportRoot.parentNode.removeChild(exportRoot);
    }
  }

  function buildPdfExportDocument(model) {
    var exportRoot = createExportRoot();
    exportRoot.setAttribute("lang", model.languageCode || "en");
    exportRoot.setAttribute("dir", model.direction || "ltr");

    var pendingImages = [];
    var exportWrapper = document.createElement("div");
    exportWrapper.className = "pi-pdf-export";
    markExportNodeNotranslate(exportWrapper);

    var exportDocument = document.createElement("article");
    exportDocument.className = "pi-export-document";
    exportDocument.setAttribute("lang", model.languageCode || "en");
    exportDocument.setAttribute("dir", model.direction || "ltr");
    markExportNodeNotranslate(exportDocument);

    var header = document.createElement("header");
    header.className = "pi-export-header";

    var heroTop = document.createElement("div");
    heroTop.className = "pi-export-hero-top";

    var heroCopy = document.createElement("div");
    heroCopy.className = "pi-export-hero-copy";

    if (model.kicker) {
      var kicker = document.createElement("p");
      kicker.className = "pi-export-kicker";
      kicker.textContent = model.kicker;
      kicker.setAttribute("data-export-source-id", "guide:kicker");
      heroCopy.appendChild(kicker);
    }

    var title = document.createElement("h1");
    title.className = "pi-export-title";
    title.textContent = model.title;
    title.setAttribute("data-export-source-id", "field:title");
    heroCopy.appendChild(title);

    if (model.address && model.address.value) {
      var address = document.createElement("p");
      address.className = "pi-export-address";
      address.textContent = model.address.value;
      address.setAttribute("data-export-source-id", "field:address");
      heroCopy.appendChild(address);
    }

    var metaList = document.createElement("div");
    metaList.className = "pi-export-meta-list";
    [
      model.checkIn,
      model.checkOut,
      model.wifiName,
      model.wifiPassword,
      model.emergencyContact,
      model.lastReviewed
    ].forEach(function (fieldData) {
      appendExportMetaItem(document, metaList, fieldData);
    });
    if (model.address && model.address.value) {
      appendExportMetaItem(document, metaList, model.address);
    }
    heroCopy.appendChild(metaList);
    heroTop.appendChild(heroCopy);

    if (model.coverImage && model.coverImage.src) {
      var heroMedia = document.createElement("div");
      heroMedia.className = "pi-export-hero-cover";
      heroMedia.appendChild(
        createManagedImage(document, {
          src: model.coverImage.src,
          alt: model.coverImage.alt || model.title,
          className: "pi-export-cover",
          frameClassName: "pi-export-image-frame pi-export-cover-frame",
          imageRole: "cover",
          placeholderClass: "pi-export-image-placeholder"
        }, pendingImages)
      );
      heroTop.appendChild(heroMedia);
    }

    header.appendChild(heroTop);
    exportDocument.appendChild(header);

    if (model.map.linkHref || model.map.imageSrc) {
      var mapSection = document.createElement("section");
      mapSection.className = "pi-export-map";
      if (model.map.title) {
        var mapTitle = document.createElement("h2");
        mapTitle.className = "pi-export-map-title";
        mapTitle.textContent = model.map.title;
        mapTitle.setAttribute("data-export-source-id", "map:title");
        mapSection.appendChild(mapTitle);
      }

      if (model.map.imageSrc) {
        mapSection.appendChild(
          createManagedImage(document, {
            src: model.map.imageSrc,
            alt: model.map.title || "",
            className: "pi-export-map-image",
            frameClassName: "pi-export-image-frame pi-export-map-image-frame",
            imageRole: "map",
            placeholderClass: "pi-export-map-placeholder"
          }, pendingImages)
        );
      }

      var mapMeta = document.createElement("div");
      mapMeta.className = "pi-export-map-meta";

      if (model.map.linkHref) {
        var mapLink = document.createElement("a");
        mapLink.href = model.map.linkHref;
        mapLink.target = "_blank";
        mapLink.rel = "noopener noreferrer nofollow";
        mapLink.textContent = model.map.linkLabel || model.map.linkHref;
        mapLink.setAttribute("data-export-source-id", "map:link_label");
        mapMeta.appendChild(mapLink);
      }

      if (model.map.attribution && !model.map.imageSrc) {
        var mapAttribution = document.createElement("span");
        mapAttribution.className = "pi-export-map-attribution notranslate";
        mapAttribution.textContent = model.map.attribution;
        mapAttribution.setAttribute("translate", "no");
        mapMeta.appendChild(mapAttribution);
      }

      if (mapMeta.childNodes.length) {
        mapSection.appendChild(mapMeta);
      }

      exportDocument.appendChild(mapSection);
    }

    var pageOneExtras = document.createElement("section");
    pageOneExtras.className = "pi-export-page-one-extras";
    var contentsPanel = createPdfContentsPanel(document, model);
    if (contentsPanel) {
      pageOneExtras.appendChild(contentsPanel);
    }
    var quickAccessPanel = createPdfQrPanel(
      document,
      model.quickAccessTitle,
      model.quickAccessEntries || [],
      "pi-export-quick-access"
    );
    if (quickAccessPanel) {
      pageOneExtras.appendChild(quickAccessPanel);
    }
    if (pageOneExtras.childNodes.length) {
      pageOneExtras.setAttribute("data-pdf-section-item", "1");
      exportDocument.appendChild(pageOneExtras);
    }

    model.sections.forEach(function (sectionModel) {
      var section = document.createElement("section");
      section.className = "pi-export-section";
      section.setAttribute("data-pdf-section-anchor", sectionModel.anchor || "");

      var sectionTitle = document.createElement("h2");
      sectionTitle.className = "pi-export-section-title";
      sectionTitle.textContent = sectionModel.title;
      sectionTitle.setAttribute("data-export-source-id", "section:" + sectionModel.anchor + ":title");
      section.appendChild(sectionTitle);

      if (
        sectionModel.anchor === "parking" &&
        model.parkingMap &&
        model.parkingMap.imageSrc
      ) {
        var parkingMap = document.createElement("div");
        parkingMap.className = "pi-export-parking-map";
        parkingMap.setAttribute("data-pdf-section-item", "1");

        if (model.parkingMap.imageSrc) {
          parkingMap.appendChild(
            createManagedImage(document, {
              src: model.parkingMap.imageSrc,
              alt: "",
              className: "pi-export-map-image pi-export-map-image--parking",
              frameClassName: "pi-export-image-frame pi-export-map-image-frame pi-export-map-image-frame--parking",
              imageRole: "map",
              placeholderClass: "pi-export-map-placeholder"
            }, pendingImages)
          );
        }

        if (model.parkingMap.attribution && !model.parkingMap.imageSrc) {
          var parkingMapMeta = document.createElement("div");
          parkingMapMeta.className = "pi-export-map-meta";
          var parkingAttribution = document.createElement("span");
          parkingAttribution.className = "pi-export-map-attribution notranslate";
          parkingAttribution.textContent = model.parkingMap.attribution;
          parkingAttribution.setAttribute("translate", "no");
          parkingMapMeta.appendChild(parkingAttribution);
          parkingMap.appendChild(parkingMapMeta);
        }

        section.appendChild(parkingMap);
      }

      sectionModel.blocks.forEach(function (blockModel) {
        var card = document.createElement("article");
        card.className = "pi-export-card pi-export-card--" + String(blockModel.type || "text").toLowerCase().replace(/\s+/g, "-");
        card.setAttribute("data-pdf-section-item", "1");

        if (blockModel.type === "Warning") {
          card.classList.add("pi-export-card--warning");
        }
        if (blockModel.type === "Step") {
          card.classList.add("pi-export-card--step");
        }

        var cardLayout = document.createElement("div");
        cardLayout.className = "pi-export-card-layout";
        var textColumn = document.createElement("div");
        textColumn.className = "pi-export-card-text";
        var mediaColumn = document.createElement("div");
        mediaColumn.className = "pi-export-card-media";

        if (blockModel.stepNumber || blockModel.title) {
          var cardHead = document.createElement("div");
          cardHead.className = "pi-export-card-head";

          if (blockModel.stepNumber) {
            var badge = document.createElement("span");
            badge.className = "pi-export-step-badge";
            badge.textContent = blockModel.stepNumber;
            cardHead.appendChild(badge);
          }

          if (blockModel.title) {
            var cardTitle = document.createElement("h3");
            cardTitle.className = "pi-export-card-title";
            cardTitle.textContent = blockModel.title;
            cardTitle.setAttribute("data-export-source-id", "block:" + blockModel.id + ":title");
            cardHead.appendChild(cardTitle);
          }

          textColumn.appendChild(cardHead);
        }

        if (blockModel.body) {
          var body = document.createElement("div");
          body.className = "pi-export-card-body";
          body.setAttribute("data-export-source-id", "block:" + blockModel.id + ":body");
          appendStructuredContent(document, body, blockModel.bodyContent || []);
          textColumn.appendChild(body);
        }

        if (blockModel.imageSrc) {
          mediaColumn.appendChild(
            createManagedImage(document, {
              src: blockModel.imageSrc,
              alt: blockModel.imageAlt || blockModel.title || sectionModel.title,
              className: "pi-export-card-image",
              frameClassName: "pi-export-image-frame pi-export-card-image-frame",
              imageRole: "card",
              placeholderClass: "pi-export-image-placeholder"
            }, pendingImages)
          );
        }

        if (blockModel.mapImageSrc) {
          mediaColumn.appendChild(
            createManagedImage(document, {
              src: blockModel.mapImageSrc,
              alt: blockModel.title || sectionModel.title,
              className: "pi-export-map-image pi-export-map-image--block",
              frameClassName: "pi-export-image-frame pi-export-map-image-frame pi-export-map-image-frame--block",
              imageRole: "map",
              placeholderClass: "pi-export-map-placeholder"
            }, pendingImages)
          );
        }

        if (blockModel.caption) {
          var caption = document.createElement("p");
          caption.className = "pi-export-card-caption";
          caption.textContent = blockModel.caption;
          caption.setAttribute("data-export-source-id", "block:" + blockModel.id + ":caption");
          textColumn.appendChild(caption);
        }

        if (blockModel.linkHref) {
          var linkWrap = document.createElement("p");
          linkWrap.className = "pi-export-card-link";
          var link = document.createElement("a");
          link.href = blockModel.linkHref;
          link.target = "_blank";
          link.rel = "noopener noreferrer nofollow";
          link.textContent = blockModel.linkLabel || blockModel.linkHref;
          link.setAttribute("data-export-source-id", "block:" + blockModel.id + ":link_label");
          linkWrap.appendChild(link);
          textColumn.appendChild(linkWrap);
        }

        if (blockModel.qrEntries && blockModel.qrEntries.length) {
          var blockQrPanel = createPdfQrPanel(
            document,
            "",
            blockModel.qrEntries,
            "pi-export-card-qr-panel"
          );
          if (blockQrPanel) {
            var panelTitle = blockQrPanel.querySelector(".pi-export-panel-title");
            if (panelTitle && panelTitle.parentNode) {
              panelTitle.parentNode.removeChild(panelTitle);
            }
            textColumn.appendChild(blockQrPanel);
          }
        }

        if (blockModel.mapAttribution && !blockModel.mapImageSrc) {
          var blockMapAttribution = document.createElement("p");
          blockMapAttribution.className = "pi-export-map-attribution notranslate";
          blockMapAttribution.textContent = blockModel.mapAttribution;
          blockMapAttribution.setAttribute("translate", "no");
          textColumn.appendChild(blockMapAttribution);
        }

        cardLayout.appendChild(textColumn);
        if (blockModel.imageSrc || blockModel.mapImageSrc) {
          cardLayout.appendChild(mediaColumn);
        }
        card.appendChild(cardLayout);

        section.appendChild(card);
      });

      exportDocument.appendChild(section);
    });

    if (!model.sections.length) {
      var empty = document.createElement("p");
      empty.className = "pi-export-empty";
      empty.textContent = model.emptyMessage || "";
      empty.setAttribute("data-export-source-id", "guide:empty");
      exportDocument.appendChild(empty);
    }

    exportWrapper.appendChild(exportDocument);
    exportRoot.appendChild(exportWrapper);

    return {
      exportRoot: exportRoot,
      exportPage: exportWrapper,
      exportDocument: exportDocument,
      pendingImages: pendingImages,
      model: model
    };
  }

  function createExportDocumentShell(documentNode, sourceDocument) {
    var content = documentNode.createElement("article");
    content.className = "pi-export-document";
    content.setAttribute("data-property-instruction-export", "document");
    content.setAttribute("lang", sourceDocument.getAttribute("lang") || "en");
    content.setAttribute("dir", sourceDocument.getAttribute("dir") || "ltr");
    markExportNodeNotranslate(content);
    return content;
  }

  function createExportPageShell(documentNode, sourceDocument) {
    var page = documentNode.createElement("section");
    page.className = "pi-export-page";
    page.setAttribute("data-pdf-page", "1");
    page.setAttribute("data-property-instruction-export", "page");
    page.setAttribute("lang", sourceDocument.getAttribute("lang") || "en");
    page.setAttribute("dir", sourceDocument.getAttribute("dir") || "ltr");
    markExportNodeNotranslate(page);
    page.style.width = PDF_EXPORT_WIDTH + "px";
    page.style.height = PDF_EXPORT_PAGE_HEIGHT + "px";
    page.style.padding =
      PDF_EXPORT_PAGE_PADDING_TOP + "px " +
      PDF_EXPORT_PAGE_PADDING_RIGHT + "px " +
      PDF_EXPORT_PAGE_PADDING_BOTTOM + "px " +
      PDF_EXPORT_PAGE_PADDING_LEFT + "px";

    var viewport = documentNode.createElement("div");
    viewport.className = "pi-export-page-body";
    viewport.style.height = PDF_EXPORT_PAGE_BODY_HEIGHT + "px";
    markExportNodeNotranslate(viewport);

    var body = createExportDocumentShell(documentNode, sourceDocument);
    viewport.appendChild(body);
    page.appendChild(viewport);

    var footer = documentNode.createElement("footer");
    footer.className = "pi-export-footer";
    footer.setAttribute("dir", sourceDocument.getAttribute("dir") || "ltr");
    markExportNodeNotranslate(footer);
    footer.style.minHeight = PDF_EXPORT_FOOTER_HEIGHT + "px";
    footer.style.bottom = PDF_EXPORT_PAGE_PADDING_BOTTOM + "px";
    footer.style.left = PDF_EXPORT_PAGE_PADDING_LEFT + "px";
    footer.style.right = PDF_EXPORT_PAGE_PADDING_RIGHT + "px";
    page.appendChild(footer);

    return {
      page: page,
      viewport: viewport,
      body: body,
      footer: footer,
      hasContent: false
    };
  }

  function pageBodyOverflows(pageState) {
    return pageState.viewport.scrollHeight > pageState.viewport.clientHeight + 1;
  }

  function createSectionSlice(documentNode, titleNode) {
    var section = documentNode.createElement("section");
    section.className = "pi-export-section";
    var parentSection = titleNode && titleNode.parentNode && titleNode.parentNode.classList && titleNode.parentNode.classList.contains("pi-export-section")
      ? titleNode.parentNode
      : null;
    if (parentSection) {
      var sectionAnchor = String(parentSection.getAttribute("data-pdf-section-anchor") || "").trim();
      if (sectionAnchor) {
        section.setAttribute("data-pdf-section-anchor", sectionAnchor);
      }
    }

    var sectionTitle = titleNode.cloneNode(true);
    section.appendChild(sectionTitle);

    var items = documentNode.createElement("div");
    items.className = "pi-export-section-items";
    section.appendChild(items);

    return {
      section: section,
      items: items
    };
  }

  function paginateExportDocument(exportState) {
    var documentNode = exportState.exportDocument.ownerDocument;
    var exportPages = documentNode.createElement("div");
    exportPages.className = "pi-export-pages";
    var sourcePaginatableItemCount = exportState.exportDocument.querySelectorAll("[data-pdf-section-item='1']").length;
    exportState.exportPage.innerHTML = "";
    exportState.exportPage.appendChild(exportPages);

    var pageState = createExportPageShell(documentNode, exportState.exportDocument);
    exportPages.appendChild(pageState.page);

    function newPage() {
      pageState = createExportPageShell(documentNode, exportState.exportDocument);
      exportPages.appendChild(pageState.page);
      return pageState;
    }

    function appendStandaloneNode(node) {
      pageState.body.appendChild(node);
      if (pageBodyOverflows(pageState) && pageState.hasContent) {
        pageState.body.removeChild(node);
        newPage();
        pageState.body.appendChild(node);
      }
      pageState.hasContent = true;
    }

    Array.from(exportState.exportDocument.children).forEach(function (childNode) {
      if (childNode.classList.contains("pi-export-section")) {
        var sectionTitle = childNode.querySelector(".pi-export-section-title");
        var sourceItems = Array.from(childNode.children).filter(function (sectionChild) {
          return sectionChild !== sectionTitle && sectionChild.getAttribute("data-pdf-section-item") === "1";
        });
        var sectionSlice = createSectionSlice(documentNode, sectionTitle);
        pageState.body.appendChild(sectionSlice.section);

        sourceItems.forEach(function (sourceItem) {
          sectionSlice.items.appendChild(sourceItem);

          if (pageBodyOverflows(pageState)) {
            sectionSlice.items.removeChild(sourceItem);

            if (!sectionSlice.items.children.length) {
              pageState.body.removeChild(sectionSlice.section);
            }

            newPage();
            sectionSlice = createSectionSlice(documentNode, sectionTitle);
            pageState.body.appendChild(sectionSlice.section);
            sectionSlice.items.appendChild(sourceItem);
          }

          pageState.hasContent = true;
        });

        if (!sectionSlice.items.children.length && sectionSlice.section.parentNode === pageState.body) {
          pageState.body.removeChild(sectionSlice.section);
        }
        return;
      }

      appendStandaloneNode(childNode);
    });

    exportState.exportPages = exportPages;
    var paginatedItemCount = exportPages.querySelectorAll("[data-pdf-section-item='1']").length;
    if (sourcePaginatableItemCount !== paginatedItemCount) {
      throw new Error("PDF pagination dropped export content");
    }
    return exportState;
  }

  function populatePageFooters(exportState, guideTitle) {
    var pageNodes = Array.prototype.slice.call(exportState.exportPages.querySelectorAll(".pi-export-page"));
    var footerDate = new Intl.DateTimeFormat("en-GB").format(new Date());

    pageNodes.forEach(function (pageNode, index) {
      var footer = pageNode.querySelector(".pi-export-footer");
      if (!footer) {
        return;
      }
      footer.textContent = "";

      var left = document.createElement("span");
      left.className = "pi-export-footer-left";
      left.textContent = guideTitle + " " + footerDate;
      markExportNodeNotranslate(left);

      var right = document.createElement("span");
      right.className = "pi-export-footer-right";
      right.textContent = (index + 1) + " / " + pageNodes.length;
      markExportNodeNotranslate(right);

      footer.appendChild(left);
      footer.appendChild(right);
    });
  }

  function resolvePdfContentsDestinations(exportState) {
    var destinations = {};
    var pageNodes = Array.prototype.slice.call(exportState.exportPages.querySelectorAll(".pi-export-page"));
    pageNodes.forEach(function (pageNode, pageIndex) {
      var pageRect = pageNode.getBoundingClientRect();
      Array.prototype.slice.call(pageNode.querySelectorAll("[data-pdf-section-anchor]")).forEach(function (sectionNode) {
        var anchor = String(sectionNode.getAttribute("data-pdf-section-anchor") || "").trim();
        if (!anchor || destinations[anchor]) {
          return;
        }
        var sectionRect = sectionNode.getBoundingClientRect();
        destinations[anchor] = {
          pageNumber: pageIndex + 1,
          topRatio: pageRect.height ? Math.max(0, (sectionRect.top - pageRect.top) / pageRect.height) : 0
        };
      });
    });
    return destinations;
  }

  function populatePdfContentsDestinations(exportState) {
    var startedAt = Date.now();
    var destinations = resolvePdfContentsDestinations(exportState);
    Array.prototype.slice.call(exportState.exportRoot.querySelectorAll("[data-pdf-contents-page]")).forEach(function (pageNode) {
      var anchor = String(pageNode.getAttribute("data-pdf-contents-page") || "").trim();
      var destination = destinations[anchor];
      pageNode.textContent = destination ? String(destination.pageNumber) : "";
    });
    exportState.contentsDestinations = destinations;
    recordPdfPerformance(getPdfPerformanceState(), "contentsResolutionMs", startedAt);
    window.__propertyInstructionPdfContentsDestinations = destinations;
    return destinations;
  }

  function buildModelParityMap(model) {
    var nodeMap = {};
    function setNodeValue(nodeId, value) {
      if (!nodeId) {
        return;
      }
      nodeMap[nodeId] = normalizeText(value || "");
    }

    setNodeValue("guide:kicker", model.kicker);
    setNodeValue("field:title", model.title);
    setNodeValue("field:address", model.address && model.address.value);
    setNodeValue("field:check_in", model.checkIn && model.checkIn.value);
    setNodeValue("field:check_out", model.checkOut && model.checkOut.value);
    setNodeValue("field:wifi_name", model.wifiName && model.wifiName.value);
    setNodeValue("field:wifi_password", model.wifiPassword && model.wifiPassword.value);
    setNodeValue("field:emergency_contact", model.emergencyContact && model.emergencyContact.value);
    setNodeValue("field:last_reviewed", model.lastReviewed && model.lastReviewed.value);
    setNodeValue("label:address", model.address && model.address.label);
    setNodeValue("label:check_in", model.checkIn && model.checkIn.label);
    setNodeValue("label:check_out", model.checkOut && model.checkOut.label);
    setNodeValue("label:wifi_name", model.wifiName && model.wifiName.label);
    setNodeValue("label:wifi_password", model.wifiPassword && model.wifiPassword.label);
    setNodeValue("label:emergency_contact", model.emergencyContact && model.emergencyContact.label);
    setNodeValue("label:last_reviewed", model.lastReviewed && model.lastReviewed.label);
    setNodeValue("map:title", model.map && model.map.title);
    setNodeValue("map:link_label", model.map && model.map.linkLabel);
    setNodeValue("guide:empty", model.emptyMessage);

    (model.sections || []).forEach(function (sectionModel) {
      setNodeValue("section:" + sectionModel.anchor + ":title", sectionModel.title);
      (sectionModel.blocks || []).forEach(function (blockModel) {
        setNodeValue("block:" + blockModel.id + ":title", blockModel.title);
        setNodeValue("block:" + blockModel.id + ":body", flattenStructuredContent(blockModel.bodyContent || []));
        setNodeValue("block:" + blockModel.id + ":caption", blockModel.caption);
        setNodeValue("block:" + blockModel.id + ":link_label", blockModel.linkLabel);
      });
    });

    return nodeMap;
  }

  function compareSnapshotToModel(snapshot, model) {
    var modelParityMap = buildModelParityMap(model);
    var mismatches = [];

    snapshot.orderedNodeIds.forEach(function (nodeId) {
      if (!(nodeId in modelParityMap)) {
        mismatches.push({ nodeId: nodeId, reason: "missing-in-model" });
        return;
      }
      if ((snapshot.nodeMap[nodeId] || "") !== (modelParityMap[nodeId] || "")) {
        mismatches.push({
          nodeId: nodeId,
          reason: "value-mismatch",
          sourceLength: (snapshot.nodeMap[nodeId] || "").length,
          modelLength: (modelParityMap[nodeId] || "").length
        });
      }
    });

    return {
      modelParityMap: modelParityMap,
      mismatches: mismatches
    };
  }

  function captureExportDomTextMap(exportRoot) {
    var textMap = {};
    var duplicateNodeIds = [];
    Array.prototype.slice.call((exportRoot || document).querySelectorAll("[data-export-source-id]")).forEach(function (element) {
      var nodeId = String(element.getAttribute("data-export-source-id") || "").trim();
      if (!nodeId) {
        return;
      }
      var nextValue;
      if (element.classList && element.classList.contains("pi-export-card-body")) {
        nextValue = flattenStructuredContent(extractStructuredContent(element));
      } else {
        nextValue = normalizeText(element.innerText || element.textContent || "");
      }
      if (textMap.hasOwnProperty(nodeId) && textMap[nodeId] !== nextValue) {
        duplicateNodeIds.push(nodeId);
      }
      textMap[nodeId] = nextValue;
    });
    return {
      textMap: textMap,
      duplicateNodeIds: duplicateNodeIds
    };
  }

  function compareExportDomToParityMap(exportRoot, modelParityMap) {
    var captured = captureExportDomTextMap(exportRoot);
    var mismatches = summarizeNodeMapDiff(captured.textMap, modelParityMap);
    var missingNodeIds = [];
    Object.keys(modelParityMap || {}).forEach(function (nodeId) {
      if (!captured.textMap.hasOwnProperty(nodeId) && normalizeText((modelParityMap || {})[nodeId] || "")) {
        missingNodeIds.push(nodeId);
      }
    });
    return {
      textMap: captured.textMap,
      duplicateNodeIds: captured.duplicateNodeIds,
      missingNodeIds: missingNodeIds,
      mismatches: mismatches
    };
  }

  function recordExportDomStageSnapshot(stageName, exportRoot) {
    var captured = captureExportDomTextMap(exportRoot);
    window.__propertyInstructionLastExportDomStageSnapshots = window.__propertyInstructionLastExportDomStageSnapshots || {};
    window.__propertyInstructionLastExportDomStageSnapshots[stageName] = {
      capturedAt: Date.now(),
      textMap: Object.assign({}, captured.textMap),
      duplicateNodeIds: captured.duplicateNodeIds.slice()
    };
    return captured;
  }

  function startExportMutationGuard(exportRoot) {
    var state = {
      records: [],
      startedAt: Date.now(),
      observer: null
    };

    state.observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        var wrapperDetected = false;
        Array.prototype.slice.call(mutation.addedNodes || []).forEach(function (node) {
          if (node && node.nodeType === Node.ELEMENT_NODE) {
            var tagName = String(node.tagName || "").toLowerCase();
            if (tagName === "font" || tagName === "span" || tagName === "div") {
              wrapperDetected = true;
            }
          }
        });

        var mutationNode = mutation.target && mutation.target.nodeType === Node.TEXT_NODE ? mutation.target.parentElement : mutation.target;
        var sourceElement = mutationNode && mutationNode.closest ? mutationNode.closest("[data-export-source-id]") : null;
        state.records.push({
          timestamp: Date.now(),
          nodeId: sourceElement ? String(sourceElement.getAttribute("data-export-source-id") || "").trim() : "",
          type: mutation.type,
          addedNodeCount: (mutation.addedNodes || []).length || 0,
          removedNodeCount: (mutation.removedNodes || []).length || 0,
          wrapperDetected: wrapperDetected
        });
      });
      state.records = state.records.slice(-200);
    });

    state.observer.observe(exportRoot, {
      subtree: true,
      childList: true,
      characterData: true
    });

    return state;
  }

  function stopExportMutationGuard(guardState) {
    if (guardState && guardState.observer) {
      guardState.observer.disconnect();
    }
  }

  function validateExportDomParity(exportRoot, modelParityMap, stageName, mutationGuardState) {
    recordExportDomStageSnapshot(stageName, exportRoot);
    var exportParity = compareExportDomToParityMap(exportRoot, modelParityMap);
    var recentMutations = mutationGuardState ? (mutationGuardState.records || []).slice(-50) : [];
    var hasMutation = recentMutations.length > 0;

    window.__propertyInstructionLastExportDomDiagnostics = {
      stage: stageName,
      duplicateNodeIds: exportParity.duplicateNodeIds.slice(),
      missingNodeIds: exportParity.missingNodeIds.slice(),
      mismatches: exportParity.mismatches.slice(),
      mutationRecords: recentMutations.slice(),
      exportTextMap: redactNodeMap(exportParity.textMap)
    };

    if (exportParity.duplicateNodeIds.length || exportParity.missingNodeIds.length || exportParity.mismatches.length || hasMutation) {
      updateTranslationDiagnostics({
        exportDomStage: stageName,
        exportDomMismatches: exportParity.mismatches.slice(),
        exportDomMissingNodeIds: exportParity.missingNodeIds.slice(),
        exportDomDuplicateNodeIds: exportParity.duplicateNodeIds.slice(),
        exportDomMutationRecords: recentMutations.slice(-20)
      });
      setTranslationAbortReason("Export DOM mutated after translation", "export-dom-mutated-after-translation");
      throw new Error("Export DOM mutated after translation");
    }

    return exportParity;
  }

  function validateExportParity(model, exportState, sourceSnapshot) {
    var exportCardCount = exportState.exportPage.querySelectorAll(".pi-export-card").length;
    if (exportCardCount !== model.counts.blocks) {
      throw new Error("PDF export content does not match the visible guide");
    }
    var parity = compareSnapshotToModel(sourceSnapshot, model);
    window.__propertyInstructionLastExportParityMap = redactNodeMap(parity.modelParityMap);
    updateTranslationDiagnostics({
      parityMismatches: parity.mismatches.slice(),
      exportParityMap: redactNodeMap(parity.modelParityMap)
    });
    if (parity.mismatches.length) {
      throw new Error("Guide translation changed before PDF rendering");
    }
    return parity;
  }

  function loadScriptOnce(scriptId, sourceUrl, readyCheck) {
    if (readyCheck()) {
      return Promise.resolve();
    }
    if (!window.__propmsPdfLibraryPromises) {
      window.__propmsPdfLibraryPromises = {};
    }
    if (window.__propmsPdfLibraryPromises[scriptId]) {
      return window.__propmsPdfLibraryPromises[scriptId];
    }

    window.__propmsPdfLibraryPromises[scriptId] = new Promise(function (resolve, reject) {
      var existing = document.getElementById(scriptId);
      if (existing) {
        existing.addEventListener("load", function () {
          if (readyCheck()) {
            resolve();
            return;
          }
          reject(new Error("Unable to load PDF library"));
        }, { once: true });
        existing.addEventListener("error", function () {
          reject(new Error("Unable to load PDF library"));
        }, { once: true });
        return;
      }

      var script = document.createElement("script");
      script.id = scriptId;
      script.async = true;
      script.src = sourceUrl;
      script.onload = function () {
        if (readyCheck()) {
          resolve();
          return;
        }
        reject(new Error("Unable to load PDF library"));
      };
      script.onerror = function () {
        reject(new Error("Unable to load PDF library"));
      };
      document.head.appendChild(script);
    });

    return window.__propmsPdfLibraryPromises[scriptId];
  }

  async function ensurePdfLibrary() {
    await loadScriptOnce("propms-html2canvas", HTML2CANVAS_LIBRARY_URL, function () {
      return typeof window.html2canvas === "function";
    });
    await loadScriptOnce("propms-jspdf", JSPDF_LIBRARY_URL, function () {
      return !!(window.jspdf && typeof window.jspdf.jsPDF === "function");
    });
    if (!(window.html2canvas && window.jspdf && window.jspdf.jsPDF)) {
      throw new Error("PDF library unavailable");
    }
  }

  async function ensureQrCodeLibrary() {
    await loadScriptOnce("propms-qrcodegen", QRCODE_LIBRARY_URL, function () {
      return !!(window.qrcodegen && window.qrcodegen.QrCode && window.qrcodegen.QrCode.Ecc);
    });
    if (!(window.qrcodegen && window.qrcodegen.QrCode && window.qrcodegen.QrCode.Ecc)) {
      throw new Error("QR library unavailable");
    }
  }

  function collectModelImageSources(model) {
    var imageSources = [];
    function pushSource(sourceUrl) {
      if (!sourceUrl) {
        return;
      }
      var resolvedUrl = resolveExportImageUrl(sourceUrl);
      if (!resolvedUrl || imageSources.indexOf(resolvedUrl) !== -1) {
        return;
      }
      imageSources.push(resolvedUrl);
    }

    if (model.coverImage && model.coverImage.src) {
      pushSource(model.coverImage.src);
    }
    (model.sections || []).forEach(function (sectionModel) {
      (sectionModel.blocks || []).forEach(function (blockModel) {
        pushSource(blockModel.imageSrc);
      });
    });

    return imageSources;
  }

  function deepCloneModel(model) {
    return JSON.parse(JSON.stringify(model || {}));
  }

  async function prewarmImageDataCacheForModel(model, exportImageDataCache) {
    var imageSources = collectModelImageSources(model);
    await Promise.all(imageSources.map(function (resolvedUrl) {
      return getExportImageDataUri(resolvedUrl, exportImageDataCache);
    }));
    return {
      uniqueImageCount: imageSources.length
    };
  }

  function getMapSnapshotCacheKey(mapConfig) {
    return [
      Number(mapConfig.centerLongitude != null ? mapConfig.centerLongitude : mapConfig.longitude).toFixed(6),
      Number(mapConfig.centerLatitude != null ? mapConfig.centerLatitude : mapConfig.latitude).toFixed(6),
      Number(mapConfig.markerLongitude != null ? mapConfig.markerLongitude : mapConfig.longitude).toFixed(6),
      Number(mapConfig.markerLatitude != null ? mapConfig.markerLatitude : mapConfig.latitude).toFixed(6),
      String(mapConfig.zoom || 16),
      String(mapConfig.width || 760),
      String(mapConfig.height || 300),
      OPEN_STREET_MAP_TILE_TEMPLATE,
      PDF_LAYOUT_VERSION
    ].join("::");
  }

  function getMapDiagnosticsStore() {
    window.__propertyInstructionLastMapDiagnostics = window.__propertyInstructionLastMapDiagnostics || {
      maps: []
    };
    return window.__propertyInstructionLastMapDiagnostics;
  }

  function pushMapDiagnostic(diagnostic) {
    var diagnosticsStore = getMapDiagnosticsStore();
    diagnosticsStore.maps.push(diagnostic);
    diagnosticsStore.maps = diagnosticsStore.maps.slice(-20);
  }

  function createMapMarkerCanvas() {
    var markerCanvas = document.createElement("canvas");
    markerCanvas.width = 34;
    markerCanvas.height = 46;
    var ctx = markerCanvas.getContext("2d");
    ctx.fillStyle = "#115e59";
    ctx.beginPath();
    ctx.arc(17, 14, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(17, 42);
    ctx.lineTo(8, 20);
    ctx.lineTo(26, 20);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(17, 14, 4.5, 0, Math.PI * 2);
    ctx.fill();
    return markerCanvas;
  }

  function drawMapAttribution(targetContext, width, mapHeight, attribution) {
    targetContext.fillStyle = "#ffffff";
    targetContext.fillRect(0, mapHeight, width, 28);
    targetContext.fillStyle = "#475569";
    targetContext.font = "12px Inter, Arial, sans-serif";
    targetContext.textBaseline = "middle";
    targetContext.fillText(attribution, 12, mapHeight + 14);
  }

  function buildMapSnapshotDataUri(mapCanvas, mapConfig) {
    var exportCanvas = document.createElement("canvas");
    exportCanvas.width = mapConfig.width;
    exportCanvas.height = mapConfig.height + 28;
    var ctx = exportCanvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    ctx.drawImage(mapCanvas, 0, 0, mapConfig.width, mapConfig.height);

    var markerCanvas = createMapMarkerCanvas();
    var markerX = Math.round(Number(mapConfig.projectedMarkerX || 0) - (markerCanvas.width / 2));
    var markerY = Math.round(Number(mapConfig.projectedMarkerY || 0) - (markerCanvas.height - 4));
    ctx.drawImage(markerCanvas, markerX, markerY);
    drawMapAttribution(ctx, exportCanvas.width, mapConfig.height, mapConfig.attribution);

    return exportCanvas.toDataURL("image/png");
  }

  function projectLongitudeToWorldX(longitude, zoomLevel) {
    var scale = 256 * Math.pow(2, zoomLevel);
    return ((longitude + 180) / 360) * scale;
  }

  function projectLatitudeToWorldY(latitude, zoomLevel) {
    var sinLatitude = Math.sin((latitude * Math.PI) / 180);
    var scale = 256 * Math.pow(2, zoomLevel);
    return (
      (0.5 - (Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (4 * Math.PI))) * scale
    );
  }

  function buildOpenStreetMapTileUrl(zoomLevel, tileX, tileY) {
    return OPEN_STREET_MAP_TILE_TEMPLATE
      .replace("{z}", String(zoomLevel))
      .replace("{x}", String(tileX))
      .replace("{y}", String(tileY));
  }

  function loadImageFromDataUri(dataUri) {
    return new Promise(function (resolve, reject) {
      var image = new Image();
      image.decoding = "sync";
      image.onload = function () {
        if (typeof image.decode === "function") {
          image.decode().catch(function () {
            return null;
          }).finally(function () {
            resolve(image);
          });
          return;
        }
        resolve(image);
      };
      image.onerror = function () {
        reject(new Error("map-tile-load-failed"));
      };
      image.src = dataUri;
    });
  }

  async function getOrCreateDecodedTileImage(tileUrl, exportImageDataCache, decodedTileImageCache) {
    if (!decodedTileImageCache.has(tileUrl)) {
      decodedTileImageCache.set(tileUrl, (async function () {
        var tileDataUri = await getExportImageDataUri(tileUrl, exportImageDataCache);
        return loadImageFromDataUri(tileDataUri);
      })());
    }
    return decodedTileImageCache.get(tileUrl);
  }

  function sampleCanvasPaintStats(sourceCanvas) {
    if (!sourceCanvas || !sourceCanvas.width || !sourceCanvas.height) {
      return {
        width: 0,
        height: 0,
        variance: 0,
        nonWhiteRatio: 0,
        painted: false
      };
    }

    var sampleWidth = Math.max(1, Math.min(sourceCanvas.width, 160));
    var sampleHeight = Math.max(1, Math.min(sourceCanvas.height, 120));
    var analysisCanvas = document.createElement("canvas");
    analysisCanvas.width = sampleWidth;
    analysisCanvas.height = sampleHeight;
    var analysisContext = analysisCanvas.getContext("2d", { willReadFrequently: true });
    if (!analysisContext) {
      return {
        width: sourceCanvas.width,
        height: sourceCanvas.height,
        variance: 0,
        nonWhiteRatio: 0,
        painted: false
      };
    }

    analysisContext.drawImage(sourceCanvas, 0, 0, sampleWidth, sampleHeight);
    var imageData = analysisContext.getImageData(0, 0, sampleWidth, sampleHeight).data;
    var pixelCount = imageData.length / 4;
    var sum = 0;
    var sumSquares = 0;
    var nonWhiteCount = 0;
    for (var index = 0; index < imageData.length; index += 4) {
      var red = imageData[index];
      var green = imageData[index + 1];
      var blue = imageData[index + 2];
      var luminance = (0.2126 * red) + (0.7152 * green) + (0.0722 * blue);
      sum += luminance;
      sumSquares += luminance * luminance;
      if (red < 250 || green < 250 || blue < 250) {
        nonWhiteCount += 1;
      }
    }

    var mean = pixelCount ? (sum / pixelCount) : 0;
    var variance = pixelCount ? Math.max(0, (sumSquares / pixelCount) - (mean * mean)) : 0;
    var nonWhiteRatio = pixelCount ? (nonWhiteCount / pixelCount) : 0;

    return {
      width: sourceCanvas.width,
      height: sourceCanvas.height,
      variance: Number(variance.toFixed(3)),
      nonWhiteRatio: Number(nonWhiteRatio.toFixed(4)),
      painted: variance > 8 || (nonWhiteRatio > 0.05 && nonWhiteRatio < 0.98)
    };
  }

  async function renderStaticMapSnapshot(mapConfig, exportImageDataCache) {
    if (!mapConfig || !Number.isFinite(mapConfig.latitude) || !Number.isFinite(mapConfig.longitude)) {
      throw new Error("map-coordinates-missing");
    }
    var centerLatitude = Number.isFinite(mapConfig.centerLatitude) ? mapConfig.centerLatitude : mapConfig.latitude;
    var centerLongitude = Number.isFinite(mapConfig.centerLongitude) ? mapConfig.centerLongitude : mapConfig.longitude;
    var markerLatitude = Number.isFinite(mapConfig.markerLatitude) ? mapConfig.markerLatitude : centerLatitude;
    var markerLongitude = Number.isFinite(mapConfig.markerLongitude) ? mapConfig.markerLongitude : centerLongitude;
    var diagnostic = {
      kind: mapConfig.kind,
      centerLatitude: Number(centerLatitude.toFixed(6)),
      centerLongitude: Number(centerLongitude.toFixed(6)),
      markerLatitude: Number(markerLatitude.toFixed(6)),
      markerLongitude: Number(markerLongitude.toFixed(6)),
      markerCoordinateSource: mapConfig.markerCoordinateSource || "",
      zoom: mapConfig.zoom,
      style: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      width: mapConfig.width,
      height: mapConfig.height,
      startedAt: Date.now(),
      events: [],
      code: ""
    };

    try {
      var tileCanvas = document.createElement("canvas");
      tileCanvas.width = mapConfig.width;
      tileCanvas.height = mapConfig.height;
      var tileContext = tileCanvas.getContext("2d");
      if (!tileContext) {
        throw new Error("map-canvas-export-failed");
      }
      tileContext.fillStyle = "#eef2f4";
      tileContext.fillRect(0, 0, mapConfig.width, mapConfig.height);

      var zoomLevel = Math.max(0, Math.min(19, Math.round(mapConfig.zoom || 16)));
      var worldX = projectLongitudeToWorldX(centerLongitude, zoomLevel);
      var worldY = projectLatitudeToWorldY(centerLatitude, zoomLevel);
      var leftWorldX = worldX - (mapConfig.width / 2);
      var topWorldY = worldY - (mapConfig.height / 2);
      var startTileX = Math.floor(leftWorldX / 256);
      var endTileX = Math.floor((leftWorldX + mapConfig.width - 1) / 256);
      var startTileY = Math.floor(topWorldY / 256);
      var endTileY = Math.floor((topWorldY + mapConfig.height - 1) / 256);
      var maxTileIndex = Math.pow(2, zoomLevel);
      var tileRequests = [];

      for (var tileY = startTileY; tileY <= endTileY; tileY += 1) {
        if (tileY < 0 || tileY >= maxTileIndex) {
          continue;
        }
        for (var tileX = startTileX; tileX <= endTileX; tileX += 1) {
          var wrappedTileX = ((tileX % maxTileIndex) + maxTileIndex) % maxTileIndex;
          tileRequests.push({
            tileX: tileX,
            tileY: tileY,
            wrappedTileX: wrappedTileX,
            url: buildOpenStreetMapTileUrl(zoomLevel, wrappedTileX, tileY)
          });
        }
      }

      diagnostic.events.push({
        type: "tile-grid",
        timestamp: Date.now(),
        tileCount: tileRequests.length,
        zoom: zoomLevel
      });

      await Promise.all(tileRequests.map(async function (tileRequest) {
        var resolvedTileUrl = resolveExportImageUrl(tileRequest.url);
        if (!resolvedTileUrl) {
          throw new Error("map-tile-load-failed");
        }
        var tileImage = await getOrCreateDecodedTileImage(
          resolvedTileUrl,
          exportImageDataCache,
          pdfPreparationState.decodedTileImageCache
        );
        var drawX = Math.round((tileRequest.tileX * 256) - leftWorldX);
        var drawY = Math.round((tileRequest.tileY * 256) - topWorldY);
        tileContext.drawImage(tileImage, drawX, drawY, 256, 256);
      }));

      var renderedMap = {
        canvas: tileCanvas,
        paintStats: sampleCanvasPaintStats(tileCanvas)
      };
      if (!renderedMap.paintStats.painted) {
        throw new Error("map-render-timeout");
      }

      var markerWorldX = projectLongitudeToWorldX(markerLongitude, zoomLevel);
      var markerWorldY = projectLatitudeToWorldY(markerLatitude, zoomLevel);
      var projectedMarkerX = markerWorldX - leftWorldX;
      var projectedMarkerY = markerWorldY - topWorldY;
      diagnostic.projectedMarkerX = Number(projectedMarkerX.toFixed(2));
      diagnostic.projectedMarkerY = Number(projectedMarkerY.toFixed(2));
      diagnostic.markerInsideCanvas = projectedMarkerX >= 0
        && projectedMarkerX <= mapConfig.width
        && projectedMarkerY >= 0
        && projectedMarkerY <= mapConfig.height;
      if (!diagnostic.markerInsideCanvas) {
        throw new Error("map-marker-outside-canvas");
      }

      var dataUri = buildMapSnapshotDataUri(tileCanvas, Object.assign({}, mapConfig, {
        projectedMarkerX: projectedMarkerX,
        projectedMarkerY: projectedMarkerY,
        attribution: mapConfig.attribution || "© OpenStreetMap contributors"
      }));
      diagnostic.finishedAt = Date.now();
      diagnostic.durationMs = diagnostic.finishedAt - diagnostic.startedAt;
      diagnostic.code = "ok";
      diagnostic.paintStats = renderedMap.paintStats;
      pushMapDiagnostic(diagnostic);
      return {
        dataUri: dataUri,
        attribution: mapConfig.attribution || "© OpenStreetMap contributors",
        durationMs: diagnostic.durationMs
      };
    } catch (error) {
      diagnostic.finishedAt = Date.now();
      diagnostic.durationMs = diagnostic.finishedAt - diagnostic.startedAt;
      diagnostic.code = error && error.message ? error.message : "map-render-failed";
      if (error && error.lastPaintStats) {
        diagnostic.paintStats = error.lastPaintStats;
      }
      pushMapDiagnostic(diagnostic);
      throw error;
    }
  }

  async function getOrCreateMapSnapshot(mapConfig, mapImageCache, exportImageDataCache) {
    var cacheKey = getMapSnapshotCacheKey(mapConfig);
    if (!mapImageCache.has(cacheKey)) {
      mapImageCache.set(cacheKey, renderStaticMapSnapshot(mapConfig, exportImageDataCache));
    }
    return mapImageCache.get(cacheKey);
  }

  function buildQuickAccessEntries(model) {
    var quickEntries = [];
    var remainingLinks = (model.guideLinks || []).slice();
    var wifiPayload = buildWifiQrPayload(model);
    if (wifiPayload) {
      quickEntries.push({
        kind: "wifi",
        label: ((model.wifiName && model.wifiName.label) || "Wi-Fi") + ": " + ((model.wifiName && model.wifiName.value) || ""),
        linkHref: "",
        sourceNodeId: (model.wifiName && model.wifiName.valueNodeId) || "",
        payload: wifiPayload
      });
    }

    var propertyMapIndex = remainingLinks.findIndex(function (entry) {
      return entry.kind === "property-map";
    });
    if (propertyMapIndex !== -1) {
      var propertyMapEntry = remainingLinks.splice(propertyMapIndex, 1)[0];
      quickEntries.push({
        kind: propertyMapEntry.kind,
        label: propertyMapEntry.label,
        linkHref: propertyMapEntry.href,
        sourceNodeId: propertyMapEntry.sourceNodeId || "",
        blockId: propertyMapEntry.blockId || "",
        payload: propertyMapEntry.href
      });
    }

    return {
      quickAccessEntries: quickEntries,
      remainingLinkEntries: remainingLinks.map(function (entry) {
        return {
          kind: entry.kind,
          label: entry.label,
          linkHref: entry.href,
          sourceNodeId: entry.sourceNodeId || "",
          blockId: entry.blockId || "",
          payload: entry.href
        };
      })
    };
  }

  function assignQrImagesToEntries(entries, qrImageCache) {
    return (entries || []).map(function (entry) {
      return Object.assign({}, entry, {
        qrImageSrc: getOrCreateQrImageDataUri(entry.payload, qrImageCache)
      });
    });
  }

  function attachBlockQrEntries(model, remainingEntries, qrImageCache) {
    var blockEntryMap = {};
    (remainingEntries || []).forEach(function (entry) {
      if (!entry || !entry.blockId || !entry.linkHref) {
        return;
      }
      blockEntryMap[entry.blockId] = blockEntryMap[entry.blockId] || [];
      if (!blockEntryMap[entry.blockId].some(function (existingEntry) {
        return existingEntry.linkHref === entry.linkHref;
      })) {
        blockEntryMap[entry.blockId].push(Object.assign({}, entry, {
          qrImageSrc: getOrCreateQrImageDataUri(entry.payload, qrImageCache)
        }));
      }
    });

    (model.sections || []).forEach(function (sectionModel) {
      (sectionModel.blocks || []).forEach(function (blockModel) {
        blockModel.qrEntries = (blockEntryMap[blockModel.id] || []).slice();
      });
    });
  }

  async function prepareGuideModelAssets(model, exportImageDataCache, mapImageCache) {
    var preparedModel = deepCloneModel(model);
    var imageDiagnostics = await prewarmImageDataCacheForModel(preparedModel, exportImageDataCache);
    var mapStartedAt = Date.now();
    var mapRenderPlan = {
      propertyMap: !!(preparedModel.map && Number.isFinite(preparedModel.map.latitude) && Number.isFinite(preparedModel.map.longitude)),
      parkingMap: false,
      blockMapIds: []
    };
    var mapDiagnostics = {
      plan: mapRenderPlan,
      propertyMap: null,
      parkingMap: null,
      blockMaps: []
    };

    try {
      if (Number.isFinite(preparedModel.map.latitude) && Number.isFinite(preparedModel.map.longitude)) {
        var propertyMapSnapshot = await getOrCreateMapSnapshot({
          kind: "property",
          latitude: preparedModel.map.latitude,
          longitude: preparedModel.map.longitude,
          centerLatitude: preparedModel.map.latitude,
          centerLongitude: preparedModel.map.longitude,
          markerLatitude: preparedModel.map.latitude,
          markerLongitude: preparedModel.map.longitude,
          markerCoordinateSource: preparedModel.map.coordinateSource || "property_center",
          zoom: preparedModel.map.zoom || 16,
          width: 760,
          height: 220,
          attribution: "© OpenStreetMap contributors"
        }, mapImageCache, exportImageDataCache);
        preparedModel.map.imageSrc = propertyMapSnapshot.dataUri;
        preparedModel.map.attribution = propertyMapSnapshot.attribution || preparedModel.map.attribution;
        mapDiagnostics.propertyMap = {
          code: "ok",
          durationMs: propertyMapSnapshot.durationMs || 0,
          image: summarizeDiagnosticImageSource(propertyMapSnapshot.dataUri, "map")
        };
      }
    } catch (error) {
      mapDiagnostics.propertyMap = {
        code: error && error.message ? error.message : "map-render-failed"
      };
    }

    try {
      mapDiagnostics.parkingMap = {
        code: "omitted-by-render-plan"
      };
    } catch (error) {
      mapDiagnostics.parkingMap = {
        code: error && error.message ? error.message : "map-render-failed"
      };
    }

    for (var sectionIndex = 0; sectionIndex < preparedModel.sections.length; sectionIndex += 1) {
      var sectionModel = preparedModel.sections[sectionIndex];
      for (var blockIndex = 0; blockIndex < sectionModel.blocks.length; blockIndex += 1) {
        var blockModel = sectionModel.blocks[blockIndex];
        if (blockModel.type !== "Map") {
          continue;
        }
        if (Number.isFinite(blockModel.mapLatitude) && Number.isFinite(blockModel.mapLongitude)) {
          mapRenderPlan.blockMapIds.push(blockModel.id);
          try {
            var blockMapSnapshot = await getOrCreateMapSnapshot({
              kind: "block-" + (blockModel.id || "map"),
              latitude: blockModel.mapLatitude,
              longitude: blockModel.mapLongitude,
              centerLatitude: Number.isFinite(blockModel.mapCenterLatitude) ? blockModel.mapCenterLatitude : blockModel.mapLatitude,
              centerLongitude: Number.isFinite(blockModel.mapCenterLongitude) ? blockModel.mapCenterLongitude : blockModel.mapLongitude,
              markerLatitude: Number.isFinite(blockModel.mapMarkerLatitude) ? blockModel.mapMarkerLatitude : blockModel.mapLatitude,
              markerLongitude: Number.isFinite(blockModel.mapMarkerLongitude) ? blockModel.mapMarkerLongitude : blockModel.mapLongitude,
              markerCoordinateSource: blockModel.mapCoordinateSource || "fallback_center_as_marker",
              zoom: blockModel.mapZoom || 16,
              width: 760,
              height: 280,
              attribution: blockModel.mapAttribution || "© OpenStreetMap contributors"
            }, mapImageCache, exportImageDataCache);
            blockModel.mapImageSrc = blockMapSnapshot.dataUri;
            blockModel.mapAttribution = blockMapSnapshot.attribution || blockModel.mapAttribution;
            mapDiagnostics.blockMaps.push({
              blockId: blockModel.id,
              code: "ok",
              durationMs: blockMapSnapshot.durationMs || 0,
              image: summarizeDiagnosticImageSource(blockMapSnapshot.dataUri, "map")
            });
          } catch (error) {
            mapDiagnostics.blockMaps.push({
              blockId: blockModel.id,
              code: error && error.message ? error.message : "block-map-render-failed"
            });
          }
          continue;
        }
        mapDiagnostics.blockMaps.push({
          blockId: blockModel.id,
          code: "block-map-coordinates-missing"
        });
      }
    }

    var qrStartedAt = Date.now();
    var qrEntries = buildQuickAccessEntries(preparedModel);
    preparedModel.quickAccessEntries = assignQrImagesToEntries(qrEntries.quickAccessEntries, pdfPreparationState.qrImageCache);
    attachBlockQrEntries(preparedModel, qrEntries.remainingLinkEntries, pdfPreparationState.qrImageCache);
    var qrDiagnostics = {
      quickAccessCount: preparedModel.quickAccessEntries.length,
      blockQrCount: qrEntries.remainingLinkEntries.length
    };

    return {
      model: preparedModel,
      imageDiagnostics: imageDiagnostics,
      mapPreparationMs: Date.now() - mapStartedAt,
      mapDiagnostics: mapDiagnostics,
      qrGenerationMs: Date.now() - qrStartedAt,
      qrDiagnostics: qrDiagnostics
    };
  }

  async function prewarmPdfLibraries() {
    await Promise.allSettled([
      ensurePdfLibrary()
    ]);
  }

  async function preparePdfDependenciesForSnapshot(snapshot, downloadButton) {
    syncTranslationLanguageState();
    var guideIdentity = getGuideIdentity(downloadButton);
    var languageCode = translationState.requestedLanguage || SOURCE_LANGUAGE;
    var snapshotHash = getSnapshotHash(snapshot);
    var preparationKey = getPreparedStateKey(guideIdentity, languageCode, translationState.generation, snapshotHash);

    if (pdfPreparationState.preparedState && pdfPreparationState.preparedState.key === preparationKey) {
      return pdfPreparationState.preparedState;
    }
    if (translationState.preparationPromise && translationState.preparationKey === preparationKey) {
      return translationState.preparationPromise;
    }

    var preparationStartedAt = Date.now();
    translationState.preparationKey = preparationKey;
    translationState.preparationPromise = (async function () {
      await Promise.all([
        ensurePdfLibrary()
      ]);

      var currentSnapshot = captureSemanticSnapshot();
      if (!snapshotsEqual(currentSnapshot, snapshot)) {
        throw new Error("Guide translation changed before PDF rendering");
      }

      var model = extractGuideModel();
      if (buildWifiQrPayload(model) || (model.guideLinks || []).length) {
        await ensureQrCodeLibrary();
      }
      var preparedAssets = await prepareGuideModelAssets(
        model,
        pdfPreparationState.imageDataCache,
        pdfPreparationState.mapImageCache
      );

      var preparedState = {
        key: preparationKey,
        guideIdentity: guideIdentity,
        languageCode: languageCode,
        generation: translationState.generation,
        snapshotHash: snapshotHash,
        model: preparedAssets.model,
        imageDataCache: pdfPreparationState.imageDataCache,
        preparedAt: Date.now(),
        mapPreparationMs: preparedAssets.mapPreparationMs,
        qrGenerationMs: preparedAssets.qrGenerationMs,
        mapDiagnostics: preparedAssets.mapDiagnostics,
        qrDiagnostics: preparedAssets.qrDiagnostics,
        imageWarmDiagnostics: preparedAssets.imageDiagnostics
      };
      pdfPreparationState.preparedState = preparedState;
      getPdfPerformanceState().translationReadyToExportPreparedMs =
        translationState.readyAt
          ? Math.max(0, preparedState.preparedAt - translationState.readyAt)
          : (Date.now() - preparationStartedAt);
      getPdfPerformanceState().mapPreparationMs = preparedAssets.mapPreparationMs;
      getPdfPerformanceState().qrGenerationMs = preparedAssets.qrGenerationMs;
      return preparedState;
    })().finally(function () {
      if (translationState.preparationKey === preparationKey) {
        translationState.preparationPromise = null;
      }
    });

    return translationState.preparationPromise;
  }

  function schedulePdfPreparationWarmup(downloadButton) {
    if (!getGuideScreen()) {
      return;
    }
    if (translationState.warmupScheduled) {
      return;
    }
    translationState.warmupScheduled = true;
    requestIdleWork(function () {
      var warmupButton = downloadButton || document.querySelector(".pi-pdf-download");
      var warmupGeneration = translationState.generation;
      var warmupLanguage = translationState.requestedLanguage || SOURCE_LANGUAGE;
      translationState.warmupScheduled = false;
      schedulePdfLibraryWarmup();
      if (!translationState.readySnapshot || !getCurrentSnapshotIfReady(warmupLanguage, warmupGeneration)) {
        return null;
      }
      ensureSettledGuideSnapshot().then(function (snapshot) {
        return preparePdfDependenciesForSnapshot(snapshot, warmupButton);
      }).catch(function () {
        if (
          getGuideScreen() &&
          translationState.generation === warmupGeneration &&
          (translationState.requestedLanguage || SOURCE_LANGUAGE) === warmupLanguage &&
          translationState.readySnapshot &&
          !pdfPreparationState.preparedState
        ) {
          window.setTimeout(function () {
            schedulePdfPreparationWarmup(warmupButton);
          }, 600);
        }
        return null;
      });
    }, PDF_WARM_PREPARE_TIMEOUT_MS);
  }

  function cachePdfArtifact(cacheKey, artifact) {
    pdfPreparationState.artifactCache = {};
    pdfPreparationState.artifactCache[cacheKey] = Object.assign({
      cachedAt: Date.now()
    }, artifact || {});
  }

  function getCachedPdfArtifact(cacheKey) {
    return pdfPreparationState.artifactCache[cacheKey] || null;
  }

  function withTimeout(promise, timeoutMs, message) {
    return Promise.race([
      promise,
      new Promise(function (_, reject) {
        window.setTimeout(function () {
          reject(new Error(message));
        }, timeoutMs);
      })
    ]);
  }

  function updateExportProgress(downloadButton, statusElement, buttonLabel, statusMessage, stepName, extraDetails) {
    var currentLabel = downloadButton ? String(downloadButton.getAttribute("data-progress-label") || downloadButton.textContent || "").trim() : "";
    if (downloadButton) {
      if (buttonLabel) {
        setToolbarButtonLabel(downloadButton, buttonLabel);
      } else if (currentLabel) {
        setToolbarButtonLabel(downloadButton, currentLabel + "…");
      }
    }
    if (statusElement) {
      statusElement.textContent = statusMessage || "…";
    }
    window.__propertyInstructionPdfStep = stepName || "";
    updatePdfProgressUi(stepName || "", extraDetails || {});
  }

  function setToolbarButtonLabel(button, labelText) {
    if (!button) {
      return;
    }
    var labelNode = button.querySelector(".pi-toolbar-action-label");
    if (labelNode) {
      labelNode.textContent = String(labelText || "");
      return;
    }
    button.textContent = String(labelText || "");
  }

  function waitForFonts() {
    if (document.fonts && document.fonts.ready) {
      return document.fonts.ready.catch(function () {
        return null;
      });
    }
    return Promise.resolve();
  }

  function waitForTwoAnimationFrames() {
    return new Promise(function (resolve) {
      requestAnimationFrame(function () {
        requestAnimationFrame(resolve);
      });
    });
  }

  function describeImageNode(img) {
    return Object.assign(
      summarizeDiagnosticImageSource(
        img.currentSrc || img.src || "",
        String(img.getAttribute("data-export-image-role") || "image"),
        {
          originalSourceKind: summarizeDiagnosticImageSource(
            img.getAttribute("data-export-image-original-src") || "",
            String(img.getAttribute("data-export-image-role") || "image")
          ).sourceKind
        }
      ),
      {
      complete: !!img.complete,
      naturalWidth: img.naturalWidth || 0,
      naturalHeight: img.naturalHeight || 0
      }
    );
  }

  function waitForImages(exportRoot) {
    var imageNodes = Array.prototype.slice.call(exportRoot.querySelectorAll("img"));
    var diagnostics = [];

    return Promise.all(imageNodes.map(function (img) {
      return new Promise(function (resolve, reject) {
        function recordAndResolve() {
          diagnostics.push(describeImageNode(img));
          resolve();
        }

        function recordAndReject() {
          diagnostics.push(describeImageNode(img));
          reject(new Error("One or more export images failed to load"));
        }

        function finalizeLoaded() {
          if (!img.naturalWidth || !img.naturalHeight) {
            recordAndReject();
            return;
          }
          if (typeof img.decode === "function") {
            img.decode().catch(function () {
              return null;
            }).finally(recordAndResolve);
            return;
          }
          recordAndResolve();
        }

        img.loading = "eager";
        img.decoding = "sync";

        if (img.complete) {
          if (img.naturalWidth && img.naturalHeight) {
            finalizeLoaded();
            return;
          }
          recordAndReject();
          return;
        }

        img.addEventListener("load", finalizeLoaded, { once: true });
        img.addEventListener("error", recordAndReject, { once: true });
      });
    })).then(function () {
      return diagnostics;
    });
  }

  function collectPageDiagnostics(pageNode) {
    var viewport = pageNode.querySelector(".pi-export-page-body");
    return {
      width: pageNode.offsetWidth,
      height: pageNode.offsetHeight,
      scrollWidth: pageNode.scrollWidth,
      scrollHeight: pageNode.scrollHeight,
      viewportWidth: viewport ? viewport.clientWidth : 0,
      viewportHeight: viewport ? viewport.clientHeight : 0,
      viewportScrollWidth: viewport ? viewport.scrollWidth : 0,
      viewportScrollHeight: viewport ? viewport.scrollHeight : 0,
      cardCount: pageNode.querySelectorAll(".pi-export-card").length,
      imageCount: pageNode.querySelectorAll("img").length,
      loadedImageCount: Array.prototype.slice.call(pageNode.querySelectorAll("img")).filter(function (img) {
        return img.naturalWidth > 0 && img.naturalHeight > 0;
      }).length,
      linkCount: pageNode.querySelectorAll("a[href]").length,
      textLength: normalizeText(pageNode.innerText || pageNode.textContent || "").length
    };
  }

  function collectCardLayoutDiagnostics(exportRoot) {
    return Array.prototype.slice.call(exportRoot.querySelectorAll(".pi-export-card")).map(function (cardNode) {
      var imageNode = cardNode.querySelector("img[data-export-image-role='card']");
      if (!imageNode) {
        return null;
      }
      var textColumn = cardNode.querySelector(".pi-export-card-text");
      var mediaColumn = cardNode.querySelector(".pi-export-card-media");
      var pageNode = cardNode.closest("[data-pdf-page]");
      var pageNumber = pageNode
        ? Array.prototype.indexOf.call(pageNode.parentNode.children, pageNode) + 1
        : 0;
      var imageRect = imageNode.getBoundingClientRect();
      var textRect = textColumn ? textColumn.getBoundingClientRect() : null;
      var cardRect = cardNode.getBoundingClientRect();
      return {
        sourceId: String((cardNode.querySelector("[data-export-source-id]") || {}).getAttribute ? cardNode.querySelector("[data-export-source-id]").getAttribute("data-export-source-id") : "" ).trim(),
        imageRatio: Number((imageNode.naturalWidth / imageNode.naturalHeight).toFixed(6)),
        chosenLayout: cardNode.classList.contains("pi-export-card--portrait-side")
          ? "portrait-side-by-side"
          : "landscape-stacked",
        cardWidth: Number(cardRect.width.toFixed(2)),
        cardHeight: Number(cardRect.height.toFixed(2)),
        textColumnWidth: textRect ? Number(textRect.width.toFixed(2)) : 0,
        textColumnHeight: textRect ? Number(textRect.height.toFixed(2)) : 0,
        imageWidth: Number(imageRect.width.toFixed(2)),
        imageHeight: Number(imageRect.height.toFixed(2)),
        mediaColumnWidth: mediaColumn ? Number(mediaColumn.getBoundingClientRect().width.toFixed(2)) : 0,
        pageNumber: pageNumber
      };
    }).filter(Boolean);
  }

  function assertExportImageSourcesAreCapturable(exportRoot) {
    return Array.prototype.slice.call(exportRoot.querySelectorAll("img")).map(function (img) {
      var resolvedSource = String(img.getAttribute("data-export-image-resolved-src") || img.currentSrc || img.src || "").trim();
      var diagnostics = summarizeDiagnosticImageSource(
        resolvedSource,
        String(img.getAttribute("data-export-image-role") || "image"),
        {
          originalSourceKind: summarizeDiagnosticImageSource(
            img.getAttribute("data-export-image-original-src") || "",
            String(img.getAttribute("data-export-image-role") || "image")
          ).sourceKind
        }
      );

      if (!resolvedSource) {
        throw new Error("One or more export images are missing a resolved source.");
      }

      if (!isDataUrl(resolvedSource) && !isSameOriginUrl(resolvedSource)) {
        throw new Error("One or more export images still use a cross-origin source.");
      }

      return diagnostics;
    });
  }

  function verifyImageCanPaintToCanvas(img) {
    var source = String(img.getAttribute("data-export-image-resolved-src") || img.currentSrc || img.src || "").trim();
    var testCanvas = document.createElement("canvas");
    testCanvas.width = 4;
    testCanvas.height = 4;
    var context = testCanvas.getContext("2d", { willReadFrequently: true });

    try {
      context.drawImage(img, 0, 0, 4, 4);
      var imageData = context.getImageData(0, 0, 4, 4);
      var values = Array.prototype.slice.call(imageData.data || []);
      var alphaPixels = 0;
      var samples = [];
      for (var index = 0; index < values.length; index += 4) {
        var alpha = values[index + 3] || 0;
        if (alpha > 0) {
          alphaPixels += 1;
        }
        samples.push((values[index] || 0) + (values[index + 1] || 0) + (values[index + 2] || 0));
      }
      var mean = samples.reduce(function (sum, value) {
        return sum + value;
      }, 0) / Math.max(samples.length, 1);
      var variance = samples.reduce(function (sum, value) {
        var delta = value - mean;
        return sum + (delta * delta);
      }, 0) / Math.max(samples.length, 1);
      return {
        image: summarizeDiagnosticImageSource(
          source,
          String(img.getAttribute("data-export-image-role") || "image"),
          {
            originalSourceKind: summarizeDiagnosticImageSource(
              img.getAttribute("data-export-image-original-src") || "",
              String(img.getAttribute("data-export-image-role") || "image")
            ).sourceKind
          }
        ),
        paintable: alphaPixels > 0 && variance > 0.5,
        alphaPixels: alphaPixels,
        sampleVariance: Number(variance.toFixed(4))
      };
    } catch (error) {
      throw new Error("Export image could not be painted to canvas");
    }
  }

  function validateExportImagesCanPaintToCanvas(exportRoot) {
    return Array.prototype.slice.call(exportRoot.querySelectorAll("img")).map(function (img) {
      var diagnostics = verifyImageCanPaintToCanvas(img);
      if (!diagnostics.paintable) {
        throw new Error("Export image could not be painted to canvas");
      }
      return diagnostics;
    });
  }

  function analyzeCanvasRegion(canvasContext, sourceCanvas, left, top, width, height) {
    var pixels = canvasContext.getImageData(left, top, width, height).data;
    var brightnessValues = [];
    var nonWhitePixels = 0;
    for (var index = 0; index < pixels.length; index += 4) {
      var red = pixels[index] || 0;
      var green = pixels[index + 1] || 0;
      var blue = pixels[index + 2] || 0;
      var alpha = pixels[index + 3] || 0;
      if (!alpha) {
        continue;
      }
      var brightness = (red + green + blue) / 3;
      brightnessValues.push(brightness);
      if (brightness < 248) {
        nonWhitePixels += 1;
      }
    }

    var mean = brightnessValues.reduce(function (sum, value) {
      return sum + value;
    }, 0) / Math.max(brightnessValues.length, 1);
    var variance = brightnessValues.reduce(function (sum, value) {
      var delta = value - mean;
      return sum + (delta * delta);
    }, 0) / Math.max(brightnessValues.length, 1);

    return {
      width: width,
      height: height,
      variance: Number(variance.toFixed(4)),
      nonWhiteCoverage: Number((nonWhitePixels / Math.max(brightnessValues.length, 1)).toFixed(4))
    };
  }

  function validateCanvasPaintedImages(pageNode, canvas, pageIndex) {
    var pageRect = pageNode.getBoundingClientRect();
    var canvasContext = canvas.getContext("2d", { willReadFrequently: true });
    var diagnostics = [];

    Array.prototype.slice.call(pageNode.querySelectorAll("img")).forEach(function (img) {
      var imageRect = img.getBoundingClientRect();
      if (imageRect.width <= 0 || imageRect.height <= 0) {
        return;
      }

      var left = Math.max(0, Math.round(((imageRect.left - pageRect.left) / pageRect.width) * canvas.width));
      var top = Math.max(0, Math.round(((imageRect.top - pageRect.top) / pageRect.height) * canvas.height));
      var width = Math.max(1, Math.round((imageRect.width / pageRect.width) * canvas.width));
      var height = Math.max(1, Math.round((imageRect.height / pageRect.height) * canvas.height));
      var clampedWidth = Math.min(width, canvas.width - left);
      var clampedHeight = Math.min(height, canvas.height - top);
      var region = analyzeCanvasRegion(canvasContext, canvas, left, top, clampedWidth, clampedHeight);
      var painted = region.variance > 12 && region.nonWhiteCoverage > 0.05;
      diagnostics.push({
        image: summarizeDiagnosticImageSource(
          img.getAttribute("data-export-image-resolved-src") || img.currentSrc || img.src || "",
          String(img.getAttribute("data-export-image-role") || "image"),
          {
            originalSourceKind: summarizeDiagnosticImageSource(
              img.getAttribute("data-export-image-original-src") || "",
              String(img.getAttribute("data-export-image-role") || "image")
            ).sourceKind
          }
        ),
        page: pageIndex + 1,
        canvasRegion: {
          left: left,
          top: top,
          width: clampedWidth,
          height: clampedHeight
        },
        variance: region.variance,
        nonWhiteCoverage: region.nonWhiteCoverage,
        painted: painted
      });

      if (!painted) {
        throw new Error("image-not-painted");
      }
    });

    return diagnostics;
  }

  function validateImageAspectRatios(exportRoot) {
    return Array.prototype.slice.call(exportRoot.querySelectorAll("img")).map(function (img) {
      var role = String(img.getAttribute("data-export-image-role") || "image");
      var rect = img.getBoundingClientRect();
      if (!img.naturalWidth || !img.naturalHeight || !rect.width || !rect.height) {
        throw new Error("One or more export images did not render with measurable dimensions.");
      }

      var naturalRatio = img.naturalWidth / img.naturalHeight;
      var renderedRatio = rect.width / rect.height;
      var ratioDifference = Math.abs(renderedRatio - naturalRatio) / naturalRatio;
      var diagnostics = {
        image: summarizeDiagnosticImageSource(
          img.currentSrc || img.src || "",
          role,
          {
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight
          }
        ),
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        renderedWidth: Number(rect.width.toFixed(2)),
        renderedHeight: Number(rect.height.toFixed(2)),
        naturalRatio: Number(naturalRatio.toFixed(6)),
        renderedRatio: Number(renderedRatio.toFixed(6)),
        difference: Number((ratioDifference * 100).toFixed(4)),
        role: role
      };

      if (role !== "map" && ratioDifference > PDF_EXPORT_IMAGE_RATIO_TOLERANCE) {
        throw new Error("Export image aspect ratio changed beyond tolerance");
      }

      return diagnostics;
    });
  }

  function prepareCaptureClone(clonedDocument) {
    if (!clonedDocument || !clonedDocument.querySelectorAll) {
      return;
    }
    Array.prototype.slice.call(clonedDocument.querySelectorAll("[data-guide-root], .goog-te-banner-frame, .skiptranslate")).forEach(function (node) {
      if (node && node.parentNode) {
        node.parentNode.removeChild(node);
      }
    });
    var currentClonePage = clonedDocument.querySelector("[data-pdf-page][data-capture-current='1']");
    Array.prototype.slice.call(clonedDocument.querySelectorAll("[data-pdf-page]")).forEach(function (pageNode) {
      if (currentClonePage && pageNode !== currentClonePage && pageNode.parentNode) {
        pageNode.parentNode.removeChild(pageNode);
      }
    });
  }

  function ensureCaptureFrame() {
    var existingFrame = document.getElementById("pi-pdf-capture-frame");
    if (existingFrame && existingFrame.contentDocument) {
      return existingFrame;
    }
    var frame = document.createElement("iframe");
    frame.id = "pi-pdf-capture-frame";
    frame.setAttribute("aria-hidden", "true");
    frame.style.position = "fixed";
    frame.style.left = PDF_EXPORT_OFFSCREEN_LEFT + "px";
    frame.style.top = "0";
    frame.style.width = PDF_EXPORT_WIDTH + "px";
    frame.style.height = PDF_EXPORT_PAGE_HEIGHT + "px";
    frame.style.border = "0";
    frame.style.opacity = "0";
    frame.style.visibility = "visible";
    frame.style.pointerEvents = "none";
    frame.style.background = "#ffffff";
    frame.style.zIndex = "-2147483647";
    document.body.appendChild(frame);
    return frame;
  }

  function initializeCaptureFrameHead(frameDocument, performanceState, startedAt) {
    if (!frameDocument || frameDocument.__propertyInstructionExportHeadReady) {
      return Promise.resolve();
    }
    var charset = frameDocument.createElement("meta");
    charset.setAttribute("charset", "utf-8");
    frameDocument.head.appendChild(charset);
    var viewport = frameDocument.createElement("meta");
    viewport.setAttribute("name", "viewport");
    viewport.setAttribute("content", "width=device-width, initial-scale=1");
    frameDocument.head.appendChild(viewport);
    var style = frameDocument.createElement("style");
    style.id = "property-instruction-pdf-export-frame-css";
    style.textContent = [
      "html, body { margin: 0; padding: 0; background: #ffffff; min-height: 0; height: auto; overflow: hidden; }",
      "body { width: " + PDF_EXPORT_WIDTH + "px; }",
      getPdfExportStylesheetText()
    ].join("\n");
    frameDocument.head.appendChild(style);
    frameDocument.__propertyInstructionExportHeadReady = true;
    if (performanceState) {
      performanceState.frameCreatedAt = startedAt || Date.now();
      recordPdfPerformance(performanceState, "frameStylesReadyMs", startedAt || Date.now());
    }
    return ensureCaptureFrameFonts(frameDocument, performanceState, startedAt || Date.now());
  }

  async function ensureCaptureFrameFonts(frameDocument, performanceState, startedAt) {
    if (!frameDocument || !frameDocument.fonts) {
      setTranslationAbortReason("PDF font load failed", "pdf-font-load-failed");
      throw new Error("PDF font load failed");
    }

    await Promise.all(PDF_EXPORT_FONT_LOADS.map(function (fontSpec) {
      return frameDocument.fonts.load(fontSpec);
    }));
    await frameDocument.fonts.ready;

    var allFontsLoaded = PDF_EXPORT_FONT_LOADS.every(function (fontSpec) {
      return frameDocument.fonts.check(fontSpec);
    });

    if (!allFontsLoaded) {
      setTranslationAbortReason("PDF font load failed", "pdf-font-load-failed");
      throw new Error("PDF font load failed");
    }

    if (performanceState) {
      recordPdfPerformance(performanceState, "frameFontsReadyMs", startedAt || Date.now());
    }
  }

  function collectTypographyDiagnostics(rootNode, languageCode) {
    var view = rootNode && rootNode.ownerDocument ? rootNode.ownerDocument.defaultView : window;
    function readTypography(selector, label) {
      var node = rootNode && rootNode.querySelector ? rootNode.querySelector(selector) : null;
      if (!node) {
        return null;
      }
      var styles = view.getComputedStyle(node);
      return {
        label: label,
        language: languageCode || SOURCE_LANGUAGE,
        semanticNodeId: node.getAttribute("data-export-source-id") || "",
        fontFamily: styles.fontFamily,
        fontWeight: styles.fontWeight,
        letterSpacing: styles.letterSpacing,
        wordSpacing: styles.wordSpacing,
        lineHeight: styles.lineHeight
      };
    }

    return [
      readTypography(".pi-export-card-body", "body"),
      readTypography(".pi-export-card-title", "card-title"),
      readTypography(".pi-export-section-title", "section-title"),
      readTypography(".pi-export-label", "meta-label"),
      readTypography(".pi-export-footer", "footer")
    ].filter(Boolean);
  }

  function createCaptureRootNode(frameDocument, pageNode) {
    var exportRoot = frameDocument.createElement("div");
    exportRoot.className = "pi-pdf-export-root";
    exportRoot.setAttribute("data-property-instruction-export", "root");
    exportRoot.setAttribute("aria-hidden", "true");
    exportRoot.setAttribute("lang", pageNode.getAttribute("lang") || "en");
    exportRoot.setAttribute("dir", pageNode.getAttribute("dir") || "ltr");
    markExportNodeNotranslate(exportRoot);
    exportRoot.style.position = "absolute";
    exportRoot.style.left = "0";
    exportRoot.style.top = "0";
    exportRoot.style.width = PDF_EXPORT_WIDTH + "px";
    exportRoot.style.background = "#ffffff";
    exportRoot.style.pointerEvents = "none";
    exportRoot.style.overflow = "visible";
    exportRoot.style.visibility = "visible";
    exportRoot.style.opacity = "1";
    exportRoot.style.zIndex = "0";

    var exportWrapper = frameDocument.createElement("div");
    exportWrapper.className = "pi-pdf-export";
    markExportNodeNotranslate(exportWrapper);

    var exportPages = frameDocument.createElement("div");
    exportPages.className = "pi-export-pages";
    markExportNodeNotranslate(exportPages);

    var pageClone = frameDocument.importNode(pageNode, true);
    exportPages.appendChild(pageClone);
    exportWrapper.appendChild(exportPages);
    exportRoot.appendChild(exportWrapper);

    return {
      root: exportRoot,
      page: pageClone
    };
  }

  async function prepareCaptureFramePage(pageNode, performanceState) {
    var frameStartedAt = Date.now();
    var frame = ensureCaptureFrame();
    var frameDocument = frame.contentDocument;
    if (!frameDocument) {
      throw new Error("Unable to prepare PDF capture frame.");
    }
    await initializeCaptureFrameHead(frameDocument, performanceState, frameStartedAt);
    var domStartedAt = Date.now();
    while (frameDocument.body.firstChild) {
      frameDocument.body.removeChild(frameDocument.body.firstChild);
    }
    frameDocument.body.style.margin = "0";
    frameDocument.body.style.background = "#ffffff";
    frameDocument.body.style.minHeight = "0";
    frameDocument.body.style.height = "auto";
    var captureNodes = createCaptureRootNode(frameDocument, pageNode);
    frameDocument.body.appendChild(captureNodes.root);
    await waitForImages(captureNodes.root);
    await waitForTwoAnimationFrames();
    window.__propertyInstructionPdfTypographyDiagnostics = collectTypographyDiagnostics(
      captureNodes.root,
      captureNodes.page.getAttribute("lang") || SOURCE_LANGUAGE
    );
    if (performanceState) {
      performanceState.pageDomReplacementMs.push(Date.now() - domStartedAt);
    }
    return {
      frame: frame,
      document: frameDocument,
      root: captureNodes.root,
      page: captureNodes.page
    };
  }

  function destroyCaptureFrame(frame) {
    if (frame && frame.parentNode) {
      frame.parentNode.removeChild(frame);
    }
  }

  function addPageLinkAnnotations(pdf, pageNode, pdfWidth, pdfHeight) {
    var pageRect = pageNode.getBoundingClientRect();
    Array.prototype.slice.call(pageNode.querySelectorAll("a[href]")).forEach(function (anchor) {
      var internalTarget = String(anchor.getAttribute("data-pdf-internal-target") || "").trim();
      var href = normalizeHref(anchor.getAttribute("href") || anchor.href || "");
      var destination = internalTarget ? (((window.__propertyInstructionPdfContentsDestinations || {})[internalTarget]) || null) : null;
      if (!href && !destination) {
        return;
      }
      Array.prototype.slice.call(anchor.getClientRects()).forEach(function (rect) {
        if (rect.width <= 0 || rect.height <= 0) {
          return;
        }
        var x = ((rect.left - pageRect.left) / pageRect.width) * pdfWidth;
        var y = ((rect.top - pageRect.top) / pageRect.height) * pdfHeight;
        var width = (rect.width / pageRect.width) * pdfWidth;
        var height = (rect.height / pageRect.height) * pdfHeight;
        if (destination) {
          pdf.link(x, y, width, height, {
            pageNumber: destination.pageNumber,
            top: Number((destination.topRatio * pdfHeight).toFixed(2))
          });
          return;
        }
        pdf.link(x, y, width, height, { url: href });
      });
    });
  }

  async function encodeCanvasToJpegBlob(canvas) {
    if (!canvas) {
      throw new Error("Unable to encode PDF page image.");
    }
    if (!canvas.toBlob) {
      var fallbackDataUrl = canvas.toDataURL("image/jpeg", 0.95);
      var response = await fetch(fallbackDataUrl);
      return response.blob();
    }
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (blob) {
        if (!blob) {
          reject(new Error("Unable to encode PDF page image."));
          return;
        }
        resolve(blob);
      }, "image/jpeg", 0.95);
    });
  }

  async function renderExportPagesToPdf(exportState, filename, modelParityMap, mutationGuardState, progressContext) {
    var pageNodes = Array.prototype.slice.call(exportState.exportRoot.querySelectorAll("[data-pdf-page]"));
    if (!pageNodes.length) {
      throw new Error("No PDF pages were created.");
    }

    var performanceState = exportState.performanceState || startPdfPerformance();
    validateExportDomParity(exportState.exportRoot, modelParityMap, "pre-render", mutationGuardState);
    var fontStartedAt = Date.now();
    await waitForFonts();
    recordPdfPerformance(performanceState, "fontReadinessMs", fontStartedAt);
    var imageSourceDiagnostics = assertExportImageSourcesAreCapturable(exportState.exportRoot);
    var imageDiagnostics = await waitForImages(exportState.exportRoot);
    var canvasPaintabilityDiagnostics = validateExportImagesCanPaintToCanvas(exportState.exportRoot);
    await waitForTwoAnimationFrames();
    var imageRatioDiagnostics = validateImageAspectRatios(exportState.exportRoot);
    var imageClipDiagnostics = validateExportImageClipping(exportState.exportRoot);
    validateExportDomParity(exportState.exportRoot, modelParityMap, "post-fonts-images", mutationGuardState);
    var jsPDF = window.jspdf.jsPDF;
    var pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true
    });
    if (typeof pdf.setProperties === "function") {
      pdf.setProperties({
        title: [exportState.model && exportState.model.title, exportState.model && exportState.model.kicker].filter(Boolean).join(" - "),
        subject: exportState.model && exportState.model.languageCode ? exportState.model.languageCode : SOURCE_LANGUAGE,
        creator: "PropMS guest guide PDF export"
      });
    }

    var pdfWidth = pdf.internal.pageSize.getWidth();
    var pdfHeight = pdf.internal.pageSize.getHeight();
    var pageDiagnostics = [];
    var pageImageBlobs = [];
    var paintedImageDiagnostics = [];
    window.__propertyInstructionPdfRenderer = "html2canvas+jspdf";

    var renderScale = 1.8;
    var averageHistory = getAverageProgressHistory(pageNodes.length, renderScale);
    var captureFrame = null;

    try {
      for (var index = 0; index < pageNodes.length; index += 1) {
        var pageNode = pageNodes[index];
        validateExportDomParity(exportState.exportRoot, modelParityMap, "before-canvas-page-" + (index + 1), mutationGuardState);
        var diagnostics = collectPageDiagnostics(pageNode);
        window.__propertyInstructionPdfStep = "render-page-" + (index + 1);
        if (progressContext) {
          updateExportProgress(
            progressContext.downloadButton,
            progressContext.statusElement,
            null,
            null,
            "render-pdf",
            {
              pageIndex: index + 1,
              pageCount: pageNodes.length,
              averageHistory: averageHistory,
              elapsedMs: Date.now() - progressContext.clickStartedAt
            }
          );
        }

        if (diagnostics.viewportScrollHeight > diagnostics.viewportHeight + 2) {
          window.__propertyInstructionLastPdfDiagnostics = {
            shellCount: pageNodes.length,
            failingPage: index + 1,
            failingDiagnostics: diagnostics,
            imageDiagnostics: imageDiagnostics,
            imageRatioDiagnostics: imageRatioDiagnostics,
            pageDiagnostics: pageDiagnostics
          };
          throw new Error("PDF page " + (index + 1) + " overflowed its shell");
        }
        if (!diagnostics.textLength) {
          window.__propertyInstructionLastPdfDiagnostics = {
            shellCount: pageNodes.length,
            failingPage: index + 1,
            failingDiagnostics: diagnostics,
            imageDiagnostics: imageDiagnostics,
            imageRatioDiagnostics: imageRatioDiagnostics,
            pageDiagnostics: pageDiagnostics
          };
          throw new Error("PDF page " + (index + 1) + " is empty");
        }

        var pageCaptureStartedAt = Date.now();
        var captureTarget = await prepareCaptureFramePage(pageNode, performanceState);
        captureFrame = captureTarget.frame;
        var canvas;
        canvas = await window.html2canvas(captureTarget.page, {
          scale: renderScale,
          useCORS: true,
          allowTaint: false,
          backgroundColor: "#ffffff",
          logging: false,
          imageTimeout: 20000,
          scrollX: 0,
          scrollY: 0,
          width: captureTarget.page.offsetWidth,
          height: captureTarget.page.offsetHeight,
          windowWidth: captureTarget.page.offsetWidth,
          windowHeight: captureTarget.page.offsetHeight,
          onclone: function (clonedDocument) {
            prepareCaptureClone(clonedDocument);
          }
        });
        performanceState.pageCaptureMs[index] = Date.now() - pageCaptureStartedAt;

        diagnostics.canvasWidth = canvas.width;
        diagnostics.canvasHeight = canvas.height;

        if (!canvas.width || !canvas.height) {
          window.__propertyInstructionLastPdfDiagnostics = {
            shellCount: pageNodes.length,
            failingPage: index + 1,
            failingDiagnostics: diagnostics,
            imageDiagnostics: imageDiagnostics,
            imageRatioDiagnostics: imageRatioDiagnostics,
            pageDiagnostics: pageDiagnostics
          };
          throw new Error("Page " + (index + 1) + " produced an empty canvas.");
        }

        var pagePaintedImages = validateCanvasPaintedImages(pageNode, canvas, index);
        paintedImageDiagnostics = paintedImageDiagnostics.concat(pagePaintedImages);

        if (index > 0) {
          pdf.addPage("a4", "portrait");
        }

        var encodingStartedAt = Date.now();
        var jpegBlob = await encodeCanvasToJpegBlob(canvas);
        var jpegDataUrl = await blobToDataUri(jpegBlob);
        performanceState.encodingMs += Date.now() - encodingStartedAt;
        pageImageBlobs.push(jpegBlob);

        var assemblyStartedAt = Date.now();
        pdf.addImage(
          jpegDataUrl,
          "JPEG",
          0,
          0,
          pdfWidth,
          pdfHeight,
          undefined,
          "FAST"
        );
        addPageLinkAnnotations(pdf, pageNode, pdfWidth, pdfHeight);
        performanceState.jsPdfAssemblyMs += Date.now() - assemblyStartedAt;
        pageDiagnostics.push(diagnostics);
        jpegDataUrl = null;
        canvas.width = 1;
        canvas.height = 1;
        if (captureTarget && captureTarget.document && captureTarget.document.body) {
          while (captureTarget.document.body.firstChild) {
            captureTarget.document.body.removeChild(captureTarget.document.body.firstChild);
          }
        }
        await sleep(isSafariFamily() ? 16 : 0);
      }
    } finally {
      destroyCaptureFrame(captureFrame);
    }

    if (pdf.internal.getNumberOfPages() !== pageNodes.length) {
      throw new Error("PDF page count did not match export page count.");
    }

    validateExportDomParity(exportState.exportRoot, modelParityMap, "post-render", mutationGuardState);

    window.__propertyInstructionLastPdfDiagnostics = {
      imageSourceDiagnostics: imageSourceDiagnostics,
      imageDiagnostics: imageDiagnostics,
      canvasPaintabilityDiagnostics: canvasPaintabilityDiagnostics,
      imageRatioDiagnostics: imageRatioDiagnostics,
      imageClipDiagnostics: imageClipDiagnostics,
      paintedImageDiagnostics: paintedImageDiagnostics,
      pageDiagnostics: pageDiagnostics,
      shellCount: pageNodes.length
    };

    return {
      pdf: pdf,
      pageImageBlobs: pageImageBlobs,
      pageCount: pageNodes.length
    };
  }

  async function performGuidePdfArtifactGeneration(triggerElement) {
    const statusElement = document.querySelector(".pi-action-status");
    const originalLabelNode = triggerElement.querySelector(".pi-toolbar-action-label");
    const originalLabel = String(originalLabelNode ? originalLabelNode.textContent : triggerElement.textContent || "");
    const guideTitle = getGuideTitle();
    const guideIdentity = getGuideIdentity(triggerElement);
    var exportState = null;
    var mutationGuardState = null;
    var performanceState = startPdfPerformance();
    var exportImageDataCache = new Map();
    var clickStartedAt = Date.now();
    window.__propertyInstructionLastPdfError = null;
    setPdfExportControlsDisabled(true);
    setGuidePdfActionButtonsDisabled(true);
    window.__propertyInstructionPdfLifecycle = null;
    setPdfExportLifecycle("idle");

    triggerElement.disabled = true;
    triggerElement.classList.add("is-disabled");
    triggerElement.setAttribute("aria-disabled", "true");
    triggerElement.setAttribute("data-progress-label", originalLabel);
    updateExportProgress(triggerElement, statusElement, null, null, "initializing");

    try {
      syncTranslationLanguageState();
      var currentLanguage = translationState.requestedLanguage || SOURCE_LANGUAGE;
      var currentGeneration = translationState.generation;
      var immediateSnapshot = captureSemanticSnapshot();
      var immediateSnapshotHash = getSnapshotHash(immediateSnapshot);
      var immediateCacheKey = getPreparedStateKey(
        guideIdentity,
        currentLanguage,
        currentGeneration,
        immediateSnapshotHash
      );
      var immediateCachedArtifact = getCachedPdfArtifact(immediateCacheKey);
      if (immediateCachedArtifact && immediateCachedArtifact.pdfBlob) {
        recordPdfPerformance(performanceState, "warmRepeatedDownloadMs", clickStartedAt);
        recordPdfPerformance(performanceState, "totalMs", performanceState.startedAt);
        window.__propertyInstructionLastPdfBlob = immediateCachedArtifact.pdfBlob;
        window.__propertyInstructionLastPdfLanguage = currentLanguage;
        return immediateCachedArtifact;
      }

      setPdfExportLifecycle("waiting-for-translation");
      updateExportProgress(triggerElement, statusElement, null, null, "wait-translation");
      var translationStartedAt = Date.now();
      var settledSnapshot = await ensureSettledGuideSnapshot();
      recordPdfPerformance(performanceState, "translationReadyMs", translationStartedAt);
      var exportGeneration = translationState.generation;
      var exportLanguage = translationState.requestedLanguage || SOURCE_LANGUAGE;
      var snapshotHash = getSnapshotHash(settledSnapshot);
      var cacheKey = getPreparedStateKey(guideIdentity, exportLanguage, exportGeneration, snapshotHash);
      var cachedArtifact = getCachedPdfArtifact(cacheKey);
      if (cachedArtifact && cachedArtifact.pdfBlob) {
        recordPdfPerformance(performanceState, "warmRepeatedDownloadMs", clickStartedAt);
        recordPdfPerformance(performanceState, "totalMs", performanceState.startedAt);
        window.__propertyInstructionLastPdfBlob = cachedArtifact.pdfBlob;
        return cachedArtifact;
      }

      setPdfExportLifecycle("preparing-assets");
      updateExportProgress(triggerElement, statusElement, null, null, "load-libraries");
      var prepareStartedAt = Date.now();
      var preparedState = await preparePdfDependenciesForSnapshot(settledSnapshot, triggerElement);
      exportImageDataCache = preparedState.imageDataCache || exportImageDataCache;
      recordPdfPerformance(
        performanceState,
        "translationReadyToExportPreparedMs",
        prepareStartedAt,
        preparedState && translationState.readyAt ? Math.max(0, preparedState.preparedAt - translationState.readyAt) : undefined
      );
      recordPdfPerformance(performanceState, "mapPreparationMs", 0, preparedState.mapPreparationMs || 0);

      updateExportProgress(triggerElement, statusElement, null, null, "extract-model");
      syncTranslationLanguageState();
      if (translationState.generation !== exportGeneration || (translationState.requestedLanguage || SOURCE_LANGUAGE) !== exportLanguage) {
        throw new Error("Selected translation changed during PDF export");
      }
      var modelStartedAt = Date.now();
      var currentSnapshot = captureSemanticSnapshot();
      if (!snapshotsEqual(settledSnapshot, currentSnapshot)) {
        settledSnapshot = await ensureSettledGuideSnapshot();
        snapshotHash = getSnapshotHash(settledSnapshot);
        cacheKey = getPreparedStateKey(guideIdentity, exportLanguage, exportGeneration, snapshotHash);
        preparedState = await preparePdfDependenciesForSnapshot(settledSnapshot, triggerElement);
        exportImageDataCache = preparedState.imageDataCache || exportImageDataCache;
      }
      var guideModel = deepCloneModel(preparedState.model);
      recordPdfPerformance(performanceState, "modelExtractionMs", modelStartedAt);
      updateTranslationDiagnostics({
        selectedLanguage: guideModel.languageCode || SOURCE_LANGUAGE
      });
      var preMountParity = compareSnapshotToModel(settledSnapshot, guideModel);
      window.__propertyInstructionLastExportParityMap = redactNodeMap(preMountParity.modelParityMap);
      if (preMountParity.mismatches.length) {
        throw new Error("Guide translation changed before PDF rendering");
      }

      setPdfExportLifecycle("building-layout");
      updateExportProgress(triggerElement, statusElement, null, null, "build-export");
      var buildStartedAt = Date.now();
      exportState = buildPdfExportDocument(guideModel);
      exportState.performanceState = performanceState;
      exportState.exportImageDataCache = exportImageDataCache;
      exportState.preparedState = preparedState;
      recordPdfPerformance(performanceState, "exportDomConstructionMs", buildStartedAt);
      validateExportDomParity(exportState.exportRoot, preMountParity.modelParityMap, "detached-build");
      mountExportRoot(exportState.exportRoot);
      validateExportDomParity(exportState.exportRoot, preMountParity.modelParityMap, "post-mount");

      updateExportProgress(triggerElement, statusElement, null, null, "wait-images");
      var imagePrepStartedAt = Date.now();
      var inlineImageDiagnostics = await inlineExportImages(exportState.exportRoot, exportImageDataCache);
      exportState.exportImageDataCache = exportImageDataCache;
      exportState.inlineImageDiagnostics = inlineImageDiagnostics;
      await waitForImages(exportState.exportRoot);
      updateExportProgress(triggerElement, statusElement, null, null, "prepare-layout");
      var sizingDiagnostics = applyExportImageSizing(exportState.exportRoot);
      await waitForFonts();
      await waitForTwoAnimationFrames();
      var prePaginationRatioDiagnostics = validateImageAspectRatios(exportState.exportRoot);
      var prePaginationClipDiagnostics = validateExportImageClipping(exportState.exportRoot);
      recordPdfPerformance(performanceState, "imagePreparationMs", imagePrepStartedAt);

      updateExportProgress(triggerElement, statusElement, null, null, "paginate");
      var paginationStartedAt = Date.now();
      paginateExportDocument(exportState);
      populatePageFooters(exportState, guideModel.title || guideTitle);
      populatePdfContentsDestinations(exportState);
      recordPdfPerformance(performanceState, "paginationMs", paginationStartedAt);
      var layoutDiagnostics = collectCardLayoutDiagnostics(exportState.exportRoot);
      validateExportDomParity(exportState.exportRoot, preMountParity.modelParityMap, "post-pagination");
      mutationGuardState = startExportMutationGuard(exportState.exportRoot);
      updateExportProgress(triggerElement, statusElement, null, null, "validate");
      validateExportParity(guideModel, exportState, settledSnapshot);
      var finalSnapshot = captureSemanticSnapshot();
      updateTranslationDiagnostics({
        finalSnapshot: captureSemanticSnapshot({ redactProtectedValues: true })
      });
      if (!snapshotsEqual(settledSnapshot, finalSnapshot)) {
        throw new Error("Guide translation changed before PDF rendering");
      }
      syncTranslationLanguageState();
      if (translationState.generation !== exportGeneration || (translationState.requestedLanguage || SOURCE_LANGUAGE) !== exportLanguage) {
        throw new Error("Selected translation changed during PDF export");
      }

      setPdfExportLifecycle("rendering-pages");
      updateExportProgress(triggerElement, statusElement, null, null, "render-pdf");
      var renderResult = await withTimeout(
        renderExportPagesToPdf(
          exportState,
          getPdfFilename(triggerElement),
          preMountParity.modelParityMap,
          mutationGuardState,
          {
            downloadButton: triggerElement,
            statusElement: statusElement,
            clickStartedAt: clickStartedAt
          }
        ),
        PDF_EXPORT_TIMEOUT_MS,
        "PDF export timed out"
      );
      setPdfExportLifecycle("assembling-pdf");
      updateExportProgress(triggerElement, statusElement, null, null, "finalize-pdf");
      syncTranslationLanguageState();
      if (translationState.generation !== exportGeneration || (translationState.requestedLanguage || SOURCE_LANGUAGE) !== exportLanguage) {
        throw new Error("Selected translation changed during PDF export");
      }
      var postRenderSnapshot = captureSemanticSnapshot();
      if (!snapshotsEqual(settledSnapshot, postRenderSnapshot)) {
        throw new Error("Guide translation changed before PDF download");
      }
      var postRenderParity = compareSnapshotToModel(postRenderSnapshot, guideModel);
      updateTranslationDiagnostics({
        finalSnapshot: captureSemanticSnapshot({ redactProtectedValues: true }),
        parityMismatches: postRenderParity.mismatches.slice(),
        exportParityMap: redactNodeMap(postRenderParity.modelParityMap)
      });
      window.__propertyInstructionLastExportParityMap = redactNodeMap(postRenderParity.modelParityMap);
      if (postRenderParity.mismatches.length) {
        throw new Error("PDF export content does not match the visible guide");
      }

      var blobStartedAt = Date.now();
      var pdfBlob = renderResult.pdf.output("blob");
      recordPdfPerformance(performanceState, "blobCreationMs", blobStartedAt);
      recordPdfPerformance(performanceState, "buttonClickToPdfBlobMs", clickStartedAt);
      recordPdfPerformance(performanceState, "totalMs", performanceState.startedAt);
      recordProgressHistory(renderResult.pageCount, 1.8, performanceState);
      var artifact = {
        pdfBlob: pdfBlob,
        pageImageBlobs: (renderResult.pageImageBlobs || []).slice(),
        pageCount: renderResult.pageCount,
        languageCode: guideModel.languageCode || SOURCE_LANGUAGE,
        cacheKey: cacheKey,
        performance: Object.assign({}, performanceState)
      };
      cachePdfArtifact(cacheKey, artifact);
      window.__propertyInstructionLastPdfBlob = pdfBlob;
      window.__propertyInstructionLastPdfLanguage = guideModel.languageCode || SOURCE_LANGUAGE;
      window.__propertyInstructionPdfStep = "download-ready";
      window.__propertyInstructionLastPdfDiagnostics = Object.assign({}, window.__propertyInstructionLastPdfDiagnostics || {}, {
        inlineImageDiagnostics: inlineImageDiagnostics,
        sizingDiagnostics: sizingDiagnostics,
        prePaginationRatioDiagnostics: prePaginationRatioDiagnostics,
        prePaginationClipDiagnostics: prePaginationClipDiagnostics,
        layoutDiagnostics: layoutDiagnostics,
        mapDiagnostics: preparedState.mapDiagnostics || {},
        qrDiagnostics: preparedState.qrDiagnostics || {},
        performance: performanceState
      });
      stopExportMutationGuard(mutationGuardState);
      setPdfExportLifecycle("ready");
      updateExportProgress(triggerElement, statusElement, null, null, "download-ready", {
        averageHistory: getAverageProgressHistory(renderResult.pageCount, 1.8),
        elapsedMs: Date.now() - clickStartedAt
      });
      if (statusElement) {
        statusElement.textContent = getGuideCopyText("pdf_ready", "PDF ready");
      }
      destroyExportRoot(exportState.exportRoot);
      return artifact;
    } catch (error) {
      window.__propertyInstructionLastPdfError = {
        message: error && error.message ? error.message : "Unable to prepare PDF",
        name: error && error.name ? error.name : "Error",
        capturedAt: Date.now()
      };
      window.__propertyInstructionPdfStep = "failed";
      if (error && /Selected translation changed during PDF export/.test(String(error.message || ""))) {
        setPdfExportLifecycle("cancelled-language-change");
      } else {
        setPdfExportLifecycle("failed");
      }
      if (typeof exportState !== "undefined" && exportState && exportState.exportRoot) {
        stopExportMutationGuard(mutationGuardState);
        destroyExportRoot(exportState.exportRoot);
      }
      if (statusElement) {
        if (error && /Selected translation changed during PDF export/.test(String(error.message || ""))) {
          statusElement.textContent = getGuideCopyText("cancelled_language_change", "PDF generation was cancelled because the language changed.");
        } else if ((translationState.diagnostics || {}).abortCode && String((translationState.diagnostics || {}).abortCode).indexOf("translation") === 0) {
          statusElement.textContent = getGuideCopyText("translation_unavailable", "Translation is temporarily unavailable.");
        } else {
          statusElement.textContent = getGuideCopyText("pdf_generation_failed", "The PDF could not be generated. Please try again.");
        }
      }
      setTranslationStatus(statusElement ? statusElement.textContent : "");
      return null;
    } finally {
      stopExportMutationGuard(mutationGuardState);
      triggerElement.disabled = false;
      triggerElement.classList.remove("is-disabled");
      triggerElement.removeAttribute("aria-disabled");
      setToolbarButtonLabel(triggerElement, originalLabel);
      triggerElement.removeAttribute("data-progress-label");
      setGuidePdfActionButtonsDisabled(false);
      setPdfExportControlsDisabled(false);
      syncCustomLanguageSelectorFromGoogle();
      window.setTimeout(function () {
        if (!pdfExportController.activePromise) {
          resetPdfProgressUi();
        }
      }, 1200);
    }
  }

  async function getOrCreateGuidePdfArtifact(triggerElement) {
    if (!triggerElement) {
      return null;
    }
    if (pdfExportController.activePromise) {
      return pdfExportController.activePromise;
    }
    syncTranslationLanguageState();
    pdfExportController.activeLanguage = translationState.requestedLanguage || SOURCE_LANGUAGE;
    pdfExportController.activePromise = performGuidePdfArtifactGeneration(triggerElement).finally(function () {
      pdfExportController.activePromise = null;
      pdfExportController.activeLanguage = "";
    });
    return pdfExportController.activePromise;
  }

  async function downloadTranslatedPdf(downloadButton) {
    if (!downloadButton) {
      return null;
    }
    var statusElement = document.querySelector(".pi-action-status");
    var clickStartedAt = Date.now();
    var artifact = await getOrCreateGuidePdfArtifact(downloadButton);
    if (!artifact || !artifact.pdfBlob) {
      return null;
    }
    setGuidePdfActionButtonsDisabled(true);
    setPdfExportLifecycle("ready");
    updateExportProgress(downloadButton, statusElement, null, null, "download-ready", {
      averageHistory: getAverageProgressHistory(artifact.pageCount || 0, 1.8),
      elapsedMs: Date.now() - clickStartedAt
    });
    setPdfExportLifecycle("starting-download");
    updateExportProgress(downloadButton, statusElement, null, null, "starting-download", {
      averageHistory: getAverageProgressHistory(artifact.pageCount || 0, 1.8),
      elapsedMs: Date.now() - clickStartedAt
    });
    triggerAutomaticPdfDownload(artifact.pdfBlob, getPdfFilename(downloadButton));
    setPdfExportLifecycle("download-triggered");
    updateExportProgress(downloadButton, statusElement, null, null, "download-started", {
      averageHistory: getAverageProgressHistory(artifact.pageCount || 0, 1.8),
      elapsedMs: Date.now() - clickStartedAt
    });
    if (statusElement) {
      statusElement.textContent = getGuideCopyText("download_started", "Download started");
    }
    window.setTimeout(function () {
      setGuidePdfActionButtonsDisabled(false);
      resetPdfProgressUi();
    }, 1200);
    return artifact;
  }

  function setPrintLifecycle(stageName, extraDetails) {
    var diagnostics = window.__propertyInstructionPrintDiagnostics || {
      lifecycle: "idle",
      artifactCacheHit: false,
      pageCount: 0,
      pageImageByteLengths: [],
      iframeCreatedAt: 0,
      imagesReadyAt: 0,
      firstLayoutMeasuredAt: 0,
      finalLayoutMeasuredAt: 0,
      pageDimensions: [],
      bodyDimensions: {},
      expectedBodyHeight: 0,
      overflowDetected: false,
      printCalledAt: 0,
      printReturnedAt: 0,
      cleanupTimestamp: 0,
      afterPrintAt: 0,
      failureCode: ""
    };
    diagnostics.lifecycle = String(stageName || "idle");
    if (extraDetails) {
      Object.keys(extraDetails).forEach(function (key) {
        diagnostics[key] = extraDetails[key];
      });
    }
    window.__propertyInstructionPrintDiagnostics = diagnostics;
    return diagnostics;
  }

  function createPrintFrame() {
    cleanupActivePrintFrame();
    var frame = document.createElement("iframe");
    frame.setAttribute("aria-hidden", "true");
    frame.setAttribute("tabindex", "-1");
    frame.style.position = "fixed";
    frame.style.left = PDF_EXPORT_OFFSCREEN_LEFT + "px";
    frame.style.top = "0";
    frame.style.width = PRINT_PAGE_WIDTH_PT + "pt";
    frame.style.height = PRINT_PAGE_HEIGHT_PT + "pt";
    frame.style.border = "0";
    frame.style.opacity = "0";
    frame.style.pointerEvents = "none";
    frame.style.background = "#ffffff";
    document.body.appendChild(frame);
    setPrintLifecycle("waiting-for-artifact", {
      iframeCreatedAt: Date.now()
    });
    return {
      frame: frame,
      objectUrls: [],
      cleanupTimer: 0,
      cleaned: false
    };
  }

  function cleanupPrintFrame(printState) {
    if (!printState || printState.cleaned) {
      return;
    }
    printState.cleaned = true;
    if (printState.cleanupTimer) {
      window.clearTimeout(printState.cleanupTimer);
      printState.cleanupTimer = 0;
    }
    (printState.objectUrls || []).forEach(function (objectUrl) {
      if (objectUrl && window.URL && window.URL.revokeObjectURL) {
        window.URL.revokeObjectURL(objectUrl);
      }
    });
    if (printState.frame && printState.frame.parentNode) {
      printState.frame.parentNode.removeChild(printState.frame);
    }
    if (activePrintController === printState) {
      activePrintController = null;
    }
  }

  function cleanupActivePrintFrame() {
    if (activePrintController) {
      cleanupPrintFrame(activePrintController);
    }
  }

  function collectPrintLayoutDiagnostics(frameDocument) {
    var pageNodes = Array.prototype.slice.call(frameDocument.querySelectorAll(".pi-generated-print-page"));
    var pageDimensions = pageNodes.map(function (pageNode, index) {
      var imageNode = pageNode.querySelector("img");
      var pageRect = pageNode.getBoundingClientRect();
      var imageRect = imageNode ? imageNode.getBoundingClientRect() : null;
      var computedStyle = frameDocument.defaultView
        ? frameDocument.defaultView.getComputedStyle(pageNode)
        : null;
      return {
        pageNumber: index + 1,
        clientWidth: pageNode.clientWidth,
        clientHeight: pageNode.clientHeight,
        scrollWidth: pageNode.scrollWidth,
        scrollHeight: pageNode.scrollHeight,
        offsetTop: pageNode.offsetTop,
        breakBefore: computedStyle ? String(computedStyle.breakBefore || "") : "",
        pageBreakBefore: computedStyle ? String(computedStyle.pageBreakBefore || "") : "",
        marginTop: computedStyle ? String(computedStyle.marginTop || "") : "",
        marginBottom: computedStyle ? String(computedStyle.marginBottom || "") : "",
        imageRect: imageRect ? {
          left: imageRect.left,
          top: imageRect.top,
          right: imageRect.right,
          bottom: imageRect.bottom,
          width: imageRect.width,
          height: imageRect.height
        } : null,
        pageRect: {
          left: pageRect.left,
          top: pageRect.top,
          right: pageRect.right,
          bottom: pageRect.bottom,
          width: pageRect.width,
          height: pageRect.height
        }
      };
    });
    var expectedBodyHeight = pageDimensions.length
      ? Math.round(pageDimensions.length * pageDimensions[0].pageRect.height)
      : 0;
    return {
      pageDimensions: pageDimensions,
      bodyDimensions: {
        scrollWidth: frameDocument.body.scrollWidth,
        scrollHeight: frameDocument.body.scrollHeight,
        clientWidth: frameDocument.body.clientWidth,
        clientHeight: frameDocument.body.clientHeight
      },
      expectedBodyHeight: expectedBodyHeight
    };
  }

  function validatePrintFrameLayout(frameDocument) {
    var diagnostics = collectPrintLayoutDiagnostics(frameDocument);
    var hasOverflow = false;
    var forcedBreakDetected = false;
    var bodyHeightDelta = Math.abs(
      Number(diagnostics.bodyDimensions.scrollHeight || 0) - Number(diagnostics.expectedBodyHeight || 0)
    );
    diagnostics.pageDimensions.forEach(function (pageInfo) {
      var imageRect = pageInfo.imageRect;
      var pageRect = pageInfo.pageRect;
      if (pageInfo.scrollWidth > pageInfo.clientWidth + 1 || pageInfo.scrollHeight > pageInfo.clientHeight + 1) {
        hasOverflow = true;
        return;
      }
      if (imageRect && (
        imageRect.left < pageRect.left - 1
        || imageRect.top < pageRect.top - 1
        || imageRect.right > pageRect.right + 1
        || imageRect.bottom > pageRect.bottom + 1
      )) {
        hasOverflow = true;
      }
      if (pageInfo.pageNumber > 1 && (
        String(pageInfo.breakBefore || "").toLowerCase() !== "auto"
        || String(pageInfo.pageBreakBefore || "").toLowerCase() !== "auto"
        || String(pageInfo.marginTop || "") !== "0px"
        || String(pageInfo.marginBottom || "") !== "0px"
      )) {
        forcedBreakDetected = true;
      }
    });
    diagnostics.overflowDetected = hasOverflow;
    diagnostics.forcedBreakDetected = forcedBreakDetected;
    diagnostics.bodyHeightDelta = bodyHeightDelta;
    if (forcedBreakDetected || bodyHeightDelta > 2) {
      setPrintLifecycle("failed", {
        failureCode: "print-forced-break-detected",
        pageDimensions: diagnostics.pageDimensions,
        bodyDimensions: diagnostics.bodyDimensions,
        expectedBodyHeight: diagnostics.expectedBodyHeight,
        overflowDetected: hasOverflow
      });
      throw new Error("print-forced-break-detected");
    }
    if (hasOverflow) {
      setPrintLifecycle("failed", {
        failureCode: "print-page-overflow",
        pageDimensions: diagnostics.pageDimensions,
        bodyDimensions: diagnostics.bodyDimensions,
        expectedBodyHeight: diagnostics.expectedBodyHeight,
        overflowDetected: true
      });
      throw new Error("print-page-overflow");
    }
    return diagnostics;
  }

  async function prepareGeneratedPrintFrame(printState, artifact) {
    if (!printState || !printState.frame || !artifact) {
      throw new Error("The print layout could not be prepared. Please try again.");
    }
    var frameDocument = printState.frame.contentDocument;
    if (!frameDocument) {
      throw new Error("The print layout could not be prepared. Please try again.");
    }
    frameDocument.open();
    frameDocument.write(
      '<!doctype html><html><head><meta charset="utf-8"><title>Print guide</title><style>' +
      '@page{size:A4 portrait;margin:0;}' +
      'html,body{margin:0;padding:0;background:#fff;}' +
      'body{width:100%;}' +
      '*{box-sizing:border-box;}' +
      '.pi-generated-print-page{display:block;width:' + PRINT_PAGE_WIDTH_PT + 'pt;height:' + PRINT_PAGE_HEIGHT_PT + 'pt;margin:0 auto;padding:0;overflow:hidden;break-inside:avoid;page-break-inside:avoid;print-color-adjust:exact;-webkit-print-color-adjust:exact;}' +
      '.pi-generated-print-page img{display:block;width:100%;height:100%;object-fit:contain;object-position:center;image-rendering:auto;}' +
      "</style></head><body></body></html>"
    );
    frameDocument.close();
    var imagePromises = [];
    (artifact.pageImageBlobs || []).forEach(function (blob) {
      var objectUrl = window.URL.createObjectURL(blob);
      printState.objectUrls.push(objectUrl);
      var pageNode = frameDocument.createElement("div");
      pageNode.className = "pi-generated-print-page";
      var imageNode = frameDocument.createElement("img");
      imageNode.src = objectUrl;
      pageNode.appendChild(imageNode);
      frameDocument.body.appendChild(pageNode);
      imagePromises.push(new Promise(function (resolve, reject) {
        function finalizeLoaded() {
          if (!imageNode.naturalWidth || !imageNode.naturalHeight) {
            reject(new Error("The print layout could not be prepared. Please try again."));
            return;
          }
          if (typeof imageNode.decode === "function") {
            imageNode.decode().catch(function () {
              return null;
            }).finally(resolve);
            return;
          }
          resolve();
        }
        imageNode.addEventListener("load", finalizeLoaded, { once: true });
        imageNode.addEventListener("error", function () {
          reject(new Error("The print layout could not be prepared. Please try again."));
        }, { once: true });
      }));
    });
    await Promise.all(imagePromises);
    setPrintLifecycle("preparing-pages", {
      pageCount: artifact.pageCount || 0,
      pageImageByteLengths: (artifact.pageImageBlobs || []).map(function (blob) {
        return blob && blob.size ? blob.size : 0;
      }),
      imagesReadyAt: Date.now()
    });
    await waitForTwoAnimationFrames();
    var firstDiagnostics = collectPrintLayoutDiagnostics(frameDocument);
    setPrintLifecycle("validating-layout", {
      firstLayoutMeasuredAt: Date.now(),
      pageDimensions: firstDiagnostics.pageDimensions,
      bodyDimensions: firstDiagnostics.bodyDimensions,
      expectedBodyHeight: firstDiagnostics.expectedBodyHeight
    });
    await sleep(PRINT_PAGE_LAYOUT_SETTLE_MS);
    await waitForTwoAnimationFrames();
    var finalDiagnostics = validatePrintFrameLayout(frameDocument);
    setPrintLifecycle("validating-layout", {
      finalLayoutMeasuredAt: Date.now(),
      pageDimensions: finalDiagnostics.pageDimensions,
      bodyDimensions: finalDiagnostics.bodyDimensions,
      expectedBodyHeight: finalDiagnostics.expectedBodyHeight,
      overflowDetected: false
    });
    return frameDocument;
  }

  async function printGeneratedGuide(printButton) {
    if (!printButton) {
      return null;
    }
    var statusElement = document.querySelector(".pi-action-status");
    var printState = createPrintFrame();
    activePrintController = printState;
    var artifact = null;
    setGuidePdfActionButtonsDisabled(true);
    try {
      updateExportProgress(printButton, statusElement, null, null, "wait-translation");
      artifact = await getOrCreateGuidePdfArtifact(printButton);
      if (!artifact || !artifact.pageImageBlobs || !artifact.pageImageBlobs.length) {
        throw new Error("The print layout could not be prepared. Please try again.");
      }
      updateExportProgress(printButton, statusElement, null, null, "prepare-print-preview");
      if (statusElement) {
        statusElement.textContent = getGuideCopyText("prepare_print_preview", "Preparing print preview…");
      }
      await prepareGeneratedPrintFrame(printState, artifact);
      setPrintLifecycle("opening-print-dialog");
      updateExportProgress(printButton, statusElement, null, null, "open-print-dialog");
      if (statusElement) {
        statusElement.textContent = getGuideCopyText("opening_print_dialog", "Opening print dialog…");
      }
      if (printState.frame.contentWindow) {
        printState.frame.contentWindow.addEventListener("afterprint", function () {
          setPrintLifecycle("completed", {
            afterPrintAt: Date.now()
          });
          cleanupPrintFrame(printState);
        }, { once: true });
      }
      printState.cleanupTimer = window.setTimeout(function () {
        setPrintLifecycle("cleanup-timeout-completed", {
          cleanupTimestamp: Date.now()
        });
        cleanupPrintFrame(printState);
      }, 5 * 60 * 1000);
      printState.frame.contentWindow.focus();
      setPrintLifecycle("print-called", {
        printCalledAt: Date.now()
      });
      printState.frame.contentWindow.print();
      setPrintLifecycle("print-returned", {
        printReturnedAt: Date.now()
      });
      return artifact;
    } catch (error) {
      cleanupPrintFrame(printState);
      setPrintLifecycle("failed", {
        failureCode: String(error && error.message || "print-layout-preparation-failed")
      });
      if (statusElement) {
        statusElement.textContent = "The print layout could not be prepared. Please try again.";
      }
      setTranslationStatus(statusElement ? statusElement.textContent : "");
      return null;
    } finally {
      setGuidePdfActionButtonsDisabled(false);
      window.setTimeout(function () {
        resetPdfProgressUi();
      }, 1200);
    }
  }

  document.addEventListener("click", async function (event) {
    const copyButton = event.target.closest(".pi-copy-button");
    if (copyButton) {
      const copyTarget = copyButton.getAttribute("data-copy-target");
      const defaultLabel = copyButton.getAttribute("data-default-label") || "Copy";
      const statusElement = copyButton.parentElement
        ? copyButton.parentElement.querySelector(".pi-copy-status")
        : null;
      const targetElement = copyTarget ? document.getElementById(copyTarget) : null;
      const value = targetElement ? targetElement.textContent.trim() : "";
      if (!value) {
        return;
      }
      try {
        await copyValue(value);
        copyButton.classList.add("is-copied");
        copyButton.setAttribute("aria-label", "Copied");
        copyButton.setAttribute("title", "Copied");
        if (statusElement) {
          statusElement.textContent = "Copied";
        }
      } catch (error) {
        if (statusElement) {
          statusElement.textContent = "Unable to copy";
        }
      }
      window.setTimeout(function () {
        copyButton.classList.remove("is-copied");
        copyButton.setAttribute("aria-label", defaultLabel);
        copyButton.setAttribute("title", defaultLabel);
        if (statusElement) {
          statusElement.textContent = "";
        }
      }, 2000);
      return;
    }

    const downloadButton = event.target.closest(".pi-pdf-download");
    if (downloadButton && window.URL && window.URL.createObjectURL) {
      event.preventDefault();
      await downloadTranslatedPdf(downloadButton);
      return;
    }

    const showOriginalButton = event.target.closest("[data-guide-show-original]");
    if (showOriginalButton) {
      event.preventDefault();
      if (showOriginalButton.disabled) {
        return;
      }
      showOriginalButton.disabled = true;
      showOriginalButton.setAttribute("aria-disabled", "true");
      setTranslationStatus("Restoring original…");
      syncShowOriginalButton(translationState.requestedLanguage || getWidgetLanguage() || SOURCE_LANGUAGE);
      applyCustomLanguageSelection(SOURCE_LANGUAGE);
      window.setTimeout(function () {
        showOriginalButton.disabled = false;
        showOriginalButton.removeAttribute("aria-disabled");
        syncShowOriginalButton(getWidgetLanguage() || SOURCE_LANGUAGE);
      }, 1000);
      return;
    }

    const printButton = event.target.closest(".property-instruction-print");
    if (printButton) {
      event.preventDefault();
      await printGeneratedGuide(printButton);
    }
  });

  hydrateInstructionBlockMaps();
  ensureStickyToolbarObservers();
  ensureSectionNavObserver();
  scheduleStickyToolbarOffsetSync();

  document.addEventListener("pointerenter", function (event) {
    if (event.target && event.target.closest) {
      var warmButton = event.target.closest(".pi-pdf-download, .property-instruction-print");
      if (warmButton) {
        schedulePdfPreparationWarmup(warmButton);
      }
    }
  }, true);

  document.addEventListener("focus", function (event) {
    if (event.target && event.target.closest) {
      var warmButton = event.target.closest(".pi-pdf-download, .property-instruction-print");
      if (warmButton) {
        schedulePdfPreparationWarmup(warmButton);
      }
    }
  }, true);

  document.addEventListener("touchstart", function (event) {
    if (event.target && event.target.closest) {
      var warmButton = event.target.closest(".pi-pdf-download, .property-instruction-print");
      if (warmButton) {
        schedulePdfPreparationWarmup(warmButton);
      }
    }
  }, { passive: true, capture: true });

  window.addEventListener("pagehide", clearReadyPdfObjectUrl);
  window.addEventListener("beforeunload", clearReadyPdfObjectUrl);
  window.addEventListener("pagehide", cleanupActivePrintFrame);
  window.addEventListener("beforeunload", cleanupActivePrintFrame);

  if (getGuideScreen()) {
    try {
      ensureOriginalSnapshotCaptured();
    } catch (error) {
      // Ignore early snapshot capture failures; export-time validation will handle them.
    }
  }
})();
