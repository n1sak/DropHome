import { ApiStore } from './api';
import { LocalStore } from './local';
import { MemoryStore } from './memory';
import type { Store } from './types';

declare const __ARTIFACT__: boolean;

export interface Backend {
  store: Store;
  /** The server can sort with Claude (it has an API key). */
  serverAi: boolean;
}

/** Server if it answers, otherwise this browser, otherwise memory. */
export async function connect(): Promise<Backend> {
  if (!__ARTIFACT__) {
    const health = await ApiStore.probe('');
    if (health) return { store: new ApiStore(''), serverAi: health.ai };
  }
  try {
    return { store: await LocalStore.create(), serverAi: false };
  } catch {
    return { store: new MemoryStore(), serverAi: false };
  }
}

export type { Store } from './types';
