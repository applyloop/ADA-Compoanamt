import { useEffect } from "react";
import type { Settings } from "./settings";

// Own only the styles we change; restore each original inline value on reset/unmount.
export function usePagePreferences(settings: Settings, selector: string) {
  useEffect(() => {
    const roots = () => Array.from(document.querySelectorAll<HTMLElement>(selector));
    const saved = new Map<HTMLElement, Map<string, [string, string]>>();
    const media = new Map<HTMLMediaElement, { muted: boolean }>();
    const attributes = new Map<HTMLElement, Map<string, string | undefined>>();
    const animations = new Set<Animation>();
    const set = (el: HTMLElement, property: string, value: string) => {
      let previous = saved.get(el);
      if (!previous) { previous = new Map(); saved.set(el, previous); }
      if (!previous.has(property)) previous.set(property, [el.style.getPropertyValue(property), el.style.getPropertyPriority(property)]);
      el.style.setProperty(property, value, "important");
    };
    const data = (el: HTMLElement, key: string, value: string) => {
      let original = attributes.get(el);
      if (!original) { original = new Map(); attributes.set(el, original); }
      if (!original.has(key)) original.set(key, el.dataset[key]);
      el.dataset[key] = value;
    };
    const apply = () => {
      // Restore original sizes before measuring new or responsive content.
      for (const [el, styles] of saved) {
        const original = styles.get("font-size");
        if (original) {
          if (original[0]) el.style.setProperty("font-size", ...original); else el.style.removeProperty("font-size");
        }
      }
      for (const root of roots()) {
        data(root, "apTheme", settings.theme);
        data(root, "apReadable", String(settings.readable));
        data(root, "apTitles", String(settings.titles));
        data(root, "apLinks", String(settings.links));
        data(root, "apImages", String(settings.images));
        data(root, "apRead", String(settings.read));
        data(root, "apHover", String(settings.hover));
        data(root, "apFocus", String(settings.focus));
        data(root, "apMotion", String(settings.motion));
        data(root, "apCursor", settings.cursor);
        if (settings.scale !== 100) set(root, "zoom", String(settings.scale / 100));
        // Filter individual site sections so a fixed header keeps its viewport anchor.
        if (settings.saturation) for (const child of root.children) if (child instanceof HTMLElement) set(child, "filter", settings.saturation === "mono" ? "grayscale(1)" : `saturate(${settings.saturation === "high" ? 1.8 : 0.35})`);
        if (settings.textColor) set(root, "--ap-text", settings.textColor);
        if (settings.titleColor) set(root, "--ap-title", settings.titleColor);
        if (settings.background) set(root, "--ap-background", settings.background);
        data(root, "apText", String(Boolean(settings.textColor)));
        data(root, "apTitleColor", String(Boolean(settings.titleColor)));
        data(root, "apBackground", String(Boolean(settings.background)));
        const elements = Array.from(root.querySelectorAll<HTMLElement>("h1,h2,h3,h4,h5,h6,p,li,dt,dd,label,input,textarea,select,button,a,summary,blockquote,figcaption,span"));
        // Read all sizes before writing any; inherited sizes cannot compound.
        const sizes = settings.fontSize !== 100 ? elements.map(el => parseFloat(getComputedStyle(el).fontSize)) : [];
        for (const [index, el] of elements.entries()) {
          if (settings.fontSize !== 100) set(el, "font-size", `${sizes[index] * settings.fontSize / 100}px`);
          if (settings.lineHeight) set(el, "line-height", String(settings.lineHeight));
          if (settings.spacing) set(el, "letter-spacing", `${settings.spacing}em`);
          if (settings.align) set(el, "text-align", settings.align);
        }
        for (const el of root.querySelectorAll<HTMLMediaElement>("audio,video")) {
          if (!media.has(el)) media.set(el, { muted: el.muted });
          if (settings.mute) el.muted = true;
          if (settings.motion && el instanceof HTMLVideoElement) el.pause();
        }
        if (settings.motion) for (const animation of root.getAnimations({ subtree: true })) {
          if (animation.playState === "running") { animation.pause(); animations.add(animation); }
        }
      }
    };
    apply();
    const observer = new MutationObserver(apply);
    for (const root of roots()) observer.observe(root, { childList: true, subtree: true });
    let frame = 0;
    const resize = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(apply); };
    window.addEventListener("resize", resize);
    const enforceMedia = (event: Event) => {
      const el = event.target;
      if (!(el instanceof HTMLMediaElement) || !el.closest(selector)) return;
      if (settings.mute && !el.muted) el.muted = true;
      if (settings.motion && el instanceof HTMLVideoElement && !el.paused) el.pause();
    };
    document.addEventListener("volumechange", enforceMedia, true);
    document.addEventListener("play", enforceMedia, true);
    document.documentElement.dataset.a11yMotion = String(settings.motion);
    document.documentElement.dataset.a11yContrast = String(settings.contrast);
    window.dispatchEvent(new Event("accessibility:preferences-change"));
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      document.removeEventListener("volumechange", enforceMedia, true);
      document.removeEventListener("play", enforceMedia, true);
      for (const [el, styles] of saved) for (const [property, [value, priority]] of styles) {
        if (value) el.style.setProperty(property, value, priority); else el.style.removeProperty(property);
      }
      for (const [el, original] of media) if (settings.mute) el.muted = original.muted;
      // Never resume media automatically; visitors remain in control of playback.
      for (const animation of animations) if (animation.playState === "paused") animation.play();
      for (const [el, values] of attributes) for (const [key, value] of values) {
        if (value === undefined) delete el.dataset[key]; else el.dataset[key] = value;
      }
      delete document.documentElement.dataset.a11yMotion;
      delete document.documentElement.dataset.a11yContrast;
    };
  }, [settings, selector]);
}

