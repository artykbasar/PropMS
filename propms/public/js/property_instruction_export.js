(function () {
  if (window.__propertyInstructionUiBound) {
    return;
  }
  window.__propertyInstructionUiBound = true;

  var HTML2CANVAS_LIBRARY_URL = "/assets/propms/js/vendor/html2canvas.min.js";
  var JSPDF_LIBRARY_URL = "/assets/propms/js/vendor/jspdf.umd.min.js";
  var PUBLIC_PDF_IMAGE_ENDPOINT = "/api/method/propms.property_management_solution.doctype.property_instruction.property_instruction.public_pdf_image";
  var OPEN_STREET_MAP_TILE_TEMPLATE = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
  var PDF_LAYOUT_VERSION = "2026-07-24-adaptive-osm-raster-v1";
  var PDF_EXPORT_WIDTH = 794;
  var PDF_EXPORT_PAGE_HEIGHT = 1122;
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
  var GUIDE_SETTLE_TIMEOUT_MS = 45000;
  var GUIDE_SETTLE_QUIET_MS = 2500;
  var GUIDE_SETTLE_STABLE_INTERVAL_MS = 1500;
  var GUIDE_SETTLE_STABLE_PASSES = 2;
  var SOURCE_LANGUAGE = "en";
  var RTL_LANGUAGE_PREFIXES = ["ar", "fa", "he", "ku", "ps", "ur", "yi"];
  var PDF_MAP_RENDER_TIMEOUT_MS = 10000;
  var PDF_WARM_PREPARE_TIMEOUT_MS = 1500;
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
    warmupIdleHandle: null
  };
  var pdfPreparationState = {
    preparedState: null,
    preparedStatesByKey: {},
    blobCache: {},
    warmupPromise: null,
    warmupKey: "",
    imageDataCache: new Map(),
    mapImageCache: new Map()
  };

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
      pageCaptureMs: [],
      encodingMs: 0,
      jsPdfAssemblyMs: 0,
      blobCreationMs: 0,
      buttonClickToPdfBlobMs: 0,
      warmRepeatedDownloadMs: 0,
      totalMs: 0
    };
    return window.__propertyInstructionPdfPerformance;
  }

  function getPdfPerformanceState() {
    return window.__propertyInstructionPdfPerformance || startPdfPerformance();
  }

  function recordPdfPerformance(performanceState, key, startedAt, value) {
    if (!performanceState || !key) {
      return;
    }
    performanceState[key] = typeof value === "number" ? value : (Date.now() - startedAt);
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

  function cancelIdleWork(handle) {
    if (!handle) {
      return;
    }
    if (typeof handle === "object") {
      if (handle.timeoutHandle) {
        window.clearTimeout(handle.timeoutHandle);
      }
      if (handle.idleHandle && window.cancelIdleCallback) {
        window.cancelIdleCallback(handle.idleHandle);
      }
      return;
    }
    if (window.cancelIdleCallback) {
      window.cancelIdleCallback(handle);
      return;
    }
    window.clearTimeout(handle);
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

  function getPdfFilename(downloadButton) {
    return String(downloadButton.getAttribute("data-pdf-filename") || "guest-guide.pdf").trim() || "guest-guide.pdf";
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

  function countMeaningfulSnapshotChanges(currentSnapshot, originalSnapshot) {
    if (!currentSnapshot || !originalSnapshot) {
      return 0;
    }
    var changedNodes = 0;
    currentSnapshot.orderedNodeIds.forEach(function (nodeId) {
      var meta = currentSnapshot.nodeMeta[nodeId] || originalSnapshot.nodeMeta[nodeId] || {};
      if (meta.kind !== "translatable") {
        return;
      }
      if ((currentSnapshot.nodeMap[nodeId] || "") !== (originalSnapshot.nodeMap[nodeId] || "")) {
        changedNodes += 1;
      }
    });
    return changedNodes;
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
    pdfPreparationState.warmupKey = "";
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
    var container = document.querySelector(".pi-translate-widget");
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
    });
    widgetObserver.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["value", "lang", "dir", "class"]
    });

    translationState.guideObserverBound = true;
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
      schedulePdfPreparationWarmup(document.querySelector(".pi-pdf-download"));
    }
  }

  function sleep(durationMs) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, durationMs);
    });
  }

  function getScrollTargetTop(element) {
    var rect = element.getBoundingClientRect();
    return Math.max(window.scrollY + rect.top - 40, 0);
  }

  async function exposeGuideSectionsForTranslation() {
    var guideScreen = getGuideScreen();
    if (!guideScreen) {
      throw new Error("Guide content unavailable");
    }
    var sections = Array.prototype.slice.call(guideScreen.querySelectorAll("[data-guide-section], [data-guide-block]"));
    var originalScrollY = window.scrollY;

    for (var index = 0; index < sections.length; index += 1) {
      var sectionNode = sections[index];
      window.scrollTo(0, getScrollTargetTop(sectionNode));
      await waitForTwoAnimationFrames();
      await sleep(180);

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

      var readinessKey = sectionNode.getAttribute("data-guide-section-anchor") ||
        sectionNode.getAttribute("data-guide-block-id") ||
        "node-" + index;
      translationState.sectionReadiness[readinessKey] = {
        exposedAt: Date.now(),
        textLength: normalizeText(sectionNode.innerText || sectionNode.textContent || "").length
      };
      translationState.diagnostics.sectionReadiness = translationState.sectionReadiness;
    }

    window.scrollTo(0, originalScrollY);
    await waitForTwoAnimationFrames();
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
    translationState.stablePassTimestamps = [];
    translationState.stableGeneration = readinessGeneration;

    await exposeGuideSectionsForTranslation();

    while (Date.now() - startedAt < GUIDE_SETTLE_TIMEOUT_MS) {
      var syncedLanguage = syncTranslationLanguageState();
      var currentLanguage = syncedLanguage || getGuideLanguage() || SOURCE_LANGUAGE;
      var quietFor = Date.now() - translationState.lastMutationAt;
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
      updateTranslationDiagnostics({
        mutationTimestamps: translationState.mutationTimestamps.slice(-60),
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
      recordTranslationProgress(snapshotAnalysis, quietFor);

      if (
        translationState.generation !== readinessGeneration ||
        currentLanguage !== expectedLanguage ||
        !snapshotAnalysis.structureOk ||
        (expectedLanguage !== SOURCE_LANGUAGE && snapshotAnalysis.unexpectedUnchangedTranslatableNodeIds.length > 0) ||
        (expectedLanguage !== SOURCE_LANGUAGE && snapshotAnalysis.changedTranslatableNodeIds.length <= 0) ||
        quietFor < GUIDE_SETTLE_QUIET_MS
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
      uniqueFetchUrls: uniqueFetchUrls
    };
  }

  async function temporarilyInlineDocumentProxyImages(exportRoot, exportImageDataCache) {
    var documentImages = Array.prototype.slice.call(document.querySelectorAll("img")).filter(function (img) {
      if (exportRoot && exportRoot.contains && exportRoot.contains(img)) {
        return false;
      }
      var src = String(img.getAttribute("src") || img.currentSrc || "").trim();
      return !!src && src.indexOf(PUBLIC_PDF_IMAGE_ENDPOINT) !== -1;
    });
    var restoreEntries = [];
    await Promise.all(documentImages.map(async function (img) {
      var originalSrc = String(img.getAttribute("src") || "").trim();
      var fetchUrl = resolveExportImageUrl(originalSrc || img.currentSrc || "");
      if (!fetchUrl) {
        return;
      }
      var dataUri = await getExportImageDataUri(fetchUrl, exportImageDataCache);
      restoreEntries.push({
        img: img,
        src: originalSrc,
        proxySrc: fetchUrl,
        dataUri: dataUri
      });
      img.setAttribute("data-export-inline-proxy-src", fetchUrl);
      img.setAttribute("src", dataUri);
      if (img.complete && img.naturalWidth && img.naturalHeight) {
        if (typeof img.decode === "function") {
          await img.decode().catch(function () {
            return null;
          });
        }
        return;
      }
      await new Promise(function (resolve) {
        function finish() {
          if (typeof img.decode === "function") {
            img.decode().catch(function () {
              return null;
            }).finally(resolve);
            return;
          }
          resolve();
        }
        img.addEventListener("load", finish, { once: true });
        img.addEventListener("error", resolve, { once: true });
      });
    }));
    return restoreEntries;
  }

  function restoreLiveGuideImages(restoreEntries) {
    (restoreEntries || []).forEach(function (entry) {
      if (!entry || !entry.img) {
        return;
      }
      entry.img.setAttribute("src", entry.src);
      entry.img.removeAttribute("data-export-inline-proxy-src");
    });
  }

  function buildInlineImageDataMap(restoreEntries, inlineImageDiagnostics, exportImageDataCache) {
    var entries = restoreEntries || [];
    var diagnostics = inlineImageDiagnostics || {};
    var uniqueFetchUrls = Array.isArray(diagnostics.uniqueFetchUrls) ? diagnostics.uniqueFetchUrls : [];
    return Promise.all(uniqueFetchUrls.map(function (url) {
      return getExportImageDataUri(url, exportImageDataCache).then(function (dataUri) {
        return [url, dataUri];
      });
    })).then(function (pairs) {
      var dataMap = {};
      pairs.forEach(function (pair) {
        dataMap[pair[0]] = pair[1];
      });
      entries.forEach(function (entry) {
        if (entry && entry.proxySrc && entry.dataUri) {
          dataMap[entry.proxySrc] = entry.dataUri;
        }
      });
      return dataMap;
    });
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
        src: String(img.getAttribute("data-export-image-original-src") || img.currentSrc || img.src || "").trim(),
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
        src: img.currentSrc || img.src || "",
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
          sourceNodeId: block.id ? ("block:" + block.id + ":link_label") : ""
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
          imageAlt: imageNode ? String(imageNode.getAttribute("alt") || "").trim() : ""
        };
      }).filter(function (block) {
        return block.title || block.body || block.caption || block.linkLabel || block.imageSrc;
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
    var fallbackCoordinates = parseGoogleMapCoordinatesFromUrl(mapLinkHref);
    var propertyLatitude = parseNumericDataAttribute(mapCard, "data-guide-map-latitude");
    var propertyLongitude = parseNumericDataAttribute(mapCard, "data-guide-map-longitude");
    if (!Number.isFinite(propertyLatitude) && fallbackCoordinates) {
      propertyLatitude = fallbackCoordinates.latitude;
    }
    if (!Number.isFinite(propertyLongitude) && fallbackCoordinates) {
      propertyLongitude = fallbackCoordinates.longitude;
    }

    return {
      languageCode: languageCode,
      direction: getGuideDirection(languageCode),
      title: getGuideTitle(),
      kicker: getVisibleText(guideKicker),
      emptyMessage: getVisibleText(emptyNode),
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
    var guideRoot = getGuideRoot();
    exportRoot.style.top = (
      guideRoot
        ? (guideRoot.getBoundingClientRect().bottom + window.scrollY + 48)
        : Math.max(document.body.scrollHeight, document.documentElement.scrollHeight, window.innerHeight) + 48
    ) + "px";
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

      if (model.map.attribution) {
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

    model.sections.forEach(function (sectionModel) {
      var section = document.createElement("section");
      section.className = "pi-export-section";

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

        if (model.parkingMap.attribution) {
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

        cardLayout.appendChild(textColumn);
        if (blockModel.imageSrc) {
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
      pendingImages: pendingImages
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

    var sectionTitle = titleNode.cloneNode(true);
    section.appendChild(sectionTitle);

    var cards = documentNode.createElement("div");
    cards.className = "pi-export-section-cards";
    section.appendChild(cards);

    return {
      section: section,
      cards: cards
    };
  }

  function paginateExportDocument(exportState) {
    var documentNode = exportState.exportDocument.ownerDocument;
    var exportPages = documentNode.createElement("div");
    exportPages.className = "pi-export-pages";
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
        var sourceCards = Array.from(childNode.querySelectorAll(".pi-export-card"));
        var sectionSlice = createSectionSlice(documentNode, sectionTitle);
        pageState.body.appendChild(sectionSlice.section);

        sourceCards.forEach(function (sourceCard) {
          sectionSlice.cards.appendChild(sourceCard);

          if (pageBodyOverflows(pageState)) {
            sectionSlice.cards.removeChild(sourceCard);

            if (!sectionSlice.cards.children.length) {
              pageState.body.removeChild(sectionSlice.section);
            }

            newPage();
            sectionSlice = createSectionSlice(documentNode, sectionTitle);
            pageState.body.appendChild(sectionSlice.section);
            sectionSlice.cards.appendChild(sourceCard);
          }

          pageState.hasContent = true;
        });

        if (!sectionSlice.cards.children.length && sectionSlice.section.parentNode === pageState.body) {
          pageState.body.removeChild(sectionSlice.section);
        }
        return;
      }

      appendStandaloneNode(childNode);
    });

    exportState.exportPages = exportPages;
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
      Number(mapConfig.longitude).toFixed(6),
      Number(mapConfig.latitude).toFixed(6),
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
    var markerX = Math.round((mapConfig.width - markerCanvas.width) / 2);
    var markerY = Math.round((mapConfig.height - markerCanvas.height) / 2) - 6;
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

  async function waitForMapCanvasPaint(map, diagnostic, timeoutMs) {
    var startedAt = Date.now();
    var lastPaintStats = null;

    while (Date.now() - startedAt < timeoutMs) {
      map.resize();
      map.triggerRepaint();
      await sleep(250);

      var renderCanvas = map.getCanvas();
      if (!renderCanvas || !renderCanvas.width || !renderCanvas.height) {
        continue;
      }

      try {
        lastPaintStats = sampleCanvasPaintStats(renderCanvas);
      } catch (error) {
        diagnostic.events.push({
          type: "paint-sample-error",
          timestamp: Date.now(),
          message: error && error.message ? error.message : "paint-sample-error"
        });
        continue;
      }

      diagnostic.lastPaintStats = lastPaintStats;
      diagnostic.events.push({
        type: "paint-sample",
        timestamp: Date.now(),
        painted: !!lastPaintStats.painted,
        variance: lastPaintStats.variance,
        nonWhiteRatio: lastPaintStats.nonWhiteRatio,
        tilesLoaded: typeof map.areTilesLoaded === "function" ? !!map.areTilesLoaded() : true
      });

      if (lastPaintStats.painted) {
        return {
          canvas: renderCanvas,
          paintStats: lastPaintStats
        };
      }
    }

    var paintError = new Error("map-render-timeout");
    paintError.lastPaintStats = lastPaintStats;
    throw paintError;
  }

  async function renderStaticMapSnapshot(mapConfig, exportImageDataCache) {
    if (!mapConfig || !Number.isFinite(mapConfig.latitude) || !Number.isFinite(mapConfig.longitude)) {
      throw new Error("map-coordinates-missing");
    }
    var diagnostic = {
      kind: mapConfig.kind,
      latitude: Number(mapConfig.latitude.toFixed(6)),
      longitude: Number(mapConfig.longitude.toFixed(6)),
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
      var worldX = projectLongitudeToWorldX(mapConfig.longitude, zoomLevel);
      var worldY = projectLatitudeToWorldY(mapConfig.latitude, zoomLevel);
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
        var tileDataUri = await getExportImageDataUri(resolvedTileUrl, exportImageDataCache);
        var tileImage = await loadImageFromDataUri(tileDataUri);
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

      var dataUri = buildMapSnapshotDataUri(tileCanvas, Object.assign({}, mapConfig, {
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

  async function prepareGuideModelAssets(model, exportImageDataCache, mapImageCache) {
    var preparedModel = deepCloneModel(model);
    var imageDiagnostics = await prewarmImageDataCacheForModel(preparedModel, exportImageDataCache);
    var mapStartedAt = Date.now();
    var mapDiagnostics = {
      propertyMap: null,
      parkingMap: null
    };

    try {
      if (Number.isFinite(preparedModel.map.latitude) && Number.isFinite(preparedModel.map.longitude)) {
        mapDiagnostics.propertyMap = await getOrCreateMapSnapshot({
          kind: "property",
          latitude: preparedModel.map.latitude,
          longitude: preparedModel.map.longitude,
          zoom: preparedModel.map.zoom || 16,
          width: 760,
          height: 300,
          attribution: "© OpenStreetMap contributors"
        }, mapImageCache, exportImageDataCache);
        preparedModel.map.imageSrc = mapDiagnostics.propertyMap.dataUri;
        preparedModel.map.attribution = mapDiagnostics.propertyMap.attribution || preparedModel.map.attribution;
      }
    } catch (error) {
      mapDiagnostics.propertyMap = {
        code: error && error.message ? error.message : "map-render-failed"
      };
    }

    try {
      if (
        preparedModel.parkingMap &&
        preparedModel.parkingMap.linkHref &&
        Number.isFinite(preparedModel.parkingMap.latitude) &&
        Number.isFinite(preparedModel.parkingMap.longitude)
      ) {
        mapDiagnostics.parkingMap = await getOrCreateMapSnapshot({
          kind: "parking",
          latitude: preparedModel.parkingMap.latitude,
          longitude: preparedModel.parkingMap.longitude,
          zoom: preparedModel.parkingMap.zoom || 15,
          width: 760,
          height: 260,
          attribution: "© OpenStreetMap contributors"
        }, mapImageCache, exportImageDataCache);
        preparedModel.parkingMap.imageSrc = mapDiagnostics.parkingMap.dataUri;
        preparedModel.parkingMap.attribution = mapDiagnostics.parkingMap.attribution || preparedModel.parkingMap.attribution;
      }
    } catch (error) {
      mapDiagnostics.parkingMap = {
        code: error && error.message ? error.message : "map-render-failed"
      };
    }

    return {
      model: preparedModel,
      imageDiagnostics: imageDiagnostics,
      mapPreparationMs: Date.now() - mapStartedAt,
      mapDiagnostics: mapDiagnostics
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
        mapDiagnostics: preparedAssets.mapDiagnostics,
        imageWarmDiagnostics: preparedAssets.imageDiagnostics
      };
      pdfPreparationState.preparedState = preparedState;
      pdfPreparationState.preparedStatesByKey[preparationKey] = preparedState;
      getPdfPerformanceState().translationReadyToExportPreparedMs =
        translationState.readyAt
          ? Math.max(0, preparedState.preparedAt - translationState.readyAt)
          : (Date.now() - preparationStartedAt);
      getPdfPerformanceState().mapPreparationMs = preparedAssets.mapPreparationMs;
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
    translationState.warmupIdleHandle = requestIdleWork(function () {
      var warmupButton = downloadButton || document.querySelector(".pi-pdf-download");
      var warmupGeneration = translationState.generation;
      var warmupLanguage = translationState.requestedLanguage || SOURCE_LANGUAGE;
      translationState.warmupScheduled = false;
      translationState.warmupIdleHandle = null;
      prewarmPdfLibraries();
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

  function cachePdfBlob(cacheKey, pdfBlob) {
    pdfPreparationState.blobCache[cacheKey] = {
      blob: pdfBlob,
      cachedAt: Date.now()
    };
  }

  function getCachedPdfBlob(cacheKey) {
    return pdfPreparationState.blobCache[cacheKey] || null;
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

  function updateExportProgress(downloadButton, statusElement, buttonLabel, statusMessage, stepName) {
    var currentLabel = downloadButton ? String(downloadButton.getAttribute("data-progress-label") || downloadButton.textContent || "").trim() : "";
    if (downloadButton) {
      if (buttonLabel) {
        downloadButton.textContent = buttonLabel;
      } else if (currentLabel) {
        downloadButton.textContent = currentLabel + "…";
      }
    }
    if (statusElement) {
      statusElement.classList.remove("sr-only");
      statusElement.textContent = statusMessage || "…";
    }
    window.__propertyInstructionPdfStep = stepName || "";
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
    return {
      alt: img.alt || "",
      currentSrc: img.currentSrc || img.src || "",
      complete: !!img.complete,
      naturalWidth: img.naturalWidth || 0,
      naturalHeight: img.naturalHeight || 0
    };
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
      var diagnostics = {
        role: String(img.getAttribute("data-export-image-role") || "image"),
        originalSrc: String(img.getAttribute("data-export-image-original-src") || "").trim(),
        resolvedSrc: resolvedSource
      };

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
        role: String(img.getAttribute("data-export-image-role") || "image"),
        originalSrc: String(img.getAttribute("data-export-image-original-src") || "").trim(),
        resolvedSrc: source,
        paintable: alphaPixels > 0 && variance > 0.5,
        alphaPixels: alphaPixels,
        sampleVariance: Number(variance.toFixed(4))
      };
    } catch (error) {
      throw new Error("Export image could not be painted to canvas: " + source);
    }
  }

  function validateExportImagesCanPaintToCanvas(exportRoot) {
    return Array.prototype.slice.call(exportRoot.querySelectorAll("img")).map(function (img) {
      var diagnostics = verifyImageCanPaintToCanvas(img);
      if (!diagnostics.paintable) {
        throw new Error("Export image could not be painted to canvas: " + diagnostics.resolvedSrc);
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
        role: String(img.getAttribute("data-export-image-role") || "image"),
        originalSrc: String(img.getAttribute("data-export-image-original-src") || "").trim(),
        resolvedSrc: String(img.getAttribute("data-export-image-resolved-src") || img.currentSrc || img.src || "").trim(),
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
        src: img.currentSrc || img.src || "",
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
        throw new Error("Export image aspect ratio changed beyond tolerance for " + diagnostics.src);
      }

      return diagnostics;
    });
  }

  function applyCaptureIgnoreAttributes(exportRoot, currentPageNode) {
    var ignoredNodes = [];
    function mark(node) {
      if (!node || node.getAttribute("data-html2canvas-ignore") === "true") {
        return;
      }
      node.setAttribute("data-html2canvas-ignore", "true");
      ignoredNodes.push(node);
    }
    mark(getGuideRoot());
    Array.prototype.slice.call(exportRoot.querySelectorAll("[data-pdf-page]")).forEach(function (pageNode) {
      if (pageNode !== currentPageNode) {
        mark(pageNode);
      }
    });
    return ignoredNodes;
  }

  function clearCaptureIgnoreAttributes(ignoredNodes) {
    (ignoredNodes || []).forEach(function (node) {
      node.removeAttribute("data-html2canvas-ignore");
    });
  }

  function prepareCaptureClone(clonedDocument, inlineImageDataMap) {
    if (!clonedDocument || !clonedDocument.querySelectorAll) {
      return;
    }
    Array.prototype.slice.call(clonedDocument.querySelectorAll("img")).forEach(function (img) {
      var mappedSource =
        String(img.getAttribute("data-export-image-resolved-src") || "").trim() ||
        String((inlineImageDataMap || {})[String(img.getAttribute("data-export-inline-proxy-src") || "").trim()] || "").trim() ||
        String((inlineImageDataMap || {})[String(img.getAttribute("src") || "").trim()] || "").trim();
      if (mappedSource && isDataUrl(mappedSource)) {
        img.setAttribute("src", mappedSource);
        img.removeAttribute("srcset");
      }
    });
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
    frame.style.position = "absolute";
    frame.style.left = "0";
    frame.style.top = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight, window.innerHeight) + 96 + "px";
    frame.style.width = PDF_EXPORT_WIDTH + "px";
    frame.style.height = PDF_EXPORT_PAGE_HEIGHT + "px";
    frame.style.border = "0";
    frame.style.opacity = "1";
    frame.style.visibility = "visible";
    frame.style.pointerEvents = "none";
    frame.style.background = "#ffffff";
    document.body.appendChild(frame);
    return frame;
  }

  function syncCaptureFrameHead(frameDocument) {
    if (!frameDocument) {
      return;
    }
    while (frameDocument.head.firstChild) {
      frameDocument.head.removeChild(frameDocument.head.firstChild);
    }
    var charset = frameDocument.createElement("meta");
    charset.setAttribute("charset", "utf-8");
    frameDocument.head.appendChild(charset);
    Array.prototype.slice.call(document.head.querySelectorAll("style, link[rel='stylesheet']")).forEach(function (node) {
      frameDocument.head.appendChild(node.cloneNode(true));
    });
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

  async function prepareCaptureFramePage(pageNode) {
    var frame = ensureCaptureFrame();
    var frameDocument = frame.contentDocument;
    if (!frameDocument) {
      throw new Error("Unable to prepare PDF capture frame.");
    }
    syncCaptureFrameHead(frameDocument);
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
      var href = normalizeHref(anchor.getAttribute("href") || anchor.href || "");
      if (!href) {
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
        pdf.link(x, y, width, height, { url: href });
      });
    });
  }

  function triggerBlobDownload(blob, filename) {
    var objectUrl = window.URL.createObjectURL(blob);
    var temporaryLink = document.createElement("a");
    temporaryLink.href = objectUrl;
    temporaryLink.download = filename;
    temporaryLink.rel = "noopener";
    document.body.appendChild(temporaryLink);
    temporaryLink.click();
    temporaryLink.remove();
    window.setTimeout(function () {
      window.URL.revokeObjectURL(objectUrl);
    }, 1000);
  }

  async function renderExportPagesToPdf(exportState, filename, modelParityMap, mutationGuardState) {
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
    var inlineImageDataMap = await buildInlineImageDataMap(
      exportState.liveGuideImageRestoreEntries,
      exportState.inlineImageDiagnostics,
      exportState.exportImageDataCache
    );

    var jsPDF = window.jspdf.jsPDF;
    var pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true
    });

    var pdfWidth = pdf.internal.pageSize.getWidth();
    var pdfHeight = pdf.internal.pageSize.getHeight();
    var pageDiagnostics = [];
    var paintedImageDiagnostics = [];
    window.__propertyInstructionPdfRenderer = "html2canvas+jspdf";

    var renderScale = 1.2;
    var captureFrame = null;

    try {
      for (var index = 0; index < pageNodes.length; index += 1) {
        var pageNode = pageNodes[index];
        validateExportDomParity(exportState.exportRoot, modelParityMap, "before-canvas-page-" + (index + 1), mutationGuardState);
        var diagnostics = collectPageDiagnostics(pageNode);
        window.__propertyInstructionPdfStep = "render-page-" + (index + 1);

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
        var captureTarget = await prepareCaptureFramePage(pageNode);
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
            prepareCaptureClone(clonedDocument, inlineImageDataMap);
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
        var jpegDataUrl = canvas.toDataURL("image/jpeg", 0.9);
        performanceState.encodingMs += Date.now() - encodingStartedAt;

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

    return pdf;
  }

  async function downloadTranslatedPdf(downloadButton) {
    const statusElement = document.querySelector(".pi-action-status");
    const originalLabel = downloadButton.textContent;
    const filename = getPdfFilename(downloadButton);
    const guideTitle = getGuideTitle();
    const guideIdentity = getGuideIdentity(downloadButton);
    var exportState = null;
    var mutationGuardState = null;
    var performanceState = startPdfPerformance();
    var exportImageDataCache = new Map();
    var liveGuideImageRestoreEntries = [];
    var clickStartedAt = Date.now();
    window.__propertyInstructionLastPdfError = null;

    downloadButton.classList.add("is-disabled");
    downloadButton.setAttribute("aria-disabled", "true");
    downloadButton.setAttribute("data-progress-label", originalLabel);
    updateExportProgress(downloadButton, statusElement, null, null, "initializing");

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
      var immediateCachedPdf = getCachedPdfBlob(immediateCacheKey);
      if (immediateCachedPdf && immediateCachedPdf.blob) {
        recordPdfPerformance(performanceState, "warmRepeatedDownloadMs", clickStartedAt);
        recordPdfPerformance(performanceState, "totalMs", performanceState.startedAt);
        window.__propertyInstructionLastPdfBlob = immediateCachedPdf.blob;
        window.__propertyInstructionLastPdfLanguage = currentLanguage;
        window.__propertyInstructionPdfStep = "download-ready";
        triggerBlobDownload(immediateCachedPdf.blob, filename);
        if (statusElement) {
          statusElement.textContent = originalLabel;
        }
        return;
      }
      updateExportProgress(downloadButton, statusElement, null, null, "wait-translation");
      var translationStartedAt = Date.now();
      var settledSnapshot = await ensureSettledGuideSnapshot();
      recordPdfPerformance(performanceState, "translationReadyMs", translationStartedAt);
      var exportGeneration = translationState.generation;
      var exportLanguage = translationState.requestedLanguage || SOURCE_LANGUAGE;
      var snapshotHash = getSnapshotHash(settledSnapshot);
      var cacheKey = getPreparedStateKey(guideIdentity, exportLanguage, exportGeneration, snapshotHash);
      var cachedPdf = getCachedPdfBlob(cacheKey);
      if (cachedPdf && cachedPdf.blob) {
        recordPdfPerformance(performanceState, "warmRepeatedDownloadMs", clickStartedAt);
        recordPdfPerformance(performanceState, "totalMs", performanceState.startedAt);
        window.__propertyInstructionLastPdfBlob = cachedPdf.blob;
        window.__propertyInstructionPdfStep = "download-ready";
        triggerBlobDownload(cachedPdf.blob, filename);
        if (statusElement) {
          statusElement.textContent = originalLabel;
        }
        return;
      }

      updateExportProgress(downloadButton, statusElement, null, null, "load-libraries");
      var prepareStartedAt = Date.now();
      var preparedState = await preparePdfDependenciesForSnapshot(settledSnapshot, downloadButton);
      exportImageDataCache = preparedState.imageDataCache || exportImageDataCache;
      recordPdfPerformance(
        performanceState,
        "translationReadyToExportPreparedMs",
        prepareStartedAt,
        preparedState && translationState.readyAt ? Math.max(0, preparedState.preparedAt - translationState.readyAt) : undefined
      );
      recordPdfPerformance(performanceState, "mapPreparationMs", 0, preparedState.mapPreparationMs || 0);

      updateExportProgress(downloadButton, statusElement, null, null, "extract-model");
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
        preparedState = await preparePdfDependenciesForSnapshot(settledSnapshot, downloadButton);
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
      updateExportProgress(downloadButton, statusElement, null, null, "build-export");
      var buildStartedAt = Date.now();
      exportState = buildPdfExportDocument(guideModel);
      exportState.performanceState = performanceState;
      exportState.exportImageDataCache = exportImageDataCache;
      exportState.preparedState = preparedState;
      recordPdfPerformance(performanceState, "exportDomConstructionMs", buildStartedAt);
      validateExportDomParity(exportState.exportRoot, preMountParity.modelParityMap, "detached-build");
      mountExportRoot(exportState.exportRoot);
      validateExportDomParity(exportState.exportRoot, preMountParity.modelParityMap, "post-mount");
      updateExportProgress(downloadButton, statusElement, null, null, "wait-images");
      var imagePrepStartedAt = Date.now();
      liveGuideImageRestoreEntries = await temporarilyInlineDocumentProxyImages(exportState.exportRoot, exportImageDataCache);
      var inlineImageDiagnostics = await inlineExportImages(exportState.exportRoot, exportImageDataCache);
      exportState.exportImageDataCache = exportImageDataCache;
      exportState.liveGuideImageRestoreEntries = liveGuideImageRestoreEntries;
      exportState.inlineImageDiagnostics = inlineImageDiagnostics;
      await waitForImages(exportState.exportRoot);
      updateExportProgress(downloadButton, statusElement, null, null, "prepare-layout");
      var sizingDiagnostics = applyExportImageSizing(exportState.exportRoot);
      await waitForFonts();
      await waitForTwoAnimationFrames();
      var prePaginationRatioDiagnostics = validateImageAspectRatios(exportState.exportRoot);
      var prePaginationClipDiagnostics = validateExportImageClipping(exportState.exportRoot);
      recordPdfPerformance(performanceState, "imagePreparationMs", imagePrepStartedAt);
      updateExportProgress(downloadButton, statusElement, null, null, "paginate");
      var paginationStartedAt = Date.now();
      paginateExportDocument(exportState);
      populatePageFooters(exportState, guideModel.title || guideTitle);
      recordPdfPerformance(performanceState, "paginationMs", paginationStartedAt);
      var layoutDiagnostics = collectCardLayoutDiagnostics(exportState.exportRoot);
      validateExportDomParity(exportState.exportRoot, preMountParity.modelParityMap, "post-pagination");
      mutationGuardState = startExportMutationGuard(exportState.exportRoot);
      updateExportProgress(downloadButton, statusElement, null, null, "validate");
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

      updateExportProgress(downloadButton, statusElement, null, null, "render-pdf");
      var pdf = await withTimeout(
        renderExportPagesToPdf(exportState, filename, preMountParity.modelParityMap, mutationGuardState),
        PDF_EXPORT_TIMEOUT_MS,
        "PDF export timed out"
      );
      updateExportProgress(downloadButton, statusElement, null, null, "finalize-pdf");
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
      var pdfBlob = pdf.output("blob");
      recordPdfPerformance(performanceState, "blobCreationMs", blobStartedAt);
      recordPdfPerformance(performanceState, "buttonClickToPdfBlobMs", clickStartedAt);
      recordPdfPerformance(performanceState, "totalMs", performanceState.startedAt);
      cachePdfBlob(cacheKey, pdfBlob);
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
        performance: performanceState
      });
      stopExportMutationGuard(mutationGuardState);
      triggerBlobDownload(pdfBlob, filename);
      destroyExportRoot(exportState.exportRoot);

      if (statusElement) {
        statusElement.textContent = originalLabel;
      }
    } catch (error) {
      window.__propertyInstructionLastPdfError = {
        message: error && error.message ? error.message : "Unable to prepare PDF",
        name: error && error.name ? error.name : "Error",
        capturedAt: Date.now()
      };
      window.__propertyInstructionPdfStep = "failed";
      if (!(translationState.diagnostics || {}).abortReason) {
        setTranslationAbortReason(error && error.message ? error.message : "Unable to prepare PDF", "translation-timeout-unknown");
      }
      if (typeof exportState !== "undefined" && exportState && exportState.exportRoot) {
        stopExportMutationGuard(mutationGuardState);
        destroyExportRoot(exportState.exportRoot);
      }
      restoreLiveGuideImages(liveGuideImageRestoreEntries);
      if (statusElement) {
        statusElement.textContent = "Translation is temporarily unavailable. Please wait and try again.";
      }
    } finally {
      stopExportMutationGuard(mutationGuardState);
      restoreLiveGuideImages(liveGuideImageRestoreEntries);
      downloadButton.classList.remove("is-disabled");
      downloadButton.removeAttribute("aria-disabled");
      downloadButton.textContent = originalLabel;
      downloadButton.removeAttribute("data-progress-label");
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

    const printButton = event.target.closest(".property-instruction-print");
    if (printButton) {
      window.print();
    }
  });

  document.addEventListener("pointerenter", function (event) {
    if (event.target && event.target.closest && event.target.closest(".pi-pdf-download")) {
      schedulePdfPreparationWarmup(event.target.closest(".pi-pdf-download"));
    }
  }, true);

  document.addEventListener("focus", function (event) {
    if (event.target && event.target.closest && event.target.closest(".pi-pdf-download")) {
      schedulePdfPreparationWarmup(event.target.closest(".pi-pdf-download"));
    }
  }, true);

  document.addEventListener("touchstart", function (event) {
    if (event.target && event.target.closest && event.target.closest(".pi-pdf-download")) {
      schedulePdfPreparationWarmup(event.target.closest(".pi-pdf-download"));
    }
  }, { passive: true, capture: true });

  if (getGuideScreen()) {
    try {
      ensureOriginalSnapshotCaptured();
      schedulePdfPreparationWarmup(document.querySelector(".pi-pdf-download"));
    } catch (error) {
      // Ignore early snapshot capture failures; export-time validation will handle them.
    }
  }
})();
