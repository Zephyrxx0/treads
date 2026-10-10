/**
 * Test suite for Gemma enhancements:
 * 1. "Look Closely" sensory observation prompts in /api/facts
 * 2. "Naturalist Field Dispatch" in /api/walk/dispatch
 * 3. "Observed Ecological Web" in /api/walk/dispatch (including graceful empty handling)
 */

import { NextRequest } from 'next/server';
import { POST as factsHandler } from '../app/api/facts/route';
import { POST as dispatchHandler } from '../app/api/walk/dispatch/route';

async function runTests() {
  console.log('===============================================================');
  console.log('  TESTING GEMMA ENHANCEMENTS: LOOK CLOSELY & WALK DISPATCH');
  console.log('===============================================================\n');

  // Test 1: /api/facts with lookClosely
  console.log('--- 1. Testing /api/facts "Look Closely" sensory prompt ---');
  const factsReq = new NextRequest('http://localhost:3000/api/facts', {
    method: 'POST',
    body: JSON.stringify({
      wikipediaTitle: 'Quercus alba',
    }),
    headers: { 'Content-Type': 'application/json' },
  });

  const factsRes = await factsHandler(factsReq);
  const factsData = await factsRes.json();

  console.log(`Status: ${factsRes.status}`);
  console.log(`Summary: "${factsData.summary}"`);
  console.log(`Look Closely Prompt: "${factsData.lookClosely}"`);
  console.log(`Facts count: ${factsData.facts?.length}`);

  if (!factsData.lookClosely || typeof factsData.lookClosely !== 'string') {
    throw new Error('FAIL: lookClosely prompt is missing or not a string');
  }
  console.log('✓ "Look Closely" sensory prompt generated and verified.\n');

  // Test 2: /api/walk/dispatch with multiple species (Oak & Robin)
  console.log('--- 2. Testing /api/walk/dispatch with multiple connected species ---');
  const dispatchReq = new NextRequest('http://localhost:3000/api/walk/dispatch', {
    method: 'POST',
    body: JSON.stringify({
      species: ['White Oak', 'American Robin', 'Western Honey Bee', 'White Clover'],
      notes: ['Walked past the old meadow edge', 'Saw lots of bee activity near clover'],
      duration: 1800,
      distance: 2400,
    }),
    headers: { 'Content-Type': 'application/json' },
  });

  const dispatchRes = await dispatchHandler(dispatchReq);
  const dispatchData = await dispatchRes.json();

  console.log(`Status: ${dispatchRes.status}`);
  console.log(`Field Dispatch: "${dispatchData.dispatch}"`);
  console.log(`Ecological Connections:`, dispatchData.connections);

  if (!dispatchData.dispatch || typeof dispatchData.dispatch !== 'string') {
    throw new Error('FAIL: dispatch is missing or not a string');
  }
  if (!Array.isArray(dispatchData.connections)) {
    throw new Error('FAIL: connections is not an array');
  }
  console.log('✓ Dispatch & Connections verified successfully.\n');

  // Test 3: /api/walk/dispatch with no species (testing graceful empty array)
  console.log('--- 3. Testing /api/walk/dispatch with 0 species (handling empty connections) ---');
  const emptyReq = new NextRequest('http://localhost:3000/api/walk/dispatch', {
    method: 'POST',
    body: JSON.stringify({
      species: [],
      notes: [],
      duration: 600,
      distance: 800,
    }),
    headers: { 'Content-Type': 'application/json' },
  });

  const emptyRes = await dispatchHandler(emptyReq);
  const emptyData = await emptyRes.json();

  console.log(`Status: ${emptyRes.status}`);
  console.log(`Empty Walk Dispatch: "${emptyData.dispatch}"`);
  console.log(`Empty Connections count: ${emptyData.connections?.length}`);

  if (emptyData.connections.length !== 0) {
    throw new Error('FAIL: connections should be empty array when no species observed');
  }
  console.log('✓ Empty species walk gracefully returns empty connections array.\n');

  console.log('===============================================================');
  console.log('  ✓ ALL GEMMA ENHANCEMENT TESTS PASSED CLEANLY');
  console.log('===============================================================');
}

runTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
