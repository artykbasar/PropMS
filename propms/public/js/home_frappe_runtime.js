(() => {
  const frappe = window.frappe = window.frappe || {};
  frappe.utils = frappe.utils || {};
  frappe.session = frappe.session || { user: "Guest" };

  frappe._ = (text) => frappe._messages?.[text] || text;
  window.__ = window.__ || frappe._;
  frappe.get_cookie = (name) => {
    const prefix = `${encodeURIComponent(name)}=`;
    const part = document.cookie.split("; ").find((item) => item.startsWith(prefix));
    return part ? decodeURIComponent(part.slice(prefix.length)) : null;
  };
  frappe.utils.get_query_params = () => Object.fromEntries(new URLSearchParams(location.search));
  frappe.utils.get_url_arg = (name) => new URLSearchParams(location.search).get(name);
  frappe.utils.get_browser = () => {
    const ua = navigator.userAgent;
    if (/Edg\//.test(ua)) return "Edge";
    if (/Chrome\//.test(ua)) return "Chrome";
    if (/Firefox\//.test(ua)) return "Firefox";
    if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return "Safari";
    return "Unknown";
  };

  frappe.call = (methodOrOptions, args) => {
    const options = typeof methodOrOptions === "string"
      ? { method: methodOrOptions, args: args || {} }
      : { ...(methodOrOptions || {}) };
    const method = options.method;
    if (!method) return Promise.reject(new Error("frappe.call requires a method"));

    const headers = { "Accept": "application/json", "Content-Type": "application/json" };
    if (frappe.csrf_token && frappe.csrf_token !== "None") {
      headers["X-Frappe-CSRF-Token"] = frappe.csrf_token;
    }

    return fetch(`/api/method/${method}`, {
      method: options.type || "POST",
      credentials: "same-origin",
      headers,
      body: JSON.stringify(options.args || {}),
    }).then(async (response) => {
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.exc) {
        const error = new Error(data.message || data.exc_type || `Request failed (${response.status})`);
        error.response = data;
        throw error;
      }
      options.callback?.(data);
      return data;
    }).catch((error) => {
      options.error?.(error);
      throw error;
    });
  };

  frappe.msgprint = (message) => window.alert(String(message || ""));

  const setupLanguagePicker = async () => {
    if (frappe.session.user !== "Guest" || !window.show_language_picker) return;
    const wrapper = document.querySelector("#language-switcher");
    const select = wrapper?.querySelector("select");
    if (!wrapper || !select) return;

    try {
      const response = await frappe.call("frappe.translate.get_all_languages", {
        with_language_name: true,
      });
      const languages = [...(response.message || [])];
      if (!languages.length) return;
      const currentLanguage = frappe.get_cookie("preferred_language") || frappe.boot.lang || document.documentElement.lang;
      if (currentLanguage && !languages.some((item) => item.language_code === currentLanguage)) {
        let languageName = currentLanguage;
        try {
          languageName = new Intl.DisplayNames([currentLanguage], { type: "language" }).of(currentLanguage) || currentLanguage;
        } catch (error) {}
        languages.unshift({ language_code: currentLanguage, language_name: languageName });
      }
      const codes = languages.map((item) => item.language_code);
      select.replaceChildren(...languages.map((item) => {
        const option = document.createElement("option");
        option.value = item.language_code;
        option.textContent = item.language_name;
        return option;
      }));
      let language = frappe.get_cookie("preferred_language");
      language = language || (codes.includes(navigator.language) ? navigator.language : currentLanguage || "en");
      select.value = codes.includes(language) ? language : codes[0];
      document.documentElement.lang = select.value;
      wrapper.classList.remove("hide");
      select.addEventListener("change", () => {
        document.cookie = `preferred_language=${encodeURIComponent(select.value)}; path=/; SameSite=Lax`;
        location.reload();
      });
    } catch (error) {
      console.warn("Unable to load language picker", error);
    }
  };

  const flushReady = () => {
    const queued = [...(frappe.ready_events || [])];
    frappe.ready_events = [];
    frappe.ready = (fn) => queueMicrotask(fn);
    queued.forEach((fn) => {
      try { fn(); } catch (error) { console.error(error); }
    });
    setupLanguagePicker();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", flushReady, { once: true });
  } else {
    flushReady();
  }
})();
