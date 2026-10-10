import { blobToBase64 } from '@/lib/camera';
import type { Candidate } from '@/lib/db';

export type IdentifyResult =
  | { kind: 'candidates'; candidates: Candidate[]; warning: string | null }
  | { kind: 'refused'; reason: string };

/**
 * Sends a (already EXIF-stripped) photo to /api/identify and normalises the answer.
 * Rejects when the service itself fails; "not a living organism" is a normal `refused` result.
 */
export async function identifyPhoto(
  photo: Blob,
  where: { lat?: number; lng?: number },
  signal?: AbortSignal,
): Promise<IdentifyResult> {
  const image = await blobToBase64(photo);
  const res = await fetch('/api/identify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image,
      month: new Date().getMonth() + 1,
      lat: where.lat,
      lng: where.lng,
    }),
    signal,
  });
  if (!res.ok) throw new Error(`Identify API responded with HTTP ${res.status}`);

  const data = await res.json();
  const candidates: Candidate[] = (data.candidates || []).map((c: Candidate) => ({
    scientificName: c.scientificName,
    commonName: c.commonName,
    kind: c.kind,
    confidence: c.confidence,
    wikipediaTitle: c.wikipediaTitle,
    verified: Boolean(c.verified),
  }));

  if (!data.isLivingOrganism || candidates.length === 0) {
    return { kind: 'refused', reason: data.refusalReason || '' };
  }
  return { kind: 'candidates', candidates, warning: data.warning || null };
}
