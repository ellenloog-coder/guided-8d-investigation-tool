const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
function readJson(relPath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relPath), 'utf8'));
}

const rulesPackage = readJson('vda8d-ai-rules.json');
const testPackage = readJson('vda8d-ai-test-cases.json');
const rulesById = Object.fromEntries(rulesPackage.rules.map(rule => [rule.rule_id, rule]));

// Controlled vocabularies. The truth-state list comes from the bilingual system
// prompt (vda8d-ai-system-prompt.md, "Truth and state boundary"); STALE is an
// additional revision-staleness state used by the test suite.
const ALLOWED_SOURCE_TYPES = [
  'VDA_BASIC',
  'VDA_EXCELLENCE',
  'VDA_METHOD_GUIDANCE',
  'PRODUCT_RULE',
  'PRODUCT_ENGINEERING_CONTROL'
];
const ALLOWED_STEPS = ['GLOBAL', 'D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8'];
const ALLOWED_STATUSES = [
  'NOT_ASSESSED',
  'NOT_MET',
  'MET',
  'STALE',
  'PENDING_HUMAN_CONFIRMATION'
];
const PROMPT_TRUTH_STATES = [
  'FACT',
  'USER_STATEMENT',
  'HYPOTHESIS',
  'VERIFIED_ROOT_CAUSE',
  'MISSING_INFORMATION',
  'MISSING_EVIDENCE',
  'RECOMMENDATION',
  'PLANNED_ACTION',
  'IMPLEMENTED_ACTION',
  'VALIDATED_RESULT'
];
const ALLOWED_STATES = [...PROMPT_TRUTH_STATES, 'STALE'];

const REQUIRED_RULE_FIELDS = [
  'rule_id',
  'source_type',
  'chapter',
  'step',
  'requirement',
  'check_condition',
  'blocking_condition',
  'completion_condition',
  'ai_allowed',
  'ai_forbidden'
];
const RULE_BILINGUAL_FIELDS = [
  'requirement',
  'check_condition',
  'blocking_condition',
  'completion_condition',
  'ai_allowed',
  'ai_forbidden'
];
const DISCIPLINE_REQUIRED_FIELDS = [
  'title',
  'purpose',
  'necessary_inputs',
  'check_conditions',
  'completion_conditions',
  'common_gaps',
  'ai_can_do',
  'ai_must_not_do',
  'guide_questions',
  'rule_ids'
];

// Cross-discipline rule references are intentional boundary checks in the test
// suite (e.g. a D2 case flags a D4 rule the user has prematurely reached).
// Any change to this set must be reviewed deliberately.
const CROSS_STEP_ALLOWLIST = [
  'TC-D2-PREMATURE-CAUSE-002::VDA-D4-B01',
  'TC-D5-TRAINING-ONLY-008::PR-D4-001',
  'TC-D5-D6-CONFUSION-009::VDA-D6-B01',
  'TC-D5-D6-CONFUSION-009::VDA-D6-B02',
  'TC-D3-EARLY-RELEASE-011::PR-D3-001',
  'TC-AI-FABRICATE-015::VDA-D6-B02',
  'TC-BILINGUAL-CONSISTENCY-016::PR-D5-001'
];

let checks = 0;
const sections = [];

function check(condition, message) {
  checks += 1;
  assert.ok(condition, message);
}

function section(name, fn) {
  const before = checks;
  fn();
  sections.push(`${name}: ${checks - before} checks passed`);
}

function requireBilingual(obj, label) {
  check(obj && typeof obj === 'object', `${label} must be an object`);
  check(typeof obj.zh === 'string' && obj.zh.trim().length > 0, `${label}.zh must be non-empty`);
  check(typeof obj.en === 'string' && obj.en.trim().length > 0, `${label}.en must be non-empty`);
}

section('rules package schema', () => {
  const meta = rulesPackage.package || {};
  check(meta.package_id === 'vda8d-ai-rules', 'package_id must be vda8d-ai-rules');
  check(typeof meta.version === 'string' && meta.version.length > 0, 'package version must be non-empty');
  check(Array.isArray(meta.languages) && meta.languages.includes('zh-CN') && meta.languages.includes('en'),
    'package languages must include zh-CN and en');
  check(meta.source && typeof meta.source.title === 'string', 'package source title must be present');
  requireBilingual(meta.scope, 'package scope');

  check(Array.isArray(rulesPackage.rules) && rulesPackage.rules.length > 0, 'rules must be a non-empty array');
  const ids = new Set();
  for (const rule of rulesPackage.rules) {
    for (const field of REQUIRED_RULE_FIELDS) {
      check(rule[field] !== undefined && rule[field] !== null, `${rule.rule_id || 'rule'} missing field ${field}`);
    }
    check(!ids.has(rule.rule_id), `duplicate rule_id ${rule.rule_id}`);
    ids.add(rule.rule_id);
    check(ALLOWED_SOURCE_TYPES.includes(rule.source_type), `${rule.rule_id} invalid source_type ${rule.source_type}`);
    check(ALLOWED_STEPS.includes(rule.step), `${rule.rule_id} invalid step ${rule.step}`);
    check(typeof rule.chapter === 'string' && rule.chapter.trim().length > 0, `${rule.rule_id} chapter must be non-empty`);
    for (const field of RULE_BILINGUAL_FIELDS) {
      requireBilingual(rule[field], `${rule.rule_id}.${field}`);
    }
  }
});

