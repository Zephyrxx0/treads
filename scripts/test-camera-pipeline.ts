import { calculateDimensions } from '../lib/camera';

function runTests() {
  console.log('Testing Camera Processing & Downscaling Dimensions...');

  // 1. Landscape high-res (e.g. mobile photo 4032x3024)
  const landscape = calculateDimensions(4032, 3024, 1024);
  console.log('Landscape (4032x3024 -> max 1024):', landscape);
  if (landscape.width !== 1024 || landscape.height !== 768) {
    throw new Error(`Expected 1024x768, got ${landscape.width}x${landscape.height}`);
  }

  // 2. Portrait high-res (e.g. mobile photo 3024x4032)
  const portrait = calculateDimensions(3024, 4032, 1024);
  console.log('Portrait (3024x4032 -> max 1024):', portrait);
  if (portrait.height !== 1024 || portrait.width !== 768) {
    throw new Error(`Expected 768x1024, got ${portrait.width}x${portrait.height}`);
  }

  // 3. Square (2000x2000)
  const square = calculateDimensions(2000, 2000, 1024);
  console.log('Square (2000x2000 -> max 1024):', square);
  if (square.width !== 1024 || square.height !== 1024) {
    throw new Error(`Expected 1024x1024, got ${square.width}x${square.height}`);
  }

  // 4. Smaller than max (600x400)
  const small = calculateDimensions(600, 400, 1024);
  console.log('Small (600x400 -> max 1024):', small);
  if (small.width !== 600 || small.height !== 400) {
    throw new Error(`Expected 600x400, got ${small.width}x${small.height}`);
  }

  // 5. Thumbnail downscale to 160px
  const thumbLandscape = calculateDimensions(4032, 3024, 160);
  console.log('Thumbnail Landscape (4032x3024 -> max 160):', thumbLandscape);
  if (thumbLandscape.width !== 160 || thumbLandscape.height !== 120) {
    throw new Error(`Expected 160x120, got ${thumbLandscape.width}x${thumbLandscape.height}`);
  }

  const thumbPortrait = calculateDimensions(3024, 4032, 160);
  console.log('Thumbnail Portrait (3024x4032 -> max 160):', thumbPortrait);
  if (thumbPortrait.height !== 160 || thumbPortrait.width !== 120) {
    throw new Error(`Expected 120x160, got ${thumbPortrait.width}x${thumbPortrait.height}`);
  }

  console.log('✓ All Camera Pipeline tests passed successfully!');
}

runTests();
