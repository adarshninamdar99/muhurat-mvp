# Contributing

## Before you open a pull request

```bash
npm run check   # type-check + lint + tests
npm run build   # production build
```

All must pass. GitHub Actions runs the same checks on every push.

## Where code goes

| Kind of code | Folder |
| --- | --- |
| A page or API route | `src/app/` (routes stay thin: validate, call a service, return JSON) |
| Business rules | `src/server/services/` |
| Anything calling an AI model | `src/server/ai/providers/` |
| Slow work (AI calls) | a job handler in `src/server/jobs/handlers/`, queued with `enqueueJob` |
| Options couples choose from | `src/config/catalog.ts` |
| React components | `src/components/` (`ui/` for generic building blocks) |
| Types shared by server and browser | `src/lib/types.ts` |

Server files start with `import "server-only";`. Never import from `src/server` in a component marked `"use client"`.

## Conventions

- TypeScript strict mode; no `any` without a comment saying why.
- Validate all API input with `zod` in the route.
- Errors the user should see: throw `UserError("Plain sentence saying how to fix it.")`. Everything else is logged and shown as a generic message.
- Comments explain *why*, not *what*. Each file starts with a short comment saying what it is for.
- Screen text: short, plain sentences; buttons say what happens (“Draw the other 4”, not “Submit”).
- Database changes always come with a generated migration in `drizzle/`.
- Tests for new rules go in `tests/`. Tests use the demo AI provider and an in-memory database, so they never cost money.

## Branches and commits

- Branch from `main`: `feature/short-name` or `fix/short-name`.
- Commit messages: imperative and specific, e.g. `Add haldi shot template`.
- Never commit `.env.local`, keys or the `data/` folder.
