import Head from "next/head";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  ChevronDown,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileText,
  Loader2,
  MessageSquareText,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

type DisciplineId = "D0" | "D1" | "D2" | "D3" | "D4" | "D5" | "D6" | "D7" | "D8";

type FiveWTwoHKey = "who" | "what" | "where" | "when" | "why" | "how" | "howMany";

type FiveWTwoHState = Record<FiveWTwoHKey, string>;

type ReportState = {
  problemSummary: string;
  fiveWTwoH: FiveWTwoHState;
  lastSavedAt?: string;
};

type ExtractionResult = {
  problemSummary: string;
  fiveWTwoH: FiveWTwoHState;
};

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

type WhyNode = {
  id: number;
  label: string;
  answer: string;
  completed: boolean;
};

type Discipline = {
  id: DisciplineId;
  title: string;
  description: string;
};

type FieldMeta = {
  key: FiveWTwoHKey;
  label: string;
  helper: string;
  placeholder: string;
};

const STORAGE_KEY = "iatf-8d-local-report-v1";

const initialWhyNodes: WhyNode[] = [
  { id: 1, label: "1st Why", answer: "", completed: false },
  { id: 2, label: "2nd Why", answer: "", completed: false },
  { id: 3, label: "3rd Why", answer: "", completed: false },
  { id: 4, label: "4th Why", answer: "", completed: false },
  { id: 5, label: "Root Cause", answer: "", completed: false },
];

const disciplines: Discipline[] = [
  { id: "D0", title: "准备与应急响应", description: "识别问题来源，确认是否需要启动 8D。" },
  { id: "D1", title: "建立团队", description: "明确跨职能团队、职责和问题所有者。" },
  { id: "D2", title: "问题描述", description: "用事实和 5W2H 定义问题边界。" },
  { id: "D3", title: "临时遏制措施", description: "保护客户和生产现场，阻断风险外溢。" },
  { id: "D4", title: "根因分析", description: "定位发生原因与流出原因。" },
  { id: "D5", title: "永久纠正措施", description: "选择并验证可消除根因的措施。" },
  { id: "D6", title: "实施与验证", description: "执行措施并确认效果稳定。" },
  { id: "D7", title: "预防再发", description: "更新标准、FMEA、控制计划和经验库。" },
  { id: "D8", title: "团队表彰与关闭", description: "复盘、归档并正式关闭 8D。" },
];

const fiveWTwoHFields: FieldMeta[] = [
  {
    key: "who",
    label: "Who",
    helper: "涉及人员 / 客户 / 工序",
    placeholder: "例如：总装线 A 班、客户 SQE、终检人员",
  },
  {
    key: "what",
    label: "What",
    helper: "失效现象 / 不符合项",
    placeholder: "例如：右后门密封条翘曲，装配后存在间隙",
  },
  {
    key: "where",
    label: "Where",
    helper: "发生地点 / 工位 / 批次",
    placeholder: "例如：FA-03 工位，2026-W24 批次",
  },
  {
    key: "when",
    label: "When",
    helper: "发现时间 / 发生时间",
    placeholder: "例如：2026-06-16 09:30 客户进料检验发现",
  },
  {
    key: "why",
    label: "Why",
    helper: "初步业务影响 / 启动原因",
    placeholder: "例如：存在客户停线风险，需启动 8D 闭环",
  },
  {
    key: "how",
    label: "How",
    helper: "发现方式 / 检出路径",
    placeholder: "例如：客户抽检使用塞尺验证间隙超规格",
  },
  {
    key: "howMany",
    label: "How many",
    helper: "数量 / 比例 / 范围",
    placeholder: "例如：抽检 80 件，不良 6 件，不良率 7.5%",
  },
];

const emptyReport: ReportState = {
  problemSummary: "",
  fiveWTwoH: {
    who: "",
    what: "",
    where: "",
    when: "",
    why: "",
    how: "",
    howMany: "",
  },
};

function isFiveWTwoHState(value: unknown): value is FiveWTwoHState {
  if (!value || typeof value !== "object") {
    return false;
  }

  return fiveWTwoHFields.every(({ key }) => typeof (value as Record<string, unknown>)[key] === "string");
}

