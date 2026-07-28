# Rich Notice Editor Design

## Goal

Replace the current long, generic notice-settings form with a focused publishing workspace for single-organization system announcements.

## Audience and Job

The audience is a system administrator. The page's job is to write, review, enable, and publish a single announcement with confidence.

## Layout and Visual Direction

The modal becomes an "announcement publishing workspace". The primary layout is a two-column desktop grid: the left column contains publishing state, notice level, subject, toolbar, and editor; the right column contains a live reader preview that mirrors the signed-in user's announcement modal. On narrow screens the preview moves below the editor.

The palette uses quiet neutrals: canvas `#F8FAFC`, ink `#0F172A`, muted text `#64748B`, and rule `#E2E8F0`. The signature element is the live reader preview, which opens the exact same compact dialog used by signed-in users rather than a simulated side panel.

Email and SMS fields move into a collapsed "channel configuration" area. They remain configuration-only because delivery is not implemented; they do not interrupt the publishing flow.

## Rich Text Model

Use TipTap with its Starter Kit and Link extension. The editor supports paragraphs, headings, bold, italic, strike-through, block quotes, ordered and unordered lists, links, and horizontal rules. Images, arbitrary HTML, embedded content, and custom styles are intentionally excluded.

The announcement subject remains a separate short text field. The body is stored as sanitized HTML. Before persisting, the frontend allows only the editor's supported tags and safe link protocols. Runtime display sanitizes with the same allow-list before rendering. The backend increases the content validation limit to accommodate markup while retaining a hard upper bound.

## Data Flow

`NoticeSettings.content` continues to be the persisted field, now containing sanitized HTML. `ActiveNoticeDTO.content` returns that HTML for authenticated users. The global notice component calculates dismissal fingerprints from the sanitized content and renders it with sanitized HTML; title keeps its existing behavior.

## Error Handling and Tests

The editor validates a non-empty textual body whenever publication is enabled. Invalid or empty markup does not replace the saved announcement. Unit tests cover content sanitization and active-notice filtering. Type-check, production build, and formatting checks verify the frontend integration.

## Non-goals

- Multiple scheduled, targeted, or historical announcements.
- Image/video uploads, arbitrary HTML, embeds, or custom CSS.
- Actual email or SMS delivery.
