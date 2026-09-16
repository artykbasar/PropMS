(() => {
  const root = document.documentElement;
  const rootStyles = getComputedStyle(root);
  const themeColor = document.querySelector('meta[name="theme-color"]');
  const header = document.querySelector(".v2-header");
  const footer = document.querySelector(".v2-footer");
  const resolveChromeColor = (element, fallbackToken) => {
    if (element instanceof HTMLElement) {
      const background = getComputedStyle(element).backgroundColor.trim();
      if (
        background
        && background !== "transparent"
        && background !== "rgba(0, 0, 0, 0)"
      ) return background;
    }
    return rootStyles.getPropertyValue(fallbackToken).trim();
  };
  const headerColor = resolveChromeColor(header, "--brand-secondary");
  const footerColor = resolveChromeColor(footer, "--brand-dark");
  const setBrowserChromeColor = (color) => {
    if (!color) return;
    root.style.backgroundColor = color;
    if (themeColor instanceof HTMLMetaElement) themeColor.setAttribute("content", color);
  };
  setBrowserChromeColor(headerColor);
  if (footer instanceof HTMLElement && "IntersectionObserver" in window) {
    const footerObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => setBrowserChromeColor(entry.isIntersecting ? footerColor : headerColor));
    }, { threshold: 0.01 });
    footerObserver.observe(footer);
  }

  const toggle = document.querySelector(".v2-nav-toggle");
  const navigation = document.querySelector("#primary-navigation");
  if (!toggle || !navigation) return;

  toggle.hidden = false;
  navigation.dataset.enhanced = "true";

  const close = () => {
    toggle.setAttribute("aria-expanded", "false");
    navigation.dataset.open = "false";
  };

  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!expanded));
    navigation.dataset.open = String(!expanded);
  });

  navigation.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a")) close();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || toggle.getAttribute("aria-expanded") !== "true") return;
    close();
    toggle.focus();
  });

  matchMedia("(min-width: 48rem)").addEventListener("change", (event) => {
    if (event.matches) close();
  });

  const languageSwitcher = document.querySelector("#language-switcher");
  if (languageSwitcher instanceof HTMLSelectElement) {
    const setupLanguagePicker = async () => {
      const initialCode = languageSwitcher.value;
      const initialName = languageSwitcher.selectedOptions[0]?.textContent || initialCode;
      try {
        const response = await fetch(
          "/api/method/frappe.translate.get_all_languages?with_language_name=true",
          { credentials: "same-origin" },
        );
        if (!response.ok) return;
        const payload = await response.json();
        const languages = Array.isArray(payload.message) ? [...payload.message] : [];
        if (initialCode && !languages.some((language) => language.language_code === initialCode)) {
          languages.unshift({ language_code: initialCode, language_name: initialName });
        }
        const codes = new Set(languages.map((language) => language.language_code));
        const preferred = document.cookie
          .split("; ")
          .find((entry) => entry.startsWith("preferred_language="))
          ?.split("=", 2)[1];
        const preferredCode = preferred ? decodeURIComponent(preferred) : "";
        const browserCode = codes.has(navigator.language) ? navigator.language : "";
        const current = codes.has(preferredCode) ? preferredCode : (browserCode || initialCode);
        languageSwitcher.replaceChildren(
          ...languages.map((language) => {
            const option = document.createElement("option");
            option.value = language.language_code;
            option.textContent = language.language_name;
            return option;
          }),
        );
        const fallback = codes.has("en") ? "en" : (languages[0]?.language_code || "");
        languageSwitcher.value = codes.has(current) ? current : fallback;
        document.documentElement.lang = languageSwitcher.value || document.documentElement.lang;
      } catch (_error) {
        return;
      }
    };

    languageSwitcher.addEventListener("change", () => {
      const language = languageSwitcher.value;
      document.cookie = `preferred_language=${encodeURIComponent(language)}; Path=/; SameSite=Lax`;
      window.location.reload();
    });
    setupLanguagePicker();
  }

  const parityHeader = document.querySelector(".v2-home-parity .v2-header");
  if (parityHeader instanceof HTMLElement) {
    let headerTicking = false;
    const updateHeader = () => {
      parityHeader.classList.toggle("v2-header--compact", window.scrollY > 96);
      headerTicking = false;
    };
    updateHeader();
    window.addEventListener("scroll", () => {
      if (headerTicking) return;
      headerTicking = true;
      requestAnimationFrame(updateHeader);
    }, { passive: true });
  }

  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const revealItems = [...document.querySelectorAll("[data-reveal]")];
  if (revealItems.length && !reducedMotion && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.dataset.revealed = "true";
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8%" });
    revealItems.forEach((item) => observer.observe(item));
  }

  const fixedMediaSections = [...document.querySelectorAll(".v2-hero--scroll-fixed, .v2-cta--scroll-fixed")];
  if (fixedMediaSections.length && !reducedMotion) {
    const activateFixedMedia = (section) => {
      const image = section.querySelector(".v2-hero__image, .v2-cta__media img");
      if (!(image instanceof HTMLImageElement)) return;
      const markReady = () => section.classList.add("v2-media-fixed-ready");
      if (image.complete && image.naturalWidth) {
        markReady();
        return;
      }
      image.loading = "eager";
      image.addEventListener("load", markReady, { once: true });
    };

    if ("IntersectionObserver" in window) {
      const mediaObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          activateFixedMedia(entry.target);
          mediaObserver.unobserve(entry.target);
        });
      }, { rootMargin: "100% 0px" });
      fixedMediaSections.forEach((section) => mediaObserver.observe(section));
    } else {
      fixedMediaSections.forEach(activateFixedMedia);
    }
  }

  const contactForm = document.querySelector(".v2-contact-form");
  if (contactForm instanceof HTMLFormElement) {
    const startedAt = contactForm.elements.namedItem("form_started_at");
    if (startedAt instanceof HTMLInputElement) startedAt.value = String(Date.now());
    contactForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const status = contactForm.querySelector(".v2-form-status");
      if (!contactForm.reportValidity()) return;
      const data = new FormData(contactForm);
      const params = new URLSearchParams(window.location.search);
      data.set("source_page", window.location.pathname);
      ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].forEach((key) => {
        const value = params.get(key);
        if (value) data.set(key, value);
      });
      const submit = contactForm.querySelector('button[type="submit"]');
      if (submit instanceof HTMLButtonElement) submit.disabled = true;
      if (status) status.textContent = "Sending…";
      try {
        const response = await fetch("/api/method/propms.website_enquiry.submit_enquiry", {
          method: "POST",
          body: new URLSearchParams([...data.entries()].map(([key, value]) => [key, String(value)])),
          credentials: "same-origin",
        });
        if (!response.ok) throw new Error("Contact request failed");
        contactForm.reset();
        if (startedAt instanceof HTMLInputElement) startedAt.value = String(Date.now());
        if (status) status.textContent = "Your message has been received. Thank you!";
      } catch (_error) {
        if (status) status.textContent = "We could not receive your message. Please check your details and try again.";
      } finally {
        if (submit instanceof HTMLButtonElement) submit.disabled = false;
      }
    });
  }

  const newsletter = document.querySelector(".v2-footer__newsletter");
  if (newsletter instanceof HTMLFormElement) {
    newsletter.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!newsletter.reportValidity()) return;
      const input = newsletter.querySelector('input[type="email"]');
      const status = newsletter.querySelector("#footer-subscribe-status");
      const button = newsletter.querySelector('button[type="submit"]');
      const email = input instanceof HTMLInputElement ? input.value.trim() : "";
      if (button instanceof HTMLButtonElement) button.disabled = true;
      if (status) status.textContent = "Sending…";
      try {
        const response = await fetch("/api/method/propms.website.subscribe_to_newsletter", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
          body: new URLSearchParams({ email }),
          credentials: "same-origin",
        });
        if (!response.ok) throw new Error("Newsletter request failed");
        const payload = await response.json();
        if (!payload.message?.configured) {
          if (status) status.textContent = "Newsletter signup is not configured yet.";
        } else if (status) {
          status.textContent = payload.message.added ? "Thanks for subscribing." : "You are already subscribed.";
        }
      } catch (_error) {
        if (status) status.textContent = "Please enter a valid email address.";
      } finally {
        if (button instanceof HTMLButtonElement) button.disabled = false;
      }
    });
  }

  const consentPanel = document.querySelector("[data-consent-panel]");
  const consentBackdrop = document.querySelector("[data-consent-backdrop]");
  const consentReopen = document.querySelector("[data-consent-reopen]");
  const consentKey = "propms_consent_v1";
  const consentBannerDelay = 400;
  const defaultConsent = { essential: true, analytics: false, marketing: false, external_media: false };

  const readConsent = () => {
    try {
      const stored = localStorage.getItem(consentKey);
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      return {
        essential: true,
        analytics: parsed.analytics === true,
        marketing: parsed.marketing === true,
        external_media: parsed.external_media === true,
      };
    } catch (_error) {
      return null;
    }
  };

  let activeConsent = readConsent();
  let analyticsLoaded = false;

  const loadAnalytics = () => {
    if (analyticsLoaded || !activeConsent?.analytics || !(consentPanel instanceof HTMLElement)) return;
    if (consentPanel.dataset.analyticsProvider !== "Google Analytics") return;
    const measurementId = consentPanel.dataset.analyticsId || "";
    if (!/^G-[A-Z0-9]{6,20}$/.test(measurementId)) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", measurementId);
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.appendChild(script);
    analyticsLoaded = true;
  };

  const applyExternalMedia = () => {
    document.querySelectorAll("[data-external-media]").forEach((container) => {
      const frame = container.querySelector("[data-external-media-src]");
      const placeholder = container.querySelector(".v2-external-media__placeholder");
      if (!(frame instanceof HTMLIFrameElement)) return;
      if (activeConsent?.external_media) {
        if (!frame.src) frame.src = frame.dataset.externalMediaSrc || "";
        frame.hidden = false;
        if (placeholder instanceof HTMLElement) placeholder.hidden = true;
      } else {
        frame.removeAttribute("src");
        frame.hidden = true;
        if (placeholder instanceof HTMLElement) placeholder.hidden = false;
      }
    });
  };

  const applyConsent = () => {
    if (consentPanel instanceof HTMLElement) {
      const measurementId = consentPanel.dataset.analyticsId || "";
      if (/^G-[A-Z0-9]{6,20}$/.test(measurementId)) {
        window[`ga-disable-${measurementId}`] = !activeConsent?.analytics;
        if (typeof window.gtag === "function") {
          window.gtag("consent", "update", { analytics_storage: activeConsent?.analytics ? "granted" : "denied" });
        }
      }
    }
    loadAnalytics();
    applyExternalMedia();
    document.dispatchEvent(new CustomEvent("propms:consent", { detail: activeConsent || defaultConsent }));
  };

  if (consentPanel instanceof HTMLElement) {
    const summary = consentPanel.querySelector("[data-consent-summary]");
    const preferences = consentPanel.querySelector("[data-consent-preferences]");
    const closeButton = consentPanel.querySelector("[data-consent-close]");
    let consentTrigger = null;
    let consentBannerTimer = null;

    const resetConsentPanel = () => {
      consentPanel.classList.remove("v2-consent--preferences", "v2-consent--entered");
      consentPanel.classList.add("v2-consent--banner");
      if (consentBackdrop instanceof HTMLElement) consentBackdrop.hidden = true;
      if (summary instanceof HTMLElement) summary.hidden = false;
      if (preferences instanceof HTMLFormElement) preferences.hidden = true;
    };

    const storeConsent = (choices) => {
      if (consentBannerTimer !== null) window.clearTimeout(consentBannerTimer);
      consentBannerTimer = null;
      activeConsent = { ...defaultConsent, ...choices, essential: true };
      localStorage.setItem(consentKey, JSON.stringify(activeConsent));
      resetConsentPanel();
      consentPanel.hidden = true;
      if (consentReopen instanceof HTMLButtonElement) consentReopen.hidden = false;
      applyConsent();
    };

    const showPreferences = (trigger) => {
      if (consentBannerTimer !== null) window.clearTimeout(consentBannerTimer);
      consentBannerTimer = null;
      consentTrigger = trigger instanceof HTMLElement ? trigger : null;
      consentPanel.hidden = false;
      consentPanel.classList.remove("v2-consent--banner", "v2-consent--entered");
      consentPanel.classList.add("v2-consent--preferences");
      if (consentBackdrop instanceof HTMLElement) consentBackdrop.hidden = false;
      if (consentReopen instanceof HTMLButtonElement) consentReopen.hidden = true;
      if (summary instanceof HTMLElement) summary.hidden = true;
      if (preferences instanceof HTMLFormElement) {
        preferences.hidden = false;
        ["analytics", "marketing", "external_media"].forEach((key) => {
          const input = preferences.elements.namedItem(key);
          if (input instanceof HTMLInputElement) input.checked = Boolean(activeConsent?.[key]);
        });
      }
      requestAnimationFrame(() => {
        if (closeButton instanceof HTMLButtonElement) closeButton.focus();
      });
    };

    const closePreferences = () => {
      resetConsentPanel();
      if (activeConsent) {
        consentPanel.hidden = true;
        if (consentReopen instanceof HTMLButtonElement) consentReopen.hidden = false;
      } else {
        consentPanel.hidden = false;
        requestAnimationFrame(() => consentPanel.classList.add("v2-consent--entered"));
      }
      if (consentTrigger instanceof HTMLElement) consentTrigger.focus();
      consentTrigger = null;
    };

    consentPanel.querySelector("[data-consent-accept-all]")?.addEventListener("click", () => {
      storeConsent({ analytics: true, marketing: true, external_media: true });
    });
    consentPanel.querySelector("[data-consent-reject]")?.addEventListener("click", () => storeConsent(defaultConsent));
    consentPanel.querySelector("[data-consent-manage]")?.addEventListener("click", (event) => {
      showPreferences(event.currentTarget);
    });
    if (closeButton instanceof HTMLButtonElement) closeButton.addEventListener("click", closePreferences);
    if (consentBackdrop instanceof HTMLElement) consentBackdrop.addEventListener("click", closePreferences);

    if (preferences instanceof HTMLFormElement) {
      preferences.addEventListener("submit", (event) => {
        event.preventDefault();
        const form = new FormData(preferences);
        storeConsent({
          analytics: form.has("analytics"),
          marketing: form.has("marketing"),
          external_media: form.has("external_media"),
        });
      });
      preferences.addEventListener("keydown", (event) => {
        if (event.key !== "Tab") return;
        const focusable = [...preferences.querySelectorAll("button:not([disabled]), a[href], input:not([disabled])")];
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      });
    }

    if (consentReopen instanceof HTMLButtonElement) {
      consentReopen.addEventListener("click", (event) => showPreferences(event.currentTarget));
    }
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && consentPanel.classList.contains("v2-consent--preferences")) closePreferences();
    });

    if (activeConsent) {
      consentPanel.hidden = true;
      if (consentReopen instanceof HTMLButtonElement) consentReopen.hidden = false;
    } else {
      resetConsentPanel();
      consentPanel.hidden = true;
      requestAnimationFrame(() => {
        if (activeConsent) return;
        consentBannerTimer = window.setTimeout(() => {
          if (activeConsent) return;
          consentPanel.hidden = false;
          requestAnimationFrame(() => consentPanel.classList.add("v2-consent--entered"));
        }, consentBannerDelay);
      });
    }
    document.querySelectorAll("[data-external-media-enable]").forEach((button) => {
      button.addEventListener("click", () => {
        storeConsent({ ...(activeConsent || defaultConsent), external_media: true });
      });
    });
    applyConsent();
  }
})();
