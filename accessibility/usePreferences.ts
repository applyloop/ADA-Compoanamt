import { useMemo, useSyncExternalStore } from "react";
import { parseSettings, type Settings } from "./settings";

// A store per instance avoids hydration mismatches and supports blocked storage.
function createStore(key: string) {
    let cache: string | undefined;
    const eventName = `accessibility-preferences:${key}`;
    return {
      read: () => {
        if (cache === undefined) {
          try { cache = localStorage.getItem(key) || "{}"; } catch { cache = "{}"; }
        }
        return cache;
      },
      subscribe: (notify: () => void) => {
        const changed = () => { notify(); };
        const storage = (event: StorageEvent) => {
          if (event.key === key || event.key === null) { cache = event.newValue || "{}"; notify(); }
        };
        window.addEventListener(eventName, changed);
        window.addEventListener("storage", storage);
        return () => { window.removeEventListener(eventName, changed); window.removeEventListener("storage", storage); };
      },
      save: (settings: Settings) => {
        cache = JSON.stringify(settings);
        try { localStorage.setItem(key, cache); } catch { /* Still usable for this visit. */ }
        window.dispatchEvent(new Event(eventName));
      },
    };
}

export function usePreferences(key: string) {
  const store = useMemo(() => createStore(key), [key]);
  const raw = useSyncExternalStore(store.subscribe, store.read, () => "{}");
  const settings = useMemo(() => parseSettings(raw), [raw]);
  return [settings, store.save] as const;
}
