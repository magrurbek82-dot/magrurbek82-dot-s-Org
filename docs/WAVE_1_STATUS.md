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
| CP-05 Quality baseline | IN PROGRESS | Typecheck/build scripts and GitHub Actions workflow added. Local dependency installation is blocked by this Windows Node TLS error: `UNABLE_TO_VERIFY_LEAF_SIGNATURE`; no local build result is claimed. Remote GitHub Actions and Vercel remain the safe verification paths. |

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

The local machine initially had no project dependencies installed. Node package download is currently blocked by `UNABLE_TO_VERIFY_LEAF_SIGNATURE`. Until `npm run typecheck` and `npm run build` complete, this checkpoint remains `IN PROGRESS`; it is not described as verified. TLS verification was not disabled to work around this issue.
