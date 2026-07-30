(() => {
  if (window.__blendexFeedbackWidgetLoaded) return;
  window.__blendexFeedbackWidgetLoaded = true;

  const DEFAULT_ENDPOINT = "https://script.google.com/macros/s/AKfycbwzT52xnbS0dcd92ygdEWjGMmlNoiiMgYVi-hKJuRTlcTbnUBoEgYrel2Cds6iD33nwPQ/exec";
  const config = {
    endpoint: DEFAULT_ENDPOINT,
    tool: "unknown_tool",
    toolName: "Blendex Lab Tool",
    toolVersion: "",
    language: null,
    metadata: null,
    ...(window.BlendexFeedbackConfig || {})
  };

  const COPY = {
    en: {
      open: "Feedback",
      title: "Feedback",
      close: "Close feedback",
      textLabel: "Feedback",
      placeholder: "Tell me what did not work, what was unclear, or what you would like to improve...",
      emailLabel: "Email (optional)",
      cancel: "Cancel",
      submit: "Send Feedback",
      sending: "Sending...",
      success: "Feedback sent. Thank you.",
      fail: "Feedback could not be sent. Please try again later.",
      tooShort: "Please enter at least 5 characters.",
      tooLong: "Feedback must be 2000 characters or fewer.",
      email: "Please enter a valid email address, or leave it blank.",
      wait: "Please wait 30 seconds before sending another feedback."
    },
    zh: {
      open: "反馈",
      title: "反馈",
      close: "关闭反馈",
      textLabel: "反馈内容",
      placeholder: "请告诉我哪里不好用、哪里看不懂，或你希望增加什么功能……",
      emailLabel: "联系邮箱（选填）",
      cancel: "取消",
      submit: "发送反馈",
      sending: "正在发送……",
      success: "反馈已发送，谢谢你的建议。",
      fail: "反馈暂时未能发送，请稍后再试。",
      tooShort: "反馈内容至少需要 5 个字符。",
      tooLong: "反馈内容不能超过 2000 个字符。",
      email: "请输入有效邮箱，或留空。",
      wait: "连续两次提交至少需要间隔 30 秒。"
    }
  };

  const ids = {
    open: "blendexFeedbackOpen",
    overlay: "blendexFeedbackOverlay",
    dialog: "blendexFeedbackDialog",
    title: "blendexFeedbackTitle",
    close: "blendexFeedbackClose",
    form: "blendexFeedbackForm",
    textLabel: "blendexFeedbackTextLabel",
    text: "blendexFeedbackText",
    emailLabel: "blendexFeedbackEmailLabel",
    email: "blendexFeedbackEmail",
    website: "blendexFeedbackWebsite",
    status: "blendexFeedbackStatus",
    cancel: "blendexFeedbackCancel",
    submit: "blendexFeedbackSubmit"
  };

  let returnFocus = null;
  let submitting = false;

  function byId(id) {
    return document.getElementById(id);
  }

  function lang() {
    try {
      if (typeof config.language === "function") return config.language() === "zh" ? "zh" : "en";
      if (typeof config.language === "string") return config.language === "zh" ? "zh" : "en";
    } catch {}
    return document.documentElement.lang.toLowerCase().startsWith("zh") ? "zh" : "en";
  }

  function t() {
    return COPY[lang()];
  }

  function storageKey() {
    return `blendex.feedback.lastSubmittedAt.${String(config.tool || "unknown").replace(/[^a-z0-9_.-]/gi, "_")}`;
  }

  function lastSubmittedAt() {
    try {
      return Number(localStorage.getItem(storageKey()) || "0");
    } catch {
      return 0;
    }
  }

  function rememberSubmittedAt() {
    try {
      localStorage.setItem(storageKey(), String(Date.now()));
    } catch {}
  }

  function safeMetadata() {
    if (typeof config.metadata !== "function") return {};
    try {
      const value = config.metadata();
      if (!value || typeof value !== "object" || Array.isArray(value)) return {};
      return Object.fromEntries(
        Object.entries(value)
          .slice(0, 20)
          .map(([key, item]) => [String(key).slice(0, 80), String(item ?? "").slice(0, 500)])
      );
    } catch {
      return {};
    }
  }

  function setStatus(message = "", type = "") {
    const status = byId(ids.status);
    if (!status) return;
    status.textContent = message;
    status.className = `bxf-feedback-status ${type}`.trim();
  }

  function updateLanguage() {
    const copy = t();
    const open = byId(ids.open);
    const close = byId(ids.close);
    if (open) {
      open.textContent = copy.open;
      open.setAttribute("aria-label", copy.open);
    }
    if (byId(ids.title)) byId(ids.title).textContent = copy.title;
    if (close) close.setAttribute("aria-label", copy.close);
    if (byId(ids.textLabel)) byId(ids.textLabel).textContent = copy.textLabel;
    if (byId(ids.text)) byId(ids.text).placeholder = copy.placeholder;
    if (byId(ids.emailLabel)) byId(ids.emailLabel).textContent = copy.emailLabel;
    if (byId(ids.cancel)) byId(ids.cancel).textContent = copy.cancel;
    if (byId(ids.submit) && !submitting) byId(ids.submit).textContent = copy.submit;
  }

  function setSubmitting(value) {
    submitting = Boolean(value);
    [ids.submit, ids.cancel, ids.close].forEach(id => {
      const element = byId(id);
      if (element) element.disabled = submitting;
    });
    if (byId(ids.submit)) byId(ids.submit).textContent = submitting ? t().sending : t().submit;
  }

  function openDialog() {
    updateLanguage();
    returnFocus = document.activeElement || byId(ids.open);
    const overlay = byId(ids.overlay);
    if (!overlay) return;
    overlay.hidden = false;
    overlay.setAttribute("aria-hidden", "false");
    setStatus();
    window.setTimeout(() => byId(ids.text)?.focus(), 0);
  }

  function closeDialog() {
    if (submitting) return;
    const overlay = byId(ids.overlay);
    if (!overlay) return;
    overlay.hidden = true;
    overlay.setAttribute("aria-hidden", "true");
    setStatus();
    const target = returnFocus && typeof returnFocus.focus === "function" ? returnFocus : byId(ids.open);
    target?.focus();
  }

  function validate() {
    const feedback = String(byId(ids.text)?.value || "").trim();
    const email = String(byId(ids.email)?.value || "").trim();
    const honeypot = String(byId(ids.website)?.value || "").trim();
    if (honeypot) return { ok: false, bot: true };
    if (feedback.length < 5) return { ok: false, message: t().tooShort, focus: ids.text };
    if (feedback.length > 2000) return { ok: false, message: t().tooLong, focus: ids.text };
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { ok: false, message: t().email, focus: ids.email };
    }
    const previous = lastSubmittedAt();
    if (previous && Date.now() - previous < 30000) return { ok: false, message: t().wait };
    return { ok: true, feedback, email };
  }

  function payload(feedback, email) {
    return {
      feedback,
      email,
      tool: config.tool,
      toolName: config.toolName,
      toolVersion: config.toolVersion,
      uiLanguage: lang(),
      pageUrl: window.location.href,
      browser: navigator.userAgent,
      submittedAt: new Date().toISOString(),
      ...safeMetadata()
    };
  }

  async function submit(event) {
    event.preventDefault();
    const validation = validate();
    if (validation.bot) {
      closeDialog();
      return;
    }
    if (!validation.ok) {
      setStatus(validation.message, "error");
      if (validation.focus) byId(validation.focus)?.focus();
      return;
    }

    setSubmitting(true);
    setStatus(t().sending);
    try {
      await fetch(config.endpoint, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload(validation.feedback, validation.email))
      });
      rememberSubmittedAt();
      byId(ids.text).value = "";
      byId(ids.email).value = "";
      byId(ids.website).value = "";
      setStatus(t().success, "success");
      window.setTimeout(closeDialog, 900);
      if (typeof window.gtag === "function") {
        window.gtag("event", "feedback_submit", { tool_name: String(config.tool).slice(0, 80) });
      }
    } catch {
      setStatus(t().fail, "error");
    } finally {
      setSubmitting(false);
      updateLanguage();
    }
  }

  function keepFocusInside(event) {
    if (event.key !== "Tab") return;
    const dialog = byId(ids.dialog);
    if (!dialog) return;
    const focusable = [...dialog.querySelectorAll("button:not(:disabled), textarea:not(:disabled), input:not(:disabled)")];
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
  }

  function mount() {
    if (byId(ids.open)) return;
    document.body.insertAdjacentHTML("beforeend", `
      <button class="bxf-feedback-button" id="${ids.open}" type="button">Feedback</button>
      <div class="bxf-feedback-overlay" id="${ids.overlay}" hidden aria-hidden="true">
        <div class="bxf-feedback-dialog" id="${ids.dialog}" role="dialog" aria-modal="true" aria-labelledby="${ids.title}">
          <div class="bxf-feedback-header">
            <h2 id="${ids.title}">Feedback</h2>
            <button class="bxf-feedback-close" id="${ids.close}" type="button" aria-label="Close feedback">×</button>
          </div>
          <form class="bxf-feedback-form" id="${ids.form}" novalidate>
            <label class="bxf-feedback-field">
              <span id="${ids.textLabel}">Feedback</span>
              <textarea id="${ids.text}" maxlength="2000" required></textarea>
            </label>
            <label class="bxf-feedback-field">
              <span id="${ids.emailLabel}">Email (optional)</span>
              <input id="${ids.email}" type="email" autocomplete="email" maxlength="254" />
            </label>
            <label class="bxf-feedback-honeypot" aria-hidden="true">
              Website
              <input id="${ids.website}" type="text" autocomplete="off" tabindex="-1" />
            </label>
            <p class="bxf-feedback-status" id="${ids.status}" role="status" aria-live="polite"></p>
            <div class="bxf-feedback-actions">
              <button class="bxf-feedback-action secondary" id="${ids.cancel}" type="button">Cancel</button>
              <button class="bxf-feedback-action" id="${ids.submit}" type="submit">Send Feedback</button>
            </div>
          </form>
        </div>
      </div>
    `);

    byId(ids.open).addEventListener("click", openDialog);
    byId(ids.close).addEventListener("click", closeDialog);
    byId(ids.cancel).addEventListener("click", closeDialog);
    byId(ids.form).addEventListener("submit", submit);
    byId(ids.overlay).addEventListener("click", event => {
      if (event.target === byId(ids.overlay)) closeDialog();
    });
    document.addEventListener("keydown", event => {
      if (byId(ids.overlay)?.hidden) return;
      if (event.key === "Escape") closeDialog();
      else keepFocusInside(event);
    });
    window.addEventListener("languagechange", updateLanguage);
    updateLanguage();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount, { once: true });
  else mount();
})();
