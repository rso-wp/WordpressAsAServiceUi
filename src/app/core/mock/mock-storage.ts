// Persists mock backend state in localStorage so the demo survives a reload. Storage can be
// unavailable (private mode, blocked site data), so every access falls back to the default.

export function readMock<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`mock.${key}`);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeMock(key: string, value: unknown): void {
  try {
    localStorage.setItem(`mock.${key}`, JSON.stringify(value));
  } catch {
    // ignore: the mock then only lives in memory
  }
}

export function removeMock(key: string): void {
  try {
    localStorage.removeItem(`mock.${key}`);
  } catch {
    // ignore
  }
}

/** Simulated network latency. */
export function latency(ms = 500): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
