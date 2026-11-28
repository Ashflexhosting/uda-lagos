<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Account AI explanations resolve membership from the authenticated user on every request and send only financial fields to AI Gateway; no client-selected member or account data is trusted, preventing cross-member disclosure even for admins.
- Memorial portrait captions use an explicit notice flag and require an event photo; this avoids funeral wording on ordinary events, news, or meetings.
- Association news/events use public published-only reads and admin-role write policies; public listing runs through a publishable server client so drafts never reach visitors.
- Public village meeting dates are calculated by the shared published updates reader using the recurring Lagos-date calendar; original notice dates and text remain unchanged in storage, while homepage and News & Events share the same upcoming dates, times and venues.
- News & Events opens a single-month village calendar on the current Lagos month with previous/next browsing; the shared date helper and published notices supply dates, logos, times and venues without duplicated static content.
- Balances are computed in the `member_balances` view (brought forward + dues + welfare + dev levy − sum of payments); never store a balance column, so payments stay the single source of truth.
- Members edit only contact fields via the `update_my_contact` RPC and admins approve proofs via `review_proof`; members have no direct UPDATE policy on `members`, so they can't change their own charges.
- Member-number logins are auth users with a synthetic email from `memberLoginEmail()` in src/lib/members.ts, created only by the admin server function `setMemberLogin`.
- Admin rights are never granted automatically on signup; an admin role row is added deliberately (by an existing admin or a one-off database change).
- Uploaded files live in private buckets (`photos`, `proofs`) under a `<member id>/` folder; storage policies key on that folder.
- Signup metadata queues private registration requests, never membership links; name suggestions are officer-only, and a role-checked atomic review RPC links confirmed accounts without replacing existing links. This prevents name-based account takeover and duplicate claims.
