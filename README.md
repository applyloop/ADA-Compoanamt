# ADA Compoanamt

Created by **Vatsal Patel**.

Copy the accessibility/ folder into a React + TypeScript project. The component depends only on React and
standard browser APIs; it has no Next.js imports, paid SDK, analytics or network calls.
Its CSS is imported by `AccessibilityPanel.tsx`; your bundler must support CSS imports.

```tsx
import { AccessibilityPanel } from "./accessibility/AccessibilityPanel";

export function Site() {
  return <>
    <div data-accessibility-content>
      <header>{/* navigation */}</header>
      <main id="main-content" tabIndex={-1}>{/* page */}</main>
      <footer>{/* footer */}</footer>
    </div>
    <AccessibilityPanel
      storageKey="my-site-accessibility"
      statementUrl="/accessibility"
      position="right"
      links={[{ label: "Main content", href: "#main-content" }]}
    />
  </>;
}
```

Mount one panel outside the content wrapper. Use a stable wrapper across client
navigation. `targetSelector` may select another stable wrapper; the applied data
attributes scope the preference styles. Never target `body` or an ancestor of the
panel. Only use trusted site links. All props are optional; the default wrapper
selector is `[data-accessibility-content]` and storage key is `site-accessibility`.

Features: seven profile presets, content scaling, readable font, title/link
emphasis, text magnification, text sizing/spacing/alignment, three contrast modes,
saturation, custom colors, native media muting, image hiding, read mode, reading
guide/mask, useful links, animation stopping, enhanced hover/focus and large cursors.
The launcher uses a universal-access figure with a text label and an accessible
name. Dialog controls expose pressed/checked states, keyboard focus is contained,
Escape closes, and focus returns to the launcher. Settings persist locally and
synchronize through browser storage events. Blocked storage falls back to memory.

Profiles are combinations of preferences. A profile displays ON when its settings
match, including when another overlapping profile enabled them. Turning it off
restores values saved before activation during this visit, or defaults after reload.
Keyboard and screen-reader semantics must always be implemented in the host site.
The screen-reader profile only reduces motion and competing audio; it cannot repair
missing labels, alternative text or reading order. The seizure profile cannot
guarantee prevention of seizures. Do not market this component as ADA certification.

Image hiding preserves layout and accessible descriptions using opacity. Read
mode simplifies main content styling while keeping forms and navigation available;
it is not an extracted article. Magnified text is an aria-hidden visual duplicate.
The reading guide and mask do not capture pointer events and hide while the panel
is open. The magnifier stays stationary for each text source so it can be hovered;
Escape dismisses it until a different source is encountered, without changing the
saved preference. Color names become visible in forced-colors mode. At viewport
heights of 480 CSS pixels or less, the dialog header and footer scroll normally to
avoid obscuring keyboard focus.
Mute applies to native audio/video, including inserted media, not cross-origin
iframes or Web Audio. Stopped video is not automatically restarted on reset.
Custom colors can produce poor contrast; the panel is isolated and always has a
reset control. Saturation filters and scaling may affect fixed-position descendants;
test the host site's sticky navigation, dialogs, third-party embeds and breakpoints.

On reset/unmount, owned inline styles and media mute values are restored. The root
HTML attributes `data-a11y-motion` and `data-a11y-contrast` support host integration.
The component emits `accessibility:preferences-change` after applying settings so
host JavaScript animations can read the motion flag and stop their own loops.
OS reduced motion remains respected by CSS. Any host animation or embedded player
needs its own reduced-motion handling.

Verify each host site with keyboard, screen readers, browser zoom and automated
checks. Preferences supplement accessible markup, contrast and interaction design.

## Repository contents

The accessibility/ directory contains the reusable component, styles, settings, and hooks. This repository contains no Voicesis website pages, assets, credentials, or application history. It is a copy-in component, not a standalone website or published npm package. Use an existing React application with TypeScript and support for CSS imports; the component has been tested with React 19.
