# Assistant colors and demo data

The `/ai-assist/` interface uses the requested warm palette. Color tokens live in
`styles.css`; all four original hex values are preserved.

## Palette

| Token | Color | Use |
| --- | --- | --- |
| `--terracotta` | `#E35336` | Decorative accent across the assistant card |
| `--cream` | `#F5F5DC` | Page background, input and result surfaces, button text |
| `--sand` | `#F4A460` | Hover surfaces, demo badge, illustrative map |
| `--sienna` | `#A0522D` | Primary button, headings, labels, map buildings |
| `--ink` | `#2B2118` | Main text and icons |
| `--muted` | `#665044` | Secondary text and input placeholders |
| `--paper` | `#FFFDF7` | Assistant card and suggestion backgrounds |
| `--rust` | `#8F321E` | Keyboard-focus outline and primary-button hover |
| `--border` | `#716052` | Input, card, and control borders |

## Contrast choices

Ratios below use the WCAG sRGB relative-luminance calculation, rounded to two
decimals. Normal text targets at least 4.5:1; meaningful control boundaries target
at least 3:1. See [W3C's contrast guidance](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
and [non-text contrast guidance](https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html).

| Foreground / background | Ratio | Usage |
| --- | --- | --- |
| Ink / cream | 14.23:1 | Body and result text |
| Muted / cream | 6.79:1 | Secondary text and placeholders |
| Sienna / cream | 5.07:1 | Labels; inverse pairing for button text |
| Ink / paper | 15.48:1 | Assistant answer |
| Muted / paper | 7.38:1 | Supporting text |
| Sienna / paper | 5.52:1 | Assistant labels |
| Ink / sand | 7.74:1 | Hovered suggestions, demo badge, map caption |
| Rust / cream | 7.18:1 | Focus outline |
| Rust / sand | 3.91:1 | Focus outline on hovered controls |
| Border / cream | 5.43:1 | Input and result boundaries |
| Border / paper | 5.90:1 | Suggestion and card boundaries |

Cream text on terracotta is only 3.42:1, so terracotta is decorative rather than a
small-text button background. Sienna on sand is only 2.76:1, so sand surfaces use
ink text. Avoid substituting these pairings without checking contrast.

Keyboard users get a 3px focus outline. Suggestion and submit buttons have a minimum
44px height. Links are underlined, demo data has a written label, and status/results
are communicated as text rather than color alone. Forced-colors mode uses system
focus colors. These checks cover palette choices, not a full accessibility audit;
visual browser and assistive-technology QA are still needed.

## Dummy data

`demo-data.mjs` exports 20 synthetic pins: four events, four bathrooms, four printers,
four study spaces, and four food stops. Fixtures span Hunt, Wean, Gates, Cohon,
Baker, and Tepper. Every pin has a unique `demo-` ID, a category, building, floor,
tags, description, and `dataStatus: 'synthetic'`. Study fixtures include a fictional
occupancy percentage. All event names and facility placements are sample content;
they do not establish real locations, schedules, hours, or accessibility.

Try “robotics events”, “bathroom near Gates floor 3”, “colour printer near Hunt”,
“food near Tepper”, and “a quiet place to study”.

The standalone assistant uses these fixtures by default. Pass `context.pins` to
`askAssistant` to replace them with the map owner's canonical dataset. See the
[integration README](./README.md) for the complete interface.