function pickMatchedText(text: string, patterns: RegExp[], fallback: string) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    const candidate = match?.[1] ?? match?.[0];
    if (candidate?.trim()) {
      return candidate.trim().replace(/[，。；;]$/, "");
    }
  }

  return fallback;
}

function summarizeAnswer(text: string) {
  const normalized = text.trim().replace(/\s+/g, " ");
  if (normalized.length <= 28) {
    return normalized;
  }

  return `${normalized.slice(0, 28)}...`;
}

function getPrimaryProblem(report: ReportState) {
  return (
    report.fiveWTwoH.what.trim() ||
    report.problemSummary.split(/[；;，,\n]/).find((item) => item.trim())?.trim() ||
    "当前质量缺陷"
  );
}

function getRcaHint(problem: string) {
  if (/变形|翘曲|弯曲|缩水|塌陷|鼓包/.test(problem)) {
    return "通常与材料批次、注塑/成型参数、冷却定型、堆叠受压、包装运输或存储环境有关";
  }

  if (/划痕|划伤|擦伤|刮伤|压痕/.test(problem)) {
    return "通常与模具脱模、夹具接触、搬运防护、周转器具或员工操作有关";
  }

  if (/尺寸|间隙|偏差|超差|公差|装配不到位/.test(problem)) {
    return "通常与工装定位、设备参数、量具方法、零件批次或装配基准有关";
  }

  if (/脏污|油污|异物|污染|色差|发白/.test(problem)) {
    return "通常与现场清洁、材料污染、人员接触、设备泄漏或包装防护有关";
  }

  if (/失效|不工作|断裂|开裂|松动|脱落/.test(problem)) {
    return "通常与设计裕量、过程参数、装配力矩、材料强度或验证覆盖有关";
  }

  return "请从人、机、料、法、环、测以及物流包装几个方向排查";
}

function createInitialRcaMessage(report: ReportState): ChatMessage {
  const problem = getPrimaryProblem(report);

  return {
    id: `assistant-initial-${problem}`,
    role: "assistant",
    text: `我是你的 RCA 质量侦探。根据 D2 描述，我们发现了[${problem}]。请问：为什么会发生这个质量缺陷？（提示：${getRcaHint(problem)}）`,
  };
}

function createFollowUpQuestion(answer: string, nextNodeIndex: number, problem: string) {
  if (nextNodeIndex < 0) {
    return `我已记录补充信息。当前缺陷是[${problem}]，建议把这些原因假设转化为验证项，并关联现场证据。`;
  }

  if (nextNodeIndex >= initialWhyNodes.length - 1) {
    return `已记录 Root Cause 候选。请用证据验证它是否能解释[${problem}]，并确认发生根因和流出根因是否都已覆盖。`;
  }

  const nextLabel = initialWhyNodes[nextNodeIndex + 1]?.label ?? "下一层 Why";
  return `已记录 ${initialWhyNodes[nextNodeIndex].label}。继续进入 ${nextLabel}：为什么“${summarizeAnswer(
    answer,
  )}”会导致[${problem}]？请尽量回答可验证的过程事实。`;
}

