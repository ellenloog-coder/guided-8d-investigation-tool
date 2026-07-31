# VDA 8D AI Rules Review

## Purpose

This review explains the boundary among VDA baseline requirements, VDA excellence criteria, VDA method guidance, product rules, and product engineering controls. The package is an accurate bilingual paraphrase of the user-supplied 2018 English manual; it is not a replacement for the manual, a certification scheme, or an automatic approval mechanism.

本文件说明VDA基础要求、VDA Excellence、VDA方法建议、产品规则和产品工程控制之间的边界。本规则包是对用户所提供2018英文手册的准确双语转述，不替代手册，不构成认证方案，也不构成自动批准机制。

The manual states that its German edition is the legally authoritative version. Any contractual, legal, customer-specific, or certification-sensitive interpretation requires a qualified human review against the applicable licensed source and agreement.

手册说明德文版为法律意义上的正式版本。涉及合同、法律、客户特殊要求或认证敏感内容时，需要合格人员对照适用的合法来源和协议进行人工复核。

## Source boundary

### `VDA_BASIC`

`VDA_BASIC` contains:

- the general basic assessment requirements in the manual;
- D1-D8 basic assessment criteria;
- explicit necessary process statements that directly support those criteria, such as the need to verify causes, validate implemented corrective actions, and keep containment until D6 effectiveness is confirmed.

These rules may contribute to a baseline completion gate. A baseline rule is satisfied only by information and evidence relevant to that rule. A method artifact or polished wording is not a substitute for the required result.

`VDA_BASIC`包括：

- 手册中的通用基础评估要求；
- D1-D8基础评估条件；
- 直接支撑这些条件的明确必要过程要求，例如验证原因、用实际结果验证已实施纠正措施，以及在D6有效性确认前保持围堵。

这些规则可以进入基础完成Gate。只有与具体规则相关的信息和证据才能满足该规则；方法表单或流畅叙述不能替代所需结果。

### `VDA_EXCELLENCE`

`VDA_EXCELLENCE` contains only criteria identified by the manual as being above the basic requirements. Examples include:

- a fresh-eyes reviewer in D1;
- additional media supporting D2;
- clean-point and more methodical residual-risk documentation in D3;
- third-party-comprehensible evidence and documentation in D4-D6;
- a named preventive-action supervisor and recipient applicability assessment in D7;
- documented self-assessment and, where possible, a broadly attended completion meeting in D8.

Excellence is always evaluated and reported separately. Failure to meet an excellence criterion must not:

- make a basic discipline incomplete;
- block D8 closure when all basic requirements and human approvals are satisfied;
- be silently converted into a customer or organization-specific mandatory requirement.

`VDA_EXCELLENCE`只包含手册明确列为高于基础要求的标准，例如：

- D1的Fresh-eyes Reviewer；
- D2的补充媒体；
- D3的Clean-point及更系统化的残余风险记录；
- D4-D6便于第三方理解的方法证据和记录；
- D7指定预防措施监督人和接收方适用性评估；
- D8的自评记录及在可能情况下广泛参与的完成会议。

Excellence必须始终单独评估和报告。不满足Excellence不得：

- 使基础Discipline变为未完成；
- 在全部基础要求和人工批准满足时阻塞D8关闭；
- 被静默转化为客户或组织的强制要求。

### `VDA_METHOD_GUIDANCE`

`VDA_METHOD_GUIDANCE` contains recommended tools, approaches, opportunities, and risks. Examples include IS/IS NOT, Ishikawa, FTA, 5 Why, decision matrices, DOE, Pareto analysis, capability analysis, Lessons Learned, and structured completion meetings.

The rule package checks whether the required result is present, not whether one particular named method was used. For example:

