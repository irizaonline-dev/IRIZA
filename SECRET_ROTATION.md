Rotate leaked Atlas credentials and set production environment variables

1) Rotate Atlas credentials
- Log in to MongoDB Atlas → Database Access → Create a new database user with a strong password.
- Test the new credentials locally by setting `MONGODB_URI` and starting the app.
- Remove the old/compromised user or revoke its password.

2) Prepare secure connection string
- Format: `mongodb+srv://<USER>:<PASSWORD>@<CLUSTER>/iriza?retryWrites=true&w=majority`
- Prefer storing the full URI in `MONGODB_URI`.

3) Set Vercel environment variables
- Project → Settings → Environment Variables → Add:
  - `MONGODB_URI` (value: Atlas URI) - Target: Production
  - `JWT_SECRET` (strong random value)
  - `WEBHOOK_DEFAULT_SECRET` (if used)
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (if email used)
- Or run the helper: `node tools/set_vercel_env.js <VERCEL_TOKEN> <TEAM_ID> <PROJECT_NAME> "<ATLAS_URI>"`
  - This script sets `MONGODB_URI`, `MONGO_URI`, and `JWT_SECRET` for production.

4) (Optional) Set GitHub Actions secrets
- Repo → Settings → Secrets → Actions: add `MONGODB_URI`, `JWT_SECRET` if CI/workflows need them.

5) Redeploy and verify
- Trigger a Vercel redeploy (push a commit or redeploy via dashboard).
- Check Vercel logs for `MongoDB connected` from `config/db.js`.
- Verify Atlas dashboard shows active connections and created collections (`users`, `orders`, etc.).

6) Remove secrets from git history (if committed)
- Use `git filter-repo` or `bfg` to scrub sensitive files/strings, then rotate credentials again.
- Example using `bfg`:
  ```bash
  bfg --delete-files tools/_tmp_set_vercel_env.ps1
  git reflog expire --expire=now --all && git gc --prune=now --aggressive
  ```

Security notes
- Never commit production secrets. Use Vercel/Render project env or GitHub Secrets.
- After rotating credentials, update any running deployments to use the new URI.

Quick local test commands
```bash
npm ci
export MONGODB_URI="<ATLAS_URI>"
npm start
# or run tests (uses in-memory DB):
npm test
```