function simulateAIExtraction(text: string): ExtractionResult {
  const source = text.trim();
  const normalized = source || "客户反馈质量异常，需要启动 8D。";
  const compactSource = normalized.replace(/\s+/g, " ");
  const firstClause = compactSource.split(/[，,。；;\n]/).find((item) => item.trim())?.trim() || compactSource;

  const who = pickMatchedText(
    normalized,
    [/(?:客户|customer|from|发件人)[:：\s]*([A-Za-z0-9\u4e00-\u9fa5公司厂部门\s-]{2,32})/i],
    /客户|退货|客诉/.test(normalized) ? "客户 / 客户质量窗口" : "待确认责任窗口",
  );
  const what = pickMatchedText(
    normalized,
    [
      /([^，。；;\n]*(?:变形|划痕|划伤|擦伤|尺寸超差|开裂|断裂|脏污|异物|松动|脱落|漏装|错装|不工作|失效)[^，。；;\n]*)/,
      /(?:缺陷|问题|不合格|NC)[:：\s]*([^，。；;\n]{4,60})/i,
    ],
    firstClause || "客户反馈质量异常，具体缺陷待确认",
  );
  const where = pickMatchedText(
    normalized,
    [
      /(?:地点|工位|产线|where)[:：\s]*([^，。；;\n]{2,48})/i,
      /(注塑车间|总装线|终检区|客户来料检验区|外观检验区|客户现场|仓库|包装区)[^，。；;\n]*/,
    ],
    /退货|客诉|客户/.test(normalized) ? "客户现场 / 退货反馈环节" : "待确认发生地点与发现地点",
  );
  const when = pickMatchedText(
    normalized,
    [
      /(\d{4}[-/年]\d{1,2}[-/月]\d{1,2}[日号]?\s*\d{0,2}:?\d{0,2})/,
      /(?:时间|日期|when)[:：\s]*([^，。；;\n]{4,36})/i,
    ],
    new Date().toISOString().slice(0, 10),
  );
  const why = pickMatchedText(
    normalized,
    [/(?:要求|原因|why)[:：\s]*([^，。；;\n]{4,60})/i, /(退货率\s*\d+(?:\.\d+)?%|停线|索赔|批量风险|客户抱怨|影响交付)[^，。；;\n]*/],
    /退货率\s*\d+(?:\.\d+)?%/.test(normalized)
      ? normalized.match(/退货率\s*\d+(?:\.\d+)?%/)?.[0] ?? "客户退货触发 8D"
      : "客户反馈触发 8D，需确认影响范围与风险等级",
  );
  const how = pickMatchedText(
    normalized,
    [/(?:发现|检出|how)[:：\s]*([^，。；;\n]{4,60})/i, /(外观检验|抽检|来料检验|终检)[^，。；;\n]*/],
    /退货|退货率/.test(normalized) ? "客户退货反馈发现" : "客户反馈 / 检验发现，发现方式待补充",
  );
  const howMany = pickMatchedText(
    normalized,
    [
      /(退货率\s*\d+(?:\.\d+)?%)/,
      /(\d+\s*(?:件|pcs|PCS|台|批)[^，。；;\n]{0,28})/,
      /(?:数量|比例|how many)[:：\s]*([^，。；;\n]{1,36})/i,
    ],
    "待确认影响数量/比例，需核查退货、库存、在制品与发运批次",
  );

  return {
    problemSummary: `${what}；发现地点：${where}；当前影响：${why}`,
    fiveWTwoH: {
      who,
      what,
      where,
      when,
      why,
      how,
      howMany,
    },
  };
}

function readStoredReport(): ReportState {
  if (typeof window === "undefined") {
    return emptyReport;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return emptyReport;
    }

    const parsed = JSON.parse(raw) as Partial<ReportState>;
    return {
      problemSummary: typeof parsed.problemSummary === "string" ? parsed.problemSummary : "",
      fiveWTwoH: isFiveWTwoHState(parsed.fiveWTwoH) ? parsed.fiveWTwoH : emptyReport.fiveWTwoH,
      lastSavedAt: typeof parsed.lastSavedAt === "string" ? parsed.lastSavedAt : undefined,
    };
  } catch {
    return emptyReport;
  }
}

