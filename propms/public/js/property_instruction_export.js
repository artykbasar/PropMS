(function () {
  if (window.__propertyInstructionUiBound) {
    return;
  }
  window.__propertyInstructionUiBound = true;

  var JSPDF_LIBRARY_URL = "/assets/propms/js/vendor/jspdf.umd.min.js";
  var QRCODE_LIBRARY_URL = "/assets/propms/js/vendor/qrcodegen.js";
  var VECTOR_PDF_FONT_TARGET_DPI = 260;
  var VECTOR_PDF_FONT_FAMILY_LATIN = "propms-vector-inter";
  var VECTOR_PDF_FONT_FAMILY_ARABIC = "propms-vector-noto-sans-arabic";
  var VECTOR_PDF_FONT_MANIFEST = [
    {
      family: VECTOR_PDF_FONT_FAMILY_LATIN,
      style: "normal",
      weight: 400,
      url: "/assets/propms/js/vendor/fonts/Inter-Regular.ttf",
      file: "Inter-Regular.ttf"
    },
    {
      family: VECTOR_PDF_FONT_FAMILY_LATIN,
      style: "medium",
      weight: 500,
      url: "/assets/propms/js/vendor/fonts/Inter-Medium.ttf",
      file: "Inter-Medium.ttf"
    },
    {
      family: VECTOR_PDF_FONT_FAMILY_LATIN,
      style: "semibold",
      weight: 600,
      url: "/assets/propms/js/vendor/fonts/Inter-SemiBold.ttf",
      file: "Inter-SemiBold.ttf"
    },
    {
      family: VECTOR_PDF_FONT_FAMILY_LATIN,
      style: "bold",
      weight: 700,
      url: "/assets/propms/js/vendor/fonts/Inter-Bold.ttf",
      file: "Inter-Bold.ttf"
    },
    {
      family: VECTOR_PDF_FONT_FAMILY_ARABIC,
      style: "normal",
      weight: 400,
      url: "/assets/propms/js/vendor/fonts/NotoSansArabic-Regular.ttf",
      file: "NotoSansArabic-Regular.ttf"
    },
    {
      family: VECTOR_PDF_FONT_FAMILY_ARABIC,
      style: "semibold",
      weight: 600,
      url: "/assets/propms/js/vendor/fonts/NotoSansArabic-SemiBold.ttf",
      file: "NotoSansArabic-SemiBold.ttf"
    },
    {
      family: VECTOR_PDF_FONT_FAMILY_ARABIC,
      style: "bold",
      weight: 700,
      url: "/assets/propms/js/vendor/fonts/NotoSansArabic-Bold.ttf",
      file: "NotoSansArabic-Bold.ttf"
    }
  ];
  var PUBLIC_PDF_IMAGE_ENDPOINT = "/api/method/propms.property_management_solution.doctype.property_instruction.property_instruction.public_pdf_image";
  var PUBLIC_MAP_SNAPSHOT_IMAGE_ENDPOINT = "/api/method/propms.map_snapshot.pdf_assets.public_map_snapshot_image";
  var PDF_LAYOUT_VERSION = "2026-08-11-web-flow-rich-content-v3";
  var PDF_RENDERER_ID = "web-flow-vector";
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
  var PDF_EXPORT_CONTENT_WIDTH = PDF_EXPORT_WIDTH - PDF_EXPORT_PAGE_PADDING_LEFT - PDF_EXPORT_PAGE_PADDING_RIGHT;
  var PDF_EXPORT_TIMEOUT_MS = 240000;
  var PDF_EXPORT_IMAGE_RATIO_TOLERANCE = 0.02;
  var PDF_EXPORT_IMAGE_CLIP_TOLERANCE = 1.5;
  var PDF_MEDIA_RATIO_BLOCKER = 0.01;
  var PDF_PORTRAIT_RATIO_THRESHOLD = 1.15;
  var PDF_SPARSE_PAGE_THRESHOLD = 0.65;
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
  var MY_MAPS_COOPERATIVE_SELECTOR = ".pi-map-shell--google-my-maps, .pi-instruction-map-shell--google-my-maps";
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
    qrImageCache: new Map()
  };
  var pdfExportController = {
    activePromise: null,
    activeLanguage: "",
    readyObjectUrl: "",
    readyMimeType: "",
    readySize: 0,
    readyObjectUrlRevokeTimer: 0,
    feedbackDismissTimer: 0,
    lastTriggerButton: null,
    feedbackArtifact: null
  };
  var instructionBlockMapModels = null;
  var myMapsGestureModifierActive = false;
  var myMapsGestureListenersBound = false;
  var PRINT_TAB_DELAY_MS = 1000;
  var PRINT_TAB_BLOB_TTL_MS = 10 * 60 * 1000;
  var printGuideReadyDialog = null;
  var printGuideController = {
    activeBlobUrl: "",
    activeBlobCacheKey: "",
    activeBlobUrlTimer: 0,
    pendingArtifact: null,
    pendingTriggerButton: null,
    launchInProgress: false
  };
  var pdfArtifactModeController = {
    objectUrl: "",
    cleanupTimer: 0
  };
  var vectorPdfFontState = {
    base64ByUrl: {},
    registeredDocuments: {}
  };
  var vectorPdfImageAssetState = {
    preparedAssets: null
  };
  function isPdfArtifactModeEnabled() {
    try {
      var params = new URLSearchParams(window.location.search || "");
      return String(params.get("propms_pdf_artifact_mode") || "").toLowerCase() === "1";
    } catch (error) {
      return false;
    }
  }

  function getCurrentPdfPageMetrics() {
    return {
      widthPx: PDF_EXPORT_WIDTH,
      heightPx: PDF_EXPORT_PAGE_HEIGHT,
      bodyHeightPx: PDF_EXPORT_PAGE_BODY_HEIGHT,
      contentWidthPx: PDF_EXPORT_CONTENT_WIDTH,
      orientation: "portrait",
      format: "a4"
    };
  }

  function getCurrentPdfLayoutVersion() {
    return PDF_LAYOUT_VERSION;
  }

  function clearPdfArtifactModeResult(reason) {
    if (pdfArtifactModeController.cleanupTimer) {
      window.clearTimeout(pdfArtifactModeController.cleanupTimer);
      pdfArtifactModeController.cleanupTimer = 0;
    }
    if (pdfArtifactModeController.objectUrl && window.URL && window.URL.revokeObjectURL) {
      window.URL.revokeObjectURL(pdfArtifactModeController.objectUrl);
    }
    pdfArtifactModeController.objectUrl = "";
    if (isPdfArtifactModeEnabled()) {
      window.propmsPdfArtifactResult = {
        status: "idle",
        cleanupReason: String(reason || "manual-reset")
      };
    } else {
      delete window.propmsPdfArtifactResult;
      delete window.PropmsPdfExport;
    }
  }

  function schedulePdfArtifactModeCleanup(reason) {
    if (!isPdfArtifactModeEnabled()) {
      return;
    }
    if (pdfArtifactModeController.cleanupTimer) {
      window.clearTimeout(pdfArtifactModeController.cleanupTimer);
    }
    pdfArtifactModeController.cleanupTimer = window.setTimeout(function () {
      clearPdfArtifactModeResult(reason || "timeout");
    }, PRINT_TAB_BLOB_TTL_MS);
  }

  function setPdfArtifactModeResult(result) {
    if (!isPdfArtifactModeEnabled()) {
      return;
    }
    window.propmsPdfArtifactResult = Object.assign({}, window.propmsPdfArtifactResult || {}, result || {});
  }

  function createPdfArtifactModeBlobUrl(blob) {
    if (!isPdfArtifactModeEnabled() || !blob || !window.URL || !window.URL.createObjectURL) {
      return "";
    }
    if (pdfArtifactModeController.objectUrl && window.URL && window.URL.revokeObjectURL) {
      window.URL.revokeObjectURL(pdfArtifactModeController.objectUrl);
    }
    pdfArtifactModeController.objectUrl = window.URL.createObjectURL(blob);
    schedulePdfArtifactModeCleanup("timeout");
    return pdfArtifactModeController.objectUrl;
  }

  function hashSafeTraceValue(value) {
    var input = String(value || "");
    var hash = 2166136261;
    for (var index = 0; index < input.length; index += 1) {
      hash ^= input.charCodeAt(index);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return (hash >>> 0).toString(16);
  }

  function getSafeTraceId(value, prefix) {
    return String(prefix || "trace") + "-" + hashSafeTraceValue(value || "");
  }

  function trimTraceCollection(collection, limit) {
    if (!Array.isArray(collection)) {
      return [];
    }
    if (collection.length <= limit) {
      return collection;
    }
    return collection.slice(collection.length - limit);
  }

  function getPrintGuideDiagnostics() {
    window.__propertyInstructionTabPrintDiagnostics = window.__propertyInstructionTabPrintDiagnostics || {
      createdAt: Date.now(),
      platform: {
        browserFamily: getBrowserFamily(),
        osFamily: /Android/i.test(String((navigator && navigator.userAgent) || "")) ? "Android" : (
          /iPad|iPhone|iPod/i.test(String((navigator && navigator.userAgent) || "")) ? "iOS" : "Other"
        )
      },
      events: []
    };
    return window.__propertyInstructionTabPrintDiagnostics;
  }

  function recordPrintGuideDiagnostic(eventName, extraDetails) {
    var diagnostics = getPrintGuideDiagnostics();
    diagnostics.events.push(Object.assign({
      event: String(eventName || "event"),
      at: Date.now()
    }, extraDetails || {}));
    diagnostics.events = trimTraceCollection(diagnostics.events, 120);
  }

  function resetPrintGuidePendingState() {
    printGuideController.pendingArtifact = null;
    printGuideController.pendingTriggerButton = null;
  }

  function clearPrintGuideBlobUrl(reason) {
    if (printGuideController.activeBlobUrlTimer) {
      window.clearTimeout(printGuideController.activeBlobUrlTimer);
      printGuideController.activeBlobUrlTimer = 0;
    }
    if (printGuideController.activeBlobUrl && window.URL && window.URL.revokeObjectURL) {
      window.URL.revokeObjectURL(printGuideController.activeBlobUrl);
      recordPrintGuideDiagnostic("blob-cleaned", {
        cleanupReason: String(reason || "manual-reset")
      });
    }
    printGuideController.activeBlobUrl = "";
    printGuideController.activeBlobCacheKey = "";
  }

  function schedulePrintGuideBlobCleanup(reason) {
    if (!printGuideController.activeBlobUrl) {
      return;
    }
    if (printGuideController.activeBlobUrlTimer) {
      window.clearTimeout(printGuideController.activeBlobUrlTimer);
    }
    var cleanupReason = String(reason || "timeout");
    recordPrintGuideDiagnostic("blob-cleanup-scheduled", {
      cleanupReason: cleanupReason
    });
    printGuideController.activeBlobUrlTimer = window.setTimeout(function () {
      clearPrintGuideBlobUrl(cleanupReason);
    }, PRINT_TAB_BLOB_TTL_MS);
  }

  function getPrintGuideBlobUrlForArtifact(artifact) {
    if (!artifact || !artifact.pdfBlob || !window.URL || !window.URL.createObjectURL) {
      return "";
    }
    var cacheKey = String(artifact.cacheKey || "");
    if (
      printGuideController.activeBlobUrl &&
      cacheKey &&
      printGuideController.activeBlobCacheKey === cacheKey
    ) {
      schedulePrintGuideBlobCleanup("timeout");
      return printGuideController.activeBlobUrl;
    }
    clearPrintGuideBlobUrl("artifact-replaced");
    printGuideController.activeBlobUrl = window.URL.createObjectURL(artifact.pdfBlob);
    printGuideController.activeBlobCacheKey = cacheKey;
    schedulePrintGuideBlobCleanup("timeout");
    return printGuideController.activeBlobUrl;
  }

  function getCurrentCompletedPdfArtifact(triggerElement) {
    syncTranslationLanguageState();
    var guideIdentity = getGuideIdentity(triggerElement);
    var currentLanguage = translationState.requestedLanguage || SOURCE_LANGUAGE;
    var currentGeneration = translationState.generation || 0;
    var snapshot = captureSemanticSnapshot();
    var snapshotHash = getSnapshotHash(snapshot);
    var cacheKey = getPreparedStateKey(
      guideIdentity,
      currentLanguage,
      currentGeneration,
      snapshotHash
    );
    var artifact = getCachedPdfArtifact(cacheKey);
    if (
      !artifact ||
      !artifact.pdfBlob ||
      !(artifact.pdfBlob instanceof Blob) ||
      Number(artifact.pdfBlob.size || 0) <= 0 ||
      Number(artifact.pageCount || 0) <= 0 ||
      String(artifact.cacheKey || "") !== String(cacheKey)
    ) {
      return null;
    }
    artifact.artifactCacheHit = true;
    return artifact;
  }

  function setPrintGuideLaunchInProgress(disabled) {
    printGuideController.launchInProgress = !!disabled;
    var printButton = getPrintButton();
    if (!printButton) {
      return;
    }
    if (disabled) {
      printButton.disabled = true;
      printButton.classList.add("is-disabled");
      printButton.setAttribute("aria-disabled", "true");
      return;
    }
    if (!pdfExportController.activePromise) {
      printButton.disabled = false;
      printButton.classList.remove("is-disabled");
      printButton.removeAttribute("aria-disabled");
    }
  }

  function openPdfTabWaitingDocument(printTab) {
    if (!printTab) {
      return;
    }
    try {
      printTab.document.open();
      printTab.document.write("<!doctype html><html><head><meta charset=\"utf-8\"><title>Opening printable guide…</title></head><body><p>Opening printable guide…</p></body></html>");
      printTab.document.close();
    } catch (error) {
      recordPrintGuideDiagnostic("print-tab-write-failed", {
        errorName: String(error && error.name || "Error")
      });
    }
  }

  function navigatePdfTabAndSchedulePrint(printTab, artifact, interactionCount) {
    if (!printTab || !artifact || !artifact.pdfBlob) {
      return false;
    }
    var blobUrl = getPrintGuideBlobUrlForArtifact(artifact);
    if (!blobUrl) {
      return false;
    }
    try {
      printTab.location.replace(blobUrl);
      recordPrintGuideDiagnostic("pdf-tab-navigated", {
        artifactCacheHit: !!artifact.artifactCacheHit,
        pageCount: artifact.pageCount || 0,
        pdfBlobSize: artifact.pdfBlob.size || 0,
        interactionCount: Number(interactionCount || 1),
        printDelayMs: PRINT_TAB_DELAY_MS
      });
    } catch (error) {
      recordPrintGuideDiagnostic("pdf-tab-navigation-failed", {
        errorName: String(error && error.name || "Error")
      });
      try {
        if (printTab.close) {
          printTab.close();
        }
      } catch (closeError) {
        // Ignore close failures on browser-owned tabs.
      }
      setPrintGuideLaunchInProgress(false);
      return false;
    }
    window.setTimeout(function () {
      try {
        if (printTab.focus) {
          printTab.focus();
        }
      } catch (error) {
        recordPrintGuideDiagnostic("print-focus-failed", {
          errorName: String(error && error.name || "Error")
        });
      }
      recordPrintGuideDiagnostic("print-called", {
        artifactCacheHit: !!artifact.artifactCacheHit,
        pageCount: artifact.pageCount || 0,
        interactionCount: Number(interactionCount || 1),
        printDelayMs: PRINT_TAB_DELAY_MS
      });
      try {
        printTab.print();
        recordPrintGuideDiagnostic("print-returned", {
          interactionCount: Number(interactionCount || 1)
        });
      } catch (error) {
        recordPrintGuideDiagnostic("print-threw", {
          errorName: String(error && error.name || "Error")
        });
      } finally {
        window.setTimeout(function () {
          setPrintGuideLaunchInProgress(false);
        }, 0);
      }
    }, PRINT_TAB_DELAY_MS);
    return true;
  }

  function ensurePrintGuideReadyDialog() {
    if (printGuideReadyDialog) {
      return;
    }
    if (!document.getElementById("pi-print-ready-dialog-styles")) {
      var style = document.createElement("style");
      style.id = "pi-print-ready-dialog-styles";
      style.textContent = [
        "[data-guide-print-ready-dialog]{border:0;padding:0;background:transparent;max-width:min(28rem,calc(100vw - 32px));width:min(28rem,calc(100vw - 32px));margin:auto;inset:0;}",
        "[data-guide-print-ready-dialog]::backdrop{background:rgba(15,23,42,.46);backdrop-filter:blur(2px);}",
        ".pi-print-ready-card{display:grid;gap:.9rem;padding:1.25rem;background:var(--pi-card,#fff);color:var(--pi-ink,#1f2933);border:1px solid var(--pi-border,#d7dee5);border-radius:24px;box-shadow:0 18px 40px rgba(15,23,42,.12);font:inherit;}",
        ".pi-print-ready-hero{display:grid;justify-items:center;gap:.6rem;text-align:center;}",
        ".pi-print-ready-icon{display:grid;place-items:center;width:4.5rem;height:4.5rem;border-radius:22px;background:var(--pi-accent-soft,#dff4f2);color:var(--pi-accent,#115e59);}",
        ".pi-print-ready-icon svg{width:2rem;height:2rem;display:block;stroke:currentColor;stroke-width:1.8;fill:none;stroke-linecap:round;stroke-linejoin:round;pointer-events:none;}",
        ".pi-print-ready-kicker{margin:0;font:700 .84rem/1.2 inherit;letter-spacing:.06em;text-transform:uppercase;color:var(--pi-accent,#115e59);}",
        ".pi-print-ready-error{margin:0;color:#b91c1c;text-align:center;}",
        ".pi-print-ready-error[hidden]{display:none;}",
        ".pi-print-ready-copy{margin:0;text-align:center;color:var(--pi-muted,#52606d);line-height:1.5;}",
        ".pi-print-ready-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.65rem;align-items:center;width:min(100%,18rem);margin:0 auto;}",
        ".pi-print-ready-actions .pi-btn{width:100%;min-height:2.9rem;}",
        ".pi-print-ready-actions .pi-btn-primary{background:var(--pi-accent-fill,var(--pi-accent,#115e59));color:var(--pi-accent-contrast,#fff);border:1px solid transparent;}",
        ".pi-print-ready-actions .pi-btn-secondary{background:transparent;color:var(--pi-accent,#115e59);border:1px solid var(--pi-border,#d7dee5);}",
        "@media (max-width: 768px){[data-guide-print-ready-dialog]{width:calc(100vw - 32px);margin:auto;}.pi-print-ready-card{padding:1rem;}.pi-print-ready-actions{grid-template-columns:1fr;}.pi-print-ready-actions .pi-btn{min-height:2.9rem;}}",
        "@media (prefers-reduced-motion:no-preference){[data-guide-print-ready-dialog][open] .pi-print-ready-card{animation:piPrintReadyFade .18s ease-out;}}",
        "@keyframes piPrintReadyFade{from{transform:translateY(6px);opacity:0;}to{transform:translateY(0);opacity:1;}}"
      ].join("");
      document.head.appendChild(style);
    }
    var dialog = document.createElement("dialog");
    dialog.setAttribute("data-guide-print-ready-dialog", "true");
    dialog.setAttribute("data-guide-ui-exclude", "true");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "pi-print-ready-kicker");
    dialog.innerHTML =
      '<form method="dialog" class="pi-print-ready-card">' +
      '<div class="pi-print-ready-hero">' +
      '<div class="pi-print-ready-icon" aria-hidden="true">' +
      '<svg class="pi-toolbar-action-icon" focusable="false" viewBox="0 0 24 24"><path d="M6 9V3h12v6"></path><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><path d="M6 14h12v7H6z"></path></svg>' +
      '</div>' +
      '<p id="pi-print-ready-kicker" class="pi-print-ready-kicker" data-guide-print-ready-kicker>PDF ready</p>' +
      '</div>' +
      '<p class="pi-print-ready-copy" data-guide-print-ready-copy>Choose Print PDF to open the printable PDF in a new tab.</p>' +
      '<p class="pi-print-ready-error" data-guide-print-ready-error aria-live="polite" hidden></p>' +
      '<div class="pi-print-ready-actions">' +
      '<button type="button" class="pi-btn pi-btn-primary" data-guide-pdf-ready-print>Print PDF</button>' +
      '<button type="button" class="pi-btn pi-btn-secondary" data-guide-print-ready-cancel>Cancel</button>' +
      '</div>' +
      '</form>';
    dialog.addEventListener("cancel", function (event) {
      event.preventDefault();
      closePrintGuideReadyDialog("cancelled");
    });
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) {
        closePrintGuideReadyDialog("cancelled");
      }
    });
    document.body.appendChild(dialog);
    printGuideReadyDialog = dialog;
    syncPrintReadyDialogThemeVariables();
  }

  function openPrintGuideReadyDialog(artifact, triggerButton, errorMessage) {
    ensurePrintGuideReadyDialog();
    if (!printGuideReadyDialog) {
      return;
    }
    printGuideController.pendingArtifact = artifact;
    printGuideController.pendingTriggerButton = triggerButton || null;
    var errorNode = printGuideReadyDialog.querySelector("[data-guide-print-ready-error]");
    var printButton = printGuideReadyDialog.querySelector("[data-guide-pdf-ready-print]");
    if (errorNode) {
      errorNode.textContent = String(errorMessage || "");
      errorNode.hidden = !errorMessage;
    }
    [printButton].forEach(function (actionButton) {
      if (!actionButton) {
        return;
      }
      actionButton.disabled = false;
      actionButton.removeAttribute("aria-disabled");
    });
    var copyNode = printGuideReadyDialog.querySelector("[data-guide-print-ready-copy]");
    if (copyNode) {
      copyNode.textContent = "Choose Print PDF to open the printable PDF in a new tab.";
    }
    clearPdfFeedback();
    recordPrintGuideDiagnostic("ready-dialog-opened", {
      artifactCacheHit: !!(artifact && artifact.artifactCacheHit),
      pageCount: artifact && artifact.pageCount ? artifact.pageCount : 0,
      pdfBlobSize: artifact && artifact.pdfBlob ? artifact.pdfBlob.size || 0 : 0,
      readyDialogRequired: true
    });
    recordPdfInteractionDiagnostic("ready-dialog-opened", {
      pageCount: artifact && artifact.pageCount ? artifact.pageCount : 0,
      preferredAction: "print"
    });
    if (typeof printGuideReadyDialog.showModal === "function") {
      printGuideReadyDialog.showModal();
    } else {
      printGuideReadyDialog.setAttribute("open", "open");
    }
    window.setTimeout(function () {
      if (printButton && printButton.focus) {
        printButton.focus();
      }
    }, 0);
  }

  function closePrintGuideReadyDialog(resultName) {
    if (!printGuideReadyDialog) {
      return;
    }
    if (resultName === "cancelled") {
      recordPrintGuideDiagnostic("ready-dialog-cancelled", {
        artifactCacheHit: !!(printGuideController.pendingArtifact && printGuideController.pendingArtifact.artifactCacheHit)
      });
      recordPdfInteractionDiagnostic("ready-dialog-cancelled", {});
      resetPrintGuidePendingState();
    }
    if (typeof printGuideReadyDialog.close === "function") {
      printGuideReadyDialog.close();
    } else {
      printGuideReadyDialog.removeAttribute("open");
    }
    if (resultName === "cancelled") {
      var triggerButton = printGuideController.pendingTriggerButton;
      window.setTimeout(function () {
        if (triggerButton && triggerButton.focus) {
          triggerButton.focus();
        }
      }, 0);
    }
  }

  function finalizeReadyPdfDownload(artifact, filename) {
    if (!artifact || !artifact.pdfBlob) {
      return false;
    }
    var anchor = getPdfDownloadAnchor();
    if (!anchor) {
      return false;
    }
    var objectUrl = createReadyPdfObjectUrl(getPdfDownloadBlob(artifact.pdfBlob));
    if (!objectUrl) {
      return false;
    }
    anchor.href = objectUrl;
    anchor.download = filename;
    if (!anchor.parentNode) {
      document.body.appendChild(anchor);
    }
    recordPdfInteractionDiagnostic("object-url-created", {
      action: "download",
      size: artifact.pdfBlob.size || 0
    });
    anchor.click();
    recordPdfInteractionDiagnostic("anchor-clicked", {
      action: "download",
      filename: String(filename || "")
    });
    updateTranslationDiagnostics({
      pdfDownloadAttempt: {
        mimeType: pdfExportController.readyMimeType,
        size: pdfExportController.readySize,
        objectUrlCreated: !!objectUrl,
        automaticDownloadAttempted: false,
        clickTimestamp: Date.now(),
        browserFamily: getBrowserFamily()
      }
    });
    return true;
  }

  async function printGeneratedGuide(printButton) {
    if (!printButton || printGuideController.launchInProgress) {
      return null;
    }
    clearPdfFeedback();
    pdfExportController.lastTriggerButton = printButton;
    recordPdfInteractionDiagnostic("print-click-received", {});
    recordPrintGuideDiagnostic("print-requested", {
      interactionCount: 1
    });
    var completedArtifact = getCurrentCompletedPdfArtifact(printButton);
    recordPrintGuideDiagnostic("artifact-ready-at-click", {
      artifactCacheHit: !!completedArtifact,
      pageCount: completedArtifact && completedArtifact.pageCount ? completedArtifact.pageCount : 0,
      pdfBlobSize: completedArtifact && completedArtifact.pdfBlob ? completedArtifact.pdfBlob.size || 0 : 0,
      interactionCount: 1,
      readyDialogRequired: !completedArtifact
    });
    if (completedArtifact) {
      openPrintGuideReadyDialog(completedArtifact, printButton, "");
      return completedArtifact;
    }

    var generationStartedAt = Date.now();
    var awaitingExistingGeneration = !!pdfExportController.activePromise;
    recordPrintGuideDiagnostic("generation-started", {
      artifactCacheHit: false,
      interactionCount: 1,
      readyDialogRequired: true,
      existingGenerationAwaited: awaitingExistingGeneration
    });
    if (pdfExportController.activePromise) {
      recordPrintGuideDiagnostic("existing-generation-awaited", {
        interactionCount: 1
      });
      recordPdfInteractionDiagnostic("existing-generation-awaited", {
        action: "print"
      });
    }
    var artifact = await getOrCreateGuidePdfArtifact(printButton);
    if (!artifact || !artifact.pdfBlob || !artifact.pageCount) {
      return null;
    }
    artifact.artifactCacheHit = !!artifact.artifactCacheHit;
    recordPrintGuideDiagnostic("generation-completed", {
      artifactCacheHit: false,
      generationDurationMs: Math.max(0, Date.now() - generationStartedAt),
      pageCount: artifact.pageCount || 0,
      pdfBlobSize: artifact.pdfBlob.size || 0,
      interactionCount: 1,
      readyDialogRequired: true
    });
    recordPdfInteractionDiagnostic("generation-completed", {
      action: "print",
      pageCount: artifact.pageCount || 0
    });
    openPrintGuideReadyDialog(artifact, printButton, "");
    return artifact;
  }

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

  function isIosPdfDownloadDevice() {
    var userAgent = String((navigator && navigator.userAgent) || "");
    var platform = String((navigator && navigator.platform) || "");
    var maxTouchPoints = Number((navigator && navigator.maxTouchPoints) || 0);
    return /iPad|iPhone|iPod/i.test(userAgent) || (platform === "MacIntel" && maxTouchPoints > 1);
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
      recordPdfInteractionDiagnostic("generation-stage", {
        stage: nextStage
      });
    }
    window.__propertyInstructionPdfLifecycle = lifecycle;
    return lifecycle;
  }

  function resetPdfGenerationDiagnostics(renderer) {
    window.__propertyInstructionPdfGenerationDiagnostics = {
      startedAt: Date.now(),
      browserFamily: getBrowserFamily(),
      renderer: String(renderer || PDF_RENDERER_ID),
      language: translationState.requestedLanguage || SOURCE_LANGUAGE,
      currentStage: "idle",
      events: [],
      stageDurations: {},
      counters: {},
      warnings: []
    };
    return window.__propertyInstructionPdfGenerationDiagnostics;
  }

  function getPdfGenerationDiagnostics() {
    return window.__propertyInstructionPdfGenerationDiagnostics || resetPdfGenerationDiagnostics(PDF_RENDERER_ID);
  }

  function recordPdfGenerationStage(stageName, extraDetails) {
    var diagnostics = getPdfGenerationDiagnostics();
    var nextStage = String(stageName || "idle");
    diagnostics.currentStage = nextStage;
    diagnostics.language = translationState.requestedLanguage || SOURCE_LANGUAGE;
    diagnostics.renderer = PDF_RENDERER_ID;
    diagnostics.events.push(Object.assign({
      stage: nextStage,
      at: Date.now(),
      elapsedMs: Math.max(0, Date.now() - diagnostics.startedAt),
      browserFamily: getBrowserFamily(),
      renderer: diagnostics.renderer,
      language: diagnostics.language
    }, extraDetails || {}));
    diagnostics.events = trimTraceCollection(diagnostics.events, 160);
    return diagnostics;
  }

  function recordPdfGenerationDuration(key, durationMs, extraDetails) {
    var diagnostics = getPdfGenerationDiagnostics();
    diagnostics.stageDurations[key] = Number((durationMs || 0).toFixed ? durationMs.toFixed(2) : durationMs || 0);
    if (durationMs > 2500) {
      diagnostics.warnings.push(Object.assign({
        kind: "slow-stage",
        key: String(key || "stage"),
        durationMs: Number((durationMs || 0).toFixed ? durationMs.toFixed(2) : durationMs || 0)
      }, extraDetails || {}));
      diagnostics.warnings = trimTraceCollection(diagnostics.warnings, 80);
    }
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
      getCurrentPdfLayoutVersion()
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

  function getPdfFeedbackPanel() {
    return document.querySelector("[data-guide-pdf-feedback]");
  }

  function getPdfFeedbackMessageNode() {
    return document.querySelector("[data-guide-pdf-feedback-message]");
  }

  function getPdfFeedbackCodeNode() {
    return document.querySelector("[data-guide-pdf-feedback-code]");
  }

  function getPdfFeedbackActionsNode() {
    return document.querySelector("[data-guide-pdf-feedback-actions]");
  }

  function getPdfFeedbackRetryButton() {
    return document.querySelector("[data-guide-pdf-feedback-retry]");
  }

  function getPdfFeedbackDownloadButton() {
    return document.querySelector("[data-guide-pdf-feedback-download]");
  }

  function getPdfFeedbackOpenButton() {
    return document.querySelector("[data-guide-pdf-feedback-open]");
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

  function getGuideImageUnavailableText() {
    return getGuideCopyText("image_unavailable", "Unavailable image");
  }

  function trimWarningCollection(items, maxLength) {
    return trimTraceCollection(items || [], maxLength || 20);
  }

  function describeMediaSourceType(sourceUrl) {
    var value = String(sourceUrl || "").trim();
    if (!value) {
      return "unknown";
    }
    if (isDataUrl(value)) {
      return "inline";
    }
    try {
      var parsed = new URL(value, window.location.href);
      var hostname = String(parsed.hostname || "").toLowerCase();
      if (
        hostname === String(window.location.hostname || "").toLowerCase()
        || hostname === "development.localhost"
        || hostname === "localhost"
        || hostname === "127.0.0.1"
      ) {
        return "local";
      }
      return "remote";
    } catch (error) {
      return value.charAt(0) === "/" ? "local" : "unknown";
    }
  }

  function resolveMediaFailureReason(error) {
    var message = String(error && error.message || "");
    var statusMatch = message.match(/Unable to prepare PDF image:\s*(\d{3})/i);
    if (statusMatch) {
      return {
        code: "http-" + statusMatch[1],
        status: Number(statusMatch[1])
      };
    }
    if (/not found/i.test(message)) {
      return {
        code: "not-found",
        status: null
      };
    }
    if (/non-image/i.test(message)) {
      return {
        code: "non-image-response",
        status: null
      };
    }
    return {
      code: "load-failed",
      status: null
    };
  }

  function buildMediaReferenceLabel(mediaDescriptor) {
    if (!mediaDescriptor) {
      return "guide image";
    }
    if (mediaDescriptor.mediaRole === "cover-image") {
      return "cover image";
    }
    if (mediaDescriptor.mediaRole === "property-map") {
      return "property overview map";
    }
    if (mediaDescriptor.mediaRole === "parking-map") {
      return "Parking map";
    }
    if (mediaDescriptor.mediaRole === "block-map") {
      return mediaDescriptor.sectionTitle
        ? (mediaDescriptor.sectionTitle + " map")
        : "instruction map";
    }
    if (mediaDescriptor.stepNumber) {
      return "step " + mediaDescriptor.stepNumber + " image";
    }
    if (mediaDescriptor.blockTitle) {
      return mediaDescriptor.blockTitle + " image";
    }
    if (mediaDescriptor.sectionTitle) {
      return mediaDescriptor.sectionTitle + " image";
    }
    return "guide image";
  }

  function buildRequiredMediaUnavailableError(mediaDescriptor, reason) {
    var label = buildMediaReferenceLabel(mediaDescriptor);
    var error = new Error("A required guide image is unavailable for " + label + ".");
    error.code = "required-media-unavailable";
    error.mediaRole = mediaDescriptor && mediaDescriptor.mediaRole ? mediaDescriptor.mediaRole : "image";
    error.section = mediaDescriptor && mediaDescriptor.sectionTitle ? mediaDescriptor.sectionTitle : "";
    error.blockId = mediaDescriptor && mediaDescriptor.blockId ? mediaDescriptor.blockId : "";
    error.stepNumber = mediaDescriptor && mediaDescriptor.stepNumber ? mediaDescriptor.stepNumber : "";
    error.reasonCode = reason && reason.code ? reason.code : "load-failed";
    error.sourceType = mediaDescriptor && mediaDescriptor.sourceType ? mediaDescriptor.sourceType : "unknown";
    return error;
  }

  function resolveMediaFailurePolicy(options) {
    var mediaRole = String(options && options.mediaRole || "image");
    var required = !!(options && options.required);
    var sourceType = String(options && options.sourceType || "unknown");
    return {
      mediaRole: mediaRole,
      required: required,
      sourceType: sourceType,
      placeholderAllowed: !required,
      placeholderClass: mediaRole.indexOf("map") !== -1
        ? "pi-export-map-placeholder"
        : "pi-export-image-placeholder",
      placeholderText: getGuideImageUnavailableText()
    };
  }

  function buildOptionalMediaWarning(mediaDescriptor, reason, policy) {
    return {
      role: mediaDescriptor && mediaDescriptor.mediaRole ? mediaDescriptor.mediaRole : "instruction-image",
      section: mediaDescriptor && mediaDescriptor.sectionTitle ? mediaDescriptor.sectionTitle : "",
      sectionAnchor: mediaDescriptor && mediaDescriptor.sectionAnchor ? mediaDescriptor.sectionAnchor : "",
      step: mediaDescriptor && mediaDescriptor.stepNumber ? mediaDescriptor.stepNumber : "",
      blockId: mediaDescriptor && mediaDescriptor.blockId ? mediaDescriptor.blockId : "",
      title: mediaDescriptor && mediaDescriptor.blockTitle ? mediaDescriptor.blockTitle : "",
      reason: reason && reason.code ? reason.code : "load-failed",
      sourceType: mediaDescriptor && mediaDescriptor.sourceType ? mediaDescriptor.sourceType : "unknown",
      fallbackUsed: !!(policy && policy.placeholderAllowed)
    };
  }

  function applyOptionalMediaFallback(mediaDescriptor, policy, warning) {
    if (!mediaDescriptor || !mediaDescriptor.target || !policy || !policy.placeholderAllowed) {
      return;
    }
    mediaDescriptor.target.mediaUnavailable = {
      role: mediaDescriptor.mediaRole,
      placeholderClass: policy.placeholderClass,
      placeholderText: policy.placeholderText,
      warning: warning
    };
  }

  function applyCustomGoogleMapQrFallback(mediaDescriptor, reason) {
    if (!mediaDescriptor || !mediaDescriptor.target) {
      return false;
    }
    if (mediaDescriptor.mediaRole === "property-map") {
      mediaDescriptor.target.imageSrc = "";
      mediaDescriptor.target.mapAssetKind = "qr";
      mediaDescriptor.target.finalPdfRepresentation = "qr";
      mediaDescriptor.target.pdfFinalCode = "snapshot-load-failed-qr-used";
      mediaDescriptor.target.imageLoadCode = reason && reason.code ? reason.code : "load-failed";
      mediaDescriptor.target.attribution = "";
      mediaDescriptor.target.qrEntries = buildMainCustomMapQrEntries({ map: mediaDescriptor.target });
      return true;
    }
    if (mediaDescriptor.mediaRole === "block-map") {
      mediaDescriptor.target.mapImageSrc = "";
      mediaDescriptor.target.mapAssetKind = "qr";
      mediaDescriptor.target.finalPdfRepresentation = "qr";
      mediaDescriptor.target.pdfFinalCode = "snapshot-load-failed-qr-used";
      mediaDescriptor.target.imageLoadCode = reason && reason.code ? reason.code : "load-failed";
      mediaDescriptor.target.qrEntries = buildBlockCustomMapQrEntries(mediaDescriptor.target);
      return true;
    }
    return false;
  }

  function initializePdfInteractionDiagnostics() {
    window.__propertyInstructionPdfInteractionDiagnostics = {
      events: []
    };
    return window.__propertyInstructionPdfInteractionDiagnostics;
  }

  function getPdfInteractionDiagnostics() {
    if (!window.__propertyInstructionPdfInteractionDiagnostics || !Array.isArray(window.__propertyInstructionPdfInteractionDiagnostics.events)) {
      return initializePdfInteractionDiagnostics();
    }
    return window.__propertyInstructionPdfInteractionDiagnostics;
  }

  function recordPdfInteractionDiagnostic(eventName, extraDetails) {
    var diagnostics = getPdfInteractionDiagnostics();
    diagnostics.events.push(Object.assign({
      event: String(eventName || ""),
      timestamp: Date.now()
    }, extraDetails || {}));
    if (diagnostics.events.length > 80) {
      diagnostics.events.splice(0, diagnostics.events.length - 80);
    }
  }

  function getEventPath(event) {
    if (event && typeof event.composedPath === "function") {
      try {
        var composedPath = event.composedPath();
        if (Array.isArray(composedPath) && composedPath.length) {
          return composedPath;
        }
      } catch (error) {
        recordPdfInteractionDiagnostic("event-path-error", {
          errorName: String(error && error.name || "Error")
        });
      }
    }
    var path = [];
    var currentNode = event && event.target ? event.target : null;
    while (currentNode) {
      path.push(currentNode);
      currentNode = currentNode.parentNode || currentNode.host || null;
    }
    if (window && path.indexOf(window) === -1) {
      path.push(window);
    }
    return path;
  }

  function summarizeEventPathNode(node) {
    if (!node) {
      return "";
    }
    if (node === window) {
      return "window";
    }
    if (node === document) {
      return "document";
    }
    var tagName = String(node.tagName || node.nodeName || "").toLowerCase();
    if (!tagName) {
      return "";
    }
    var suffix = "";
    if (node.classList && typeof node.classList.value === "string" && node.classList.value.trim()) {
      suffix = "." + node.classList.value.trim().split(/\s+/).slice(0, 2).join(".");
    }
    return tagName + suffix;
  }

  function getSafeEventTargetInfo(event) {
    var target = event && event.target ? event.target : null;
    return {
      tagName: String(target && (target.tagName || target.nodeName) || "").toLowerCase(),
      namespace: String(target && target.namespaceURI || ""),
      path: getEventPath(event)
        .map(summarizeEventPathNode)
        .filter(Boolean)
        .slice(0, 10)
    };
  }

  function getEventActionTarget(event, selector) {
    var normalizedSelector = String(selector || "").trim();
    if (!normalizedSelector) {
      return null;
    }
    var eventPath = getEventPath(event);
    for (var pathIndex = 0; pathIndex < eventPath.length; pathIndex += 1) {
      var pathNode = eventPath[pathIndex];
      if (pathNode && typeof pathNode.matches === "function" && pathNode.matches(normalizedSelector)) {
        return pathNode;
      }
    }
    var target = event && event.target ? event.target : null;
    if (target && typeof target.closest === "function") {
      try {
        return target.closest(normalizedSelector);
      } catch (error) {
        recordPdfInteractionDiagnostic("action-target-closest-error", {
          selector: normalizedSelector,
          errorName: String(error && error.name || "Error")
        });
      }
    }
    return null;
  }

  function restorePdfInteractionControls() {
    setGuidePdfActionButtonsDisabled(false);
    setPdfExportControlsDisabled(false);
    setPrintGuideLaunchInProgress(false);
    var readyPrintButton = document.querySelector("[data-guide-pdf-ready-print]");
    var retryButton = getPdfFeedbackRetryButton();
    var feedbackDownloadButton = getPdfFeedbackDownloadButton();
    var feedbackOpenButton = getPdfFeedbackOpenButton();
    [readyPrintButton, retryButton, feedbackDownloadButton, feedbackOpenButton].forEach(function (button) {
      if (!button) {
        return;
      }
      button.disabled = false;
      button.classList.remove("is-disabled");
      button.removeAttribute("aria-disabled");
    });
  }

  function handlePdfInteractionControllerError(error, contextDetails) {
    var errorName = String(error && error.name || "Error");
    var errorMessage = String(error && error.message || "Unable to complete the PDF action.");
    var failureCode = "interaction-controller-error";
    window.__propertyInstructionLastPdfError = {
      message: errorMessage,
      name: errorName,
      capturedAt: Date.now(),
      code: failureCode
    };
    recordPdfInteractionDiagnostic("interaction-controller-failed", Object.assign({
      errorName: errorName,
      errorMessage: errorMessage
    }, contextDetails || {}));
    showPdfFeedback("error", getGuideCopyText("pdf_generation_failed", "The PDF could not be generated. Please try again."), {
      code: failureCode,
      showRetry: true
    });
    restorePdfInteractionControls();
  }

  function clearPdfFeedbackDismissTimer() {
    if (!pdfExportController.feedbackDismissTimer) {
      return;
    }
    window.clearTimeout(pdfExportController.feedbackDismissTimer);
    pdfExportController.feedbackDismissTimer = 0;
  }

  function clearPdfFeedback() {
    clearPdfFeedbackDismissTimer();
    var panel = getPdfFeedbackPanel();
    var messageNode = getPdfFeedbackMessageNode();
    var codeNode = getPdfFeedbackCodeNode();
    var actionsNode = getPdfFeedbackActionsNode();
    var retryButton = getPdfFeedbackRetryButton();
    var downloadButton = getPdfFeedbackDownloadButton();
    var openButton = getPdfFeedbackOpenButton();
    if (panel) {
      panel.hidden = true;
      panel.classList.remove("is-error");
      panel.classList.remove("is-success");
      panel.removeAttribute("data-feedback-kind");
    }
    if (messageNode) {
      messageNode.textContent = "";
    }
    if (codeNode) {
      codeNode.textContent = "";
      codeNode.hidden = true;
    }
    if (actionsNode) {
      actionsNode.hidden = true;
    }
    if (retryButton) {
      retryButton.hidden = true;
    }
    if (downloadButton) {
      downloadButton.hidden = true;
    }
    if (openButton) {
      openButton.hidden = true;
    }
    pdfExportController.feedbackArtifact = null;
  }

  function showPdfFeedback(kind, message, options) {
    clearPdfFeedbackDismissTimer();
    var panel = getPdfFeedbackPanel();
    var messageNode = getPdfFeedbackMessageNode();
    var codeNode = getPdfFeedbackCodeNode();
    var actionsNode = getPdfFeedbackActionsNode();
    var retryButton = getPdfFeedbackRetryButton();
    var downloadButton = getPdfFeedbackDownloadButton();
    var openButton = getPdfFeedbackOpenButton();
    var details = options || {};
    if (!panel || !messageNode) {
      return;
    }
    panel.hidden = false;
    panel.classList.remove("is-error");
    panel.classList.remove("is-success");
    panel.classList.add(kind === "error" ? "is-error" : "is-success");
    panel.setAttribute("data-feedback-kind", kind === "error" ? "error" : "success");
    messageNode.textContent = String(message || "");
    if (codeNode) {
      var diagnosticCode = String(details.code || "").trim();
      codeNode.textContent = diagnosticCode ? "Diagnostic code: " + diagnosticCode : "";
      codeNode.hidden = !diagnosticCode;
    }
    if (retryButton) {
      retryButton.hidden = !details.showRetry;
      retryButton.disabled = false;
      retryButton.removeAttribute("aria-disabled");
    }
    if (downloadButton) {
      downloadButton.hidden = !details.showDownload;
      downloadButton.disabled = false;
      downloadButton.removeAttribute("aria-disabled");
    }
    if (openButton) {
      openButton.hidden = !details.showOpen;
      openButton.disabled = false;
      openButton.removeAttribute("aria-disabled");
    }
    if (actionsNode) {
      actionsNode.hidden = !(details.showRetry || details.showDownload || details.showOpen);
    }

    var hasActions = !!(details.showRetry || details.showDownload || details.showOpen);
    var dismissAfterMs = Number(details.dismissAfterMs || (kind === "error" || hasActions ? 12000 : 5000));
    if (dismissAfterMs > 0) {
      pdfExportController.feedbackDismissTimer = window.setTimeout(function () {
        clearPdfFeedback();
      }, dismissAfterMs);
    }
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

  function getPdfDownloadBlob(blob) {
    if (!blob || !isIosPdfDownloadDevice()) {
      return blob;
    }
    return new Blob([blob], { type: "application/octet-stream" });
  }

  function triggerAutomaticPdfDownload(blob, filename) {
    var anchor = getPdfDownloadAnchor();
    if (!anchor) {
      return false;
    }
    var objectUrl = createReadyPdfObjectUrl(getPdfDownloadBlob(blob));
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

  function getFeedbackPdfArtifact() {
    if (pdfExportController.feedbackArtifact && pdfExportController.feedbackArtifact.pdfBlob) {
      return pdfExportController.feedbackArtifact;
    }
    return getCurrentCompletedPdfArtifact(pdfExportController.lastTriggerButton || getDownloadButton() || getPrintButton());
  }

  function openReadyPdfInNewTab(artifact) {
    if (!artifact || !artifact.pdfBlob) {
      return false;
    }
    var objectUrl = createReadyPdfObjectUrl(artifact.pdfBlob);
    if (!objectUrl) {
      return false;
    }
    recordPdfInteractionDiagnostic("object-url-created", {
      action: "open",
      size: artifact.pdfBlob.size || 0
    });
    var openedTab = window.open(objectUrl, "_blank");
    if (!openedTab) {
      recordPdfInteractionDiagnostic("open-pdf-blocked", {});
      return false;
    }
    recordPdfInteractionDiagnostic("open-pdf-clicked", {});
    return true;
  }

  function showAutomaticDownloadFallback(artifact, options) {
    if (!artifact || !artifact.pdfBlob) {
      return;
    }
    pdfExportController.feedbackArtifact = artifact;
    showPdfFeedback(
      "success",
      String((options && options.message) || "Your PDF is ready. If the download did not start automatically, use the options below."),
      {
        showDownload: true,
        showOpen: true
      }
    );
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
    var embedKindClass = String(mapModel.embed_kind_class || mapModel.embed_kind || "").trim();
    shell.className = "pi-instruction-map-shell notranslate";
    if (embedKindClass) {
      shell.classList.add("pi-instruction-map-shell--" + embedKindClass);
    }
    shell.setAttribute("translate", "no");
    shell.setAttribute("data-guide-block-map", "");
    shell.setAttribute("data-guide-block-map-embed-url", mapModel.embed_url || "");
    shell.setAttribute("data-guide-block-map-kind", mapModel.embed_kind || "");
    shell.setAttribute("data-guide-block-map-external-url", mapModel.external_url || "");
    shell.setAttribute("data-guide-block-map-pdf-representation", mapModel.pdf_representation || "none");
    shell.setAttribute("data-guide-block-map-snapshot-image", mapModel.pdf_snapshot_image_url || "");
    shell.setAttribute("data-guide-block-map-open-url", mapModel.pdf_open_url || "");
    shell.setAttribute("data-guide-block-map-source-hash", mapModel.pdf_desired_source_hash || "");
    shell.setAttribute("data-guide-block-map-reason", mapModel.pdf_reason_code || "");
    shell.setAttribute("data-guide-block-map-custom-google", mapModel.is_custom_google_map ? "1" : "0");

    var iframe = document.createElement("iframe");
    iframe.className = "pi-instruction-map";
    iframe.src = mapModel.embed_url;
    iframe.loading = "lazy";
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
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

  // My Maps does not expose cooperative gesture handling, so gate pointer input at the iframe boundary.
  function supportsMyMapsCooperativeGestures() {
    if (!window.matchMedia) {
      return true;
    }
    return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  }

  function getMyMapsGestureModifierLabel() {
    var platform = "";
    if (navigator.userAgentData && navigator.userAgentData.platform) {
      platform = String(navigator.userAgentData.platform);
    } else {
      platform = String(navigator.platform || navigator.userAgent || "");
    }
    return /Mac|iPhone|iPad|iPod/i.test(platform) ? "⌘" : "Ctrl";
  }

  function getMyMapsGestureShells() {
    return Array.prototype.slice.call(document.querySelectorAll(MY_MAPS_COOPERATIVE_SELECTOR));
  }

  function getMyMapsGestureIframe(shell) {
    if (!shell) {
      return null;
    }
    return shell.querySelector("iframe.pi-map, iframe.pi-instruction-map");
  }

  function hideMyMapsGestureHint(shell) {
    var shield = shell && shell.querySelector("[data-my-maps-gesture-shield]");
    if (!shield) {
      return;
    }
    shield.setAttribute("data-hint-visible", "0");
    if (shell.__piMyMapsGestureHintTimer) {
      window.clearTimeout(shell.__piMyMapsGestureHintTimer);
      shell.__piMyMapsGestureHintTimer = 0;
    }
  }

  function showMyMapsGestureHint(shell) {
    var shield = shell && shell.querySelector("[data-my-maps-gesture-shield]");
    if (!shield || shell.classList.contains("pi-my-maps-interaction-active") || myMapsGestureModifierActive) {
      return;
    }
    shield.setAttribute("data-hint-visible", "1");
    if (shell.__piMyMapsGestureHintTimer) {
      window.clearTimeout(shell.__piMyMapsGestureHintTimer);
    }
    shell.__piMyMapsGestureHintTimer = window.setTimeout(function () {
      shield.setAttribute("data-hint-visible", "0");
      shell.__piMyMapsGestureHintTimer = 0;
    }, 1400);
  }

  function deactivateMyMapsPointerInteraction(shell) {
    if (!shell) {
      return;
    }
    shell.classList.remove("pi-my-maps-interaction-active");
    var iframe = getMyMapsGestureIframe(shell);
    if (iframe && document.activeElement === iframe && typeof iframe.blur === "function") {
      iframe.blur();
    }
  }

  function activateMyMapsPointerInteraction(shell) {
    if (!shell) {
      return;
    }
    hideMyMapsGestureHint(shell);
    shell.classList.add("pi-my-maps-interaction-active");
  }

  function setMyMapsGestureModifierState(active) {
    myMapsGestureModifierActive = !!active;
    getMyMapsGestureShells().forEach(function (shell) {
      if (!shell.classList.contains("pi-my-maps-cooperative-ready")) {
        return;
      }
      shell.classList.toggle("pi-my-maps-modifier-active", myMapsGestureModifierActive);
      if (myMapsGestureModifierActive) {
        hideMyMapsGestureHint(shell);
      }
    });
  }

  function enhanceMyMapsGestureShell(shell) {
    if (!shell || shell.getAttribute("data-my-maps-cooperative-ready") === "1") {
      return false;
    }
    var iframe = getMyMapsGestureIframe(shell);
    if (!iframe) {
      return false;
    }

    var modifierLabel = getMyMapsGestureModifierLabel();
    var shield = document.createElement("div");
    shield.className = "pi-my-maps-gesture-shield notranslate";
    shield.setAttribute("data-my-maps-gesture-shield", "");
    shield.setAttribute("data-hint-visible", "0");
    shield.setAttribute("translate", "no");
    shield.setAttribute("role", "button");
    shield.setAttribute("tabindex", "0");
    shield.setAttribute(
      "aria-label",
      "Google My Maps. Scroll normally to move the page. Use " + modifierLabel + " plus scroll to zoom the map. Click to interact with the map."
    );

    var hint = document.createElement("span");
    hint.className = "pi-my-maps-gesture-hint";
    hint.textContent = "Use " + modifierLabel + " + scroll to zoom the map";
    shield.appendChild(hint);

    shield.addEventListener("wheel", function () {
      showMyMapsGestureHint(shell);
    }, { passive: true });
    shield.addEventListener("click", function () {
      activateMyMapsPointerInteraction(shell);
      if (typeof iframe.focus === "function") {
        iframe.focus();
      }
    });
    shield.addEventListener("keydown", function (event) {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }
      event.preventDefault();
      activateMyMapsPointerInteraction(shell);
      if (typeof iframe.focus === "function") {
        iframe.focus();
      }
    });
    shell.addEventListener("mouseleave", function () {
      deactivateMyMapsPointerInteraction(shell);
    });

    shell.appendChild(shield);
    shell.classList.add("pi-my-maps-cooperative-ready");
    shell.classList.toggle("pi-my-maps-modifier-active", myMapsGestureModifierActive);
    shell.setAttribute("data-my-maps-cooperative-ready", "1");
    return true;
  }

  function resetMyMapsGestureInteraction() {
    setMyMapsGestureModifierState(false);
    getMyMapsGestureShells().forEach(function (shell) {
      deactivateMyMapsPointerInteraction(shell);
    });
  }

  function bindMyMapsGestureListeners() {
    if (myMapsGestureListenersBound) {
      return;
    }
    myMapsGestureListenersBound = true;

    document.addEventListener("keydown", function (event) {
      if (event.key === "Meta" || event.key === "Control" || event.metaKey || event.ctrlKey) {
        setMyMapsGestureModifierState(true);
      }
    }, true);
    document.addEventListener("keyup", function (event) {
      if ((event.key === "Meta" || event.key === "Control") && !event.metaKey && !event.ctrlKey) {
        setMyMapsGestureModifierState(false);
      }
    }, true);
    window.addEventListener("blur", function () {
      window.setTimeout(function () {
        var activeElement = document.activeElement;
        var activeShell = activeElement && activeElement.closest ? activeElement.closest(MY_MAPS_COOPERATIVE_SELECTOR) : null;
        if (activeElement && activeElement.tagName === "IFRAME" && activeShell) {
          return;
        }
        resetMyMapsGestureInteraction();
      }, 0);
    });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        resetMyMapsGestureInteraction();
      }
    });
  }

  function initializeMyMapsCooperativeGestures() {
    if (!supportsMyMapsCooperativeGestures()) {
      return;
    }
    var enhancedCount = 0;
    getMyMapsGestureShells().forEach(function (shell) {
      if (enhanceMyMapsGestureShell(shell)) {
        enhancedCount += 1;
      }
    });
    bindMyMapsGestureListeners();
    window.__propertyInstructionMyMapsGestureDiagnostics = {
      enabled: true,
      modifierLabel: getMyMapsGestureModifierLabel(),
      shellCount: getMyMapsGestureShells().length,
      enhancedCount: enhancedCount
    };
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
    var pageRoot = document.querySelector(".pi-page");
    var shell = document.querySelector(".pi-shell");
    var toolbar = document.querySelector("[data-guide-toolbar]");
    if (!shell || !toolbar) {
      return;
    }
    var toolbarRect = toolbar.getBoundingClientRect();
    var computedToolbarStyle = window.getComputedStyle(toolbar);
    var stickyTop = parseFloat(computedToolbarStyle.top || "0") || 0;
    var toolbarBottomOffset = Math.max(0, Math.ceil(stickyTop + toolbarRect.height));
    var bookmarkTopOffset = Math.max(0, Math.ceil(toolbarRect.bottom));
    shell.style.setProperty("--pi-toolbar-bottom-offset", toolbarBottomOffset + "px");
    if (pageRoot) {
      pageRoot.style.setProperty("--pi-bookmark-top-offset", bookmarkTopOffset + "px");
      pageRoot.style.setProperty("--pi-toast-top-offset", bookmarkTopOffset + "px");
    }
    window.__propertyInstructionStickyDiagnostics = window.__propertyInstructionStickyDiagnostics || {};
    window.__propertyInstructionStickyDiagnostics.toolbarBottomOffset = toolbarBottomOffset;
    window.__propertyInstructionStickyDiagnostics.bookmarkTopOffset = bookmarkTopOffset;
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
    window.addEventListener("scroll", scheduleStickyToolbarOffsetSync, { passive: true });
    scheduleStickyToolbarOffsetSync();
  }

  var GUIDE_THEME_STORAGE_KEY = "propms.propertyInstruction.theme";
  var guideThemeMediaQuery = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  var guideThemeSystemListenerBound = false;

  function getStoredGuideThemePreference() {
    try {
      var storedPreference = window.localStorage ? window.localStorage.getItem(GUIDE_THEME_STORAGE_KEY) : "";
      return storedPreference === "auto" || storedPreference === "light" || storedPreference === "dark"
        ? storedPreference
        : "auto";
    } catch (error) {
      return "auto";
    }
  }

  function persistGuideThemePreference(preference) {
    try {
      if (window.localStorage) {
        window.localStorage.setItem(GUIDE_THEME_STORAGE_KEY, preference);
      }
    } catch (error) {
      // Theme still applies for this page even when storage is unavailable.
    }
  }

  function getSystemGuideTheme() {
    return guideThemeMediaQuery && guideThemeMediaQuery.matches ? "dark" : "light";
  }

  function resolveGuideThemePreference(preference) {
    if (preference === "dark") {
      return "dark";
    }
    if (preference === "light") {
      return "light";
    }
    return getSystemGuideTheme();
  }

  function syncGuideDocumentThemeSurface() {
    var pageRoot = document.querySelector("[data-guide-root]");
    if (!pageRoot) {
      return;
    }
    var pageStyle = window.getComputedStyle(pageRoot);
    var backgroundColor = String(pageStyle.getPropertyValue("--pi-bg") || "").trim();
    var colorScheme = String(pageRoot.getAttribute("data-guide-theme") || "light") === "dark" ? "dark" : "light";
    [document.documentElement, document.body].forEach(function (node) {
      if (!node || !node.style) {
        return;
      }
      if (backgroundColor) {
        node.style.setProperty("background-color", backgroundColor);
      }
      node.style.setProperty("color-scheme", colorScheme);
    });
  }

  function syncPrintReadyDialogThemeVariables() {
    var pageRoot = document.querySelector("[data-guide-root]");
    var dialog = printGuideReadyDialog || document.querySelector("[data-guide-print-ready-dialog]");
    if (!pageRoot || !dialog) {
      return;
    }
    var pageStyle = window.getComputedStyle(pageRoot);
    [
      "--pi-card",
      "--pi-ink",
      "--pi-muted",
      "--pi-border",
      "--pi-accent",
      "--pi-accent-fill",
      "--pi-accent-contrast",
      "--pi-accent-soft"
    ].forEach(function (propertyName) {
      var propertyValue = String(pageStyle.getPropertyValue(propertyName) || "").trim();
      if (propertyValue) {
        dialog.style.setProperty(propertyName, propertyValue);
      }
    });
  }

  function syncGuideThemeToggle(preference, theme) {
    var toggle = document.querySelector("[data-guide-theme-toggle]");
    if (!toggle) {
      return;
    }
    var normalizedPreference = preference === "light" || preference === "dark" ? preference : "auto";
    var nextPreference = normalizedPreference === "auto"
      ? "light"
      : normalizedPreference === "light"
        ? "dark"
        : "auto";
    var currentLabel = normalizedPreference === "auto"
      ? "Auto (system " + theme + ")"
      : normalizedPreference.charAt(0).toUpperCase() + normalizedPreference.slice(1);
    var nextLabel = nextPreference === "auto"
      ? "auto mode"
      : nextPreference + " mode";
    var accessibleLabel = "Theme: " + currentLabel + ". Switch to " + nextLabel;
    toggle.setAttribute("data-guide-theme-preference", normalizedPreference);
    toggle.removeAttribute("aria-pressed");
    toggle.setAttribute("aria-label", accessibleLabel);
    toggle.setAttribute("title", accessibleLabel);
    var labelNode = toggle.querySelector("[data-guide-theme-toggle-label]");
    if (labelNode) {
      labelNode.textContent = accessibleLabel;
    }
  }

  function applyGuideThemePreference(preference, options) {
    var pageRoot = document.querySelector("[data-guide-root]");
    if (!pageRoot) {
      return;
    }
    var normalizedPreference = preference === "light" || preference === "dark" ? preference : "auto";
    var resolvedTheme = resolveGuideThemePreference(normalizedPreference);
    var persist = !!(options && options.persist);
    var source = String(options && options.source || (normalizedPreference === "auto" ? "system" : "manual"));
    pageRoot.setAttribute("data-guide-theme", resolvedTheme);
    pageRoot.setAttribute("data-guide-theme-preference", normalizedPreference);
    pageRoot.setAttribute("data-guide-theme-source", source);
    syncGuideThemeToggle(normalizedPreference, resolvedTheme);
    syncGuideDocumentThemeSurface();
    syncPrintReadyDialogThemeVariables();
    if (persist) {
      persistGuideThemePreference(normalizedPreference);
    }
    window.__propertyInstructionTheme = {
      theme: resolvedTheme,
      preference: normalizedPreference,
      source: source
    };
    scheduleStickyToolbarOffsetSync();
  }

  function initializeGuideTheme() {
    var storedPreference = getStoredGuideThemePreference();
    applyGuideThemePreference(storedPreference, {
      source: storedPreference === "auto" ? "system" : "stored"
    });
    if (!guideThemeMediaQuery || guideThemeSystemListenerBound) {
      return;
    }
    guideThemeSystemListenerBound = true;
    var handleSystemThemeChange = function () {
      var pageRoot = document.querySelector("[data-guide-root]");
      var currentPreference = pageRoot
        ? String(pageRoot.getAttribute("data-guide-theme-preference") || "auto")
        : getStoredGuideThemePreference();
      if (currentPreference !== "auto") {
        return;
      }
      applyGuideThemePreference("auto", { source: "system" });
    };
    if (guideThemeMediaQuery.addEventListener) {
      guideThemeMediaQuery.addEventListener("change", handleSystemThemeChange);
    } else if (guideThemeMediaQuery.addListener) {
      guideThemeMediaQuery.addListener(handleSystemThemeChange);
    }
  }

  function toggleGuideTheme() {
    var pageRoot = document.querySelector("[data-guide-root]");
    var currentPreference = pageRoot
      ? String(pageRoot.getAttribute("data-guide-theme-preference") || "auto")
      : getStoredGuideThemePreference();
    var nextPreference = currentPreference === "auto"
      ? "light"
      : currentPreference === "light"
        ? "dark"
        : "auto";
    applyGuideThemePreference(nextPreference, {
      persist: true,
      source: "manual"
    });
  }

  function getStickyGapPx() {
    var shell = document.querySelector(".pi-shell");
    var gapValue = shell ? window.getComputedStyle(shell).getPropertyValue("--pi-sticky-gap") : "";
    return parseFloat(gapValue || "0") || 0;
  }

  function getGuideActivationY() {
    var firstSection = document.querySelector("[data-guide-section]");
    if (firstSection) {
      var sectionScrollMarginTop = parseFloat(window.getComputedStyle(firstSection).scrollMarginTop || "0") || 0;
      if (sectionScrollMarginTop > 0) {
        return sectionScrollMarginTop + 1;
      }
    }
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
    var sectionNodes = Array.prototype.slice.call(document.querySelectorAll(
      "[data-guide-summary-section], [data-guide-section]"
    ));
    var navLinks = Array.prototype.slice.call(document.querySelectorAll(
      "[data-guide-bookmarks] a[href^='#']"
    ));
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

  function setPdfSemantic(node, elementType, role, options) {
    if (!node) {
      return node;
    }
    if (elementType) {
      node.setAttribute("data-pdf-element", elementType);
    }
    if (role) {
      node.setAttribute("data-pdf-role", role);
    }
    options = options || {};
    if (options.fontWeight != null) {
      node.setAttribute("data-pdf-font-weight", String(options.fontWeight));
    }
    if (options.fontStyle) {
      node.setAttribute("data-pdf-font-style", String(options.fontStyle));
    }
    if (options.linkHref) {
      node.setAttribute("data-pdf-link-href", String(options.linkHref));
    }
    if (options.qrValue) {
      node.setAttribute("data-pdf-qr-value", String(options.qrValue));
    }
    if (options.imageKind) {
      node.setAttribute("data-pdf-image-kind", String(options.imageKind));
    }
    if (options.badgeText) {
      node.setAttribute("data-pdf-badge-text", String(options.badgeText));
    }
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
      (
        absoluteUrl.pathname === PUBLIC_PDF_IMAGE_ENDPOINT ||
        absoluteUrl.pathname === PUBLIC_MAP_SNAPSHOT_IMAGE_ENDPOINT
      )
    ) {
      return absoluteUrl.toString();
    }

    var proxyUrl = new URL(PUBLIC_PDF_IMAGE_ENDPOINT, window.location.origin);
    proxyUrl.searchParams.set("url", absoluteUrl.toString());
    return proxyUrl.toString();
  }

  function normalizePdfMapRepresentation(value) {
    var normalized = String(value || "").trim().toLowerCase();
    if (normalized === "snapshot" || normalized === "qr" || normalized === "none") {
      return normalized;
    }
    return "none";
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
      if (item.type === "paragraph" || item.type === "heading") {
        collectStructuredInlineLinks(item.content || [], sourceNodeId, links, blockId);
      } else if (item.type === "list") {
        (item.items || []).forEach(function (listItem) {
          collectStructuredInlineLinks((listItem && listItem.content) || listItem || [], sourceNodeId, links, blockId);
        });
      } else if (item.type === "table") {
        (item.rows || []).forEach(function (row) {
          (row.cells || []).forEach(function (cell) {
            collectStructuredInlineLinks(cell.content || [], sourceNodeId, links, blockId);
          });
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
      getCurrentPdfLayoutVersion()
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

  function guideMutationChangesSemanticSnapshot() {
    if (!translationState.readySnapshot) {
      return true;
    }
    try {
      var currentSnapshot = captureSemanticSnapshot();
      if (snapshotsEqual(currentSnapshot, translationState.readySnapshot)) {
        updateTranslationDiagnostics({
          readySnapshotInvalidationReason: "non-semantic-change-ignored"
        });
        return false;
      }
    } catch (error) {
      return true;
    }
    return true;
  }

  function invalidatePreparedPdfArtifacts(reason) {
    translationState.preparationPromise = null;
    translationState.preparationKey = "";
    pdfPreparationState.preparedState = null;
    pdfPreparationState.warmupPromise = null;
    pdfPreparationState.artifactCache = {};
    clearReadyPdfObjectUrl();
    clearPrintGuideBlobUrl(reason || "manual-reset");
    clearPdfArtifactModeResult(reason || "manual-reset");
    resetPrintGuidePendingState();
    closePrintGuideReadyDialog("invalidated");
    window.__propertyInstructionLastPdfBlob = null;
    window.__propertyInstructionLastPdfLanguage = "";
  }

  function clearTranslationReadyState(reason) {
    translationState.readyLanguage = "";
    translationState.readySnapshot = null;
    translationState.sectionReadiness = {};
    translationState.stablePassTimestamps = [];
    translationState.stableGeneration = 0;
    translationState.readyAt = 0;
    invalidatePreparedPdfArtifacts(reason || "semantic-state-changed");
  }

  function resetTranslationGeneration(nextLanguage) {
    translationState.generation += 1;
    translationState.requestedLanguage = nextLanguage || SOURCE_LANGUAGE;
    translationState.lastLanguageSelectedAt = Date.now();
    clearTranslationReadyState("language-changed");
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
      syncTranslationLanguageState();
      if (!guideMutationChangesSemanticSnapshot()) {
        return;
      }
      var timestamp = Date.now();
      translationState.lastMutationAt = timestamp;
      if (!translationState.firstMutationAt) {
        translationState.firstMutationAt = timestamp;
      }
      translationState.mutationTimestamps.push(timestamp);
      translationState.mutationTimestamps = translationState.mutationTimestamps.slice(-120);
      translationState.readySnapshot = null;
      translationState.readyLanguage = "";
      invalidatePreparedPdfArtifacts("semantic-state-changed");
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

  function getStructuredStyleDescriptor(node) {
    if (!node || node.nodeType !== Node.ELEMENT_NODE) {
      return null;
    }
    var sourceStyle = node.style || {};
    var style = {};
    ["textAlign", "fontSize", "color", "fontWeight", "fontStyle", "textDecoration"].forEach(function (propertyName) {
      var value = String(sourceStyle[propertyName] || "").trim();
      if (value) {
        style[propertyName] = value;
      }
    });
    return Object.keys(style).length ? style : null;
  }

  function applyStructuredStyle(node, style) {
    if (!node || !style) {
      return node;
    }
    ["textAlign", "fontSize", "color", "fontWeight", "fontStyle", "textDecoration"].forEach(function (propertyName) {
      if (style[propertyName]) {
        node.style[propertyName] = style[propertyName];
      }
    });
    return node;
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
    var structuredStyle = getStructuredStyleDescriptor(node);
    if (tagName === "br") {
      return [{ type: "br" }];
    }

    if (tagName === "a") {
      var href = normalizeHref(node.getAttribute("href"));
      return [{
        type: "link",
        href: href,
        style: structuredStyle,
        content: extractStructuredInlineContentFromChildren(node)
      }];
    }

    if (tagName === "strong" || tagName === "b" || tagName === "em" || tagName === "i") {
      return [{
        type: tagName === "b" ? "strong" : tagName === "i" ? "em" : tagName,
        style: structuredStyle,
        content: extractStructuredInlineContentFromChildren(node)
      }];
    }

    var childContent = extractStructuredInlineContentFromChildren(node);
    if (structuredStyle && childContent.length) {
      return [{
        type: "span",
        style: structuredStyle,
        content: childContent
      }];
    }
    return childContent;
  }

  function extractStructuredInlineContentFromChildren(node) {
    var content = [];
    Array.prototype.slice.call(node.childNodes).forEach(function (childNode) {
      content = content.concat(extractStructuredInlineContent(childNode));
    });
    return content;
  }

  function extractStructuredTable(tableNode) {
    var rows = Array.prototype.slice.call(tableNode.querySelectorAll("tr")).map(function (rowNode) {
      return {
        cells: Array.prototype.slice.call(rowNode.children).filter(function (cellNode) {
          var cellTag = String(cellNode.tagName || "").toLowerCase();
          return cellTag === "td" || cellTag === "th";
        }).map(function (cellNode) {
          return {
            header: String(cellNode.tagName || "").toLowerCase() === "th",
            colspan: Math.max(1, Number(cellNode.getAttribute("colspan") || 1) || 1),
            rowspan: Math.max(1, Number(cellNode.getAttribute("rowspan") || 1) || 1),
            style: getStructuredStyleDescriptor(cellNode),
            content: extractStructuredInlineContentFromChildren(cellNode)
          };
        })
      };
    }).filter(function (row) {
      return row.cells.length;
    });
    return {
      type: "table",
      style: getStructuredStyleDescriptor(tableNode),
      rows: rows
    };
  }

  function extractStructuredContent(node) {
    if (!node) {
      return [];
    }
    var content = [];

    Array.prototype.slice.call(node.childNodes).forEach(function (childNode) {
      if (childNode.nodeType === Node.TEXT_NODE) {
        if (normalizeText(childNode.textContent || "")) {
          content.push({
            type: "paragraph",
            style: null,
            content: [{ type: "text", value: childNode.textContent || "" }]
          });
        }
        return;
      }

      if (childNode.nodeType !== Node.ELEMENT_NODE) {
        return;
      }

      var tagName = childNode.tagName.toLowerCase();
      var blockStyle = getStructuredStyleDescriptor(childNode);
      if (tagName === "p") {
        content.push({
          type: "paragraph",
          style: blockStyle,
          content: extractStructuredInlineContentFromChildren(childNode)
        });
        return;
      }
      if (/^h[1-3]$/.test(tagName)) {
        content.push({
          type: "heading",
          level: Number(tagName.slice(1)) || 1,
          style: blockStyle,
          content: extractStructuredInlineContentFromChildren(childNode)
        });
        return;
      }
      if (tagName === "table") {
        content.push(extractStructuredTable(childNode));
        return;
      }
      if (tagName === "ul" || tagName === "ol") {
        content.push({
          type: "list",
          ordered: tagName === "ol",
          style: blockStyle,
          items: Array.prototype.slice.call(childNode.children).filter(function (listChild) {
            return listChild.tagName && listChild.tagName.toLowerCase() === "li";
          }).map(function (listItem) {
            return {
              style: getStructuredStyleDescriptor(listItem),
              content: extractStructuredInlineContentFromChildren(listItem)
            };
          })
        });
        return;
      }
      if (tagName === "br" || tagName === "a") {
        content.push({
          type: "paragraph",
          style: blockStyle,
          content: extractStructuredInlineContent(childNode)
        });
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
    return (inlineContent || []).map(function (part) {
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
    return normalizeText((structuredContent || []).map(function (item) {
      if (item.type === "paragraph" || item.type === "heading") {
        return flattenStructuredInlineContent(item.content || []);
      }
      if (item.type === "list") {
        return (item.items || []).map(function (listItem) {
          return flattenStructuredInlineContent((listItem && listItem.content) || listItem || []);
        }).join("\n");
      }
      if (item.type === "table") {
        return (item.rows || []).map(function (row) {
          return (row.cells || []).map(function (cell) {
            return flattenStructuredInlineContent(cell.content || []);
          }).join(" ");
        }).join("\n");
      }
      return "";
    }).join("\n\n"));
  }

  function appendStructuredInlineContent(documentNode, parentNode, inlineContent) {
    (inlineContent || []).forEach(function (part) {
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
        applyStructuredStyle(link, part.style);
        appendStructuredInlineContent(documentNode, link, part.content || []);
        parentNode.appendChild(link);
        return;
      }
      if (part.type === "strong" || part.type === "em" || part.type === "span") {
        var inlineElement = documentNode.createElement(part.type === "span" ? "span" : part.type);
        applyStructuredStyle(inlineElement, part.style);
        appendStructuredInlineContent(documentNode, inlineElement, part.content || []);
        parentNode.appendChild(inlineElement);
      }
    });
  }

  function appendStructuredContent(documentNode, parentNode, structuredContent) {
    (structuredContent || []).forEach(function (item) {
      if (item.type === "paragraph" || item.type === "heading") {
        var blockTag = item.type === "heading" ? ("h" + Math.max(1, Math.min(3, Number(item.level || 1)))) : "p";
        var block = documentNode.createElement(blockTag);
        block.className = item.type === "heading" ? "pi-export-rich-heading pi-export-rich-heading--h" + Number(item.level || 1) : "pi-export-rich-paragraph";
        applyStructuredStyle(block, item.style);
        appendStructuredInlineContent(documentNode, block, item.content || []);
        parentNode.appendChild(block);
        return;
      }
      if (item.type === "list") {
        var list = documentNode.createElement(item.ordered ? "ol" : "ul");
        list.className = "pi-export-rich-list";
        applyStructuredStyle(list, item.style);
        (item.items || []).forEach(function (listItemEntry) {
          var listItem = documentNode.createElement("li");
          var listItemContent = listItemEntry && listItemEntry.content ? listItemEntry.content : listItemEntry;
          applyStructuredStyle(listItem, listItemEntry && listItemEntry.style);
          appendStructuredInlineContent(documentNode, listItem, listItemContent || []);
          list.appendChild(listItem);
        });
        parentNode.appendChild(list);
        return;
      }
      if (item.type === "table") {
        var table = documentNode.createElement("table");
        table.className = "pi-export-rich-table";
        applyStructuredStyle(table, item.style);
        var tableBody = documentNode.createElement("tbody");
        (item.rows || []).forEach(function (rowEntry) {
          var row = documentNode.createElement("tr");
          (rowEntry.cells || []).forEach(function (cellEntry) {
            var cell = documentNode.createElement(cellEntry.header ? "th" : "td");
            cell.colSpan = Math.max(1, Number(cellEntry.colspan || 1) || 1);
            cell.rowSpan = Math.max(1, Number(cellEntry.rowspan || 1) || 1);
            applyStructuredStyle(cell, cellEntry.style);
            var cellText = documentNode.createElement("div");
            cellText.className = "pi-export-rich-table-cell-text";
            appendStructuredInlineContent(documentNode, cellText, cellEntry.content || []);
            setPdfSemantic(cellText, "text-group", "rich-table-cell-text");
            cell.appendChild(cellText);
            setPdfSemantic(cell, "rect", "rich-table-cell");
            row.appendChild(cell);
          });
          tableBody.appendChild(row);
        });
        table.appendChild(tableBody);
        parentNode.appendChild(table);
      }
    });
  }

  function createManagedImage(documentNode, options, pendingImages) {
    var frame = documentNode.createElement("div");
    frame.className = options.frameClassName || "pi-export-image-frame";
    frame.setAttribute("data-export-image-frame", options.imageRole || "image");
    frame.setAttribute("data-export-image-role", options.imageRole || "image");
    var resolvedSourceUrl = options.placeholderOnly
      ? buildInlinePlaceholderImageDataUri(options.placeholderText || getGuideImageUnavailableText())
      : resolveExportImageUrl(options.src);
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
    if (options.placeholderOnly) {
      img.setAttribute("data-export-image-placeholder", "1");
    }
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

  function buildInlinePlaceholderImageDataUri(text) {
    var safeText = String(text || getGuideImageUnavailableText())
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    var svg = [
      '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400">',
      '<rect x="1" y="1" width="638" height="398" rx="18" ry="18" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="10 8"/>',
      '<text x="320" y="200" text-anchor="middle" dominant-baseline="middle" fill="#64748b" font-family="Inter, Arial, sans-serif" font-size="28">',
      safeText,
      '</text>',
      '</svg>'
    ].join("");
    return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
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
      var pendingImageData = (async function () {
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
      })();
      cache.set(url, pendingImageData);
      pendingImageData.catch(function () {
        if (cache.get(url) === pendingImageData) {
          cache.delete(url);
        }
      });
    }
    return cache.get(url);
  }

  async function getExportImageDataUriWithRetry(url, cache, maxAttempts) {
    var attempts = Math.max(1, Number(maxAttempts || 1));
    var lastError = null;
    for (var attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        return await getExportImageDataUri(url, cache);
      } catch (error) {
        lastError = error;
        if (cache && typeof cache.delete === "function") {
          cache.delete(url);
        }
        var reason = resolveMediaFailureReason(error);
        var retryableStatus = reason.status && reason.status >= 500;
        var retryableFailure = reason.code === "load-failed" || retryableStatus;
        if (attempt >= attempts || !retryableFailure) {
          break;
        }
        await sleep(120 * attempt);
      }
    }
    throw lastError || new Error("Unable to prepare PDF image.");
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

  function getExportMediaType(img) {
    var role = String(img && img.getAttribute ? img.getAttribute("data-export-image-role") || "image" : "image");
    if (role === "map") {
      return "map";
    }
    if (role === "qr") {
      return "qr";
    }
    if (role === "card" || role === "cover") {
      return "photo";
    }
    return "image";
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

  function getNodeInnerBounds(node) {
    if (!node || !node.getBoundingClientRect) {
      return null;
    }
    var rect = node.getBoundingClientRect();
    var styles = window.getComputedStyle(node);
    var borderLeft = parseFloat(styles.borderLeftWidth || "0") || 0;
    var borderRight = parseFloat(styles.borderRightWidth || "0") || 0;
    var borderTop = parseFloat(styles.borderTopWidth || "0") || 0;
    var borderBottom = parseFloat(styles.borderBottomWidth || "0") || 0;
    var paddingLeft = parseFloat(styles.paddingLeft || "0") || 0;
    var paddingRight = parseFloat(styles.paddingRight || "0") || 0;
    var paddingTop = parseFloat(styles.paddingTop || "0") || 0;
    var paddingBottom = parseFloat(styles.paddingBottom || "0") || 0;
    return {
      left: rect.left + borderLeft + paddingLeft,
      right: rect.right - borderRight - paddingRight,
      top: rect.top + borderTop + paddingTop,
      bottom: rect.bottom - borderBottom - paddingBottom,
      width: Math.max(0, rect.width - borderLeft - borderRight - paddingLeft - paddingRight),
      height: Math.max(0, rect.height - borderTop - borderBottom - paddingTop - paddingBottom),
      centerX: rect.left + (rect.width / 2),
      centerY: rect.top + (rect.height / 2)
    };
  }

  function isExportContainmentAncestorNode(node) {
    if (!node || !node.tagName) {
      return false;
    }
    var styles = window.getComputedStyle(node);
    var overflowX = String(styles.overflowX || styles.overflow || "visible").toLowerCase();
    var overflowY = String(styles.overflowY || styles.overflow || "visible").toLowerCase();
    var semanticRole = String(node.getAttribute("data-pdf-role") || "");
    return overflowX === "hidden" ||
      overflowX === "clip" ||
      overflowY === "hidden" ||
      overflowY === "clip" ||
      semanticRole === "overview-map-panel" ||
      node.classList.contains("pi-export-map") ||
      node.classList.contains("pi-export-card");
  }

  function getNearestExportContainmentInnerBounds(node, stopNode) {
    var currentNode = node;
    while (currentNode && currentNode !== stopNode && currentNode !== document.body) {
      currentNode = currentNode.parentElement;
      if (!currentNode) {
        break;
      }
      if (isExportContainmentAncestorNode(currentNode)) {
        return getNodeInnerBounds(currentNode);
      }
    }
    return null;
  }

  function applyExportImageSizing(exportRoot) {
    var diagnostics = [];
    var exportDocument = exportRoot && exportRoot.querySelector
      ? exportRoot.querySelector(".pi-export-document")
      : null;
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
      img.style.objectPosition = "center";

      var frameStyles = window.getComputedStyle(frame);
      var horizontalPadding = (parseFloat(frameStyles.paddingLeft || "0") || 0) + (parseFloat(frameStyles.paddingRight || "0") || 0);
      var availableWidth = Math.max(1, frame.clientWidth - horizontalPadding);
      var containmentInnerBounds = getNearestExportContainmentInnerBounds(frame, exportRoot);
      if (containmentInnerBounds && containmentInnerBounds.width > 0) {
        availableWidth = Math.min(availableWidth, Math.max(1, containmentInnerBounds.width));
      }
      var fitted = fitImageSize(
        img.naturalWidth,
        img.naturalHeight,
        availableWidth,
        getPdfImageMaxHeight(img)
      );
      var role = String(img.getAttribute("data-export-image-role") || "image");
      var cardNode = role === "card" ? img.closest(".pi-export-card") : null;
      var containingCardNode = img.closest(".pi-export-card");
      var chosenLayout = null;
      var mediaWidth = availableWidth;
      if (!containingCardNode && role === "cover") {
        var webFlowCoverWidth = Math.max(1, frame.getBoundingClientRect().width || availableWidth);
        var webFlowCoverFitted = fitImageSize(
          img.naturalWidth,
          img.naturalHeight,
          webFlowCoverWidth,
          300
        );
        frame.style.width = "100%";
        frame.style.height = webFlowCoverFitted.height + "px";
        frame.style.minHeight = "0";
        frame.style.maxHeight = "300px";
        frame.style.background = "transparent";
        img.style.width = webFlowCoverFitted.width + "px";
        img.style.height = webFlowCoverFitted.height + "px";
        img.style.maxWidth = "100%";
        img.style.maxHeight = "300px";
        img.style.objectFit = "contain";
        img.style.objectPosition = "center";
        diagnostics.push({
          image: summarizeDiagnosticImageSource(
            img.getAttribute("data-export-image-original-src") || img.currentSrc || img.src || "",
            role
          ),
          mediaType: getExportMediaType(img),
          fitPolicy: "contain",
          role: role,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          renderedWidth: webFlowCoverFitted.width,
          renderedHeight: webFlowCoverFitted.height,
          frameWidth: webFlowCoverWidth,
          frameHeight: webFlowCoverFitted.height,
          imageRatio: Number((img.naturalWidth / img.naturalHeight).toFixed(6)),
          framePolicy: "ratio-preserving",
          chosenLayout: "web-flow-cover"
        });
        return;
      }

      if (containingCardNode && role !== "qr") {
        var webFlowRow = containingCardNode.closest(".pi-export-row--web-flow");
        var webFlowFullWidth = !!(webFlowRow && webFlowRow.classList.contains("pi-export-row--full"));
        var webFlowThreeUp = !!(webFlowRow && webFlowRow.classList.contains("pi-export-row--three-up"));
        var webFlowMaxHeight = role === "map"
          ? (webFlowFullWidth ? 330 : 260)
          : (webFlowFullWidth ? 320 : (webFlowThreeUp ? 260 : 280));
        var webFlowFitted = fitImageSize(
          img.naturalWidth,
          img.naturalHeight,
          availableWidth,
          webFlowMaxHeight
        );
        frame.style.width = webFlowFitted.width + "px";
        frame.style.height = webFlowFitted.height + "px";
        frame.style.minHeight = "0";
        frame.style.maxHeight = webFlowMaxHeight + "px";
        frame.style.maxWidth = "100%";
        frame.style.marginInline = "auto";
        frame.style.background = "transparent";
        frame.style.aspectRatio = "";
        img.style.width = webFlowFitted.width + "px";
        img.style.height = webFlowFitted.height + "px";
        img.style.maxWidth = "100%";
        img.style.maxHeight = webFlowMaxHeight + "px";
        img.style.objectFit = "contain";
        img.style.objectPosition = "center";
        var webFlowMediaColumn = containingCardNode.querySelector(".pi-export-card-media");
        if (webFlowMediaColumn) {
          webFlowMediaColumn.style.width = "100%";
          webFlowMediaColumn.style.alignItems = "center";
          webFlowMediaColumn.style.justifyContent = "center";
        }
        containingCardNode.classList.remove("pi-export-card--portrait-side", "pi-export-card--landscape-stacked");
        containingCardNode.classList.add(
          img.naturalHeight > img.naturalWidth * PDF_PORTRAIT_RATIO_THRESHOLD
            ? "pi-export-card--web-flow-portrait"
            : "pi-export-card--web-flow-landscape"
        );
        diagnostics.push({
          image: summarizeDiagnosticImageSource(
            img.getAttribute("data-export-image-original-src") || img.currentSrc || img.src || "",
            role
          ),
          mediaType: getExportMediaType(img),
          fitPolicy: "contain",
          role: role,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          renderedWidth: webFlowFitted.width,
          renderedHeight: webFlowFitted.height,
          frameWidth: webFlowFitted.width,
          frameHeight: webFlowFitted.height,
          imageRatio: Number((img.naturalWidth / img.naturalHeight).toFixed(6)),
          framePolicy: "shrink-wrap-natural",
          chosenLayout: webFlowFullWidth ? "web-flow-full" : "web-flow-half"
        });
        return;
      }

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
      if (role === "qr") {
        var qrSize = Math.max(1, Math.round(Math.min(fitted.width, fitted.height)));
        frame.style.width = qrSize + "px";
        frame.style.height = qrSize + "px";
        frame.style.minHeight = qrSize + "px";
        frame.style.maxHeight = qrSize + "px";
        img.style.width = qrSize + "px";
        img.style.height = qrSize + "px";
        img.style.maxWidth = qrSize + "px";
        img.style.maxHeight = qrSize + "px";
      }
      if (role === "map") {
        frame.style.height = "auto";
        img.style.width = "100%";
        img.style.height = "auto";
        img.style.maxWidth = "100%";
        img.style.maxHeight = "none";
      }

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
          mapEmbedKind: mapNode ? String(mapNode.getAttribute("data-guide-block-map-kind") || "").trim() : "",
          mapExternalUrl: normalizeHref(mapNode && mapNode.getAttribute("data-guide-block-map-external-url")),
          mapPdfRepresentation: normalizePdfMapRepresentation(mapNode && mapNode.getAttribute("data-guide-block-map-pdf-representation")),
          mapSnapshotImageSrc: mapNode ? String(mapNode.getAttribute("data-guide-block-map-snapshot-image") || "").trim() : "",
          mapSnapshotSourceHash: mapNode ? String(mapNode.getAttribute("data-guide-block-map-source-hash") || "").trim() : "",
          mapOpenUrl: normalizeHref(mapNode && mapNode.getAttribute("data-guide-block-map-open-url")),
          mapPdfReasonCode: mapNode ? String(mapNode.getAttribute("data-guide-block-map-reason") || "").trim() : "",
          mapIsCustomGoogleMap: mapNode ? String(mapNode.getAttribute("data-guide-block-map-custom-google") || "") === "1" : false
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
    var coverNode = document.querySelector("[data-guide-cover]");
    var languageCode = getGuideLanguage();
    var emptyNode = document.querySelector("[data-guide-empty-state]");
    var guideKicker = document.querySelector("[data-guide-kicker]");
    var parkingSection = sections.find(function (sectionModel) {
      return sectionModel.anchor === "parking";
    });
    var parkingLink = getSectionGoogleMapsLink(parkingSection);
    var mapLinkHref = normalizeHref(mapLink && mapLink.getAttribute("href"));

    var guideLinks = [];
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
        var blockMapLinkIsPrimary = !!(
          blockModel.mapOpenUrl &&
          blockModel.linkHref &&
          normalizeHref(blockModel.mapOpenUrl) === normalizeHref(blockModel.linkHref)
        );
        if (blockModel.linkHref && !blockMapLinkIsPrimary) {
          guideLinks.push({
            href: blockModel.linkHref,
            label: blockModel.linkLabel || blockModel.linkHref,
            sourceNodeId: blockModel.id ? ("block:" + blockModel.id + ":link_label") : "",
            blockId: blockModel.id || "",
            kind: "block-link"
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
      contentsTitle: getGuideCopyText("in_this_guide", "In this guide"),
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
        imageSrc: "",
        embedUrl: mapCard ? String(mapCard.getAttribute("data-guide-map-embed-url") || "").trim() : "",
        embedKind: mapCard ? String(mapCard.getAttribute("data-guide-map-kind") || "").trim() : "",
        linkHref: mapLinkHref,
        linkLabel: getVisibleText(mapLink),
        pdfRepresentation: normalizePdfMapRepresentation(mapCard && mapCard.getAttribute("data-guide-map-pdf-representation")),
        snapshotImageSrc: mapCard ? String(mapCard.getAttribute("data-guide-map-snapshot-image") || "").trim() : "",
        snapshotSourceHash: mapCard ? String(mapCard.getAttribute("data-guide-map-source-hash") || "").trim() : "",
        openUrl: normalizeHref(mapCard && mapCard.getAttribute("data-guide-map-open-url")),
        pdfReasonCode: mapCard ? String(mapCard.getAttribute("data-guide-map-reason") || "").trim() : "",
        isCustomGoogleMap: mapCard ? String(mapCard.getAttribute("data-guide-map-custom-google") || "") === "1" : false
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
    setPdfSemantic(item, "rect", "meta-item");
    var label = documentNode.createElement("span");
    label.className = "pi-export-label";
    label.textContent = fieldData.label || "";
    setPdfSemantic(label, "text", "meta-label", { fontWeight: 600 });
    if (fieldData.labelNodeId) {
      label.setAttribute("data-export-source-id", fieldData.labelNodeId);
    }
    var value = documentNode.createElement("span");
    value.className = "pi-export-value";
    value.textContent = fieldData.value;
    setPdfSemantic(value, "text", "meta-value", { fontWeight: 600 });
    if (fieldData.valueNodeId) {
      value.setAttribute("data-export-source-id", fieldData.valueNodeId);
    }
    item.appendChild(label);
    item.appendChild(value);
    parentNode.appendChild(item);
  }

  function createPdfQrPanel(documentNode, titleText, qrEntries, panelClassName) {
    if (!qrEntries || !qrEntries.length) {
      return null;
    }
    var panel = documentNode.createElement("section");
    panel.className = panelClassName || "pi-export-qr-panel";
    setPdfSemantic(panel, "rect", panelClassName === "pi-export-card-qr-panel" ? "card-qr-panel" : "quick-access-panel");
    if (titleText !== "") {
      var title = documentNode.createElement("h2");
      title.className = "pi-export-panel-title";
      title.textContent = titleText || getGuideCopyText("quick_access", "Quick access");
      setPdfSemantic(title, "text", "panel-title", { fontWeight: 700 });
      panel.appendChild(title);
    }
    var list = documentNode.createElement("div");
    list.className = "pi-export-qr-grid";
    panel.appendChild(list);

    qrEntries.forEach(function (entry) {
      var card = documentNode.createElement("article");
      card.className = "pi-export-qr-card";
      setPdfSemantic(card, "rect", "qr-card");
      var copy = documentNode.createElement("div");
      copy.className = "pi-export-qr-copy";
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
        setPdfSemantic(link, "text", "qr-link", { linkHref: entry.linkHref, fontWeight: 600 });
        copy.appendChild(link);
      } else {
        var text = documentNode.createElement("p");
        text.className = "pi-export-qr-label";
        text.textContent = entry.label;
        setPdfSemantic(text, "text", "qr-label", { fontWeight: 600 });
        copy.appendChild(text);
      }
      if (entry.actionLabel && normalizeText(entry.actionLabel) !== normalizeText(entry.label)) {
        var action = documentNode.createElement("p");
        action.className = "pi-export-qr-action";
        action.textContent = entry.actionLabel;
        setPdfSemantic(action, "text", "qr-action", { fontWeight: 700 });
        copy.appendChild(action);
      }
      card.appendChild(copy);
      var qrNode = createManagedImage(documentNode, {
          src: entry.qrImageSrc,
          alt: entry.label || "",
          className: "pi-export-qr-image",
          frameClassName: "pi-export-image-frame pi-export-qr-frame",
          imageRole: "qr",
          placeholderClass: "pi-export-image-placeholder"
        }, []);
      setPdfSemantic(qrNode, "qr", "qr", { qrValue: entry.payload });
      card.appendChild(qrNode);
      list.appendChild(card);
    });

    return panel;
  }

  function createExportRoot() {
    var pageMetrics = getCurrentPdfPageMetrics();
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
    exportRoot.style.width = pageMetrics.widthPx + "px";
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
    exportDocument.setAttribute("data-pdf-layout-mode", "web-flow");
    exportDocument.style.width = PDF_EXPORT_CONTENT_WIDTH + "px";
    markExportNodeNotranslate(exportDocument);

    var header = document.createElement("header");
    header.className = "pi-export-header";
    header.setAttribute("data-pdf-section-anchor", "stay-info");

    var heroTop = document.createElement("div");
    heroTop.className = "pi-export-hero-top";

    var heroCopy = document.createElement("div");
    heroCopy.className = "pi-export-hero-copy";

    if (model.kicker) {
      var kicker = document.createElement("p");
      kicker.className = "pi-export-kicker";
      kicker.textContent = model.kicker;
      kicker.setAttribute("data-export-source-id", "guide:kicker");
      setPdfSemantic(kicker, "text", "property-kicker", { fontWeight: 700 });
      heroCopy.appendChild(kicker);
    }

    var title = document.createElement("h1");
    title.className = "pi-export-title";
    title.textContent = model.title;
    title.setAttribute("data-export-source-id", "field:title");
    setPdfSemantic(title, "text", "property-title", { fontWeight: 700 });
    heroCopy.appendChild(title);

    if (model.address && model.address.value) {
      var address = document.createElement("p");
      address.className = "pi-export-address";
      address.textContent = model.address.value;
      address.setAttribute("data-export-source-id", "field:address");
      setPdfSemantic(address, "text", "property-address", { fontWeight: 400 });
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
    if (model.quickAccessEntries && model.quickAccessEntries.length) {
      var wifiQrEntries = model.quickAccessEntries.filter(function (entry) {
        return entry && entry.kind === "wifi";
      });
      var wifiQrPanel = createPdfQrPanel(
        document,
        "",
        wifiQrEntries,
        "pi-export-wifi-qr-panel"
      );
      if (wifiQrPanel) {
        metaList.appendChild(wifiQrPanel);
      }
    }
    heroCopy.appendChild(metaList);

    heroTop.appendChild(heroCopy);

    if (model.coverImage && model.coverImage.src) {
      var heroMedia = document.createElement("div");
      heroMedia.className = "pi-export-hero-cover";
      var heroImage = createManagedImage(document, {
          src: model.coverImage.src,
          alt: model.coverImage.alt || model.title,
          className: "pi-export-cover",
          frameClassName: "pi-export-image-frame pi-export-cover-frame",
          imageRole: "cover",
          placeholderClass: "pi-export-image-placeholder",
          placeholderOnly: !!(model.coverImage && model.coverImage.mediaUnavailable),
          placeholderText: model.coverImage && model.coverImage.mediaUnavailable
            ? String((model.coverImage.mediaUnavailable || {}).placeholderText || getGuideImageUnavailableText())
            : ""
        }, pendingImages);
      setPdfSemantic(heroImage, "image", "cover-image", { imageKind: "photo" });
      heroMedia.appendChild(heroImage);
      heroTop.appendChild(heroMedia);
    }

    header.appendChild(heroTop);
    var webFlowInfoGrid = document.createElement("section");
    webFlowInfoGrid.className = "pi-export-info-grid";
    webFlowInfoGrid.appendChild(header);
    exportDocument.appendChild(webFlowInfoGrid);

    if (model.map.linkHref || model.map.imageSrc || (model.map.qrEntries && model.map.qrEntries.length)) {
      var mapSection = document.createElement("section");
      mapSection.className = "pi-export-map pi-export-map--" + String(model.map.mapAssetKind || "none").replace(/[^a-z0-9-]+/gi, "-");
      mapSection.setAttribute("data-pdf-map-representation", String(model.map.mapAssetKind || "none"));
      setPdfSemantic(mapSection, "rect", "overview-map-panel");
      if (model.map.title) {
        var mapTitle = document.createElement("h2");
        mapTitle.className = "pi-export-map-title";
        mapTitle.textContent = model.map.title;
        mapTitle.setAttribute("data-export-source-id", "map:title");
        setPdfSemantic(mapTitle, "text", "map-title", { fontWeight: 700 });
        mapSection.appendChild(mapTitle);
      }

      if (model.map.imageSrc) {
        var overviewMapImage = createManagedImage(document, {
            src: model.map.imageSrc,
            alt: model.map.title || "",
            className: "pi-export-map-image",
            frameClassName: "pi-export-image-frame pi-export-map-image-frame",
            imageRole: "map",
            placeholderClass: "pi-export-map-placeholder",
            placeholderOnly: !!(model.map && model.map.mediaUnavailable),
            placeholderText: model.map && model.map.mediaUnavailable
              ? String((model.map.mediaUnavailable || {}).placeholderText || getGuideImageUnavailableText())
              : ""
          }, pendingImages);
        setPdfSemantic(overviewMapImage, "image", "property-map", { imageKind: "map" });
        var overviewMapMedia = document.createElement("div");
        overviewMapMedia.className = "pi-export-map-media-slot";
        var overviewMapHref = normalizeHref(model.map.openUrl || model.map.linkHref || "");
        if (overviewMapHref) {
          var overviewMapLink = document.createElement("a");
          overviewMapLink.className = "pi-export-map-image-link";
          overviewMapLink.href = overviewMapHref;
          overviewMapLink.target = "_blank";
          overviewMapLink.rel = "noopener noreferrer nofollow";
          overviewMapLink.setAttribute("aria-label", model.map.linkLabel || "Open map");
          overviewMapLink.appendChild(overviewMapImage);
          overviewMapMedia.appendChild(overviewMapLink);
        } else {
          overviewMapMedia.appendChild(overviewMapImage);
        }
        mapSection.appendChild(overviewMapMedia);
      }

      if (model.map.qrEntries && model.map.qrEntries.length) {
        var mapQrPanel = createPdfQrPanel(
          document,
          "",
          model.map.qrEntries,
          "pi-export-map-qr-panel"
        );
        if (mapQrPanel) {
          var qrTitle = mapQrPanel.querySelector(".pi-export-panel-title");
          if (qrTitle && qrTitle.parentNode) {
            qrTitle.parentNode.removeChild(qrTitle);
          }
          mapSection.appendChild(mapQrPanel);
        }
      }

      var mapMeta = document.createElement("div");
      mapMeta.className = "pi-export-map-meta";

      if (model.map.linkHref && !(model.map.qrEntries && model.map.qrEntries.length)) {
        var mapLink = document.createElement("a");
        mapLink.href = model.map.linkHref;
        mapLink.target = "_blank";
        mapLink.rel = "noopener noreferrer nofollow";
        mapLink.textContent = model.map.linkLabel || model.map.linkHref;
        mapLink.setAttribute("data-export-source-id", "map:link_label");
        setPdfSemantic(mapLink, "text", "map-link", { linkHref: model.map.linkHref, fontWeight: 600 });
        mapMeta.appendChild(mapLink);
      }

      if (mapMeta.childNodes.length) {
        mapSection.appendChild(mapMeta);
      }

      webFlowInfoGrid.classList.add("pi-export-info-grid--has-map");
      webFlowInfoGrid.appendChild(mapSection);
    }

    model.sections.forEach(function (sectionModel) {
      var section = document.createElement("section");
      section.className = "pi-export-section";
      section.setAttribute("data-pdf-section-anchor", sectionModel.anchor || "");

      var sectionTitle = document.createElement("h2");
      sectionTitle.className = "pi-export-section-title";
      sectionTitle.textContent = sectionModel.title;
      sectionTitle.setAttribute("data-export-source-id", "section:" + sectionModel.anchor + ":title");
      setPdfSemantic(sectionTitle, "text", "section-title", { fontWeight: 700 });
      section.appendChild(sectionTitle);

      sectionModel.blocks.forEach(function (blockModel) {
        var card = document.createElement("article");
        card.className = "pi-export-card pi-export-card--" + String(blockModel.type || "text").toLowerCase().replace(/\s+/g, "-");
        card.setAttribute("data-pdf-section-item", "1");
        card.setAttribute("data-pdf-block-id", blockModel.id || "");
        card.setAttribute("data-pdf-block-type", blockModel.type || "Text");
        setPdfSemantic(card, "rect", "card-background");

        if (blockModel.type === "Warning") {
          card.classList.add("pi-export-card--warning");
        }
        if (blockModel.type === "Step") {
          card.classList.add("pi-export-card--step");
        }

        var cardLayout = document.createElement("div");
        cardLayout.className = "pi-export-card-layout";
        cardLayout.setAttribute("data-card-region", "layout");
        var textColumn = document.createElement("div");
        textColumn.className = "pi-export-card-text";
        textColumn.setAttribute("data-card-region", "text");
        var mediaColumn = document.createElement("div");
        mediaColumn.className = "pi-export-card-media";
        mediaColumn.setAttribute("data-card-region", "media");
        var bodyRegion = document.createElement("div");
        bodyRegion.className = "pi-export-card-body-region";
        bodyRegion.setAttribute("data-card-region", "body");
        var flexibleSpacer = document.createElement("div");
        flexibleSpacer.className = "pi-export-card-flex-spacer";
        flexibleSpacer.setAttribute("data-card-region", "spacer");
        flexibleSpacer.setAttribute("aria-hidden", "true");
        var footerRegion = document.createElement("div");
        footerRegion.className = "pi-export-card-footer-region";
        footerRegion.setAttribute("data-card-region", "footer");

        if (blockModel.stepNumber || blockModel.title) {
          var cardHead = document.createElement("div");
          cardHead.className = "pi-export-card-head";
          cardHead.setAttribute("data-card-region", "header");

          if (blockModel.stepNumber) {
            var badge = document.createElement("span");
            badge.className = "pi-export-step-badge";
            badge.setAttribute("data-card-region", "badge");
            setPdfSemantic(badge, "badge", "step-badge", {
              badgeText: blockModel.stepNumber,
              fontWeight: 700
            });
            var badgeText = document.createElement("span");
            badgeText.textContent = blockModel.stepNumber;
            setPdfSemantic(badgeText, "text", "step-badge-text", { fontWeight: 700 });
            badge.appendChild(badgeText);
            cardHead.appendChild(badge);
          }

          if (blockModel.title) {
            var cardTitle = document.createElement("h3");
            cardTitle.className = "pi-export-card-title";
            cardTitle.textContent = blockModel.title;
            cardTitle.setAttribute("data-export-source-id", "block:" + blockModel.id + ":title");
            setPdfSemantic(cardTitle, "text", "card-title", { fontWeight: 700 });
            cardHead.appendChild(cardTitle);
          }

          textColumn.appendChild(cardHead);
        }

        if (blockModel.body) {
          var body = document.createElement("div");
          body.className = "pi-export-card-body";
          body.setAttribute("data-export-source-id", "block:" + blockModel.id + ":body");
          setPdfSemantic(body, "text-group", "card-body");
          appendStructuredContent(document, body, blockModel.bodyContent || []);
          bodyRegion.appendChild(body);
        }

        if (blockModel.imageSrc || blockModel.mediaUnavailable) {
          var cardImage = createManagedImage(document, {
              src: blockModel.imageSrc,
              alt: blockModel.imageAlt || blockModel.title || sectionModel.title,
              className: "pi-export-card-image",
              frameClassName: "pi-export-image-frame pi-export-card-image-frame",
              imageRole: "card",
              placeholderClass: "pi-export-image-placeholder",
              placeholderOnly: !!blockModel.mediaUnavailable,
              placeholderText: blockModel.mediaUnavailable
                ? String((blockModel.mediaUnavailable || {}).placeholderText || getGuideImageUnavailableText())
                : ""
            }, pendingImages);
          setPdfSemantic(cardImage, "image", "card-image", { imageKind: "photo" });
          mediaColumn.appendChild(cardImage);
        }

        if (blockModel.mapImageSrc) {
          var blockMap = createManagedImage(document, {
              src: blockModel.mapImageSrc,
              alt: blockModel.title || sectionModel.title,
              className: "pi-export-map-image pi-export-map-image--block",
              frameClassName: "pi-export-image-frame pi-export-map-image-frame pi-export-map-image-frame--block",
              imageRole: "map",
              placeholderClass: "pi-export-map-placeholder",
              placeholderOnly: !!blockModel.mapMediaUnavailable,
              placeholderText: blockModel.mapMediaUnavailable
                ? String((blockModel.mapMediaUnavailable || {}).placeholderText || getGuideImageUnavailableText())
                : ""
            }, pendingImages);
          setPdfSemantic(blockMap, "image", "block-map", { imageKind: "map" });
          var blockMapHref = normalizeHref(blockModel.mapOpenUrl || blockModel.mapExternalUrl || "");
          if (blockMapHref) {
            var blockMapLink = document.createElement("a");
            blockMapLink.className = "pi-export-map-image-link pi-export-map-image-link--block";
            blockMapLink.href = blockMapHref;
            blockMapLink.target = "_blank";
            blockMapLink.rel = "noopener noreferrer nofollow";
            blockMapLink.setAttribute("aria-label", blockModel.linkLabel || "Open map");
            blockMapLink.appendChild(blockMap);
            mediaColumn.appendChild(blockMapLink);
          } else {
            mediaColumn.appendChild(blockMap);
          }
        }

        if (blockModel.caption) {
          var caption = document.createElement("p");
          caption.className = "pi-export-card-caption";
          caption.textContent = blockModel.caption;
          caption.setAttribute("data-export-source-id", "block:" + blockModel.id + ":caption");
          setPdfSemantic(caption, "text", "card-caption", { fontWeight: 400 });
          footerRegion.appendChild(caption);
        }

        var linkBelongsToQrMap = !!(
          blockModel.mapAssetKind === "qr" &&
          blockModel.mapOpenUrl &&
          blockModel.linkHref &&
          normalizeHref(blockModel.mapOpenUrl) === normalizeHref(blockModel.linkHref)
        );

        var linkRepresentedByWebFlowQr = !!(
          blockModel.linkHref &&
          (blockModel.qrEntries || []).some(function (entry) {
            return entry && entry.linkHref && normalizeHref(entry.linkHref) === normalizeHref(blockModel.linkHref);
          })
        );

        if (blockModel.linkHref && !linkBelongsToQrMap && !linkRepresentedByWebFlowQr) {
          var linkWrap = document.createElement("p");
          linkWrap.className = "pi-export-card-link";
          var link = document.createElement("a");
          link.href = blockModel.linkHref;
          link.target = "_blank";
          link.rel = "noopener noreferrer nofollow";
          link.textContent = blockModel.linkLabel || blockModel.linkHref;
          link.setAttribute("data-export-source-id", "block:" + blockModel.id + ":link_label");
          setPdfSemantic(link, "text", "card-link-label", {
            linkHref: blockModel.linkHref,
            fontWeight: 600
          });
          linkWrap.appendChild(link);
          setPdfSemantic(linkWrap, "text-group", "card-link");
          footerRegion.appendChild(linkWrap);
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
            footerRegion.appendChild(blockQrPanel);
          }
        }

        textColumn.appendChild(bodyRegion);
        textColumn.appendChild(flexibleSpacer);
        textColumn.appendChild(footerRegion);
        cardLayout.appendChild(textColumn);
        if (blockModel.imageSrc || blockModel.mapImageSrc) {
          cardLayout.appendChild(mediaColumn);
        }
        var webFlowCardQrPanel = footerRegion.querySelector(":scope > .pi-export-card-qr-panel");
        if (webFlowCardQrPanel) {
          cardLayout.appendChild(webFlowCardQrPanel);
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
      setPdfSemantic(empty, "text", "empty", { fontWeight: 400 });
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

    var backdrop = documentNode.createElement("div");
    backdrop.className = "pi-export-page-backdrop";
    setPdfSemantic(backdrop, "rect", "page-background");
    page.appendChild(backdrop);

    var viewport = documentNode.createElement("div");
    viewport.className = "pi-export-page-body";
    viewport.style.height = PDF_EXPORT_PAGE_BODY_HEIGHT + "px";
    markExportNodeNotranslate(viewport);

    var body = createExportDocumentShell(documentNode, sourceDocument);
    var sourceLayoutMode = sourceDocument.getAttribute("data-pdf-layout-mode");
    if (sourceLayoutMode) {
      body.setAttribute("data-pdf-layout-mode", sourceLayoutMode);
    }
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

  function collectPdfPageSummary(exportPages) {
    return Array.prototype.slice.call(exportPages.querySelectorAll(".pi-export-page")).map(function (pageNode, pageIndex) {
      var viewport = pageNode.querySelector(".pi-export-page-body");
      var body = viewport && viewport.querySelector(":scope > .pi-export-document");
      var usableHeight = viewport ? Number(viewport.clientHeight || 0) : 0;
      var occupiedHeight = body ? Math.min(usableHeight, body.getBoundingClientRect().height) : 0;
      var occupancy = usableHeight ? Math.max(0, Math.min(1, occupiedHeight / usableHeight)) : 0;
      return {
        pageNumber: pageIndex + 1,
        occupiedHeight: Number(occupiedHeight.toFixed(2)),
        usableHeight: usableHeight,
        remainingHeight: Number(Math.max(0, usableHeight - occupiedHeight).toFixed(2)),
        occupancy: Number(occupancy.toFixed(3)),
        sectionCount: pageNode.querySelectorAll(".pi-export-section").length,
        cardCount: pageNode.querySelectorAll(".pi-export-card").length,
        rowCount: pageNode.querySelectorAll(".pi-export-row--web-flow").length
      };
    });
  }

  function createSectionSlice(documentNode, titleNode, isContinuation) {
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
    if (isContinuation) {
      sectionTitle.classList.add("pi-export-section-title--continued");
      sectionTitle.removeAttribute("data-export-source-id");
      sectionTitle.textContent = [
        normalizeText(sectionTitle.textContent || ""),
        getGuideCopyText("continued_suffix", "continued")
      ].filter(Boolean).join(" \u2014 ");
    }
    section.appendChild(sectionTitle);

    var items = documentNode.createElement("div");
    items.className = "pi-export-section-items";
    section.appendChild(items);

    return {
      section: section,
      items: items
    };
  }

  function createWebFlowRow(documentNode, cards, fullWidth) {
    var row = documentNode.createElement("div");
    var rowKind = fullWidth
      ? "full"
      : (cards.length >= 3 ? "three-up" : (cards.length === 2 ? "two-up" : "full"));
    row.className = "pi-export-row pi-export-row--web-flow pi-export-row--" + rowKind;
    row.setAttribute("data-pdf-web-flow-row", rowKind);
    cards.forEach(function (cardNode) {
      if (cardNode) {
        row.appendChild(cardNode);
      }
    });
    return row;
  }

  function isWebFlowFullWidthCard(cardNode) {
    if (!cardNode) {
      return false;
    }
    var blockType = String(cardNode.getAttribute("data-pdf-block-type") || "").trim().toLowerCase();
    return blockType === "map" ||
      !!cardNode.querySelector(".pi-export-map-image--block") ||
      !!cardNode.querySelector(".pi-export-rich-table");
  }

  function applyWebFlowSectionRows(exportState) {
    if (!exportState || !exportState.exportDocument) {
      return null;
    }
    var summary = {
      layout: "web-flow",
      sectionCount: 0,
      rowCount: 0,
      threeUpRowCount: 0,
      pairedRowCount: 0,
      fullRowCount: 0,
      cardCount: 0
    };
    Array.prototype.slice.call(exportState.exportDocument.querySelectorAll(":scope > .pi-export-section")).forEach(function (sectionNode) {
      var titleNode = sectionNode.querySelector(":scope > .pi-export-section-title");
      var cards = Array.prototype.slice.call(sectionNode.querySelectorAll(":scope > .pi-export-card"));
      if (!cards.length) {
        return;
      }
      summary.sectionCount += 1;
      summary.cardCount += cards.length;
      var rows = [];
      var pending = [];
      function flushPending() {
        if (!pending.length) {
          return;
        }
        var fullWidth = pending.length === 1;
        var pendingCount = pending.length;
        rows.push(createWebFlowRow(sectionNode.ownerDocument, pending.slice(), fullWidth));
        summary.rowCount += 1;
        if (fullWidth) {
          summary.fullRowCount += 1;
        } else if (pendingCount >= 3) {
          summary.threeUpRowCount += 1;
        } else {
          summary.pairedRowCount += 1;
        }
        pending = [];
      }
      cards.forEach(function (cardNode) {
        cardNode.classList.add("pi-export-card--web-flow");
        if (!cardNode.querySelector(".pi-export-card-media img, .pi-export-card-media .pi-export-image-placeholder")) {
          cardNode.classList.add("pi-export-card--web-flow-text-only");
        }
        var spacer = cardNode.querySelector(".pi-export-card-flex-spacer");
        if (spacer) {
          spacer.style.display = "none";
        }
        if (isWebFlowFullWidthCard(cardNode)) {
          flushPending();
          rows.push(createWebFlowRow(sectionNode.ownerDocument, [cardNode], true));
          summary.rowCount += 1;
          summary.fullRowCount += 1;
          return;
        }
        pending.push(cardNode);
        if (pending.length === 3) {
          flushPending();
        }
      });
      flushPending();
      Array.prototype.slice.call(sectionNode.children).forEach(function (childNode) {
        if (childNode !== titleNode) {
          sectionNode.removeChild(childNode);
        }
      });
      rows.forEach(function (rowNode) {
        sectionNode.appendChild(rowNode);
      });
    });
    exportState.webFlowLayoutSummary = summary;
    exportState.exportDocument.setAttribute("data-pdf-layout-mode", "web-flow");
    return summary;
  }

  function getWebFlowRowComposition(rowNode) {
    var cards = rowNode ? Array.prototype.slice.call(rowNode.querySelectorAll(".pi-export-card--web-flow")) : [];
    var mediaCardCount = cards.filter(function (cardNode) {
      return !!cardNode.querySelector(".pi-export-card-image-frame, .pi-export-map-image-frame--block");
    }).length;
    var textOnlyCardCount = cards.filter(function (cardNode) {
      return cardNode.classList.contains("pi-export-card--web-flow-text-only");
    }).length;
    var hasRichTable = !!(rowNode && rowNode.querySelector(".pi-export-rich-table"));
    var mediaShare = cards.length ? mediaCardCount / cards.length : 0;
    return {
      cardCount: cards.length,
      mediaCardCount: mediaCardCount,
      textOnlyCardCount: textOnlyCardCount,
      mediaShare: mediaShare,
      hasRichTable: hasRichTable,
      kind: hasRichTable
        ? "rich-table"
        : (mediaShare >= 0.5 ? "media-heavy" : (mediaShare > 0 ? "mixed" : "text-heavy"))
    };
  }

  function getWebFlowRowGrowthProfile(rowNode, naturalHeight, isLastPage, rowCount) {
    var composition = getWebFlowRowComposition(rowNode);
    var growthRatio = 0.5;
    var absoluteGrowthCap = 180;
    if (composition.kind === "rich-table") {
      growthRatio = 0.14;
      absoluteGrowthCap = 72;
    } else if (composition.kind === "text-heavy") {
      growthRatio = isLastPage ? 0.24 : 0.32;
      absoluteGrowthCap = isLastPage ? 88 : 110;
    } else if (composition.kind === "mixed") {
      growthRatio = isLastPage ? 0.48 : 0.55;
      absoluteGrowthCap = isLastPage ? 190 : 220;
    } else if (composition.kind === "media-heavy") {
      growthRatio = isLastPage ? 0.78 : 0.62;
      absoluteGrowthCap = isLastPage ? 300 : 240;
    }
    if (rowCount === 1 && composition.kind === "media-heavy") {
      growthRatio = isLastPage ? 0.9 : 0.82;
      absoluteGrowthCap = isLastPage ? 320 : 420;
    } else if (rowCount === 1 && composition.kind === "mixed") {
      growthRatio = isLastPage ? 0.58 : 0.64;
      absoluteGrowthCap = isLastPage ? 220 : 260;
    }
    return {
      maxHeight: naturalHeight + Math.min(absoluteGrowthCap, naturalHeight * growthRatio),
      growthPolicy: composition.kind,
      composition: composition
    };
  }

  function webFlowRowContentFits(rowNode) {
    if (!rowNode) {
      return false;
    }
    return Array.prototype.slice.call(rowNode.querySelectorAll(".pi-export-card--web-flow")).every(function (cardNode) {
      var layoutNode = cardNode.querySelector(":scope > .pi-export-card-layout");
      var cardFits = cardNode.scrollHeight <= cardNode.clientHeight + 1;
      var layoutFits = !layoutNode || layoutNode.scrollHeight <= layoutNode.clientHeight + 1;
      return cardFits && layoutFits;
    });
  }


  function refitCompressedWebFlowRowMedia(rowNode) {
    var snapshots = [];
    if (!rowNode) {
      return snapshots;
    }
    Array.prototype.slice.call(rowNode.querySelectorAll("[data-export-image-frame]")).forEach(function (frame) {
      var img = frame.querySelector("img");
      if (!img || !img.naturalWidth || !img.naturalHeight || String(img.getAttribute("data-export-image-role") || "") === "qr") {
        return;
      }
      var frameRect = frame.getBoundingClientRect();
      if (frameRect.width <= 1 || frameRect.height <= 1) {
        return;
      }
      snapshots.push({
        frame: frame,
        img: img,
        frameStyle: frame.getAttribute("style"),
        imgStyle: img.getAttribute("style")
      });
      var fitted = fitImageSize(img.naturalWidth, img.naturalHeight, frameRect.width, frameRect.height);
      frame.style.width = fitted.width + "px";
      frame.style.height = fitted.height + "px";
      frame.style.maxWidth = "100%";
      frame.style.maxHeight = frameRect.height + "px";
      frame.style.marginInline = "auto";
      img.style.width = fitted.width + "px";
      img.style.height = fitted.height + "px";
      img.style.maxWidth = "100%";
      img.style.maxHeight = fitted.height + "px";
      img.style.objectFit = "contain";
      img.style.objectPosition = "center";
      var mediaColumn = frame.closest(".pi-export-card-media");
      if (mediaColumn) {
        mediaColumn.style.alignItems = "center";
        mediaColumn.style.justifyContent = "center";
      }
    });
    return snapshots;
  }

  function restoreCompressedWebFlowRowMedia(snapshots) {
    (snapshots || []).forEach(function (snapshot) {
      if (snapshot.frameStyle == null) {
        snapshot.frame.removeAttribute("style");
      } else {
        snapshot.frame.setAttribute("style", snapshot.frameStyle);
      }
      if (snapshot.imgStyle == null) {
        snapshot.img.removeAttribute("style");
      } else {
        snapshot.img.setAttribute("style", snapshot.imgStyle);
      }
    });
  }

  function tryCompressWebFlowRowIntoPage(pageState, slice, rowNode) {
    if (!pageState || !slice || !rowNode || !rowNode.parentNode) {
      return false;
    }
    var composition = getWebFlowRowComposition(rowNode);
    if (composition.hasRichTable || composition.mediaCardCount < 1) {
      return false;
    }
    var naturalHeight = rowNode.getBoundingClientRect().height;
    var originalHeight = rowNode.style.height;
    rowNode.parentNode.removeChild(rowNode);
    var baseHeight = pageState.body.getBoundingClientRect().height;
    var marginBottom = parseFloat(window.getComputedStyle(rowNode).marginBottom || "0") || 0;
    var compressionSafetyReserve = 24;
    var availableRowHeight = Math.max(0, Number(pageState.viewport.clientHeight || 0) - baseHeight - marginBottom - compressionSafetyReserve);
    slice.items.appendChild(rowNode);
    var minimumAllowedHeight = Math.max(260, naturalHeight * 0.7);
    if (availableRowHeight < minimumAllowedHeight || availableRowHeight >= naturalHeight - 1) {
      return false;
    }
    rowNode.style.height = Number(availableRowHeight.toFixed(2)) + "px";
    rowNode.setAttribute("data-pdf-web-flow-compressed", "1");
    var mediaSnapshots = refitCompressedWebFlowRowMedia(rowNode);
    var pageFits = !pageBodyOverflows(pageState);
    var contentFits = webFlowRowContentFits(rowNode);
    if (pageFits && contentFits) {
      return true;
    }
    restoreCompressedWebFlowRowMedia(mediaSnapshots);
    rowNode.style.height = originalHeight;
    rowNode.removeAttribute("data-pdf-web-flow-compressed");
    return false;
  }

  function balanceWebFlowPageRows(exportState) {
    if (!exportState || !exportState.exportPages) {
      return [];
    }
    var pageNodes = Array.prototype.slice.call(exportState.exportPages.querySelectorAll(".pi-export-page"));
    var diagnostics = [];
    pageNodes.forEach(function (pageNode, pageIndex) {
      var viewport = pageNode.querySelector(".pi-export-page-body");
      var body = viewport && viewport.querySelector(":scope > .pi-export-document");
      var rows = body ? Array.prototype.slice.call(body.querySelectorAll(".pi-export-row--web-flow")) : [];
      if (!viewport || !body || !rows.length) {
        return;
      }
      var naturalBodyHeight = body.getBoundingClientRect().height;
      var availableHeight = Number(viewport.clientHeight || 0);
      var bottomReserve = 14;
      var spareHeight = Math.max(0, availableHeight - naturalBodyHeight - bottomReserve);
      var isLastPage = pageIndex === pageNodes.length - 1;
      var rowSpecs = rows.map(function (rowNode) {
        var naturalHeight = rowNode.getBoundingClientRect().height;
        var profile = getWebFlowRowGrowthProfile(rowNode, naturalHeight, isLastPage, rows.length);
        return {
          node: rowNode,
          naturalHeight: naturalHeight,
          maxHeight: profile.maxHeight,
          growthPolicy: profile.growthPolicy,
          composition: profile.composition
        };
      });
      var totalGrowthCapacity = rowSpecs.reduce(function (total, spec) {
        return total + Math.max(0, spec.maxHeight - spec.naturalHeight);
      }, 0);
      var requestedGrowth = Math.min(spareHeight, totalGrowthCapacity);
      if (requestedGrowth > 1) {
        var low = Math.min.apply(Math, rowSpecs.map(function (spec) { return spec.naturalHeight; }));
        var high = Math.max.apply(Math, rowSpecs.map(function (spec) { return spec.maxHeight; }));
        for (var pass = 0; pass < 36; pass += 1) {
          var level = (low + high) / 2;
          var growthAtLevel = rowSpecs.reduce(function (total, spec) {
            var targetHeight = Math.min(spec.maxHeight, Math.max(spec.naturalHeight, level));
            return total + (targetHeight - spec.naturalHeight);
          }, 0);
          if (growthAtLevel < requestedGrowth) {
            low = level;
          } else {
            high = level;
          }
        }
        rowSpecs.forEach(function (spec) {
          var targetHeight = Math.min(spec.maxHeight, Math.max(spec.naturalHeight, high));
          spec.node.style.height = Number(targetHeight.toFixed(2)) + "px";
          spec.node.setAttribute("data-pdf-web-flow-filled", "1");
        });
      }
      var finalBodyHeight = body.getBoundingClientRect().height;
      diagnostics.push({
        pageNumber: pageIndex + 1,
        isLastPage: isLastPage,
        availableHeight: Number(availableHeight.toFixed(2)),
        naturalBodyHeight: Number(naturalBodyHeight.toFixed(2)),
        finalBodyHeight: Number(finalBodyHeight.toFixed(2)),
        spareBefore: Number(Math.max(0, availableHeight - naturalBodyHeight).toFixed(2)),
        spareAfter: Number(Math.max(0, availableHeight - finalBodyHeight).toFixed(2)),
        appliedGrowth: Number(Math.max(0, finalBodyHeight - naturalBodyHeight).toFixed(2)),
        rows: rowSpecs.map(function (spec) {
          return {
            naturalHeight: Number(spec.naturalHeight.toFixed(2)),
            finalHeight: Number(spec.node.getBoundingClientRect().height.toFixed(2)),
            maxHeight: Number(spec.maxHeight.toFixed(2)),
            growthPolicy: spec.growthPolicy || "media"
          };
        })
      });
    });
    exportState.webFlowPageFillSummary = diagnostics;
    return diagnostics;
  }

  function paginateWebFlowDocument(exportState) {
    var documentNode = exportState.exportDocument.ownerDocument;
    var childNodes = Array.from(exportState.exportDocument.children);
    var firstSectionIndex = childNodes.findIndex(function (childNode) {
      return childNode.classList && childNode.classList.contains("pi-export-section");
    });
    var preludeNodes = firstSectionIndex >= 0 ? childNodes.slice(0, firstSectionIndex) : childNodes.slice();
    var sectionNodes = firstSectionIndex >= 0 ? childNodes.slice(firstSectionIndex).filter(function (childNode) {
      return childNode.classList && childNode.classList.contains("pi-export-section");
    }) : [];
    var sourcePaginatableItemCount = exportState.exportDocument.querySelectorAll("[data-pdf-section-item='1']").length;
    var exportPages = documentNode.createElement("div");
    exportPages.className = "pi-export-pages pi-export-pages--web-flow";
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

    preludeNodes.forEach(appendStandaloneNode);

    sectionNodes.forEach(function (sectionNode) {
      var titleNode = sectionNode.querySelector(":scope > .pi-export-section-title");
      var rowNodes = Array.prototype.slice.call(sectionNode.querySelectorAll(":scope > .pi-export-row--web-flow"));
      var slice = createSectionSlice(documentNode, titleNode, false);
      pageState.body.appendChild(slice.section);
      if (pageBodyOverflows(pageState) && pageState.hasContent) {
        pageState.body.removeChild(slice.section);
        newPage();
        slice = createSectionSlice(documentNode, titleNode, false);
        pageState.body.appendChild(slice.section);
      }
      pageState.hasContent = true;

      rowNodes.forEach(function (rowNode, rowIndex) {
        slice.items.appendChild(rowNode);
        if (!pageBodyOverflows(pageState)) {
          return;
        }
        if (tryCompressWebFlowRowIntoPage(pageState, slice, rowNode)) {
          return;
        }
        slice.items.removeChild(rowNode);
        var emptySlice = !slice.items.children.length;
        if (emptySlice && slice.section.parentNode === pageState.body) {
          pageState.body.removeChild(slice.section);
        }
        if (emptySlice && !pageState.body.children.length) {
          pageState.body.appendChild(slice.section);
          slice.items.appendChild(rowNode);
          pageState.hasContent = true;
          return;
        }
        newPage();
        slice = createSectionSlice(documentNode, titleNode, rowIndex > 0);
        pageState.body.appendChild(slice.section);
        slice.items.appendChild(rowNode);
        pageState.hasContent = true;
      });
    });

    exportState.exportPages = exportPages;
    balanceWebFlowPageRows(exportState);
    exportState.webFlowLayoutSummary = Object.assign({}, exportState.webFlowLayoutSummary || {}, {
      pageFill: exportState.webFlowPageFillSummary || [],
      paginationPages: Array.prototype.slice.call(exportPages.querySelectorAll(".pi-export-page")).map(function (pageNode, pageIndex) {
        var bodyNode = pageNode.querySelector(".pi-export-page-body");
        return {
          pageNumber: pageIndex + 1,
          bodyClientHeight: bodyNode ? Number(bodyNode.clientHeight || 0) : 0,
          bodyScrollHeight: bodyNode ? Number(bodyNode.scrollHeight || 0) : 0,
          rows: Array.prototype.slice.call(pageNode.querySelectorAll(".pi-export-row--web-flow")).map(function (rowNode) {
            var rowRect = rowNode.getBoundingClientRect();
            return {
              kind: String(rowNode.getAttribute("data-pdf-web-flow-row") || ""),
              height: Number(rowRect.height.toFixed(2)),
              cards: rowNode.querySelectorAll(".pi-export-card").length
            };
          })
        };
      })
    });
    var paginatedItemCount = exportPages.querySelectorAll("[data-pdf-section-item='1']").length;
    if (sourcePaginatableItemCount !== paginatedItemCount) {
      throw new Error("PDF web-flow pagination dropped export content");
    }
    return exportState;
  }

  function getWebFlowBookmarkIcon(anchor) {
    var iconByAnchor = {
      "finding-the-property": "location",
      "check-in": "key",
      "parking": "car",
      "wifi": "wifi",
      "during-your-stay": "home",
      "rubbish": "trash",
      "house-rules": "clipboard-check",
      "check-out": "log-out",
      "emergency": "alert"
    };
    return iconByAnchor[String(anchor || "").trim().toLowerCase()] || "info";
  }

  function createWebFlowBookmarkRail(documentNode, model, activeAnchor) {
    var rail = documentNode.createElement("nav");
    rail.className = "pi-export-bookmark-rail";
    rail.setAttribute("data-pdf-web-flow-bookmarks", "1");
    var entries = [{ anchor: "stay-info", title: "Info", icon: "info" }].concat((model.contentsEntries || []).map(function (entry) {
      return {
        anchor: entry.anchor,
        title: entry.title || entry.anchor,
        icon: getWebFlowBookmarkIcon(entry.anchor)
      };
    }));
    rail.setAttribute("data-pdf-bookmark-count", String(entries.length));
    entries.forEach(function (entry) {
      var link = documentNode.createElement("a");
      link.className = "pi-export-bookmark-link";
      link.href = "#" + entry.anchor;
      link.setAttribute("data-pdf-internal-target", entry.anchor);
      link.setAttribute("data-pdf-bookmark-icon", entry.icon || "info");
      if (entry.anchor === activeAnchor) {
        link.classList.add("is-active");
        link.setAttribute("aria-current", "location");
      }
      var content = documentNode.createElement("span");
      content.className = "pi-export-bookmark-content";
      var label = documentNode.createElement("span");
      label.className = "pi-export-bookmark-label";
      label.textContent = entry.title;
      var badge = documentNode.createElement("span");
      badge.className = "pi-export-bookmark-badge";
      badge.setAttribute("data-pdf-bookmark-icon", entry.icon || "info");
      content.appendChild(label);
      content.appendChild(badge);
      link.appendChild(content);
      rail.appendChild(link);
    });
    return rail;
  }

  function decorateWebFlowPagesWithBookmarks(exportState) {
    if (!exportState || !exportState.exportPages) {
      return;
    }
    var model = exportState.model || {};
    Array.prototype.slice.call(exportState.exportPages.querySelectorAll(".pi-export-page")).forEach(function (pageNode) {
      var firstAnchorNode = pageNode.querySelector("[data-pdf-section-anchor]");
      var activeAnchor = firstAnchorNode
        ? String(firstAnchorNode.getAttribute("data-pdf-section-anchor") || "stay-info")
        : "stay-info";
      pageNode.setAttribute("data-pdf-active-section-anchor", activeAnchor);
      pageNode.appendChild(createWebFlowBookmarkRail(pageNode.ownerDocument, model, activeAnchor));
    });
  }

  function paginateExportDocument(exportState) {
    return paginateWebFlowDocument(exportState);
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
      setPdfSemantic(left, "text", "footer-left", { fontWeight: 400 });

      var right = document.createElement("span");
      right.className = "pi-export-footer-right";
      right.textContent = (index + 1) + " / " + pageNodes.length;
      markExportNodeNotranslate(right);
      setPdfSemantic(right, "text", "page-number", { fontWeight: 600 });

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
    await loadScriptOnce("propms-jspdf", JSPDF_LIBRARY_URL, function () {
      return !!(window.jspdf && typeof window.jspdf.jsPDF === "function");
    });
    if (!(window.jspdf && window.jspdf.jsPDF)) {
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

    function pushDescriptor(descriptor) {
      if (!descriptor || !descriptor.sourceUrl) {
        return;
      }
      var resolvedUrl = resolveExportImageUrl(descriptor.sourceUrl);
      if (!resolvedUrl) {
        return;
      }
      imageSources.push(Object.assign({}, descriptor, {
        resolvedUrl: resolvedUrl,
        sourceType: describeMediaSourceType(resolvedUrl)
      }));
    }

    if (model.coverImage && model.coverImage.src) {
      pushDescriptor({
        mediaRole: "cover-image",
        required: true,
        sourceUrl: model.coverImage.src,
        target: model.coverImage,
        targetKey: "coverImage"
      });
    }

    if (model.map && model.map.imageSrc) {
      pushDescriptor({
        mediaRole: "property-map",
        required: true,
        sourceUrl: model.map.imageSrc,
        target: model.map,
        targetKey: "imageSrc",
        customGoogleMap: !!model.map.isCustomGoogleMap,
        requestedRepresentation: model.map.pdfRepresentation || "none"
      });
    }

    (model.sections || []).forEach(function (sectionModel) {
      (sectionModel.blocks || []).forEach(function (blockModel) {
        if (blockModel.imageSrc) {
          pushDescriptor({
            mediaRole: "instruction-image",
            required: false,
            sourceUrl: blockModel.imageSrc,
            target: blockModel,
            targetKey: "imageSrc",
            sectionAnchor: sectionModel.anchor || "",
            sectionTitle: sectionModel.title || "",
            blockId: blockModel.id || "",
            blockTitle: blockModel.title || "",
            stepNumber: blockModel.stepNumber || ""
          });
        }
        if (blockModel.mapImageSrc) {
          pushDescriptor({
            mediaRole: "block-map",
            required: true,
            sourceUrl: blockModel.mapImageSrc,
            target: blockModel,
            targetKey: "mapImageSrc",
            customGoogleMap: !!blockModel.mapIsCustomGoogleMap,
            requestedRepresentation: blockModel.mapPdfRepresentation || "none",
            sectionAnchor: sectionModel.anchor || "",
            sectionTitle: sectionModel.title || "",
            blockId: blockModel.id || "",
            blockTitle: blockModel.title || "",
            stepNumber: blockModel.stepNumber || ""
          });
        }
      });
    });

    return imageSources;
  }

  function deepCloneModel(model) {
    return JSON.parse(JSON.stringify(model || {}));
  }

  async function prewarmImageDataCacheForModel(model, exportImageDataCache) {
    var imageSources = collectModelImageSources(model);
    var uniqueSources = {};
    var uniqueEntries = [];
    imageSources.forEach(function (descriptor, descriptorIndex) {
      if (!descriptor || !descriptor.resolvedUrl) {
        return;
      }
      var existingEntry = uniqueSources[descriptor.resolvedUrl];
      if (existingEntry) {
        existingEntry.required = existingEntry.required || !!descriptor.required;
        return;
      }
      var entry = {
        resolvedUrl: descriptor.resolvedUrl,
        required: !!descriptor.required,
        order: descriptorIndex
      };
      uniqueSources[descriptor.resolvedUrl] = entry;
      uniqueEntries.push(entry);
    });
    uniqueEntries.sort(function (leftEntry, rightEntry) {
      if (leftEntry.required !== rightEntry.required) {
        return leftEntry.required ? -1 : 1;
      }
      return leftEntry.order - rightEntry.order;
    });

    var fetchResults = {};
    var nextEntryIndex = 0;
    var prewarmConcurrency = Math.min(4, Math.max(1, uniqueEntries.length));
    async function prewarmWorker() {
      while (nextEntryIndex < uniqueEntries.length) {
        var entryIndex = nextEntryIndex;
        nextEntryIndex += 1;
        var entry = uniqueEntries[entryIndex];
        var resolvedUrl = entry.resolvedUrl;
        try {
          await getExportImageDataUriWithRetry(resolvedUrl, exportImageDataCache, 2);
          fetchResults[resolvedUrl] = {
            ok: true
          };
        } catch (error) {
          fetchResults[resolvedUrl] = {
            ok: false,
            error: error
          };
        }
      }
    }
    await Promise.all(Array.from({ length: prewarmConcurrency }, function () {
      return prewarmWorker();
    }));

    var optionalMediaWarnings = [];
    imageSources.forEach(function (descriptor) {
      var result = descriptor && descriptor.resolvedUrl ? fetchResults[descriptor.resolvedUrl] : null;
      if (!result || result.ok) {
        return;
      }
      var reason = resolveMediaFailureReason(result.error);
      var policy = resolveMediaFailurePolicy({
        mediaRole: descriptor.mediaRole,
        required: descriptor.required,
        sourceType: descriptor.sourceType
      });
      if (
        descriptor.customGoogleMap &&
        descriptor.requestedRepresentation === "snapshot" &&
        applyCustomGoogleMapQrFallback(descriptor, reason)
      ) {
        return;
      }
      if (policy.placeholderAllowed) {
        var warning = buildOptionalMediaWarning(descriptor, reason, policy);
        applyOptionalMediaFallback(descriptor, policy, warning);
        optionalMediaWarnings.push(warning);
        return;
      }
      throw buildRequiredMediaUnavailableError(descriptor, reason);
    });

    return {
      uniqueImageCount: uniqueEntries.length,
      requiredImageCount: uniqueEntries.filter(function (entry) {
        return entry.required;
      }).length,
      prewarmConcurrency: prewarmConcurrency,
      optionalMediaWarnings: trimWarningCollection(optionalMediaWarnings, 20)
    };
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

  function getPrintableQrActionLabel(kind, fallbackLabel) {
    var normalizedKind = String(kind || "").trim().toLowerCase();
    if (normalizedKind === "wifi") {
      return getGuideCopyText("scan_wifi", "Scan to connect to Wi-Fi");
    }
    if (normalizedKind.indexOf("map") !== -1 || normalizedKind === "parking-map") {
      return getGuideCopyText("scan_map", "Scan to open map");
    }
    return getGuideCopyText("scan_link", "Scan to open link");
  }

  function buildMainCustomMapQrEntries(model) {
    var mapModel = model && model.map ? model.map : null;
    if (!mapModel) {
      return [];
    }
    var mapUrl = normalizeHref(mapModel.openUrl || mapModel.linkHref || "");
    if (!mapUrl) {
      return [];
    }
    return [{
      kind: "property-map",
      label: mapModel.linkLabel || "Open in Google Maps",
      actionLabel: getPrintableQrActionLabel("property-map", "Scan to open map"),
      linkHref: mapUrl,
      sourceNodeId: "map:link_label",
      payload: mapUrl
    }];
  }

  function buildBlockCustomMapQrEntries(blockModel) {
    if (!blockModel) {
      return [];
    }
    var hasMap = !!(blockModel.mapEmbedUrl || blockModel.mapOpenUrl || blockModel.mapExternalUrl || blockModel.mapImageSrc);
    var mapUrl = normalizeHref(blockModel.mapOpenUrl || blockModel.mapExternalUrl || "");
    if (!hasMap || !mapUrl) {
      return [];
    }
    return [{
      kind: "block-map",
      label: blockModel.linkLabel || "Open in Google Maps",
      actionLabel: getPrintableQrActionLabel("block-map", "Scan to open map"),
      linkHref: mapUrl,
      sourceNodeId: blockModel.id ? ("block:" + blockModel.id + ":link_label") : "",
      blockId: blockModel.id || "",
      payload: mapUrl
    }];
  }

  function buildQuickAccessEntries(model) {
    var quickEntries = [];
    var remainingLinks = (model.guideLinks || []).slice();
    var wifiPayload = buildWifiQrPayload(model);
    if (wifiPayload) {
      quickEntries.push({
        kind: "wifi",
        label: getPrintableQrActionLabel("wifi", (model.wifiName && model.wifiName.label) || "Wi-Fi"),
        actionLabel: "",
        linkHref: "",
        sourceNodeId: (model.wifiName && model.wifiName.valueNodeId) || "",
        payload: wifiPayload
      });
    }

    return {
      quickAccessEntries: quickEntries,
      remainingLinkEntries: remainingLinks.map(function (entry) {
        return {
          kind: entry.kind,
          label: entry.label,
          actionLabel: getPrintableQrActionLabel(entry.kind, entry.label),
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
        var mapEntries = buildBlockCustomMapQrEntries(blockModel).map(function (entry) {
          return Object.assign({}, entry, {
            qrImageSrc: getOrCreateQrImageDataUri(entry.payload, qrImageCache)
          });
        });
        blockModel.qrEntries = mapEntries.concat((blockEntryMap[blockModel.id] || []).slice());
      });
    });
  }

  function deriveMapPdfFinalCode(target) {
    if (!target) {
      return "";
    }
    if (target.mapAssetKind === "snapshot") {
      return "snapshot-ready";
    }
    if (target.mapAssetKind === "qr" && target.pdfFinalCode) {
      return target.pdfFinalCode;
    }
    if (target.isCustomGoogleMap || target.mapIsCustomGoogleMap) {
      if (target.pdfReasonCode === "stale-hash") {
        return "snapshot-stale-qr-used";
      }
      if (target.pdfReasonCode === "missing-file" || target.pdfReasonCode === "wrong-owner") {
        return "snapshot-missing-qr-used";
      }
      return "qr-requested";
    }
    return "not-custom";
  }

  async function prepareGuideModelAssets(model, exportImageDataCache) {
    var preparedModel = deepCloneModel(model);
    var imageDiagnostics = null;
    var optionalMediaWarnings = [];
    var mapStartedAt = Date.now();
    var mapRenderPlan = {
      propertyMap: false,
      blockMapIds: []
    };
    var mapDiagnostics = {
      plan: mapRenderPlan,
      propertyMap: null,
      blockMaps: []
    };

    preparedModel.map.qrEntries = buildMainCustomMapQrEntries(preparedModel);
    preparedModel.map.finalPdfRepresentation = preparedModel.map.pdfRepresentation || "none";

    try {
      if (preparedModel.map.isCustomGoogleMap) {
        if (
          preparedModel.map.pdfRepresentation === "snapshot" &&
          preparedModel.map.snapshotImageSrc
        ) {
          preparedModel.map.imageSrc = preparedModel.map.snapshotImageSrc;
          preparedModel.map.mapAssetKind = "snapshot";
          preparedModel.map.finalPdfRepresentation = "snapshot";
        } else {
          preparedModel.map.imageSrc = "";
          preparedModel.map.mapAssetKind = "qr";
          preparedModel.map.finalPdfRepresentation = "qr";
          preparedModel.map.qrEntries = buildMainCustomMapQrEntries(preparedModel);
        }
      } else {
        preparedModel.map.imageSrc = "";
        preparedModel.map.mapAssetKind = "none";
        preparedModel.map.finalPdfRepresentation = "none";
      }
    } catch (error) {
      mapDiagnostics.propertyMap = {
        code: error && error.message ? error.message : "map-render-failed"
      };
    }

    for (var sectionIndex = 0; sectionIndex < preparedModel.sections.length; sectionIndex += 1) {
      var sectionModel = preparedModel.sections[sectionIndex];
      for (var blockIndex = 0; blockIndex < sectionModel.blocks.length; blockIndex += 1) {
        var blockModel = sectionModel.blocks[blockIndex];
        if (!blockModel.mapEmbedUrl && !blockModel.mapOpenUrl) {
          continue;
        }
        blockModel.qrEntries = buildBlockCustomMapQrEntries(blockModel);
        blockModel.finalPdfRepresentation = blockModel.mapPdfRepresentation || "none";
        if (blockModel.mapIsCustomGoogleMap) {
          if (
            blockModel.mapPdfRepresentation === "snapshot" &&
            blockModel.mapSnapshotImageSrc
          ) {
            blockModel.mapImageSrc = blockModel.mapSnapshotImageSrc;
            blockModel.mapAssetKind = "snapshot";
            blockModel.finalPdfRepresentation = "snapshot";
          } else {
            blockModel.mapImageSrc = "";
            blockModel.mapAssetKind = "qr";
            blockModel.finalPdfRepresentation = "qr";
            blockModel.qrEntries = buildBlockCustomMapQrEntries(blockModel);
          }
          mapDiagnostics.blockMaps.push({
            blockId: blockModel.id,
            requestedRepresentation: blockModel.mapPdfRepresentation || "none",
            finalRepresentation: blockModel.finalPdfRepresentation || "none",
            mapKind: blockModel.mapEmbedKind || "",
            sourceHash: blockModel.mapSnapshotSourceHash || "",
            code: deriveMapPdfFinalCode(blockModel)
          });
          continue;
        }
        blockModel.mapImageSrc = "";
        blockModel.mapAssetKind = "none";
        blockModel.finalPdfRepresentation = "none";
        mapDiagnostics.blockMaps.push({
          blockId: blockModel.id,
          requestedRepresentation: blockModel.mapPdfRepresentation || "none",
          finalRepresentation: "none",
          mapKind: blockModel.mapEmbedKind || "",
          sourceHash: blockModel.mapSnapshotSourceHash || "",
          code: deriveMapPdfFinalCode(blockModel)
        });
      }
    }

    if (!mapDiagnostics.propertyMap) {
      mapDiagnostics.propertyMap = {
        requestedRepresentation: preparedModel.map.pdfRepresentation || "none",
        finalRepresentation: preparedModel.map.finalPdfRepresentation || preparedModel.map.pdfRepresentation || "none",
        mapKind: preparedModel.map.embedKind || "",
        sourceHash: preparedModel.map.snapshotSourceHash || "",
        code: deriveMapPdfFinalCode(preparedModel.map)
      };
    }

    imageDiagnostics = await prewarmImageDataCacheForModel(preparedModel, exportImageDataCache);
    optionalMediaWarnings = Array.isArray(imageDiagnostics && imageDiagnostics.optionalMediaWarnings)
      ? imageDiagnostics.optionalMediaWarnings.slice()
      : [];
    mapDiagnostics.propertyMap = Object.assign({}, mapDiagnostics.propertyMap || {}, {
      requestedRepresentation: preparedModel.map.pdfRepresentation || "none",
      finalRepresentation: preparedModel.map.finalPdfRepresentation || preparedModel.map.pdfRepresentation || "none",
      mapKind: preparedModel.map.embedKind || "",
      sourceHash: preparedModel.map.snapshotSourceHash || "",
      imageLoadCode: preparedModel.map.imageLoadCode || "ok",
      code: deriveMapPdfFinalCode(preparedModel.map)
    });
    mapDiagnostics.blockMaps = (preparedModel.sections || []).reduce(function (entries, sectionModel) {
      (sectionModel.blocks || []).forEach(function (blockModel) {
        if (!blockModel.mapEmbedUrl && !blockModel.mapImageSrc && !blockModel.mapOpenUrl) {
          return;
        }
        entries.push({
          blockId: blockModel.id,
          requestedRepresentation: blockModel.mapPdfRepresentation || "none",
          finalRepresentation: blockModel.finalPdfRepresentation || blockModel.mapPdfRepresentation || "none",
          mapKind: blockModel.mapEmbedKind || "",
          sourceHash: blockModel.mapSnapshotSourceHash || "",
          imageLoadCode: blockModel.imageLoadCode || "ok",
          code: deriveMapPdfFinalCode(blockModel)
        });
      });
      return entries;
    }, []);

    var qrStartedAt = Date.now();
    var qrEntries = buildQuickAccessEntries(preparedModel);
    var needsQrLibrary =
      !!qrEntries.quickAccessEntries.length ||
      !!qrEntries.remainingLinkEntries.length ||
      !!((preparedModel.map.qrEntries || []).length) ||
      (preparedModel.sections || []).some(function (sectionModel) {
        return (sectionModel.blocks || []).some(function (blockModel) {
          return !!((blockModel.qrEntries || []).length);
        });
      });
    if (needsQrLibrary) {
      await ensureQrCodeLibrary();
    }
    preparedModel.quickAccessEntries = assignQrImagesToEntries(qrEntries.quickAccessEntries, pdfPreparationState.qrImageCache);
    preparedModel.map.qrEntries = assignQrImagesToEntries(preparedModel.map.qrEntries || [], pdfPreparationState.qrImageCache);
    attachBlockQrEntries(preparedModel, qrEntries.remainingLinkEntries, pdfPreparationState.qrImageCache);
    var qrDiagnostics = {
      quickAccessCount: preparedModel.quickAccessEntries.length,
      blockQrCount: qrEntries.remainingLinkEntries.length,
      propertyMapQrCount: (preparedModel.map.qrEntries || []).length
    };

    return {
      model: preparedModel,
      imageDiagnostics: imageDiagnostics,
      optionalMediaWarnings: optionalMediaWarnings,
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
      await ensurePdfLibrary();

      var currentSnapshot = captureSemanticSnapshot();
      if (!snapshotsEqual(currentSnapshot, snapshot)) {
        throw new Error("Guide translation changed before PDF rendering");
      }

      var model = extractGuideModel();
      var hasPrintableMapQr = !!(
        (model.map && normalizeHref(model.map.openUrl || model.map.linkHref || "")) ||
        (model.sections || []).some(function (sectionModel) {
          return (sectionModel.blocks || []).some(function (blockModel) {
            return !!normalizeHref(blockModel.mapOpenUrl || blockModel.mapExternalUrl || "");
          });
        })
      );
      if (buildWifiQrPayload(model) || (model.guideLinks || []).length || hasPrintableMapQr) {
        await ensureQrCodeLibrary();
      }
      var preparedAssets = await prepareGuideModelAssets(
        model,
        pdfPreparationState.imageDataCache
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
        imageWarmDiagnostics: preparedAssets.imageDiagnostics,
        optionalMediaWarnings: Array.isArray(preparedAssets.optionalMediaWarnings)
          ? preparedAssets.optionalMediaWarnings.slice()
          : []
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
        chosenLayout: cardNode.classList.contains("pi-export-card--web-flow-portrait")
          ? "web-flow-portrait"
          : "web-flow-landscape",
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

  function validateImageAspectRatios(exportRoot) {
    var diagnostics = [];
    Array.prototype.slice.call(exportRoot.querySelectorAll("img")).forEach(function (img) {
      var role = String(img.getAttribute("data-export-image-role") || "image");
      var mediaType = getExportMediaType(img);
      var fitPolicy = String(img.getAttribute("data-export-media-fit-policy") || (mediaType === "photo" ? "contain" : "contain"));
      var frameNode = img.closest("[data-export-image-frame]");
      var computedStyles = window.getComputedStyle(img);
      var rect = img.getBoundingClientRect();
      if (!img.naturalWidth || !img.naturalHeight || !rect.width || !rect.height) {
        throw new Error("One or more export images did not render with measurable dimensions.");
      }

      var naturalRatio = img.naturalWidth / img.naturalHeight;
      var renderedRatio = rect.width / rect.height;
      var ratioDifference = Math.abs(renderedRatio - naturalRatio) / naturalRatio;
      var diagnosticsEntry = {
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
        inlineWidth: String(img.style.width || ""),
        inlineHeight: String(img.style.height || ""),
        computedWidth: String(computedStyles.width || ""),
        computedHeight: String(computedStyles.height || ""),
        computedObjectFit: String(computedStyles.objectFit || ""),
        frameWidth: Number((frameNode && frameNode.getBoundingClientRect ? frameNode.getBoundingClientRect().width : 0).toFixed ? frameNode.getBoundingClientRect().width.toFixed(2) : 0),
        frameHeight: Number((frameNode && frameNode.getBoundingClientRect ? frameNode.getBoundingClientRect().height : 0).toFixed ? frameNode.getBoundingClientRect().height.toFixed(2) : 0),
        naturalRatio: Number(naturalRatio.toFixed(6)),
        paintedRatio: Number(renderedRatio.toFixed(6)),
        ratioErrorPercent: Number((ratioDifference * 100).toFixed(4)),
        role: role,
        mediaType: mediaType,
        fitPolicy: fitPolicy,
        distorted: ratioDifference > PDF_MEDIA_RATIO_BLOCKER
      };
      diagnostics.push(diagnosticsEntry);

      if (ratioDifference > PDF_EXPORT_IMAGE_RATIO_TOLERANCE) {
        window.__propertyInstructionLastPdfDiagnostics = Object.assign({}, window.__propertyInstructionLastPdfDiagnostics || {}, {
          imageRatioDiagnostics: diagnostics,
          failingImageRatioDiagnostic: diagnosticsEntry
        });
        throw new Error("Export image aspect ratio changed beyond tolerance");
      }
    });
    return diagnostics;
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

  async function ensureVectorPdfFontBase64(fontEntry) {
    if (!fontEntry || !fontEntry.url) {
      throw new Error("Vector PDF font unavailable");
    }
    if (vectorPdfFontState.base64ByUrl[fontEntry.url]) {
      return vectorPdfFontState.base64ByUrl[fontEntry.url];
    }
    vectorPdfFontState.base64ByUrl[fontEntry.url] = (async function () {
      var response = await fetch(fontEntry.url, {
        credentials: "same-origin",
        cache: "no-store"
      });
      if (!response.ok) {
        throw new Error("Vector PDF font unavailable");
      }
      var fontBlob = await response.blob();
      var dataUri = await blobToDataUri(fontBlob);
      var match = /^data:.*?;base64,(.*)$/.exec(String(dataUri || ""));
      if (!match || !match[1]) {
        throw new Error("Vector PDF font could not be encoded");
      }
      return match[1];
    })();
    return vectorPdfFontState.base64ByUrl[fontEntry.url];
  }

  function getVectorFontStyleForWeight(fontWeight) {
    var weight = Number(fontWeight || 400);
    if (weight >= 700) {
      return "bold";
    }
    if (weight >= 500 && weight < 600) {
      return "medium";
    }
    if (weight >= 600) {
      return "semibold";
    }
    return "normal";
  }

  function getVectorFontFamilyForText(text, direction) {
    return (/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFC]/.test(String(text || "")))
      ? VECTOR_PDF_FONT_FAMILY_ARABIC
      : VECTOR_PDF_FONT_FAMILY_LATIN;
  }

  function getPdfFontFace(fontWeight, text, direction) {
    return {
      family: getVectorFontFamilyForText(text, direction),
      style: getVectorFontStyleForWeight(fontWeight)
    };
  }

  async function ensureVectorPdfFontsRegistered(pdf) {
    if (!pdf || typeof pdf.addFileToVFS !== "function" || typeof pdf.addFont !== "function") {
      throw new Error("Vector PDF font APIs unavailable");
    }
    var documentId = String(pdf.__propmsVectorFontDocumentId || "");
    if (!documentId) {
      documentId = "vector-fonts-" + Date.now() + "-" + Math.random().toString(36).slice(2);
      pdf.__propmsVectorFontDocumentId = documentId;
    }
    if (!vectorPdfFontState.registeredDocuments[documentId]) {
      for (var fontIndex = 0; fontIndex < VECTOR_PDF_FONT_MANIFEST.length; fontIndex += 1) {
        var fontEntry = VECTOR_PDF_FONT_MANIFEST[fontIndex];
        var fontBase64 = await ensureVectorPdfFontBase64(fontEntry);
        pdf.addFileToVFS(fontEntry.file, fontBase64);
        if (fontEntry.family === VECTOR_PDF_FONT_FAMILY_ARABIC) {
          pdf.addFont(fontEntry.file, fontEntry.family, fontEntry.style, "Identity-H");
        } else {
          pdf.addFont(fontEntry.file, fontEntry.family, fontEntry.style);
        }
      }
      vectorPdfFontState.registeredDocuments[documentId] = true;
    }
    pdf.setFont(VECTOR_PDF_FONT_FAMILY_LATIN, "normal");
    return VECTOR_PDF_FONT_MANIFEST.map(function (entry) {
      return {
        file: entry.file,
        name: entry.family,
        style: entry.style,
        weight: entry.weight
      };
    });
  }

  function parseCssColorToRgba(colorValue) {
    var value = String(colorValue || "").trim();
    if (!value || value === "transparent") {
      return { r: 0, g: 0, b: 0, a: 0 };
    }
    var rgbaMatch = /^rgba?\(([^)]+)\)$/i.exec(value);
    if (rgbaMatch) {
      var parts = rgbaMatch[1].split(",").map(function (part) {
        return parseFloat(String(part).trim());
      });
      return {
        r: Math.max(0, Math.min(255, Math.round(parts[0] || 0))),
        g: Math.max(0, Math.min(255, Math.round(parts[1] || 0))),
        b: Math.max(0, Math.min(255, Math.round(parts[2] || 0))),
        a: parts.length > 3 ? Math.max(0, Math.min(1, Number(parts[3] || 0))) : 1
      };
    }
    var hexMatch = /^#([0-9a-f]{3,8})$/i.exec(value);
    if (hexMatch) {
      var hex = hexMatch[1];
      if (hex.length === 3) {
        return {
          r: parseInt(hex.charAt(0) + hex.charAt(0), 16),
          g: parseInt(hex.charAt(1) + hex.charAt(1), 16),
          b: parseInt(hex.charAt(2) + hex.charAt(2), 16),
          a: 1
        };
      }
      if (hex.length === 6 || hex.length === 8) {
        return {
          r: parseInt(hex.slice(0, 2), 16),
          g: parseInt(hex.slice(2, 4), 16),
          b: parseInt(hex.slice(4, 6), 16),
          a: hex.length === 8 ? Number((parseInt(hex.slice(6, 8), 16) / 255).toFixed(4)) : 1
        };
      }
    }
    return { r: 0, g: 0, b: 0, a: 1 };
  }

  function parseCssPixelValue(value) {
    return parseFloat(String(value || "0").replace("px", "")) || 0;
  }

  function getElementPaddingPx(styles) {
    return {
      top: parseCssPixelValue(styles.paddingTop),
      right: parseCssPixelValue(styles.paddingRight),
      bottom: parseCssPixelValue(styles.paddingBottom),
      left: parseCssPixelValue(styles.paddingLeft)
    };
  }

  function convertPaddingToPdfInsets(paddingPx, scaleMetrics) {
    return {
      top: Number((Number(paddingPx.top || 0) * scaleMetrics.scaleY).toFixed(2)),
      right: Number((Number(paddingPx.right || 0) * scaleMetrics.scaleX).toFixed(2)),
      bottom: Number((Number(paddingPx.bottom || 0) * scaleMetrics.scaleY).toFixed(2)),
      left: Number((Number(paddingPx.left || 0) * scaleMetrics.scaleX).toFixed(2))
    };
  }

  function getVectorFrameStyleDescriptor(node, scaleMetrics) {
    var styles = window.getComputedStyle(node);
    return {
      fill: parseCssColorToRgba(styles.backgroundColor),
      stroke: parseCssColorToRgba(styles.borderTopColor || styles.borderColor),
      strokeWidthPt: Number((parseCssPixelValue(styles.borderTopWidth || styles.borderWidth || "0") * Math.min(scaleMetrics.scaleX, scaleMetrics.scaleY)).toFixed(2)),
      radiusPt: Number((getDominantBorderRadius(styles) * Math.min(scaleMetrics.scaleX, scaleMetrics.scaleY)).toFixed(2)),
      paddingPt: convertPaddingToPdfInsets(getElementPaddingPx(styles), scaleMetrics)
    };
  }

  function getDominantBorderRadius(styles) {
    var radii = [
      parseFloat(styles.borderTopLeftRadius || "0") || 0,
      parseFloat(styles.borderTopRightRadius || "0") || 0,
      parseFloat(styles.borderBottomRightRadius || "0") || 0,
      parseFloat(styles.borderBottomLeftRadius || "0") || 0
    ].filter(function (value) {
      return value > 0;
    });
    return radii.length ? Math.min.apply(Math, radii) : 0;
  }

  function getPageScaleMetrics(pageNode, pdfWidth, pdfHeight) {
    var pageRect = pageNode.getBoundingClientRect();
    return {
      pageRect: pageRect,
      widthPt: pdfWidth,
      heightPt: pdfHeight,
      scaleX: pageRect.width ? (pdfWidth / pageRect.width) : 1,
      scaleY: pageRect.height ? (pdfHeight / pageRect.height) : 1
    };
  }

  function convertRectToPdfBounds(rect, pageRect, scaleMetrics) {
    return {
      x: Number(((rect.left - pageRect.left) * scaleMetrics.scaleX).toFixed(2)),
      y: Number(((rect.top - pageRect.top) * scaleMetrics.scaleY).toFixed(2)),
      width: Number((rect.width * scaleMetrics.scaleX).toFixed(2)),
      height: Number((rect.height * scaleMetrics.scaleY).toFixed(2))
    };
  }

  function isVectorContainmentAncestor(node, imageNode) {
    if (!node || node === imageNode || !node.tagName) {
      return false;
    }
    var styles = window.getComputedStyle(node);
    var overflowX = String(styles.overflowX || styles.overflow || "visible").toLowerCase();
    var overflowY = String(styles.overflowY || styles.overflow || "visible").toLowerCase();
    var semanticRole = String(node.getAttribute("data-pdf-role") || "");
    var exportFrameRole = !!node.getAttribute("data-export-image-frame");
    var semanticPanel =
      semanticRole === "overview-map-panel" ||
      node.classList.contains("pi-export-map") ||
      node.classList.contains("pi-export-card") ||
      node.classList.contains("pi-export-image-frame") ||
      node.classList.contains("pi-export-map-image-frame") ||
      node.classList.contains("pi-export-card-image-frame");
    var hasRoundedFrame = getDominantBorderRadius(styles) > 0.5;
    return overflowX === "hidden" ||
      overflowX === "clip" ||
      overflowY === "hidden" ||
      overflowY === "clip" ||
      exportFrameRole ||
      semanticPanel ||
      hasRoundedFrame;
  }

  function getVectorContainmentAncestorRole(node) {
    if (!node) {
      return "containment";
    }
    var semanticRole = String(node.getAttribute("data-pdf-role") || "").trim();
    if (semanticRole) {
      return semanticRole;
    }
    if (node.classList && node.classList.length) {
      return Array.prototype.slice.call(node.classList).join(".");
    }
    return String(node.tagName || "containment").toLowerCase();
  }

  function collectVectorContainmentAncestors(frameNode, imageNode, pageNode, pageRect, scaleMetrics) {
    var ancestors = [];
    var currentNode = frameNode;
    while (currentNode && currentNode !== pageNode && currentNode !== document.body) {
      currentNode = currentNode.parentElement;
      if (!currentNode || currentNode === pageNode) {
        break;
      }
      if (!isVisibleExportNode(currentNode) || !isVectorContainmentAncestor(currentNode, imageNode)) {
        continue;
      }
      var currentRect = currentNode.getBoundingClientRect();
      var currentInnerBounds = getNodeInnerBounds(currentNode) || currentRect;
      var currentStyles = window.getComputedStyle(currentNode);
      ancestors.push({
        role: getVectorContainmentAncestorRole(currentNode),
        bounds: convertRectToPdfBounds(currentRect, pageRect, scaleMetrics),
        innerBounds: convertRectToPdfBounds(currentInnerBounds, pageRect, scaleMetrics),
        radiusPt: Number((getDominantBorderRadius(currentStyles) * Math.min(scaleMetrics.scaleX, scaleMetrics.scaleY)).toFixed(2)),
        overflowX: String(currentStyles.overflowX || currentStyles.overflow || "visible").toLowerCase(),
        overflowY: String(currentStyles.overflowY || currentStyles.overflow || "visible").toLowerCase()
      });
    }
    return ancestors;
  }

  function getPdfBoundsRight(bounds) {
    return Number((Number(bounds && bounds.x || 0) + Number(bounds && bounds.width || 0)).toFixed(2));
  }

  function getPdfBoundsBottom(bounds) {
    return Number((Number(bounds && bounds.y || 0) + Number(bounds && bounds.height || 0)).toFixed(2));
  }

  function intersectPdfBounds(firstBounds, secondBounds) {
    if (!firstBounds) {
      return secondBounds || null;
    }
    if (!secondBounds) {
      return firstBounds || null;
    }
    var left = Math.max(Number(firstBounds.x || 0), Number(secondBounds.x || 0));
    var top = Math.max(Number(firstBounds.y || 0), Number(secondBounds.y || 0));
    var right = Math.min(getPdfBoundsRight(firstBounds), getPdfBoundsRight(secondBounds));
    var bottom = Math.min(getPdfBoundsBottom(firstBounds), getPdfBoundsBottom(secondBounds));
    if (right <= left || bottom <= top) {
      return null;
    }
    return {
      x: Number(left.toFixed(2)),
      y: Number(top.toFixed(2)),
      width: Number((right - left).toFixed(2)),
      height: Number((bottom - top).toFixed(2))
    };
  }

  function calculatePdfBoundsOverflow(innerBounds, outerBounds) {
    if (!innerBounds || !outerBounds) {
      return {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      };
    }
    return {
      top: Number(Math.max(0, Number(outerBounds.y || 0) - Number(innerBounds.y || 0)).toFixed(2)),
      right: Number(Math.max(0, getPdfBoundsRight(innerBounds) - getPdfBoundsRight(outerBounds)).toFixed(2)),
      bottom: Number(Math.max(0, getPdfBoundsBottom(innerBounds) - getPdfBoundsBottom(outerBounds)).toFixed(2)),
      left: Number(Math.max(0, Number(outerBounds.x || 0) - Number(innerBounds.x || 0)).toFixed(2))
    };
  }

  function calculatePdfOverflowMagnitude(overflow) {
    if (!overflow) {
      return 0;
    }
    return Math.max(
      Number(overflow.top || 0),
      Number(overflow.right || 0),
      Number(overflow.bottom || 0),
      Number(overflow.left || 0)
    );
  }

  function isVisibleExportNode(node) {
    if (!node || !node.getBoundingClientRect) {
      return false;
    }
    var rect = node.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function getVectorSemanticNodes(pageNode, type) {
    return Array.prototype.slice.call(pageNode.querySelectorAll("[data-pdf-element]")).filter(function (node) {
      return isVisibleExportNode(node) && (!type || String(node.getAttribute("data-pdf-element") || "") === type);
    });
  }

  function getSemanticDirection(node) {
    var directionNode = node.closest("[dir]");
    return String(directionNode ? directionNode.getAttribute("dir") : (node.getAttribute("dir") || "ltr")).toLowerCase() || "ltr";
  }

  function getVectorCharacterScriptClass(character) {
    var value = String(character || "");
    if (!value) {
      return "neutral";
    }
    if (/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFC]/.test(value)) {
      return "arabic";
    }
    if (/[A-Za-z]/.test(value)) {
      return "latin";
    }
    if (/[0-9]/.test(value)) {
      return "number";
    }
    if (/\s/.test(value)) {
      return "space";
    }
    if (/[:/@._+#%&?=~(),[\]{}<>!-]/.test(value)) {
      return "punctuation";
    }
    return "neutral";
  }

  function resolveVectorCharacterRunClass(lineCharacters, index, paragraphDirection) {
    var current = lineCharacters[index];
    var currentClass = getVectorCharacterScriptClass(current && current.character);
    if (currentClass === "arabic") {
      return "rtl";
    }
    if (currentClass === "latin" || currentClass === "number") {
      return "ltr";
    }
    var previousClass = null;
    var nextClass = null;
    for (var previousIndex = index - 1; previousIndex >= 0; previousIndex -= 1) {
      var candidatePreviousClass = getVectorCharacterScriptClass(lineCharacters[previousIndex].character);
      if (candidatePreviousClass === "space") {
        continue;
      }
      previousClass = candidatePreviousClass;
      break;
    }
    for (var nextIndex = index + 1; nextIndex < lineCharacters.length; nextIndex += 1) {
      var candidateNextClass = getVectorCharacterScriptClass(lineCharacters[nextIndex].character);
      if (candidateNextClass === "space") {
        continue;
      }
      nextClass = candidateNextClass;
      break;
    }
    if (currentClass === "punctuation" || currentClass === "space" || currentClass === "neutral") {
      var previousResolved = previousClass === "arabic"
        ? "rtl"
        : ((previousClass === "latin" || previousClass === "number") ? "ltr" : null);
      var nextResolved = nextClass === "arabic"
        ? "rtl"
        : ((nextClass === "latin" || nextClass === "number") ? "ltr" : null);
      if (previousResolved && nextResolved && previousResolved === nextResolved) {
        return previousResolved;
      }
      if (previousResolved && nextResolved && previousResolved !== nextResolved) {
        return "neutral";
      }
      if (previousResolved) {
        return previousResolved;
      }
      if (nextResolved) {
        return nextResolved;
      }
    }
    return paragraphDirection === "rtl" ? "rtl" : "ltr";
  }

  function getVectorNumericFontWeight(value) {
    var numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 0) {
      return numeric;
    }
    var normalized = String(value || "").trim().toLowerCase();
    if (normalized === "bold" || normalized === "bolder") {
      return 700;
    }
    return 400;
  }

  function isVectorEmojiCharacter(character) {
    var value = String(character || "");
    if (!value) {
      return false;
    }
    try {
      return /\p{Extended_Pictographic}/u.test(value);
    } catch (error) {
      return /[\u{1F000}-\u{1FAFF}\u2600-\u27BF]/u.test(value);
    }
  }

  function getVectorTextNodeStyle(textNode, styleCache) {
    var parentNode = textNode && textNode.parentElement ? textNode.parentElement : null;
    if (!parentNode) {
      return {
        fontWeight: 400,
        fontSizePx: 12,
        lineHeightPx: 15.6,
        color: { r: 0, g: 0, b: 0, a: 1 },
        fontStyle: "normal",
        link: "",
        key: "400|12|0,0,0,1|normal|"
      };
    }
    if (styleCache && styleCache.has(parentNode)) {
      return styleCache.get(parentNode);
    }
    var styles = window.getComputedStyle(parentNode);
    var fontSizePx = parseFloat(styles.fontSize || "0") || 12;
    var parsedLineHeight = parseFloat(styles.lineHeight || "0");
    var lineHeightPx = Number.isFinite(parsedLineHeight) && parsedLineHeight > 0 ? parsedLineHeight : fontSizePx * 1.3;
    var color = parseCssColorToRgba(styles.color);
    var fontWeight = getVectorNumericFontWeight(styles.fontWeight);
    var fontStyle = String(styles.fontStyle || "normal").toLowerCase();
    var linkNode = parentNode.closest ? parentNode.closest("a[href]") : null;
    var link = normalizeHref(linkNode && (linkNode.getAttribute("href") || linkNode.href || ""));
    var descriptor = {
      fontWeight: fontWeight,
      fontSizePx: fontSizePx,
      lineHeightPx: lineHeightPx,
      color: color,
      fontStyle: fontStyle,
      link: link,
      key: [
        fontWeight,
        Number(fontSizePx.toFixed(2)),
        color.r + "," + color.g + "," + color.b + "," + color.a,
        fontStyle,
        link
      ].join("|")
    };
    if (styleCache) {
      styleCache.set(parentNode, descriptor);
    }
    return descriptor;
  }

  function buildVectorLineCharacters(node, pageRect, scaleMetrics) {
    var documentNode = node.ownerDocument;
    var characters = [];
    if (!documentNode || !documentNode.createTreeWalker) {
      return characters;
    }
    var styleCache = typeof WeakMap === "function" ? new WeakMap() : null;
    var walker = documentNode.createTreeWalker(node, NodeFilter.SHOW_TEXT, {
      acceptNode: function (textNode) {
        if (!normalizeText(textNode.nodeValue || "").length) {
          return NodeFilter.FILTER_REJECT;
        }
        var parentElement = textNode.parentElement;
        var nearestSemantic = parentElement && parentElement.closest
          ? parentElement.closest("[data-pdf-element]")
          : null;
        if (nearestSemantic && nearestSemantic !== node) {
          var nearestType = String(nearestSemantic.getAttribute("data-pdf-element") || "");
          if (nearestType === "text" || nearestType === "text-group") {
            return NodeFilter.FILTER_REJECT;
          }
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var textNode;
    var logicalIndex = 0;
    while ((textNode = walker.nextNode())) {
      var value = String(textNode.nodeValue || "");
      var codeUnitOffset = 0;
      Array.from(value).forEach(function (character) {
        var codeUnitLength = character.length;
        if (character === "\n" || character === "\r") {
          codeUnitOffset += codeUnitLength;
          logicalIndex += 1;
          return;
        }
        var range = documentNode.createRange();
        range.setStart(textNode, codeUnitOffset);
        range.setEnd(textNode, codeUnitOffset + codeUnitLength);
        var rect = range.getBoundingClientRect();
        if ((!rect || (rect.width <= 0 && rect.height <= 0)) && typeof range.getClientRects === "function") {
          var rectList = Array.prototype.slice.call(range.getClientRects()).filter(function (candidateRect) {
            return candidateRect.width > 0 || candidateRect.height > 0;
          });
          rect = rectList.length ? rectList[0] : rect;
        }
        if (rect && (rect.width > 0 || rect.height > 0)) {
          characters.push({
            character: character,
            logicalIndex: logicalIndex,
            topKey: Math.round(rect.top),
            bounds: convertRectToPdfBounds(rect, pageRect, scaleMetrics),
            style: getVectorTextNodeStyle(textNode, styleCache),
            emoji: isVectorEmojiCharacter(character)
          });
        }
        if (range.detach) {
          range.detach();
        }
        codeUnitOffset += codeUnitLength;
        logicalIndex += 1;
      });
    }
    return characters;
  }

  function mergeVectorLineRuns(lineCharacters, paragraphDirection) {
    var runs = [];
    var currentRun = null;
    lineCharacters.forEach(function (characterRecord, characterIndex) {
      var runDirection = resolveVectorCharacterRunClass(lineCharacters, characterIndex, paragraphDirection);
      var style = characterRecord.style || {};
      if (characterRecord.emoji) {
        currentRun = null;
        runs.push({
          direction: runDirection,
          characters: [characterRecord],
          logicalText: characterRecord.character,
          kind: "emoji",
          style: style
        });
        return;
      }
      var previousCharacter = currentRun && currentRun.characters.length
        ? currentRun.characters[currentRun.characters.length - 1]
        : null;
      var physicalGap = 0;
      if (previousCharacter) {
        var previousRight = previousCharacter.bounds.x + previousCharacter.bounds.width;
        var currentRight = characterRecord.bounds.x + characterRecord.bounds.width;
        physicalGap = Math.max(0, Math.max(previousCharacter.bounds.x, characterRecord.bounds.x) - Math.min(previousRight, currentRight));
      }
      var gapSplitThreshold = previousCharacter
        ? Math.max(3.5, Math.min(previousCharacter.bounds.height, characterRecord.bounds.height) * 0.38)
        : Infinity;
      if (!currentRun || currentRun.direction !== runDirection || currentRun.styleKey !== style.key || physicalGap > gapSplitThreshold) {
        currentRun = {
          direction: runDirection,
          characters: [],
          logicalText: "",
          kind: "text",
          style: style,
          styleKey: style.key || ""
        };
        runs.push(currentRun);
      }
      currentRun.characters.push(characterRecord);
      currentRun.logicalText += characterRecord.character;
    });
    var measuredRuns = runs.map(function (run) {
      var bounds = run.characters.reduce(function (accumulator, characterRecord) {
        if (!accumulator) {
          return {
            x: characterRecord.bounds.x,
            y: characterRecord.bounds.y,
            right: characterRecord.bounds.x + characterRecord.bounds.width,
            bottom: characterRecord.bounds.y + characterRecord.bounds.height
          };
        }
        accumulator.x = Math.min(accumulator.x, characterRecord.bounds.x);
        accumulator.y = Math.min(accumulator.y, characterRecord.bounds.y);
        accumulator.right = Math.max(accumulator.right, characterRecord.bounds.x + characterRecord.bounds.width);
        accumulator.bottom = Math.max(accumulator.bottom, characterRecord.bounds.y + characterRecord.bounds.height);
        return accumulator;
      }, null);
      var style = run.style || {};
      return {
        logicalText: run.logicalText,
        direction: run.direction,
        script: run.direction === "rtl" ? "arabic" : (run.direction === "neutral" ? "neutral" : "latin"),
        kind: run.kind || "text",
        fontWeight: Number(style.fontWeight || 400),
        fontSizePx: Number(style.fontSizePx || 12),
        lineHeightPx: Number(style.lineHeightPx || 15.6),
        fontStyle: style.fontStyle || "normal",
        color: style.color || { r: 0, g: 0, b: 0, a: 1 },
        link: style.link || "",
        bounds: bounds ? {
          x: Number(bounds.x.toFixed(2)),
          y: Number(bounds.y.toFixed(2)),
          width: Number((bounds.right - bounds.x).toFixed(2)),
          height: Number((bounds.bottom - bounds.y).toFixed(2))
        } : null
      };
    }).filter(function (run) {
      return run.bounds && (run.kind === "emoji" || normalizeText(run.logicalText).length);
    });
    var spacedRuns = [];
    measuredRuns.forEach(function (run, runIndex) {
      if (runIndex > 0) {
        var previousRun = measuredRuns[runIndex - 1];
        var leftRun = previousRun.bounds.x <= run.bounds.x ? previousRun : run;
        var rightRun = previousRun.bounds.x <= run.bounds.x ? run : previousRun;
        var gapWidth = Number((rightRun.bounds.x - (leftRun.bounds.x + leftRun.bounds.width)).toFixed(2));
        if (gapWidth > 0.5) {
          spacedRuns.push({
            logicalText: " ",
            direction: "neutral",
            script: "neutral",
            kind: "text",
            fontWeight: previousRun.fontWeight,
            fontSizePx: previousRun.fontSizePx,
            lineHeightPx: previousRun.lineHeightPx,
            fontStyle: previousRun.fontStyle,
            color: previousRun.color,
            link: previousRun.link,
            bounds: {
              x: Number((leftRun.bounds.x + leftRun.bounds.width).toFixed(2)),
              y: Number(Math.min(previousRun.bounds.y, run.bounds.y).toFixed(2)),
              width: gapWidth,
              height: Number(Math.max(previousRun.bounds.height, run.bounds.height).toFixed(2))
            }
          });
        }
      }
      spacedRuns.push(run);
    });
    return spacedRuns;
  }

  function buildVectorTextElements(node, pageRect, scaleMetrics) {
    var styles = window.getComputedStyle(node);
    var rect = node.getBoundingClientRect();
    var fallbackColor = parseCssColorToRgba(styles.color);
    var fallbackFontSizePx = parseFloat(styles.fontSize || "0") || 12;
    var fallbackLineHeightPx = parseFloat(styles.lineHeight || "0") || (fallbackFontSizePx * 1.3);
    var fallbackFontWeight = Number(node.getAttribute("data-pdf-font-weight") || getVectorNumericFontWeight(styles.fontWeight) || 400) || 400;
    var direction = getSemanticDirection(node);
    var characters = buildVectorLineCharacters(node, pageRect, scaleMetrics);
    if (!characters.length) {
      return [];
    }
    var byTop = {};
    characters.forEach(function (characterRecord) {
      byTop[characterRecord.topKey] = byTop[characterRecord.topKey] || [];
      byTop[characterRecord.topKey].push(characterRecord);
    });
    return Object.keys(byTop).map(function (topKey) {
      var lineCharacters = byTop[topKey].slice().sort(function (firstCharacter, secondCharacter) {
        return firstCharacter.logicalIndex - secondCharacter.logicalIndex;
      });
      var lineRuns = mergeVectorLineRuns(lineCharacters, direction).map(function (run) {
        return Object.assign({}, run, {
          fontSizePt: Number((Number(run.fontSizePx || fallbackFontSizePx) * scaleMetrics.scaleY).toFixed(2)),
          lineHeightPt: Number((Number(run.lineHeightPx || fallbackLineHeightPx) * scaleMetrics.scaleY).toFixed(2))
        });
      });
      var maxFontSizePt = lineRuns.reduce(function (maximum, run) {
        return Math.max(maximum, Number(run.fontSizePt || 0));
      }, Number((fallbackFontSizePx * scaleMetrics.scaleY).toFixed(2)));
      var maxLineHeightPt = lineRuns.reduce(function (maximum, run) {
        return Math.max(maximum, Number(run.lineHeightPt || 0));
      }, Number((fallbackLineHeightPx * scaleMetrics.scaleY).toFixed(2)));
      return {
        type: "text-line",
        role: String(node.getAttribute("data-pdf-role") || "text"),
        sourceId: String(node.getAttribute("data-export-source-id") || ""),
        bounds: {
          x: Number((rect.left - pageRect.left).toFixed(2)) * scaleMetrics.scaleX,
          y: Math.min.apply(Math, lineCharacters.map(function (record) { return record.bounds.y; })),
          width: Number((rect.width * scaleMetrics.scaleX).toFixed(2)),
          height: maxLineHeightPt
        },
        logicalText: lineCharacters.map(function (characterRecord) { return characterRecord.character; }).join(""),
        fontWeight: fallbackFontWeight,
        fontSizePt: maxFontSizePt,
        lineHeightPt: maxLineHeightPt,
        color: fallbackColor,
        direction: direction,
        link: normalizeHref(node.getAttribute("data-pdf-link-href") || (node.tagName === "A" ? node.href : "")),
        runs: lineRuns
      };
    }).sort(function (a, b) {
      return a.bounds.y - b.bounds.y;
    });
  }

  function buildVectorRectElement(node, pageRect, scaleMetrics) {
    var styles = window.getComputedStyle(node);
    var rect = node.getBoundingClientRect();
    var fill = parseCssColorToRgba(styles.backgroundColor);
    var stroke = parseCssColorToRgba(styles.borderTopColor || styles.borderColor);
    var borderWidthPx = parseFloat(styles.borderTopWidth || styles.borderWidth || "0") || 0;
    return {
      type: "rect",
      role: String(node.getAttribute("data-pdf-role") || "shape"),
      bounds: convertRectToPdfBounds(rect, pageRect, scaleMetrics),
      radiusPt: Number((getDominantBorderRadius(styles) * Math.min(scaleMetrics.scaleX, scaleMetrics.scaleY)).toFixed(2)),
      fill: fill,
      stroke: stroke,
      strokeWidthPt: Number((borderWidthPx * Math.min(scaleMetrics.scaleX, scaleMetrics.scaleY)).toFixed(2))
    };
  }

  function buildVectorImageElement(node, pageRect, scaleMetrics, pageNode) {
    var img = node.tagName === "IMG" ? node : node.querySelector("img");
    if (!isVisibleExportNode(node) || !isVisibleExportNode(img)) {
      return null;
    }
    var frameRect = node.getBoundingClientRect();
    var frameInnerBounds = getNodeInnerBounds(node);
    var rect = img.getBoundingClientRect();
    var cardNode = node.closest(".pi-export-card");
    var containmentClipBounds = collectVectorContainmentAncestors(node, img, pageNode, pageRect, scaleMetrics);
    var source = String(img.getAttribute("data-export-image-resolved-src") || img.currentSrc || img.src || "");
    if (!source) {
      return null;
    }
    var frameStyles = getVectorFrameStyleDescriptor(node, scaleMetrics);
    var imageStyles = window.getComputedStyle(img);
    return {
      type: "image",
      role: String(node.getAttribute("data-pdf-role") || img.getAttribute("data-export-image-role") || "image"),
      bounds: convertRectToPdfBounds(rect, pageRect, scaleMetrics),
      imageBounds: convertRectToPdfBounds(rect, pageRect, scaleMetrics),
      frameBounds: convertRectToPdfBounds(frameRect, pageRect, scaleMetrics),
      frameInnerBounds: frameInnerBounds ? convertRectToPdfBounds(frameInnerBounds, pageRect, scaleMetrics) : convertRectToPdfBounds(frameRect, pageRect, scaleMetrics),
      cardBounds: cardNode ? convertRectToPdfBounds(cardNode.getBoundingClientRect(), pageRect, scaleMetrics) : null,
      cardInnerBounds: cardNode && getNodeInnerBounds(cardNode)
        ? convertRectToPdfBounds(getNodeInnerBounds(cardNode), pageRect, scaleMetrics)
        : null,
      containmentClipBounds: containmentClipBounds,
      pageBounds: {
        x: 0,
        y: 0,
        width: Number(scaleMetrics.widthPt.toFixed(2)),
        height: Number(scaleMetrics.heightPt.toFixed(2))
      },
      frameFill: frameStyles.fill,
      frameStroke: frameStyles.stroke,
      frameStrokeWidthPt: frameStyles.strokeWidthPt,
      frameRadiusPt: frameStyles.radiusPt,
      clipRadiusPt: Number((getDominantBorderRadius(imageStyles) * Math.min(scaleMetrics.scaleX, scaleMetrics.scaleY)).toFixed(2)),
      paddingPt: frameStyles.paddingPt,
      source: source,
      naturalWidth: Number(img.naturalWidth || 0),
      naturalHeight: Number(img.naturalHeight || 0),
      fit: String(img.getAttribute("data-export-media-fit-policy") || "contain"),
      objectPosition: String(img.style.objectPosition || imageStyles.objectPosition || "center"),
      imageKind: String(node.getAttribute("data-pdf-image-kind") || img.getAttribute("data-export-image-role") || "image")
    };
  }

  function buildVectorQrElement(node, pageRect, scaleMetrics) {
    var frameNode = node.querySelector(".pi-export-qr-frame") || node;
    if (!isVisibleExportNode(frameNode)) {
      return null;
    }
    return {
      type: "qr",
      role: String(node.getAttribute("data-pdf-role") || "qr"),
      bounds: convertRectToPdfBounds(frameNode.getBoundingClientRect(), pageRect, scaleMetrics),
      panelBounds: convertRectToPdfBounds(frameNode.getBoundingClientRect(), pageRect, scaleMetrics),
      qrBounds: convertRectToPdfBounds((frameNode.querySelector("img") || frameNode).getBoundingClientRect(), pageRect, scaleMetrics),
      panelFill: getVectorFrameStyleDescriptor(frameNode, scaleMetrics).fill,
      panelStroke: getVectorFrameStyleDescriptor(frameNode, scaleMetrics).stroke,
      panelStrokeWidthPt: getVectorFrameStyleDescriptor(frameNode, scaleMetrics).strokeWidthPt,
      panelRadiusPt: getVectorFrameStyleDescriptor(frameNode, scaleMetrics).radiusPt,
      value: String(node.getAttribute("data-pdf-qr-value") || ""),
      moduleBorder: PDF_QR_MODULE_BORDER
    };
  }

  function buildVectorLayoutModel(exportState, pdfWidth, pdfHeight) {
    var pageNodes = Array.prototype.slice.call(exportState.exportRoot.querySelectorAll("[data-pdf-page]"));
    return {
      version: 1,
      renderer: "vector",
      pageSize: {
        widthPt: Number(pdfWidth.toFixed(2)),
        heightPt: Number(pdfHeight.toFixed(2))
      },
      pages: pageNodes.map(function (pageNode, index) {
        var scaleMetrics = getPageScaleMetrics(pageNode, pdfWidth, pdfHeight);
        var pageRect = scaleMetrics.pageRect;
        var rectElements = getVectorSemanticNodes(pageNode, "rect").map(function (node) {
          return buildVectorRectElement(node, pageRect, scaleMetrics);
        });
        var imageElements = getVectorSemanticNodes(pageNode, "image").map(function (node) {
          return buildVectorImageElement(node, pageRect, scaleMetrics, pageNode);
        }).filter(Boolean);
        var qrElements = getVectorSemanticNodes(pageNode, "qr").map(function (node) {
          return buildVectorQrElement(node, pageRect, scaleMetrics);
        }).filter(Boolean);
        var badgeElements = getVectorSemanticNodes(pageNode, "badge").map(function (node) {
          return buildVectorRectElement(node, pageRect, scaleMetrics);
        });
        var textElements = []
          .concat(getVectorSemanticNodes(pageNode, "text"))
          .concat(getVectorSemanticNodes(pageNode, "text-group"))
          .reduce(function (all, node) {
            return all.concat(buildVectorTextElements(node, pageRect, scaleMetrics));
          }, []);
        return {
          index: index + 1,
          widthPt: Number(pdfWidth.toFixed(2)),
          heightPt: Number(pdfHeight.toFixed(2)),
          elements: rectElements.concat(badgeElements).concat(imageElements).concat(qrElements).concat(textElements)
        };
      })
    };
  }

  function applyPdfColor(pdf, color, kind) {
    if (!color || color.a <= 0) {
      return false;
    }
    if (kind === "fill") {
      pdf.setFillColor(color.r, color.g, color.b);
      return true;
    }
    pdf.setDrawColor(color.r, color.g, color.b);
    return true;
  }

  function getImageFormatFromDataUri(dataUri) {
    var match = /^data:image\/([a-z0-9+.-]+);/i.exec(String(dataUri || ""));
    if (!match) {
      return "PNG";
    }
    var format = String(match[1] || "").toLowerCase();
    return format === "jpg" || format === "jpeg" ? "JPEG" : "PNG";
  }

  function getVectorSymbolFallbackKind(character) {
    var value = String(character || "").replace(/\uFE0F/g, "");
    if (["📞", "☎", "📱"].indexOf(value) >= 0) {
      return "phone";
    }
    if (value === "🔔") {
      return "bell";
    }
    if (["✅", "✔", "☑"].indexOf(value) >= 0) {
      return "check";
    }
    if (["⚠", "❗", "❕"].indexOf(value) >= 0) {
      return "warning";
    }
    if (value === "📍") {
      return "location";
    }
    if (["🔑", "🗝"].indexOf(value) >= 0) {
      return "key";
    }
    return "unknown";
  }

  function drawVectorEmojiFallback(pdf, character, bounds, color) {
    if (!pdf || !bounds) {
      return;
    }
    var ink = color || { r: 0, g: 0, b: 0, a: 1 };
    var size = Math.max(5, Math.min(bounds.width, bounds.height) * 0.9);
    var x = bounds.x + Math.max(0, (bounds.width - size) / 2);
    var y = bounds.y + Math.max(0, (bounds.height - size) / 2);
    var cx = x + size / 2;
    var cy = y + size / 2;
    var kind = getVectorSymbolFallbackKind(character);
    pdf.setDrawColor(ink.r, ink.g, ink.b);
    pdf.setFillColor(ink.r, ink.g, ink.b);
    pdf.setLineWidth(Math.max(0.7, size * 0.085));
    if (typeof pdf.setLineCap === "function") {
      pdf.setLineCap("round");
    }
    if (typeof pdf.setLineJoin === "function") {
      pdf.setLineJoin("round");
    }

    if (kind === "phone") {
      pdf.setLineWidth(Math.max(1.05, size * 0.16));
      pdf.line(x + size * 0.34, y + size * 0.66, x + size * 0.66, y + size * 0.34);
      pdf.line(x + size * 0.20, y + size * 0.55, x + size * 0.35, y + size * 0.70);
      pdf.line(x + size * 0.65, y + size * 0.30, x + size * 0.80, y + size * 0.45);
      return;
    }

    if (kind === "bell") {
      pdf.circle(cx, y + size * 0.18, size * 0.045, "F");
      pdf.line(cx, y + size * 0.23, x + size * 0.35, y + size * 0.36);
      pdf.line(x + size * 0.35, y + size * 0.36, x + size * 0.29, y + size * 0.68);
      pdf.line(x + size * 0.29, y + size * 0.68, x + size * 0.71, y + size * 0.68);
      pdf.line(x + size * 0.71, y + size * 0.68, x + size * 0.65, y + size * 0.36);
      pdf.line(x + size * 0.65, y + size * 0.36, cx, y + size * 0.23);
      pdf.line(x + size * 0.25, y + size * 0.73, x + size * 0.75, y + size * 0.73);
      pdf.circle(cx, y + size * 0.82, size * 0.055, "F");
      return;
    }

    if (kind === "check") {
      pdf.line(x + size * 0.22, cy, x + size * 0.42, y + size * 0.70);
      pdf.line(x + size * 0.42, y + size * 0.70, x + size * 0.80, y + size * 0.28);
      return;
    }

    if (kind === "warning") {
      pdf.line(cx, y + size * 0.14, x + size * 0.16, y + size * 0.78);
      pdf.line(x + size * 0.16, y + size * 0.78, x + size * 0.84, y + size * 0.78);
      pdf.line(x + size * 0.84, y + size * 0.78, cx, y + size * 0.14);
      pdf.line(cx, y + size * 0.36, cx, y + size * 0.58);
      pdf.circle(cx, y + size * 0.68, size * 0.035, "F");
      return;
    }

    if (kind === "location") {
      pdf.circle(cx, y + size * 0.40, size * 0.20, "S");
      pdf.circle(cx, y + size * 0.40, size * 0.055, "F");
      pdf.line(x + size * 0.36, y + size * 0.54, cx, y + size * 0.82);
      pdf.line(x + size * 0.64, y + size * 0.54, cx, y + size * 0.82);
      return;
    }

    if (kind === "key") {
      pdf.circle(x + size * 0.34, cy, size * 0.16, "S");
      pdf.line(x + size * 0.50, cy, x + size * 0.82, cy);
      pdf.line(x + size * 0.69, cy, x + size * 0.69, y + size * 0.64);
      pdf.line(x + size * 0.78, cy, x + size * 0.78, y + size * 0.60);
      return;
    }

    pdf.circle(cx, cy, size * 0.31, "S");
    var fontFace = getPdfFontFace(700, "?", "ltr");
    pdf.setFont(fontFace.family, fontFace.style);
    pdf.setFontSize(Math.max(4, size * 0.48));
    pdf.setTextColor(ink.r, ink.g, ink.b);
    pdf.text("?", cx, cy, { align: "center", baseline: "middle" });
  }

  function drawVectorTextElement(pdf, element, diagnostics) {
    var defaultColor = element.color || { r: 0, g: 0, b: 0, a: 1 };
    var maxRight = element.bounds.x;
    var runHasOwnLink = false;
    (element.runs || []).forEach(function (run) {
      var runColor = run.color || defaultColor;
      if (run.kind === "emoji") {
        drawVectorEmojiFallback(pdf, String(run.logicalText || ""), run.bounds, runColor);
        if (run.link) {
          pdf.link(run.bounds.x, run.bounds.y, run.bounds.width, run.bounds.height, { url: run.link });
          runHasOwnLink = true;
        }
        maxRight = Math.max(maxRight, run.bounds.x + run.bounds.width);
        return;
      }
      var fontWeight = Number(run.fontWeight || element.fontWeight || 400);
      var fontFace = getPdfFontFace(fontWeight, run.logicalText, run.direction);
      var runText = String(run.logicalText || "");
      pdf.setFont(fontFace.family, fontFace.style);
      pdf.setFontSize(Number(run.fontSizePt || element.fontSizePt));
      pdf.setTextColor(runColor.r, runColor.g, runColor.b);
      if (typeof pdf.setR2L === "function") {
        pdf.setR2L(false);
      }
      if (fontFace.family === VECTOR_PDF_FONT_FAMILY_ARABIC && typeof pdf.processArabic === "function") {
        runText = pdf.processArabic(runText);
      }
      if (run.direction === "neutral" && normalizeText(runText).length === 0) {
        runText = " ";
      }
      var drawX = run.direction === "rtl" ? (run.bounds.x + run.bounds.width) : run.bounds.x;
      pdf.text(runText, drawX, run.bounds.y, {
        baseline: "top",
        align: run.direction === "rtl" ? "right" : "left"
      });
      if (run.link) {
        pdf.link(run.bounds.x, run.bounds.y, run.bounds.width, run.bounds.height, { url: run.link });
        runHasOwnLink = true;
      }
      maxRight = Math.max(maxRight, run.bounds.x + run.bounds.width);
    });
    if (element.link && !runHasOwnLink) {
      pdf.link(element.bounds.x, element.bounds.y, element.bounds.width, element.bounds.height, { url: element.link });
    }
    diagnostics.push({
      role: element.role,
      sourceId: element.sourceId,
      text: element.text,
      direction: element.direction,
      fontSizePt: element.fontSizePt,
      lineHeightPt: element.lineHeightPt,
      bounds: element.bounds,
      renderedLineCount: 1,
      fontWeight: element.fontWeight,
      logicalText: element.logicalText,
      runs: (element.runs || []).map(function (run) {
        return {
          logicalText: run.logicalText,
          direction: run.direction,
          script: run.script,
          kind: run.kind,
          fontWeight: run.fontWeight,
          fontSizePt: run.fontSizePt,
          color: run.color,
          bounds: run.bounds
        };
      }),
      overflow: maxRight > (element.bounds.x + element.bounds.width + 1)
    });
  }

  function drawWebFlowBookmarkIcon(pdf, iconName, bounds, color) {
    if (!pdf || !bounds) {
      return;
    }
    var scale = Math.min(bounds.width, bounds.height) / 30;
    var centerX = bounds.x + (bounds.width / 2);
    var centerY = bounds.y + (bounds.height / 2);
    var name = String(iconName || "info");
    // Match the optical centering used by the webpage bookmark SVGs.
    // Values are SVG-viewBox units applied before the -90deg bookmark rotation.
    var opticalShiftByIcon = {
      info: { x: 0, y: 0.5 },
      alert: { x: 0, y: 0.5 },
      location: { x: 0, y: 0.5 },
      key: { x: 0.25, y: 0.5 },
      car: { x: 0, y: -2.75 },
      wifi: { x: 0, y: -0.4721 },
      "log-out": { x: 1, y: 0 }
    };
    var opticalShift = opticalShiftByIcon[name] || { x: 0, y: 0 };
    function point(x, y) {
      var dx = ((x + opticalShift.x) - 12) * scale;
      var dy = ((y + opticalShift.y) - 12) * scale;
      return {
        x: centerX + dy,
        y: centerY - dx
      };
    }
    function line(x1, y1, x2, y2) {
      var a = point(x1, y1);
      var b = point(x2, y2);
      pdf.line(a.x, a.y, b.x, b.y);
    }
    function circle(x, y, radius) {
      var p = point(x, y);
      pdf.circle(p.x, p.y, radius * scale, "S");
    }
    pdf.setDrawColor(color.r, color.g, color.b);
    pdf.setLineWidth(Math.max(0.55, 1.6 * scale));
    if (name === "key") {
      circle(8, 15, 3.2);
      line(10.5, 12.5, 18.5, 4.5);
      line(15, 8, 17, 10);
      line(17, 6, 19, 8);
      return;
    }
    if (name === "car") {
      line(4, 15, 6, 9);
      line(6, 9, 18, 9);
      line(18, 9, 20, 15);
      line(3.5, 15, 20.5, 15);
      line(3.5, 15, 3.5, 18.5);
      line(20.5, 15, 20.5, 18.5);
      line(3.5, 18.5, 20.5, 18.5);
      circle(7, 19, 1.4);
      circle(17, 19, 1.4);
      return;
    }
    if (name === "wifi") {
      line(5, 9, 7, 7.5);
      line(7, 7.5, 12, 6.5);
      line(12, 6.5, 17, 7.5);
      line(17, 7.5, 19, 9);
      line(8, 12, 10, 10.8);
      line(10, 10.8, 12, 10.5);
      line(12, 10.5, 14, 10.8);
      line(14, 10.8, 16, 12);
      line(10.5, 15, 12, 14.5);
      line(12, 14.5, 13.5, 15);
      circle(12, 18, 0.9);
      return;
    }
    if (name === "home") {
      line(3.5, 11, 12, 4.5);
      line(12, 4.5, 20.5, 11);
      line(5.5, 10, 5.5, 19.5);
      line(18.5, 10, 18.5, 19.5);
      line(5.5, 19.5, 18.5, 19.5);
      line(9.5, 19.5, 9.5, 14);
      line(9.5, 14, 14.5, 14);
      line(14.5, 14, 14.5, 19.5);
      return;
    }
    if (name === "trash") {
      line(5, 7, 19, 7);
      line(9, 7, 9, 4.5);
      line(9, 4.5, 15, 4.5);
      line(15, 4.5, 15, 7);
      line(7, 7, 8, 19.5);
      line(8, 19.5, 16, 19.5);
      line(16, 19.5, 17, 7);
      line(10.5, 11, 10.5, 16);
      line(13.5, 11, 13.5, 16);
      return;
    }
    if (name === "clipboard-check") {
      line(7, 5, 5, 5);
      line(5, 5, 5, 20);
      line(5, 20, 19, 20);
      line(19, 20, 19, 5);
      line(19, 5, 17, 5);
      line(9, 3.5, 15, 3.5);
      line(9, 3.5, 9, 7);
      line(9, 7, 15, 7);
      line(15, 7, 15, 3.5);
      line(8.5, 14, 10.8, 16.2);
      line(10.8, 16.2, 15.5, 11.2);
      return;
    }
    if (name === "log-out") {
      line(10, 5, 5, 5);
      line(5, 5, 5, 19);
      line(5, 19, 10, 19);
      line(9, 12, 17, 12);
      line(13, 8, 17, 12);
      line(17, 12, 13, 16);
      return;
    }
    if (name === "alert") {
      line(12, 3.5, 3, 20);
      line(3, 20, 21, 20);
      line(21, 20, 12, 3.5);
      line(12, 9, 12, 14);
      circle(12, 17, 0.7);
      return;
    }
    if (name === "location") {
      circle(12, 10, 6.8);
      circle(12, 10, 2.2);
      line(7.5, 15, 12, 20.5);
      line(12, 20.5, 16.5, 15);
      return;
    }
    line(12, 10.5, 12, 17);
    circle(12, 7.2, 0.9);
  }

  function drawWebFlowBookmarkRail(pdf, pageNode, pdfWidth, pdfHeight) {
    if (!pageNode) {
      return;
    }
    var scaleMetrics = getPageScaleMetrics(pageNode, pdfWidth, pdfHeight);
    var pageRect = scaleMetrics.pageRect;
    Array.prototype.slice.call(pageNode.querySelectorAll(".pi-export-bookmark-link")).forEach(function (linkNode) {
      var bounds = convertRectToPdfBounds(linkNode.getBoundingClientRect(), pageRect, scaleMetrics);
      var active = linkNode.classList.contains("is-active");
      var fill = active ? { r: 40, g: 87, b: 71 } : { r: 250, g: 247, b: 239 };
      var ink = active ? { r: 255, g: 253, b: 248 } : { r: 40, g: 87, b: 71 };
      pdf.setFillColor(fill.r, fill.g, fill.b);
      pdf.setDrawColor(active ? 40 : 217, active ? 87 : 221, active ? 71 : 213);
      pdf.setLineWidth(0.55);
      if (typeof pdf.roundedRect === "function") {
        pdf.roundedRect(bounds.x, bounds.y, bounds.width, bounds.height, 4, 4, "FD");
      } else {
        pdf.rect(bounds.x, bounds.y, bounds.width, bounds.height, "FD");
      }
      var contentNode = linkNode.querySelector(".pi-export-bookmark-content");
      var contentBounds = contentNode
        ? convertRectToPdfBounds(contentNode.getBoundingClientRect(), pageRect, scaleMetrics)
        : bounds;
      var contentCenterX = contentBounds.x + (contentBounds.width / 2);
      var badgeNode = linkNode.querySelector(".pi-export-bookmark-badge");
      var labelNode = linkNode.querySelector(".pi-export-bookmark-label");
      if (!badgeNode || !labelNode) {
        return;
      }
      var labelText = String(labelNode.textContent || "").trim();
      if (!labelText) {
        return;
      }
      var labelDirection = getSemanticDirection(labelNode);
      var fontFace = getPdfFontFace(600, labelText, labelDirection);
      pdf.setFont(fontFace.family, fontFace.style);
      var bookmarkLabelFontSize = Math.max(4.8, 5.5 * scaleMetrics.scaleY);
      var measuredBadgeBounds = convertRectToPdfBounds(badgeNode.getBoundingClientRect(), pageRect, scaleMetrics);
      var badgeSize = Math.min(measuredBadgeBounds.width, measuredBadgeBounds.height);
      var bookmarkGap = Math.max(2.5, 4 * scaleMetrics.scaleY);
      var availableStackHeight = Math.max(1, contentBounds.height - (2 * scaleMetrics.scaleY));
      var maxLabelAdvance = Math.max(1, availableStackHeight - bookmarkGap - badgeSize);
      var labelLines = [labelText];
      pdf.setFontSize(bookmarkLabelFontSize);
      var wholeAdvance = Math.max(0, pdf.getTextWidth(labelText) || 0);
      var words = labelText.split(/\s+/).filter(Boolean);
      if (wholeAdvance > maxLabelAdvance && words.length > 1) {
        var bestSplit = null;
        for (var splitIndex = 1; splitIndex < words.length; splitIndex += 1) {
          var firstLine = words.slice(0, splitIndex).join(" ");
          var secondLine = words.slice(splitIndex).join(" ");
          var firstWidth = Math.max(0, pdf.getTextWidth(firstLine) || 0);
          var secondWidth = Math.max(0, pdf.getTextWidth(secondLine) || 0);
          var candidateWidth = Math.max(firstWidth, secondWidth);
          if (!bestSplit || candidateWidth < bestSplit.width) {
            bestSplit = { lines: [firstLine, secondLine], width: candidateWidth };
          }
        }
        if (bestSplit) {
          labelLines = bestSplit.lines;
        }
      }
      function renderBookmarkLine(lineText) {
        return fontFace.family === VECTOR_PDF_FONT_FAMILY_ARABIC && typeof pdf.processArabic === "function"
          ? pdf.processArabic(lineText)
          : lineText;
      }
      var renderedLines = labelLines.map(renderBookmarkLine);
      var lineAdvances = renderedLines.map(function (lineText) {
        return Math.max(0, pdf.getTextWidth(lineText) || 0);
      });
      var labelAdvance = Math.max.apply(Math, lineAdvances.concat([0]));
      if (labelAdvance > maxLabelAdvance) {
        bookmarkLabelFontSize = Math.max(4.2, bookmarkLabelFontSize * (maxLabelAdvance / labelAdvance));
        pdf.setFontSize(bookmarkLabelFontSize);
        lineAdvances = renderedLines.map(function (lineText) {
          return Math.max(0, pdf.getTextWidth(lineText) || 0);
        });
        labelAdvance = Math.max.apply(Math, lineAdvances.concat([0]));
      }
      var stackHeight = labelAdvance + bookmarkGap + badgeSize;
      var stackTop = contentBounds.y + Math.max(0, (contentBounds.height - stackHeight) / 2);
      var labelAnchorY = stackTop + labelAdvance;
      var badgeBounds = {
        x: contentCenterX - (badgeSize / 2),
        y: labelAnchorY + bookmarkGap,
        width: badgeSize,
        height: badgeSize
      };
      pdf.setDrawColor(ink.r, ink.g, ink.b);
      pdf.setLineWidth(0.65);
      pdf.circle(
        contentCenterX,
        badgeBounds.y + (badgeBounds.height / 2),
        badgeSize / 2,
        "S"
      );
      drawWebFlowBookmarkIcon(
        pdf,
        String(linkNode.getAttribute("data-pdf-bookmark-icon") || "info"),
        badgeBounds,
        ink
      );
      var bookmarkLabelOpticalX = bookmarkLabelFontSize * 0.3;
      var multiLineOffset = renderedLines.length > 1 ? Math.min(3.2, bookmarkLabelFontSize * 0.58) : 0;
      pdf.setTextColor(ink.r, ink.g, ink.b);
      renderedLines.forEach(function (renderedLine, lineIndex) {
        var centerOffset = (lineIndex - ((renderedLines.length - 1) / 2)) * multiLineOffset;
        pdf.text(
          renderedLine,
          contentCenterX + bookmarkLabelOpticalX + centerOffset,
          labelAnchorY,
          {
            angle: 90,
            align: "left",
            baseline: "middle"
          }
        );
      });
    });
  }

  function drawVectorRectElement(pdf, element) {
    var fillActive = applyPdfColor(pdf, element.fill, "fill");
    var strokeActive = element.strokeWidthPt > 0 && applyPdfColor(pdf, element.stroke, "stroke");
    if (strokeActive) {
      pdf.setLineWidth(Math.max(0.2, element.strokeWidthPt));
    }
    var mode = fillActive && strokeActive ? "FD" : (fillActive ? "F" : (strokeActive ? "S" : ""));
    if (!mode) {
      return;
    }
    if (element.radiusPt > 0 && typeof pdf.roundedRect === "function") {
      pdf.roundedRect(
        element.bounds.x,
        element.bounds.y,
        element.bounds.width,
        element.bounds.height,
        element.radiusPt,
        element.radiusPt,
        mode
      );
      return;
    }
    pdf.rect(
      element.bounds.x,
      element.bounds.y,
      element.bounds.width,
      element.bounds.height,
      mode
    );
  }

  function definePdfRoundedRectPath(pdf, bounds, radiusPt) {
    if (!pdf || !bounds) {
      return;
    }
    if (radiusPt > 0 && typeof pdf.roundedRect === "function") {
      pdf.roundedRect(
        bounds.x,
        bounds.y,
        bounds.width,
        bounds.height,
        radiusPt,
        radiusPt,
        null
      );
      return;
    }
    pdf.rect(bounds.x, bounds.y, bounds.width, bounds.height, null);
  }

  function withPdfClip(pdf, bounds, radiusPt, drawFn) {
    if (!pdf || !bounds || typeof drawFn !== "function") {
      return;
    }
    if (typeof pdf.saveGraphicsState === "function" && typeof pdf.restoreGraphicsState === "function" && typeof pdf.clip === "function") {
      pdf.saveGraphicsState();
      definePdfRoundedRectPath(pdf, bounds, radiusPt || 0);
      pdf.clip();
      if (typeof pdf.discardPath === "function") {
        pdf.discardPath();
      }
      drawFn();
      pdf.restoreGraphicsState();
      return;
    }
    drawFn();
  }

  function resolveVectorMediaClipGeometry(details) {
    var frameBounds = details && details.frameBounds ? details.frameBounds : null;
    var frameInnerBounds = details && details.frameInnerBounds ? details.frameInnerBounds : frameBounds;
    var cardInnerBounds = details && details.cardInnerBounds ? details.cardInnerBounds : null;
    var containmentClipBounds = Array.isArray(details && details.containmentClipBounds) ? details.containmentClipBounds : [];
    var pageBounds = details && details.pageBounds ? details.pageBounds : null;
    var imageBounds = details && details.imageBounds ? details.imageBounds : null;
    var clipBounds = intersectPdfBounds(frameInnerBounds, cardInnerBounds);
    containmentClipBounds.forEach(function (ancestor) {
      clipBounds = intersectPdfBounds(clipBounds || frameInnerBounds, ancestor && ancestor.innerBounds ? ancestor.innerBounds : null);
    });
    clipBounds = intersectPdfBounds(clipBounds || frameInnerBounds, pageBounds);
    var frameRadiusPt = Number(details && details.frameRadiusPt || 0);
    var frameStrokeWidthPt = Number(details && details.frameStrokeWidthPt || 0);
    var paddingPt = details && details.paddingPt ? details.paddingPt : { top: 0, right: 0, bottom: 0, left: 0 };
    var insetRadius = Math.max(
      frameStrokeWidthPt,
      Number(paddingPt.top || 0),
      Number(paddingPt.right || 0),
      Number(paddingPt.bottom || 0),
      Number(paddingPt.left || 0)
    );
    var clipRadiusPt = Math.max(0, Number((frameRadiusPt - insetRadius).toFixed(2)));
    var overflowBeforeClip = calculatePdfBoundsOverflow(imageBounds, clipBounds || frameInnerBounds || frameBounds);
    var issues = [];
    if (!clipBounds) {
      issues.push("missing-clip-bounds");
    }
    if (clipBounds && frameBounds) {
      var clipOutsideFrame = calculatePdfBoundsOverflow(clipBounds, frameBounds);
      if (calculatePdfOverflowMagnitude(clipOutsideFrame) > 0.5) {
        issues.push("clip-exceeds-frame");
      }
    }
    if (clipBounds && pageBounds) {
      var clipOutsidePage = calculatePdfBoundsOverflow(clipBounds, pageBounds);
      if (calculatePdfOverflowMagnitude(clipOutsidePage) > 0.5) {
        issues.push("clip-exceeds-page");
      }
    }
    var clipOutsideContainment = containmentClipBounds.map(function (ancestor) {
      return {
        role: ancestor ? ancestor.role : "containment",
        bounds: ancestor ? ancestor.bounds : null,
        innerBounds: ancestor ? ancestor.innerBounds : null,
        overflow: calculatePdfBoundsOverflow(clipBounds, ancestor && ancestor.innerBounds ? ancestor.innerBounds : null)
      };
    }).filter(function (entry) {
      return calculatePdfOverflowMagnitude(entry.overflow) > 0.5;
    });
    if (clipOutsideContainment.length) {
      issues.push("clip-exceeds-containment");
    }
    var expectedVisibleBounds = intersectPdfBounds(imageBounds, clipBounds);
    var expectedVisibleOverflow = clipBounds && expectedVisibleBounds
      ? calculatePdfBoundsOverflow(expectedVisibleBounds, clipBounds)
      : overflowBeforeClip;
    return {
      clipBounds: clipBounds,
      clipRadiusPt: clipRadiusPt,
      imageBounds: imageBounds,
      frameBounds: frameBounds,
      frameInnerBounds: frameInnerBounds,
      cardInnerBounds: cardInnerBounds,
      containmentClipBounds: containmentClipBounds,
      pageBounds: pageBounds,
      overflowBeforeClip: overflowBeforeClip,
      expectedVisibleBounds: expectedVisibleBounds,
      clipOutsideContainment: clipOutsideContainment,
      visibleOverflowAfterClip: expectedVisibleOverflow,
      clipApplied: !!clipBounds,
      valid: !issues.length,
      issues: issues
    };
  }

  function getVectorImageMimeType(imageKind, source) {
    if (imageKind === "map") {
      return "image/png";
    }
    return getImageFormatFromDataUri(source) === "JPEG" ? "image/jpeg" : "image/png";
  }

  async function prepareVectorImageAssets(layoutModel) {
    var preparedAssets = {};
    var groupedAssets = {};
    layoutModel.pages.forEach(function (page) {
      (page.elements || []).forEach(function (element) {
        if (element.type !== "image") {
          return;
        }
        var assetKey = hashString([element.role, element.source].join("|"));
        element.assetKey = assetKey;
        groupedAssets[assetKey] = groupedAssets[assetKey] || {
          source: element.source,
          imageKind: element.imageKind || "image",
          uses: []
        };
        groupedAssets[assetKey].uses.push(element);
      });
    });
    var assetKeys = Object.keys(groupedAssets);
    for (var index = 0; index < assetKeys.length; index += 1) {
      var assetKey = assetKeys[index];
      var assetInfo = groupedAssets[assetKey];
      var maxWidthPt = 0;
      var maxHeightPt = 0;
      assetInfo.uses.forEach(function (use) {
        maxWidthPt = Math.max(maxWidthPt, use.bounds.width);
        maxHeightPt = Math.max(maxHeightPt, use.bounds.height);
      });
      var image = await loadImageFromDataUri(assetInfo.source);
      var naturalWidth = Number(image.naturalWidth || image.width || 0);
      var naturalHeight = Number(image.naturalHeight || image.height || 0);
      var targetWidthPx = Math.max(1, Math.ceil((maxWidthPt / 72) * VECTOR_PDF_FONT_TARGET_DPI));
      var targetHeightPx = Math.max(1, Math.ceil((maxHeightPt / 72) * VECTOR_PDF_FONT_TARGET_DPI));
      var scale = Math.min(
        1,
        targetWidthPx / Math.max(1, naturalWidth),
        targetHeightPx / Math.max(1, naturalHeight)
      );
      var width = Math.max(1, Math.round(naturalWidth * scale));
      var height = Math.max(1, Math.round(naturalHeight * scale));
      var canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      var context = canvas.getContext("2d", { alpha: assetInfo.imageKind !== "photo" });
      if (!context) {
        throw new Error("Vector image canvas unavailable");
      }
      if (assetInfo.imageKind === "photo") {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, width, height);
      } else {
        context.clearRect(0, 0, width, height);
      }
      context.drawImage(image, 0, 0, width, height);
      var mimeType = getVectorImageMimeType(assetInfo.imageKind, assetInfo.source);
      var blob = await new Promise(function (resolve) {
        canvas.toBlob(resolve, mimeType, mimeType === "image/jpeg" ? 0.84 : undefined);
      });
      if (!blob) {
        throw new Error("Vector image asset encoding failed");
      }
      var dataUri = await blobToDataUri(blob);
      preparedAssets[assetKey] = {
        alias: assetKey,
        dataUri: dataUri,
        format: getImageFormatFromDataUri(dataUri),
        widthPx: width,
        heightPx: height,
        naturalWidth: naturalWidth,
        naturalHeight: naturalHeight,
        byteSize: blob.size,
        useCount: assetInfo.uses.length
      };
    }
    return preparedAssets;
  }

  function drawVectorImageElement(pdf, element, preparedAssets) {
    var preparedAsset = preparedAssets[element.assetKey];
    if (!preparedAsset) {
      throw new Error("Vector image asset missing");
    }
    var frameElement = {
      bounds: element.frameBounds || element.bounds,
      radiusPt: Number(element.frameRadiusPt || 0),
      fill: element.frameFill,
      stroke: element.frameStroke,
      strokeWidthPt: Number(element.frameStrokeWidthPt || 0)
    };
    var clipGeometry = resolveVectorMediaClipGeometry({
      frameBounds: element.frameBounds || element.bounds,
      frameInnerBounds: element.frameInnerBounds || element.frameBounds || element.bounds,
      imageBounds: element.imageBounds || element.bounds,
      cardInnerBounds: element.cardInnerBounds || element.cardBounds || null,
      containmentClipBounds: element.containmentClipBounds || [],
      pageBounds: element.pageBounds || null,
      frameRadiusPt: Number(element.frameRadiusPt || 0),
      frameStrokeWidthPt: Number(element.frameStrokeWidthPt || 0),
      paddingPt: element.paddingPt || null
    });
    if (!clipGeometry.valid) {
      throw new Error("vector-media-clip-invalid");
    }
    drawVectorRectElement(pdf, frameElement);
    withPdfClip(pdf, clipGeometry.clipBounds, Number(clipGeometry.clipRadiusPt || element.clipRadiusPt || element.frameRadiusPt || 0), function () {
      pdf.addImage(
        preparedAsset.dataUri,
        preparedAsset.format,
        (element.imageBounds || element.bounds).x,
        (element.imageBounds || element.bounds).y,
        (element.imageBounds || element.bounds).width,
        (element.imageBounds || element.bounds).height,
        preparedAsset.alias,
        "FAST"
      );
    });
  }

  function drawVectorQrElement(pdf, element) {
    if (!(window.qrcodegen && window.qrcodegen.QrCode && window.qrcodegen.QrCode.Ecc)) {
      throw new Error("QR library unavailable");
    }
    var qrCode = window.qrcodegen.QrCode.encodeText(String(element.value || ""), window.qrcodegen.QrCode.Ecc.MEDIUM);
    var border = Number(element.moduleBorder || PDF_QR_MODULE_BORDER || 0);
    var moduleCount = qrCode.size + border * 2;
    var qrBounds = element.qrBounds || element.bounds;
    var panelElement = {
      bounds: element.panelBounds || element.bounds,
      radiusPt: Number(element.panelRadiusPt || 0),
      fill: element.panelFill,
      stroke: element.panelStroke,
      strokeWidthPt: Number(element.panelStrokeWidthPt || 0)
    };
    drawVectorRectElement(pdf, panelElement);
    var moduleSize = Math.min(qrBounds.width, qrBounds.height) / moduleCount;
    pdf.setFillColor(255, 255, 255);
    pdf.rect(qrBounds.x, qrBounds.y, qrBounds.width, qrBounds.height, "F");
    pdf.setFillColor(0, 0, 0);
    for (var y = 0; y < qrCode.size; y += 1) {
      for (var x = 0; x < qrCode.size; x += 1) {
        if (qrCode.getModule(x, y)) {
          pdf.rect(
            qrBounds.x + ((x + border) * moduleSize),
            qrBounds.y + ((y + border) * moduleSize),
            moduleSize,
            moduleSize,
            "F"
          );
        }
      }
    }
  }

  async function renderExportPagesToVectorPdf(exportState, pageNodes, performanceState) {
    recordPdfGenerationStage("vector-renderer-entered", {
      pageCount: pageNodes.length
    });
    var jsPDF = window.jspdf.jsPDF;
    var pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
      compress: true
    });
    recordPdfGenerationStage("vector-font-registration-started");
    var embeddedFonts = await ensureVectorPdfFontsRegistered(pdf);
    recordPdfGenerationStage("vector-font-registration-completed", {
      embeddedFontCount: embeddedFonts.length
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
    var modelStartedAt = Date.now();
    var layoutModel = buildVectorLayoutModel(exportState, pdfWidth, pdfHeight);
    var vectorMediaClipDiagnostics = layoutModel.pages.reduce(function (all, pageModel) {
      return all.concat((pageModel.elements || []).filter(function (element) {
        return element.type === "image";
      }).map(function (element) {
        return Object.assign({
          role: element.role,
          source: summarizeDiagnosticImageSource(element.source || "", String(element.role || "image")),
          page: pageModel.index
        }, resolveVectorMediaClipGeometry({
          frameBounds: element.frameBounds || element.bounds,
          frameInnerBounds: element.frameInnerBounds || element.frameBounds || element.bounds,
          imageBounds: element.imageBounds || element.bounds,
          cardInnerBounds: element.cardInnerBounds || element.cardBounds || null,
          containmentClipBounds: element.containmentClipBounds || [],
          pageBounds: element.pageBounds || null,
          frameRadiusPt: Number(element.frameRadiusPt || 0),
          frameStrokeWidthPt: Number(element.frameStrokeWidthPt || 0),
          paddingPt: element.paddingPt || null
        }));
      }));
    }, []);
    if (vectorMediaClipDiagnostics.some(function (entry) { return !entry.valid || !entry.clipApplied; })) {
      window.__propertyInstructionLastPdfDiagnostics = Object.assign({}, window.__propertyInstructionLastPdfDiagnostics || {}, {
        vectorMediaClipDiagnostics: vectorMediaClipDiagnostics,
        vectorMediaClipBlockers: vectorMediaClipDiagnostics.filter(function (entry) {
          return !entry.valid || !entry.clipApplied;
        })
      });
      throw new Error("vector-media-clip-invalid");
    }
    var preparedAssets = await prepareVectorImageAssets(layoutModel);
    performanceState.vectorLayoutExtractionMs = Date.now() - modelStartedAt;
    var textDiagnostics = [];
    window.__propertyInstructionPdfRenderer = PDF_RENDERER_ID;
    window.__propertyInstructionPdfVectorLayoutModel = layoutModel;

    layoutModel.pages.forEach(function (pageModel, pageIndex) {
      if (pageIndex > 0) {
        pdf.addPage("a4", "portrait");
      }
      pageModel.elements.forEach(function (element) {
        if (element.type === "rect") {
          drawVectorRectElement(pdf, element);
          return;
        }
        if (element.type === "image") {
          drawVectorImageElement(pdf, element, preparedAssets);
          return;
        }
        if (element.type === "qr") {
          drawVectorQrElement(pdf, element);
          return;
        }
        if (element.type === "text-line") {
          drawVectorTextElement(pdf, element, textDiagnostics);
        }
      });
      drawWebFlowBookmarkRail(pdf, pageNodes[pageIndex], pdfWidth, pdfHeight);
      addPageLinkAnnotations(pdf, pageNodes[pageIndex], pdfWidth, pdfHeight);
    });

    return {
      pdf: pdf,
      pageCount: pageNodes.length,
      pageDiagnostics: pageNodes.map(collectPageDiagnostics),
      layoutModel: layoutModel,
      vectorTextDiagnostics: textDiagnostics,
      embeddedFonts: embeddedFonts,
      vectorMediaClipDiagnostics: vectorMediaClipDiagnostics,
      preparedImageAssets: Object.keys(preparedAssets).map(function (key) {
        return Object.assign({ key: key }, preparedAssets[key]);
      })
    };
  }

  async function renderExportPagesToPdf(exportState, modelParityMap, mutationGuardState) {
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
    await waitForTwoAnimationFrames();
    recordPdfGenerationStage("validation-started", {
      pageCount: pageNodes.length
    });
    var cardContainmentDiagnostics = [];
    var mediaVisualPlacementDiagnostics = [];
    var imageRatioDiagnostics = validateImageAspectRatios(exportState.exportRoot);
    var imageClipDiagnostics = validateExportImageClipping(exportState.exportRoot);
    recordPdfGenerationStage("validation-completed", {
      pageCount: pageNodes.length
    });
    validateExportDomParity(exportState.exportRoot, modelParityMap, "post-fonts-images", mutationGuardState);

    var renderResult = await renderExportPagesToVectorPdf(exportState, pageNodes, performanceState);

    if (renderResult.pdf.internal.getNumberOfPages() !== pageNodes.length) {
      throw new Error("PDF page count did not match export page count.");
    }
    validateExportDomParity(exportState.exportRoot, modelParityMap, "post-render", mutationGuardState);

    window.__propertyInstructionLastPdfDiagnostics = {
      imageSourceDiagnostics: imageSourceDiagnostics,
      imageDiagnostics: imageDiagnostics,
      cardContainmentDiagnostics: cardContainmentDiagnostics,
      mediaVisualPlacementDiagnostics: mediaVisualPlacementDiagnostics,
      imageRatioDiagnostics: imageRatioDiagnostics,
      imageClipDiagnostics: imageClipDiagnostics,
      preparedImageAssets: renderResult.preparedImageAssets || [],
      pageDiagnostics: renderResult.pageDiagnostics || pageNodes.map(collectPageDiagnostics),
      vectorLayoutModel: renderResult.layoutModel || null,
      vectorTextDiagnostics: renderResult.vectorTextDiagnostics || [],
      vectorMediaClipDiagnostics: renderResult.vectorMediaClipDiagnostics || [],
      embeddedFonts: renderResult.embeddedFonts || [],
      shellCount: pageNodes.length
    };

    return {
      pdf: renderResult.pdf,
      pageCount: pageNodes.length,
      cardContainmentDiagnostics: cardContainmentDiagnostics,
      mediaVisualPlacementDiagnostics: mediaVisualPlacementDiagnostics,
      layoutModel: renderResult.layoutModel || null,
      vectorTextDiagnostics: renderResult.vectorTextDiagnostics || [],
      vectorMediaClipDiagnostics: renderResult.vectorMediaClipDiagnostics || [],
      embeddedFonts: renderResult.embeddedFonts || [],
      preparedImageAssets: renderResult.preparedImageAssets || []
    };
  }

  function buildPdfArtifactModePayload(artifact) {
    if (!artifact || !artifact.pdfBlob) {
      return null;
    }
    var blobUrl = createPdfArtifactModeBlobUrl(artifact.pdfBlob);
    var layoutSummary = artifact.layoutSummary || null;
    return {
      status: "complete",
      filename: String(artifact.filename || ""),
      blob: artifact.pdfBlob,
      blobUrl: blobUrl,
      pageCount: Number(artifact.pageCount || 0),
      layoutSummary: layoutSummary,
      performance: artifact.performance || {},
      language: String(artifact.languageCode || SOURCE_LANGUAGE),
      direction: String(artifact.direction || "ltr"),
      renderer: String(artifact.renderer || PDF_RENDERER_ID),
      embeddedFonts: Array.isArray(artifact.embeddedFonts) ? artifact.embeddedFonts.slice() : [],
      layoutModel: artifact.layoutModel ? {
        version: artifact.layoutModel.version || 1,
        renderer: artifact.layoutModel.renderer || String(artifact.renderer || PDF_RENDERER_ID),
        pageSize: artifact.layoutModel.pageSize || null,
        pageCount: Array.isArray(artifact.layoutModel.pages) ? artifact.layoutModel.pages.length : 0,
        elementCount: Array.isArray(artifact.layoutModel.pages)
          ? artifact.layoutModel.pages.reduce(function (total, page) {
              return total + ((page && Array.isArray(page.elements)) ? page.elements.length : 0);
            }, 0)
          : 0
      } : null,
      vectorTextDiagnostics: Array.isArray(artifact.vectorTextDiagnostics) ? artifact.vectorTextDiagnostics.slice() : []
      ,
      preparedImageAssets: Array.isArray(artifact.preparedImageAssets)
        ? artifact.preparedImageAssets.map(function (asset) {
            return {
              key: asset.key,
              alias: asset.alias,
              widthPx: asset.widthPx,
              heightPx: asset.heightPx,
              naturalWidth: asset.naturalWidth,
              naturalHeight: asset.naturalHeight,
              byteSize: asset.byteSize,
              useCount: asset.useCount
            };
          })
        : []
    };
  }

  function publishPdfArtifactModeResult(artifact) {
    if (!isPdfArtifactModeEnabled() || !artifact) {
      return artifact;
    }
    var payload = buildPdfArtifactModePayload(artifact);
    if (!payload) {
      return artifact;
    }
    setPdfArtifactModeResult(payload);
    try {
      window.dispatchEvent(new CustomEvent("propms-pdf-artifact-ready", {
        detail: {
          filename: payload.filename,
          pageCount: payload.pageCount,
          language: payload.language
        }
      }));
    } catch (error) {
      // Ignore event construction failures in older browsers.
    }
    return artifact;
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
    resetPdfGenerationDiagnostics(PDF_RENDERER_ID);
    recordPdfGenerationStage("generation-entered", {
      action: triggerElement && triggerElement.classList && triggerElement.classList.contains("property-instruction-print") ? "print" : "download"
    });
    window.__propertyInstructionLastPdfError = null;
    clearPdfFeedback();
    if (isPdfArtifactModeEnabled()) {
      clearPdfArtifactModeResult("new-generation");
      setPdfArtifactModeResult({
        status: "running",
        stage: "initializing"
      });
    }
    setPdfExportControlsDisabled(true);
    setGuidePdfActionButtonsDisabled(true);
    pdfExportController.lastTriggerButton = triggerElement;
    recordPdfInteractionDiagnostic("generation-requested", {
      action: triggerElement && triggerElement.classList && triggerElement.classList.contains("property-instruction-print")
        ? "print"
        : "download"
    });
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
        immediateCachedArtifact.artifactCacheHit = true;
        recordPdfPerformance(performanceState, "warmRepeatedDownloadMs", clickStartedAt);
        recordPdfPerformance(performanceState, "totalMs", performanceState.startedAt);
        window.__propertyInstructionLastPdfBlob = immediateCachedArtifact.pdfBlob;
        window.__propertyInstructionLastPdfLanguage = currentLanguage;
        publishPdfArtifactModeResult(immediateCachedArtifact);
        return immediateCachedArtifact;
      }

      setPdfExportLifecycle("waiting-for-translation");
      recordPdfGenerationStage("libraries-started");
      if (isPdfArtifactModeEnabled()) {
        setPdfArtifactModeResult({
          status: "running",
          stage: "waiting-for-translation"
        });
      }
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
        cachedArtifact.artifactCacheHit = true;
        recordPdfPerformance(performanceState, "warmRepeatedDownloadMs", clickStartedAt);
        recordPdfPerformance(performanceState, "totalMs", performanceState.startedAt);
        window.__propertyInstructionLastPdfBlob = cachedArtifact.pdfBlob;
        publishPdfArtifactModeResult(cachedArtifact);
        return cachedArtifact;
      }

      setPdfExportLifecycle("preparing-assets");
      if (isPdfArtifactModeEnabled()) {
        setPdfArtifactModeResult({
          status: "running",
          stage: "preparing-assets"
        });
      }
      updateExportProgress(triggerElement, statusElement, null, null, "load-libraries");
      var prepareStartedAt = Date.now();
      var preparedState = await preparePdfDependenciesForSnapshot(settledSnapshot, triggerElement);
      recordPdfGenerationDuration("preparePdfDependenciesForSnapshotMs", Date.now() - prepareStartedAt);
      if (Array.isArray(preparedState.optionalMediaWarnings) && preparedState.optionalMediaWarnings.length) {
        var generationDiagnostics = getPdfGenerationDiagnostics();
        generationDiagnostics.optionalMediaWarnings = trimWarningCollection(
          (generationDiagnostics.optionalMediaWarnings || []).concat(preparedState.optionalMediaWarnings),
          20
        );
        generationDiagnostics.warnings = trimWarningCollection(
          generationDiagnostics.warnings.concat(preparedState.optionalMediaWarnings.map(function (warning) {
            return Object.assign({ kind: "optional-media-missing" }, warning);
          })),
          80
        );
      }
      recordPdfGenerationStage("libraries-completed", {
        mapPreparationMs: Number(preparedState.mapPreparationMs || 0),
        qrGenerationMs: Number((preparedState.qrDiagnostics && preparedState.qrDiagnostics.durationMs) || 0),
        optionalMediaWarnings: Number((preparedState.optionalMediaWarnings || []).length || 0)
      });
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
      recordPdfGenerationStage("export-root-started");
      if (isPdfArtifactModeEnabled()) {
        setPdfArtifactModeResult({
          status: "running",
          stage: "building-layout"
        });
      }
      updateExportProgress(triggerElement, statusElement, null, null, "build-export");
      var buildStartedAt = Date.now();
      exportState = buildPdfExportDocument(guideModel);
      recordPdfGenerationDuration("buildPdfExportDocumentMs", Date.now() - buildStartedAt);
      recordPdfGenerationStage("export-root-completed", {
        language: guideModel.languageCode || SOURCE_LANGUAGE
      });
      exportState.performanceState = performanceState;
      exportState.exportImageDataCache = exportImageDataCache;
      exportState.preparedState = preparedState;
      recordPdfPerformance(performanceState, "exportDomConstructionMs", buildStartedAt);
      validateExportDomParity(exportState.exportRoot, preMountParity.modelParityMap, "detached-build");
      mountExportRoot(exportState.exportRoot);
      validateExportDomParity(exportState.exportRoot, preMountParity.modelParityMap, "post-mount");

      updateExportProgress(triggerElement, statusElement, null, null, "wait-images");
      recordPdfGenerationStage("assets-started");
      var imagePrepStartedAt = Date.now();
      var inlineImageDiagnostics = await inlineExportImages(exportState.exportRoot, exportImageDataCache);
      exportState.exportImageDataCache = exportImageDataCache;
      exportState.inlineImageDiagnostics = inlineImageDiagnostics;
      await waitForImages(exportState.exportRoot);
      recordPdfGenerationStage("assets-completed");
      updateExportProgress(triggerElement, statusElement, null, null, "prepare-layout");
      recordPdfGenerationStage("web-flow-layout-started");
      applyWebFlowSectionRows(exportState);
      recordPdfGenerationStage("web-flow-layout-completed");
      var sizingDiagnostics = applyExportImageSizing(exportState.exportRoot);
      recordPdfGenerationStage("browser-fonts-started");
      await waitForFonts();
      recordPdfGenerationStage("browser-fonts-completed");
      await waitForTwoAnimationFrames();
      var prePaginationRatioDiagnostics = validateImageAspectRatios(exportState.exportRoot);
      var prePaginationClipDiagnostics = validateExportImageClipping(exportState.exportRoot);
      recordPdfPerformance(performanceState, "imagePreparationMs", imagePrepStartedAt);

      updateExportProgress(triggerElement, statusElement, null, null, "paginate");
      var paginationStartedAt = Date.now();
      paginateExportDocument(exportState);
      decorateWebFlowPagesWithBookmarks(exportState);
      populatePageFooters(exportState, guideModel.title || guideTitle);
      populatePdfContentsDestinations(exportState);
      recordPdfPerformance(performanceState, "paginationMs", paginationStartedAt);
      var layoutDiagnostics = collectCardLayoutDiagnostics(exportState.exportRoot);
      var pageOccupancy = collectPdfPageSummary(exportState.exportPages);
      exportState.webFlowLayoutSummary = Object.assign({}, exportState.webFlowLayoutSummary || {}, {
        pageOccupancy: pageOccupancy,
        pageCount: exportState.exportPages.querySelectorAll(".pi-export-page").length,
        sparsePageWarnings: pageOccupancy.filter(function (pageSummary) {
          return pageSummary.occupancy < PDF_SPARSE_PAGE_THRESHOLD && pageSummary.rowCount <= 1;
        }).map(function (pageSummary) {
          return pageSummary.pageNumber;
        })
      });
      window.__propertyInstructionPdfWebFlowLayoutSummary = exportState.webFlowLayoutSummary;
      validateExportDomParity(exportState.exportRoot, preMountParity.modelParityMap, "post-pagination");
      mutationGuardState = startExportMutationGuard(exportState.exportRoot);
      updateExportProgress(triggerElement, statusElement, null, null, "validate");
      recordPdfGenerationStage("validation-started");
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
      recordPdfGenerationStage("validation-completed", {
        pageCount: exportState.exportPages.querySelectorAll(".pi-export-page").length
      });

      setPdfExportLifecycle("rendering-pages");
      recordPdfGenerationStage("renderer-selection-completed", {
        renderer: PDF_RENDERER_ID
      });
      if (isPdfArtifactModeEnabled()) {
        setPdfArtifactModeResult({
          status: "running",
          stage: "rendering-pages"
        });
      }
      updateExportProgress(triggerElement, statusElement, null, null, "render-pdf");
      var renderResult = await withTimeout(
        renderExportPagesToPdf(
          exportState,
          preMountParity.modelParityMap,
          mutationGuardState
        ),
        PDF_EXPORT_TIMEOUT_MS,
        "PDF export timed out"
      );
      setPdfExportLifecycle("assembling-pdf");
      recordPdfGenerationStage("pdf-assembly-completed", {
        pageCount: renderResult.pageCount
      });
      if (isPdfArtifactModeEnabled()) {
        setPdfArtifactModeResult({
          status: "running",
          stage: "assembling-pdf"
        });
      }
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
        pageCount: renderResult.pageCount,
        languageCode: guideModel.languageCode || SOURCE_LANGUAGE,
        cacheKey: cacheKey,
        artifactCacheHit: false,
        performance: Object.assign({}, performanceState),
        layoutSummary: exportState.webFlowLayoutSummary ? JSON.parse(JSON.stringify(exportState.webFlowLayoutSummary)) : null,
        filename: getPdfFilename(triggerElement),
        renderer: PDF_RENDERER_ID,
        embeddedFonts: (renderResult.embeddedFonts || []).slice(),
        preparedImageAssets: Array.isArray(renderResult.preparedImageAssets)
          ? JSON.parse(JSON.stringify(renderResult.preparedImageAssets))
          : [],
        layoutModel: renderResult.layoutModel
          ? JSON.parse(JSON.stringify(renderResult.layoutModel))
          : null,
        vectorTextDiagnostics: (renderResult.vectorTextDiagnostics || []).slice(),
        direction: String(
          (guideModel && guideModel.direction)
          || (exportState.exportDocument && exportState.exportDocument.getAttribute("dir"))
          || getGuideDirection(guideModel.languageCode || SOURCE_LANGUAGE)
          || "ltr"
        )
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
        optionalMediaWarnings: Array.isArray(preparedState.optionalMediaWarnings)
          ? preparedState.optionalMediaWarnings.slice()
          : [],
        performance: performanceState
      });
      stopExportMutationGuard(mutationGuardState);
      setPdfExportLifecycle("ready");
      recordPdfGenerationStage("generation-ready", {
        pageCount: artifact.pageCount,
        filename: artifact.filename,
        renderer: artifact.renderer
      });
      updateExportProgress(triggerElement, statusElement, null, null, "download-ready", {
        averageHistory: getAverageProgressHistory(renderResult.pageCount, 1.8),
        elapsedMs: Date.now() - clickStartedAt
      });
      if (statusElement) {
        statusElement.textContent = getGuideCopyText("pdf_ready", "PDF ready");
      }
      destroyExportRoot(exportState.exportRoot);
      publishPdfArtifactModeResult(artifact);
      return artifact;
    } catch (error) {
      var failureCode = String(
        (window.__propertyInstructionPdfLifecycle && window.__propertyInstructionPdfLifecycle.currentStage) || "pdf-generation-failed"
      );
      recordPdfGenerationStage("generation-failed", {
        failureCode: failureCode,
        errorName: String(error && error.name || "Error"),
        errorMessage: String(error && error.message || "Unable to prepare PDF")
      });
      window.__propertyInstructionLastPdfError = {
        message: error && error.message ? error.message : "Unable to prepare PDF",
        name: error && error.name ? error.name : "Error",
        capturedAt: Date.now(),
        code: failureCode,
        lastGenerationStage: String((window.__propertyInstructionPdfGenerationDiagnostics && window.__propertyInstructionPdfGenerationDiagnostics.currentStage) || "unknown")
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
        } else if (error && error.code === "required-media-unavailable") {
          statusElement.textContent = String(error.message || "A required guide image is unavailable.");
        } else if ((translationState.diagnostics || {}).abortCode && String((translationState.diagnostics || {}).abortCode).indexOf("translation") === 0) {
          statusElement.textContent = getGuideCopyText("translation_unavailable", "Translation is temporarily unavailable.");
        } else {
          statusElement.textContent = getGuideCopyText("pdf_generation_failed", "The PDF could not be generated. Please try again.");
        }
      }
      showPdfFeedback(
        "error",
        statusElement ? statusElement.textContent : getGuideCopyText("pdf_generation_failed", "The PDF could not be generated. Please try again."),
        {
          code: failureCode,
          showRetry: true
        }
      );
      recordPdfInteractionDiagnostic("generation-failed", {
        stage: failureCode,
        errorName: String(error && error.name || "Error"),
        errorMessage: String(error && error.message || "Unable to prepare PDF")
      });
      if (isPdfArtifactModeEnabled()) {
        setPdfArtifactModeResult({
          status: "failed",
          error: String(error && error.message ? error.message : "The PDF could not be generated."),
          stage: String((window.__propertyInstructionPdfLifecycle && window.__propertyInstructionPdfLifecycle.currentStage) || "failed"),
          mediaVisualPlacementDiagnostics: error && error.mediaVisualPlacementDiagnostics
            ? error.mediaVisualPlacementDiagnostics
            : ((window.__propertyInstructionLastPdfDiagnostics || {}).mediaVisualPlacementDiagnostics || null),
          mediaVisualPlacementBlockers: error && error.mediaVisualPlacementBlockers
            ? error.mediaVisualPlacementBlockers
            : ((window.__propertyInstructionLastPdfDiagnostics || {}).mediaVisualPlacementBlockers || null)
        });
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
      }, 600);
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
    pdfExportController.activePromise = performGuidePdfArtifactGeneration(triggerElement)
      .finally(function () {
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
    clearPdfFeedback();
    pdfExportController.lastTriggerButton = downloadButton;
    recordPdfInteractionDiagnostic("download-click-received", {});
    if (pdfExportController.activePromise) {
      recordPdfInteractionDiagnostic("existing-generation-awaited", {
        action: "download"
      });
    }
    var artifact = await getOrCreateGuidePdfArtifact(downloadButton);
    if (!artifact || !artifact.pdfBlob) {
      return null;
    }
    setPdfExportLifecycle("ready");
    updateExportProgress(downloadButton, statusElement, null, null, "download-ready", {
      averageHistory: getAverageProgressHistory(artifact.pageCount || 0, 1.8),
      elapsedMs: Date.now() - clickStartedAt
    });
    if (isPdfArtifactModeEnabled()) {
      publishPdfArtifactModeResult(artifact);
    }
    if (statusElement) {
      statusElement.textContent = getGuideCopyText("pdf_ready", "PDF ready");
    }
    recordPdfInteractionDiagnostic("generation-completed", {
      action: "download",
      pageCount: artifact.pageCount || 0
    });
    var automaticDownloadStarted = triggerAutomaticPdfDownload(artifact.pdfBlob, getPdfFilename(downloadButton));
    recordPdfInteractionDiagnostic("automatic-download-attempted", {
      filename: getPdfFilename(downloadButton),
      automaticDownloadStarted: !!automaticDownloadStarted,
      pageCount: artifact.pageCount || 0
    });
    if (automaticDownloadStarted) {
      setPdfExportLifecycle("download-triggered");
      updateExportProgress(downloadButton, statusElement, null, null, "download-started", {
        averageHistory: getAverageProgressHistory(artifact.pageCount || 0, 1.8),
        elapsedMs: Date.now() - clickStartedAt
      });
      if (statusElement) {
        statusElement.textContent = getGuideCopyText("download_started", "Download started");
      }
      recordPdfInteractionDiagnostic("download-started", {
        automatic: true,
        filename: getPdfFilename(downloadButton)
      });
      clearPdfFeedback();
    } else {
      recordPdfInteractionDiagnostic("automatic-download-fallback-shown", {
        reason: "automatic-download-unavailable"
      });
      showAutomaticDownloadFallback(artifact, {
        message: "Your PDF is ready. Use Download PDF or Open PDF below."
      });
    }
    return artifact;
  }

  function getArtifactModeTriggerButton() {
    return getDownloadButton() || getPrintButton() || document.querySelector(".pi-pdf-download");
  }

  function initializePdfArtifactModeApi() {
    if (!isPdfArtifactModeEnabled()) {
      delete window.PropmsPdfExport;
      return;
    }
    setPdfArtifactModeResult({
      status: "idle"
    });
    window.PropmsPdfExport = {
      generateArtifact: async function () {
        clearPdfArtifactModeResult("api-regenerate");
        setPdfArtifactModeResult({
          status: "running",
          stage: "initializing"
        });
        var triggerButton = getArtifactModeTriggerButton();
        if (!triggerButton) {
          var missingError = "Artifact export trigger is unavailable.";
          setPdfArtifactModeResult({
            status: "failed",
            error: missingError,
            stage: "failed"
          });
          throw new Error(missingError);
        }
        var artifact = await getOrCreateGuidePdfArtifact(triggerButton);
        if (!artifact || !artifact.pdfBlob) {
          var errorMessage = String((window.__propertyInstructionLastPdfError && window.__propertyInstructionLastPdfError.message) || "The PDF could not be generated.");
          setPdfArtifactModeResult({
            status: "failed",
            error: errorMessage,
            stage: "failed",
            mediaVisualPlacementDiagnostics: (window.__propertyInstructionLastPdfDiagnostics || {}).mediaVisualPlacementDiagnostics || null,
            mediaVisualPlacementBlockers: (window.__propertyInstructionLastPdfDiagnostics || {}).mediaVisualPlacementBlockers || null
          });
          throw new Error(errorMessage);
        }
        publishPdfArtifactModeResult(artifact);
        return {
          blob: artifact.pdfBlob,
          blobUrl: pdfArtifactModeController.objectUrl || createPdfArtifactModeBlobUrl(artifact.pdfBlob),
          summary: artifact.layoutSummary || null,
          performance: artifact.performance || {},
          renderer: artifact.renderer || PDF_RENDERER_ID,
          embeddedFonts: Array.isArray(artifact.embeddedFonts) ? artifact.embeddedFonts.slice() : [],
          preparedImageAssets: Array.isArray(artifact.preparedImageAssets) ? artifact.preparedImageAssets.slice() : [],
          layoutModel: artifact.layoutModel || null,
          vectorTextDiagnostics: Array.isArray(artifact.vectorTextDiagnostics) ? artifact.vectorTextDiagnostics.slice() : []
        };
      }
    };
  }

  async function handlePdfToolbarClick(event) {
    const themeToggleButton = getEventActionTarget(event, "[data-guide-theme-toggle]");
    if (themeToggleButton) {
      event.preventDefault();
      toggleGuideTheme();
      return;
    }

    var targetInfo = getSafeEventTargetInfo(event);
    recordPdfInteractionDiagnostic("raw-click-received", {
      tagName: targetInfo.tagName,
      namespace: targetInfo.namespace,
      path: targetInfo.path
    });

    const copyButton = getEventActionTarget(event, ".pi-copy-button");
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

    const pdfReadyPrintButton = getEventActionTarget(event, "[data-guide-pdf-ready-print]");
    recordPdfInteractionDiagnostic("action-target-resolved", {
      action: "ready-print",
      found: !!pdfReadyPrintButton
    });
    if (pdfReadyPrintButton) {
      event.preventDefault();
      var readyPrintArtifact = printGuideController.pendingArtifact;
      var readyTriggerButton = printGuideController.pendingTriggerButton;
      if (!readyPrintArtifact || printGuideController.launchInProgress) {
        return;
      }
      recordPdfInteractionDiagnostic("print-now-clicked", {
        pageCount: readyPrintArtifact.pageCount || 0
      });
      var readyTab = window.open("", "_blank");
      if (!readyTab) {
        recordPdfInteractionDiagnostic("popup-blocked", {
          action: "print"
        });
        recordPrintGuideDiagnostic("print-now-selected", {
          artifactCacheHit: !!readyPrintArtifact.artifactCacheHit,
          pageCount: readyPrintArtifact.pageCount || 0,
          pdfBlobSize: readyPrintArtifact.pdfBlob ? readyPrintArtifact.pdfBlob.size || 0 : 0,
          interactionCount: 2
        });
        recordPrintGuideDiagnostic("print-tab-blocked", {
          artifactCacheHit: !!readyPrintArtifact.artifactCacheHit,
          pageCount: readyPrintArtifact.pageCount || 0,
          pdfBlobSize: readyPrintArtifact.pdfBlob ? readyPrintArtifact.pdfBlob.size || 0 : 0,
          popupBlocked: true,
          interactionCount: 2
        });
        var readyErrorNode = printGuideReadyDialog ? printGuideReadyDialog.querySelector("[data-guide-print-ready-error]") : null;
        if (readyErrorNode) {
          readyErrorNode.textContent = "The browser blocked the printable PDF tab. Allow pop-ups for this site, then select Print PDF again.";
          readyErrorNode.hidden = false;
        }
        showPdfFeedback("error", "The browser blocked the printable PDF tab. Allow pop-ups for this site, then select Print PDF again.", {
          code: "popup-blocked",
          showRetry: true
        });
        return;
      }
      setPrintGuideLaunchInProgress(true);
      pdfReadyPrintButton.disabled = true;
      pdfReadyPrintButton.setAttribute("aria-disabled", "true");
      recordPrintGuideDiagnostic("print-now-selected", {
        artifactCacheHit: !!readyPrintArtifact.artifactCacheHit,
        pageCount: readyPrintArtifact.pageCount || 0,
        pdfBlobSize: readyPrintArtifact.pdfBlob ? readyPrintArtifact.pdfBlob.size || 0 : 0,
        interactionCount: 2
      });
      recordPrintGuideDiagnostic("print-tab-opened", {
        artifactCacheHit: !!readyPrintArtifact.artifactCacheHit,
        pageCount: readyPrintArtifact.pageCount || 0,
        pdfBlobSize: readyPrintArtifact.pdfBlob ? readyPrintArtifact.pdfBlob.size || 0 : 0,
        interactionCount: 2,
        readyDialogRequired: true
      });
      recordPdfInteractionDiagnostic("popup-opened", {
        action: "print"
      });
      openPdfTabWaitingDocument(readyTab);
      closePrintGuideReadyDialog("confirmed");
      resetPrintGuidePendingState();
      if (!navigatePdfTabAndSchedulePrint(readyTab, readyPrintArtifact, 2)) {
        setPrintGuideLaunchInProgress(false);
        openPrintGuideReadyDialog(
          readyPrintArtifact,
          readyTriggerButton,
          "The printable PDF tab could not be opened. Select Print PDF to try again."
        );
      } else {
        recordPdfInteractionDiagnostic("print-called", {
          action: "print"
        });
      }
      return;
    }

    const printGuideReadyCancelButton = getEventActionTarget(event, "[data-guide-print-ready-cancel]");
    if (printGuideReadyCancelButton) {
      event.preventDefault();
      closePrintGuideReadyDialog("cancelled");
      resetPrintGuidePendingState();
      return;
    }

    const pdfFeedbackRetryButton = getEventActionTarget(event, "[data-guide-pdf-feedback-retry]");
    recordPdfInteractionDiagnostic("action-target-resolved", {
      action: "feedback-retry",
      found: !!pdfFeedbackRetryButton
    });
    if (pdfFeedbackRetryButton) {
      event.preventDefault();
      clearPdfFeedback();
      var lastTriggerButton = pdfExportController.lastTriggerButton;
      if (lastTriggerButton && lastTriggerButton.classList && lastTriggerButton.classList.contains("property-instruction-print")) {
        await printGeneratedGuide(lastTriggerButton);
      } else if (lastTriggerButton) {
        await downloadTranslatedPdf(lastTriggerButton);
      }
      return;
    }

    const pdfFeedbackDownloadButton = getEventActionTarget(event, "[data-guide-pdf-feedback-download]");
    recordPdfInteractionDiagnostic("action-target-resolved", {
      action: "feedback-download",
      found: !!pdfFeedbackDownloadButton
    });
    if (pdfFeedbackDownloadButton) {
      event.preventDefault();
      var feedbackDownloadArtifact = getFeedbackPdfArtifact();
      if (!feedbackDownloadArtifact) {
        showPdfFeedback("error", getGuideCopyText("pdf_generation_failed", "The PDF could not be generated. Please try again."), {
          code: "download-fallback-missing",
          showRetry: true
        });
        return;
      }
      if (!finalizeReadyPdfDownload(feedbackDownloadArtifact, getPdfFilename(pdfExportController.lastTriggerButton || getDownloadButton() || pdfFeedbackDownloadButton))) {
        showPdfFeedback("error", getGuideCopyText("pdf_generation_failed", "The PDF could not be generated. Please try again."), {
          code: "download-fallback-failed",
          showRetry: true
        });
        return;
      }
      recordPdfInteractionDiagnostic("download-started", {
        automatic: false,
        source: "feedback"
      });
      clearPdfFeedback();
      return;
    }

    const pdfFeedbackOpenButton = getEventActionTarget(event, "[data-guide-pdf-feedback-open]");
    recordPdfInteractionDiagnostic("action-target-resolved", {
      action: "feedback-open",
      found: !!pdfFeedbackOpenButton
    });
    if (pdfFeedbackOpenButton) {
      event.preventDefault();
      var feedbackOpenArtifact = getFeedbackPdfArtifact();
      if (!feedbackOpenArtifact || !openReadyPdfInNewTab(feedbackOpenArtifact)) {
        showPdfFeedback("error", "The PDF could not be opened in a new tab. Allow pop-ups for this site, then try again.", {
          code: "open-pdf-failed",
          showDownload: !!feedbackOpenArtifact,
          showOpen: !!feedbackOpenArtifact,
          showRetry: true
        });
        return;
      }
      clearPdfFeedback();
      return;
    }

    const downloadButton = getEventActionTarget(event, ".pi-pdf-download");
    recordPdfInteractionDiagnostic("action-target-resolved", {
      action: "download",
      found: !!downloadButton
    });
    if (downloadButton && window.URL && window.URL.createObjectURL) {
      event.preventDefault();
      recordPdfInteractionDiagnostic("download-click-received", {
        sourceTagName: targetInfo.tagName,
        sourceNamespace: targetInfo.namespace
      });
      await downloadTranslatedPdf(downloadButton);
      return;
    }

    const showOriginalButton = getEventActionTarget(event, "[data-guide-show-original]");
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

    const printButton = getEventActionTarget(event, ".property-instruction-print");
    recordPdfInteractionDiagnostic("action-target-resolved", {
      action: "print",
      found: !!printButton
    });
    if (printButton) {
      event.preventDefault();
      recordPdfInteractionDiagnostic("print-click-received", {
        sourceTagName: targetInfo.tagName,
        sourceNamespace: targetInfo.namespace
      });
      await printGeneratedGuide(printButton);
    }
  }

  document.addEventListener("click", async function (event) {
    try {
      await handlePdfToolbarClick(event);
    } catch (error) {
      handlePdfInteractionControllerError(error, getSafeEventTargetInfo(event));
    }
  });

  hydrateInstructionBlockMaps();
  initializeMyMapsCooperativeGestures();
  initializeGuideTheme();
  ensureStickyToolbarObservers();
  ensureSectionNavObserver();
  scheduleStickyToolbarOffsetSync();
  ensurePrintGuideReadyDialog();
  initializePdfInteractionDiagnostics();
  clearPdfFeedback();
  initializePdfArtifactModeApi();

  document.addEventListener("pointerenter", function (event) {
    var warmButton = getEventActionTarget(event, ".pi-pdf-download, .property-instruction-print");
    if (warmButton) {
      schedulePdfPreparationWarmup(warmButton);
    }
  }, true);

  document.addEventListener("focus", function (event) {
    var warmButton = getEventActionTarget(event, ".pi-pdf-download, .property-instruction-print");
    if (warmButton) {
      schedulePdfPreparationWarmup(warmButton);
    }
  }, true);

  document.addEventListener("touchstart", function (event) {
    var warmButton = getEventActionTarget(event, ".pi-pdf-download, .property-instruction-print");
    if (warmButton) {
      schedulePdfPreparationWarmup(warmButton);
    }
  }, { passive: true, capture: true });

  window.addEventListener("pagehide", clearReadyPdfObjectUrl);
  window.addEventListener("beforeunload", clearReadyPdfObjectUrl);
  window.addEventListener("pagehide", function () {
    clearPdfArtifactModeResult("pagehide");
  });
  window.addEventListener("beforeunload", function () {
    clearPdfArtifactModeResult("beforeunload");
  });
  window.addEventListener("pagehide", function () {
    clearPrintGuideBlobUrl("pagehide");
  });
  window.addEventListener("beforeunload", function () {
    clearPrintGuideBlobUrl("beforeunload");
  });

  if (getGuideScreen()) {
    try {
      ensureOriginalSnapshotCaptured();
    } catch (error) {
      // Ignore early snapshot capture failures; export-time validation will handle them.
    }
  }
})();
