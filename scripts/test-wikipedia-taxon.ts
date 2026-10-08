import { verifyWikipediaTaxon, getWikipediaLeadSentences } from '../lib/wikipedia';

async function runTests() {
  console.log('Testing Wikipedia Taxon Verification Protocol...');

  // Test 1: Biological species (White Oak)
  console.log('\n--- 1. Testing Quercus alba (White Oak) ---');
  const oakResult = await verifyWikipediaTaxon('Quercus alba');
  console.log('Quercus alba:', oakResult);
  if (!oakResult.verified) {
    throw new Error('Expected Quercus alba to be verified as a biological taxon!');
  }
  console.log('✓ Quercus alba verified successfully.');

  // Test 2: Redirect biological species (American robin)
  console.log('\n--- 2. Testing American robin (Redirect) ---');
  const robinResult = await verifyWikipediaTaxon('American robin');
  console.log('American robin:', robinResult);
  if (!robinResult.verified) {
    throw new Error('Expected American robin to be verified as a biological taxon!');
  }
  console.log('✓ American robin redirect verified successfully.');

  // Test 3: Inanimate object (Bicycle)
  console.log('\n--- 3. Testing Bicycle (Inanimate object) ---');
  const bikeResult = await verifyWikipediaTaxon('Bicycle');
  console.log('Bicycle:', bikeResult);
  if (bikeResult.verified) {
    throw new Error('Expected Bicycle to NOT be verified as a biological taxon!');
  }
  console.log('✓ Bicycle correctly rejected from biological taxon list.');

  // Test 4: Inanimate object (Coffee cup)
  console.log('\n--- 4. Testing Coffee cup (Inanimate object) ---');
  const cupResult = await verifyWikipediaTaxon('Coffee cup');
  console.log('Coffee cup:', cupResult);
  if (cupResult.verified) {
    throw new Error('Expected Coffee cup to NOT be verified as a biological taxon!');
  }
  console.log('✓ Coffee cup correctly rejected.');

  // Test 5: Plain text lead sentences extraction
  console.log('\n--- 5. Testing Lead Sentences Extraction for Quercus alba ---');
  const extractResult = await getWikipediaLeadSentences('Quercus alba');
  console.log(`Extracted ${extractResult.sentences.length} sentences. Source URL: ${extractResult.sourceUrl}`);
  if (extractResult.sentences.length === 0) {
    throw new Error('Expected at least one sentence for Quercus alba!');
  }
  console.log('Sentence 1 preview:', extractResult.sentences[0].text);
  console.log('✓ Sentence tokenization verified successfully.');

  console.log('\n=============================================');
  console.log('✓ All Wikipedia Taxon tests passed successfully!');
  console.log('=============================================');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});