- D2 requires an understandable, fact-based problem description and IS/IS NOT; it does not require every optional chart.
- D4 requires systematic cause identification and verified root causes; a 5 Why or Ishikawa diagram alone is not proof.
- D5 requires traceable selection and pre-implementation verification; a decision matrix is an excellence-supporting method, not a universal baseline form.
- D6 requires actual post-implementation validation; a named KPI without actual results is not evidence.

An organization or customer may separately make a method mandatory. If so, that requirement must be added with its real source and must not be mislabeled as a VDA 2018 baseline requirement.

`VDA_METHOD_GUIDANCE`包括手册建议的工具、方法、机会和风险，例如IS/IS NOT、Ishikawa、FTA、5 Why、决策矩阵、DOE、Pareto、能力分析、Lessons Learned和结构化完成会议。

规则包检查的是所需结果，而不是是否使用了某个指定工具。例如：

- D2要求清楚、基于事实的问题描述和IS/IS NOT，但不要求所有可选图表。
- D4要求系统化原因识别和已验证根因；5 Why或Ishikawa图本身不是证明。
- D5要求可追溯的选择和实施前验证；决策矩阵是支持优秀实践的方法，不是所有案例的基础表单。
- D6要求实施后的实际验证；只有KPI名称而没有实际结果不构成证据。

组织或客户可另行规定某种方法为强制要求。此类要求必须记录真实来源，不能误标为VDA 2018基础要求。

### `PRODUCT_RULE`

`PRODUCT_RULE` contains decisions deliberately introduced for the AI product, including:

- D0 as an initiation and applicability step;
- explicit information-state labels;
- asking only 1-3 focused questions when information is insufficient;
- refusing fabrication;
- not auto-filling a complete D0-D8 from a vague description;
- not deciding root cause, effectiveness, containment removal, N/A, or D8 closure for the user;
- explicit D5/D6 state separation;
- an explicit dual D7 check for horizontal deployment and document updates;
- requiring human closure authority.

D0 is not a formal VDA 2018 discipline. The VDA manual defines eight disciplines from D1 through D8. Although some product rules are informed by VDA concepts, their source type remains `PRODUCT_RULE`.

`PRODUCT_RULE`包括为AI产品明确增加的决策，例如：

- 将D0定义为启动和适用性步骤；
- 明确信息状态标签；
- 信息不足时只提出1-3个聚焦问题；
- 拒绝虚构；
- 不根据模糊描述自动补齐完整D0-D8；
- 不替用户确认根因、有效性、围堵解除、N/A或D8关闭；
- 明确区分D5/D6状态；
- D7分别检查横向展开和文件更新；
- 保留人工关闭权限。

D0不是VDA 2018正式Discipline。VDA手册定义的八个Discipline为D1-D8。即使部分产品规则受到VDA概念启发，其来源类型仍保持 `PRODUCT_RULE`。

### `PRODUCT_ENGINEERING_CONTROL`

`PRODUCT_ENGINEERING_CONTROL` contains digital-integrity controls:

- `Revision`: identifies the data/report state on which a decision was made;
- `Fingerprint`: binds a gate decision to normalized inputs and evidence;
- `Stale`: invalidates or suspends a downstream assessment after relevant upstream change;
- `Gate`: summarizes encoded rule results and pending human decisions without replacing an approver.

These controls support traceability but are not presented as VDA requirements. VDA's general basic requirement for report version numbering is kept separately as `VDA-G-B02`; the product's technical Revision implementation is `PEC-G-REVISION`.

`PRODUCT_ENGINEERING_CONTROL`包括数字化完整性控制：

- `Revision`：标识作出判断时的数据/报告状态；
- `Fingerprint`：将Gate判断绑定到规范化输入和证据；
- `Stale`：相关上游变化后，使下游评估失效或暂停；
- `Gate`：汇总已编码规则结果和待人工决定，但不替代批准人。

这些控制用于可追溯性，但不得呈现为VDA要求。VDA通用基础要求中的报告版本编号保留为 `VDA-G-B02`；产品的技术Revision实现则为 `PEC-G-REVISION`。

