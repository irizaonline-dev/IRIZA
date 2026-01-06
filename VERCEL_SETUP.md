Vercel setup & env helper

1. Connect your GitHub repo to Vercel (https://vercel.com).
2. In Vercel dashboard set environment variables: `MONGO_URI` and `JWT_SECRET` for the project.
3. To automate from CLI, use `tools/set_vercel_env.js` or the PowerShell script `tools/_tmp_set_vercel_env.ps1`.

Example (node helper):

```bash
node tools/set_vercel_env.js <VERCEL_TOKEN> <TEAM_ID> <PROJECT_NAME> <MONGO_URI> [JWT_SECRET|generate]
```

Notes:
- The helper calls Vercel API; provide a team id if your project is in a team. You must keep tokens private.
- After setting env vars trigger a redeploy (push to GitHub or redeploy from the Vercel dashboard).