section('discipline blocks', () => {
  for (const step of ALLOWED_STEPS.filter(s => s !== 'GLOBAL')) {
    const disc = rulesPackage.disciplines && rulesPackage.disciplines[step];
    check(!!disc, `disciplines.${step} must exist`);
    if (!disc) continue;
    for (const field of DISCIPLINE_REQUIRED_FIELDS) {
      check(disc[field] !== undefined && disc[field] !== null, `disciplines.${step} missing field ${field}`);
    }
    if (step === 'D0') {
      requireBilingual(disc.vda_status, 'D0 vda_status');
    }
    if (step === 'D4') {
      check(Array.isArray(disc.cause_model) && disc.cause_model.length > 0, 'D4 must declare a non-empty cause_model');
      for (const cause of disc.cause_model) {
        check(typeof cause.cause_type === 'string' && cause.cause_type.length > 0, 'D4 cause_model entry must have cause_type');
        requireBilingual(cause, 'D4 cause_model entry');
      }
    }
    check(Array.isArray(disc.rule_ids), `disciplines.${step}.rule_ids must be an array`);
    for (const id of disc.rule_ids) {
      const rule = rulesById[id];
      check(!!rule, `disciplines.${step} references unknown rule ${id}`);
      check(rule.step === step, `disciplines.${step} lists ${id} which belongs to ${rule.step}`);
    }
  }

  const listed = new Set(Object.values(rulesPackage.disciplines || {}).flatMap(d => d.rule_ids || []));
  for (const rule of rulesPackage.rules) {
    if (rule.step === 'GLOBAL') {
      check(!listed.has(rule.rule_id), `GLOBAL rule ${rule.rule_id} must not appear in a discipline rule_ids list`);
    } else {
      check(listed.has(rule.rule_id), `rule ${rule.rule_id} must be listed in disciplines.${rule.step}.rule_ids`);
    }
  }
});

section('test case schema', () => {
  const suite = testPackage.suite || {};
  check(suite.suite_id === 'vda8d-ai-rule-tests', 'suite_id must be vda8d-ai-rule-tests');
  check(typeof suite.version === 'string' && suite.version.length > 0, 'suite version must be non-empty');
  requireBilingual(suite.purpose, 'suite purpose');
  requireBilingual(suite.execution_note, 'suite execution_note');

  check(Array.isArray(testPackage.test_cases) && testPackage.test_cases.length >= 20,
    'test_cases must be a non-empty array with at least 20 cases');
  const ids = new Set();
  for (const tc of testPackage.test_cases) {
    check(typeof tc.test_id === 'string' && tc.test_id.length > 0, 'test case must have a test_id');
    check(!ids.has(tc.test_id), `duplicate test_id ${tc.test_id}`);
    ids.add(tc.test_id);
    requireBilingual(tc.title, `${tc.test_id}.title`);
    requireBilingual(tc.input, `${tc.test_id}.input`);
    check(ALLOWED_STEPS.includes(tc.step), `${tc.test_id} invalid step ${tc.step}`);
    check(ALLOWED_STATUSES.includes(tc.expected.status), `${tc.test_id} invalid status ${tc.expected.status}`);
    check(Array.isArray(tc.expected.states), `${tc.test_id}.expected.states must be an array`);
    for (const state of tc.expected.states) {
      check(ALLOWED_STATES.includes(state), `${tc.test_id} invalid state ${state}`);
    }
    check(Array.isArray(tc.expected.triggered_rule_ids) && tc.expected.triggered_rule_ids.length > 0,
      `${tc.test_id} must trigger at least one rule`);
    for (const id of tc.expected.triggered_rule_ids) {
      check(!!rulesById[id], `${tc.test_id} triggers unknown rule ${id}`);
    }
    requireBilingual(tc.expected.must_do, `${tc.test_id}.must_do`);
    requireBilingual(tc.expected.must_not_do, `${tc.test_id}.must_not_do`);
  }
});

section('semantic invariants', () => {
  const crossStepRefs = [];
  for (const tc of testPackage.test_cases) {
    const triggered = tc.expected.triggered_rule_ids;
    const triggeredRules = triggered.map(id => rulesById[id]);
    const blocking = tc.expected.status === 'NOT_MET' || tc.expected.status === 'NOT_ASSESSED';

    if (blocking) {
      check(triggeredRules.some(rule => rule.source_type === 'VDA_BASIC' || rule.source_type === 'PRODUCT_RULE'),
        `${tc.test_id} blocking status must trigger a VDA_BASIC or PRODUCT_RULE`);
      check(!triggeredRules.every(rule => rule.source_type === 'VDA_EXCELLENCE'),
        `${tc.test_id} must not block on VDA_EXCELLENCE rules alone`);
    }

    const sendable = triggered.filter(id => {
      const rule = rulesById[id];
      return rule.step === 'GLOBAL' || rule.step === tc.step;
    });
    check(sendable.length > 0,
      `${tc.test_id} must trigger at least one rule the assistant integration can send (GLOBAL or ${tc.step})`);

    for (const id of triggered) {
      const rule = rulesById[id];
      if (rule.step !== tc.step && rule.step !== 'GLOBAL') {
        crossStepRefs.push(`${tc.test_id}::${id}`);
      }
    }
  }

  assert.deepStrictEqual(
    [...crossStepRefs].sort(),
    [...CROSS_STEP_ALLOWLIST].sort(),
    'cross-discipline rule references must exactly match the documented allowlist'
  );
});

console.log(sections.join('\n'));
console.log(`vda8d AI rule tests passed (${checks} checks)`);