## Critical interpretation decisions

### D4 four-cause model

The package explicitly separates:

1. `TECHNICAL_OCCURRENCE_CAUSE`: how the deviation arose in the product or process.
2. `SYSTEMIC_OCCURRENCE_CAUSE`: why the management system allowed or did not prevent that technical occurrence condition.
3. `TECHNICAL_NON_DETECTION_CAUSE`: why the existing detection/control mechanism did not identify the problem after it arose.
4. `SYSTEMIC_NON_DETECTION_CAUSE`: why the management system allowed or did not prevent that detection weakness.

Systemic analysis starts from the corresponding technical cause. The four fields are not interchangeable and must not be populated by repeating the same sentence.

规则包明确区分：

1. `TECHNICAL_OCCURRENCE_CAUSE`：偏差如何在产品或过程中发生。
2. `SYSTEMIC_OCCURRENCE_CAUSE`：管理体系为何允许或未预防该技术发生条件。
3. `TECHNICAL_NON_DETECTION_CAUSE`：问题发生后，现有探测/控制机制为何没有识别。
4. `SYSTEMIC_NON_DETECTION_CAUSE`：管理体系为何允许或未预防该探测弱点。

系统分析从相应技术原因出发。四个字段不可互换，也不能重复同一句话填充。

“Operator error,” “carelessness,” or “failure to follow instructions” remains a user statement or hypothesis until translated into verifiable conditions. Human behavior may be relevant evidence, but blame is not a substitute for technical and systemic root-cause analysis.

“Operator error”“粗心”或“未遵守作业指导书”在转化为可验证条件前，只能保留为用户陈述或假设。人员行为可能是相关证据，但责备不能替代技术和系统根因分析。

### D5 and D6

D5 and D6 use different evidence states:

| Discipline | Permitted action state | Core evidence |
|---|---|---|
| D5 | `PLANNED_ACTION` | root-cause linkage, candidate comparison, pre-implementation verification, side-effect analysis, approved implementation plan |
| D6 | `IMPLEMENTED_ACTION` then `VALIDATED_RESULT` | implementation record, actual post-implementation result, predefined criterion, adequate observation period/sample, side-effect check |

An action does not become implemented because its due date passed. An implemented action does not become validated because it was installed, photographed, trained, or signed off as complete.

D5和D6使用不同证据状态：

| Discipline | 允许的措施状态 | 核心证据 |
|---|---|---|
| D5 | `PLANNED_ACTION` | 根因关联、候选比较、实施前验证、副作用分析、获批实施计划 |
| D6 | 先`IMPLEMENTED_ACTION`，再`VALIDATED_RESULT` | 实施记录、实施后实际结果、预定义判据、充分观察期/样本、副作用检查 |

措施不会因为计划日期已过而自动变成已实施。已实施措施也不会因为已安装、拍照、培训或签字完成而自动变成已验证。

### D3 containment removal

The package enforces chronology:

```text
D5 planned action selected and verified
  -> D6 action implemented
  -> D6 actual effectiveness validated
  -> authorized human records containment-removal decision
```

No AI rule, gate, expected result, or implementation record can remove containment before D6 validation.

规则包强制以下时间顺序：

```text
D5选择并验证计划措施
  -> D6实施措施
  -> D6用实际结果验证有效性
  -> 授权人员记录围堵解除决定
```

任何AI规则、Gate、预计结果或实施记录都不能在D6验证前解除围堵。

### D7 and D8

D7 has two independent baseline checks:

1. applicability and horizontal deployment across similar products, processes, and locations;
2. review and revision of relevant documents within influence.

A Lessons Learned entry, email, or document update satisfies only the claim it actually evidences.

D7有两个相互独立的基础检查：

1. 对相似产品、过程和地点的适用性评估及横向展开；
2. 对可影响相关文件的复审和修订。

