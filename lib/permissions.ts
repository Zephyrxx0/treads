export interface PermissionResult {
  granted: boolean;
  message?: string;
}

export interface LocationPermissionResult extends PermissionResult {
  coords?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
}

/**
 * Checks existing permission state without triggering a prompt, if supported.
 */
export async function checkPermission(
  name: 'camera' | 'geolocation' | 'microphone'
): Promise<PermissionState | 'unsupported'> {
  if (typeof navigator === 'undefined' || !navigator.permissions?.query) {
    return 'unsupported';
  }

  try {
    const status = await navigator.permissions.query({
      name: name as PermissionName,
    });
    return status.state;
  } catch {
    return 'unsupported';
  }
}

/**
 * Requests camera permission just-in-time.
 * Non-blocking: returns error message rather than throwing.
 */
export async function requestCameraPermission(): Promise<PermissionResult> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return {
      granted: false,
      message: 'Camera API is not supported on this browser or connection.',
    };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    // Immediately stop tracks after verification to free hardware
    stream.getTracks().forEach((track) => track.stop());
    return { granted: true };
  } catch (err: unknown) {
    const error = err as Error;
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      return {
        granted: false,
        message: 'Camera access blocked. You can still upload images from your gallery or file picker.',
      };
    }
    return {
      granted: false,
      message: error.message || 'Unable to access camera device.',
    };
  }
}

/**
 * Requests location permission just-in-time and gets high-accuracy coordinates.
 * Non-blocking: returns coords if available, or descriptive fallback message.
 */
export async function requestLocationPermission(): Promise<LocationPermissionResult> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return {
      granted: false,
      message: 'Geolocation is not supported on this browser or device.',
    };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          granted: true,
          coords: {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          },
        });
      },
      (err) => {
        let msg = 'Unable to acquire location.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Location access denied. You can still record specimens and walk manually without live GPS tracking.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = 'Location position unavailable. Please check GPS settings.';
        } else if (err.code === err.TIMEOUT) {
          msg = 'Location request timed out. Please try again outdoors.';
        }
        resolve({
          granted: false,
          message: msg,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  });
}

/**
 * Requests microphone permission just-in-time for voice notes.
 * Non-blocking: returns error message rather than throwing.
 */
export async function requestMicrophonePermission(): Promise<PermissionResult> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return {
      granted: false,
      message: 'Audio input is not supported on this browser or connection.',
    };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Immediately stop tracks after verification
    stream.getTracks().forEach((track) => track.stop());
    return { granted: true };
  } catch (err: unknown) {
    const error = err as Error;
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      return {
        granted: false,
        message: 'Microphone access blocked. You can still compose text field notes manually.',
      };
    }
    return {
      granted: false,
      message: error.message || 'Unable to access microphone.',
    };
  }
}
