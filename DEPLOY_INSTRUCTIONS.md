## Deployment & Troubleshooting — IRIZA

Follow these steps to ensure the backend and auth work correctly in production (Vercel) and locally.

1) MongoDB Atlas — Create DB user & whitelist IPs
   - Open https://cloud.mongodb.com and go to your project `irizadb`.
   - Build a connection user: Database Access → Add New Database User. Create username (e.g. `Vercel-Admin-Irizadb`) and a strong password, grant `Read and write to any database` for testing or restrict to your DB.
   - Network Access → Add IP Address. For testing add `0.0.0.0/0` (not for long-term). For production add Vercel IP ranges or use VPC peering.
   - Connect → Choose "Connect your application" and copy the connection string. Replace `<username>` and `<password>` accordingly and include the DB name if desired: `mongodb+srv://<user>:<pass>@cluster0.mongodb.net/iriza?retryWrites=true&w=majority`.

2) Local `.env`
   - Create a `.env` in project root (already added). Ensure the `MONGODB_URI` is correct and that `JWT_SECRET` is set.
   - Optional envs:
     - `MONGODB_DB` or `MONGO_DB` — to force a database name appended to the URI if missing.
     - `JWT_EXPIRES` — access token expiry (default `1h`).
     - `REFRESH_EXPIRES` — refresh token expiry (default `7d`).

3) Vercel env vars (already applied)
   - The `tools/set_vercel_env.js` script was used to set `MONGODB_URI`, `MONGO_URI`, and `JWT_SECRET` for your Vercel project.
   - Trigger a redeploy in Vercel (or push to GitHub) so the new env vars take effect.

4) Common pitfalls
   - "bad auth" errors: verify username/password in the connection string and ensure the DB user exists with correct roles.
   - IP whitelist errors: Atlas blocks connections from unknown IPs; add either your machine IP or `0.0.0.0/0` for testing.
   - DNS/SRV resolution: If you see `getaddrinfo` errors, ensure your environment allows DNS lookups for the SRV records used by `mongodb+srv`.

5) Verify locally
   - Run DB debug helper:

```bash
node tools/db_debug.js
```

   - Start server locally:

```bash
npm install
npm run dev
# then open http://localhost:3000/api/health
```

6) After successful deploy
   - Test Register/Login via the frontend: `Register.html` performs auto-login and stores the JWT in `localStorage`.
   - On successful login the backend sets an `httpOnly` `refresh_token` cookie; in production this will be `secure` when `NODE_ENV=production`.

7) Next recommended work
   - Add CI that runs `npm test` on PRs. There are integration tests in `tests/` that use an in-memory Mongo instance.
   - Consider using Vercel Environment Aliases (Preview/Production) and restricting env variable targets appropriately.