Lessons Learned条目、邮件或文件更新只能满足其实际证明的内容。

D8 remains blocked until D1-D7 and all problem-related actions are complete, the report is available, and both sponsor and team-leader approvals are recorded for the current report state. A system gate may show “eligible for closure” but cannot approve or close.

在D1-D7及所有问题相关措施完成、报告可用且Sponsor和Team Leader均对当前报告状态留下批准记录前，D8保持阻塞。系统Gate可以显示“具备关闭条件”，但不能批准或关闭。

## Human review required

The following content requires human confirmation before operational use:

1. **Source interpretation**
   - Confirm paraphrases against the licensed German authoritative edition where legal or contractual significance exists.
   - Confirm whether the supplied English edition's terminology matches the organization's controlled vocabulary.

2. **Organization and customer-specific requirements**
   - Reporting deadlines, escalation thresholds, mandatory forms, submission cadence, retention periods, and customer portals.
   - Customer-specific requirements, special-status rules, safety/regulatory escalation, and supplier-flow-down obligations.
   - Whether any method currently classified as guidance is mandatory in the organization.

3. **Engineering acceptance criteria**
   - D3 containment effectiveness thresholds.
   - D4 verification design and safety of active tests.
   - D5 action-selection criteria and acceptable residual risk.
   - D6 sample size, observation period, statistical method, acceptance limits, and side-effect criteria.
   - D7 definition of “similar” product/process/location and the authoritative document list.

4. **Authority and approval**
   - Named sponsor, team leader, technical owners, action approvers, document owners, and containment-release authority.
   - Conditions under which N/A may be accepted.
   - D8 approval identity, signature method, and revision binding.

5. **Product engineering**
   - Canonical Revision format, fingerprint algorithm and normalized fields.
   - Dependency graph used for Stale propagation.
   - Gate severity, override rules, audit log, access control, retention, and recovery.
   - Bilingual display behavior and organization-approved terminology.

以下内容在投入运行前需要人工确认：

1. **来源解释**
   - 涉及法律或合同时，对照合法获得的德文正式版确认转述。
   - 确认所提供英文版术语与组织受控术语一致。

2. **组织和客户特殊要求**
   - 报告时限、升级阈值、强制表单、提交节奏、保存期和客户门户。
   - 客户特殊要求、特殊状态规则、安全/法规升级和供应商传递要求。
   - 当前归类为方法建议的工具是否被组织强制要求。

3. **工程接受判据**
   - D3围堵有效性阈值。
   - D4验证设计和主动试验安全性。
   - D5措施选择判据和可接受残余风险。
   - D6样本量、观察期、统计方法、接受限和副作用判据。
   - D7“相似”产品/过程/地点的定义及权威文件清单。

4. **权限与批准**
   - Sponsor、Team Leader、技术负责人、措施批准人、文件Owner和围堵解除权限人。
   - 允许接受N/A的条件。
   - D8批准身份、签署方式及Revision绑定。

5. **产品工程**
   - Canonical Revision格式、Fingerprint算法和规范化字段。
   - Stale传播使用的依赖图。
   - Gate严重度、override规则、审计日志、访问控制、保存和恢复。
   - 双语显示行为及组织批准术语。

## Non-claims

Passing all encoded rules means only that the supplied record passed this package's configured checks at a particular revision and fingerprint. It does not establish:

- VDA certification;
- contractual acceptance by a customer;
- product safety or regulatory compliance;
- technical truth beyond the supplied evidence;
- permanent effectiveness without continued monitoring;
- authorization to release containment or close D8.

通过全部已编码规则，只表示所提供记录在特定Revision和Fingerprint下通过本规则包的配置检查。它不代表：

- 获得VDA认证；
- 获得客户合同验收；
- 产品安全或法规合规；
- 超出所提供证据的技术真实性；
- 在缺少持续监控时仍永久有效；
- 获得解除围堵或关闭D8的授权。
