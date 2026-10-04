function stamp(): string {
  return new Date().toISOString().slice(11, 19);
}

export function info(tag: string, message: string): void {
  console.log(`[${stamp()}] [${tag}] ${message}`);
}

export function warn(tag: string, message: string): void {
  console.warn(`[${stamp()}] [${tag}] WARN ${message}`);
}

export function fail(tag: string, message: string, error?: unknown): void {
  console.error(`[${stamp()}] [${tag}] ERROR ${message}`, error ?? "");
}
