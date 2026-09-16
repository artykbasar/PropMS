(() => {
  const ready = (fn) => document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", fn, { once: true })
    : fn();

  ready(() => {
    const header = document.querySelector("#header");
    const navbar = document.querySelector("#navbar");
    const backToTop = document.querySelector(".back-to-top");
    const navLinks = [...document.querySelectorAll("#navbar .scrollto")];
    const headerOffset = header?.offsetTop ?? 0;
    const nextElement = header?.nextElementSibling;
    const cta = document.querySelector(".cta");
    let ticking = false;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    const initRevealAnimations = () => {
      const elements = [...document.querySelectorAll("[data-aos]")];
      if (!elements.length || reducedMotion) return;
      if (typeof Element.prototype.animate !== "function") return;

      const transforms = {
        "fade-up": "translate3d(0, 28px, 0)",
        "fade-left": "translate3d(32px, 0, 0)",
        "fade-right": "translate3d(-32px, 0, 0)",
        "zoom-in": "scale(.94)",
        "zoom-in-right": "translate3d(-18px, 0, 0) scale(.94)",
        "zoom-in-left": "translate3d(18px, 0, 0) scale(.94)",
        "zoom-in-down": "translate3d(0, -18px, 0) scale(.94)",
      };
      const logoAnimations = elements.filter((element) => element.closest("#header .logos"));

      const play = (element) => {
        if (element.dataset.propmsAnimated || element.dataset.propmsAnimationError) return;
        let delay = Number.parseInt(element.dataset.aosDelay || "0", 10) || 0;
        if (element.hasAttribute("data-aos-dalay")) {
          delay = Math.max(0, logoAnimations.indexOf(element)) * 140;
        }
        if (element.closest("#hero")) delay = Math.min(delay, 180);
        delay = Math.min(delay, 600);
        const requestedDuration = Number.parseInt(element.dataset.aosDuration || "650", 10) || 650;
        const duration = Math.min(900, Math.max(450, requestedDuration));
        try {
          const animation = element.animate([
            { opacity: 0, transform: transforms[element.dataset.aos] || transforms["fade-up"] },
            { opacity: 1, transform: "none" },
          ], { duration, delay, easing: "cubic-bezier(.22, 1, .36, 1)", fill: "both" });
          element.dataset.propmsAnimated = "1";
          animation.finished?.then(() => animation.cancel()).catch(() => {});
        } catch (error) {
          element.dataset.propmsAnimationError = error?.name || "animation-error";
        }
      };

      const pending = new Set(elements);
      elements.filter((element) => element.closest("#header")).forEach((element) => {
        pending.delete(element);
        play(element);
      });
      const revealVisible = () => {
        pending.forEach((element) => {
          const rect = element.getBoundingClientRect();
          if (rect.top >= window.innerHeight * .98 || rect.bottom <= 0) return;
          pending.delete(element);
          play(element);
        });
        if (!pending.size) {
          window.removeEventListener("scroll", revealVisible);
          window.removeEventListener("resize", revealVisible);
        }
      };
      window.addEventListener("scroll", revealVisible, { passive: true });
      window.addEventListener("resize", revealVisible, { passive: true });
      revealVisible();
    };

    const resolveCssUrls = (value, baseUrl) => value.replace(
      /url\((['"]?)(.*?)\1\)/g,
      (_match, _quote, url) => `url("${new URL(url, baseUrl || document.baseURI).href}")`,
    );

    const findDeferredBackground = (element) => {
      let found = null;
      const visit = (rules) => {
        [...(rules || [])].forEach((rule) => {
          if (rule.cssRules) visit(rule.cssRules);
          if (!rule.selectorText || !rule.style) return;
          let matches = false;
          try { matches = element.matches(rule.selectorText); } catch (_error) { return; }
          if (!matches) return;
          const value = rule.style.backgroundImage || rule.style.background;
          if (!value || !value.includes("url(")) return;
          found = resolveCssUrls(value, rule.parentStyleSheet?.href);
        });
      };

      [...document.styleSheets].forEach((sheet) => {
        try { visit(sheet.cssRules); } catch (_error) { /* cross-origin stylesheet */ }
      });
      return found;
    };

    const deferCtaBackground = () => {
      if (!cta) return;
      const load = () => {
        const background = findDeferredBackground(cta);
        if (background) cta.style.setProperty("background-image", background, "important");
      };
      if (!("IntersectionObserver" in window)) { load(); return; }
      const observer = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        load();
      }, { rootMargin: "400px 0px" });
      observer.observe(cta);
    };

    const updateScrollState = () => {
      const position = window.scrollY + 200;
      navLinks.forEach((link) => {
        if (!link.hash) return;
        const section = document.querySelector(link.hash);
        const active = section
          && position >= section.offsetTop
          && position <= section.offsetTop + section.offsetHeight;
        link.classList.toggle("active", Boolean(active));
      });

      if (header) {
        const fixed = headerOffset - window.scrollY <= 0;
        header.classList.toggle("fixed-top", fixed);
        nextElement?.classList.toggle("scrolled-offset", fixed);
      }
      backToTop?.classList.toggle("active", window.scrollY > 100);
      ticking = false;
    };

    const queueScrollUpdate = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateScrollState);
    };

    const scrollToTarget = (selector) => {
      const target = selector && document.querySelector(selector);
      if (!target) return false;
      const offset = Math.max(0, (header?.offsetHeight ?? 0) - 16);
      window.scrollTo({
        top: Math.max(0, target.offsetTop - offset),
        behavior: reducedMotion ? "auto" : "smooth",
      });
      return true;
    };

    document.addEventListener("scroll", queueScrollUpdate, { passive: true });
    updateScrollState();

    document.querySelectorAll(".scrollto").forEach((link) => {
      link.addEventListener("click", (event) => {
        if (!link.hash || !scrollToTarget(link.hash)) return;
        event.preventDefault();
        if (navbar?.classList.contains("navbar-mobile")) {
          navbar.classList.remove("navbar-mobile");
          document.querySelector(".mobile-nav-toggle")?.classList.replace("bi-x", "bi-list");
        }
      });
    });

    backToTop?.addEventListener("click", (event) => {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
    });

    deferCtaBackground();
    initRevealAnimations();

    if (window.location.hash) {
      window.requestAnimationFrame(() => scrollToTarget(window.location.hash));
    }

  });
})();
