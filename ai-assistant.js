(() => {
  const DEFAULT_WORKER_URL = "https://quality-tools-ai-assistant.quality-tools-ai-assistant.workers.dev";
  const config = {
    workerUrl: DEFAULT_WORKER_URL,
    currentTool: "unknown",
    analysisButtonTarget: "main",
    insertButtonAfter: true,
    showInlineLauncher: true,
    autoHoverOpen: false,
    language: null,
    ...(window.QualityCopilotConfig || {}),
  };

  const state = {
    open: false,
    waiting: false,
    openedTracked: false,
    hoverDismissed: false,
    messages: [],
    lastRequest: null
  };
  let hoverCloseTimer = null;

  const COPY = {
    en: {
      title: "AI Quality Assistant",
      subtitle: "Quality Engineering Copilot",
      privacy: "Only structured, non-sensitive summary information is sent to the AI service. Raw measurements, analysis files, Excel contents, supplier names, and product names are not shared automatically.",
      intro: "Ask quality engineering questions, discuss current results, plan actions, draft supplier communication, or learn concepts.",
      inputPlaceholder: "Ask a quality engineering question...",
      note: "AI guidance is for engineering reference. Page calculations and deterministic report text remain the source for current results.",
      aiGenerated: "AI generated",
      helpful: "Helpful",
      notHelpful: "Not helpful",
      thanks: "Thanks. Feedback recorded.",
      retry: "Retry",
      cancel: "Cancel",
      errorUnavailable: "AI interpretation is temporarily unavailable. Please try again later.",
      contextSent: "Using current page summary.",
      noContextSent: "General quality engineering question.",
      quickQuestions: [
        "Explain my current result",
        "What should I investigate next?",
        "Help me write a supplier email",
        "What is Cpk?",
        "Which quality tool should I use?"
      ],
      inlineTitle: "AI Interpretation",
      inlineHelp: "Ask follow-up questions about the current calculated summary.",
      inlineButton: "Ask AI"
    },
    zh: {
      title: "AI 质量助手",
      subtitle: "质量工程 Copilot",
      privacy: "仅将结构化、非敏感的汇总信息发送至 AI 服务。原始测量数据、分析文件、Excel 内容、供应商名称和产品名称不会被自动发送。",
      intro: "可以直接询问质量工程问题、讨论当前结果、规划行动、撰写供应商沟通或学习概念。",
      inputPlaceholder: "询问质量工程问题...",
      note: "AI 内容仅供工程参考；页面计算结果和确定性报告文字仍是当前结果事实来源。",
      aiGenerated: "AI 生成",
      helpful: "有帮助",
      notHelpful: "没有帮助",
      thanks: "谢谢，反馈已记录。",
      retry: "重试",
      cancel: "取消",
      errorUnavailable: "AI 工程解读暂时不可用，请稍后重试。",
      contextSent: "已使用当前页面汇总。",
      noContextSent: "通用质量工程问题。",
      quickQuestions: [
        "解释我当前的结果",
        "下一步应该调查什么？",
        "帮我写一封供应商邮件",
        "什么是 Cpk？",
        "我应该用哪个质量工具？"
      ],
      inlineTitle: "AI 工程解读",
      inlineHelp: "围绕当前计算汇总继续追问。",
      inlineButton: "询问 AI"
    }
  };

  const CONTEXT_KEYS = {
    process_capability: ["analysis mode", "Cp", "Cpk", "Pp", "Ppk", "sample size", "specification limits", "stability status"],
    measurement_system_analysis: ["study type", "%GRR", "repeatability", "reproducibility", "part-to-part variation", "ndc", "Kappa", "Cg", "Cgk"],
    sampling_plan: ["lot size", "sample size", "acceptance number", "rejection number", "AQL", "producer risk", "consumer risk"]
  };

  const RESULT_METRIC_KEYS = {
    process_capability: ["Cp", "Cpk", "Pp", "Ppk"],
    measurement_system_analysis: ["%GRR", "repeatability", "reproducibility", "part-to-part variation", "ndc", "Kappa", "Cg", "Cgk"],
    sampling_plan: ["sample size", "acceptance number", "rejection number", "AQL"]
  };

  function lang() {
    if (typeof config.language === "function") return config.language() === "zh" ? "zh" : "en";
    if (typeof config.language === "string") return config.language === "zh" ? "zh" : "en";
    return document.documentElement.lang.toLowerCase().startsWith("zh") ? "zh" : "en";
  }

  function t() { return COPY[lang()]; }

  function track(name, params = {}) {
    if (typeof window.gtag === "function") window.gtag("event", name, params);
  }

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[ch]));
  }

  function textOf(selector) {
    const el = document.querySelector(selector);
    return el ? el.textContent.replace(/\s+/g, " ").trim() : "";
  }

  function valueOf(selector) {
    const el = document.querySelector(selector);
    return el && "value" in el ? String(el.value || "").trim() : textOf(selector);
  }

  function cleanMetric(value) {
    if (!value) return "";
    const text = String(value).replace(/\s+/g, " ").trim();
    return text && text !== "-" && text !== "—" ? text.slice(0, 160) : "";
  }

  function addMetric(metrics, key, value) {
    const clean = cleanMetric(value);
    if (clean) metrics[key] = clean;
  }

  function firstCleanMetric(...values) {
    for (const value of values) {
      const clean = cleanMetric(value);
      if (clean) return clean;
    }
    return "";
  }

  function collectProcessCapability() {
    const metrics = {};
    addMetric(metrics, "analysis mode", valueOf("#analysisMode"));
    addMetric(metrics, "Cp", textOf("#cpValue") || findMetricExact("Cp"));
    addMetric(metrics, "Cpk", textOf("#cpkValue") || findMetricExact("Cpk") || findMetricNearText("Cpk"));
    addMetric(metrics, "Pp", textOf("#ppValue") || findMetricExact("Pp"));
    addMetric(metrics, "Ppk", textOf("#ppkValue") || findMetricExact("Ppk") || findMetricNearText("Ppk"));
    addMetric(metrics, "sample size", textOf("#sampleSize") || findMetricNearText("Sample Size") || findMetricNearText("样本量"));
    const lsl = valueOf("#lsl") || textOf("#lslValue");
    const usl = valueOf("#usl") || textOf("#uslValue");
    addMetric(metrics, "specification limits", [lsl && `LSL ${lsl}`, usl && `USL ${usl}`].filter(Boolean).join("; "));
    addMetric(metrics, "stability status", findMetricNearText("Stability") || findMetricNearText("稳定"));
    return makeSummary("process_capability", valueOf("#analysisMode") || "Process Capability", metrics);
  }

  function collectMsa() {
    const metrics = {};
    const studyType = valueOf("#dataTypeInput") || textOf("#measurementType") || textOf("#study .info strong");
    addMetric(metrics, "study type", studyType);
    addMetric(metrics, "%GRR", textOf("#metricGRR"));
    addMetric(metrics, "repeatability", textOf("#metricEV"));
    addMetric(metrics, "reproducibility", textOf("#metricAV"));
    addMetric(metrics, "part-to-part variation", textOf("#metricPV"));
    addMetric(metrics, "ndc", textOf("#metricNdc"));
    addMetric(metrics, "Kappa", findTableMetric(["Kappa", "总体 Kappa", "Overall Kappa"]));
    addMetric(metrics, "Cg", findTableMetric(["Cg"]));
    addMetric(metrics, "Cgk", findTableMetric(["Cgk"]));
    return makeSummary("measurement_system_analysis", studyType || "Measurement System Analysis", metrics);
  }

  function collectSampling() {
    const metrics = {};
    const selectedPlan = textOf("#selectedPlan");
    const selectedRow = selectedSamplingRow(selectedPlan);
    const acRe = selectedRow[3] || findTableMetric(["Ac/Re"]);
    const acReMatch = String(acRe || "").match(/(\d+)\s*\/\s*(\d+)/);
    addMetric(metrics, "lot size", valueOf("#lotSize") || valueOf("#varLotSize"));
    addMetric(metrics, "sample size", firstCleanMetric(textOf("#varNResult"), selectedPlan.match(/\bn\s*=\s*(\d+)/i)?.[1], selectedRow[2], textOf("#summaryBody td:nth-child(3)")));
    addMetric(metrics, "acceptance number", firstCleanMetric(selectedPlan.match(/\bAc\s*=?\s*(\d+)/i)?.[1], acReMatch?.[1]));
    addMetric(metrics, "rejection number", firstCleanMetric(selectedPlan.match(/\bRe\s*=?\s*(\d+)/i)?.[1], acReMatch?.[2]));
    addMetric(metrics, "AQL", firstCleanMetric(valueOf("#varAql"), selectedRow[1], findTableMetric(["AQL"])));
    addMetric(metrics, "producer risk", firstCleanMetric(textOf("#alphaValue"), textOf("#varKNote").match(/α\s*=?\s*([^·]+)/)?.[1], selectedRow[5], textOf("#varAnalyzeAlpha")));
    addMetric(metrics, "consumer risk", firstCleanMetric(textOf("#betaValue"), textOf("#varKNote").match(/β\s*=?\s*([^·]+)/)?.[1], selectedRow[6], textOf("#varAnalyzeBeta")));
    return makeSummary("sampling_plan", currentSamplingAnalysisType(), metrics);
  }

  function currentSamplingAnalysisType() {
    if (document.body.classList.contains("simple-task-analyze") || document.body.classList.contains("attr-task-analyze")) return "Analyze existing sampling plan";
    if (document.body.classList.contains("simple-task-decide") || document.body.classList.contains("attr-task-decide")) return "Lot inspection decision";
    if (document.body.classList.contains("simple-task-optimize") || document.body.classList.contains("attr-task-design")) return "Sampling plan design";
    return "Sampling Plan";
  }

  function findMetricNearText(labels) {
    const wanted = Array.isArray(labels) ? labels : [labels];
    const nodes = Array.from(document.querySelectorAll(".metric,.info,.dashboard-row,.report-kpi,.var-result"));
    for (const node of nodes) {
      const labelEl = node.querySelector(".k,.metric-label,span:first-child");
      const valueEl = node.querySelector(".v,strong,.metric-value");
      const labelText = labelEl ? labelEl.textContent.replace(/\s+/g, " ").trim().toLowerCase() : "";
      if (labelText && wanted.some(label => labelText === String(label).toLowerCase())) {
        return valueEl ? valueEl.textContent : "";
      }
    }
    for (const node of nodes) {
      const text = node.textContent.replace(/\s+/g, " ").trim();
      if (wanted.some(label => text.toLowerCase().includes(String(label).toLowerCase()))) {
        const strong = node.querySelector("strong,.metric-value");
        return strong ? strong.textContent : text.replace(wanted[0], "").trim();
      }
    }
    return "";
  }

  function findMetricExact(label) {
    const wanted = String(label).toLowerCase();
    for (const node of Array.from(document.querySelectorAll(".metric,.info,.dashboard-row,.report-kpi,.var-result"))) {
      const labelEl = node.querySelector(".k,.metric-label,span:first-child");
      const valueEl = node.querySelector(".v,strong,.metric-value");
      const labelText = labelEl ? labelEl.textContent.replace(/\s+/g, " ").trim().toLowerCase() : "";
      if (labelText === wanted) return valueEl ? valueEl.textContent : "";
    }
    return "";
  }

  function findTableMetric(labels) {
    const wanted = labels.map(label => String(label).toLowerCase());
    for (const row of Array.from(document.querySelectorAll("tr"))) {
      const cells = Array.from(row.children).map(cell => cell.textContent.replace(/\s+/g, " ").trim());
      if (cells.length >= 2 && wanted.some(label => cells[0].toLowerCase().includes(label))) return cells[1];
    }
    return "";
  }

  function selectedSamplingRow(selectedPlanText) {
    const selectedName = String(selectedPlanText || "").split(/[：:]/)[0].trim().toLowerCase();
    const rows = Array.from(document.querySelectorAll("#summaryBody tr")).map(row => Array.from(row.children).map(cell => cell.textContent.replace(/\s+/g, " ").trim()));
    if (!rows.length) return [];
    if (selectedName) {
      const matched = rows.find(cells => cells[0] && selectedName.includes(cells[0].toLowerCase()));
      if (matched) return matched;
    }
    return rows[0] || [];
  }

  function makeSummary(tool, analysisType, metrics) {
    return {
      current_tool: tool,
      analysis_type: analysisType || tool,
      available_context: CONTEXT_KEYS[tool] || [],
      summary_metrics: metrics,
      deterministic_interpretation: collectDeterministicInterpretation(),
      has_results: hasResultMetrics(tool, metrics)
    };
  }

  function hasResultMetrics(tool, metrics) {
    const required = RESULT_METRIC_KEYS[tool] || [];
    if (!required.length) return Object.keys(metrics || {}).length > 0;
    return required.some(key => cleanMetric(metrics?.[key]));
  }

  function collectSummary() {
    if (typeof config.collectSummary === "function") {
      const summary = config.collectSummary();
      return {
        ...summary,
        deterministic_interpretation: summary?.deterministic_interpretation || collectDeterministicInterpretation()
      };
    }
    if (config.currentTool === "process_capability") return collectProcessCapability();
    if (config.currentTool === "measurement_system_analysis") return collectMsa();
    if (config.currentTool === "sampling_plan") return collectSampling();
    return makeSummary(config.currentTool, "Current tool", {});
  }

  function collectDeterministicInterpretation() {
    if (typeof config.collectDeterministicInterpretation === "function") {
      return sanitizeInterpretation(config.collectDeterministicInterpretation());
    }
    const selectors = [
      "#summaryChecks",
      "#report",
      "#reportBody",
      "#capabilityReport",
      "#capabilityDashboardCard",
      "#designEngineeringBlock",
      "#compareEngineeringBlock",
      "#designRiskSummary",
      ".report-section",
      ".interpretation",
      ".checks"
    ];
    const chunks = [];
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (!el) continue;
      const text = el.textContent.replace(/\s+/g, " ").trim();
      if (text) chunks.push(text);
    }
    return sanitizeInterpretation(chunks.join("\n"));
  }

  function sanitizeInterpretation(value) {
    return String(value || "")
      .replace(/\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b/g, "[email]")
      .replace(/\b(?:supplier|customer|product)\s*[:：]\s*[^.;\n]+/gi, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 1800);
  }

  function requiresPageContext(question) {
    if (typeof config.requiresPageContext === "function") {
      return Boolean(config.requiresPageContext(String(question || "")));
    }
    const text = String(question || "").toLowerCase();
    const zh = /当前|这个|这份|页面|报告|结果|我的|下一步|我应该|该怎么|这个指标|这个结论|解释我|解释这个/.test(text);
    const en = /\b(current|this result|these results|my result|my cpk|my cp|my ppk|my grr|my ndc|my aql|page|report|next step|what should i investigate|what should i do next|this metric|this conclusion|explain my|explain this result)\b/.test(text);
    return zh || en;
  }

  function buildMessagesForRequest(question, useContext) {
    const recent = state.messages
      .filter(message => message.role === "user" || message.role === "assistant")
      .slice(-8)
      .map(message => ({ role: message.role, content: message.content.slice(0, 1200) }));
    if (!recent.length || recent[recent.length - 1].role !== "user" || recent[recent.length - 1].content !== question) {
      recent.push({ role: "user", content: question });
    }
    const summary = useContext ? collectSummary() : null;
    const hasPageContext = Boolean(useContext && summary?.has_results);
    const payload = {
      task: "chat",
      language: lang(),
      current_tool: config.currentTool,
      requires_page_context: hasPageContext,
      messages: recent
    };
    if (hasPageContext) {
      payload.summary_metrics = summary.summary_metrics;
      payload.deterministic_interpretation = summary.deterministic_interpretation;
      payload.available_context = summary.available_context;
      payload.analysis_type = summary.analysis_type;
    }
    return payload;
  }

  function workerError(error_code, fallback_reason, http_status = "") {
    return { success: false, error_code, fallback_reason, http_status };
  }

  async function callWorker(requestBody) {
    if (!config.workerUrl) return workerError("worker_not_configured", "AI service URL is not configured.");
    console.debug("[QualityCopilot] sanitized worker payload", {
      task: requestBody.task,
      language: requestBody.language,
      current_tool: requestBody.current_tool,
      requires_page_context: requestBody.requires_page_context,
      summary_metric_keys: Object.keys(requestBody.summary_metrics || {}),
      deterministic_interpretation_present: Boolean(requestBody.deterministic_interpretation),
      message_count: requestBody.messages?.length || 0
    });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(config.workerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify(requestBody)
      });
      const payload = await response.json().catch(error => {
        console.error("[QualityCopilot] worker error", { error_code: "invalid_json", http_status: response.status, message: error instanceof Error ? error.message : String(error) });
        return null;
      });
      if (!response.ok) {
        const code = response.status >= 500 ? "http_5xx" : "http_4xx";
        console.error("[QualityCopilot] worker error", { error_code: code, http_status: response.status, request_id: payload?.request_id || "" });
        return workerError(code, payload?.message || "Worker returned an HTTP error.", response.status);
      }
      if (payload?.success === false) {
        console.error("[QualityCopilot] worker error", { error_code: payload.error_code || "worker_error", http_status: response.status, request_id: payload.request_id || "" });
        return workerError(payload.error_code || "worker_error", payload.message || "Worker returned an unsuccessful response.", response.status);
      }
      const answer = typeof payload?.answer === "string" ? payload.answer.trim() : "";
      if (!answer) return workerError("invalid_schema", "Worker response did not include an answer.");
      return {
        success: true,
        answer,
        used_page_context: Boolean(payload.used_page_context),
        consistency_checked: Boolean(payload.consistency_checked)
      };
    } catch (error) {
      const code = error && error.name === "AbortError" ? "request_timeout" : "cors_error";
      console.error("[QualityCopilot] worker error", { error_code: code, message: error instanceof Error ? error.message : String(error) });
      return workerError(code, code === "request_timeout" ? "Worker request timed out." : "Worker request failed before a readable response was received.");
    } finally {
      clearTimeout(timer);
    }
  }

  function renderHome() {
    const copy = t();
    const quickQuestions = config.quickQuestions?.[lang()] || copy.quickQuestions;
    body.innerHTML = `
      <div class="qai-chat-intro">
        <h4>${esc(copy.subtitle)}</h4>
        <p>${esc(copy.intro)}</p>
      </div>
      <div class="qai-quick-row">
        ${quickQuestions.map(item => `<button class="qai-chip" type="button" data-quick-question="${esc(item)}">${esc(item)}</button>`).join("")}
      </div>
      <div class="qai-chat-log" aria-live="polite"></div>
    `;
    renderMessages();
  }

  function renderMessages() {
    const log = body.querySelector(".qai-chat-log");
    if (!log) return;
    log.innerHTML = state.messages.map(message => `
      <div class="qai-message ${esc(message.role)}">
        <div class="qai-message-bubble">${formatMessage(message.content)}</div>
        ${message.meta ? `<div class="qai-message-meta">${esc(message.meta)}</div>` : ""}
      </div>
    `).join("");
    log.scrollTop = log.scrollHeight;
  }

  function formatMessage(text) {
    return esc(text)
      .replace(/\n{3,}/g, "\n\n")
      .replace(/\n/g, "<br>");
  }

  function renderLoading() {
    state.messages.push({ role: "assistant", content: "...", pending: true });
    renderMessages();
  }

  function clearPending() {
    state.messages = state.messages.filter(message => !message.pending);
  }

  function renderError(error) {
    const copy = t();
    if (error) console.error("[QualityCopilot] displayed friendly error", error);
    clearPending();
    state.messages.push({ role: "assistant", content: copy.errorUnavailable });
    renderMessages();
  }

  async function sendChat(question) {
    const cleanQuestion = String(question || "").trim();
    if (!cleanQuestion || state.waiting) return;
    const useContext = requiresPageContext(cleanQuestion);
    const requestBody = buildMessagesForRequest(cleanQuestion, useContext);
    state.lastRequest = requestBody;
    state.messages.push({ role: "user", content: cleanQuestion });
    renderMessages();
    track("ai_mode_selected", { mode: useContext ? "chat_with_page_context" : "chat_general", current_tool: config.currentTool });
    state.waiting = true;
    renderLoading();
    const payload = await callWorker(requestBody);
    clearPending();
    if (payload.success) {
      state.messages.push({
        role: "assistant",
        content: payload.answer,
        meta: payload.used_page_context ? t().contextSent : t().noContextSent
      });
      track("ai_flow_completed", { workflow: "chat", current_tool: config.currentTool, success: true, used_page_context: payload.used_page_context });
      renderMessages();
    } else {
      renderError(payload);
      track("ai_flow_completed", { workflow: "chat", current_tool: config.currentTool, success: false, error_code: payload.error_code || "" });
    }
    state.waiting = false;
  }

  function refreshLanguage() {
    const copy = t();
    title.textContent = copy.title;
    subtitle.textContent = copy.subtitle;
    privacy.textContent = copy.privacy;
    input.placeholder = copy.inputPlaceholder;
    note.textContent = copy.note;
    const inline = document.querySelector("[data-qai-inline]");
    if (inline) {
      inline.querySelector("strong").textContent = copy.inlineTitle;
      inline.querySelector("span").textContent = copy.inlineHelp;
      inline.querySelector("button").textContent = copy.inlineButton;
    }
    if (!state.waiting) renderHome();
  }

  function resizeInput() {
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 100)}px`;
  }

  function openPanel(prefill = "") {
    panel.classList.add("open");
    button.setAttribute("aria-expanded", "true");
    state.open = true;
    if (!state.openedTracked) {
      track("ai_open", { current_tool: config.currentTool });
      state.openedTracked = true;
    }
    if (!body.querySelector(".qai-chat-log")) renderHome();
    if (prefill) {
      input.value = prefill;
      resizeInput();
      input.focus();
    }
  }

  function closePanel() {
    panel.classList.remove("open");
    button.setAttribute("aria-expanded", "false");
    state.open = false;
  }

  function insertInlineButton() {
    if (!config.showInlineLauncher) return;
    const target = document.querySelector(config.analysisButtonTarget);
    if (!target || document.querySelector("[data-qai-inline]")) return;
    const copy = t();
    const box = document.createElement("div");
    box.className = "qai-inline-launch";
    box.setAttribute("data-qai-inline", "true");
    box.innerHTML = `<div><strong>${esc(copy.inlineTitle)}</strong><span>${esc(copy.inlineHelp)}</span></div><button type="button">${esc(copy.inlineButton)}</button>`;
    box.querySelector("button").addEventListener("click", () => {
      openPanel(lang() === "zh" ? "解释我当前的结果" : "Explain my current result");
      track("ai_mode_selected", { mode: "inline_chat", current_tool: config.currentTool });
    });
    if (config.insertButtonAfter) target.insertAdjacentElement("afterend", box);
    else target.prepend(box);
  }

  const button = document.createElement("button");
  button.className = "qai-float";
  button.type = "button";
  button.setAttribute("aria-expanded", "false");
  button.innerHTML = '<span class="qai-float-icon">AI</span><span class="qai-float-label">AI Quality Assistant</span>';

  const panel = document.createElement("aside");
  panel.className = "qai-panel";
  panel.innerHTML = `
    <div class="qai-head">
      <div><div class="qai-title"></div><div class="qai-subtitle"></div></div>
      <div class="qai-head-actions"><button class="qai-icon-btn" type="button" data-qai-reset title="Reset">↻</button><button class="qai-icon-btn" type="button" data-qai-close title="Close">×</button></div>
    </div>
    <div class="qai-privacy"></div>
    <div class="qai-body"></div>
    <form class="qai-form">
      <div class="qai-input-wrap"><textarea class="qai-input" rows="1" maxlength="1600"></textarea><button class="qai-send" type="submit">↑</button></div>
      <div class="qai-note"></div>
    </form>
  `;

  document.body.append(button, panel);
  if (config.autoHoverOpen) {
    button.classList.add("qai-hover-enabled");
    panel.classList.add("qai-hover-enabled");
  }
  const title = panel.querySelector(".qai-title");
  const subtitle = panel.querySelector(".qai-subtitle");
  const privacy = panel.querySelector(".qai-privacy");
  const body = panel.querySelector(".qai-body");
  const input = panel.querySelector(".qai-input");
  const note = panel.querySelector(".qai-note");

  button.addEventListener("click", () => {
    state.hoverDismissed = false;
    if (state.open) closePanel();
    else openPanel();
  });

  panel.addEventListener("click", event => {
    if (event.target.closest("[data-qai-close]")) {
      state.hoverDismissed = true;
      closePanel();
    }
    if (event.target.closest("[data-qai-reset]")) {
      state.messages = [];
      state.lastRequest = null;
      renderHome();
    }
    const quick = event.target.closest("[data-quick-question]");
    if (quick) sendChat(quick.dataset.quickQuestion || quick.textContent);
    const feedback = event.target.closest("[data-qai-feedback]");
    if (feedback) {
      track(feedback.dataset.qaiFeedback === "positive" ? "ai_feedback_positive" : "ai_feedback_negative", { current_tool: config.currentTool });
      feedback.closest(".qai-feedback").outerHTML = `<p class="qai-status">${esc(t().thanks)}</p>`;
    }
  });

  panel.querySelector("form").addEventListener("submit", event => {
    event.preventDefault();
    const question = input.value.trim();
    if (!question) return;
    input.value = "";
    resizeInput();
    sendChat(question);
  });

  input.addEventListener("input", resizeInput);
  if (config.autoHoverOpen) {
    const cancelHoverClose = () => {
      if (hoverCloseTimer) clearTimeout(hoverCloseTimer);
      hoverCloseTimer = null;
    };
    const scheduleHoverClose = () => {
      cancelHoverClose();
      hoverCloseTimer = setTimeout(() => {
        if (state.open) closePanel();
      }, 280);
    };
    button.addEventListener("mouseenter", () => {
      cancelHoverClose();
      if (!state.hoverDismissed && !state.open) openPanel();
    });
    button.addEventListener("mouseleave", scheduleHoverClose);
    panel.addEventListener("mouseenter", cancelHoverClose);
    panel.addEventListener("mouseleave", scheduleHoverClose);
  }
  window.addEventListener("languagechange", refreshLanguage);
  document.addEventListener("change", () => setTimeout(refreshLanguage, 0));
  document.addEventListener("click", event => {
    if (event.target.closest("#zhBtn,#enBtn,#langBtn,#languageBtn,.lang-switch")) setTimeout(refreshLanguage, 30);
  });
  document.addEventListener("DOMContentLoaded", insertInlineButton);
  setTimeout(insertInlineButton, 250);
  refreshLanguage();
})();
