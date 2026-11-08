<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- TypeScript strictness: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature` and `noImplicitReturns` are off — keeps form/plan geometry code readable; `strict` stays on.
- Buildora domain logic (planner, cost, units) lives in `src/lib/buildora/` as plain TS with no React — UI only renders its output and it is unit-tested.
- Canonical geometry is stored in metres; feet/perches are display conversions only.
- Roles live in `user_roles` (customer/company/admin); signup trigger only ever assigns customer or company. Admins are granted manually in the database.
- Project data (land, requirements, plans, finishes, estimate) is JSONB on `projects`; quotations insert is gated by RLS to verified companies on published projects.
- House visualization geometry and storey changes live in `src/lib/buildora/viewer.ts`; scene rendering and finish controls remain separate so edited rooms and saved customer choices are preserved.
