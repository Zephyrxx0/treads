import {
  checkPermission,
  requestCameraPermission,
  requestLocationPermission,
  requestMicrophonePermission,
} from '../lib/permissions';

async function main() {
  console.log('Testing permission handlers in non-browser/SSR environment...');

  const camCheck = await checkPermission('camera');
  console.log('checkPermission(camera):', camCheck);

  const camReq = await requestCameraPermission();
  console.log('requestCameraPermission():', camReq);
  if (camReq.granted !== false || !camReq.message) {
    throw new Error('Expected camera request to fail gracefully in Node');
  }

  const locReq = await requestLocationPermission();
  console.log('requestLocationPermission():', locReq);
  if (locReq.granted !== false || !locReq.message) {
    throw new Error('Expected location request to fail gracefully in Node');
  }

  const micReq = await requestMicrophonePermission();
  console.log('requestMicrophonePermission():', micReq);
  if (micReq.granted !== false || !micReq.message) {
    throw new Error('Expected microphone request to fail gracefully in Node');
  }

  console.log('✅ Permissions non-blocking fallback test passed successfully!');
}

main().catch(err => {
  console.error('❌ Permissions test failed:', err);
  process.exit(1);
});
