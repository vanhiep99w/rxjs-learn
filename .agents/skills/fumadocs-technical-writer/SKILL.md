---
name: fumadocs-technical-writer
description: Write, draft, or restructure technical documentation for Fumadocs-based sites, including architecture docs, design docs, API docs, runbooks, guides, docs-folder READMEs, and other .mdx/.md technical pages. Use when the user mentions Fumadocs, tài liệu kỹ thuật, technical docs, design docs, kiến trúc hệ thống, API docs, runbooks, embedded Mermaid/ASCII diagrams, or RxJS marble/timeline diagrams; also use when editing existing MDX documentation. Do not use for generic blog posts, marketing copy, or Word/PDF/PPTX deliverables.
---

# Fumadocs Technical Writer

Write technical documentation as `.mdx`/`.md` files styled for [Fumadocs](https://www.fumadocs.dev/) — the React.js documentation framework. Fumadocs renders GitHub-Flavored Markdown plus MDX (JSX-in-Markdown) and ships a set of built-in components (Callout, Cards, Tabs, Steps, TypeTable, Files, Accordion, etc.) that make technical docs far more readable than plain prose.

This skill covers: **what to output, how to structure it, which Fumadocs component to reach for, and how to choose among RxJS marble diagrams, Mermaid, and ASCII.**

## Workflow

1. **Figure out the doc type.** Architecture/design doc, API reference, runbook/operations guide, getting-started guide, or a general explainer. The doc type drives structure (see `references/doc-structures.md` if you want fuller templates — but for most requests you can just use the patterns below directly).
2. **Figure out the diagram strategy** (see below) before writing — plan RxJS marble, Mermaid, or ASCII diagrams alongside the content, not as an afterthought bolted on at the end.
3. **Write the file** with correct Fumadocs frontmatter and componentized structure (see `references/fumadocs-components.md` for full syntax of every component), in the human voice described under "Voice" below.
4. **Save as `.mdx`** by default (safe superset — plain Markdown files still work fine as `.mdx`), unless the user's project clearly uses plain `.md` (e.g., they show you existing `.md` files in the repo — then match that).
5. Create the file with the `create_file`/file tools as normal (see file-creation guidance in the main instructions) — this produces a real file the user can drop into their `content/docs/` folder, not just a chat reply.

## Diagram strategy: Marble vs Mermaid vs ASCII

Don't default to one blindly — pick per-diagram based on this:

**Use `<MarbleDiagram>` when:**
- The subject is an RxJS or ReactiveX timeline: emissions, completion, error, subscription windows, cancellation, scheduler behavior, or flattening operators.
- Multiple streams must align on the same virtual-time axis so the reader can compare source, inner, subscription, and output rows.
- The project already registers a marble component in `mdx-components.tsx`, or the user asks you to add the renderer. Inspect the actual component and its prop types before writing MDX; never guess a custom API.
- Read `references/marble-diagrams.md` for the canonical API, notation, alignment rules, and verification checklist used by this project.

Do **not** use Mermaid for RxJS marble timelines. Mermaid can draw a generic sequence, but it does not preserve marble notation or frame alignment cleanly.

**Use Mermaid (` ```mermaid ` code block) when:**
- The diagram is non-trivial (more than ~5 nodes, has branching/decision logic, sequence/timing matters, or is a flowchart/sequence/state/ER/gantt diagram).
- The target renderer supports it. Plain Mermaid code blocks render natively on GitHub, GitLab, and many Markdown viewers. **Fumadocs itself does not render Mermaid out of the box** — it requires either the `remarkMdxMermaid` plugin + a custom `<Mermaid>` component, or the `fumadocs-mermaid` package. If you don't know whether the user's site has this configured, say so explicitly in your reply (one line) and still deliver the Mermaid block — it's the standard, most maintainable format and degrades gracefully to a visible code block if unconfigured.
- The user is likely to want to edit/regenerate the diagram later — Mermaid text is far easier to version-control and tweak than ASCII art.

**Use ASCII diagrams (inside a plain ` ``` ` or ` ```text ` code block) when:**
- The diagram is simple (a few boxes and arrows, a small directory/file tree, a simple before/after).
- It needs to render correctly with zero dependencies anywhere — terminal output, plain-text READMEs, code comments, or contexts where you're not sure Mermaid support exists at all.
- It's decorative/illustrative rather than precise (e.g., a rough mental model), where hand-drawn boxes read faster than a rendered graph.
- Directory/file trees — use Fumadocs' `<Files>` component instead if it's an actual file structure being documented (see reference doc), otherwise plain ASCII tree.

**Default when unsure:** use `<MarbleDiagram>` for RxJS timing/lifecycle behavior when the renderer exists, Mermaid for architecture/flow/sequence diagrams, and ASCII for small inline sketches, hand-drawn marble fallbacks, and file trees. If the renderer is absent and adding it is outside scope, use a `text` marble block and say that the visual component is unavailable. If ambiguity materially changes the deliverable, ask; otherwise pick and mention the choice briefly.

Never generate diagrams as external image files/PNGs for content that's naturally a diagram — keep the source as MDX props, Mermaid, or ASCII so it stays version-controllable. Only reach for an actual image file (`![alt](/path.png)`) for genuine screenshots, photos, or logos.

## Multi-part technical series

This skill is commonly used to generate one part/section at a time within a larger technical topic (e.g. a Redis series, a Java series, microservices, interview-question collections, Kafka, Kubernetes, etc.). Keep this in mind:

- Treat each generated doc as one page in a series, not a one-off. Write it so it stands alone (a reader landing directly on this page can still follow it), but keep tone/depth/heading style consistent with a typical multi-part technical series so parts feel like they belong together.
- If the user gives context about earlier/later parts (or you can see other files in the series), keep terminology, naming conventions, and depth consistent with them.
- End-of-doc `<Cards>` linking to sibling parts in the series is a good default when a series structure is evident (see Core structure pattern).

## Table of contents (mục lục) — required at the top of every doc

In addition to Fumadocs' auto-generated sidebar TOC, every doc this skill produces must include a **manual, hand-written table of contents right after the frontmatter/intro callout, before the first content section**. Use a heading + a bullet list of Markdown anchor links to each `##`/`###` section in the doc, e.g.:

```mdx
## Mục lục

- [Tổng quan](#tổng-quan)
- [Kiến trúc](#kiến-trúc)
  - [Thành phần chính](#thành-phần-chính)
- [Ví dụ](#ví-dụ)
- [Câu hỏi thường gặp](#câu-hỏi-thường-gặp)
```

Rules for building it correctly:
- Anchor slugs are the heading text lowercased, spaces replaced with `-`, punctuation stripped — Fumadocs auto-generates anchors this way, so the manual TOC must match exactly or the links break. Vietnamese diacritics are kept in the slug (Fumadocs sanitizes spaces/punctuation, not accented characters), e.g. `## Ví dụ` → `#ví-dụ`.
- Nest sub-bullets for `###` under their parent `##` entry, matching the doc's actual heading hierarchy.
- Build the TOC *after* you've written the doc's headings (or at least finalized them), so links don't drift out of sync — if you revise headings later, update the TOC to match.
- This manual TOC is written in whichever language the doc body is in (Vietnamese docs get a Vietnamese "Mục lục" heading, English docs get "Table of Contents").

## Frontmatter (always include)

Every Fumadocs page needs YAML frontmatter. `title` becomes the page's H1 — do not also add a `# Heading` at the top of the body.

```mdx
---
title: Short Page Title
description: One-sentence summary shown in search results and page headers.
---
```

## Core structure pattern

For most technical docs, follow this shape (adapt per doc type):

```mdx
---
title: <Title>
description: <One-line summary>
---

<Callout type="info">
  Optional: audience/prereqs/scope note.
</Callout>

## Mục lục
- [Overview](#overview)
- [Architecture / Flow](#architecture--flow)
- [Details](#details)
- [Next steps](#next-steps)

## Overview
Short paragraph — what this is and why it exists.

## Architecture / Flow
```mermaid
flowchart TD
  A[Client] --> B[API Gateway]
  B --> C[Service]
  C --> D[(Database)]
```

## Details
### Subsection
...

<Callout type="warn" title="Gotcha">
  Anything that could bite the reader.
</Callout>

## Next steps
<Cards>
  <Card title="Related doc" href="/docs/related" />
</Cards>
```

Reach for these components as the content calls for them (full syntax in the reference file):
- **`<Callout>`** — notes, warnings, errors, tips. Use liberally in place of "Note:" prose.
- **`<Steps>` / `<Step>`** — any sequential procedure (install → configure → deploy).
- **`<Tabs>`** — content that varies by variant (package manager, OS, language, environment).
- **`<TypeTable>`** — documenting props/parameters/config options with types.
- **`<Files>`** — showing a project/directory file tree.
- **`<Accordion>`** — optional/advanced detail that would clutter the main flow (FAQs, edge cases).
- **`<Cards>`** — linking out to related pages at the end of a doc.
- **`<MarbleDiagram>`** — project-specific visual timelines for RxJS emissions and lifecycle; inspect registration first and follow `references/marble-diagrams.md`.
- Tabbed code blocks (` ```npm ` style) — install commands across package managers.

Don't over-componentize a short doc — a two-paragraph doc doesn't need Steps/Tabs/Accordion just because they exist. Match component density to doc complexity.

## Voice: write like a colleague, not a manual

Accurate-but-flat docs get skimmed and dropped. Write the way a good senior engineer explains something to a teammate: same precision, human delivery. The full guide, with before/after examples, is in `references/writing-voice.md`. The core habits:

- **Open with the reader's problem or a question they already have**, then introduce the concept as the answer. Don't open with a dictionary definition.
- **Talk to one reader.** Default to *mình – bạn* in Vietnamese docs (match the user's existing docs if they use *chúng ta* / *tôi*), and keep the choice consistent across the doc and the series.
- **Explain reasoning in prose** ("vì… nên…", "trừ khi…"). Keep bullets and tables for things that are truly parallel.
- **Take a stance**: say which option you'd pick by default and when you wouldn't use the thing at all. Name the common misunderstanding or trap.
- **Prefer concrete over abstract**: a scenario, a command and its output, a worked example. Use one everyday analogy per hard concept, and say where it stops being true.
- **Keep English technical terms as English** (cache, thread, failover, consumer group), the way Vietnamese engineers actually say them.
- **Cut machine-sounding filler** ("Trong thế giới công nghệ ngày nay…", "đóng vai trò quan trọng", "Hãy cùng khám phá…", nominalised verbs like "thực hiện việc lưu trữ").

Two guardrails matter because the doc is published under the user's name: never invent personal anecdotes ("mình từng làm ở…") or unverifiable benchmarks and metrics. Frame stories as hypothetical ("Hình dung một đợt flash sale…") and label illustrative numbers as such. If the user shares real experience, weave it in.

Dial the voice to the doc type: fullest in explainers and design docs, lean in API reference tables (voice lives in the intro and gotcha callouts), and calm, short and joke-free in runbooks.

## Length: no cap, optimize for clarity and flow

There is no target length and no ceiling — never cut content, explanation, or examples short just to keep the doc "concise." The only thing that matters is that a reader can follow it easily:

- Explain *why*, not just *what*, wherever it helps understanding — don't compress reasoning into a single dense sentence if it needs two.
- Prefer more sections with clear headings over fewer sections crammed with unrelated content. Long is fine; confusing is not.
- Keep a logical, linear flow: overview before details, context before specifics, simple case before edge cases. Reorder content if the natural writing order isn't the natural reading order.
- Use transitions between sections so the doc reads as one connected explanation, not a bullet dump — but bullets/tables are still the right call for enumerable facts (params, steps, comparisons).
- It's fine (encouraged) to add extra examples, an extra diagram, or a worked walkthrough if it makes a concept click — don't hold back because it adds length.
- The only trims that are ever appropriate: removing genuinely redundant restatements, or removing content that's flat-out irrelevant to the doc's purpose. Never trim for length's own sake.

## Read before writing

Before producing the file:

- View `references/fumadocs-components.md` for exact import statements and JSX syntax for built-in components — get these right the first time rather than guessing at prop names.
- View `references/writing-voice.md` for the voice rules, the list of machine-sounding phrases to avoid, and the per-doc-type register. Run its short self-check before saving the file.
- When the page contains an RxJS marble/timeline, view `references/marble-diagrams.md`, then inspect the project's actual `MarbleDiagram` implementation and global MDX registration before authoring the rows.