export default function HomePage() {
  const [report, setReport] = useState<ReportState>(emptyReport);
  const [activeDiscipline, setActiveDiscipline] = useState<DisciplineId>("D0");
  const [hasHydrated, setHasHydrated] = useState(false);
  const [saveNotice, setSaveNotice] = useState("本地自动同步已启用");
  const [isExtractorOpen, setIsExtractorOpen] = useState(true);
  const [complaintText, setComplaintText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [highlightedFields, setHighlightedFields] = useState<FiveWTwoHKey[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([createInitialRcaMessage(emptyReport)]);
  const [chatInput, setChatInput] = useState("");
  const [whyNodes, setWhyNodes] = useState<WhyNode[]>(initialWhyNodes);
  const sectionRefs = useRef<Record<DisciplineId, HTMLElement | null>>({
    D0: null,
    D1: null,
    D2: null,
    D3: null,
    D4: null,
    D5: null,
    D6: null,
    D7: null,
    D8: null,
  });

  useEffect(() => {
    setReport(readStoredReport());
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    const nextReport: ReportState = {
      ...report,
      lastSavedAt: new Date().toISOString(),
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextReport));
    setSaveNotice("所有 5W2H 输入已实时同步到浏览器本地");
  }, [hasHydrated, report.problemSummary, report.fiveWTwoH]);

  useEffect(() => {
    setChatMessages((current) => {
      const hasUserMessage = current.some((message) => message.role === "user");
      if (hasUserMessage) {
        return current;
      }

      return [createInitialRcaMessage(report)];
    });
  }, [report.problemSummary, report.fiveWTwoH.what]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        const nextId = visibleEntries[0]?.target.getAttribute("data-discipline") as DisciplineId | null;
        if (nextId) {
          setActiveDiscipline(nextId);
        }
      },
      {
        root: null,
        rootMargin: "-20% 0px -55% 0px",
        threshold: [0.12, 0.24, 0.36, 0.5],
      },
    );

    disciplines.forEach(({ id }) => {
      const section = sectionRefs.current[id];
      if (section) {
        observer.observe(section);
      }
    });

    return () => observer.disconnect();
  }, []);

  const completionCount = useMemo(() => {
    const filledFields = fiveWTwoHFields.filter(({ key }) => report.fiveWTwoH[key].trim()).length;
    return filledFields + (report.problemSummary.trim() ? 1 : 0);
  }, [report]);

  const completionPercent = Math.round((completionCount / 8) * 100);

  const setSectionRef = useCallback(
    (id: DisciplineId) => (element: HTMLElement | null) => {
      sectionRefs.current[id] = element;
    },
    [],
  );

  const updateFiveWTwoH = (key: FiveWTwoHKey, value: string) => {
    setReport((current) => ({
      ...current,
      fiveWTwoH: {
        ...current.fiveWTwoH,
        [key]: value,
      },
    }));
  };

  const handleExtraction = () => {
    if (isExtracting) {
      return;
    }

    setIsExtracting(true);
    setSaveNotice("AI 正在结构化解析客诉文本...");

    window.setTimeout(() => {
      const extracted = simulateAIExtraction(complaintText);
      const filledKeys = fiveWTwoHFields.map(({ key }) => key);

      setReport((current) => ({
        ...current,
        problemSummary: extracted.problemSummary,
        fiveWTwoH: extracted.fiveWTwoH,
      }));
      setHighlightedFields(filledKeys);
      setWhyNodes(initialWhyNodes);
      setChatInput("");
      setChatMessages([createInitialRcaMessage(extracted)]);
      setIsExtracting(false);
      setSaveNotice("AI 已完成解析，5W2H 已自动填入并本地同步");

      window.setTimeout(() => setHighlightedFields([]), 2600);
    }, 1500);
  };

  const handleSendWhyAnswer = () => {
    const answer = chatInput.trim();
    if (!answer) {
      return;
    }

    const nextNodeIndex = whyNodes.findIndex((node) => !node.completed);
    const problem = getPrimaryProblem(report);
    const nextQuestion = createFollowUpQuestion(answer, nextNodeIndex, problem);

    setChatMessages((current) => [
      ...current,
      { id: `user-${Date.now()}-${current.length}`, role: "user", text: answer },
      { id: `assistant-${Date.now()}-${current.length + 1}`, role: "assistant", text: nextQuestion },
    ]);
    setWhyNodes((current) =>
      current.map((node, index) =>
        index === nextNodeIndex
          ? {
              ...node,
              completed: true,
              answer: summarizeAnswer(answer),
            }
          : node,
      ),
    );
    setChatInput("");
  };

  const handleManualSave = () => {
    const nextReport: ReportState = {
      ...report,
      lastSavedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextReport));
    setReport(nextReport);
    setSaveNotice("已暂存到 localStorage，刷新页面不会丢失");
  };

  const handleExportJson = () => {
    const exportPayload = {
      schema: "IATF-16949-8D-local-report",
      version: "1.0.0",
      exportedAt: new Date().toISOString(),
      dataResidence: "browser-local-only",
      report,
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `8d-report-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const scrollToDiscipline = (id: DisciplineId) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <Head>
        <title>智能 8D 报告单机版生成器</title>
        <meta
          name="description"
          content="面向制造企业质量工程师的本地化 8D 报告生成器，数据仅存储在浏览器 localStorage。"
        />
      </Head>

      <main className="min-h-screen bg-slate-100 text-slate-700">
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-teal-600 text-white shadow-sm shadow-teal-900/20">
                <ShieldCheck className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
                  IATF 16949 Local Quality Tool
                </p>
                <h1 className="mt-1 text-2xl font-semibold tracking-normal text-slate-700">
                  智能 8D 报告单机版生成器
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                {saveNotice}
              </div>
              <button
                type="button"
                onClick={handleManualSave}
                className="inline-flex items-center gap-2 rounded-md bg-slate-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
              >
                <Save className="h-4 w-4" aria-hidden="true" />
                暂存本地
              </button>
              <button
                type="button"
                onClick={handleExportJson}
                className="inline-flex items-center gap-2 rounded-md bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                导出 8D 数据包 (JSON)
              </button>
            </div>
          </div>
        </header>

        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-6 py-5">
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <button
                type="button"
                onClick={() => setIsExtractorOpen((current) => !current)}
                className="flex w-full items-center justify-between gap-4 bg-slate-50 px-5 py-4 text-left transition hover:bg-slate-100"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-teal-600 text-white">
                    <Sparkles className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-base font-semibold text-slate-700">智能客诉解析</span>
                    <span className="mt-1 block text-sm text-slate-500">
                      粘贴 NC Email 或客户不合格通告，前端模拟 AI 自动提取 5W2H。
                    </span>
                  </span>
                </span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-slate-500 transition ${isExtractorOpen ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </button>

              <div
                className={`grid transition-all duration-300 ease-out ${
                  isExtractorOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="grid gap-5 border-t border-slate-200 p-5 xl:grid-cols-[1.3fr_0.7fr]">
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700">原始客诉邮件 / NC Email</span>
                      <textarea
                        value={complaintText}
                        onChange={(event) => setComplaintText(event.target.value)}
                        rows={8}
                        placeholder="示例：客户 SQE 通知，2026-06-16 反馈电线盒盖子变形，退货率 50%，要求供应商 24 小时内提交 8D..."
                        className="mt-2 w-full resize-y rounded-md border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                      />
                    </label>

                    <div className="flex flex-col justify-between rounded-md border border-slate-200 bg-slate-50 p-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-700">本地模拟解析规则</p>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          不访问云端接口，不上传企业数据。解析逻辑在浏览器前端完成，点击后等待 1.5 秒模拟大模型推理过程。
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleExtraction}
                        disabled={isExtracting}
                        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {isExtracting ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <Sparkles className="h-4 w-4" aria-hidden="true" />
                        )}
                        {isExtracting ? "AI 解析中..." : "AI 结构化解析"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-6 lg:grid-cols-[minmax(260px,1fr)_minmax(0,2fr)]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-700">8D 导航进度</h2>
                  <p className="mt-1 text-sm text-slate-500">当前阶段：{activeDiscipline}</p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-teal-100 bg-teal-50 text-sm font-bold text-teal-700">
                  {completionPercent}%
                </div>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full bg-teal-600 transition-all" style={{ width: `${completionPercent}%` }} />
              </div>

              <nav className="mt-6 space-y-2" aria-label="8D Disciplines">
                {disciplines.map((discipline) => {
                  const isActive = discipline.id === activeDiscipline;

                  return (
                    <button
                      key={discipline.id}
                      type="button"
                      onClick={() => scrollToDiscipline(discipline.id)}
                      className={`group w-full rounded-md border px-4 py-3 text-left transition ${
                        isActive
                          ? "border-teal-500 bg-teal-50 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sm font-bold ${
                            isActive ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {discipline.id}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-slate-700">{discipline.title}</span>
                          <span className="mt-0.5 block text-xs leading-5 text-slate-500">{discipline.description}</span>
                        </span>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          <section className="space-y-6">
            <article
              ref={setSectionRef("D0")}
              data-discipline="D0"
              className="scroll-mt-28 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
            >
              <SectionHeader
                icon={<ClipboardCheck className="h-5 w-5" aria-hidden="true" />}
                id="D0-D2"
                title="问题启动、团队与事实描述"
                subtitle="用结构化事实约束问题边界，为后续根因分析提供可审计输入。"
              />

              <div className="mt-6">
                <label htmlFor="problemSummary" className="text-sm font-semibold text-slate-700">
                  问题简述
                </label>
                <textarea
                  id="problemSummary"
                  value={report.problemSummary}
                  onChange={(event) =>
                    setReport((current) => ({
                      ...current,
                      problemSummary: event.target.value,
                    }))
                  }
                  rows={5}
                  placeholder="请用客观事实描述问题：产品、零件号、规格偏差、发现地点、客户影响、当前状态。"
                  className="mt-2 w-full resize-y rounded-md border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                />
              </div>
            </article>

            <article
              ref={setSectionRef("D1")}
              data-discipline="D1"
              className="scroll-mt-28 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
            >
              <SectionHeader
                icon={<CheckCircle2 className="h-5 w-5" aria-hidden="true" />}
                id="D1"
                title="跨职能团队"
                subtitle="建议覆盖质量、制造、工艺、供应链、售后与客户接口。"
              />
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {["质量负责人", "制造负责人", "客户接口"].map((role) => (
                  <div key={role} className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Role</p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">{role}</p>
                  </div>
                ))}
              </div>
            </article>

            <article
              ref={setSectionRef("D2")}
              data-discipline="D2"
              className="scroll-mt-28 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
            >
              <SectionHeader
                icon={<FileText className="h-5 w-5" aria-hidden="true" />}
                id="D2"
                title="5W2H 快捷结构化填报"
                subtitle="所有字段实时同步到 localStorage，保证刷新后仍可恢复。"
              />

              <div className="mt-6 grid gap-4 xl:grid-cols-2">
                {fiveWTwoHFields.map((field) => {
                  const isHighlighted = highlightedFields.includes(field.key);

                  return (
                    <label
                      key={field.key}
                      className={`block rounded-md border p-4 transition-all duration-500 ${
                        isHighlighted
                          ? "animate-pulse border-teal-500 bg-teal-50 shadow-sm shadow-teal-900/10"
                          : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span>
                          <span className="block text-sm font-bold text-slate-700">{field.label}</span>
                          <span className="mt-0.5 block text-xs text-slate-500">{field.helper}</span>
                        </span>
                        {report.fiveWTwoH[field.key].trim() ? (
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-teal-600" aria-hidden="true" />
                        ) : null}
                      </span>
                      <textarea
                        value={report.fiveWTwoH[field.key]}
                        onChange={(event) => updateFiveWTwoH(field.key, event.target.value)}
                        rows={3}
                        placeholder={field.placeholder}
                        className="mt-3 w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                      />
                    </label>
                  );
                })}
              </div>
            </article>

            <article
              ref={setSectionRef("D3")}
              data-discipline="D3"
              className="scroll-mt-28 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
            >
              <SectionHeader
                icon={<ShieldCheck className="h-5 w-5" aria-hidden="true" />}
                id="D3"
                title="临时遏制措施"
                subtitle="占位模块：后续可扩展库存隔离、客户通知、加严检验与有效性确认。"
              />
              <PlaceholderBand text="Containment action workspace" />
            </article>

            <article
              ref={setSectionRef("D4")}
              data-discipline="D4"
              className="scroll-mt-28 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
            >
              <SectionHeader
                icon={<Bot className="h-5 w-5" aria-hidden="true" />}
                id="D4"
                title="AI 根因分析对话框"
                subtitle="单机 UI 占位：可用于本地规则、离线模型或人工推理的交互入口。"
              />

              <div className="mt-6 grid overflow-hidden rounded-lg border border-slate-200 bg-white lg:grid-cols-[280px_1fr]">
                <aside className="border-b border-slate-200 bg-slate-50 p-5 lg:border-b-0 lg:border-r">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-700 text-white">
                      <Bot className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">5-Why 逻辑链条</p>
                      <p className="text-xs text-slate-500">逐层追问直到根因</p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-0">
                    {whyNodes.map((node, index) => (
                      <div key={node.id} className="relative pb-5 last:pb-0">
                        {index < whyNodes.length - 1 ? (
                          <div
                            className={`absolute left-4 top-9 h-[calc(100%-2.25rem)] w-px ${
                              node.completed ? "bg-teal-400" : "bg-slate-300"
                            }`}
                          />
                        ) : null}
                        <div className="relative flex gap-3">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition ${
                              node.completed
                                ? "border-teal-600 bg-teal-600 text-white"
                                : "border-slate-300 bg-white text-slate-400"
                            }`}
                          >
                            {node.id}
                          </div>
                          <div className="min-w-0">
                            <p className={`text-sm font-semibold ${node.completed ? "text-teal-700" : "text-slate-500"}`}>
                              {node.label}
                            </p>
                            <p className="mt-1 min-h-[2rem] rounded-md bg-white px-3 py-2 text-xs leading-5 text-slate-500">
                              {node.answer || "等待用户回答"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </aside>

                <div className="flex min-h-[520px] flex-col bg-slate-950">
                  <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-teal-600 text-white">
                        <MessageSquareText className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">RCA 质量侦探</p>
                        <p className="text-xs text-slate-400">Guided 5-Why Agent</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-300">
                      前端模拟
                    </span>
                  </div>

                  <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
                    {chatMessages.map((message) => (
                      <ChatBubble key={message.id} role={message.role} text={message.text} />
                    ))}
                  </div>

                  <div className="border-t border-slate-800 bg-slate-900 p-4">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(event) => setChatInput(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            handleSendWhyAnswer();
                          }
                        }}
                        placeholder="输入本层 Why 的原因假设，例如：包装堆叠受压导致盖子边缘翘曲..."
                        className="min-w-0 flex-1 rounded-md border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                      />
                      <button
                        type="button"
                        onClick={handleSendWhyAnswer}
                        className="inline-flex items-center gap-2 rounded-md bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700"
                      >
                        <Send className="h-4 w-4" aria-hidden="true" />
                        发送
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </article>

            {(["D5", "D6", "D7", "D8"] as DisciplineId[]).map((id) => {
              const discipline = disciplines.find((item) => item.id === id);

              return (
                <article
                  key={id}
                  ref={setSectionRef(id)}
                  data-discipline={id}
                  className="scroll-mt-28 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <SectionHeader
                    icon={<ClipboardCheck className="h-5 w-5" aria-hidden="true" />}
                    id={id}
                    title={discipline?.title ?? id}
                    subtitle={discipline?.description ?? "后续报告模块占位。"}
                  />
                  <PlaceholderBand text={`${id} report workspace`} />
                </article>
              );
            })}

            <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <SectionHeader
                icon={<FileText className="h-5 w-5" aria-hidden="true" />}
                id="Preview"
                title="实时预览"
                subtitle="用于确认导出数据包前的关键字段完整性。"
              />

              <dl className="mt-6 divide-y divide-slate-200 overflow-hidden rounded-md border border-slate-200">
                <PreviewRow label="问题简述" value={report.problemSummary} />
                {fiveWTwoHFields.map((field) => (
                  <PreviewRow key={field.key} label={field.label} value={report.fiveWTwoH[field.key]} />
                ))}
              </dl>
            </article>
          </section>
        </div>
      </main>
    </>
  );
}

function SectionHeader({
  icon,
  id,
  title,
  subtitle,
}: {
  icon: ReactNode;
  id: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-700">
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">{id}</p>
        <h2 className="mt-1 text-xl font-semibold text-slate-700">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

function PlaceholderBand({ text }: { text: string }) {
  return (
    <div className="mt-6 rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
      {text}
    </div>
  );
}

function ChatBubble({ role, text }: { role: "assistant" | "user"; text: string }) {
  const isAssistant = role === "assistant";

  return (
    <div className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[86%] rounded-lg px-4 py-3 text-sm leading-6 ${
          isAssistant ? "bg-slate-800 text-slate-100" : "bg-teal-600 text-white"
        }`}
      >
        {text}
      </div>
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-2 bg-white px-4 py-3 sm:grid-cols-[160px_1fr]">
      <dt className="text-sm font-semibold text-slate-600">{label}</dt>
      <dd className="text-sm leading-6 text-slate-700">{value.trim() || "待填写"}</dd>
    </div>
  );
}
