# Runtime Announcement Design

## Goal

Make the existing single-organization notice settings effective for signed-in users without exposing notification-channel configuration.

## Scope

- Add `GET /api/system/config/notice` for authenticated users.
- Return `null` when the notice is disabled or has neither a title nor content.
- Return only `title` and `content` when active.
- Show the notice globally after entering the authenticated layout.
- Persist dismissal in browser `sessionStorage` using a fingerprint of the displayed notice. A changed notice is shown again.

## Non-goals

- Per-user, durable acknowledgement records.
- Email or SMS delivery.
- Multiple, scheduled, or targeted announcements.

## Error Handling and Security

The endpoint remains authenticated by the existing security default. It must not reuse the privileged notice-settings endpoint because that response includes mail and SMS configuration. Announcement content is rendered as text, not HTML.

## Verification

- Unit-test disabled and enabled notice selection in `SysConfigServiceImpl`.
- Run backend tests and frontend type/build validation.
