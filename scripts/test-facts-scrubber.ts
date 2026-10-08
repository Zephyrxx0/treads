import {
  containsSafetyViolations,
  validateCitations,
  getFallbackFact,
  sanitizeFactText,
} from '../lib/facts-safety';

async function runTests() {
  console.log('Testing Edibility & Toxicity Safety Scrubber...');

  // Test 1: Positive detection of safety violations
  console.log('\n--- 1. Testing Forbidden Edibility & Toxicity Claims ---');
  const violations = [
    'The berries are edible when cooked into a jam.',
    'Leaves can be eaten raw in salads.',
    'Traditionally used as a medicinal remedy for fevers.',
    'Roots contain a toxic alkaloid that causes nausea.',
    'A tasty mushroom popular among foragers.',
    'Never boil or cook the seeds as they are poisonous.',
    'Foraging guide recommends picking young shoots.',
    'Safe for human consumption.',
  ];

  for (const text of violations) {
    const isViolating = containsSafetyViolations(text);
    console.log(`Checking: "${text}" -> Violated: ${isViolating}`);
    if (!isViolating) {
      throw new Error(`Failed to detect safety violation in: "${text}"`);
    }
  }
  console.log('✓ All 8 dangerous claims caught by regex scrubber.');

  // Test 2: Safe biological facts should NOT trigger violations
  console.log('\n--- 2. Testing Safe Biological Statements ---');
  const safeStatements = [
    'Quercus alba can live for over 450 years in North American temperate forests.',
    'Its bark is light ash-gray and features scaly, irregular plates.',
    'The leaves feature 7 to 9 rounded lobes with deep sinuses.',
    'Acorns mature in a single season and drop in early autumn.',
  ];

  for (const text of safeStatements) {
    const isViolating = containsSafetyViolations(text);
    console.log(`Checking: "${text}" -> Violated: ${isViolating}`);
    if (isViolating) {
      throw new Error(`Safe statement falsely flagged: "${text}"`);
    }
  }
  console.log('✓ All safe biological statements passed cleanly.');

  // Test 3: Citation validator filtering and bounds checking
  console.log('\n--- 3. Testing Citation Validation & Bounds Checking ---');
  const candidateFacts = [
    { sentenceNumber: 1, text: 'Quercus alba is a preeminent North American hardwood.' },
    { sentenceNumber: 2, text: 'The sweet acorns are edible when roasted in an oven.' }, // Edible -> MUST DISCARD
    { sentenceNumber: 4, text: 'It can grow up to 30 meters tall [4].' },
    { sentenceNumber: 99, text: 'Out of bounds citation number.' }, // Index 99 > max 10 -> MUST DISCARD
    { sentenceNumber: -1, text: 'Negative index citation.' }, // Invalid -> MUST DISCARD
    { sentenceNumber: 3, text: 'hi' }, // Too short -> MUST DISCARD
  ];

  const filtered = validateCitations(candidateFacts, 10);
  console.log('Filtered valid facts:', filtered);
  if (filtered.length !== 2) {
    throw new Error(`Expected exactly 2 valid facts, got ${filtered.length}`);
  }
  if (filtered[0].sentenceNumber !== 1 || filtered[1].sentenceNumber !== 4) {
    throw new Error('Unexpected sentence indices in filtered facts!');
  }
  if (filtered[1].text.includes('[4]')) {
    throw new Error('Embedded citation bracket [4] was not stripped from text!');
  }
  console.log('✓ Citation validator filtered invalid/toxic items and stripped brackets.');

  // Test 4: Deterministic Fallback on 0 facts
  console.log('\n--- 4. Testing Sentence #1 Fallback ---');
  const fallback = getFallbackFact([
    { index: 1, text: 'Quercus alba is a widespread oak species found throughout central forests.' },
    { index: 2, text: 'Bark is pale gray.' },
  ]);
  console.log('Fallback fact:', fallback);
  if (fallback.length !== 1 || fallback[0].sentenceNumber !== 1) {
    throw new Error('Fallback failed to return sentence #1!');
  }
  console.log('✓ Fallback to sentence #1 verified.');

  console.log('\n=============================================');
  console.log('✓ All Facts Safety Scrubber tests passed!');
  console.log('=============================================');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});

