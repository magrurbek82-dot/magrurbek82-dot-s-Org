# Wave 1 status - SmartWallet web foundation

Branch: `web/smartwallet-v1`  
Updated: 2026-08-11

## Current result

Wave 1 is in progress. This branch intentionally replaces the old AI Studio/Maga Flow interface with a fresh SmartWallet web foundation. The old source is preserved at `archive/maga-flow-before-smartwallet-2026-08-11`.

| Checkpoint | Status | Evidence |
|---|---|---|
| CP-01 Canonical scope freeze | IN PROGRESS | `PRODUCT_SPEC_V1.md` drafted; user review remains before it can be VERIFIED. |
| CP-02 Repository baseline | VERIFIED | GitHub remote, `main` baseline commit, archive branch and SmartWallet working branch recorded. |
| CP-03 Existing UI inventory | VERIFIED | Legacy Maga Flow UI was inventoried and replaced only on the new branch; archive retains the original state. |
| CP-04 Environment contract | IN PROGRESS | `.env.example` allows only browser-safe Supabase values. Preview/production variables still need Vercel setup. |
| CP-05 Quality baseline | VERIFIED | Typecheck/build scripts and GitHub Actions workflow added. Remote GitHub Actions run `31466432353` successfully installed dependencies, passed TypeScript and created a production build. Local Node TLS remains an environment-only issue. |

## Visible changes in this commit

- Brand renamed from Maga Flow to SmartWallet.
- Old fake login, phone-frame layout and AI Studio code removed from this branch.
- New responsive shell with mobile bottom navigation and desktop sidebar.
- Five destinations: Home, Maga AI, new transaction, Analytics and Menu.
- Profile remains reachable through the avatar and Menu.
- UZ/RU/EN selector and light/dark switch are available in the shell.
- Empty states are used instead of fake bank/card balances.
- V1 is explicitly bank-free, responsive web only and not a PWA/native app.

## Known gate

The local machine initially had no project dependencies installed. Node package download is currently blocked by `UNABLE_TO_VERIFY_LEAF_SIGNATURE`; TLS verification was not disabled to work around this issue. This does not block the project: remote GitHub Actions run `31466432353` installed dependencies, passed `npm run typecheck` and passed `npm run build` successfully on 2026-08-11.
