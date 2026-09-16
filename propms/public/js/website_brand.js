(() => {
  const ready = (fn) => document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", fn, { once: true })
    : fn();
  const translate = (text) => typeof window.__ === "function" ? window.__(text) : text;
  const getCookie = (name) => {
    const prefix = `${encodeURIComponent(name)}=`;
    const part = document.cookie.split("; ").find((item) => item.startsWith(prefix));
    return part ? decodeURIComponent(part.slice(prefix.length)) : null;
  };

  const normalizeLanguagePicker = () => {
    const select = document.querySelector("#language-switcher select");
    if (!select) return;
    const normalize = () => {
      if (!select.options.length) return;
      const preferred = getCookie("preferred_language");
      const current = preferred || window.frappe?.boot?.lang || document.documentElement.lang || "en";
      const values = () => Array.from(select.options, (option) => option.value);
      if (current && !values().includes(current)) {
        let label = current;
        try {
          label = new Intl.DisplayNames([current], { type: "language" }).of(current) || current;
        } catch (error) {}
        select.prepend(new Option(label, current));
      }
      const target = [preferred, navigator.language, current, "en"].find((code) => code && values().includes(code));
      if (target && (!select.value || select.selectedIndex < 0)) select.value = target;
    };
    new MutationObserver(normalize).observe(select, { childList: true });
    normalize();
  };

  const apiCall = async (method, args) => {
    const headers = { "Accept": "application/json", "Content-Type": "application/json" };
    const csrfToken = window.frappe?.csrf_token;
    if (csrfToken && csrfToken !== "None") headers["X-Frappe-CSRF-Token"] = csrfToken;
    const response = await fetch(`/api/method/${method}`, {
      method: "POST",
      credentials: "same-origin",
      headers,
      body: JSON.stringify(args || {}),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.exc) {
      const error = new Error(data.message || data.exc_type || translate("Request failed"));
      error.response = data;
      throw error;
    }
    return data;
  };

  const bindNavigation = () => {
    document.querySelector("#preloader")?.remove();
    const navbar = document.querySelector("#navbar");
    const toggle = document.querySelector(".mobile-nav-toggle");
    if (!navbar || !toggle) return;
    toggle.addEventListener("click", () => {
      navbar.classList.toggle("navbar-mobile");
      toggle.classList.toggle("bi-list");
      toggle.classList.toggle("bi-x");
    });
    navbar.querySelectorAll(".dropdown > a").forEach((link) => {
      link.addEventListener("click", (event) => {
        if (!navbar.classList.contains("navbar-mobile")) return;
        event.preventDefault();
        link.nextElementSibling?.classList.toggle("dropdown-active");
      });
    });
  };

  const bindContactForm = () => {
    const form = document.querySelector("#contact .php-email-form");
    if (!form || form.dataset.propmsBound) return;
    form.dataset.propmsBound = "1";
    const requestedSubject = new URLSearchParams(location.search).get("subject");
    const subject = form.elements.subject;
    if (requestedSubject && subject) subject.value = requestedSubject;
    const loading = form.querySelector(".loading");
    const errorBox = form.querySelector(".error-message");
    const sentBox = form.querySelector(".sent-message");
    const submit = form.querySelector(".btn-send");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      const email = String(form.elements.email?.value || "").trim();
      const message = String(form.elements.message?.value || "").trim();
      if (!email || !message) return;
      if (loading) loading.style.display = "block";
      if (errorBox) errorBox.style.display = "none";
      if (sentBox) sentBox.style.display = "none";
      if (submit) submit.disabled = true;

      try {
        await apiCall("frappe.www.contact.send_message", {
          subject: String(subject?.value || "Website Query"),
          sender: email,
          message,
        });
        form.reset();
        if (sentBox) sentBox.style.display = "block";
      } catch (error) {
        if (errorBox) {
          errorBox.textContent = translate("We could not send your message. Please try again.");
          errorBox.style.display = "block";
        }
      } finally {
        if (loading) loading.style.display = "none";
        if (submit) submit.disabled = false;
      }
    });
  };

  const bindNewsletter = () => {
    const input = document.querySelector("#footer-subscribe-email");
    const button = document.querySelector("#footer-subscribe-button");
    const form = button?.closest("form");
    const status = document.querySelector("#footer-subscribe-status");
    if (!input || !button || !form || form.dataset.propmsBound) return;
    form.dataset.propmsBound = "1";

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!input.checkValidity()) {
        input.reportValidity();
        return;
      }
      button.disabled = true;
      input.disabled = true;
      const original = button.value;
      button.value = translate("Sending...");
      if (status) status.textContent = "";

      try {
        const response = await apiCall("propms.website.subscribe_to_newsletter", {
          email: input.value.trim(),
        });
        if (!response.message?.configured) {
          if (status) status.textContent = translate("Newsletter signup is not configured yet.");
          button.value = original;
          button.disabled = false;
          input.disabled = false;
          return;
        }
        button.value = translate("Added");
        if (status) status.textContent = response.message.added
          ? translate("Thanks for subscribing.")
          : translate("You are already subscribed.");
      } catch (error) {
        if (status) status.textContent = translate("Please enter a valid email address.");
        button.value = original;
        button.disabled = false;
        input.disabled = false;
      }
    });
  };

  ready(() => {
    normalizeLanguagePicker();
    bindNavigation();
    bindContactForm();
    bindNewsletter();
  });
})();
