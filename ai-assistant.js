(() => {
  const WORKER_URL = "https://quality-tools-ai-assistant.quality-tools-ai-assistant.workers.dev";
  const HISTORY_LIMIT = 6;
  const SECTION_KEYS = [
    "observed_facts",
    "missing_information",
    "investigation_questions",
    "recommended_checks",
    "required_evidence",
    "draft_suggestions",
    "limitations",
  ];

  const COPY = {
    zh: {
      launcher: "AI 质量助手",
      title: "AI 质量助手",
      beta: "8D 领域 Copilot",
      close: "关闭",
      clear: "清空对话",
      privacy: "默认只发送当前步骤的结构化状态，不发送客户、产品、供应商、负责人或附件。",
      include: "发送当前步骤的匿名化案例正文（请先确认内容不含敏感信息）",
      review: "审查当前步骤",
      evidence: "检查证据缺口",
      questions: "生成调查问题",
      welcomeTitle: "证据驱动的 8D Copilot",
      welcome: "我可以检查当前 D 步骤、指出缺失证据并建议下一轮调查。AI 不会确认根因、放行产品或替代 Gate Engine。",
      placeholder: "询问当前 8D 步骤……",
      send: "发送",
      note: "AI 只提供建议；正式判断仍由工程人员和 Gate Engine 完成。",
      thinking: "正在分析当前步骤",
      unavailable: "AI 助手暂时不可用，请稍后重试。",
      copy: "复制建议",
      copied: "已复制",
      step: "当前步骤",
      noCaseText: "案例正文未发送。",
      quickReview: "请审查当前步骤，指出最重要的三个缺口和下一步。",
      quickEvidence: "当前步骤还需要哪些证据，才能形成可审计的结论？",
      quickQuestions: "请生成下一轮最有区分力的调查问题，并说明每个问题要验证什么。",
      sections: {
        observed_facts: "已知事实",
        missing_information: "缺失信息",
        investigation_questions: "调查问题",
        recommended_checks: "建议检查",
        required_evidence: "所需证据",
        draft_suggestions: "措辞建议",
        limitations: "限制与人工确认",
      },
    },
    en: {
      launcher: "AI Quality Assistant",
      title: "AI Quality Assistant",
      beta: "8D Domain Copilot",
      close: "Close",
      clear: "Clear conversation",
      privacy: "By default, only structured step status is sent. Customer, product, supplier, owner, and attachment data are excluded.",
      include: "Include anonymized current-step text (confirm it contains no sensitive information)",
      review: "Review step",
      evidence: "Evidence gaps",
      questions: "Investigation questions",
      welcomeTitle: "Evidence-driven 8D Copilot",
      welcome: "I can review the current D-step, identify missing evidence, and suggest the next investigation. AI cannot confirm root cause, release product, or replace the Gate Engine.",
      placeholder: "Ask about the current 8D step...",
      send: "Send",
      note: "AI provides guidance only; formal decisions remain with engineers and the Gate Engine.",
      thinking: "Reviewing the current step",
      unavailable: "The AI assistant is temporarily unavailable. Please try again later.",
      copy: "Copy guidance",
      copied: "Copied",
      step: "Current step",
      noCaseText: "Case text was not sent.",
      quickReview: "Review the current step and identify the three most important gaps and next actions.",
      quickEvidence: "What evidence is still required for an auditable conclusion at this step?",
      quickQuestions: "Generate the next discriminating investigation questions and state what each question should verify.",
      sections: {
        observed_facts: "Observed facts",
        missing_information: "Missing information",
        investigation_questions: "Investigation questions",
        recommended_checks: "Recommended checks",
        required_evidence: "Required evidence",
        draft_suggestions: "Draft suggestions",
        limitations: "Limitations and human review",
      },
    },
  };

  let messages = [];
  let waiting = false;

  function language() {
    return typeof state !== "undefined" && state.lang === "en" ? "en" : "zh";
  }

  function t() {
    return COPY[language()];
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    }[char]));
  }

  function currentStep() {
    const tab = typeof activeTabId === "function" ? activeTabId() : "intake";
    const map = {
      intake: "INTAKE",
      risk: "INTAKE",
      timeline: "INTAKE",
      gate: "GATE",
      settings: "GATE",
    };
    return map[tab] || (/^d[0-8]$/i.test(tab) ? tab.toUpperCase() : "INTAKE");
  }

  function safeList(value, limit = 10) {
    return Array.isArray(value) ? value.slice(0, limit) : [];
  }

  function issueText(issue) {
    try {
      return typeof msg === "function" ? msg(issue) : String(issue?.message || issue?.code || "");
    } catch {
      return String(issue?.message || issue?.code || "");
    }
  }

  function gateContext() {
    try {
      const gate = buildGateResult();
      const issues = Object.entries(gate.blocks || {}).flatMap(([block, value]) =>
        safeList(value?.issues, 6).map((issue) => ({
          block,
          code: String(issue?.code || ""),
          object_id: String(issue?.objectId || ""),
          message: issueText(issue).slice(0, 320),
        }))
      );
      return {
        final_status: String(gate.finalStatus || ""),
        open_issue_count: issues.length,
        issues: issues.slice(0, 18),
      };
    } catch {
      return { final_status: "Unavailable", open_issue_count: 0, issues: [] };
    }
  }

  function structuralIntegrityContext() {
    const integrity = state.integrity || {};
    const statusCounts = (items) => safeList(items, 30).reduce((acc, item) => {
      const key = String(item?.status || item?.assessment || "Unknown");
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return {
      evidence_count: safeList(integrity.evidence, 100).length,
      evidence_confidence: safeList(integrity.evidence, 100).reduce((acc, item) => {
        const key = String(item?.confidence || "Unknown");
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {}),
      containment_status: statusCounts(integrity.containments),
      root_cause_status: statusCounts(integrity.rootCauses),
      corrective_action_status: statusCounts(integrity.correctiveActions),
      verification_status: statusCounts(integrity.verifications),
      root_cause_ids: safeList(integrity.rootCauses, 16).map((item) => ({
        id: String(item?.id || ""),
        type: String(item?.type || ""),
        status: String(item?.status || ""),
      })),
      action_links: safeList(integrity.correctiveActions, 16).map((item) => ({
        id: String(item?.id || ""),
        root_cause_ids: safeList(item?.rootCauseIds, 8).map(String),
        action_type: String(item?.actionType || ""),
        computed_status: typeof computeActionStatus === "function" ? String(computeActionStatus(item) || "") : String(item?.status || ""),
      })),
    };
  }

  function anonymizedStepText(step) {
    const integrity = state.integrity || {};
    const fields = state.fields || {};
    if (step === "D0") return { emergency_response: fields.d0 || "" };
    if (step === "D1") {
      return {
        team: safeList(state.tables?.team, 12).map((row) => ({
          role: String(row?.[0] || ""),
          responsibility: String(row?.[2] || ""),
        })),
      };
    }
    if (step === "D2") {
      return {
        initial_problem_description: fields.problemRaw || "",
        generated_problem_statement: fields.d2 || "",
        verified_failure: fields.verifiedFailure || "",
        is_is_not: safeList(state.tables?.isnot, 12),
        investigation_questions: safeList(state.tables?.questions, 12).map((row) => ({
          question: String(row?.[0] || ""),
          tool: String(row?.[1] || ""),
          evidence_needed: String(row?.[2] || ""),
          status: String(row?.[3] || ""),
          conclusion: String(row?.[4] || ""),
        })),
      };
    }
    if (step === "D3") {
      return {
        containments: safeList(integrity.containments, 16).map((item) => ({
          id: item?.id || "",
          scope: item?.scope || "",
          action: item?.action || item?.description || "",
          status: item?.status || "",
          implementation_date: item?.implementationDate || "",
          verification_method: item?.verificationMethod || "",
          exit_criteria: item?.exitCriteria || "",
        })),
        detection_reliability: safeList(integrity.detectionReliability, 16).map((item) => ({
          id: item?.id || "",
          containment_id: item?.containmentId || "",
          method: item?.detectionMethod || item?.methodType || "",
          measurement_system_status: item?.measurementSystemStatus || "",
          false_accept_risk: item?.falseAcceptRisk || "",
          escape_after_containment: item?.escapeAfterContainment || "",
          exit_criteria: item?.exitCriteria || "",
        })),
      };
    }
    if (step === "D4") {
      return {
        root_causes: safeList(integrity.rootCauses, 16).map((item) => ({
          id: item?.id || "",
          type: item?.type || "",
          status: item?.status || "",
          hypothesis: item?.hypothesis || "",
          failure_mechanism: item?.failureMechanism || "",
          validation_method: item?.validationMethod || "",
          expected_result: item?.expectedResult || "",
          actual_result: item?.actualResult || "",
        })),
        evidence: safeList(integrity.evidence, 20).map((item) => ({
          id: item?.id || "",
          evidence_type: item?.evidenceType || "",
          description: item?.description || "",
          observed_result: item?.observedResult || "",
          confidence: item?.confidence || "",
          links: safeList(item?.links, 6).map((link) => ({
            related_type: link?.relatedType || "",
            related_id: link?.relatedId || "",
          })),
        })),
        five_why: safeList(state.tables?.why, 10),
        fishbone: safeList(state.tables?.fishbone, 12),
      };
    }
    if (step === "D5") {
      return {
        corrective_actions: safeList(integrity.correctiveActions, 16).map((item) => ({
          id: item?.id || "",
          root_cause_ids: safeList(item?.rootCauseIds, 8),
          action_type: item?.actionType || "",
          description: item?.description || "",
          action_mechanism: item?.actionMechanism || "",
          dependency_on_human: item?.dependencyOnHuman || "",
          failure_mode_prevented: item?.failureModePrevented || "",
          due_date: item?.dueDate || "",
          acceptance_criteria: item?.acceptanceCriteria || "",
          implementation_date: item?.implementationDate || "",
        })),
      };
    }
    if (step === "D6") {
      return {
        effectiveness_summary: fields.d6 || "",
        verifications: safeList(integrity.verifications, 16).map((item) => ({
          id: item?.id || "",
          action_id: item?.actionId || "",
          verification_method: item?.verificationMethod || "",
          baseline: item?.baseline || "",
          sample_or_window: item?.sampleSize || item?.timeWindow || "",
          acceptance_criteria: item?.acceptanceCriteria || "",
          actual_result: item?.actualResult || "",
          assessment: item?.assessment || "",
          recurrence_found: item?.recurrenceFound || "",
          open_escape: item?.openEscape || "",
          verification_date: item?.verificationDate || "",
        })),
      };
    }
    if (step === "D7") return { prevention_and_system_update: fields.d7 || "" };
    if (step === "D8") return { closure_and_lessons_learned: fields.d8 || "" };
    if (step === "GATE") {
      return {
        external_submission: {
          reviewed: Boolean(state.externalSubmission?.reviewed),
          review_date_present: Boolean(state.externalSubmission?.reviewDate),
          customer_facing_conclusion_approved: Boolean(state.externalSubmission?.customerFacingConclusionApproved),
          open_disclosure_reviewed: Boolean(state.externalSubmission?.openDisclosureReviewed),
        },
      };
    }
    return {
      phase: fields.phase || "",
      source: fields.source || "",
      failure_mode: fields.failureMode || "",
      affected_quantity_or_rate: fields.qty || "",
    };
  }

  function collectContext(includeCaseText) {
    if (typeof syncFromDom === "function") syncFromDom();
    if (typeof ensureV31State === "function") ensureV31State();
    const step = currentStep();
    let risk = {};
    try {
      const calculated = typeof riskCalc === "function" ? riskCalc() : {};
      risk = { score: calculated?.score ?? "", priority: calculated?.p ?? "" };
    } catch {
      risk = {};
    }
    return {
      current_step: step,
      case_overview: {
        phase: state.fields?.phase || "",
        source: state.fields?.source || "",
        failure_mode: state.fields?.failureMode || "",
        affected_quantity_or_rate: state.fields?.qty || "",
      },
      risk,
      gate_summary: gateContext(),
      integrity_summary: structuralIntegrityContext(),
      case_text_included: Boolean(includeCaseText),
      step_context: includeCaseText ? anonymizedStepText(step) : { note: t().noCaseText },
    };
  }

  function responseText(result) {
    return SECTION_KEYS.flatMap((key) => Array.isArray(result?.[key]) ? result[key] : []).join("\n");
  }

  function createUi() {
    const launcher = document.createElement("button");
    launcher.type = "button";
    launcher.className = "eightdAiLauncher";
    launcher.id = "eightdAiLauncher";
    launcher.setAttribute("aria-expanded", "false");
    launcher.setAttribute("aria-controls", "eightdAiPanel");

    const panel = document.createElement("aside");
    panel.className = "eightdAiPanel";
    panel.id = "eightdAiPanel";
    panel.setAttribute("aria-hidden", "true");
    panel.setAttribute("aria-label", "AI Quality Assistant");
    panel.innerHTML = `
      <div class="eightdAiHeader">
        <div class="eightdAiIdentity">
          <span class="eightdAiMark">AI</span>
          <div><div class="eightdAiTitle" id="eightdAiTitle"></div><div class="eightdAiMeta" id="eightdAiMeta"></div></div>
        </div>
        <div class="eightdAiHeaderActions">
          <button class="eightdAiIconButton" id="eightdAiClear" type="button">↻</button>
          <button class="eightdAiIconButton" id="eightdAiClose" type="button">×</button>
        </div>
      </div>
      <div class="eightdAiPrivacy">
        <div id="eightdAiPrivacyText"></div>
        <label><input id="eightdAiIncludeText" type="checkbox"><span id="eightdAiIncludeLabel"></span></label>
      </div>
      <div class="eightdAiQuick">
        <button type="button" data-ai-mode="review_step" id="eightdAiReview"></button>
        <button type="button" data-ai-mode="evidence_gap" id="eightdAiEvidence"></button>
        <button type="button" data-ai-mode="investigation_questions" id="eightdAiQuestions"></button>
      </div>
      <div class="eightdAiMessages" id="eightdAiMessages" aria-live="polite"></div>
      <form class="eightdAiComposer" id="eightdAiForm">
        <div class="eightdAiInputWrap">
          <textarea class="eightdAiInput" id="eightdAiInput" rows="1" maxlength="1400"></textarea>
          <button class="eightdAiSend" id="eightdAiSend" type="submit">↑</button>
        </div>
        <div class="eightdAiComposerNote" id="eightdAiNote"></div>
      </form>
    `;
    document.body.append(launcher, panel);
    bindUi();
    refreshLanguage();
    renderMessages();
  }

  function refreshLanguage() {
    const labels = t();
    const step = currentStep();
    const launcher = document.getElementById("eightdAiLauncher");
    if (launcher) launcher.innerHTML = `<span class="eightdAiSpark">AI</span><span>${escapeHtml(labels.launcher)}</span>`;
    document.getElementById("eightdAiTitle").textContent = labels.title;
    document.getElementById("eightdAiMeta").textContent = `${labels.beta} · ${labels.step}: ${step}`;
    document.getElementById("eightdAiClear").title = labels.clear;
    document.getElementById("eightdAiClear").setAttribute("aria-label", labels.clear);
    document.getElementById("eightdAiClose").title = labels.close;
    document.getElementById("eightdAiClose").setAttribute("aria-label", labels.close);
    document.getElementById("eightdAiPrivacyText").textContent = labels.privacy;
    document.getElementById("eightdAiIncludeLabel").textContent = labels.include;
    document.getElementById("eightdAiReview").textContent = labels.review;
    document.getElementById("eightdAiEvidence").textContent = labels.evidence;
    document.getElementById("eightdAiQuestions").textContent = labels.questions;
    document.getElementById("eightdAiInput").placeholder = labels.placeholder;
    document.getElementById("eightdAiSend").title = labels.send;
    document.getElementById("eightdAiSend").setAttribute("aria-label", labels.send);
    document.getElementById("eightdAiNote").textContent = labels.note;
  }

  function renderResult(result) {
    const labels = t();
    return SECTION_KEYS.map((key) => {
      const items = Array.isArray(result?.[key]) ? result[key].filter(Boolean) : [];
      if (!items.length) return "";
      return `<section class="eightdAiSection"><h4>${escapeHtml(labels.sections[key])}</h4><ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section>`;
    }).join("");
  }

  function renderMessages() {
    const box = document.getElementById("eightdAiMessages");
    if (!box) return;
    if (!messages.length) {
      box.innerHTML = `<div class="eightdAiWelcome"><b>${escapeHtml(t().welcomeTitle)}</b><p>${escapeHtml(t().welcome)}</p></div>`;
      return;
    }
    box.innerHTML = messages.map((message, index) => {
      if (message.pending) {
        return `<div class="eightdAiMessage assistant"><div class="eightdAiBubble"><span class="eightdAiThinking">${escapeHtml(t().thinking)} <span></span><span></span><span></span></span></div></div>`;
      }
      if (message.role === "user") {
        return `<div class="eightdAiMessage user"><div class="eightdAiBubble">${escapeHtml(message.content)}</div></div>`;
      }
      if (message.error) {
        return `<div class="eightdAiMessage assistant error"><div class="eightdAiBubble">${escapeHtml(message.content)}</div></div>`;
      }
      return `<div class="eightdAiMessage assistant"><div class="eightdAiBubble">${renderResult(message.result)}<button type="button" class="eightdAiCopy" data-copy-index="${index}">${escapeHtml(t().copy)}</button></div></div>`;
    }).join("");
    box.scrollTop = box.scrollHeight;
  }

  function resizeInput() {
    const input = document.getElementById("eightdAiInput");
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 100)}px`;
  }

  function historyForRequest() {
    return messages
      .filter((message) => !message.pending && !message.error)
      .slice(-HISTORY_LIMIT)
      .map((message) => ({
        role: message.role,
        content: message.role === "assistant" ? responseText(message.result) : message.content,
      }))
      .filter((message) => message.content);
  }

  async function ask(question, mode = "free_question") {
    const clean = String(question || "").trim();
    if (!clean || waiting) return;
    waiting = true;
    const input = document.getElementById("eightdAiInput");
    const send = document.getElementById("eightdAiSend");
    const includeText = document.getElementById("eightdAiIncludeText").checked;
    const priorHistory = historyForRequest();
    messages.push({ role: "user", content: clean });
    messages.push({ role: "assistant", pending: true });
    input.value = "";
    send.disabled = true;
    renderMessages();

    try {
      const response = await fetch(WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: "eightd_copilot",
          current_tool: "guided_8d_investigation",
          language: language(),
          step: currentStep(),
          mode,
          user_question: clean,
          context: collectContext(includeText),
          conversation_history: priorHistory,
        }),
      });
      const data = await response.json();
      if (!response.ok || data?.success !== true || !data?.result) throw new Error(data?.error_code || "worker_error");
      const result = Object.fromEntries(SECTION_KEYS.map((key) => [key, Array.isArray(data.result[key]) ? data.result[key] : []]));
      messages = messages.filter((message) => !message.pending);
      messages.push({ role: "assistant", result });
    } catch (error) {
      console.error("[EightDAI] request failed", { message: error instanceof Error ? error.message : String(error) });
      messages = messages.filter((message) => !message.pending);
      messages.push({ role: "assistant", error: true, content: t().unavailable });
    } finally {
      waiting = false;
      send.disabled = false;
      renderMessages();
    }
  }

  function quickQuestion(mode) {
    if (mode === "evidence_gap") return t().quickEvidence;
    if (mode === "investigation_questions") return t().quickQuestions;
    return t().quickReview;
  }

  function bindUi() {
    const launcher = document.getElementById("eightdAiLauncher");
    const panel = document.getElementById("eightdAiPanel");
    launcher.addEventListener("click", () => {
      refreshLanguage();
      panel.classList.add("open");
      panel.setAttribute("aria-hidden", "false");
      launcher.setAttribute("aria-expanded", "true");
      document.getElementById("eightdAiInput").focus();
    });
    document.getElementById("eightdAiClose").addEventListener("click", () => {
      panel.classList.remove("open");
      panel.setAttribute("aria-hidden", "true");
      launcher.setAttribute("aria-expanded", "false");
      launcher.focus();
    });
    document.getElementById("eightdAiClear").addEventListener("click", () => {
      messages = [];
      renderMessages();
    });
    document.getElementById("eightdAiForm").addEventListener("submit", (event) => {
      event.preventDefault();
      ask(document.getElementById("eightdAiInput").value);
    });
    document.getElementById("eightdAiInput").addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        document.getElementById("eightdAiForm").requestSubmit();
      }
    });
    document.getElementById("eightdAiInput").addEventListener("input", resizeInput);
    panel.addEventListener("click", async (event) => {
      const quick = event.target.closest("[data-ai-mode]");
      if (quick) {
        ask(quickQuestion(quick.dataset.aiMode), quick.dataset.aiMode);
        return;
      }
      const copy = event.target.closest("[data-copy-index]");
      if (copy) {
        const item = messages[Number(copy.dataset.copyIndex)];
        const text = SECTION_KEYS.flatMap((key) => {
          const values = Array.isArray(item?.result?.[key]) ? item.result[key] : [];
          return values.length ? [`${t().sections[key]}:`, ...values.map((value) => `- ${value}`)] : [];
        }).join("\n");
        await navigator.clipboard.writeText(text);
        copy.textContent = t().copied;
      }
    });
    document.addEventListener("click", (event) => {
      if (event.target.closest(".tab") || event.target.closest("#langBtn")) {
        setTimeout(refreshLanguage, 0);
      }
    });
  }

  createUi();
})();
