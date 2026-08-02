(function () {
  if (window.__propertyInstructionUiBound) {
    return;
  }
  window.__propertyInstructionUiBound = true;

  var HTML2CANVAS_LIBRARY_URL = "/assets/propms/js/vendor/html2canvas.min.js";
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
  var PDF_LAYOUT_VERSION = "2026-07-25-contents-qr-v1";
  var PDF_ADAPTIVE_LAYOUT_VERSION = "2026-07-27-adaptive-a4-v1";
  var PDF_DEFAULT_LAYOUT = "adaptive";
  var PDF_ADAPTIVE_DEFAULT_RENDERER = "vector";
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
  var PDF_ADAPTIVE_MEDIA_RATIO_WARNING = 0.005;
  var PDF_ADAPTIVE_MEDIA_RATIO_BLOCKER = 0.01;
  var PDF_ADAPTIVE_CARD_GAP = 12;
  var PDF_ADAPTIVE_HALF_WIDTH = Math.floor((PDF_EXPORT_CONTENT_WIDTH - PDF_ADAPTIVE_CARD_GAP) / 2);
  var PDF_ADAPTIVE_WIDE_WIDTH = PDF_EXPORT_CONTENT_WIDTH;
  var PDF_ADAPTIVE_PORTRAIT_RATIO_THRESHOLD = 1.15;
  var PDF_ADAPTIVE_LANDSCAPE_RATIO_THRESHOLD = 1.15;
  var PDF_ADAPTIVE_COMPACT_TEXT_LIMIT = 180;
  var PDF_ADAPTIVE_MEDIUM_TEXT_LIMIT = 360;
  var PDF_ADAPTIVE_COMPACT_HEIGHT_LIMIT = 320;
  var PDF_ADAPTIVE_MEDIUM_HEIGHT_LIMIT = 430;
  var PDF_ADAPTIVE_COMPACT_TEXT_HEIGHT_LIMIT = 150;
  var PDF_ADAPTIVE_MEDIUM_TEXT_HEIGHT_LIMIT = 240;
  var PDF_ADAPTIVE_HALF_CARD_HEADER_HEIGHT_LIMIT = 168;
  var PDF_ADAPTIVE_COMPACT_HEIGHT_HARD_LIMIT = 388;
  var PDF_ADAPTIVE_MEDIUM_HEIGHT_HARD_LIMIT = 504;
  var PDF_ADAPTIVE_COMPACT_TEXT_HEIGHT_HARD_LIMIT = 222;
  var PDF_ADAPTIVE_MEDIUM_TEXT_HEIGHT_HARD_LIMIT = 320;
  var PDF_ADAPTIVE_HALF_CARD_HEADER_HARD_LIMIT = 244;
  var PDF_ADAPTIVE_SPARSE_PAGE_THRESHOLD = 0.65;
  var PDF_ADAPTIVE_REBALANCE_PASSES = 3;
  var ADAPTIVE_TYPOGRAPHY_SCALES = [1, 0.96, 0.92, 0.88];
  var PDF_ADAPTIVE_BASE_BADGE_SIZE = 38;
  var PDF_ADAPTIVE_BASE_TITLE_FONT_SIZE = 17;
  var PDF_ADAPTIVE_BASE_BODY_FONT_SIZE = 14;
  var PDF_ADAPTIVE_BASE_CAPTION_FONT_SIZE = 13;
  var PDF_ADAPTIVE_BASE_LINK_FONT_SIZE = 14;
  var PDF_ADAPTIVE_BASE_TITLE_LINE_HEIGHT = 1.28;
  var PDF_ADAPTIVE_BASE_BODY_LINE_HEIGHT = 1.45;
  var PDF_ADAPTIVE_BASE_CAPTION_LINE_HEIGHT = 1.4;
  var PDF_ADAPTIVE_BASE_LINK_LINE_HEIGHT = 1.35;
  var PDF_ADAPTIVE_MIN_TITLE_FONT_SIZE = 14.75;
  var PDF_ADAPTIVE_MIN_BODY_FONT_SIZE = 12.32;
  var PDF_ADAPTIVE_MIN_CAPTION_FONT_SIZE = 11.44;
  var PDF_ADAPTIVE_MIN_LINK_FONT_SIZE = 12.32;
  var PDF_ADAPTIVE_MIN_LINE_HEIGHT = 1.24;
  var PDF_ADAPTIVE_MAX_MEDIA_REGION_GROWTH = 28;
  var PDF_ADAPTIVE_MAX_LAYOUT_GAP_GROWTH = 12;
  var PDF_ADAPTIVE_MAX_PARAGRAPH_GAP_GROWTH = 8;
  var PDF_ADAPTIVE_MAX_FLEXIBLE_SPACER = 40;
  var PDF_ADAPTIVE_FREE_SPACE_WARNING_PX = 36;
  var PDF_ADAPTIVE_FREE_SPACE_RATIO_WARNING = 0.08;
  var PDF_ADAPTIVE_MEDIA_ALIGNMENT_WARNING_PX = 10;
  var PDF_ADAPTIVE_FOOTER_ALIGNMENT_WARNING_PX = 4;
  var PDF_ADAPTIVE_TITLE_ALIGNMENT_WARNING_PX = 2;
  var PDF_ADAPTIVE_PROJECTED_TITLE_MEDIA_GAP_WARNING_PX = 28;
  var PDF_ADAPTIVE_PROJECTED_TITLE_MEDIA_GAP_BLOCKER_PX = 52;
  var PDF_ADAPTIVE_PROJECTED_UNUSED_SPACE_WARNING_RATIO = 0.16;
  var PDF_ADAPTIVE_PROJECTED_EQUALIZATION_WARNING_RATIO = 0.22;
  var PDF_ADAPTIVE_PROJECTED_MEDIA_USEFULNESS_MIN_RATIO = 0.2;
  var PDF_ADAPTIVE_PROJECTED_MEDIA_MISMATCH_WARNING_RATIO = 0.24;
  var PDF_ADAPTIVE_PROJECTED_TRAILING_SPACE_WARNING_PX = 34;
  var PDF_ADAPTIVE_BADGE_CENTER_WARNING_PX = 1;
  var PDF_ADAPTIVE_CARD_CONTAINMENT_TOLERANCE_PX = 1;
  var PDF_ADAPTIVE_MEDIA_LETTERBOX_WARNING_RATIO = 0.35;
  var PDF_ADAPTIVE_MEDIA_LETTERBOX_BLOCKER_RATIO = 0.5;
  var PDF_ADAPTIVE_MEDIA_FRAME_RATIO_WARNING = 1.8;
  var PDF_ADAPTIVE_MEDIA_FRAME_RATIO_BLOCKER = 2.3;
  var PDF_ADAPTIVE_MEDIA_BALANCE_WARNING_RATIO = 2;
  var PDF_ADAPTIVE_MEDIA_BALANCE_GAP_WARNING_PX = 24;
  var PDF_ADAPTIVE_MEDIA_BALANCE_GAP_BLOCKER_PX = 44;
  var PDF_ADAPTIVE_HEADER_GROWTH_WARNING_RATIO = 0.22;
  var PDF_ADAPTIVE_HEADER_GROWTH_BLOCKER_RATIO = 0.34;
  var PDF_ADAPTIVE_RENDER_PROJECTION_DELTA_WARNING_PX = 12;
  var PDF_ADAPTIVE_MIN_PORTRAIT_MEDIA_HEIGHT = 132;
  var PDF_ADAPTIVE_MIN_LANDSCAPE_MEDIA_HEIGHT = 92;
  var PDF_ADAPTIVE_MIN_SQUARE_MEDIA_HEIGHT = 104;
  var PDF_ADAPTIVE_RENDER_PROJECTION_DELTA_BLOCKER_PX = 24;
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
    qrImageCache: new Map()
  };
  var pdfExportController = {
    activePromise: null,
    activeLanguage: "",
    readyObjectUrl: "",
    readyMimeType: "",
    readySize: 0,
    readyObjectUrlRevokeTimer: 0,
    lastTriggerButton: null,
    feedbackArtifact: null
  };
  var instructionBlockMapModels = null;
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
  function getRequestedPdfExportOptions() {
    var requestedLayout = "";
    var requestedRenderer = "";
    try {
      var params = new URLSearchParams(window.location.search || "");
      requestedLayout = String(params.get("propms_pdf_layout") || "").toLowerCase();
      requestedRenderer = String(params.get("propms_pdf_renderer") || "").toLowerCase();
    } catch (error) {
      requestedLayout = "";
      requestedRenderer = "";
    }
    return {
      requestedLayout: requestedLayout,
      requestedRenderer: requestedRenderer
    };
  }

  function resolvePdfExportMode(options) {
    var settings = options || {};
    var requestedLayout = String(settings.requestedLayout || "").toLowerCase();
    var requestedRenderer = String(settings.requestedRenderer || "").toLowerCase();
    var defaultLayout = String(settings.defaultLayout || "adaptive").toLowerCase() === "legacy"
      ? "legacy"
      : "adaptive";
    var adaptiveDefaultRenderer = String(settings.adaptiveDefaultRenderer || "vector").toLowerCase() === "raster"
      ? "raster"
      : "vector";
    var explicitLayout = requestedLayout === "adaptive" || requestedLayout === "legacy";
    var explicitRenderer = requestedRenderer === "vector" || requestedRenderer === "raster";
    var layout = explicitLayout ? requestedLayout : defaultLayout;
    if (layout !== "legacy") {
      layout = "adaptive";
    }
    if (layout === "legacy") {
      return {
        layout: "legacy",
        renderer: "legacy",
        explicitLayout: explicitLayout,
        explicitRenderer: false
      };
    }
    var renderer = explicitRenderer ? requestedRenderer : adaptiveDefaultRenderer;
    if (renderer !== "raster") {
      renderer = "vector";
    }
    return {
      layout: "adaptive",
      renderer: renderer,
      explicitLayout: explicitLayout,
      explicitRenderer: explicitRenderer
    };
  }

  function getResolvedPdfExportMode() {
    var requestedOptions = getRequestedPdfExportOptions();
    return resolvePdfExportMode({
      requestedLayout: requestedOptions.requestedLayout,
      requestedRenderer: requestedOptions.requestedRenderer,
      defaultLayout: PDF_DEFAULT_LAYOUT,
      adaptiveDefaultRenderer: PDF_ADAPTIVE_DEFAULT_RENDERER
    });
  }

  function isAdaptivePdfLayoutEnabled() {
    return getResolvedPdfExportMode().layout === "adaptive";
  }

  function isLegacyPdfLayoutEnabled() {
    return getResolvedPdfExportMode().layout === "legacy";
  }

  function isPdfArtifactModeEnabled() {
    try {
      var params = new URLSearchParams(window.location.search || "");
      return String(params.get("propms_pdf_artifact_mode") || "").toLowerCase() === "1";
    } catch (error) {
      return false;
    }
  }

  function getAdaptivePdfRenderer() {
    return getResolvedPdfExportMode().renderer;
  }

  function isAdaptiveVectorPdfRendererEnabled() {
    return getAdaptivePdfRenderer() === "vector";
  }

  function isParkingMutationDiagnosticBypassEnabled() {
    try {
      var params = new URLSearchParams(window.location.search || "");
      return String(params.get("propms_pdf_debug_disable_parking_action_relocation") || "").toLowerCase() === "1";
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
    var resolvedMode = getResolvedPdfExportMode();
    var baseVersion = resolvedMode.layout === "adaptive"
      ? PDF_ADAPTIVE_LAYOUT_VERSION
      : PDF_LAYOUT_VERSION;
    return baseVersion;
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
        ".pi-print-ready-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.65rem;align-items:center;}",
        ".pi-print-ready-actions .pi-btn{width:100%;min-height:2.9rem;}",
        ".pi-print-ready-actions .pi-btn-primary{background:var(--pi-accent,#115e59);color:#fff;border:1px solid transparent;}",
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
    showPdfFeedback("success", getGuideCopyText("pdf_ready", "PDF ready"));
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
    var objectUrl = createReadyPdfObjectUrl(artifact.pdfBlob);
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
      renderer: String(renderer || getAdaptivePdfRenderer() || "raster"),
      language: translationState.requestedLanguage || SOURCE_LANGUAGE,
      currentStage: "idle",
      events: [],
      stageDurations: {},
      counters: {
        parkingActionRelocations: 0,
        parkingActionRelocationByCard: {},
        adaptiveCandidateMeasurements: 0,
        adaptiveVariantApplications: 0
      },
      parkingMutations: [],
      warnings: []
    };
    return window.__propertyInstructionPdfGenerationDiagnostics;
  }

  function getPdfGenerationDiagnostics() {
    return window.__propertyInstructionPdfGenerationDiagnostics || resetPdfGenerationDiagnostics(getAdaptivePdfRenderer());
  }

  function recordPdfGenerationStage(stageName, extraDetails) {
    var diagnostics = getPdfGenerationDiagnostics();
    var nextStage = String(stageName || "idle");
    diagnostics.currentStage = nextStage;
    diagnostics.language = translationState.requestedLanguage || SOURCE_LANGUAGE;
    diagnostics.renderer = String(getAdaptivePdfRenderer() || diagnostics.renderer || "raster");
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

  function recordParkingMutationDiagnostic(details) {
    var diagnostics = getPdfGenerationDiagnostics();
    diagnostics.parkingMutations.push(Object.assign({
      at: Date.now(),
      elapsedMs: Math.max(0, Date.now() - diagnostics.startedAt)
    }, details || {}));
    diagnostics.parkingMutations = trimTraceCollection(diagnostics.parkingMutations, 120);
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

  function clearPdfFeedback() {
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

  function shouldUseQrForCustomMap(representation, isCustomGoogleMap) {
    return !!isCustomGoogleMap && normalizePdfMapRepresentation(representation) !== "snapshot";
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

  function fitMediaWithinBounds(naturalWidth, naturalHeight, maxWidth, maxHeight, allowUpscale) {
    var width = Math.max(1, Number(maxWidth || 0));
    var height = Math.max(1, Number(maxHeight || 0));
    var ratio = Math.min(width / naturalWidth, height / naturalHeight);
    if (!allowUpscale) {
      ratio = Math.min(ratio, 1);
    }
    ratio = Math.max(ratio, 0);
    return {
      width: Number((naturalWidth * ratio).toFixed(2)),
      height: Number((naturalHeight * ratio).toFixed(2)),
      scale: Number(ratio.toFixed(6))
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

  function getAdaptiveMediaFitPolicy(img, cardNode) {
    var mediaType = getExportMediaType(img);
    if (mediaType === "qr") {
      return "square-contain";
    }
    if (mediaType === "map") {
      return "contain";
    }
    if (mediaType === "photo") {
      return "contain";
    }
    return "contain";
  }

  function getFrameRectWithFallback(frameNode, fallbackWidth, fallbackHeight, preferFallback) {
    var frameRect = frameNode.getBoundingClientRect();
    var frameStyles = window.getComputedStyle(frameNode);
    var horizontalPadding = (parseFloat(frameStyles.paddingLeft || "0") || 0) + (parseFloat(frameStyles.paddingRight || "0") || 0);
    var verticalPadding = (parseFloat(frameStyles.paddingTop || "0") || 0) + (parseFloat(frameStyles.paddingBottom || "0") || 0);
    var horizontalBorder = (parseFloat(frameStyles.borderLeftWidth || "0") || 0) + (parseFloat(frameStyles.borderRightWidth || "0") || 0);
    var verticalBorder = (parseFloat(frameStyles.borderTopWidth || "0") || 0) + (parseFloat(frameStyles.borderBottomWidth || "0") || 0);
    var innerWidth = Math.max(1, frameRect.width - horizontalPadding - horizontalBorder);
    var innerHeight = Math.max(1, frameRect.height - verticalPadding - verticalBorder);
    if (preferFallback) {
      if (fallbackWidth) {
        innerWidth = Math.max(1, Number(fallbackWidth || 0) - horizontalPadding - horizontalBorder);
      }
      if (fallbackHeight) {
        innerHeight = Math.max(1, Number(fallbackHeight || 0) - verticalPadding - verticalBorder);
      }
    }
    if (!frameRect.width && frameNode.clientWidth) {
      innerWidth = Math.max(1, frameNode.clientWidth - horizontalPadding);
    }
    if (!frameRect.height && frameNode.clientHeight) {
      innerHeight = Math.max(1, frameNode.clientHeight - verticalPadding);
    }
    return {
      width: Math.max(1, innerWidth || Number(fallbackWidth || 0) || 1),
      height: Math.max(1, innerHeight || Number(fallbackHeight || 0) || 1),
      outerWidth: Math.max(1, (preferFallback ? Number(fallbackWidth || 0) : 0) || frameRect.width || Number(fallbackWidth || 0) || 1),
      outerHeight: Math.max(1, (preferFallback ? Number(fallbackHeight || 0) : 0) || frameRect.height || Number(fallbackHeight || 0) || 1)
    };
  }

  function applyAdaptiveMediaDimensions(frameNode, img, options) {
    if (!frameNode || !img || !img.naturalWidth || !img.naturalHeight) {
      return null;
    }
    var resolvedGeometry = options && options.resolvedGeometry ? options.resolvedGeometry : null;
    var fitPolicy = String((options && options.fitPolicy) || "contain");
    var frameRect = resolvedGeometry
      ? {
          width: Number(resolvedGeometry.frameWidth || 1),
          height: Number(resolvedGeometry.frameHeight || 1),
          outerWidth: Number(resolvedGeometry.frameWidth || 1),
          outerHeight: Number(resolvedGeometry.frameHeight || 1)
        }
      : getFrameRectWithFallback(
          frameNode,
          options && options.fallbackWidth,
          options && options.fallbackHeight,
          !!(options && options.preferFallbackFrameRect)
        );
    var fitted = resolvedGeometry
      ? {
          width: Number(resolvedGeometry.imageWidth || 1),
          height: Number(resolvedGeometry.imageHeight || 1),
          scale: Number(resolvedGeometry.scale || 0)
        }
      : fitMediaWithinBounds(
          img.naturalWidth,
          img.naturalHeight,
          frameRect.width,
          frameRect.height,
          !!(options && options.allowUpscale)
        );
    frameNode.style.display = "flex";
    frameNode.style.alignItems = "center";
    frameNode.style.justifyContent = "center";
    frameNode.style.overflow = "hidden";
    img.removeAttribute("width");
    img.removeAttribute("height");
    img.style.width = fitted.width + "px";
    img.style.height = fitted.height + "px";
    img.style.maxWidth = "100%";
    img.style.maxHeight = "100%";
    img.style.objectFit = fitPolicy === "cover" ? "cover" : "contain";
    img.style.objectPosition = "center";
    img.style.flex = "0 0 auto";
    img.setAttribute("data-export-media-fit-policy", fitPolicy);
    return {
      fitPolicy: fitPolicy,
      fittedWidth: fitted.width,
      fittedHeight: fitted.height,
      frameWidth: frameRect.width,
      frameHeight: frameRect.height,
      outerFrameWidth: frameRect.outerWidth,
      outerFrameHeight: frameRect.outerHeight,
      scale: fitted.scale,
      resolvedGeometry: resolvedGeometry || null
    };
  }

  function getAdaptiveFrameAspectRatioValue(ratio) {
    var resolvedRatio = Number(ratio || 0);
    if (!resolvedRatio || !isFinite(resolvedRatio)) {
      return "";
    }
    return Number(resolvedRatio.toFixed(4)) + " / 1";
  }

  function resolveAdaptiveMediaFramePolicyDefinition(options) {
    var mediaType = String(options && options.mediaType || "image");
    var layout = String(options && options.layout || "");
    var naturalRatio = Number(options && options.naturalRatio || 0) || 1;
    var availableWidth = Math.max(1, Number(options && options.availableWidth || 0) || 1);
    var availableHeight = Math.max(1, Number(options && options.availableHeight || 0) || 1);
    var fitPolicy = String((options && options.fitPolicy) || "contain");
    var policy = {
      mediaType: mediaType,
      layout: layout,
      fitPolicy: fitPolicy,
      framePolicy: "full-width",
      frameWidth: availableWidth,
      aspectRatio: "",
      transparentFrame: false,
      visualReason: "",
      expectedLetterboxRatio: 0
    };

    if (mediaType !== "photo" || fitPolicy !== "contain") {
      return policy;
    }

    if (
      (
        layout === "half-portrait-stacked" ||
        layout === "half-portrait-stacked-compact" ||
        (layout === "wide-stacked" && naturalRatio < 1)
      ) &&
      naturalRatio > 0 &&
      naturalRatio < 1 &&
      (availableWidth / availableHeight) > (naturalRatio * 1.6)
    ) {
      var portraitWidthAtHeight = Math.max(1, availableHeight * naturalRatio);
      var portraitShrinkWidth = Math.max(1, Math.min(availableWidth, portraitWidthAtHeight));
      var portraitLetterboxRatio = Math.max(0, (availableWidth - portraitShrinkWidth) / availableWidth);
      policy.framePolicy = "shrink-wrap-natural";
      policy.frameWidth = portraitShrinkWidth;
      policy.aspectRatio = getAdaptiveFrameAspectRatioValue(naturalRatio);
      policy.transparentFrame = true;
      policy.visualReason = "contain-letterbox-reduction";
      policy.expectedLetterboxRatio = Number(portraitLetterboxRatio.toFixed(4));
      return policy;
    }

    if (layout === "half-compact" && naturalRatio >= PDF_ADAPTIVE_LANDSCAPE_RATIO_THRESHOLD) {
      var naturalWidthAtHeight = Math.max(1, availableHeight * naturalRatio);
      var shrinkWidth = Math.max(1, Math.min(availableWidth, naturalWidthAtHeight));
      var letterboxRatio = Math.max(0, (availableWidth - shrinkWidth) / availableWidth);
      policy.framePolicy = "shrink-wrap-natural";
      policy.frameWidth = shrinkWidth;
      policy.aspectRatio = getAdaptiveFrameAspectRatioValue(naturalRatio);
      policy.transparentFrame = true;
      policy.visualReason = "contain-letterbox-reduction";
      policy.expectedLetterboxRatio = Number(letterboxRatio.toFixed(4));
    }

    return policy;
  }

  function resolveAdaptiveMediaFramePolicy(cardNode, img, options) {
    return resolveAdaptiveMediaFramePolicyDefinition({
      mediaType: getExportMediaType(img),
      layout: String(cardNode && cardNode.getAttribute("data-pdf-selected-variant") || ""),
      naturalRatio: img && img.naturalWidth && img.naturalHeight
        ? (img.naturalWidth / img.naturalHeight)
        : 1,
      availableWidth: Number(options && options.availableWidth || 0) || 1,
      availableHeight: Number(options && options.availableHeight || 0) || 1,
      fitPolicy: String((options && options.fitPolicy) || "contain")
    });
  }

  function resolveAdaptiveFinalMediaGeometry(options) {
    var naturalWidth = Math.max(1, Number(options && options.naturalWidth || 0) || 1);
    var naturalHeight = Math.max(1, Number(options && options.naturalHeight || 0) || 1);
    var availableWidth = Math.max(1, Number(options && options.availableWidth || 0) || 1);
    var availableHeight = Math.max(1, Number(options && options.availableHeight || 0) || 1);
    var fitPolicy = String((options && options.fitPolicy) || "contain");
    var mediaType = String(options && options.mediaType || "image");
    var framePolicy = options && options.framePolicy
      ? Object.assign({}, options.framePolicy)
      : resolveAdaptiveMediaFramePolicyDefinition({
          mediaType: mediaType,
          layout: String(options && options.layout || ""),
          naturalRatio: naturalWidth / naturalHeight,
          availableWidth: availableWidth,
          availableHeight: availableHeight,
          fitPolicy: fitPolicy
        });
    var frameWidth = framePolicy.framePolicy === "shrink-wrap-natural"
      ? Math.max(1, Math.min(availableWidth, Number(framePolicy.frameWidth || availableWidth) || availableWidth))
      : availableWidth;
    var frameHeight = availableHeight;
    var fitted = fitMediaWithinBounds(
      naturalWidth,
      naturalHeight,
      frameWidth,
      frameHeight,
      !!(options && options.allowUpscale)
    );
    var horizontalLetterboxPercent = frameWidth
      ? Math.max(0, (frameWidth - fitted.width) / frameWidth)
      : 0;
    var verticalLetterboxPercent = frameHeight
      ? Math.max(0, (frameHeight - fitted.height) / frameHeight)
      : 0;
    var frameRatio = frameHeight ? (frameWidth / frameHeight) : (naturalWidth / naturalHeight);
    var naturalRatio = naturalWidth / naturalHeight;
    var frameSourceAspectMismatch = naturalRatio && frameRatio
      ? Math.max(frameRatio / naturalRatio, naturalRatio / frameRatio)
      : 1;
    var issues = [];
    var severity = "ok";
    if (mediaType === "photo" && fitPolicy === "contain") {
      if (
        horizontalLetterboxPercent > PDF_ADAPTIVE_MEDIA_LETTERBOX_BLOCKER_RATIO ||
        verticalLetterboxPercent > PDF_ADAPTIVE_MEDIA_LETTERBOX_BLOCKER_RATIO
      ) {
        severity = "blocker";
        issues.push("excessive-contain-letterbox");
      } else if (
        horizontalLetterboxPercent > PDF_ADAPTIVE_MEDIA_LETTERBOX_WARNING_RATIO ||
        verticalLetterboxPercent > PDF_ADAPTIVE_MEDIA_LETTERBOX_WARNING_RATIO
      ) {
        severity = "warning";
        issues.push("contain-letterbox-warning");
      }
    }
    return {
      mediaType: mediaType,
      fitPolicy: fitPolicy,
      framePolicy: framePolicy.framePolicy,
      visualReason: framePolicy.visualReason || "",
      transparentFrame: !!framePolicy.transparentFrame,
      availableWidth: Number(availableWidth.toFixed(2)),
      availableHeight: Number(availableHeight.toFixed(2)),
      frameWidth: Number(frameWidth.toFixed(2)),
      frameHeight: Number(frameHeight.toFixed(2)),
      imageWidth: Number(fitted.width.toFixed(2)),
      imageHeight: Number(fitted.height.toFixed(2)),
      scale: Number(fitted.scale.toFixed(6)),
      horizontalLetterboxPercent: Number(horizontalLetterboxPercent.toFixed(4)),
      verticalLetterboxPercent: Number(verticalLetterboxPercent.toFixed(4)),
      frameSourceAspectMismatch: Number(frameSourceAspectMismatch.toFixed(4)),
      valid: severity !== "blocker",
      severity: severity,
      issues: issues,
      aspectRatio: framePolicy.aspectRatio || "",
      expectedLetterboxRatio: Number(framePolicy.expectedLetterboxRatio || 0)
    };
  }

  function getAdaptiveMediaSiblingReservedHeight(mediaNode, frameNode) {
    if (!mediaNode || !frameNode) {
      return 0;
    }
    var mediaStyles = window.getComputedStyle(mediaNode);
    var rowGap = parseFloat(mediaStyles.rowGap || mediaStyles.gap || "0") || 0;
    var visibleSiblingCount = 0;
    var reservedHeight = Array.prototype.slice.call(mediaNode.children || []).reduce(function (total, childNode) {
      if (!childNode || childNode === frameNode) {
        return total;
      }
      var childStyles = window.getComputedStyle(childNode);
      if (childStyles.display === "none" || childStyles.visibility === "hidden") {
        return total;
      }
      var childRect = childNode.getBoundingClientRect();
      if (childRect.height <= 0) {
        return total;
      }
      visibleSiblingCount += 1;
      return total + childRect.height;
    }, 0);
    if (!visibleSiblingCount) {
      return 0;
    }
    return Math.max(0, reservedHeight + (rowGap * visibleSiblingCount));
  }

  function getAdaptiveAvailableFrameHeight(mediaNode, frameNode, fallbackHeight) {
    if (!mediaNode || !frameNode) {
      return Math.max(0, Number(fallbackHeight || 0));
    }
    var mediaInnerBounds = getNodeInnerBounds(mediaNode);
    var baseHeight = mediaInnerBounds && mediaInnerBounds.height
      ? mediaInnerBounds.height
      : (mediaNode.getBoundingClientRect().height || Number(fallbackHeight || 0));
    var reservedHeight = getAdaptiveMediaSiblingReservedHeight(mediaNode, frameNode);
    var resolvedHeight = Math.max(0, baseHeight - reservedHeight);
    if (resolvedHeight > 0) {
      return resolvedHeight;
    }
    return Math.max(0, Number(fallbackHeight || 0) - reservedHeight);
  }

  function applyAdaptiveMediaFramePolicy(frameNode, mediaNode, cardNode, img, options) {
    if (!frameNode || !img) {
      return resolveAdaptiveMediaFramePolicy(cardNode, img, options);
    }
    var resolvedGeometry = options && options.resolvedGeometry ? options.resolvedGeometry : null;
    var policy = resolvedGeometry
      ? {
          framePolicy: resolvedGeometry.framePolicy,
          fitPolicy: resolvedGeometry.fitPolicy,
          aspectRatio: resolvedGeometry.aspectRatio,
          frameWidth: resolvedGeometry.frameWidth,
          transparentFrame: resolvedGeometry.transparentFrame
        }
      : resolveAdaptiveMediaFramePolicy(cardNode, img, options);
    frameNode.setAttribute("data-pdf-media-frame-policy", policy.framePolicy);
    frameNode.setAttribute("data-pdf-media-fit-policy", policy.fitPolicy);
    if (mediaNode) {
      mediaNode.setAttribute("data-pdf-media-frame-policy", policy.framePolicy);
      mediaNode.style.alignItems = policy.framePolicy === "shrink-wrap-natural" ? "center" : "";
    }
    frameNode.style.marginInline = "";
    frameNode.style.alignSelf = "";
    frameNode.style.background = "";
    frameNode.style.aspectRatio = "";
    if (resolvedGeometry) {
      frameNode.style.width = Math.max(1, Number(resolvedGeometry.frameWidth || 0)) + "px";
      frameNode.style.height = Math.max(1, Number(resolvedGeometry.frameHeight || 0)) + "px";
      frameNode.style.maxWidth = Math.max(1, Number(resolvedGeometry.frameWidth || 0)) + "px";
      frameNode.style.maxHeight = Math.max(1, Number(resolvedGeometry.frameHeight || 0)) + "px";
      frameNode.style.minHeight = Math.max(1, Number(resolvedGeometry.frameHeight || 0)) + "px";
      frameNode.style.marginInline = "auto";
      frameNode.style.alignSelf = "center";
      if (resolvedGeometry.transparentFrame) {
        frameNode.style.background = "transparent";
      }
      return Object.assign({}, policy, resolvedGeometry);
    }
    if (policy.aspectRatio) {
      frameNode.style.aspectRatio = policy.aspectRatio;
    }
    if (policy.framePolicy === "shrink-wrap-natural") {
      frameNode.style.width = Math.max(1, Number(policy.frameWidth || 0)) + "px";
      frameNode.style.maxWidth = "100%";
      frameNode.style.marginInline = "auto";
      frameNode.style.alignSelf = "center";
      if (policy.transparentFrame) {
        frameNode.style.background = "transparent";
      }
    } else {
      frameNode.style.width = "100%";
      frameNode.style.maxWidth = "100%";
    }
    return policy;
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

  function getAdaptiveImageOrientation(naturalWidth, naturalHeight) {
    if (!naturalWidth || !naturalHeight) {
      return "square";
    }
    var ratio = naturalWidth / naturalHeight;
    if (ratio >= PDF_ADAPTIVE_LANDSCAPE_RATIO_THRESHOLD) {
      return "landscape";
    }
    if ((naturalHeight / naturalWidth) >= PDF_ADAPTIVE_PORTRAIT_RATIO_THRESHOLD) {
      return "portrait";
    }
    return "square";
  }

  function getAdaptiveCardTextLength(cardNode) {
    var titleNode = cardNode ? cardNode.querySelector(".pi-export-card-title") : null;
    var bodyNode = cardNode ? cardNode.querySelector(".pi-export-card-body") : null;
    var linkNode = cardNode ? cardNode.querySelector(".pi-export-card-link") : null;
    var captionNode = cardNode ? cardNode.querySelector(".pi-export-card-caption") : null;
    return normalizeText([
      titleNode ? (titleNode.innerText || titleNode.textContent || "") : "",
      bodyNode ? (bodyNode.innerText || bodyNode.textContent || "") : "",
      linkNode ? (linkNode.innerText || linkNode.textContent || "") : "",
      captionNode ? (captionNode.innerText || captionNode.textContent || "") : ""
    ].join(" ")).length;
  }

  function getAdaptiveCardImageNode(cardNode) {
    if (!cardNode) {
      return null;
    }
    return cardNode.querySelector("img[data-export-image-role='card']") ||
      cardNode.querySelector("img[data-export-image-role='map']") ||
      null;
  }

  function isAdaptiveParkingCard(cardNode) {
    if (!cardNode) {
      return false;
    }
    var sectionNode = cardNode.closest(".pi-export-section");
    var anchor = sectionNode ? String(sectionNode.getAttribute("data-pdf-section-anchor") || "").trim() : "";
    return anchor === "parking" && !!cardNode.querySelector("img[data-export-image-role='map']");
  }

  function createAdaptiveMeasurementHost(exportRoot) {
    var host = exportRoot.ownerDocument.createElement("div");
    host.className = "pi-export-measure-host";
    host.setAttribute("aria-hidden", "true");
    host.style.position = "absolute";
    host.style.left = "0";
    host.style.top = "0";
    host.style.width = PDF_EXPORT_CONTENT_WIDTH + "px";
    host.style.visibility = "hidden";
    host.style.pointerEvents = "none";
    host.style.zIndex = "-1";
    exportRoot.appendChild(host);
    return host;
  }

  function getAdaptiveVariantClassNames(variant) {
    var classes = [
      "pi-export-card--adaptive",
      "pi-export-card--adaptive-" + String(variant.kind || "medium"),
      variant.isWide ? "pi-export-card--adaptive-full" : "pi-export-card--adaptive-half",
      "pi-export-card--adaptive-" + String(variant.orientation || "square"),
      "pi-export-card--adaptive-layout-" + String(variant.layout || "half-compact")
    ];
    return classes;
  }

  function getAdaptiveTypographyMetrics(scale) {
    var resolvedScale = Number(scale || 1);
    var metrics = {
      typographyScale: resolvedScale,
      titleFontSize: Number((PDF_ADAPTIVE_BASE_TITLE_FONT_SIZE * resolvedScale).toFixed(2)),
      bodyFontSize: Number((PDF_ADAPTIVE_BASE_BODY_FONT_SIZE * resolvedScale).toFixed(2)),
      captionFontSize: Number((PDF_ADAPTIVE_BASE_CAPTION_FONT_SIZE * resolvedScale).toFixed(2)),
      linkFontSize: Number((PDF_ADAPTIVE_BASE_LINK_FONT_SIZE * resolvedScale).toFixed(2)),
      titleLineHeight: Number(Math.max(PDF_ADAPTIVE_MIN_LINE_HEIGHT, PDF_ADAPTIVE_BASE_TITLE_LINE_HEIGHT - ((1 - resolvedScale) * 0.08)).toFixed(3)),
      bodyLineHeight: Number(Math.max(PDF_ADAPTIVE_MIN_LINE_HEIGHT, PDF_ADAPTIVE_BASE_BODY_LINE_HEIGHT - ((1 - resolvedScale) * 0.06)).toFixed(3)),
      captionLineHeight: Number(Math.max(PDF_ADAPTIVE_MIN_LINE_HEIGHT, PDF_ADAPTIVE_BASE_CAPTION_LINE_HEIGHT - ((1 - resolvedScale) * 0.05)).toFixed(3)),
      linkLineHeight: Number(Math.max(PDF_ADAPTIVE_MIN_LINE_HEIGHT, PDF_ADAPTIVE_BASE_LINK_LINE_HEIGHT - ((1 - resolvedScale) * 0.05)).toFixed(3)),
      badgeSize: Number((PDF_ADAPTIVE_BASE_BADGE_SIZE * Math.min(1, Math.max(0.94, resolvedScale))).toFixed(2))
    };
    metrics.isReadable =
      metrics.titleFontSize >= PDF_ADAPTIVE_MIN_TITLE_FONT_SIZE &&
      metrics.bodyFontSize >= PDF_ADAPTIVE_MIN_BODY_FONT_SIZE &&
      metrics.captionFontSize >= PDF_ADAPTIVE_MIN_CAPTION_FONT_SIZE &&
      metrics.linkFontSize >= PDF_ADAPTIVE_MIN_LINK_FONT_SIZE &&
      metrics.titleLineHeight >= PDF_ADAPTIVE_MIN_LINE_HEIGHT &&
      metrics.bodyLineHeight >= PDF_ADAPTIVE_MIN_LINE_HEIGHT &&
      metrics.captionLineHeight >= PDF_ADAPTIVE_MIN_LINE_HEIGHT &&
      metrics.linkLineHeight >= PDF_ADAPTIVE_MIN_LINE_HEIGHT;
    return metrics;
  }

  function applyAdaptiveTypographyScale(cardNode, scale) {
    if (!cardNode || !cardNode.style) {
      return getAdaptiveTypographyMetrics(scale);
    }
    var typographyMetrics = getAdaptiveTypographyMetrics(scale);
    cardNode.style.setProperty("--pi-export-adaptive-type-scale", String(typographyMetrics.typographyScale));
    cardNode.style.setProperty("--pi-export-adaptive-title-size", typographyMetrics.titleFontSize + "px");
    cardNode.style.setProperty("--pi-export-adaptive-body-size", typographyMetrics.bodyFontSize + "px");
    cardNode.style.setProperty("--pi-export-adaptive-caption-size", typographyMetrics.captionFontSize + "px");
    cardNode.style.setProperty("--pi-export-adaptive-link-size", typographyMetrics.linkFontSize + "px");
    cardNode.style.setProperty("--pi-export-adaptive-title-line-height", String(typographyMetrics.titleLineHeight));
    cardNode.style.setProperty("--pi-export-adaptive-body-line-height", String(typographyMetrics.bodyLineHeight));
    cardNode.style.setProperty("--pi-export-adaptive-caption-line-height", String(typographyMetrics.captionLineHeight));
    cardNode.style.setProperty("--pi-export-adaptive-link-line-height", String(typographyMetrics.linkLineHeight));
    cardNode.style.setProperty("--pi-export-adaptive-badge-size", typographyMetrics.badgeSize + "px");
    cardNode.setAttribute("data-pdf-typography-scale", String(typographyMetrics.typographyScale));
    return typographyMetrics;
  }

  function measureAdaptiveNodeBottom(containerNode) {
    if (!containerNode || !containerNode.getBoundingClientRect) {
      return 0;
    }
    var containerRect = containerNode.getBoundingClientRect();
    var maxBottom = containerRect.top;
    Array.prototype.slice.call(containerNode.querySelectorAll("*")).forEach(function (childNode) {
      if (!childNode || !childNode.getBoundingClientRect) {
        return;
      }
      var styles = window.getComputedStyle(childNode);
      if (styles.display === "none" || styles.visibility === "hidden" || styles.position === "absolute") {
        return;
      }
      var rect = childNode.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        return;
      }
      maxBottom = Math.max(maxBottom, rect.bottom);
    });
    return Math.max(0, maxBottom - containerRect.top);
  }

  function getAdaptiveTextBlockParagraphCount(node) {
    if (!node || !node.querySelectorAll) {
      return 0;
    }
    return node.querySelectorAll("p, li").length;
  }

  function buildAdaptiveCardContentProfile(cardNode, orientation, metrics, textLength) {
    if (!cardNode) {
      return {
        hasHeader: false,
        hasBodyText: false,
        hasListContent: false,
        hasWarningContent: false,
        hasMedia: false,
        hasCaption: false,
        hasLink: false,
        hasQrContent: false,
        hasMeaningfulFooterContent: false,
        hasMapContent: false,
        mostlyMediaContent: false,
        headerAndMediaOnly: false,
        mediaOrientation: orientation || "square",
        mediaAspectRatio: 1
      };
    }
    var headerNode = cardNode.querySelector("[data-card-region='header']");
    var bodyNode = cardNode.querySelector(".pi-export-card-body");
    var footerNode = cardNode.querySelector("[data-card-region='footer']");
    var captionNode = cardNode.querySelector(".pi-export-card-caption");
    var linkNode = cardNode.querySelector(".pi-export-card-link");
    var mediaNode = cardNode.querySelector("[data-card-region='media']");
    var imageNode = getAdaptiveCardImageNode(cardNode);
    var listCount = bodyNode ? bodyNode.querySelectorAll("ul, ol, li").length : 0;
    var warningContent = cardNode.classList.contains("pi-export-card--warning");
    var qrCount = cardNode.querySelectorAll(".pi-export-qr-frame, .pi-export-card-qr-panel, .pi-export-qr-grid").length;
    var bodyText = normalizeText(bodyNode ? (bodyNode.innerText || bodyNode.textContent || "") : "");
    var footerText = normalizeText(footerNode ? (footerNode.innerText || footerNode.textContent || "") : "");
    var footerParagraphCount = getAdaptiveTextBlockParagraphCount(footerNode);
    var hasBodyText = !!bodyText;
    var hasCaption = !!captionNode && !!normalizeText(captionNode.textContent || "");
    var hasLink = !!linkNode && !!normalizeText(linkNode.textContent || "");
    var hasQrContent = qrCount > 0;
    var hasMapContent = !!cardNode.querySelector("img[data-export-image-role='map']");
    var hasMedia = !!mediaNode && !!imageNode;
    var hasMeaningfulFooterContent = !!footerText || hasCaption || hasLink || hasQrContent || footerParagraphCount > 0;
    var headerAndMediaOnly = !!headerNode && hasMedia && !hasBodyText && !hasMeaningfulFooterContent;
    var mediaAspectRatio = imageNode && imageNode.naturalWidth && imageNode.naturalHeight
      ? (imageNode.naturalWidth / imageNode.naturalHeight)
      : 1;
    var mostlyMediaContent = hasMedia && !hasMapContent && (
      headerAndMediaOnly ||
      (
        !hasMeaningfulFooterContent &&
        !warningContent &&
        textLength <= PDF_ADAPTIVE_COMPACT_TEXT_LIMIT &&
        bodyText.length <= 60 &&
        listCount === 0
      )
    );
    return {
      hasHeader: !!headerNode,
      hasBodyText: hasBodyText,
      hasListContent: listCount > 0,
      hasWarningContent: warningContent,
      hasMedia: hasMedia,
      hasCaption: hasCaption,
      hasLink: hasLink,
      hasQrContent: hasQrContent,
      hasMeaningfulFooterContent: hasMeaningfulFooterContent,
      hasMapContent: hasMapContent,
      mostlyMediaContent: mostlyMediaContent,
      headerAndMediaOnly: headerAndMediaOnly,
      mediaOrientation: orientation || "square",
      mediaAspectRatio: Number(mediaAspectRatio.toFixed(4)),
      bodyParagraphCount: getAdaptiveTextBlockParagraphCount(bodyNode),
      footerParagraphCount: footerParagraphCount,
      textLength: Number(textLength || 0)
    };
  }

  function isAdaptiveStackedLayout(layout) {
    var layoutName = String(layout || "");
    return (
      layoutName === "half-compact" ||
      layoutName === "half-landscape-stacked" ||
      layoutName === "half-portrait-stacked" ||
      layoutName === "half-portrait-stacked-compact" ||
      layoutName === "wide-stacked"
    );
  }

  function isAdaptiveSideMediaLayout(layout) {
    var layoutName = String(layout || "");
    return (
      layoutName === "half-portrait-side" ||
      layoutName === "half-portrait-side-narrow" ||
      layoutName === "half-portrait-side-wide" ||
      layoutName === "wide-horizontal"
    );
  }

  function getAdaptivePortraitSideLayouts() {
    return [
      "half-portrait-side-narrow",
      "half-portrait-side",
      "half-portrait-side-wide"
    ];
  }

  function getAdaptiveCandidateSoftPenalty(candidate) {
    if (!candidate || !candidate.halfEligibility || !Array.isArray(candidate.halfEligibility.softFailures)) {
      return 0;
    }
    return candidate.halfEligibility.softFailures.reduce(function (total, failure) {
      return total + Number(failure.penalty || 0);
    }, 0);
  }

  function getAdaptiveCandidateVariantPenalty(candidate, cardPlan) {
    if (!candidate) {
      return 0;
    }
    var contentProfile = cardPlan && cardPlan.contentProfile
      ? cardPlan.contentProfile
      : (candidate.contentProfile || {});
    var layout = String(candidate.layout || "");
    if (layout === "half-portrait-side-narrow" || layout === "half-portrait-side-wide") {
      return contentProfile.headerAndMediaOnly || contentProfile.mostlyMediaContent ? 10 : 18;
    }
    if (layout === "half-portrait-stacked") {
      return contentProfile.headerAndMediaOnly || contentProfile.mostlyMediaContent ? 18 : 30;
    }
    if (layout === "half-portrait-stacked-compact") {
      return 34;
    }
    return 0;
  }

  function getAdaptiveCandidateHardFailureReason(candidate) {
    if (!candidate || !candidate.halfEligibility || !Array.isArray(candidate.halfEligibility.hardFailures)) {
      return "";
    }
    return (candidate.halfEligibility.hardFailures[0] && candidate.halfEligibility.hardFailures[0].code) || "";
  }

  function getAdaptiveCandidateMinimumMediaHeight(candidate, contentProfile) {
    var profile = contentProfile || candidate && candidate.contentProfile || {};
    if (!profile.hasMedia || profile.hasMapContent || profile.hasQrContent) {
      return 0;
    }
    var orientation = String(candidate && candidate.orientation || profile.mediaOrientation || "square");
    if (orientation === "portrait") {
      return PDF_ADAPTIVE_MIN_PORTRAIT_MEDIA_HEIGHT;
    }
    if (orientation === "landscape") {
      return PDF_ADAPTIVE_MIN_LANDSCAPE_MEDIA_HEIGHT;
    }
    return PDF_ADAPTIVE_MIN_SQUARE_MEDIA_HEIGHT;
  }

  function buildAdaptiveHalfCandidateEligibility(candidate, cardPlan) {
    var plan = cardPlan || {};
    var contentProfile = plan.contentProfile || candidate && candidate.contentProfile || {};
    var hardFailures = [];
    var softFailures = [];
    var textLength = Number(plan.textLength || candidate && candidate.textLength || 0);
    var isCompact = candidate && candidate.kind === "compact";
    var measuredHeight = Number(candidate && candidate.measuredHeight || 0);
    var textHeight = Number(candidate && candidate.textHeight || 0);
    var headerHeight = Number(candidate && candidate.headerHeight || 0);
    var mediaHeight = Number(candidate && (candidate.mediaRegionHeight || candidate.mediaHeight) || 0);
    var mediaMinimum = getAdaptiveCandidateMinimumMediaHeight(candidate, contentProfile);

    function addHard(code, actual, limit) {
      hardFailures.push({
        code: code,
        severity: "hard",
        actual: Number(actual || 0),
        limit: Number(limit || 0)
      });
    }

    function addSoft(code, actual, limit, penalty) {
      softFailures.push({
        code: code,
        severity: "soft",
        actual: Number(actual || 0),
        limit: Number(limit || 0),
        penalty: Number(penalty || 0)
      });
    }

    if (!candidate || candidate.isWide) {
      addHard("not-half-candidate", 1, 0);
    }
    if ((candidate && candidate.qualityWarnings || []).indexOf("below-minimum-typography") !== -1) {
      addHard("below-minimum-typography", 1, 0);
    }
    if ((candidate && candidate.qualityWarnings || []).indexOf("card-containment-overflow") !== -1) {
      addHard("card-containment-overflow", Number(candidate.containmentOverflow || 0), PDF_ADAPTIVE_CARD_CONTAINMENT_TOLERANCE_PX);
    }
    if ((candidate && candidate.qualityWarnings || []).indexOf("media-placement-blocker") !== -1) {
      addHard(
        "media-placement-blocker",
        Number(candidate && candidate.mediaVisualPlacement && candidate.mediaVisualPlacement.visibleLetterboxPercent || 0),
        PDF_ADAPTIVE_MEDIA_VISUAL_BLOCKER_LETTERBOX_PERCENT
      );
    }
    if (mediaMinimum && mediaHeight < mediaMinimum) {
      addHard("media-below-useful-minimum", mediaHeight, mediaMinimum);
    }
    if (isCompact) {
      if (textLength > PDF_ADAPTIVE_COMPACT_TEXT_LIMIT) {
        addSoft("compact-text-length", textLength, PDF_ADAPTIVE_COMPACT_TEXT_LIMIT, 44 + ((textLength - PDF_ADAPTIVE_COMPACT_TEXT_LIMIT) * 0.08));
      }
      if (headerHeight > PDF_ADAPTIVE_HALF_CARD_HEADER_HARD_LIMIT) {
        addHard("header-height-hard-limit", headerHeight, PDF_ADAPTIVE_HALF_CARD_HEADER_HARD_LIMIT);
      } else if (headerHeight > PDF_ADAPTIVE_HALF_CARD_HEADER_HEIGHT_LIMIT) {
        addSoft("header-height-warning", headerHeight, PDF_ADAPTIVE_HALF_CARD_HEADER_HEIGHT_LIMIT, 28 + ((headerHeight - PDF_ADAPTIVE_HALF_CARD_HEADER_HEIGHT_LIMIT) * 1.1));
      }
      if (measuredHeight > PDF_ADAPTIVE_COMPACT_HEIGHT_HARD_LIMIT) {
        addHard("compact-height-hard-limit", measuredHeight, PDF_ADAPTIVE_COMPACT_HEIGHT_HARD_LIMIT);
      } else if (measuredHeight > PDF_ADAPTIVE_COMPACT_HEIGHT_LIMIT) {
        addSoft("compact-height-warning", measuredHeight, PDF_ADAPTIVE_COMPACT_HEIGHT_LIMIT, 34 + ((measuredHeight - PDF_ADAPTIVE_COMPACT_HEIGHT_LIMIT) * 0.9));
      }
      if (textHeight > PDF_ADAPTIVE_COMPACT_TEXT_HEIGHT_HARD_LIMIT) {
        addHard("compact-text-height-hard-limit", textHeight, PDF_ADAPTIVE_COMPACT_TEXT_HEIGHT_HARD_LIMIT);
      } else if (textHeight > PDF_ADAPTIVE_COMPACT_TEXT_HEIGHT_LIMIT) {
        addSoft("compact-text-height-warning", textHeight, PDF_ADAPTIVE_COMPACT_TEXT_HEIGHT_LIMIT, 24 + ((textHeight - PDF_ADAPTIVE_COMPACT_TEXT_HEIGHT_LIMIT) * 0.75));
      }
    } else {
      if (textLength > PDF_ADAPTIVE_MEDIUM_TEXT_LIMIT) {
        addSoft("medium-text-length", textLength, PDF_ADAPTIVE_MEDIUM_TEXT_LIMIT, 36 + ((textLength - PDF_ADAPTIVE_MEDIUM_TEXT_LIMIT) * 0.06));
      }
      if (headerHeight > PDF_ADAPTIVE_HALF_CARD_HEADER_HARD_LIMIT) {
        addHard("header-height-hard-limit", headerHeight, PDF_ADAPTIVE_HALF_CARD_HEADER_HARD_LIMIT);
      } else if (headerHeight > PDF_ADAPTIVE_HALF_CARD_HEADER_HEIGHT_LIMIT) {
        addSoft("header-height-warning", headerHeight, PDF_ADAPTIVE_HALF_CARD_HEADER_HEIGHT_LIMIT, 24 + ((headerHeight - PDF_ADAPTIVE_HALF_CARD_HEADER_HEIGHT_LIMIT) * 0.85));
      }
      if (measuredHeight > PDF_ADAPTIVE_MEDIUM_HEIGHT_HARD_LIMIT) {
        addHard("medium-height-hard-limit", measuredHeight, PDF_ADAPTIVE_MEDIUM_HEIGHT_HARD_LIMIT);
      } else if (measuredHeight > PDF_ADAPTIVE_MEDIUM_HEIGHT_LIMIT) {
        addSoft("medium-height-warning", measuredHeight, PDF_ADAPTIVE_MEDIUM_HEIGHT_LIMIT, 28 + ((measuredHeight - PDF_ADAPTIVE_MEDIUM_HEIGHT_LIMIT) * 0.72));
      }
      if (textHeight > PDF_ADAPTIVE_MEDIUM_TEXT_HEIGHT_HARD_LIMIT) {
        addHard("medium-text-height-hard-limit", textHeight, PDF_ADAPTIVE_MEDIUM_TEXT_HEIGHT_HARD_LIMIT);
      } else if (textHeight > PDF_ADAPTIVE_MEDIUM_TEXT_HEIGHT_LIMIT) {
        addSoft("medium-text-height-warning", textHeight, PDF_ADAPTIVE_MEDIUM_TEXT_HEIGHT_LIMIT, 20 + ((textHeight - PDF_ADAPTIVE_MEDIUM_TEXT_HEIGHT_LIMIT) * 0.55));
      }
    }

    return {
      valid: hardFailures.length === 0,
      hardFailures: hardFailures,
      softFailures: softFailures,
      softPenalty: Number(softFailures.reduce(function (total, failure) {
        return total + Number(failure.penalty || 0);
      }, 0).toFixed(2))
    };
  }

  function getAdaptiveParkingLayoutVariant(cardNode, direction) {
    if (!cardNode) {
      return "parking-map-right-balanced";
    }
    var normalizedDirection = String(direction || "ltr").toLowerCase();
    var roadList = cardNode.querySelector(".pi-export-card-body ul, .pi-export-card-body ol");
    var hasQrPanel = !!cardNode.querySelector(".pi-export-card-qr-panel .pi-export-qr-frame");
    var hasLink = !!cardNode.querySelector(".pi-export-card-link");
    if (hasQrPanel && (hasLink || roadList)) {
      if (normalizedDirection === "rtl") {
        return "parking-map-right-actions-stack";
      }
      if (roadList) {
        var actionItems = Array.prototype.slice.call(roadList.querySelectorAll(":scope > li")).map(function (itemNode) {
          return normalizeText(itemNode.textContent || "");
        }).filter(Boolean);
        var actionLongestItem = actionItems.reduce(function (maxLength, itemText) {
          return Math.max(maxLength, itemText.length);
        }, 0);
        if (!actionItems.length || (actionItems.length <= 8 && actionLongestItem <= 42)) {
          return "parking-map-right-actions-stack";
        }
      } else {
        return "parking-map-right-actions-stack";
      }
    }
    if (!roadList) {
      return "parking-map-right-balanced";
    }
    var items = Array.prototype.slice.call(roadList.querySelectorAll(":scope > li")).map(function (itemNode) {
      return normalizeText(itemNode.textContent || "");
    }).filter(Boolean);
    var longestItem = items.reduce(function (maxLength, itemText) {
      return Math.max(maxLength, itemText.length);
    }, 0);
    if (normalizedDirection !== "rtl" && items.length >= 6 && longestItem <= 20) {
      return "parking-map-right-list-columns";
    }
    return "parking-map-right-balanced";
  }

  function getAdaptiveParkingCompositeVariant(parkingTextCard, parkingMapNode, direction, scopeNode) {
    var scope = scopeNode || parkingTextCard || parkingMapNode;
    if (!scope) {
      return "parking-map-right-balanced";
    }
    var normalizedDirection = String(direction || "ltr").toLowerCase();
    var roadList = (parkingTextCard && parkingTextCard.querySelector(".pi-export-card-body ul, .pi-export-card-body ol")) ||
      scope.querySelector(".pi-export-card-body ul, .pi-export-card-body ol");
    var hasQrPanel = !!(
      (parkingTextCard && parkingTextCard.querySelector(".pi-export-card-qr-panel .pi-export-qr-frame")) ||
      (parkingMapNode && parkingMapNode.querySelector(".pi-export-card-qr-panel .pi-export-qr-frame")) ||
      scope.querySelector(".pi-export-card-qr-panel .pi-export-qr-frame")
    );
    var hasLink = !!(
      (parkingTextCard && parkingTextCard.querySelector(".pi-export-card-link")) ||
      (parkingMapNode && parkingMapNode.querySelector(".pi-export-card-link")) ||
      scope.querySelector(".pi-export-card-link")
    );
    if (hasQrPanel && hasLink && parkingMapNode) {
      if (normalizedDirection === "rtl") {
        return "parking-map-right-actions-stack";
      }
      if (!roadList) {
        return "parking-map-right-actions-stack";
      }
      var mapActionItems = Array.prototype.slice.call(roadList.querySelectorAll(":scope > li")).map(function (itemNode) {
        return normalizeText(itemNode.textContent || "");
      }).filter(Boolean);
      var mapActionLongestItem = mapActionItems.reduce(function (maxLength, itemText) {
        return Math.max(maxLength, itemText.length);
      }, 0);
      if (!mapActionItems.length || (mapActionItems.length <= 12 && mapActionLongestItem <= 64)) {
        return "parking-map-right-actions-stack";
      }
    }
    if (hasQrPanel && (hasLink || roadList)) {
      if (normalizedDirection === "rtl") {
        return "parking-map-right-actions-stack";
      }
      if (!roadList) {
        return "parking-map-right-actions-stack";
      }
      var actionItems = Array.prototype.slice.call(roadList.querySelectorAll(":scope > li")).map(function (itemNode) {
        return normalizeText(itemNode.textContent || "");
      }).filter(Boolean);
      var actionLongestItem = actionItems.reduce(function (maxLength, itemText) {
        return Math.max(maxLength, itemText.length);
      }, 0);
      if (!actionItems.length || (actionItems.length <= 10 && actionLongestItem <= 56)) {
        return "parking-map-right-actions-stack";
      }
    }
    return getAdaptiveParkingLayoutVariant(parkingTextCard || scope, normalizedDirection);
  }

  function createExportRectDiagnostic(rect) {
    if (!rect) {
      return null;
    }
    return {
      left: Number(rect.left.toFixed(2)),
      top: Number(rect.top.toFixed(2)),
      right: Number(rect.right.toFixed(2)),
      bottom: Number(rect.bottom.toFixed(2)),
      width: Number(rect.width.toFixed(2)),
      height: Number(rect.height.toFixed(2)),
      centerX: Number((rect.left + (rect.width / 2)).toFixed(2)),
      centerY: Number((rect.top + (rect.height / 2)).toFixed(2))
    };
  }

  function parsePdfJsonAttribute(value, fallbackValue) {
    if (!value) {
      return fallbackValue;
    }
    try {
      return JSON.parse(String(value));
    } catch (error) {
      return fallbackValue;
    }
  }

  function buildAdaptiveDescendantLabel(node) {
    if (!node || !node.tagName) {
      return "";
    }
    var label = node.tagName.toLowerCase();
    var region = String(node.getAttribute("data-card-region") || "").trim();
    if (region) {
      label += "[data-card-region='" + region + "']";
    }
    if (node.classList && node.classList.length) {
      label += "." + Array.prototype.slice.call(node.classList).join(".");
    }
    return label;
  }

  function hasAdaptiveDirectVisibleText(node) {
    if (!node || !node.childNodes) {
      return false;
    }
    return Array.prototype.slice.call(node.childNodes).some(function (childNode) {
      return childNode && childNode.nodeType === 3 && normalizeText(childNode.textContent || "");
    });
  }

  function isAdaptiveContainmentRelevantNode(node, descendantStyles) {
    if (!node || !descendantStyles || !node.tagName) {
      return false;
    }
    var tagName = node.tagName.toLowerCase();
    if (/^(img|svg|canvas|iframe|a|p|li|h1|h2|h3|h4|h5|h6|span)$/.test(tagName)) {
      return true;
    }
    if (node.classList) {
      if (
        node.classList.contains("pi-export-card-title") ||
        node.classList.contains("pi-export-card-caption") ||
        node.classList.contains("pi-export-card-link") ||
        node.classList.contains("pi-export-card-media") ||
        node.classList.contains("pi-export-card-image-frame") ||
        node.classList.contains("pi-export-map-image-frame--block") ||
        node.classList.contains("pi-export-qr-frame")
      ) {
        return true;
      }
    }
    if (hasAdaptiveDirectVisibleText(node)) {
      return true;
    }
    var hasBorder =
      (parseFloat(descendantStyles.borderTopWidth || "0") || 0) > 0 ||
      (parseFloat(descendantStyles.borderRightWidth || "0") || 0) > 0 ||
      (parseFloat(descendantStyles.borderBottomWidth || "0") || 0) > 0 ||
      (parseFloat(descendantStyles.borderLeftWidth || "0") || 0) > 0;
    if (hasBorder) {
      return true;
    }
    return descendantStyles.backgroundColor && descendantStyles.backgroundColor !== "rgba(0, 0, 0, 0)" && descendantStyles.backgroundColor !== "transparent";
  }

  function collectAdaptiveCardContainment(cardNode) {
    if (!cardNode || !cardNode.getBoundingClientRect) {
      return {
        cardBounds: null,
        innerBounds: null,
        descendantBounds: [],
        overflowTop: 0,
        overflowRight: 0,
        overflowBottom: 0,
        overflowLeft: 0,
        maxOverflow: 0,
        valid: true
      };
    }
    var cardRect = cardNode.getBoundingClientRect();
    var cardStyles = window.getComputedStyle(cardNode);
    var borderLeft = parseFloat(cardStyles.borderLeftWidth || "0") || 0;
    var borderRight = parseFloat(cardStyles.borderRightWidth || "0") || 0;
    var borderTop = parseFloat(cardStyles.borderTopWidth || "0") || 0;
    var borderBottom = parseFloat(cardStyles.borderBottomWidth || "0") || 0;
    var innerBounds = {
      left: cardRect.left + borderLeft,
      top: cardRect.top + borderTop,
      right: cardRect.right - borderRight,
      bottom: cardRect.bottom - borderBottom
    };
    var maxTop = 0;
    var maxRight = 0;
    var maxBottom = 0;
    var maxLeft = 0;
    var overflowingDescendants = [];

    Array.prototype.slice.call(cardNode.querySelectorAll("*")).forEach(function (descendantNode) {
      if (!descendantNode || !descendantNode.getBoundingClientRect) {
        return;
      }
      var descendantStyles = window.getComputedStyle(descendantNode);
      if (descendantStyles.display === "none" || descendantStyles.visibility === "hidden") {
        return;
      }
      if (!isAdaptiveContainmentRelevantNode(descendantNode, descendantStyles)) {
        return;
      }
      var descendantRect = descendantNode.getBoundingClientRect();
      if (descendantRect.width <= 0 || descendantRect.height <= 0) {
        return;
      }
      var overflowTop = Math.max(0, innerBounds.top - descendantRect.top);
      var overflowRight = Math.max(0, descendantRect.right - innerBounds.right);
      var overflowBottom = Math.max(0, descendantRect.bottom - innerBounds.bottom);
      var overflowLeft = Math.max(0, innerBounds.left - descendantRect.left);
      maxTop = Math.max(maxTop, overflowTop);
      maxRight = Math.max(maxRight, overflowRight);
      maxBottom = Math.max(maxBottom, overflowBottom);
      maxLeft = Math.max(maxLeft, overflowLeft);
      if (
        overflowTop > PDF_ADAPTIVE_CARD_CONTAINMENT_TOLERANCE_PX ||
        overflowRight > PDF_ADAPTIVE_CARD_CONTAINMENT_TOLERANCE_PX ||
        overflowBottom > PDF_ADAPTIVE_CARD_CONTAINMENT_TOLERANCE_PX ||
        overflowLeft > PDF_ADAPTIVE_CARD_CONTAINMENT_TOLERANCE_PX
      ) {
        overflowingDescendants.push({
          descendant: buildAdaptiveDescendantLabel(descendantNode),
          descendantBounds: createExportRectDiagnostic(descendantRect),
          overflowDirection: [
            overflowTop > PDF_ADAPTIVE_CARD_CONTAINMENT_TOLERANCE_PX ? "top" : "",
            overflowRight > PDF_ADAPTIVE_CARD_CONTAINMENT_TOLERANCE_PX ? "right" : "",
            overflowBottom > PDF_ADAPTIVE_CARD_CONTAINMENT_TOLERANCE_PX ? "bottom" : "",
            overflowLeft > PDF_ADAPTIVE_CARD_CONTAINMENT_TOLERANCE_PX ? "left" : ""
          ].filter(Boolean),
          overflowTop: Number(overflowTop.toFixed(2)),
          overflowRight: Number(overflowRight.toFixed(2)),
          overflowBottom: Number(overflowBottom.toFixed(2)),
          overflowLeft: Number(overflowLeft.toFixed(2)),
          computedStyles: {
            overflow: descendantStyles.overflow,
            overflowX: descendantStyles.overflowX,
            overflowY: descendantStyles.overflowY,
            minWidth: descendantStyles.minWidth,
            minHeight: descendantStyles.minHeight,
            width: descendantStyles.width,
            height: descendantStyles.height,
            maxWidth: descendantStyles.maxWidth,
            maxHeight: descendantStyles.maxHeight,
            objectFit: descendantStyles.objectFit,
            objectPosition: descendantStyles.objectPosition,
            transform: descendantStyles.transform,
            position: descendantStyles.position,
            marginTop: descendantStyles.marginTop,
            marginRight: descendantStyles.marginRight,
            marginBottom: descendantStyles.marginBottom,
            marginLeft: descendantStyles.marginLeft
          }
        });
      }
    });

    var maxOverflow = Math.max(maxTop, maxRight, maxBottom, maxLeft);
    return {
      cardBounds: createExportRectDiagnostic(cardRect),
      innerBounds: createExportRectDiagnostic({
        left: innerBounds.left,
        top: innerBounds.top,
        right: innerBounds.right,
        bottom: innerBounds.bottom,
        width: Math.max(0, innerBounds.right - innerBounds.left),
        height: Math.max(0, innerBounds.bottom - innerBounds.top)
      }),
      descendantBounds: overflowingDescendants,
      overflowTop: Number(maxTop.toFixed(2)),
      overflowRight: Number(maxRight.toFixed(2)),
      overflowBottom: Number(maxBottom.toFixed(2)),
      overflowLeft: Number(maxLeft.toFixed(2)),
      maxOverflow: Number(maxOverflow.toFixed(2)),
      valid: maxOverflow <= PDF_ADAPTIVE_CARD_CONTAINMENT_TOLERANCE_PX
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
      semanticRole === "parking-map-panel" ||
      node.classList.contains("pi-export-map") ||
      node.classList.contains("pi-export-card") ||
      node.classList.contains("pi-export-parking-map");
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

  function createAdaptiveBoundsDiagnostic(bounds) {
    if (!bounds) {
      return null;
    }
    return {
      left: Number(bounds.left.toFixed(2)),
      top: Number(bounds.top.toFixed(2)),
      right: Number(bounds.right.toFixed(2)),
      bottom: Number(bounds.bottom.toFixed(2)),
      width: Number(bounds.width.toFixed(2)),
      height: Number(bounds.height.toFixed(2)),
      centerX: Number(bounds.centerX.toFixed(2)),
      centerY: Number(bounds.centerY.toFixed(2))
    };
  }

  function getAdaptiveLastMeaningfulDescendantRect(node) {
    if (!node) {
      return null;
    }
    var descendants = Array.prototype.slice.call(node.querySelectorAll("*")).filter(function (descendantNode) {
      if (!descendantNode || !descendantNode.getBoundingClientRect) {
        return false;
      }
      var styles = window.getComputedStyle(descendantNode);
      if (styles.display === "none" || styles.visibility === "hidden" || styles.position === "absolute") {
        return false;
      }
      var rect = descendantNode.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        return false;
      }
      return normalizeText(descendantNode.textContent || "").length > 0 ||
        descendantNode.tagName === "IMG" ||
        descendantNode.tagName === "A";
    });
    if (!descendants.length) {
      var nodeText = normalizeText(node.textContent || "");
      var ownRect = node.getBoundingClientRect();
      if (
        (nodeText.length > 0 || node.tagName === "IMG" || node.tagName === "A") &&
        ownRect.width > 0 &&
        ownRect.height > 0
      ) {
        return ownRect;
      }
      return null;
    }
    return descendants.reduce(function (lastRect, descendantNode) {
      var rect = descendantNode.getBoundingClientRect();
      if (!lastRect || rect.bottom > lastRect.bottom) {
        return rect;
      }
      return lastRect;
    }, null);
  }

  function getAdaptiveMeaningfulContentReferenceRect(cardNode) {
    if (!cardNode) {
      return null;
    }
    var footerRect = getAdaptiveLastMeaningfulDescendantRect(cardNode.querySelector("[data-card-region='footer']"));
    if (footerRect) {
      return footerRect;
    }
    var bodyRect = getAdaptiveLastMeaningfulDescendantRect(cardNode.querySelector("[data-card-region='body']"));
    if (bodyRect) {
      return bodyRect;
    }
    var headerNode = cardNode.querySelector(".pi-export-card-head");
    if (!headerNode) {
      return null;
    }
    var headerCandidates = [
      ".pi-export-card-title",
      ".pi-export-step-badge",
      ".pi-export-card-caption",
      ".pi-export-card-link"
    ].map(function (selector) {
      return headerNode.querySelector(selector);
    }).filter(function (node) {
      return !!node && !!node.getBoundingClientRect;
    }).map(function (node) {
      return node.getBoundingClientRect();
    }).filter(function (rect) {
      return rect.width > 0 && rect.height > 0;
    });
    if (headerCandidates.length) {
      return headerCandidates.reduce(function (lastRect, rect) {
        if (!lastRect || rect.bottom > lastRect.bottom) {
          return rect;
        }
        return lastRect;
      }, null);
    }
    return headerNode.getBoundingClientRect();
  }

  function getAdaptiveMediaReferenceRect(cardNode) {
    if (!cardNode) {
      return null;
    }
    var mediaNode = cardNode.querySelector("[data-card-region='media']");
    var frameNode = mediaNode ? mediaNode.querySelector("[data-export-image-frame]") : null;
    return frameNode ? frameNode.getBoundingClientRect() : (mediaNode ? mediaNode.getBoundingClientRect() : null);
  }

  function getAdaptiveContentMediaRelationship(layout) {
    if (isAdaptiveStackedLayout(layout)) {
      return "stacked";
    }
    if (isAdaptiveSideMediaLayout(layout)) {
      return "side";
    }
    return "none";
  }

  function classifyAdaptiveMediaVisualPlacement(details) {
    var warnings = [];
    var blockers = [];
    var horizontalLetterboxPercent = Number(details && details.horizontalLetterboxPercent || 0);
    var verticalLetterboxPercent = Number(details && details.verticalLetterboxPercent || 0);
    var frameMismatch = Number(details && details.frameSourceAspectMismatch || 0);
    var topBlank = Number(details && details.topBlankBelowHeader || 0);
    var bottomBlank = Number(details && details.bottomBlankBelowMedia || 0);
    var frameToCardCenterDeltaY = Number(details && details.frameToCardInnerCentreDeltaY || 0);
    var frameToRegionCenterDeltaY = Number(details && details.frameToMediaRegionCentreDeltaY || 0);
    var hasProjection = !!(details && details.hasProjection);
    var titleToMediaGapDelta = Math.abs(Number(details && details.titleToMediaGapDelta || 0));
    var headerHeightDelta = Math.abs(Number(details && details.headerHeightDelta || 0));
    var relationship = String(details && details.contentMediaRelationship || "none");
    var alignmentMode = String(details && details.mediaVerticalAlignmentMode || "natural");
    var hasMapContent = !!(details && details.hasMapContent);
    var hasQrContent = !!(details && details.hasQrContent);

    function isCenteredMode() {
      return alignmentMode === "content-group-centred" || alignmentMode === "balanced-between-header-and-card-bottom";
    }

    function isHeaderAnchoredMode() {
      return alignmentMode === "header-aligned" || alignmentMode === "natural";
    }

    if (
      horizontalLetterboxPercent > PDF_ADAPTIVE_MEDIA_LETTERBOX_BLOCKER_RATIO ||
      verticalLetterboxPercent > PDF_ADAPTIVE_MEDIA_LETTERBOX_BLOCKER_RATIO
    ) {
      blockers.push("excessive-contain-letterbox");
    } else if (
      horizontalLetterboxPercent > PDF_ADAPTIVE_MEDIA_LETTERBOX_WARNING_RATIO ||
      verticalLetterboxPercent > PDF_ADAPTIVE_MEDIA_LETTERBOX_WARNING_RATIO
    ) {
      warnings.push("excessive-contain-letterbox");
    }

    if (frameMismatch > PDF_ADAPTIVE_MEDIA_FRAME_RATIO_BLOCKER) {
      blockers.push("frame-source-aspect-mismatch");
    } else if (frameMismatch > PDF_ADAPTIVE_MEDIA_FRAME_RATIO_WARNING) {
      warnings.push("frame-source-aspect-mismatch");
    }

    if (relationship === "stacked") {
      if (
        bottomBlank > PDF_ADAPTIVE_MEDIA_BALANCE_GAP_BLOCKER_PX &&
        bottomBlank > (topBlank * PDF_ADAPTIVE_MEDIA_BALANCE_WARNING_RATIO) &&
        frameToCardCenterDeltaY > 32
      ) {
        blockers.push("media-top-heavy");
      } else if (
        bottomBlank > PDF_ADAPTIVE_MEDIA_BALANCE_GAP_WARNING_PX &&
        bottomBlank > (topBlank * PDF_ADAPTIVE_MEDIA_BALANCE_WARNING_RATIO) &&
        frameToCardCenterDeltaY > 18
      ) {
        warnings.push("media-top-heavy");
      }

      if (
        topBlank > PDF_ADAPTIVE_MEDIA_BALANCE_GAP_BLOCKER_PX &&
        topBlank > (bottomBlank * PDF_ADAPTIVE_MEDIA_BALANCE_WARNING_RATIO) &&
        frameToCardCenterDeltaY > 32
      ) {
        blockers.push("media-bottom-heavy");
      } else if (
        topBlank > PDF_ADAPTIVE_MEDIA_BALANCE_GAP_WARNING_PX &&
        topBlank > (bottomBlank * PDF_ADAPTIVE_MEDIA_BALANCE_WARNING_RATIO) &&
        frameToCardCenterDeltaY > 18
      ) {
        warnings.push("media-bottom-heavy");
      }
    } else if (relationship === "side") {
      var insetGap = Math.abs(bottomBlank - topBlank);
      if (hasMapContent || hasQrContent) {
        // Composite map/QR cards intentionally reserve asymmetric text/footer space
        // beside the media frame, so the plain photo-card side-balance heuristic is
        // not a reliable blocker for them.
      } else if (isCenteredMode()) {
        if (insetGap > PDF_ADAPTIVE_MEDIA_BALANCE_GAP_BLOCKER_PX && frameToRegionCenterDeltaY > 18) {
          blockers.push(bottomBlank > topBlank ? "media-top-heavy" : "media-bottom-heavy");
        } else if (insetGap > PDF_ADAPTIVE_MEDIA_BALANCE_GAP_WARNING_PX && frameToRegionCenterDeltaY > 10) {
          warnings.push(bottomBlank > topBlank ? "media-top-heavy" : "media-bottom-heavy");
        }
      } else if (isHeaderAnchoredMode()) {
        if (
          bottomBlank > (PDF_ADAPTIVE_MEDIA_BALANCE_GAP_BLOCKER_PX * 2) &&
          bottomBlank > (topBlank + PDF_ADAPTIVE_MEDIA_BALANCE_GAP_BLOCKER_PX) &&
          frameToRegionCenterDeltaY > 36
        ) {
          blockers.push("media-top-heavy");
        } else if (
          bottomBlank > (PDF_ADAPTIVE_MEDIA_BALANCE_GAP_WARNING_PX * 2) &&
          bottomBlank > (topBlank + PDF_ADAPTIVE_MEDIA_BALANCE_GAP_WARNING_PX) &&
          frameToRegionCenterDeltaY > 24
        ) {
          warnings.push("media-top-heavy");
        }

        if (
          topBlank > (PDF_ADAPTIVE_MEDIA_BALANCE_GAP_BLOCKER_PX * 2) &&
          topBlank > (bottomBlank + PDF_ADAPTIVE_MEDIA_BALANCE_GAP_BLOCKER_PX) &&
          frameToRegionCenterDeltaY > 36
        ) {
          blockers.push("media-bottom-heavy");
        } else if (
          topBlank > (PDF_ADAPTIVE_MEDIA_BALANCE_GAP_WARNING_PX * 2) &&
          topBlank > (bottomBlank + PDF_ADAPTIVE_MEDIA_BALANCE_GAP_WARNING_PX) &&
          frameToRegionCenterDeltaY > 24
        ) {
          warnings.push("media-bottom-heavy");
        }
      }
    }

    if (hasProjection) {
      if (
        titleToMediaGapDelta > PDF_ADAPTIVE_RENDER_PROJECTION_DELTA_BLOCKER_PX ||
        headerHeightDelta > PDF_ADAPTIVE_RENDER_PROJECTION_DELTA_BLOCKER_PX
      ) {
        blockers.push("projection-render-mismatch");
      } else if (
        titleToMediaGapDelta > PDF_ADAPTIVE_RENDER_PROJECTION_DELTA_WARNING_PX ||
        headerHeightDelta > PDF_ADAPTIVE_RENDER_PROJECTION_DELTA_WARNING_PX
      ) {
        warnings.push("projection-render-mismatch");
      }
    }

    if (blockers.length) {
      return {
        severity: "blocker",
        issues: blockers,
        visualIssue: blockers[0]
      };
    }
    if (warnings.length) {
      return {
        severity: "visual-warning",
        issues: warnings,
        visualIssue: warnings[0]
      };
    }
    return {
      severity: "ok",
      issues: [],
      visualIssue: "clean"
    };
  }

  function collectAdaptiveMediaVisualPlacement(cardNode) {
    if (!cardNode) {
      return null;
    }
    var imageNode = cardNode.querySelector("img[data-export-image-role='card']");
    var mediaRegionNode = cardNode.querySelector("[data-card-region='media']");
    var frameNode = mediaRegionNode ? mediaRegionNode.querySelector("[data-export-image-frame]") : null;
    if (!imageNode || !mediaRegionNode || !frameNode || !imageNode.naturalWidth || !imageNode.naturalHeight) {
      return null;
    }
    var headerNode = cardNode.querySelector("[data-card-region='header']");
    var containment = collectAdaptiveCardContainment(cardNode);
    var cardInnerBounds = containment && containment.innerBounds
      ? {
          left: containment.innerBounds.left,
          top: containment.innerBounds.top,
          right: containment.innerBounds.right,
          bottom: containment.innerBounds.bottom,
          width: Math.max(0, containment.innerBounds.right - containment.innerBounds.left),
          height: Math.max(0, containment.innerBounds.bottom - containment.innerBounds.top),
          centerX: containment.innerBounds.left + ((containment.innerBounds.right - containment.innerBounds.left) / 2),
          centerY: containment.innerBounds.top + ((containment.innerBounds.bottom - containment.innerBounds.top) / 2)
        }
      : null;
    var mediaRegionRect = mediaRegionNode.getBoundingClientRect();
    var mediaFrameRect = frameNode.getBoundingClientRect();
    var imageRect = imageNode.getBoundingClientRect();
    var mediaRegionInnerBounds = getNodeInnerBounds(mediaRegionNode);
    var mediaFrameInner = getNodeInnerBounds(frameNode);
    var headerRect = headerNode ? headerNode.getBoundingClientRect() : null;
    var meaningfulContentRect = getAdaptiveMeaningfulContentReferenceRect(cardNode);
    var mediaReferenceRect = getAdaptiveMediaReferenceRect(cardNode) || mediaFrameRect;
    var selectedLayout = String(cardNode.getAttribute("data-pdf-selected-variant") || "");
    var contentMediaRelationship = getAdaptiveContentMediaRelationship(selectedLayout);
    var hasMapContent = !!cardNode.querySelector("img[data-export-image-role='map']");
    var hasQrContent = !!cardNode.querySelector(".pi-export-card-qr-panel, .pi-export-qr-panel");
    var naturalRatio = imageNode.naturalWidth / imageNode.naturalHeight;
    var frameRatio = mediaFrameInner && mediaFrameInner.height
      ? (mediaFrameInner.width / mediaFrameInner.height)
      : (mediaFrameRect.width && mediaFrameRect.height ? (mediaFrameRect.width / mediaFrameRect.height) : naturalRatio);
    var imageRatio = imageRect.height ? (imageRect.width / imageRect.height) : naturalRatio;
    var leftLetterbox = mediaFrameInner ? Math.max(0, imageRect.left - mediaFrameInner.left) : 0;
    var rightLetterbox = mediaFrameInner ? Math.max(0, mediaFrameInner.right - imageRect.right) : 0;
    var topLetterbox = mediaFrameInner ? Math.max(0, imageRect.top - mediaFrameInner.top) : 0;
    var bottomLetterbox = mediaFrameInner ? Math.max(0, mediaFrameInner.bottom - imageRect.bottom) : 0;
    var horizontalLetterboxPercent = mediaFrameInner && mediaFrameInner.width
      ? Math.max(0, (leftLetterbox + rightLetterbox) / mediaFrameInner.width)
      : 0;
    var verticalLetterboxPercent = mediaFrameInner && mediaFrameInner.height
      ? Math.max(0, (topLetterbox + bottomLetterbox) / mediaFrameInner.height)
      : 0;
    var frameSourceAspectMismatch = naturalRatio && frameRatio
      ? Math.max(frameRatio / naturalRatio, naturalRatio / frameRatio)
      : 1;
    var contentReferenceBottom = meaningfulContentRect
      ? meaningfulContentRect.bottom
      : (headerRect ? headerRect.bottom : (cardInnerBounds ? cardInnerBounds.top : mediaFrameRect.top));
    var sideBalanceBounds = mediaRegionInnerBounds || cardInnerBounds;
    var topBlankBelowHeader = contentMediaRelationship === "stacked"
      ? Math.max(0, mediaReferenceRect.top - contentReferenceBottom)
      : Math.max(0, mediaFrameRect.top - (sideBalanceBounds ? sideBalanceBounds.top : mediaFrameRect.top));
    var bottomBlankBelowMedia = contentMediaRelationship === "stacked"
      ? Math.max(0, (cardInnerBounds ? cardInnerBounds.bottom : mediaFrameRect.bottom) - mediaFrameRect.bottom)
      : Math.max(0, (sideBalanceBounds ? sideBalanceBounds.bottom : mediaFrameRect.bottom) - mediaFrameRect.bottom);
    var frameCenterX = mediaFrameRect.left + (mediaFrameRect.width / 2);
    var frameCenterY = mediaFrameRect.top + (mediaFrameRect.height / 2);
    var imageCenterX = imageRect.left + (imageRect.width / 2);
    var imageCenterY = imageRect.top + (imageRect.height / 2);
    var mediaRegionCenterX = mediaRegionRect.left + (mediaRegionRect.width / 2);
    var mediaRegionCenterY = mediaRegionRect.top + (mediaRegionRect.height / 2);
    var cardCenterX = cardInnerBounds ? cardInnerBounds.centerX : frameCenterX;
    var cardCenterY = cardInnerBounds ? cardInnerBounds.centerY : frameCenterY;
    var mediaRegionInnerCenterX = sideBalanceBounds ? sideBalanceBounds.centerX : mediaRegionCenterX;
    var mediaRegionInnerCenterY = sideBalanceBounds ? sideBalanceBounds.centerY : mediaRegionCenterY;
    var rowProjection = {};
    try {
      rowProjection = JSON.parse(cardNode.getAttribute("data-pdf-card-row-projection") || "{}");
    } catch (error) {
      rowProjection = {};
    }
    var hasProjection = !!Object.keys(rowProjection).length;
    var compareHeaderHeight = hasProjection && Math.abs(
      Number(rowProjection.appliedHeaderHeight || 0) -
      Number(rowProjection.naturalHeaderHeight || 0)
    ) > 0.5;
    var measuredTitleToMediaGap = contentMediaRelationship === "stacked"
      ? Math.max(0, mediaReferenceRect.top - contentReferenceBottom)
      : 0;
    var projectedTitleToMediaGap = contentMediaRelationship === "stacked"
      ? Number(rowProjection.projectedTitleToMediaGap || 0)
      : 0;
    var measuredHeaderHeight = headerRect ? headerRect.height : 0;
    var projectedHeaderHeight = Number(rowProjection.appliedHeaderHeight || 0);
    var projectedMediaHeight = Number(rowProjection.projectedMediaHeight || 0);
    var measuredMediaHeight = Number(mediaFrameRect.height || 0);
    var gapAxis = contentMediaRelationship === "stacked" ? "vertical" : "none";
    var classification = classifyAdaptiveMediaVisualPlacement({
      horizontalLetterboxPercent: horizontalLetterboxPercent,
      verticalLetterboxPercent: verticalLetterboxPercent,
      frameSourceAspectMismatch: frameSourceAspectMismatch,
      topBlankBelowHeader: topBlankBelowHeader,
      bottomBlankBelowMedia: bottomBlankBelowMedia,
      frameToCardInnerCentreDeltaY: Math.abs(frameCenterY - cardCenterY),
      frameToMediaRegionCentreDeltaY: Math.abs(frameCenterY - mediaRegionInnerCenterY),
      hasProjection: hasProjection,
      titleToMediaGapDelta: gapAxis === "vertical" ? Math.abs(measuredTitleToMediaGap - projectedTitleToMediaGap) : 0,
      headerHeightDelta: compareHeaderHeight ? Math.abs(measuredHeaderHeight - projectedHeaderHeight) : 0,
      contentMediaRelationship: contentMediaRelationship,
      mediaVerticalAlignmentMode: String(cardNode.getAttribute("data-pdf-media-vertical-alignment") || "natural"),
      hasMapContent: hasMapContent,
      hasQrContent: hasQrContent
    });
    return {
      fitPolicy: String(imageNode.getAttribute("data-export-media-fit-policy") || "contain"),
      framePolicy: String(frameNode.getAttribute("data-pdf-media-frame-policy") || ""),
      mediaVerticalAlignmentMode: String(cardNode.getAttribute("data-pdf-media-vertical-alignment") || "natural"),
      contentMediaRelationship: contentMediaRelationship,
      projectedContentMediaGapAxis: gapAxis,
      measuredContentMediaGapAxis: gapAxis,
      sourceAspectRatio: Number(naturalRatio.toFixed(4)),
      frameAspectRatio: Number(frameRatio.toFixed(4)),
      imageAspectRatio: Number(imageRatio.toFixed(4)),
      frameSourceAspectMismatch: Number(frameSourceAspectMismatch.toFixed(4)),
      cardBounds: createExportRectDiagnostic(cardNode.getBoundingClientRect()),
      cardInnerBounds: createAdaptiveBoundsDiagnostic(cardInnerBounds),
      headerBounds: headerRect ? createExportRectDiagnostic(headerRect) : null,
      meaningfulContentBounds: meaningfulContentRect ? createExportRectDiagnostic(meaningfulContentRect) : null,
      mediaRegionBounds: createExportRectDiagnostic(mediaRegionRect),
      mediaRegionInnerBounds: createAdaptiveBoundsDiagnostic(mediaRegionInnerBounds),
      mediaFrameBounds: createExportRectDiagnostic(mediaFrameRect),
      mediaFrameInnerBounds: createAdaptiveBoundsDiagnostic(mediaFrameInner),
      imageBounds: createExportRectDiagnostic(imageRect),
      imageToFrameCentreDeltaX: Number(Math.abs(imageCenterX - frameCenterX).toFixed(2)),
      imageToFrameCentreDeltaY: Number(Math.abs(imageCenterY - frameCenterY).toFixed(2)),
      frameToCardInnerCentreDeltaX: Number(Math.abs(frameCenterX - cardCenterX).toFixed(2)),
      frameToCardInnerCentreDeltaY: Number(Math.abs(frameCenterY - cardCenterY).toFixed(2)),
      frameToMediaRegionCentreDeltaX: Number(Math.abs(frameCenterX - mediaRegionInnerCenterX).toFixed(2)),
      frameToMediaRegionCentreDeltaY: Number(Math.abs(frameCenterY - mediaRegionInnerCenterY).toFixed(2)),
      mediaRegionToCardInnerCentreDeltaX: Number(Math.abs(mediaRegionCenterX - cardCenterX).toFixed(2)),
      mediaRegionToCardInnerCentreDeltaY: Number(Math.abs(mediaRegionCenterY - cardCenterY).toFixed(2)),
      imageToCardInnerCentreDeltaX: Number(Math.abs(imageCenterX - cardCenterX).toFixed(2)),
      imageToCardInnerCentreDeltaY: Number(Math.abs(imageCenterY - cardCenterY).toFixed(2)),
      topBlankBelowHeader: Number(topBlankBelowHeader.toFixed(2)),
      bottomBlankBelowMedia: Number(bottomBlankBelowMedia.toFixed(2)),
      projectedTitleToMediaGap: Number(projectedTitleToMediaGap.toFixed(2)),
      measuredTitleToMediaGap: Number(measuredTitleToMediaGap.toFixed(2)),
      titleToMediaGapDelta: Number((measuredTitleToMediaGap - projectedTitleToMediaGap).toFixed(2)),
      projectedHeaderHeight: Number(projectedHeaderHeight.toFixed(2)),
      measuredHeaderHeight: Number(measuredHeaderHeight.toFixed(2)),
      headerHeightDelta: Number((measuredHeaderHeight - projectedHeaderHeight).toFixed(2)),
      projectedMediaHeight: Number(projectedMediaHeight.toFixed(2)),
      measuredMediaHeight: Number(measuredMediaHeight.toFixed(2)),
      mediaHeightDelta: Number((measuredMediaHeight - projectedMediaHeight).toFixed(2)),
      leftLetterboxPx: Number(leftLetterbox.toFixed(2)),
      rightLetterboxPx: Number(rightLetterbox.toFixed(2)),
      topLetterboxPx: Number(topLetterbox.toFixed(2)),
      bottomLetterboxPx: Number(bottomLetterbox.toFixed(2)),
      horizontalLetterboxPercent: Number(horizontalLetterboxPercent.toFixed(4)),
      verticalLetterboxPercent: Number(verticalLetterboxPercent.toFixed(4)),
      visibleLetterboxPercent: Number(Math.max(horizontalLetterboxPercent, verticalLetterboxPercent).toFixed(4)),
      severity: classification.severity,
      issues: classification.issues,
      visualIssue: classification.visualIssue
    };
  }

  function estimateAdaptiveTitleLines(titleNode, typographyMetrics) {
    if (!titleNode || !typographyMetrics || !typographyMetrics.titleFontSize || !typographyMetrics.titleLineHeight) {
      return 0;
    }
    var rect = titleNode.getBoundingClientRect();
    if (!rect.height) {
      return 0;
    }
    var lineHeightPixels = typographyMetrics.titleFontSize * typographyMetrics.titleLineHeight;
    return Math.max(1, Math.round(rect.height / Math.max(1, lineHeightPixels)));
  }

  function applyAdaptiveMeasurementVariant(cardNode, variant) {
    var generationDiagnostics = getPdfGenerationDiagnostics();
    generationDiagnostics.counters.adaptiveVariantApplications += 1;
    cardNode.classList.remove(
      "pi-export-card--adaptive-compact",
      "pi-export-card--adaptive-medium",
      "pi-export-card--adaptive-wide",
      "pi-export-card--adaptive-half",
      "pi-export-card--adaptive-full",
      "pi-export-card--adaptive-portrait",
      "pi-export-card--adaptive-landscape",
      "pi-export-card--adaptive-square",
      "pi-export-card--adaptive-layout-half-compact",
      "pi-export-card--adaptive-layout-half-landscape-stacked",
      "pi-export-card--adaptive-layout-half-portrait-side",
      "pi-export-card--adaptive-layout-half-portrait-side-narrow",
      "pi-export-card--adaptive-layout-half-portrait-side-wide",
      "pi-export-card--adaptive-layout-half-portrait-stacked",
      "pi-export-card--adaptive-layout-half-portrait-stacked-compact",
      "pi-export-card--adaptive-layout-wide-horizontal",
      "pi-export-card--adaptive-layout-wide-stacked",
      "pi-export-card--adaptive-layout-parking-map-right",
      "pi-export-card--adaptive-layout-parking-map-right-compact"
    );
    getAdaptiveVariantClassNames(variant).forEach(function (className) {
      cardNode.classList.add(className);
    });
    cardNode.classList.remove("pi-export-card--adaptive-parking-list-columns");
    if (
      String(variant.layout || "").indexOf("parking-map-right") === 0 &&
      getAdaptiveParkingLayoutVariant(
        cardNode,
        cardNode.closest(".pi-export-document") ? cardNode.closest(".pi-export-document").getAttribute("dir") : "ltr"
      ) === "parking-map-right-list-columns"
    ) {
      cardNode.classList.add("pi-export-card--adaptive-parking-list-columns");
      cardNode.setAttribute("data-pdf-parking-variant", "parking-map-right-list-columns");
    } else if (String(variant.layout || "").indexOf("parking-map-right") === 0) {
      cardNode.setAttribute("data-pdf-parking-variant", "parking-map-right-balanced");
      if (!isParkingMutationDiagnosticBypassEnabled()) {
        moveAdaptiveParkingCardActionsToMedia(cardNode, variant);
      }
    } else {
      cardNode.removeAttribute("data-pdf-parking-variant");
    }
    cardNode.setAttribute("data-pdf-selected-variant", String(variant.layout || variant.kind || "medium"));
    cardNode.style.width = (variant.isWide ? PDF_ADAPTIVE_WIDE_WIDTH : PDF_ADAPTIVE_HALF_WIDTH) + "px";
    applyAdaptiveTypographyScale(cardNode, variant.typographyScale || 1);
  }

  function measureAdaptiveCardVariant(cardNode, variant, measurementHost, measurementCache) {
    var cacheKey = [
      String(cardNode.getAttribute("data-pdf-block-id") || cardNode.getAttribute("data-export-source-id") || ""),
      variant.kind,
      variant.orientation,
      variant.isWide ? "wide" : "half",
      variant.layout,
      String(variant.typographyScale || 1)
    ].join("::");
    if (measurementCache[cacheKey]) {
      return measurementCache[cacheKey];
    }
    var clone = cardNode.cloneNode(true);
    getPdfGenerationDiagnostics().counters.adaptiveCandidateMeasurements += 1;
    clone.setAttribute("data-pdf-measurement-clone", "1");
    applyAdaptiveMeasurementVariant(clone, variant);
    measurementHost.appendChild(clone);
    var cloneMediaRegionNode = clone.querySelector("[data-card-region='media']");
    var cloneImageFrame = clone.querySelector(".pi-export-card-media [data-export-image-frame]");
    var cloneImageNode = cloneImageFrame ? cloneImageFrame.querySelector("img") : null;
    var resolvedMediaGeometry = null;
    if (cloneMediaRegionNode && cloneImageFrame && cloneImageNode && cloneImageNode.naturalWidth && cloneImageNode.naturalHeight) {
    var cloneMediaRegionRect = cloneMediaRegionNode.getBoundingClientRect();
    var cloneFrameRect = cloneImageFrame.getBoundingClientRect();
    var cloneAvailableFrameHeight = getAdaptiveAvailableFrameHeight(
      cloneMediaRegionNode,
      cloneImageFrame,
      cloneFrameRect.height || cloneMediaRegionRect.height || 1
    );
    resolvedMediaGeometry = resolveAdaptiveFinalMediaGeometry({
      layout: variant.layout,
      mediaType: getExportMediaType(cloneImageNode),
      fitPolicy: getAdaptiveMediaFitPolicy(cloneImageNode, clone),
      naturalWidth: cloneImageNode.naturalWidth,
      naturalHeight: cloneImageNode.naturalHeight,
      availableWidth: cloneMediaRegionRect.width || cloneFrameRect.width || clone.clientWidth || 1,
      availableHeight: cloneAvailableFrameHeight
    });
      applyAdaptiveMediaFramePolicy(cloneImageFrame, cloneMediaRegionNode, clone, cloneImageNode, {
        availableWidth: resolvedMediaGeometry.availableWidth,
        availableHeight: resolvedMediaGeometry.availableHeight,
        fitPolicy: resolvedMediaGeometry.fitPolicy,
        resolvedGeometry: resolvedMediaGeometry
      });
      applyAdaptiveMediaDimensions(cloneImageFrame, cloneImageNode, {
        fitPolicy: resolvedMediaGeometry.fitPolicy,
        resolvedGeometry: resolvedMediaGeometry
      });
    }
    var cloneRect = clone.getBoundingClientRect();
    var typographyMetrics = getAdaptiveTypographyMetrics(variant.typographyScale || 1);
    var textNode = clone.querySelector(".pi-export-card-text");
    var textRect = textNode ? textNode.getBoundingClientRect() : null;
    var bodyRegionNode = clone.querySelector("[data-card-region='body']");
    var bodyRegionRect = bodyRegionNode ? bodyRegionNode.getBoundingClientRect() : null;
    var footerRegionNode = clone.querySelector("[data-card-region='footer']");
    var footerRegionRect = footerRegionNode ? footerRegionNode.getBoundingClientRect() : null;
    var mediaRegionNode = clone.querySelector("[data-card-region='media']");
    var mediaRegionRect = mediaRegionNode ? mediaRegionNode.getBoundingClientRect() : null;
    var imageFrame = clone.querySelector(".pi-export-card-media [data-export-image-frame]");
    var imageRect = imageFrame ? imageFrame.getBoundingClientRect() : null;
    var headNode = clone.querySelector(".pi-export-card-head");
    var headRect = headNode ? headNode.getBoundingClientRect() : null;
    var titleNode = clone.querySelector(".pi-export-card-title");
    var titleRect = titleNode ? titleNode.getBoundingClientRect() : null;
    var meaningfulContentRect = getAdaptiveMeaningfulContentReferenceRect(clone);
    var mediaReferenceRect = getAdaptiveMediaReferenceRect(clone) || imageRect || mediaRegionRect;
    var contentBottom = measureAdaptiveNodeBottom(clone);
    var containmentDiagnostics = collectAdaptiveCardContainment(clone);
    var mediaVisualPlacement = collectAdaptiveMediaVisualPlacement(clone);
    var height = Math.ceil(cloneRect.height || clone.offsetHeight || clone.scrollHeight || 0);
    var metrics = {
      height: height,
      textHeight: Math.ceil(textRect ? textRect.height : 0),
      bodyHeight: Math.ceil(bodyRegionRect ? bodyRegionRect.height : 0),
      footerHeight: Math.ceil(footerRegionRect ? footerRegionRect.height : 0),
      mediaWidth: Math.ceil(imageRect ? imageRect.width : 0),
      mediaHeight: Math.ceil(imageRect ? imageRect.height : 0),
      mediaRegionHeight: Math.ceil(mediaRegionRect ? mediaRegionRect.height : 0),
      mediaRegionWidth: Math.ceil(mediaRegionRect ? mediaRegionRect.width : 0),
      mediaNaturalWidth: Math.ceil(cloneImageNode ? cloneImageNode.naturalWidth : 0),
      mediaNaturalHeight: Math.ceil(cloneImageNode ? cloneImageNode.naturalHeight : 0),
      headerHeight: Math.ceil(headRect ? headRect.height : 0),
      titleHeight: Math.ceil(titleRect ? titleRect.height : 0),
      contentReferenceBottom: meaningfulContentRect ? Number(meaningfulContentRect.bottom.toFixed(2)) : 0,
      mediaReferenceTop: mediaReferenceRect ? Number(mediaReferenceRect.top.toFixed(2)) : 0,
      contentToMediaGap: meaningfulContentRect && mediaReferenceRect
        ? Number(Math.max(0, mediaReferenceRect.top - meaningfulContentRect.bottom).toFixed(2))
        : 0,
      contentBottom: Number(contentBottom.toFixed(2)),
      naturalContentHeight: Math.ceil(contentBottom || height),
      overflowPixels: Math.max(0, Math.ceil((contentBottom || height) - height)),
      typographyScale: typographyMetrics.typographyScale,
      titleFontSize: typographyMetrics.titleFontSize,
      bodyFontSize: typographyMetrics.bodyFontSize,
      captionFontSize: typographyMetrics.captionFontSize,
      linkFontSize: typographyMetrics.linkFontSize,
      lineHeight: typographyMetrics.bodyLineHeight,
      badgeSize: typographyMetrics.badgeSize,
      titleLines: estimateAdaptiveTitleLines(titleNode, typographyMetrics),
      paragraphCount: getAdaptiveTextBlockParagraphCount(bodyRegionNode),
      hasMedia: !!mediaRegionNode && !!imageRect,
      hasFooter: !!footerRegionNode && Math.ceil(footerRegionRect ? footerRegionRect.height : 0) > 0,
      containmentOverflow: Number(containmentDiagnostics.maxOverflow || 0),
      containmentDiagnostics: containmentDiagnostics,
      mediaUsefulnessRatio: height && imageRect ? Number((Math.max(0, imageRect.height) / height).toFixed(4)) : 0,
      mediaVisualPlacement: mediaVisualPlacement,
      resolvedMediaGeometry: resolvedMediaGeometry,
      qualityWarnings: [],
      layout: variant.layout,
      kind: variant.kind,
      orientation: variant.orientation,
      isWide: !!variant.isWide
    };
    if (!typographyMetrics.isReadable) {
      metrics.qualityWarnings.push("below-minimum-typography");
    }
    if (!containmentDiagnostics.valid) {
      metrics.qualityWarnings.push("card-containment-overflow");
    }
    if (mediaVisualPlacement && mediaVisualPlacement.severity === "blocker") {
      metrics.qualityWarnings.push("media-placement-blocker");
    }
    measurementHost.removeChild(clone);
    measurementCache[cacheKey] = metrics;
    return metrics;
  }

  function createAdaptiveCardCandidates(cardNode, measurementHost, measurementCache) {
    var imageNode = getAdaptiveCardImageNode(cardNode);
    var imageOrientation = imageNode
      ? getAdaptiveImageOrientation(imageNode.naturalWidth || 0, imageNode.naturalHeight || 0)
      : "square";
    var textLength = getAdaptiveCardTextLength(cardNode);
    var isWarning = cardNode.classList.contains("pi-export-card--warning");
    var hasMap = !!cardNode.querySelector("img[data-export-image-role='map']");
    var isParkingMapCard = isAdaptiveParkingCard(cardNode);
    var candidates = [];
    var candidateDiagnostics = [];
    var contentProfile = buildAdaptiveCardContentProfile(cardNode, imageOrientation, null, textLength);

    function pushCandidate(kind, layout, isWide) {
      ADAPTIVE_TYPOGRAPHY_SCALES.forEach(function (scale) {
        var variant = {
          kind: kind,
          layout: layout,
          orientation: imageOrientation,
          isWide: !!isWide,
          typographyScale: scale
        };
        var metrics = measureAdaptiveCardVariant(cardNode, variant, measurementHost, measurementCache);
        if (
          !metrics ||
          (metrics.qualityWarnings || []).indexOf("below-minimum-typography") !== -1 ||
          (metrics.qualityWarnings || []).indexOf("card-containment-overflow") !== -1 ||
          (metrics.qualityWarnings || []).indexOf("media-placement-blocker") !== -1
        ) {
          if (metrics) {
            candidateDiagnostics.push({
              layout: layout,
              widthStrategy: isWide ? "wide" : "half",
              typographyScale: scale,
              measuredHeight: Number(metrics.height || 0),
              naturalContentHeight: Number(metrics.naturalContentHeight || metrics.height || 0),
              headerHeight: Number(metrics.headerHeight || 0),
              textHeight: Number(metrics.textHeight || 0),
              bodyHeight: Number(metrics.bodyHeight || 0),
              footerHeight: Number(metrics.footerHeight || 0),
              projectedMediaDimensions: {
                width: Number(metrics.mediaWidth || 0),
                height: Number(metrics.mediaHeight || 0)
              },
              mediaUsefulness: Number(metrics.mediaUsefulnessRatio || 0),
              containmentResult: !!metrics.containmentDiagnostics && !!metrics.containmentDiagnostics.valid,
              failedPredicates: (metrics.qualityWarnings || []).map(function (warningCode) {
                return {
                  code: warningCode,
                  severity: "hard"
                };
              }),
              state: "rejected"
            });
          }
          return;
        }
        var candidate = Object.assign({}, variant, {
          measuredHeight: metrics.height,
          textHeight: metrics.textHeight,
          bodyHeight: metrics.bodyHeight,
          footerHeight: metrics.footerHeight,
          mediaWidth: metrics.mediaWidth,
          mediaHeight: metrics.mediaHeight,
          mediaRegionHeight: metrics.mediaRegionHeight,
          mediaRegionWidth: metrics.mediaRegionWidth,
          mediaNaturalWidth: metrics.mediaNaturalWidth,
          mediaNaturalHeight: metrics.mediaNaturalHeight,
          naturalContentHeight: metrics.naturalContentHeight,
          contentBottom: metrics.contentBottom,
          contentReferenceBottom: metrics.contentReferenceBottom,
          mediaReferenceTop: metrics.mediaReferenceTop,
          contentToMediaGap: metrics.contentToMediaGap,
          overflowPixels: metrics.overflowPixels,
          titleHeight: metrics.titleHeight,
          headerHeight: metrics.headerHeight,
          titleLines: metrics.titleLines,
          titleFontSize: metrics.titleFontSize,
          bodyFontSize: metrics.bodyFontSize,
          captionFontSize: metrics.captionFontSize,
          linkFontSize: metrics.linkFontSize,
          lineHeight: metrics.lineHeight,
          badgeSize: metrics.badgeSize,
          qualityWarnings: metrics.qualityWarnings || [],
          paragraphCount: metrics.paragraphCount,
          hasMedia: metrics.hasMedia,
          hasFooter: metrics.hasFooter,
          contentProfile: contentProfile,
          mediaUsefulnessRatio: Number(metrics.mediaUsefulnessRatio || 0),
          resolvedMediaGeometry: metrics.resolvedMediaGeometry
        });
        candidates.push(candidate);
      });
    }

    if (isParkingMapCard) {
      pushCandidate("wide", "parking-map-right", true);
      pushCandidate("wide", "parking-map-right-compact", true);
    } else if (!isWarning && !hasMap) {
      if (imageOrientation === "portrait") {
        getAdaptivePortraitSideLayouts().forEach(function (layoutName) {
          pushCandidate("medium", layoutName, false);
        });
        pushCandidate("medium", "half-portrait-stacked", false);
        if (contentProfile.headerAndMediaOnly || contentProfile.mostlyMediaContent) {
          pushCandidate("compact", "half-portrait-stacked-compact", false);
        }
        if (textLength <= PDF_ADAPTIVE_COMPACT_TEXT_LIMIT) {
          pushCandidate("compact", "half-compact", false);
        }
      } else {
        if (textLength <= PDF_ADAPTIVE_COMPACT_TEXT_LIMIT) {
          pushCandidate("compact", "half-compact", false);
        }
        pushCandidate("medium", "half-landscape-stacked", false);
      }
    }

    if (!isParkingMapCard) {
      pushCandidate("wide", "wide-horizontal", true);
    }
    if (!isParkingMapCard && (imageOrientation === "landscape" || textLength > PDF_ADAPTIVE_MEDIUM_TEXT_LIMIT || isWarning || hasMap)) {
      pushCandidate("wide", "wide-stacked", true);
    }

    var portraitSideCandidate = candidates.find(function (candidate) {
      return getAdaptivePortraitSideLayouts().indexOf(candidate.layout) !== -1;
    }) || null;

    candidates.forEach(function (candidate) {
      candidate.halfEligibility = buildAdaptiveHalfCandidateEligibility(candidate, {
        textLength: textLength,
        contentProfile: contentProfile
      });
      candidateDiagnostics.push({
        layout: String(candidate.layout || candidate.kind || "medium"),
        widthStrategy: candidate.isWide ? "wide" : "half",
        typographyScale: Number(candidate.typographyScale || 1),
        measuredHeight: Number(candidate.measuredHeight || 0),
        naturalContentHeight: Number(candidate.naturalContentHeight || candidate.measuredHeight || 0),
        headerHeight: Number(candidate.headerHeight || 0),
        textHeight: Number(candidate.textHeight || 0),
        bodyHeight: Number(candidate.bodyHeight || 0),
        footerHeight: Number(candidate.footerHeight || 0),
        projectedMediaDimensions: {
          width: Number(candidate.mediaWidth || 0),
          height: Number(candidate.mediaHeight || 0)
        },
        mediaUsefulness: Number(candidate.mediaUsefulnessRatio || 0),
        containmentResult: Number(candidate.containmentOverflow || 0) <= PDF_ADAPTIVE_CARD_CONTAINMENT_TOLERANCE_PX,
        failedPredicates: candidate.halfEligibility.valid
          ? candidate.halfEligibility.softFailures.slice()
          : candidate.halfEligibility.hardFailures.concat(candidate.halfEligibility.softFailures),
        state: candidate.halfEligibility.valid ? "available" : "rejected"
      });
    });

    var halfCandidates = candidates.filter(function (candidate) {
      if (candidate.isWide) {
        return false;
      }
      if (!candidate.halfEligibility || !candidate.halfEligibility.valid) {
        return false;
      }
      if (candidate.kind === "compact") {
        if (
          imageOrientation === "portrait" &&
          portraitSideCandidate &&
          candidate.layout === "half-compact" &&
          candidate.measuredHeight >= portraitSideCandidate.measuredHeight - 24
        ) {
          return false;
        }
        return true;
      }
      return true;
    });
    var wideCandidates = candidates.filter(function (candidate) {
      return candidate.isWide;
    });
    var preferredHalfCandidate = halfCandidates.slice().sort(function (left, right) {
      return left.measuredHeight - right.measuredHeight;
    })[0] || null;
    var preferredSingleCandidate = wideCandidates.slice().sort(function (left, right) {
      return left.measuredHeight - right.measuredHeight;
    })[0] || null;

    cardNode.setAttribute("data-pdf-card-orientation", imageOrientation);
    cardNode.setAttribute("data-pdf-card-text-length", String(textLength));
    return {
      cardNode: cardNode,
      blockId: String(cardNode.getAttribute("data-pdf-block-id") || ""),
      orientation: imageOrientation,
      textLength: textLength,
      isWarning: isWarning,
      hasMap: hasMap,
      isParkingMapCard: isParkingMapCard,
      contentProfile: contentProfile,
      candidates: candidates,
      candidateDiagnostics: candidateDiagnostics,
      halfCandidates: halfCandidates,
      wideCandidates: wideCandidates,
      preferredHalfCandidate: preferredHalfCandidate,
      preferredSingleCandidate: preferredSingleCandidate
    };
  }

  function scoreAdaptiveSingleCandidate(cardPlan, candidate, remainingCardCount) {
    if (!cardPlan || !candidate) {
      return Number.POSITIVE_INFINITY;
    }
    var penalty = 0;
    if (cardPlan.textLength <= PDF_ADAPTIVE_COMPACT_TEXT_LIMIT && candidate.kind === "wide") {
      penalty += 55;
    }
    if (candidate.layout === "wide-stacked" && cardPlan.orientation !== "landscape") {
      penalty += 28;
    }
    if (remainingCardCount === 1 && candidate.measuredHeight < 240) {
      penalty += 34;
    }
    if (candidate.layout === "parking-map-right") {
      penalty += 16;
    }
    penalty += getAdaptiveCandidateSoftPenalty(candidate);
    penalty += getAdaptiveCandidateVariantPenalty(candidate, cardPlan);
    if (
      remainingCardCount > 1 &&
      !cardPlan.isParkingMapCard &&
      candidate.isWide &&
      cardPlan.halfCandidates &&
      cardPlan.halfCandidates.length
    ) {
      penalty += 72;
      if (cardPlan.contentProfile && (cardPlan.contentProfile.headerAndMediaOnly || cardPlan.contentProfile.mostlyMediaContent)) {
        penalty += 48;
      }
    }
    penalty += Math.round((1 - Number(candidate.typographyScale || 1)) * 240);
    return candidate.measuredHeight + penalty;
  }

  function getAdaptiveRowBalancePenalty(firstCandidate, secondCandidate, rowHeight) {
    if (!firstCandidate || !secondCandidate || !rowHeight) {
      return {
        score: 0,
        internalFreeSpaceDifferencePenalty: 0,
        internalFreeSpaceRatioPenalty: 0,
        mediaAlignmentPenalty: 0,
        footerAlignmentPenalty: 0,
        titleAlignmentPenalty: 0,
        excessiveSpacerPenalty: 0
      };
    }
    var firstFreeSpace = Math.max(0, Number(rowHeight) - Number(firstCandidate.naturalContentHeight || firstCandidate.measuredHeight || 0));
    var secondFreeSpace = Math.max(0, Number(rowHeight) - Number(secondCandidate.naturalContentHeight || secondCandidate.measuredHeight || 0));
    var freeSpaceDifference = Math.abs(firstFreeSpace - secondFreeSpace);
    var freeSpaceRatio = rowHeight ? (freeSpaceDifference / rowHeight) : 0;
    var mediaAlignmentPenalty = Math.max(
      0,
      Math.abs(Number(firstCandidate.mediaRegionHeight || firstCandidate.mediaHeight || 0) - Number(secondCandidate.mediaRegionHeight || secondCandidate.mediaHeight || 0)) - PDF_ADAPTIVE_MEDIA_ALIGNMENT_WARNING_PX
    ) * 0.6;
    var footerAlignmentPenalty = Math.max(
      0,
      Math.abs(Number(firstCandidate.footerHeight || 0) - Number(secondCandidate.footerHeight || 0)) - PDF_ADAPTIVE_FOOTER_ALIGNMENT_WARNING_PX
    ) * 0.5;
    var titleAlignmentPenalty = Math.abs(Number(firstCandidate.headerHeight || 0) - Number(secondCandidate.headerHeight || 0)) * 0.35;
    var internalFreeSpaceDifferencePenalty = freeSpaceDifference > PDF_ADAPTIVE_FREE_SPACE_WARNING_PX
      ? 40 + ((freeSpaceDifference - PDF_ADAPTIVE_FREE_SPACE_WARNING_PX) * 0.8)
      : freeSpaceDifference * 0.22;
    var internalFreeSpaceRatioPenalty = freeSpaceRatio > PDF_ADAPTIVE_FREE_SPACE_RATIO_WARNING
      ? 36 + ((freeSpaceRatio - PDF_ADAPTIVE_FREE_SPACE_RATIO_WARNING) * 340)
      : freeSpaceRatio * 90;
    var excessiveSpacerPenalty = Math.max(0, Math.max(firstFreeSpace, secondFreeSpace) - PDF_ADAPTIVE_MAX_FLEXIBLE_SPACER) * 0.5;
    return {
      score: internalFreeSpaceDifferencePenalty + internalFreeSpaceRatioPenalty + mediaAlignmentPenalty + footerAlignmentPenalty + titleAlignmentPenalty + excessiveSpacerPenalty,
      internalFreeSpaceDifferencePenalty: internalFreeSpaceDifferencePenalty,
      internalFreeSpaceRatioPenalty: internalFreeSpaceRatioPenalty,
      mediaAlignmentPenalty: mediaAlignmentPenalty,
      footerAlignmentPenalty: footerAlignmentPenalty,
      titleAlignmentPenalty: titleAlignmentPenalty,
      excessiveSpacerPenalty: excessiveSpacerPenalty
    };
  }

  function getAdaptiveProjectedTitleMediaGap(candidate, distribution, contentProfile) {
    var profile = contentProfile || candidate && candidate.contentProfile || {};
    var assigned = distribution && distribution.assignedFreeSpace ? distribution.assignedFreeSpace : {};
    var stackedLayout = isAdaptiveStackedLayout(candidate && candidate.layout);
    var baseGap = Number(candidate && candidate.contentToMediaGap || 12);
    if (!candidate || !profile.hasMedia) {
      return 0;
    }
    if (stackedLayout) {
      return baseGap +
        Number(assigned.bodyMediaGap || 0) +
        Number(assigned.flexibleSpacer || 0);
    }
    if (isAdaptiveSideMediaLayout(candidate.layout)) {
      return baseGap + Math.min(10, Number(assigned.flexibleSpacer || 0));
    }
    return baseGap + Number(assigned.bodyMediaGap || 0);
  }

  function getAdaptiveProjectedHeaderStrategyOptions(firstCandidate, secondCandidate, firstPlan, secondPlan) {
    var options = ["natural"];
    if (!firstCandidate || !secondCandidate || !firstPlan || !secondPlan) {
      return options;
    }
    if (
      Number(firstCandidate.headerHeight || 0) > 0 &&
      Number(secondCandidate.headerHeight || 0) > 0 &&
      !firstPlan.contentProfile.hasMapContent &&
      !secondPlan.contentProfile.hasMapContent
    ) {
      options.push("shared");
    }
    return options;
  }

  function projectAdaptiveCardRowGeometry(cardPlan, candidate, rowHeight, options) {
    if (!cardPlan || !candidate) {
      return null;
    }
    var projectionOptions = options || {};
    var contentProfile = cardPlan.contentProfile || candidate.contentProfile || {};
    var naturalHeight = Number(candidate.naturalContentHeight || candidate.measuredHeight || 0);
    var measuredHeight = Number(candidate.measuredHeight || naturalHeight || 0);
    var naturalHeaderHeight = Number(candidate.headerHeight || 0);
    var sharedHeaderHeight = Number(projectionOptions.sharedHeaderHeight || naturalHeaderHeight || 0);
    var useSharedHeader = projectionOptions.headerStrategy === "shared" && sharedHeaderHeight > naturalHeaderHeight;
    var appliedHeaderHeight = useSharedHeader ? sharedHeaderHeight : naturalHeaderHeight;
    var headerGrowth = Math.max(0, appliedHeaderHeight - naturalHeaderHeight);
    var effectiveMeasuredHeight = measuredHeight;
    if (headerGrowth > 0) {
      if (isAdaptiveStackedLayout(candidate.layout)) {
        effectiveMeasuredHeight += headerGrowth;
      } else if (isAdaptiveSideMediaLayout(candidate.layout)) {
        var textColumnHeight = Number(candidate.headerHeight || 0) + Number(candidate.bodyHeight || 0) + Number(candidate.footerHeight || 0);
        var mediaColumnHeight = Number(candidate.mediaRegionHeight || candidate.mediaHeight || 0);
        var grownTextColumnHeight = textColumnHeight + headerGrowth;
        var previousTallestColumn = Math.max(textColumnHeight, mediaColumnHeight);
        var nextTallestColumn = Math.max(grownTextColumnHeight, mediaColumnHeight);
        effectiveMeasuredHeight += Math.max(0, nextTallestColumn - previousTallestColumn);
      }
    }
    var sharedHeight = Number(rowHeight || effectiveMeasuredHeight || measuredHeight || 0);
    var distribution = getAdaptiveFreeSpaceDistribution(Object.assign({}, candidate, {
      naturalContentHeight: effectiveMeasuredHeight
    }), sharedHeight, contentProfile);
    var assigned = distribution.assignedFreeSpace || {};
    var equalizationGrowth = Math.max(0, sharedHeight - measuredHeight);
    var internalUnusedSpace = Math.max(0, Number(distribution.internalFreeSpace || 0));
    var mediaHeight = Math.max(0, Number(candidate.mediaRegionHeight || candidate.mediaHeight || 0) + Number(assigned.mediaGrowth || 0));
    var projectedMediaGeometry = candidate.hasMedia
      ? resolveAdaptiveFinalMediaGeometry({
          layout: candidate.layout,
          mediaType: (candidate.resolvedMediaGeometry && candidate.resolvedMediaGeometry.mediaType) || "photo",
          fitPolicy: (candidate.resolvedMediaGeometry && candidate.resolvedMediaGeometry.fitPolicy) || "contain",
          naturalWidth: Number(candidate.mediaNaturalWidth || candidate.mediaWidth || 1),
          naturalHeight: Number(candidate.mediaNaturalHeight || candidate.mediaHeight || 1),
          availableWidth: Number(candidate.mediaRegionWidth || candidate.mediaWidth || 1),
          availableHeight: mediaHeight,
          framePolicy: candidate.resolvedMediaGeometry
            ? {
                framePolicy: candidate.resolvedMediaGeometry.framePolicy,
                frameWidth: candidate.resolvedMediaGeometry.frameWidth,
                aspectRatio: candidate.resolvedMediaGeometry.aspectRatio,
                transparentFrame: candidate.resolvedMediaGeometry.transparentFrame,
                visualReason: candidate.resolvedMediaGeometry.visualReason,
                expectedLetterboxRatio: candidate.resolvedMediaGeometry.expectedLetterboxRatio
              }
            : null
        })
      : null;
    var mediaUsefulnessRatio = sharedHeight && projectedMediaGeometry
      ? (Number(projectedMediaGeometry.imageHeight || 0) / sharedHeight)
      : (sharedHeight ? (mediaHeight / sharedHeight) : 0);
    var titleToMediaGap = getAdaptiveProjectedTitleMediaGap(candidate, distribution, contentProfile);
    return {
      naturalHeight: naturalHeight,
      measuredHeight: measuredHeight,
      requiredRowHeight: Number(effectiveMeasuredHeight.toFixed(2)),
      sharedRowHeight: sharedHeight,
      naturalHeaderHeight: Number(naturalHeaderHeight.toFixed(2)),
      appliedHeaderHeight: Number(appliedHeaderHeight.toFixed(2)),
      headerGrowth: Number(headerGrowth.toFixed(2)),
      headerGrowthRatio: naturalHeaderHeight ? Number((headerGrowth / naturalHeaderHeight).toFixed(4)) : 0,
      equalizationGrowth: Number(equalizationGrowth.toFixed(2)),
      equalizationGrowthRatio: sharedHeight ? Number((equalizationGrowth / sharedHeight).toFixed(4)) : 0,
      projectedTextColumnHeight: Number((
        appliedHeaderHeight +
        Number(candidate.bodyHeight || 0) +
        Number(candidate.footerHeight || 0) +
        Number(assigned.flexibleSpacer || 0) +
        Number(assigned.bodyMediaGap || 0)
      ).toFixed(2)),
      projectedMediaHeight: Number((projectedMediaGeometry ? projectedMediaGeometry.frameHeight : mediaHeight).toFixed(2)),
      projectedMediaGeometry: projectedMediaGeometry,
      projectedTitleToMediaGap: Number(titleToMediaGap.toFixed(2)),
      internalUnusedSpace: Number(internalUnusedSpace.toFixed(2)),
      internalUnusedSpaceRatio: sharedHeight ? Number((internalUnusedSpace / sharedHeight).toFixed(4)) : 0,
      mediaUsefulnessRatio: Number(mediaUsefulnessRatio.toFixed(4)),
      trailingResidualSpace: Number(distribution.trailingResidualSpace || 0),
      distribution: distribution,
      contentProfile: contentProfile
    };
  }

  function getAdaptiveProjectedPairPenalty(firstProjection, secondProjection, firstCandidate, secondCandidate, headerStrategy) {
    if (!firstProjection || !secondProjection) {
      return {
        score: 0
      };
    }
    var titleToMediaSeparationPenalty = 0;
    [firstProjection, secondProjection].forEach(function (projection) {
      if (projection.projectedTitleToMediaGap > PDF_ADAPTIVE_PROJECTED_TITLE_MEDIA_GAP_BLOCKER_PX) {
        titleToMediaSeparationPenalty += 320 + ((projection.projectedTitleToMediaGap - PDF_ADAPTIVE_PROJECTED_TITLE_MEDIA_GAP_BLOCKER_PX) * 4);
      } else if (projection.projectedTitleToMediaGap > PDF_ADAPTIVE_PROJECTED_TITLE_MEDIA_GAP_WARNING_PX) {
        titleToMediaSeparationPenalty += 90 + ((projection.projectedTitleToMediaGap - PDF_ADAPTIVE_PROJECTED_TITLE_MEDIA_GAP_WARNING_PX) * 2.2);
      }
    });
    var unusedSpacePenalty = 0;
    [firstProjection, secondProjection].forEach(function (projection) {
      if (projection.internalUnusedSpaceRatio > PDF_ADAPTIVE_PROJECTED_UNUSED_SPACE_WARNING_RATIO) {
        unusedSpacePenalty += 70 + ((projection.internalUnusedSpaceRatio - PDF_ADAPTIVE_PROJECTED_UNUSED_SPACE_WARNING_RATIO) * 520);
      } else {
        unusedSpacePenalty += projection.internalUnusedSpaceRatio * 80;
      }
      if (projection.trailingResidualSpace > PDF_ADAPTIVE_PROJECTED_TRAILING_SPACE_WARNING_PX) {
        unusedSpacePenalty += 35 + ((projection.trailingResidualSpace - PDF_ADAPTIVE_PROJECTED_TRAILING_SPACE_WARNING_PX) * 0.8);
      }
    });
    var equalizationGrowthPenalty = 0;
    [firstProjection, secondProjection].forEach(function (projection) {
      if (projection.equalizationGrowthRatio > PDF_ADAPTIVE_PROJECTED_EQUALIZATION_WARNING_RATIO) {
        equalizationGrowthPenalty += 80 + ((projection.equalizationGrowthRatio - PDF_ADAPTIVE_PROJECTED_EQUALIZATION_WARNING_RATIO) * 420);
      } else {
        equalizationGrowthPenalty += projection.equalizationGrowthRatio * 120;
      }
    });
    var mediaUsefulnessPenalty = 0;
    [firstProjection, secondProjection].forEach(function (projection) {
      if (projection.contentProfile && projection.contentProfile.hasMedia && !projection.contentProfile.hasMapContent) {
        if (projection.mediaUsefulnessRatio < PDF_ADAPTIVE_PROJECTED_MEDIA_USEFULNESS_MIN_RATIO) {
          mediaUsefulnessPenalty += 120 + ((PDF_ADAPTIVE_PROJECTED_MEDIA_USEFULNESS_MIN_RATIO - projection.mediaUsefulnessRatio) * 500);
        }
      }
    });
    var mediaSizeMismatchPenalty = Math.abs(
      Number(firstProjection.mediaUsefulnessRatio || 0) -
      Number(secondProjection.mediaUsefulnessRatio || 0)
    );
    mediaSizeMismatchPenalty = mediaSizeMismatchPenalty > PDF_ADAPTIVE_PROJECTED_MEDIA_MISMATCH_WARNING_RATIO
      ? 45 + ((mediaSizeMismatchPenalty - PDF_ADAPTIVE_PROJECTED_MEDIA_MISMATCH_WARNING_RATIO) * 220)
      : mediaSizeMismatchPenalty * 60;
    var typographyMismatchPenalty = Number(firstCandidate.typographyScale || 1) === Number(secondCandidate.typographyScale || 1)
      ? 0
      : 22;
    var awkwardCompositionPenalty = 0;
    if (
      isAdaptiveStackedLayout(firstCandidate.layout) !== isAdaptiveStackedLayout(secondCandidate.layout) &&
      Math.abs(Number(firstProjection.internalUnusedSpace || 0) - Number(secondProjection.internalUnusedSpace || 0)) > PDF_ADAPTIVE_FREE_SPACE_WARNING_PX
    ) {
      awkwardCompositionPenalty += 28;
    }
    if (headerStrategy === "shared") {
      [firstProjection, secondProjection].forEach(function (projection) {
        if (projection.headerGrowthRatio > PDF_ADAPTIVE_HEADER_GROWTH_BLOCKER_RATIO) {
          awkwardCompositionPenalty += 180 + ((projection.headerGrowthRatio - PDF_ADAPTIVE_HEADER_GROWTH_BLOCKER_RATIO) * 520);
        } else if (projection.headerGrowthRatio > PDF_ADAPTIVE_HEADER_GROWTH_WARNING_RATIO) {
          awkwardCompositionPenalty += 45 + ((projection.headerGrowthRatio - PDF_ADAPTIVE_HEADER_GROWTH_WARNING_RATIO) * 220);
        }
      });
      if (
        (isAdaptiveStackedLayout(firstCandidate.layout) && isAdaptiveSideMediaLayout(secondCandidate.layout)) ||
        (isAdaptiveStackedLayout(secondCandidate.layout) && isAdaptiveSideMediaLayout(firstCandidate.layout))
      ) {
        awkwardCompositionPenalty += 52;
      }
    }
    var cardContentBalancePenalty = Math.abs(
      Number(firstProjection.projectedTextColumnHeight || 0) -
      Number(secondProjection.projectedTextColumnHeight || 0)
    ) * 0.24;
    var containmentRiskPenalty = (
      (firstCandidate.qualityWarnings || []).length +
      (secondCandidate.qualityWarnings || []).length
    ) * 40;
    [firstProjection, secondProjection].forEach(function (projection) {
      var geometry = projection && projection.projectedMediaGeometry ? projection.projectedMediaGeometry : null;
      if (geometry && !geometry.valid) {
        containmentRiskPenalty += 220;
      } else if (geometry && geometry.severity === "warning") {
        containmentRiskPenalty += 60;
      }
    });
    return {
      score: titleToMediaSeparationPenalty + unusedSpacePenalty + equalizationGrowthPenalty + mediaUsefulnessPenalty + mediaSizeMismatchPenalty + typographyMismatchPenalty + awkwardCompositionPenalty + cardContentBalancePenalty + containmentRiskPenalty,
      titleToMediaSeparationPenalty: Number(titleToMediaSeparationPenalty.toFixed(2)),
      internalUnusedSpacePenalty: Number(unusedSpacePenalty.toFixed(2)),
      equalizationGrowthPenalty: Number(equalizationGrowthPenalty.toFixed(2)),
      mediaUsefulnessPenalty: Number(mediaUsefulnessPenalty.toFixed(2)),
      mediaSizeMismatchPenalty: Number(mediaSizeMismatchPenalty.toFixed(2)),
      typographyMismatchPenalty: Number(typographyMismatchPenalty.toFixed(2)),
      awkwardCompositionPenalty: Number(awkwardCompositionPenalty.toFixed(2)),
      cardContentBalancePenalty: Number(cardContentBalancePenalty.toFixed(2)),
      containmentRiskPenalty: Number(containmentRiskPenalty.toFixed(2))
    };
  }

  function selectBestAdaptivePairCandidate(firstPlan, secondPlan) {
    if (!firstPlan || !secondPlan || !firstPlan.halfCandidates.length || !secondPlan.halfCandidates.length) {
      return {
        bestPair: null,
        evaluations: [],
        status: "unavailable",
        reason: "no-valid-half-candidates",
        unavailableDiagnostics: {
          firstCard: {
            blockId: String(firstPlan && firstPlan.blockId || ""),
            availableHalfCandidates: Number(firstPlan && firstPlan.halfCandidates ? firstPlan.halfCandidates.length : 0),
            rejectedHalfCandidates: (firstPlan && firstPlan.candidateDiagnostics || []).filter(function (candidate) {
              return candidate.widthStrategy === "half" && candidate.state === "rejected";
            })
          },
          secondCard: {
            blockId: String(secondPlan && secondPlan.blockId || ""),
            availableHalfCandidates: Number(secondPlan && secondPlan.halfCandidates ? secondPlan.halfCandidates.length : 0),
            rejectedHalfCandidates: (secondPlan && secondPlan.candidateDiagnostics || []).filter(function (candidate) {
              return candidate.widthStrategy === "half" && candidate.state === "rejected";
            })
          }
        }
      };
    }
    var bestPair = null;
    var evaluations = [];
    firstPlan.halfCandidates.forEach(function (firstCandidate) {
      secondPlan.halfCandidates.forEach(function (secondCandidate) {
        getAdaptiveProjectedHeaderStrategyOptions(firstCandidate, secondCandidate, firstPlan, secondPlan).forEach(function (headerStrategy) {
          var sharedScale = Number(firstCandidate.typographyScale || 1) === Number(secondCandidate.typographyScale || 1);
          var naturalSharedHeaderHeight = Math.max(Number(firstCandidate.headerHeight || 0), Number(secondCandidate.headerHeight || 0));
          var initialRowHeight = Math.max(firstCandidate.measuredHeight, secondCandidate.measuredHeight);
          var firstProjection = projectAdaptiveCardRowGeometry(firstPlan, firstCandidate, initialRowHeight, {
            headerStrategy: headerStrategy,
            sharedHeaderHeight: naturalSharedHeaderHeight
          });
          var secondProjection = projectAdaptiveCardRowGeometry(secondPlan, secondCandidate, initialRowHeight, {
            headerStrategy: headerStrategy,
            sharedHeaderHeight: naturalSharedHeaderHeight
          });
          var rowHeight = Math.max(
            Number(firstProjection && firstProjection.requiredRowHeight || initialRowHeight),
            Number(secondProjection && secondProjection.requiredRowHeight || initialRowHeight)
          );
          firstProjection = projectAdaptiveCardRowGeometry(firstPlan, firstCandidate, rowHeight, {
            headerStrategy: headerStrategy,
            sharedHeaderHeight: naturalSharedHeaderHeight
          });
          secondProjection = projectAdaptiveCardRowGeometry(secondPlan, secondCandidate, rowHeight, {
            headerStrategy: headerStrategy,
            sharedHeaderHeight: naturalSharedHeaderHeight
          });
          var mismatchPenalty = Math.abs(firstCandidate.measuredHeight - secondCandidate.measuredHeight) * 0.25;
          var compactPenalty = (firstCandidate.kind !== secondCandidate.kind) ? 12 : 0;
          var mixedTypographyPenalty = sharedScale ? 0 : 22;
          var rowHeightMismatchPenalty = Math.abs(firstCandidate.measuredHeight - secondCandidate.measuredHeight) * 0.18;
          var scalePenalty = Math.round((1 - Math.min(Number(firstCandidate.typographyScale || 1), Number(secondCandidate.typographyScale || 1))) * 220);
          var balancePenalty = getAdaptiveRowBalancePenalty(firstCandidate, secondCandidate, rowHeight);
          var projectedPenalty = getAdaptiveProjectedPairPenalty(firstProjection, secondProjection, firstCandidate, secondCandidate, headerStrategy);
          var projectedGeometryInvalid =
            (firstProjection && firstProjection.projectedMediaGeometry && !firstProjection.projectedMediaGeometry.valid) ||
            (secondProjection && secondProjection.projectedMediaGeometry && !secondProjection.projectedMediaGeometry.valid);
          var firstSingleScore = firstPlan.preferredSingleCandidate
            ? scoreAdaptiveSingleCandidate(firstPlan, firstPlan.preferredSingleCandidate, 2)
            : Number.POSITIVE_INFINITY;
          var secondSingleScore = secondPlan.preferredSingleCandidate
            ? scoreAdaptiveSingleCandidate(secondPlan, secondPlan.preferredSingleCandidate, 1)
            : Number.POSITIVE_INFINITY;
          var pageEconomyBonus = 0;
          if (isFinite(firstSingleScore) && isFinite(secondSingleScore)) {
            pageEconomyBonus = Math.min(180, Math.max(0, (firstSingleScore + secondSingleScore) - rowHeight) * 0.26);
          }
          var candidateSoftPenalty = (
            getAdaptiveCandidateSoftPenalty(firstCandidate) +
            getAdaptiveCandidateSoftPenalty(secondCandidate) +
            getAdaptiveCandidateVariantPenalty(firstCandidate, firstPlan) +
            getAdaptiveCandidateVariantPenalty(secondCandidate, secondPlan)
          );
          var score = rowHeight + mismatchPenalty + compactPenalty + mixedTypographyPenalty + rowHeightMismatchPenalty + scalePenalty + balancePenalty.score + projectedPenalty.score + candidateSoftPenalty - pageEconomyBonus;
          var evaluation = {
            candidates: [String(firstCandidate.layout || firstCandidate.kind || "medium"), String(secondCandidate.layout || secondCandidate.kind || "medium")],
            semanticContentProfile: [firstPlan.contentProfile, secondPlan.contentProfile],
            naturalHeight: [Number(firstCandidate.naturalContentHeight || firstCandidate.measuredHeight || 0), Number(secondCandidate.naturalContentHeight || secondCandidate.measuredHeight || 0)],
            projectedSharedRowHeight: Number(rowHeight.toFixed(2)),
            headerStrategy: headerStrategy,
            headerCompatibility: headerStrategy === "shared"
              ? ((isAdaptiveStackedLayout(firstCandidate.layout) === isAdaptiveStackedLayout(secondCandidate.layout) && isAdaptiveSideMediaLayout(firstCandidate.layout) === isAdaptiveSideMediaLayout(secondCandidate.layout)) ? "compatible" : "mixed")
              : "natural",
            projectedSharedHeaderHeight: naturalSharedHeaderHeight,
            equalisationGrowth: [firstProjection ? firstProjection.equalizationGrowth : 0, secondProjection ? secondProjection.equalizationGrowth : 0],
            flexibleSpacerAmount: [
              firstProjection ? Number(firstProjection.distribution.assignedFreeSpace.flexibleSpacer || 0) : 0,
              secondProjection ? Number(secondProjection.distribution.assignedFreeSpace.flexibleSpacer || 0) : 0
            ],
            trailingResidualSpaceAmount: [
              firstProjection ? Number(firstProjection.trailingResidualSpace || 0) : 0,
              secondProjection ? Number(secondProjection.trailingResidualSpace || 0) : 0
            ],
            projectedTitleToMediaGap: [
              firstProjection ? Number(firstProjection.projectedTitleToMediaGap || 0) : 0,
              secondProjection ? Number(secondProjection.projectedTitleToMediaGap || 0) : 0
            ],
            projectedMediaGeometry: [
              firstProjection && firstProjection.projectedMediaGeometry
                ? {
                    frameWidth: Number(firstProjection.projectedMediaGeometry.frameWidth || 0),
                    frameHeight: Number(firstProjection.projectedMediaGeometry.frameHeight || 0),
                    imageWidth: Number(firstProjection.projectedMediaGeometry.imageWidth || 0),
                    imageHeight: Number(firstProjection.projectedMediaGeometry.imageHeight || 0),
                    horizontalLetterboxPercent: Number(firstProjection.projectedMediaGeometry.horizontalLetterboxPercent || 0),
                    verticalLetterboxPercent: Number(firstProjection.projectedMediaGeometry.verticalLetterboxPercent || 0),
                    valid: !!firstProjection.projectedMediaGeometry.valid,
                    issues: (firstProjection.projectedMediaGeometry.issues || []).slice()
                  }
                : null,
              secondProjection && secondProjection.projectedMediaGeometry
                ? {
                    frameWidth: Number(secondProjection.projectedMediaGeometry.frameWidth || 0),
                    frameHeight: Number(secondProjection.projectedMediaGeometry.frameHeight || 0),
                    imageWidth: Number(secondProjection.projectedMediaGeometry.imageWidth || 0),
                    imageHeight: Number(secondProjection.projectedMediaGeometry.imageHeight || 0),
                    horizontalLetterboxPercent: Number(secondProjection.projectedMediaGeometry.horizontalLetterboxPercent || 0),
                    verticalLetterboxPercent: Number(secondProjection.projectedMediaGeometry.verticalLetterboxPercent || 0),
                    valid: !!secondProjection.projectedMediaGeometry.valid,
                    issues: (secondProjection.projectedMediaGeometry.issues || []).slice()
                  }
                : null
            ],
            naturalHeaderHeight: [
              firstProjection ? Number(firstProjection.naturalHeaderHeight || 0) : 0,
              secondProjection ? Number(secondProjection.naturalHeaderHeight || 0) : 0
            ],
            appliedHeaderHeight: [
              firstProjection ? Number(firstProjection.appliedHeaderHeight || 0) : 0,
              secondProjection ? Number(secondProjection.appliedHeaderHeight || 0) : 0
            ],
            headerGrowth: [
              firstProjection ? Number(firstProjection.headerGrowth || 0) : 0,
              secondProjection ? Number(secondProjection.headerGrowth || 0) : 0
            ],
            mediaDimensions: [
              firstProjection ? Number(firstProjection.projectedMediaHeight || 0) : 0,
              secondProjection ? Number(secondProjection.projectedMediaHeight || 0) : 0
            ],
            internalUnusedSpaceRatio: [
              firstProjection ? Number(firstProjection.internalUnusedSpaceRatio || 0) : 0,
              secondProjection ? Number(secondProjection.internalUnusedSpaceRatio || 0) : 0
            ],
            scoreComponents: {
              rowHeight: Number(rowHeight.toFixed(2)),
              mismatchPenalty: Number(mismatchPenalty.toFixed(2)),
              compactPenalty: Number(compactPenalty.toFixed(2)),
              mixedTypographyPenalty: Number(mixedTypographyPenalty.toFixed(2)),
              rowHeightMismatchPenalty: Number(rowHeightMismatchPenalty.toFixed(2)),
              scalePenalty: Number(scalePenalty.toFixed(2)),
              internalFreeSpaceDifferencePenalty: balancePenalty.internalFreeSpaceDifferencePenalty,
              internalFreeSpaceRatioPenalty: balancePenalty.internalFreeSpaceRatioPenalty,
              mediaAlignmentPenalty: balancePenalty.mediaAlignmentPenalty,
              footerAlignmentPenalty: balancePenalty.footerAlignmentPenalty,
              titleAlignmentPenalty: balancePenalty.titleAlignmentPenalty,
              excessiveSpacerPenalty: balancePenalty.excessiveSpacerPenalty,
              titleToMediaSeparationPenalty: projectedPenalty.titleToMediaSeparationPenalty,
              internalUnusedSpacePenalty: projectedPenalty.internalUnusedSpacePenalty,
              equalizationGrowthPenalty: projectedPenalty.equalizationGrowthPenalty,
              mediaUsefulnessPenalty: projectedPenalty.mediaUsefulnessPenalty,
              mediaSizeMismatchPenalty: projectedPenalty.mediaSizeMismatchPenalty,
              typographyMismatchPenalty: projectedPenalty.typographyMismatchPenalty,
              awkwardCompositionPenalty: projectedPenalty.awkwardCompositionPenalty,
              cardContentBalancePenalty: projectedPenalty.cardContentBalancePenalty,
              containmentRiskPenalty: projectedPenalty.containmentRiskPenalty,
              candidateSoftPenalty: Number(candidateSoftPenalty.toFixed(2))
            },
            pageEconomyBonus: Number(pageEconomyBonus.toFixed(2)),
            finalPairScore: Number(score.toFixed(2)),
            state: projectedGeometryInvalid ? "rejected" : "evaluated",
            hardRejectionReason: projectedGeometryInvalid ? "projected-media-geometry-invalid" : ""
          };
          evaluations.push(evaluation);
          if (projectedGeometryInvalid) {
            return;
          }
          if (!bestPair || score < bestPair.score) {
            bestPair = {
              score: score,
              measuredHeight: rowHeight,
              headerStrategy: headerStrategy,
              sharedHeaderHeight: naturalSharedHeaderHeight,
              rowHeightMismatchPenalty: rowHeightMismatchPenalty,
              mixedTypographyPenalty: mixedTypographyPenalty,
              internalFreeSpaceDifferencePenalty: balancePenalty.internalFreeSpaceDifferencePenalty,
              internalFreeSpaceRatioPenalty: balancePenalty.internalFreeSpaceRatioPenalty,
              mediaAlignmentPenalty: balancePenalty.mediaAlignmentPenalty,
              footerAlignmentPenalty: balancePenalty.footerAlignmentPenalty,
              titleAlignmentPenalty: balancePenalty.titleAlignmentPenalty,
              excessiveSpacerPenalty: balancePenalty.excessiveSpacerPenalty,
              titleToMediaSeparationPenalty: projectedPenalty.titleToMediaSeparationPenalty,
              internalUnusedSpacePenalty: projectedPenalty.internalUnusedSpacePenalty,
              equalizationGrowthPenalty: projectedPenalty.equalizationGrowthPenalty,
              mediaUsefulnessPenalty: projectedPenalty.mediaUsefulnessPenalty,
              mediaSizeMismatchPenalty: projectedPenalty.mediaSizeMismatchPenalty,
              awkwardCompositionPenalty: projectedPenalty.awkwardCompositionPenalty,
              cardContentBalancePenalty: projectedPenalty.cardContentBalancePenalty,
              containmentRiskPenalty: projectedPenalty.containmentRiskPenalty,
              candidateSoftPenalty: candidateSoftPenalty,
              pageEconomyBonus: pageEconomyBonus,
              sharedTypographyScale: sharedScale ? Number(firstCandidate.typographyScale || 1) : null,
              firstCandidate: firstCandidate,
              secondCandidate: secondCandidate,
              firstProjection: firstProjection,
              secondProjection: secondProjection,
              evaluations: evaluations
            };
          }
        });
      });
    });
    return {
      bestPair: bestPair,
      evaluations: evaluations,
      status: bestPair ? "evaluated" : "rejected",
      reason: bestPair ? "" : "no-pair-selected"
    };
  }

  function planAdaptiveSectionRows(cardPlans) {
    var memo = {};
    var pairDiagnosticsByIndex = {};

    function solve(index) {
      if (index >= cardPlans.length) {
        return {
          score: 0,
          rows: []
        };
      }
      if (memo[index]) {
        return memo[index];
      }

      var currentPlan = cardPlans[index];
      var bestPlan = null;

      currentPlan.wideCandidates.forEach(function (singleCandidate) {
        var restPlan = solve(index + 1);
        var rowScore = scoreAdaptiveSingleCandidate(
          currentPlan,
          singleCandidate,
          cardPlans.length - index
        );
        var singleScore = rowScore + restPlan.score;
        if (!bestPlan || singleScore < bestPlan.score) {
          bestPlan = {
            score: singleScore,
            rows: [{
              type: "single",
              score: Number(rowScore.toFixed(2)),
              rowHeight: singleCandidate.measuredHeight,
              rowNaturalHeight: Number(singleCandidate.naturalContentHeight || singleCandidate.measuredHeight || 0),
              sharedHeaderHeight: Number(singleCandidate.headerHeight || 0),
              sharedTypographyScale: Number(singleCandidate.typographyScale || 1),
              cards: [{
                cardNode: currentPlan.cardNode,
                cardPlan: currentPlan,
                variant: singleCandidate
              }]
            }].concat(restPlan.rows)
          };
        }
      });

      if (index + 1 < cardPlans.length) {
        var nextPlan = cardPlans[index + 1];
        var pairResult = selectBestAdaptivePairCandidate(currentPlan, nextPlan);
        pairDiagnosticsByIndex[index] = {
          status: pairResult && pairResult.status || "unavailable",
          reason: pairResult && pairResult.reason || "",
          evaluations: pairResult && pairResult.evaluations ? pairResult.evaluations.slice() : [],
          unavailableDiagnostics: pairResult && pairResult.unavailableDiagnostics ? pairResult.unavailableDiagnostics : null
        };
        var bestPair = pairResult && pairResult.bestPair ? pairResult.bestPair : null;
        if (bestPair) {
          var pairRestPlan = solve(index + 2);
          var pairScore = bestPair.score + pairRestPlan.score;
          if (!bestPlan || pairScore < bestPlan.score) {
            bestPlan = {
              score: pairScore,
              rows: [{
                type: "pair",
                score: Number(bestPair.score.toFixed(2)),
              rowHeight: bestPair.measuredHeight,
              rowNaturalHeight: Math.max(
                Number(bestPair.firstCandidate.naturalContentHeight || bestPair.firstCandidate.measuredHeight || 0),
                Number(bestPair.secondCandidate.naturalContentHeight || bestPair.secondCandidate.measuredHeight || 0)
              ),
              sharedHeaderHeight: Math.max(
                Number(bestPair.firstProjection && bestPair.firstProjection.appliedHeaderHeight || 0),
                Number(bestPair.secondProjection && bestPair.secondProjection.appliedHeaderHeight || 0)
              ),
              headerStrategy: String(bestPair.headerStrategy || "natural"),
              sharedTypographyScale: bestPair.sharedTypographyScale,
              internalFreeSpaceDifferencePenalty: bestPair.internalFreeSpaceDifferencePenalty,
              internalFreeSpaceRatioPenalty: bestPair.internalFreeSpaceRatioPenalty,
              mediaAlignmentPenalty: bestPair.mediaAlignmentPenalty,
              footerAlignmentPenalty: bestPair.footerAlignmentPenalty,
              titleAlignmentPenalty: bestPair.titleAlignmentPenalty,
              excessiveSpacerPenalty: bestPair.excessiveSpacerPenalty,
              titleToMediaSeparationPenalty: bestPair.titleToMediaSeparationPenalty,
              internalUnusedSpacePenalty: bestPair.internalUnusedSpacePenalty,
              equalizationGrowthPenalty: bestPair.equalizationGrowthPenalty,
              mediaUsefulnessPenalty: bestPair.mediaUsefulnessPenalty,
              mediaSizeMismatchPenalty: bestPair.mediaSizeMismatchPenalty,
              awkwardCompositionPenalty: bestPair.awkwardCompositionPenalty,
              cardContentBalancePenalty: bestPair.cardContentBalancePenalty,
              containmentRiskPenalty: bestPair.containmentRiskPenalty,
              pairEvaluations: bestPair.evaluations || [],
              cards: [{
                cardNode: currentPlan.cardNode,
                cardPlan: currentPlan,
                variant: bestPair.firstCandidate,
                projection: bestPair.firstProjection
              }, {
                cardNode: nextPlan.cardNode,
                cardPlan: nextPlan,
                variant: bestPair.secondCandidate,
                projection: bestPair.secondProjection
              }]
            }].concat(pairRestPlan.rows)
            };
          }
        }
      }

      memo[index] = bestPlan || {
        score: 0,
        rows: []
      };
      return memo[index];
    }
    var solved = solve(0);
    solved.pairDiagnostics = Object.keys(pairDiagnosticsByIndex).map(function (key) {
      return {
        index: Number(key),
        status: pairDiagnosticsByIndex[key].status,
        reason: pairDiagnosticsByIndex[key].reason,
        evaluations: pairDiagnosticsByIndex[key].evaluations,
        unavailableDiagnostics: pairDiagnosticsByIndex[key].unavailableDiagnostics
      };
    }).sort(function (left, right) {
      return left.index - right.index;
    });
    return solved;
  }

  function buildAdaptiveTypographySelectionDiagnostics(cardPlan, selectedVariant, rowHeight) {
    var selectedScale = Number(selectedVariant && selectedVariant.typographyScale || 1);
    var alternatives = ADAPTIVE_TYPOGRAPHY_SCALES.map(function (scale) {
      var match = (cardPlan && Array.isArray(cardPlan.candidates) ? cardPlan.candidates : []).find(function (candidate) {
        return candidate.layout === selectedVariant.layout &&
          !!candidate.isWide === !!selectedVariant.isWide &&
          candidate.kind === selectedVariant.kind &&
          Number(candidate.typographyScale || 1) === Number(scale);
      }) || null;
      var rowOverflow = match && rowHeight
        ? Math.max(0, Number(match.naturalContentHeight || match.measuredHeight || 0) - Number(rowHeight || 0))
        : 0;
      return {
        scale: scale,
        valid: !!match && Number(match.containmentOverflow || 0) <= PDF_ADAPTIVE_CARD_CONTAINMENT_TOLERANCE_PX,
        overflowPixels: match ? Math.max(Number(match.overflowPixels || 0), rowOverflow) : 0
      };
    });
    var reason = "";
    if (selectedScale < 1) {
      var blockingAlternative = alternatives.find(function (alternative) {
        return alternative.scale > selectedScale && (!alternative.valid || alternative.overflowPixels > 0);
      }) || null;
      if (blockingAlternative) {
        reason = String(blockingAlternative.scale) + " overflowed by " + String(blockingAlternative.overflowPixels || 0) + "px";
      } else {
        reason = "larger scales produced a worse measured row-balance score";
      }
    }
    return {
      selectedScale: selectedScale,
      reason: reason,
      alternatives: alternatives
    };
  }

  function getAdaptiveFreeSpaceDistribution(variant, rowHeight) {
    var naturalHeight = Number(variant && (variant.naturalContentHeight || variant.measuredHeight) || 0);
    var freeSpace = Math.max(0, Number(rowHeight || 0) - naturalHeight);
    var remaining = freeSpace;
    var hasMedia = !!(variant && variant.hasMedia);
    var hasFooter = !!(variant && variant.hasFooter);
    var paragraphCount = Math.max(0, Number(variant && variant.paragraphCount || 0));
    var contentProfile = variant && variant.contentProfile ? variant.contentProfile : {};
    var stackedLayout = isAdaptiveStackedLayout(variant && variant.layout);
    var sideLayout = isAdaptiveSideMediaLayout(variant && variant.layout);
    var mediaGrowth = 0;
    var bodyMediaGap = 0;
    var paragraphGrowth = 0;
    var flexibleSpacer = 0;
    var trailingResidualSpace = 0;

    if (remaining > 0 && hasMedia) {
      mediaGrowth = Math.min(remaining, PDF_ADAPTIVE_MAX_MEDIA_REGION_GROWTH);
      remaining -= mediaGrowth;
    }
    if (remaining > 0 && (hasMedia || hasFooter)) {
      var maxLayoutGapGrowth = PDF_ADAPTIVE_MAX_LAYOUT_GAP_GROWTH;
      if (stackedLayout && contentProfile.headerAndMediaOnly) {
        maxLayoutGapGrowth = 4;
      } else if (stackedLayout && contentProfile.mostlyMediaContent) {
        maxLayoutGapGrowth = 6;
      }
      bodyMediaGap = Math.min(remaining, maxLayoutGapGrowth);
      remaining -= bodyMediaGap;
    }
    if (remaining > 0 && paragraphCount > 1) {
      paragraphGrowth = Math.min(
        remaining,
        Math.min(PDF_ADAPTIVE_MAX_PARAGRAPH_GAP_GROWTH, Math.max(0, paragraphCount - 1) * 2)
      );
      remaining -= paragraphGrowth;
    }
    if (
      remaining > 0 &&
      (
        !stackedLayout ||
        (!contentProfile.headerAndMediaOnly && !contentProfile.mostlyMediaContent) ||
        sideLayout
      )
    ) {
      flexibleSpacer = Math.min(remaining, PDF_ADAPTIVE_MAX_FLEXIBLE_SPACER);
      remaining -= flexibleSpacer;
    }
    if (remaining > 0) {
      trailingResidualSpace = remaining;
    }

    return {
      internalFreeSpace: freeSpace,
      assignedFreeSpace: {
        mediaGrowth: mediaGrowth,
        bodyMediaGap: bodyMediaGap,
        paragraphGrowth: paragraphGrowth,
        flexibleSpacer: flexibleSpacer
      },
      trailingResidualSpace: trailingResidualSpace
    };
  }

  function getAdaptiveCardMediaVerticalAlignmentMode(variant, rowDetails) {
    if (!variant) {
      return "natural";
    }
    var layout = String(variant.layout || "");
    if (layout.indexOf("half-portrait-side") === -1 && layout.indexOf("wide-horizontal") === -1) {
      return "natural";
    }
    var rowHeight = Number(rowDetails && rowDetails.rowHeight || variant.measuredHeight || 0);
    var naturalHeight = Number(variant.measuredHeight || 0);
    var freeSpace = Math.max(0, rowHeight - naturalHeight);
    var bodyHeight = Number(variant.bodyHeight || 0);
    var headerHeight = Number(variant.headerHeight || 0);
    var mediaHeight = Number(variant.mediaRegionHeight || variant.mediaHeight || 0);
    if (
      layout.indexOf("half-portrait-side") !== -1 &&
      freeSpace >= PDF_ADAPTIVE_MEDIA_BALANCE_GAP_WARNING_PX &&
      bodyHeight <= Math.max(72, mediaHeight * 0.82)
    ) {
      return "content-group-centred";
    }
    if (
      layout.indexOf("wide-horizontal") !== -1 &&
      freeSpace >= PDF_ADAPTIVE_MEDIA_BALANCE_GAP_WARNING_PX &&
      bodyHeight <= Math.max(60, mediaHeight * 0.6)
    ) {
      return "balanced-between-header-and-card-bottom";
    }
    return "header-aligned";
  }

  function getAdaptiveCardMediaJustifyContent(alignmentMode) {
    if (alignmentMode === "content-group-centred" || alignmentMode === "balanced-between-header-and-card-bottom") {
      return "center";
    }
    if (alignmentMode === "footer-bottom") {
      return "flex-end";
    }
    return "flex-start";
  }

  function applyAdaptiveRowDistribution(cardNode, variant, rowDetails) {
    if (!cardNode || !variant || !rowDetails) {
      return;
    }
    var projection = rowDetails.projection || null;
    var distribution = projection && projection.distribution
      ? projection.distribution
      : getAdaptiveFreeSpaceDistribution(variant, rowDetails.rowHeight || variant.measuredHeight || 0);
    var headerHeight = projection
      ? Number(projection.appliedHeaderHeight || variant.headerHeight || 0)
      : Math.max(Number(rowDetails.sharedHeaderHeight || 0), Number(variant.headerHeight || 0));
    cardNode.style.setProperty("--pi-export-card-header-height", headerHeight ? (headerHeight + "px") : "");
    cardNode.style.setProperty("--pi-export-card-media-region-extra", distribution.assignedFreeSpace.mediaGrowth + "px");
    cardNode.style.setProperty("--pi-export-card-layout-gap-extra", distribution.assignedFreeSpace.bodyMediaGap + "px");
    cardNode.style.setProperty("--pi-export-card-paragraph-gap-extra", distribution.assignedFreeSpace.paragraphGrowth + "px");
    cardNode.style.setProperty("--pi-export-card-flex-spacer", distribution.assignedFreeSpace.flexibleSpacer + "px");
    cardNode.style.setProperty("--pi-export-card-trailing-space", (distribution.trailingResidualSpace || 0) + "px");
    var mediaAlignmentMode = getAdaptiveCardMediaVerticalAlignmentMode(variant, rowDetails);
    cardNode.style.setProperty("--pi-export-card-media-justify", getAdaptiveCardMediaJustifyContent(mediaAlignmentMode));
    cardNode.setAttribute("data-pdf-card-header-height", String(variant.headerHeight || 0));
    cardNode.setAttribute("data-pdf-card-applied-header-height", String(headerHeight || 0));
    cardNode.setAttribute("data-pdf-card-body-height", String(variant.bodyHeight || 0));
    cardNode.setAttribute("data-pdf-card-media-height", String(variant.mediaRegionHeight || variant.mediaHeight || 0));
    cardNode.setAttribute("data-pdf-card-media-region-width", String(variant.mediaRegionWidth || variant.mediaWidth || 0));
    cardNode.setAttribute("data-pdf-card-footer-height", String(variant.footerHeight || 0));
    cardNode.setAttribute("data-pdf-media-vertical-alignment", mediaAlignmentMode);
    cardNode.setAttribute("data-pdf-card-region-distribution", JSON.stringify(distribution.assignedFreeSpace));
    cardNode.setAttribute("data-pdf-card-trailing-space", String(distribution.trailingResidualSpace || 0));
  }

  function createAdaptiveRow(documentNode, cards, className, rowDetails) {
    var row = documentNode.createElement("div");
    row.className = "pi-export-row " + className;
    row.setAttribute("data-pdf-section-item", "1");
    if (rowDetails && rowDetails.rowId) {
      row.setAttribute("data-pdf-row-id", String(rowDetails.rowId));
    }
    if (rowDetails && rowDetails.sectionAnchor) {
      row.setAttribute("data-pdf-row-section-anchor", String(rowDetails.sectionAnchor));
    }
    if (rowDetails && rowDetails.sourceOrder !== undefined) {
      row.setAttribute("data-pdf-row-source-order", String(rowDetails.sourceOrder));
    }
    if (rowDetails && rowDetails.score !== undefined) {
      row.setAttribute("data-pdf-row-score", String(rowDetails.score));
    }
    if (rowDetails && rowDetails.cards) {
      row.setAttribute("data-pdf-row-variants", rowDetails.cards.map(function (cardEntry) {
        return String(cardEntry.variant.layout || cardEntry.variant.kind || "medium");
      }).join(","));
    }
    if (rowDetails && rowDetails.rowVariant) {
      row.setAttribute("data-pdf-row-variant", String(rowDetails.rowVariant));
    }
    if (rowDetails && rowDetails.sharedTypographyScale) {
      row.setAttribute("data-pdf-row-typography-scale", String(rowDetails.sharedTypographyScale));
    }
    if (rowDetails && rowDetails.rowHeight !== undefined) {
      row.setAttribute("data-pdf-row-height", String(rowDetails.rowHeight));
    }
    if (rowDetails && rowDetails.rowNaturalHeight !== undefined) {
      row.setAttribute("data-pdf-row-natural-height", String(rowDetails.rowNaturalHeight));
    }
    if (rowDetails && rowDetails.sharedHeaderHeight !== undefined) {
      row.setAttribute("data-pdf-row-header-height", String(rowDetails.sharedHeaderHeight));
    }
    if (rowDetails && rowDetails.headerStrategy) {
      row.setAttribute("data-pdf-row-header-strategy", String(rowDetails.headerStrategy));
    }
    if (rowDetails && rowDetails.titleToMediaSeparationPenalty !== undefined) {
      row.setAttribute("data-pdf-row-title-media-penalty", String(rowDetails.titleToMediaSeparationPenalty));
    }
    if (rowDetails && rowDetails.internalUnusedSpacePenalty !== undefined) {
      row.setAttribute("data-pdf-row-unused-space-penalty", String(rowDetails.internalUnusedSpacePenalty));
    }
    if (rowDetails && rowDetails.equalizationGrowthPenalty !== undefined) {
      row.setAttribute("data-pdf-row-equalization-penalty", String(rowDetails.equalizationGrowthPenalty));
    }
    if (rowDetails && rowDetails.mediaUsefulnessPenalty !== undefined) {
      row.setAttribute("data-pdf-row-media-usefulness-penalty", String(rowDetails.mediaUsefulnessPenalty));
    }
    if (rowDetails && rowDetails.mediaSizeMismatchPenalty !== undefined) {
      row.setAttribute("data-pdf-row-media-mismatch-penalty", String(rowDetails.mediaSizeMismatchPenalty));
    }
    cards.forEach(function (cardNode) {
      if (cardNode) {
        if (rowDetails && rowDetails.rowHeight && className.indexOf("two-up") !== -1) {
          cardNode.style.height = rowDetails.rowHeight + "px";
          cardNode.style.minHeight = rowDetails.rowHeight + "px";
        } else {
          cardNode.style.height = "";
          cardNode.style.minHeight = "";
        }
        row.appendChild(cardNode);
      }
    });
    return row;
  }

  function getAdaptiveCardLargestBlankRegion(cardDiagnostic) {
    var distribution = cardDiagnostic && cardDiagnostic.assignedFreeSpace
      ? cardDiagnostic.assignedFreeSpace
      : {};
    return Math.max(
      0,
      Number(distribution.flexibleSpacer || 0),
      Number(distribution.bodyMediaGap || 0),
      Number(cardDiagnostic && cardDiagnostic.trailingResidualSpace || 0)
    );
  }

  function getAdaptiveRowAlignmentMode(rowVariant, cardDiagnostics) {
    var cards = Array.isArray(cardDiagnostics) ? cardDiagnostics : [];
    if (rowVariant !== "two-up") {
      return "single";
    }
    var variants = cards.map(function (card) {
      return String(card.variant || "");
    });
    var mediaCards = cards.filter(function (card) {
      return Number(card.mediaHeight || 0) > 0;
    });
    var footerCards = cards.filter(function (card) {
      return Number(card.footerHeight || 0) > 0;
    });
    if (variants.every(function (variant) { return variant.indexOf("portrait-side") !== -1; })) {
      return "media-top";
    }
    if (
      mediaCards.length === cards.length &&
      variants.some(function (variant) { return variant.indexOf("half-compact") !== -1; }) &&
      variants.some(function (variant) { return variant.indexOf("portrait-side") !== -1; })
    ) {
      return "media-top";
    }
    if (footerCards.length === cards.length && footerCards.length > 1) {
      return "footer-bottom";
    }
    if (mediaCards.length === cards.length) {
      return "body-top";
    }
    return "balanced";
  }

  function classifyAdaptiveRowSeverity(rowDiagnostic) {
    var cards = Array.isArray(rowDiagnostic && rowDiagnostic.cards) ? rowDiagnostic.cards : [];
    var maxBlankRegion = 0;
    var expectedAsymmetryReasons = [];
    var visualPlacementDiagnostics = cards.map(function (card) {
      return card && card.mediaVisualPlacement ? card.mediaVisualPlacement : null;
    }).filter(Boolean);
    cards.forEach(function (card) {
      maxBlankRegion = Math.max(maxBlankRegion, getAdaptiveCardLargestBlankRegion(card));
    });

    var footerCards = cards.filter(function (card) {
      return Number(card.footerHeight || 0) > 0;
    });
    var mediaCards = cards.filter(function (card) {
      return Number(card.mediaHeight || 0) > 0;
    });
    if (footerCards.length === 1 && cards.length === 2) {
      expectedAsymmetryReasons.push("one-sided-footer");
    }
    if (
      mediaCards.length === cards.length &&
      cards.some(function (card) { return String(card.variant || "").indexOf("half-compact") !== -1; }) &&
      cards.some(function (card) { return String(card.variant || "").indexOf("portrait-side") !== -1; })
    ) {
      expectedAsymmetryReasons.push("mixed-media-layout");
    }
    if (
      cards.length === 2 &&
      Number(cards[0].typographyScale || 0) !== Number(cards[1].typographyScale || 0)
    ) {
      expectedAsymmetryReasons.push("mixed-typography-scale");
    }

    var overflow = cards.some(function (card) {
      return Number(card.overflowPixels || 0) > 0 || card.containmentValid === false;
    });
    var visualPlacementBlocker = visualPlacementDiagnostics.find(function (diagnostic) {
      return diagnostic.severity === "blocker";
    }) || null;
    var visualPlacementWarning = visualPlacementDiagnostics.find(function (diagnostic) {
      return diagnostic.severity === "visual-warning";
    }) || null;
    if (visualPlacementBlocker) {
      return {
        severity: "blocker",
        reasons: (visualPlacementBlocker.issues || []).slice(),
        largestBlankRegion: Number(maxBlankRegion.toFixed(2))
      };
    }
    if (overflow || Number(rowDiagnostic.equalizedHeightDifference || 0) > 1 || maxBlankRegion > 72) {
      return {
        severity: "blocker",
        reasons: overflow
          ? cards.some(function (card) { return card.containmentValid === false; })
            ? ["card-containment-overflow"]
            : ["content-overflow"]
          : ["severe-blank-region"],
        largestBlankRegion: Number(maxBlankRegion.toFixed(2))
      };
    }
    if (maxBlankRegion > 44) {
      return {
        severity: "visual-warning",
        reasons: ["large-blank-region"],
        largestBlankRegion: Number(maxBlankRegion.toFixed(2))
      };
    }
    if (visualPlacementWarning) {
      return {
        severity: "visual-warning",
        reasons: (visualPlacementWarning.issues || []).slice(),
        largestBlankRegion: Number(maxBlankRegion.toFixed(2))
      };
    }
    if (
      Number(rowDiagnostic.titleTopDifference || 0) > PDF_ADAPTIVE_TITLE_ALIGNMENT_WARNING_PX ||
      (
        Number(rowDiagnostic.mediaBottomDifference || 0) > PDF_ADAPTIVE_MEDIA_ALIGNMENT_WARNING_PX &&
        expectedAsymmetryReasons.indexOf("mixed-media-layout") === -1
      ) ||
      (
        Number(rowDiagnostic.footerBottomDifference || 0) > PDF_ADAPTIVE_FOOTER_ALIGNMENT_WARNING_PX &&
        expectedAsymmetryReasons.indexOf("one-sided-footer") === -1
      )
    ) {
      if (
        Number(rowDiagnostic.titleTopDifference || 0) <= PDF_ADAPTIVE_TITLE_ALIGNMENT_WARNING_PX &&
        Number(rowDiagnostic.footerBottomDifference || 0) <= PDF_ADAPTIVE_FOOTER_ALIGNMENT_WARNING_PX &&
        Number(maxBlankRegion || 0) <= 8 &&
        String(getAdaptiveRowAlignmentMode(rowDiagnostic.rowVariant, cards)) === "media-top"
      ) {
        return {
          severity: "expected-asymmetry",
          reasons: ["portrait-image-crop-offset"],
          largestBlankRegion: Number(maxBlankRegion.toFixed(2))
        };
      }
      return {
        severity: "visual-warning",
        reasons: ["row-alignment"],
        largestBlankRegion: Number(maxBlankRegion.toFixed(2))
      };
    }
    if (expectedAsymmetryReasons.length) {
      return {
        severity: "expected-asymmetry",
        reasons: expectedAsymmetryReasons,
        largestBlankRegion: Number(maxBlankRegion.toFixed(2))
      };
    }
    if ((rowDiagnostic.warnings || []).length) {
      return {
        severity: "informational",
        reasons: rowDiagnostic.warnings.slice(),
        largestBlankRegion: Number(maxBlankRegion.toFixed(2))
      };
    }
    return {
      severity: "ok",
      reasons: [],
      largestBlankRegion: Number(maxBlankRegion.toFixed(2))
    };
  }

  function buildAdaptiveRowSeverityDiagnostics(rowDiagnostic) {
    var severityResult = classifyAdaptiveRowSeverity(rowDiagnostic);
    var leftCard = rowDiagnostic && rowDiagnostic.cards && rowDiagnostic.cards[0]
      ? rowDiagnostic.cards[0]
      : null;
    var rightCard = rowDiagnostic && rowDiagnostic.cards && rowDiagnostic.cards[1]
      ? rowDiagnostic.cards[1]
      : null;
    var visualPlacementDiagnostics = Array.isArray(rowDiagnostic && rowDiagnostic.cards)
      ? rowDiagnostic.cards.map(function (card) {
          return card && card.mediaVisualPlacement ? card.mediaVisualPlacement : null;
        }).filter(Boolean)
      : [];
    var maxBlankRegion = Number(severityResult.largestBlankRegion || 0);
    var visualAssessment = "balanced";
    if (severityResult.severity === "blocker") {
      visualAssessment = "broken";
    } else if (severityResult.severity === "visual-warning") {
      visualAssessment = "needs-attention";
    } else if (severityResult.severity === "expected-asymmetry") {
      visualAssessment = "intentional-asymmetry";
    } else if (maxBlankRegion > 24) {
      visualAssessment = "acceptable-asymmetry";
    }
    return {
      severity: severityResult.severity,
      severityReasons: severityResult.reasons || [],
      largestBlankRegion: maxBlankRegion,
      expectedAsymmetryReasons: severityResult.severity === "expected-asymmetry"
        ? (severityResult.reasons || [])
        : [],
      mediaVisualPlacementIssues: visualPlacementDiagnostics.reduce(function (issues, diagnostic) {
        (diagnostic.issues || []).forEach(function (issue) {
          if (issues.indexOf(issue) === -1) {
            issues.push(issue);
          }
        });
        return issues;
      }, []),
      alignmentMode: getAdaptiveRowAlignmentMode(
        rowDiagnostic ? rowDiagnostic.rowVariant : "",
        rowDiagnostic ? rowDiagnostic.cards : []
      ),
      visualAssessment: visualAssessment,
      largestBlankRegionByCard: {
        left: leftCard ? Number(getAdaptiveCardLargestBlankRegion(leftCard).toFixed(2)) : 0,
        right: rightCard ? Number(getAdaptiveCardLargestBlankRegion(rightCard).toFixed(2)) : 0
      }
    };
  }

  function measureAdaptiveOuterHeight(node) {
    if (!node || !node.getBoundingClientRect) {
      return 0;
    }
    var rect = node.getBoundingClientRect();
    var styles = window.getComputedStyle(node);
    return rect.height +
      (parseFloat(styles.marginTop || "0") || 0) +
      (parseFloat(styles.marginBottom || "0") || 0);
  }

  function measureAdaptiveContinuationTitleHeight(exportRoot, titleNode) {
    if (!exportRoot || !titleNode) {
      return 0;
    }
    var measurementHost = createAdaptiveMeasurementHost(exportRoot);
    var clone = titleNode.cloneNode(true);
    clone.classList.add("pi-export-section-title--continued");
    clone.removeAttribute("data-export-source-id");
    clone.textContent = [
      normalizeText(clone.textContent || ""),
      getGuideCopyText("continued_suffix", "continued")
    ].filter(Boolean).join(" \u2014 ");
    measurementHost.appendChild(clone);
    var height = measureAdaptiveOuterHeight(clone);
    measurementHost.parentNode.removeChild(measurementHost);
    return Math.ceil(height || 0);
  }

  function collectAdaptivePlanningSections(exportRoot, exportDocument) {
    return Array.prototype.slice.call(exportDocument.querySelectorAll(".pi-export-section")).map(function (sectionNode) {
      var titleNode = sectionNode.querySelector(".pi-export-section-title");
      var sectionAnchor = String(sectionNode.getAttribute("data-pdf-section-anchor") || "").trim();
      return {
        anchor: sectionAnchor,
        titleNode: titleNode,
        titleHeight: Math.ceil(measureAdaptiveOuterHeight(titleNode) || 0),
        continuationTitleHeight: Math.ceil(measureAdaptiveContinuationTitleHeight(exportRoot, titleNode) || 0),
        rowNodes: Array.prototype.slice.call(sectionNode.querySelectorAll(":scope > .pi-export-row")).map(function (rowNode) {
          return {
            node: rowNode,
            rowId: String(rowNode.getAttribute("data-pdf-row-id") || ""),
            sectionAnchor: sectionAnchor,
            sourceOrder: Number(rowNode.getAttribute("data-pdf-row-source-order") || 0),
            height: Math.ceil(measureAdaptiveOuterHeight(rowNode) || 0),
            naturalHeight: Number(rowNode.getAttribute("data-pdf-row-natural-height") || 0),
            rowVariant: String(rowNode.getAttribute("data-pdf-row-variant") || ""),
            rowScore: Number(rowNode.getAttribute("data-pdf-row-score") || 0),
            variants: String(rowNode.getAttribute("data-pdf-row-variants") || "").split(",").filter(Boolean),
            typographyScale: Number(rowNode.getAttribute("data-pdf-row-typography-scale") || 0)
          };
        })
      };
    }).filter(function (sectionPlan) {
      return sectionPlan.titleNode && sectionPlan.rowNodes.length;
    });
  }

  function collectAdaptivePlanningPositions(sectionPlans) {
    var positions = [];
    sectionPlans.forEach(function (sectionPlan, sectionIndex) {
      sectionPlan.rowNodes.forEach(function (rowNode, rowIndex) {
        positions.push({
          sectionIndex: sectionIndex,
          rowIndex: rowIndex,
          anchor: sectionPlan.anchor,
          rowNode: rowNode.node
        });
      });
    });
    return positions;
  }

  function populateAdaptivePageSegment(targetBody, sectionPlans, positions, startIndex, endIndex) {
    var currentSlice = null;
    var currentSectionIndex = -1;
    for (var positionIndex = startIndex; positionIndex < endIndex; positionIndex += 1) {
      var position = positions[positionIndex];
      var sectionPlan = sectionPlans[position.sectionIndex];
      if (!sectionPlan) {
        continue;
      }
      if (currentSectionIndex !== position.sectionIndex) {
        currentSlice = createSectionSlice(
          targetBody.ownerDocument,
          sectionPlan.titleNode,
          position.rowIndex > 0
        );
        targetBody.appendChild(currentSlice.section);
        currentSectionIndex = position.sectionIndex;
      }
      currentSlice.items.appendChild(position.rowNode.cloneNode(true));
    }
  }

  function measureAdaptivePageCandidate(exportState, sectionPlans, positions, startIndex, endIndex, measurementCache) {
    var cacheKey = [startIndex, endIndex].join(":");
    if (measurementCache[cacheKey]) {
      return measurementCache[cacheKey];
    }
    var usedHeight = 0;
    var rowCount = 0;
    var cardCount = 0;
    var selectedVariants = [];
    var rowPlan = [];
    var rowQualityScore = 0;
    var currentSectionIndex = -1;
    for (var positionIndex = startIndex; positionIndex < endIndex; positionIndex += 1) {
      var position = positions[positionIndex];
      var sectionPlan = sectionPlans[position.sectionIndex];
      var rowMeta = sectionPlan && sectionPlan.rowNodes[position.rowIndex];
      if (!sectionPlan || !rowMeta) {
        continue;
      }
      if (currentSectionIndex !== position.sectionIndex) {
        usedHeight += position.rowIndex > 0
          ? sectionPlan.continuationTitleHeight
          : sectionPlan.titleHeight;
        currentSectionIndex = position.sectionIndex;
      }
      usedHeight += rowMeta.height;
      rowCount += 1;
      cardCount += rowMeta.node.querySelectorAll(".pi-export-card").length;
      rowPlan.push({
        rowVariant: rowMeta.rowVariant,
        score: rowMeta.rowScore,
        variants: rowMeta.variants
      });
      rowQualityScore += Number(rowMeta.rowScore || 0);
      Array.prototype.slice.call(rowMeta.node.querySelectorAll(".pi-export-card[data-pdf-selected-variant]")).forEach(function (cardNode) {
        selectedVariants.push({
          blockId: String(cardNode.getAttribute("data-pdf-block-id") || ""),
          variant: String(cardNode.getAttribute("data-pdf-selected-variant") || "")
        });
      });
    }
    var occupancy = Math.max(0, Math.min(1, usedHeight / PDF_EXPORT_PAGE_BODY_HEIGHT));
    var overflowPixels = Math.max(0, usedHeight - PDF_EXPORT_PAGE_BODY_HEIGHT);
    var startPosition = positions[startIndex];
    var endPosition = positions[endIndex - 1];
    var candidate = {
      startIndex: startIndex,
      endIndex: endIndex,
      fits: overflowPixels <= 1,
      overflowPixels: overflowPixels,
      summary: {
        pageNumber: 0,
        occupiedHeight: Number(usedHeight.toFixed(2)),
        usableHeight: PDF_EXPORT_PAGE_BODY_HEIGHT,
        remainingHeight: Number(Math.max(0, PDF_EXPORT_PAGE_BODY_HEIGHT - usedHeight).toFixed(2)),
        occupancy: Number(occupancy.toFixed(3)),
        sectionCount: Array.from(new Set(positions.slice(startIndex, endIndex).map(function (position) {
          return position.sectionIndex;
        }))).length,
        cardCount: cardCount,
        rowCount: rowCount,
        rowQualityScore: Number(rowQualityScore.toFixed(2)),
        selectedVariants: selectedVariants,
        rowPlan: rowPlan,
        sparseWarningReason: ""
      },
      startsContinuation: !!(startPosition && startPosition.rowIndex > 0),
      endsWithSplitSection: !!(
        endPosition &&
        sectionPlans[endPosition.sectionIndex] &&
        endPosition.rowIndex < sectionPlans[endPosition.sectionIndex].rowNodes.length - 1
      ),
      rows: positions.slice(startIndex, endIndex).map(function (position) {
        return {
          sectionIndex: position.sectionIndex,
          rowIndex: position.rowIndex,
          anchor: position.anchor
        };
      })
    };
    measurementCache[cacheKey] = candidate;
    return candidate;
  }

  function scoreAdaptivePageCandidate(candidate, pageIndex, pageCount) {
    var occupancy = candidate && candidate.summary ? Number(candidate.summary.occupancy || 0) : 0;
    var penalty = 0;
    if (!candidate || !candidate.fits) {
      return Number.POSITIVE_INFINITY;
    }
    if (occupancy < 0.5) {
      penalty += 3000 + ((0.5 - occupancy) * 10000);
    } else if (occupancy < PDF_ADAPTIVE_SPARSE_PAGE_THRESHOLD) {
      penalty += 900 + ((PDF_ADAPTIVE_SPARSE_PAGE_THRESHOLD - occupancy) * 4000);
    }
    if (occupancy > 0.95) {
      penalty += 300 + ((occupancy - 0.95) * 6000);
    }
    if (candidate.summary.rowCount === 1 && occupancy < 0.7 && pageIndex < pageCount) {
      penalty += 500;
    }
    if (candidate.endsWithSplitSection) {
      penalty += 35;
    }
    if (candidate.startsContinuation) {
      penalty += 20;
    }
    penalty += Number(candidate.summary && candidate.summary.rowQualityScore || 0) * 0.012;
    return Number(penalty.toFixed(2));
  }

  function evaluateAdaptivePagePlans(exportState, sectionPlans) {
    var positions = collectAdaptivePlanningPositions(sectionPlans);
    var measurementCache = {};
    var plannerDiagnostics = {
      plansEvaluated: 0,
      plansPruned: 0,
      candidateFits: 0,
      candidateOverflows: 0,
      bestTwoPageScore: null,
      bestThreePageScore: null,
      bestFourPageScore: null,
      bestRejectedTwoPageReason: null,
      bestRejectedThreePageReason: null,
      selectedPlan: null
    };
    if (!positions.length) {
      return {
        plan: [],
        diagnostics: plannerDiagnostics
      };
    }
    var finishedPlans = [];

    function explore(startIndex, pages) {
      if (pages.length > positions.length) {
        plannerDiagnostics.plansPruned += 1;
        return;
      }
      if (startIndex >= positions.length) {
        plannerDiagnostics.plansEvaluated += 1;
        finishedPlans.push(pages.slice());
        return;
      }
      for (var endIndex = startIndex + 1; endIndex <= positions.length; endIndex += 1) {
        var candidate = measureAdaptivePageCandidate(exportState, sectionPlans, positions, startIndex, endIndex, measurementCache);
        if (!candidate.fits) {
          plannerDiagnostics.candidateOverflows += 1;
          plannerDiagnostics.plansPruned += 1;
          break;
        }
        plannerDiagnostics.candidateFits += 1;
        pages.push(candidate);
        explore(endIndex, pages);
        pages.pop();
      }
    }

    explore(0, []);

    var scoredPlans = finishedPlans.map(function (pages) {
      var score = pages.length * 10000;
      pages.forEach(function (candidate, pageIndex) {
        score += scoreAdaptivePageCandidate(candidate, pageIndex + 1, pages.length);
      });
      return {
        pages: pages,
        pageCount: pages.length,
        score: Number(score.toFixed(2))
      };
    }).sort(function (left, right) {
      return left.score - right.score;
    });

    var bestPlan = scoredPlans[0] || null;
    var bestTwo = scoredPlans.find(function (plan) {
      return plan.pageCount === 2;
    }) || null;
    var bestThree = scoredPlans.find(function (plan) {
      return plan.pageCount === 3;
    }) || null;
    var bestFour = scoredPlans.find(function (plan) {
      return plan.pageCount === 4;
    }) || null;

    plannerDiagnostics.bestTwoPageScore = bestTwo ? bestTwo.score : null;
    plannerDiagnostics.bestThreePageScore = bestThree ? bestThree.score : null;
    plannerDiagnostics.bestFourPageScore = bestFour ? bestFour.score : null;
    plannerDiagnostics.selectedPlan = bestPlan ? {
      pageCount: bestPlan.pageCount,
      score: bestPlan.score,
      pages: bestPlan.pages.map(function (candidate, index) {
        return {
          page: index + 1,
          occupancy: candidate.summary.occupancy,
          rows: candidate.rows,
          rowVariants: candidate.summary.rowPlan
        };
      })
    } : null;
    if (!bestThree) {
      plannerDiagnostics.bestRejectedThreePageReason = "No valid 3-page composition fit within the measured A4 page body.";
    } else if (bestPlan && bestPlan.pageCount > 3) {
      plannerDiagnostics.bestRejectedThreePageReason = "The best 3-page composition incurred a higher density/quality penalty than the selected plan.";
    }

    return {
      plan: bestPlan ? bestPlan.pages : [],
      plans: scoredPlans,
      diagnostics: plannerDiagnostics
    };
  }

  function buildAdaptivePlannedPages(exportState, exportPages, firstPageState, sectionPlans, plannedPages) {
    var documentNode = exportState.exportDocument.ownerDocument;
    var pageState = firstPageState;

    function nextAdaptivePage() {
      pageState = createExportPageShell(documentNode, exportState.exportDocument);
      exportPages.appendChild(pageState.page);
      return pageState;
    }

    plannedPages.forEach(function (candidate, candidateIndex) {
      if (candidateIndex > 0) {
        nextAdaptivePage();
      }
      var currentSlice = null;
      var currentSectionIndex = -1;
      candidate.rows.forEach(function (rowRef) {
        var sectionPlan = sectionPlans[rowRef.sectionIndex];
        var rowMeta = sectionPlan && sectionPlan.rowNodes[rowRef.rowIndex];
        var rowNode = rowMeta && rowMeta.node;
        if (!sectionPlan || !rowNode) {
          return;
        }
        if (currentSectionIndex !== rowRef.sectionIndex) {
          currentSlice = createSectionSlice(
            documentNode,
            sectionPlan.titleNode,
            rowRef.rowIndex > 0
          );
          pageState.body.appendChild(currentSlice.section);
          currentSectionIndex = rowRef.sectionIndex;
        }
        currentSlice.items.appendChild(rowNode);
      });
      pageState.hasContent = true;
    });
  }

  function getAdaptivePageOverflowPixels(pageNode) {
    var viewport = pageNode && pageNode.querySelector
      ? pageNode.querySelector(".pi-export-page-body")
      : null;
    if (!viewport) {
      return 0;
    }
    return Math.max(0, viewport.scrollHeight - viewport.clientHeight);
  }

  function collectAdaptivePageSummary(exportPages) {
    var pageNodes = Array.prototype.slice.call(exportPages.querySelectorAll(".pi-export-page"));
    return pageNodes.map(function (pageNode, pageIndex) {
      var viewport = pageNode.querySelector(".pi-export-page-body");
      var viewportRect = viewport ? viewport.getBoundingClientRect() : null;
      var pageDirection = String((pageNode.getAttribute("dir") || pageNode.closest(".pi-export-document") && pageNode.closest(".pi-export-document").getAttribute("dir") || "ltr")).toLowerCase();
      var structuralBottom = viewportRect ? viewportRect.top : 0;
      var contentBottom = viewportRect ? viewportRect.top : 0;
      if (viewport) {
        Array.prototype.slice.call(viewport.children).forEach(function (childNode) {
          var childNodes = childNode.classList && childNode.classList.contains("pi-export-section")
            ? Array.prototype.slice.call(childNode.children)
            : [childNode];
          childNodes.forEach(function (measuredNode) {
            if (!measuredNode || !measuredNode.getBoundingClientRect) {
              return;
            }
            var styles = window.getComputedStyle(measuredNode);
            if (styles.display === "none" || styles.visibility === "hidden" || styles.position === "absolute") {
              return;
            }
            var rect = measuredNode.getBoundingClientRect();
            if (rect.width <= 0 || rect.height <= 0) {
              return;
            }
            structuralBottom = Math.max(structuralBottom, rect.bottom);
          });
        });
        Array.prototype.slice.call(viewport.querySelectorAll("*")).forEach(function (descendantNode) {
          if (!descendantNode || !descendantNode.getBoundingClientRect) {
            return;
          }
          if (
            descendantNode.classList &&
            (
              descendantNode.classList.contains("pi-export-row") ||
              descendantNode.classList.contains("pi-export-card") ||
              descendantNode.classList.contains("pi-export-card-layout") ||
              descendantNode.classList.contains("pi-export-card-text") ||
              descendantNode.classList.contains("pi-export-card-flex-spacer")
            )
          ) {
            return;
          }
          var descendantStyles = window.getComputedStyle(descendantNode);
          if (descendantStyles.display === "none" || descendantStyles.visibility === "hidden" || descendantStyles.position === "absolute") {
            return;
          }
          var descendantRect = descendantNode.getBoundingClientRect();
          if (descendantRect.width <= 0 || descendantRect.height <= 0) {
            return;
          }
          contentBottom = Math.max(contentBottom, descendantRect.bottom);
        });
      }
      var structuralOccupiedHeight = viewport && viewportRect
        ? Math.max(0, Math.min(viewport.clientHeight, structuralBottom - viewportRect.top))
        : 0;
      var occupiedHeight = viewport && viewportRect
        ? Math.max(0, Math.min(viewport.clientHeight, contentBottom - viewportRect.top))
        : 0;
      var usableHeight = viewport ? viewport.clientHeight : 0;
      var occupancy = usableHeight
        ? Math.max(0, Math.min(1, occupiedHeight / usableHeight))
        : 0;
      var structuralOccupancy = usableHeight
        ? Math.max(0, Math.min(1, structuralOccupiedHeight / usableHeight))
        : 0;
      var remainingHeight = Math.max(0, usableHeight - occupiedHeight);
      var sectionCount = pageNode.querySelectorAll(".pi-export-section").length;
      var rowNodes = Array.prototype.slice.call(pageNode.querySelectorAll(".pi-export-row"));
      var hasLargeVisual = !!pageNode.querySelector(".pi-export-map, .pi-export-parking-map--adaptive");
      var sparseWarningReason = "";
      if (
        pageIndex > 0 &&
        occupancy < PDF_ADAPTIVE_SPARSE_PAGE_THRESHOLD &&
        !hasLargeVisual &&
        pageIndex < pageNodes.length - 1
      ) {
        sparseWarningReason = "low-occupancy";
      }
      function rectDiagnostic(node) {
        if (!node || !node.getBoundingClientRect) {
          return null;
        }
        var rect = node.getBoundingClientRect();
        return {
          left: Number(rect.left.toFixed(2)),
          top: Number(rect.top.toFixed(2)),
          right: Number(rect.right.toFixed(2)),
          bottom: Number(rect.bottom.toFixed(2)),
          width: Number(rect.width.toFixed(2)),
          height: Number(rect.height.toFixed(2)),
          centerX: Number((rect.left + (rect.width / 2)).toFixed(2)),
          centerY: Number((rect.top + (rect.height / 2)).toFixed(2))
        };
      }
      return {
        pageNumber: pageIndex + 1,
        pageRect: rectDiagnostic(pageNode),
        viewportRect: rectDiagnostic(viewport),
        occupiedHeight: Number(occupiedHeight.toFixed(2)),
        structuralOccupiedHeight: Number(structuralOccupiedHeight.toFixed(2)),
        usableHeight: usableHeight,
        remainingHeight: Number(remainingHeight.toFixed(2)),
        occupancy: Number(occupancy.toFixed(3)),
        contentOccupancy: Number(occupancy.toFixed(3)),
        structuralOccupancy: Number(structuralOccupancy.toFixed(3)),
        sectionCount: sectionCount,
        cardCount: pageNode.querySelectorAll(".pi-export-card").length,
        rowCount: rowNodes.length,
        selectedVariants: Array.prototype.slice.call(pageNode.querySelectorAll(".pi-export-card[data-pdf-selected-variant]")).map(function (cardNode) {
          return {
            blockId: String(cardNode.getAttribute("data-pdf-block-id") || ""),
            variant: String(cardNode.getAttribute("data-pdf-selected-variant") || "")
          };
        }),
        rowPlan: rowNodes.map(function (rowNode) {
          var rowCardNodes = Array.prototype.slice.call(rowNode.querySelectorAll(".pi-export-card"));
          var rowTypographyScales = rowCardNodes.map(function (cardNode) {
            return Number(cardNode.getAttribute("data-pdf-card-typography-scale") || 0);
          }).filter(Boolean);
          var cardDiagnostics = rowCardNodes.map(function (cardNode) {
            var badgeNode = cardNode.querySelector(".pi-export-step-badge");
            var badgeInnerNode = badgeNode ? badgeNode.querySelector("span") : null;
            var titleNode = cardNode.querySelector(".pi-export-card-title");
            var headerNode = cardNode.querySelector("[data-card-region='header']");
            var bodyRegionNode = cardNode.querySelector("[data-card-region='body']");
            var mediaNode = cardNode.querySelector(".pi-export-card-media");
            var footerRegionNode = cardNode.querySelector("[data-card-region='footer']");
            var titleRect = rectDiagnostic(titleNode);
            var badgeRect = rectDiagnostic(badgeNode);
            var badgeInnerRect = rectDiagnostic(badgeInnerNode);
            var headerRect = rectDiagnostic(headerNode);
            var bodyRect = rectDiagnostic(bodyRegionNode);
            var mediaRect = rectDiagnostic(mediaNode);
            var footerRect = rectDiagnostic(footerRegionNode);
            var cardRect = rectDiagnostic(cardNode);
            var styles = window.getComputedStyle(cardNode);
            var titleStyles = titleNode ? window.getComputedStyle(titleNode) : null;
            var bodyNode = cardNode.querySelector(".pi-export-card-body");
            var bodyStyles = bodyNode ? window.getComputedStyle(bodyNode) : null;
            var captionNode = cardNode.querySelector(".pi-export-card-caption");
            var captionStyles = captionNode ? window.getComputedStyle(captionNode) : null;
            var linkNode = cardNode.querySelector(".pi-export-card-link");
            var linkStyles = linkNode ? window.getComputedStyle(linkNode) : null;
            var mediaVisualPlacement = collectAdaptiveMediaVisualPlacement(cardNode);
            var badgeDeviationX = badgeRect && badgeInnerRect
              ? Math.abs(badgeRect.centerX - badgeInnerRect.centerX)
              : 0;
            var badgeDeviationY = badgeRect && badgeInnerRect
              ? Math.abs(badgeRect.centerY - badgeInnerRect.centerY)
              : 0;
            var distribution = {};
            var contentProfile = {};
            var rowProjection = {};
            try {
              distribution = JSON.parse(cardNode.getAttribute("data-pdf-card-region-distribution") || "{}");
            } catch (error) {
              distribution = {};
            }
            try {
              contentProfile = JSON.parse(cardNode.getAttribute("data-pdf-card-content-profile") || "{}");
            } catch (error) {
              contentProfile = {};
            }
            try {
              rowProjection = JSON.parse(cardNode.getAttribute("data-pdf-card-row-projection") || "{}");
            } catch (error) {
              rowProjection = {};
            }
            var containmentDiagnostics = collectAdaptiveCardContainment(cardNode);
            var warnings = [];
            if (badgeDeviationX > PDF_ADAPTIVE_BADGE_CENTER_WARNING_PX || badgeDeviationY > PDF_ADAPTIVE_BADGE_CENTER_WARNING_PX) {
              warnings.push("badge-center-deviation");
            }
            if (Number(cardNode.getAttribute("data-pdf-card-internal-free-space") || 0) > 72) {
              warnings.push("excess-internal-free-space");
            }
            if (Number(cardNode.getAttribute("data-pdf-card-natural-height") || 0) > Number(cardNode.getAttribute("data-pdf-card-row-height") || 0) + 1) {
              warnings.push("content-overflow");
            }
            if (!containmentDiagnostics.valid) {
              warnings.push("card-containment-overflow");
            }
            if (mediaVisualPlacement && mediaVisualPlacement.severity !== "ok") {
              Array.prototype.push.apply(warnings, mediaVisualPlacement.issues || []);
            }
            return {
              blockId: String(cardNode.getAttribute("data-pdf-block-id") || ""),
              cardRect: cardRect,
              cardBounds: containmentDiagnostics.cardBounds,
              innerBounds: containmentDiagnostics.innerBounds,
              stepNumber: normalizeText((badgeInnerNode && (badgeInnerNode.textContent || "")) || ""),
              title: normalizeText((titleNode && (titleNode.textContent || "")) || ""),
              variant: String(cardNode.getAttribute("data-pdf-selected-variant") || ""),
              typographyScale: Number(cardNode.getAttribute("data-pdf-card-typography-scale") || 0),
              titleFontSize: titleStyles ? Number(parseFloat(titleStyles.fontSize || "0").toFixed(2)) : 0,
              bodyFontSize: bodyStyles ? Number(parseFloat(bodyStyles.fontSize || "0").toFixed(2)) : 0,
              captionFontSize: captionStyles ? Number(parseFloat(captionStyles.fontSize || "0").toFixed(2)) : 0,
              linkFontSize: linkStyles ? Number(parseFloat(linkStyles.fontSize || "0").toFixed(2)) : 0,
              lineHeight: bodyStyles ? Number(parseFloat(bodyStyles.lineHeight || "0").toFixed(2)) : 0,
              badgeWidth: badgeRect ? badgeRect.width : 0,
              badgeHeight: badgeRect ? badgeRect.height : 0,
              badgeRect: badgeRect,
              badgeInnerRect: badgeInnerRect,
              badgeCenterDeviationX: Number(badgeDeviationX.toFixed(2)),
              badgeCenterDeviationY: Number(badgeDeviationY.toFixed(2)),
              headerHeight: Number(cardNode.getAttribute("data-pdf-card-header-height") || 0),
              appliedHeaderHeight: Number(cardNode.getAttribute("data-pdf-card-applied-header-height") || 0),
              bodyHeight: Number(cardNode.getAttribute("data-pdf-card-body-height") || 0),
              mediaHeight: Number(cardNode.getAttribute("data-pdf-card-media-height") || 0),
              footerHeight: Number(cardNode.getAttribute("data-pdf-card-footer-height") || 0),
              headerRect: headerRect,
              bodyRect: bodyRect,
              titleRect: titleRect,
              titleTop: titleRect ? titleRect.top : 0,
              titleLineCount: Math.max(0, Number(cardNode.getAttribute("data-pdf-card-title-lines") || 0)),
              naturalContentHeight: Number(cardNode.getAttribute("data-pdf-card-natural-height") || 0),
              renderedCardHeight: Number(cardNode.getAttribute("data-pdf-card-row-height") || 0),
              rowHeight: Number(rowNode.getAttribute("data-pdf-row-height") || 0),
              internalFreeSpace: Number(cardNode.getAttribute("data-pdf-card-internal-free-space") || 0),
              overflowPixels: Math.max(0, Number(cardNode.getAttribute("data-pdf-card-natural-height") || 0) - Number(cardNode.getAttribute("data-pdf-card-row-height") || 0)),
              overflowTop: containmentDiagnostics.overflowTop,
              overflowRight: containmentDiagnostics.overflowRight,
              overflowBottom: containmentDiagnostics.overflowBottom,
              overflowLeft: containmentDiagnostics.overflowLeft,
              containmentValid: containmentDiagnostics.valid,
              descendantBounds: containmentDiagnostics.descendantBounds,
              mediaTop: mediaRect ? mediaRect.top : 0,
              mediaBottom: mediaRect ? mediaRect.bottom : 0,
              footerTop: footerRect ? footerRect.top : 0,
              footerBottom: footerRect ? footerRect.bottom : 0,
              mediaVisualPlacement: mediaVisualPlacement,
              mediaVerticalAlignmentMode: String(cardNode.getAttribute("data-pdf-media-vertical-alignment") || "natural"),
              typographySelection: (function () {
                try {
                  return JSON.parse(cardNode.getAttribute("data-pdf-card-typography-selection") || "{}");
                } catch (error) {
                  return {};
                }
              })(),
              assignedFreeSpace: distribution,
              trailingResidualSpace: Number(cardNode.getAttribute("data-pdf-card-trailing-space") || 0),
              contentProfile: contentProfile,
              rowProjection: rowProjection,
              direction: pageDirection,
              language: String(cardNode.closest(".pi-export-document") && cardNode.closest(".pi-export-document").getAttribute("lang") || SOURCE_LANGUAGE),
              warnings: warnings
            };
          });
          var renderedHeights = cardDiagnostics.map(function (card) { return Number(card.renderedCardHeight || 0); }).filter(Boolean);
          var equalizedHeightDifference = renderedHeights.length > 1
            ? Math.max.apply(null, renderedHeights) - Math.min.apply(null, renderedHeights)
            : 0;
          var internalFreeSpaces = cardDiagnostics.map(function (card) { return Number(card.internalFreeSpace || 0); });
          var internalFreeSpaceDifference = internalFreeSpaces.length > 1
            ? Math.max.apply(null, internalFreeSpaces) - Math.min.apply(null, internalFreeSpaces)
            : 0;
          var titleTops = cardDiagnostics.map(function (card) { return Number(card.titleTop || 0); }).filter(Boolean);
          var titleTopDifference = titleTops.length > 1
            ? Math.max.apply(null, titleTops) - Math.min.apply(null, titleTops)
            : 0;
          var mediaBottoms = cardDiagnostics.map(function (card) { return Number(card.mediaBottom || 0); }).filter(Boolean);
          var mediaBottomDifference = mediaBottoms.length > 1
            ? Math.max.apply(null, mediaBottoms) - Math.min.apply(null, mediaBottoms)
            : 0;
          var footerBottoms = cardDiagnostics.filter(function (card) {
            return Number(card.footerHeight || 0) > 0;
          }).map(function (card) { return Number(card.footerBottom || 0); }).filter(Boolean);
          var footerBottomDifference = footerBottoms.length > 1
            ? Math.max.apply(null, footerBottoms) - Math.min.apply(null, footerBottoms)
            : 0;
          var rowWarnings = [];
          if (equalizedHeightDifference > 1) {
            rowWarnings.push("unequal-rendered-heights");
          }
          if (rowTypographyScales.length > 1 && rowTypographyScales.some(function (scale) { return scale !== rowTypographyScales[0]; })) {
            rowWarnings.push("mixed-typography-scales");
          }
          if (internalFreeSpaceDifference > PDF_ADAPTIVE_FREE_SPACE_WARNING_PX) {
            rowWarnings.push("uneven-internal-free-space");
          }
          if (titleTopDifference > PDF_ADAPTIVE_TITLE_ALIGNMENT_WARNING_PX) {
            rowWarnings.push("title-misalignment");
          }
          if (mediaBottomDifference > PDF_ADAPTIVE_MEDIA_ALIGNMENT_WARNING_PX && cardDiagnostics.every(function (card) { return Number(card.mediaHeight || 0) > 0; })) {
            rowWarnings.push("media-misalignment");
          }
          if (footerBottomDifference > PDF_ADAPTIVE_FOOTER_ALIGNMENT_WARNING_PX && footerBottoms.length > 1) {
            rowWarnings.push("footer-misalignment");
          }
          if (cardDiagnostics.some(function (card) {
            return card.mediaVisualPlacement && card.mediaVisualPlacement.severity !== "ok";
          })) {
            rowWarnings.push("media-visual-placement");
          }
          var rowDiagnostic = {
            rowRect: rectDiagnostic(rowNode),
            rowId: String(rowNode.getAttribute("data-pdf-row-id") || ""),
            rowVariant: String(rowNode.getAttribute("data-pdf-row-variant") || ""),
            score: Number(rowNode.getAttribute("data-pdf-row-score") || 0),
            variants: String(rowNode.getAttribute("data-pdf-row-variants") || "").split(",").filter(Boolean),
            typographyScale: Number(rowNode.getAttribute("data-pdf-row-typography-scale") || 0),
            rowHeight: Number(rowNode.getAttribute("data-pdf-row-height") || 0),
            rowNaturalHeight: Number(rowNode.getAttribute("data-pdf-row-natural-height") || 0),
            headerHeight: Number(rowNode.getAttribute("data-pdf-row-header-height") || 0),
            headerStrategy: String(rowNode.getAttribute("data-pdf-row-header-strategy") || "natural"),
            titleToMediaSeparationPenalty: Number(rowNode.getAttribute("data-pdf-row-title-media-penalty") || 0),
            internalUnusedSpacePenalty: Number(rowNode.getAttribute("data-pdf-row-unused-space-penalty") || 0),
            equalizationGrowthPenalty: Number(rowNode.getAttribute("data-pdf-row-equalization-penalty") || 0),
            mediaUsefulnessPenalty: Number(rowNode.getAttribute("data-pdf-row-media-usefulness-penalty") || 0),
            mediaSizeMismatchPenalty: Number(rowNode.getAttribute("data-pdf-row-media-mismatch-penalty") || 0),
            equalizedHeightDifference: Number(equalizedHeightDifference.toFixed(2)),
            internalFreeSpaceDifference: Number(internalFreeSpaceDifference.toFixed(2)),
            titleTopDifference: Number(titleTopDifference.toFixed(2)),
            mediaBottomDifference: Number(mediaBottomDifference.toFixed(2)),
            footerBottomDifference: Number(footerBottomDifference.toFixed(2)),
            cards: cardDiagnostics,
            warnings: rowWarnings
          };
          return Object.assign(rowDiagnostic, buildAdaptiveRowSeverityDiagnostics(rowDiagnostic));
        }),
        sparseWarningReason: sparseWarningReason
      };
    });
  }

  function applyAdaptiveSectionRows(exportState) {
    var exportDocument = exportState.exportDocument;
    var measurementHost = createAdaptiveMeasurementHost(exportState.exportRoot);
    var measurementCache = {};
    var adaptiveRowSequence = 0;
    var summary = {
      layout: "adaptive",
      pageCount: 0,
      compactCount: 0,
      mediumCount: 0,
      wideCount: 0,
      portraitImageCount: 0,
      landscapeImageCount: 0,
      squareImageCount: 0,
      sparsePageWarnings: [],
      pageOccupancy: [],
      sectionPlans: []
    };

    Array.prototype.slice.call(exportDocument.querySelectorAll(".pi-export-section")).forEach(function (sectionNode) {
      var sectionAnchor = String(sectionNode.getAttribute("data-pdf-section-anchor") || "").trim();
      var titleNode = sectionNode.querySelector(".pi-export-section-title");
      var parkingMapNode = sectionNode.querySelector(".pi-export-parking-map");
      var cards = Array.prototype.slice.call(sectionNode.querySelectorAll(":scope > .pi-export-card"));
      var rows = [];
      var cardPlans = [];

      if (sectionAnchor === "parking" && parkingMapNode && cards[0]) {
        Array.prototype.slice.call(cards[0].querySelectorAll(".pi-export-card-media [data-export-image-frame]")).forEach(function (frameNode) {
          if (frameNode.parentNode) {
            frameNode.parentNode.removeChild(frameNode);
          }
        });
      }

      cards.forEach(function (cardNode) {
        var cardPlan = createAdaptiveCardCandidates(cardNode, measurementHost, measurementCache);
        cardPlans.push(cardPlan);
        if (cardPlan.orientation === "portrait") {
          summary.portraitImageCount += 1;
        } else if (cardPlan.orientation === "landscape") {
          summary.landscapeImageCount += 1;
        } else {
          summary.squareImageCount += 1;
        }
      });

      if (sectionAnchor === "parking" && parkingMapNode && cardPlans.length) {
        var parkingTextPlan = cardPlans.shift();
        var parkingVariant = getAdaptiveParkingCompositeVariant(
          parkingTextPlan.cardNode,
          parkingMapNode,
          exportDocument.getAttribute("dir") || "ltr",
          sectionNode
        );
        parkingTextPlan.cardNode.classList.remove(
          "pi-export-card--adaptive-compact",
          "pi-export-card--adaptive-medium",
          "pi-export-card--adaptive-wide",
          "pi-export-card--adaptive-half",
          "pi-export-card--adaptive-full",
          "pi-export-card--adaptive-portrait",
          "pi-export-card--adaptive-landscape",
          "pi-export-card--adaptive-square",
          "pi-export-card--adaptive-layout-half-compact",
          "pi-export-card--adaptive-layout-half-landscape-stacked",
          "pi-export-card--adaptive-layout-half-portrait-side",
          "pi-export-card--adaptive-layout-wide-horizontal",
          "pi-export-card--adaptive-layout-wide-stacked"
        );
        parkingTextPlan.cardNode.classList.add("pi-export-card--adaptive", "pi-export-card--adaptive-parking-text");
        parkingTextPlan.cardNode.setAttribute("data-pdf-selected-variant", "parking-text");
        parkingTextPlan.cardNode.setAttribute("data-pdf-parking-variant", parkingVariant);
        if (parkingVariant === "parking-map-right-list-columns") {
          parkingTextPlan.cardNode.classList.add("pi-export-card--adaptive-parking-list-columns");
        } else {
          parkingTextPlan.cardNode.classList.remove("pi-export-card--adaptive-parking-list-columns");
        }
        parkingTextPlan.cardNode.style.width = "";
        parkingTextPlan.cardNode.setAttribute("data-pdf-card-kind", "medium");
        parkingTextPlan.cardNode.setAttribute("data-pdf-card-height", "0");
        parkingMapNode.classList.add("pi-export-parking-map--adaptive");
        parkingMapNode.setAttribute("data-pdf-parking-variant", parkingVariant);
        if (parkingVariant === "parking-map-right-actions-stack") {
          moveAdaptiveParkingActionsToMap(exportDocument.ownerDocument, parkingTextPlan.cardNode, parkingMapNode);
        }
        parkingMapNode.removeAttribute("data-pdf-section-item");
        parkingTextPlan.cardNode.removeAttribute("data-pdf-section-item");
        rows.push(createAdaptiveRow(
          exportDocument.ownerDocument,
          [parkingTextPlan.cardNode, parkingMapNode],
          "pi-export-row--parking",
          {
            rowId: sectionAnchor + "-row-" + (adaptiveRowSequence + 1),
            sectionAnchor: sectionAnchor,
            sourceOrder: adaptiveRowSequence + 1,
            score: 0,
            rowVariant: parkingVariant,
            cards: [{
              cardNode: parkingTextPlan.cardNode,
              variant: {
                kind: "medium",
                layout: parkingVariant,
                orientation: "square",
                isWide: false
              }
            }]
          }
        ));
        adaptiveRowSequence += 1;
        summary.mediumCount += 1;
      } else if (parkingMapNode) {
        parkingMapNode.classList.add("pi-export-parking-map--adaptive-standalone");
        rows.push(createAdaptiveRow(exportDocument.ownerDocument, [parkingMapNode], "pi-export-row--full", {
          rowId: sectionAnchor + "-row-" + (adaptiveRowSequence + 1),
          sectionAnchor: sectionAnchor,
          sourceOrder: adaptiveRowSequence + 1,
          rowVariant: "parking-map-standalone"
        }));
        adaptiveRowSequence += 1;
      }

      var planResult = planAdaptiveSectionRows(cardPlans);
      if (cardPlans.length && !planResult.rows.length) {
        var noValidRowPlan = {
          sectionAnchor: sectionAnchor,
          cardPlans: cardPlans.map(function (cardPlan) {
            return {
              blockId: String(cardPlan.blockId || ""),
              orientation: String(cardPlan.orientation || ""),
              textLength: Number(cardPlan.textLength || 0),
              hasMap: !!cardPlan.hasMap,
              isWarning: !!cardPlan.isWarning,
              wideCandidates: Number(cardPlan.wideCandidates ? cardPlan.wideCandidates.length : 0),
              halfCandidates: Number(cardPlan.halfCandidates ? cardPlan.halfCandidates.length : 0),
              candidateDiagnostics: (cardPlan.candidateDiagnostics || []).slice(0, 12)
            };
          })
        };
        window.__propertyInstructionLastPdfDiagnostics = Object.assign({}, window.__propertyInstructionLastPdfDiagnostics || {}, {
          adaptiveNoValidRowPlan: noValidRowPlan
        });
        var noValidRowPlanError = new Error("adaptive-no-valid-row-plan:" + JSON.stringify(noValidRowPlan));
        noValidRowPlanError.code = "adaptive-no-valid-row-plan";
        noValidRowPlanError.adaptiveNoValidRowPlan = noValidRowPlan;
        throw noValidRowPlanError;
      }
      summary.sectionPlans.push({
        anchor: sectionAnchor,
        score: Number((planResult.score || 0).toFixed(2)),
        rowCount: planResult.rows.length,
        cardCandidates: cardPlans.map(function (cardPlan) {
          return {
            blockId: String(cardPlan.blockId || ""),
            orientation: String(cardPlan.orientation || ""),
            textLength: Number(cardPlan.textLength || 0),
            contentProfile: cardPlan.contentProfile || null,
            candidateDiagnostics: cardPlan.candidateDiagnostics || []
          };
        }),
        adjacentPairEvaluations: planResult.pairDiagnostics || [],
        pairEvaluations: planResult.rows.filter(function (rowPlan) {
          return rowPlan.type === "pair";
        }).map(function (rowPlan) {
          return {
            rowHeight: Number(rowPlan.rowHeight || 0),
            evaluations: rowPlan.pairEvaluations || []
          };
        }),
        variants: planResult.rows.map(function (rowPlan) {
          return rowPlan.cards.map(function (cardEntry) {
            return String(cardEntry.variant.layout || cardEntry.variant.kind || "medium");
          });
        })
      });
      planResult.rows.forEach(function (rowPlan) {
        rowPlan.cards.forEach(function (cardEntry) {
          applyAdaptiveMeasurementVariant(cardEntry.cardNode, cardEntry.variant);
          cardEntry.cardNode.style.width = "";
          cardEntry.cardNode.removeAttribute("data-pdf-section-item");
          cardEntry.cardNode.setAttribute("data-pdf-card-kind", cardEntry.variant.kind);
          cardEntry.cardNode.setAttribute("data-pdf-card-height", String(cardEntry.variant.measuredHeight || 0));
          cardEntry.cardNode.setAttribute("data-pdf-card-natural-height", String(cardEntry.variant.naturalContentHeight || cardEntry.variant.measuredHeight || 0));
          cardEntry.cardNode.setAttribute("data-pdf-card-row-height", String(rowPlan.rowHeight || cardEntry.variant.measuredHeight || 0));
          cardEntry.cardNode.setAttribute(
            "data-pdf-card-internal-free-space",
            String(Math.max(0, Number(rowPlan.rowHeight || cardEntry.variant.measuredHeight || 0) - Number(cardEntry.variant.naturalContentHeight || cardEntry.variant.measuredHeight || 0)))
          );
          cardEntry.cardNode.setAttribute("data-pdf-card-typography-scale", String(cardEntry.variant.typographyScale || 1));
          cardEntry.cardNode.setAttribute("data-pdf-card-title-lines", String(cardEntry.variant.titleLines || 0));
          cardEntry.cardNode.setAttribute("data-pdf-card-title-font-size", String(cardEntry.variant.titleFontSize || 0));
          cardEntry.cardNode.setAttribute("data-pdf-card-body-font-size", String(cardEntry.variant.bodyFontSize || 0));
          cardEntry.cardNode.setAttribute("data-pdf-card-caption-font-size", String(cardEntry.variant.captionFontSize || 0));
          cardEntry.cardNode.setAttribute("data-pdf-card-link-font-size", String(cardEntry.variant.linkFontSize || 0));
          cardEntry.cardNode.setAttribute("data-pdf-card-line-height", String(cardEntry.variant.lineHeight || 0));
          cardEntry.cardNode.setAttribute("data-pdf-card-badge-size", String(cardEntry.variant.badgeSize || 0));
          cardEntry.cardNode.setAttribute("data-pdf-card-region-order", "header,body,media,footer");
          if (cardEntry.cardPlan && cardEntry.cardPlan.contentProfile) {
            cardEntry.cardNode.setAttribute(
              "data-pdf-card-content-profile",
              JSON.stringify(cardEntry.cardPlan.contentProfile)
            );
          }
          if (cardEntry.projection) {
            cardEntry.cardNode.setAttribute(
              "data-pdf-card-row-projection",
              JSON.stringify(cardEntry.projection)
            );
          }
          cardEntry.cardNode.setAttribute(
            "data-pdf-card-typography-selection",
            JSON.stringify(
              buildAdaptiveTypographySelectionDiagnostics(
                cardEntry.cardPlan,
                cardEntry.variant,
                rowPlan.rowHeight || cardEntry.variant.measuredHeight || 0
              )
            )
          );
          applyAdaptiveRowDistribution(cardEntry.cardNode, cardEntry.variant, Object.assign({}, rowPlan, {
            projection: cardEntry.projection || null
          }));
          summary[cardEntry.variant.kind + "Count"] += 1;
        });
        rows.push(createAdaptiveRow(
          exportDocument.ownerDocument,
          rowPlan.cards.map(function (cardEntry) {
            return cardEntry.cardNode;
          }),
          rowPlan.type === "pair" ? "pi-export-row--two-up" : "pi-export-row--full",
          Object.assign({
            rowId: sectionAnchor + "-row-" + (adaptiveRowSequence + 1),
            sectionAnchor: sectionAnchor,
            sourceOrder: adaptiveRowSequence + 1,
            rowVariant: rowPlan.type === "pair"
              ? "two-up"
              : String((rowPlan.cards[0] && rowPlan.cards[0].variant && rowPlan.cards[0].variant.layout) || "single")
          }, rowPlan)
        ));
        adaptiveRowSequence += 1;
      });

      Array.prototype.slice.call(sectionNode.children).forEach(function (childNode) {
        if (childNode !== titleNode) {
          sectionNode.removeChild(childNode);
        }
      });
      rows.forEach(function (rowNode) {
        sectionNode.appendChild(rowNode);
      });
    });

    if (measurementHost.parentNode) {
      measurementHost.parentNode.removeChild(measurementHost);
    }
    exportState.adaptiveLayoutSummary = summary;
    exportState.exportDocument.setAttribute("data-pdf-layout-mode", "adaptive");
    return summary;
  }

  function ensureAdaptiveContinuationTitle(titleNode) {
    if (!titleNode || titleNode.classList.contains("pi-export-section-title--continued")) {
      return;
    }
    var continuedSuffix = getGuideCopyText("continued_suffix", "continued");
    titleNode.classList.add("pi-export-section-title--continued");
    titleNode.textContent = String(titleNode.textContent || "").replace(/\s+[-–—]\s+.*$/, "") + " \u2014 " + continuedSuffix;
  }

  function rebalanceAdaptivePages(exportState) {
    if (!isAdaptivePdfLayoutEnabled() || !exportState || !exportState.exportPages) {
      return;
    }
    var pageNodes = Array.prototype.slice.call(exportState.exportPages.querySelectorAll(".pi-export-page"));
    for (var passIndex = 0; passIndex < PDF_ADAPTIVE_REBALANCE_PASSES; passIndex += 1) {
      var movedAny = false;
      for (var pageIndex = 0; pageIndex < pageNodes.length - 1; pageIndex += 1) {
        var currentViewport = pageNodes[pageIndex].querySelector(".pi-export-page-body");
        var nextViewport = pageNodes[pageIndex + 1].querySelector(".pi-export-page-body");
        if (!currentViewport || !nextViewport) {
          continue;
        }
        var currentSummary = collectAdaptivePageSummary(pageNodes[pageIndex].parentNode || exportState.exportPages)[pageIndex];
        if (!currentSummary || currentSummary.occupancy >= PDF_ADAPTIVE_SPARSE_PAGE_THRESHOLD) {
          continue;
        }
        var currentSections = Array.prototype.slice.call(currentViewport.querySelectorAll(".pi-export-section"));
        var nextSections = Array.prototype.slice.call(nextViewport.querySelectorAll(".pi-export-section"));
        var targetSection = currentSections[currentSections.length - 1];
        var sourceSection = nextSections[0];
        if (!targetSection || !sourceSection) {
          continue;
        }
        var sourceRow = sourceSection.querySelector(".pi-export-row");
        if (!sourceRow) {
          continue;
        }
        var targetAnchor = String(targetSection.getAttribute("data-pdf-section-anchor") || "");
        var sourceAnchor = String(sourceSection.getAttribute("data-pdf-section-anchor") || "");
        var titleNode = sourceSection.querySelector(".pi-export-section-title");
        var targetItems = targetSection.querySelector(".pi-export-section-items") || targetSection;
        var sourceItems = sourceSection.querySelector(".pi-export-section-items") || sourceSection;
        var insertedSection = null;
        if (targetAnchor === sourceAnchor) {
          sourceItems.removeChild(sourceRow);
          targetItems.appendChild(sourceRow);
        } else {
          insertedSection = sourceSection.cloneNode(false);
          if (titleNode) {
            insertedSection.appendChild(titleNode.cloneNode(true));
          }
          var insertedItems = sourceItems.cloneNode(false);
          insertedSection.appendChild(insertedItems);
          sourceItems.removeChild(sourceRow);
          insertedItems.appendChild(sourceRow);
          currentViewport.appendChild(insertedSection);
          if (titleNode && sourceItems.querySelector(".pi-export-row")) {
            ensureAdaptiveContinuationTitle(titleNode);
          }
        }
        if (
          currentViewport.scrollHeight <= currentViewport.clientHeight + 1 &&
          nextViewport.scrollHeight <= nextViewport.clientHeight + 1
        ) {
          if (!sourceItems.querySelector(".pi-export-row") && sourceSection.parentNode) {
            sourceSection.parentNode.removeChild(sourceSection);
          }
          movedAny = true;
        } else {
          if (insertedSection && insertedSection.parentNode) {
            insertedSection.parentNode.removeChild(insertedSection);
            sourceItems.insertBefore(sourceRow, sourceItems.querySelector(".pi-export-row"));
          } else {
            targetItems.removeChild(sourceRow);
            sourceItems.insertBefore(sourceRow, sourceItems.querySelector(".pi-export-row"));
          }
        }
      }
      if (!movedAny) {
        break;
      }
    }
  }

  function applyExportImageSizing(exportRoot) {
    var diagnostics = [];
    var exportDocument = exportRoot && exportRoot.querySelector
      ? exportRoot.querySelector(".pi-export-document")
      : null;
    var adaptiveLayoutMode = String(
      (exportRoot && exportRoot.getAttribute && exportRoot.getAttribute("data-pdf-layout-mode"))
      || (exportDocument && exportDocument.getAttribute && exportDocument.getAttribute("data-pdf-layout-mode"))
      || ""
    );
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
      var chosenLayout = null;
      var mediaWidth = availableWidth;
      var adaptivePdfMode = isAdaptivePdfLayoutEnabled() && adaptiveLayoutMode === "adaptive";
      var adaptiveLayout = adaptivePdfMode && cardNode;
      var adaptiveManagedMedia = adaptivePdfMode && (role === "qr" || role === "map" || !!cardNode);

      if (adaptiveManagedMedia) {
        var fitPolicy = getAdaptiveMediaFitPolicy(img, cardNode);
        var adaptiveFitted = null;
        var adaptiveFramePolicy = null;
        if (adaptiveLayout) {
          var orientation = String(cardNode.getAttribute("data-pdf-card-orientation") || getAdaptiveImageOrientation(img.naturalWidth, img.naturalHeight));
          var layout = String(cardNode.getAttribute("data-pdf-selected-variant") || "wide-horizontal");
          var regionDistribution = parsePdfJsonAttribute(cardNode.getAttribute("data-pdf-card-region-distribution"), {});
          var measuredMediaHeight = Number(cardNode.getAttribute("data-pdf-card-media-height") || 0);
          var mediaGrowth = Number(regionDistribution && regionDistribution.mediaGrowth || 0);
          var allowedMediaHeight = Math.max(0, Math.round(measuredMediaHeight + mediaGrowth));
          var aspectRatio = "";
          frame.style.minHeight = "0";
          frame.style.height = "auto";
          frame.style.maxHeight = "none";
          frame.style.aspectRatio = "";
          if (allowedMediaHeight > 0) {
            frame.style.maxHeight = allowedMediaHeight + "px";
            if (frame.parentNode && frame.parentNode.style) {
              frame.parentNode.style.maxHeight = allowedMediaHeight + "px";
            }
          }
          if (layout === "half-portrait-side" || layout === "half-portrait-side-narrow" || layout === "half-portrait-side-wide") {
            aspectRatio = orientation === "portrait" ? "3 / 4" : "4 / 5";
          } else if (layout === "half-portrait-stacked" || layout === "half-portrait-stacked-compact") {
            aspectRatio = orientation === "portrait" ? "4 / 5" : "1 / 1";
          } else if (layout === "parking-map-right") {
            aspectRatio = "4 / 3";
          } else if (layout === "parking-map-right-compact") {
            aspectRatio = "16 / 10";
          } else if (layout === "half-compact") {
            aspectRatio = orientation === "portrait" ? "4 / 5" : "16 / 10";
          } else if (layout === "half-landscape-stacked") {
            aspectRatio = orientation === "square" ? "4 / 3" : "16 / 10";
          } else if (layout === "wide-stacked") {
            aspectRatio = orientation === "portrait" ? "4 / 5" : "16 / 9";
          } else {
            aspectRatio = orientation === "portrait"
              ? "3 / 4"
              : (orientation === "square" ? "1 / 1" : "16 / 10");
          }
          frame.style.aspectRatio = aspectRatio;
          adaptiveFramePolicy = applyAdaptiveMediaFramePolicy(
            frame,
            frame.parentNode,
            cardNode,
            img,
            {
              availableWidth: availableWidth,
              availableHeight: allowedMediaHeight || getPdfImageMaxHeight(img),
              fitPolicy: fitPolicy
            }
          );
          adaptiveFitted = applyAdaptiveMediaDimensions(frame, img, {
            fitPolicy: fitPolicy,
            fallbackWidth: adaptiveFramePolicy && adaptiveFramePolicy.framePolicy === "shrink-wrap-natural"
              ? adaptiveFramePolicy.frameWidth
              : availableWidth,
            fallbackHeight: allowedMediaHeight || getPdfImageMaxHeight(img)
          });
        } else {
          if (role === "qr") {
            var qrBoxSize = Math.max(1, Math.min(frame.clientWidth || availableWidth, frame.clientHeight || frame.clientWidth || availableWidth));
            frame.style.width = qrBoxSize + "px";
            frame.style.height = qrBoxSize + "px";
            frame.style.minHeight = qrBoxSize + "px";
          }
          adaptiveFitted = applyAdaptiveMediaDimensions(frame, img, {
            fitPolicy: fitPolicy,
            fallbackWidth: frame.clientWidth || availableWidth,
            fallbackHeight: frame.clientHeight || getPdfImageMaxHeight(img)
          });
        }
        diagnostics.push({
          image: summarizeDiagnosticImageSource(
            img.getAttribute("data-export-image-original-src") || img.currentSrc || img.src || "",
            role
          ),
          mediaType: getExportMediaType(img),
          fitPolicy: fitPolicy,
          role: role,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          renderedWidth: adaptiveFitted ? adaptiveFitted.fittedWidth : 0,
          renderedHeight: adaptiveFitted ? adaptiveFitted.fittedHeight : 0,
          frameWidth: adaptiveFitted ? adaptiveFitted.frameWidth : Number(frame.clientWidth.toFixed ? frame.clientWidth.toFixed(2) : frame.clientWidth),
          frameHeight: adaptiveFitted ? adaptiveFitted.frameHeight : Number((frame.clientHeight || parseFloat(frame.style.maxHeight || "0") || 0).toFixed ? (frame.clientHeight || parseFloat(frame.style.maxHeight || "0") || 0).toFixed(2) : (frame.clientHeight || parseFloat(frame.style.maxHeight || "0") || 0)),
          imageRatio: Number((img.naturalWidth / img.naturalHeight).toFixed(6)),
          framePolicy: adaptiveFramePolicy ? adaptiveFramePolicy.framePolicy : "",
          chosenLayout: adaptiveLayout ? ("adaptive-" + layout + "-" + orientation) : ("adaptive-static-" + role)
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

  function validateAdaptiveCardContainment(exportRoot) {
    if (!isAdaptivePdfLayoutEnabled()) {
      return [];
    }
    var diagnostics = Array.prototype.slice.call(exportRoot.querySelectorAll(".pi-export-card--adaptive")).map(function (cardNode) {
      var cardDiagnostics = collectAdaptiveCardContainment(cardNode);
      return {
        cardId: String(cardNode.getAttribute("data-pdf-block-id") || ""),
        language: String(cardNode.closest(".pi-export-document") && cardNode.closest(".pi-export-document").getAttribute("lang") || SOURCE_LANGUAGE),
        direction: String(cardNode.closest(".pi-export-document") && cardNode.closest(".pi-export-document").getAttribute("dir") || "ltr"),
        page: (function () {
          var pageNode = cardNode.closest("[data-pdf-page]");
          return pageNode && pageNode.parentNode
            ? Array.prototype.indexOf.call(pageNode.parentNode.children, pageNode) + 1
            : 0;
        })(),
        row: String((cardNode.closest(".pi-export-row") || {}).getAttribute ? cardNode.closest(".pi-export-row").getAttribute("data-pdf-row-id") || "" : ""),
        card: normalizeText((cardNode.querySelector(".pi-export-card-title") || {}).textContent || ""),
        selectedVariant: String(cardNode.getAttribute("data-pdf-selected-variant") || ""),
        typographyScale: Number(cardNode.getAttribute("data-pdf-card-typography-scale") || 0),
        fixedCardHeight: Number(cardNode.getAttribute("data-pdf-card-row-height") || 0),
        naturalCardHeight: Number(cardNode.getAttribute("data-pdf-card-natural-height") || 0),
        computedStyles: {
          overflow: window.getComputedStyle(cardNode).overflow,
          overflowX: window.getComputedStyle(cardNode).overflowX,
          overflowY: window.getComputedStyle(cardNode).overflowY,
          minWidth: window.getComputedStyle(cardNode).minWidth,
          minHeight: window.getComputedStyle(cardNode).minHeight,
          width: window.getComputedStyle(cardNode).width,
          height: window.getComputedStyle(cardNode).height
        },
        cardBounds: cardDiagnostics.cardBounds,
        innerBounds: cardDiagnostics.innerBounds,
        descendantBounds: cardDiagnostics.descendantBounds,
        overflowTop: cardDiagnostics.overflowTop,
        overflowRight: cardDiagnostics.overflowRight,
        overflowBottom: cardDiagnostics.overflowBottom,
        overflowLeft: cardDiagnostics.overflowLeft,
        valid: cardDiagnostics.valid
      };
    });
    var blockers = diagnostics.filter(function (entry) { return !entry.valid; });
    window.__propertyInstructionLastPdfDiagnostics = Object.assign({}, window.__propertyInstructionLastPdfDiagnostics || {}, {
      cardContainmentDiagnostics: diagnostics,
      cardContainmentBlockers: blockers
    });
    if (blockers.length) {
      throw new Error("adaptive-card-containment-overflow");
    }
    return diagnostics;
  }

  function validateAdaptiveMediaVisualPlacement(exportRoot) {
    if (!isAdaptivePdfLayoutEnabled()) {
      return [];
    }
    var diagnostics = Array.prototype.slice.call(exportRoot.querySelectorAll(".pi-export-card--adaptive")).map(function (cardNode) {
      var visualPlacement = collectAdaptiveMediaVisualPlacement(cardNode);
      if (!visualPlacement) {
        return null;
      }
      return {
        cardId: String(cardNode.getAttribute("data-pdf-block-id") || ""),
        language: String(cardNode.closest(".pi-export-document") && cardNode.closest(".pi-export-document").getAttribute("lang") || SOURCE_LANGUAGE),
        direction: String(cardNode.closest(".pi-export-document") && cardNode.closest(".pi-export-document").getAttribute("dir") || "ltr"),
        page: (function () {
          var pageNode = cardNode.closest("[data-pdf-page]");
          return pageNode && pageNode.parentNode
            ? Array.prototype.indexOf.call(pageNode.parentNode.children, pageNode) + 1
            : 0;
        })(),
        rowId: String((cardNode.closest(".pi-export-row") || {}).getAttribute ? cardNode.closest(".pi-export-row").getAttribute("data-pdf-row-id") || "" : ""),
        stepNumber: normalizeText(((cardNode.querySelector(".pi-export-step-badge span") || {}).textContent || "")),
        title: normalizeText(((cardNode.querySelector(".pi-export-card-title") || {}).textContent || "")),
        variant: String(cardNode.getAttribute("data-pdf-selected-variant") || ""),
        typographyScale: Number(cardNode.getAttribute("data-pdf-card-typography-scale") || 0),
        visualPlacement: visualPlacement
      };
    }).filter(Boolean);
    var blockers = diagnostics.filter(function (entry) {
      return entry.visualPlacement && entry.visualPlacement.severity === "blocker";
    });
    if (blockers.length) {
      var blockerSummary = blockers.slice(0, 3).map(function (entry) {
        return {
          cardId: entry.cardId,
          rowId: entry.rowId,
          page: entry.page,
          variant: entry.variant,
          alignmentMode: entry.visualPlacement.mediaVerticalAlignmentMode,
          issues: entry.visualPlacement.issues || []
        };
      });
      window.__propertyInstructionLastPdfDiagnostics = Object.assign({}, window.__propertyInstructionLastPdfDiagnostics || {}, {
        mediaVisualPlacementDiagnostics: diagnostics,
        mediaVisualPlacementBlockers: blockerSummary
      });
      if (isPdfArtifactModeEnabled()) {
        setPdfArtifactModeResult({
          mediaVisualPlacementDiagnostics: diagnostics,
          mediaVisualPlacementBlockers: blockerSummary
        });
      }
      var blockerError = new Error("adaptive-media-visual-placement-invalid:" + JSON.stringify(blockerSummary));
      blockerError.code = "adaptive-media-visual-placement-invalid";
      blockerError.mediaVisualPlacementDiagnostics = diagnostics;
      blockerError.mediaVisualPlacementBlockers = blockerSummary;
      throw blockerError;
    }
    return diagnostics;
  }

  function applyAdaptiveFinalMediaSizing(exportRoot) {
    if (!exportRoot || !exportRoot.querySelectorAll) {
      return;
    }
    Array.prototype.slice.call(exportRoot.querySelectorAll(".pi-export-card--adaptive")).forEach(function (cardNode) {
      var mediaNode = cardNode.querySelector(".pi-export-card-media");
      var frameNode = cardNode.querySelector(".pi-export-card-media [data-export-image-frame]");
      var imageNode = frameNode ? frameNode.querySelector("img") : null;
      var selectedLayout = String(cardNode.getAttribute("data-pdf-selected-variant") || "");
      var stretchableMediaLayout = (
        selectedLayout === "half-portrait-side" ||
        selectedLayout === "half-portrait-side-narrow" ||
        selectedLayout === "half-portrait-side-wide" ||
        selectedLayout === "wide-horizontal"
      );
      if (!mediaNode || !frameNode || !imageNode) {
        return;
      }
      var distribution = parsePdfJsonAttribute(cardNode.getAttribute("data-pdf-card-region-distribution"), {});
      var projection = parsePdfJsonAttribute(cardNode.getAttribute("data-pdf-card-row-projection"), {});
      var measuredMediaHeight = Number(cardNode.getAttribute("data-pdf-card-media-height") || 0);
      var mediaGrowth = Number(distribution && distribution.mediaGrowth || 0);
      var cardRect = cardNode.getBoundingClientRect();
      var cardStyles = window.getComputedStyle(cardNode);
      var actualAvailableMediaHeight = Math.max(
        0,
        Math.floor(
          cardRect.bottom -
          (parseFloat(cardStyles.borderBottomWidth || "0") || 0) -
          mediaNode.getBoundingClientRect().top
        )
      );
      var allowedMediaHeight = Math.max(0, Math.round(measuredMediaHeight + mediaGrowth));
      if (actualAvailableMediaHeight > 0) {
        allowedMediaHeight = allowedMediaHeight
          ? Math.min(allowedMediaHeight, actualAvailableMediaHeight)
          : actualAvailableMediaHeight;
      }
      if (!allowedMediaHeight) {
        return;
      }
      var availableFrameHeight = getAdaptiveAvailableFrameHeight(mediaNode, frameNode, allowedMediaHeight);
      if (!availableFrameHeight) {
        return;
      }
      mediaNode.style.minHeight = "0";
      mediaNode.style.height = stretchableMediaLayout ? "100%" : "auto";
      mediaNode.style.maxHeight = stretchableMediaLayout ? "none" : (allowedMediaHeight + "px");
      mediaNode.style.overflow = "hidden";
      frameNode.style.minHeight = "0";
      frameNode.style.height = "auto";
      frameNode.style.maxHeight = availableFrameHeight + "px";
      var projectedMediaGeometry = projection && projection.projectedMediaGeometry
        ? projection.projectedMediaGeometry
        : null;
      if (!projectedMediaGeometry && imageNode.naturalWidth && imageNode.naturalHeight) {
        projectedMediaGeometry = resolveAdaptiveFinalMediaGeometry({
          layout: selectedLayout,
          mediaType: getExportMediaType(imageNode),
          fitPolicy: getAdaptiveMediaFitPolicy(imageNode, cardNode),
          naturalWidth: imageNode.naturalWidth,
          naturalHeight: imageNode.naturalHeight,
          availableWidth: Number(cardNode.getAttribute("data-pdf-card-media-region-width") || frameNode.clientWidth || mediaNode.clientWidth || cardNode.clientWidth || 1),
          availableHeight: availableFrameHeight
        });
      }
      var framePolicy = applyAdaptiveMediaFramePolicy(
        frameNode,
        mediaNode,
        cardNode,
        imageNode,
        {
          availableWidth: projectedMediaGeometry ? projectedMediaGeometry.availableWidth : (frameNode.clientWidth || mediaNode.clientWidth || cardNode.clientWidth || 1),
          availableHeight: projectedMediaGeometry ? projectedMediaGeometry.availableHeight : availableFrameHeight,
          fitPolicy: getAdaptiveMediaFitPolicy(imageNode, cardNode),
          resolvedGeometry: projectedMediaGeometry
        }
      );
      applyAdaptiveMediaDimensions(frameNode, imageNode, {
        fitPolicy: getAdaptiveMediaFitPolicy(imageNode, cardNode),
        fallbackWidth: framePolicy && framePolicy.framePolicy === "shrink-wrap-natural"
          ? framePolicy.frameWidth
          : (projectedMediaGeometry ? projectedMediaGeometry.frameWidth : (frameNode.clientWidth || mediaNode.clientWidth || cardNode.clientWidth || 1)),
        fallbackHeight: projectedMediaGeometry ? projectedMediaGeometry.frameHeight : availableFrameHeight,
        resolvedGeometry: projectedMediaGeometry
      });
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

  function createPdfContentsPanel(documentNode, model) {
    if (!model.contentsEntries || !model.contentsEntries.length) {
      return null;
    }
    var panel = documentNode.createElement("section");
    panel.className = "pi-export-contents";
    panel.setAttribute("data-pdf-contents-panel", "1");
    setPdfSemantic(panel, "rect", "contents-panel");
    var title = documentNode.createElement("h2");
    title.className = "pi-export-panel-title";
    title.textContent = model.contentsTitle || getGuideCopyText("in_this_guide", "In this guide");
    setPdfSemantic(title, "text", "panel-title", { fontWeight: 700 });
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
      setPdfSemantic(link, "text", "contents-link", { linkHref: "#" + entry.anchor, fontWeight: 600 });
      item.appendChild(link);
      var pageNumber = documentNode.createElement("span");
      pageNumber.className = "pi-export-contents-page";
      pageNumber.setAttribute("data-pdf-contents-page", entry.anchor);
      setPdfSemantic(pageNumber, "text", "contents-page", { fontWeight: 600 });
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
        card.appendChild(link);
      } else {
        var text = documentNode.createElement("p");
        text.className = "pi-export-qr-label";
        text.textContent = entry.label;
        setPdfSemantic(text, "text", "qr-label", { fontWeight: 600 });
        card.appendChild(text);
      }
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

  function moveAdaptiveParkingActionsToMap(documentNode, parkingTextCard, parkingMapNode) {
    if (!documentNode || !parkingTextCard || !parkingMapNode) {
      return false;
    }
    var actionNodes = [];
    var linkNode = parkingTextCard.querySelector(".pi-export-card-link");
    var qrPanelNode = parkingTextCard.querySelector(".pi-export-card-qr-panel");
    if (linkNode) {
      actionNodes.push(linkNode);
    }
    if (qrPanelNode) {
      actionNodes.push(qrPanelNode);
    }
    if (!actionNodes.length) {
      return false;
    }
    var actionsNode = parkingMapNode.querySelector(".pi-export-parking-map-actions");
    if (!actionsNode) {
      actionsNode = documentNode.createElement("div");
      actionsNode.className = "pi-export-parking-map-actions";
      parkingMapNode.appendChild(actionsNode);
    }
    actionNodes.forEach(function (actionNode) {
      actionsNode.appendChild(actionNode);
    });
    Array.prototype.slice.call(parkingTextCard.querySelectorAll(".pi-export-card-footer-region")).forEach(function (footerRegionNode) {
      if (!footerRegionNode.children.length && footerRegionNode.parentNode) {
        footerRegionNode.parentNode.removeChild(footerRegionNode);
      }
    });
    return true;
  }

  function moveAdaptiveParkingCardActionsToMedia(cardNode, variant) {
    if (!cardNode) {
      return false;
    }
    var generationDiagnostics = getPdfGenerationDiagnostics();
    var cardId = String(cardNode.getAttribute("data-pdf-block-id") || cardNode.getAttribute("data-export-source-id") || "parking-card");
    var existingActionsNode = cardNode.querySelector(".pi-export-parking-media-actions");
    if (cardNode.getAttribute("data-pdf-parking-actions-relocated") === "1") {
      recordParkingMutationDiagnostic({
        cardId: cardId,
        variant: String(variant && (variant.layout || variant.kind) || cardNode.getAttribute("data-pdf-selected-variant") || "parking-map-right"),
        measurementClone: cardNode.getAttribute("data-pdf-measurement-clone") === "1",
        skipped: true,
        reason: "already-relocated",
        actionsNodeAlreadyExisted: !!existingActionsNode
      });
      return false;
    }
    var startedAt = Date.now();
    var linkNode = cardNode.querySelector(".pi-export-card-link");
    var qrPanelNode = cardNode.querySelector(".pi-export-card-qr-panel");
    var mediaNode = cardNode.querySelector(".pi-export-card-media");
    if (!mediaNode || (!linkNode && !qrPanelNode)) {
      recordParkingMutationDiagnostic({
        cardId: cardId,
        variant: String(variant && (variant.layout || variant.kind) || cardNode.getAttribute("data-pdf-selected-variant") || "parking-map-right"),
        measurementClone: cardNode.getAttribute("data-pdf-measurement-clone") === "1",
        skipped: true,
        reason: !mediaNode ? "missing-media" : "missing-actions",
        hadLink: !!linkNode,
        hadQrPanel: !!qrPanelNode
      });
      return false;
    }
    var actionsNode = existingActionsNode || mediaNode.querySelector(".pi-export-parking-media-actions");
    if (!actionsNode) {
      actionsNode = cardNode.ownerDocument.createElement("div");
      actionsNode.className = "pi-export-parking-media-actions";
      mediaNode.appendChild(actionsNode);
    }
    var originalLinkParentRole = linkNode && linkNode.parentElement ? String(linkNode.parentElement.getAttribute("data-card-region") || linkNode.parentElement.className || "") : "";
    var originalQrParentRole = qrPanelNode && qrPanelNode.parentElement ? String(qrPanelNode.parentElement.getAttribute("data-card-region") || qrPanelNode.parentElement.className || "") : "";
    if (linkNode) {
      actionsNode.appendChild(linkNode);
    }
    if (qrPanelNode) {
      actionsNode.appendChild(qrPanelNode);
    }
    Array.prototype.slice.call(cardNode.querySelectorAll(".pi-export-card-footer-region")).forEach(function (footerRegionNode) {
      if (!footerRegionNode.children.length && footerRegionNode.parentNode) {
        footerRegionNode.parentNode.removeChild(footerRegionNode);
      }
    });
    cardNode.setAttribute("data-pdf-parking-actions-relocated", "1");
    generationDiagnostics.counters.parkingActionRelocations += 1;
    generationDiagnostics.counters.parkingActionRelocationByCard[cardId] = (generationDiagnostics.counters.parkingActionRelocationByCard[cardId] || 0) + 1;
    recordParkingMutationDiagnostic({
      cardId: cardId,
      variant: String(variant && (variant.layout || variant.kind) || cardNode.getAttribute("data-pdf-selected-variant") || "parking-map-right"),
      measurementClone: cardNode.getAttribute("data-pdf-measurement-clone") === "1",
      hadLink: !!linkNode,
      hadQrPanel: !!qrPanelNode,
      hadMedia: !!mediaNode,
      actionsNodeAlreadyExisted: !!existingActionsNode,
      originalLinkParentRole: originalLinkParentRole,
      originalQrParentRole: originalQrParentRole,
      finalParentRole: String(actionsNode.className || "pi-export-parking-media-actions"),
      durationMs: Number((Date.now() - startedAt).toFixed(2))
    });
    return true;
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
    exportDocument.appendChild(header);

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
        mapSection.appendChild(overviewMapImage);
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
          mediaColumn.appendChild(blockMap);
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

        if (blockModel.linkHref && !linkBelongsToQrMap) {
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
    if (isContinuation && isAdaptivePdfLayoutEnabled()) {
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

  function paginateExportDocument(exportState) {
    var documentNode = exportState.exportDocument.ownerDocument;
    var adaptiveChildNodes = null;
    var adaptivePreludeNodes = null;
    var adaptiveSectionNodes = null;
    var adaptiveSectionPlans = null;
    var adaptiveEvaluatedPlans = null;

    if (isAdaptivePdfLayoutEnabled()) {
      adaptiveChildNodes = Array.from(exportState.exportDocument.children);
      var adaptiveFirstSectionIndex = adaptiveChildNodes.findIndex(function (childNode) {
        return childNode.classList && childNode.classList.contains("pi-export-section");
      });
      adaptivePreludeNodes = adaptiveFirstSectionIndex >= 0
        ? adaptiveChildNodes.slice(0, adaptiveFirstSectionIndex)
        : adaptiveChildNodes.slice();
      adaptiveSectionNodes = adaptiveFirstSectionIndex >= 0
        ? adaptiveChildNodes.slice(adaptiveFirstSectionIndex).filter(function (childNode) {
          return childNode.classList && childNode.classList.contains("pi-export-section");
        })
        : [];
      if (adaptiveSectionNodes.length) {
        adaptiveSectionPlans = collectAdaptivePlanningSections(
          exportState.exportRoot,
          exportState.exportDocument
        );
        adaptiveEvaluatedPlans = evaluateAdaptivePagePlans(exportState, adaptiveSectionPlans);
        exportState.adaptiveLayoutSummary = exportState.adaptiveLayoutSummary || {};
        exportState.adaptiveLayoutSummary.plannerDiagnostics = adaptiveEvaluatedPlans.diagnostics;
      }
    }

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

    if (isAdaptivePdfLayoutEnabled()) {
      function renderAdaptivePlan(planPages) {
        exportPages.innerHTML = "";
        pageState = createExportPageShell(documentNode, exportState.exportDocument);
        exportPages.appendChild(pageState.page);
        (adaptivePreludeNodes || []).forEach(function (childNode) {
          appendStandaloneNode(childNode);
        });
        if ((adaptiveSectionNodes || []).length && adaptiveSectionPlans && planPages.length) {
          if (pageState.hasContent) {
            newPage();
          }
          buildAdaptivePlannedPages(
            exportState,
            exportPages,
            pageState,
            adaptiveSectionPlans,
            planPages
          );
        }
        var overflowPage = Array.prototype.slice.call(exportPages.querySelectorAll(".pi-export-page")).find(function (pageNode) {
          return getAdaptivePageOverflowPixels(pageNode) > 1;
        }) || null;
        return {
          overflowPage: overflowPage,
          overflowPixels: overflowPage ? getAdaptivePageOverflowPixels(overflowPage) : 0
        };
      }

      var candidatePlans = adaptiveEvaluatedPlans && adaptiveEvaluatedPlans.plans && adaptiveEvaluatedPlans.plans.length
        ? adaptiveEvaluatedPlans.plans
        : [{
          pageCount: adaptiveEvaluatedPlans && adaptiveEvaluatedPlans.plan ? adaptiveEvaluatedPlans.plan.length : 0,
          pages: adaptiveEvaluatedPlans && adaptiveEvaluatedPlans.plan ? adaptiveEvaluatedPlans.plan : [],
          score: 0
        }];
      var acceptedPlan = null;
      for (var adaptivePlanIndex = 0; adaptivePlanIndex < candidatePlans.length; adaptivePlanIndex += 1) {
        var candidatePlan = candidatePlans[adaptivePlanIndex];
        var renderResult = renderAdaptivePlan(candidatePlan.pages || []);
        if (!renderResult.overflowPage) {
          acceptedPlan = candidatePlan;
          break;
        }
        if (
          adaptiveEvaluatedPlans &&
          adaptiveEvaluatedPlans.diagnostics &&
          candidatePlan.pageCount === 2 &&
          !adaptiveEvaluatedPlans.diagnostics.bestRejectedTwoPageReason
        ) {
          var overflowPageNumber = Array.prototype.slice.call(exportPages.querySelectorAll(".pi-export-page")).indexOf(renderResult.overflowPage) + 1;
          adaptiveEvaluatedPlans.diagnostics.bestRejectedTwoPageReason =
            "The best 2-section-page composition overflowed rendered page " +
            overflowPageNumber +
            " by " + Number(renderResult.overflowPixels.toFixed(2)) + "px.";
        }
      }
      if (!acceptedPlan) {
        renderAdaptivePlan(adaptiveEvaluatedPlans.plan || []);
      } else if (adaptiveEvaluatedPlans && adaptiveEvaluatedPlans.diagnostics) {
        adaptiveEvaluatedPlans.diagnostics.selectedPlan = {
          pageCount: acceptedPlan.pageCount,
          score: acceptedPlan.score,
          pages: (acceptedPlan.pages || []).map(function (candidate, index) {
            return {
              page: index + 1,
              occupancy: candidate.summary.occupancy,
              rows: candidate.rows,
              rowVariants: candidate.summary.rowPlan
            };
          })
        };
      }

      exportState.exportPages = exportPages;
      var adaptiveItemCount = exportPages.querySelectorAll("[data-pdf-section-item='1']").length;
      if (sourcePaginatableItemCount !== adaptiveItemCount) {
        throw new Error("PDF pagination dropped export content");
      }
      return exportState;
    }

    Array.from(exportState.exportDocument.children).forEach(function (childNode) {
      if (childNode.classList.contains("pi-export-section")) {
        var sectionTitle = childNode.querySelector(".pi-export-section-title");
        var sourceItems = Array.from(childNode.children).filter(function (sectionChild) {
          return sectionChild !== sectionTitle && sectionChild.getAttribute("data-pdf-section-item") === "1";
        });
        var sectionSlice = createSectionSlice(documentNode, sectionTitle, false);
        pageState.body.appendChild(sectionSlice.section);

        sourceItems.forEach(function (sourceItem) {
          sectionSlice.items.appendChild(sourceItem);

          if (pageBodyOverflows(pageState)) {
            var hadPreviousItems = sectionSlice.items.children.length > 1;
            sectionSlice.items.removeChild(sourceItem);

            if (!sectionSlice.items.children.length) {
              pageState.body.removeChild(sectionSlice.section);
            }

            newPage();
            sectionSlice = createSectionSlice(documentNode, sectionTitle, hadPreviousItems);
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
    imageSources.forEach(function (descriptor) {
      if (descriptor && descriptor.resolvedUrl && !uniqueSources[descriptor.resolvedUrl]) {
        uniqueSources[descriptor.resolvedUrl] = true;
        uniqueEntries.push(descriptor.resolvedUrl);
      }
    });
    var fetchResults = {};
    await Promise.all(uniqueEntries.map(async function (resolvedUrl) {
      try {
        await getExportImageDataUri(resolvedUrl, exportImageDataCache);
        fetchResults[resolvedUrl] = {
          ok: true
        };
      } catch (error) {
        fetchResults[resolvedUrl] = {
          ok: false,
          error: error
        };
      }
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

  function buildMainCustomMapQrEntries(model) {
    var mapModel = model && model.map ? model.map : null;
    if (!mapModel || !shouldUseQrForCustomMap(mapModel.finalPdfRepresentation || mapModel.pdfRepresentation, mapModel.isCustomGoogleMap)) {
      return [];
    }
    if (!mapModel.openUrl) {
      return [];
    }
    return [{
      kind: "property-map",
      label: mapModel.linkLabel || "Open in Google Maps",
      linkHref: mapModel.openUrl,
      sourceNodeId: "map:link_label",
      payload: mapModel.openUrl
    }];
  }

  function buildBlockCustomMapQrEntries(blockModel) {
    if (!blockModel || !shouldUseQrForCustomMap(blockModel.finalPdfRepresentation || blockModel.mapPdfRepresentation, blockModel.mapIsCustomGoogleMap)) {
      return [];
    }
    if (!blockModel.mapOpenUrl) {
      return [];
    }
    return [{
      kind: "block-map",
      label: blockModel.linkLabel || "Open in Google Maps",
      linkHref: blockModel.mapOpenUrl,
      sourceNodeId: blockModel.id ? ("block:" + blockModel.id + ":link_label") : "",
      blockId: blockModel.id || "",
      payload: blockModel.mapOpenUrl
    }];
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
      var needsCustomMapQr = shouldUseQrForCustomMap(model.map && model.map.pdfRepresentation, model.map && model.map.isCustomGoogleMap)
        || (model.sections || []).some(function (sectionModel) {
          return (sectionModel.blocks || []).some(function (blockModel) {
            return shouldUseQrForCustomMap(blockModel.mapPdfRepresentation, blockModel.mapIsCustomGoogleMap);
          });
        });
      if (buildWifiQrPayload(model) || (model.guideLinks || []).length || needsCustomMapQr) {
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
        chosenLayout: cardNode.classList.contains("pi-export-card--adaptive")
          ? [
              "adaptive",
              String(cardNode.getAttribute("data-pdf-card-kind") || "wide"),
              String(cardNode.getAttribute("data-pdf-card-orientation") || "square")
            ].join("-")
          : (
            cardNode.classList.contains("pi-export-card--portrait-side")
              ? "portrait-side-by-side"
              : "landscape-stacked"
          ),
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
      var isPlaceholder = img.getAttribute("data-export-image-placeholder") === "1";
      var painted = isPlaceholder
        ? (region.nonWhiteCoverage > 0.02 && region.variance > 0.1)
        : (region.variance > 12 && region.nonWhiteCoverage > 0.05);
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
        placeholder: isPlaceholder,
        painted: painted
      });

      if (!painted) {
        throw new Error("image-not-painted");
      }
    });

    return diagnostics;
  }

  function validateImageAspectRatios(exportRoot) {
    var diagnostics = [];
    Array.prototype.slice.call(exportRoot.querySelectorAll("img")).forEach(function (img) {
      var role = String(img.getAttribute("data-export-image-role") || "image");
      var mediaType = getExportMediaType(img);
      var fitPolicy = String(img.getAttribute("data-export-media-fit-policy") || (mediaType === "photo" ? "contain" : "contain"));
      var frameNode = img.closest("[data-export-image-frame]");
      if (
        isAdaptivePdfLayoutEnabled() &&
        exportRoot &&
        exportRoot.querySelector &&
        exportRoot.querySelector(".pi-export-document[data-pdf-layout-mode='adaptive']") &&
        frameNode &&
        (mediaType === "photo" || mediaType === "map" || mediaType === "qr")
      ) {
        var liveFrameRect = frameNode.getBoundingClientRect();
        var containmentInnerBounds = getNearestExportContainmentInnerBounds(frameNode, exportRoot);
        var constrainedFrameWidth = liveFrameRect.width;
        var constrainedFrameHeight = mediaType === "qr" ? liveFrameRect.width : liveFrameRect.height;
        if (containmentInnerBounds) {
          if (containmentInnerBounds.width > 0) {
            constrainedFrameWidth = Math.min(constrainedFrameWidth || containmentInnerBounds.width, containmentInnerBounds.width);
          }
          if (mediaType !== "qr" && containmentInnerBounds.height > 0) {
            constrainedFrameHeight = Math.min(constrainedFrameHeight || containmentInnerBounds.height, containmentInnerBounds.height);
          }
        }
        if (constrainedFrameWidth > 0) {
          frameNode.style.width = constrainedFrameWidth + "px";
        }
        if (constrainedFrameHeight > 0) {
          frameNode.style.height = constrainedFrameHeight + "px";
          frameNode.style.maxHeight = constrainedFrameHeight + "px";
        }
        if (mediaType === "qr" && constrainedFrameWidth > 0) {
          frameNode.style.width = constrainedFrameWidth + "px";
          frameNode.style.height = constrainedFrameWidth + "px";
          frameNode.style.minHeight = constrainedFrameWidth + "px";
          frameNode.style.maxHeight = constrainedFrameWidth + "px";
        }
        applyAdaptiveMediaDimensions(frameNode, img, {
          fitPolicy: fitPolicy,
          fallbackWidth: constrainedFrameWidth || img.getBoundingClientRect().width || 1,
          fallbackHeight: constrainedFrameHeight || img.getBoundingClientRect().height || 1,
          preferFallbackFrameRect: true
        });
        if (fitPolicy !== "cover") {
          var validatedFrameRect = getFrameRectWithFallback(
            frameNode,
            constrainedFrameWidth || img.getBoundingClientRect().width || 1,
            constrainedFrameHeight || img.getBoundingClientRect().height || 1,
            true
          );
          if (mediaType === "map") {
            img.style.width = validatedFrameRect.width + "px";
            img.style.height = "auto";
          } else {
            var validatedFitted = fitMediaWithinBounds(
              img.naturalWidth,
              img.naturalHeight,
              validatedFrameRect.width,
              validatedFrameRect.height,
              false
            );
            img.style.width = validatedFitted.width + "px";
            img.style.height = validatedFitted.height + "px";
          }
        }
      }
      if (
        isLegacyPdfLayoutEnabled() &&
        frameNode &&
        fitPolicy !== "cover" &&
        (mediaType === "photo" || mediaType === "map" || mediaType === "qr")
      ) {
        var legacyFrameRect = getFrameRectWithFallback(
          frameNode,
          frameNode.clientWidth || img.getBoundingClientRect().width || 1,
          frameNode.clientHeight || img.getBoundingClientRect().height || 1,
          true
        );
        var legacyMaxHeight = mediaType === "qr"
          ? legacyFrameRect.width
          : (legacyFrameRect.height || getPdfImageMaxHeight(img));
        var legacyFitted = fitMediaWithinBounds(
          img.naturalWidth,
          img.naturalHeight,
          legacyFrameRect.width || img.getBoundingClientRect().width || 1,
          legacyMaxHeight || img.getBoundingClientRect().height || 1,
          false
        );
        if (mediaType === "qr") {
          img.style.width = legacyFitted.width + "px";
          img.style.height = legacyFitted.height + "px";
        } else {
          img.style.width = legacyFitted.width + "px";
          img.style.height = legacyFitted.height + "px";
        }
      }
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
        distorted: ratioDifference > PDF_ADAPTIVE_MEDIA_RATIO_BLOCKER
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
      semanticRole === "parking-map-panel" ||
      node.classList.contains("pi-export-map") ||
      node.classList.contains("pi-export-card") ||
      node.classList.contains("pi-export-parking-map") ||
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

  function buildVectorLineCharacters(node, pageRect, scaleMetrics) {
    var documentNode = node.ownerDocument;
    var characters = [];
    if (!documentNode || !documentNode.createTreeWalker) {
      return characters;
    }
    var walker = documentNode.createTreeWalker(node, NodeFilter.SHOW_TEXT, {
      acceptNode: function (textNode) {
        return normalizeText(textNode.nodeValue || "").length
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      }
    });
    var textNode;
    var logicalIndex = 0;
    while ((textNode = walker.nextNode())) {
      var value = String(textNode.nodeValue || "");
      for (var characterIndex = 0; characterIndex < value.length; characterIndex += 1) {
        var character = value.charAt(characterIndex);
        if (character === "\n" || character === "\r") {
          logicalIndex += 1;
          continue;
        }
        var range = documentNode.createRange();
        range.setStart(textNode, characterIndex);
        range.setEnd(textNode, characterIndex + 1);
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
            bounds: convertRectToPdfBounds(rect, pageRect, scaleMetrics)
          });
        }
        if (range.detach) {
          range.detach();
        }
        logicalIndex += 1;
      }
    }
    return characters;
  }

  function mergeVectorLineRuns(lineCharacters, paragraphDirection) {
    var runs = [];
    var currentRun = null;
    lineCharacters.forEach(function (characterRecord, characterIndex) {
      var runDirection = resolveVectorCharacterRunClass(lineCharacters, characterIndex, paragraphDirection);
      if (!currentRun || currentRun.direction !== runDirection) {
        currentRun = {
          direction: runDirection,
          characters: [],
          logicalText: ""
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
      return {
        logicalText: run.logicalText,
        direction: run.direction,
        script: run.direction === "rtl"
          ? "arabic"
          : (run.direction === "neutral" ? "neutral" : "latin"),
        bounds: bounds
          ? {
            x: Number(bounds.x.toFixed(2)),
            y: Number(bounds.y.toFixed(2)),
            width: Number((bounds.right - bounds.x).toFixed(2)),
            height: Number((bounds.bottom - bounds.y).toFixed(2))
          }
          : null
      };
    }).filter(function (run) {
      return run.bounds && normalizeText(run.logicalText).length;
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
    var color = parseCssColorToRgba(styles.color);
    var fontSizePx = parseFloat(styles.fontSize || "0") || 12;
    var lineHeightPx = parseFloat(styles.lineHeight || "0") || (fontSizePx * 1.3);
    var fontWeight = Number(node.getAttribute("data-pdf-font-weight") || styles.fontWeight || 400) || 400;
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
      var lineRuns = mergeVectorLineRuns(lineCharacters, direction);
      return {
        type: "text-line",
        role: String(node.getAttribute("data-pdf-role") || "text"),
        sourceId: String(node.getAttribute("data-export-source-id") || ""),
        bounds: {
          x: Number((rect.left - pageRect.left).toFixed(2)) * scaleMetrics.scaleX,
          y: lineCharacters[0].bounds.y,
          width: Number((rect.width * scaleMetrics.scaleX).toFixed(2)),
          height: Number((lineHeightPx * scaleMetrics.scaleY).toFixed(2))
        },
        logicalText: lineCharacters.map(function (characterRecord) { return characterRecord.character; }).join(""),
        fontWeight: fontWeight,
        fontSizePt: Number((fontSizePx * scaleMetrics.scaleY).toFixed(2)),
        lineHeightPt: Number((lineHeightPx * scaleMetrics.scaleY).toFixed(2)),
        color: color,
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

  function buildAdaptiveVectorLayoutModel(exportState, pdfWidth, pdfHeight) {
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

  function drawVectorTextElement(pdf, element, diagnostics) {
    var color = element.color || { r: 0, g: 0, b: 0, a: 1 };
    pdf.setTextColor(color.r, color.g, color.b);
    var maxRight = element.bounds.x;
    (element.runs || []).forEach(function (run) {
      var fontFace = getPdfFontFace(element.fontWeight, run.logicalText, run.direction);
      var runText = String(run.logicalText || "");
      pdf.setFont(fontFace.family, fontFace.style);
      pdf.setFontSize(element.fontSizePt);
      if (typeof pdf.setR2L === "function") {
        pdf.setR2L(false);
      }
      if (fontFace.family === VECTOR_PDF_FONT_FAMILY_ARABIC && typeof pdf.processArabic === "function") {
        runText = pdf.processArabic(runText);
      }
      if (run.direction === "neutral" && normalizeText(runText).length === 0) {
        runText = " ";
      }
      var drawX = run.direction === "rtl"
        ? (run.bounds.x + run.bounds.width)
        : run.bounds.x;
      pdf.text(runText, drawX, element.bounds.y, {
        baseline: "top",
        align: run.direction === "rtl" ? "right" : "left"
      });
      maxRight = Math.max(maxRight, run.bounds.x + run.bounds.width);
    });
    if (element.link) {
      pdf.link(element.bounds.x, element.bounds.y, element.bounds.width, element.bounds.height, {
        url: element.link
      });
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
          bounds: run.bounds
        };
      }),
      overflow: maxRight > (element.bounds.x + element.bounds.width + 1)
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

  async function captureDiagnosticPageImages(pageNodes, performanceState) {
    var captureFrame = null;
    var pageImages = [];
    var pageImageBlobs = [];
    try {
      for (var index = 0; index < pageNodes.length; index += 1) {
        var captureTarget = await prepareCaptureFramePage(pageNodes[index], performanceState);
        captureFrame = captureTarget.frame;
        var captureStartedAt = Date.now();
        var canvas = await window.html2canvas(captureTarget.page, {
          scale: 1.8,
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
        performanceState.pageCaptureMs[index] = Date.now() - captureStartedAt;
        var jpegBlob = await encodeCanvasToJpegBlob(canvas);
        var jpegDataUrl = await blobToDataUri(jpegBlob);
        pageImageBlobs.push(jpegBlob);
        pageImages.push({
          pageNumber: index + 1,
          width: canvas.width,
          height: canvas.height,
          dataUrl: jpegDataUrl
        });
        if (captureTarget && captureTarget.document && captureTarget.document.body) {
          while (captureTarget.document.body.firstChild) {
            captureTarget.document.body.removeChild(captureTarget.document.body.firstChild);
          }
        }
        canvas.width = 1;
        canvas.height = 1;
      }
    } finally {
      destroyCaptureFrame(captureFrame);
    }
    return {
      pageImages: pageImages,
      pageImageBlobs: pageImageBlobs
    };
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
    var layoutModel = buildAdaptiveVectorLayoutModel(exportState, pdfWidth, pdfHeight);
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
    window.__propertyInstructionPdfRenderer = "jspdf-vector";
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
      addPageLinkAnnotations(pdf, pageNodes[pageIndex], pdfWidth, pdfHeight);
    });

    var diagnosticPageImages = isPdfArtifactModeEnabled()
      ? await captureDiagnosticPageImages(pageNodes, performanceState)
      : { pageImageBlobs: [], pageImages: [] };
    return {
      pdf: pdf,
      pageImageBlobs: diagnosticPageImages.pageImageBlobs,
      pageImages: diagnosticPageImages.pageImages,
      pageCount: pageNodes.length,
      pageDiagnostics: pageNodes.map(collectPageDiagnostics),
      paintedImageDiagnostics: [],
      layoutModel: layoutModel,
      vectorTextDiagnostics: textDiagnostics,
      embeddedFonts: embeddedFonts,
      vectorMediaClipDiagnostics: vectorMediaClipDiagnostics,
      preparedImageAssets: Object.keys(preparedAssets).map(function (key) {
        return Object.assign({ key: key }, preparedAssets[key]);
      })
    };
  }

  async function renderExportPagesToRasterPdf(exportState, pageNodes, modelParityMap, mutationGuardState, progressContext, performanceState, imageDiagnostics, imageRatioDiagnostics) {
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
    var pageImages = [];
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
        var canvas = await window.html2canvas(captureTarget.page, {
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
          throw new Error("Page " + (index + 1) + " produced an empty canvas.");
        }
        paintedImageDiagnostics = paintedImageDiagnostics.concat(validateCanvasPaintedImages(pageNode, canvas, index));
        if (index > 0) {
          pdf.addPage("a4", "portrait");
        }
        var encodingStartedAt = Date.now();
        var jpegBlob = await encodeCanvasToJpegBlob(canvas);
        var jpegDataUrl = await blobToDataUri(jpegBlob);
        performanceState.encodingMs += Date.now() - encodingStartedAt;
        pageImageBlobs.push(jpegBlob);
        pageImages.push({
          pageNumber: index + 1,
          width: canvas.width,
          height: canvas.height,
          dataUrl: jpegDataUrl
        });
        var assemblyStartedAt = Date.now();
        pdf.addImage(jpegDataUrl, "JPEG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");
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

    return {
      pdf: pdf,
      pageImageBlobs: pageImageBlobs,
      pageImages: pageImages,
      pageCount: pageNodes.length,
      pageDiagnostics: pageDiagnostics,
      paintedImageDiagnostics: paintedImageDiagnostics
    };
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
    recordPdfGenerationStage("adaptive-validation-started", {
      pageCount: pageNodes.length
    });
    var cardContainmentDiagnostics = validateAdaptiveCardContainment(exportState.exportRoot);
    var mediaVisualPlacementDiagnostics = validateAdaptiveMediaVisualPlacement(exportState.exportRoot);
    var imageRatioDiagnostics = validateImageAspectRatios(exportState.exportRoot);
    var imageClipDiagnostics = validateExportImageClipping(exportState.exportRoot);
    recordPdfGenerationStage("adaptive-validation-completed", {
      pageCount: pageNodes.length,
      containmentCount: cardContainmentDiagnostics.length,
      mediaPlacementCount: mediaVisualPlacementDiagnostics.length
    });
    validateExportDomParity(exportState.exportRoot, modelParityMap, "post-fonts-images", mutationGuardState);

    var renderResult = isAdaptiveVectorPdfRendererEnabled()
      ? await renderExportPagesToVectorPdf(exportState, pageNodes, performanceState)
      : await renderExportPagesToRasterPdf(
          exportState,
          pageNodes,
          modelParityMap,
          mutationGuardState,
          progressContext,
          performanceState,
          imageDiagnostics,
          imageRatioDiagnostics
        );

    if (renderResult.pdf.internal.getNumberOfPages() !== pageNodes.length) {
      throw new Error("PDF page count did not match export page count.");
    }
    validateExportDomParity(exportState.exportRoot, modelParityMap, "post-render", mutationGuardState);

    window.__propertyInstructionLastPdfDiagnostics = {
      imageSourceDiagnostics: imageSourceDiagnostics,
      imageDiagnostics: imageDiagnostics,
      canvasPaintabilityDiagnostics: canvasPaintabilityDiagnostics,
      cardContainmentDiagnostics: cardContainmentDiagnostics,
      mediaVisualPlacementDiagnostics: mediaVisualPlacementDiagnostics,
      imageRatioDiagnostics: imageRatioDiagnostics,
      imageClipDiagnostics: imageClipDiagnostics,
      paintedImageDiagnostics: renderResult.paintedImageDiagnostics || [],
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
      pageImageBlobs: renderResult.pageImageBlobs || [],
      pageImages: renderResult.pageImages || [],
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
    var adaptiveSummary = artifact.adaptiveSummary || null;
    var plannerDiagnostics = adaptiveSummary && adaptiveSummary.plannerDiagnostics
      ? adaptiveSummary.plannerDiagnostics
      : (artifact.plannerDiagnostics || null);
    return {
      status: "complete",
      filename: String(artifact.filename || ""),
      blob: artifact.pdfBlob,
      blobUrl: blobUrl,
      pageCount: Number(artifact.pageCount || 0),
      pageImages: Array.isArray(artifact.pageImages) ? artifact.pageImages.slice() : [],
      adaptiveSummary: adaptiveSummary,
      plannerDiagnostics: plannerDiagnostics,
      performance: artifact.performance || {},
      language: String(artifact.languageCode || SOURCE_LANGUAGE),
      direction: String(artifact.direction || "ltr"),
      renderer: String(artifact.renderer || "raster"),
      embeddedFonts: Array.isArray(artifact.embeddedFonts) ? artifact.embeddedFonts.slice() : [],
      layoutModel: artifact.layoutModel ? {
        version: artifact.layoutModel.version || 1,
        renderer: artifact.layoutModel.renderer || String(artifact.renderer || "raster"),
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
    resetPdfGenerationDiagnostics(getAdaptivePdfRenderer());
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
      var sizingDiagnostics = applyExportImageSizing(exportState.exportRoot);
      recordPdfGenerationStage("browser-fonts-started");
      await waitForFonts();
      recordPdfGenerationStage("browser-fonts-completed");
      await waitForTwoAnimationFrames();
      if (isAdaptivePdfLayoutEnabled()) {
        recordPdfGenerationStage("adaptive-layout-started");
        applyAdaptiveSectionRows(exportState);
        recordPdfGenerationStage("adaptive-layout-completed", {
          pageCount: exportState && exportState.exportPages ? exportState.exportPages.querySelectorAll(".pi-export-page").length : 0
        });
      }
      recordPdfGenerationStage("adaptive-final-sizing-started");
      var prePaginationRatioDiagnostics = validateImageAspectRatios(exportState.exportRoot);
      var prePaginationClipDiagnostics = validateExportImageClipping(exportState.exportRoot);
      recordPdfPerformance(performanceState, "imagePreparationMs", imagePrepStartedAt);

      updateExportProgress(triggerElement, statusElement, null, null, "paginate");
      var paginationStartedAt = Date.now();
      paginateExportDocument(exportState);
      if (isAdaptivePdfLayoutEnabled()) {
        applyAdaptiveFinalMediaSizing(exportState.exportRoot);
      }
      recordPdfGenerationStage("adaptive-final-sizing-completed");
      populatePageFooters(exportState, guideModel.title || guideTitle);
      populatePdfContentsDestinations(exportState);
      recordPdfPerformance(performanceState, "paginationMs", paginationStartedAt);
      var layoutDiagnostics = collectCardLayoutDiagnostics(exportState.exportRoot);
      if (isAdaptivePdfLayoutEnabled()) {
        exportState.adaptiveLayoutSummary = exportState.adaptiveLayoutSummary || {};
        exportState.adaptiveLayoutSummary.pageOccupancy = collectAdaptivePageSummary(exportState.exportPages);
        exportState.adaptiveLayoutSummary.pageCount = exportState.exportPages.querySelectorAll(".pi-export-page").length;
        exportState.adaptiveLayoutSummary.sparsePageWarnings = exportState.adaptiveLayoutSummary.pageOccupancy.filter(function (pageSummary) {
          return pageSummary.occupancy < PDF_ADAPTIVE_SPARSE_PAGE_THRESHOLD && pageSummary.rowCount <= 1;
        }).map(function (pageSummary) {
          return pageSummary.pageNumber;
        });
        window.__propertyInstructionPdfAdaptiveLayoutSummary = exportState.adaptiveLayoutSummary;
      } else {
        window.__propertyInstructionPdfAdaptiveLayoutSummary = null;
      }
      validateExportDomParity(exportState.exportRoot, preMountParity.modelParityMap, "post-pagination");
      mutationGuardState = startExportMutationGuard(exportState.exportRoot);
      updateExportProgress(triggerElement, statusElement, null, null, "validate");
      recordPdfGenerationStage("adaptive-validation-started");
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
      recordPdfGenerationStage("adaptive-validation-completed", {
        pageCount: exportState.exportPages.querySelectorAll(".pi-export-page").length
      });

      setPdfExportLifecycle("rendering-pages");
      recordPdfGenerationStage("renderer-selection-completed", {
        renderer: getAdaptivePdfRenderer()
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
        pageImageBlobs: (renderResult.pageImageBlobs || []).slice(),
        pageImages: (renderResult.pageImages || []).map(function (pageImage, index) {
          var pageSummary = exportState && exportState.adaptiveLayoutSummary && Array.isArray(exportState.adaptiveLayoutSummary.pageOccupancy)
            ? exportState.adaptiveLayoutSummary.pageOccupancy[index] || null
            : null;
          return Object.assign({}, pageImage, {
            occupancy: pageSummary ? Number(pageSummary.occupancy || 0) : 0,
            rows: pageSummary ? (pageSummary.rowPlan || []) : [],
            cards: pageSummary ? (pageSummary.rowPlan || []).reduce(function (cards, row) {
              return cards.concat((row.cards || []).map(function (card) {
                return Object.assign({}, card);
              }));
            }, []) : []
          });
        }),
        pageCount: renderResult.pageCount,
        languageCode: guideModel.languageCode || SOURCE_LANGUAGE,
        cacheKey: cacheKey,
        artifactCacheHit: false,
        performance: Object.assign({}, performanceState),
        adaptiveSummary: exportState.adaptiveLayoutSummary ? JSON.parse(JSON.stringify(exportState.adaptiveLayoutSummary)) : null,
        plannerDiagnostics: exportState.adaptiveLayoutSummary && exportState.adaptiveLayoutSummary.plannerDiagnostics
          ? JSON.parse(JSON.stringify(exportState.adaptiveLayoutSummary.plannerDiagnostics))
          : null,
        filename: getPdfFilename(triggerElement),
        renderer: getAdaptivePdfRenderer(),
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
      showPdfFeedback("success", getGuideCopyText("pdf_ready", "PDF ready"));
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
      showAutomaticDownloadFallback(artifact, {
        message: getGuideCopyText("download_started", "Download started") + " If it did not start automatically, use Download PDF or Open PDF below."
      });
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
          pageImages: Array.isArray(artifact.pageImages) ? artifact.pageImages.slice() : [],
          summary: artifact.adaptiveSummary || null,
          plannerDiagnostics: artifact.plannerDiagnostics || null,
          performance: artifact.performance || {},
          renderer: artifact.renderer || "raster",
          embeddedFonts: Array.isArray(artifact.embeddedFonts) ? artifact.embeddedFonts.slice() : [],
          preparedImageAssets: Array.isArray(artifact.preparedImageAssets) ? artifact.preparedImageAssets.slice() : [],
          layoutModel: artifact.layoutModel || null,
          vectorTextDiagnostics: Array.isArray(artifact.vectorTextDiagnostics) ? artifact.vectorTextDiagnostics.slice() : []
        };
      }
    };
  }

  async function handlePdfToolbarClick(event) {
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
      showAutomaticDownloadFallback(feedbackDownloadArtifact, {
        message: getGuideCopyText("download_started", "Download started") + " If it did not start, try Download PDF again or open the PDF directly."
      });
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
      showAutomaticDownloadFallback(feedbackOpenArtifact, {
        message: "Your PDF was opened in a new tab."
      });
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
