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
- Balances are computed in the `member_balances` view (brought forward + dues + welfare + dev levy − sum of payments); never store a balance column, so payments stay the single source of truth.
- Members edit only contact fields via the `update_my_contact` RPC and admins approve proofs via `review_proof`; members have no direct UPDATE policy on `members`, so they can't change their own charges.
- Member-number logins are auth users with a synthetic email from `memberLoginEmail()` in src/lib/members.ts, created only by the admin server function `setMemberLogin`.
- Admin rights are never granted automatically on signup; an admin role row is added deliberately (by an existing admin or a one-off database change).
- Uploaded files live in private buckets (`photos`, `proofs`) under a `<member id>/` folder; storage policies key on that folder.
