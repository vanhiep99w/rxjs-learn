# RxJS marble diagrams in Fumadocs

## Contents

- Preflight
- Component API
- Notation and alignment
- Authoring workflow
- Worked example
- Quality checks

## Preflight

Use a marble diagram only for ReactiveX timing and lifecycle behavior. Use Mermaid for architecture or request flows, and use ASCII when the site has no marble renderer.

Before writing MDX:

1. Inspect `mdx-components.tsx` for a global `MarbleDiagram` registration.
2. Inspect the component's exported prop types instead of guessing its API.
3. In this project, use `components/marble-diagram.tsx` and `components/marble-diagram.module.css` as the canonical implementation.
4. If the component is absent and adding it is outside scope, emit a fenced `text` marble diagram and state that the visual renderer is unavailable.

When globally registered, use `<MarbleDiagram>` directly in MDX without a per-page import. Preserve the merge order below so page-level overrides still work:

```tsx
return {
  ...defaultMdxComponents,
  MarbleDiagram,
  ...components,
};
```

## Component API

Use this shape:

```mdx
<MarbleDiagram
  title="switchMap(project)"
  rows={[
    { label: 'outer', marble: '-a---b----|', kind: 'source' },
    { label: 'inner A', marble: '-^-x-!', kind: 'inner' },
    { label: 'inner B', marble: '-----^-x---y|', kind: 'inner' },
    { label: 'output', marble: '---x---x---y|', kind: 'output' },
  ]}
  values={{
    a: 'input A',
    b: 'input B mới hơn',
    x: 'emission đầu',
    y: 'emission tiếp theo',
  }}
  caption="B đến ở frame 5 nên inner A bị unsubscribe ngay."
/>
```

Use the props as follows:

| Prop | Requirement |
| --- | --- |
| `title` | Use the concise operator name or signature shown in the RxMarbles-style center band, such as `switchMap(project)`; put the conclusion in `caption`. |
| `rows` | Provide aligned absolute timelines. |
| `rows[].label` | Use short, unambiguous names such as `source`, `inner A`, and `output`. |
| `rows[].marble` | Encode one visual column per frame. |
| `rows[].kind` | Use `source`, `inner`, `output`, or `subscription`; always mark the final output as `output`. |
| `values` | Explain symbols whose meaning is not obvious. Keep one meaning per symbol across the whole diagram. |
| `caption` | Explain the decision demonstrated by the diagram. |
| `frameLabel` | Override only when a tick is not one virtual frame. |
| `showLegend` | Leave enabled for beginner-facing docs; disable only when nearby content already defines every symbol. |

## Notation and alignment

Use the renderer's tested notation:

| Symbol | Meaning |
| --- | --- |
| `-` | Advance one frame. |
| `a`, `b`, `x`, … | Emit a value. |
| `|` | Complete. |
| `#` | Error. |
| `^` | Subscribe. |
| `!` | Unsubscribe. |

Align every row to the diagram's **global frame axis**. Add leading `-` characters before an inner's `^`; do not paste a relative inner marble at frame 0 when subscription starts later.

Treat visual rows and `TestScheduler` strings as related but distinct artifacts. A visual inner row may combine subscription and notifications, for example `-^-x-!`. Do not pass that string to `cold()`; RxJS tests keep notification marbles and subscription marbles separate.

Do not use time-progression tokens such as `10ms` or grouped emissions such as `(ab)` unless the inspected component explicitly renders them correctly. Prefer a simpler aligned example over unsupported syntax.

## Authoring workflow

1. Derive operator behavior before drawing anything.
2. Write the outer/source row and assign global frame positions.
3. Place each accepted inner at its actual subscribe frame with `^`.
4. End each inner with `|`, `#`, or `!` according to the real lifecycle.
5. Derive the output from accepted emissions; never draw the desired output first and retrofit inner rows.
6. Add `values` and a caption that explain the operator's policy.
7. Follow the figure with prose walking through the decisive frames.
8. Run the site build and inspect desktop plus mobile horizontal scrolling.

For `concatMap`, show queued inners beginning only after the previous inner completes. For `switchMap`, end the replaced inner with `!`. For `exhaustMap`, omit inner rows for ignored triggers. For `mergeMap`, allow overlapping inner lifetimes and derive output by emission time.

## Worked example

Introduce the figure with a reading instruction:

> Đọc theo cột dọc để thấy input mới xuất hiện khi inner cũ vẫn đang hoạt động.

Then render the diagram, add a decision-focused caption, and explain concrete frames afterward:

> A bắt đầu ở frame 1 và phát `x` ở frame 3. Khi B đến ở frame 5, A bị unsubscribe nên emission tiếp theo của A không đi xuống output. B tiếp tục dù outer complete trước nó.

Do not insert a figure without this surrounding explanation. The diagram should reduce reasoning effort, not merely decorate the page.

## Quality checks

- Verify every frame number mentioned in prose against the strings.
- Verify output completion waits or stops according to the operator's actual contract.
- Verify cancellation uses `!`, producer error uses `#`, and normal completion uses `|`.
- Verify ignored `exhaustMap` inputs do not get invented inner rows.
- Verify queued `concatMap` inners do not overlap.
- Verify `switchMap` suppresses future emissions from the replaced inner without erasing values already emitted.
- Verify labels and `values` explain meaning without relying on color.
- Keep labels short enough for the fixed left column.
- Render on mobile and preserve the horizontal-scroll hint for timelines wider than the viewport.
- Keep executable `TestScheduler` examples as the source of truth when a visual diagram accompanies a test.
