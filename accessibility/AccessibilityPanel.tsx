"use client";

import { useEffect, useId, useRef, useState } from "react";
import { defaults, profiles, type Settings } from "./settings";
import { usePreferences } from "./usePreferences";
import { usePagePreferences } from "./usePagePreferences";
import "./accessibility-panel.css";

export type AccessibilityPanelProps = {
  storageKey?: string;
  /** Wrap the site in an element matching this selector; keep the panel outside it. */
  targetSelector?: string;
  statementUrl?: string;
  links?: { label: string; href: string }[];
  position?: "left" | "right";
};

function Icon({ kind = "person" }: { kind?: string }) {
  const paths: Record<string, string> = {
    person: "M12 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM4 9l8 2 8-2M12 11v5m0 0-4 5m4-5 4 5",
    text: "M5 5h14M12 5v14M8 19h8",
    color: "M12 3C9 8 5 11 5 15a7 7 0 0 0 14 0c0-4-4-7-7-12Z",
    focus: "M12 2v4m0 12v4M2 12h4m12 0h4M19 12a7 7 0 1 1-14 0 7 7 0 0 1 14 0ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
    motion: "m13 2-9 12h7l-1 8 10-13h-7l1-7Z",
    links: "m10 8 3-3a4 4 0 0 1 6 6l-3 3m-2 2-3 3a4 4 0 0 1-6-6l3-3m1 5 6-6",
    magnifier: "M16 10a6 6 0 1 1-12 0 6 6 0 0 1 12 0Zm-1 5 6 6M7 10h6m-3-3v6",
    align: "M4 5h16M4 10h10M4 15h16M4 20h10",
    image: "M3 4h18v16H3V4Zm0 12 6-6 5 5 3-3 4 4M16 8h1",
    mute: "M10 4 5 8H2v8h3l5 4V4Zm5 5 6 6m0-6-6 6",
    cursor: "m5 3 14 11-7 1-3 7-4-19Z",
    read: "M5 3h14v18H5V3Zm3 5h8m-8 4h8m-8 4h5",
    eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm13 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
    keyboard: "M2 5h20v14H2V5Zm4 4h1m3 0h1m3 0h1m3 0h1M6 13h1m3 0h1m3 0h1m3 0h1M8 16h8",
    glasses: "M10 15a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm12 0a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM10 15h4M2 15 5 5m17 10L19 5",
  };
  return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={paths[kind] || paths.focus} /></svg>;
}

const colors = [ ["Blue", "#3074b5"], ["Purple", "#765398"], ["Red", "#b84238"], ["Orange", "#bf7430"], ["Teal", "#48999d"], ["Green", "#577834"], ["White", "#ffffff"], ["Black", "#000000"] ];

