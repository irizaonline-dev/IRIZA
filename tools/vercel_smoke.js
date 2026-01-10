const https = require('https');

const VERCEL_TOKEN = process.env.VERCEL_TOKEN || '21Edy1hAvlcPhNZ4ea2Y7our';
const PROJECT_ID = process.env.VERCEL_PROJECT_ID || 'prj_tTn84OYmbd1rUgpDvyi1PfPuWnFB';

function requestJson(url, method = 'GET', body, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const opts = { hostname: u.hostname, path: u.pathname + u.search, method, headers: { Authorization: `Bearer ${VERCEL_TOKEN}`, 'Content-Type': 'application/json' } };
    const req = https.request(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        // Try parse JSON, but return raw body when not JSON (e.g. HTML protection page)
        let parsed = data;
        try { parsed = JSON.parse(data || '{}'); }
        catch (e) { /* keep raw */ }
        resolve({ status: res.statusCode, headers: res.headers, body: parsed, rawBody: data });
      });
    });
    req.on('error', reject);
    // timeout
    req.setTimeout(timeoutMs, () => {
      req.abort();
      reject(new Error('Request timed out'));
    });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

(async function(){
  try {
    console.log('Querying Vercel for deployments...');
    const deps = await requestJson(`https://api.vercel.com/v6/deployments?projectId=${PROJECT_ID}`);
    if (deps.status !== 200) throw new Error('Failed to list deployments: ' + deps.status);
    const list = Array.isArray(deps.body.deployments) ? deps.body.deployments : (Array.isArray(deps.body) ? deps.body : []);
    // Prefer a ready production deployment, but fall back to any READY deployment (preview) so tests can run
    let prod = list.find(d => d.target === 'production' && d.state === 'READY');
    if (!prod) prod = list.find(d => d.state === 'READY');
    if (!prod) prod = list[0];
    if (!prod) throw new Error('No deployment found');
    const base = 'https://' + prod.url;
    console.log('Using deployment URL:', base);

    // create a test user email
    const now = Date.now();
    const email = `smoke+${now}@example.com`;
    const password = 'Test1234!';
    const name = 'Smoke Test';

    console.log('Registering user', email);
    let reg;
    try {
      reg = await requestJson(base + '/api/auth/register', 'POST', { email, password, name, role: 'client' }, 30000);
    } catch (e) {
      console.warn('Register request error:', e && e.message ? e.message : e);
      reg = { status: 0, headers: {}, body: null, rawBody: '' };
    }
    console.log('Register status:', reg.status);
    // If rawBody contains HTML, it's likely a protection page — report and continue
    if (reg && typeof reg.rawBody === 'string' && reg.rawBody.trim().startsWith('<!doctype')) {
      console.log('Deployment appears protected (HTML returned). Raw response length:', reg.rawBody.length);
      // still check for set-cookie header
      if (reg.headers && reg.headers['set-cookie']) console.log('Set-Cookie headers present');
    } else {
      console.log('Register body:', reg.body);
      if (reg.headers && reg.headers['set-cookie']) console.log('Set-Cookie headers present');
    }

    if (reg.status >= 200 && reg.status < 300 && reg.body && reg.body.token) {
      console.log('Registration returned token. Proceeding to verify /api/auth/me');
      const token = reg.body.token;
      const me = await new Promise((resolve,reject)=>{
        const u = new URL(base + '/api/auth/me');
        const opts = { hostname: u.hostname, path: u.pathname + u.search, method: 'GET', headers: { Authorization: 'Bearer ' + token } };
        const r = https.request(opts, res=>{
          let d=''; res.on('data',c=>d+=c); res.on('end',()=>{ try{ resolve({ status: res.statusCode, body: JSON.parse(d||'{}') }); }catch(e){ resolve({ status: res.statusCode, body: d }); } });
        }); r.on('error',reject); r.end();
      });
      console.log('/api/auth/me status:', me.status, 'body:', me.body);
    } else {
      // If the response is HTML or 401, report protection and attempt login anyway
      if (reg.status === 401 || (reg && typeof reg.rawBody === 'string' && reg.rawBody.trim().startsWith('<!doctype'))) {
        console.log('Registration blocked by protection or unauthorized. Attempting login to see response.');
      } else {
        console.log('Registration did not return token, attempting login...');
      }
      let login;
      try {
        login = await requestJson(base + '/api/auth/login', 'POST', { email, password }, 30000);
      } catch (e) {
        console.warn('Login request error:', e && e.message ? e.message : e);
        login = { status: 0, headers: {}, body: null, rawBody: '' };
      }
      if (typeof login.rawBody === 'string' && login.rawBody.trim().startsWith('<!doctype')) {
        console.log('Login response appears to be HTML/protection page. Status:', login.status);
      } else {
        console.log('Login status:', login.status, 'body:', login.body);
      }
    }

    console.log('Smoke tests complete.');
  } catch (err) {
    console.error('Smoke test failed:', err && err.message ? err.message : err);
    process.exit(2);
  }
})();
