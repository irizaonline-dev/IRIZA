const https = require('https');
const { URL } = require('url');
const crypto = require('crypto');

function apiRequest(path, method = 'GET', token, body) {
  const url = new URL(path);
  const opts = {
    hostname: url.hostname,
    path: url.pathname + url.search,
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
  return new Promise((resolve, reject) => {
    const req = https.request(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { const json = JSON.parse(data || '{}'); resolve({ status: res.statusCode, body: json }); }
        catch (e) { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  const [,, token, teamId, projectName, mongoUri, jwtArg] = process.argv;
  if (!token || !teamId || !projectName || !mongoUri) {
    console.error('Usage: node set_vercel_env.js <token> <teamId> <projectName> <MONGO_URI> [JWT_SECRET|generate]');
    process.exit(1);
  }
  let jwtSecret = jwtArg;
  if (!jwtSecret || jwtSecret === 'generate') {
    jwtSecret = crypto.randomBytes(48).toString('hex');
    console.log('Generated JWT_SECRET');
  }

  // Accept either a project name or a full project id (starts with 'prj_')
  let projectId = projectName;
  if (!projectId || !projectId.startsWith('prj_')) {
    console.log('Finding project by name', projectName);
    const listResp = await apiRequest(`https://api.vercel.com/v9/projects?teamId=${teamId}`, 'GET', token);
    if (listResp.status !== 200) { console.error('Failed to list projects', listResp); process.exit(2); }
    const proj = (listResp.body.projects || []).find(p => p.name === projectName);
    if (!proj) { console.error('Project not found in team'); process.exit(3); }
    projectId = proj.id;
    console.log('Project id:', projectId);
  } else {
    console.log('Using provided project id:', projectId);
  }

  const vars = [
    { key: 'MONGODB_URI', value: mongoUri, target: ['production'] },
    { key: 'MONGO_URI', value: mongoUri, target: ['production'] },
    { key: 'JWT_SECRET', value: jwtSecret, target: ['production'] }
  ];

  // Fetch existing env vars for the project so we can update if present
  const listResp = await apiRequest(`https://api.vercel.com/v9/projects/${projectId}/env`, 'GET', token);
  let existing = [];
  if (listResp.status === 200 && listResp.body) {
    if (Array.isArray(listResp.body)) existing = listResp.body;
    else if (Array.isArray(listResp.body.envs)) existing = listResp.body.envs;
    else if (Array.isArray(listResp.body.env)) existing = listResp.body.env;
  }

  for (const v of vars) {
    try {
      console.log('Setting', v.key);
      // Look for an existing env var with same key and overlapping target
      const found = existing.find(e => e.key === v.key && Array.isArray(e.target) && e.target.includes('production'));
      if (found && found.id) {
        // Update (PATCH) the existing env var
        const p = `https://api.vercel.com/v9/projects/${projectId}/env/${found.id}`;
        const resp = await apiRequest(p, 'PATCH', token, { value: v.value, target: v.target, type: 'encrypted' });
        if (resp.status >= 200 && resp.status < 300) console.log('Updated', v.key);
        else console.error('Failed to update', v.key, resp.status, resp.body);
      } else {
        // Create new env var
        const p = `https://api.vercel.com/v9/projects/${projectId}/env`;
        const resp = await apiRequest(p, 'POST', token, { key: v.key, value: v.value, target: v.target, type: 'encrypted' });
        if (resp.status >= 200 && resp.status < 300) console.log('Created', v.key);
        else console.error('Failed to create', v.key, resp.status, resp.body);
      }
    } catch (err) {
      console.error('Error setting', v.key, err);
    }
  }

  console.log('Done. JWT_SECRET value (hidden) saved to Vercel.');
  console.log('Note: trigger a redeploy or push to GitHub to apply env changes.');
  console.log('JWT_SECRET used:', jwtSecret.slice(0,8) + '...');
}

main().catch(err => { console.error(err); process.exit(99); });