export function AccessibilityPanel({ storageKey = "site-accessibility", targetSelector = "[data-accessibility-content]", statementUrl, links = [], position = "right" }: AccessibilityPanelProps) {
  const [settings, save] = usePreferences(storageKey);
  usePagePreferences(settings, targetSelector);
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const destination = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const [point, setPoint] = useState({ x: 24, y: 200, text: "" });
  const [magnified, setMagnified] = useState<{ x: number; y: number; text: string } | null>(null);
  const previousProfile = useRef(new Map<string, Partial<Settings>>());
  const update = (patch: Partial<Settings>) => save({ ...settings, ...patch });

  useEffect(() => {
    if (!settings.guide && !settings.mask && !settings.magnifier) return;
    let source: Element | null = null;
    let dismissed: Element | null = null;
    const follow = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element) || !target.closest(targetSelector)) return;
      const box = target.getBoundingClientRect();
      const mouse = event instanceof PointerEvent;
      const nextSource = target.closest("p,h1,h2,h3,h4,h5,h6,li,a,button,label,summary,blockquote,figcaption");
      const text = nextSource?.textContent?.trim().slice(0, 400) || "";
      const next = { x: mouse ? event.clientX : box.left, y: mouse ? event.clientY : box.top + box.height / 2, text };
      setPoint(next);
      // Keep the overlay stationary so the pointer can enter it. Dismissal lasts
      // until a different source is encountered, not merely another pointer move.
      if (nextSource !== source) {
        source = nextSource;
        if (source !== dismissed) { dismissed = null; setMagnified(text ? next : null); }
      }
    };
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !dialog.current?.open) { dismissed = source; setMagnified(null); }
    };
    document.addEventListener("pointermove", follow);
    document.addEventListener("focusin", follow);
    document.addEventListener("keydown", dismiss);
    return () => { document.removeEventListener("pointermove", follow); document.removeEventListener("focusin", follow); document.removeEventListener("keydown", dismiss); };
  }, [settings.guide, settings.mask, settings.magnifier, targetSelector]);

  function toggle(key: keyof Settings, label: string, icon: string, value: boolean | string = true) {
    const active = settings[key] === value;
    return <button type="button" className="ap-tile" aria-pressed={active} onClick={() => update({ [key]: active ? defaults[key] : value })}><Icon kind={icon} /><span>{label}</span></button>;
  }
  function stepper(key: "scale" | "fontSize" | "lineHeight" | "spacing", label: string, values: number[], suffix = "%") {
    const index = values.indexOf(settings[key]);
    return <div className="ap-stepper ap-wide"><span>{label}</span><div><button type="button" aria-label={`Decrease ${label.toLowerCase()}`} disabled={index === 0} onClick={() => update({ [key]: values[index - 1] })}>−</button><output aria-live="polite" aria-label={label}>{index === 0 ? "Default" : `${settings[key]}${suffix}`}</output><button type="button" aria-label={`Increase ${label.toLowerCase()}`} disabled={index === values.length - 1} onClick={() => update({ [key]: values[index + 1] })}>+</button></div></div>;
  }
  function palette(key: "textColor" | "titleColor" | "background", label: string) {
    return <fieldset className="ap-palette ap-wide"><legend>{label}</legend><div>{colors.map(([name, value]) => <button type="button" key={name} aria-label={`${label}: ${name}`} aria-pressed={settings[key] === value} style={{ backgroundColor: value }} onClick={() => update({ [key]: value })}><span className="ap-color-name">{name}</span>{settings[key] === value && <span aria-hidden="true" style={{ color: name === "White" ? "#000" : "#fff" }}>✓</span>}</button>)}</div><button type="button" className="ap-reset-color" onClick={() => update({ [key]: "" })}>Reset {label.toLowerCase()}</button></fieldset>;
  }
  const close = () => dialog.current?.close();
  return <>
    <button ref={trigger} type="button" className={`ap-launcher ap-${position}`} aria-label="Accessibility" aria-haspopup="dialog" aria-expanded={open} aria-controls={`${id}-dialog`} onClick={() => { dialog.current?.showModal(); setOpen(true); }}><Icon /><span>Accessibility</span></button>
    <dialog ref={dialog} id={`${id}-dialog`} className="ap-dialog" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} onClose={() => { setOpen(false); (destination.current || trigger.current)?.focus(); destination.current = null; }} onKeyDown={event => {
      if (event.key !== "Tab") return;
      const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("button:not(:disabled),input:not(:disabled),select,a[href]"));
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }}>
      <header className="ap-header"><div><span className="ap-eyebrow">MAKE YOURSELF COMFORTABLE</span><h2 id={`${id}-title`}>Accessibility preferences</h2></div><button type="button" aria-label="Close accessibility preferences" onClick={close}>Close <span aria-hidden="true">×</span></button></header>
      <div className="ap-body">
        <p id={`${id}-description`}>Customize your browsing experience. Settings are saved in this browser when storage is available.</p>
        <section aria-labelledby={`${id}-profiles`}><h3 id={`${id}-profiles`}>Browsing profiles</h3><p className="ap-note">Optional combinations of the controls below. You can fine-tune any setting.</p><div className="ap-profiles">{profiles.map(profile => {
          const active = Object.entries(profile.values).every(([key, value]) => settings[key as keyof Settings] === value);
          return <button type="button" className="ap-profile" key={profile.name} role="switch" aria-checked={active} aria-label={profile.name} aria-describedby={`${id}-${profiles.indexOf(profile)}`} onClick={() => {
            if (active) {
              const restored = previousProfile.current.get(profile.name) || Object.fromEntries(Object.keys(profile.values).map(key => [key, defaults[key as keyof Settings]]));
              update(restored);
            } else {
              previousProfile.current.set(profile.name, Object.fromEntries(Object.keys(profile.values).map(key => [key, settings[key as keyof Settings]])));
              update(profile.values);
            }
          }}><span className="ap-switch" aria-hidden="true"><span>OFF</span><span>ON</span></span><span><strong>{profile.name}</strong><small id={`${id}-${profiles.indexOf(profile)}`}>{profile.description}</small></span><Icon kind={["motion", "eye", "focus", "read", "keyboard", "mute", "glasses"][profiles.indexOf(profile)]} /></button>;
        })}</div></section>
        <section aria-labelledby={`${id}-content`}><h3 id={`${id}-content`}>Content adjustments</h3><div className="ap-grid">
          {stepper("scale", "Content scaling", [100, 110, 125, 150])}
          {toggle("readable", "Readable Font", "text")}
          {toggle("titles", "Highlight Titles", "text")}{toggle("links", "Highlight Links", "links")}{toggle("magnifier", "Text Magnifier", "magnifier")}
          {stepper("fontSize", "Font sizing", [100, 110, 125, 150])}{toggle("align", "Align Center", "align", "center")}
          {stepper("lineHeight", "Line height", [0, 1.5, 1.8, 2], "×")}{toggle("align", "Align Left", "align", "left")}
          {stepper("spacing", "Letter spacing", [0, 0.02, 0.04, 0.08], "em")}{toggle("align", "Align Right", "align", "right")}
        </div><p className="ap-note">The magnifier shows text under your pointer or keyboard focus. Press Escape to dismiss it until you move to different text. Browser zoom is also available.</p></section>
        <section aria-labelledby={`${id}-color`}><h3 id={`${id}-color`}>Color adjustments</h3><div className="ap-grid">
          {[ ["dark", "Dark Contrast"], ["light", "Light Contrast"], ["high", "High Contrast"] ].map(([value, label]) => <button key={value} type="button" className="ap-tile" aria-pressed={settings.theme === value} onClick={() => update({ theme: settings.theme === value ? "" : value, contrast: settings.theme !== value && value === "high" })}><Icon kind="color" />{label}</button>)}
          {toggle("saturation", "High Saturation", "color", "high")}{palette("textColor", "Text color")}
          {toggle("saturation", "Monochrome", "color", "mono")}{palette("titleColor", "Title color")}
          {toggle("saturation", "Low Saturation", "color", "low")}{palette("background", "Background color")}
        </div><p className="ap-note">Custom colors override contrast presets. Reset individual colors if text becomes difficult to see.</p></section>
        <section aria-labelledby={`${id}-orientation`}><h3 id={`${id}-orientation`}>Orientation adjustments</h3><div className="ap-grid">
          {toggle("mute", "Mute Sounds", "mute")}{toggle("images", "Hide Images", "image")}{toggle("read", "Read Mode", "read")}
          {toggle("guide", "Reading Guide", "align")}
          <label className="ap-useful ap-wide"><Icon kind="links" /><span>Useful Links</span><select aria-label="Useful Links" defaultValue="" onChange={event => { const href = event.target.value; event.target.value = ""; if (!href) return; if (href.startsWith("#")) { const el = document.getElementById(href.slice(1)) || document.querySelector("main"); if (el instanceof HTMLElement) { if (!el.hasAttribute("tabindex")) el.tabIndex = -1; destination.current = el; } close(); el?.scrollIntoView(); } else { close(); window.location.assign(href); } }}><option value="">Select an option</option>{links.map(link => <option key={link.href} value={link.href}>{link.label}</option>)}</select></label>
          {toggle("motion", "Stop Animations", "motion")}{toggle("mask", "Reading Mask", "read")}{toggle("hover", "Highlight Hover", "focus")}
          {toggle("focus", "Highlight Focus", "focus")}{toggle("cursor", "Big Black Cursor", "cursor", "black")}{toggle("cursor", "Big White Cursor", "cursor", "white")}
        </div><p className="ap-note">Read mode simplifies the main reading area. Hide Images hides visuals while preserving image descriptions for assistive technology. Sound controls apply to this page’s audio and video, not third-party embedded players.</p></section>
        <div className="ap-quick"><label><input type="checkbox" checked={settings.contrast} onChange={event => update({ contrast: event.target.checked, theme: event.target.checked ? "high" : "" })} />Higher contrast</label><label><input type="checkbox" checked={settings.motion} onChange={event => update({ motion: event.target.checked })} />Reduce motion</label></div>
        <p className="ap-note">Your device’s reduced-motion setting is always respected. These preferences supplement the site’s accessibility; they do not certify ADA compliance.</p>
      </div>
      <footer className="ap-footer"><button type="button" onClick={() => { previousProfile.current.clear(); save({ ...defaults }); }}>Reset preferences</button>{statementUrl && <a href={statementUrl} onClick={close}>Accessibility statement</a>}</footer>
    </dialog>
    {!open && settings.guide && <div className="ap-reading-guide" aria-hidden="true" style={{ top: point.y }} />}
    {!open && settings.mask && <div className="ap-reading-mask" aria-hidden="true" style={{ top: Math.max(0, point.y - 65) }} />}
    {!open && settings.magnifier && magnified && <div className="ap-magnifier" aria-hidden="true" style={{ left: Math.max(8, Math.min(magnified.x, typeof window === "undefined" ? 8 : window.innerWidth - 360)), top: Math.max(8, magnified.y > (typeof window === "undefined" ? 600 : window.innerHeight) - 240 ? magnified.y - 220 : magnified.y + 30) }}>{magnified.text}</div>}
  </>;
}
