# CLAUDE.md – Coding & Onboarding Rules for **Siargao Rides**

> Claude Code reads this file at the start of every session. **Follow every rule unless the user explicitly overrides it.** These rules exist to keep the codebase clean, safe, and fast to iterate on.

---

## 1 · Quick Dev Commands

| Script                  | Purpose                                                           |
| ----------------------- | ----------------------------------------------------------------- |
| `npm run dev`           | Start dev server – [http://localhost:3000](http://localhost:3000) |
| `npm run build`         | Build for production                                              |
| `npm run start`         | Run built app                                                     |
| `npm run lint`          | ESLint + Type‑check                                               |
| `npm run test`          | Vitest unit tests (not yet implemented)                          |
| `npm run reset-db`      | Reset local DB via `scripts/reset-db.js`                          |
| `npm run setup-storage` | Create Supabase storage buckets                                   |

### Dev Command Tips
* Don't run or suggest running `npm run dev` as it is usually running.

---

[Rest of the file remains unchanged...]