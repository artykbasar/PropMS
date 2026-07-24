(function () {
  if (window.__propertyInstructionUiBound) {
    return;
  }
  window.__propertyInstructionUiBound = true;

  var HTML2CANVAS_LIBRARY_URL = "/assets/propms/js/vendor/html2canvas.min.js";
  var JSPDF_LIBRARY_URL = "/assets/propms/js/vendor/jspdf.umd.min.js";
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
  var GUIDE_SETTLE_TIMEOUT_MS = 12000;
  var GUIDE_SETTLE_QUIET_MS = 700;
  var GUIDE_SETTLE_STABLE_PASSES = 2;
  var RTL_LANGUAGE_PREFIXES = ["ar", "fa", "he", "ku", "ps", "ur", "yi"];

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
    return getVisibleText(document.querySelector("[data-guide-field='title']")) || "Estaex Guest Guide";
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
      String((getGuideRoot() && getGuideRoot().getAttribute("lang")) || document.documentElement.lang || "en")
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
      var computedDirection = window.getComputedStyle(guideRoot).direction;
      if (computedDirection === "rtl" || computedDirection === "ltr") {
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
      label: getVisibleText(labelElement),
      value: getVisibleText(valueElement)
    };
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

  function computeGuideSignature() {
    var guideScreen = getGuideScreen();
    if (!guideScreen) {
      return "";
    }

    var parts = [];
    guideScreen.querySelectorAll("[data-guide-signature]").forEach(function (element) {
      parts.push(getVisibleText(element).slice(0, 240));
    });
    parts.push("sections:" + guideScreen.querySelectorAll("[data-guide-section]").length);
    parts.push("blocks:" + guideScreen.querySelectorAll("[data-guide-block]").length);
    return parts.join("|");
  }

  function waitForGuideToSettle() {
    var guideScreen = getGuideScreen();
    if (!guideScreen) {
      return Promise.reject(new Error("Guide content unavailable"));
    }

    return new Promise(function (resolve, reject) {
      var lastMutationAt = Date.now();
      var startedAt = Date.now();
      var previousSignature = computeGuideSignature();
      var stablePasses = 0;

      var observer = new MutationObserver(function () {
        lastMutationAt = Date.now();
        stablePasses = 0;
      });

      observer.observe(guideScreen, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true,
        attributeFilter: ["class", "style", "dir", "lang"]
      });

      function finish(error) {
        observer.disconnect();
        if (error) {
          reject(error);
          return;
        }
        resolve();
      }

      function check() {
        var signature = computeGuideSignature();
        var quietFor = Date.now() - lastMutationAt;

        if (signature === previousSignature && quietFor >= GUIDE_SETTLE_QUIET_MS) {
          stablePasses += 1;
        } else {
          stablePasses = 0;
        }

        previousSignature = signature;

        if (stablePasses >= GUIDE_SETTLE_STABLE_PASSES) {
          finish();
          return;
        }

        if (Date.now() - startedAt >= GUIDE_SETTLE_TIMEOUT_MS) {
          finish(new Error("Translation did not settle in time"));
          return;
        }

        window.setTimeout(check, 320);
      }

      window.setTimeout(check, 360);
    });
  }

  function textToParagraphs(documentNode, text) {
    var fragment = documentNode.createDocumentFragment();
    var paragraphs = normalizeText(text).split(/\n{2,}/).filter(Boolean);

    if (!paragraphs.length && normalizeText(text)) {
      paragraphs = [normalizeText(text)];
    }

    paragraphs.forEach(function (paragraphText) {
      var paragraph = documentNode.createElement("p");
      var lines = paragraphText.split("\n").filter(Boolean);
      lines.forEach(function (line, index) {
        if (index) {
          paragraph.appendChild(documentNode.createElement("br"));
        }
        paragraph.appendChild(documentNode.createTextNode(line));
      });
      fragment.appendChild(paragraph);
    });

    return fragment;
  }

  function createManagedImage(documentNode, options, pendingImages) {
    var frame = documentNode.createElement("div");
    frame.className = options.frameClassName || "pi-export-image-frame";
    frame.setAttribute("data-export-image-frame", options.imageRole || "image");
    if (options.frameMinHeight) {
      frame.style.minHeight = options.frameMinHeight;
    }
    if (options.frameMaxHeight) {
      frame.style.maxHeight = options.frameMaxHeight;
    }

    var img = documentNode.createElement("img");
    img.className = options.className;
    img.src = options.src;
    img.alt = options.alt || "";
    img.loading = "eager";
    img.decoding = "sync";
    img.referrerPolicy = "strict-origin-when-cross-origin";
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

    pendingImages.push(
      new Promise(function (resolve) {
        function replaceWithPlaceholder() {
          var placeholder = documentNode.createElement("div");
          placeholder.className = options.placeholderClass || "pi-export-image-placeholder";
          placeholder.textContent = options.placeholderText || "Image unavailable";
          while (frame.firstChild) {
            frame.removeChild(frame.firstChild);
          }
          frame.appendChild(placeholder);
          resolve();
        }

        function markReady() {
          if (typeof img.decode === "function") {
            img.decode().catch(function () {
              return null;
            }).finally(resolve);
            return;
          }
          resolve();
        }

        if (img.complete) {
          if (img.naturalWidth > 0) {
            markReady();
          } else {
            replaceWithPlaceholder();
          }
          return;
        }

        img.addEventListener("load", markReady, { once: true });
        img.addEventListener("error", replaceWithPlaceholder, { once: true });
      })
    );

    return frame;
  }

  function extractGuideModel() {
    var guideScreen = getGuideScreen();
    if (!guideScreen) {
      throw new Error("Guide page unavailable");
    }

    var sections = Array.prototype.slice.call(guideScreen.querySelectorAll("[data-guide-section]")).map(function (sectionNode) {
      var blocks = Array.prototype.slice.call(sectionNode.querySelectorAll("[data-guide-block]")).map(function (blockNode) {
        var title = getVisibleText(blockNode.querySelector("[data-guide-block-title]"));
        var body = getVisibleText(blockNode.querySelector("[data-guide-block-body]"));
        var caption = getVisibleText(blockNode.querySelector("[data-guide-block-caption]"));
        var linkNode = blockNode.querySelector("[data-guide-block-link]");
        var imageNode = blockNode.querySelector("[data-guide-block-image]");
        return {
          id: blockNode.getAttribute("data-guide-block-id") || "",
          type: blockNode.getAttribute("data-guide-block-type") || "Text",
          stepNumber: getVisibleText(blockNode.querySelector("[data-guide-step-number]")),
          title: title,
          body: body,
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

    return {
      languageCode: languageCode,
      direction: getGuideDirection(languageCode),
      title: getGuideTitle(),
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
        title: mapCard ? getVisibleText(mapCard.querySelector(".pi-label")) : "",
        imageSrc: mapCard ? String(mapCard.getAttribute("data-guide-map-image") || "").trim() : "",
        linkHref: normalizeHref(mapLink && mapLink.getAttribute("href")),
        linkLabel: getVisibleText(mapLink) || "Open in Google Maps"
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
    var value = documentNode.createElement("span");
    value.className = "pi-export-value";
    value.textContent = fieldData.value;
    item.appendChild(label);
    item.appendChild(value);
    parentNode.appendChild(item);
  }

  function createExportRoot() {
    var guideRoot = getGuideRoot();
    var exportRoot = document.createElement("div");
    exportRoot.className = "pi-pdf-export-root";
    exportRoot.setAttribute("data-property-instruction-export", "root");
    exportRoot.setAttribute("lang", "en");
    exportRoot.setAttribute("dir", "ltr");
    exportRoot.setAttribute("aria-hidden", "true");
    exportRoot.style.position = "absolute";
    exportRoot.style.left = "0";
    exportRoot.style.top = (
      guideRoot
        ? (guideRoot.getBoundingClientRect().bottom + window.scrollY + 48)
        : Math.max(document.body.scrollHeight, document.documentElement.scrollHeight, window.innerHeight) + 48
    ) + "px";
    exportRoot.style.width = PDF_EXPORT_WIDTH + "px";
    exportRoot.style.background = "#ffffff";
    exportRoot.style.pointerEvents = "none";
    exportRoot.style.overflow = "visible";
    exportRoot.style.visibility = "visible";
    exportRoot.style.opacity = "1";
    exportRoot.style.zIndex = "0";
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

    var exportDocument = document.createElement("article");
    exportDocument.className = "pi-export-document";
    exportDocument.setAttribute("lang", model.languageCode || "en");
    exportDocument.setAttribute("dir", model.direction || "ltr");

    var header = document.createElement("header");
    header.className = "pi-export-header";

    var kicker = document.createElement("p");
    kicker.className = "pi-export-kicker";
    kicker.textContent = "Estaex Guest Guide";
    header.appendChild(kicker);

    var title = document.createElement("h1");
    title.className = "pi-export-title";
    title.textContent = model.title;
    header.appendChild(title);

    if (model.address && model.address.value) {
      var address = document.createElement("p");
      address.className = "pi-export-address";
      address.textContent = model.address.value;
      header.appendChild(address);
    }

    if (model.coverImage && model.coverImage.src) {
      header.appendChild(
        createManagedImage(document, {
          src: model.coverImage.src,
          alt: model.coverImage.alt || model.title,
          className: "pi-export-cover",
          frameClassName: "pi-export-image-frame pi-export-cover-frame",
          frameMinHeight: "140px",
          frameMaxHeight: "240px",
          imageRole: "cover",
          placeholderClass: "pi-export-image-placeholder",
          placeholderText: "Cover image unavailable"
        }, pendingImages)
      );
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
    header.appendChild(metaList);
    exportDocument.appendChild(header);

    if (model.map.linkHref || model.map.imageSrc) {
      var mapSection = document.createElement("section");
      mapSection.className = "pi-export-map";
      var mapTitle = document.createElement("h2");
      mapTitle.className = "pi-export-map-title";
      mapTitle.textContent = model.map.title || "Property Location";
      mapSection.appendChild(mapTitle);

      if (model.map.linkHref) {
        var mapLink = document.createElement("a");
        mapLink.href = model.map.linkHref;
        mapLink.target = "_blank";
        mapLink.rel = "noopener noreferrer nofollow";
        mapLink.textContent = model.map.linkLabel || model.map.linkHref;
        mapSection.appendChild(mapLink);
      }

      if (model.map.imageSrc) {
        mapSection.appendChild(
          createManagedImage(document, {
            src: model.map.imageSrc,
            alt: model.map.title || "Property location map",
            className: "pi-export-map-image",
            frameClassName: "pi-export-image-frame pi-export-map-image-frame",
            frameMinHeight: "120px",
            frameMaxHeight: "220px",
            imageRole: "map",
            placeholderClass: "pi-export-map-placeholder",
            placeholderText: "Map preview unavailable"
          }, pendingImages)
        );
      } else if (model.map.linkHref) {
        var mapFallback = document.createElement("p");
        mapFallback.className = "pi-export-map-note";
        mapFallback.textContent = "Map preview unavailable in this PDF. Use the Google Maps link above.";
        mapSection.appendChild(mapFallback);
      }

      exportDocument.appendChild(mapSection);
    }

    model.sections.forEach(function (sectionModel) {
      var section = document.createElement("section");
      section.className = "pi-export-section";

      var sectionTitle = document.createElement("h2");
      sectionTitle.className = "pi-export-section-title";
      sectionTitle.textContent = sectionModel.title;
      section.appendChild(sectionTitle);

      sectionModel.blocks.forEach(function (blockModel) {
        var card = document.createElement("article");
        card.className = "pi-export-card pi-export-card--" + String(blockModel.type || "text").toLowerCase().replace(/\s+/g, "-");

        if (blockModel.type === "Warning") {
          card.classList.add("pi-export-card--warning");
        }
        if (blockModel.type === "Step") {
          card.classList.add("pi-export-card--step");
        }

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
            cardHead.appendChild(cardTitle);
          }

          card.appendChild(cardHead);
        }

        if (blockModel.body) {
          var body = document.createElement("div");
          body.className = "pi-export-card-body";
          body.appendChild(textToParagraphs(document, blockModel.body));
          card.appendChild(body);
        }

        if (blockModel.imageSrc) {
          card.appendChild(
            createManagedImage(document, {
              src: blockModel.imageSrc,
              alt: blockModel.imageAlt || blockModel.title || sectionModel.title,
              className: "pi-export-card-image",
              frameClassName: "pi-export-image-frame pi-export-card-image-frame",
              frameMinHeight: "120px",
              frameMaxHeight: "270px",
              imageRole: "card",
              placeholderClass: "pi-export-image-placeholder",
              placeholderText: "Instruction image unavailable"
            }, pendingImages)
          );
        }

        if (blockModel.caption) {
          var caption = document.createElement("p");
          caption.className = "pi-export-card-caption";
          caption.textContent = blockModel.caption;
          card.appendChild(caption);
        }

        if (blockModel.linkHref) {
          var linkWrap = document.createElement("p");
          linkWrap.className = "pi-export-card-link";
          var link = document.createElement("a");
          link.href = blockModel.linkHref;
          link.target = "_blank";
          link.rel = "noopener noreferrer nofollow";
          link.textContent = blockModel.linkLabel || blockModel.linkHref;
          linkWrap.appendChild(link);
          card.appendChild(linkWrap);
        }

        section.appendChild(card);
      });

      exportDocument.appendChild(section);
    });

    if (!model.sections.length) {
      var empty = document.createElement("p");
      empty.className = "pi-export-empty";
      empty.textContent = "No published instruction content is available for this property yet.";
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
    return content;
  }

  function createExportPageShell(documentNode, sourceDocument) {
    var page = documentNode.createElement("section");
    page.className = "pi-export-page";
    page.setAttribute("data-pdf-page", "1");
    page.setAttribute("data-property-instruction-export", "page");
    page.setAttribute("lang", sourceDocument.getAttribute("lang") || "en");
    page.setAttribute("dir", sourceDocument.getAttribute("dir") || "ltr");
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

    var body = createExportDocumentShell(documentNode, sourceDocument);
    viewport.appendChild(body);
    page.appendChild(viewport);

    var footer = documentNode.createElement("footer");
    footer.className = "pi-export-footer";
    footer.setAttribute("dir", sourceDocument.getAttribute("dir") || "ltr");
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

      var right = document.createElement("span");
      right.className = "pi-export-footer-right";
      right.textContent = "Page " + (index + 1) + " of " + pageNodes.length;

      footer.appendChild(left);
      footer.appendChild(right);
    });
  }

  function validateExportParity(model, exportState) {
    var exportCardCount = exportState.exportPage.querySelectorAll(".pi-export-card").length;
    if (exportCardCount !== model.counts.blocks) {
      throw new Error("PDF export content does not match the visible guide");
    }
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
    if (downloadButton && buttonLabel) {
      downloadButton.textContent = buttonLabel;
    }
    if (statusElement && statusMessage) {
      statusElement.classList.remove("sr-only");
      statusElement.textContent = statusMessage;
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

  function validateImageAspectRatios(exportRoot) {
    return Array.prototype.slice.call(exportRoot.querySelectorAll("img")).map(function (img) {
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
        difference: Number((ratioDifference * 100).toFixed(4))
      };

      if (ratioDifference > PDF_EXPORT_IMAGE_RATIO_TOLERANCE) {
        throw new Error("Export image aspect ratio changed beyond tolerance for " + diagnostics.src);
      }

      return diagnostics;
    });
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

  async function renderExportPagesToPdf(exportState, filename) {
    var pageNodes = Array.prototype.slice.call(exportState.exportRoot.querySelectorAll("[data-pdf-page]"));
    if (!pageNodes.length) {
      throw new Error("No PDF pages were created.");
    }

    await waitForFonts();
    var imageDiagnostics = await waitForImages(exportState.exportRoot);
    await waitForTwoAnimationFrames();
    var imageRatioDiagnostics = validateImageAspectRatios(exportState.exportRoot);

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
    window.__propertyInstructionPdfRenderer = "html2canvas+jspdf";

    var isRtlExport = (exportState.exportRoot.getAttribute("dir") || "").toLowerCase() === "rtl";
    var renderScale = isRtlExport ? 1.2 : 1.35;

    for (var index = 0; index < pageNodes.length; index += 1) {
      var pageNode = pageNodes[index];
      var diagnostics = collectPageDiagnostics(pageNode);
      window.__propertyInstructionPdfStep = "render-page-" + (index + 1);

      if (diagnostics.viewportScrollHeight > diagnostics.viewportHeight + 2) {
        throw new Error("PDF page " + (index + 1) + " overflowed its shell");
      }
      if (!diagnostics.textLength) {
        throw new Error("PDF page " + (index + 1) + " is empty");
      }

      var canvas = await window.html2canvas(pageNode, {
        scale: renderScale,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: false,
        imageTimeout: 20000,
        scrollX: 0,
        scrollY: 0,
        width: pageNode.offsetWidth,
        height: pageNode.offsetHeight,
        windowWidth: pageNode.offsetWidth,
        windowHeight: pageNode.offsetHeight
      });

      diagnostics.canvasWidth = canvas.width;
      diagnostics.canvasHeight = canvas.height;

      if (!canvas.width || !canvas.height) {
        throw new Error("Page " + (index + 1) + " produced an empty canvas.");
      }

      if (index > 0) {
        pdf.addPage("a4", "portrait");
      }

      pdf.addImage(
        canvas.toDataURL("image/jpeg", 0.94),
        "JPEG",
        0,
        0,
        pdfWidth,
        pdfHeight,
        undefined,
        "FAST"
      );
      addPageLinkAnnotations(pdf, pageNode, pdfWidth, pdfHeight);
      pageDiagnostics.push(diagnostics);
    }

    if (pdf.internal.getNumberOfPages() !== pageNodes.length) {
      throw new Error("PDF page count did not match export page count.");
    }

    window.__propertyInstructionLastPdfDiagnostics = {
      imageDiagnostics: imageDiagnostics,
      imageRatioDiagnostics: imageRatioDiagnostics,
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
    var exportState = null;

    downloadButton.classList.add("is-disabled");
    downloadButton.setAttribute("aria-disabled", "true");
    updateExportProgress(downloadButton, statusElement, "Preparing PDF", "Preparing PDF", "initializing");

    try {
      updateExportProgress(downloadButton, statusElement, "Loading PDF tools", "Loading PDF tools", "load-libraries");
      await ensurePdfLibrary();
      updateExportProgress(downloadButton, statusElement, "Waiting for translation", "Waiting for translation", "wait-translation");
      await waitForGuideToSettle();
      updateExportProgress(downloadButton, statusElement, "Reading translated guide", "Reading translated guide", "extract-model");
      var guideModel = extractGuideModel();
      updateExportProgress(downloadButton, statusElement, "Building export pages", "Building export pages", "build-export");
      exportState = buildPdfExportDocument(guideModel);
      updateExportProgress(downloadButton, statusElement, "Loading export images", "Loading export images", "wait-images");
      await Promise.all(exportState.pendingImages);
      updateExportProgress(downloadButton, statusElement, "Paginating PDF", "Paginating PDF", "paginate");
      paginateExportDocument(exportState);
      populatePageFooters(exportState, guideModel.title || guideTitle);
      updateExportProgress(downloadButton, statusElement, "Validating PDF pages", "Validating PDF pages", "validate");
      validateExportParity(guideModel, exportState);

      updateExportProgress(downloadButton, statusElement, "Rendering PDF", "Rendering PDF", "render-pdf");
      var pdf = await withTimeout(
        renderExportPagesToPdf(exportState, filename),
        PDF_EXPORT_TIMEOUT_MS,
        "PDF export timed out"
      );
      updateExportProgress(downloadButton, statusElement, "Finalizing PDF", "Finalizing PDF", "finalize-pdf");
      var pdfBlob = pdf.output("blob");
      window.__propertyInstructionLastPdfBlob = pdfBlob;
      window.__propertyInstructionLastPdfLanguage = guideModel.languageCode || "en";
      window.__propertyInstructionPdfStep = "download-ready";
      triggerBlobDownload(pdfBlob, filename);
      destroyExportRoot(exportState.exportRoot);

      if (statusElement) {
        statusElement.textContent = "PDF downloaded";
      }
    } catch (error) {
      window.__propertyInstructionPdfStep = "failed";
      if (typeof exportState !== "undefined" && exportState && exportState.exportRoot) {
        destroyExportRoot(exportState.exportRoot);
      }
      if (statusElement) {
        statusElement.textContent = error && error.message ? error.message : "Unable to prepare PDF";
      }
    } finally {
      downloadButton.classList.remove("is-disabled");
      downloadButton.removeAttribute("aria-disabled");
      downloadButton.textContent = originalLabel;
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
})();
