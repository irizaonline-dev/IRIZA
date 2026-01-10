# Deployment Guide

This repository contains a static frontend and a small Node/Express backend.

Vercel (static + serverless):
- Frontend: connect the project to Vercel and configure the `VERCEL` environment variables in the dashboard.
- Backend: recommend using a separate managed Node service (Render) because of persistent MongoDB connections. If you want to use Vercel serverless functions, refactor `server.js` into handlers under `api/` and use connection reuse for MongoDB.

Render (recommended for backend):
1. Create a new Web Service on Render.
2. Connect the GitHub repo and select the `main` branch.
3. Use the provided `render.yaml` or set `npm install` as build and `npm start` as the start command.
4. Set environment variables in Render: `MONGO_URI`, `JWT_SECRET`, `SMTP_*`.

Docker: build and run locally:
```
docker build -t iriza-backend .
docker run -p 3000:3000 --env-file .env iriza-backend
```

Vercel config: `vercel.json` is included but the Node API is simpler to host on Render/Heroku.
