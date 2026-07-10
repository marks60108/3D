import type { ParamValues } from "../templates/types";

const STORAGE_KEY = "p2s-tool-presets-v1";

/** Presets are stored per template id: { [templateId]: { [name]: values } }. */
type PresetStore = Record<string, Record<string, ParamValues>>;

function readStore(): PresetStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? (parsed as PresetStore) : {};
  } catch {
    return {};
  }
}

function writeStore(store: PresetStore) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Storage full or unavailable — presets are a convenience, fail silently.
  }
}

export function listPresetNames(templateId: string): string[] {
  const store = readStore();
  return Object.keys(store[templateId] ?? {}).sort((a, b) => a.localeCompare(b));
}

export function savePreset(templateId: string, name: string, values: ParamValues) {
  const store = readStore();
  const forTemplate = { ...(store[templateId] ?? {}) };
  forTemplate[name] = values;
  store[templateId] = forTemplate;
  writeStore(store);
}

export function loadPreset(templateId: string, name: string): ParamValues | null {
  const store = readStore();
  return store[templateId]?.[name] ?? null;
}

export function deletePreset(templateId: string, name: string) {
  const store = readStore();
  if (!store[templateId]) return;
  const forTemplate = { ...store[templateId] };
  delete forTemplate[name];
  store[templateId] = forTemplate;
  writeStore(store);
}
