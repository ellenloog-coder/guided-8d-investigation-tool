(() => {
  const WORKER_URL = "https://quality-tools-ai-assistant.quality-tools-ai-assistant.workers.dev";
  const HISTORY_LIMIT = 6;
  const SECTION_KEYS = [
    "observed_facts",
    "step_assessment",
    "missing_information",
    "investigation_questions",
    "recommended_checks",
    "required_evidence",
    "retrieval_insights",
    "draft_suggestions",
    "confidence_notes",
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
      welcome: "连接 8D 方法、证据、工程验证、失效案例与质量知识，辅助完成描述、调查、验证和决策。",
      moduleHint: "选择一个 Copilot 模块",
      ragReady: "领域 RAG 已启用",
      reasoningReady: "工程推理规则已启用",
      back: "返回功能首页",
      sources: "检索依据",
      localOnly: "本功能在浏览器本地运行，不会发送案例数据。",
      templatesTitle: "8D 模板库",
      graphTitle: "8D 知识图谱",
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
      modules: {
        knowledge_assistant: { icon: "K", title: "8D 知识助手", desc: "检索方法、步骤目标、证据要求和常见错误。", question: "请解释当前步骤的目标、必需证据、适用工程方法和常见错误。" },
        evidence_intelligence: { icon: "EV", title: "证据智能", desc: "识别缺失、矛盾和需要补充的验证。", question: "请建立当前步骤的必需证据、缺失证据和验证方法映射，并指出证据矛盾。" },
        step_assistant: { icon: "D", title: "步骤助手", desc: "评估完整性、逻辑一致性和下一步调查。", question: "请审查当前步骤的完整性、证据缺口、逻辑一致性、工程考虑和下一步调查。" },
        investigation_questions: { icon: "Q", title: "调查问题生成器", desc: "生成最有区分力的下一轮工程问题。", question: "请生成 Top 5 调查问题，说明每个问题为什么重要以及会产生什么证据。" },
        decision_support: { icon: "G", title: "决策支持", desc: "辅助评估证据强度、风险和进入下一步条件。", question: "请基于当前结构化证据评估完整性、证据强度、逻辑一致性和风险，并给出是否具备进入下一步条件的建议。不得替代 Gate Owner。" },
        case_intelligence: { icon: "C", title: "失效案例智能", desc: "检索相似失效模式、调查方法和行动模式。", question: "请从领域检索库查找与当前结构化信息最相关的相似案例模式，说明相似点、差异、调查方法和可迁移行动。" },
        templates: { icon: "T", title: "8D 模板库", desc: "复制问题、遏制、根因、验证和关闭模板。" },
        knowledge_graph: { icon: "KG", title: "8D 知识图谱", desc: "查看问题、证据、方法、根因和措施关系。" },
      },
      templates: [
        { title: "8D 报告模板", body: "D0 紧急响应：\nD1 团队与职责：\nD2 问题描述：\nD3 临时遏制：\nD4 发生/流出/系统原因及证据：\nD5 永久纠正措施与根因链接：\nD6 实施与有效性验证：\nD7 防再发与横向展开：\nD8 关闭条件、残余风险与批准：" },
        { title: "问题描述模板", body: "对象/产品族（匿名化）：\n失效模式：\n发现地点与环节：\n首次/最近发生时间：\n实际结果 vs 目标：\n影响数量或比率：\n已知范围：\nIs / Is Not 边界：\n当前未知项：" },
        { title: "遏制模板", body: "受影响群体/范围：\n临时措施：\n实施证据：\n检测方法与可靠性：\n误放风险：\n逃逸监控：\n退出标准：\n当前状态：" },
        { title: "根因假设模板", body: "原因类型：发生 / 流出 / 系统\n可证伪假设：\n失效机理：\n验证方法：\n支持该假设的预期结果：\n反驳该假设的预期结果：\n实际结果：\n证据 ID：\n状态：Hypothesis / Supported / Refuted / Confirmed by owner" },
        { title: "验证模板", body: "验证对象：\n基线：\n方法：\n样本或时间窗口：\n代表性/边界条件：\n接受标准：\n实际结果：\n复发状态：\n残余逃逸风险：\n证据 ID：" },
        { title: "纠正措施模板", body: "链接的根因 ID：\n措施描述：\n作用机理：\n防止的失效模式：\n控制强度：\n责任人：\n截止日期：\n接受标准：\n实施证据：\n有效性验证计划：" },
        { title: "关闭模板", body: "问题—证据—根因—措施—验证链完整性：\n未关闭例外：\n残余风险：\n防再发更新：\n横向展开范围：\n经验教训：\nGate 状态：\nGate Owner 评审与日期：" },
      ],
      sections: {
        observed_facts: "已知事实",
        step_assessment: "步骤评估",
        missing_information: "缺失信息",
        investigation_questions: "调查问题",
        recommended_checks: "建议检查",
        required_evidence: "所需证据",
        retrieval_insights: "检索洞察",
        draft_suggestions: "措辞建议",
        confidence_notes: "置信度",
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
      welcome: "Connect 8D methods, evidence, engineering verification, failure patterns, and quality knowledge to support description, investigation, verification, and decision.",
      moduleHint: "Choose a Copilot module",
      ragReady: "Domain RAG enabled",
      reasoningReady: "Engineering reasoning rules enabled",
      back: "Back to module home",
      sources: "Retrieved sources",
      localOnly: "This feature runs locally in the browser and does not send case data.",
      templatesTitle: "8D Template Library",
      graphTitle: "8D Knowledge Graph",
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
      modules: {
        knowledge_assistant: { icon: "K", title: "8D Knowledge Assistant", desc: "Retrieve methods, step goals, evidence needs, and common mistakes.", question: "Explain the current step goal, required evidence, suitable engineering methods, and common mistakes." },
        evidence_intelligence: { icon: "EV", title: "Evidence Intelligence", desc: "Find missing, conflicting, and insufficient verification evidence.", question: "Map required evidence, missing evidence, and verification methods for the current step, including contradictions." },
        step_assistant: { icon: "D", title: "8D Step Assistant", desc: "Assess completeness, logical consistency, and the next investigation.", question: "Review current-step completeness, evidence gaps, logical consistency, engineering considerations, and the next investigation." },
        investigation_questions: { icon: "Q", title: "Question Generator", desc: "Generate the most discriminating next engineering questions.", question: "Generate the Top 5 investigation questions, why each matters, and what evidence each should produce." },
        decision_support: { icon: "G", title: "Decision Support", desc: "Assess evidence strength, risk, and conditions to proceed.", question: "Assess completeness, evidence strength, logical consistency, and risk, then provide an advisory recommendation about proceeding. Do not replace the Gate Owner." },
        case_intelligence: { icon: "C", title: "Failure Case Intelligence", desc: "Retrieve similar failure patterns, methods, and action patterns.", question: "Retrieve the most relevant generalized case patterns and state similarities, differences, investigation methods, and transferable actions." },
        templates: { icon: "T", title: "8D Template Library", desc: "Copy problem, containment, cause, verification, and closure templates." },
        knowledge_graph: { icon: "KG", title: "8D Knowledge Graph", desc: "View relationships among problems, evidence, methods, causes, and actions." },
      },
      templates: [
        { title: "8D Report Template", body: "D0 Emergency response:\nD1 Team and responsibilities:\nD2 Problem description:\nD3 Interim containment:\nD4 Occurrence / escape / system causes and evidence:\nD5 Permanent corrective actions and cause links:\nD6 Implementation and effectiveness verification:\nD7 Prevention and horizontal deployment:\nD8 Closure criteria, residual risk, and approval:" },
        { title: "Problem Description Template", body: "Object / product family (anonymized):\nFailure mode:\nDetection location and process point:\nFirst / latest occurrence:\nActual result vs target:\nAffected quantity or rate:\nKnown scope:\nIs / Is Not boundary:\nCurrent unknowns:" },
        { title: "Containment Template", body: "Affected population / scope:\nInterim action:\nImplementation evidence:\nDetection method and reliability:\nFalse-accept risk:\nEscape monitoring:\nExit criteria:\nCurrent status:" },
        { title: "Root-cause Hypothesis Template", body: "Cause type: Occurrence / Escape / System\nFalsifiable hypothesis:\nFailure mechanism:\nValidation method:\nExpected supporting result:\nExpected refuting result:\nActual result:\nEvidence ID:\nStatus: Hypothesis / Supported / Refuted / Confirmed by owner" },
        { title: "Verification Template", body: "Verification target:\nBaseline:\nMethod:\nSample or time window:\nRepresentativeness / boundary conditions:\nAcceptance criteria:\nActual result:\nRecurrence status:\nResidual escape risk:\nEvidence ID:" },
        { title: "Corrective Action Template", body: "Linked root-cause ID:\nAction description:\nAction mechanism:\nFailure mode prevented:\nControl strength:\nOwner:\nDue date:\nAcceptance criteria:\nImplementation evidence:\nEffectiveness-verification plan:" },
        { title: "Closure Template", body: "Problem—evidence—cause—action—verification traceability:\nOpen exceptions:\nResidual risk:\nPrevention updates:\nHorizontal-deployment scope:\nLessons learned:\nGate status:\nGate Owner review and date:" },
      ],
      sections: {
        observed_facts: "Observed facts",
        step_assessment: "Step assessment",
        missing_information: "Missing information",
        investigation_questions: "Investigation questions",
        recommended_checks: "Recommended checks",
        required_evidence: "Required evidence",
        retrieval_insights: "Retrieval insights",
        draft_suggestions: "Draft suggestions",
        confidence_notes: "Confidence",
        limitations: "Limitations and human review",
      },
    },
  };

  let messages = [];
  let waiting = false;
  let localView = "home";

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
    document.getElementById("eightdAiInput").placeholder = labels.placeholder;
    document.getElementById("eightdAiSend").title = labels.send;
    document.getElementById("eightdAiSend").setAttribute("aria-label", labels.send);
    document.getElementById("eightdAiNote").textContent = labels.note;
    document.getElementById("eightdAiPanel").setAttribute("aria-label", labels.title);
    if (!waiting && !messages.length) renderMessages();
  }

  function renderResult(result) {
    const labels = t();
    return SECTION_KEYS.map((key) => {
      const items = Array.isArray(result?.[key]) ? result[key].filter(Boolean) : [];
      if (!items.length) return "";
      return `<section class="eightdAiSection"><h4>${escapeHtml(labels.sections[key])}</h4><ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section>`;
    }).join("");
  }

  function renderModuleHome() {
    const labels = t();
    return `
      <div class="eightdAiWelcome">
        <div class="eightdAiStatusRow">
          <span>${escapeHtml(labels.ragReady)}</span>
          <span>${escapeHtml(labels.reasoningReady)}</span>
        </div>
        <b>${escapeHtml(labels.welcomeTitle)}</b>
        <p>${escapeHtml(labels.welcome)}</p>
        <strong class="eightdAiModuleHint">${escapeHtml(labels.moduleHint)}</strong>
      </div>
      <div class="eightdAiModuleGrid">
        ${Object.entries(labels.modules).map(([key, module]) => `
          <button class="eightdAiModuleCard" type="button" data-ai-module="${escapeHtml(key)}">
            <span class="eightdAiModuleIcon">${escapeHtml(module.icon)}</span>
            <span><strong>${escapeHtml(module.title)}</strong><small>${escapeHtml(module.desc)}</small></span>
          </button>
        `).join("")}
      </div>
    `;
  }

  function renderTemplates() {
    const labels = t();
    return `
      <div class="eightdAiLocalHeader">
        <button type="button" data-ai-back>← ${escapeHtml(labels.back)}</button>
        <h4>${escapeHtml(labels.templatesTitle)}</h4>
        <p>${escapeHtml(labels.localOnly)}</p>
      </div>
      <div class="eightdAiTemplateGrid">
        ${labels.templates.map((template, index) => `
          <article class="eightdAiTemplateCard">
            <strong>${escapeHtml(template.title)}</strong>
            <pre>${escapeHtml(template.body)}</pre>
            <button type="button" data-template-index="${index}">${escapeHtml(labels.copy)}</button>
          </article>
        `).join("")}
      </div>
    `;
  }

  function renderKnowledgeGraph() {
    const labels = t();
    const relations = language() === "zh"
      ? [
          ["问题", "需要", "证据"],
          ["证据", "通过方法验证", "工程方法"],
          ["工程方法", "检验", "原因假设"],
          ["证据", "支持 / 反驳", "根因"],
          ["根因", "由其解决", "纠正措施"],
          ["纠正措施", "通过其验证", "有效性验证"],
          ["已验证措施", "固化为", "防再发措施"],
          ["失效案例", "关联", "失效模式 · 过程 · 应力"],
        ]
      : [
          ["Problem", "requires", "Evidence"],
          ["Evidence", "verified by", "Method"],
          ["Method", "tests", "Hypothesis"],
          ["Evidence", "supports / refutes", "Root Cause"],
          ["Root Cause", "resolved by", "Corrective Action"],
          ["Corrective Action", "verified by", "Verification"],
          ["Verified Action", "institutionalized as", "Preventive Action"],
          ["Failure Case", "links", "Failure Mode · Process · Stress"],
        ];
    return `
      <div class="eightdAiLocalHeader">
        <button type="button" data-ai-back>← ${escapeHtml(labels.back)}</button>
        <h4>${escapeHtml(labels.graphTitle)}</h4>
        <p>${escapeHtml(labels.localOnly)}</p>
      </div>
      <div class="eightdAiGraph">
        ${relations.map(([from, relation, to]) => `
          <div class="eightdAiGraphRow">
            <span>${escapeHtml(from)}</span>
            <small>${escapeHtml(relation)} →</small>
            <span>${escapeHtml(to)}</span>
          </div>
        `).join("")}
      </div>
    `;
  }

  function renderRetrieval(retrieval) {
    const items = Array.isArray(retrieval?.items) ? retrieval.items : [];
    if (!items.length) return "";
    return `
      <div class="eightdAiSources">
        <strong>${escapeHtml(t().sources)}</strong>
        <div>${items.map((item) => `<span title="${escapeHtml(item.kind || "")}">${escapeHtml(item.id)} · ${escapeHtml(item.title)}</span>`).join("")}</div>
      </div>
    `;
  }

  function renderMessages() {
    const box = document.getElementById("eightdAiMessages");
    if (!box) return;
    if (!messages.length) {
      box.innerHTML = localView === "templates"
        ? renderTemplates()
        : localView === "knowledge_graph"
          ? renderKnowledgeGraph()
          : renderModuleHome();
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
      return `<div class="eightdAiMessage assistant"><div class="eightdAiBubble">${renderResult(message.result)}${renderRetrieval(message.retrieval)}<button type="button" class="eightdAiCopy" data-copy-index="${index}">${escapeHtml(t().copy)}</button></div></div>`;
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
    localView = "home";
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
      messages.push({ role: "assistant", result, retrieval: data.retrieval || null, mode });
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
    return t().modules[mode]?.question || t().quickReview;
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
      localView = "home";
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
      const module = event.target.closest("[data-ai-module]");
      if (module) {
        const mode = module.dataset.aiModule;
        if (mode === "templates" || mode === "knowledge_graph") {
          localView = mode;
          renderMessages();
        } else {
          ask(quickQuestion(mode), mode);
        }
        return;
      }
      if (event.target.closest("[data-ai-back]")) {
        localView = "home";
        renderMessages();
        return;
      }
      const templateButton = event.target.closest("[data-template-index]");
      if (templateButton) {
        const template = t().templates[Number(templateButton.dataset.templateIndex)];
        if (template) {
          await navigator.clipboard.writeText(`${template.title}\n\n${template.body}`);
          templateButton.textContent = t().copied;
        }
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
