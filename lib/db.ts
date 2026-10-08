import Dexie, { type Table } from 'dexie';

export interface Walk {
  id: string; // crypto.randomUUID()
  startedAt: number;
  endedAt: number | null;
  mode: 'free' | 'loop';
  routeLine?: [number, number][] | null;
  trackPoints: Array<{
    lat: number;
    lng: number;
    accuracy: number;
    timestamp: number;
  }>;
  distance: number; // in meters
}

export interface Candidate {
  scientificName: string;
  commonName: string;
  kind: 'tree' | 'flower' | 'plant' | 'bird' | 'insect' | 'fungus' | 'other';
  confidence: 'Likely' | 'Possible' | 'Unsure';
  wikipediaTitle: string;
  verified?: boolean;
}

export interface Entry {
  id: string; // crypto.randomUUID()
  walkId: string;
  createdAt: number;
  timestamp: number;
  photo: Blob | string;
  thumbnail?: Blob | string;
  lat: number;
  lng: number;
  accuracy: number;
  status: 'saved' | 'identifying' | 'identified' | 'confirmed' | 'unidentified' | 'failed';
  candidates: Candidate[];
  confirmed?: Candidate | null;
  verified: boolean;
  facts?: {
    summary: string;
    facts: Array<{ sentenceNumber: number; text: string }>;
    sourceUrl: string;
  } | null;
}

export interface Note {
  id: string; // crypto.randomUUID()
  walkId?: string;
  entryId?: string;
  kind: 'voice' | 'text';
  audio?: Blob | null;
  duration?: number;
  transcript: string;
  language?: string;
  createdAt: number;
}

export interface UserSettings {
  key: string; // 'user_settings'
  consentVersion: string | null;
  consentTimestamp: number | null;
  storagePersisted: boolean;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  theme: 'light' | 'dark' | 'system';
}

export interface SpeechCache {
  id: string; // crypto.randomUUID()
  textHash: string;
  audio: Blob | string;
  createdAt: number;
}

export class TreadsDB extends Dexie {
  walks!: Table<Walk, string>;
  entries!: Table<Entry, string>;
  notes!: Table<Note, string>;
  settings!: Table<UserSettings, string>;
  speechCache!: Table<SpeechCache, string>;

  constructor() {
    super('treads_db');
    this.version(1).stores({
      walks: 'id, startedAt, endedAt',
      entries: 'id, walkId, createdAt, timestamp, status, verified',
      notes: 'id, walkId, entryId, createdAt',
      settings: 'key',
      speechCache: 'id, textHash, createdAt',
    });
  }
}

export const db = new TreadsDB();

export const DEFAULT_SETTINGS: UserSettings = {
  key: 'user_settings',
  consentVersion: null,
  consentTimestamp: null,
  storagePersisted: false,
  soundEnabled: false,
  hapticsEnabled: true,
  theme: 'system',
};

export async function getUserSettings(): Promise<UserSettings> {
  const settings = await db.settings.get('user_settings');
  return settings ?? DEFAULT_SETTINGS;
}
